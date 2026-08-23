-- Commercial Sprint 10 — Client / Project Onboarding

CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "ClientProjectStatus" AS ENUM ('ONBOARDING', 'READY', 'ACTIVE', 'BLOCKED', 'COMPLETED', 'CANCELED', 'ARCHIVED');
CREATE TYPE "ProjectWorkstreamStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED');
CREATE TYPE "ProjectDeliverableStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'NOT_APPLICABLE');
CREATE TYPE "ProjectDeliveryTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED');
CREATE TYPE "OnboardingItemStatus" AS ENUM ('NOT_STARTED', 'REQUESTED', 'RECEIVED', 'NOT_REQUIRED', 'COMPLETED');
CREATE TYPE "ProjectActivityType" AS ENUM ('PROJECT_CREATED', 'ONBOARDING_STARTED', 'ONBOARDING_ITEM_UPDATED', 'PROJECT_READY_FOR_KICKOFF', 'PROJECT_STARTED', 'PROJECT_BLOCKED', 'PROJECT_COMPLETED', 'DELIVERY_TASK_UPDATED', 'NOTE_ADDED');

ALTER TYPE "OpportunityActivityType" ADD VALUE 'CLIENT_CREATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROJECT_CREATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'ONBOARDING_STARTED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'ONBOARDING_ITEM_UPDATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROJECT_READY_FOR_KICKOFF';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROJECT_STARTED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROJECT_BLOCKED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROJECT_COMPLETED';

CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "hostname" TEXT,
    "city" TEXT,
    "state" TEXT,
    "sourceProspectId" TEXT,
    "sourceOpportunityId" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Client_sourceProspectId_key" ON "Client"("sourceProspectId");
CREATE UNIQUE INDEX "Client_sourceOpportunityId_key" ON "Client"("sourceOpportunityId");
CREATE INDEX "Client_hostname_idx" ON "Client"("hostname");
CREATE INDEX "Client_status_createdAt_idx" ON "Client"("status", "createdAt");
CREATE INDEX "Client_primaryContactEmail_idx" ON "Client"("primaryContactEmail");

ALTER TABLE "Client" ADD CONSTRAINT "Client_sourceProspectId_fkey" FOREIGN KEY ("sourceProspectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Opportunity" ADD COLUMN "clientId" TEXT;
CREATE INDEX "Opportunity_clientId_idx" ON "Opportunity"("clientId");
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ClientProject" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ClientProjectStatus" NOT NULL DEFAULT 'ONBOARDING',
    "ownerEmail" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "commercialSnapshotJson" JSONB NOT NULL,
    "onboardingVersion" INTEGER NOT NULL DEFAULT 1,
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "ClientProject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientProject_opportunityId_key" ON "ClientProject"("opportunityId");
CREATE UNIQUE INDEX "ClientProject_agreementId_key" ON "ClientProject"("agreementId");
CREATE INDEX "ClientProject_clientId_createdAt_idx" ON "ClientProject"("clientId", "createdAt");
CREATE INDEX "ClientProject_status_createdAt_idx" ON "ClientProject"("status", "createdAt");
CREATE INDEX "ClientProject_ownerEmail_status_idx" ON "ClientProject"("ownerEmail", "status");

ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectWorkstream" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceScopeSectionId" TEXT,
    "title" TEXT NOT NULL,
    "capabilitiesJson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "status" "ProjectWorkstreamStatus" NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "ProjectWorkstream_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectWorkstream_projectId_sortOrder_idx" ON "ProjectWorkstream"("projectId", "sortOrder");
ALTER TABLE "ProjectWorkstream" ADD CONSTRAINT "ProjectWorkstream_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectDeliveryTask" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectDeliveryTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sourceScopeDeliverableIdsJson" JSONB NOT NULL,
    "sourceWorkstreamIdsJson" JSONB NOT NULL,
    "capabilitiesJson" JSONB NOT NULL,
    "assignedToEmail" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "internalNotes" TEXT,

    CONSTRAINT "ProjectDeliveryTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectDeliveryTask_projectId_key_key" ON "ProjectDeliveryTask"("projectId", "key");
CREATE INDEX "ProjectDeliveryTask_projectId_status_idx" ON "ProjectDeliveryTask"("projectId", "status");
ALTER TABLE "ProjectDeliveryTask" ADD CONSTRAINT "ProjectDeliveryTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectDeliverable" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "workstreamId" TEXT NOT NULL,
    "deliveryTaskId" TEXT,
    "sourceScopeDeliverableId" TEXT,
    "sourceActionKey" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "status" "ProjectDeliverableStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "internalNotes" TEXT,

    CONSTRAINT "ProjectDeliverable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectDeliverable_projectId_sortOrder_idx" ON "ProjectDeliverable"("projectId", "sortOrder");
CREATE INDEX "ProjectDeliverable_workstreamId_sortOrder_idx" ON "ProjectDeliverable"("workstreamId", "sortOrder");
CREATE INDEX "ProjectDeliverable_deliveryTaskId_idx" ON "ProjectDeliverable"("deliveryTaskId");
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_workstreamId_fkey" FOREIGN KEY ("workstreamId") REFERENCES "ProjectWorkstream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_deliveryTaskId_fkey" FOREIGN KEY ("deliveryTaskId") REFERENCES "ProjectDeliveryTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProjectOnboardingItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "status" "OnboardingItemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ProjectOnboardingItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectOnboardingItem_projectId_key_key" ON "ProjectOnboardingItem"("projectId", "key");
CREATE INDEX "ProjectOnboardingItem_projectId_sortOrder_idx" ON "ProjectOnboardingItem"("projectId", "sortOrder");
ALTER TABLE "ProjectOnboardingItem" ADD CONSTRAINT "ProjectOnboardingItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "type" "ProjectActivityType" NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "fromValueJson" JSONB,
    "toValueJson" JSONB,
    "note" TEXT,

    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectActivity_projectId_createdAt_idx" ON "ProjectActivity"("projectId", "createdAt");
CREATE INDEX "ProjectActivity_type_createdAt_idx" ON "ProjectActivity"("type", "createdAt");
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
