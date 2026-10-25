import "express-async-errors";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { env } from "./config/env.js";
import { register, login } from "./auth.js";
import { errorHandler } from "./http.js";
import vehicles from "./vehicles.js";

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.post("/api/auth/register", (req, res, next) => {
  register(req, res).catch(next);
});
app.post("/api/auth/login", (req, res, next) => {
  login(req, res).catch(next);
});
app.use("/api/vehicles", (req, res, next) => {
  // Async route errors are forwarded to Express 4 error middleware.
  Promise.resolve(vehicles(req, res, next)).catch(next);
});
app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid request data", details: error.issues });
  next(error);
});
app.use(errorHandler);
export default app;
