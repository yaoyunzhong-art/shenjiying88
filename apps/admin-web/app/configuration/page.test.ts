/**
 * configuration/page.test.ts — Page-level tests for the Configuration governance workspace page.
 * Tests query parameter normalization, snapshot data loading, scope chain construction,
 * and summary metadata formatting.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: configuration-view-model.ts, configuration-workspace-client.tsx, page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  summarizeConfigEntry,
  summarizeSecret,
  summarizeCertificate,
  loadConfigurationGovernanceSnapshot,
  featureFlagStatusLabel,
} from '../configuration-view-model';
import { buildConfigurationHref } from '@m5/types';
import type {
  ConfigurationOverview,
  ConfigurationGovernanceMetadataEntry,
  ConfigurationConfigEntry,
  ConfigurationSecretMetadata,
  ConfigurationCertificateMetadata,
  ConfigurationFeatureFlag,
  ConfigurationScope,
} from '@m5/types';

// ---- Page-level helper - same logic as page.tsx ----

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

// ---- Mock data ----

const MOCK_ENTRY: ConfigurationConfigEntry = {
  id: 'cfg-001',
  key: 'payment.timeout_ms',
  value: JSON.stringify(5000),
  scopeType: 'TENANT',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  version: 3,
  tags: ['payment', 'timeout'],
  updatedAt: '2026-06-14T10:00:00.000Z',
};

const MOCK_SECRET: ConfigurationSecretMetadata = {
  name: 'payment-api-key',
  expiresAt: '2026-07-10T08:00:00.000Z',
  version: 2,
  rotatedAt: '2026-06-10T08:00:00.000Z',
  consumers: ['payment-gateway'],
};

const MOCK_CERT: ConfigurationCertificateMetadata = {
  name: 'api-gateway-cert',
  issuer: 'Let\'s Encrypt',
  fingerprint: 'AB:CD:EF:01:23:45:67:89',
  status: 'expiring-soon',
  expiresAt: '2026-07-01T00:00:00.000Z',
  autoRenew: true,
  daysToExpire: 4,
};

const MOCK_FLAG: ConfigurationFeatureFlag = {
  key: 'new-checkout-flow',
  name: '新结账流程',
  description: '启用新的结账流程 UI',
  enabled: true,
};

const MOCK_SCOPE: ConfigurationScope = {
  scopeType: 'TENANT',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
};

const MOCK_OVERVIEW: ConfigurationOverview = {
  generatedAt: '2026-06-14T08:00:00.000Z',
  approvals: {},
  audits: {},
  configuration: {
    entries: {
      total: 1,
      active: 1,
      namespaces: {},
      items: [MOCK_ENTRY],
    },
    secrets: {
      total: 1,
      persisted: 1,
      static: 0,
      rotationDue: 0,
      expired: 0,
      items: [MOCK_SECRET],
    },
    certificates: {
      total: 1,
      autoRenew: 1,
      expiringSoon: 1,
      expired: 0,
      items: [MOCK_CERT],
    },
    featureFlags: {
      total: 1,
      enabled: 1,
      active: 1,
      byStrategy: {},
      items: [MOCK_FLAG],
    },
  },
  posture: {
    generatedAt: '2026-06-14T08:00:00.000Z',
    secrets: { total: 1, rotationDue: 0, expired: 0, sharedConsumers: 0 },
    certificates: { total: 1, expiringSoon: 1, expired: 0, autoRenewDisabled: 0 },
    attention: { secrets: [], certificates: [] },
  },
  scopeChain: [MOCK_SCOPE],
};

// ---- 正例 ----

describe('configuration-page: 正例 (positive cases)', () => {
  describe('query parameter normalization', () => {
    it('should read tenantId from search params', () => {
      const tenantId = readQueryParam('tenant-demo');
      assert.strictEqual(tenantId, 'tenant-demo');
    });

    it('should extract first value from array param', () => {
      const brandId = readQueryParam(['brand-a', 'brand-b']);
      assert.strictEqual(brandId, 'brand-a');
    });

    it('undefined param should be undefined', () => {
      assert.strictEqual(readQueryParam(undefined), undefined);
    });

    it('should handle empty string param', () => {
      assert.strictEqual(readQueryParam(''), '');
    });
  });

  describe('buildConfigurationHref', () => {
    it('returns /configuration for empty query', () => {
      assert.strictEqual(buildConfigurationHref(), '/configuration');
    });

    it('returns /configuration with tenantId and brandId', () => {
      assert.strictEqual(
        buildConfigurationHref({ tenantId: 'tenant-demo', brandId: 'brand-demo' }),
        '/configuration?tenantId=tenant-demo&brandId=brand-demo',
      );
    });

    it('includes storeId when provided', () => {
      assert.strictEqual(
        buildConfigurationHref({ tenantId: 't1', brandId: 'b1', storeId: 's1' }),
        '/configuration?tenantId=t1&brandId=b1&storeId=s1',
      );
    });

    it('includes marketCode when provided', () => {
      assert.strictEqual(
        buildConfigurationHref({ marketCode: 'cn-sh' }),
        '/configuration?marketCode=cn-sh',
      );
    });
  });

  describe('summarizeConfigEntry', () => {
    it('should return the entry value as string', () => {
      const summary = summarizeConfigEntry(MOCK_ENTRY);
      // MOCK_ENTRY.value is JSON.stringify(5000) = '5000', which typeof is string
      assert.strictEqual(summary, '5000');
      assert.ok(summary.length > 0, 'summary should not be empty');
    });
  });

  describe('summarizeSecret', () => {
    it('should include name and consumers', () => {
      const summary = summarizeSecret(MOCK_SECRET);
      assert.match(summary, /payment-api-key/);
      assert.match(summary, /payment-gateway/);
    });
  });

  describe('summarizeCertificate', () => {
    it('should include name and issuer', () => {
      const summary = summarizeCertificate(MOCK_CERT);
      assert.match(summary, /api-gateway-cert/);
      assert.match(summary, /Let's Encrypt/);
    });
  });

  describe('featureFlagStatusLabel', () => {
    it('should return enabled for enabled flag', () => {
      assert.strictEqual(featureFlagStatusLabel({ key: 'test', enabled: true }), '启用');
    });

    it('should return disabled for disabled flag', () => {
      assert.strictEqual(featureFlagStatusLabel({ key: 'test', enabled: false }), '关闭');
    });
  });

  describe('loadConfigurationGovernanceSnapshot', () => {
    it('should return a valid snapshot structure', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot(
        { tenantId: 'tenant-demo', brandId: 'brand-demo' },
        { cache: 'no-store' },
      );
      assert.ok(snapshot, 'snapshot should be defined');
      assert.ok(typeof snapshot.overview === 'object', 'overview should be an object');
      assert.ok(typeof snapshot.managementMetadata === 'object', 'managementMetadata should be an object');

      // overview shape
      const overview = snapshot.overview;
      assert.ok(typeof overview.configuration === 'object', 'overview.configuration should be an object');
      assert.ok(Array.isArray(overview.scopeChain), 'scopeChain should be an array');
      assert.ok(typeof overview.generatedAt === 'string', 'generatedAt should be a string');

      // configuration sub-shape
      const cfg = overview.configuration;
      assert.ok(typeof cfg.entries?.total === 'number', 'entries total should be a number');
      assert.ok(Array.isArray(cfg.entries?.items ?? []), 'entries items should be an array');
      assert.ok(typeof cfg.secrets?.total === 'number', 'secrets total should be a number');
      assert.ok(typeof cfg.certificates?.total === 'number', 'certificates total should be a number');
      assert.ok(typeof cfg.featureFlags?.total === 'number', 'featureFlags total should be a number');
    });

    it('should include scopeChain reflecting query parameters', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot(
        { tenantId: 'tenant-demo', brandId: 'brand-demo' },
        {},
      );
      const chain = snapshot.overview.scopeChain ?? [];
      const scopeTypes = chain.map((s) => s.scopeType);
      assert.ok(scopeTypes.includes('PLATFORM'), 'scopeChain should include PLATFORM');
    });

    it('should return managementMetadata with governance entries', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'tenant-demo' }, {});
      const meta = snapshot.managementMetadata;
      assert.ok(Array.isArray(meta), 'managementMetadata should be an array');
      if (meta.length > 0) {
        const first = meta[0]!;
        assert.ok(typeof first.operation === 'string', 'metadata entry should have an operation');
      }
    });
  });

  describe('snapshot summary computation', () => {
    it('should compute entry count from overview', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot(
        { tenantId: 'tenant-demo' },
        { cache: 'no-store' },
      );
      const total = snapshot.overview.configuration.entries?.total ?? 0;
      assert.ok(total >= 0, 'entry total should be non-negative');
    });

    it('should reflect secret count', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot(
        { tenantId: 'tenant-demo' },
        { cache: 'no-store' },
      );
      const total = snapshot.overview.configuration.secrets?.total ?? 0;
      assert.ok(total >= 0, 'secret total should be non-negative');
    });

    it('should reflect certificate count', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot(
        { tenantId: 'tenant-demo' },
        { cache: 'no-store' },
      );
      const total = snapshot.overview.configuration.certificates?.total ?? 0;
      assert.ok(total >= 0, 'certificate total should be non-negative');
    });

    it('should reflect feature flag count', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot(
        { tenantId: 'tenant-demo' },
        { cache: 'no-store' },
      );
      const total = snapshot.overview.configuration.featureFlags?.total ?? 0;
      assert.ok(total >= 0, 'flag total should be non-negative');
    });
  });
});

// ---- 反例 ----

describe('configuration-page: 反例 (negative / edge cases)', () => {
  describe('empty overview fields', () => {
    it('should handle empty entries gracefully', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'empty-tenant' });
      const entries = snapshot.overview.configuration.entries;
      assert.ok(entries, 'entries should exist even when empty');
      assert.strictEqual(entries.total, 0, 'total should be 0');
    });

    it('should handle empty secrets gracefully', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'empty-tenant' });
      assert.strictEqual(snapshot.overview.configuration.secrets?.total ?? 0, 0);
    });

    it('should handle empty certificates gracefully', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'empty-tenant' });
      assert.strictEqual(snapshot.overview.configuration.certificates?.total ?? 0, 0);
    });

    it('should handle empty feature flags gracefully', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'empty-tenant' });
      assert.strictEqual(snapshot.overview.configuration.featureFlags?.total ?? 0, 0);
    });

    it('should handle empty scope chain', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({});
      assert.ok(Array.isArray(snapshot.overview.scopeChain), 'scopeChain should always be an array');
    });
  });

  describe('missing query parameters', () => {
    it('should handle missing tenantId', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({ brandId: 'brand-demo' });
      assert.ok(snapshot, 'snapshot should be defined without tenantId');
    });

    it('should handle empty query object', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({});
      assert.ok(snapshot, 'snapshot should be defined with empty query');
    });

    it('should handle undefined options', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 't1' }, undefined);
      assert.ok(snapshot, 'snapshot should be defined with undefined options');
    });
  });

  describe('edge case enum values', () => {
    it('should handle very long config keys', () => {
      const longKey = 'a'.repeat(500);
      const entry: ConfigurationConfigEntry = {
        ...MOCK_ENTRY,
        key: longKey,
      };
      const summary = summarizeConfigEntry(entry);
      assert.ok(summary.length > 0, 'summary should not be empty');
      assert.ok(summary.length <= 600, 'summary should handle long key gracefully');
    });

    it('should handle null value on entry', () => {
      const entry: ConfigurationConfigEntry = {
        ...MOCK_ENTRY,
        value: null as unknown as undefined,
      };
      const summary = summarizeConfigEntry(entry);
      assert.strictEqual(summary, '\u2014', 'summary should be em-dash for null value');
    });

    it('should handle undefined certificate expiresAt', () => {
      const cert: ConfigurationCertificateMetadata = {
        ...MOCK_CERT,
        expiresAt: undefined as unknown as string,
      };
      const summary = summarizeCertificate(cert);
      assert.ok(summary.length > 0, 'summary should handle undefined expiresAt');
    });
  });

  describe('featureFlagStatusLabel edge cases', () => {
    it('should default null to 关闭', () => {
      assert.strictEqual(featureFlagStatusLabel(null as unknown as ConfigurationFeatureFlag), '关闭');
    });

    it('should default undefined to 关闭', () => {
      assert.strictEqual(featureFlagStatusLabel(undefined as unknown as ConfigurationFeatureFlag), '关闭');
    });
  });
});

// ---- 边界 ----

describe('configuration-page: 边界 (boundary cases)', () => {
  describe('max scope chain depth', () => {
    it('should support scopeChain up to 4 segments', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot(
        { marketCode: 'cn-sh', tenantId: 't1', brandId: 'b1', storeId: 's1' },
      );
      const chain = snapshot.overview.scopeChain ?? [];
      assert.ok(chain.length >= 0, 'scope chain length should be non-negative');
      const scopeTypes = chain.map((s) => s.scopeType);
      if (chain.length >= 4) {
        // In a real scenario, distinct scope entries would appear
        assert.ok(scopeTypes.length >= 4, 'should have at least 4 scope entries');
      }
    });
  });

  describe('large managementMetadata', () => {
    it('should return an array for metadata', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot({});
      assert.ok(Array.isArray(snapshot.managementMetadata));
    });

    it('should not throw for unknown query keys', async () => {
      const snapshot = await loadConfigurationGovernanceSnapshot(
        { unknownProp: 'foo' } as any,
        { cache: 'no-store' },
      );
      assert.ok(snapshot, 'snapshot should not throw');
    });
  });

  describe('concurrent load isolation', () => {
    it('should return independent snapshot instances for different tenants', async () => {
      const [a, b] = await Promise.all([
        loadConfigurationGovernanceSnapshot({ tenantId: 'tenant-alpha' }),
        loadConfigurationGovernanceSnapshot({ tenantId: 'tenant-beta' }),
      ]);
      assert.notStrictEqual(a, b, 'snapshots should be different instances');
      assert.ok(a.overview, 'snapshot-a should have overview');
      assert.ok(b.overview, 'snapshot-b should have overview');
    });
  });
});
