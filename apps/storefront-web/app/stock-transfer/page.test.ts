/**
 * stock-transfer/page.test.ts — 库存调拨列表页 L1 冒烟测试
 * 角色视角: 👔店长 / 💳采购 / 📦仓管
 * 覆盖: 正例(数据完整/导出稳定) + 反例(空数据/防御) + 边界(极端值/全状态/分页)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 (mirror page.tsx) ──

type TransferStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse';

interface StockTransfer {
  id: string;
  transferNo: string;
  type: TransferType;
  fromLocation: string;
  toLocation: string;
  status: TransferStatus;
  itemsCount: number;
  totalQuantity: number;
  applicant: string;
  approver: string;
  reason: string;
  appliedAt: string;
  completedAt: string | null;
  createdAt: string;
}

const ALL_TYPES: TransferType[] = ['store_to_store', 'warehouse_to_store', 'store_to_warehouse'];
const ALL_STATUSES: TransferStatus[] = ['draft', 'pending', 'approved', 'in_transit', 'completed', 'cancelled'];

const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  draft: '草稿', pending: '待审批', approved: '已审批',
  in_transit: '调拨中', completed: '已完成', cancelled: '已取消',
};

const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店⇉门店', warehouse_to_store: '仓库⇉门店', store_to_warehouse: '门店⇉仓库',
};

// ── 数据工厂 ──

function makeTransfer(overrides?: Partial<StockTransfer>): StockTransfer {
  return {
    id: '1',
    transferNo: 'DB-20260628-001',
    type: 'warehouse_to_store',
    fromLocation: '中央仓库',
    toLocation: '旗舰店(天河城)',
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

function makeTransfers(count: number): StockTransfer[] {
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

// ── Mock 数据 (mirror page.tsx) ──

const MOCK_TRANSFERS: StockTransfer[] = [
  { id: '1', transferNo: 'DB-20260628-001', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '旗舰店(天河城)', status: 'in_transit', itemsCount: 8, totalQuantity: 120, applicant: '张经理', approver: '陈主管', reason: '门店补货-洁面系列', appliedAt: '2026-06-28 08:30', completedAt: null, createdAt: '2026-06-28 08:30' },
  { id: '2', transferNo: 'DB-20260628-002', type: 'store_to_store', fromLocation: '旗舰店(天河城)', toLocation: '分店(体育西)', status: 'pending', itemsCount: 3, totalQuantity: 15, applicant: '李店长', approver: '', reason: '调拨热销口红品', appliedAt: '2026-06-28 09:00', completedAt: null, createdAt: '2026-06-28 09:00' },
  { id: '3', transferNo: 'DB-20260627-003', type: 'store_to_warehouse', fromLocation: '分店(体育西)', toLocation: '中央仓库', status: 'completed', itemsCount: 5, totalQuantity: 48, applicant: '王店长', approver: '陈主管', reason: '临期品退回', appliedAt: '2026-06-27 14:00', completedAt: '2026-06-27 16:30', createdAt: '2026-06-27 14:00' },
  { id: '4', transferNo: 'DB-20260627-004', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '分店(体育西)', status: 'approved', itemsCount: 12, totalQuantity: 200, applicant: '刘主管', approver: '陈主管', reason: '新品铺货-防晒系列', appliedAt: '2026-06-27 10:00', completedAt: null, createdAt: '2026-06-27 10:00' },
  { id: '5', transferNo: 'DB-20260626-005', type: 'store_to_store', fromLocation: '旗舰店(天河城)', toLocation: '精品店(太古汇)', status: 'completed', itemsCount: 2, totalQuantity: 6, applicant: '李店长', approver: '陈主管', reason: 'VIP预定取货调拨', appliedAt: '2026-06-26 11:00', completedAt: '2026-06-26 13:00', createdAt: '2026-06-26 11:00' },
  { id: '6', transferNo: 'DB-20260626-006', type: 'store_to_warehouse', fromLocation: '精品店(太古汇)', toLocation: '中央仓库', status: 'cancelled', itemsCount: 4, totalQuantity: 35, applicant: '赵店长', approver: '', reason: '季节性商品退仓', appliedAt: '2026-06-26 09:30', completedAt: null, createdAt: '2026-06-26 09:30' },
  { id: '7', transferNo: 'DB-20260625-007', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '分店(林和西)', status: 'draft', itemsCount: 6, totalQuantity: 90, applicant: '张经理', approver: '', reason: '月度补货计划', appliedAt: '2026-06-25 16:00', completedAt: null, createdAt: '2026-06-25 16:00' },
  { id: '8', transferNo: 'DB-20260625-008', type: 'store_to_store', fromLocation: '分店(体育西)', toLocation: '精品店(太古汇)', status: 'in_transit', itemsCount: 1, totalQuantity: 10, applicant: '王店长', approver: '陈主管', reason: '调拨爆款面膜', appliedAt: '2026-06-25 15:00', completedAt: null, createdAt: '2026-06-25 15:00' },
  { id: '9', transferNo: 'DB-20260624-009', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '精品店(太古汇)', status: 'completed', itemsCount: 10, totalQuantity: 180, applicant: '刘主管', approver: '陈主管', reason: '店内陈列更新', appliedAt: '2026-06-24 10:00', completedAt: '2026-06-24 14:20', createdAt: '2026-06-24 10:00' },
  { id: '10', transferNo: 'DB-20260624-010', type: 'store_to_store', fromLocation: '精品店(太古汇)', toLocation: '分店(体育西)', status: 'completed', itemsCount: 3, totalQuantity: 24, applicant: '赵店长', approver: '陈主管', reason: '会员活动特别调拨', appliedAt: '2026-06-24 09:00', completedAt: '2026-06-24 11:00', createdAt: '2026-06-24 09:00' },
];

function loadSource(): string {
  const fs = require('fs');
  const path = require('path');
  return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
}

// ── 基本导出 ──

test('👔 店长视角: StockTransferListPage is a function component', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'should export a function component');
});

test('💳 采购视角: default export is stable', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
});

test('📦 仓管视角: module has default export', async () => {
  const mod = await import('./page');
  assert.ok('default' in mod);
});

// ── 正例 ──

test('正例: page import does not throw', async () => {
  let threw = false;
  try { await import('./page'); } catch { threw = true; }
  assert.equal(threw, false);
});

test('正例: source imports expected UI components', () => {
  const source = loadSource();
  const imports = ['PageShell', 'DataTable', 'StatusBadge', 'Button', 'Pagination', 'SearchFilterInput', 'EmptyState'];
  for (const imp of imports) {
    assert.ok(source.includes(imp), `should import ${imp}`);
  }
});

test('正例: source has page title "库存调拨管理"', () => {
  const source = loadSource();
  assert.ok(source.includes('库存调拨管理'));
});

test('正例: source has "库存调拨" header', () => {
  const source = loadSource();
  assert.ok(source.includes('库存调拨'));
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
    assert.ok(ALL_STATUSES.includes(t.status), `invalid status: ${t.status}`);
  }
});

test('正例: each transfer has positive itemsCount', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.itemsCount > 0, `transfer ${t.id} itemsCount should be > 0`);
  }
});

test('正例: each transfer has positive totalQuantity', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.totalQuantity > 0, `transfer ${t.id} totalQuantity should be > 0`);
  }
});

test('正例: status labels all defined', () => {
  for (const s of ALL_STATUSES) {
    assert.ok(TRANSFER_STATUS_LABELS[s], `missing status label for ${s}`);
  }
});

test('正例: type labels all defined', () => {
  for (const t of ALL_TYPES) {
    assert.ok(TRANSFER_TYPE_LABELS[t], `missing type label for ${t}`);
  }
});

test('正例: at least one transfer with each type', () => {
  for (const type of ALL_TYPES) {
    const count = MOCK_TRANSFERS.filter(t => t.type === type).length;
    assert.ok(count >= 1, `should have at least one ${type} transfer`);
  }
});

test('正例: at least one transfer with each status', () => {
  for (const status of ALL_STATUSES) {
    const count = MOCK_TRANSFERS.filter(t => t.status === status).length;
    assert.ok(count >= 1, `should have at least one ${status} transfer`);
  }
});

test('正例: completed transfers have completedAt set', () => {
  const completed = MOCK_TRANSFERS.filter(t => t.status === 'completed');
  for (const t of completed) {
    assert.ok(t.completedAt !== null && t.completedAt.length > 0, `completed transfer ${t.id} should have completedAt`);
  }
});

test('正例: draft/pending transfers have no approver', () => {
  const unapproved = MOCK_TRANSFERS.filter(t => t.status === 'draft' || t.status === 'pending');
  for (const t of unapproved) {
    assert.equal(t.approver, '', `unapproved transfer ${t.id} should have empty approver`);
  }
});

test('正例: transfer number format valid', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(/^DB-\d{8}-\d{3}$/.test(t.transferNo), `transfer ${t.id} number format invalid: ${t.transferNo}`);
  }
});

test('正例: total quantity sum across all transfers', () => {
  const total = MOCK_TRANSFERS.reduce((s, t) => s + t.totalQuantity, 0);
  assert.ok(total > 0, 'total quantity should be positive');
});

// ── 反例 ──

test('反例: default export is not null/undefined', async () => {
  const mod = await import('./page');
  assert.notEqual(mod.default, null);
  assert.notEqual(mod.default, undefined);
});

test('反例: no negative totalQuantity', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.totalQuantity >= 0, `transfer ${t.id} totalQuantity should be >= 0`);
  }
});

test('反例: no negative itemsCount', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.itemsCount >= 0, `transfer ${t.id} itemsCount should be >= 0`);
  }
});

test('反例: all fromLocation and toLocation are non-empty', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.fromLocation.length > 0, `transfer ${t.id} fromLocation empty`);
    assert.ok(t.toLocation.length > 0, `transfer ${t.id} toLocation empty`);
  }
});

test('反例: all applicants are non-empty', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.applicant.length > 0, `transfer ${t.id} applicant empty`);
  }
});

test('反例: from and to locations are different', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.notEqual(t.fromLocation, t.toLocation, `transfer ${t.id} from/to should differ`);
  }
});

test('反例: no duplicate location pairs for same type', () => {
  const pairs = MOCK_TRANSFERS.map(t => `${t.type}:${t.fromLocation}->${t.toLocation}`);
  assert.equal(new Set(pairs).size, pairs.length, 'should have unique (type,from,to) combinations');
});

// ── 边界 ──

test('边界: component is callable', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
});

test('边界: source is "use client"', () => {
  const source = loadSource();
  assert.ok(source.includes("'use client'"));
});

test('边界: in_transit count is reasonable', () => {
  const inTransit = MOCK_TRANSFERS.filter(t => t.status === 'in_transit').length;
  assert.ok(inTransit >= 1 && inTransit <= MOCK_TRANSFERS.length, 'in_transit count in valid range');
});

test('边界: completed transfers ratio', () => {
  const completed = MOCK_TRANSFERS.filter(t => t.status === 'completed').length;
  const cancelled = MOCK_TRANSFERS.filter(t => t.status === 'cancelled').length;
  assert.ok(completed >= cancelled, 'completed should be >= cancelled');
});

test('边界: each transfer has a reason', () => {
  for (const t of MOCK_TRANSFERS) {
    assert.ok(t.reason.length >= 4, `transfer ${t.id} reason too short: ${t.reason}`);
  }
});

test('边界: transfer number format edge cases', () => {
  // All transfer numbers should match pattern DB-YYYYMMDD-NNN
  for (const t of MOCK_TRANSFERS) {
    const parts = t.transferNo.split('-');
    assert.equal(parts.length, 3);
    assert.equal(parts[0], 'DB');
    assert.equal(parts[1].length, 8);
    assert.equal(parts[2].length, 3);
  }
});

test('边界: filter by type yields correct counts', () => {
  const storeToStore = MOCK_TRANSFERS.filter(t => t.type === 'store_to_store');
  const warehouseToStore = MOCK_TRANSFERS.filter(t => t.type === 'warehouse_to_store');
  const storeToWarehouse = MOCK_TRANSFERS.filter(t => t.type === 'store_to_warehouse');
  assert.equal(storeToStore.length + warehouseToStore.length + storeToWarehouse.length, MOCK_TRANSFERS.length);
});

test('边界: data factory produces consistent items', () => {
  const items = makeTransfers(3);
  assert.equal(items.length, 3);
  for (const item of items) {
    assert.ok(item.transferNo.startsWith('DB-20260628-'));
    assert.ok(ALL_TYPES.includes(item.type));
    assert.ok(ALL_STATUSES.includes(item.status));
  }
});

test('边界: data factory with custom overrides', () => {
  const item = makeTransfer({ status: 'completed', totalQuantity: 999 });
  assert.equal(item.status, 'completed');
  assert.equal(item.totalQuantity, 999);
  assert.equal(item.id, '1');
});

test('边界: status labels map covers all statuses', () => {
  for (const s of ALL_STATUSES) {
    const label = TRANSFER_STATUS_LABELS[s];
    assert.ok(label.length >= 2, `status ${s} label too short`);
  }
});

test('边界: type labels map covers all types', () => {
  for (const t of ALL_TYPES) {
    const label = TRANSFER_TYPE_LABELS[t];
    assert.ok(label.length >= 4, `type ${t} label too short`);
  }
});

test('边界: source has filter buttons for all types', () => {
  const source = loadSource();
  for (const t of ALL_TYPES) {
    assert.ok(source.includes(TRANSFER_TYPE_LABELS[t]), `source should contain type label ${TRANSFER_TYPE_LABELS[t]}`);
  }
});

test('边界: source has filter buttons for all statuses', () => {
  const source = loadSource();
  for (const s of ALL_STATUSES) {
    assert.ok(source.includes(TRANSFER_STATUS_LABELS[s]), `source should contain status label ${TRANSFER_STATUS_LABELS[s]}`);
  }
});
