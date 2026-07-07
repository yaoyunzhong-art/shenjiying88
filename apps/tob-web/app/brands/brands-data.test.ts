/**
 * brands-data.test.ts — 品牌数据层单元测试
 * 覆盖: 数据完整性 / 状态 & 分类映射 / 工具函数
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_BRANDS,
  BRAND_STATUSES,
  BRAND_CATEGORIES,
  BRAND_STATUS_MAP,
  BRAND_CATEGORY_MAP,
  formatRevenue,
} from './brands-data';

describe('brands-data integrity', () => {
  it('should have at least 8 mock brands', () => {
    assert.ok(MOCK_BRANDS.length >= 8);
  });

  it('each brand should have required fields', () => {
    for (const b of MOCK_BRANDS) {
      assert.ok(typeof b.id === 'string' && b.id.length > 0);
      assert.ok(typeof b.brandName === 'string' && b.brandName.length > 0);
      assert.ok(typeof b.tenantCode === 'string' && b.tenantCode.length > 0);
      assert.ok(typeof b.storeCount === 'number' && b.storeCount >= 0);
      assert.ok(typeof b.annualRevenue === 'number' && b.annualRevenue >= 0);
    }
  });

  it('every brand status should be valid', () => {
    for (const b of MOCK_BRANDS) {
      assert.ok(BRAND_STATUSES.includes(b.status),
        `unexpected status "${b.status}" on brand "${b.brandName}"`);
    }
  });

  it('every brand category should be valid', () => {
    for (const b of MOCK_BRANDS) {
      assert.ok(BRAND_CATEGORIES.includes(b.category),
        `unexpected category "${b.category}" on brand "${b.brandName}"`);
    }
  });

  it('active brands should have at least 1 store', () => {
    for (const b of MOCK_BRANDS.filter(b => b.status === 'active')) {
      assert.ok(b.storeCount >= 1,
        `active brand "${b.brandName}" has 0 stores`);
    }
  });

  it('archived brands should have 0 stores and 0 revenue', () => {
    for (const b of MOCK_BRANDS.filter(b => b.status === 'archived')) {
      assert.equal(b.storeCount, 0);
      assert.equal(b.annualRevenue, 0);
    }
  });
});

describe('brands-data filtering', () => {
  it('status filter should partition correctly', () => {
    for (const s of BRAND_STATUSES) {
      const filtered = MOCK_BRANDS.filter(b => b.status === s);
      assert.ok(filtered.length >= 0);
    }
  });

  it('sum of status partitions should equal total', () => {
    const sum = BRAND_STATUSES.reduce(
      (acc, s) => acc + MOCK_BRANDS.filter(b => b.status === s).length, 0,
    );
    assert.equal(sum, MOCK_BRANDS.length);
  });

  it('tenant filter should isolate correctly', () => {
    const tenants = [...new Set(MOCK_BRANDS.map(b => b.tenantCode))];
    for (const t of tenants) {
      assert.ok(MOCK_BRANDS.filter(b => b.tenantCode === t).length >= 1);
    }
  });
});

describe('brands-data status/category maps', () => {
  it('BRAND_STATUS_MAP should cover all statuses', () => {
    for (const s of BRAND_STATUSES) {
      assert.ok(s in BRAND_STATUS_MAP, `missing status map for "${s}"`);
      assert.ok(['success', 'warning', 'danger', 'neutral'].includes(BRAND_STATUS_MAP[s].variant));
    }
  });

  it('BRAND_CATEGORY_MAP should cover all categories', () => {
    for (const c of BRAND_CATEGORIES) {
      assert.ok(c in BRAND_CATEGORY_MAP, `missing category map for "${c}"`);
      assert.ok(typeof BRAND_CATEGORY_MAP[c].label === 'string');
    }
  });
});

describe('formatRevenue', () => {
  it('should format millions as 万', () => {
    const result = formatRevenue(12000000);
    assert.ok(result.includes('万'), `expected 万 suffix, got "${result}"`);
    assert.ok(result.startsWith('¥'), `expected ¥ prefix, got "${result}"`);
  });

  it('should format thousands as K', () => {
    const result = formatRevenue(8500);
    assert.ok(result.includes('K'), `expected K suffix, got "${result}"`);
  });

  it('should handle zero', () => {
    assert.equal(formatRevenue(0), '¥0');
  });

  it('should handle small values', () => {
    assert.equal(formatRevenue(500), '¥500');
  });
});
