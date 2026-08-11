-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM (
  'CREATED',
  'STATUS_CHANGED',
  'FOLLOW_UP_CHANGED',
  'NOTES_UPDATED'
);

-- CreateTable
CREATE TABLE "LeadActivity" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" "LeadActivityType" NOT NULL,
  "description" TEXT NOT NULL,
  "fromValue" TEXT,
  "toValue" TEXT,
  "leadId" TEXT NOT NULL,

  CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_type_idx" ON "LeadActivity"("type");

-- AddForeignKey
ALTER TABLE "LeadActivity"
ADD CONSTRAINT "LeadActivity_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
