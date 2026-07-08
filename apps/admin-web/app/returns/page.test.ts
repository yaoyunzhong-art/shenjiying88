/**
 * apps/admin-web/app/returns/page.test.ts — 退换货管理数据层测试
 * 覆盖正例/反例/边界
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 合法值常量 ────────────────────────────────────────────

const VALID_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
  'return_received',
  'refund_issued',
  'replacement_sent',
  'closed',
] as const;

const VALID_TYPES = ['refund', 'exchange', 'repair'] as const;

// ── return-data 正例 ──────────────────────────────────────

test('[returns] 正例: getReturns 返回 8 条记录', async () => {
  const { getReturns } = await import('./return-data');
  assert.equal(getReturns().length, 8);
});

test('[returns] 正例: 每笔退换货 id 唯一', async () => {
  const { getReturns } = await import('./return-data');
  const ids = getReturns().map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('[returns] 正例: 每笔退换货 orderNo 不为空', async () => {
  const { getReturns } = await import('./return-data');
  for (const r of getReturns()) {
    assert.ok(r.orderNo.length > 0, `退换单 ${r.id} orderNo 为空`);
  }
});

test('[returns] 正例: 每笔退换货包含所有必填字段', async () => {
  const { getReturns } = await import('./return-data');
  const required = [
    'id', 'orderNo', 'customerName', 'customerPhone',
    'returnType', 'status', 'appliedAt', 'items', 'refundAmount',
  ];
  for (const r of getReturns()) {
    for (const field of required) {
      assert.notEqual(r[field], undefined, `退换单 ${r.id} 缺少 ${String(field)}`);
    }
  }
});

test('[returns] 正例: status 均为合法值', async () => {
  const { getReturns } = await import('./return-data');
  const valid = new Set(VALID_STATUSES);
  for (const r of getReturns()) {
    assert.ok(valid.has(r.status), `退换单 ${r.id} status=${r.status} 非法`);
  }
});

test('[returns] 正例: returnType 均为合法值', async () => {
  const { getReturns } = await import('./return-data');
  const valid = new Set(VALID_TYPES);
  for (const r of getReturns()) {
    assert.ok(valid.has(r.returnType), `退换单 ${r.id} type=${r.returnType} 非法`);
  }
});

test('[returns] 正例: refundAmount 不为负', async () => {
  const { getReturns } = await import('./return-data');
  for (const r of getReturns()) {
    assert.ok(r.refundAmount >= 0, `退换单 ${r.id} refundAmount=${r.refundAmount} 为负`);
  }
});

test('[returns] 正例: 每笔 items 至少 1 条', async () => {
  const { getReturns } = await import('./return-data');
  for (const r of getReturns()) {
    assert.ok(r.items.length >= 1, `退换单 ${r.id} 无商品`);
  }
});

test('[returns] 正例: countByStatus 计数正确', async () => {
  const { getReturns, countByStatus } = await import('./return-data');
  const data = getReturns();
  assert.equal(countByStatus(data, 'pending_review'), 2);
  assert.equal(countByStatus(data, 'approved'), 1);
  assert.equal(countByStatus(data, 'rejected'), 1);
  assert.equal(countByStatus(data, 'return_received'), 1);
  assert.equal(countByStatus(data, 'refund_issued'), 1);
  assert.equal(countByStatus(data, 'replacement_sent'), 1);
  assert.equal(countByStatus(data, 'closed'), 1);
});

test('[returns] 正例: getStatusSummary 汇总所有状态', async () => {
  const { getReturns, getStatusSummary } = await import('./return-data');
  const summary = getStatusSummary(getReturns());
  const total = Object.values(summary).reduce((a: number, b: number) => a + b, 0);
  assert.equal(total, getReturns().length);
});

test('[returns] 正例: getTypeSummary 按类型统计', async () => {
  const { getReturns, getTypeSummary } = await import('./return-data');
  const summary = getTypeSummary(getReturns());
  const total = Object.values(summary).reduce((a: number, b: number) => a + b, 0);
  assert.equal(total, getReturns().length);
});

test('[returns] 正例: appliedAt 为有效的 ISO 日期字符串', async () => {
  const { getReturns } = await import('./return-data');
  for (const r of getReturns()) {
    const d = new Date(r.appliedAt);
    assert.ok(!isNaN(d.getTime()), `退换单 ${r.id} appliedAt=${r.appliedAt} 不是有效日期`);
  }
});

test('[returns] 正例: 每条 items 内每个 SKU 不为空', async () => {
  const { getReturns } = await import('./return-data');
  for (const r of getReturns()) {
    for (const item of r.items) {
      assert.ok(item.sku.length > 0);
      assert.ok(item.name.length > 0);
      assert.ok(item.purchasedQty > 0);
      assert.ok(item.returnQty > 0);
    }
  }
});

// ── 边界测试 ──────────────────────────────────────────────

test('[returns] 边界: countByStatus 空列表返回 0', async () => {
  const { countByStatus } = await import('./return-data');
  assert.equal(countByStatus([], 'pending_review'), 0);
  assert.equal(countByStatus([], 'closed'), 0);
});

test('[returns] 边界: getStatusSummary 空列表返回空对象', async () => {
  const { getStatusSummary } = await import('./return-data');
  assert.deepEqual(getStatusSummary([]), {});
});

test('[returns] 边界: getTypeSummary 空列表返回空对象', async () => {
  const { getTypeSummary } = await import('./return-data');
  assert.deepEqual(getTypeSummary([]), {});
});

test('[returns] 边界: countByStatus 未知状态返回 0', async () => {
  const { getReturns, countByStatus } = await import('./return-data');
  assert.equal(countByStatus(getReturns(), 'unknown_status' as any), 0);
});

// ── 反例测试 ──────────────────────────────────────────────

test('[returns] 反例: status 不能为 undefined 或 null', async () => {
  const { getReturns } = await import('./return-data');
  for (const r of getReturns()) {
    assert.notEqual(r.status, null as any);
    assert.notEqual(r.status, undefined as any);
  }
});

test('[returns] 反例: returnType 必须为枚举值之一', async () => {
  const { getReturns } = await import('./return-data');
  const valid = new Set(VALID_TYPES);
  for (const r of getReturns()) {
    assert.ok(valid.has(r.returnType), `退换单 ${r.id} type=${r.returnType} 非法`);
    assert.notEqual(r.returnType, 'unknown' as any);
  }
});

test('[returns] 反例: refundAmount 不能为负数', async () => {
  const { getReturns } = await import('./return-data');
  for (const r of getReturns()) {
    assert.ok(r.refundAmount >= 0, `退换单 ${r.id} refundAmount=${r.refundAmount} 为负`);
  }
});
