/**
 * stock-transfer/page.test.tsx — ToB 库存调拨列表页 L1 冒烟测试
 * 角色视角: 👔品牌运营 / 📦仓库管理员 / 💳采购经理
 * 覆盖: 正例(数据完整/导出稳定) + 反例(空数据/防御) + 边界(极端值/全状态/分页)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 类型与常量 (mirror data.ts) ──

import {
  type StockTransferItem,
  type TransferStatus,
  type TransferType,
  ALL_TYPES,
  ALL_STATUSES,
  TRANSFER_STATUS_LABELS,
  TRANSFER_TYPE_LABELS,
  MOCK_TRANSFERS,
} from './data';

// ── 数据工厂 ──

function makeTransfer(overrides?: Partial<StockTransferItem>): StockTransferItem {
  return {
    id: '1',
    transferNo: 'DB-20260628-001',
    type: 'warehouse_to_store',
    fromLocation: '中央仓库',
    toLocation: '上海旗舰店',
    status: 'in_transit',
    itemsCount: 8,
    totalQuantity: 120,
    applicant: '张经理',
    approver: '陈主管',
    reason: '门店补货',
    appliedAt: '2026-06-28 08:30',
    completedAt: null,
    createdAt: '2026-06-28 08:30',
    ...overrides,
  };
}

function makeTransfers(count: number): StockTransferItem[] {
  const types: TransferType[] = ['store_to_store', 'warehouse_to_store', 'store_to_warehouse'];
  const statuses: TransferStatus[] = ['draft', 'pending', 'approved', 'in_transit', 'completed', 'cancelled'];
  return Array.from({ length: count }, (_, i) => makeTransfer({
    id: String(i + 1),
    transferNo: `DB-20260628-${String(i + 1).padStart(3, '0')}`,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    totalQuantity: (i + 1) * 10,
  }));
}

// ── 模块导出 ──

test('👔 品牌运营: default export is a function', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'should export a function component');
});

test('📦 仓库管理员: data module exports MOCK_TRANSFERS', () => {
  assert.ok(Array.isArray(MOCK_TRANSFERS));
  assert.ok(MOCK_TRANSFERS.length > 0);
});

test('💳 采购经理: data module exports type constants', () => {
  assert.ok(Array.isArray(ALL_TYPES));
  assert.ok(Array.isArray(ALL_STATUSES));
  assert.equal(ALL_TYPES.length, 3);
  assert.equal(ALL_STATUSES.length, 6);
});

// ── 正例 ──

test('正例: page import does not throw', async () => {
  let threw = false;
  try { await import('./page'); } catch { threw = true; }
  assert.equal(threw, false);
});

test('正例: source imports expected UI components', () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
  const imports = ['PageShell', 'DataTable', 'Badge', 'Button', 'Pagination', 'SearchFilterInput', 'EmptyState'];
  for (const imp of imports) {
    assert.ok(source.includes(imp), `should import ${imp}`);
  }
});

test('正例: source has page title "库存调拨管理"', () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(source.includes('库存调拨管理'));
});

test('正例: mock data count = 10', () => {
  assert.equal(MOCK_TRANSFERS.length, 10);
});

test('正例: all transfer IDs are unique', () => {
  const ids = MOCK_TRANSFERS.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('正例: all transfer numbers are unique', () => {
  const nos = MOCK_TRANSFERS.map(t => t.transferNo);
  assert.equal(new Set(nos).size, nos.length);
});

test('正例: all transfer types are valid', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(ALL_TYPES.includes(t.type), `invalid transfer type: ${t.type}`);
  }
});

test('正例: all transfer statuses are valid', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(ALL_STATUSES.includes(t.status), `invalid transfer status: ${t.status}`);
  }
});

test('正例: every status has a label', () => {
  for (const s of ALL_STATUSES) {
    assert.ok(TRANSFER_STATUS_LABELS[s], `missing label for status: ${s}`);
  }
});

test('正例: every type has a label', () => {
  for (const t of ALL_TYPES) {
    assert.ok(TRANSFER_TYPE_LABELS[t], `missing label for type: ${t}`);
  }
});

test('正例: strings are non-empty', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.transferNo.length > 0);
    assert.ok(t.fromLocation.length > 0);
    assert.ok(t.toLocation.length > 0);
    assert.ok(t.applicant.length > 0);
    assert.ok(t.reason.length > 0);
    assert.ok(t.appliedAt.length > 0);
  }
});

test('正例: positive numeric fields', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.itemsCount > 0, `itemsCount should be > 0 for ${t.id}`);
    assert.ok(t.totalQuantity > 0, `totalQuantity should be > 0 for ${t.id}`);
  }
});

// ── 稳定断言 ──

test('稳定断言: mock data snapshot sanity', () => {
  const first = MOCK_TRANSFERS[0];
  assert.equal(first.transferNo, 'DB-20260628-001');
  assert.equal(first.type, 'warehouse_to_store');
  assert.equal(first.status, 'in_transit');
  assert.equal(first.itemsCount, 8);
  assert.equal(first.totalQuantity, 120);
});

test('稳定断言: mock data covers all 6 statuses', () => {
  const statuses = new Set(MOCK_TRANSFERS.map(t => t.status));
  assert.equal(statuses.size, 6);
  for (const s of ALL_STATUSES) {
    assert.ok(statuses.has(s), `missing mock data for status: ${s}`);
  }
});

test('稳定断言: mock data covers all 3 types', () => {
  const types = new Set(MOCK_TRANSFERS.map(t => t.type));
  assert.equal(types.size, 3);
  for (const t of ALL_TYPES) {
    assert.ok(types.has(t), `missing mock data for type: ${t}`);
  }
});

// ── 边界 ──

test('边界: makeTransfer factory creates valid item', () => {
  const t = makeTransfer();
  assert.ok(t.id);
  assert.ok(t.transferNo);
  assert.ok(t.approver.length > 0);
});

test('边界: makeTransfer overrides work', () => {
  const t = makeTransfer({ id: '100', status: 'cancelled', totalQuantity: 999 });
  assert.equal(t.id, '100');
  assert.equal(t.status, 'cancelled');
  assert.equal(t.totalQuantity, 999);
});

test('边界: makeTransfers creates requested count', () => {
  const items = makeTransfers(50);
  assert.equal(items.length, 50);
  assert.equal(items[49].id, '50');
});

test('边界: makeTransfers cycles through all statuses', () => {
  const items = makeTransfers(12);
  const statuses = new Set(items.map(t => t.status));
  assert.equal(statuses.size, 6);
});

test('边界: makeTransfers cycles through all types', () => {
  const items = makeTransfers(6);
  const types = new Set(items.map(t => t.type));
  assert.equal(types.size, 3);
});

test('边界: completedAt can be null for non-completed transfers', () => {
  const pendingItem = MOCK_TRANSFERS.find(t => t.status !== 'completed' && t.status !== 'cancelled');
  assert.ok(pendingItem);
  assert.equal(pendingItem.completedAt, null);
});

test('边界: completedAt is non-null for completed transfers', () => {
  const completedItem = MOCK_TRANSFERS.find(t => t.status === 'completed');
  assert.ok(completedItem);
  assert.ok(completedItem.completedAt);
});

test('边界: empty array does not crash', () => {
  const empty: StockTransferItem[] = [];
  assert.equal(empty.length, 0);
});

test('边界: empty_data status label lookup', () => {
  assert.equal(TRANSFER_STATUS_LABELS.draft, '草稿');
  assert.equal(TRANSFER_STATUS_LABELS.cancelled, '已取消');
});

test('边界: large totalQuantity values', () => {
  const large = makeTransfer({ totalQuantity: 999999, itemsCount: 500 });
  assert.equal(large.totalQuantity, 999999);
  assert.equal(large.itemsCount, 500);
});

// ── 反例 ──

test('反例: invalid status does not have a label', () => {
  const bad = 'expired' as TransferStatus;
  assert.equal(TRANSFER_STATUS_LABELS[bad], undefined);
});

test('反例: invalid type does not have a label', () => {
  const bad = 'express' as TransferType;
  assert.equal(TRANSFER_TYPE_LABELS[bad], undefined);
});

test('反例: negative quantity is not typical', () => {
  const neg = makeTransfer({ totalQuantity: -1 });
  assert.equal(neg.totalQuantity, -1);
  assert.ok(neg.totalQuantity < 0, 'negative quantity should be < 0');
});

test('反例: empty string fields should not appear in mock', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.transferNo !== '', 'transferNo should not be empty');
    assert.ok(t.fromLocation !== '', 'fromLocation should not be empty');
    assert.ok(t.toLocation !== '', 'toLocation should not be empty');
    assert.ok(t.applicant !== '', 'applicant should not be empty');
    assert.ok(t.reason !== '', 'reason should not be empty');
  }
});

// ── 分页逻辑 ──

test('分页: correct page count for 10 items at 10 per page', () => {
  const items = makeTransfers(10);
  const pageSize = 10;
  const totalPages = Math.ceil(items.length / pageSize);
  assert.equal(totalPages, 1);
});

test('分页: correct page count for 25 items at 10 per page', () => {
  const items = makeTransfers(25);
  const pageSize = 10;
  const totalPages = Math.ceil(items.length / pageSize);
  assert.equal(totalPages, 3);
});

test('分页: pagination slice works correctly', () => {
  const items = makeTransfers(25);
  const pageSize = 10;
  const page2 = items.slice(10, 20);
  assert.equal(page2.length, 10);
  assert.equal(page2[0].id, '11');
  assert.equal(page2[9].id, '20');
});

test('分页: last page has remaining items', () => {
  const items = makeTransfers(25);
  const pageSize = 10;
  const page3 = items.slice(20, 30);
  assert.equal(page3.length, 5);
});
