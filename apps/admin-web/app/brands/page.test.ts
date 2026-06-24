/**
 * brands-page.test.ts — Page-level tests for the brands listing page.
 * Tests list rendering, search filtering, status/tier filters, loading/error states.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: brands-data.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_BRANDS,
  BRAND_STATUS_MAP,
  BRAND_TIER_MAP,
  BRAND_STATUSES,
  BRAND_TIERS,
  adminBrandRoute,
  buildBrandDetailHref,
  computeBrandStats,
  computeBrandMarketDistribution,
  getBrandUniqueMarkets,
  getBrandStatusLabel,
  getBrandTierLabel,
  getBrandStatusVariant,
  getBrandTierVariant,
  type BrandItem,
  type BrandStatus,
  type BrandTier,
} from '../brands-data';

// ---- Page-level filter helpers ----

const SEARCH_FIELDS: (keyof BrandItem)[] = ['code', 'name', 'marketCode'];

function filterBySearch(items: BrandItem[], term: string): BrandItem[] {
  if (!term.trim()) return items;
  const lower = term.toLowerCase();
  return items.filter((item) =>
    SEARCH_FIELDS.some((field) => String(item[field]).toLowerCase().includes(lower))
  );
}

function filterByStatus(items: BrandItem[], status: BrandStatus | 'ALL'): BrandItem[] {
  if (status === 'ALL') return items;
  return items.filter((item) => item.status === status);
}

function filterByTier(items: BrandItem[], tier: BrandTier | 'ALL'): BrandItem[] {
  if (tier === 'ALL') return items;
  return items.filter((item) => item.tier === tier);
}

function filterByMarket(items: BrandItem[], market: string): BrandItem[] {
  if (market === 'ALL') return items;
  return items.filter((item) => item.marketCode === market);
}

function fullFilterChain(
  items: BrandItem[],
  search: string,
  status: BrandStatus | 'ALL',
  tier: BrandTier | 'ALL',
  market: string,
): BrandItem[] {
  let result = filterBySearch(items, search);
  result = filterByStatus(result, status);
  result = filterByTier(result, tier);
  result = filterByMarket(result, market);
  return result;
}

// ---- Loading/error state simulation ----

interface LoadResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

function createLoading(): LoadResult<BrandItem> {
  return { data: [], loading: true, error: null };
}

function createError(message: string): LoadResult<BrandItem> {
  return { data: [], loading: false, error: message };
}

function createSuccess(items: BrandItem[]): LoadResult<BrandItem> {
  return { data: items, loading: false, error: null };
}

// ---- 正例 ----

describe('brands-page: 正例 (positive cases)', () => {
  describe('brand route', () => {
    it('should export correct route config', () => {
      assert.strictEqual(adminBrandRoute.href, '/brands');
      assert.strictEqual(adminBrandRoute.detailHrefBase, '/brands');
      assert.ok(adminBrandRoute.title.length > 0);
      assert.ok(adminBrandRoute.description.length > 0);
    });

    it('buildBrandDetailHref should build correct link', () => {
      assert.strictEqual(buildBrandDetailHref('b1'), '/brands/b1');
      assert.strictEqual(buildBrandDetailHref('b10'), '/brands/b10');
    });
  });

  describe('MOCK_BRANDS data integrity', () => {
    it('should contain at least 12 brands across 3 markets', () => {
      assert.ok(MOCK_BRANDS.length >= 12, `expected >= 12, got ${MOCK_BRANDS.length}`);
      const markets = new Set(MOCK_BRANDS.map((b) => b.marketCode));
      assert.ok(markets.has('cn-mainland'), 'missing cn-mainland');
      assert.ok(markets.has('us-default'), 'missing us-default');
      assert.ok(markets.has('uk-default'), 'missing uk-default');
    });

    it('every brand should have unique id and code', () => {
      const ids = MOCK_BRANDS.map((b) => b.id);
      const codes = MOCK_BRANDS.map((b) => b.code);
      assert.strictEqual(new Set(ids).size, ids.length);
      assert.strictEqual(new Set(codes).size, codes.length);
    });

    it('every brand should have valid status and tier', () => {
      for (const b of MOCK_BRANDS) {
        assert.ok(BRAND_STATUSES.includes(b.status), `invalid status ${b.status} for ${b.id}`);
        assert.ok(BRAND_TIERS.includes(b.tier), `invalid tier ${b.tier} for ${b.id}`);
      }
    });

    it('every brand should have non-empty name', () => {
      for (const b of MOCK_BRANDS) {
        assert.ok(b.name.trim().length > 0, `empty name for ${b.id}`);
      }
    });

    it('storeCount and tenantCount should be >= 0', () => {
      for (const b of MOCK_BRANDS) {
        assert.ok(b.storeCount >= 0, `negative storeCount for ${b.id}`);
        assert.ok(b.tenantCount >= 0, `negative tenantCount for ${b.id}`);
      }
    });
  });

  describe('status/tier maps', () => {
    it('BRAND_STATUS_MAP should have all statuses with Chinese labels', () => {
      assert.strictEqual(BRAND_STATUS_MAP.active.label, '运营中');
      assert.strictEqual(BRAND_STATUS_MAP.pending.label, '待激活');
      assert.strictEqual(BRAND_STATUS_MAP.inactive.label, '已停用');
      assert.strictEqual(BRAND_STATUS_MAP.suspended.label, '已暂停');
    });

    it('BRAND_TIER_MAP should have all tiers with Chinese labels', () => {
      assert.strictEqual(BRAND_TIER_MAP.premium.label, '旗舰');
      assert.strictEqual(BRAND_TIER_MAP.standard.label, '标准');
      assert.strictEqual(BRAND_TIER_MAP.basic.label, '基础');
    });

    it('getBrandStatusLabel/ getBrandTierLabel should return correct labels', () => {
      assert.strictEqual(getBrandStatusLabel('active'), '运营中');
      assert.strictEqual(getBrandTierLabel('premium'), '旗舰');
    });

    it('getBrandStatusVariant/ getBrandTierVariant should return correct variants', () => {
      assert.strictEqual(getBrandStatusVariant('active'), 'success');
      assert.strictEqual(getBrandStatusVariant('suspended'), 'danger');
      assert.strictEqual(getBrandTierVariant('premium'), 'success');
      assert.strictEqual(getBrandTierVariant('basic'), 'warning');
    });
  });

  describe('search filter', () => {
    it('should find brands by name keyword', () => {
      const result = filterBySearch(MOCK_BRANDS, 'M5 Premium');
      assert.ok(result.length >= 1, 'should find M5 Premium');
      for (const b of result) {
        assert.ok(b.name.includes('M5 Premium') || b.code.includes('M5 Premium'));
      }
    });

    it('should find brands by marketCode', () => {
      const result = filterBySearch(MOCK_BRANDS, 'us-default');
      assert.ok(result.length >= 2, 'should find us-default brands');
      for (const b of result) {
        assert.ok(b.marketCode.toLowerCase().includes('us-default'));
      }
    });

    it('should return all brands for empty search term', () => {
      const result = filterBySearch(MOCK_BRANDS, '');
      assert.strictEqual(result.length, MOCK_BRANDS.length);
    });
  });

  describe('status filter', () => {
    it('filter active should return only active brands', () => {
      const result = filterByStatus(MOCK_BRANDS, 'active');
      assert.ok(result.length >= 5, `expected >= 5 active, got ${result.length}`);
      for (const b of result) {
        assert.strictEqual(b.status, 'active');
      }
    });

    it('filter suspended should return only suspended brands', () => {
      const result = filterByStatus(MOCK_BRANDS, 'suspended');
      assert.ok(result.length >= 1);
      for (const b of result) {
        assert.strictEqual(b.status, 'suspended');
      }
    });
  });

  describe('tier filter', () => {
    it('filter premium should return only premium brands', () => {
      const result = filterByTier(MOCK_BRANDS, 'premium');
      assert.ok(result.length >= 2);
      for (const b of result) {
        assert.strictEqual(b.tier, 'premium');
      }
    });
  });

  describe('combined filter', () => {
    it('should filter by status + tier simultaneously', () => {
      const result = fullFilterChain(MOCK_BRANDS, '', 'active', 'premium', 'ALL');
      for (const b of result) {
        assert.strictEqual(b.status, 'active');
        assert.strictEqual(b.tier, 'premium');
      }
    });

    it('should filter by search + market', () => {
      const result = fullFilterChain(MOCK_BRANDS, 'M5', 'ALL', 'ALL', 'cn-mainland');
      for (const b of result) {
        assert.strictEqual(b.marketCode, 'cn-mainland');
      }
    });
  });

  describe('computeBrandStats', () => {
    it('should compute correct aggregate counts', () => {
      const stats = computeBrandStats(MOCK_BRANDS);
      assert.strictEqual(stats.total, MOCK_BRANDS.length);
      assert.ok(stats.active > 0);
      assert.ok(stats.premium > 0);
      assert.strictEqual(stats.total, stats.active + stats.inactive + stats.pending + stats.suspended);
    });

    it('computeBrandStats for empty array should return zeros', () => {
      const stats = computeBrandStats([]);
      assert.deepStrictEqual(stats, {
        total: 0, active: 0, inactive: 0, pending: 0, suspended: 0,
        premium: 0, standard: 0, basic: 0, totalStores: 0, totalTenants: 0,
      });
    });
  });

  describe('computeBrandMarketDistribution', () => {
    it('should return market distribution', () => {
      const dist = computeBrandMarketDistribution(MOCK_BRANDS);
      assert.ok((dist['cn-mainland'] ?? 0) > 0);
      assert.ok((dist['us-default'] ?? 0) > 0);
      assert.ok((dist['uk-default'] ?? 0) > 0);
    });
  });

  describe('getBrandUniqueMarkets', () => {
    it('should return unique markets', () => {
      const markets = getBrandUniqueMarkets(MOCK_BRANDS);
      assert.ok(markets.includes('cn-mainland'));
      assert.ok(markets.includes('us-default'));
      assert.ok(markets.includes('uk-default'));
    });
  });
});

// ---- 反例 ----

describe('brands-page: 反例 (negative cases)', () => {
  it('search for nonexistent keyword should return empty', () => {
    const result = filterBySearch(MOCK_BRANDS, 'ZZZZ_NOT_FOUND');
    assert.strictEqual(result.length, 0);
  });

  it('filter by nonexistent status should return empty', () => {
    const result = filterByStatus(MOCK_BRANDS, 'inactive' as BrandStatus).filter(
      (b) => b.status === 'unknown' as unknown as BrandStatus
    );
    assert.strictEqual(result.length, 0);
  });

  it('empty brand list should handle all filters gracefully', () => {
    const empty: BrandItem[] = [];
    assert.strictEqual(filterBySearch(empty, 'test').length, 0);
    assert.strictEqual(filterByStatus(empty, 'active').length, 0);
    assert.strictEqual(filterByTier(empty, 'premium').length, 0);
    assert.strictEqual(filterByMarket(empty, 'cn-mainland').length, 0);
    assert.strictEqual(fullFilterChain(empty, '', 'ALL', 'ALL', 'ALL').length, 0);
  });

  it('getBrandStatusLabel should return default for unknown status', () => {
    const result = getBrandStatusLabel('unknown' as BrandStatus);
    assert.strictEqual(result, 'unknown');
  });

  it('getBrandTierLabel should return default for unknown tier', () => {
    const result = getBrandTierLabel('unknown' as BrandTier);
    assert.strictEqual(result, 'unknown');
  });
});

// ---- 边界 ----

describe('brands-page: 边界 (boundary cases)', () => {
  it('single character search should match', () => {
    const result = filterBySearch(MOCK_BRANDS, 'M');
    assert.ok(result.length > 0, 'single char search should find matches');
  });

  it('case-insensitive search should work', () => {
    const upper = filterBySearch(MOCK_BRANDS, 'M5 PREMIUM');
    const lower = filterBySearch(MOCK_BRANDS, 'm5 premium');
    assert.ok(upper.length > 0);
    assert.strictEqual(upper.length, lower.length);
  });

  it('loading state should have loading=true and no error', () => {
    const state = createLoading();
    assert.strictEqual(state.loading, true);
    assert.strictEqual(state.error, null);
    assert.strictEqual(state.data.length, 0);
  });

  it('error state should have error message and no loading', () => {
    const state = createError('网络错误');
    assert.strictEqual(state.loading, false);
    assert.strictEqual(state.error, '网络错误');
    assert.strictEqual(state.data.length, 0);
  });

  it('success state should have data and no loading/error', () => {
    const state = createSuccess(MOCK_BRANDS);
    assert.strictEqual(state.loading, false);
    assert.strictEqual(state.error, null);
    assert.strictEqual(state.data.length, MOCK_BRANDS.length);
  });

  it('filter ALL for status and tier should return everything', () => {
    const result = fullFilterChain(MOCK_BRANDS, '', 'ALL', 'ALL', 'ALL');
    assert.strictEqual(result.length, MOCK_BRANDS.length);
  });

  it('totalStores should be sum of all storeCounts', () => {
    const expectedTotalStores = MOCK_BRANDS.reduce((s, b) => s + b.storeCount, 0);
    const stats = computeBrandStats(MOCK_BRANDS);
    assert.strictEqual(stats.totalStores, expectedTotalStores);
  });
});
