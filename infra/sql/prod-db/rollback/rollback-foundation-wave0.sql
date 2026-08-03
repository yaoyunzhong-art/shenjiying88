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
