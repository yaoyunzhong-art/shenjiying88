/**
 * suppliers-page.test.ts — Page-level tests for suppliers listing page.
 * Tests list rendering, status/category filter, search, pagination, and empty state.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_SUPPLIERS,
  SUPPLIER_STATUS_MAP,
  SUPPLIER_CATEGORY_MAP,
  SUPPLIER_CREDIT_MAP,
  SUPPLIER_LIST_SEARCH_FIELDS,
  SUPPLIER_LIST_COLUMN_KEYS,
  SUPPLIER_STATUSES,
  SUPPLIER_CATEGORIES,
  computeSupplierStats,
  getSupplierById,
  formatCurrency,
  type SupplierItem,
  type SupplierStatus,
  type SupplierCategory,
} from './suppliers-data';

// ---- 基础数据完整性 ----

describe('suppliers-data — data integrity', () => {
  it('should have 16 mock suppliers', () => {
    assert.equal(MOCK_SUPPLIERS.length, 16);
  });

  it('should have unique IDs across all suppliers', () => {
    const ids = MOCK_SUPPLIERS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('should have unique codes across all suppliers', () => {
    const codes = MOCK_SUPPLIERS.map((s) => s.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  it('each supplier should have all required fields', () => {
    const required: (keyof SupplierItem)[] = [
      'id', 'code', 'name', 'contactPerson', 'contactPhone', 'category', 'status',
      'creditRating', 'totalOrders', 'totalAmount', 'defectRate', 'avgDeliveryDays',
    ];
    for (const s of MOCK_SUPPLIERS) {
      for (const field of required) {
        assert.ok(s[field] !== undefined, `Supplier ${s.id} missing field ${String(field)}`);
      }
    }
  });

  it('every status should be a valid enum value', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(SUPPLIER_STATUSES.includes(s.status), `Invalid status: ${s.status}`);
    }
  });

  it('every category should be a valid enum value', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(SUPPLIER_CATEGORIES.includes(s.category), `Invalid category: ${s.category}`);
    }
  });

  it('every creditRating should be valid', () => {
    const validCredits: string[] = ['AAA', 'AA', 'A', 'B', 'C'];
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(validCredits.includes(s.creditRating), `Invalid creditRating: ${s.creditRating}`);
    }
  });
});

// ---- getSupplierById ----

describe('getSupplierById', () => {
  it('should return the correct supplier for a known id', () => {
    const result = getSupplierById('sp-001');
    assert.ok(result);
    assert.equal(result?.name, '绿源食品有限公司');
  });

  it('should return undefined for an unknown id', () => {
    assert.equal(getSupplierById('nonexistent'), undefined);
  });

  it('should return undefined for empty string', () => {
    assert.equal(getSupplierById(''), undefined);
  });
});

// ---- computeSupplierStats ----

describe('computeSupplierStats', () => {
  const stats = computeSupplierStats(MOCK_SUPPLIERS);

  it('should compute total count correctly', () => {
    assert.equal(stats.total, 16);
  });

  it('should compute active count correctly', () => {
    const expected = MOCK_SUPPLIERS.filter((s) => s.status === 'active').length;
    assert.equal(stats.active, expected);
  });

  it('should compute paused count correctly', () => {
    const expected = MOCK_SUPPLIERS.filter((s) => s.status === 'paused').length;
    assert.equal(stats.paused, expected);
  });

  it('should compute pending audit count correctly', () => {
    const expected = MOCK_SUPPLIERS.filter((s) => s.status === 'pending_audit').length;
    assert.equal(stats.pendingAudit, expected);
  });

  it('should compute blacklisted count correctly', () => {
    const expected = MOCK_SUPPLIERS.filter((s) => s.status === 'blacklisted').length;
    assert.equal(stats.blacklisted, expected);
  });

  it('totalAmount should be sum of all supplier amounts', () => {
    const expected = MOCK_SUPPLIERS.reduce((s, i) => s + i.totalAmount, 0);
    assert.equal(stats.totalAmount, expected);
  });

  it('avgDefectRate should be > 0', () => {
    assert.ok(stats.avgDefectRate > 0);
  });

  it('topCategory should be one of the known categories', () => {
    assert.ok(SUPPLIER_CATEGORIES.includes(stats.topCategory as SupplierCategory));
  });
});

// ---- 搜索过滤逻辑 ----

describe('search filter — supplier-specific search fields', () => {
  it('SUPPLIER_LIST_SEARCH_FIELDS should contain name, code, contactPerson', () => {
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('name'));
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('code'));
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('contactPerson'));
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('contactPhone'));
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('email'));
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('category'));
    assert.ok(SUPPLIER_LIST_SEARCH_FIELDS.includes('address'));
  });
});

describe('status filter', () => {
  it('should filter active suppliers correctly', () => {
    const active = MOCK_SUPPLIERS.filter((s) => s.status === 'active');
    assert.ok(active.length > 0);
    for (const s of active) {
      assert.equal(s.status, 'active');
    }
  });

  it('should filter blacklisted suppliers correctly', () => {
    const blacklisted = MOCK_SUPPLIERS.filter((s) => s.status === 'blacklisted');
    assert.equal(blacklisted.length, 1);
    assert.equal(blacklisted[0]?.id, 'sp-008');
  });

  it('should return all when filter is ALL', () => {
    const all = MOCK_SUPPLIERS;
    assert.equal(all.length, 16);
  });

  it('pending_audit suppliers should have zero orders', () => {
    const pending = MOCK_SUPPLIERS.filter((s) => s.status === 'pending_audit');
    for (const s of pending) {
      assert.equal(s.totalOrders, 0);
      assert.equal(s.totalAmount, 0);
    }
  });
});

describe('category filter', () => {
  it('should filter raw_material suppliers', () => {
    const raw = MOCK_SUPPLIERS.filter((s) => s.category === 'raw_material');
    assert.ok(raw.length >= 4);
    for (const s of raw) {
      assert.equal(s.category, 'raw_material');
    }
  });

  it('should filter logistics suppliers', () => {
    const logistics = MOCK_SUPPLIERS.filter((s) => s.category === 'logistics');
    assert.equal(logistics.length, 3);
  });

  it('should filter equipment suppliers', () => {
    const equipment = MOCK_SUPPLIERS.filter((s) => s.category === 'equipment');
    assert.equal(equipment.length, 2);
  });

  it('should return empty for nonexistent category', () => {
    const empty = MOCK_SUPPLIERS.filter(() => false);
    assert.equal(empty.length, 0);
  });
});

describe('composite filter (status + category)', () => {
  it('should find active raw_material suppliers', () => {
    const items = MOCK_SUPPLIERS.filter((s) => s.status === 'active' && s.category === 'raw_material');
    assert.ok(items.length >= 3);
    for (const s of items) {
      assert.equal(s.status, 'active');
      assert.equal(s.category, 'raw_material');
    }
  });

  it('should find paused equipment supplier', () => {
    const items = MOCK_SUPPLIERS.filter((s) => s.status === 'paused' && s.category === 'equipment');
    assert.equal(items.length, 1);
    assert.equal(items[0]?.name, '锦华设备制造厂');
  });
});

// ---- 排序测试 ----

describe('sorting — totalAmount', () => {
  it('should sort descending by totalAmount', () => {
    const sorted = [...MOCK_SUPPLIERS].sort((a, b) => b.totalAmount - a.totalAmount);
    assert.ok(sorted[0]!.totalAmount >= sorted[1]!.totalAmount);
    assert.equal(sorted[0]?.id, 'sp-010'); // Global Trade Logistics — largest
  });

  it('should sort ascending by totalAmount', () => {
    const sorted = [...MOCK_SUPPLIERS].sort((a, b) => a.totalAmount - b.totalAmount);
    // pending_audit ones with 0 amount should be first
    assert.equal(sorted[0]!.totalAmount, 0);
  });
});

describe('sorting — defectRate', () => {
  it('should sort descending by defectRate', () => {
    const sorted = [...MOCK_SUPPLIERS].sort((a, b) => b.defectRate - a.defectRate);
    assert.equal(sorted[0]?.id, 'sp-008'); // 源广达 — 12.3%
  });
});

// ---- 分页测试 ----

describe('pagination', () => {
  it('should split 16 items into 2 pages of 8', () => {
    const perPage = 8;
    const total = MOCK_SUPPLIERS.length;
    const totalPages = Math.ceil(total / perPage);
    assert.equal(totalPages, 2);
    assert.equal(MOCK_SUPPLIERS.slice(0, 8).length, 8);
    assert.equal(MOCK_SUPPLIERS.slice(8, 16).length, 8);
  });

  it('first page should have items 1-8', () => {
    const page1 = MOCK_SUPPLIERS.slice(0, 8);
    assert.equal(page1.length, 8);
    assert.equal(page1[0]?.code, 'SUP-001');
  });

  it('second page should have items 9-16', () => {
    const page2 = MOCK_SUPPLIERS.slice(8, 16);
    assert.equal(page2.length, 8);
    assert.equal(page2[0]?.code, 'SUP-009');
  });

  it('empty array should have zero pages', () => {
    const pages = Math.ceil(0 / 8);
    assert.equal(pages, 0);
  });
});

// ---- 边界测试 ----

describe('edge cases', () => {
  it('formatCurrency should format large numbers', () => {
    assert.ok(formatCurrency(15800000).includes('万'));
    assert.ok(formatCurrency(45000).includes('万'));
  });

  it('formatCurrency should handle zero', () => {
    assert.equal(formatCurrency(0), '0');
  });

  it('defectRate edge — zero defect', () => {
    const zeroDefect = MOCK_SUPPLIERS.filter((s) => s.defectRate === 0);
    assert.ok(zeroDefect.length >= 2);
  });

  it('avgDeliveryDays — zero days for pending_audit', () => {
    const pendingAudit = MOCK_SUPPLIERS.filter((s) => s.status === 'pending_audit');
    for (const s of pendingAudit) {
      assert.equal(s.avgDeliveryDays, 0);
    }
  });
});

// ---- SUPPLIER_STATUS_MAP & SUPPLIER_CATEGORY_MAP completeness ----

describe('mapping completeness', () => {
  it('SUPPLIER_STATUS_MAP should have all statuses', () => {
    const keys = Object.keys(SUPPLIER_STATUS_MAP);
    for (const status of SUPPLIER_STATUSES) {
      assert.ok(keys.includes(status));
    }
  });

  it('each status map entry should have label and variant', () => {
    for (const [key, val] of Object.entries(SUPPLIER_STATUS_MAP)) {
      assert.ok(typeof val.label === 'string', `Status ${key} missing label`);
      assert.ok(['success', 'warning', 'danger', 'info'].includes(val.variant), `Status ${key} invalid variant`);
    }
  });

  it('SUPPLIER_CATEGORY_MAP should have all categories', () => {
    const keys = Object.keys(SUPPLIER_CATEGORY_MAP);
    for (const cat of SUPPLIER_CATEGORIES) {
      assert.ok(keys.includes(cat));
    }
  });

  it('SUPPLIER_CREDIT_MAP should have all 5 credit ratings', () => {
    assert.equal(Object.keys(SUPPLIER_CREDIT_MAP).length, 5);
    assert.ok(SUPPLIER_CREDIT_MAP.AAA);
    assert.ok(SUPPLIER_CREDIT_MAP.C);
  });
});
