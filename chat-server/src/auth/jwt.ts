import { jwtVerify } from "jose";
import { config } from "../config.js";

export interface TokenPayload {
  userId: string;
  role: string;
  nickname: string;
}

const secret = new TextEncoder().encode(config.jwtSecret);

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  return {
    userId: payload.sub!,
    role: payload.role as string,
    nickname: payload.nickname as string,
  };
}
