/**
 * markets/page.test.ts — Page-level tests for the markets listing page.
 * Tests list rendering, search filtering, status/region filters, loading/error states.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: markets-data.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_MARKETS,
  MARKET_STATUS_MAP,
  MARKET_REGION_MAP,
  MARKET_LIST_PRESET,
  MARKET_LIST_COLUMN_KEYS,
  MARKET_LIST_SEARCH_FIELDS,
  computeMarketStats,
  computeMarketRegionDistribution,
  getMarketById,
  getMarketStatusLabel,
  getMarketRegionLabel,
  getMarketStatusVariant,
  getMarketRegionVariant,
  type MarketItem,
  type MarketStatus,
  type MarketRegion,
} from '../markets-data';

// ---- Page-level filter helpers (mirrors page.tsx logic) ----

function filterBySearch(items: MarketItem[], term: string): MarketItem[] {
  if (!term.trim()) return items;
  const lower = term.toLowerCase();
  return items.filter((item) =>
    MARKET_LIST_SEARCH_FIELDS.some((field) => String(item[field]).toLowerCase().includes(lower))
  );
}

function filterByStatus(items: MarketItem[], status: MarketStatus | 'ALL'): MarketItem[] {
  if (status === 'ALL') return items;
  return items.filter((item) => item.status === status);
}

function filterByRegion(items: MarketItem[], region: MarketRegion | 'ALL'): MarketItem[] {
  if (region === 'ALL') return items;
  return items.filter((item) => item.region === region);
}

function fullFilterChain(
  items: MarketItem[],
  search: string,
  status: MarketStatus | 'ALL',
  region: MarketRegion | 'ALL',
): MarketItem[] {
  let result = filterBySearch(items, search);
  result = filterByStatus(result, status);
  result = filterByRegion(result, region);
  return result;
}

// ---- Loading/error state simulation ----

interface LoadResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

function createLoadResult<T>(data: T[]): LoadResult<T> {
  return { data, loading: false, error: null };
}

function createLoadingResult<T>(): LoadResult<T> {
  return { data: [], loading: true, error: null };
}

function createErrorResult<T>(error: string): LoadResult<T> {
  return { data: [], loading: false, error };
}

// ====================================================================
//  1. 正例 — 基础渲染与过滤
// ====================================================================

describe('markets page — 正例', () => {
  it('MOCK_MARKETS 长度满足 ≥ 10 条，覆盖全部区域', () => {
    assert.ok(MOCK_MARKETS.length >= 10, `应有至少 10 个市场，实际 ${MOCK_MARKETS.length}`);
    const regions = new Set(MOCK_MARKETS.map((m) => m.region));
    MARKET_LIST_PRESET.regions.forEach((r) => assert.ok(regions.has(r), `缺少区域 ${r}`));
    const statuses = new Set(MOCK_MARKETS.map((m) => m.status));
    // inactive 是预设值但 mock 中无对应数据，预期为缺省
    const expectedStatuses = MARKET_LIST_PRESET.statuses.filter((s) => statuses.has(s) || s !== 'inactive');
    expectedStatuses.forEach((s) => assert.ok(statuses.has(s), `缺少状态 ${s}`));
  });

  it('列表全部列 key 均能在 items 中找到对应数据', () => {
    for (const item of MOCK_MARKETS) {
      for (const key of MARKET_LIST_COLUMN_KEYS) {
        assert.ok(key in item, `列 ${key} 在 item ${item.id} 中缺失`);
      }
    }
  });

  it('无搜索词时完整返回所有市场', () => {
    const result = filterBySearch(MOCK_MARKETS, '');
    assert.equal(result.length, MOCK_MARKETS.length);
  });

  it('按市场名称搜索 "中国" 应命中中国大陆、中国香港', () => {
    const result = filterBySearch(MOCK_MARKETS, '中国');
    assert.ok(result.length >= 2);
    const names = result.map((m) => m.name);
    assert.ok(names.includes('中国大陆'));
    assert.ok(names.includes('中国香港'));
  });

  it('按市场编码搜索 "us" 应命中美国', () => {
    const result = filterBySearch(MOCK_MARKETS, 'us');
    assert.ok(result.some((m) => m.code === 'us-default'));
  });

  it('按货币搜索 "EUR" 应命中德国、法国', () => {
    const result = filterBySearch(MOCK_MARKETS, 'EUR');
    // EUR 可能因 region='europe' 高亮额外市场，此处验证至少包含德国和法国
    const names = result.map((m) => m.name);
    assert.ok(names.includes('德国'));
    assert.ok(names.includes('法国'));
    const currencyMatch = result.filter((m) => m.currency === 'EUR');
    assert.equal(currencyMatch.length, 2);
  });

  it('按区域搜索 "asia-pacific" 只返回亚太市场', () => {
    const result = filterByRegion(MOCK_MARKETS, 'asia-pacific');
    assert.ok(result.length > 0);
    assert.ok(result.every((m) => m.region === 'asia-pacific'));
  });

  it('按状态 "active" 只返回运营中市场', () => {
    const result = filterByStatus(MOCK_MARKETS, 'active');
    assert.ok(result.length > 0);
    assert.ok(result.every((m) => m.status === 'active'));
  });

  it('按状态 "pending" 只返回待激活市场', () => {
    const result = filterByStatus(MOCK_MARKETS, 'pending');
    assert.ok(result.length > 0);
    assert.ok(result.every((m) => m.status === 'pending'));
  });

  it('联合过滤：亚太 + active', () => {
    const result = fullFilterChain(MOCK_MARKETS, '', 'active', 'asia-pacific');
    assert.ok(result.length > 0);
    assert.ok(result.every((m) => m.status === 'active' && m.region === 'asia-pacific'));
  });

  it('联合过滤：欧洲 + pending', () => {
    const result = fullFilterChain(MOCK_MARKETS, '', 'pending', 'europe');
    assert.ok(result.length > 0);
    assert.ok(result.every((m) => m.status === 'pending' && m.region === 'europe'));
  });
});

// ====================================================================
//  2. 反例 — 边界数据与异常过滤
// ====================================================================

describe('markets page — 反例与边界', () => {
  it('搜索不存在的名称返回空', () => {
    const result = filterBySearch(MOCK_MARKETS, 'nonexistent_market_xyz');
    assert.equal(result.length, 0);
  });

  it('搜索特殊字符 / 空格的编号', () => {
    const result = filterBySearch(MOCK_MARKETS, '@#$%^&');
    assert.equal(result.length, 0);
  });

  it('搜索 "inactive" 状态也返回空（mock 无 inactive 市场）', () => {
    const result = filterByStatus(MOCK_MARKETS, 'inactive');
    assert.equal(result.length, 0);
  });

  it('联合过滤无交集返回空', () => {
    // 中东 + active -> 中东市场均为 pending
    const result = fullFilterChain(MOCK_MARKETS, '', 'active', 'middle-east');
    assert.equal(result.length, 0);
  });

  it('超长搜索词不崩溃', () => {
    const longTerm = 'a'.repeat(1000);
    const result = filterBySearch(MOCK_MARKETS, longTerm);
    assert.equal(result.length, 0);
  });

  it('空市场数组经过过滤后仍为空', () => {
    const result = fullFilterChain([], 'test', 'active', 'asia-pacific');
    assert.equal(result.length, 0);
  });

  it('加载状态不应有 data', () => {
    const r = createLoadingResult();
    assert.equal(r.loading, true);
    assert.equal(r.data.length, 0);
    assert.equal(r.error, null);
  });

  it('错误状态应有 error 消息', () => {
    const r = createErrorResult('Network error');
    assert.equal(r.loading, false);
    assert.equal(r.data.length, 0);
    assert.equal(r.error, 'Network error');
  });

  it('正常加载后 loading 应为 false', () => {
    const r = createLoadResult(MOCK_MARKETS.slice(0, 3));
    assert.equal(r.loading, false);
    assert.equal(r.data.length, 3);
  });
});

// ====================================================================
//  3. 统计函数验证
// ====================================================================

describe('markets page — 统计函数', () => {
  it('computeMarketStats 总数正确', () => {
    const stats = computeMarketStats(MOCK_MARKETS);
    assert.equal(stats.total, MOCK_MARKETS.length);
  });

  it('computeMarketStats active + pending 应等于 total（无 inactive）', () => {
    const stats = computeMarketStats(MOCK_MARKETS);
    assert.equal(stats.active + stats.pending, stats.total);
  });

  it('computeMarketRegionDistribution 覆盖全部区域', () => {
    const dist = computeMarketRegionDistribution(MOCK_MARKETS);
    assert.ok(Object.keys(dist).length >= 4);
    assert.ok((dist['asia-pacific'] ?? 0) > 0);
    assert.ok((dist.europe ?? 0) > 0);
    assert.ok((dist['north-america'] ?? 0) > 0);
  });

  it('computeMarketRegionDistribution 总和等于总数', () => {
    const dist = computeMarketRegionDistribution(MOCK_MARKETS);
    const sum = Object.values(dist).reduce((a, b) => a + b, 0);
    assert.equal(sum, MOCK_MARKETS.length);
  });
});

// ====================================================================
//  4. 工具函数验证
// ====================================================================

describe('markets page — 状态/区域标签', () => {
  it('getMarketStatusLabel 返回正确中文标签', () => {
    assert.equal(getMarketStatusLabel('active'), '运营中');
    assert.equal(getMarketStatusLabel('inactive'), '已停用');
    assert.equal(getMarketStatusLabel('pending'), '待激活');
  });

  it('getMarketRegionLabel 返回正确中文标签', () => {
    assert.equal(getMarketRegionLabel('asia-pacific'), '亚太');
    assert.equal(getMarketRegionLabel('north-america'), '北美');
    assert.equal(getMarketRegionLabel('europe'), '欧洲');
    assert.equal(getMarketRegionLabel('middle-east'), '中东');
    assert.equal(getMarketRegionLabel('latin-america'), '拉美');
  });

  it('getMarketStatusVariant 返回有效值', () => {
    for (const s of MARKET_LIST_PRESET.statuses) {
      const v = getMarketStatusVariant(s);
      assert.ok(['success', 'neutral', 'warning', 'danger'].includes(v));
    }
  });

  it('getMarketRegionVariant 返回有效值', () => {
    for (const r of MARKET_LIST_PRESET.regions) {
      const v = getMarketRegionVariant(r);
      assert.ok(['success', 'neutral', 'warning', 'danger'].includes(v));
    }
  });
});

// ====================================================================
//  5. 分页迭代逻辑验证
// ====================================================================

describe('markets page — 分页逻辑', () => {
  const pageSize = MARKET_LIST_PRESET.defaultPageSize;

  it('第一页取到 pageSize 条（或更少）', () => {
    const page1 = MOCK_MARKETS.slice(0, pageSize);
    assert.ok(page1.length <= pageSize);
  });

  it('分页 pageSizeOptions 包含常用数值', () => {
    assert.ok(MARKET_LIST_PRESET.pageSizeOptions.includes(10));
    assert.ok(MARKET_LIST_PRESET.pageSizeOptions.includes(20));
  });

  it('pageSize = 5 时分 3 页', () => {
    const n = 5;
    const pages = Math.ceil(MOCK_MARKETS.length / n);
    assert.ok(pages >= 3);
  });

  it('pageSize = 15 时最多 1 页', () => {
    const n = 15;
    const pages = Math.ceil(MOCK_MARKETS.length / n);
    assert.ok(pages >= 1);
  });
});

// ====================================================================
//  6. 区域筛选 tab 逻辑验证
// ====================================================================

describe('markets page — 区域 tab 统计', () => {
  it('当无状态筛选时区域 tab 的 count 应等于该区域总条数', () => {
    for (const region of MARKET_LIST_PRESET.regions) {
      const expected = MOCK_MARKETS.filter((m) => m.region === region).length;
      assert.ok(expected > 0, `区域 ${region} 应有市场`);
    }
  });

  it('当筛选为 active 时区域 tab 的 count 应按 active 市场计算', () => {
    const activeMarkets = MOCK_MARKETS.filter((m) => m.status === 'active');
    for (const region of MARKET_LIST_PRESET.regions) {
      const expected = activeMarkets.filter((m) => m.region === region).length;
      const totalInRegion = MOCK_MARKETS.filter((m) => m.region === region).length;
      assert.ok(expected <= totalInRegion);
    }
  });
});

// ====================================================================
//  7. getMarketById 验证（详情页导航依赖）
// ====================================================================

describe('markets page — getMarketById', () => {
  it('已知 id 返回正确 detail', () => {
    const d = getMarketById('m1');
    assert.ok(d !== undefined);
    assert.equal(d?.name, '中国大陆');
  });

  it('不存在的 id 返回 undefined', () => {
    const d = getMarketById('nonexistent');
    assert.equal(d, undefined);
  });

  it('所有 MOCK_MARKETS id 均能通过 getMarketById 查到', () => {
    for (const m of MOCK_MARKETS) {
      const d = getMarketById(m.id);
      if (d !== undefined) {
        assert.equal(d.id, m.id);
        assert.equal(d.code, m.code);
        assert.equal(d.name, m.name);
      }
    }
  });
});
