-- Finance minimal apply for local mixed database
--
-- Scope:
-- - finance_report
-- - finance_report_export
-- - invoice_v2
-- - finance_ledger
-- - finance_account
-- - finance_settlement
--
-- Safety:
-- - No historical table deletion
-- - No empower_card schema rewrite
-- - Uses IF NOT EXISTS on all finance core objects

-- finance report persistence
CREATE TABLE IF NOT EXISTS "finance_report" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "storeId" TEXT,
  "title" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "data" JSONB,
  "summary" JSONB,
  "generatedAt" TIMESTAMP(3),
  "generatedBy" TEXT,
  "exportFormats" JSONB NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "finance_report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "finance_report_tenantId_idx" ON "finance_report"("tenantId");
CREATE INDEX IF NOT EXISTS "finance_report_tenantId_createdAt_idx" ON "finance_report"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "finance_report_storeId_idx" ON "finance_report"("storeId");
CREATE INDEX IF NOT EXISTS "finance_report_reportType_idx" ON "finance_report"("reportType");
CREATE INDEX IF NOT EXISTS "finance_report_status_idx" ON "finance_report"("status");

CREATE TABLE IF NOT EXISTS "finance_report_export" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "url" TEXT,
  "content" TEXT,
  "columns" JSONB,
  "filters" JSONB,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_report_export_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "finance_report_export_tenantId_idx" ON "finance_report_export"("tenantId");
CREATE INDEX IF NOT EXISTS "finance_report_export_reportId_idx" ON "finance_report_export"("reportId");
CREATE INDEX IF NOT EXISTS "finance_report_export_format_idx" ON "finance_report_export"("format");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'finance_report_export_reportId_fkey'
  ) THEN
    ALTER TABLE "finance_report_export"
    ADD CONSTRAINT "finance_report_export_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "finance_report"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- finance core persistence
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

CREATE UNIQUE INDEX IF NOT EXISTS "invoice_v2_invoiceNo_key" ON "invoice_v2"("invoiceNo");
CREATE INDEX IF NOT EXISTS "invoice_v2_tenantId_idx" ON "invoice_v2"("tenantId");
CREATE INDEX IF NOT EXISTS "invoice_v2_orderId_idx" ON "invoice_v2"("orderId");
CREATE INDEX IF NOT EXISTS "invoice_v2_status_idx" ON "invoice_v2"("status");

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

CREATE INDEX IF NOT EXISTS "finance_ledger_tenantId_idx" ON "finance_ledger"("tenantId");
CREATE INDEX IF NOT EXISTS "finance_ledger_type_idx" ON "finance_ledger"("type");
CREATE INDEX IF NOT EXISTS "finance_ledger_tenantId_recordedAt_idx" ON "finance_ledger"("tenantId", "recordedAt");
CREATE INDEX IF NOT EXISTS "finance_ledger_storeId_idx" ON "finance_ledger"("storeId");

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

CREATE INDEX IF NOT EXISTS "finance_account_tenantId_idx" ON "finance_account"("tenantId");
CREATE INDEX IF NOT EXISTS "finance_account_type_idx" ON "finance_account"("type");

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

CREATE INDEX IF NOT EXISTS "finance_settlement_tenantId_idx" ON "finance_settlement"("tenantId");
CREATE INDEX IF NOT EXISTS "finance_settlement_storeId_idx" ON "finance_settlement"("storeId");
CREATE INDEX IF NOT EXISTS "finance_settlement_status_idx" ON "finance_settlement"("settlementStatus");
