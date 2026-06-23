import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfigurationConfigEntryDetailParam } from '@m5/types';
import {
  buildConfigurationConfigEntryDeepLinks,
  loadConfigurationConfigEntryDetail
} from './configuration-config-entry-view-model';
import type { ConfigurationConfigEntry } from '@m5/types';

function buildEntry(
  id: string,
  overrides: Partial<ConfigurationConfigEntry> = {}
): ConfigurationConfigEntry {
  return {
    id,
    key: id,
    scopeType: 'TENANT',
    updatedAt: '2026-06-20T00:00:00.000Z',
    ...overrides
  };
}

function buildOverview(entries: ConfigurationConfigEntry[]) {
  return {
    generatedAt: '2026-06-20T00:00:00.000Z',
    approvals: {},
    audits: {},
    configuration: {
      entries: {
        total: entries.length,
        active: entries.filter((e) => (e.status ?? 'active') === 'active').length,
        namespaces: {},
        items: entries
      },
      featureFlags: { total: 0, enabled: 0, active: 0, byStrategy: {}, items: [] },
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

function mockOverviewResponse(entries: ConfigurationConfigEntry[]) {
  return async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/management-metadata')) {
      return new Response(JSON.stringify(envelope([])), { status: 200 });
    }
    return new Response(JSON.stringify(envelope(buildOverview(entries))), { status: 200 });
  };
}

test('configuration-config-entry-view-model: readConfigurationConfigEntryDetailParam decodes array/string/empty', () => {
  assert.equal(readConfigurationConfigEntryDetailParam('checkout.fee'), 'checkout.fee');
  assert.equal(readConfigurationConfigEntryDetailParam(['checkout.fee']), 'checkout.fee');
  assert.equal(
    readConfigurationConfigEntryDetailParam(['checkout.fee', 'extra']),
    'checkout.fee'
  );
  assert.equal(
    readConfigurationConfigEntryDetailParam('checkout%2Ffee%20rules'),
    'checkout/fee rules'
  );
  assert.equal(readConfigurationConfigEntryDetailParam(undefined), null);
  assert.equal(readConfigurationConfigEntryDetailParam([]), null);
});

test('configuration-config-entry-view-model: buildConfigurationConfigEntryDeepLinks routes pending-review to PENDING approvals', () => {
  const entry = buildEntry('checkout.fee', {
    status: 'pending-review',
    namespace: 'payments'
  });
  const links = buildConfigurationConfigEntryDeepLinks(entry, {
    consumer: 'admin',
    tenantId: 'tenant-A',
    brandId: 'brand-A',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
  assert.equal(links.entryHref, '/configuration/entries/checkout.fee');
  assert.equal(links.approvalsHref, '/approvals?status=PENDING');
  assert.match(links.auditHref, /source=configuration-governance/);
  assert.match(links.auditHref, /purpose=configuration-entry%3Acheckout\.fee/);
  assert.equal(links.foundationHref, '/foundation?moduleKey=configuration-governance&consumer=admin');
  assert.equal(
    links.workspaceHref,
    '/configuration?tenantId=tenant-A&brandId=brand-A&storeId=store-001&marketCode=cn-mainland'
  );
});

test('configuration-config-entry-view-model: buildConfigurationConfigEntryDeepLinks routes deprecated to PENDING approvals', () => {
  const entry = buildEntry('legacy.key', { status: 'deprecated' });
  const links = buildConfigurationConfigEntryDeepLinks(entry);
  assert.equal(links.approvalsHref, '/approvals?status=PENDING');
});

test('configuration-config-entry-view-model: buildConfigurationConfigEntryDeepLinks falls back to base approvals for active entries', () => {
  const entry = buildEntry('stable.key', { status: 'active' });
  const links = buildConfigurationConfigEntryDeepLinks(entry);
  assert.equal(links.approvalsHref, '/approvals');
});

test('configuration-config-entry-view-model: loadConfigurationConfigEntryDetail returns fallback for empty id', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([buildEntry('a'), buildEntry('b')]);
  try {
    const snapshot = await loadConfigurationConfigEntryDetail('');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.entry, null);
    assert.equal(snapshot.revisions.length, 0);
    assert.equal(snapshot.related.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-config-entry-view-model: loadConfigurationConfigEntryDetail matches and finds same-namespace related entries', async () => {
  const b = buildEntry('payments.tax', { namespace: 'payments' });
  const c = buildEntry('shipping.weight', { namespace: 'shipping' });
  const revision = {
    version: 2,
    changedBy: 'admin',
    changeReason: 'rollout 50%',
    createdAt: '2026-06-20T00:00:00.000Z'
  };
  const aWithRevision = buildEntry('payments.fee', {
    namespace: 'payments',
    latestRevision: revision,
    version: 2
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([aWithRevision, b, c]);
  try {
    const snapshot = await loadConfigurationConfigEntryDetail('payments.fee');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.entry?.id, 'payments.fee');
    assert.equal(snapshot.revisions.length, 1);
    assert.equal(snapshot.revisions[0]?.version, 2);
    assert.deepEqual(
      snapshot.related.map((item) => item.id).sort(),
      ['payments.tax']
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-config-entry-view-model: loadConfigurationConfigEntryDetail matches by shared schemaRef', async () => {
  const a = buildEntry('checkout.fee', { schemaRef: 'payments-v1' });
  const b = buildEntry('checkout.tax', { schemaRef: 'payments-v1', namespace: 'tax' });
  const c = buildEntry('other.key');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([a, b, c]);
  try {
    const snapshot = await loadConfigurationConfigEntryDetail('checkout.fee');
    assert.deepEqual(
      snapshot.related.map((item) => item.id).sort(),
      ['checkout.tax']
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-config-entry-view-model: loadConfigurationConfigEntryDetail flags notFound when id missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([buildEntry('only.this')]);
  try {
    const snapshot = await loadConfigurationConfigEntryDetail('missing');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.entry, null);
    assert.equal(snapshot.revisions.length, 0);
    assert.equal(snapshot.related.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-config-entry-view-model: loadConfigurationConfigEntryDetail falls back when fetch rejects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error('boom');
  }) as typeof fetch;
  try {
    const snapshot = await loadConfigurationConfigEntryDetail('any');
    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.entry, null);
    assert.equal(snapshot.overview.configuration.entries.items.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-config-entry-view-model: loadConfigurationConfigEntryDetail ignores entries without namespace or schemaRef', async () => {
  const a = buildEntry('orphan.a');
  const b = buildEntry('orphan.b');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([a, b]);
  try {
    const snapshot = await loadConfigurationConfigEntryDetail('orphan.a');
    assert.equal(snapshot.related.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
