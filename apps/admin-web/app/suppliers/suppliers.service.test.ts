/**
 * suppliers.service.test.ts — 供应商管理 Service 层测试
 *
 * 覆盖:
 *   - 供应商信息查询
 *   - 等级评估与信用评级
 *   - 合作状态管理
 *   - 历史记录与统计计算
 *   - 边界条件与错误处理
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MOCK_SUPPLIERS,
  SUPPLIER_STATUS_MAP,
  SUPPLIER_CATEGORY_MAP,
  SUPPLIER_CREDIT_MAP,
  SUPPLIER_STATUSES,
  SUPPLIER_CATEGORIES,
  SUPPLIER_LIST_SEARCH_FIELDS,
  SUPPLIER_LIST_COLUMN_KEYS,
  computeSupplierStats,
  formatCurrency,
  getSupplierById,
} from './suppliers-data';

import type {
  SupplierItem,
  SupplierStatus,
  SupplierCategory,
  SupplierCredit,
} from './suppliers-data';

// ── 工厂函数 ────────────────────────────────────────────

function makeSupplier(overrides: Partial<SupplierItem> = {}): SupplierItem {
  return {
    id: overrides.id ?? 'sp-svc-1',
    code: overrides.code ?? 'SUP-TEST-001',
    name: overrides.name ?? '测试供应商有限公司',
    contactPerson: overrides.contactPerson ?? '张三',
    contactPhone: overrides.contactPhone ?? '13800000001',
    email: overrides.email ?? 'test@supplier.com',
    category: overrides.category ?? 'raw_material',
    status: overrides.status ?? 'active',
    creditRating: overrides.creditRating ?? 'A',
    cooperationMonths: overrides.cooperationMonths ?? 12,
    totalOrders: overrides.totalOrders ?? 10,
    totalAmount: overrides.totalAmount ?? 500000,
    defectRate: overrides.defectRate ?? 0.5,
    avgDeliveryDays: overrides.avgDeliveryDays ?? 3,
    address: overrides.address ?? '测试地址',
    marketCode: overrides.marketCode ?? 'cn-mainland',
    createdBy: overrides.createdBy ?? '系统管理员',
    createdAt: overrides.createdAt ?? '2026-01-01',
    lastOrderAt: overrides.lastOrderAt ?? '2026-07-01',
  };
}

// ============================================================
//  1. 供应商信息查询测试
// ============================================================

test.describe('Suppliers Service — 信息查询', () => {
  test('getSupplierById finds existing supplier', () => {
    const s = getSupplierById('sp-001');
    assert.ok(s);
    assert.equal(s!.name, '绿源食品有限公司');
    assert.equal(s!.code, 'SUP-001');
  });

  test('getSupplierById returns undefined for missing id', () => {
    const s = getSupplierById('non-existent');
    assert.equal(s, undefined);
  });

  test('getSupplierById returns undefined for empty string', () => {
    const s = getSupplierById('');
    assert.equal(s, undefined);
  });

  test('MOCK_SUPPLIERS has 16 entries', () => {
    assert.equal(MOCK_SUPPLIERS.length, 16);
  });

  test('all mock suppliers have unique ids and codes', () => {
    const ids = MOCK_SUPPLIERS.map((s) => s.id);
    const codes = MOCK_SUPPLIERS.map((s) => s.code);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(codes).size, codes.length);
  });

  test('all mock suppliers have valid status values', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(SUPPLIER_STATUSES.includes(s.status), `Invalid status: ${s.status} on ${s.id}`);
    }
  });

  test('all mock suppliers have valid category values', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(SUPPLIER_CATEGORIES.includes(s.category), `Invalid category: ${s.category} on ${s.id}`);
    }
  });

  test('all mock suppliers have valid credit ratings', () => {
    const validCredits: SupplierCredit[] = ['AAA', 'AA', 'A', 'B', 'C'];
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(validCredits.includes(s.creditRating), `Invalid credit: ${s.creditRating} on ${s.id}`);
    }
  });
});

// ============================================================
//  2. 等级评估测试
// ============================================================

test.describe('Suppliers Service — 等级评估', () => {
  test('credit rating AAA has green color', () => {
    assert.equal(SUPPLIER_CREDIT_MAP['AAA'].label, 'AAA');
    assert.equal(SUPPLIER_CREDIT_MAP['AAA'].color, '#22c55e');
  });

  test('credit rating C has red color (worst)', () => {
    assert.equal(SUPPLIER_CREDIT_MAP['C'].label, 'C');
    assert.equal(SUPPLIER_CREDIT_MAP['C'].color, '#ef4444');
  });

  test('all 5 credit levels are defined', () => {
    const levels: SupplierCredit[] = ['AAA', 'AA', 'A', 'B', 'C'];
    for (const l of levels) {
      assert.ok(SUPPLIER_CREDIT_MAP[l], `Missing credit level: ${l}`);
      assert.equal(typeof SUPPLIER_CREDIT_MAP[l].label, 'string');
      assert.equal(typeof SUPPLIER_CREDIT_MAP[l].color, 'string');
    }
  });

  test('defect rate influences credit rating quality', () => {
    const blacklisted = MOCK_SUPPLIERS.find((s) => s.status === 'blacklisted');
    assert.ok(blacklisted);
    assert.equal(blacklisted!.creditRating, 'C');
    assert.ok(blacklisted!.defectRate > 10); // 12.3%
  });

  test('top suppliers (AAA) have low defect rates', () => {
    const topSuppliers = MOCK_SUPPLIERS.filter((s) => s.creditRating === 'AAA');
    assert.ok(topSuppliers.length >= 3);
    assert.ok(topSuppliers.every((s) => s.defectRate <= 0.3));
  });
});

// ============================================================
//  3. 合作状态管理测试
// ============================================================

test.describe('Suppliers Service — 合作状态', () => {
  test('active suppliers can be filtered', () => {
    const active = MOCK_SUPPLIERS.filter((s) => s.status === 'active');
    assert.ok(active.length > 5); // majority should be active
    assert.ok(active.every((s) => s.status === 'active'));
  });

  test('paused suppliers have stopped ordering', () => {
    const paused = MOCK_SUPPLIERS.filter((s) => s.status === 'paused');
    assert.equal(paused.length, 2); // sp-005, sp-015
    assert.ok(paused.every((s) => new Date(s.lastOrderAt) < new Date('2026-01-01') || s.lastOrderAt === '-'));
  });

  test('blacklisted supplier has highest defect rate', () => {
    const blacklisted = MOCK_SUPPLIERS.find((s) => s.status === 'blacklisted');
    assert.ok(blacklisted);
    const allOthers = MOCK_SUPPLIERS.filter((s) => s.status !== 'blacklisted');
    const maxOtherDefect = Math.max(...allOthers.map((s) => s.defectRate));
    assert.ok(blacklisted!.defectRate > maxOtherDefect);
  });

  test('pending_audit suppliers have zero orders and no cooperation history', () => {
    const pending = MOCK_SUPPLIERS.filter((s) => s.status === 'pending_audit');
    assert.equal(pending.length, 2); // sp-006, sp-013
    assert.ok(pending.every((s) => s.totalOrders === 0 && s.cooperationMonths === 0));
  });

  test('every status has a Chinese label', () => {
    for (const s of SUPPLIER_STATUSES) {
      const m = SUPPLIER_STATUS_MAP[s];
      assert.ok(m, `Missing status map: ${s}`);
      assert.equal(typeof m.label, 'string');
      assert.ok(m.label.length > 0);
    }
  });
});

// ============================================================
//  4. 统计计算测试
// ============================================================

test.describe('Suppliers Service — 统计计算', () => {
  test('computeSupplierStats returns zeroes for empty array', () => {
    const stats = computeSupplierStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.active, 0);
    assert.equal(stats.totalOrders, 0);
    assert.equal(stats.totalAmount, 0);
    assert.equal(stats.avgDefectRate, 0);
    assert.equal(stats.avgDeliveryDays, 0);
    assert.equal(stats.topCategory, '—');
  });

  test('computeSupplierStats counts statuses correctly', () => {
    const items = [
      makeSupplier({ status: 'active' }),
      makeSupplier({ status: 'active' }),
      makeSupplier({ status: 'paused' }),
      makeSupplier({ status: 'pending_audit' }),
      makeSupplier({ status: 'blacklisted' }),
    ];
    const stats = computeSupplierStats(items);
    assert.equal(stats.total, 5);
    assert.equal(stats.active, 2);
    assert.equal(stats.paused, 1);
    assert.equal(stats.pendingAudit, 1);
    assert.equal(stats.blacklisted, 1);
  });

  test('computeSupplierStats computes total orders and amount', () => {
    const items = [
      makeSupplier({ totalOrders: 10, totalAmount: 100000 }),
      makeSupplier({ totalOrders: 5, totalAmount: 50000 }),
    ];
    const stats = computeSupplierStats(items);
    assert.equal(stats.totalOrders, 15);
    assert.equal(stats.totalAmount, 150000);
  });

  test('computeSupplierStats computes avg defect rate', () => {
    const items = [
      makeSupplier({ defectRate: 1.0 }),
      makeSupplier({ defectRate: 3.0 }),
    ];
    const stats = computeSupplierStats(items);
    assert.equal(stats.avgDefectRate, 2.0);
  });

  test('computeSupplierStats computes avg delivery days', () => {
    const items = [
      makeSupplier({ avgDeliveryDays: 2 }),
      makeSupplier({ avgDeliveryDays: 4 }),
    ];
    const stats = computeSupplierStats(items);
    assert.equal(stats.avgDeliveryDays, 3);
  });

  test('computeSupplierStats identifies top category', () => {
    const items = [
      makeSupplier({ category: 'raw_material' }),
      makeSupplier({ category: 'raw_material' }),
      makeSupplier({ category: 'packaging' }),
    ];
    const stats = computeSupplierStats(items);
    assert.equal(stats.topCategory, 'raw_material');
  });

  test('computeSupplierStats on full mock data', () => {
    const stats = computeSupplierStats(MOCK_SUPPLIERS);
    assert.equal(stats.total, 16);
    assert.equal(stats.active, 11);
    assert.equal(stats.blacklisted, 1);
    assert.equal(stats.pendingAudit, 2);
    assert.equal(stats.paused, 2);
    assert.ok(stats.totalOrders > 1000);
    assert.ok(stats.totalAmount > 40000000);
    assert.ok(stats.avgDefectRate > 0);
    assert.equal(stats.topCategory, 'raw_material');
  });
});

// ============================================================
//  5. 类别与映射完整性测试
// ============================================================

test.describe('Suppliers Service — 类别与映射', () => {
  test('every category has a Chinese label', () => {
    for (const c of SUPPLIER_CATEGORIES) {
      const label = SUPPLIER_CATEGORY_MAP[c];
      assert.ok(label, `Missing category label: ${c}`);
      assert.equal(typeof label, 'string');
      assert.ok(label.length > 0);
    }
  });

  test('search fields cover all relevant properties', () => {
    const expected = ['name', 'code', 'contactPerson', 'contactPhone', 'email', 'category', 'address'];
    assert.deepEqual(SUPPLIER_LIST_SEARCH_FIELDS, expected);
  });

  test('column keys match data interface', () => {
    const expectedColumns = ['code', 'name', 'category', 'status', 'creditRating', 'contactPerson',
      'totalOrders', 'totalAmount', 'defectRate', 'avgDeliveryDays', 'lastOrderAt'];
    assert.deepEqual(SUPPLIER_LIST_COLUMN_KEYS, expectedColumns);
  });
});

// ============================================================
//  6. 历史记录查询测试
// ============================================================

test.describe('Suppliers Service — 历史记录', () => {
  test('supplier with longest cooperation', () => {
    const sorted = [...MOCK_SUPPLIERS].sort((a, b) => b.cooperationMonths - a.cooperationMonths);
    assert.equal(sorted[0].id, 'sp-010'); // Global Trade Logistics, 60 months
    assert.equal(sorted[0].cooperationMonths, 60);
  });

  test('supplier with highest total orders', () => {
    const sorted = [...MOCK_SUPPLIERS].sort((a, b) => b.totalOrders - a.totalOrders);
    assert.equal(sorted[0].id, 'sp-003'); // 海龙物流, 520 orders
    assert.equal(sorted[0].totalOrders, 520);
  });

  test('supplier with highest total amount', () => {
    const sorted = [...MOCK_SUPPLIERS].sort((a, b) => b.totalAmount - a.totalAmount);
    assert.equal(sorted[0].id, 'sp-010'); // Global Trade Logistics, 15.8M
    assert.equal(sorted[0].totalAmount, 15800000);
  });

  test('suppliers can be grouped by category (raw_material has most)', () => {
    const rawMaterial = MOCK_SUPPLIERS.filter((s) => s.category === 'raw_material');
    assert.equal(rawMaterial.length, 5); // sp-001, sp-004, sp-008, sp-012, sp-016
  });

  test('suppliers can be filtered by market (us vs cn)', () => {
    const us = MOCK_SUPPLIERS.filter((s) => s.marketCode === 'us-default');
    assert.equal(us.length, 2); // sp-010, sp-011
    const cn = MOCK_SUPPLIERS.filter((s) => s.marketCode === 'cn-mainland');
    assert.equal(cn.length, 14);
  });
});

// ============================================================
//  7. 边界条件测试
// ============================================================

test.describe('Suppliers Service — 边界条件', () => {
  test('defect rate of 0 is handled', () => {
    const perfect = makeSupplier({ defectRate: 0 });
    assert.equal(perfect.defectRate, 0);
  });

  test('supplier with no orders has totalAmount of 0', () => {
    const stats = computeSupplierStats([makeSupplier({ totalOrders: 0, totalAmount: 0 })]);
    assert.equal(stats.totalOrders, 0);
    assert.equal(stats.totalAmount, 0);
  });

  test('avgDeliveryDays excludes suppliers with 0 days', () => {
    const items = [
      makeSupplier({ avgDeliveryDays: 0 }), // excluded
      makeSupplier({ avgDeliveryDays: 3 }),
    ];
    const stats = computeSupplierStats(items);
    assert.equal(stats.avgDeliveryDays, 3); // not 1.5
  });

  test('formatCurrency handles supplier-scale amounts', () => {
    assert.equal(formatCurrency(4_500_000), '450.0万'); // 450万
    assert.equal(formatCurrency(15_800_000), '1580.0万'); // 1580万
  });

  test('formatCurrency handles small amounts', () => {
    assert.equal(formatCurrency(45000), '4.50万'); // 4.5万
    assert.equal(formatCurrency(500), '500');
  });
});
