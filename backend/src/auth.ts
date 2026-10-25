import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "./config/env.js";
import { prisma } from "./db.js";
import { HttpError } from "./http.js";

export type AuthUser = { id: string; email: string; role: "USER" | "ADMIN" };
declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

const credentials = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(128)
});

function signToken(user: AuthUser) {
  return jwt.sign(user, env.jwtSecret!, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export async function register(req: Request, res: Response) {
  const input = credentials.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, "Email is already registered");
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash },
    select: { id: true, email: true, role: true }
  });
  const token = signToken(user);
  return res.status(201).json({ token, user });
}

export async function login(req: Request, res: Response) {
  const input = credentials.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const bcrypt = await import("bcryptjs");
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  const safeUser: AuthUser = { id: user.id, email: user.email, role: user.role };
  return res.json({ token: signToken(safeUser), user: safeUser });
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return next(new HttpError(401, "Authentication required"));
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret!) as AuthUser;
    if (!payload.id || !payload.email || !["USER", "ADMIN"].includes(payload.role)) {
      throw new Error("Invalid token payload");
    }
    req.user = payload;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") return next(new HttpError(403, "Admin access required"));
  next();
}
