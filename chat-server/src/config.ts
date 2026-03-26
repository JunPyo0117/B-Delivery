export const config = {
  port: Number(process.env.PORT) || 8080,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  databaseUrl: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/bdelivery",
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is required");
    return secret;
  })(),
};
