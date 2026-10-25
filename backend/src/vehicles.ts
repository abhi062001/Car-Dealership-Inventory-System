import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./db.js";
import { HttpError } from "./http.js";
import { authenticate, requireAdmin } from "./auth.js";

const router = Router();
router.use(authenticate);

const vehicleInput = z.object({
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(50),
  price: z.coerce.number().finite().positive().max(9999999999),
  quantity: z.coerce.number().int().min(0).max(100000)
});
const updateInput = vehicleInput.partial().refine((v) => Object.keys(v).length > 0, {
  message: "At least one field is required"
});
const quantityInput = z.object({ quantity: z.coerce.number().int().positive().max(100000).default(1) });

function serialize<T extends { price: Prisma.Decimal }>(vehicle: T) {
  return { ...vehicle, price: Number(vehicle.price) };
}

router.get("/search", async (req, res) => {
  const minPrice = req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);
  const maxPrice = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);
  if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
    throw new HttpError(400, "Invalid price range");
  }
  const where: Prisma.VehicleWhereInput = {
    make: typeof req.query.make === "string" ? { contains: req.query.make, mode: "insensitive" } : undefined,
    model: typeof req.query.model === "string" ? { contains: req.query.model, mode: "insensitive" } : undefined,
    category: typeof req.query.category === "string" ? { contains: req.query.category, mode: "insensitive" } : undefined,
    price: minPrice !== undefined || maxPrice !== undefined
      ? { gte: minPrice, lte: maxPrice } : undefined
  };
  const vehicles = await prisma.vehicle.findMany({ where, orderBy: { createdAt: "desc" } });
  return res.json(vehicles.map(serialize));
});

router.get("/", async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(vehicles.map(serialize));
});

router.post("/", requireAdmin, async (req, res) => {
  const input = vehicleInput.parse(req.body);
  const vehicle = await prisma.vehicle.create({ data: input });
  return res.status(201).json(serialize(vehicle));
});

router.put("/:id", requireAdmin, async (req, res) => {
  const input = updateInput.parse(req.body);
  const exists = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new HttpError(404, "Vehicle not found");
  const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: input });
  return res.json(serialize(vehicle));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const exists = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new HttpError(404, "Vehicle not found");
  await prisma.vehicle.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

router.post("/:id/purchase", async (req, res) => {
  const { quantity } = quantityInput.parse(req.body ?? {});
  // A conditional atomic update prevents two simultaneous buyers overselling stock.
  const changed = await prisma.vehicle.updateMany({
    where: { id: req.params.id, quantity: { gte: quantity } },
    data: { quantity: { decrement: quantity } }
  });
  if (changed.count === 0) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) throw new HttpError(404, "Vehicle not found");
    throw new HttpError(409, "Insufficient stock");
  }
  const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id: req.params.id } });
  return res.json(serialize(vehicle));
});

router.post("/:id/restock", requireAdmin, async (req, res) => {
  const { quantity } = z.object({ quantity: z.coerce.number().int().positive().max(100000) }).parse(req.body);
  const exists = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new HttpError(404, "Vehicle not found");
  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { quantity: { increment: quantity } }
  });
  return res.json(serialize(vehicle));
});

export default router;
