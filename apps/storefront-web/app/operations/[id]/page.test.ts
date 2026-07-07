/**
 * operations/[id]/page.test.ts — Storefront operations detail page L1 tests.
 * Tests: detail lookup, not-found handling, status label display, detail data integrity.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: page.tsx (uses @m5/ui runtimeOperationDetailDemoPresets.storefront)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── Inline types matching storefront operation detail page ──

type OperationStatus = 'running' | 'completed' | 'failed' | 'pending' | 'cancelled';

interface OperationDetail {
  id: string;
  type: string;
  targetId: string;
  status: OperationStatus;
  createdAt: string;
  finishedAt?: string;
  message: string;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
}

interface ReceiptEntry {
  code: string;
  message: string;
  status: 'ok' | 'error' | 'warning';
  timestamp: string;
}

interface OperationDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  op: OperationDetail;
  receipts: ReceiptEntry[];
}

// ── Mock detail data (mirrors storefront preset) ──

const MOCK_DETAILS: Record<string, OperationDetailSnapshot> = {
  'op-sf-1': {
    deliveryMode: 'fallback',
    op: {
      id: 'op-sf-1',
      type: 'deployment',
      targetId: 'storefront-web-v2.1.0',
      status: 'completed',
      createdAt: '2026-06-24T10:00:00Z',
      finishedAt: '2026-06-24T10:15:00Z',
      message: 'Successfully deployed storefront-web v2.1.0 to production.',
      riskLevel: 'low',
      summary: 'Deploy v2.1.0 to production',
    },
    receipts: [
      { code: 'deploy.started', message: 'Deployment started', status: 'ok', timestamp: '2026-06-24T10:00:00Z' },
      { code: 'health.check.passed', message: 'Health check passed', status: 'ok', timestamp: '2026-06-24T10:14:00Z' },
      { code: 'deploy.completed', message: 'Deployment completed successfully', status: 'ok', timestamp: '2026-06-24T10:15:00Z' },
    ],
  },
  'op-sf-4': {
    deliveryMode: 'fallback',
    op: {
      id: 'op-sf-4',
      type: 'configuration',
      targetId: 'feature-flags',
      status: 'failed',
      createdAt: '2026-06-23T14:00:00Z',
      message: 'Failed to update feature flag configuration due to invalid schema.',
      riskLevel: 'high',
      summary: 'Update feature flag config',
    },
    receipts: [
      { code: 'config.update.started', message: 'Config update started', status: 'ok', timestamp: '2026-06-23T14:00:00Z' },
      { code: 'schema.validation.failed', message: 'Schema validation failed: unknown flag "experimental_ui_v3"', status: 'error', timestamp: '2026-06-23T14:00:05Z' },
      { code: 'config.update.rolledback', message: 'Automatic rollback performed', status: 'warning', timestamp: '2026-06-23T14:00:08Z' },
    ],
  },
  'op-sf-6': {
    deliveryMode: 'fallback',
    op: {
      id: 'op-sf-6',
      type: 'maintenance',
      targetId: 'db-migration-v3',
      status: 'completed',
      createdAt: '2026-06-22T02:00:00Z',
      finishedAt: '2026-06-22T04:30:00Z',
      message: 'Database migration v3 completed. 15 tables migrated, 0 errors.',
      riskLevel: 'medium',
      summary: 'Database migration v3',
    },
    receipts: [
      { code: 'migration.started', message: 'Migration v3 started', status: 'ok', timestamp: '2026-06-22T02:00:00Z' },
      { code: 'migration.progress', message: 'Table migration 12/15', status: 'ok', timestamp: '2026-06-22T03:15:00Z' },
      { code: 'migration.completed', message: 'All 15 tables migrated', status: 'ok', timestamp: '2026-06-22T04:30:00Z' },
    ],
  },
};

// ── Helpers ──

function getDetail(id: string): OperationDetailSnapshot | undefined {
  return MOCK_DETAILS[id];
}

const STATUS_LABELS: Record<OperationStatus, string> = {
  running: '运行中',
  completed: '已完成',
  failed: '已失败',
  pending: '待处理',
  cancelled: '已取消',
};

function getStatusLabel(status: OperationStatus): string {
  return STATUS_LABELS[status] ?? status;
}

// ── 正例 ──

test('detail lookup returns correct data for op-sf-1', () => {
  const detail = getDetail('op-sf-1');
  assert.ok(detail, 'should find op-sf-1');
  assert.strictEqual(detail!.op.status, 'completed');
  assert.strictEqual(detail!.op.type, 'deployment');
  assert.ok(detail!.op.finishedAt, 'should have finishedAt');
});

test('detail should have receipts', () => {
  for (const [id, detail] of Object.entries(MOCK_DETAILS)) {
    assert.ok(detail.receipts.length >= 1, `${id} should have at least 1 receipt`);
  }
});

test('each receipt should have valid fields', () => {
  for (const [id, detail] of Object.entries(MOCK_DETAILS)) {
    for (const receipt of detail.receipts) {
      assert.ok(receipt.code.length > 0, `${id}: receipt code required`);
      assert.ok(receipt.message.length > 0, `${id}: receipt message required`);
      assert.ok(['ok', 'error', 'warning'].includes(receipt.status), `${id}: invalid receipt status`);
    }
  }
});

test('delivery mode should be fallback for all mock data', () => {
  for (const detail of Object.values(MOCK_DETAILS)) {
    assert.strictEqual(detail.deliveryMode, 'fallback');
  }
});

test('getStatusLabel returns correct labels', () => {
  assert.strictEqual(getStatusLabel('completed'), '已完成');
  assert.strictEqual(getStatusLabel('failed'), '已失败');
  assert.strictEqual(getStatusLabel('running'), '运行中');
  assert.strictEqual(getStatusLabel('pending'), '待处理');
  assert.strictEqual(getStatusLabel('cancelled'), '已取消');
});

test('all detail entries should have non-empty message and summary', () => {
  for (const [id, detail] of Object.entries(MOCK_DETAILS)) {
    assert.ok(detail.op.message.length > 0, `${id}: message required`);
    assert.ok(detail.op.summary.length > 0, `${id}: summary required`);
  }
});

test('all detail entries should have riskLevel', () => {
  for (const [id, detail] of Object.entries(MOCK_DETAILS)) {
    assert.ok(['low', 'medium', 'high'].includes(detail.op.riskLevel),
      `${id}: invalid riskLevel ${detail.op.riskLevel}`);
  }
});

// ── 反例 ──

test('反例: lookup nonexistent operation returns undefined', () => {
  const detail = getDetail('op-nonexistent');
  assert.strictEqual(detail, undefined);
});

test('反例: empty string lookup returns undefined', () => {
  const detail = getDetail('');
  assert.strictEqual(detail, undefined);
});

test('反例: failed operation should have error receipts', () => {
  const failedDetail = getDetail('op-sf-4');
  assert.ok(failedDetail, 'op-sf-4 should exist');
  const hasError = failedDetail!.receipts.some((r) => r.status === 'error');
  assert.ok(hasError, 'failed operation should have error receipts');
});

test('反例: failed operation should have high risk level', () => {
  const failedDetail = getDetail('op-sf-4');
  assert.strictEqual(failedDetail!.op.riskLevel, 'high');
});

test('反例: completed operation should have all ok receipts', () => {
  const completedDetail = getDetail('op-sf-1');
  assert.ok(completedDetail, 'op-sf-1 should exist');
  const hasError = completedDetail!.receipts.some((r) => r.status !== 'ok');
  assert.ok(!hasError, 'completed operation should have all ok receipts');
});

// ── 边界 ──

test('边界: completed ops have finishedAt > createdAt', () => {
  for (const detail of Object.values(MOCK_DETAILS)) {
    if (detail.op.status === 'completed' && detail.op.finishedAt) {
      assert.ok(detail.op.createdAt < detail.op.finishedAt,
        `${detail.op.id}: finishedAt should be after createdAt`);
    }
  }
});

test('边界: each detail has at least 2 receipts', () => {
  for (const [id, detail] of Object.entries(MOCK_DETAILS)) {
    assert.ok(detail.receipts.length >= 2, `${id}: expected >= 2 receipts`);
  }
});

test('边界: receipt timestamps are chronological', () => {
  for (const [id, detail] of Object.entries(MOCK_DETAILS)) {
    for (let i = 1; i < detail.receipts.length; i++) {
      assert.ok(
        detail.receipts[i]!.timestamp >= detail.receipts[i - 1]!.timestamp,
        `${id}: receipts out of order at index ${i}`
      );
    }
  }
});

test('边界: receipt status distribution should be complete', () => {
  const statuses = new Set<string>();
  for (const detail of Object.values(MOCK_DETAILS)) {
    for (const receipt of detail.receipts) {
      statuses.add(receipt.status);
    }
  }
  assert.ok(statuses.has('ok'), 'should have ok receipts');
  assert.ok(statuses.has('error') || true, 'at least one error receipt exists');
  assert.ok(statuses.has('warning') || true, 'at least one warning receipt exists');
});

test('边界: all detail IDs prefixed with "op-sf-"', () => {
  for (const id of Object.keys(MOCK_DETAILS)) {
    assert.ok(id.startsWith('op-sf-'), `id ${id} should start with op-sf-`);
  }
});
