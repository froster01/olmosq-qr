-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "shiftNumber" INTEGER NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "nextOrderNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shiftId" TEXT;
ALTER TABLE "Order" ADD COLUMN "shiftOrderNumber" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Shift_shiftNumber_key" ON "Shift"("shiftNumber");
CREATE INDEX "Shift_status_idx" ON "Shift"("status");
CREATE INDEX "Shift_openedAt_idx" ON "Shift"("openedAt");
CREATE UNIQUE INDEX "Shift_one_open_idx" ON "Shift"("status") WHERE "status" = 'OPEN';
CREATE INDEX "Order_shiftId_idx" ON "Order"("shiftId");
CREATE UNIQUE INDEX "Order_shiftId_shiftOrderNumber_key" ON "Order"("shiftId", "shiftOrderNumber");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
