CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Vehicle_make_model_idx" ON "Vehicle"("make", "model");
CREATE INDEX "Vehicle_category_idx" ON "Vehicle"("category");
CREATE INDEX "Vehicle_price_idx" ON "Vehicle"("price");
