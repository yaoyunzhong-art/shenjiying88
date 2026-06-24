"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
function createTrustGovernanceMock() {
    const auditRecords = [];
    return {
        auditRecords,
        getAuditRecords: async () => auditRecords,
        summarizeAuditRecords: async () => ({ total: auditRecords.length, byAction: {} }),
        recordAudit: async () => {
            auditRecords.push({ recordedAt: new Date().toISOString() });
        }
    };
}
function createConfigurationPrismaMock() {
    const configEntries = [];
    const featureFlags = [];
    const secretAssets = [];
    const governanceApprovals = [];
    return {
        configEntries,
        featureFlags,
        secretAssets,
        governanceApprovals,
        configEntry: {
            findMany: async (query) => {
                const entries = query?.where?.OR
                    ? configEntries.filter((entry) => query.where.OR.some((clause) => {
                        if (clause.scopeType === 'PLATFORM')
                            return true;
                        if (clause.tenantId)
                            return entry.tenantId === clause.tenantId;
                        if (clause.brandId)
                            return entry.brandId === clause.brandId;
                        if (clause.storeId)
                            return entry.storeId === clause.storeId;
                        return false;
                    }))
                    : configEntries;
                return entries
                    .filter((entry) => !query?.where?.namespace || entry.namespace === query.where.namespace)
                    .filter((entry) => !query?.where?.key || entry.key === query.where.key);
            },
            findFirst: async (query) => configEntries.find((entry) => Object.entries(query.where).every(([key, value]) => {
                if (value === null)
                    return entry[key] === null;
                return entry[key] === value;
            })) ?? null,
            findUnique: async (query) => configEntries.find((entry) => entry.id === query.where.id) ?? null,
            create: async ({ data }) => {
                const entry = {
                    id: `cfg-${configEntries.length + 1}`,
                    namespace: data.namespace,
                    key: data.key,
                    valueType: data.valueType,
                    scopeType: data.scopeType,
                    tenantId: data.tenantId ?? null,
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    marketProfileId: data.marketProfileId ?? null,
                    portalSiteId: data.portalSiteId ?? null,
                    version: data.version,
                    value: data.value,
                    schemaRef: data.schemaRef ?? null,
                    tags: data.tags ?? [],
                    status: data.status ?? 'ACTIVE',
                    createdBy: data.createdBy ?? null,
                    revisions: data.revisions
                        ? [{
                                ...(data.revisions.create),
                                createdAt: new Date()
                            }]
                        : [],
                    updatedAt: new Date(),
                    createdAt: new Date()
                };
                configEntries.push(entry);
                return entry;
            },
            update: async ({ where, data }) => {
                const idx = configEntries.findIndex((entry) => entry.id === where.id);
                if (idx === -1)
                    throw new Error(`Config entry not found: ${where.id}`);
                const existing = configEntries[idx];
                const revisionCreate = data.revisions?.create;
                configEntries[idx] = {
                    ...existing,
                    version: data.version,
                    value: data.value,
                    schemaRef: data.schemaRef ?? existing.schemaRef,
                    tags: data.tags ?? existing.tags,
                    status: data.status ?? existing.status,
                    createdBy: data.createdBy ?? existing.createdBy,
                    revisions: [
                        ...existing.revisions,
                        {
                            version: data.version,
                            changedBy: revisionCreate?.changedBy ?? 'foundation-console',
                            changeReason: revisionCreate?.changeReason ?? null,
                            snapshot: revisionCreate?.snapshot,
                            createdAt: new Date()
                        }
                    ],
                    updatedAt: new Date()
                };
                return configEntries[idx];
            }
        },
        featureFlag: {
            findMany: async (query) => {
                if (query?.where?.key) {
                    return featureFlags.filter((flag) => flag.key === query.where.key);
                }
                return featureFlags;
            },
            findFirst: async (query) => featureFlags.find((flag) => Object.entries(query.where).every(([key, value]) => {
                if (value === null)
                    return flag[key] === null;
                return flag[key] === value;
            })) ?? null,
            create: async ({ data }) => {
                const flag = {
                    id: `ff-${featureFlags.length + 1}`,
                    key: data.key,
                    name: data.name,
                    scopeType: data.scopeType,
                    tenantId: data.tenantId ?? null,
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    marketProfileId: data.marketProfileId ?? null,
                    status: data.status,
                    strategy: data.strategy,
                    enabled: data.enabled,
                    percentage: data.percentage ?? null,
                    allowList: data.allowList ?? [],
                    conditions: data.conditions ?? null,
                    startsAt: data.startsAt ?? null,
                    endsAt: data.endsAt ?? null,
                    metadata: data.metadata,
                    updatedAt: new Date(),
                    createdAt: new Date()
                };
                featureFlags.push(flag);
                return flag;
            },
            update: async ({ where, data }) => {
                const idx = featureFlags.findIndex((flag) => flag.id === where.id);
                if (idx === -1)
                    throw new Error(`Feature flag not found: ${where.id}`);
                featureFlags[idx] = {
                    ...featureFlags[idx],
                    name: data.name,
                    status: data.status,
                    strategy: data.strategy,
                    enabled: data.enabled,
                    percentage: data.percentage ?? featureFlags[idx].percentage,
                    allowList: data.allowList ?? featureFlags[idx].allowList,
                    conditions: data.conditions ?? featureFlags[idx].conditions,
                    startsAt: data.startsAt ?? featureFlags[idx].startsAt,
                    endsAt: data.endsAt ?? featureFlags[idx].endsAt,
                    metadata: data.metadata,
                    updatedAt: new Date()
                };
                return featureFlags[idx];
            }
        },
        secretAsset: {
            findMany: async (query) => {
                if (query?.where?.key) {
                    return secretAssets.filter((asset) => asset.key === query.where.key);
                }
                return secretAssets;
            },
            create: async ({ data }) => {
                const asset = {
                    id: `sec-${secretAssets.length + 1}`,
                    key: data.key,
                    kind: data.kind,
                    provider: data.provider,
                    scopeType: data.scopeType,
                    tenantId: data.tenantId ?? null,
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    integrationAppId: data.integrationAppId ?? null,
                    version: data.version,
                    reference: data.reference,
                    encryptedPayload: data.encryptedPayload ?? null,
                    metadata: data.metadata,
                    expiresAt: data.expiresAt ?? null,
                    rotatedAt: data.rotatedAt ?? new Date(),
                    status: data.status ?? 'ACTIVE'
                };
                secretAssets.push(asset);
                return asset;
            }
        },
        governanceApproval: {
            findMany: async () => governanceApprovals,
            findFirst: async (query) => governanceApprovals.find((ap) => ap.ticket === query.where.ticket) ?? null
        },
        $transaction: async (operations) => {
            for (const op of operations) {
                if (op.create) {
                    governanceApprovals.push(op.create);
                }
                else if (op.update) {
                    const updateObj = op.update;
                    const idx = governanceApprovals.findIndex((ap) => ap.approvalId === updateObj.where.id);
                    if (idx >= 0) {
                        governanceApprovals[idx] = { ...governanceApprovals[idx], ...updateObj.data };
                    }
                }
            }
            return operations;
        }
    };
}
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, node_test_1.default)('resolveConfigSnapshot returns a snapshot for default tenant context', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const snapshot = await service.resolveConfigSnapshot({
        tenantId: 'tenant-demo',
        brandId: 'brand-default',
        storeId: 'store-default'
    });
    strict_1.default.ok(snapshot, 'snapshot should exist');
    strict_1.default.ok(typeof snapshot.snapshotId === 'string', `snapshotId should be a string but got ${typeof snapshot.snapshotId}`);
    strict_1.default.ok(Array.isArray(snapshot.scopeChain), 'scopeChain should be an array');
    strict_1.default.ok(snapshot.config, 'config should exist');
    strict_1.default.ok(Array.isArray(snapshot.featureFlags), 'featureFlags should be an array');
    strict_1.default.ok(snapshot.featureFlags.length > 0, 'featureFlags should not be empty');
    strict_1.default.ok(typeof snapshot.checksum === 'string', 'checksum should be a string');
});
(0, node_test_1.default)('getFeatureFlags returns in-memory flags for empty persisted data', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const flags = await service.getFeatureFlags({
        tenantId: 'tenant-demo',
        brandId: 'brand-default',
        storeId: 'store-default'
    });
    strict_1.default.ok(Array.isArray(flags), 'flags should be an array');
    strict_1.default.ok(flags.length >= 3, 'expected at least 3 in-memory flags');
    flags.forEach((flag) => {
        strict_1.default.ok(typeof flag.key === 'string', `flag.key should be string, got ${typeof flag.key}`);
        strict_1.default.ok(typeof flag.enabled === 'boolean', `flag.enabled should be boolean, got ${typeof flag.enabled}`);
        strict_1.default.ok(typeof flag.source === 'string', `flag.source should be string, got ${typeof flag.source}`);
    });
});
(0, node_test_1.default)('getFeatureFlags evaluates premium tenant to enabled for new-checkout', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const flags = await service.getFeatureFlags({
        tenantId: 'tenant-premium',
        brandId: 'brand-default',
        storeId: 'store-default'
    });
    const checkoutFlag = flags.find((flag) => flag.key === 'new-checkout');
    strict_1.default.ok(checkoutFlag, 'new-checkout flag should exist');
    strict_1.default.equal(checkoutFlag.enabled, true, 'new-checkout should be enabled for tenant-premium');
    strict_1.default.equal(checkoutFlag.source, 'in-memory');
});
(0, node_test_1.default)('getFeatureFlags evaluates unknown tenant to default flag values', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const flags = await service.getFeatureFlags({
        tenantId: 'tenant-unknown',
        brandId: 'brand-default',
        storeId: 'store-default'
    });
    const checkoutFlag = flags.find((flag) => flag.key === 'new-checkout');
    strict_1.default.ok(checkoutFlag, 'new-checkout flag should exist');
    strict_1.default.equal(checkoutFlag.enabled, false, 'new-checkout should be disabled for unknown tenant (default)');
    const aiFlag = flags.find((flag) => flag.key === 'ai-order-review');
    strict_1.default.ok(aiFlag, 'ai-order-review flag should exist');
    strict_1.default.equal(aiFlag.enabled, true, 'ai-order-review should default to enabled');
});
(0, node_test_1.default)('getManagementMetadata returns governance metadata entries', () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const metadata = service.getManagementMetadata();
    strict_1.default.ok(Array.isArray(metadata), 'metadata should be an array');
    strict_1.default.ok(metadata.length >= 3, 'expected at least 3 management metadata entries');
    const operations = metadata.map((m) => m.operation);
    strict_1.default.ok(operations.includes('config-entry.write'), 'should include config-entry.write');
    strict_1.default.ok(operations.includes('feature-flag.write'), 'should include feature-flag.write');
    strict_1.default.ok(operations.includes('secret.register'), 'should include secret.register');
    metadata.forEach((entry) => {
        strict_1.default.ok(typeof entry.operation === 'string');
        strict_1.default.ok(entry.rbac, 'should have rbac');
        strict_1.default.ok(entry.approval, 'should have approval');
    });
});
(0, node_test_1.default)('saveConfigEntry creates a new entry with governance metadata', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const result = await service.saveConfigEntry({
        namespace: 'checkout',
        key: 'guest-checkout',
        valueType: 'BOOLEAN',
        scopeType: 'TENANT',
        tenantId: 'tenant-demo',
        value: true,
        tags: ['ecommerce', 'checkout'],
        changedBy: 'ops-admin',
        changeReason: 'Enable guest checkout for testing'
    });
    strict_1.default.equal(result.status, 'created', 'should have status "created"');
    strict_1.default.ok(result.entry, 'should return entry');
    strict_1.default.equal(result.entry.namespace, 'checkout');
    strict_1.default.equal(result.entry.key, 'guest-checkout');
    strict_1.default.equal(result.entry.version, 1);
    strict_1.default.equal(result.entry.status, 'ACTIVE');
    strict_1.default.deepStrictEqual(result.entry.value, true);
    strict_1.default.ok(result.governance, 'should include governance metadata');
    strict_1.default.equal(result.governance.operation, 'config-entry.write');
});
(0, node_test_1.default)('saveConfigEntry updates existing entry and increments version', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    // first create
    await service.saveConfigEntry({
        namespace: 'checkout',
        key: 'guest-checkout',
        valueType: 'BOOLEAN',
        scopeType: 'TENANT',
        tenantId: 'tenant-demo',
        value: true,
        changedBy: 'ops-admin',
        changeReason: 'Initial creation'
    });
    // then update
    const result = await service.saveConfigEntry({
        namespace: 'checkout',
        key: 'guest-checkout',
        valueType: 'BOOLEAN',
        scopeType: 'TENANT',
        tenantId: 'tenant-demo',
        value: false,
        changedBy: 'ops-admin',
        changeReason: 'Disable guest checkout'
    });
    strict_1.default.equal(result.status, 'updated', 'should have status "updated"');
    strict_1.default.equal(result.entry.version, 2, 'version should increment to 2');
    strict_1.default.deepStrictEqual(result.entry.value, false, 'value should be updated to false');
});
(0, node_test_1.default)('saveFeatureFlag creates a new flag', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const result = await service.saveFeatureFlag({
        key: 'experimental-ui',
        name: 'Experimental UI',
        scopeType: 'PLATFORM',
        status: 'ACTIVE',
        strategy: 'ENABLE_ALL',
        enabled: false,
        percentage: 10,
        description: 'Enable experimental UI features',
        note: 'For internal testing only'
    });
    strict_1.default.equal(result.status, 'created', 'should have status "created"');
    strict_1.default.ok(result.record, 'should return record');
    strict_1.default.equal(result.record.key, 'experimental-ui');
    strict_1.default.equal(result.record.enabled, false);
    strict_1.default.ok(result.record, `record should exist: ${JSON.stringify(result.record)}`);
    strict_1.default.ok(result.governance, 'should include governance metadata');
});
(0, node_test_1.default)('getSecretMetadata returns combined persisted and in-memory secrets', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const secrets = await service.getSecretMetadata();
    strict_1.default.ok(Array.isArray(secrets), 'secrets should be an array');
    strict_1.default.ok(secrets.length >= 2, 'expected at least 2 in-memory secrets');
    const lytSecret = secrets.find((secret) => secret.name === 'lyt-webhook-signing-secret');
    strict_1.default.ok(lytSecret, 'lyt-webhook-signing-secret should exist');
    strict_1.default.equal(lytSecret.currentVersion, 2);
    const paySecret = secrets.find((secret) => secret.name === 'payment-provider-api-key');
    strict_1.default.ok(paySecret, 'payment-provider-api-key should exist');
    strict_1.default.equal(paySecret.status, 'rotation-due');
});
(0, node_test_1.default)('getSecretMetadata throws NotFoundException for unknown secret', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    await strict_1.default.rejects(() => service.getSecretMetadata('non-existent-secret'), (err) => err.name === 'NotFoundException');
});
(0, node_test_1.default)('getCertificateMetadata returns certificate records', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const certificates = await service.getCertificateMetadata();
    strict_1.default.ok(Array.isArray(certificates), 'certificates should be an array');
    strict_1.default.ok(certificates.length >= 2, 'expected at least 2 certificates');
    const lytCert = certificates.find((cert) => cert.name === 'lyt-callback-cert');
    strict_1.default.ok(lytCert, 'lyt-callback-cert should exist');
    strict_1.default.equal(lytCert.autoRenew, true);
});
(0, node_test_1.default)('getCertificateDetail returns a specific certificate', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const cert = await service.getCertificateDetail('payment-gateway-client-cert', {});
    strict_1.default.ok(cert, 'certificate should exist');
    strict_1.default.equal(cert.name, 'payment-gateway-client-cert');
    strict_1.default.equal(cert.format, 'PFX');
    strict_1.default.equal(cert.autoRenew, false);
});
(0, node_test_1.default)('getCertificateDetail throws NotFoundException for unknown certificate', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    await strict_1.default.rejects(() => service.getCertificateDetail('non-existent-cert', {}), (err) => err.name === 'NotFoundException');
});
(0, node_test_1.default)('getSecretsCertificatePosture returns posture snapshot', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const posture = await service.getSecretsCertificatePosture();
    strict_1.default.ok(posture, 'posture should exist');
    strict_1.default.ok(typeof posture.generatedAt === 'string', 'should have generatedAt');
    strict_1.default.ok(posture.secrets, 'should have secrets');
    strict_1.default.ok(posture.certificates, 'should have certificates');
    strict_1.default.ok(posture.attention, 'should have attention');
    strict_1.default.ok(Array.isArray(posture.attention.secrets), 'attention.secrets should be an array');
    strict_1.default.ok(Array.isArray(posture.attention.certificates), 'attention.certificates should be an array');
});
(0, node_test_1.default)('getGovernanceBaselines returns baseline entries', () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const baselines = service.getGovernanceBaselines();
    strict_1.default.ok(Array.isArray(baselines), 'baselines should be an array');
    strict_1.default.ok(baselines.length >= 2, 'expected at least 2 baselines');
    baselines.forEach((baseline) => {
        strict_1.default.ok(typeof baseline.key === 'string');
        strict_1.default.ok(typeof baseline.name === 'string');
        strict_1.default.ok(typeof baseline.summary === 'string');
        strict_1.default.ok(Array.isArray(baseline.controls));
        strict_1.default.ok(Array.isArray(baseline.evidence));
        strict_1.default.equal(baseline.ownerModule, 'configuration-governance');
    });
});
(0, node_test_1.default)('getDescriptor returns module descriptor', () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const descriptor = service.getDescriptor();
    strict_1.default.equal(descriptor.key, 'configuration-governance');
    strict_1.default.equal(descriptor.name, 'Configuration Governance Module');
    strict_1.default.ok(descriptor.capabilities, 'should have capabilities');
    strict_1.default.ok(descriptor.capabilities.length >= 3, 'expected at least 3 capabilities');
});
(0, node_test_1.default)('getOperationsOverview returns combined overview', async () => {
    const { ConfigurationGovernanceService } = require('./configuration-governance.service');
    const prisma = createConfigurationPrismaMock();
    const trust = createTrustGovernanceMock();
    const service = new ConfigurationGovernanceService(prisma, trust);
    const overview = await service.getOperationsOverview();
    strict_1.default.ok(overview, 'overview should exist');
    strict_1.default.ok(typeof overview.generatedAt === 'string', 'should have generatedAt');
    strict_1.default.ok(overview.configuration, 'should have configuration');
    strict_1.default.ok(overview.configuration.entries, 'should have entries');
    strict_1.default.ok(overview.configuration.featureFlags, 'should have featureFlags');
    strict_1.default.ok(overview.configuration.secrets, 'should have secrets');
    strict_1.default.ok(overview.configuration.certificates, 'should have certificates');
    strict_1.default.ok(overview.posture, 'should have posture');
});
//# sourceMappingURL=configuration-governance.service.test.js.map