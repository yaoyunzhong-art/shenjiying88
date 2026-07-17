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
