-- CreateEnum
CREATE TYPE "CustomDomainStatus" AS ENUM (
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SSL_ISSUING',
  'ACTIVE_SSL',
  'SSL_FAILED',
  'DISABLED'
);

-- CreateEnum
CREATE TYPE "CustomDomainVerificationMethod" AS ENUM ('DNS_TXT');

-- CreateEnum
CREATE TYPE "CustomDomainSslMode" AS ENUM (
  'PLATFORM_MANAGED',
  'USER_PROVIDED'
);

-- CreateEnum
CREATE TYPE "CustomDomainCertificateStatus" AS ENUM (
  'NOT_REQUESTED',
  'PENDING',
  'ACTIVE',
  'FAILED',
  'EXPIRED'
);

-- CreateTable
CREATE TABLE "CustomDomain" (
  "id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "scopeType" "PortalScopeType" NOT NULL,
  "tenantId" TEXT NOT NULL,
  "brandId" TEXT,
  "storeId" TEXT,
  "portalSiteId" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "status" "CustomDomainStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "verificationMethod" "CustomDomainVerificationMethod" NOT NULL DEFAULT 'DNS_TXT',
  "verificationHost" TEXT NOT NULL,
  "verificationToken" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "verificationFailCount" INTEGER NOT NULL DEFAULT 0,
  "sslMode" "CustomDomainSslMode" NOT NULL DEFAULT 'PLATFORM_MANAGED',
  "certificateProvider" TEXT,
  "certificateStatus" "CustomDomainCertificateStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "certificateNotBefore" TIMESTAMP(3),
  "certificateNotAfter" TIMESTAMP(3),
  "certificateFingerprint" TEXT,
  "lastCheckedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CustomDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomDomain_domain_key" ON "CustomDomain"("domain");

-- CreateIndex
CREATE INDEX "CustomDomain_tenantId_status_idx" ON "CustomDomain"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CustomDomain_brandId_isPrimary_idx" ON "CustomDomain"("brandId", "isPrimary");

-- CreateIndex
CREATE INDEX "CustomDomain_storeId_isPrimary_idx" ON "CustomDomain"("storeId", "isPrimary");

-- CreateIndex
CREATE INDEX "CustomDomain_portalSiteId_idx" ON "CustomDomain"("portalSiteId");

-- AddForeignKey
ALTER TABLE "CustomDomain"
ADD CONSTRAINT "CustomDomain_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDomain"
ADD CONSTRAINT "CustomDomain_brandId_fkey"
FOREIGN KEY ("brandId") REFERENCES "Brand"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDomain"
ADD CONSTRAINT "CustomDomain_storeId_fkey"
FOREIGN KEY ("storeId") REFERENCES "Store"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDomain"
ADD CONSTRAINT "CustomDomain_portalSiteId_fkey"
FOREIGN KEY ("portalSiteId") REFERENCES "PortalSite"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
