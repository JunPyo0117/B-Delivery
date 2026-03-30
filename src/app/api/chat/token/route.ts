import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { auth } from "@/auth";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 역할별 서버 사이드 채널 구독
  const channels: string[] = [`user#${session.user.id}`];
  const role = session.user.role;

  if (role === "USER") {
    channels.push(`order#${session.user.id}`);
  } else if (role === "OWNER") {
    channels.push(`owner_orders#${session.user.id}`);
  } else if (role === "RIDER") {
    channels.push(`delivery_requests#${session.user.id}`);
  }

  // Centrifugo 호환 JWT: info + channels 클레임 포함
  const token = await new SignJWT({
    info: {
      role,
      nickname: session.user.nickname,
    },
    channels,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.user.id)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return NextResponse.json({ token });
}
