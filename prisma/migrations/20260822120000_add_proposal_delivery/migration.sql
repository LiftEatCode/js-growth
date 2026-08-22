-- Commercial Sprint 7: Proposal delivery + client decision tracking

CREATE TYPE "ProposalDeliveryStatus" AS ENUM ('DRAFT', 'READY', 'SENDING', 'SENT', 'FAILED');

CREATE TYPE "ProposalDecision" AS ENUM (
  'PENDING',
  'INTERESTED',
  'CHANGES_REQUESTED',
  'DECLINED',
  'ACCEPTED'
);

ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_DELIVERY_PREPARED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_SENT';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_SEND_FAILED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_LINK_VIEWED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_ACCESS_REVOKED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_DECISION_RECORDED';

CREATE TABLE "ProposalDelivery" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "status" "ProposalDeliveryStatus" NOT NULL DEFAULT 'DRAFT',
  "subjectSnapshot" TEXT NOT NULL,
  "messageSnapshot" TEXT NOT NULL,
  "proposalVersion" INTEGER NOT NULL,
  "proposalPresentationVersion" INTEGER NOT NULL,
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
  "decision" "ProposalDecision" NOT NULL DEFAULT 'PENDING',
  "decisionAt" TIMESTAMP(3),
  "decisionRecordedByEmail" TEXT,
  "decisionNote" TEXT,

  CONSTRAINT "ProposalDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProposalDelivery_shareTokenHash_key" ON "ProposalDelivery"("shareTokenHash");

CREATE INDEX "ProposalDelivery_opportunityId_createdAt_idx" ON "ProposalDelivery"("opportunityId", "createdAt");

CREATE INDEX "ProposalDelivery_proposalId_createdAt_idx" ON "ProposalDelivery"("proposalId", "createdAt");

CREATE INDEX "ProposalDelivery_status_createdAt_idx" ON "ProposalDelivery"("status", "createdAt");

ALTER TABLE "ProposalDelivery" ADD CONSTRAINT "ProposalDelivery_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProposalDelivery" ADD CONSTRAINT "ProposalDelivery_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "CommercialProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
