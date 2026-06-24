import { test } from 'node:test';
import assert from 'node:assert/strict';
import type {
  QuotaLedgerRecord,
  RateLimitPolicyRecord,
  RateLimitWorkspace
} from '@m5/types';
import {
  loadRateLimitsPolicyDetail,
  loadRateLimitsLedgerDetail
} from './rate-limits-detail-view-model';

const SAMPLE_POLICY: RateLimitPolicyRecord = {
  id: 'policy-1',
  code: 'foundation.api.tenant',
  scopeType: 'TENANT',
  tenantId: 'tenant-demo',
  brandId: null,
  storeId: null,
  integrationAppId: null,
  period: 'MINUTE',
  limit: 600,
  burstLimit: 800,
  dimensionKeys: ['scopeKey'],
  algorithm: 'FIXED_WINDOW',
  metadata: { team: 'platform' },
  updatedAt: '2026-06-14T08:00:00.000Z'
};

const SAMPLE_LEDGER_BLOCKED: QuotaLedgerRecord = {
  id: 'ledger-1',
  subjectKey: 'tenant-demo',
  period: 'MINUTE',
  consumed: 600,
  remaining: 0,
  resetAt: '2026-06-14T08:01:00.000Z',
  metadata: { blockedUntil: '2099-01-01T00:00:00.000Z' },
  updatedAt: '2026-06-14T08:00:00.000Z',
  policy: { id: 'policy-1', code: SAMPLE_POLICY.code, limit: SAMPLE_POLICY.limit, period: SAMPLE_POLICY.period }
};

const SAMPLE_LEDGER_WARNING: QuotaLedgerRecord = {
  ...SAMPLE_LEDGER_BLOCKED,
  id: 'ledger-2',
  subjectKey: 'tenant-demo:order-write',
  consumed: 520,
  remaining: 80,
  metadata: { team: 'platform' },
  resetAt: '2026-06-14T08:01:00.000Z',
  updatedAt: '2026-06-14T08:00:00.000Z'
};

const SAMPLE_WORKSPACE: RateLimitWorkspace = {
  generatedAt: '2026-06-14T08:00:00.000Z',
  totals: {
    policies: 1,
    activePolicies: 1,
    ledgers: 2,
    blockedLedgers: 1,
    highConsumptionLedgers: 1
  },
  policies: [SAMPLE_POLICY],
  ledgers: [SAMPLE_LEDGER_BLOCKED, SAMPLE_LEDGER_WARNING],
  byPeriod: { MINUTE: 1 },
  byScope: { TENANT: 1 }
};

function envelope(payload: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ code: 'OK', message: '', data: payload }),
    text: async () => JSON.stringify({ code: 'OK', message: '', data: payload })
  } as Response;
}

function mockWorkspaceFetch(workspace: RateLimitWorkspace) {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/rate-limit/policies')) {
      return envelope(workspace.policies);
    }
    if (url.includes('/rate-limit/ledgers')) {
      return envelope(workspace.ledgers);
    }
    return envelope({ code: 'NOT_FOUND', message: 'unknown endpoint', data: null });
  }) as typeof fetch;
}

function mockFetchReject() {
  return (async () => {
    throw new Error('network down');
  }) as typeof fetch;
}

test('rate-limits-detail-view-model: policy detail returns matched record and ledgers', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(SAMPLE_WORKSPACE);
  try {
    const snapshot = await loadRateLimitsPolicyDetail('policy-1', {}, {});
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.id, 'policy-1');
    assert.equal(snapshot.record?.code, 'foundation.api.tenant');
    assert.equal(snapshot.matchedLedgers.length, 2);
    assert.ok(snapshot.matchedLedgers.every((ledger) => ledger.policy.id === 'policy-1'));
    assert.equal(snapshot.policyHref, '/rate-limits/policies/policy-1');
    assert.match(snapshot.auditHref, /source=rate-limits/);
    assert.match(snapshot.auditHref, /purpose=rate-limit-policy/);
    assert.match(snapshot.foundationHref, /moduleKey=rate-limits/);
    assert.equal(snapshot.workspaceHref, '/rate-limits');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rate-limits-detail-view-model: policy detail flags notFound when policy missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(SAMPLE_WORKSPACE);
  try {
    const snapshot = await loadRateLimitsPolicyDetail('unknown-policy', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
    assert.equal(snapshot.matchedLedgers.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rate-limits-detail-view-model: ledger detail returns matched record and policy link', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(SAMPLE_WORKSPACE);
  try {
    const snapshot = await loadRateLimitsLedgerDetail('ledger-1', {}, {});
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.id, 'ledger-1');
    assert.equal(snapshot.record?.subjectKey, 'tenant-demo');
    assert.ok(snapshot.matchedPolicy, 'matchedPolicy should resolve to workspace policy');
    assert.equal(snapshot.matchedPolicy?.id, 'policy-1');
    assert.equal(snapshot.ledgerHref, '/rate-limits/ledgers/ledger-1');
    assert.match(snapshot.auditHref, /purpose=rate-limit-ledger/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rate-limits-detail-view-model: ledger detail flags notFound when ledger missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(SAMPLE_WORKSPACE);
  try {
    const snapshot = await loadRateLimitsLedgerDetail('not-in-workspace', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
    assert.equal(snapshot.matchedPolicy, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rate-limits-detail-view-model: both loaders fall back to empty workspace on fetch failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReject();
  try {
    const policy = await loadRateLimitsPolicyDetail('policy-1', {}, {});
    assert.equal(policy.deliveryMode, 'fallback');
    assert.equal(policy.notFound, true);
    assert.equal(policy.record, null);
    assert.equal(policy.matchedLedgers.length, 0);

    const ledger = await loadRateLimitsLedgerDetail('ledger-1', {}, {});
    assert.equal(ledger.deliveryMode, 'fallback');
    assert.equal(ledger.notFound, true);
    assert.equal(ledger.record, null);
    assert.equal(ledger.matchedPolicy, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
