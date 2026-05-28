-- AlterTable
ALTER TABLE "PaymentType" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'OTHER';

-- Backfill the default Loyverse cash/card types from existing names until the next payment sync refreshes them.
UPDATE "PaymentType"
SET "type" = CASE
    WHEN lower("name") = 'cash' THEN 'CASH'
    WHEN lower("name") LIKE '%card%' THEN 'NONINTEGRATEDCARD'
    ELSE "type"
END;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cashReceived" DECIMAL(10,2);
ALTER TABLE "Order" ADD COLUMN "cashChange" DECIMAL(10,2);

-- Backfill already paid orders as paid at their latest update time.
UPDATE "Order"
SET "paidAt" = "updatedAt"
WHERE "paidAt" IS NULL
  AND "status" IN ('PAID_SYNCED_TO_LOYVERSE', 'PAID_SYNC_FAILED');

-- Backfill existing local cash orders conservatively as exact cash.
UPDATE "Order" AS o
SET "cashReceived" = o."total",
    "cashChange" = 0
FROM "PaymentType" AS pt
WHERE o."paymentTypeId" = pt."id"
  AND pt."type" = 'CASH'
  AND o."cashReceived" IS NULL
  AND o."status" IN ('PAID_SYNCED_TO_LOYVERSE', 'PAID_SYNC_FAILED');

-- CreateIndex
CREATE INDEX "Order_paidAt_idx" ON "Order"("paidAt");
