-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "ReportPurchase" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "reportId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "customerEmail" TEXT,
    "amountTotal" INTEGER,
    "currency" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ReportPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportPurchase_stripeCheckoutSessionId_key" ON "ReportPurchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportPurchase_stripePaymentIntentId_key" ON "ReportPurchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "ReportPurchase_reportId_idx" ON "ReportPurchase"("reportId");

-- CreateIndex
CREATE INDEX "ReportPurchase_status_idx" ON "ReportPurchase"("status");

-- AddForeignKey
ALTER TABLE "ReportPurchase" ADD CONSTRAINT "ReportPurchase_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AuditReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
