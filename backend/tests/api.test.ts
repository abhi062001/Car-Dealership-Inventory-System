import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/db.js";

async function register(email = "admin@example.com") {
  const result = await request(app).post("/api/auth/register")
    .send({ email, password: "correct-horse-123" });
  return result.body.token as string;
}
async function makeAdmin(token: string) {
  const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  await prisma.user.update({ where: { id: decoded.id }, data: { role: "ADMIN" } });
  // Existing JWT role is USER; log in again to obtain an admin token.
  const result = await request(app).post("/api/auth/login")
    .send({ email: decoded.email, password: "correct-horse-123" });
  return result.body.token as string;
}

describe("authentication and vehicle inventory API", () => {
  it("registers users with a token and never allows self-assigned admin", async () => {
    const response = await request(app).post("/api/auth/register")
      .send({ email: "person@example.com", password: "correct-horse-123", role: "ADMIN" });
    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.role).toBe("USER");
  });

  it("rejects duplicate emails and invalid login credentials", async () => {
    await register();
    expect((await request(app).post("/api/auth/register")
      .send({ email: "admin@example.com", password: "correct-horse-123" })).status).toBe(409);
    expect((await request(app).post("/api/auth/login")
      .send({ email: "admin@example.com", password: "wrong-password" })).status).toBe(401);
  });

  it("requires authentication for vehicle routes", async () => {
    expect((await request(app).get("/api/vehicles")).status).toBe(401);
  });

  it("creates, searches, updates and deletes vehicles with admin permissions", async () => {
    const token = await makeAdmin(await register());
    const headers = { Authorization: `Bearer ${token}` };
    const created = await request(app).post("/api/vehicles").set(headers).send({
      make: "Toyota", model: "Corolla", category: "Sedan", price: 22000, quantity: 3
    });
    expect(created.status).toBe(201);
    expect(created.body.id).toBeTruthy();

    const search = await request(app).get("/api/vehicles/search?make=toy&minPrice=20000&maxPrice=23000").set(headers);
    expect(search.status).toBe(200);
    expect(search.body).toHaveLength(1);

    const updated = await request(app).put(`/api/vehicles/${created.body.id}`).set(headers).send({ price: 21000 });
    expect(updated.body.price).toBe(21000);

    expect((await request(app).delete(`/api/vehicles/${created.body.id}`).set(headers)).status).toBe(204);
  });

  it("blocks regular users from admin actions", async () => {
    const token = await register("user@example.com");
    const response = await request(app).post("/api/vehicles").set({ Authorization: `Bearer ${token}` }).send({
      make: "Honda", model: "Civic", category: "Sedan", price: 20000, quantity: 2
    });
    expect(response.status).toBe(403);
  });

  it("purchases atomically and refuses to oversell stock", async () => {
    const token = await makeAdmin(await register());
    const headers = { Authorization: `Bearer ${token}` };
    const vehicle = await request(app).post("/api/vehicles").set(headers).send({
      make: "Mazda", model: "3", category: "Sedan", price: 24000, quantity: 1
    });
    const id = vehicle.body.id;
    expect((await request(app).post(`/api/vehicles/${id}/purchase`).set(headers).send({ quantity: 1 })).status).toBe(200);
    expect((await request(app).post(`/api/vehicles/${id}/purchase`).set(headers).send({ quantity: 1 })).status).toBe(409);
    expect((await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity).toBe(0);
  });

  it("allows only admins to restock and rejects invalid quantities", async () => {
    const adminToken = await makeAdmin(await register());
    const headers = { Authorization: `Bearer ${adminToken}` };
    const created = await request(app).post("/api/vehicles").set(headers).send({
      make: "Ford", model: "Focus", category: "Hatchback", price: 18000, quantity: 0
    });
    expect((await request(app).post(`/api/vehicles/${created.body.id}/restock`).set(headers).send({ quantity: 5 })).body.quantity).toBe(5);
    const userToken = await register("user2@example.com");
    expect((await request(app).post(`/api/vehicles/${created.body.id}/restock`)
      .set({ Authorization: `Bearer ${userToken}` }).send({ quantity: 2 })).status).toBe(403);
    expect((await request(app).post(`/api/vehicles/${created.body.id}/restock`).set(headers).send({ quantity: 0 })).status).toBe(400);
  });
});
