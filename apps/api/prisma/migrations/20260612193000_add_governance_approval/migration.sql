-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "GovernanceApproval" (
    "id" TEXT NOT NULL,
    "approvalTicket" TEXT,
    "operation" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceKey" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL DEFAULT 'PLATFORM',
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "requestedBy" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decisionNote" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceApproval_approvalTicket_key" ON "GovernanceApproval"("approvalTicket");

-- CreateIndex
CREATE INDEX "GovernanceApproval_status_updatedAt_idx" ON "GovernanceApproval"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "GovernanceApproval_operation_resourceType_resourceKey_idx" ON "GovernanceApproval"("operation", "resourceType", "resourceKey");

-- CreateIndex
CREATE INDEX "GovernanceApproval_scopeType_tenantId_brandId_storeId_idx" ON "GovernanceApproval"("scopeType", "tenantId", "brandId", "storeId");
