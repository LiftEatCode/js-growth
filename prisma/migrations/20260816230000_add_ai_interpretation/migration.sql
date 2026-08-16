-- CreateEnum
CREATE TYPE "AiInterpretationStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "AuditReport" ADD COLUMN "aiStatus" "AiInterpretationStatus",
ADD COLUMN "aiAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "aiStartedAt" TIMESTAMP(3),
ADD COLUMN "aiGeneratedAt" TIMESTAMP(3),
ADD COLUMN "aiInterpretation" JSONB;
