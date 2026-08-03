-- CreateTable
CREATE TABLE "cashier_orders" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "memberId" TEXT NOT NULL,
    "items" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "blindboxPlanId" TEXT,
    "blindboxQuantity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "latestPaymentId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'memory',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closeReason" TEXT,
    "closedBy" TEXT,
    "closeNote" TEXT,

    CONSTRAINT "cashier_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashier_payments" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "externalPaymentId" TEXT,
    "channel" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "qrCodeUrl" TEXT,
    "paymentUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "transactionNo" TEXT,
    "sourceEventName" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "cashier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashier_members" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberNo" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'Bronze',
    "points" INTEGER NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashier_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashier_transactions" (
    "id" TEXT NOT NULL,
    "txnId" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNo" TEXT,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "txnDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashier_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cashier_orders_orderId_key" ON "cashier_orders"("orderId");

-- CreateIndex
CREATE INDEX "cashier_orders_tenantId_idx" ON "cashier_orders"("tenantId");

-- CreateIndex
CREATE INDEX "cashier_orders_memberId_idx" ON "cashier_orders"("memberId");

-- CreateIndex
CREATE INDEX "cashier_orders_tenantId_status_idx" ON "cashier_orders"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cashier_payments_paymentId_key" ON "cashier_payments"("paymentId");

-- CreateIndex
CREATE INDEX "cashier_payments_orderId_idx" ON "cashier_payments"("orderId");

-- CreateIndex
CREATE INDEX "cashier_payments_paymentId_status_idx" ON "cashier_payments"("paymentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cashier_members_memberId_key" ON "cashier_members"("memberId");

-- CreateIndex
CREATE INDEX "cashier_members_phone_idx" ON "cashier_members"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "cashier_transactions_txnId_key" ON "cashier_transactions"("txnId");

-- CreateIndex
CREATE INDEX "cashier_transactions_memberId_idx" ON "cashier_transactions"("memberId");

-- CreateIndex
CREATE INDEX "cashier_transactions_orderId_idx" ON "cashier_transactions"("orderId");
