-- Foundation init wave 2 and wave 3

-- Dependent tables first, then foreign keys

-- OrganizationMembership

CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "identityAccountId" TEXT NOT NULL,
    "organizationNodeId" TEXT NOT NULL,
    "titles" TEXT[],
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "scope" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrganizationMembership_identityAccountId_organizationNodeId_idx" ON "OrganizationMembership"("identityAccountId", "organizationNodeId");

-- ConfigRevision

CREATE TABLE "ConfigRevision" (
    "id" TEXT NOT NULL,
    "configEntryId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConfigRevision_configEntryId_version_key" ON "ConfigRevision"("configEntryId", "version");

-- WebhookDelivery

CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "eventId" TEXT,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "requestBody" JSONB NOT NULL,
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookDelivery_subscriptionId_status_idx" ON "WebhookDelivery"("subscriptionId", "status");
CREATE INDEX "WebhookDelivery_eventId_idx" ON "WebhookDelivery"("eventId");

-- NotificationDispatch

CREATE TABLE "NotificationDispatch" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "channel" "NotificationChannelType" NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "providerResponse" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDispatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationDispatch_status_scheduledAt_idx" ON "NotificationDispatch"("status", "scheduledAt");
CREATE INDEX "NotificationDispatch_scopeType_tenantId_brandId_storeId_idx" ON "NotificationDispatch"("scopeType", "tenantId", "brandId", "storeId");

-- EdgeSyncTask

CREATE TABLE "EdgeSyncTask" (
    "id" TEXT NOT NULL,
    "edgeNodeId" TEXT NOT NULL,
    "eventId" TEXT,
    "direction" "EdgeSyncDirection" NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "checksum" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "EdgeSyncTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EdgeSyncTask_edgeNodeId_status_idx" ON "EdgeSyncTask"("edgeNodeId", "status");
CREATE INDEX "EdgeSyncTask_eventId_idx" ON "EdgeSyncTask"("eventId");

-- QuotaLedger

CREATE TABLE "QuotaLedger" (
    "id" TEXT NOT NULL,
    "rateLimitPolicyId" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "period" "QuotaPeriod" NOT NULL,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "remaining" INTEGER,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotaLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuotaLedger_subjectKey_resetAt_idx" ON "QuotaLedger"("subjectKey", "resetAt");
CREATE UNIQUE INDEX "QuotaLedger_rateLimitPolicyId_subjectKey_resetAt_key" ON "QuotaLedger"("rateLimitPolicyId", "subjectKey", "resetAt");

-- RestoreRun

CREATE TABLE "RestoreRun" (
    "id" TEXT NOT NULL,
    "backupSnapshotId" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "status" "RestoreStatus" NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "targetEnvironment" TEXT NOT NULL,
    "validationReport" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestoreRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RestoreRun_status_createdAt_idx" ON "RestoreRun"("status", "createdAt");

-- AiPromptTemplate

CREATE TABLE "AiPromptTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "modelConfigId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "variables" TEXT[],
    "outputSchema" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiPromptTemplate_code_version_modelConfigId_key" ON "AiPromptTemplate"("code", "version", "modelConfigId");

-- AiExecutionRecord

CREATE TABLE "AiExecutionRecord" (
    "id" TEXT NOT NULL,
    "modelConfigId" TEXT NOT NULL,
    "promptTemplateId" TEXT,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "status" "AiExecutionStatus" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "escalatedToHuman" BOOLEAN NOT NULL DEFAULT false,
    "reviewerId" TEXT,
    "safetyResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiExecutionRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiExecutionRecord_status_createdAt_idx" ON "AiExecutionRecord"("status", "createdAt");
CREATE INDEX "AiExecutionRecord_scopeType_tenantId_brandId_storeId_idx" ON "AiExecutionRecord"("scopeType", "tenantId", "brandId", "storeId");

-- Foundation foreign keys

ALTER TABLE "OrganizationNode" ADD CONSTRAINT "OrganizationNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrganizationNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_identityAccountId_fkey" FOREIGN KEY ("identityAccountId") REFERENCES "IdentityAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationNodeId_fkey" FOREIGN KEY ("organizationNodeId") REFERENCES "OrganizationNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConfigRevision" ADD CONSTRAINT "ConfigRevision_configEntryId_fkey" FOREIGN KEY ("configEntryId") REFERENCES "ConfigEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DomainEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationDispatch" ADD CONSTRAINT "NotificationDispatch_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EdgeSyncTask" ADD CONSTRAINT "EdgeSyncTask_edgeNodeId_fkey" FOREIGN KEY ("edgeNodeId") REFERENCES "EdgeNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EdgeSyncTask" ADD CONSTRAINT "EdgeSyncTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DomainEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuotaLedger" ADD CONSTRAINT "QuotaLedger_rateLimitPolicyId_fkey" FOREIGN KEY ("rateLimitPolicyId") REFERENCES "RateLimitPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RestoreRun" ADD CONSTRAINT "RestoreRun_backupSnapshotId_fkey" FOREIGN KEY ("backupSnapshotId") REFERENCES "BackupSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiPromptTemplate" ADD CONSTRAINT "AiPromptTemplate_modelConfigId_fkey" FOREIGN KEY ("modelConfigId") REFERENCES "AiModelConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiExecutionRecord" ADD CONSTRAINT "AiExecutionRecord_modelConfigId_fkey" FOREIGN KEY ("modelConfigId") REFERENCES "AiModelConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiExecutionRecord" ADD CONSTRAINT "AiExecutionRecord_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "AiPromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
