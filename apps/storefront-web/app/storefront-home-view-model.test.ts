import assert from 'node:assert/strict';
import test from 'node:test';
import type { FoundationOperationsAlert, FoundationOperationsOverviewResponse } from '@m5/types';
import {
  buildStorefrontHomeAlert,
  buildStorefrontHomeStats,
  loadStorefrontHomeSnapshot,
} from './storefront-home-view-model';

const sampleAlert: FoundationOperationsAlert = {
  severity: 'high',
  code: 'runtime-governance-backlog',
  count: 3,
  summary: '存在待持续跟进的 runtime governance receipt',
  acknowledgement: {
    status: 'ACKED',
    note: '处理中',
    actorId: 'ops.storefront',
    acknowledgedAt: '2026-06-14T00:00:00.000Z',
    mutedUntil: null,
    updatedAt: '2026-06-14T00:05:00.000Z',
  },
  triageState: 'acknowledged',
  triageSummary: '已确认',
  recentOperation: {
    action: 'ACK',
    note: '处理中',
    actorId: 'ops.storefront',
    source: 'storefront-home',
    mutedUntil: null,
    visibleInOverview: true,
    createdAt: '2026-06-14T00:05:00.000Z',
  },
};

const sampleOverview: FoundationOperationsOverviewResponse = {
  generatedAt: '2026-06-14T00:00:00.000Z',
  summary: {
    approvalsPending: 4,
    approvalsWithFailures: 1,
    highRiskAudits: 5,
    blockedLedgers: 0,
    rotationDueSecrets: 0,
    expiredSecrets: 0,
    expiringCertificates: 0,
    expiredCertificates: 0,
    degradedSignals: 2,
    attentionRecoveryPlans: 1,
    staleDrills: 0,
    runtimeGovernanceBacklog: 3,
    stalledRuntimeCallbacks: 1,
    highRiskRuntimeBacklog: 2,
    runtimeBlockedActions: 1,
  },
  alerts: [sampleAlert],
  topRisks: [sampleAlert],
};

test('storefront-home-view-model: builds stat cards from foundation overview', () => {
  const stats = buildStorefrontHomeStats(sampleOverview);

  assert.equal(stats[0]?.value, 1);
  assert.equal(stats[1]?.value, 1);
  assert.equal(stats[3]?.value, 12);
});

test('storefront-home-view-model: maps foundation alert to storefront item', () => {
  const alert = buildStorefrontHomeAlert(sampleAlert);

  assert.equal(alert.id, 'runtime-governance-backlog');
  assert.equal(alert.severity, 'error');
  assert.equal(alert.status, 'acknowledged');
});

test('storefront-home-view-model: loads api snapshot when overview responds', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: sampleOverview,
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    )) as typeof fetch;

  const snapshot = await loadStorefrontHomeSnapshot();

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.stats[0]?.value, 1);
  assert.equal(snapshot.alerts[0]?.id, 'runtime-governance-backlog');
});

test('storefront-home-view-model: falls back when foundation overview is unavailable', async () => {
  globalThis.fetch = (async () => {
    throw new Error('overview unavailable');
  }) as typeof fetch;

  const snapshot = await loadStorefrontHomeSnapshot();

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.ok(snapshot.stats.length > 0);
  assert.ok(snapshot.alerts.length > 0);
});
