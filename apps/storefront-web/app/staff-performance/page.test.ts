/**
 * 员工绩效看板页 — 纯逻辑单元测试 (node:test, no DOM)
 * 验证数据层逻辑: 统计计算、筛选、数据结构完整性
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================
// Shared types (re-imported locally to avoid DOM dependencies)
// ============================================================

interface StaffPerformanceRecord {
  id: string;
  name: string;
  role: string;
  salesAmount: number;
  salesTargetRate: number;
  serviceScore: number;
  attendanceDays: number;
  requiredDays: number;
  avgOrderValue: number;
  conversionRate: number;
  complaints: number;
  newMembers: number;
  grade: 'A' | 'B' | 'C' | 'D';
  joinDate: string;
  remark?: string;
}

// ============================================================
// Data-level helpers (mirrors the client component logic)
// ============================================================

interface StaffStats {
  total: number;
  totalSales: number;
  avgServiceScore: number;
  topPerformer: string;
  aGradeCount: number;
  belowTargetCount: number;
}

function computeStats(records: StaffPerformanceRecord[]): StaffStats {
  const total = records.length;
  const totalSales = records.reduce((s, r) => s + r.salesAmount, 0);
  const avgServiceScore = total > 0
    ? Math.round((records.reduce((s, r) => s + r.serviceScore, 0) / total) * 10) / 10
    : 0;
  const top = [...records].sort((a, b) => b.salesAmount - a.salesAmount)[0];
  return {
    total,
    totalSales,
    avgServiceScore,
    topPerformer: top?.name ?? '-',
    aGradeCount: records.filter(r => r.grade === 'A').length,
    belowTargetCount: records.filter(r => r.salesTargetRate < 100).length,
  };
}

// ============================================================
// Mock data
// ============================================================

const sampleRecords: StaffPerformanceRecord[] = [
  {
    id: 'sp-001', name: '张伟', role: '高级导购',
    salesAmount: 85600, salesTargetRate: 142, serviceScore: 4.9,
    attendanceDays: 24, requiredDays: 26, avgOrderValue: 580,
    conversionRate: 38, complaints: 0, newMembers: 18,
    grade: 'A', joinDate: '2024-03-15',
  },
  {
    id: 'sp-002', name: '李娜', role: '导购',
    salesAmount: 62300, salesTargetRate: 115, serviceScore: 4.7,
    attendanceDays: 25, requiredDays: 26, avgOrderValue: 420,
    conversionRate: 32, complaints: 1, newMembers: 12,
    grade: 'A', joinDate: '2024-06-01',
  },
  {
    id: 'sp-003', name: '王强', role: '导购',
    salesAmount: 42100, salesTargetRate: 93, serviceScore: 4.3,
    attendanceDays: 22, requiredDays: 26, avgOrderValue: 350,
    conversionRate: 28, complaints: 2, newMembers: 8,
    grade: 'B', joinDate: '2024-09-10',
  },
  {
    id: 'sp-004', name: '赵敏', role: '实习导购',
    salesAmount: 28500, salesTargetRate: 71, serviceScore: 4.5,
    attendanceDays: 20, requiredDays: 26, avgOrderValue: 290,
    conversionRate: 22, complaints: 0, newMembers: 5,
    grade: 'C', joinDate: '2025-01-20',
  },
  {
    id: 'sp-005', name: '吴刚', role: '实习导购',
    salesAmount: 19200, salesTargetRate: 48, serviceScore: 3.8,
    attendanceDays: 18, requiredDays: 26, avgOrderValue: 220,
    conversionRate: 18, complaints: 1, newMembers: 3,
    grade: 'D', joinDate: '2025-03-01',
  },
];

// ============================================================
// Tests
// ============================================================

describe('StaffPerformance - 统计计算逻辑', () => {
  it('computeStats 计算总人数', () => {
    const stats = computeStats(sampleRecords);
    assert.equal(stats.total, 5);
  });

  it('computeStats 计算总销售额', () => {
    const stats = computeStats(sampleRecords);
    const expected = 85600 + 62300 + 42100 + 28500 + 19200;
    assert.equal(stats.totalSales, expected);
  });

  it('computeStats 计算平均服务评分', () => {
    const stats = computeStats(sampleRecords);
    assert.equal(stats.avgServiceScore, 4.4); // (4.9+4.7+4.3+4.5+3.8)/5 = 4.44 -> 4.4
  });

  it('computeStats 识别最佳员工（销售额最高）', () => {
    const stats = computeStats(sampleRecords);
    assert.equal(stats.topPerformer, '张伟');
  });

  it('computeStats 统计 A 级员工数量', () => {
    const stats = computeStats(sampleRecords);
    assert.equal(stats.aGradeCount, 2); // 张伟、李娜
  });

  it('computeStats 统计未达标员工数', () => {
    const stats = computeStats(sampleRecords);
    assert.equal(stats.belowTargetCount, 3); // 王强 93%, 赵敏 71%, 吴刚 48%
  });

  it('空数据统计', () => {
    const stats = computeStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.totalSales, 0);
    assert.equal(stats.avgServiceScore, 0);
    assert.equal(stats.topPerformer, '-');
    assert.equal(stats.aGradeCount, 0);
    assert.equal(stats.belowTargetCount, 0);
  });

  it('单条数据统计', () => {
    const stats = computeStats([sampleRecords[0]]);
    assert.equal(stats.total, 1);
    assert.equal(stats.totalSales, 85600);
    assert.equal(stats.avgServiceScore, 4.9);
    assert.equal(stats.topPerformer, '张伟');
  });
});

describe('StaffPerformance - 数据结构完整性', () => {
  it('每条记录包含必填字段', () => {
    for (const r of sampleRecords) {
      assert.ok(r.id, 'id 不能为空');
      assert.ok(r.name, 'name 不能为空');
      assert.ok(r.role, 'role 不能为空');
      assert.equal(typeof r.salesAmount, 'number');
      assert.equal(typeof r.serviceScore, 'number');
      assert.equal(typeof r.conversionRate, 'number');
      assert.ok(['A', 'B', 'C', 'D'].includes(r.grade), `grade 必须为 A/B/C/D，实际: ${r.grade}`);
    }
  });

  it('服务评分范围 1-5', () => {
    for (const r of sampleRecords) {
      assert.ok(r.serviceScore >= 1 && r.serviceScore <= 5, `评分应在 1-5 之间: ${r.serviceScore}`);
    }
  });

  it('完成率 >= 0', () => {
    for (const r of sampleRecords) {
      assert.ok(r.salesTargetRate >= 0, `完成率应 >= 0: ${r.salesTargetRate}`);
    }
  });
});

describe('StaffPerformance - 筛选逻辑', () => {
  it('筛选 A 级员工', () => {
    const result = sampleRecords.filter(r => r.grade === 'A');
    assert.equal(result.length, 2);
    assert.ok(result.every(r => r.grade === 'A'));
  });

  it('筛选 D 级员工', () => {
    const result = sampleRecords.filter(r => r.grade === 'D');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '吴刚');
  });

  it('筛选未达标员工', () => {
    const result = sampleRecords.filter(r => r.salesTargetRate < 100);
    assert.equal(result.length, 3);
    assert.ok(result.every(r => r.salesTargetRate < 100));
  });

  it('筛选达标员工', () => {
    const result = sampleRecords.filter(r => r.salesTargetRate >= 100);
    assert.equal(result.length, 2);
    assert.ok(result.every(r => r.salesTargetRate >= 100));
  });
});

describe('StaffPerformance - 排序逻辑', () => {
  it('按销售额降序排列', () => {
    const sorted = [...sampleRecords].sort((a, b) => b.salesAmount - a.salesAmount);
    assert.equal(sorted[0].name, '张伟');
    assert.equal(sorted[4].name, '吴刚');
    assert.ok(sorted[0].salesAmount >= sorted[1].salesAmount);
  });

  it('按服务评分降序排列', () => {
    const sorted = [...sampleRecords].sort((a, b) => b.serviceScore - a.serviceScore);
    assert.equal(sorted[0].name, '张伟');
    assert.equal(sorted[0].serviceScore, 4.9);
  });
});

describe('StaffPerformance - 边界数据', () => {
  it('销售额为 0', () => {
    const zeroRecord: StaffPerformanceRecord = {
      id: 'sp-999', name: '新人', role: '实习导购',
      salesAmount: 0, salesTargetRate: 0, serviceScore: 0,
      attendanceDays: 0, requiredDays: 26, avgOrderValue: 0,
      conversionRate: 0, complaints: 0, newMembers: 0,
      grade: 'D', joinDate: '2026-07-10',
    };
    const stats = computeStats([...sampleRecords, zeroRecord]);
    assert.equal(stats.total, 6);
    assert.equal(stats.belowTargetCount, 4);
  });

  it('满分服务评分', () => {
    const perfectRecord: StaffPerformanceRecord = {
      id: 'sp-998', name: '完美员工', role: '高级导购',
      salesAmount: 100000, salesTargetRate: 200, serviceScore: 5.0,
      attendanceDays: 26, requiredDays: 26, avgOrderValue: 800,
      conversionRate: 50, complaints: 0, newMembers: 30,
      grade: 'A', joinDate: '2023-01-01',
    };
    const stats = computeStats([...sampleRecords, perfectRecord]);
    assert.equal(stats.aGradeCount, 3);
    assert.equal(stats.topPerformer, '完美员工');
  });
});
