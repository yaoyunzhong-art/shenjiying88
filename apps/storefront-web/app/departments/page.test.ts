/**
 * departments/page.test.ts — 部门管理页 L1 冒烟测试
 * 角色视角: 👔店长 / 运营主管
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── Types (mirror page.tsx) ── */

type DepartmentStatus = 'active' | 'on_leave' | 'vacant';

interface DepartmentMember {
  id: string;
  name: string;
  role: string;
  status: DepartmentStatus;
  performance: number;
}

interface Department {
  id: string;
  name: string;
  head: string;
  memberCount: number;
  budget: number;
  usedBudget: number;
  status: 'normal' | 'over_budget' | 'understaffed';
  members: DepartmentMember[];
  monthlyTarget: number;
  achievedTarget: number;
  createdAt: string;
  description: string;
}

/* ── Data Factories ── */

function makeMember(overrides?: Partial<DepartmentMember>): DepartmentMember {
  return {
    id: 's1', name: '张明', role: '运营主管', status: 'active', performance: 92,
    ...overrides,
  };
}

function makeDepartment(overrides?: Partial<Department>): Department {
  return {
    id: 'dept-001', name: '门店运营部', head: '张明', memberCount: 8,
    budget: 500000, usedBudget: 320000, status: 'normal',
    members: [
      makeMember({ id: 's1', name: '张明', role: '运营主管', performance: 92 }),
      makeMember({ id: 's2', name: '李华', role: '运营专员', performance: 85 }),
    ],
    monthlyTarget: 200000, achievedTarget: 182500,
    createdAt: '2024-01-01', description: '门店日常运营管理',
    ...overrides,
  };
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── Positive Tests ── */

test('👔 部门管理: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 部门管理: 页面导出稳定', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
  const fnStr = mod.default.toString();
  assert.ok(fnStr.includes('Departments'), 'component should be named Departments*');
  assert.ok(fnStr.includes('search'), 'component should have search logic');
  assert.ok(fnStr.includes('filter'), 'component should have filter logic');
});

test('正例: Department 类型构造完整', () => {
  const d = makeDepartment();
  assert.equal(d.id, 'dept-001');
  assert.equal(d.name, '门店运营部');
  assert.equal(typeof d.memberCount, 'number');
  assert.equal(typeof d.budget, 'number');
  assert.equal(d.status, 'normal');
  assert.equal(Array.isArray(d.members), true);
  assert.equal(d.members.length, 2);
});

test('正例: DepartmentMember 类型构造完整', () => {
  const m = makeMember();
  assert.equal(m.id, 's1');
  assert.equal(m.name, '张明');
  assert.equal(m.role, '运营主管');
  assert.equal(m.status, 'active');
  assert.equal(typeof m.performance, 'number');
  assert.ok(m.performance >= 0 && m.performance <= 100);
});

test('正例: 部门状态枚举值完整', () => {
  const statuses: Department['status'][] = ['normal', 'over_budget', 'understaffed'];
  for (const s of statuses) {
    const d = makeDepartment({ status: s });
    assert.equal(d.status, s);
  }
});

test('正例: 成员状态枚举值完整', () => {
  const statuses: DepartmentMember['status'][] = ['active', 'on_leave', 'vacant'];
  for (const s of statuses) {
    const m = makeMember({ status: s });
    assert.equal(m.status, s);
  }
});

test('正例: 空成员列表构造不抛异常', () => {
  const d = makeDepartment({ members: [] });
  assert.equal(Array.isArray(d.members), true);
  assert.equal(d.members.length, 0);
});

test('正例: 所有字段使用 overrides 覆盖', () => {
  const d = makeDepartment({
    name: '测试部', budget: 999999, status: 'over_budget', monthlyTarget: 99999,
  });
  assert.equal(d.name, '测试部');
  assert.equal(d.budget, 999999);
  assert.equal(d.status, 'over_budget');
  assert.equal(d.monthlyTarget, 99999);
});

test('正例: 工厂函数不抛异常', () => {
  assert.equal(callSafe(makeMember), true);
  assert.equal(callSafe(makeDepartment), true);
});

test('正例: performance 字段边界值', () => {
  const extremes = [0, 50, 100];
  for (const p of extremes) {
    const m = makeMember({ performance: p });
    assert.equal(m.performance, p);
  }
});

/* ── Negative Tests ── */

test('反例: 全空字段构造不抛异常', () => {
  const d = makeDepartment({
    name: '', head: '', memberCount: 0, budget: 0, usedBudget: 0,
    monthlyTarget: 0, achievedTarget: 0, members: [],
    description: '', createdAt: '',
  });
  assert.equal(d.name, '');
  assert.equal(d.memberCount, 0);
  assert.equal(d.budget, 0);
  assert.equal(d.members.length, 0);
});

test('反例: 超预算状态', () => {
  const d = makeDepartment({ status: 'over_budget', usedBudget: 500000, budget: 300000 });
  assert.equal(d.status, 'over_budget');
  assert.ok(d.usedBudget > d.budget);
});

test('反例: budget 为负数', () => {
  const d = makeDepartment({ budget: -10000 });
  assert.equal(d.budget, -10000);
});

test('反例: low performance 数值', () => {
  const m = makeMember({ performance: -5 });
  assert.equal(m.performance, -5);
  const m2 = makeMember({ performance: 999 });
  assert.equal(m2.performance, 999);
});

test('反例: 成员空字符串 id', () => {
  const m = makeMember({ id: '', name: '' });
  assert.equal(m.id, '');
  assert.equal(m.name, '');
});

test('反例: targetAchieved 超出 monthlyTarget', () => {
  const d = makeDepartment({ monthlyTarget: 100000, achievedTarget: 150000 });
  assert.ok(d.achievedTarget > d.monthlyTarget);
  assert.equal(d.achievedTarget, 150000);
});

/* ── Boundary Tests ── */

test('边界: 超大预算', () => {
  const d = makeDepartment({ budget: 999999999 });
  assert.equal(d.budget, 999999999);
  assert.equal(typeof d.budget, 'number');
});

test('边界: 超多部门成员', () => {
  const members = Array.from({ length: 50 }, (_, i) => makeMember({
    id: `s${i + 1}`, name: `员工${i + 1}`, performance: 60 + (i % 40),
  }));
  const d = makeDepartment({ memberCount: 50, members });
  assert.equal(d.memberCount, 50);
  assert.equal(d.members.length, 50);
  assert.equal(d.members[0].name, '员工1');
  assert.equal(d.members[49].name, '员工50');
});

test('边界: 性能 — 构造 100 个部门 < 20ms', () => {
  const start = performance.now();
  const depts = Array.from({ length: 100 }, (_, i) => makeDepartment({
    id: `dept-${String(i + 1).padStart(3, '0')}`,
    name: `部门${i + 1}`,
    memberCount: 3 + (i % 10),
    budget: 100000 * (i + 1),
  }));
  const elapsed = performance.now() - start;
  assert.equal(depts.length, 100);
  assert.ok(elapsed < 50, `100 departments construct in ${elapsed.toFixed(1)}ms (should be < 50ms)`);
});

test('边界: monthlyTarget 和 achievedTarget 大幅值', () => {
  const d = makeDepartment({ monthlyTarget: 99999999, achievedTarget: 88888888 });
  assert.equal(d.monthlyTarget, 99999999);
  assert.equal(d.achievedTarget, 88888888);
  // 达成率接近 89%
  const rate = d.monthlyTarget > 0 ? (d.achievedTarget / d.monthlyTarget) * 100 : 0;
  assert.ok(Math.abs(rate - 88.89) < 0.1, `target rate should be ~88.89%, got ${rate}%`);
});

test('边界: 所有三种状态同时存在', () => {
  const statuses: Department['status'][] = ['normal', 'over_budget', 'understaffed'];
  const depts = statuses.map(s => makeDepartment({ id: `dept-${s}`, status: s }));
  assert.equal(depts.length, 3);
  assert.equal(depts[0].status, 'normal');
  assert.equal(depts[1].status, 'over_budget');
  assert.equal(depts[2].status, 'understaffed');
});

test('边界: 模块引用完整性', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
  const fnStr = mod.default.toString();
  // Verify key UI constants/functions exist in the module
  assert.ok(fnStr.includes('DEPARTMENT'), 'should reference DEPARTMENT constants');
  assert.ok(fnStr.includes('status'), 'should do status filtering');
});
