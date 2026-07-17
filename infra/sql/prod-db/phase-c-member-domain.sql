-- Phase C

-- Member profile and external member snapshot tables

-- MemberProfile

CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "growthValue" INTEGER NOT NULL DEFAULT 0,
    "svipStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);

-- MemberProfileExtension

CREATE TABLE "MemberProfileExtension" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberProfileExtension_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberProfileExtension_memberProfileId_key" ON "MemberProfileExtension"("memberProfileId");
CREATE INDEX "MemberProfileExtension_tenantId_memberProfileId_idx" ON "MemberProfileExtension"("tenantId", "memberProfileId");

-- LytMemberSnapshot

CREATE TABLE "LytMemberSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "memberProfileId" TEXT,
    "externalMemberId" TEXT NOT NULL,
    "memberCode" TEXT,
    "mobile" TEXT,
    "nickname" TEXT,
    "levelCode" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "growthValue" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "updatedAtFromSource" TIMESTAMP(3) NOT NULL,
    "rawVersion" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LytMemberSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LytMemberSnapshot_tenantId_memberProfileId_idx" ON "LytMemberSnapshot"("tenantId", "memberProfileId");
CREATE INDEX "LytMemberSnapshot_tenantId_storeId_updatedAtFromSource_idx" ON "LytMemberSnapshot"("tenantId", "storeId", "updatedAtFromSource");
CREATE UNIQUE INDEX "LytMemberSnapshot_tenantId_externalMemberId_key" ON "LytMemberSnapshot"("tenantId", "externalMemberId");

-- LytOrderSnapshot

CREATE TABLE "LytOrderSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "externalOrderId" TEXT NOT NULL,
    "orderNo" TEXT,
    "memberId" TEXT,
    "couponCode" TEXT,
    "blindboxPlanId" TEXT,
    "blindboxQuantity" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "status" TEXT NOT NULL DEFAULT 'UPDATED',
    "paidAt" TIMESTAMP(3),
    "updatedAtFromSource" TIMESTAMP(3) NOT NULL,
    "rawVersion" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LytOrderSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LytOrderSnapshot_tenantId_storeId_updatedAtFromSource_idx" ON "LytOrderSnapshot"("tenantId", "storeId", "updatedAtFromSource");
CREATE UNIQUE INDEX "LytOrderSnapshot_tenantId_externalOrderId_key" ON "LytOrderSnapshot"("tenantId", "externalOrderId");

-- LytPaymentSnapshot

CREATE TABLE "LytPaymentSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "externalPaymentId" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "paymentChannel" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "transactionNo" TEXT,
    "paidAt" TIMESTAMP(3),
    "updatedAtFromSource" TIMESTAMP(3) NOT NULL,
    "rawVersion" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LytPaymentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LytPaymentSnapshot_tenantId_externalOrderId_idx" ON "LytPaymentSnapshot"("tenantId", "externalOrderId");
CREATE INDEX "LytPaymentSnapshot_tenantId_storeId_updatedAtFromSource_idx" ON "LytPaymentSnapshot"("tenantId", "storeId", "updatedAtFromSource");
CREATE UNIQUE INDEX "LytPaymentSnapshot_tenantId_externalPaymentId_key" ON "LytPaymentSnapshot"("tenantId", "externalPaymentId");
