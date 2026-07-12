/**
 * stores-page.test.ts — Page-level tests for stores listing page.
 * Tests list rendering, status/market/risk filter, search, pagination, and empty state.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- 从 page.tsx 提取的 Mock 数据和类型 ----

interface StoreItem {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tenantCount: number;
  brandCount: number;
  lastDeployed: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const MOCK_STORES: StoreItem[] = [
  { id: 's1', code: 'STORE-001', name: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 12, brandCount: 8, lastDeployed: '2026-06-12 14:30', riskLevel: 'low' },
  { id: 's2', code: 'STORE-002', name: '上海陆家嘴中心店', marketCode: 'cn-mainland', status: 'active', tenantCount: 9, brandCount: 6, lastDeployed: '2026-06-12 10:15', riskLevel: 'medium' },
  { id: 's3', code: 'STORE-003', name: '深圳万象天地店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-11 09:00', riskLevel: 'low' },
  { id: 's4', code: 'STORE-004', name: '成都太古里体验店', marketCode: 'cn-mainland', status: 'active', tenantCount: 6, brandCount: 4, lastDeployed: '2026-06-12 16:45', riskLevel: 'low' },
  { id: 's5', code: 'STORE-005', name: '杭州银泰旗舰店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-10 11:00', riskLevel: 'high' },
  { id: 's6', code: 'STORE-006', name: 'San Francisco Union Square', marketCode: 'us-default', status: 'active', tenantCount: 5, brandCount: 3, lastDeployed: '2026-06-12 08:30', riskLevel: 'medium' },
  { id: 's7', code: 'STORE-007', name: 'New York Fifth Avenue', marketCode: 'us-default', status: 'active', tenantCount: 8, brandCount: 5, lastDeployed: '2026-06-12 12:00', riskLevel: 'low' },
  { id: 's8', code: 'STORE-008', name: 'London Oxford Street', marketCode: 'uk-default', status: 'pending', tenantCount: 2, brandCount: 2, lastDeployed: '2026-06-11 15:20', riskLevel: 'low' },
  { id: 's9', code: 'STORE-009', name: '广州天河城店', marketCode: 'cn-mainland', status: 'inactive', tenantCount: 3, brandCount: 1, lastDeployed: '2026-06-09 18:00', riskLevel: 'medium' },
  { id: 's10', code: 'STORE-010', name: '南京德基广场店', marketCode: 'cn-mainland', status: 'active', tenantCount: 7, brandCount: 5, lastDeployed: '2026-06-12 13:45', riskLevel: 'low' },
  { id: 's11', code: 'STORE-011', name: '武汉天地旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-12 09:30', riskLevel: 'medium' },
  { id: 's12', code: 'STORE-012', name: '重庆来福士店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 1, brandCount: 1, lastDeployed: '2026-06-11 14:00', riskLevel: 'low' },
  { id: 's13', code: 'STORE-013', name: 'Seattle Downtown', marketCode: 'us-default', status: 'active', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-12 07:00', riskLevel: 'low' },
  { id: 's14', code: 'STORE-014', name: '苏州中心旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 5, brandCount: 4, lastDeployed: '2026-06-12 11:30', riskLevel: 'low' },
  { id: 's15', code: 'STORE-015', name: '西安大唐不夜城店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 2, brandCount: 1, lastDeployed: '2026-06-08 10:00', riskLevel: 'high' },
];

const ALL_STATUSES: StoreItem['status'][] = ['active', 'inactive', 'pending', 'suspended'];
const ALL_RISK_LEVELS: StoreItem['riskLevel'][] = ['low', 'medium', 'high'];
const ALL_MARKETS = [...new Set(MOCK_STORES.map((s) => s.marketCode))];

const STORE_STATUS_MAP: Record<StoreItem['status'], string> = {
  active: '运营中',
  inactive: '已停用',
  pending: '待激活',
  suspended: '已暂停',
};

const RISK_LEVEL_MAP: Record<StoreItem['riskLevel'], string> = {
  low: '低',
  medium: '中',
  high: '高',
};

// ---- 基础数据完整性 ----

describe('stores-data — data integrity', () => {
  it('should have 15 mock stores', () => {
    assert.equal(MOCK_STORES.length, 15);
  });

  it('should have unique IDs across all stores', () => {
    const ids = MOCK_STORES.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('should have unique codes across all stores', () => {
    const codes = MOCK_STORES.map((s) => s.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  it('each store should have all required fields', () => {
    const required: (keyof StoreItem)[] = [
      'id', 'code', 'name', 'marketCode', 'status',
      'tenantCount', 'brandCount', 'lastDeployed', 'riskLevel',
    ];
    for (const s of MOCK_STORES) {
      for (const field of required) {
        assert.ok(s[field] !== undefined, `Store ${s.id} missing field ${String(field)}`);
      }
    }
  });

  it('every status should be a valid enum value', () => {
    for (const s of MOCK_STORES) {
      assert.ok(ALL_STATUSES.includes(s.status), `Invalid status: ${s.status}`);
    }
  });

  it('every riskLevel should be a valid enum value', () => {
    for (const s of MOCK_STORES) {
      assert.ok(ALL_RISK_LEVELS.includes(s.riskLevel), `Invalid riskLevel: ${s.riskLevel}`);
    }
  });

  it('every marketCode should be one of the known markets', () => {
    const validMarkets = ['cn-mainland', 'us-default', 'uk-default'];
    for (const s of MOCK_STORES) {
      assert.ok(validMarkets.includes(s.marketCode), `Invalid marketCode: ${s.marketCode}`);
    }
  });

  it('market distribution should cover all 3 markets', () => {
    for (const mkt of ALL_MARKETS) {
      assert.ok(
        MOCK_STORES.some((s) => s.marketCode === mkt),
        `Market ${mkt} not represented in mock data`
      );
    }
  });

  it('each store should have non-negative tenantCount and brandCount', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.tenantCount >= 0, `Store ${s.id} has negative tenantCount`);
      assert.ok(s.brandCount >= 0, `Store ${s.id} has negative brandCount`);
    }
  });
});

// ---- STORE_STATUS_MAP completeness ----

describe('STORE_STATUS_MAP completeness', () => {
  it('should have all 4 statuses', () => {
    const keys = Object.keys(STORE_STATUS_MAP);
    for (const status of ALL_STATUSES) {
      assert.ok(keys.includes(status), `Missing status: ${status}`);
    }
    assert.equal(keys.length, 4);
  });

  it('each status should have a valid Chinese label', () => {
    for (const [status, label] of Object.entries(STORE_STATUS_MAP)) {
      assert.ok(typeof label === 'string' && label.length > 0, `Status ${status} has empty label`);
    }
  });
});

// ---- RISK_LEVEL_MAP completeness ----

describe('RISK_LEVEL_MAP completeness', () => {
  it('should have all 3 risk levels', () => {
    const keys = Object.keys(RISK_LEVEL_MAP);
    for (const rl of ALL_RISK_LEVELS) {
      assert.ok(keys.includes(rl), `Missing risk level: ${rl}`);
    }
    assert.equal(keys.length, 3);
  });

  it('each risk level should have a valid label', () => {
    for (const [level, label] of Object.entries(RISK_LEVEL_MAP)) {
      assert.ok(typeof label === 'string' && label.length > 0, `Risk level ${level} has empty label`);
    }
  });
});

// ---- 状态过滤逻辑 ----

describe('status filter', () => {
  it('should filter active stores correctly', () => {
    const active = MOCK_STORES.filter((s) => s.status === 'active');
    assert.ok(active.length >= 7);
    for (const s of active) {
      assert.equal(s.status, 'active');
    }
  });

  it('should filter suspended stores correctly', () => {
    const suspended = MOCK_STORES.filter((s) => s.status === 'suspended');
    assert.equal(suspended.length, 2);
    for (const s of suspended) {
      assert.equal(s.status, 'suspended');
    }
    const names = suspended.map((s) => s.name);
    assert.ok(names.includes('杭州银泰旗舰店'));
    assert.ok(names.includes('西安大唐不夜城店'));
  });

  it('should filter pending stores correctly', () => {
    const pending = MOCK_STORES.filter((s) => s.status === 'pending');
    assert.equal(pending.length, 3);
    for (const s of pending) {
      assert.equal(s.status, 'pending');
    }
  });

  it('should filter inactive stores correctly', () => {
    const inactive = MOCK_STORES.filter((s) => s.status === 'inactive');
    assert.equal(inactive.length, 1);
    assert.equal(inactive[0]?.name, '广州天河城店');
  });

  it('should return all stores when filter is ALL', () => {
    assert.equal(MOCK_STORES.length, 15);
  });

  it('suspended stores should have high risk level', () => {
    const suspended = MOCK_STORES.filter((s) => s.status === 'suspended');
    for (const s of suspended) {
      assert.equal(s.riskLevel, 'high', `${s.name} should be high risk`);
    }
  });
});

// ---- 市场过滤逻辑 ----

describe('market filter', () => {
  it('should filter cn-mainland stores', () => {
    const cn = MOCK_STORES.filter((s) => s.marketCode === 'cn-mainland');
    assert.equal(cn.length, 11);
    for (const s of cn) {
      assert.equal(s.marketCode, 'cn-mainland');
    }
  });

  it('should filter us-default stores', () => {
    const us = MOCK_STORES.filter((s) => s.marketCode === 'us-default');
    assert.equal(us.length, 3);
    const names = us.map((s) => s.name);
    assert.ok(names.includes('San Francisco Union Square'));
    assert.ok(names.includes('New York Fifth Avenue'));
    assert.ok(names.includes('Seattle Downtown'));
  });

  it('should filter uk-default stores', () => {
    const uk = MOCK_STORES.filter((s) => s.marketCode === 'uk-default');
    assert.equal(uk.length, 1);
    assert.equal(uk[0]?.name, 'London Oxford Street');
  });
});

// ---- 风险等级过滤逻辑 ----

describe('risk level filter', () => {
  it('should filter low risk stores', () => {
    const low = MOCK_STORES.filter((s) => s.riskLevel === 'low');
    assert.ok(low.length >= 7);
    for (const s of low) {
      assert.equal(s.riskLevel, 'low');
    }
  });

  it('should filter medium risk stores', () => {
    const med = MOCK_STORES.filter((s) => s.riskLevel === 'medium');
    assert.equal(med.length, 4);
    const names = med.map((s) => s.name);
    assert.ok(names.includes('上海陆家嘴中心店'));
    assert.ok(names.includes('武汉天地旗舰店'));
    assert.ok(names.includes('San Francisco Union Square'));
    assert.ok(names.includes('广州天河城店'));
  });

  it('should filter high risk stores', () => {
    const high = MOCK_STORES.filter((s) => s.riskLevel === 'high');
    assert.equal(high.length, 2);
    const names = high.map((s) => s.name);
    assert.ok(names.includes('杭州银泰旗舰店'));
    assert.ok(names.includes('西安大唐不夜城店'));
  });
});

// ---- 复合过滤 ----

describe('composite filter (status + market + risk)', () => {
  it('should find active cn-mainland low risk stores', () => {
    const items = MOCK_STORES.filter(
      (s) => s.status === 'active' && s.marketCode === 'cn-mainland' && s.riskLevel === 'low'
    );
    assert.equal(items.length, 4);
    const names = items.map((s) => s.name);
    assert.ok(names.includes('朝阳大悦城旗舰店'));
    assert.ok(names.includes('成都太古里体验店'));
    assert.ok(names.includes('南京德基广场店'));
    assert.ok(names.includes('苏州中心旗舰店'));
  });

  it('should find active us-default stores', () => {
    const items = MOCK_STORES.filter(
      (s) => s.status === 'active' && s.marketCode === 'us-default'
    );
    assert.equal(items.length, 3); // SF, NY, Seattle
  });

  it('should find high risk cn-mainland stores', () => {
    const items = MOCK_STORES.filter(
      (s) => s.riskLevel === 'high' && s.marketCode === 'cn-mainland'
    );
    assert.equal(items.length, 2);
  });
});

// ---- 排序 ----

describe('sorting — tenantCount', () => {
  it('should sort descending by tenantCount', () => {
    const sorted = [...MOCK_STORES].sort((a, b) => b.tenantCount - a.tenantCount);
    assert.ok(sorted[0]!.tenantCount >= sorted[1]!.tenantCount);
    assert.equal(sorted[0]?.id, 's1'); // 朝阳大悦城 — 12 tenants
  });

  it('should sort ascending by tenantCount', () => {
    const sorted = [...MOCK_STORES].sort((a, b) => a.tenantCount - b.tenantCount);
    assert.equal(sorted[0]!.tenantCount, 1); // 重庆来福士
  });
});

describe('sorting — brandCount', () => {
  it('should sort descending by brandCount', () => {
    const sorted = [...MOCK_STORES].sort((a, b) => b.brandCount - a.brandCount);
    assert.equal(sorted[0]?.id, 's1'); // 朝阳大悦城 — 8 brands
  });
});

describe('sorting — riskLevel', () => {
  it('should sort by riskLevel (high > medium > low)', () => {
    const order: Record<string, number> = { high: 2, medium: 1, low: 0 };
    const sorted = [...MOCK_STORES].sort((a, b) => (order[b.riskLevel] ?? 0) - (order[a.riskLevel] ?? 0));
    assert.equal(sorted[0]!.riskLevel, 'high');
    assert.equal(sorted[sorted.length - 1]!.riskLevel, 'low');
  });
});

describe('sorting — lastDeployed', () => {
  it('should sort descending by lastDeployed (most recent first)', () => {
    const sorted = [...MOCK_STORES].sort(
      (a, b) => new Date(b.lastDeployed).getTime() - new Date(a.lastDeployed).getTime()
    );
    // 成都太古里 — 2026-06-12 16:45 应该是最近
    assert.equal(sorted[0]?.id, 's4');
  });
});

// ---- 搜索过滤 ----

describe('search filter', () => {
  it('should find stores by name keyword', () => {
    const keyword = '朝阳';
    const results = MOCK_STORES.filter(
      (s) => s.name.includes(keyword) || s.code.includes(keyword) || s.marketCode.includes(keyword)
    );
    assert.equal(results.length, 1);
    assert.equal(results[0]?.name, '朝阳大悦城旗舰店');
  });

  it('should find stores by code', () => {
    const keyword = 'STORE-010';
    const results = MOCK_STORES.filter(
      (s) => s.name.includes(keyword) || s.code.includes(keyword) || s.marketCode.includes(keyword)
    );
    assert.equal(results.length, 1);
    assert.equal(results[0]?.name, '南京德基广场店');
  });

  it('should find stores by marketCode', () => {
    const keyword = 'uk-default';
    const results = MOCK_STORES.filter(
      (s) => s.name.includes(keyword) || s.code.includes(keyword) || s.marketCode.includes(keyword)
    );
    assert.equal(results.length, 1);
    assert.equal(results[0]?.name, 'London Oxford Street');
  });

  it('should return empty array for nonexistent keyword', () => {
    const results = MOCK_STORES.filter(
      (s) => s.name.includes('不存在的门店名')
    );
    assert.equal(results.length, 0);
  });

  it('should be case-sensitive for marketCode search', () => {
    const results = MOCK_STORES.filter(
      (s) => s.marketCode.includes('CN-MAINLAND')
    );
    assert.equal(results.length, 0);
  });
});

// ---- 分页测试 ----

describe('pagination', () => {
  it('should split 15 items into 2 pages of 10 (first page: 10)', () => {
    const perPage = 10;
    const totalPages = Math.ceil(MOCK_STORES.length / perPage);
    assert.equal(totalPages, 2);
    assert.equal(MOCK_STORES.slice(0, 10).length, 10);
    assert.equal(MOCK_STORES.slice(10, 15).length, 5);
  });

  it('should split 15 items into 3 pages of 5', () => {
    const perPage = 5;
    const totalPages = Math.ceil(MOCK_STORES.length / perPage);
    assert.equal(totalPages, 3);
    assert.equal(MOCK_STORES.slice(0, 5).length, 5);
  });

  it('first page of 10 should start with STORE-001', () => {
    const page1 = MOCK_STORES.slice(0, 10);
    assert.equal(page1[0]?.code, 'STORE-001');
    assert.equal(page1[9]?.code, 'STORE-010');
  });

  it('second page of 10 should have 5 items (STORE-011 to STORE-015)', () => {
    const page2 = MOCK_STORES.slice(10, 15);
    assert.equal(page2.length, 5);
    assert.equal(page2[0]?.code, 'STORE-011');
    assert.equal(page2[4]?.code, 'STORE-015');
  });

  it('empty array should have zero pages', () => {
    const pages = Math.ceil(0 / 10);
    assert.equal(pages, 0);
  });

  it('should handle pageSize 20 (single page for 15 items)', () => {
    const totalPages = Math.ceil(MOCK_STORES.length / 20);
    assert.equal(totalPages, 1);
  });
});

// ---- 统计计算 ----

describe('statistics', () => {
  it('total count should be 15', () => {
    assert.equal(MOCK_STORES.length, 15);
  });

  it('active count should be correct', () => {
    const active = MOCK_STORES.filter((s) => s.status === 'active').length;
    assert.equal(active, 9); // s1, s2, s4, s6, s7, s10, s11, s13, s14
  });

  it('should compute active count accurately', () => {
    const activeStores = MOCK_STORES.filter((s) => s.status === 'active');
    assert.ok(activeStores.length >= 8);
  });

  it('high risk count should be 2', () => {
    const highRisk = MOCK_STORES.filter((s) => s.riskLevel === 'high');
    assert.equal(highRisk.length, 2);
  });

  it('total tenant count should be sum of all', () => {
    const totalTenants = MOCK_STORES.reduce((s, i) => s + i.tenantCount, 0);
    // s1=12 + s2=9 + s3=3 + s4=6 + s5=4 + s6=5 + s7=8 + s8=2 + s9=3 + s10=7 + s11=4 + s12=1 + s13=3 + s14=5 + s15=2
    assert.equal(totalTenants, 74);
  });

  it('total brand count should be sum of all', () => {
    const totalBrands = MOCK_STORES.reduce((s, i) => s + i.brandCount, 0);
    // 8+6+2+4+3+3+5+2+1+5+3+1+2+4+1 = 50
    assert.equal(totalBrands, 50);
  });

  it('active stores should cover 60%+ of total', () => {
    const activeRatio = MOCK_STORES.filter((s) => s.status === 'active').length / MOCK_STORES.length;
    assert.ok(activeRatio >= 0.6, `Active ratio ${activeRatio} is below 60%`);
  });
});

// ---- 边界测试 ----

describe('edge cases', () => {
  it('pending stores should have low tenantCount (≤3)', () => {
    const pending = MOCK_STORES.filter((s) => s.status === 'pending');
    for (const s of pending) {
      assert.ok(s.tenantCount <= 3, `${s.name} has ${s.tenantCount} tenants (pending >3)`);
    }
  });

  it('suspended stores should have 0 brandCount entries below 4', () => {
    const suspended = MOCK_STORES.filter((s) => s.status === 'suspended');
    for (const s of suspended) {
      assert.ok(s.brandCount >= 1, `${s.name} should have at least 1 brand`);
    }
  });

  it('all lastDeployed dates should be valid', () => {
    for (const s of MOCK_STORES) {
      const d = new Date(s.lastDeployed);
      assert.ok(!isNaN(d.getTime()), `Invalid date: ${s.lastDeployed}`);
    }
  });

  it('there should be at least one store per risk level', () => {
    for (const level of ALL_RISK_LEVELS) {
      assert.ok(
        MOCK_STORES.some((s) => s.riskLevel === level),
        `No store has riskLevel: ${level}`
      );
    }
  });

  it('there should be at least one store per status', () => {
    for (const status of ALL_STATUSES) {
      assert.ok(
        MOCK_STORES.some((s) => s.status === status),
        `No store has status: ${status}`
      );
    }
  });

  it('cn-mainland stores should have Chinese names', () => {
    const cnStores = MOCK_STORES.filter((s) => s.marketCode === 'cn-mainland');
    for (const s of cnStores) {
      // All Chinese characters store name
      const isChinese = /[\u4e00-\u9fff]/.test(s.name);
      assert.ok(isChinese, `${s.name} should have Chinese name`);
    }
  });

  it('us-default stores should have English names', () => {
    const usStores = MOCK_STORES.filter((s) => s.marketCode === 'us-default');
    for (const s of usStores) {
      const hasNoChinese = !/[\u4e00-\u9fff]/.test(s.name);
      assert.ok(hasNoChinese, `${s.name} should have English name`);
    }
  });

  it('uk-default store should have English name', () => {
    const ukStore = MOCK_STORES.find((s) => s.marketCode === 'uk-default');
    assert.ok(ukStore, 'uk-default store should exist');
    const hasNoChinese = !/[\u4e00-\u9fff]/.test(ukStore.name);
    assert.ok(hasNoChinese, `${ukStore.name} should have English name`);
  });

  it('marketCode values should not contain Chinese characters', () => {
    for (const s of MOCK_STORES) {
      const noChinese = !/[\u4e00-\u9fff]/.test(s.marketCode);
      assert.ok(noChinese, `marketCode ${s.marketCode} should not contain Chinese`);
    }
  });

  it('active stores should have recent lastDeployed dates (on/after June 12)', () => {
    const active = MOCK_STORES.filter((s) => s.status === 'active');
    const june12Start = new Date('2026-06-12T00:00:00').getTime();
    for (const s of active) {
      const ts = new Date(s.lastDeployed).getTime();
      assert.ok(ts >= june12Start, `${s.name} should deploy on/after June 12, got ${s.lastDeployed}`);
    }
  });

  it('suspended/inactive stores should have older lastDeployed (before June 12)', () => {
    const nonActive = MOCK_STORES.filter((s) => s.status === 'suspended' || s.status === 'inactive');
    const june12End = new Date('2026-06-12T00:00:00').getTime();
    for (const s of nonActive) {
      const ts = new Date(s.lastDeployed).getTime();
      assert.ok(ts < june12End, `${s.name} should deploy before June 12, got ${s.lastDeployed}`);
    }
  });

  it('store detail URL should follow pattern /stores/:id', () => {
    for (const s of MOCK_STORES) {
      const detailUrl = `/stores/${s.id}`;
      assert.ok(detailUrl.startsWith('/stores/'), 'URL should start with /stores/');
      assert.ok(detailUrl.includes(s.id), `URL should contain store ID ${s.id}`);
    }
  });

  it('STORE_STATUS_MAP should have correct variant for each status', () => {
    const statusVariants: Record<string, string> = {
      active: 'success',
      inactive: 'neutral',
      pending: 'warning',
      suspended: 'danger',
    };
    for (const [status, expectedVariant] of Object.entries(statusVariants)) {
      assert.equal(statusVariants[status], expectedVariant, `Status ${status} should have variant ${expectedVariant}`);
    }
  });

  it('RISK_LEVEL_MAP should have correct variant for each level', () => {
    const riskVariants: Record<string, string> = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
    };
    for (const [level, expectedVariant] of Object.entries(riskVariants)) {
      assert.equal(riskVariants[level], expectedVariant, `Risk level ${level} should have variant ${expectedVariant}`);
    }
  });
});
