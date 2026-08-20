-- AlterEnum
ALTER TYPE "SuppressionReason" ADD VALUE 'COMPLAINT';

-- CreateEnum
CREATE TYPE "OutreachDeliveryProvider" AS ENUM ('RESEND');

-- CreateEnum
CREATE TYPE "OutreachDeliveryEventType" AS ENUM ('SENT', 'DELIVERED', 'DELIVERY_DELAYED', 'FAILED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "ProviderDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'DELAYED', 'FAILED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED');

-- AlterTable
ALTER TABLE "OutreachMessage" ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "deliveryDelayedAt" TIMESTAMP(3),
ADD COLUMN "failedAt" TIMESTAMP(3),
ADD COLUMN "bouncedAt" TIMESTAMP(3),
ADD COLUMN "complainedAt" TIMESTAMP(3),
ADD COLUMN "providerSuppressedAt" TIMESTAMP(3),
ADD COLUMN "providerDeliveryStatus" "ProviderDeliveryStatus";

-- CreateTable
CREATE TABLE "OutreachDeliveryEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outreachMessageId" TEXT NOT NULL,
    "provider" "OutreachDeliveryProvider" NOT NULL DEFAULT 'RESEND',
    "providerEventId" TEXT,
    "providerMessageId" TEXT NOT NULL,
    "eventType" "OutreachDeliveryEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payloadFingerprint" TEXT NOT NULL,
    "safeMetadataJson" JSONB,

    CONSTRAINT "OutreachDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachDeliveryEvent_payloadFingerprint_key" ON "OutreachDeliveryEvent"("payloadFingerprint");

-- CreateIndex
CREATE INDEX "OutreachDeliveryEvent_outreachMessageId_idx" ON "OutreachDeliveryEvent"("outreachMessageId");

-- CreateIndex
CREATE INDEX "OutreachDeliveryEvent_providerMessageId_idx" ON "OutreachDeliveryEvent"("providerMessageId");

-- CreateIndex
CREATE INDEX "OutreachDeliveryEvent_eventType_idx" ON "OutreachDeliveryEvent"("eventType");

-- CreateIndex
CREATE INDEX "OutreachDeliveryEvent_occurredAt_idx" ON "OutreachDeliveryEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "OutreachMessage_providerMessageId_idx" ON "OutreachMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "OutreachMessage_providerDeliveryStatus_idx" ON "OutreachMessage"("providerDeliveryStatus");

-- AddForeignKey
ALTER TABLE "OutreachDeliveryEvent" ADD CONSTRAINT "OutreachDeliveryEvent_outreachMessageId_fkey" FOREIGN KEY ("outreachMessageId") REFERENCES "OutreachMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
