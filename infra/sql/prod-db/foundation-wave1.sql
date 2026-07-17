-- Foundation init wave 1

-- Independent and low-coupling tables

-- IdentityAccount

CREATE TABLE "IdentityAccount" (
    "id" TEXT NOT NULL,
    "subjectType" "IdentitySubjectType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "userId" TEXT,
    "subjectKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "username" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "loginPolicyKey" TEXT,
    "organizationIds" TEXT[],
    "roleKeys" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdentityAccount_subjectKey_key" ON "IdentityAccount"("subjectKey");
CREATE INDEX "IdentityAccount_tenantId_subjectType_idx" ON "IdentityAccount"("tenantId", "subjectType");

-- OrganizationNode

CREATE TABLE "OrganizationNode" (
    "id" TEXT NOT NULL,
    "nodeType" "OrganizationNodeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationNode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrganizationNode_tenantId_nodeType_idx" ON "OrganizationNode"("tenantId", "nodeType");
CREATE UNIQUE INDEX "OrganizationNode_tenantId_code_key" ON "OrganizationNode"("tenantId", "code");

-- AccessPolicy

CREATE TABLE "AccessPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "scopeType" "FoundationScopeType" NOT NULL,
    "name" TEXT NOT NULL,
    "effect" "PolicyEffect" NOT NULL,
    "subjectBindings" JSONB NOT NULL,
    "actions" TEXT[],
    "resources" TEXT[],
    "conditions" JSONB,
    "dataScope" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessPolicy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccessPolicy_scopeType_tenantId_brandId_storeId_idx" ON "AccessPolicy"("scopeType", "tenantId", "brandId", "storeId");

-- GovernanceApproval

CREATE TABLE "GovernanceApproval" (
    "id" TEXT NOT NULL,
    "approvalTicket" TEXT,
    "operation" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceKey" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL DEFAULT 'PLATFORM',
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "requestedBy" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "decisionNote" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GovernanceApproval_approvalTicket_key" ON "GovernanceApproval"("approvalTicket");
CREATE INDEX "GovernanceApproval_status_updatedAt_idx" ON "GovernanceApproval"("status", "updatedAt");
CREATE INDEX "GovernanceApproval_operation_resourceType_resourceKey_idx" ON "GovernanceApproval"("operation", "resourceType", "resourceKey");
CREATE INDEX "GovernanceApproval_scopeType_tenantId_brandId_storeId_idx" ON "GovernanceApproval"("scopeType", "tenantId", "brandId", "storeId");

-- FoundationAlertAcknowledgement

CREATE TABLE "FoundationAlertAcknowledgement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'platform',
    "code" TEXT NOT NULL,
    "status" "FoundationAlertAcknowledgementStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "mutedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundationAlertAcknowledgement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FoundationAlertAcknowledgement_tenantId_status_updatedAt_idx" ON "FoundationAlertAcknowledgement"("tenantId", "status", "updatedAt");
CREATE UNIQUE INDEX "FoundationAlertAcknowledgement_tenantId_code_key" ON "FoundationAlertAcknowledgement"("tenantId", "code");

-- ConfigEntry

CREATE TABLE "ConfigEntry" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueType" "ConfigValueType" NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketProfileId" TEXT,
    "portalSiteId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "value" JSONB NOT NULL,
    "schemaRef" TEXT,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConfigEntry_namespace_key_idx" ON "ConfigEntry"("namespace", "key");
CREATE INDEX "ConfigEntry_scopeType_tenantId_brandId_storeId_marketProfil_idx" ON "ConfigEntry"("scopeType", "tenantId", "brandId", "storeId", "marketProfileId");

-- SecretAsset

CREATE TABLE "SecretAsset" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" "SecretKind" NOT NULL,
    "provider" "SecretProvider" NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "integrationAppId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "reference" TEXT NOT NULL,
    "encryptedPayload" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "rotatedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecretAsset_scopeType_tenantId_brandId_storeId_idx" ON "SecretAsset"("scopeType", "tenantId", "brandId", "storeId");
CREATE UNIQUE INDEX "SecretAsset_key_version_key" ON "SecretAsset"("key", "version");

-- CertificateAsset

CREATE TABLE "CertificateAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "CertificateFormat" NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "secretAssetId" TEXT NOT NULL,
    "domains" TEXT[],
    "fingerprint" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CertificateAsset_scopeType_tenantId_brandId_storeId_idx" ON "CertificateAsset"("scopeType", "tenantId", "brandId", "storeId");
CREATE INDEX "CertificateAsset_expiresAt_idx" ON "CertificateAsset"("expiresAt");

-- DomainEvent

CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketProfileId" TEXT,
    "idempotencyKey" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "availableAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DomainEvent_idempotencyKey_key" ON "DomainEvent"("idempotencyKey");
CREATE INDEX "DomainEvent_status_availableAt_idx" ON "DomainEvent"("status", "availableAt");
CREATE INDEX "DomainEvent_tenantId_aggregateType_aggregateId_idx" ON "DomainEvent"("tenantId", "aggregateType", "aggregateId");

-- WebhookSubscription

CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "integrationAppId" TEXT,
    "topic" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "secretAssetId" TEXT,
    "signatureAlgorithm" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "retryLimit" INTEGER NOT NULL DEFAULT 3,
    "filter" JSONB,
    "headers" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookSubscription_topic_enabled_idx" ON "WebhookSubscription"("topic", "enabled");
CREATE INDEX "WebhookSubscription_scopeType_tenantId_brandId_storeId_idx" ON "WebhookSubscription"("scopeType", "tenantId", "brandId", "storeId");

-- NotificationTemplate

CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" "NotificationChannelType" NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketCode" TEXT,
    "locale" TEXT NOT NULL,
    "titleTemplate" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "variables" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationTemplate_code_channel_locale_idx" ON "NotificationTemplate"("code", "channel", "locale");

-- EdgeNode

CREATE TABLE "EdgeNode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "status" "EdgeNodeStatus" NOT NULL,
    "version" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "capabilities" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdgeNode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EdgeNode_code_key" ON "EdgeNode"("code");
CREATE INDEX "EdgeNode_tenantId_status_idx" ON "EdgeNode"("tenantId", "status");

-- FileAsset

CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "kind" "FileAssetKind" NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketProfileId" TEXT,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "piiLevel" "PiiLevel" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FileAsset_scopeType_tenantId_brandId_storeId_marketProfileI_idx" ON "FileAsset"("scopeType", "tenantId", "brandId", "storeId", "marketProfileId");
CREATE UNIQUE INDEX "FileAsset_bucket_objectKey_key" ON "FileAsset"("bucket", "objectKey");

-- OpenPlatformApp

CREATE TABLE "OpenPlatformApp" (
    "id" TEXT NOT NULL,
    "appType" "OpenPlatformAppType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "appKey" TEXT NOT NULL,
    "appSecretRef" TEXT,
    "redirectUris" TEXT[],
    "webhookTopics" TEXT[],
    "rateLimitPolicyId" TEXT,
    "sandboxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenPlatformApp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpenPlatformApp_appKey_key" ON "OpenPlatformApp"("appKey");
CREATE INDEX "OpenPlatformApp_tenantId_brandId_storeId_status_idx" ON "OpenPlatformApp"("tenantId", "brandId", "storeId", "status");

-- RateLimitPolicy

CREATE TABLE "RateLimitPolicy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "integrationAppId" TEXT,
    "period" "QuotaPeriod" NOT NULL,
    "limit" INTEGER NOT NULL,
    "burstLimit" INTEGER,
    "dimensionKeys" TEXT[],
    "algorithm" TEXT NOT NULL DEFAULT 'TOKEN_BUCKET',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitPolicy_code_key" ON "RateLimitPolicy"("code");
CREATE INDEX "RateLimitPolicy_scopeType_tenantId_brandId_storeId_idx" ON "RateLimitPolicy"("scopeType", "tenantId", "brandId", "storeId");

-- FeatureFlag

CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketProfileId" TEXT,
    "status" "FeatureFlagStatus" NOT NULL,
    "strategy" "RolloutStrategy" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "percentage" INTEGER,
    "allowList" TEXT[],
    "conditions" JSONB,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FeatureFlag_key_status_idx" ON "FeatureFlag"("key", "status");
CREATE INDEX "FeatureFlag_scopeType_tenantId_brandId_storeId_marketProfil_idx" ON "FeatureFlag"("scopeType", "tenantId", "brandId", "storeId", "marketProfileId");

-- BackupSnapshot

CREATE TABLE "BackupSnapshot" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "status" "BackupStatus" NOT NULL,
    "storageUri" TEXT NOT NULL,
    "checksum" TEXT,
    "metadata" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BackupSnapshot_scopeType_tenantId_brandId_storeId_capturedA_idx" ON "BackupSnapshot"("scopeType", "tenantId", "brandId", "storeId", "capturedAt");

-- PiiPolicy

CREATE TABLE "PiiPolicy" (
    "id" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "piiLevel" "PiiLevel" NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketCode" TEXT,
    "maskingStrategy" TEXT NOT NULL,
    "retentionDays" INTEGER,
    "purposeLimit" TEXT[],
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiiPolicy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PiiPolicy_fieldName_piiLevel_idx" ON "PiiPolicy"("fieldName", "piiLevel");
CREATE INDEX "PiiPolicy_scopeType_tenantId_brandId_storeId_marketCode_idx" ON "PiiPolicy"("scopeType", "tenantId", "brandId", "storeId", "marketCode");

-- AiModelConfig

CREATE TABLE "AiModelConfig" (
    "id" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "scopeType" "FoundationScopeType" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "maxInputTokens" INTEGER NOT NULL,
    "maxOutputTokens" INTEGER NOT NULL,
    "costQuotaId" TEXT,
    "safetyPolicyId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModelConfig_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiModelConfig_provider_model_enabled_idx" ON "AiModelConfig"("provider", "model", "enabled");
CREATE INDEX "AiModelConfig_scopeType_tenantId_brandId_storeId_idx" ON "AiModelConfig"("scopeType", "tenantId", "brandId", "storeId");

-- ConfigInstance

CREATE TABLE "ConfigInstance" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "inherits" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT NOT NULL,
    "fromSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigInstance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConfigInstance_level_ownerId_idx" ON "ConfigInstance"("level", "ownerId");
CREATE INDEX "ConfigInstance_key_idx" ON "ConfigInstance"("key");
CREATE UNIQUE INDEX "ConfigInstance_level_ownerId_key_key" ON "ConfigInstance"("level", "ownerId", "key");

-- ConfigAuditLog

CREATE TABLE "ConfigAuditLog" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "operatorRole" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConfigAuditLog_configId_idx" ON "ConfigAuditLog"("configId");
CREATE INDEX "ConfigAuditLog_tenantId_timestamp_idx" ON "ConfigAuditLog"("tenantId", "timestamp");
