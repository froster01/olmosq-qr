CREATE TYPE "CustomerPaymentMethod" AS ENUM ('COUNTER', 'QR');

ALTER TABLE "Order"
ADD COLUMN "customerPaymentMethod" "CustomerPaymentMethod" NOT NULL DEFAULT 'COUNTER';
