-- CreateTable
CREATE TABLE "minor_identity_verification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isMinor" BOOLEAN NOT NULL,
    "birthday" TEXT NOT NULL,
    "guardianConsent" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "minor_identity_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minor_access_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "checkResult" TEXT NOT NULL,
    "timeRestricted" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "minor_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "minor_identity_verification_tenantId_idx" ON "minor_identity_verification"("tenantId");

-- CreateIndex
CREATE INDEX "minor_identity_verification_memberId_idx" ON "minor_identity_verification"("memberId");

-- CreateIndex
CREATE INDEX "minor_identity_verification_tenantId_memberId_idx" ON "minor_identity_verification"("tenantId", "memberId");

-- CreateIndex
CREATE INDEX "minor_access_log_tenantId_idx" ON "minor_access_log"("tenantId");

-- CreateIndex
CREATE INDEX "minor_access_log_memberId_idx" ON "minor_access_log"("memberId");

-- CreateIndex
CREATE INDEX "minor_access_log_tenantId_createdAt_idx" ON "minor_access_log"("tenantId", "createdAt");
