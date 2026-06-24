-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PortalScopeType" AS ENUM ('TENANT', 'BRAND', 'STORE');

-- CreateEnum
CREATE TYPE "PortalAudience" AS ENUM ('TOC', 'TOB');

-- CreateEnum
CREATE TYPE "PortalChannel" AS ENUM ('WEB', 'H5', 'MINIAPP', 'APP', 'PC', 'PAD');

-- CreateEnum
CREATE TYPE "ConfigInheritanceMode" AS ENUM ('PLATFORM_DEFAULT', 'TENANT_DEFAULT', 'BRAND_OVERRIDE', 'STORE_OVERRIDE');

-- CreateEnum
CREATE TYPE "FoundationScopeType" AS ENUM ('PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "IdentitySubjectType" AS ENUM ('PLATFORM_USER', 'TENANT_USER', 'BRAND_USER', 'STORE_USER', 'EMPLOYEE', 'MEMBER', 'DEVICE', 'SERVICE_ACCOUNT');

-- CreateEnum
CREATE TYPE "OrganizationNodeType" AS ENUM ('PLATFORM', 'TENANT', 'BRAND', 'REGION', 'STORE', 'DEPARTMENT', 'TEAM');

-- CreateEnum
CREATE TYPE "PolicyEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "ConfigValueType" AS ENUM ('JSON', 'STRING', 'NUMBER', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "SecretKind" AS ENUM ('API_KEY', 'ACCESS_TOKEN', 'REFRESH_TOKEN', 'PASSWORD', 'CERTIFICATE', 'PRIVATE_KEY', 'PUBLIC_KEY', 'WEBHOOK_SECRET');

-- CreateEnum
CREATE TYPE "SecretProvider" AS ENUM ('DATABASE', 'VAULT', 'KMS', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "CertificateFormat" AS ENUM ('PEM', 'PFX', 'JKS');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "NotificationChannelType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK', 'SOCIAL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EdgeNodeStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "EdgeSyncDirection" AS ENUM ('UPSTREAM', 'DOWNSTREAM', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "FileAssetKind" AS ENUM ('AVATAR', 'IMAGE', 'VIDEO', 'DOCUMENT', 'ARCHIVE', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "OpenPlatformAppType" AS ENUM ('INTERNAL', 'ISV', 'PARTNER');

-- CreateEnum
CREATE TYPE "QuotaPeriod" AS ENUM ('MINUTE', 'HOUR', 'DAY', 'MONTH');

-- CreateEnum
CREATE TYPE "FeatureFlagStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RolloutStrategy" AS ENUM ('ALL', 'PERCENTAGE', 'ALLOW_LIST', 'SCOPE_MATCH');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RestoreStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PiiLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'SENSITIVE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('OPENAI', 'AZURE_OPENAI', 'ANTHROPIC', 'GEMINI', 'DEEPSEEK');

-- CreateEnum
CREATE TYPE "AiExecutionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'ESCALATED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "defaultMarketProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultMarketProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultMarketProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "growthValue" INTEGER NOT NULL DEFAULT 0,
    "svipStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT,
    "storeId" TEXT,
    "scopeType" "FoundationScopeType" NOT NULL DEFAULT 'TENANT',
    "action" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "operatorType" "IdentitySubjectType" NOT NULL DEFAULT 'TENANT_USER',
    "resourceType" TEXT,
    "resourceId" TEXT,
    "sourceChannel" TEXT,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "purpose" TEXT,
    "payload" JSONB,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LytConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "authMode" TEXT NOT NULL,
    "credential" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LytConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketProfile" (
    "id" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "defaultLanguage" TEXT NOT NULL,
    "supportedLanguages" TEXT[],
    "timezone" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "currencySymbol" TEXT NOT NULL,
    "taxMode" TEXT NOT NULL,
    "taxLabel" TEXT NOT NULL,
    "taxRate" DECIMAL(5,2),
    "networkRegion" TEXT NOT NULL,
    "apiBaseUrl" TEXT NOT NULL,
    "cdnBaseUrl" TEXT NOT NULL,
    "callbackBaseUrl" TEXT,
    "emailProvider" TEXT NOT NULL,
    "emailFromName" TEXT NOT NULL,
    "emailFromAddress" TEXT NOT NULL,
    "emailReplyTo" TEXT,
    "socialDefaults" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalConfig" (
    "id" TEXT NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "localePolicy" JSONB NOT NULL,
    "timezonePolicy" JSONB NOT NULL,
    "currencyPolicy" JSONB NOT NULL,
    "taxPolicy" JSONB NOT NULL,
    "networkPolicy" JSONB NOT NULL,
    "emailPolicy" JSONB NOT NULL,
    "socialPolicy" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalConfigOverride" (
    "id" TEXT NOT NULL,
    "scopeType" "PortalScopeType" NOT NULL,
    "inheritanceMode" "ConfigInheritanceMode" NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "regionalConfigId" TEXT,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "localeOverride" JSONB,
    "timezoneOverride" JSONB,
    "currencyOverride" JSONB,
    "taxOverride" JSONB,
    "networkOverride" JSONB,
    "emailOverride" JSONB,
    "socialOverride" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalConfigOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalSite" (
    "id" TEXT NOT NULL,
    "scopeType" "PortalScopeType" NOT NULL,
    "audience" "PortalAudience" NOT NULL,
    "channel" "PortalChannel" NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "storeId" TEXT,
    "marketProfileId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "pathPrefix" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "loginPath" TEXT,
    "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "solutionTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailChannelConfig" (
    "id" TEXT NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "replyTo" TEXT,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailChannelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialChannelConfig" (
    "id" TEXT NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT,
    "profileUrl" TEXT,
    "usage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialChannelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPolicyConfig" (
    "id" TEXT NOT NULL,
    "marketProfileId" TEXT NOT NULL,
    "taxMode" TEXT NOT NULL,
    "taxLabel" TEXT NOT NULL,
    "taxRate" DECIMAL(5,2),
    "invoiceProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxPolicyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_tenantId_code_key" ON "Brand"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Store_brandId_code_key" ON "Store"("brandId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_action_createdAt_idx" ON "AuditLog"("tenantId", "action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketProfile_marketCode_key" ON "MarketProfile"("marketCode");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityAccount_subjectKey_key" ON "IdentityAccount"("subjectKey");

-- CreateIndex
CREATE INDEX "IdentityAccount_tenantId_subjectType_idx" ON "IdentityAccount"("tenantId", "subjectType");

-- CreateIndex
CREATE INDEX "OrganizationNode_tenantId_nodeType_idx" ON "OrganizationNode"("tenantId", "nodeType");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationNode_tenantId_code_key" ON "OrganizationNode"("tenantId", "code");

-- CreateIndex
CREATE INDEX "OrganizationMembership_identityAccountId_organizationNodeId_idx" ON "OrganizationMembership"("identityAccountId", "organizationNodeId");

-- CreateIndex
CREATE INDEX "AccessPolicy_scopeType_tenantId_brandId_storeId_idx" ON "AccessPolicy"("scopeType", "tenantId", "brandId", "storeId");

-- CreateIndex
CREATE INDEX "ConfigEntry_namespace_key_idx" ON "ConfigEntry"("namespace", "key");

-- CreateIndex
CREATE INDEX "ConfigEntry_scopeType_tenantId_brandId_storeId_marketProfil_idx" ON "ConfigEntry"("scopeType", "tenantId", "brandId", "storeId", "marketProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigRevision_configEntryId_version_key" ON "ConfigRevision"("configEntryId", "version");

-- CreateIndex
CREATE INDEX "SecretAsset_scopeType_tenantId_brandId_storeId_idx" ON "SecretAsset"("scopeType", "tenantId", "brandId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "SecretAsset_key_version_key" ON "SecretAsset"("key", "version");

-- CreateIndex
CREATE INDEX "CertificateAsset_scopeType_tenantId_brandId_storeId_idx" ON "CertificateAsset"("scopeType", "tenantId", "brandId", "storeId");

-- CreateIndex
CREATE INDEX "CertificateAsset_expiresAt_idx" ON "CertificateAsset"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DomainEvent_idempotencyKey_key" ON "DomainEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DomainEvent_status_availableAt_idx" ON "DomainEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "DomainEvent_tenantId_aggregateType_aggregateId_idx" ON "DomainEvent"("tenantId", "aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "WebhookSubscription_topic_enabled_idx" ON "WebhookSubscription"("topic", "enabled");

-- CreateIndex
CREATE INDEX "WebhookSubscription_scopeType_tenantId_brandId_storeId_idx" ON "WebhookSubscription"("scopeType", "tenantId", "brandId", "storeId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_subscriptionId_status_idx" ON "WebhookDelivery"("subscriptionId", "status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_eventId_idx" ON "WebhookDelivery"("eventId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_code_channel_locale_idx" ON "NotificationTemplate"("code", "channel", "locale");

-- CreateIndex
CREATE INDEX "NotificationDispatch_status_scheduledAt_idx" ON "NotificationDispatch"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NotificationDispatch_scopeType_tenantId_brandId_storeId_idx" ON "NotificationDispatch"("scopeType", "tenantId", "brandId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "EdgeNode_code_key" ON "EdgeNode"("code");

-- CreateIndex
CREATE INDEX "EdgeNode_tenantId_status_idx" ON "EdgeNode"("tenantId", "status");

-- CreateIndex
CREATE INDEX "EdgeSyncTask_edgeNodeId_status_idx" ON "EdgeSyncTask"("edgeNodeId", "status");

-- CreateIndex
CREATE INDEX "EdgeSyncTask_eventId_idx" ON "EdgeSyncTask"("eventId");

-- CreateIndex
CREATE INDEX "FileAsset_scopeType_tenantId_brandId_storeId_marketProfileI_idx" ON "FileAsset"("scopeType", "tenantId", "brandId", "storeId", "marketProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_bucket_objectKey_key" ON "FileAsset"("bucket", "objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "OpenPlatformApp_appKey_key" ON "OpenPlatformApp"("appKey");

-- CreateIndex
CREATE INDEX "OpenPlatformApp_tenantId_brandId_storeId_status_idx" ON "OpenPlatformApp"("tenantId", "brandId", "storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitPolicy_code_key" ON "RateLimitPolicy"("code");

-- CreateIndex
CREATE INDEX "RateLimitPolicy_scopeType_tenantId_brandId_storeId_idx" ON "RateLimitPolicy"("scopeType", "tenantId", "brandId", "storeId");

-- CreateIndex
CREATE INDEX "QuotaLedger_subjectKey_resetAt_idx" ON "QuotaLedger"("subjectKey", "resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuotaLedger_rateLimitPolicyId_subjectKey_resetAt_key" ON "QuotaLedger"("rateLimitPolicyId", "subjectKey", "resetAt");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_status_idx" ON "FeatureFlag"("key", "status");

-- CreateIndex
CREATE INDEX "FeatureFlag_scopeType_tenantId_brandId_storeId_marketProfil_idx" ON "FeatureFlag"("scopeType", "tenantId", "brandId", "storeId", "marketProfileId");

-- CreateIndex
CREATE INDEX "BackupSnapshot_scopeType_tenantId_brandId_storeId_capturedA_idx" ON "BackupSnapshot"("scopeType", "tenantId", "brandId", "storeId", "capturedAt");

-- CreateIndex
CREATE INDEX "RestoreRun_status_createdAt_idx" ON "RestoreRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PiiPolicy_fieldName_piiLevel_idx" ON "PiiPolicy"("fieldName", "piiLevel");

-- CreateIndex
CREATE INDEX "PiiPolicy_scopeType_tenantId_brandId_storeId_marketCode_idx" ON "PiiPolicy"("scopeType", "tenantId", "brandId", "storeId", "marketCode");

-- CreateIndex
CREATE INDEX "AiModelConfig_provider_model_enabled_idx" ON "AiModelConfig"("provider", "model", "enabled");

-- CreateIndex
CREATE INDEX "AiModelConfig_scopeType_tenantId_brandId_storeId_idx" ON "AiModelConfig"("scopeType", "tenantId", "brandId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptTemplate_code_version_modelConfigId_key" ON "AiPromptTemplate"("code", "version", "modelConfigId");

-- CreateIndex
CREATE INDEX "AiExecutionRecord_status_createdAt_idx" ON "AiExecutionRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AiExecutionRecord_scopeType_tenantId_brandId_storeId_idx" ON "AiExecutionRecord"("scopeType", "tenantId", "brandId", "storeId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_defaultMarketProfileId_fkey" FOREIGN KEY ("defaultMarketProfileId") REFERENCES "MarketProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_defaultMarketProfileId_fkey" FOREIGN KEY ("defaultMarketProfileId") REFERENCES "MarketProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_defaultMarketProfileId_fkey" FOREIGN KEY ("defaultMarketProfileId") REFERENCES "MarketProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalConfig" ADD CONSTRAINT "RegionalConfig_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_regionalConfigId_fkey" FOREIGN KEY ("regionalConfigId") REFERENCES "RegionalConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalConfigOverride" ADD CONSTRAINT "RegionalConfigOverride_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalSite" ADD CONSTRAINT "PortalSite_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalSite" ADD CONSTRAINT "PortalSite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalSite" ADD CONSTRAINT "PortalSite_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalSite" ADD CONSTRAINT "PortalSite_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailChannelConfig" ADD CONSTRAINT "EmailChannelConfig_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialChannelConfig" ADD CONSTRAINT "SocialChannelConfig_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPolicyConfig" ADD CONSTRAINT "TaxPolicyConfig_marketProfileId_fkey" FOREIGN KEY ("marketProfileId") REFERENCES "MarketProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationNode" ADD CONSTRAINT "OrganizationNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrganizationNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_identityAccountId_fkey" FOREIGN KEY ("identityAccountId") REFERENCES "IdentityAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationNodeId_fkey" FOREIGN KEY ("organizationNodeId") REFERENCES "OrganizationNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigRevision" ADD CONSTRAINT "ConfigRevision_configEntryId_fkey" FOREIGN KEY ("configEntryId") REFERENCES "ConfigEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DomainEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDispatch" ADD CONSTRAINT "NotificationDispatch_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdgeSyncTask" ADD CONSTRAINT "EdgeSyncTask_edgeNodeId_fkey" FOREIGN KEY ("edgeNodeId") REFERENCES "EdgeNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdgeSyncTask" ADD CONSTRAINT "EdgeSyncTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DomainEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotaLedger" ADD CONSTRAINT "QuotaLedger_rateLimitPolicyId_fkey" FOREIGN KEY ("rateLimitPolicyId") REFERENCES "RateLimitPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreRun" ADD CONSTRAINT "RestoreRun_backupSnapshotId_fkey" FOREIGN KEY ("backupSnapshotId") REFERENCES "BackupSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPromptTemplate" ADD CONSTRAINT "AiPromptTemplate_modelConfigId_fkey" FOREIGN KEY ("modelConfigId") REFERENCES "AiModelConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExecutionRecord" ADD CONSTRAINT "AiExecutionRecord_modelConfigId_fkey" FOREIGN KEY ("modelConfigId") REFERENCES "AiModelConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExecutionRecord" ADD CONSTRAINT "AiExecutionRecord_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "AiPromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

