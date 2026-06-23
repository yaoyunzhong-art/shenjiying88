-- CreateTable
CREATE TABLE "LytOrderSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "externalOrderId" TEXT NOT NULL,
    "orderNo" TEXT,
    "memberId" TEXT,
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "LytOrderSnapshot_tenantId_externalOrderId_key"
ON "LytOrderSnapshot"("tenantId", "externalOrderId");

-- CreateIndex
CREATE INDEX "LytOrderSnapshot_tenantId_storeId_updatedAtFromSource_idx"
ON "LytOrderSnapshot"("tenantId", "storeId", "updatedAtFromSource");

-- CreateIndex
CREATE UNIQUE INDEX "LytPaymentSnapshot_tenantId_externalPaymentId_key"
ON "LytPaymentSnapshot"("tenantId", "externalPaymentId");

-- CreateIndex
CREATE INDEX "LytPaymentSnapshot_tenantId_externalOrderId_idx"
ON "LytPaymentSnapshot"("tenantId", "externalOrderId");

-- CreateIndex
CREATE INDEX "LytPaymentSnapshot_tenantId_storeId_updatedAtFromSource_idx"
ON "LytPaymentSnapshot"("tenantId", "storeId", "updatedAtFromSource");
