/*
  Warnings:

  - Added the required column `criticalIssues` to the `AuditReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `AuditReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `opportunityScore` to the `AuditReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overallScore` to the `AuditReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quickWins` to the `AuditReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuditReport" ADD COLUMN     "criticalIssues" INTEGER NOT NULL,
ADD COLUMN     "grade" TEXT NOT NULL,
ADD COLUMN     "opportunityScore" INTEGER NOT NULL,
ADD COLUMN     "overallScore" INTEGER NOT NULL,
ADD COLUMN     "quickWins" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "AuditReport_overallScore_idx" ON "AuditReport"("overallScore");

-- CreateIndex
CREATE INDEX "AuditReport_grade_idx" ON "AuditReport"("grade");

-- CreateIndex
CREATE INDEX "AuditReport_opportunityScore_idx" ON "AuditReport"("opportunityScore");
