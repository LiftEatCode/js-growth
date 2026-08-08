-- CreateTable
CREATE TABLE "AuditReport" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "website" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "reportMode" TEXT NOT NULL,
    "audit" JSONB NOT NULL,

    CONSTRAINT "AuditReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditReport_hostname_idx" ON "AuditReport"("hostname");

-- CreateIndex
CREATE INDEX "AuditReport_createdAt_idx" ON "AuditReport"("createdAt");
