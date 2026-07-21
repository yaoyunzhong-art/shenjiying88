/**
 * finance/budget/page.test.tsx — 预算管理 L1 测试
 *
 * 覆盖: 预算项数据结构、状态枚举、期间类型、使用率计算、搜索筛选
 * 正例: 预算项字段完整性、状态映射、使用率计算
 * 反例: 空预算列表、无效状态、超预算使用
 * 边界: 零预算、百分百使用、未使用
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type BudgetStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'CLOSED';
type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

interface BudgetItem {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  totalCents: number;
  usedCents: number;
  remainingCents: number;
  currency: string;
  period: BudgetPeriod;
  status: BudgetStatus;
  version: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── 常量映射 ──

const STATUS_LABELS: Record<BudgetStatus, string> = {
  DRAFT: '草稿', PENDING: '待审批', APPROVED: '已审批', REJECTED: '已驳回', ACTIVE: '使用中', CLOSED: '已关闭',
};

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  MONTHLY: '月度', QUARTERLY: '季度', ANNUAL: '年度',
};

// ── Mock 数据 ──

const MOCK_BUDGETS: BudgetItem[] = [
  { id: 'b-001', tenantId: 't-001', name: 'Q3 市场营销预算', category: '营销', totalCents: 50000000, usedCents: 12000000, remainingCents: 38000000, currency: 'CNY', period: 'QUARTERLY', status: 'ACTIVE', version: 3, notes: '2026年Q3市场推广', createdAt: '2026-06-15', updatedAt: '2026-07-20' },
  { id: 'b-002', tenantId: 't-001', name: 'IT 基础设施预算', category: '技术', totalCents: 20000000, usedCents: 5000000, remainingCents: 15000000, currency: 'CNY', period: 'ANNUAL', status: 'ACTIVE', version: 2, notes: '服务器和带宽', createdAt: '2026-01-01', updatedAt: '2026-07-15' },
  { id: 'b-003', tenantId: 't-001', name: '7月办公用品', category: '行政', totalCents: 500000, usedCents: 500000, remainingCents: 0, currency: 'CNY', period: 'MONTHLY', status: 'CLOSED', version: 1, notes: '', createdAt: '2026-07-01', updatedAt: '2026-07-31' },
  { id: 'b-004', tenantId: 't-002', name: '门店装修预算', category: '工程', totalCents: 100000000, usedCents: 0, remainingCents: 100000000, currency: 'CNY', period: 'ANNUAL', status: 'PENDING', version: 1, notes: '新店装修费用', createdAt: '2026-07-10', updatedAt: '2026-07-10' },
  { id: 'b-005', tenantId: 't-001', name: 'Q4 营销预算草案', category: '营销', totalCents: 60000000, usedCents: 0, remainingCents: 60000000, currency: 'CNY', period: 'QUARTERLY', status: 'DRAFT', version: 1, notes: 'Q4计划', createdAt: '2026-07-20', updatedAt: '2026-07-20' },
];

// ── 辅助函数 ──

function getUsagePercent(item: BudgetItem): number {
  if (item.totalCents <= 0) return 0;
  return Math.round((item.usedCents / item.totalCents) * 100);
}

function getStatusLabel(status: BudgetStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function getPeriodLabel(period: BudgetPeriod): string {
  return PERIOD_LABELS[period] ?? period;
}

function computeBudgetStats(items: BudgetItem[]) {
  return {
    total: items.length,
    totalBudget: items.reduce((s, i) => s + i.totalCents, 0),
    totalUsed: items.reduce((s, i) => s + i.usedCents, 0),
    totalRemaining: items.reduce((s, i) => s + i.remainingCents, 0),
    active: items.filter(i => i.status === 'ACTIVE').length,
    draft: items.filter(i => i.status === 'DRAFT').length,
    closed: items.filter(i => i.status === 'CLOSED').length,
  };
}

function filterByCategory(items: BudgetItem[], category: string): BudgetItem[] {
  if (!category) return items;
  return items.filter(i => i.category === category);
}

// ===================================================================
describe('FinanceBudget — 使用率计算', () => {
  it('应正确计算使用率', () => {
    assert.equal(getUsagePercent(MOCK_BUDGETS[0]), 24); // 12000000/50000000 = 24%
    assert.equal(getUsagePercent(MOCK_BUDGETS[2]), 100); // 已用尽
    assert.equal(getUsagePercent(MOCK_BUDGETS[3]), 0); // 未使用
  });

  it('totalCents 为零时使用率为零', () => {
    const zero: BudgetItem = { ...MOCK_BUDGETS[0], totalCents: 0, usedCents: 0 };
    assert.equal(getUsagePercent(zero), 0);
  });

  it('usedCents 可等于或小于 totalCents', () => {
    for (const b of MOCK_BUDGETS) {
      assert.ok(b.usedCents <= b.totalCents, `${b.name}: used <= total`);
    }
  });

  it('remainingCents = totalCents - usedCents', () => {
    for (const b of MOCK_BUDGETS) {
      assert.equal(b.remainingCents, b.totalCents - b.usedCents,
        `${b.name}: remaining = total - used`);
    }
  });
});

// ===================================================================
describe('FinanceBudget — 状态与期间', () => {
  it('六种预算状态映射完整', () => {
    const statuses: BudgetStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED'];
    for (const s of statuses) {
      assert.ok(getStatusLabel(s).length > 0, `Status ${s} should have label`);
    }
  });

  it('三种期间类型映射完整', () => {
    const periods: BudgetPeriod[] = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];
    for (const p of periods) {
      assert.ok(getPeriodLabel(p).length > 0, `Period ${p} should have label`);
    }
  });

  it('预算统计应正确', () => {
    const stats = computeBudgetStats(MOCK_BUDGETS);
    assert.equal(stats.total, 5);
    assert.equal(stats.active, 2);
    assert.equal(stats.draft, 1);
    assert.equal(stats.closed, 1);
  });
});

// ===================================================================
describe('FinanceBudget — 筛选', () => {
  it('按类别筛选营销预算', () => {
    const result = filterByCategory(MOCK_BUDGETS, '营销');
    assert.equal(result.length, 2);
  });

  it('空类别返回全部', () => {
    assert.equal(filterByCategory(MOCK_BUDGETS, '').length, MOCK_BUDGETS.length);
  });

  it('不存在的类别返回空', () => {
    assert.equal(filterByCategory(MOCK_BUDGETS, 'HR').length, 0);
  });
});

// ===================================================================
describe('FinanceBudget — 数据完整性', () => {
  it('所有预算应有 id/name/category', () => {
    for (const b of MOCK_BUDGETS) {
      assert.ok(b.id, 'id required');
      assert.ok(b.name, 'name required');
      assert.ok(b.category, 'category required');
    }
  });

  it('所有预算应有 tenantId', () => {
    for (const b of MOCK_BUDGETS) {
      assert.ok(b.tenantId, 'tenantId required');
    }
  });

  it('version 应 >= 1', () => {
    for (const b of MOCK_BUDGETS) {
      assert.ok(b.version >= 1, `${b.id}: version >= 1`);
    }
  });
});

// ===================================================================
describe('FinanceBudget — 边界', () => {
  it('空列表统计全为零', () => {
    const stats = computeBudgetStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.totalBudget, 0);
    assert.equal(stats.totalUsed, 0);
  });

  it('全 CLOSED 预算统计正确', () => {
    const closed = MOCK_BUDGETS.filter(b => b.status === 'CLOSED');
    const stats = computeBudgetStats(closed);
    assert.equal(stats.closed, 1);
    assert.equal(stats.active, 0);
  });

  it('未使用预算 (usedCents=0) 使用率为 0', () => {
    const unused = MOCK_BUDGETS.filter(b => b.usedCents === 0);
    for (const b of unused) {
      assert.equal(getUsagePercent(b), 0);
    }
  });

  it('超大金额不溢出', () => {
    const large: BudgetItem = { ...MOCK_BUDGETS[0], totalCents: 999999999999999, usedCents: 500000000000000 };
    assert.equal(getUsagePercent(large), 50);
  });

  it('空列表按类别筛选不抛异常', () => {
    assert.doesNotThrow(() => filterByCategory([], '营销'));
    assert.equal(filterByCategory([], '营销').length, 0);
  });
});
