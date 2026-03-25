import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { auth } from "@/auth";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await new SignJWT({
    role: session.user.role,
    nickname: session.user.nickname,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.user.id)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return NextResponse.json({ token });
}
