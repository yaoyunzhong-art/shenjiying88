-- CreateTable
CREATE TABLE "finance_report" (
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

-- CreateTable
CREATE TABLE "finance_report_export" (
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

-- CreateIndex
CREATE INDEX "finance_report_tenantId_idx" ON "finance_report"("tenantId");

-- CreateIndex
CREATE INDEX "finance_report_tenantId_createdAt_idx" ON "finance_report"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "finance_report_storeId_idx" ON "finance_report"("storeId");

-- CreateIndex
CREATE INDEX "finance_report_reportType_idx" ON "finance_report"("reportType");

-- CreateIndex
CREATE INDEX "finance_report_status_idx" ON "finance_report"("status");

-- CreateIndex
CREATE INDEX "finance_report_export_tenantId_idx" ON "finance_report_export"("tenantId");

-- CreateIndex
CREATE INDEX "finance_report_export_reportId_idx" ON "finance_report_export"("reportId");

-- CreateIndex
CREATE INDEX "finance_report_export_format_idx" ON "finance_report_export"("format");

-- AddForeignKey
ALTER TABLE "finance_report_export"
ADD CONSTRAINT "finance_report_export_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "finance_report"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
