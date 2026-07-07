/**
 * brands/page.test.tsx — 品牌管理页面数据层测试
 *
 * 测试策略 (L1):
 * - 正例: 数据层 helper 函数、常量定义、mock 数据完整性
 * - 反例: 无效值处理
 * - 边界: 边界值、空值、大数值
 *
 * Pattern: 正例 + 反例 + 边界
 * 角色视角: 👔 租户管理员 / 🏢 品牌经理
 *
 * 注意: 本文件为纯数据层测试，不依赖 DOM/浏览器环境。
 * React 组件渲染测试需通过 vitest + jsdom 执行。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_BRANDS,
  formatRevenue,
  BRAND_STATUS_MAP,
  BRAND_CATEGORY_MAP,
  BRAND_STATUSES,
  BRAND_CATEGORIES,
  type BrandItem,
  type BrandStatus,
  type BrandCategory,
} from './brands-data';

// ─── 1. 正例 — 数据层 helpers ──────────────────────────────────────────

describe('brands-data — formatRevenue', () => {
  it('formats millions as ¥XXX.X万', () => {
    assert.equal(formatRevenue(8_500_000), '¥850.0万');
  });

  it('formats 12 million correctly', () => {
    assert.equal(formatRevenue(12_000_000), '¥1200.0万');
  });

  it('formats thousands as ¥XXX.XK', () => {
    assert.equal(formatRevenue(850_000), '¥850.0K');
  });

  it('formats small numbers as exact value', () => {
    assert.equal(formatRevenue(500), '¥500');
  });

  it('formats zero as ¥0', () => {
    assert.equal(formatRevenue(0), '¥0');
  });

  it('formats very large numbers correctly', () => {
    const result = formatRevenue(999_999_999);
    assert.ok(result.startsWith('¥'), 'must start with ¥');
    assert.ok(result.endsWith('万'), 'must end with 万 for large numbers');
  });

  it('handles single unit revenue', () => {
    assert.equal(formatRevenue(1), '¥1');
  });
});

describe('brands-data — constants', () => {
  it('BRAND_STATUSES contains all expected statuses', () => {
    const expected: BrandStatus[] = ['active', 'pending_review', 'suspended', 'archived'];
    assert.deepEqual([...BRAND_STATUSES].sort(), [...expected].sort());
  });

  it('BRAND_CATEGORIES contains all expected categories', () => {
    const expected: BrandCategory[] = ['retail', 'food', 'fashion', 'tech', 'service', 'other'];
    assert.deepEqual([...BRAND_CATEGORIES].sort(), [...expected].sort());
  });

  it('BRAND_STATUS_MAP covers all statuses', () => {
    for (const s of BRAND_STATUSES) {
      const entry = BRAND_STATUS_MAP[s];
      assert.ok(entry, `missing status map for "${s}"`);
      assert.equal(typeof entry.label, 'string', `label must be string for "${s}"`);
      assert.ok(['success', 'warning', 'danger', 'neutral'].includes(entry.variant),
        `invalid variant "${entry.variant}" for "${s}"`);
    }
  });

  it('BRAND_CATEGORY_MAP covers all categories', () => {
    for (const c of BRAND_CATEGORIES) {
      const entry = BRAND_CATEGORY_MAP[c];
      assert.ok(entry, `missing category map for "${c}"`);
      assert.equal(typeof entry.label, 'string', `label must be string for "${c}"`);
    }
  });
});

describe('brands-data — MOCK_BRANDS integrity', () => {
  it('has exactly 8 mock brands', () => {
    assert.equal(MOCK_BRANDS.length, 8);
  });

  it('each brand has unique id', () => {
    const ids = MOCK_BRANDS.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length, 'brand IDs must be unique');
  });

  it('each brand has all required fields', () => {
    const requiredFields: (keyof BrandItem)[] = [
      'id', 'brandName', 'tenantCode', 'status', 'category',
      'registeredAt', 'contactEmail', 'contactPhone',
      'storeCount', 'marketCodes', 'annualRevenue', 'employeeCount',
    ];
    for (const brand of MOCK_BRANDS) {
      for (const field of requiredFields) {
        assert.ok(brand[field] !== undefined, `${brand.brandName} missing field "${field}"`);
      }
    }
  });

  it('each brand has valid status', () => {
    for (const brand of MOCK_BRANDS) {
      assert.ok(BRAND_STATUSES.includes(brand.status), `${brand.brandName} invalid status "${brand.status}"`);
    }
  });

  it('each brand has valid category', () => {
    for (const brand of MOCK_BRANDS) {
      assert.ok(BRAND_CATEGORIES.includes(brand.category), `${brand.brandName} invalid category "${brand.category}"`);
    }
  });

  it('brand names have proper length', () => {
    for (const brand of MOCK_BRANDS) {
      assert.ok(brand.brandName.length >= 2 && brand.brandName.length <= 50,
        `${brand.brandName} name length ${brand.brandName.length} out of range [2, 50]`);
    }
  });

  it('annualRevenue and storeCount are non-negative numbers', () => {
    for (const brand of MOCK_BRANDS) {
      assert.equal(typeof brand.annualRevenue, 'number', `${brand.brandName} annualRevenue not a number`);
      assert.equal(typeof brand.storeCount, 'number', `${brand.brandName} storeCount not a number`);
      assert.ok(brand.annualRevenue >= 0, `${brand.brandName} negative annualRevenue`);
      assert.ok(brand.storeCount >= 0, `${brand.brandName} negative storeCount`);
    }
  });

  it('employeeCount is non-negative', () => {
    for (const brand of MOCK_BRANDS) {
      assert.equal(typeof brand.employeeCount, 'number', `${brand.brandName} employeeCount not a number`);
      assert.ok(brand.employeeCount >= 0, `${brand.brandName} negative employeeCount`);
    }
  });
});

// ─── 2. 正例 — 业务规则 ────────────────────────────────────────────────

describe('brands-data — business rules', () => {
  it('every brand has at least one market code when storeCount > 0', () => {
    for (const brand of MOCK_BRANDS) {
      if (brand.storeCount > 0) {
        assert.ok(brand.marketCodes.length > 0,
          `${brand.brandName} has ${brand.storeCount} stores but no market codes`);
      }
    }
  });

  it('brands with storeCount = 0 have 0 annualRevenue', () => {
    for (const brand of MOCK_BRANDS) {
      if (brand.storeCount === 0) {
        assert.equal(brand.annualRevenue, 0,
          `${brand.brandName} has 0 stores but revenue ${brand.annualRevenue}`);
      }
    }
  });

  it('suspended brands have market codes', () => {
    const suspended = MOCK_BRANDS.filter((b) => b.status === 'suspended');
    for (const brand of suspended) {
      assert.ok(brand.marketCodes.length > 0,
        `suspended brand ${brand.brandName} has no market codes`);
    }
  });

  it('pending_review brands have storeCount >= 0', () => {
    const pending = MOCK_BRANDS.filter((b) => b.status === 'pending_review');
    for (const brand of pending) {
      assert.ok(brand.storeCount >= 0, `${brand.brandName} negative storeCount`);
    }
  });

  it('demo-tenant brands outnumber other-tenant brands', () => {
    const demoCount = MOCK_BRANDS.filter((b) => b.tenantCode === 'demo-tenant').length;
    const otherCount = MOCK_BRANDS.filter((b) => b.tenantCode === 'other-tenant').length;
    assert.ok(demoCount > otherCount, 'expect demo-tenant to have more brands');
  });
});

// ─── 3. 反例 — 错误处理 ────────────────────────────────────────────────

describe('brands-data — 反例 (negative)', () => {
  it('brands with status "deleted" do not exist', () => {
    const deleted = MOCK_BRANDS.filter((b) => b.status === 'deleted' as BrandStatus);
    assert.equal(deleted.length, 0, 'no brand should have deleted status');
  });

  it('no brand has negative store count', () => {
    const negative = MOCK_BRANDS.filter((b) => b.storeCount < 0);
    assert.equal(negative.length, 0);
  });

  it('no brand has empty name', () => {
    const empty = MOCK_BRANDS.filter((b) => !b.brandName.trim());
    assert.equal(empty.length, 0);
  });

  it('brand status map does not contain "deleted"', () => {
    assert.ok(!('deleted' in BRAND_STATUS_MAP));
  });

  it('brand category map does not contain "unknown"', () => {
    assert.ok(!('unknown' in BRAND_CATEGORY_MAP));
  });
});

// ─── 4. 边界 — 边界值测试 ──────────────────────────────────────────────

describe('brands-data — 边界 (boundary)', () => {
  it('formatRevenue handles edge case: revenue between 1000 and 999,999', () => {
    assert.equal(formatRevenue(1000), '¥1.0K');
    assert.equal(formatRevenue(999_999), '¥1000.0K');
  });

  it('formatRevenue handles edge case: revenue between 1,000,000 and MAX', () => {
    assert.equal(formatRevenue(1_000_000), '¥100.0万');
    assert.equal(formatRevenue(10_000_000), '¥1000.0万');
  });

  it('total annual revenue of all brands is sum of MOCK_BRANDS', () => {
    const total = MOCK_BRANDS.reduce((s, b) => s + b.annualRevenue, 0);
    // Known sum: 8500000 + 12000000 + 1200000 + 3000000 + 25000000 + 0 + 18000000 + 0 = 67,700,000
    assert.equal(total, 67_700_000);
  });

  it('total store count of all brands', () => {
    const total = MOCK_BRANDS.reduce((s, b) => s + b.storeCount, 0);
    // 12 + 8 + 3 + 5 + 20 + 0 + 15 + 0 = 63
    assert.equal(total, 63);
  });

  it('total employee count of all brands', () => {
    const total = MOCK_BRANDS.reduce((s, b) => s + b.employeeCount, 0);
    // 45 + 62 + 15 + 20 + 120 + 0 + 88 + 3 = 353
    assert.equal(total, 353);
  });

  it('each brand registeredAt is a valid date string (YYYY-MM-DD)', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const brand of MOCK_BRANDS) {
      assert.ok(dateRegex.test(brand.registeredAt),
        `${brand.brandName} invalid date format "${brand.registeredAt}"`);
      const date = new Date(brand.registeredAt);
      assert.ok(!isNaN(date.getTime()), `${brand.brandName} invalid date "${brand.registeredAt}"`);
    }
  });

  it('contactPhone follows expected pattern', () => {
    // Most Chinese phone numbers start with 1 followed by 11 digits (show partially)
    for (const brand of MOCK_BRANDS) {
      assert.ok(brand.contactPhone.startsWith('1'), `${brand.brandName} phone not starting with 1`);
    }
  });
});
