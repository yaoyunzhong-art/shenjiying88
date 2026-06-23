import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfigurationCertificateDetailParam } from '@m5/types';
import {
  buildConfigurationCertificateDeepLinks,
  loadConfigurationCertificateDetail
} from './configuration-certificate-view-model';
import type { ConfigurationCertificateMetadata } from '@m5/types';

function buildCertificate(
  name: string,
  overrides: Partial<ConfigurationCertificateMetadata> = {}
): ConfigurationCertificateMetadata {
  return {
    name,
    status: 'active',
    expiresAt: '2026-12-31T00:00:00.000Z',
    autoRenew: true,
    issuer: 'Let’s Encrypt',
    fingerprint: 'fp-001',
    daysToExpire: 200,
    ...overrides
  };
}

function buildOverview(certs: ConfigurationCertificateMetadata[]) {
  return {
    generatedAt: '2026-06-20T00:00:00.000Z',
    approvals: {},
    audits: {},
    configuration: {
      entries: { total: 0, active: 0, namespaces: {}, items: [] },
      featureFlags: { total: 0, enabled: 0, active: 0, byStrategy: {}, items: [] },
      secrets: { total: 0, persisted: 0, static: 0, rotationDue: 0, expired: 0, items: [] },
      certificates: {
        total: certs.length,
        autoRenew: certs.filter((c) => c.autoRenew).length,
        expiringSoon: certs.filter((c) => c.status === 'expiring-soon').length,
        expired: certs.filter((c) => c.status === 'expired').length,
        items: certs
      }
    },
    posture: {
      generatedAt: '2026-06-20T00:00:00.000Z',
      secrets: { total: 0, rotationDue: 0, expired: 0, sharedConsumers: 0 },
      certificates: {
        total: certs.length,
        expiringSoon: certs.filter((c) => c.status === 'expiring-soon').length,
        expired: certs.filter((c) => c.status === 'expired').length,
        autoRenewDisabled: certs.filter((c) => !c.autoRenew).length
      },
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

function mockOverviewResponse(certs: ConfigurationCertificateMetadata[]) {
  return async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/management-metadata')) {
      return new Response(JSON.stringify(envelope([])), { status: 200 });
    }
    return new Response(JSON.stringify(envelope(buildOverview(certs))), { status: 200 });
  };
}

test('configuration-certificate-view-model: readConfigurationCertificateDetailParam decodes array/string/empty', () => {
  assert.equal(readConfigurationCertificateDetailParam('api.tls'), 'api.tls');
  assert.equal(readConfigurationCertificateDetailParam(['api.tls']), 'api.tls');
  assert.equal(readConfigurationCertificateDetailParam(['api.tls', 'dup']), 'api.tls');
  assert.equal(readConfigurationCertificateDetailParam('cdn%2Fedge%20cert'), 'cdn/edge cert');
  assert.equal(readConfigurationCertificateDetailParam(undefined), null);
  assert.equal(readConfigurationCertificateDetailParam([]), null);
});

test('configuration-certificate-view-model: buildConfigurationCertificateDeepLinks maps expiring-soon to PENDING approvals', () => {
  const cert = buildCertificate('api.tls', {
    status: 'expiring-soon',
    issuer: 'DigiCert'
  });
  const links = buildConfigurationCertificateDeepLinks(cert, {
    consumer: 'admin',
    tenantId: 'tenant-A',
    brandId: 'brand-A',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
  assert.equal(links.certificateHref, '/configuration/certificates/api.tls');
  assert.equal(links.approvalsHref, '/approvals?status=PENDING');
  assert.match(links.auditHref, /source=configuration-governance/);
  assert.match(links.auditHref, /purpose=configuration-certificate%3Aapi\.tls/);
  assert.equal(links.foundationHref, '/foundation?moduleKey=configuration-governance&consumer=admin');
  assert.equal(
    links.workspaceHref,
    '/configuration?tenantId=tenant-A&brandId=brand-A&storeId=store-001&marketCode=cn-mainland'
  );
});

test('configuration-certificate-view-model: buildConfigurationCertificateDeepLinks routes expired to ALL approvals', () => {
  const cert = buildCertificate('expired.cert', { status: 'expired' });
  const links = buildConfigurationCertificateDeepLinks(cert);
  assert.equal(links.approvalsHref, '/approvals?status=ALL');
});

test('configuration-certificate-view-model: buildConfigurationCertificateDeepLinks falls back to base approvals for active', () => {
  const cert = buildCertificate('healthy.cert', { status: 'active' });
  const links = buildConfigurationCertificateDeepLinks(cert);
  assert.equal(links.approvalsHref, '/approvals');
});

test('configuration-certificate-view-model: loadConfigurationCertificateDetail returns fallback for empty name', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([buildCertificate('a'), buildCertificate('b')]);
  try {
    const snapshot = await loadConfigurationCertificateDetail('');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.certificate, null);
    assert.equal(snapshot.related.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-certificate-view-model: loadConfigurationCertificateDetail matches and finds same-issuer related certificates', async () => {
  const a = buildCertificate('shared.api', { issuer: 'Let’s Encrypt' });
  const b = buildCertificate('shared.cdn', { issuer: 'Let’s Encrypt' });
  const c = buildCertificate('isolated', { issuer: 'DigiCert' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([a, b, c]);
  try {
    const snapshot = await loadConfigurationCertificateDetail('shared.api');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.certificate?.name, 'shared.api');
    assert.deepEqual(
      snapshot.related.map((cert) => cert.name).sort(),
      ['shared.cdn']
    );
    assert.equal(snapshot.query.tenantId, 'tenant-demo');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-certificate-view-model: loadConfigurationCertificateDetail flags notFound when name missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([buildCertificate('only.this')]);
  try {
    const snapshot = await loadConfigurationCertificateDetail('missing');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.certificate, null);
    assert.equal(snapshot.related.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-certificate-view-model: loadConfigurationCertificateDetail falls back when fetch rejects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error('boom');
  }) as typeof fetch;
  try {
    const snapshot = await loadConfigurationCertificateDetail('any');
    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.certificate, null);
    assert.equal(snapshot.overview.configuration.certificates.items.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-certificate-view-model: loadConfigurationCertificateDetail ignores certificates without an issuer', async () => {
  const a = buildCertificate('orphan.a', { issuer: undefined });
  const b = buildCertificate('orphan.b', { issuer: undefined });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewResponse([a, b]);
  try {
    const snapshot = await loadConfigurationCertificateDetail('orphan.a');
    assert.equal(snapshot.related.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
