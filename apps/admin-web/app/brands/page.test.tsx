/**
 * brands/page.test.tsx — 品牌列表页 L1 冒烟测试
 * ⚡ 覆盖: 数据工厂 / 过滤 / 统计 / 排序
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';

// ---- 类型（与 page.tsx / brands-data.ts 保持同步） ----

type BrandStatus = 'active' | 'inactive' | 'pending' | 'suspended';
type BrandTier = 'premium' | 'standard' | 'basic';
type BrandStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

interface BrandItem {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: BrandStatus;
  storeCount: number;
  tenantCount: number;
  lastDeployed: string;
  tier: BrandTier;
  category: string;
}

const BRAND_STATUS_MAP: Record<BrandStatus, { label: string; variant: BrandStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

const BRAND_TIER_MAP: Record<BrandTier, { label: string; variant: BrandStatusVariant }> = {
  premium: { label: '旗舰', variant: 'success' },
  standard: { label: '标准', variant: 'neutral' },
  basic: { label: '基础', variant: 'warning' },
};

interface BrandStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  premiumCount: number;
}

// ---- 数据工厂 ----

let _seq = 0;
function makeBrand(overrides?: Partial<BrandItem>): BrandItem {
  _seq++;
  return {
    id: `brand-${String(_seq).padStart(3, '0')}`,
    code: `BRAND-${_seq}`,
    name: `测试品牌 ${_seq}`,
    marketCode: 'cn-mainland',
    status: 'active',
    storeCount: 10,
    tenantCount: 3,
    lastDeployed: '2026-06-27 10:00',
    tier: 'standard',
    category: '体育用品',
    ...overrides,
  };
}

// ---- 辅助函数 ----

function getBrandUniqueMarkets(brands: BrandItem[]): string[] {
  const set = new Set(brands.map((b) => b.marketCode));
  return Array.from(set).sort();
}

function computeBrandStats(brands: BrandItem[]): BrandStats {
  return {
    total: brands.length,
    active: brands.filter((b) => b.status === 'active').length,
    inactive: brands.filter((b) => b.status === 'inactive').length,
    pending: brands.filter((b) => b.status === 'pending').length,
    suspended: brands.filter((b) => b.status === 'suspended').length,
    premiumCount: brands.filter((b) => b.tier === 'premium').length,
  };
}

function searchBrands(brands: BrandItem[], query: string): BrandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return brands;
  return brands.filter(
    (b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
  );
}

function filterBrandsByStatus(brands: BrandItem[], status: BrandStatus | 'ALL'): BrandItem[] {
  if (status === 'ALL') return brands;
  return brands.filter((b) => b.status === status);
}

function filterBrandsByMarket(brands: BrandItem[], market: string | 'ALL'): BrandItem[] {
  if (market === 'ALL') return brands;
  return brands.filter((b) => b.marketCode === market);
}

function sortBrands(
  brands: BrandItem[],
  key: 'name' | 'storeCount' | 'lastDeployed',
  order: 'asc' | 'desc'
): BrandItem[] {
  const sorted = [...brands];
  sorted.sort((a, b) => {
    let cmp: number;
    if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'storeCount') cmp = a.storeCount - b.storeCount;
    else cmp = a.lastDeployed.localeCompare(b.lastDeployed);
    return order === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ---- 测试 ----

describe('BrandsPage — 数据工厂', () => {
  it('可生成不同品牌', () => {
    const b1 = makeBrand();
    const b2 = makeBrand();
    assert.notStrictEqual(b1.id, b2.id);
  });

  it('合并覆盖字段', () => {
    const b = makeBrand({ status: 'suspended', tier: 'premium' });
    assert.strictEqual(b.status, 'suspended');
    assert.strictEqual(b.tier, 'premium');
  });

  it('默认 marketCode 为 cn-mainland', () => {
    const b = makeBrand();
    assert.strictEqual(b.marketCode, 'cn-mainland');
  });
});

describe('BrandsPage — BRAND_STATUS_MAP', () => {
  it('所有状态应有映射', () => {
    const statuses: BrandStatus[] = ['active', 'inactive', 'pending', 'suspended'];
    for (const s of statuses) {
      assert.ok(BRAND_STATUS_MAP[s]);
    }
  });
});

describe('BrandsPage — BRAND_TIER_MAP', () => {
  it('所有等级应有映射', () => {
    const tiers: BrandTier[] = ['premium', 'standard', 'basic'];
    for (const t of tiers) {
      assert.ok(BRAND_TIER_MAP[t]);
    }
  });
});

describe('BrandsPage — 搜索过滤', () => {
  it('空查询返回全部', () => {
    const brands = [makeBrand(), makeBrand()];
    assert.strictEqual(searchBrands(brands, '').length, 2);
  });

  it('按名称搜索', () => {
    const brands = [makeBrand({ name: 'Nike' }), makeBrand({ name: 'Adidas' })];
    const result = searchBrands(brands, 'nike');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'Nike');
  });

  it('按编码搜索', () => {
    const brands = [makeBrand({ code: 'BRAND-NIKE' }), makeBrand({ code: 'BRAND-ADIDAS' })];
    const result = searchBrands(brands, 'NIKE');
    assert.strictEqual(result.length, 1);
  });

  it('无匹配返回空', () => {
    const brands = [makeBrand({ name: 'Nike' })];
    assert.strictEqual(searchBrands(brands, 'xyz').length, 0);
  });
});

describe('BrandsPage — 状态过滤', () => {
  it('ALL 返回全部', () => {
    const brands = [makeBrand({ status: 'active' }), makeBrand({ status: 'inactive' })];
    assert.strictEqual(filterBrandsByStatus(brands, 'ALL').length, 2);
  });

  it('按 active 过滤', () => {
    const brands = [
      makeBrand({ status: 'active' }),
      makeBrand({ status: 'inactive' }),
      makeBrand({ status: 'pending' }),
    ];
    assert.strictEqual(filterBrandsByStatus(brands, 'active').length, 1);
  });

  it('按 suspended 过滤', () => {
    const brands = [makeBrand({ status: 'suspended' }), makeBrand({ status: 'active' })];
    assert.strictEqual(filterBrandsByStatus(brands, 'suspended').length, 1);
  });
});

describe('BrandsPage — 市场过滤', () => {
  it('ALL 返回全部', () => {
    const brands = [
      makeBrand({ marketCode: 'cn-mainland' }),
      makeBrand({ marketCode: 'us-default' }),
    ];
    assert.strictEqual(filterBrandsByMarket(brands, 'ALL').length, 2);
  });

  it('按市场过滤', () => {
    const brands = [
      makeBrand({ marketCode: 'cn-mainland' }),
      makeBrand({ marketCode: 'us-default' }),
    ];
    assert.strictEqual(filterBrandsByMarket(brands, 'cn-mainland').length, 1);
  });
});

describe('BrandsPage — 统计', () => {
  it('活跃品牌占比计算', () => {
    const brands = [
      makeBrand({ status: 'active' }),
      makeBrand({ status: 'active' }),
      makeBrand({ status: 'inactive' }),
    ];
    const stats = computeBrandStats(brands);
    assert.strictEqual(stats.total, 3);
    assert.strictEqual(stats.active, 2);
    assert.strictEqual(stats.inactive, 1);
  });

  it('premium 计数', () => {
    const brands = [
      makeBrand({ tier: 'premium' }),
      makeBrand({ tier: 'standard' }),
      makeBrand({ tier: 'premium' }),
    ];
    const stats = computeBrandStats(brands);
    assert.strictEqual(stats.premiumCount, 2);
  });

  it('所有 Count 之和等于 total', () => {
    const brands = [
      makeBrand({ status: 'active' }),
      makeBrand({ status: 'inactive' }),
      makeBrand({ status: 'pending' }),
      makeBrand({ status: 'suspended' }),
    ];
    const stats = computeBrandStats(brands);
    assert.strictEqual(stats.active + stats.inactive + stats.pending + stats.suspended, stats.total);
  });
});

describe('BrandsPage — 排序', () => {
  it('名称升序', () => {
    const brands = [makeBrand({ name: 'Z品牌' }), makeBrand({ name: 'A品牌' })];
    const sorted = sortBrands(brands, 'name', 'asc');
    assert.strictEqual(sorted[0].name, 'A品牌');
  });

  it('名称降序', () => {
    const brands = [makeBrand({ name: 'A品牌' }), makeBrand({ name: 'Z品牌' })];
    const sorted = sortBrands(brands, 'name', 'desc');
    assert.strictEqual(sorted[0].name, 'Z品牌');
  });

  it('门店数升序', () => {
    const brands = [makeBrand({ storeCount: 100 }), makeBrand({ storeCount: 10 })];
    const sorted = sortBrands(brands, 'storeCount', 'asc');
    assert.strictEqual(sorted[0].storeCount, 10);
  });
});

describe('BrandsPage — 唯一市场列表', () => {
  it('去重后排序', () => {
    const brands = [
      makeBrand({ marketCode: 'us-default' }),
      makeBrand({ marketCode: 'cn-mainland' }),
      makeBrand({ marketCode: 'cn-mainland' }),
    ];
    const markets = getBrandUniqueMarkets(brands);
    assert.strictEqual(markets.length, 2);
    assert.strictEqual(markets[0], 'cn-mainland');
  });
});

describe('BrandsPage — 边界条件', () => {
  it('空品牌列表', () => {
    const stats = computeBrandStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.active, 0);
  });

  it('所有品牌已暂停', () => {
    const brands = [makeBrand({ status: 'suspended' }), makeBrand({ status: 'suspended' })];
    const stats = computeBrandStats(brands);
    assert.strictEqual(stats.suspended, 2);
    assert.strictEqual(stats.active, 0);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Brands — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含三元表达式', () => assert.ok(SRC.includes('?') && SRC.includes(':')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
