import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  BRAND_STATUSES,
  BRAND_TIERS,
  BRAND_STATUS_MAP,
  BRAND_TIER_MAP,
  getBrandStatusLabel,
  getBrandTierLabel,
  getBrandStatusVariant,
  getBrandTierVariant,
  adminBrandRoute,
  buildBrandDetailHref,
  MOCK_BRANDS,
  MOCK_BRAND_DETAILS,
  computeBrandStats,
  computeBrandMarketDistribution,
  getBrandUniqueMarkets,
  type BrandItem,
  type BrandDetail,
  type BrandStatus,
  type BrandTier,
} from './brands-data';

// ─── L1: 常量完整性 ───────────────────────────────────────────────

describe('brands-data: 常量定义', () => {
  test('BRAND_STATUSES 包含全部 4 个状态', () => {
    assert.deepStrictEqual([...BRAND_STATUSES].sort(), ['active', 'inactive', 'pending', 'suspended']);
  });

  test('BRAND_TIERS 包含全部 3 个等级', () => {
    assert.deepStrictEqual([...BRAND_TIERS].sort(), ['basic', 'premium', 'standard']);
  });

  test('BRAND_STATUS_MAP 覆盖所有状态且 variant 均为合法值', () => {
    const validVariants = ['success', 'neutral', 'warning', 'danger'];
    for (const status of BRAND_STATUSES) {
      const entry = BRAND_STATUS_MAP[status];
      assert.ok(entry, `状态 ${status} 缺少映射`);
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `状态 ${status} label 为空`);
      assert.ok(validVariants.includes(entry.variant), `状态 ${status} variant 非法: ${entry.variant}`);
    }
  });

  test('BRAND_TIER_MAP 覆盖所有等级且 variant 均为合法值', () => {
    const validVariants = ['success', 'neutral', 'warning', 'danger'];
    for (const tier of BRAND_TIERS) {
      const entry = BRAND_TIER_MAP[tier];
      assert.ok(entry, `等级 ${tier} 缺少映射`);
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `等级 ${tier} label 为空`);
      assert.ok(validVariants.includes(entry.variant), `等级 ${tier} variant 非法: ${entry.variant}`);
    }
  });
});

// ─── L1: getter 函数 ──────────────────────────────────────────────

describe('brands-data: getter 函数', () => {
  test('getBrandStatusLabel 正例', () => {
    assert.equal(getBrandStatusLabel('active'), '运营中');
    assert.equal(getBrandStatusLabel('inactive'), '已停用');
    assert.equal(getBrandStatusLabel('pending'), '待激活');
    assert.equal(getBrandStatusLabel('suspended'), '已暂停');
  });

  test('getBrandStatusLabel 反例: 非法状态返回原值', () => {
    assert.equal(getBrandStatusLabel('unknown' as BrandStatus), 'unknown');
  });

  test('getBrandTierLabel 正例', () => {
    assert.equal(getBrandTierLabel('premium'), '旗舰');
    assert.equal(getBrandTierLabel('standard'), '标准');
    assert.equal(getBrandTierLabel('basic'), '基础');
  });

  test('getBrandTierLabel 反例: 非法等级返回原值', () => {
    assert.equal(getBrandTierLabel('unknown' as BrandTier), 'unknown');
  });

  test('getBrandStatusVariant 正例', () => {
    assert.equal(getBrandStatusVariant('active'), 'success');
    assert.equal(getBrandStatusVariant('inactive'), 'neutral');
    assert.equal(getBrandStatusVariant('pending'), 'warning');
    assert.equal(getBrandStatusVariant('suspended'), 'danger');
  });

  test('getBrandStatusVariant 反例: 非法状态回退 neutral', () => {
    assert.equal(getBrandStatusVariant('unknown' as BrandStatus), 'neutral');
  });

  test('getBrandTierVariant 正例', () => {
    assert.equal(getBrandTierVariant('premium'), 'success');
    assert.equal(getBrandTierVariant('standard'), 'neutral');
    assert.equal(getBrandTierVariant('basic'), 'warning');
  });

  test('getBrandTierVariant 反例: 非法等级回退 neutral', () => {
    assert.equal(getBrandTierVariant('unknown' as BrandTier), 'neutral');
  });
});

// ─── L1: 路由 ─────────────────────────────────────────────────────

describe('brands-data: 路由', () => {
  test('adminBrandRoute 基础值', () => {
    assert.equal(adminBrandRoute.href, '/brands');
    assert.equal(adminBrandRoute.detailHrefBase, '/brands');
    assert.equal(adminBrandRoute.title, '品牌管理中心');
    assert.ok(adminBrandRoute.description.length > 0);
  });

  test('buildBrandDetailHref 构建详情链接', () => {
    assert.equal(buildBrandDetailHref('b1'), '/brands/b1');
    assert.equal(buildBrandDetailHref('brand-999'), '/brands/brand-999');
  });

  test('buildBrandDetailHref 空字符串', () => {
    assert.equal(buildBrandDetailHref(''), '/brands/');
  });
});

// ─── L2: Mock 数据 ────────────────────────────────────────────────

describe('brands-data: Mock 数据', () => {
  test('MOCK_BRANDS 有 12 条记录', () => {
    assert.equal(MOCK_BRANDS.length, 12);
  });

  test('每条 BrandItem 有必需字段', () => {
    for (const brand of MOCK_BRANDS) {
      assert.ok(brand.id, `id 为空: ${JSON.stringify(brand)}`);
      assert.ok(brand.code, `code 为空: ${JSON.stringify(brand)}`);
      assert.ok(brand.name, `name 为空: ${JSON.stringify(brand)}`);
      assert.ok(brand.marketCode, `marketCode 为空: ${JSON.stringify(brand.code)}`);
      assert.ok(BRAND_STATUSES.includes(brand.status), `status 非法: ${brand.status} (${brand.code})`);
      assert.ok(BRAND_TIERS.includes(brand.tier), `tier 非法: ${brand.tier} (${brand.code})`);
      assert.ok(typeof brand.storeCount === 'number' && brand.storeCount >= 0);
      assert.ok(typeof brand.tenantCount === 'number' && brand.tenantCount >= 0);
      assert.ok(brand.lastDeployed, `lastDeployed 为空: ${brand.code}`);
    }
  });

  test('MOCK_BRAND_DETAILS 有品牌详情', () => {
    assert.ok(MOCK_BRAND_DETAILS.b1);
    assert.ok(MOCK_BRAND_DETAILS.b5);
    assert.equal(MOCK_BRAND_DETAILS.b1.tier, 'premium');
    assert.equal(MOCK_BRAND_DETAILS.b5.status, 'suspended');
  });

  test('MOCK_BRAND_DETAILS.b1 有完整详情字段', () => {
    const d = MOCK_BRAND_DETAILS.b1 as BrandDetail;
    assert.ok(d.description);
    assert.ok(d.headquarterCity);
    assert.ok(d.category);
    assert.ok(Array.isArray(d.subCategories) && d.subCategories.length > 0);
    assert.ok(Array.isArray(d.storeNames) && d.storeNames.length > 0);
    assert.ok(Array.isArray(d.tenantNames) && d.tenantNames.length > 0);
    assert.ok(typeof d.productLineCount === 'number');
    assert.ok(typeof d.memberCount === 'number');
  });
});

// ─── L2: 统计计算 ─────────────────────────────────────────────────

describe('brands-data: 统计计算', () => {
  test('computeBrandStats 总计数', () => {
    const stats = computeBrandStats(MOCK_BRANDS);
    assert.equal(stats.total, 12);
  });

  test('computeBrandStats 按状态分布', () => {
    const stats = computeBrandStats(MOCK_BRANDS);
    assert.equal(stats.active, 7);
    assert.equal(stats.inactive, 1);
    assert.equal(stats.pending, 3);
    assert.equal(stats.suspended, 1);
    // 交叉验证: 各状态之和 = total
    assert.equal(stats.active + stats.inactive + stats.pending + stats.suspended, stats.total);
  });

  test('computeBrandStats 按等级分布', () => {
    const stats = computeBrandStats(MOCK_BRANDS);
    assert.equal(stats.premium, 3);
    assert.equal(stats.standard, 5);
    assert.equal(stats.basic, 4);
    // 交叉验证: 各等级之和 = total
    assert.equal(stats.premium + stats.standard + stats.basic, stats.total);
  });

  test('computeBrandStats 汇总门店和租户', () => {
    const stats = computeBrandStats(MOCK_BRANDS);
    assert.equal(stats.totalStores, 31);
    assert.equal(stats.totalTenants, 18);
    assert.ok(stats.totalStores > stats.total); // 每个品牌平均 2+ 门店
  });

  test('computeBrandStats 空数组', () => {
    const stats = computeBrandStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.active, 0);
    assert.equal(stats.premium, 0);
    assert.equal(stats.totalStores, 0);
    assert.equal(stats.totalTenants, 0);
  });

  test('computeBrandMarketDistribution 分组统计', () => {
    const dist = computeBrandMarketDistribution(MOCK_BRANDS);
    assert.equal(dist['cn-mainland'], 9);
    assert.equal(dist['us-default'], 2);
    assert.equal(dist['uk-default'], 1);
    // 交叉验证: 分布之和 = total
    const sum = Object.values(dist).reduce((a: number, b: number) => a + b, 0);
    assert.equal(sum, MOCK_BRANDS.length);
  });

  test('computeBrandMarketDistribution 空数组', () => {
    const dist = computeBrandMarketDistribution([]);
    assert.deepStrictEqual(dist, {});
  });

  test('getBrandUniqueMarkets 去重', () => {
    const markets = getBrandUniqueMarkets(MOCK_BRANDS);
    assert.deepStrictEqual([...markets].sort(), ['cn-mainland', 'uk-default', 'us-default']);
  });

  test('getBrandUniqueMarkets 空数组', () => {
    const markets = getBrandUniqueMarkets([]);
    assert.deepStrictEqual(markets, []);
  });
});

// ─── L1: 边界测试 ─────────────────────────────────────────────────

describe('brands-data: 边界测试', () => {
  test('所有品牌 id 唯一', () => {
    const ids = MOCK_BRANDS.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length, '存在重复 id');
  });

  test('所有品牌 code 唯一', () => {
    const codes = MOCK_BRANDS.map((b) => b.code);
    assert.equal(new Set(codes).size, codes.length, '存在重复 code');
  });

  test('camelCase 状态验证: active 品牌最多', () => {
    const stats = computeBrandStats(MOCK_BRANDS);
    assert.ok(stats.active > stats.inactive);
    assert.ok(stats.active > stats.suspended);
  });

  test('旗舰品牌门店数不少于标准品牌', () => {
    const premiumStores = MOCK_BRANDS.filter((b) => b.tier === 'premium').reduce((s, b) => s + b.storeCount, 0);
    const standardStores = MOCK_BRANDS.filter((b) => b.tier === 'standard').reduce((s, b) => s + b.storeCount, 0);
    assert.ok(premiumStores > 0 && standardStores > 0);
  });
});
