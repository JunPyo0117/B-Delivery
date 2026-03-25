import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "OWNER" | "ADMIN";
      nickname: string;
      defaultAddress: string | null;
      latitude: number | null;
      longitude: number | null;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "OWNER" | "ADMIN";
    nickname: string;
    defaultAddress: string | null;
    latitude: number | null;
    longitude: number | null;
  }
}
