-- Commercial Sprint 9 — Commercial Payment collection

CREATE TYPE "CommercialPaymentType" AS ENUM ('DEPOSIT', 'BALANCE', 'FULL');
CREATE TYPE "CommercialPaymentStatus" AS ENUM ('PENDING', 'CHECKOUT_CREATED', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED', 'CANCELED');

ALTER TYPE "OpportunityActivityType" ADD VALUE 'PAYMENT_REQUIREMENT_CREATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PAYMENT_CHECKOUT_CREATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PAYMENT_LINK_SENT';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PAYMENT_COMPLETED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PAYMENT_EXPIRED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'DEPOSIT_PAID';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'BALANCE_PAID';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PAYMENT_RECONCILIATION_FAILED';

CREATE TABLE "CommercialPayment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "type" "CommercialPaymentType" NOT NULL,
    "status" "CommercialPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amountDueCents" INTEGER NOT NULL,
    "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
    "paymentSequence" INTEGER NOT NULL,
    "paymentTermTypeSnapshot" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "checkoutUrl" TEXT,
    "checkoutCreatedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "reconciliationCode" TEXT,
    "reconciliationMessage" TEXT,
    "createdByEmail" TEXT,

    CONSTRAINT "CommercialPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialPayment_stripeCheckoutSessionId_key" ON "CommercialPayment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "CommercialPayment_stripePaymentIntentId_key" ON "CommercialPayment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "CommercialPayment_agreementId_type_paymentSequence_key" ON "CommercialPayment"("agreementId", "type", "paymentSequence");

-- At most one successful PAID row per agreement payment type (duplicate collection safety).
CREATE UNIQUE INDEX "CommercialPayment_agreementId_type_paid_key"
  ON "CommercialPayment"("agreementId", "type")
  WHERE "status" = 'PAID';

-- At most one active checkout attempt per agreement payment type.
CREATE UNIQUE INDEX "CommercialPayment_agreementId_type_active_key"
  ON "CommercialPayment"("agreementId", "type")
  WHERE "status" IN ('PENDING', 'CHECKOUT_CREATED');

CREATE INDEX "CommercialPayment_opportunityId_createdAt_idx" ON "CommercialPayment"("opportunityId", "createdAt");
CREATE INDEX "CommercialPayment_agreementId_status_idx" ON "CommercialPayment"("agreementId", "status");
CREATE INDEX "CommercialPayment_agreementId_type_status_idx" ON "CommercialPayment"("agreementId", "type", "status");
CREATE INDEX "CommercialPayment_status_createdAt_idx" ON "CommercialPayment"("status", "createdAt");

ALTER TABLE "CommercialPayment" ADD CONSTRAINT "CommercialPayment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialPayment" ADD CONSTRAINT "CommercialPayment_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "CommercialAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
