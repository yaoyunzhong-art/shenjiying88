/**
 * stores-data.test.ts — 门店管理数据类型测试
 *
 * 测试: stores-data 模型、映射关系、mock 数据完整性、统计计算
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  STORE_STATUS_MAP,
  STORE_RISK_LEVEL_MAP,
  STORE_STATUSES,
  STORE_RISK_LEVELS,
  getStoreStatusLabel,
  getStoreRiskLevelLabel,
  getStoreStatusVariant,
  getStoreRiskLevelVariant,
  computeStoreStats,
  computeStoreMarketDistribution,
  MOCK_STORES,
  MOCK_STORE_DETAILS,
  adminStoreRoute,
  type StoreDetail,
  type StoreStatus,
  type StoreRiskLevel,
} from './stores-data';

describe('stores-data', () => {
  // ─── 常量映射 ───

  describe('STORE_STATUS_MAP', () => {
    test('每个状态都有 label 和 variant', () => {
      for (const status of STORE_STATUSES) {
        const entry = STORE_STATUS_MAP[status];
        assert.ok(entry !== undefined, `${status} should be defined`);
        assert.ok(typeof entry.label === 'string', `${status} label should be string`);
        assert.ok(entry.label.length > 0, `${status} label should not be empty`);
        assert.ok(/^(success|neutral|warning|danger)$/.test(entry.variant), `${status} variant should be valid`);
      }
    });

    test('active → 运营中 (success)', () => {
      assert.equal(STORE_STATUS_MAP.active.label, '运营中');
      assert.equal(STORE_STATUS_MAP.active.variant, 'success');
    });

    test('suspended → 已暂停 (danger)', () => {
      assert.equal(STORE_STATUS_MAP.suspended.label, '已暂停');
      assert.equal(STORE_STATUS_MAP.suspended.variant, 'danger');
    });

    test('inactive → 已停用 (neutral)', () => {
      assert.equal(STORE_STATUS_MAP.inactive.label, '已停用');
      assert.equal(STORE_STATUS_MAP.inactive.variant, 'neutral');
    });
  });

  describe('STORE_RISK_LEVEL_MAP', () => {
    test('每个风险等级都有 label 和 variant', () => {
      for (const level of STORE_RISK_LEVELS) {
        const entry = STORE_RISK_LEVEL_MAP[level];
        assert.ok(entry !== undefined, `${level} should be defined`);
        assert.ok(typeof entry.label === 'string');
        assert.ok(/^(success|neutral|warning|danger)$/.test(entry.variant));
      }
    });

    test('high → 高 (danger)', () => {
      assert.equal(STORE_RISK_LEVEL_MAP.high.label, '高');
      assert.equal(STORE_RISK_LEVEL_MAP.high.variant, 'danger');
    });

    test('low → 低 (success)', () => {
      assert.equal(STORE_RISK_LEVEL_MAP.low.label, '低');
      assert.equal(STORE_RISK_LEVEL_MAP.low.variant, 'success');
    });
  });

  // ─── 工具函数 ───

  describe('getStoreStatusLabel', () => {
    test('返回已知状态的 label', () => {
      assert.equal(getStoreStatusLabel('active'), '运营中');
      assert.equal(getStoreStatusLabel('pending'), '待激活');
    });

    test('未知状态返回原始值 (fallback)', () => {
      assert.equal(getStoreStatusLabel('unknown' as StoreStatus), 'unknown');
    });
  });

  describe('getStoreRiskLevelLabel', () => {
    test('返回已知风险等级的 label', () => {
      assert.equal(getStoreRiskLevelLabel('low'), '低');
      assert.equal(getStoreRiskLevelLabel('medium'), '中');
      assert.equal(getStoreRiskLevelLabel('high'), '高');
    });

    test('未知等级返回原始值 (fallback)', () => {
      assert.equal(getStoreRiskLevelLabel('unknown' as StoreRiskLevel), 'unknown');
    });
  });

  describe('getStoreStatusVariant', () => {
    test('返回状态对应的 variant', () => {
      assert.equal(getStoreStatusVariant('active'), 'success');
      assert.equal(getStoreStatusVariant('suspended'), 'danger');
      assert.equal(getStoreStatusVariant('pending'), 'warning');
      assert.equal(getStoreStatusVariant('inactive'), 'neutral');
    });
  });

  describe('getStoreRiskLevelVariant', () => {
    test('返回风险等级对应的 variant', () => {
      assert.equal(getStoreRiskLevelVariant('high'), 'danger');
      assert.equal(getStoreRiskLevelVariant('medium'), 'warning');
      assert.equal(getStoreRiskLevelVariant('low'), 'success');
    });
  });

  // ─── Mock 数据完整性 ───

  describe('MOCK_STORES', () => {
    test('包含足够的数据量用于列表页', () => {
      assert.ok(MOCK_STORES.length >= 5, `expected >= 5, got ${MOCK_STORES.length}`);
    });

    test('每个 item 都有必需的字段', () => {
      for (const item of MOCK_STORES) {
        assert.ok(typeof item.id === 'string' && item.id.length > 0, `id missing for ${item.code}`);
        assert.ok(typeof item.code === 'string' && item.code.length > 0, `code missing`);
        assert.ok(typeof item.name === 'string' && item.name.length > 0, `name missing`);
        assert.ok(STORE_STATUSES.includes(item.status), `invalid status ${item.status}`);
        assert.ok(STORE_RISK_LEVELS.includes(item.riskLevel), `invalid riskLevel ${item.riskLevel}`);
        assert.ok(typeof item.tenantCount === 'number', `tenantCount not number`);
        assert.ok(typeof item.brandCount === 'number', `brandCount not number`);
        assert.ok(typeof item.lastDeployed === 'string', `lastDeployed not string`);
        assert.ok(typeof item.marketCode === 'string', `marketCode not string`);
      }
    });

    test('所有 id 唯一', () => {
      const ids = MOCK_STORES.map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length);
    });

    test('所有 code 唯一', () => {
      const codes = MOCK_STORES.map((s) => s.code);
      assert.equal(new Set(codes).size, codes.length);
    });

    test('状态分布合理 — 至少有一个 active', () => {
      const stats = computeStoreStats(MOCK_STORES);
      assert.ok(stats.active > 0, 'should have at least one active store');
    });
  });

  describe('MOCK_STORE_DETAILS', () => {
    test('每个详情记录都对应列表中的门店', () => {
      const storeIds = new Set(MOCK_STORES.map((s) => s.id));
      for (const detail of Object.values(MOCK_STORE_DETAILS)) {
        assert.ok(storeIds.has(detail.id), `detail id ${detail.id} not found in MOCK_STORES`);
      }
    });

    test('详情包含比列表更多的字段', () => {
      const s1 = MOCK_STORE_DETAILS.s1;
      assert.ok(s1 !== undefined);
      assert.ok(s1.address.length > 0);
      assert.ok(s1.city.length > 0);
      assert.ok(s1.managerName.length > 0);
      assert.ok(s1.floorCount > 0);
      assert.ok(s1.totalArea > 0);
      assert.ok(s1.deviceCount > 0);
    });

    test('暂停门店的 riskLevel 为 high', () => {
      const s5 = MOCK_STORE_DETAILS.s5!;
      assert.equal(s5.status, 'suspended');
      assert.equal(s5.riskLevel, 'high');
    });
  });

  // ─── 统计计算 ───

  describe('computeStoreStats', () => {
    test('返回所有状态的计数', () => {
      const stats = computeStoreStats(MOCK_STORES);
      assert.equal(stats.total, MOCK_STORES.length);
      assert.equal(
        stats.active + stats.inactive + stats.pending + stats.suspended,
        MOCK_STORES.length,
        'status counts should sum to total'
      );
    });

    test('风险等级计数总和等于 total', () => {
      const stats = computeStoreStats(MOCK_STORES);
      assert.equal(
        stats.highRisk + stats.mediumRisk + stats.lowRisk,
        MOCK_STORES.length,
        'risk level counts should sum to total'
      );
    });

    test('空数组 → 全 0', () => {
      const stats = computeStoreStats([]);
      assert.equal(stats.total, 0);
      assert.equal(stats.active, 0);
      assert.equal(stats.highRisk, 0);
      assert.equal(stats.totalBrands, 0);
      assert.equal(stats.totalTenants, 0);
    });

    test('累加品牌数和租户数 > 0', () => {
      const stats = computeStoreStats(MOCK_STORES);
      assert.ok(stats.totalBrands > 0);
      assert.ok(stats.totalTenants > 0);
    });

    test('单个 store 的累加值 = store 自身的值', () => {
      const single = [MOCK_STORES[0]!];
      const stats = computeStoreStats(single);
      assert.equal(stats.totalBrands, single[0]!.brandCount);
      assert.equal(stats.totalTenants, single[0]!.tenantCount);
    });
  });

  describe('computeStoreMarketDistribution', () => {
    test('返回每个市场的门店分布，总和等于 total', () => {
      const distribution = computeStoreMarketDistribution(MOCK_STORES);
      assert.ok(Object.keys(distribution).length >= 1);
      const totalFromDistribution = Object.values(distribution).reduce((sum, v) => sum + v, 0);
      assert.equal(totalFromDistribution, MOCK_STORES.length);
    });

    test('所有分布值都是正整数', () => {
      const distribution = computeStoreMarketDistribution(MOCK_STORES);
      for (const count of Object.values(distribution)) {
        assert.ok(count > 0, `market count should be > 0`);
        assert.ok(Number.isInteger(count));
      }
    });

    test('空数组返回空对象', () => {
      const distribution = computeStoreMarketDistribution([]);
      assert.equal(Object.keys(distribution).length, 0);
    });

    test('单一市场的门店数量正确', () => {
      const cnStores = MOCK_STORES.filter((s) => s.marketCode === 'cn-mainland');
      const distribution = computeStoreMarketDistribution(MOCK_STORES);
      assert.equal(distribution['cn-mainland'], cnStores.length);
    });
  });

  // ─── 路由 ───

  describe('adminStoreRoute', () => {
    test('定义了基本的 href / title / description', () => {
      assert.equal(adminStoreRoute.href, '/stores');
      assert.ok(typeof adminStoreRoute.title === 'string' && adminStoreRoute.title.length > 0);
      assert.ok(typeof adminStoreRoute.description === 'string' && adminStoreRoute.description.length > 0);
    });
  });

  // ─── 数组常量一致性 ───

  describe('类型常量一致性', () => {
    test('STORE_STATUSES 覆盖所有 STORE_STATUS_MAP 键', () => {
      const mapKeys = Object.keys(STORE_STATUS_MAP);
      assert.deepEqual(mapKeys.sort(), [...STORE_STATUSES].sort());
    });

    test('STORE_RISK_LEVELS 覆盖所有 STORE_RISK_LEVEL_MAP 键', () => {
      const mapKeys = Object.keys(STORE_RISK_LEVEL_MAP);
      assert.deepEqual(mapKeys.sort(), [...STORE_RISK_LEVELS].sort());
    });

    test('StoreDetail extends StoreItem', () => {
      const detail: StoreDetail = MOCK_STORE_DETAILS.s1!;
      // StoreItem fields
      assert.ok(detail.id.length > 0);
      assert.ok(detail.code.length > 0);
      assert.ok(detail.status.length > 0);
      // StoreDetail extra fields
      assert.ok(detail.address.length > 0);
      assert.ok(detail.managerName.length > 0);
      assert.ok(detail.floorCount > 0);
    });
  });

  // ─── 边界测试 ───

  describe('边界情况', () => {
    test('getStoreStatusLabel with empty string (fallback)', () => {
      assert.equal(getStoreStatusLabel('' as StoreStatus), '');
    });

    test('computeStoreStats on single suspended store', () => {
      const s = MOCK_STORES[0]!;
      const single = [{ ...s, status: 'suspended' as const }];
      const stats = computeStoreStats(single);
      assert.equal(stats.suspended, 1);
      assert.equal(stats.active, 0);
    });

    test('computeStoreMarketDistribution preserves market identity', () => {
      const distribution = computeStoreMarketDistribution(MOCK_STORES);
      assert.ok('cn-mainland' in distribution);
    });
  });
});
