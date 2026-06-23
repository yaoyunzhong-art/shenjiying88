/**
 * tenants-page.test.ts — Page-level tests for tenants listing page.
 * Tests list rendering, status/plan filter, search, pagination, and empty state.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: tenants-data.ts, tenants-page.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_TENANTS,
  TENANT_STATUS_MAP,
  TENANT_PLAN_MAP,
  TENANT_BILLING_MAP,
  TENANT_LIST_PRESET,
  TENANT_LIST_SEARCH_FIELDS,
  TENANT_LIST_COLUMN_KEYS,
  TENANT_DETAIL_LABELS,
  getTenantById,
  computeTenantStats,
  type TenantItem,
  type TenantStatus,
  type TenantPlan,
} from '../tenants-data';

// ---- Page-level filter helpers ----

function filterByStatus(items: TenantItem[], status: TenantStatus | 'ALL'): TenantItem[] {
  if (status === 'ALL') return items;
  return items.filter((t) => t.status === status);
}

function filterByPlan(items: TenantItem[], plan: TenantPlan | 'ALL'): TenantItem[] {
  if (plan === 'ALL') return items;
  return items.filter((t) => t.plan === plan);
}

function filterByBilling(items: TenantItem[], mode: 'monthly' | 'yearly' | 'ALL'): TenantItem[] {
  if (mode === 'ALL') return items;
  return items.filter((t) => t.billingMode === mode);
}

function searchTenants(items: TenantItem[], keyword: string): TenantItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter((t) =>
    TENANT_LIST_SEARCH_FIELDS.some((field) =>
      String(t[field]).toLowerCase().includes(lower)
    )
  );
}

function paginate(items: TenantItem[], page: number, pageSize: number): TenantItem[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// ---- 正例 ----

describe('tenants-page: 正例 (positive cases)', () => {
  describe('MOCK_TENANTS data integrity', () => {
    it('should contain at least 15 records across 3 markets', () => {
      assert.ok(MOCK_TENANTS.length >= 15, `expected >= 15, got ${MOCK_TENANTS.length}`);
      const markets = new Set(MOCK_TENANTS.map((t) => t.marketCode));
      assert.ok(markets.has('cn-mainland'));
      assert.ok(markets.has('us-default'));
      assert.ok(markets.has('uk-default'));
    });

    it('every tenant should have unique id and code', () => {
      const ids = MOCK_TENANTS.map((t) => t.id);
      const codes = MOCK_TENANTS.map((t) => t.code);
      assert.strictEqual(new Set(ids).size, ids.length);
      assert.strictEqual(new Set(codes).size, codes.length);
    });

    it('every tenant should have valid status, plan, and billingMode', () => {
      for (const t of MOCK_TENANTS) {
        assert.ok(TENANT_STATUS_MAP[t.status], `invalid status ${t.status} for ${t.code}`);
        assert.ok(TENANT_PLAN_MAP[t.plan], `invalid plan ${t.plan} for ${t.code}`);
        assert.ok(TENANT_BILLING_MAP[t.billingMode], `invalid billingMode ${t.billingMode} for ${t.code}`);
      }
    });

    it('storeCount, brandCount, adminCount should all be >= 0', () => {
      for (const t of MOCK_TENANTS) {
        assert.ok(t.storeCount >= 0, `negative storeCount for ${t.code}`);
        assert.ok(t.brandCount >= 0, `negative brandCount for ${t.code}`);
        assert.ok(t.adminCount >= 0, `negative adminCount for ${t.code}`);
      }
    });

    it('all 4 statuses should be represented', () => {
      const statuses = new Set(MOCK_TENANTS.map((t) => t.status));
      assert.ok(statuses.has('active'));
      assert.ok(statuses.has('pending'));
      assert.ok(statuses.has('inactive'));
      assert.ok(statuses.has('suspended'));
    });

    it('all 3 plans should be represented', () => {
      const plans = new Set(MOCK_TENANTS.map((t) => t.plan));
      assert.ok(plans.has('enterprise'));
      assert.ok(plans.has('professional'));
      assert.ok(plans.has('starter'));
    });
  });

  describe('TENANT_LIST_PRESET', () => {
    it('should have correct defaults', () => {
      assert.strictEqual(TENANT_LIST_PRESET.defaultPageSize, 10);
      assert.deepStrictEqual(TENANT_LIST_PRESET.pageSizeOptions, [5, 10, 15, 20]);
      assert.deepStrictEqual(TENANT_LIST_PRESET.searchFields, ['code', 'name', 'marketCode']);
      assert.deepStrictEqual(TENANT_LIST_PRESET.statuses, ['active', 'pending', 'inactive', 'suspended']);
      assert.deepStrictEqual(TENANT_LIST_PRESET.plans, ['enterprise', 'professional', 'starter']);
      assert.deepStrictEqual(TENANT_LIST_PRESET.markets, ['cn-mainland', 'us-default', 'uk-default']);
    });

    it('TENANT_LIST_COLUMN_KEYS should have 10 columns', () => {
      assert.strictEqual(TENANT_LIST_COLUMN_KEYS.length, 10);
      assert.ok(TENANT_LIST_COLUMN_KEYS.includes('code'));
      assert.ok(TENANT_LIST_COLUMN_KEYS.includes('name'));
      assert.ok(TENANT_LIST_COLUMN_KEYS.includes('status'));
      assert.ok(TENANT_LIST_COLUMN_KEYS.includes('plan'));
      assert.ok(TENANT_LIST_COLUMN_KEYS.includes('billingMode'));
    });
  });

  describe('status filter', () => {
    it('filter active should return only active tenants', () => {
      const result = filterByStatus(MOCK_TENANTS, 'active');
      assert.ok(result.length >= 8, `expected >= 8 active, got ${result.length}`);
      for (const t of result) {
        assert.strictEqual(t.status, 'active');
      }
    });

    it('filter pending should return only pending tenants', () => {
      const result = filterByStatus(MOCK_TENANTS, 'pending');
      assert.ok(result.length >= 2);
      for (const t of result) {
        assert.strictEqual(t.status, 'pending');
      }
    });

    it('filter inactive should return only inactive tenants', () => {
      const result = filterByStatus(MOCK_TENANTS, 'inactive');
      assert.ok(result.length >= 1);
      for (const t of result) {
        assert.strictEqual(t.status, 'inactive');
      }
    });

    it('filter suspended should return only suspended tenants', () => {
      const result = filterByStatus(MOCK_TENANTS, 'suspended');
      assert.ok(result.length >= 1);
      for (const t of result) {
        assert.strictEqual(t.status, 'suspended');
      }
    });
  });

  describe('plan filter', () => {
    it('filter enterprise should return only enterprise tenants', () => {
      const result = filterByPlan(MOCK_TENANTS, 'enterprise');
      assert.ok(result.length >= 4, `expected >= 4 enterprise, got ${result.length}`);
      for (const t of result) {
        assert.strictEqual(t.plan, 'enterprise');
      }
    });

    it('filter professional should return only professional tenants', () => {
      const result = filterByPlan(MOCK_TENANTS, 'professional');
      assert.ok(result.length >= 3);
      for (const t of result) {
        assert.strictEqual(t.plan, 'professional');
      }
    });
  });

  describe('search', () => {
    it('should find tenant by name', () => {
      const result = searchTenants(MOCK_TENANTS, '华润万象');
      assert.ok(result.length >= 1);
    });

    it('should find tenant by code', () => {
      const result = searchTenants(MOCK_TENANTS, 'TNT-001');
      assert.ok(result.length >= 1);
    });

    it('should find tenant by marketCode', () => {
      const result = searchTenants(MOCK_TENANTS, 'uk-default');
      assert.ok(result.length >= 1);
    });

    it('empty search should return all tenants', () => {
      const result = searchTenants(MOCK_TENANTS, '');
      assert.strictEqual(result.length, MOCK_TENANTS.length);
    });
  });

  describe('pagination', () => {
    it('page 1 with pageSize 5 should return 5 items', () => {
      const page = paginate(MOCK_TENANTS, 1, 5);
      assert.strictEqual(page.length, 5);
    });

    it('page 2 with pageSize 5 should return 5 items', () => {
      const page = paginate(MOCK_TENANTS, 2, 5);
      assert.strictEqual(page.length, 5);
    });

    it('last page with pageSize 5 should return the remainder', () => {
      const totalPages = getTotalPages(MOCK_TENANTS.length, 5);
      const page = paginate(MOCK_TENANTS, totalPages, 5);
      const expectedRemainder = MOCK_TENANTS.length % 5 || 5;
      assert.strictEqual(page.length, expectedRemainder);
    });

    it('getTotalPages should be correct', () => {
      assert.strictEqual(getTotalPages(15, 10), 2);
      assert.strictEqual(getTotalPages(15, 15), 1);
      assert.strictEqual(getTotalPages(16, 10), 2);
      assert.strictEqual(getTotalPages(1, 10), 1);
    });
  });

  describe('computeTenantStats', () => {
    it('should return correct aggregate counts', () => {
      const stats = computeTenantStats(MOCK_TENANTS);
      assert.strictEqual(stats.total, MOCK_TENANTS.length);
      assert.strictEqual(stats.active, MOCK_TENANTS.filter((t) => t.status === 'active').length);
      assert.strictEqual(stats.enterprise, MOCK_TENANTS.filter((t) => t.plan === 'enterprise').length);
      assert.strictEqual(stats.markets, 3);
    });

    it('computeTenantStats for empty array returns zeros', () => {
      const stats = computeTenantStats([]);
      assert.deepStrictEqual(stats, { total: 0, active: 0, enterprise: 0, markets: 0 });
    });
  });

  describe('getTenantById', () => {
    it('should return correct detail for existing tenant', () => {
      const t = getTenantById('t1');
      assert.ok(t, 't1 should exist');
      assert.strictEqual(t!.id, 't1');
      assert.strictEqual(t!.name, '华润万象生活');
      assert.strictEqual(t!.status, 'active');
      assert.strictEqual(t!.plan, 'enterprise');
      assert.ok(t!.contactName.length > 0);
      assert.ok(t!.contactEmail.length > 0);
      assert.ok(t!.description.length > 0);
    });

    it('getTenantById returns undefined for unknown id', () => {
      assert.strictEqual(getTenantById('t-nonexistent'), undefined);
    });
  });

  describe('TENANT_DETAIL_LABELS', () => {
    it('should have all expected labels', () => {
      assert.strictEqual(TENANT_DETAIL_LABELS.code, '租户编码');
      assert.strictEqual(TENANT_DETAIL_LABELS.status, '运营状态');
      assert.strictEqual(TENANT_DETAIL_LABELS.plan, '套餐');
      assert.strictEqual(TENANT_DETAIL_LABELS.billingMode, '计费方式');
      assert.strictEqual(TENANT_DETAIL_LABELS.contactName, '联系人');
      assert.strictEqual(TENANT_DETAIL_LABELS.storeCount, '关联门店数');
      assert.strictEqual(TENANT_DETAIL_LABELS.overviewTitle, '租户信息');
      assert.strictEqual(TENANT_DETAIL_LABELS.backToList, '返回租户列表');
    });
  });

  describe('status/plan/billing maps', () => {
    it('TENANT_STATUS_MAP should have Chinese labels', () => {
      assert.strictEqual(TENANT_STATUS_MAP.active.label, '运营中');
      assert.strictEqual(TENANT_STATUS_MAP.pending.label, '待激活');
      assert.strictEqual(TENANT_STATUS_MAP.suspended.label, '已暂停');
    });

    it('TENANT_PLAN_MAP should have Chinese labels', () => {
      assert.strictEqual(TENANT_PLAN_MAP.enterprise.label, '企业版');
      assert.strictEqual(TENANT_PLAN_MAP.professional.label, '专业版');
    });

    it('TENANT_BILLING_MAP should have Chinese labels', () => {
      assert.strictEqual(TENANT_BILLING_MAP.monthly, '月付');
      assert.strictEqual(TENANT_BILLING_MAP.yearly, '年付');
    });
  });
});

// ---- 反例 ----

describe('tenants-page: 反例 (negative cases)', () => {
  it('search for nonexistent keyword returns empty', () => {
    const result = searchTenants(MOCK_TENANTS, 'ZZZZ_NOT_FOUND');
    assert.strictEqual(result.length, 0);
  });

  it('empty tenant list should handle all filters gracefully', () => {
    const empty: TenantItem[] = [];
    assert.strictEqual(filterByStatus(empty, 'active').length, 0);
    assert.strictEqual(filterByPlan(empty, 'enterprise').length, 0);
    assert.strictEqual(searchTenants(empty, 'test').length, 0);
    assert.strictEqual(paginate(empty, 1, 10).length, 0);
  });

  it('pagination should return empty for page beyond total', () => {
    const result = paginate(MOCK_TENANTS, 999, 10);
    assert.strictEqual(result.length, 0);
  });

  it('pagination should return empty for page 0', () => {
    const result = paginate(MOCK_TENANTS, 0, 10);
    assert.strictEqual(result.length, 0);
  });

  it('getTenantById should return undefined for empty string', () => {
    assert.strictEqual(getTenantById(''), undefined);
  });

  it('TENANT_DETAIL_LABELS.notFound should return formatted string', () => {
    const result = TENANT_DETAIL_LABELS.notFound('TNT-404');
    assert.strictEqual(result, '租户 TNT-404 不存在');
  });
});

// ---- 边界 ----

describe('tenants-page: 边界 (boundary cases)', () => {
  it('single char search should find matches', () => {
    const result = searchTenants(MOCK_TENANTS, '华');
    assert.ok(result.length >= 1);
  });

  it('case-insensitive search should work', () => {
    const upper = searchTenants(MOCK_TENANTS, 'TNT-001');
    const lower = searchTenants(MOCK_TENANTS, 'tnt-001');
    assert.strictEqual(upper.length, lower.length);
  });

  it('combined filter: status + plan', () => {
    let result = filterByStatus(MOCK_TENANTS, 'active');
    result = filterByPlan(result, 'enterprise');
    for (const t of result) {
      assert.strictEqual(t.status, 'active');
      assert.strictEqual(t.plan, 'enterprise');
    }
  });

  it('getTotalPages for 0 items should return 1', () => {
    assert.strictEqual(getTotalPages(0, 10), 1);
  });

  it('pagination with pageSize larger than total should return all', () => {
    const page = paginate(MOCK_TENANTS, 1, 100);
    assert.strictEqual(page.length, MOCK_TENANTS.length);
  });

  it('billing mode distribution should be balanced', () => {
    const monthly = MOCK_TENANTS.filter((t) => t.billingMode === 'monthly');
    const yearly = MOCK_TENANTS.filter((t) => t.billingMode === 'yearly');
    assert.ok(monthly.length > 0);
    assert.ok(yearly.length > 0);
    assert.strictEqual(monthly.length + yearly.length, MOCK_TENANTS.length);
  });

  it('active tenants should be majority', () => {
    const active = MOCK_TENANTS.filter((t) => t.status === 'active').length;
    const nonActive = MOCK_TENANTS.length - active;
    assert.ok(active > nonActive, `active ${active} should be > non-active ${nonActive}`);
  });

  it('cn-mainland should have the most tenants', () => {
    const cn = MOCK_TENANTS.filter((t) => t.marketCode === 'cn-mainland');
    const nonCn = MOCK_TENANTS.length - cn.length;
    assert.ok(cn.length > nonCn, `cn ${cn.length} should be > non-cn ${nonCn}`);
  });
});
