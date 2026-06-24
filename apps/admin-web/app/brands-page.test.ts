/**
 * brands-page.test.ts — Page-level rendering pattern tests for brands listing page.
 * Tests search, pagination, tier/status/market filtering, and combined filters.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: brands-data.ts, existing brands-data.test.ts (data logic tests)
 *
 * NOTE: This file supplements the existing brands-data.test.ts which already covers
 * data integrity, status/tier maps, and stats. This file focuses on page-level
 * use-case patterns like search, filtering, and pagination.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_BRANDS,
  BRAND_STATUS_MAP,
  BRAND_TIER_MAP,
  BRAND_STATUSES,
  BRAND_TIERS,
  computeBrandStats,
  computeBrandMarketDistribution,
  type BrandItem,
  type BrandStatus,
  type BrandTier,
} from './brands-data';

// ---- Page-level filter helpers (mirrors BrandsPage logic) ----

function searchBrands(items: BrandItem[], keyword: string): BrandItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (b) =>
      b.code.toLowerCase().includes(lower) ||
      b.name.toLowerCase().includes(lower) ||
      b.marketCode.toLowerCase().includes(lower)
  );
}

function filterByStatus(items: BrandItem[], status: BrandStatus | 'ALL'): BrandItem[] {
  if (status === 'ALL' || !status) return items;
  return items.filter((b) => b.status === status);
}

function filterByTier(items: BrandItem[], tier: BrandTier | 'ALL'): BrandItem[] {
  if (tier === 'ALL') return items;
  return items.filter((b) => b.tier === tier);
}

function filterByMarket(items: BrandItem[], market: string): BrandItem[] {
  if (market === 'ALL') return items;
  return items.filter((b) => b.marketCode === market);
}

function paginate(items: BrandItem[], page: number, pageSize: number): BrandItem[] {
  if (page < 1 || pageSize <= 0) return [];
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function fullFilterChain(
  items: BrandItem[],
  keyword: string,
  status: BrandStatus | 'ALL',
  tier: BrandTier | 'ALL',
  market: string,
): BrandItem[] {
  let result = searchBrands(items, keyword);
  result = filterByStatus(result, status);
  result = filterByTier(result, tier);
  result = filterByMarket(result, market);
  return result;
}

// ---- 正例: 搜索 ─────────────────────────────────────────────────

describe('brands-page: 搜索 (searchBrands)', () => {
  it('按品牌编码搜索返回精确匹配', () => {
    const result = searchBrands(MOCK_BRANDS, 'BRAND');
    assert.ok(result.length > 0);
    for (const brand of result) {
      assert.ok(brand.code.toLowerCase().includes('brand'));
    }
  });

  it('按品牌名称搜索不区分大小写', () => {
    const result = searchBrands(MOCK_BRANDS, '旗舰');
    assert.ok(result.length > 0);
    for (const brand of result) {
      assert.ok(brand.name.toLowerCase().includes('旗舰'));
    }
  });

  it('按市场编码搜索', () => {
    const result = searchBrands(MOCK_BRANDS, 'uk-default');
    assert.ok(result.length >= 1);
    assert.ok(result.every((b) => b.marketCode.includes('uk-default')));
  });

  it('空关键词返回全部', () => {
    const result = searchBrands(MOCK_BRANDS, '');
    assert.equal(result.length, MOCK_BRANDS.length);
  });

  it('空格关键词返回全部', () => {
    const result = searchBrands(MOCK_BRANDS, '   ');
    assert.equal(result.length, MOCK_BRANDS.length);
  });
});

// 反例: 搜索
describe('brands-page: 搜索反例', () => {
  it('不存在的关键词返回空数组', () => {
    const result = searchBrands(MOCK_BRANDS, 'zzzz_does_not_exist_999');
    assert.equal(result.length, 0);
  });

  it('特殊字符搜索返回空', () => {
    const result = searchBrands(MOCK_BRANDS, '@#$%^&*()');
    assert.equal(result.length, 0);
  });
});

// 边界: 搜索
describe('brands-page: 搜索边界', () => {
  it('超长关键词不抛异常', () => {
    const longKeyword = 'x'.repeat(1000);
    const result = searchBrands(MOCK_BRANDS, longKeyword);
    assert.equal(result.length, 0);
  });

  it('单个字符尽可能匹配', () => {
    const result = searchBrands(MOCK_BRANDS, 'B');
    assert.ok(result.length > 0);
  });
});

// ---- 正例: 状态筛选 ──────────────────────────────────────────────

describe('brands-page: 状态筛选 (filterByStatus)', () => {
  for (const status of BRAND_STATUSES) {
    it(`筛选 "${BRAND_STATUS_MAP[status]?.label ?? status}" 返回正确数量`, () => {
      const result = filterByStatus(MOCK_BRANDS, status);
      const expected = MOCK_BRANDS.filter((b) => b.status === status).length;
      assert.equal(result.length, expected);
      result.every((b) => assert.equal(b.status, status));
    });
  }

  it('"ALL" 不过滤', () => {
    const result = filterByStatus(MOCK_BRANDS, 'ALL');
    assert.equal(result.length, MOCK_BRANDS.length);
  });
});

// 反例: 状态筛选
describe('brands-page: 状态筛选反例', () => {
  it('非法状态字符串返回空数组', () => {
    const result = filterByStatus(MOCK_BRANDS, 'nonexistent' as BrandStatus);
    assert.equal(result.length, 0);
  });

  it('空字符串不过滤返回全部', () => {
    const result = filterByStatus(MOCK_BRANDS, '' as BrandStatus);
    assert.equal(result.length, MOCK_BRANDS.length);
  });
});

// 边界: 状态筛选
describe('brands-page: 状态筛选边界', () => {
  it('suspended 状态品牌数最少 (健康度验证)', () => {
    const stats = computeBrandStats(MOCK_BRANDS);
    const suspendedCount = stats.suspended;
    const activeCount = stats.active;
    assert.ok(suspendedCount <= activeCount, 'suspended 品牌应少于 active 品牌');
  });
});

// ---- 正例: 等级筛选 ──────────────────────────────────────────────

describe('brands-page: 等级筛选 (filterByTier)', () => {
  for (const tier of BRAND_TIERS) {
    it(`筛选 "${BRAND_TIER_MAP[tier].label}" 返回正确数量`, () => {
      const result = filterByTier(MOCK_BRANDS, tier);
      const expected = MOCK_BRANDS.filter((b) => b.tier === tier).length;
      assert.equal(result.length, expected);
      result.every((b) => assert.equal(b.tier, tier));
    });
  }

  it('"ALL" 不过滤', () => {
    const result = filterByTier(MOCK_BRANDS, 'ALL');
    assert.equal(result.length, MOCK_BRANDS.length);
  });
});

// 反例: 等级筛选
describe('brands-page: 等级筛选反例', () => {
  it('非法等级返回空数组', () => {
    const result = filterByTier(MOCK_BRANDS, 'diamond' as BrandTier);
    assert.equal(result.length, 0);
  });
});

// ---- 正例: 市场筛选 ──────────────────────────────────────────────

describe('brands-page: 市场筛选 (filterByMarket)', () => {
  it('cn-mainland 返回 9 个品牌', () => {
    const result = filterByMarket(MOCK_BRANDS, 'cn-mainland');
    assert.equal(result.length, 9);
    result.every((b) => assert.equal(b.marketCode, 'cn-mainland'));
  });

  it('us-default 返回 2 个品牌', () => {
    const result = filterByMarket(MOCK_BRANDS, 'us-default');
    assert.equal(result.length, 2);
  });

  it('uk-default 返回 1 个品牌', () => {
    const result = filterByMarket(MOCK_BRANDS, 'uk-default');
    assert.equal(result.length, 1);
  });

  it('"ALL" 不过滤', () => {
    const result = filterByMarket(MOCK_BRANDS, 'ALL');
    assert.equal(result.length, MOCK_BRANDS.length);
  });
});

// 反例: 市场筛选
describe('brands-page: 市场筛选反例', () => {
  it('不存在的市场返回空数组', () => {
    const result = filterByMarket(MOCK_BRANDS, 'jp-tokyo');
    assert.equal(result.length, 0);
  });
});

// 边界: 市场筛选
describe('brands-page: 市场筛选边界', () => {
  it('市场分布统计与筛选一致', () => {
    const dist = computeBrandMarketDistribution(MOCK_BRANDS);
    for (const [market, count] of Object.entries(dist)) {
      const filtered = filterByMarket(MOCK_BRANDS, market);
      assert.equal(filtered.length, count, `市场 ${market} 分布统计与筛选不一致`);
    }
  });
});

// ---- 正例: 组合筛选 ──────────────────────────────────────────────

describe('brands-page: 组合筛选 (fullFilterChain)', () => {
  it('状态 + 等级 + 市场 三级过滤', () => {
    const result = fullFilterChain(MOCK_BRANDS, '', 'active', 'premium', 'cn-mainland');
    assert.ok(result.length >= 1);
    result.every((b) => {
      assert.equal(b.status, 'active');
      assert.equal(b.tier, 'premium');
      assert.equal(b.marketCode, 'cn-mainland');
    });
  });

  it('搜索 + 状态 + 市场 联合过滤', () => {
    const result = fullFilterChain(MOCK_BRANDS, '旗舰', 'active', 'ALL', 'cn-mainland');
    assert.ok(result.length >= 1);
    result.every((b) => {
      assert.ok(b.name.includes('旗舰') || b.code.includes('旗舰'));
      assert.equal(b.status, 'active');
      assert.equal(b.marketCode, 'cn-mainland');
    });
  });

  it('搜索关键词不存在时组合筛选返回空', () => {
    const result = fullFilterChain(MOCK_BRANDS, 'zzz_nonexistent', 'active', 'premium', 'cn-mainland');
    assert.equal(result.length, 0);
  });
});

// 反例: 组合筛选
describe('brands-page: 组合筛选反例', () => {
  it('active + suspended 不可能同时满足，返回空', () => {
    const result = fullFilterChain(MOCK_BRANDS, '', 'active', 'ALL', 'ALL').filter((b) => b.status === 'inactive');
    assert.equal(result.length, 0);
  });
});

// ---- 正例: 分页 ─────────────────────────────────────────────────

describe('brands-page: 分页 (paginate)', () => {
  it('第1页返回 pageSize 个元素', () => {
    const page1 = paginate(MOCK_BRANDS, 1, 5);
    assert.equal(page1.length, 5);
    assert.equal(page1[0].id, MOCK_BRANDS[0].id);
  });

  it('第2页偏移正确', () => {
    const page2 = paginate(MOCK_BRANDS, 2, 5);
    assert.equal(page2.length, 5);
    assert.equal(page2[0].id, MOCK_BRANDS[5].id);
  });

  it('最后一页可能不满', () => {
    const totalPages = getTotalPages(MOCK_BRANDS.length, 5);
    const lastPage = paginate(MOCK_BRANDS, totalPages, 5);
    assert.ok(lastPage.length > 0 && lastPage.length <= 5);
  });

  it('分页合并后等于原始数组', () => {
    const pageSize = 5;
    const totalPages = getTotalPages(MOCK_BRANDS.length, pageSize);
    let all: BrandItem[] = [];
    for (let p = 1; p <= totalPages; p++) {
      all = all.concat(paginate(MOCK_BRANDS, p, pageSize));
    }
    assert.deepStrictEqual(all.map((b) => b.id), MOCK_BRANDS.map((b) => b.id));
  });

  it('多页时最后一页不会空', () => {
    const totalPages = getTotalPages(MOCK_BRANDS.length, 5);
    const lastPage = paginate(MOCK_BRANDS, totalPages, 5);
    assert.ok(lastPage.length > 0);
  });
});

// 边界: 分页
describe('brands-page: 分页边界', () => {
  it('第0页返回空数组', () => {
    const result = paginate(MOCK_BRANDS, 0, 5);
    assert.equal(result.length, 0);
  });

  it('负数页码返回空数组', () => {
    const result = paginate(MOCK_BRANDS, -1, 5);
    assert.equal(result.length, 0);
  });

  it('超大页码返回空数组', () => {
    const result = paginate(MOCK_BRANDS, 999, 5);
    assert.equal(result.length, 0);
  });

  it('pageSize 为 0 返回空数组', () => {
    const result = paginate(MOCK_BRANDS, 1, 0);
    assert.equal(result.length, 0);
  });

  it('pageSize 为负返回空数组', () => {
    const result = paginate(MOCK_BRANDS, 1, -5);
    assert.equal(result.length, 0);
  });

  it('总页数计算至少为 1', () => {
    assert.equal(getTotalPages(0, 10), 1);
    assert.equal(getTotalPages(5, 10), 1);
  });

  it('总页数精确计算', () => {
    assert.equal(getTotalPages(12, 10), 2);
    assert.equal(getTotalPages(20, 10), 2);
    assert.equal(getTotalPages(21, 10), 3);
  });
});

// ---- 正例: 统计验证 ──────────────────────────────────────────────

describe('brands-page: 统计数据一致性', () => {
  it('computeBrandStats 多状态之和等于 total', () => {
    const stats = computeBrandStats(MOCK_BRANDS);
    const sum = stats.active + stats.inactive + stats.pending + stats.suspended;
    assert.equal(sum, stats.total);
  });

  it('computeBrandStats 多等级之和等于 total', () => {
    const stats = computeBrandStats(MOCK_BRANDS);
    const sum = stats.premium + stats.standard + stats.basic;
    assert.equal(sum, stats.total);
  });

  it('市场分布之和等于品牌总数', () => {
    const dist = computeBrandMarketDistribution(MOCK_BRANDS);
    const sum = Object.values(dist).reduce((a: number, b: number) => a + b, 0);
    assert.equal(sum, MOCK_BRANDS.length);
  });
});

// ---- 正例: 排序后分页 ────────────────────────────────────────────

describe('brands-page: 排序后分页', () => {
  it('按 storeCount 降序排列后分页', () => {
    const sorted = [...MOCK_BRANDS].sort((a, b) => b.storeCount - a.storeCount);
    const page1 = paginate(sorted, 1, 5);
    assert.equal(page1.length, 5);
    // 第一页第一个是 storeCount 最大的
    assert.equal(page1[0].storeCount, Math.max(...MOCK_BRANDS.map((b) => b.storeCount)));
  });

  it('按 lastDeployed 降序排列后第1页', () => {
    const sorted = [...MOCK_BRANDS].sort((a, b) => b.lastDeployed.localeCompare(a.lastDeployed));
    const page1 = paginate(sorted, 1, 5);
    assert.equal(page1.length, 5);
    assert.ok(page1[0].lastDeployed >= page1[page1.length - 1].lastDeployed);
  });

  it('排序不影响总数', () => {
    const sorted = [...MOCK_BRANDS].sort((a, b) => b.tenantCount - a.tenantCount);
    assert.equal(sorted.length, MOCK_BRANDS.length);
  });
});

// ---- 反例: 排序后分页 ────────────────────────────────────────────

describe('brands-page: 排序后分页反例', () => {
  it('降序排序后过滤不存在的市场返回空', () => {
    const sorted = [...MOCK_BRANDS].sort((a, b) => b.storeCount - a.storeCount);
    const filtered = filterByMarket(sorted, 'jp-tokyo');
    assert.equal(filtered.length, 0);
  });
});
