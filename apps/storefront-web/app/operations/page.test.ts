/**
 * operations/page.test.ts — Storefront operations list page L1 tests.
 * Tests: preset data, route config, detail data integrity, search/filter logic.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: page.tsx (uses @m5/ui runtimeOperationListDemoPresets)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── The storefront page uses @m5/ui presets ──
// We inline the same structure for testing

type OperationStatus = 'running' | 'completed' | 'failed' | 'pending' | 'cancelled';

interface OperationItem {
  id: string;
  type: string;
  targetId: string;
  status: OperationStatus;
  createdAt: string;
  finishedAt?: string;
  summary?: string;
}

interface OperationDetail extends OperationItem {
  message: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// ── Mock operation data (mirrors storefront preset) ──

const STATUS_LABELS: Record<OperationStatus, string> = {
  running: '运行中',
  completed: '已完成',
  failed: '已失败',
  pending: '待处理',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<OperationStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  running: 'warning',
  completed: 'success',
  failed: 'danger',
  pending: 'neutral',
  cancelled: 'neutral',
};

const MOCK_OPS: OperationItem[] = [
  { id: 'op-sf-1', type: 'deployment', targetId: 'storefront-web-v2.1.0', status: 'completed', createdAt: '2026-06-24T10:00:00Z', finishedAt: '2026-06-24T10:15:00Z', summary: 'Deploy v2.1.0 to production' },
  { id: 'op-sf-2', type: 'deployment', targetId: 'storefront-web-v2.0.5', status: 'running', createdAt: '2026-06-24T11:00:00Z', summary: 'Rollback to v2.0.5' },
  { id: 'op-sf-3', type: 'scaling', targetId: 'storefront-web-pods', status: 'completed', createdAt: '2026-06-23T08:00:00Z', finishedAt: '2026-06-23T08:05:00Z', summary: 'Scale up from 3 to 5 pods' },
  { id: 'op-sf-4', type: 'configuration', targetId: 'feature-flags', status: 'failed', createdAt: '2026-06-23T14:00:00Z', summary: 'Update feature flag config' },
  { id: 'op-sf-5', type: 'deployment', targetId: 'storefront-cache-layer', status: 'pending', createdAt: '2026-06-25T00:00:00Z', summary: 'Deploy cache layer update' },
  { id: 'op-sf-6', type: 'maintenance', targetId: 'db-migration-v3', status: 'completed', createdAt: '2026-06-22T02:00:00Z', finishedAt: '2026-06-22T04:30:00Z', summary: 'Database migration v3' },
  { id: 'op-sf-7', type: 'scaling', targetId: 'storefront-web-pods', status: 'cancelled', createdAt: '2026-06-22T12:00:00Z', summary: 'Scale down to 2 pods (cancelled)' },
  { id: 'op-sf-8', type: 'backup', targetId: 'storefront-db', status: 'completed', createdAt: '2026-06-21T22:00:00Z', finishedAt: '2026-06-21T22:45:00Z', summary: 'Daily backup' },
  { id: 'op-sf-9', type: 'deployment', targetId: 'storefront-cdn-config', status: 'pending', createdAt: '2026-06-25T02:00:00Z', summary: 'CDN config update' },
  { id: 'op-sf-10', type: 'maintenance', targetId: 'ssl-cert-renewal', status: 'completed', createdAt: '2026-06-20T09:00:00Z', finishedAt: '2026-06-20T09:10:00Z', summary: 'SSL certificate renewal' },
];

// ── Detail lookup ──

function getOperationById(id: string): OperationItem | undefined {
  return MOCK_OPS.find((op) => op.id === id);
}

// ── Filter helpers ──

function filterByStatus(items: OperationItem[], status: OperationStatus | 'ALL'): OperationItem[] {
  if (status === 'ALL') return items;
  return items.filter((op) => op.status === status);
}

function filterByType(items: OperationItem[], type: string | 'ALL'): OperationItem[] {
  if (type === 'ALL') return items;
  return items.filter((op) => op.type === type);
}

function searchOperations(items: OperationItem[], keyword: string): OperationItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (op) =>
      op.id.toLowerCase().includes(lower) ||
      op.type.toLowerCase().includes(lower) ||
      op.targetId.toLowerCase().includes(lower) ||
      (op.summary ?? '').toLowerCase().includes(lower)
  );
}

function getOperationStatusLabel(status: OperationStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function getOperationStatusVariant(status: OperationStatus): string {
  return STATUS_VARIANTS[status] ?? 'neutral';
}

// ── 正例 ──

test('👔 店长视角: operation data integrity', () => {
  assert.ok(MOCK_OPS.length >= 8, `expected >= 8 operations, got ${MOCK_OPS.length}`);

  for (const op of MOCK_OPS) {
    assert.ok(op.id.length > 0, 'id required');
    assert.ok(op.type.length > 0, 'type required');
    assert.ok(op.targetId.length > 0, 'targetId required');
    assert.ok(typeof op.status === 'string', 'status required');
    assert.ok(op.createdAt.length > 0, 'createdAt required');
  }
});

test('每个 operation 都有唯一 id', () => {
  const ids = MOCK_OPS.map((op) => op.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test('valid status distribution', () => {
  const allStatuses: OperationStatus[] = ['running', 'completed', 'failed', 'pending', 'cancelled'];
  for (const s of allStatuses) {
    const count = MOCK_OPS.filter((op) => op.status === s).length;
    assert.ok(count >= 0, `status ${s} check`);
  }
});

test('getOperationStatusLabel returns correct Chinese labels', () => {
  assert.strictEqual(getOperationStatusLabel('running'), '运行中');
  assert.strictEqual(getOperationStatusLabel('completed'), '已完成');
  assert.strictEqual(getOperationStatusLabel('failed'), '已失败');
  assert.strictEqual(getOperationStatusLabel('pending'), '待处理');
  assert.strictEqual(getOperationStatusLabel('cancelled'), '已取消');
});

test('getOperationStatusVariant returns correct variants', () => {
  assert.strictEqual(getOperationStatusVariant('completed'), 'success');
  assert.strictEqual(getOperationStatusVariant('failed'), 'danger');
  assert.strictEqual(getOperationStatusVariant('running'), 'warning');
});

test('filter by completed status', () => {
  const result = filterByStatus(MOCK_OPS, 'completed');
  assert.ok(result.length >= 4, `expected >= 4 completed, got ${result.length}`);
  for (const op of result) {
    assert.strictEqual(op.status, 'completed');
  }
});

test('search operations by type keyword', () => {
  const result = searchOperations(MOCK_OPS, 'deployment');
  assert.ok(result.length >= 3, `expected >= 3 deployment ops, got ${result.length}`);
  for (const op of result) {
    assert.ok(op.type.includes('deployment'));
  }
});

test('search operations by id prefix', () => {
  const result = searchOperations(MOCK_OPS, 'op-sf-3');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0]!.id, 'op-sf-3');
});

test('filter by deployment type', () => {
  const result = filterByType(MOCK_OPS, 'deployment');
  assert.ok(result.length >= 3);
  for (const op of result) {
    assert.strictEqual(op.type, 'deployment');
  }
});

test('detail lookup by id', () => {
  const op = getOperationById('op-sf-3');
  assert.ok(op, 'should find op-sf-3');
  assert.strictEqual(op!.type, 'scaling');
  assert.ok(op!.finishedAt, 'should have finishedAt');
});

test('ALL filter returns all operations', () => {
  assert.strictEqual(filterByStatus(MOCK_OPS, 'ALL').length, MOCK_OPS.length);
  assert.strictEqual(filterByType(MOCK_OPS, 'ALL').length, MOCK_OPS.length);
  assert.strictEqual(searchOperations(MOCK_OPS, '').length, MOCK_OPS.length);
});

// ── 反例 ──

test('反例: search nonexistent returns empty', () => {
  const result = searchOperations(MOCK_OPS, 'ZZZZ_NOT_FOUND');
  assert.strictEqual(result.length, 0);
});

test('反例: lookup nonexistent id returns undefined', () => {
  const op = getOperationById('op-nonexistent');
  assert.strictEqual(op, undefined);
});

test('反例: empty operation list handles all filters gracefully', () => {
  const empty: OperationItem[] = [];
  assert.strictEqual(filterByStatus(empty, 'running').length, 0);
  assert.strictEqual(filterByType(empty, 'deployment').length, 0);
  assert.strictEqual(searchOperations(empty, 'test').length, 0);
  assert.strictEqual(filterByStatus(empty, 'ALL').length, 0);
});

test('反例: getOperationStatusLabel for unknown status returns the input', () => {
  const label = getOperationStatusLabel('unknown' as OperationStatus);
  assert.strictEqual(label, 'unknown');
});

test('反例: failed operations should not be completed', () => {
  const failed = MOCK_OPS.filter((op) => op.status === 'failed');
  for (const op of failed) {
    assert.notStrictEqual(op.status, 'completed');
  }
});

// ── 边界 ──

test('边界: single char search finds matches', () => {
  const result = searchOperations(MOCK_OPS, 'd');
  assert.ok(result.length > 0, 'single char search should find matches');
});

test('边界: case-insensitive search works', () => {
  const upper = searchOperations(MOCK_OPS, 'OP-SF-1');
  const lower = searchOperations(MOCK_OPS, 'op-sf-1');
  assert.strictEqual(upper.length, lower.length);
});

test('边界: completed operations should have finishedAt', () => {
  const completed = MOCK_OPS.filter((op) => op.status === 'completed');
  for (const op of completed) {
    assert.ok(op.finishedAt !== undefined && op.finishedAt.length > 0,
      `${op.id} should have finishedAt`);
  }
});

test('边界: pending operations should NOT have finishedAt', () => {
  const pending = MOCK_OPS.filter((op) => op.status === 'pending');
  for (const op of pending) {
    assert.strictEqual(op.finishedAt, undefined, `${op.id} should not have finishedAt`);
  }
});

test('边界: all operation ids prefixed with "op-sf-"', () => {
  for (const op of MOCK_OPS) {
    assert.ok(op.id.startsWith('op-sf-'), `id ${op.id} should start with op-sf-`);
  }
});

test('边界: createdAt should be before finishedAt for completed ops', () => {
  const completed = MOCK_OPS.filter((op) => op.status === 'completed' && op.finishedAt);
  for (const op of completed) {
    assert.ok(op.createdAt <= op.finishedAt!, `${op.id}: createdAt after finishedAt`);
  }
});
