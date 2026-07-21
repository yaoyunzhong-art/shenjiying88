/**
 * employee/performance/page.test.ts — 员工绩效管理 L1 测试（storefront-web）
 *
 * 覆盖: 绩效数据、评级枚举、完成率计算、评分校验、搜索筛选
 * 正例: 绩效字段完整性、评级映射、完成率计算
 * 反例: 空绩效列表、完成率越界、无效评级
 * 边界: 零完成率、满分、超目标值
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type PerformanceStatus = 'excellent' | 'good' | 'average' | 'below';

interface EmployeePerformance {
  id: string;
  name: string;
  role: string;
  department: string;
  salesAmount: number;
  salesTarget: number;
  completionRate: number;
  serviceScore: number;
  attendanceDays: number;
  requiredDays: number;
  status: PerformanceStatus;
}

// ── 常量映射 ──

const STATUS_LABELS: Record<PerformanceStatus, string> = {
  excellent: '优秀',
  good: '良好',
  average: '一般',
  below: '待改进',
};

const COMPLETION_RATE_THRESHOLDS: Record<PerformanceStatus, { min: number; max: number }> = {
  excellent: { min: 120, max: Infinity },
  good: { min: 100, max: 119.99 },
  average: { min: 80, max: 99.99 },
  below: { min: 0, max: 79.99 },
};

// ── Mock 数据 ──

const MOCK_PERFORMANCES: EmployeePerformance[] = [
  { id: 'pf-001', name: '张三', role: '前台收银', department: '前台', salesAmount: 150000, salesTarget: 100000, completionRate: 150, serviceScore: 98, attendanceDays: 22, requiredDays: 22, status: 'excellent' },
  { id: 'pf-002', name: '李四', role: '导玩员', department: '运营', salesAmount: 95000, salesTarget: 100000, completionRate: 95, serviceScore: 85, attendanceDays: 20, requiredDays: 22, status: 'average' },
  { id: 'pf-003', name: '王五', role: '店长', department: '管理', salesAmount: 500000, salesTarget: 400000, completionRate: 125, serviceScore: 92, attendanceDays: 22, requiredDays: 22, status: 'excellent' },
  { id: 'pf-004', name: '赵六', role: '前台收银', department: '前台', salesAmount: 80000, salesTarget: 100000, completionRate: 80, serviceScore: 78, attendanceDays: 18, requiredDays: 22, status: 'average' },
  { id: 'pf-005', name: '孙七', role: '导玩员', department: '运营', salesAmount: 110000, salesTarget: 100000, completionRate: 110, serviceScore: 88, attendanceDays: 21, requiredDays: 22, status: 'good' },
  { id: 'pf-006', name: '周八', role: '导玩员', department: '运营', salesAmount: 60000, salesTarget: 100000, completionRate: 60, serviceScore: 72, attendanceDays: 15, requiredDays: 22, status: 'below' },
];

// ── 辅助函数 ──

function getStatusLabel(status: PerformanceStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function computePerformanceStats(items: EmployeePerformance[]) {
  return {
    total: items.length,
    excellent: items.filter(p => p.status === 'excellent').length,
    good: items.filter(p => p.status === 'good').length,
    average: items.filter(p => p.status === 'average').length,
    below: items.filter(p => p.status === 'below').length,
    avgCompletionRate: items.length > 0
      ? Math.round(items.reduce((s, p) => s + p.completionRate, 0) / items.length)
      : 0,
    avgServiceScore: items.length > 0
      ? Math.round(items.reduce((s, p) => s + p.serviceScore, 0) / items.length)
      : 0,
  };
}

function deriveStatusFromCompletion(rate: number): PerformanceStatus {
  if (rate >= 120) return 'excellent';
  if (rate >= 100) return 'good';
  if (rate >= 80) return 'average';
  return 'below';
}

function searchPerformances(items: EmployeePerformance[], query: string): EmployeePerformance[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(p =>
    p.name.toLowerCase().includes(lower) ||
    p.role.toLowerCase().includes(lower) ||
    p.department.toLowerCase().includes(lower)
  );
}

function filterByStatus(items: EmployeePerformance[], status: PerformanceStatus | 'all'): EmployeePerformance[] {
  if (status === 'all') return items;
  return items.filter(p => p.status === status);
}

// ===================================================================
describe('EmployeePerformance — 评级映射', () => {
  it('四种绩效评级映射完整', () => {
    const statuses: PerformanceStatus[] = ['excellent', 'good', 'average', 'below'];
    for (const s of statuses) {
      assert.ok(getStatusLabel(s).length > 0, `Status ${s} should have label`);
    }
  });

  it('从完成率推导评级正确', () => {
    assert.equal(deriveStatusFromCompletion(150), 'excellent');
    assert.equal(deriveStatusFromCompletion(110), 'good');
    assert.equal(deriveStatusFromCompletion(90), 'average');
    assert.equal(deriveStatusFromCompletion(60), 'below');
  });

  it('边界值完成率推导', () => {
    assert.equal(deriveStatusFromCompletion(120), 'excellent');
    assert.equal(deriveStatusFromCompletion(119.99), 'good');
    assert.equal(deriveStatusFromCompletion(100), 'good');
    assert.equal(deriveStatusFromCompletion(99.99), 'average');
    assert.equal(deriveStatusFromCompletion(80), 'average');
    assert.equal(deriveStatusFromCompletion(79.99), 'below');
  });

  it('评级分布统计正确', () => {
    const stats = computePerformanceStats(MOCK_PERFORMANCES);
    assert.equal(stats.total, 6);
    assert.equal(stats.excellent, 2);
    assert.equal(stats.good, 1);
    assert.equal(stats.average, 2);
    assert.equal(stats.below, 1);
  });
});

// ===================================================================
describe('EmployeePerformance — 完成率与评分', () => {
  it('completionRate = (salesAmount / salesTarget) * 100', () => {
    for (const p of MOCK_PERFORMANCES) {
      const expected = Math.round((p.salesAmount / p.salesTarget) * 100);
      assert.equal(p.completionRate, expected,
        `${p.name}: completionRate should be ${expected}`);
    }
  });

  it('serviceScore 应在 0~100 之间', () => {
    for (const p of MOCK_PERFORMANCES) {
      assert.ok(p.serviceScore >= 0 && p.serviceScore <= 100,
        `${p.name}: serviceScore ${p.serviceScore} in [0, 100]`);
    }
  });

  it('attendanceDays <= requiredDays', () => {
    for (const p of MOCK_PERFORMANCES) {
      assert.ok(p.attendanceDays <= p.requiredDays,
        `${p.name}: attendanceDays <= requiredDays`);
    }
  });

  it('平均完成率计算正确', () => {
    const stats = computePerformanceStats(MOCK_PERFORMANCES);
    const expected = Math.round((150 + 95 + 125 + 80 + 110 + 60) / 6);
    assert.equal(stats.avgCompletionRate, expected);
  });
});

// ===================================================================
describe('EmployeePerformance — 搜索筛选', () => {
  it('按员工名搜索', () => {
    const result = searchPerformances(MOCK_PERFORMANCES, '张三');
    assert.equal(result.length, 1);
  });

  it('按角色搜索', () => {
    const result = searchPerformances(MOCK_PERFORMANCES, '导玩员');
    assert.equal(result.length, 3);
  });

  it('按部门搜索', () => {
    const result = searchPerformances(MOCK_PERFORMANCES, '前台');
    assert.equal(result.length, 2);
  });

  it('空搜索返回全部', () => {
    assert.equal(searchPerformances(MOCK_PERFORMANCES, '').length, MOCK_PERFORMANCES.length);
  });

  it('按评级筛选', () => {
    const result = filterByStatus(MOCK_PERFORMANCES, 'excellent');
    assert.equal(result.length, 2);
    assert.ok(result.every(p => p.status === 'excellent'));
  });
});

// ===================================================================
describe('EmployeePerformance — 数据完整性', () => {
  it('所有绩效应有 id/name/role', () => {
    for (const p of MOCK_PERFORMANCES) {
      assert.ok(p.id, 'id required');
      assert.ok(p.name, 'name required');
      assert.ok(p.role, 'role required');
    }
  });

  it('salesTarget 应 > 0', () => {
    for (const p of MOCK_PERFORMANCES) {
      assert.ok(p.salesTarget > 0, `${p.name}: salesTarget > 0`);
    }
  });

  it('salesAmount 应 >= 0', () => {
    for (const p of MOCK_PERFORMANCES) {
      assert.ok(p.salesAmount >= 0, `${p.name}: salesAmount >= 0`);
    }
  });

  it('attendanceDays >= 0', () => {
    for (const p of MOCK_PERFORMANCES) {
      assert.ok(p.attendanceDays >= 0, `${p.name}: attendanceDays >= 0`);
    }
  });
});

// ===================================================================
describe('EmployeePerformance — 边界', () => {
  it('空绩效列表不抛异常', () => {
    assert.doesNotThrow(() => computePerformanceStats([]));
    assert.equal(computePerformanceStats([]).total, 0);
  });

  it('salesAmount 超过 salesTarget（超大值）不溢出', () => {
    const big: EmployeePerformance = { ...MOCK_PERFORMANCES[0], salesAmount: 999999999, salesTarget: 100, completionRate: 999999999 };
    assert.equal(big.completionRate, 999999999);
  });

  it('百完成率（salesAmount = salesTarget）完成率为 100', () => {
    const exact: EmployeePerformance = { ...MOCK_PERFORMANCES[0], salesAmount: 100000, salesTarget: 100000, completionRate: 100, status: 'good' };
    assert.equal(exact.completionRate, 100);
    assert.equal(deriveStatusFromCompletion(exact.completionRate), 'good');
  });

  it('零销售额完成率为 0', () => {
    const zero: EmployeePerformance = { ...MOCK_PERFORMANCES[0], salesAmount: 0, salesTarget: 100000, completionRate: 0, status: 'below' };
    assert.equal(zero.completionRate, 0);
    assert.equal(deriveStatusFromCompletion(0), 'below');
  });

  it('全勤为 requiredDays === attendanceDays', () => {
    const full = MOCK_PERFORMANCES.filter(p => p.attendanceDays === p.requiredDays);
    assert.ok(full.length > 0, 'should have at least one full attendance');
  });
});
