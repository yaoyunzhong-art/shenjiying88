import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AuditRecordContract, AuditTrailResponse } from '@m5/types';
import {
  buildAuditTrailRecordDetailHref,
  readAuditTrailRecordDetailParam
} from '@m5/types';
import {
  describeAuditTrailRecordRisk,
  loadAuditTrailRecordDetail,
  summarizeAuditTrailRecord
} from './audit-trail-detail-view-model';

const SAMPLE_TARGET: AuditRecordContract = {
  auditId: 'audit-target-1',
  eventType: 'runtime.action.submitted',
  tenantId: 'tenant-demo',
  actorId: 'actor-007',
  source: 'foundation',
  riskLevel: 'high',
  occurredAt: '2026-06-15T10:00:00.000Z',
  details: { action: 'rotate-secret', reason: 'compliance' }
};

const SAMPLE_RELATED: AuditRecordContract = {
  auditId: 'audit-related-1',
  eventType: 'runtime.action.submitted',
  tenantId: 'tenant-demo',
  actorId: 'actor-007',
  source: 'foundation',
  riskLevel: 'medium',
  occurredAt: '2026-06-15T09:50:00.000Z',
  details: { action: 'rotate-secret', reason: 'compliance' }
};

const SAMPLE_UNRELATED: AuditRecordContract = {
  auditId: 'audit-unrelated-1',
  eventType: 'tenant.snapshot.created',
  tenantId: 'tenant-demo',
  actorId: 'actor-other',
  source: 'configuration',
  riskLevel: 'low',
  occurredAt: '2026-06-15T09:30:00.000Z',
  details: {}
};

const SAMPLE_TRAIL: AuditTrailResponse = {
  records: [SAMPLE_TARGET, SAMPLE_RELATED, SAMPLE_UNRELATED],
  total: 3,
  query: { limit: 100 }
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

function mockAuditFetch(trail: AuditTrailResponse) {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/foundation/trust-governance/audit/summary')) {
      return envelope({
        total: trail.total,
        byAction: {},
        bySource: {},
        byRiskLevel: { low: 0, medium: 0, high: 0 }
      });
    }
    if (url.includes('/foundation/trust-governance/audit')) {
      return envelope(trail.records);
    }
    return envelope({ code: 'NOT_FOUND', message: 'unknown endpoint', data: null });
  }) as typeof fetch;
}

function mockFetchReject() {
  return (async () => {
    throw new Error('network down');
  }) as typeof fetch;
}

test('types: audit-trail record detail href encodes and decodes ids safely', () => {
  assert.equal(
    buildAuditTrailRecordDetailHref('audit-target-1'),
    '/audit-trail/records/audit-target-1'
  );
  assert.equal(
    buildAuditTrailRecordDetailHref('audit/2026/06-1'),
    '/audit-trail/records/audit%2F2026%2F06-1'
  );

  assert.equal(readAuditTrailRecordDetailParam('audit-target-1'), 'audit-target-1');
  assert.equal(readAuditTrailRecordDetailParam(['audit-target-1', 'extra']), 'audit-target-1');
  assert.equal(readAuditTrailRecordDetailParam('audit%2F2026%2F06-1'), 'audit/2026/06-1');
  assert.equal(readAuditTrailRecordDetailParam(undefined), null);
  assert.equal(readAuditTrailRecordDetailParam([]), null);
});

test('audit-trail-detail-view-model: record detail returns matched record with related rows', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockAuditFetch(SAMPLE_TRAIL);
  try {
    const snapshot = await loadAuditTrailRecordDetail('audit-target-1', {}, {});
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.auditId, 'audit-target-1');
    assert.equal(snapshot.record?.riskLevel, 'high');
    assert.equal(snapshot.recordHref, '/audit-trail/records/audit-target-1');
    assert.equal(snapshot.relatedRecords.length, 1);
    assert.equal(snapshot.relatedRecords[0]?.auditId, 'audit-related-1');
    assert.match(snapshot.workspaceHref, /actorId=actor-007/);
    assert.match(snapshot.workspaceHref, /source=foundation/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('audit-trail-detail-view-model: record detail flags notFound when id missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockAuditFetch(SAMPLE_TRAIL);
  try {
    const snapshot = await loadAuditTrailRecordDetail('not-in-trail', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
    assert.equal(snapshot.relatedRecords.length, 0);
    assert.equal(snapshot.recordHref, '/audit-trail/records/not-in-trail');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('audit-trail-detail-view-model: record detail falls back to empty workspace on fetch failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReject();
  try {
    const snapshot = await loadAuditTrailRecordDetail('audit-target-1', {}, {});
    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
    assert.equal(snapshot.relatedRecords.length, 0);
    assert.equal(snapshot.recordHref, '/audit-trail/records/audit-target-1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('audit-trail-detail-view-model: summarize and risk description helpers describe records', () => {
  const summary = summarizeAuditTrailRecord(SAMPLE_TARGET);
  assert.match(summary, /runtime.action.submitted/);
  assert.match(summary, /foundation/);
  assert.match(summary, /actor-007/);

  assert.match(describeAuditTrailRecordRisk(SAMPLE_TARGET), /高风险/);
  assert.match(describeAuditTrailRecordRisk(SAMPLE_RELATED), /中风险/);
  assert.match(describeAuditTrailRecordRisk(SAMPLE_UNRELATED), /低风险/);
});
