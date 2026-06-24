/**
 * markets-data.test.ts — 市场管理数据类型测试
 *
 * 测试: markets-data 模型、映射关系、mock 数据完整性、统计计算
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  MARKET_STATUS_MAP,
  MARKET_REGION_MAP,
  MARKET_STATUSES,
  MARKET_REGIONS,
  getMarketStatusLabel,
  getMarketRegionLabel,
  getMarketStatusVariant,
  getMarketRegionVariant,
  computeMarketStats,
  computeMarketRegionDistribution,
  getMarketById,
  MOCK_MARKETS,
  MOCK_MARKET_DETAILS,
  MARKET_LIST_SEARCH_FIELDS,
  MARKET_LIST_COLUMN_KEYS,
  MARKET_LIST_PRESET,
  MARKET_DETAIL_LABELS,
  adminMarketRoute,
  type MarketDetail,
  type MarketStatus,
  type MarketRegion,
} from './markets-data';

describe('markets-data', () => {
  // ─── 常量映射 ───

  describe('MARKET_STATUS_MAP', () => {
    test('每个状态都有 label 和 variant', () => {
      for (const status of MARKET_STATUSES) {
        const entry = MARKET_STATUS_MAP[status];
        assert.ok(entry !== undefined, `${status} should be defined`);
        assert.ok(typeof entry.label === 'string', `${status} label should be string`);
        assert.ok(entry.label.length > 0, `${status} label should not be empty`);
        assert.ok(/^(success|neutral|warning|danger)$/.test(entry.variant), `${status} variant should be valid`);
      }
    });

    test('active → 运营中 (success)', () => {
      assert.equal(MARKET_STATUS_MAP.active.label, '运营中');
      assert.equal(MARKET_STATUS_MAP.active.variant, 'success');
    });

    test('pending → 待激活 (warning)', () => {
      assert.equal(MARKET_STATUS_MAP.pending.label, '待激活');
      assert.equal(MARKET_STATUS_MAP.pending.variant, 'warning');
    });

    test('inactive → 已停用 (neutral)', () => {
      assert.equal(MARKET_STATUS_MAP.inactive.label, '已停用');
      assert.equal(MARKET_STATUS_MAP.inactive.variant, 'neutral');
    });
  });

  describe('MARKET_REGION_MAP', () => {
    test('每个区域都有 label 和 variant', () => {
      for (const region of MARKET_REGIONS) {
        const entry = MARKET_REGION_MAP[region];
        assert.ok(entry !== undefined, `${region} should be defined`);
        assert.ok(typeof entry.label === 'string');
        assert.ok(/^(success|neutral|warning|danger)$/.test(entry.variant));
      }
    });

    test('asia-pacific → 亚太 (success)', () => {
      assert.equal(MARKET_REGION_MAP['asia-pacific'].label, '亚太');
      assert.equal(MARKET_REGION_MAP['asia-pacific'].variant, 'success');
    });

    test('europe → 欧洲 (warning)', () => {
      assert.equal(MARKET_REGION_MAP['europe'].label, '欧洲');
      assert.equal(MARKET_REGION_MAP['europe'].variant, 'warning');
    });

    test('middle-east → 中东 (danger)', () => {
      assert.equal(MARKET_REGION_MAP['middle-east'].label, '中东');
      assert.equal(MARKET_REGION_MAP['middle-east'].variant, 'danger');
    });

    test('north-america → 北美 (neutral)', () => {
      assert.equal(MARKET_REGION_MAP['north-america'].label, '北美');
      assert.equal(MARKET_REGION_MAP['north-america'].variant, 'neutral');
    });
  });

  // ─── 工具函数 ───

  describe('getMarketStatusLabel', () => {
    test('返回已知状态的 label', () => {
      assert.equal(getMarketStatusLabel('active'), '运营中');
      assert.equal(getMarketStatusLabel('pending'), '待激活');
      assert.equal(getMarketStatusLabel('inactive'), '已停用');
    });

    test('未知状态返回原始值 (fallback)', () => {
      assert.equal(getMarketStatusLabel('unknown' as MarketStatus), 'unknown');
    });

    test('空字符串 fallback', () => {
      assert.equal(getMarketStatusLabel('' as MarketStatus), '');
    });
  });

  describe('getMarketRegionLabel', () => {
    test('返回已知区域的 label', () => {
      assert.equal(getMarketRegionLabel('asia-pacific'), '亚太');
      assert.equal(getMarketRegionLabel('north-america'), '北美');
      assert.equal(getMarketRegionLabel('europe'), '欧洲');
      assert.equal(getMarketRegionLabel('middle-east'), '中东');
      assert.equal(getMarketRegionLabel('latin-america'), '拉美');
    });

    test('未知区域返回原始值 (fallback)', () => {
      assert.equal(getMarketRegionLabel('unknown' as MarketRegion), 'unknown');
    });
  });

  describe('getMarketStatusVariant', () => {
    test('返回状态对应的 variant', () => {
      assert.equal(getMarketStatusVariant('active'), 'success');
      assert.equal(getMarketStatusVariant('pending'), 'warning');
      assert.equal(getMarketStatusVariant('inactive'), 'neutral');
    });
  });

  describe('getMarketRegionVariant', () => {
    test('返回区域对应的 variant', () => {
      assert.equal(getMarketRegionVariant('asia-pacific'), 'success');
      assert.equal(getMarketRegionVariant('europe'), 'warning');
      assert.equal(getMarketRegionVariant('middle-east'), 'danger');
      assert.equal(getMarketRegionVariant('north-america'), 'neutral');
    });
  });

  // ─── Mock 数据完整性 ───

  describe('MOCK_MARKETS', () => {
    test('包含足够的数据量用于列表页', () => {
      assert.ok(MOCK_MARKETS.length >= 10, `expected >= 10, got ${MOCK_MARKETS.length}`);
    });

    test('每个 item 都有必需的字段', () => {
      for (const item of MOCK_MARKETS) {
        assert.ok(typeof item.id === 'string' && item.id.length > 0, `id missing for ${item.code}`);
        assert.ok(typeof item.code === 'string' && item.code.length > 0, `code missing`);
        assert.ok(typeof item.name === 'string' && item.name.length > 0, `name missing`);
        assert.ok(MARKET_STATUSES.includes(item.status), `invalid status ${item.status}`);
        assert.ok(MARKET_REGIONS.includes(item.region), `invalid region ${item.region}`);
        assert.ok(typeof item.locale === 'string' && item.locale.length > 0, `locale missing`);
        assert.ok(typeof item.currency === 'string' && item.currency.length > 0, `currency missing`);
        assert.ok(typeof item.timezone === 'string' && item.timezone.length > 0, `timezone missing`);
        assert.ok(typeof item.tenantCount === 'number', `tenantCount not number`);
        assert.ok(typeof item.brandCount === 'number', `brandCount not number`);
        assert.ok(typeof item.storeCount === 'number', `storeCount not number`);
        assert.ok(typeof item.lastDeployed === 'string', `lastDeployed not string`);
      }
    });

    test('所有 id 唯一', () => {
      const ids = MOCK_MARKETS.map((m) => m.id);
      assert.equal(new Set(ids).size, ids.length);
    });

    test('所有 code 唯一', () => {
      const codes = MOCK_MARKETS.map((m) => m.code);
      assert.equal(new Set(codes).size, codes.length);
    });

    test('状态分布合理 — 至少有一个 active', () => {
      const stats = computeMarketStats(MOCK_MARKETS);
      assert.ok(stats.active > 0, 'should have at least one active market');
    });

    test('至少覆盖 3 个区域', () => {
      const regions = new Set(MOCK_MARKETS.map((m) => m.region));
      assert.ok(regions.size >= 3, `expected >= 3 regions, got ${regions.size}`);
    });

    test('每个市场都有语言和时区', () => {
      for (const item of MOCK_MARKETS) {
        assert.ok(item.locale !== '', `locale empty for ${item.code}`);
        assert.ok(item.timezone !== '', `timezone empty for ${item.code}`);
      }
    });
  });

  describe('MOCK_MARKET_DETAILS', () => {
    test('每个详情记录都对应列表中的市场', () => {
      const marketIds = new Set(MOCK_MARKETS.map((m) => m.id));
      for (const detail of Object.values(MOCK_MARKET_DETAILS)) {
        assert.ok(marketIds.has(detail.id), `detail id ${detail.id} not found in MOCK_MARKETS`);
      }
    });

    test('详情包含比列表更多的字段', () => {
      const m1 = MOCK_MARKET_DETAILS.m1;
      assert.ok(m1 !== undefined);
      assert.ok(m1.description.length > 0);
      assert.ok(m1.defaultLanguage.length > 0);
      assert.ok(m1.dateFormat.length > 0);
      assert.ok(m1.paymentMethods.length > 0);
      assert.ok(m1.regulatoryBodies.length > 0);
      assert.ok(m1.contactName.length > 0);
      assert.ok(m1.contactEmail.length > 0);
      assert.ok(m1.activatedAt.length > 0);
    });

    test('活跃市场比待激活市场有更多门店数', () => {
      for (const detail of Object.values(MOCK_MARKET_DETAILS)) {
        if (detail.status === 'active') {
          assert.ok(detail.storeCount >= 2, `active market ${detail.id} should have >= 2 stores`);
        }
      }
    });

    test('getMarketById 返回正确的市场', () => {
      assert.equal(getMarketById('m1'), MOCK_MARKET_DETAILS.m1);
      assert.equal(getMarketById('m3'), MOCK_MARKET_DETAILS.m3);
    });

    test('getMarketById 不存在的 id 返回 undefined', () => {
      assert.equal(getMarketById('nonexistent'), undefined);
    });
  });

  // ─── 统计计算 ───

  describe('computeMarketStats', () => {
    test('返回所有字段', () => {
      const stats = computeMarketStats(MOCK_MARKETS);
      assert.equal(stats.total, MOCK_MARKETS.length);
      assert.ok(typeof stats.active === 'number');
      assert.ok(typeof stats.pending === 'number');
      assert.ok(typeof stats.regionCount === 'number');
      assert.ok(typeof stats.totalResources === 'number');
    });

    test('状态计数总和等于 total', () => {
      const stats = computeMarketStats(MOCK_MARKETS);
      const active = stats.active;
      const pending = stats.pending;
      const inactive = MOCK_MARKETS.filter((m) => m.status === 'inactive').length;
      assert.equal(active + pending + inactive, MOCK_MARKETS.length, 'status counts should sum to total');
    });

    test('空数组 → 全 0', () => {
      const stats = computeMarketStats([]);
      assert.equal(stats.total, 0);
      assert.equal(stats.active, 0);
      assert.equal(stats.pending, 0);
      assert.equal(stats.regionCount, 0);
      assert.equal(stats.totalResources, 0);
    });

    test('totalResources 累加正确', () => {
      const stats = computeMarketStats(MOCK_MARKETS);
      const manual = MOCK_MARKETS.reduce((sum, m) => sum + m.tenantCount + m.brandCount + m.storeCount, 0);
      assert.equal(stats.totalResources, manual);
    });

    test('单个市场时的统计正确', () => {
      const single = [MOCK_MARKETS[0]!];
      const stats = computeMarketStats(single);
      assert.equal(stats.total, 1);
      assert.equal(stats.totalResources, single[0]!.tenantCount + single[0]!.brandCount + single[0]!.storeCount);
      assert.equal(stats.regionCount, 1);
    });

    test('regionCount 等于不重复区域数', () => {
      const stats = computeMarketStats(MOCK_MARKETS);
      const unique = new Set(MOCK_MARKETS.map((m) => m.region)).size;
      assert.equal(stats.regionCount, unique);
    });
  });

  describe('computeMarketRegionDistribution', () => {
    test('返回每个区域的市场分布，总和等于 total', () => {
      const distribution = computeMarketRegionDistribution(MOCK_MARKETS);
      assert.ok(Object.keys(distribution).length >= 1);
      const totalFromDistribution = Object.values(distribution).reduce((sum, v) => sum + v, 0);
      assert.equal(totalFromDistribution, MOCK_MARKETS.length);
    });

    test('所有分布值都是正整数', () => {
      const distribution = computeMarketRegionDistribution(MOCK_MARKETS);
      for (const count of Object.values(distribution)) {
        assert.ok(count > 0, `region count should be > 0`);
        assert.ok(Number.isInteger(count));
      }
    });

    test('空数组返回空对象', () => {
      const distribution = computeMarketRegionDistribution([]);
      assert.equal(Object.keys(distribution).length, 0);
    });

    test('asia-pacific 区域数量正确', () => {
      const apacMarkets = MOCK_MARKETS.filter((m) => m.region === 'asia-pacific');
      const distribution = computeMarketRegionDistribution(MOCK_MARKETS);
      assert.equal(distribution['asia-pacific'], apacMarkets.length);
    });

    test('每个区域在数据中至少出现一次', () => {
      const distribution = computeMarketRegionDistribution(MOCK_MARKETS);
      for (const region of MARKET_REGIONS) {
        const hasRegion = MOCK_MARKETS.some((m) => m.region === region);
        if (hasRegion) {
          assert.ok(distribution[region]! > 0, `distribution should include ${region}`);
        }
      }
    });
  });

  // ─── 常量配置 ───

  describe('MARKET_LIST_SEARCH_FIELDS', () => {
    test('包含合理的搜索字段', () => {
      assert.ok(MARKET_LIST_SEARCH_FIELDS.includes('code'));
      assert.ok(MARKET_LIST_SEARCH_FIELDS.includes('name'));
      assert.ok(MARKET_LIST_SEARCH_FIELDS.includes('region'));
      assert.ok(MARKET_LIST_SEARCH_FIELDS.includes('currency'));
    });

    test('所有搜索字段在 MarketItem 中存在', () => {
      const sample = MOCK_MARKETS[0]!;
      for (const field of MARKET_LIST_SEARCH_FIELDS) {
        assert.ok(field in sample, `field ${field} not in MarketItem`);
      }
    });
  });

  describe('MARKET_LIST_COLUMN_KEYS', () => {
    test('包含核心列', () => {
      assert.ok(MARKET_LIST_COLUMN_KEYS.includes('code'));
      assert.ok(MARKET_LIST_COLUMN_KEYS.includes('name'));
      assert.ok(MARKET_LIST_COLUMN_KEYS.includes('status'));
      assert.ok(MARKET_LIST_COLUMN_KEYS.includes('region'));
    });

    test('所有列在 MarketItem 中存在', () => {
      const sample = MOCK_MARKETS[0]!;
      for (const key of MARKET_LIST_COLUMN_KEYS) {
        assert.ok(key in sample, `column key ${key} not in MarketItem`);
      }
    });
  });

  describe('MARKET_LIST_PRESET', () => {
    test('defaultPageSize 为正数', () => {
      assert.ok(MARKET_LIST_PRESET.defaultPageSize > 0);
    });

    test('pageSizeOptions 包含 defaultPageSize', () => {
      assert.ok(MARKET_LIST_PRESET.pageSizeOptions.includes(MARKET_LIST_PRESET.defaultPageSize as 10));
    });

    test('statuses 覆盖所有 MARKET_STATUSES', () => {
      const presetStatuses = new Set(MARKET_LIST_PRESET.statuses);
      for (const s of MARKET_STATUSES) {
        assert.ok(presetStatuses.has(s), `status ${s} not in preset`);
      }
    });

    test('regions 覆盖所有 MARKET_REGIONS', () => {
      const presetRegions = new Set(MARKET_LIST_PRESET.regions);
      for (const r of MARKET_REGIONS) {
        assert.ok(presetRegions.has(r), `region ${r} not in preset`);
      }
    });
  });

  // ─── Detail Labels ───

  describe('MARKET_DETAIL_LABELS', () => {
    test('定义了所有必要的标签', () => {
      assert.ok(typeof MARKET_DETAIL_LABELS.overviewTitle === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.code === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.name === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.region === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.locale === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.currency === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.timezone === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.status === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.lastDeployed === 'string');
      assert.ok(typeof MARKET_DETAIL_LABELS.description === 'string');
    });

    test('notFound 返回格式化字符串', () => {
      const result = MARKET_DETAIL_LABELS.notFound('m99');
      assert.ok(result.includes('m99'));
    });

    test('所有标签值非空', () => {
      const staticLabels = [
        'overviewTitle', 'code', 'name', 'region', 'locale', 'currency',
        'timezone', 'status', 'lastDeployed', 'description',
        'editTitle', 'saveButton', 'cancelButton', 'backToList',
      ];
      for (const key of staticLabels) {
        const val = (MARKET_DETAIL_LABELS as Record<string, unknown>)[key];
        assert.ok(typeof val === 'string' && val.length > 0, `label ${key} should be non-empty string`);
      }
    });
  });

  // ─── 路由 ───

  describe('adminMarketRoute', () => {
    test('定义了基本的 href / title / description', () => {
      assert.equal(adminMarketRoute.href, '/markets');
      assert.ok(typeof adminMarketRoute.title === 'string' && adminMarketRoute.title.length > 0);
      assert.ok(typeof adminMarketRoute.description === 'string' && adminMarketRoute.description.length > 0);
    });
  });

  // ─── 数组常量一致性 ───

  describe('类型常量一致性', () => {
    test('MARKET_STATUSES 覆盖所有 MARKET_STATUS_MAP 键', () => {
      const mapKeys = Object.keys(MARKET_STATUS_MAP);
      assert.deepEqual(mapKeys.sort(), [...MARKET_STATUSES].sort());
    });

    test('MARKET_REGIONS 覆盖所有 MARKET_REGION_MAP 键', () => {
      const mapKeys = Object.keys(MARKET_REGION_MAP);
      assert.deepEqual(mapKeys.sort(), [...MARKET_REGIONS].sort());
    });

    test('MarketDetail extends MarketItem', () => {
      const detail: MarketDetail = MOCK_MARKET_DETAILS.m1!;
      // MarketItem fields
      assert.ok(detail.id.length > 0);
      assert.ok(detail.code.length > 0);
      assert.ok(detail.status.length > 0);
      assert.ok(detail.locale.length > 0);
      assert.ok(detail.currency.length > 0);
      assert.ok(detail.region.length > 0);
      // MarketDetail extra fields
      assert.ok(detail.description.length > 0);
      assert.ok(detail.defaultLanguage.length > 0);
      assert.ok(detail.contactName.length > 0);
      assert.ok(detail.paymentMethods.length > 0);
    });
  });

  // ─── 边界测试 ───

  describe('边界情况', () => {
    test('空字符串状态 fallback', () => {
      assert.equal(getMarketStatusLabel('' as MarketStatus), '');
    });

    test('computeMarketStats on single pending market', () => {
      const single = [{ ...MOCK_MARKETS[0]!, status: 'pending' as const }];
      const stats = computeMarketStats(single);
      assert.equal(stats.pending, 1);
      assert.equal(stats.active, 0);
    });

    test('computeMarketRegionDistribution preserves region identity', () => {
      const distribution = computeMarketRegionDistribution(MOCK_MARKETS);
      assert.ok('asia-pacific' in distribution);
      assert.ok('europe' in distribution || 'north-america' in distribution);
    });

    test('所有 market codes 在不同区域中不重复', () => {
      // 验证市场编码体系
      const codes = MOCK_MARKETS.map((m) => m.code);
      assert.equal(new Set(codes).size, codes.length);
    });
  });
});
