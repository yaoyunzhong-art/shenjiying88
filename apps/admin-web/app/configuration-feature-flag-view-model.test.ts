import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfigurationFeatureFlagDetailParam } from '@m5/types';
import {
  buildConfigurationFeatureFlagDeepLinks,
  loadConfigurationFeatureFlagDetail
} from './configuration-feature-flag-view-model';
import type { ConfigurationFeatureFlag } from '@m5/types';

function buildFlag(
  key: string,
  overrides: Partial<ConfigurationFeatureFlag> = {}
): ConfigurationFeatureFlag {
  return {
    key,
    enabled: false,
    rolloutPercentage: 0,
    source: 'in-memory',
    ...overrides
  };
}

function buildOverview(flags: ConfigurationFeatureFlag[]) {
  return {
    generatedAt: '2026-06-20T00:00:00.000Z',
    approvals: {},
    audits: {},
    configuration: {
      entries: { total: 0, active: 0, namespaces: {}, items: [] },
      featureFlags: {
        total: flags.length,
        enabled: flags.filter((f) => f.enabled).length,
        active: flags.filter((f) => f.enabled && (f.rolloutPercentage ?? 0) > 0).length,
        byStrategy: {},
        items: flags
      },
      secrets: { total: 0, persisted: 0, static: 0, rotationDue: 0, expired: 0, items: [] },
      certificates: { total: 0, autoRenew: 0, expiringSoon: 0, expired: 0, items: [] }
    },
    posture: {
      generatedAt: '2026-06-20T00:00:00.000Z',
      secrets: { total: 0, rotationDue: 0, expired: 0, sharedConsumers: 0 },
      certificates: { total: 0, expiringSoon: 0, expired: 0, autoRenewDisabled: 0 },
      attention: { secrets: [], certificates: [] }
    },
    scopeChain: [
      {
        scopeType: 'TENANT',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland'
      }
    ]
  };
}

function envelope(payload: unknown) {
  return { code: 'OK', message: '', data: payload };
}

function mockOverviewResponse(flags: ConfigurationFeatureFlag[]) {
  return async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/management-metadata')) {
      return new Response(JSON.stringify(envelope([])), { status: 200 });
    }
    return new Response(JSON.stringify(envelope(buildOverview(flags))), { status: 200 });
  };
}

test('configuration-feature-flag-view-model: readConfigurationFeatureFlagDetailParam decodes array/string/empty', () => {
  assert.equal(readConfigurationFeatureFlagDetailParam('checkout.experimental'), 'checkout.experimental');
  assert.equal(readConfigurationFeatureFlagDetailParam(['checkout.experimental']), 'checkout.experimental');
  assert.equal(
    readConfigurationFeatureFlagDetailParam(['checkout.experimental', 'extra']),
    'checkout.experimental'
  );
  assert.equal(
    readConfigurationFeatureFlagDetailParam('checkout%2Fexperimental%20flag'),
    'checkout/experimental flag'
  );
  assert.equal(readConfigurationFeatureFlagDetailParam(undefined), null);
  assert.equal(readConfigurationFeatureFlagDetailParam([]), null);
});

test('configuration-feature-flag-view-model: buildConfigurationFeatureFlagDeepLinks routes enabled high-rollout flags to PENDING approvals', () => {
  const flag = buildFlag('checkout.experimental', {
    enabled: true,
    rolloutPercentage: 75,
    subjectKey: 'tenant-A'
  });
  const links = buildConfigurationFeatureFlagDeepLinks(flag, {
    consumer: 'admin',
    tenantId: 'tenant-A',
    brandId: 'brand-A',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
  assert.equal(links.flagHref, '/configuration/flags/checkout.experimental');
  assert.equal(links.approvalsHref, '/approvals?status=PENDING');
  assert.match(links.auditHref, /source=configuration-governance/);
  assert.match(
    links.auditHref,
    /purpose=configuration-flag%3Acheckout\.experimental/
  );
  assert.equal(links.foundationHref, '/foundation?moduleKey=configuration-governance&consumer=admin');
  assert.equal(
    links.workspaceHref,
    '/configuration?tenantId=tenant-A&brandId=brand-A&storeId=store-001&marketCode=cn-mainland'
  );
});

test('configuration-feature-flag-view-model: buildConfigurationFeatureFlagDeepLinks falls back to base approvals for low-risk flags', () => {
  const flag = buildFlag('low.rollout', { enabled: true, rolloutPercentage: 10 });
  const links = buildConfigurationFeatureFlagDeepLinks(flag);
  assert.equal(links.approvalsHref, '/approvals');

  const disabledFlag = buildFlag('disabled.flag', { enabled: false, rolloutPercentage: 0 });
  const disabledLinks = buildConfigurationFeatureFlagDeepLinks(disabledFlag);
  assert.equal(disabledLinks.approvalsHref, '/approvals');
});

test('configuration-feature-flag-view-model: loadConfigurationFeatureFlagDetail returns fallback for empty key', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([buildFlag('a'), buildFlag('b')]);
  try {
    const snapshot = await loadConfigurationFeatureFlagDetail('');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.flag, null);
    assert.equal(snapshot.related.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-feature-flag-view-model: loadConfigurationFeatureFlagDetail matches and finds same-subject-key related flags', async () => {
  const a = buildFlag('shared.a', { subjectKey: 'tenant-A' });
  const b = buildFlag('shared.b', { subjectKey: 'tenant-A' });
  const c = buildFlag('isolated', { subjectKey: 'tenant-B' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([a, b, c]);
  try {
    const snapshot = await loadConfigurationFeatureFlagDetail('shared.a');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.flag?.key, 'shared.a');
    assert.deepEqual(
      snapshot.related.map((flag) => flag.key).sort(),
      ['shared.b']
    );
    assert.equal(snapshot.query.tenantId, 'tenant-demo');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-feature-flag-view-model: loadConfigurationFeatureFlagDetail flags notFound when key missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([buildFlag('only.this')]);
  try {
    const snapshot = await loadConfigurationFeatureFlagDetail('missing');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.flag, null);
    assert.equal(snapshot.related.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-feature-flag-view-model: loadConfigurationFeatureFlagDetail falls back when fetch rejects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error('boom');
  }) as typeof fetch;
  try {
    const snapshot = await loadConfigurationFeatureFlagDetail('any');
    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.flag, null);
    assert.equal(snapshot.overview.configuration.featureFlags.items.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-feature-flag-view-model: loadConfigurationFeatureFlagDetail ignores flags without subjectKey', async () => {
  const a = buildFlag('orphan.a');
  const b = buildFlag('orphan.b');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([a, b]);
  try {
    const snapshot = await loadConfigurationFeatureFlagDetail('orphan.a');
    assert.equal(snapshot.related.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
