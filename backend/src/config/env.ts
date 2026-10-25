import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
};

if (!env.databaseUrl) throw new Error("DATABASE_URL must be set");
if (!env.jwtSecret || env.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set and contain at least 32 characters");
}
