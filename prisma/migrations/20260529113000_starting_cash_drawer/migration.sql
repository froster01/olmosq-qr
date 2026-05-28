-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('CASH_IN', 'CASH_OUT');

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN "startingCash" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Shift" ADD COLUMN "actualCash" DECIMAL(10,2);
ALTER TABLE "Shift" ADD COLUMN "cashVariance" DECIMAL(10,2);
ALTER TABLE "Shift" ADD COLUMN "closedNote" TEXT;

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashMovement_shiftId_idx" ON "CashMovement"("shiftId");
CREATE INDEX "CashMovement_createdAt_idx" ON "CashMovement"("createdAt");

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
