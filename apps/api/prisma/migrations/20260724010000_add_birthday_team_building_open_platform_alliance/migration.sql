-- CreateTable: birthday_plan
CREATE TABLE IF NOT EXISTS "birthday_plan" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "birthday" TEXT NOT NULL,
  "planDate" TEXT NOT NULL,
  "advanceDays" INTEGER NOT NULL,
  "tier" TEXT NOT NULL DEFAULT 'STANDARD',
  "rewardType" TEXT NOT NULL,
  "rewardValue" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "isUpcoming" BOOLEAN NOT NULL DEFAULT false,
  "allowFriends" BOOLEAN NOT NULL DEFAULT false,
  "friendDiscount" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "birthday_plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "birthday_plan_tenantId_idx" ON "birthday_plan"("tenantId");
CREATE INDEX IF NOT EXISTS "birthday_plan_memberId_idx" ON "birthday_plan"("memberId");
CREATE INDEX IF NOT EXISTS "birthday_plan_status_idx" ON "birthday_plan"("status");
CREATE INDEX IF NOT EXISTS "birthday_plan_planDate_idx" ON "birthday_plan"("planDate");

-- CreateTable: birthday_reward
CREATE TABLE IF NOT EXISTS "birthday_reward" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "sentAt" TIMESTAMP(3),
  "claimedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "birthday_reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "birthday_reward_tenantId_idx" ON "birthday_reward"("tenantId");
CREATE INDEX IF NOT EXISTS "birthday_reward_planId_idx" ON "birthday_reward"("planId");

-- CreateTable: birthday_tracking
CREATE TABLE IF NOT EXISTS "birthday_tracking" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "friendInvited" INTEGER NOT NULL DEFAULT 0,
  "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "returnVisitDays" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "birthday_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "birthday_tracking_tenantId_idx" ON "birthday_tracking"("tenantId");
CREATE INDEX IF NOT EXISTS "birthday_tracking_planId_idx" ON "birthday_tracking"("planId");

-- ═══════════════════════════════════════════════════════════════
-- Team-Building Module
-- ═══════════════════════════════════════════════════════════════

-- CreateTable: team_building_plan
CREATE TABLE IF NOT EXISTS "team_building_plan" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "budget" INTEGER NOT NULL,
  "expectedParticipants" INTEGER NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "recommendedSeason" TEXT,
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "team_building_plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "team_building_plan_tenantId_idx" ON "team_building_plan"("tenantId");
CREATE INDEX IF NOT EXISTS "team_building_plan_type_idx" ON "team_building_plan"("type");

-- CreateTable: team_building_event
CREATE TABLE IF NOT EXISTS "team_building_event" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "eventDate" TEXT NOT NULL,
  "participants" INTEGER NOT NULL,
  "actualParticipants" INTEGER,
  "totalSpend" INTEGER,
  "avgSatisfaction" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "lockedEquipment" JSONB NOT NULL DEFAULT '[]',
  "participantMemberIds" JSONB NOT NULL DEFAULT '[]',
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "team_building_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "team_building_event_tenantId_idx" ON "team_building_event"("tenantId");
CREATE INDEX IF NOT EXISTS "team_building_event_planId_idx" ON "team_building_event"("planId");
CREATE INDEX IF NOT EXISTS "team_building_event_status_idx" ON "team_building_event"("status");
CREATE INDEX IF NOT EXISTS "team_building_event_eventDate_idx" ON "team_building_event"("eventDate");

-- CreateTable: team_building_report
CREATE TABLE IF NOT EXISTS "team_building_report" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "participantCount" INTEGER NOT NULL,
  "totalSpend" INTEGER NOT NULL,
  "avgSpend" INTEGER NOT NULL,
  "avgSatisfaction" DOUBLE PRECISION NOT NULL,
  "satisfactionBreakdown" JSONB NOT NULL DEFAULT '{}',
  "equipmentUsage" JSONB NOT NULL DEFAULT '[]',
  "crmSyncStatus" TEXT NOT NULL DEFAULT 'pending',
  "remark" TEXT,
  "improvement" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "team_building_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "team_building_report_tenantId_idx" ON "team_building_report"("tenantId");
CREATE INDEX IF NOT EXISTS "team_building_report_eventId_idx" ON "team_building_report"("eventId");

-- CreateTable: crm_sync_record
CREATE TABLE IF NOT EXISTS "crm_sync_record" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "memberIds" JSONB NOT NULL DEFAULT '[]',
  "totalSpend" INTEGER NOT NULL DEFAULT 0,
  "eventName" TEXT NOT NULL DEFAULT '',
  "syncStatus" TEXT NOT NULL DEFAULT 'pending',
  "syncedAt" TIMESTAMP(3),
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "crm_sync_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "crm_sync_record_tenantId_idx" ON "crm_sync_record"("tenantId");
CREATE INDEX IF NOT EXISTS "crm_sync_record_eventId_idx" ON "crm_sync_record"("eventId");
CREATE INDEX IF NOT EXISTS "crm_sync_record_syncStatus_idx" ON "crm_sync_record"("syncStatus");

-- ═══════════════════════════════════════════════════════════════
-- Open Platform Module
-- ═══════════════════════════════════════════════════════════════

-- CreateTable: isv_developer
CREATE TABLE IF NOT EXISTS "isv_developer" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "totalEarned" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "bio" TEXT,
  "website" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "isv_developer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "isv_developer_email_key" ON "isv_developer"("email");
CREATE INDEX IF NOT EXISTS "isv_developer_tenantId_idx" ON "isv_developer"("tenantId");
CREATE INDEX IF NOT EXISTS "isv_developer_status_idx" ON "isv_developer"("status");

-- CreateTable: isv_app
CREATE TABLE IF NOT EXISTS "isv_app" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "developerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "apiKey" TEXT NOT NULL,
  "apiSecret" TEXT NOT NULL,
  "quota" INTEGER NOT NULL DEFAULT 1000,
  "apiVersion" TEXT NOT NULL DEFAULT 'v1',
  "iconUrl" TEXT,
  "category" TEXT,
  "price" INTEGER,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "isv_app_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "isv_app_apiKey_key" ON "isv_app"("apiKey");
CREATE INDEX IF NOT EXISTS "isv_app_tenantId_idx" ON "isv_app"("tenantId");
CREATE INDEX IF NOT EXISTS "isv_app_developerId_idx" ON "isv_app"("developerId");
CREATE INDEX IF NOT EXISTS "isv_app_status_idx" ON "isv_app"("status");

-- CreateTable: api_key_record
CREATE TABLE IF NOT EXISTS "api_key_record" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "apiKey" TEXT NOT NULL,
  "apiSecretHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdBy" TEXT NOT NULL,
  "rotatedToId" TEXT,
  "revokeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rotatedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "api_key_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "api_key_record_apiKey_key" ON "api_key_record"("apiKey");
CREATE INDEX IF NOT EXISTS "api_key_record_appId_idx" ON "api_key_record"("appId");
CREATE INDEX IF NOT EXISTS "api_key_record_status_idx" ON "api_key_record"("status");

-- CreateTable: api_call_record
CREATE TABLE IF NOT EXISTS "api_call_record" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "cost" INTEGER NOT NULL DEFAULT 0,
  "statusCode" INTEGER NOT NULL,
  "signature" TEXT NOT NULL,
  "ipAddress" TEXT,
  "durationMs" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "api_call_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "api_call_record_appId_idx" ON "api_call_record"("appId");
CREATE INDEX IF NOT EXISTS "api_call_record_developerId_idx" ON "api_call_record"("developerId");
CREATE INDEX IF NOT EXISTS "api_call_record_timestamp_idx" ON "api_call_record"("timestamp");

-- CreateTable: sla_contract
CREATE TABLE IF NOT EXISTS "sla_contract" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "tierName" TEXT NOT NULL,
  "uptimeGuarantee" DOUBLE PRECISION NOT NULL,
  "penaltyRate" DOUBLE PRECISION NOT NULL,
  "monthlyCallCommitment" INTEGER NOT NULL,
  "overageUnitPrice" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "currentUptime" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "currentCalls" INTEGER NOT NULL DEFAULT 0,
  "breachCount" INTEGER NOT NULL DEFAULT 0,
  "totalPenalty" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sla_contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sla_contract_appId_idx" ON "sla_contract"("appId");
CREATE INDEX IF NOT EXISTS "sla_contract_status_idx" ON "sla_contract"("status");

-- CreateTable: billing_record
CREATE TABLE IF NOT EXISTS "billing_record" (
  "id" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "billingMonth" TEXT NOT NULL,
  "totalCalls" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL DEFAULT 0,
  "slaPenalty" INTEGER NOT NULL DEFAULT 0,
  "settleAmount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "billing_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "billing_record_developerId_idx" ON "billing_record"("developerId");
CREATE INDEX IF NOT EXISTS "billing_record_appId_idx" ON "billing_record"("appId");
CREATE INDEX IF NOT EXISTS "billing_record_billingMonth_idx" ON "billing_record"("billingMonth");
CREATE INDEX IF NOT EXISTS "billing_record_status_idx" ON "billing_record"("status");

-- CreateTable: api_version
CREATE TABLE IF NOT EXISTS "api_version" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "basePath" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "changelog" TEXT,
  "deprecatedAt" TIMESTAMP(3),
  "sunsetAt" TIMESTAMP(3),
  "migrationGuide" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "api_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "api_version_version_key" ON "api_version"("version");

-- CreateTable: sdk_version
CREATE TABLE IF NOT EXISTS "sdk_version" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "downloadUrl" TEXT NOT NULL,
  "docContent" TEXT,
  "isLatest" BOOLEAN NOT NULL DEFAULT false,
  "changelog" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sdk_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sdk_version_appId_idx" ON "sdk_version"("appId");
CREATE INDEX IF NOT EXISTS "sdk_version_isLatest_idx" ON "sdk_version"("isLatest");

-- CreateTable: marketplace_item
CREATE TABLE IF NOT EXISTS "marketplace_item" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "summary" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "tags" JSONB NOT NULL DEFAULT '[]',
  "price" INTEGER NOT NULL DEFAULT 0,
  "screenshots" JSONB NOT NULL DEFAULT '[]',
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "marketplace_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_item_appId_key" ON "marketplace_item"("appId");
CREATE INDEX IF NOT EXISTS "marketplace_item_isFeatured_idx" ON "marketplace_item"("isFeatured");

-- ═══════════════════════════════════════════════════════════════
-- Alliance Module
-- ═══════════════════════════════════════════════════════════════

-- CreateTable: alliance_partner
CREATE TABLE IF NOT EXISTS "alliance_partner" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "name" TEXT NOT NULL,
  "businessType" TEXT NOT NULL,
  "contact" TEXT NOT NULL,
  "address" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "currentGrade" TEXT,
  "healthScore" DOUBLE PRECISION,
  "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "alliance_partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "alliance_partner_tenantId_idx" ON "alliance_partner"("tenantId");
CREATE INDEX IF NOT EXISTS "alliance_partner_businessType_idx" ON "alliance_partner"("businessType");
CREATE INDEX IF NOT EXISTS "alliance_partner_status_idx" ON "alliance_partner"("status");
CREATE INDEX IF NOT EXISTS "alliance_partner_currentGrade_idx" ON "alliance_partner"("currentGrade");

-- CreateTable: tier_change_record
CREATE TABLE IF NOT EXISTS "tier_change_record" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "fromGrade" TEXT,
  "toGrade" TEXT NOT NULL,
  "reason" TEXT NOT NULL DEFAULT '',
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tier_change_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tier_change_record_partnerId_idx" ON "tier_change_record"("partnerId");

-- CreateTable: cross_brand_coupon
CREATE TABLE IF NOT EXISTS "cross_brand_coupon" (
  "id" TEXT NOT NULL,
  "issuerPartnerId" TEXT NOT NULL,
  "issuerPartnerName" TEXT NOT NULL,
  "denomination" INTEGER NOT NULL,
  "minSpend" INTEGER NOT NULL DEFAULT 0,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3) NOT NULL,
  "acceptedPartnerIds" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'active',
  "description" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "cross_brand_coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cross_brand_coupon_issuerPartnerId_idx" ON "cross_brand_coupon"("issuerPartnerId");
CREATE INDEX IF NOT EXISTS "cross_brand_coupon_status_idx" ON "cross_brand_coupon"("status");
CREATE INDEX IF NOT EXISTS "cross_brand_coupon_validTo_idx" ON "cross_brand_coupon"("validTo");

-- CreateTable: coupon_redemption
CREATE TABLE IF NOT EXISTS "coupon_redemption" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "partnerName" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "orderAmount" INTEGER NOT NULL,
  "discountApplied" INTEGER NOT NULL,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "coupon_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupon_redemption_couponId_idx" ON "coupon_redemption"("couponId");
CREATE INDEX IF NOT EXISTS "coupon_redemption_partnerId_idx" ON "coupon_redemption"("partnerId");
CREATE INDEX IF NOT EXISTS "coupon_redemption_orderId_idx" ON "coupon_redemption"("orderId");

-- CreateTable: coupon_settlement
CREATE TABLE IF NOT EXISTS "coupon_settlement" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "denomination" INTEGER NOT NULL,
  "totalDiscountApplied" INTEGER NOT NULL DEFAULT 0,
  "issuerPartnerId" TEXT NOT NULL,
  "redeemPartnerId" TEXT NOT NULL,
  "issuerPayAmount" INTEGER NOT NULL,
  "redeemReceiveAmount" INTEGER NOT NULL,
  "platformCommission" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settledAt" TIMESTAMP(3),

  CONSTRAINT "coupon_settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupon_settlement_couponId_idx" ON "coupon_settlement"("couponId");
CREATE INDEX IF NOT EXISTS "coupon_settlement_status_idx" ON "coupon_settlement"("status");

-- CreateTable: alliance_settlement
CREATE TABLE IF NOT EXISTS "alliance_settlement" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "participants" JSONB NOT NULL DEFAULT '[]',
  "executedParticipants" JSONB,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "approvedAt" TIMESTAMP(3),
  "executedAt" TIMESTAMP(3),
  "refundAmount" INTEGER,
  "returnCount" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "alliance_settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "alliance_settlement_orderId_idx" ON "alliance_settlement"("orderId");
CREATE INDEX IF NOT EXISTS "alliance_settlement_status_idx" ON "alliance_settlement"("status");

-- CreateTable: unlinked_order
CREATE TABLE IF NOT EXISTS "unlinked_order" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL DEFAULT 0,
  "location" JSONB,
  "linkedPartnerId" TEXT,
  "linkStatus" TEXT NOT NULL DEFAULT 'unlinked',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "unlinked_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "unlinked_order_storeId_idx" ON "unlinked_order"("storeId");
CREATE INDEX IF NOT EXISTS "unlinked_order_linkStatus_idx" ON "unlinked_order"("linkStatus");

-- CreateTable: anomaly_transaction
CREATE TABLE IF NOT EXISTS "anomaly_transaction" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "partnerName" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "involvedAmount" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT NOT NULL DEFAULT '',
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "relatedId" TEXT,

  CONSTRAINT "anomaly_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "anomaly_transaction_partnerId_idx" ON "anomaly_transaction"("partnerId");
CREATE INDEX IF NOT EXISTS "anomaly_transaction_type_idx" ON "anomaly_transaction"("type");
CREATE INDEX IF NOT EXISTS "anomaly_transaction_severity_idx" ON "anomaly_transaction"("severity");

-- CreateTable: review_record
CREATE TABLE IF NOT EXISTS "review_record" (
  "id" TEXT NOT NULL,
  "anomalyId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "reviewer" TEXT NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "review_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_record_anomalyId_idx" ON "review_record"("anomalyId");
CREATE INDEX IF NOT EXISTS "review_record_partnerId_idx" ON "review_record"("partnerId");
CREATE INDEX IF NOT EXISTS "review_record_decision_idx" ON "review_record"("decision");

-- CreateTable: data_callback_record
CREATE TABLE IF NOT EXISTS "data_callback_record" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "dataType" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processStatus" TEXT NOT NULL DEFAULT 'pending',
  "processResult" TEXT,

  CONSTRAINT "data_callback_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "data_callback_record_partnerId_idx" ON "data_callback_record"("partnerId");
CREATE INDEX IF NOT EXISTS "data_callback_record_dataType_idx" ON "data_callback_record"("dataType");
CREATE INDEX IF NOT EXISTS "data_callback_record_processStatus_idx" ON "data_callback_record"("processStatus");
