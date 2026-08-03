import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const baselinePath = "/tmp/m5-empty-to-schema.sql";
const outDir = path.join(cwd, "infra/sql/prod-db");
const rollbackDir = path.join(outDir, "rollback");

const wave0Enums = [
  "FoundationScopeType",
  "IdentitySubjectType",
  "OrganizationNodeType",
  "PolicyEffect",
  "ConfigValueType",
  "SecretKind",
  "SecretProvider",
  "CertificateFormat",
  "EventStatus",
  "WebhookDeliveryStatus",
  "NotificationChannelType",
  "NotificationStatus",
  "EdgeNodeStatus",
  "EdgeSyncDirection",
  "FileAssetKind",
  "OpenPlatformAppType",
  "QuotaPeriod",
  "FeatureFlagStatus",
  "RolloutStrategy",
  "ApprovalStatus",
  "FoundationAlertAcknowledgementStatus",
  "BackupStatus",
  "RestoreStatus",
  "PiiLevel",
  "AiProvider",
  "AiExecutionStatus",
];

const wave1Tables = [
  "IdentityAccount",
  "OrganizationNode",
  "AccessPolicy",
  "GovernanceApproval",
  "FoundationAlertAcknowledgement",
  "ConfigEntry",
  "SecretAsset",
  "CertificateAsset",
  "DomainEvent",
  "WebhookSubscription",
  "NotificationTemplate",
  "EdgeNode",
  "FileAsset",
  "OpenPlatformApp",
  "RateLimitPolicy",
  "FeatureFlag",
  "BackupSnapshot",
  "PiiPolicy",
  "AiModelConfig",
  "ConfigInstance",
  "ConfigAuditLog",
];

const wave2Tables = [
  "OrganizationMembership",
  "ConfigRevision",
  "WebhookDelivery",
  "NotificationDispatch",
  "EdgeSyncTask",
  "QuotaLedger",
  "RestoreRun",
  "AiPromptTemplate",
  "AiExecutionRecord",
];

const wave3ForeignKeys = [
  "OrganizationNode_parentId_fkey",
  "OrganizationMembership_identityAccountId_fkey",
  "OrganizationMembership_organizationNodeId_fkey",
  "ConfigRevision_configEntryId_fkey",
  "WebhookDelivery_subscriptionId_fkey",
  "WebhookDelivery_eventId_fkey",
  "NotificationDispatch_templateId_fkey",
  "EdgeSyncTask_edgeNodeId_fkey",
  "EdgeSyncTask_eventId_fkey",
  "QuotaLedger_rateLimitPolicyId_fkey",
  "RestoreRun_backupSnapshotId_fkey",
  "AiPromptTemplate_modelConfigId_fkey",
  "AiExecutionRecord_modelConfigId_fkey",
  "AiExecutionRecord_promptTemplateId_fkey",
];

const remainingWave0Enums = [
  "PortalScopeType",
  "PortalAudience",
  "PortalChannel",
  "ConfigInheritanceMode",
];

const phaseATables = ["MarketProfile", "Tenant", "Brand", "Store", "User"];

const phaseBTables = [
  "RegionalConfig",
  "RegionalConfigOverride",
  "PortalSite",
  "EmailChannelConfig",
  "SocialChannelConfig",
  "TaxPolicyConfig",
];

const phaseCTables = [
  "MemberProfile",
  "MemberProfileExtension",
  "LytMemberSnapshot",
  "LytOrderSnapshot",
  "LytPaymentSnapshot",
];

const phaseDTables = [
  "MemberOperationsTask",
  "MemberOperationsExecutionReceipt",
  "AuditLog",
  "LytConnection",
  "marketing_push_decision_log",
  "inspection_task",
];

const phaseAForeignKeys = [
  "Tenant_defaultMarketProfileId_fkey",
  "Brand_tenantId_fkey",
  "Brand_defaultMarketProfileId_fkey",
  "Store_tenantId_fkey",
  "Store_brandId_fkey",
  "Store_defaultMarketProfileId_fkey",
  "User_tenantId_fkey",
];

const phaseBForeignKeys = [
  "RegionalConfig_marketProfileId_fkey",
  "RegionalConfigOverride_marketProfileId_fkey",
  "RegionalConfigOverride_regionalConfigId_fkey",
  "RegionalConfigOverride_tenantId_fkey",
  "RegionalConfigOverride_brandId_fkey",
  "RegionalConfigOverride_storeId_fkey",
  "PortalSite_marketProfileId_fkey",
  "PortalSite_tenantId_fkey",
  "PortalSite_brandId_fkey",
  "PortalSite_storeId_fkey",
  "EmailChannelConfig_marketProfileId_fkey",
  "SocialChannelConfig_marketProfileId_fkey",
  "TaxPolicyConfig_marketProfileId_fkey",
];

function main() {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Baseline SQL not found: ${baselinePath}`);
  }

  const baseline = fs.readFileSync(baselinePath, "utf8");
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(rollbackDir, { recursive: true });

  writeFile(
    "foundation-wave0.sql",
    [
      "-- Foundation init wave 0",
      "-- Shared enums only",
      'CREATE SCHEMA IF NOT EXISTS "public";',
      ...wave0Enums.map((name) => extractEnum(baseline, name)),
    ],
  );

  writeFile(
    "foundation-wave1.sql",
    [
      "-- Foundation init wave 1",
      "-- Independent and low-coupling tables",
      ...wave1Tables.flatMap((name) => collectTableSections(baseline, name)),
    ],
  );

  writeFile(
    "foundation-wave2-wave3.sql",
    [
      "-- Foundation init wave 2 and wave 3",
      "-- Dependent tables first, then foreign keys",
      ...wave2Tables.flatMap((name) => collectTableSections(baseline, name)),
      "-- Foundation foreign keys",
      wave3ForeignKeys.map((name) => extractForeignKey(baseline, name)).join("\n"),
    ],
  );

  writeFile("foundation-verify.sql", [
    "-- Read-only verification before apply",
    "select current_database(), current_schema(), current_user;",
    [
      "select table_schema, count(*) as table_count",
      "from information_schema.tables",
      "where table_schema not in ('pg_catalog', 'information_schema')",
      "group by table_schema",
      "order by table_schema;",
    ].join("\n"),
    [
      "select count(*) as public_table_count",
      "from information_schema.tables",
      "where table_schema = 'public';",
    ].join("\n"),
    "-- Post-apply smoke checks",
    'select count(*) as identity_account_count from "IdentityAccount";',
    'select count(*) as config_entry_count from "ConfigEntry";',
    'select count(*) as domain_event_count from "DomainEvent";',
    'select count(*) as ai_model_config_count from "AiModelConfig";',
    [
      "select table_name",
      "from information_schema.tables",
      "where table_schema = 'public'",
      "  and table_name in ('IdentityAccount', 'ConfigEntry', 'DomainEvent', 'AiModelConfig')",
      "order by table_name;",
    ].join("\n"),
  ]);

  writeFile(
    "remaining-wave0.sql",
    [
      "-- Remaining module wave 0",
      "-- Shared enums required by portal and regional configuration tables",
      ...remainingWave0Enums.map((name) => extractEnum(baseline, name)),
    ],
  );

  writeFile(
    "phase-a-master-data.sql",
    [
      "-- Phase A",
      "-- Market, tenant, brand, store, and user master data",
      ...phaseATables.flatMap((name) => collectTableSections(baseline, name)),
      "-- Phase A foreign keys",
      phaseAForeignKeys.map((name) => extractForeignKey(baseline, name)).join("\n"),
    ],
  );

  writeFile(
    "phase-b-regional-portal.sql",
    [
      "-- Phase B",
      "-- Regional, portal, and market-scoped channel configuration",
      ...phaseBTables.flatMap((name) => collectTableSections(baseline, name)),
      "-- Phase B foreign keys",
      phaseBForeignKeys.map((name) => extractForeignKey(baseline, name)).join("\n"),
    ],
  );

  writeFile(
    "phase-c-member-domain.sql",
    [
      "-- Phase C",
      "-- Member profile and external member snapshot tables",
      ...phaseCTables.flatMap((name) => collectTableSections(baseline, name)),
    ],
  );

  writeFile(
    "phase-d-ops-audit.sql",
    [
      "-- Phase D",
      "-- Operations, audit, and mapped business activity tables",
      ...phaseDTables.flatMap((name) => collectTableSections(baseline, name)),
    ],
  );

  writeFile("remaining-verify.sql", [
    "-- Remaining module verification",
    [
      "select table_name",
      "from information_schema.tables",
      "where table_schema = 'public'",
      "  and table_name in (",
      "    'MarketProfile',",
      "    'Tenant',",
      "    'Brand',",
      "    'Store',",
      "    'PortalSite',",
      "    'MemberProfile',",
      "    'AuditLog',",
      "    'marketing_push_decision_log',",
      "    'inspection_task'",
      "  )",
      "order by table_name;",
    ].join("\n"),
    'select count(*) as market_profile_count from "MarketProfile";',
    'select count(*) as tenant_count from "Tenant";',
    'select count(*) as member_profile_count from "MemberProfile";',
    'select count(*) as audit_log_count from "AuditLog";',
  ]);

  writeRollbackFile("rollback-phase-d.sql", [
    "-- Rollback phase D",
    "-- Empty-table rollback only",
    ...buildDropTableSections(phaseDTables),
  ]);

  writeRollbackFile("rollback-phase-c.sql", [
    "-- Rollback phase C",
    "-- Empty-table rollback only",
    ...buildDropTableSections(phaseCTables),
  ]);

  writeRollbackFile("rollback-phase-b.sql", [
    "-- Rollback phase B",
    "-- Drop foreign keys first, then tables",
    ...buildDropConstraintSections("RegionalConfig", ["RegionalConfig_marketProfileId_fkey"]),
    ...buildDropConstraintSections("RegionalConfigOverride", [
      "RegionalConfigOverride_marketProfileId_fkey",
      "RegionalConfigOverride_regionalConfigId_fkey",
      "RegionalConfigOverride_tenantId_fkey",
      "RegionalConfigOverride_brandId_fkey",
      "RegionalConfigOverride_storeId_fkey",
    ]),
    ...buildDropConstraintSections("PortalSite", [
      "PortalSite_marketProfileId_fkey",
      "PortalSite_tenantId_fkey",
      "PortalSite_brandId_fkey",
      "PortalSite_storeId_fkey",
    ]),
    ...buildDropConstraintSections("EmailChannelConfig", ["EmailChannelConfig_marketProfileId_fkey"]),
    ...buildDropConstraintSections("SocialChannelConfig", ["SocialChannelConfig_marketProfileId_fkey"]),
    ...buildDropConstraintSections("TaxPolicyConfig", ["TaxPolicyConfig_marketProfileId_fkey"]),
    ...buildDropTableSections([...phaseBTables].reverse()),
  ]);

  writeRollbackFile("rollback-phase-a.sql", [
    "-- Rollback phase A",
    "-- Drop foreign keys first, then tables",
    ...buildDropConstraintSections("User", ["User_tenantId_fkey"]),
    ...buildDropConstraintSections("Store", [
      "Store_defaultMarketProfileId_fkey",
      "Store_brandId_fkey",
      "Store_tenantId_fkey",
    ]),
    ...buildDropConstraintSections("Brand", [
      "Brand_defaultMarketProfileId_fkey",
      "Brand_tenantId_fkey",
    ]),
    ...buildDropConstraintSections("Tenant", ["Tenant_defaultMarketProfileId_fkey"]),
    ...buildDropTableSections([...phaseATables].reverse()),
  ]);

  writeRollbackFile("rollback-remaining-wave0.sql", [
    "-- Rollback remaining wave 0 enums",
    "-- Drop only if no dependent objects remain",
    ...buildDropTypeSections([...remainingWave0Enums].reverse()),
  ]);

  writeRollbackFile("rollback-foundation-wave2-wave3.sql", [
    "-- Rollback foundation wave 2 and wave 3",
    "-- Drop foreign keys first, then dependent tables",
    ...buildDropConstraintSections("AiExecutionRecord", [
      "AiExecutionRecord_promptTemplateId_fkey",
      "AiExecutionRecord_modelConfigId_fkey",
    ]),
    ...buildDropConstraintSections("AiPromptTemplate", ["AiPromptTemplate_modelConfigId_fkey"]),
    ...buildDropConstraintSections("RestoreRun", ["RestoreRun_backupSnapshotId_fkey"]),
    ...buildDropConstraintSections("QuotaLedger", ["QuotaLedger_rateLimitPolicyId_fkey"]),
    ...buildDropConstraintSections("EdgeSyncTask", [
      "EdgeSyncTask_eventId_fkey",
      "EdgeSyncTask_edgeNodeId_fkey",
    ]),
    ...buildDropConstraintSections("NotificationDispatch", ["NotificationDispatch_templateId_fkey"]),
    ...buildDropConstraintSections("WebhookDelivery", [
      "WebhookDelivery_eventId_fkey",
      "WebhookDelivery_subscriptionId_fkey",
    ]),
    ...buildDropConstraintSections("ConfigRevision", ["ConfigRevision_configEntryId_fkey"]),
    ...buildDropConstraintSections("OrganizationMembership", [
      "OrganizationMembership_organizationNodeId_fkey",
      "OrganizationMembership_identityAccountId_fkey",
    ]),
    ...buildDropConstraintSections("OrganizationNode", ["OrganizationNode_parentId_fkey"]),
    ...buildDropTableSections([...wave2Tables].reverse()),
  ]);

  writeRollbackFile("rollback-foundation-wave1.sql", [
    "-- Rollback foundation wave 1",
    "-- Empty-table rollback only",
    ...buildDropTableSections([...wave1Tables].reverse()),
  ]);

  writeRollbackFile("rollback-foundation-wave0.sql", [
    "-- Rollback foundation wave 0 enums",
    "-- Drop only if no dependent objects remain",
    ...buildDropTypeSections([...wave0Enums].reverse()),
  ]);

  writeRollbackFile("rollback-all.sql", [
    "-- Rollback entire bootstrap plan",
    "-- Empty-table rollback only; review before use",
    ...readGeneratedRollbackSections([
      "rollback-phase-d.sql",
      "rollback-phase-c.sql",
      "rollback-phase-b.sql",
      "rollback-phase-a.sql",
      "rollback-remaining-wave0.sql",
      "rollback-foundation-wave2-wave3.sql",
      "rollback-foundation-wave1.sql",
      "rollback-foundation-wave0.sql",
    ]),
  ]);

  const summary = {
    baselinePath,
    outDir,
    rollbackDir,
    files: fs.readdirSync(outDir).sort(),
    rollbackFiles: fs.readdirSync(rollbackDir).sort(),
    wave0Enums: wave0Enums.length,
    wave1Tables: wave1Tables.length,
    wave1Indexes: wave1Tables.reduce((count, name) => count + extractIndexes(baseline, name).length, 0),
    wave2Tables: wave2Tables.length,
    wave2Indexes: wave2Tables.reduce((count, name) => count + extractIndexes(baseline, name).length, 0),
    wave3ForeignKeys: wave3ForeignKeys.length,
    remainingWave0Enums: remainingWave0Enums.length,
    phaseATables: phaseATables.length,
    phaseAForeignKeys: phaseAForeignKeys.length,
    phaseBTables: phaseBTables.length,
    phaseBForeignKeys: phaseBForeignKeys.length,
    phaseCTables: phaseCTables.length,
    phaseDTables: phaseDTables.length,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function writeFile(fileName, sections) {
  const contents = `${sections.filter(Boolean).join("\n\n")}\n`;
  fs.writeFileSync(path.join(outDir, fileName), contents);
}

function writeRollbackFile(fileName, sections) {
  const contents = `${sections.filter(Boolean).join("\n\n")}\n`;
  fs.writeFileSync(path.join(rollbackDir, fileName), contents);
}

function collectTableSections(baseline, tableName) {
  const sections = [`-- ${tableName}`, extractTable(baseline, tableName)];
  const indexes = extractIndexes(baseline, tableName);
  if (indexes.length > 0) {
    sections.push(indexes.join("\n"));
  }
  return sections;
}

function extractEnum(baseline, enumName) {
  const match = baseline.match(new RegExp(`CREATE TYPE "${enumName}" AS ENUM \\([\\s\\S]*?;`, "m"));
  if (!match) {
    throw new Error(`Missing enum: ${enumName}`);
  }
  return match[0];
}

function extractTable(baseline, tableName) {
  const match = baseline.match(new RegExp(`CREATE TABLE "${tableName}" \\([\\s\\S]*?\\n\\);`, "m"));
  if (!match) {
    throw new Error(`Missing table: ${tableName}`);
  }
  return match[0];
}

function extractIndexes(baseline, tableName) {
  const matches = baseline.matchAll(
    new RegExp(`^CREATE (?:UNIQUE )?INDEX "[^"]+" ON "${tableName}"[^\\n]*;`, "gm"),
  );
  return [...matches].map((match) => match[0]);
}

function extractForeignKey(baseline, constraintName) {
  const match = baseline.match(
    new RegExp(`^ALTER TABLE "[^"]+" ADD CONSTRAINT "${constraintName}"[^\\n]*;`, "m"),
  );
  if (!match) {
    throw new Error(`Missing foreign key: ${constraintName}`);
  }
  return match[0];
}

function buildDropConstraintSections(tableName, constraints) {
  return [
    `-- Drop constraints for ${tableName}`,
    constraints.map((name) => `ALTER TABLE IF EXISTS "${tableName}" DROP CONSTRAINT IF EXISTS "${name}";`).join("\n"),
  ];
}

function buildDropTableSections(tableNames) {
  return [
    "-- Drop tables",
    tableNames.map((name) => `DROP TABLE IF EXISTS "${name}";`).join("\n"),
  ];
}

function buildDropTypeSections(typeNames) {
  return [
    "-- Drop enum types",
    typeNames.map((name) => `DROP TYPE IF EXISTS "${name}";`).join("\n"),
  ];
}

function readGeneratedRollbackSections(fileNames) {
  return fileNames.map((fileName) => fs.readFileSync(path.join(rollbackDir, fileName), "utf8").trim());
}

main();
