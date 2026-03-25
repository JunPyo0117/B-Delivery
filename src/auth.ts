import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
];

// E2E 테스트 환경에서만 Credentials provider 추가
if (process.env.E2E_TESTING === "true") {
  providers.push(
    Credentials({
      id: "test-credentials",
      name: "Test Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.image,
        };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ account, profile, credentials }) {
      // E2E 테스트용 Credentials provider 허용
      if (account?.provider === "test-credentials") return true;

      if (account?.provider !== "google" || !profile?.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        if (existingUser.status === "BANNED") return false;

        // 이미지 변경 시 업데이트
        if (existingUser.image !== (profile.picture ?? null)) {
          await prisma.user.update({
            where: { email: profile.email },
            data: { image: profile.picture ?? null },
          });
        }
      } else {
        // 신규 유저 생성
        await prisma.user.create({
          data: {
            email: profile.email,
            nickname: profile.name || profile.email.split("@")[0],
            image: profile.picture ?? null,
          },
        });
      }

      return true;
    },

    async jwt({ token, trigger, user, account }) {
      // 최초 로그인 또는 세션 갱신 시 DB에서 유저 정보 로드
      if (trigger === "signIn" || trigger === "update") {
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.nickname = dbUser.nickname;
            token.defaultAddress = dbUser.defaultAddress;
            token.latitude = dbUser.latitude;
            token.longitude = dbUser.longitude;
            token.picture = dbUser.image;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "OWNER" | "ADMIN";
        session.user.nickname = token.nickname as string;
        session.user.defaultAddress =
          (token.defaultAddress as string) ?? null;
        session.user.latitude = (token.latitude as number) ?? null;
        session.user.longitude = (token.longitude as number) ?? null;
      }
      return session;
    },
  },
});
