import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/owner/login", "/rider/login", "/admin/login", "/api/auth", "/api/centrifugo"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const session = await auth();
  const isLoggedIn = !!session;

  // 미인증 + 보호된 경로 → 역할별 로그인 리다이렉트
  if (!isLoggedIn && !isPublic) {
    if (pathname.startsWith("/owner")) return NextResponse.redirect(new URL("/owner/login", req.url));
    if (pathname.startsWith("/rider")) return NextResponse.redirect(new URL("/rider/login", req.url));
    if (pathname.startsWith("/admin")) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 역할 기반 접근 제어 (로그인 페이지는 항상 접근 가능)
  if (isLoggedIn && session.user) {
    const role = session.user.role;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      pathname.startsWith("/owner") &&
      role !== "OWNER" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/rider") && role !== "RIDER") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-next-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/upload).*)"],
};
