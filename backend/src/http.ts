import type { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (typeof error === "object" && error !== null && "issues" in error) {
    return res.status(400).json({ error: "Invalid request data" });
  }
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}
