-- Commercial Sprint 8 — Agreement & Client Acceptance

CREATE TYPE "CommercialAgreementStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'ACCEPTED', 'SUPERSEDED', 'VOIDED');
CREATE TYPE "AgreementPaymentTermType" AS ENUM ('FULL_UPFRONT', 'DEPOSIT_AND_BALANCE', 'CUSTOM');
CREATE TYPE "AgreementDeliveryStatus" AS ENUM ('DRAFT', 'READY', 'SENDING', 'SENT', 'FAILED');

ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_CREATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_REVIEWED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_APPROVED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_REVISED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_SUPERSEDED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_DELIVERY_PREPARED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_SENT';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_SEND_FAILED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_LINK_VIEWED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_ACCESS_REVOKED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_ACCEPTED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'AGREEMENT_VOIDED';

CREATE TABLE "CommercialAgreement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "commercialScopeId" TEXT NOT NULL,
    "commercialPricingId" TEXT NOT NULL,
    "status" "CommercialAgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "agreementVersion" INTEGER NOT NULL,
    "agreementPresentationVersion" INTEGER NOT NULL,
    "termsVersion" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sourceFingerprint" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "engagementOverview" TEXT NOT NULL,
    "clientResponsibilitiesJson" JSONB NOT NULL,
    "jsResponsibilitiesJson" JSONB NOT NULL,
    "timelineTerms" TEXT NOT NULL,
    "changeRequestTerms" TEXT NOT NULL,
    "thirdPartyCostTerms" TEXT NOT NULL,
    "resultsDisclaimer" TEXT NOT NULL,
    "acceptanceLanguage" TEXT NOT NULL,
    "paymentTermType" "AgreementPaymentTermType" NOT NULL DEFAULT 'DEPOSIT_AND_BALANCE',
    "paymentCustomText" TEXT,
    "depositPercent" INTEGER NOT NULL DEFAULT 50,
    "currency" TEXT NOT NULL,
    "includedInvestmentCents" INTEGER NOT NULL,
    "optionalInvestmentCents" INTEGER NOT NULL,
    "totalInvestmentCents" INTEGER NOT NULL,
    "depositCents" INTEGER,
    "balanceCents" INTEGER,
    "proposalReference" TEXT NOT NULL,
    "createOverrideReason" TEXT,
    "createdByEmail" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByEmail" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByEmail" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "supersededByAgreementId" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedByEmail" TEXT,

    CONSTRAINT "CommercialAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgreementAcceptance" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agreementId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signerTitle" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL,
    "agreementVersion" INTEGER NOT NULL,
    "agreementPresentationVersion" INTEGER NOT NULL,
    "termsVersion" INTEGER NOT NULL,
    "agreementSnapshotHash" TEXT NOT NULL,
    "acceptanceTextSnapshot" TEXT NOT NULL,

    CONSTRAINT "AgreementAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgreementDelivery" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" "AgreementDeliveryStatus" NOT NULL DEFAULT 'DRAFT',
    "subjectSnapshot" TEXT NOT NULL,
    "messageSnapshot" TEXT NOT NULL,
    "agreementVersion" INTEGER NOT NULL,
    "agreementPresentationVersion" INTEGER NOT NULL,
    "termsVersion" INTEGER NOT NULL,
    "shareTokenHash" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "sentByEmail" TEXT,
    "preparedByEmail" TEXT NOT NULL,
    "deliveryProvider" TEXT,
    "providerMessageId" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedByEmail" TEXT,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AgreementDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgreementAcceptance_agreementId_key" ON "AgreementAcceptance"("agreementId");
CREATE UNIQUE INDEX "AgreementDelivery_shareTokenHash_key" ON "AgreementDelivery"("shareTokenHash");

CREATE INDEX "CommercialAgreement_opportunityId_createdAt_idx" ON "CommercialAgreement"("opportunityId", "createdAt");
CREATE INDEX "CommercialAgreement_opportunityId_status_idx" ON "CommercialAgreement"("opportunityId", "status");
CREATE INDEX "CommercialAgreement_proposalId_createdAt_idx" ON "CommercialAgreement"("proposalId", "createdAt");
CREATE INDEX "CommercialAgreement_commercialScopeId_idx" ON "CommercialAgreement"("commercialScopeId");
CREATE INDEX "CommercialAgreement_commercialPricingId_idx" ON "CommercialAgreement"("commercialPricingId");
CREATE INDEX "CommercialAgreement_status_createdAt_idx" ON "CommercialAgreement"("status", "createdAt");

CREATE INDEX "AgreementAcceptance_agreementId_idx" ON "AgreementAcceptance"("agreementId");

CREATE INDEX "AgreementDelivery_opportunityId_createdAt_idx" ON "AgreementDelivery"("opportunityId", "createdAt");
CREATE INDEX "AgreementDelivery_agreementId_createdAt_idx" ON "AgreementDelivery"("agreementId", "createdAt");
CREATE INDEX "AgreementDelivery_status_createdAt_idx" ON "AgreementDelivery"("status", "createdAt");

ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "CommercialProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_commercialScopeId_fkey" FOREIGN KEY ("commercialScopeId") REFERENCES "CommercialScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement" ADD CONSTRAINT "CommercialAgreement_commercialPricingId_fkey" FOREIGN KEY ("commercialPricingId") REFERENCES "CommercialPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgreementAcceptance" ADD CONSTRAINT "AgreementAcceptance_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "CommercialAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgreementDelivery" ADD CONSTRAINT "AgreementDelivery_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgreementDelivery" ADD CONSTRAINT "AgreementDelivery_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "CommercialAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
