import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfigurationSecretDetailParam } from '@m5/types';
import {
  buildConfigurationSecretDeepLinks,
  loadConfigurationSecretDetail
} from './configuration-secret-view-model';
import type { ConfigurationSecretMetadata } from '@m5/types';

function buildSecret(
  name: string,
  overrides: Partial<ConfigurationSecretMetadata> = {}
): ConfigurationSecretMetadata {
  return {
    name,
    status: 'active',
    version: 1,
    consumers: [],
    source: 'vault',
    ...overrides
  };
}

function buildOverview(secrets: ConfigurationSecretMetadata[]) {
  return {
    generatedAt: '2026-06-20T00:00:00.000Z',
    approvals: {},
    audits: {},
    configuration: {
      entries: { total: 0, active: 0, namespaces: {}, items: [] },
      featureFlags: { total: 0, enabled: 0, active: 0, byStrategy: {}, items: [] },
      secrets: { total: secrets.length, persisted: secrets.length, static: 0, rotationDue: 0, expired: 0, items: secrets },
      certificates: { total: 0, autoRenew: 0, expiringSoon: 0, expired: 0, items: [] }
    },
    posture: {
      generatedAt: '2026-06-20T00:00:00.000Z',
      secrets: { total: secrets.length, rotationDue: 0, expired: 0, sharedConsumers: 1 },
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

function mockOverviewResponse(secrets: ConfigurationSecretMetadata[]) {
  return async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/management-metadata')) {
      return new Response(JSON.stringify(envelope([])), { status: 200 });
    }
    return new Response(JSON.stringify(envelope(buildOverview(secrets))), { status: 200 });
  };
}

test('configuration-secret-view-model: readConfigurationSecretDetailParam decodes array/string/empty', () => {
  assert.equal(readConfigurationSecretDetailParam('checkout.api-key'), 'checkout.api-key');
  assert.equal(readConfigurationSecretDetailParam(['checkout.api-key']), 'checkout.api-key');
  assert.equal(readConfigurationSecretDetailParam(['checkout.api-key', 'dup']), 'checkout.api-key');
  assert.equal(readConfigurationSecretDetailParam('vault%2Froot%2Ftoken'), 'vault/root/token');
  assert.equal(readConfigurationSecretDetailParam(undefined), null);
  assert.equal(readConfigurationSecretDetailParam([]), null);
});

test('configuration-secret-view-model: buildConfigurationSecretDeepLinks targets approvals audit foundation workspace', () => {
  const secret = buildSecret('payment.gateway-key', {
    status: 'rotation-due',
    consumers: ['checkout-svc', 'payment-svc']
  });
  const links = buildConfigurationSecretDeepLinks(secret, {
    consumer: 'admin',
    tenantId: 'tenant-A',
    brandId: 'brand-A',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
  assert.equal(links.secretHref, '/configuration/secrets/payment.gateway-key');
  assert.equal(links.approvalsHref, '/approvals?status=PENDING');
  assert.match(links.auditHref, /source=configuration-governance/);
  assert.match(links.auditHref, /purpose=configuration-secret%3Apayment\.gateway-key/);
  assert.equal(links.foundationHref, '/foundation?moduleKey=configuration-governance&consumer=admin');
  assert.equal(
    links.workspaceHref,
    '/configuration?tenantId=tenant-A&brandId=brand-A&storeId=store-001&marketCode=cn-mainland'
  );
});

test('configuration-secret-view-model: buildConfigurationSecretDeepLinks routes to ALL approvals for expired', () => {
  const secret = buildSecret('expired.key', { status: 'expired' });
  const links = buildConfigurationSecretDeepLinks(secret);
  assert.equal(links.approvalsHref, '/approvals?status=ALL');
});

test('configuration-secret-view-model: buildConfigurationSecretDeepLinks falls back to base approvals route when active', () => {
  const secret = buildSecret('active.key', { status: 'active' });
  const links = buildConfigurationSecretDeepLinks(secret);
  assert.equal(links.approvalsHref, '/approvals');
});

test('configuration-secret-view-model: loadConfigurationSecretDetail returns fallback for empty name', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([buildSecret('a'), buildSecret('b')]);
  try {
    const snapshot = await loadConfigurationSecretDetail('');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.secret, null);
    assert.equal(snapshot.related.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-secret-view-model: loadConfigurationSecretDetail matches secret and finds shared consumers', async () => {
  const a = buildSecret('shared.a', { consumers: ['consumer-x', 'consumer-y'] });
  const b = buildSecret('shared.b', { consumers: ['consumer-y', 'consumer-z'] });
  const c = buildSecret('isolated', { consumers: ['consumer-w'] });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([a, b, c]);
  try {
    const snapshot = await loadConfigurationSecretDetail('shared.a');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.secret?.name, 'shared.a');
    assert.deepEqual(
      snapshot.related.map((s) => s.name).sort(),
      ['shared.b']
    );
    assert.equal(snapshot.query.tenantId, 'tenant-demo');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-secret-view-model: loadConfigurationSecretDetail flags notFound when name is missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([buildSecret('only.this')]);
  try {
    const snapshot = await loadConfigurationSecretDetail('missing');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.secret, null);
    assert.equal(snapshot.related.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-secret-view-model: loadConfigurationSecretDetail falls back when fetch rejects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error('boom');
  }) as typeof fetch;
  try {
    const snapshot = await loadConfigurationSecretDetail('any');
    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.secret, null);
    assert.equal(snapshot.overview.configuration.secrets.items.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-secret-view-model: loadConfigurationSecretDetail ignores secrets with no shared consumers', async () => {
  const a = buildSecret('orphan.a', { consumers: [] });
  const b = buildSecret('orphan.b', { consumers: [] });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([a, b]);
  try {
    const snapshot = await loadConfigurationSecretDetail('orphan.a');
    assert.equal(snapshot.related.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
