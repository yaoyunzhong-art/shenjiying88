# Production DB Foundation Init Plan

## Scope

- Environment: `m5` production namespace
- Database from runtime `DATABASE_URL`: `m5platform`
- Current state: empty PostgreSQL database, no non-system tables
- Source of truth: `apps/api/prisma/schema.prisma`
- Generated baseline SQL: `/tmp/m5-empty-to-schema.sql`

## Verified Facts

- `information_schema.tables` under all non-system schemas returns `0`
- `_prisma_migrations` does not exist
- Local `apps/api/prisma/migrations/` only contains `migration_lock.toml`
- Full schema baseline from empty database requires:
  - `52` tables
  - `30` enums
  - `61` normal indexes
  - `24` unique indexes
  - `35` foreign keys

## Foundation Slice

Foundation-related models currently expected by `schema.prisma`:

1. `IdentityAccount`
2. `OrganizationNode`
3. `OrganizationMembership`
4. `AccessPolicy`
5. `GovernanceApproval`
6. `FoundationAlertAcknowledgement`
7. `ConfigEntry`
8. `ConfigRevision`
9. `SecretAsset`
10. `CertificateAsset`
11. `DomainEvent`
12. `WebhookSubscription`
13. `WebhookDelivery`
14. `NotificationTemplate`
15. `NotificationDispatch`
16. `EdgeNode`
17. `EdgeSyncTask`
18. `FileAsset`
19. `OpenPlatformApp`
20. `RateLimitPolicy`
21. `QuotaLedger`
22. `FeatureFlag`
23. `BackupSnapshot`
24. `RestoreRun`
25. `PiiPolicy`
26. `AiModelConfig`
27. `AiPromptTemplate`
28. `AiExecutionRecord`
29. `ConfigInstance`
30. `ConfigAuditLog`

This foundation slice alone requires:

- `30` tables
- `43` normal indexes
- `14` unique indexes
- `14` foreign keys

## Dependency Graph

Foreign keys inside the foundation slice:

- `OrganizationNode.parentId -> OrganizationNode.id`
- `OrganizationMembership.identityAccountId -> IdentityAccount.id`
- `OrganizationMembership.organizationNodeId -> OrganizationNode.id`
- `ConfigRevision.configEntryId -> ConfigEntry.id`
- `WebhookDelivery.subscriptionId -> WebhookSubscription.id`
- `WebhookDelivery.eventId -> DomainEvent.id`
- `NotificationDispatch.templateId -> NotificationTemplate.id`
- `EdgeSyncTask.edgeNodeId -> EdgeNode.id`
- `EdgeSyncTask.eventId -> DomainEvent.id`
- `QuotaLedger.rateLimitPolicyId -> RateLimitPolicy.id`
- `RestoreRun.backupSnapshotId -> BackupSnapshot.id`
- `AiPromptTemplate.modelConfigId -> AiModelConfig.id`
- `AiExecutionRecord.modelConfigId -> AiModelConfig.id`
- `AiExecutionRecord.promptTemplateId -> AiPromptTemplate.id`

## Recommended Execution Waves

### Wave 0

Create only shared enums first:

- `FoundationScopeType`
- `IdentitySubjectType`
- `OrganizationNodeType`
- `PolicyEffect`
- `ConfigValueType`
- `SecretKind`
- `SecretProvider`
- `CertificateFormat`
- `EventStatus`
- `WebhookDeliveryStatus`
- `NotificationChannelType`
- `NotificationStatus`
- `EdgeNodeStatus`
- `EdgeSyncDirection`
- `FileAssetKind`
- `OpenPlatformAppType`
- `QuotaPeriod`
- `FeatureFlagStatus`
- `RolloutStrategy`
- `ApprovalStatus`
- `FoundationAlertAcknowledgementStatus`
- `BackupStatus`
- `RestoreStatus`
- `PiiLevel`
- `AiProvider`
- `AiExecutionStatus`

### Wave 1

Create independent or low-coupling foundation tables:

- `IdentityAccount`
- `OrganizationNode`
- `AccessPolicy`
- `GovernanceApproval`
- `FoundationAlertAcknowledgement`
- `ConfigEntry`
- `SecretAsset`
- `CertificateAsset`
- `DomainEvent`
- `WebhookSubscription`
- `NotificationTemplate`
- `EdgeNode`
- `FileAsset`
- `OpenPlatformApp`
- `RateLimitPolicy`
- `FeatureFlag`
- `BackupSnapshot`
- `PiiPolicy`
- `AiModelConfig`
- `ConfigInstance`
- `ConfigAuditLog`

### Wave 2

Create dependent tables after wave 1 is confirmed:

- `OrganizationMembership`
- `ConfigRevision`
- `WebhookDelivery`
- `NotificationDispatch`
- `EdgeSyncTask`
- `QuotaLedger`
- `RestoreRun`
- `AiPromptTemplate`
- `AiExecutionRecord`

Note:

- `OrganizationNode` has a self-referencing foreign key, but table creation itself is safe before constraint attach.
- `CertificateAsset` currently has no emitted foreign key in baseline SQL, so it can stay in wave 1.

### Wave 3

Attach foreign keys and verify all indexes:

- apply `14` foundation foreign keys
- validate unique indexes
- validate write/read path with smoke SQL

## Production Change Window

Recommended order for production execution:

1. Confirm maintenance window and owner on-call
2. Backup database metadata and connection details
3. Re-run read-only empty-db verification
4. Execute wave 0 + wave 1
5. Verify table count and enum count
6. Execute wave 2
7. Execute wave 3 foreign keys
8. Run application smoke checks
9. Observe API logs and error rate for at least 15 minutes

## Read-only Verification SQL

```sql
select current_database(), current_schema(), current_user;

select table_schema, count(*) as table_count
from information_schema.tables
where table_schema not in ('pg_catalog', 'information_schema')
group by table_schema
order by table_schema;

select count(*) as public_table_count
from information_schema.tables
where table_schema = 'public';
```

## Post-apply Smoke Checks

```sql
select count(*) from "IdentityAccount";
select count(*) from "ConfigEntry";
select count(*) from "DomainEvent";
select count(*) from "AiModelConfig";
```

## Rollback Principle

- If failure occurs before wave 3 foreign keys, prefer stopping forward change and dropping only newly created empty tables from the current wave
- If failure occurs after foreign key attach, rollback must reverse constraints first, then dependent tables, then parent tables
- Do not mix business seed data into the same transaction as structural initialization
- Do not execute full `52` table baseline in the same window unless application owner explicitly approves

## Generated Artifacts

Generated by `scripts/generate-foundation-sql.mjs`:

- `infra/sql/prod-db/foundation-wave0.sql`
- `infra/sql/prod-db/foundation-wave1.sql`
- `infra/sql/prod-db/foundation-wave2-wave3.sql`
- `infra/sql/prod-db/foundation-verify.sql`

## Execution Commands

Re-generate reviewed artifacts:

```bash
node scripts/generate-foundation-sql.mjs
```

Apply in strict order during the production window:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-verify.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-wave0.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-wave1.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-verify.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-wave2-wave3.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f infra/sql/prod-db/foundation-verify.sql
```

Recommended review rule:

- wave 0 and wave 1 can be reviewed together
- wave 2 and wave 3 stay in one file, but execution should pause after dependent table review before foreign key attach if any anomaly appears
- verification SQL is safe to re-run before and after every wave

## Next Action

Before any write:

1. Review `infra/sql/prod-db/foundation-wave0.sql`
2. Review `infra/sql/prod-db/foundation-wave1.sql`
3. Review `infra/sql/prod-db/foundation-wave2-wave3.sql`
4. Confirm operator, time window, rollback owner, and stop condition
