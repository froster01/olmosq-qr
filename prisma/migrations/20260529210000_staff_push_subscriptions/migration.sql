CREATE TABLE "StaffPushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffPushSubscription_endpoint_key" ON "StaffPushSubscription"("endpoint");
CREATE INDEX "StaffPushSubscription_enabled_idx" ON "StaffPushSubscription"("enabled");
