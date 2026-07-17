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
