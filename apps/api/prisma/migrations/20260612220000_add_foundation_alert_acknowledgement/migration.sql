-- CreateEnum
CREATE TYPE "FoundationAlertAcknowledgementStatus" AS ENUM ('ACKED', 'MUTED');

-- CreateTable
CREATE TABLE "FoundationAlertAcknowledgement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'platform',
    "code" TEXT NOT NULL,
    "status" "FoundationAlertAcknowledgementStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "mutedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundationAlertAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoundationAlertAcknowledgement_tenantId_code_key" ON "FoundationAlertAcknowledgement"("tenantId", "code");

-- CreateIndex
CREATE INDEX "FoundationAlertAcknowledgement_tenantId_status_updatedAt_idx" ON "FoundationAlertAcknowledgement"("tenantId", "status", "updatedAt");
