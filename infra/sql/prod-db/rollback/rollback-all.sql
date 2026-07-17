-- Rollback entire bootstrap plan

-- Empty-table rollback only; review before use

-- Rollback phase D

-- Empty-table rollback only

-- Drop tables

DROP TABLE IF EXISTS "MemberOperationsTask";
DROP TABLE IF EXISTS "MemberOperationsExecutionReceipt";
DROP TABLE IF EXISTS "AuditLog";
DROP TABLE IF EXISTS "LytConnection";
DROP TABLE IF EXISTS "marketing_push_decision_log";
DROP TABLE IF EXISTS "inspection_task";

-- Rollback phase C

-- Empty-table rollback only

-- Drop tables

DROP TABLE IF EXISTS "MemberProfile";
DROP TABLE IF EXISTS "MemberProfileExtension";
DROP TABLE IF EXISTS "LytMemberSnapshot";
DROP TABLE IF EXISTS "LytOrderSnapshot";
DROP TABLE IF EXISTS "LytPaymentSnapshot";

-- Rollback phase B

-- Drop foreign keys first, then tables

-- Drop constraints for RegionalConfig

ALTER TABLE IF EXISTS "RegionalConfig" DROP CONSTRAINT IF EXISTS "RegionalConfig_marketProfileId_fkey";

-- Drop constraints for RegionalConfigOverride

ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_marketProfileId_fkey";
ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_regionalConfigId_fkey";
ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_tenantId_fkey";
ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_brandId_fkey";
ALTER TABLE IF EXISTS "RegionalConfigOverride" DROP CONSTRAINT IF EXISTS "RegionalConfigOverride_storeId_fkey";

-- Drop constraints for PortalSite

ALTER TABLE IF EXISTS "PortalSite" DROP CONSTRAINT IF EXISTS "PortalSite_marketProfileId_fkey";
ALTER TABLE IF EXISTS "PortalSite" DROP CONSTRAINT IF EXISTS "PortalSite_tenantId_fkey";
ALTER TABLE IF EXISTS "PortalSite" DROP CONSTRAINT IF EXISTS "PortalSite_brandId_fkey";
ALTER TABLE IF EXISTS "PortalSite" DROP CONSTRAINT IF EXISTS "PortalSite_storeId_fkey";

-- Drop constraints for EmailChannelConfig

ALTER TABLE IF EXISTS "EmailChannelConfig" DROP CONSTRAINT IF EXISTS "EmailChannelConfig_marketProfileId_fkey";

-- Drop constraints for SocialChannelConfig

ALTER TABLE IF EXISTS "SocialChannelConfig" DROP CONSTRAINT IF EXISTS "SocialChannelConfig_marketProfileId_fkey";

-- Drop constraints for TaxPolicyConfig

ALTER TABLE IF EXISTS "TaxPolicyConfig" DROP CONSTRAINT IF EXISTS "TaxPolicyConfig_marketProfileId_fkey";

-- Drop tables

DROP TABLE IF EXISTS "TaxPolicyConfig";
DROP TABLE IF EXISTS "SocialChannelConfig";
DROP TABLE IF EXISTS "EmailChannelConfig";
DROP TABLE IF EXISTS "PortalSite";
DROP TABLE IF EXISTS "RegionalConfigOverride";
DROP TABLE IF EXISTS "RegionalConfig";

-- Rollback phase A

-- Drop foreign keys first, then tables

-- Drop constraints for User

ALTER TABLE IF EXISTS "User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";

-- Drop constraints for Store

ALTER TABLE IF EXISTS "Store" DROP CONSTRAINT IF EXISTS "Store_defaultMarketProfileId_fkey";
ALTER TABLE IF EXISTS "Store" DROP CONSTRAINT IF EXISTS "Store_brandId_fkey";
ALTER TABLE IF EXISTS "Store" DROP CONSTRAINT IF EXISTS "Store_tenantId_fkey";

-- Drop constraints for Brand

ALTER TABLE IF EXISTS "Brand" DROP CONSTRAINT IF EXISTS "Brand_defaultMarketProfileId_fkey";
ALTER TABLE IF EXISTS "Brand" DROP CONSTRAINT IF EXISTS "Brand_tenantId_fkey";

-- Drop constraints for Tenant

ALTER TABLE IF EXISTS "Tenant" DROP CONSTRAINT IF EXISTS "Tenant_defaultMarketProfileId_fkey";

-- Drop tables

DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "Store";
DROP TABLE IF EXISTS "Brand";
DROP TABLE IF EXISTS "Tenant";
DROP TABLE IF EXISTS "MarketProfile";

-- Rollback remaining wave 0 enums

-- Drop only if no dependent objects remain

-- Drop enum types

DROP TYPE IF EXISTS "ConfigInheritanceMode";
DROP TYPE IF EXISTS "PortalChannel";
DROP TYPE IF EXISTS "PortalAudience";
DROP TYPE IF EXISTS "PortalScopeType";

-- Rollback foundation wave 2 and wave 3

-- Drop foreign keys first, then dependent tables

-- Drop constraints for AiExecutionRecord

ALTER TABLE IF EXISTS "AiExecutionRecord" DROP CONSTRAINT IF EXISTS "AiExecutionRecord_promptTemplateId_fkey";
ALTER TABLE IF EXISTS "AiExecutionRecord" DROP CONSTRAINT IF EXISTS "AiExecutionRecord_modelConfigId_fkey";

-- Drop constraints for AiPromptTemplate

ALTER TABLE IF EXISTS "AiPromptTemplate" DROP CONSTRAINT IF EXISTS "AiPromptTemplate_modelConfigId_fkey";

-- Drop constraints for RestoreRun

ALTER TABLE IF EXISTS "RestoreRun" DROP CONSTRAINT IF EXISTS "RestoreRun_backupSnapshotId_fkey";

-- Drop constraints for QuotaLedger

ALTER TABLE IF EXISTS "QuotaLedger" DROP CONSTRAINT IF EXISTS "QuotaLedger_rateLimitPolicyId_fkey";

-- Drop constraints for EdgeSyncTask

ALTER TABLE IF EXISTS "EdgeSyncTask" DROP CONSTRAINT IF EXISTS "EdgeSyncTask_eventId_fkey";
ALTER TABLE IF EXISTS "EdgeSyncTask" DROP CONSTRAINT IF EXISTS "EdgeSyncTask_edgeNodeId_fkey";

-- Drop constraints for NotificationDispatch

ALTER TABLE IF EXISTS "NotificationDispatch" DROP CONSTRAINT IF EXISTS "NotificationDispatch_templateId_fkey";

-- Drop constraints for WebhookDelivery

ALTER TABLE IF EXISTS "WebhookDelivery" DROP CONSTRAINT IF EXISTS "WebhookDelivery_eventId_fkey";
ALTER TABLE IF EXISTS "WebhookDelivery" DROP CONSTRAINT IF EXISTS "WebhookDelivery_subscriptionId_fkey";

-- Drop constraints for ConfigRevision

ALTER TABLE IF EXISTS "ConfigRevision" DROP CONSTRAINT IF EXISTS "ConfigRevision_configEntryId_fkey";

-- Drop constraints for OrganizationMembership

ALTER TABLE IF EXISTS "OrganizationMembership" DROP CONSTRAINT IF EXISTS "OrganizationMembership_organizationNodeId_fkey";
ALTER TABLE IF EXISTS "OrganizationMembership" DROP CONSTRAINT IF EXISTS "OrganizationMembership_identityAccountId_fkey";

-- Drop constraints for OrganizationNode

ALTER TABLE IF EXISTS "OrganizationNode" DROP CONSTRAINT IF EXISTS "OrganizationNode_parentId_fkey";

-- Drop tables

DROP TABLE IF EXISTS "AiExecutionRecord";
DROP TABLE IF EXISTS "AiPromptTemplate";
DROP TABLE IF EXISTS "RestoreRun";
DROP TABLE IF EXISTS "QuotaLedger";
DROP TABLE IF EXISTS "EdgeSyncTask";
DROP TABLE IF EXISTS "NotificationDispatch";
DROP TABLE IF EXISTS "WebhookDelivery";
DROP TABLE IF EXISTS "ConfigRevision";
DROP TABLE IF EXISTS "OrganizationMembership";

-- Rollback foundation wave 1

-- Empty-table rollback only

-- Drop tables

DROP TABLE IF EXISTS "ConfigAuditLog";
DROP TABLE IF EXISTS "ConfigInstance";
DROP TABLE IF EXISTS "AiModelConfig";
DROP TABLE IF EXISTS "PiiPolicy";
DROP TABLE IF EXISTS "BackupSnapshot";
DROP TABLE IF EXISTS "FeatureFlag";
DROP TABLE IF EXISTS "RateLimitPolicy";
DROP TABLE IF EXISTS "OpenPlatformApp";
DROP TABLE IF EXISTS "FileAsset";
DROP TABLE IF EXISTS "EdgeNode";
DROP TABLE IF EXISTS "NotificationTemplate";
DROP TABLE IF EXISTS "WebhookSubscription";
DROP TABLE IF EXISTS "DomainEvent";
DROP TABLE IF EXISTS "CertificateAsset";
DROP TABLE IF EXISTS "SecretAsset";
DROP TABLE IF EXISTS "ConfigEntry";
DROP TABLE IF EXISTS "FoundationAlertAcknowledgement";
DROP TABLE IF EXISTS "GovernanceApproval";
DROP TABLE IF EXISTS "AccessPolicy";
DROP TABLE IF EXISTS "OrganizationNode";
DROP TABLE IF EXISTS "IdentityAccount";

-- Rollback foundation wave 0 enums

-- Drop only if no dependent objects remain

-- Drop enum types

DROP TYPE IF EXISTS "AiExecutionStatus";
DROP TYPE IF EXISTS "AiProvider";
DROP TYPE IF EXISTS "PiiLevel";
DROP TYPE IF EXISTS "RestoreStatus";
DROP TYPE IF EXISTS "BackupStatus";
DROP TYPE IF EXISTS "FoundationAlertAcknowledgementStatus";
DROP TYPE IF EXISTS "ApprovalStatus";
DROP TYPE IF EXISTS "RolloutStrategy";
DROP TYPE IF EXISTS "FeatureFlagStatus";
DROP TYPE IF EXISTS "QuotaPeriod";
DROP TYPE IF EXISTS "OpenPlatformAppType";
DROP TYPE IF EXISTS "FileAssetKind";
DROP TYPE IF EXISTS "EdgeSyncDirection";
DROP TYPE IF EXISTS "EdgeNodeStatus";
DROP TYPE IF EXISTS "NotificationStatus";
DROP TYPE IF EXISTS "NotificationChannelType";
DROP TYPE IF EXISTS "WebhookDeliveryStatus";
DROP TYPE IF EXISTS "EventStatus";
DROP TYPE IF EXISTS "CertificateFormat";
DROP TYPE IF EXISTS "SecretProvider";
DROP TYPE IF EXISTS "SecretKind";
DROP TYPE IF EXISTS "ConfigValueType";
DROP TYPE IF EXISTS "PolicyEffect";
DROP TYPE IF EXISTS "OrganizationNodeType";
DROP TYPE IF EXISTS "IdentitySubjectType";
DROP TYPE IF EXISTS "FoundationScopeType";
