-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "LytMemberSnapshot_tenantId_externalMemberId_key"
ON "LytMemberSnapshot"("tenantId", "externalMemberId");

-- CreateIndex
CREATE INDEX "LytMemberSnapshot_tenantId_memberProfileId_idx"
ON "LytMemberSnapshot"("tenantId", "memberProfileId");

-- CreateIndex
CREATE INDEX "LytMemberSnapshot_tenantId_storeId_updatedAtFromSource_idx"
ON "LytMemberSnapshot"("tenantId", "storeId", "updatedAtFromSource");
