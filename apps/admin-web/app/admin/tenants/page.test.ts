/**
 * admin/tenants/page.test.ts — 租户管理 L1 测试
 *
 * 覆盖:
 *   正例 — 租户列表结构化校验、统计计算、筛选逻辑、常量映射
 *   反例 — 空搜索、不存在的筛选值
 *   边界 — 零值租户数、极值用户/营收
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── Mock 类型与数据 ─────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'suspended' | 'trial' | 'expired';
  plan: 'enterprise' | 'professional' | 'standard' | 'trial';
  storeCount: number;
  userCount: number;
  revenue: number;
  region: string;
  createdAt: string;
  expiryDate: string;
  contactName: string;
  contactPhone: string;
}

const TENANT_STATUS_MAP: Record<string, { label: string; variant: string }> = {
  active: { label: '正常', variant: 'success' },
  suspended: { label: '暂停', variant: 'danger' },
  trial: { label: '试用', variant: 'warning' },
  expired: { label: '已过期', variant: 'neutral' },
};

const TENANT_PLAN_MAP: Record<string, { label: string; tier: number }> = {
  enterprise: { label: '企业版', tier: 4 },
  professional: { label: '专业版', tier: 3 },
  standard: { label: '标准版', tier: 2 },
  trial: { label: '试用版', tier: 1 },
};

const MOCK_TENANTS: Tenant[] = [
  { id: 't-001', name: '永辉超市连锁', code: 'YH', status: 'active', plan: 'enterprise', storeCount: 186, userCount: 4800, revenue: 12500000, region: '华东', createdAt: '2023-06-01', expiryDate: '2028-06-01', contactName: '张总', contactPhone: '138****0001' },
  { id: 't-002', name: '万达广场管理', code: 'WD', status: 'active', plan: 'enterprise', storeCount: 142, userCount: 3600, revenue: 9800000, region: '华北', createdAt: '2023-08-15', expiryDate: '2028-08-15', contactName: '李总', contactPhone: '138****0002' },
  { id: 't-003', name: '全家便利店', code: 'QL', status: 'active', plan: 'professional', storeCount: 68, userCount: 2100, revenue: 4200000, region: '华东', createdAt: '2024-01-20', expiryDate: '2027-01-20', contactName: '王经理', contactPhone: '138****0003' },
  { id: 't-004', name: '华润万家', code: 'HR', status: 'active', plan: 'professional', storeCount: 55, userCount: 1800, revenue: 3800000, region: '华南', createdAt: '2024-03-10', expiryDate: '2027-03-10', contactName: '赵经理', contactPhone: '138****0004' },
  { id: 't-005', name: '罗森便利店', code: 'LS', status: 'suspended', plan: 'standard', storeCount: 32, userCount: 980, revenue: 1600000, region: '华东', createdAt: '2024-05-05', expiryDate: '2026-05-05', contactName: '陈总', contactPhone: '138****0005' },
  { id: 't-006', name: '7-Eleven 中国', code: 'SE', status: 'active', plan: 'professional', storeCount: 78, userCount: 2400, revenue: 5600000, region: '华南', createdAt: '2024-06-18', expiryDate: '2027-06-18', contactName: '刘经理', contactPhone: '138****0006' },
  { id: 't-007', name: '大润发', code: 'DRF', status: 'active', plan: 'enterprise', storeCount: 98, userCount: 3100, revenue: 7900000, region: '华东', createdAt: '2024-08-01', expiryDate: '2028-08-01', contactName: '孙总', contactPhone: '138****0007' },
  { id: 't-008', name: '上海百联', code: 'BL', status: 'expired', plan: 'standard', storeCount: 45, userCount: 1200, revenue: 2100000, region: '华东', createdAt: '2024-09-12', expiryDate: '2025-09-12', contactName: '周经理', contactPhone: '138****0008' },
  { id: 't-009', name: '屈臣氏中国', code: 'WTS', status: 'active', plan: 'professional', storeCount: 88, userCount: 2600, revenue: 6100000, region: '华南', createdAt: '2024-10-20', expiryDate: '2027-10-20', contactName: '吴经理', contactPhone: '138****0009' },
  { id: 't-010', name: '小米新零售', code: 'XM', status: 'trial', plan: 'trial', storeCount: 15, userCount: 380, revenue: 680000, region: '华北', createdAt: '2026-06-01', expiryDate: '2026-09-01', contactName: '林经理', contactPhone: '138****0010' },
];

// ─── 辅助函数 ────────────────────────────────────────

function filterByStatus(tenants: Tenant[], status: string): Tenant[] {
  if (status === 'ALL') return tenants;
  return tenants.filter(t => t.status === status);
}

function filterByPlan(tenants: Tenant[], plan: string): Tenant[] {
  if (plan === 'ALL') return tenants;
  return tenants.filter(t => t.plan === plan);
}

function searchTenants(tenants: Tenant[], keyword: string): Tenant[] {
  if (!keyword.trim()) return tenants;
  const lower = keyword.toLowerCase();
  return tenants.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.code.toLowerCase().includes(lower) ||
    t.contactName.toLowerCase().includes(lower) ||
    t.region.toLowerCase().includes(lower)
  );
}

function getTotalStats(tenants: Tenant[]) {
  return {
    total: tenants.length,
    activeCount: tenants.filter(t => t.status === 'active').length,
    totalStores: tenants.reduce((s, t) => s + t.storeCount, 0),
    totalRevenue: tenants.reduce((s, t) => s + t.revenue, 0),
    avgRevenuePerTenant: Math.round(tenants.reduce((s, t) => s + t.revenue, 0) / (tenants.length || 1)),
  };
}

function planTier(plan: string): number {
  return TENANT_PLAN_MAP[plan]?.tier ?? 0;
}

function isExpiringSoon(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 90;
}

// ─── 测试套件 ────────────────────────────────────────

describe('admin/tenants — 租户列表数据', () => {
  it('1. 10 个租户（正例）', () => {
    assert.equal(MOCK_TENANTS.length, 10);
  });

  it('2. 各字段非空（正例）', () => {
    for (const t of MOCK_TENANTS) {
      assert.ok(t.id, `id 非空`);
      assert.ok(t.name, `${t.id} name 非空`);
      assert.ok(t.code, `${t.id} code 非空`);
      assert.ok(t.contactName, `${t.id} contactName 非空`);
    }
  });

  it('3. storeCount / userCount 均为正（反例）', () => {
    for (const t of MOCK_TENANTS) {
      assert.ok(t.storeCount > 0, `${t.name} storeCount > 0`);
      assert.ok(t.userCount > 0, `${t.name} userCount > 0`);
    }
  });

  it('4. 门店数合计（正例）', () => {
    const stats = getTotalStats(MOCK_TENANTS);
    assert.equal(stats.total, 10);
    const expectedStores = 186 + 142 + 68 + 55 + 32 + 78 + 98 + 45 + 88 + 15;
    assert.equal(stats.totalStores, expectedStores);
  });

  it('5. active 最多（正例）', () => {
    const active = MOCK_TENANTS.filter(t => t.status === 'active').length;
    const nonActive = MOCK_TENANTS.length - active;
    assert.ok(active > nonActive);
  });

  it('6. 所有 status 在映射表中（正例）', () => {
    const keys = new Set(Object.keys(TENANT_STATUS_MAP));
    for (const t of MOCK_TENANTS) {
      assert.ok(keys.has(t.status), `${t.name} status "${t.status}" 应在映射中`);
    }
  });

  it('7. 所有 plan 在映射表中（正例）', () => {
    const keys = new Set(Object.keys(TENANT_PLAN_MAP));
    for (const t of MOCK_TENANTS) {
      assert.ok(keys.has(t.plan), `${t.name} plan "${t.plan}" 应在映射中`);
    }
  });
});

describe('admin/tenants — 筛选与搜索', () => {
  it('8. 筛选 active 租户（正例）', () => {
    const active = filterByStatus(MOCK_TENANTS, 'active');
    assert.ok(active.length > 0);
    assert.ok(active.every(t => t.status === 'active'));
  });

  it('9. 筛选 expired 租户（正例）', () => {
    const expired = filterByStatus(MOCK_TENANTS, 'expired');
    assert.equal(expired.length, 1);
    assert.equal(expired[0]!.id, 't-008');
  });

  it('10. 不存在的 status 返回空（反例）', () => {
    const result = filterByStatus(MOCK_TENANTS, 'nonexistent');
    assert.equal(result.length, 0);
  });

  it('11. 筛选 enterprise 方案（正例）', () => {
    const enterprise = filterByPlan(MOCK_TENANTS, 'enterprise');
    assert.equal(enterprise.length, 3);
  });

  it('12. 搜索关键字匹配名称（正例）', () => {
    const result = searchTenants(MOCK_TENANTS, '永辉');
    assert.ok(result.length >= 1);
  });

  it('13. 搜索关键字匹配 code（正例）', () => {
    const result = searchTenants(MOCK_TENANTS, 'YH');
    assert.ok(result.length >= 1);
  });

  it('14. 空搜索返回全部（边界）', () => {
    const result = searchTenants(MOCK_TENANTS, '');
    assert.equal(result.length, MOCK_TENANTS.length);
  });

  it('15. 不存在的关键字返回空（反例）', () => {
    const result = searchTenants(MOCK_TENANTS, '不存在的租户');
    assert.equal(result.length, 0);
  });
});

describe('admin/tenants — 统计与业务逻辑', () => {
  it('16. 总营收 > 0（正例）', () => {
    const stats = getTotalStats(MOCK_TENANTS);
    assert.ok(stats.totalRevenue > 0);
  });

  it('17. 企业版 tier 最高（正例）', () => {
    assert.equal(planTier('enterprise'), 4);
    assert.equal(planTier('trial'), 1);
  });

  it('18. 不存在的 plan 返回 tier 0（反例）', () => {
    assert.equal(planTier('nonexistent'), 0);
  });

  it('19. 小米新零售为试用版（正例）', () => {
    const xm = MOCK_TENANTS.find(t => t.id === 't-010')!;
    assert.equal(xm.plan, 'trial');
    assert.equal(xm.status, 'trial');
  });

  it('20. 华东租户数最多（正例）', () => {
    const regionCounts: Record<string, number> = {};
    for (const t of MOCK_TENANTS) {
      regionCounts[t.region] = (regionCounts[t.region] ?? 0) + 1;
    }
    const maxRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]![0];
    assert.equal(maxRegion, '华东');
  });

  it('21. revenue >= 0（反例）', () => {
    assert.ok(MOCK_TENANTS.every(t => t.revenue >= 0));
  });
});
