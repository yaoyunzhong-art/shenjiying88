-- CreateTable
CREATE TABLE IF NOT EXISTS "invoice_v2" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "invoiceNo" TEXT NOT NULL,
  "orderId" TEXT,
  "type" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "taxAmountCents" INTEGER NOT NULL DEFAULT 0,
  "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0.13,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "buyerName" TEXT,
  "buyerTaxId" TEXT,
  "buyerEmail" TEXT,
  "remark" TEXT,
  "issuedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "invoice_v2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "invoice_v2_invoiceNo_key" ON "invoice_v2"("invoiceNo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoice_v2_tenantId_idx" ON "invoice_v2"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoice_v2_orderId_idx" ON "invoice_v2"("orderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoice_v2_status_idx" ON "invoice_v2"("status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "finance_ledger" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "brandId" TEXT,
  "storeId" TEXT,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "orderId" TEXT,
  "transactionId" TEXT,
  "description" TEXT NOT NULL DEFAULT '',
  "category" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "finance_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_ledger_tenantId_idx" ON "finance_ledger"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_ledger_type_idx" ON "finance_ledger"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_ledger_tenantId_recordedAt_idx" ON "finance_ledger"("tenantId", "recordedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_ledger_storeId_idx" ON "finance_ledger"("storeId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "finance_account" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "storeId" TEXT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "finance_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_account_tenantId_idx" ON "finance_account"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_account_type_idx" ON "finance_account"("type");

-- CreateTable
CREATE TABLE IF NOT EXISTS "finance_settlement" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "storeId" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalExpense" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "settlementStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "finance_settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_settlement_tenantId_idx" ON "finance_settlement"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_settlement_storeId_idx" ON "finance_settlement"("storeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_settlement_status_idx" ON "finance_settlement"("settlementStatus");
