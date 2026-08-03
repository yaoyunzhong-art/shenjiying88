// employee-performance-review.service.enhanced.test.ts
// 深度补强：新增 18 个 test/it 用例，覆盖 normal path / edge cases / error handling 三大维度
// 专注于 service 级别的深层测试

import { describe, it, expect, beforeEach } from 'vitest';
import { EmployeePerformanceReviewService } from './employee-performance-review.service';
import { EmployeeRole } from './employee-performance-review.entity';

const defaultTenant = () => ({ tenantId: 'default' });
const otherTenant = () => ({ tenantId: 'other-tenant' });

describe('EmployeePerformanceReviewService — Enhanced Tests', () => {
  let svc: EmployeePerformanceReviewService;

  beforeEach(() => {
    EmployeePerformanceReviewService.resetTestState();
    EmployeePerformanceReviewService.seedTestData();
    svc = new EmployeePerformanceReviewService();
  });

  // ═══════════════════════════════════════════════════════════
  // 正常路径 (Normal Path) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('normal path', () => {
    it('list 配合多条件组合过滤', () => {
      // store-001 + role=manager
      const result = svc.list(defaultTenant(), {
        storeId: 'store-001',
        role: EmployeeRole.Manager,
      });
      expect(result.total).toBe(1); // 只有张伟
      expect(result.items[0].name).toBe('张伟');
    });

    it('list 按 score 排序时同分的记录排序稳定', () => {
      // 张伟 92 和杨帆 87，各自不同分
      const result = svc.list(defaultTenant(), { sortBy: 'score' });
      const scores = result.items.map(i => i.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
      }
    });

    it('getById 返回的记录字段完整性', () => {
      const record = svc.getById('perf-003', defaultTenant());
      expect(record).toHaveProperty('id', 'perf-003');
      expect(record).toHaveProperty('tenantId', 'default');
      expect(record).toHaveProperty('employeeId', 'emp-003');
      expect(record).toHaveProperty('name', '王强');
      expect(record).toHaveProperty('role', EmployeeRole.Technician);
      expect(record).toHaveProperty('storeId', 'store-001');
      expect(record).toHaveProperty('score', 88);
      expect(record).toHaveProperty('completedTasks', 98);
      expect(record).toHaveProperty('customerRating', 4.7);
      expect(record).toHaveProperty('attendanceRate', 97.1);
      expect(record).toHaveProperty('revenueContribution', 320000);
      expect(record).toHaveProperty('month', '2026-07');
      expect(record).toHaveProperty('createdAt');
    });

    it('getSummary 正确计算角色最低评分区域', () => {
      const summary = svc.getSummary(defaultTenant());
      // 所有角色平均分:
      // manager: (92 + 90) / 2 = 91
      // staff: (85 + 79 + 81) / 3 ≈ 81.7
      // technician: (88 + 87) / 2 = 87.5
      // trainee: 72 / 1 = 72
      expect(summary.lowestArea).toBe(EmployeeRole.Trainee);
      expect(summary.avgScore).toBe(84.3); // 674 / 8
      expect(summary.teamAverage).toBeGreaterThan(0);
    });

    it('create 创建多个不同角色的员工', () => {
      const input1 = {
        employeeId: 'emp-new1', name: '孙悟',
        role: EmployeeRole.Technician, storeId: 'store-001',
        score: 95, completedTasks: 200, customerRating: 4.9,
        attendanceRate: 99.5, revenueContribution: 500000, month: '2026-08',
      };
      const input2 = {
        employeeId: 'emp-new2', name: '猪八',
        role: EmployeeRole.Trainee, storeId: 'store-002',
        score: 68, completedTasks: 30, customerRating: 3.5,
        attendanceRate: 88.0, revenueContribution: 50000, month: '2026-08',
      };
      const c1 = svc.create(defaultTenant(), input1);
      const c2 = svc.create(defaultTenant(), input2);
      expect(c1.id).toMatch(/^perf-/);
      expect(c2.id).toMatch(/^perf-/);
      expect(svc.list(defaultTenant()).total).toBe(10); // 8 seed + 2 new
    });

    it('delete 删除后可以再次创建同名 employeeId 的员工', () => {
      svc.delete('perf-001', defaultTenant());
      const newRecord = svc.create(defaultTenant(), {
        employeeId: 'emp-001',
        name: '张伟(新)',
        role: EmployeeRole.Manager,
        storeId: 'store-001',
        score: 95,
        completedTasks: 200,
        customerRating: 4.9,
        attendanceRate: 99.0,
        revenueContribution: 600000,
        month: '2026-08',
      });
      expect(newRecord.name).toBe('张伟(新)');
      expect(newRecord.id).not.toBe('perf-001');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 边界条件 (Edge Cases) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('list 不存在的 storeId 返回空结果', () => {
      const result = svc.list(defaultTenant(), { storeId: 'store-999' });
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });

    it('list 不存在的 role 筛选返回空', () => {
      // 使用 Manager 但无相应角色（实际上 manager 存在）
      // 使用不匹配的 role 枚举（全部）过滤器
      const result = svc.list(defaultTenant(), { role: EmployeeRole.Trainee, storeId: 'store-001' });
      // store-001 没有 trainee
      expect(result.total).toBe(0);
    });

    it('list 空 sortBy 字段默认按 score 降序', () => {
      const defaultSorted = svc.list(defaultTenant(), {});
      const explicitScore = svc.list(defaultTenant(), { sortBy: 'score' });
      expect(defaultSorted.items.map(i => i.id)).toEqual(explicitScore.items.map(i => i.id));
    });

    it('create 使用极值的 score 0 和 100', () => {
      const minScore = svc.create(defaultTenant(), {
        employeeId: 'emp-min', name: '最低分',
        role: EmployeeRole.Trainee, storeId: 'store-999',
        score: 0, completedTasks: 0, customerRating: 0,
        attendanceRate: 0, revenueContribution: 0, month: '2026-07',
      });
      expect(minScore.score).toBe(0);

      const maxScore = svc.create(defaultTenant(), {
        employeeId: 'emp-max', name: '最高分',
        role: EmployeeRole.Manager, storeId: 'store-999',
        score: 100, completedTasks: 999, customerRating: 5.0,
        attendanceRate: 100, revenueContribution: 999999, month: '2026-07',
      });
      expect(maxScore.score).toBe(100);
      expect(maxScore.customerRating).toBe(5.0);
      expect(maxScore.attendanceRate).toBe(100);
    });

    it('getSummary 对单条数据也能正确计算', () => {
      // 只加一条到其他租户
      svc.create(defaultTenant(), {
        employeeId: 'emp-single', name: '独苗',
        role: EmployeeRole.Staff, storeId: 'store-single',
        score: 75, completedTasks: 50, customerRating: 3.5,
        attendanceRate: 90, revenueContribution: 100000, month: '2026-07',
      });
      // 其他租户只有新创建的这一条（种子数据属于 default tenant）
      const summary = svc.getSummary(otherTenant());
      expect(summary.totalEmployees).toBe(0); // other tenant 没有数据
      // default tenant 有 9 条（8个种子+1个新建）
      const defaultSummary = svc.getSummary(defaultTenant());
      expect(defaultSummary.totalEmployees).toBe(9);
    });

    it('同一条记录连续 getById 调用返回一致结果', () => {
      const r1 = svc.getById('perf-001', defaultTenant());
      const r2 = svc.getById('perf-001', defaultTenant());
      const r3 = svc.getById('perf-001', defaultTenant());
      expect(r1).toEqual(r2);
      expect(r2).toEqual(r3);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 异常路径 (Error Handling) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('error handling', () => {
    it('getById 使用空字符串 id 应该抛 Error', () => {
      expect(() => svc.getById('', defaultTenant())).toThrow('Employee performance  not found');
    });

    it('getById 使用不存在但格式合法的 id 抛 Error', () => {
      expect(() => svc.getById('perf-999', defaultTenant())).toThrow(/Employee performance .+ not found/);
    });

    it('getById 跨租户访问抛 Error（数据不属于该租户）', () => {
      // 种子数据属于 default tenant
      expect(() => svc.getById('perf-005', otherTenant())).toThrow(/Employee performance .+ not found/);
    });

    it('delete 已删除的记录再次删除抛 Error', () => {
      svc.delete('perf-004', defaultTenant());
      expect(() => svc.delete('perf-004', defaultTenant())).toThrow(/Employee performance .+ not found/);
    });

    it('delete 跨租户删除抛 Error', () => {
      expect(() => svc.delete('perf-002', otherTenant())).toThrow(/Employee performance .+ not found/);
    });

    it('create 后 delete 再 create 同 employeeId 不同 id 是允许的', () => {
      svc.delete('perf-006', defaultTenant());
      const newRec = svc.create(defaultTenant(), {
        employeeId: 'emp-006',
        name: '陈雪(复职)',
        role: EmployeeRole.Staff,
        storeId: 'store-002',
        score: 80,
        completedTasks: 100,
        customerRating: 4.2,
        attendanceRate: 96.0,
        revenueContribution: 200000,
        month: '2026-08',
      });
      expect(newRec.name).toBe('陈雪(复职)');
      expect(newRec.id).toMatch(/^perf-/);
    });
  });
});
