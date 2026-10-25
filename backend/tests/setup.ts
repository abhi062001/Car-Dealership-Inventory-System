import "dotenv/config";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/db.js";

beforeAll(async () => { await prisma.$connect(); });
beforeEach(async () => {
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
});
afterAll(async () => { await prisma.$disconnect(); });
