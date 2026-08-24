-- Growth Sprint 10: durable inbound contact submissions with privacy-safe attribution.
-- Does not backfill historical contacts. Does not mutate AuditReport attribution.

CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "businessName" TEXT,
    "website" TEXT,
    "service" TEXT NOT NULL,
    "budget" TEXT,
    "message" TEXT NOT NULL,
    "attributionJson" JSONB,
    "leadOrigin" TEXT NOT NULL DEFAULT 'CONTACT',

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");
CREATE INDEX "ContactSubmission_email_idx" ON "ContactSubmission"("email");
