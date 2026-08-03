/*
  Warnings:

  - You are about to alter the column `amount` on the `LytOrderSnapshot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `discountAmount` on the `LytOrderSnapshot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `payableAmount` on the `LytOrderSnapshot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `amount` on the `LytPaymentSnapshot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "LytOrderSnapshot" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "payableAmount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "LytPaymentSnapshot" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
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

-- CreateTable
CREATE TABLE "marketing_push_decision_log" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT,
    "push_type" TEXT NOT NULL,
    "channel" TEXT,
    "content" TEXT,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_push_decision_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT,
    "equipmentId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assigneeName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "remindedAt" TIMESTAMP(3),
    "result" TEXT,
    "note" TEXT,
    "inspectorId" TEXT,
    "inspectorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empower_card" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "freshnessScore" INTEGER NOT NULL DEFAULT 100,
    "moduleMapping" TEXT,
    "quoteCount" INTEGER NOT NULL DEFAULT 0,
    "lastQuotedAt" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "expertVetted" BOOLEAN NOT NULL DEFAULT false,
    "detailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empower_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empower_card_quote_log" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quotedBy" TEXT NOT NULL,
    "quotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskName" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,

    CONSTRAINT "empower_card_quote_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_report" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "date" TEXT NOT NULL,
    "internalTotal" INTEGER NOT NULL DEFAULT 0,
    "externalTotal" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "exactMatchCount" INTEGER NOT NULL DEFAULT 0,
    "internalTotalCents" INTEGER NOT NULL DEFAULT 0,
    "externalTotalCents" INTEGER NOT NULL DEFAULT 0,
    "totalDiffCents" INTEGER NOT NULL DEFAULT 0,
    "matchKeyType" TEXT NOT NULL DEFAULT 'orderNo',
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "toleranceCents" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconcile_diff" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "orderNo" TEXT,
    "internalId" TEXT,
    "externalId" TEXT,
    "internalAmountCents" INTEGER,
    "externalAmountCents" INTEGER,
    "diffCents" INTEGER NOT NULL DEFAULT 0,
    "duplicateIds" TEXT,
    "note" TEXT,

    CONSTRAINT "reconcile_diff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconcile_match" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "internalId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "orderNo" TEXT,
    "internalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "externalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "matched" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reconcile_match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolved_diff" (
    "id" TEXT NOT NULL,
    "diffKey" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resolved_diff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "brand_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_campaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "storeIds" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectReason" TEXT,
    "publishedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_campaign_template" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "defaultStoreIds" JSONB NOT NULL,
    "defaultDurationDays" INTEGER NOT NULL DEFAULT 30,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_campaign_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "partnerName" TEXT NOT NULL,
    "partnerContactName" TEXT NOT NULL,
    "partnerContactPhone" TEXT NOT NULL,
    "partnerGrade" TEXT NOT NULL,
    "revenueShareType" TEXT,
    "revenueSharePartnerRate" DOUBLE PRECISION,
    "revenueShareOurRate" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_channel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "creaedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_kpi" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recycle_bin_item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityData" JSONB,
    "deletedBy" TEXT NOT NULL,
    "restoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recycle_bin_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_contract" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "content" TEXT NOT NULL DEFAULT '',
    "signedByA" TIMESTAMP(3),
    "signedByB" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaboration_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_ab_test" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "variants" JSONB NOT NULL,
    "winnerVariant" TEXT,
    "decidedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_ab_test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_record" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileUrl" TEXT,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "export_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_schedule" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "executedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "grade" TEXT NOT NULL DEFAULT 'regular',
    "status" TEXT NOT NULL DEFAULT 'active',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "supplierId" TEXT,
    "referenceId" TEXT,
    "operator" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 10,
    "unit" TEXT NOT NULL DEFAULT '个',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'regular',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_kpi" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalInbound" INTEGER NOT NULL DEFAULT 0,
    "totalOutbound" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "emergencyTasks" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_kpi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfileExtension_memberProfileId_key" ON "MemberProfileExtension"("memberProfileId");

-- CreateIndex
CREATE INDEX "MemberProfileExtension_tenantId_memberProfileId_idx" ON "MemberProfileExtension"("tenantId", "memberProfileId");

-- CreateIndex
CREATE INDEX "marketing_push_decision_log_tenant_id_push_type_created_at_idx" ON "marketing_push_decision_log"("tenant_id", "push_type", "created_at");

-- CreateIndex
CREATE INDEX "marketing_push_decision_log_tenant_id_member_id_created_at_idx" ON "marketing_push_decision_log"("tenant_id", "member_id", "created_at");

-- CreateIndex
CREATE INDEX "marketing_push_decision_log_tenant_id_decision_status_idx" ON "marketing_push_decision_log"("tenant_id", "decision", "status");

-- CreateIndex
CREATE INDEX "inspection_task_tenantId_status_idx" ON "inspection_task"("tenantId", "status");

-- CreateIndex
CREATE INDEX "inspection_task_tenantId_scheduledAt_idx" ON "inspection_task"("tenantId", "scheduledAt");

-- CreateIndex
CREATE INDEX "empower_card_tag_idx" ON "empower_card"("tag");

-- CreateIndex
CREATE INDEX "empower_card_freshnessScore_idx" ON "empower_card"("freshnessScore");

-- CreateIndex
CREATE INDEX "empower_card_quoteCount_idx" ON "empower_card"("quoteCount");

-- CreateIndex
CREATE INDEX "empower_card_quote_log_cardId_idx" ON "empower_card_quote_log"("cardId");

-- CreateIndex
CREATE INDEX "empower_card_quote_log_quotedAt_idx" ON "empower_card_quote_log"("quotedAt");

-- CreateIndex
CREATE INDEX "reconciliation_report_tenantId_idx" ON "reconciliation_report"("tenantId");

-- CreateIndex
CREATE INDEX "reconciliation_report_date_idx" ON "reconciliation_report"("date");

-- CreateIndex
CREATE INDEX "reconciliation_report_tenantId_date_idx" ON "reconciliation_report"("tenantId", "date");

-- CreateIndex
CREATE INDEX "reconcile_diff_reportId_idx" ON "reconcile_diff"("reportId");

-- CreateIndex
CREATE INDEX "reconcile_diff_kind_idx" ON "reconcile_diff"("kind");

-- CreateIndex
CREATE INDEX "reconcile_match_reportId_idx" ON "reconcile_match"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "resolved_diff_diffKey_key" ON "resolved_diff"("diffKey");

-- CreateIndex
CREATE INDEX "resolved_diff_diffKey_idx" ON "resolved_diff"("diffKey");

-- CreateIndex
CREATE INDEX "brand_asset_tenantId_type_idx" ON "brand_asset"("tenantId", "type");

-- CreateIndex
CREATE INDEX "brand_asset_tenantId_isDeleted_idx" ON "brand_asset"("tenantId", "isDeleted");

-- CreateIndex
CREATE INDEX "brand_campaign_tenantId_status_idx" ON "brand_campaign"("tenantId", "status");

-- CreateIndex
CREATE INDEX "brand_campaign_tenantId_startDate_endDate_idx" ON "brand_campaign"("tenantId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "brand_campaign_template_tenantId_idx" ON "brand_campaign_template"("tenantId");

-- CreateIndex
CREATE INDEX "collaboration_tenantId_status_idx" ON "collaboration"("tenantId", "status");

-- CreateIndex
CREATE INDEX "collaboration_tenantId_type_idx" ON "collaboration"("tenantId", "type");

-- CreateIndex
CREATE INDEX "brand_channel_tenantId_type_idx" ON "brand_channel"("tenantId", "type");

-- CreateIndex
CREATE INDEX "brand_channel_tenantId_status_idx" ON "brand_channel"("tenantId", "status");

-- CreateIndex
CREATE INDEX "brand_kpi_tenantId_category_idx" ON "brand_kpi"("tenantId", "category");

-- CreateIndex
CREATE INDEX "brand_kpi_tenantId_period_idx" ON "brand_kpi"("tenantId", "period");

-- CreateIndex
CREATE INDEX "recycle_bin_item_tenantId_entityType_idx" ON "recycle_bin_item"("tenantId", "entityType");

-- CreateIndex
CREATE INDEX "recycle_bin_item_tenantId_idx" ON "recycle_bin_item"("tenantId");

-- CreateIndex
CREATE INDEX "collaboration_contract_collaborationId_idx" ON "collaboration_contract"("collaborationId");

-- CreateIndex
CREATE INDEX "collaboration_contract_tenantId_status_idx" ON "collaboration_contract"("tenantId", "status");

-- CreateIndex
CREATE INDEX "campaign_ab_test_campaignId_idx" ON "campaign_ab_test"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_ab_test_tenantId_status_idx" ON "campaign_ab_test"("tenantId", "status");

-- CreateIndex
CREATE INDEX "export_record_tenantId_idx" ON "export_record"("tenantId");

-- CreateIndex
CREATE INDEX "export_record_tenantId_status_idx" ON "export_record"("tenantId", "status");

-- CreateIndex
CREATE INDEX "campaign_schedule_campaignId_idx" ON "campaign_schedule"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_schedule_tenantId_status_idx" ON "campaign_schedule"("tenantId", "status");

-- CreateIndex
CREATE INDEX "supplier_tenantId_status_idx" ON "supplier"("tenantId", "status");

-- CreateIndex
CREATE INDEX "supplier_tenantId_grade_idx" ON "supplier"("tenantId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_orderNumber_key" ON "purchase_order"("orderNumber");

-- CreateIndex
CREATE INDEX "purchase_order_tenantId_status_idx" ON "purchase_order"("tenantId", "status");

-- CreateIndex
CREATE INDEX "purchase_order_supplierId_idx" ON "purchase_order"("supplierId");

-- CreateIndex
CREATE INDEX "stock_movement_tenantId_type_idx" ON "stock_movement"("tenantId", "type");

-- CreateIndex
CREATE INDEX "stock_movement_tenantId_createdAt_idx" ON "stock_movement"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_item_sku_key" ON "stock_item"("sku");

-- CreateIndex
CREATE INDEX "stock_item_tenantId_category_idx" ON "stock_item"("tenantId", "category");

-- CreateIndex
CREATE INDEX "stock_item_tenantId_quantity_idx" ON "stock_item"("tenantId", "quantity");

-- CreateIndex
CREATE INDEX "maintenance_task_tenantId_status_idx" ON "maintenance_task"("tenantId", "status");

-- CreateIndex
CREATE INDEX "maintenance_task_tenantId_type_idx" ON "maintenance_task"("tenantId", "type");

-- CreateIndex
CREATE INDEX "logistics_kpi_tenantId_period_idx" ON "logistics_kpi"("tenantId", "period");

-- AddForeignKey
ALTER TABLE "MemberProfileExtension" ADD CONSTRAINT "MemberProfileExtension_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empower_card_quote_log" ADD CONSTRAINT "empower_card_quote_log_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "empower_card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconcile_diff" ADD CONSTRAINT "reconcile_diff_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reconciliation_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconcile_match" ADD CONSTRAINT "reconcile_match_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reconciliation_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_reward" ADD CONSTRAINT "birthday_reward_planId_fkey" FOREIGN KEY ("planId") REFERENCES "birthday_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_tracking" ADD CONSTRAINT "birthday_tracking_planId_fkey" FOREIGN KEY ("planId") REFERENCES "birthday_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_building_event" ADD CONSTRAINT "team_building_event_planId_fkey" FOREIGN KEY ("planId") REFERENCES "team_building_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_building_report" ADD CONSTRAINT "team_building_report_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "team_building_event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isv_app" ADD CONSTRAINT "isv_app_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "isv_developer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_record" ADD CONSTRAINT "api_key_record_appId_fkey" FOREIGN KEY ("appId") REFERENCES "isv_app"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_call_record" ADD CONSTRAINT "api_call_record_appId_fkey" FOREIGN KEY ("appId") REFERENCES "isv_app"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_call_record" ADD CONSTRAINT "api_call_record_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "isv_developer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_contract" ADD CONSTRAINT "sla_contract_appId_fkey" FOREIGN KEY ("appId") REFERENCES "isv_app"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_record" ADD CONSTRAINT "billing_record_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "isv_developer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_record" ADD CONSTRAINT "billing_record_appId_fkey" FOREIGN KEY ("appId") REFERENCES "isv_app"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sdk_version" ADD CONSTRAINT "sdk_version_appId_fkey" FOREIGN KEY ("appId") REFERENCES "isv_app"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_item" ADD CONSTRAINT "marketplace_item_appId_fkey" FOREIGN KEY ("appId") REFERENCES "isv_app"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_change_record" ADD CONSTRAINT "tier_change_record_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "alliance_partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "cross_brand_coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_settlement" ADD CONSTRAINT "coupon_settlement_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "cross_brand_coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_record" ADD CONSTRAINT "review_record_anomalyId_fkey" FOREIGN KEY ("anomalyId") REFERENCES "anomaly_transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "MemberOperationsExecutionReceipt_tenantId_memberId_executedAt_i" RENAME TO "MemberOperationsExecutionReceipt_tenantId_memberId_executed_idx";

-- RenameIndex
ALTER INDEX "finance_settlement_status_idx" RENAME TO "finance_settlement_settlementStatus_idx";
