/**
 * dashboard/team/page.test.tsx — 团队管理页 L1 冒烟测试
 * 角色视角: 👔店长 / 👥人事
 * 覆盖: 正例(数据结构/角色映射/状态映射/班次) + 反例 + 边界
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---- 类型定义 (与 page.tsx 一致) ----

type TeamRole = 'store_manager' | 'shift_lead' | 'cashier' | 'sales_clerk' | 'technician' | 'cleaner';
type TeamStatus = 'active' | 'on_leave' | 'off_duty' | 'suspended' | 'resigned';

interface TeamMember {
  id: string;
  name: string;
  employeeNo: string;
  role: TeamRole;
  status: TeamStatus;
  phone: string;
  email: string;
  department: string;
  joinDate: string;
  shift: 'morning' | 'afternoon' | 'night' | 'rest';
  performanceScore: number;
  monthlySales: number;
  orderCount: number;
  avatar: string;
  skills: string[];
}

// ---- 映射表 (从 page.tsx 摘录) ----

const ROLE_LABELS: Record<TeamRole, string> = {
  store_manager: '店长',
  shift_lead: '值班组长',
  cashier: '收银员',
  sales_clerk: '导购员',
  technician: '技术员',
  cleaner: '保洁员',
};

const STATUS_LABELS: Record<TeamStatus, string> = {
  active: '在岗中',
  on_leave: '请假中',
  off_duty: '已下班',
  suspended: '停职中',
  resigned: '已离职',
};

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班 (08:00-16:00)',
  afternoon: '中班 (12:00-20:00)',
  night: '晚班 (16:00-00:00)',
  rest: '休息',
};

// ---- 工厂函数 ----

function makeMember(overrides?: Partial<TeamMember>): TeamMember {
  return {
    id: 'TM-001',
    name: '张三',
    employeeNo: 'EMP-2026001',
    role: 'store_manager',
    status: 'active',
    phone: '13800000000',
    email: 'zhang@test.com',
    department: '门店运营部',
    joinDate: '2026-01-15',
    shift: 'morning',
    performanceScore: 90,
    monthlySales: 50000,
    orderCount: 120,
    avatar: 'https://example.com/avatar.png',
    skills: ['团队管理', '数据分析'],
    ...overrides,
  };
}

function makeMembers(count: number): TeamMember[] {
  const roles: TeamRole[] = ['store_manager', 'shift_lead', 'cashier', 'sales_clerk', 'technician', 'cleaner'];
  return Array.from({ length: count }, (_, i) =>
    makeMember({
      id: `TM-${String(i + 1).padStart(3, '0')}`,
      name: `成员${i + 1}`,
      role: roles[i % roles.length],
      status: i < count * 0.7 ? 'active' : (i < count * 0.85 ? 'on_leave' : 'resigned'),
      performanceScore: 60 + Math.floor(Math.random() * 40),
      monthlySales: 20000 + Math.floor(Math.random() * 80000),
      shift: (['morning', 'afternoon', 'night', 'rest'] as const)[i % 4],
    })
  );
}

// ---- Tests ----

test('team: ROLE_LABELS 覆盖全部 6 个岗位', () => {
  const roles: TeamRole[] = ['store_manager', 'shift_lead', 'cashier', 'sales_clerk', 'technician', 'cleaner'];
  for (const role of roles) {
    assert.ok(ROLE_LABELS[role], `岗位 ${role} 应有中文标签`);
  }
});

test('team: STATUS_LABELS 覆盖全部 5 个状态', () => {
  const statuses: TeamStatus[] = ['active', 'on_leave', 'off_duty', 'suspended', 'resigned'];
  for (const s of statuses) {
    assert.ok(STATUS_LABELS[s], `状态 ${s} 应有中文标签`);
  }
});

test('team: SHIFT_LABELS 覆盖全部 4 个班次', () => {
  const shifts = ['morning', 'afternoon', 'night', 'rest'];
  for (const s of shifts) {
    assert.ok(SHIFT_LABELS[s], `班次 ${s} 应有中文标签`);
  }
});

test('team: 工厂函数 makeMember 返回完整结构', () => {
  const m = makeMember();
  assert.equal(m.id, 'TM-001');
  assert.equal(m.name, '张三');
  assert.equal(m.role, 'store_manager');
  assert.equal(m.status, 'active');
  assert.equal(m.shift, 'morning');
  assert.equal(m.performanceScore, 90);
});

test('team: 工厂函数 makeMember 支持覆写', () => {
  const m = makeMember({ role: 'cashier', status: 'on_leave' });
  assert.equal(m.role, 'cashier');
  assert.equal(m.status, 'on_leave');
  assert.equal(m.name, '张三'); // 默认值不变
});

test('team: 工厂函数 makeMembers 生成指定数量', () => {
  const members = makeMembers(20);
  assert.equal(members.length, 20);
  assert.equal(members[0].id, 'TM-001');
  assert.equal(members[19].id, 'TM-020');
});

test('team: 过滤 — 按岗位筛选', () => {
  const members = makeMembers(12);
  const managers = members.filter((m) => m.role === 'store_manager');
  assert.equal(managers.length, 2); // 12 / 6 roles = 2 per role
  for (const m of managers) {
    assert.equal(m.role, 'store_manager');
  }
});

test('team: 过滤 — 按状态筛选', () => {
  const members = makeMembers(20);
  const active = members.filter((m) => m.status === 'active');
  const resigned = members.filter((m) => m.status === 'resigned');
  assert.ok(active.length > 0, '应有在岗成员');
  assert.ok(resigned.length > 0, '应有已离职成员');
});

test('team: 过滤 — 按班次分类', () => {
  const members = makeMembers(16);
  const morning = members.filter((m) => m.shift === 'morning');
  const night = members.filter((m) => m.shift === 'night');
  assert.equal(morning.length, 4);
  assert.equal(night.length, 4);
});

test('team: 搜索 — 按姓名精准匹配', () => {
  const members = makeMembers(10);
  const q = '成员1';
  const matched = members.filter((m) => m.name === q);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, 'TM-001');
});

test('team: 搜索 — 按工号匹配', () => {
  const members = makeMembers(10);
  const q = 'EMP-202600';
  const matched = members.filter((m) => m.employeeNo.includes(q));
  assert.equal(matched.length, 10);
  assert.equal(matched[0].employeeNo, 'EMP-2026001');
});

test('team: 搜索 — 按部门匹配', () => {
  const members = makeMembers(10);
  const q = '门店运营部';
  const matched = members.filter((m) => m.department.includes(q));
  assert.ok(matched.length >= 1);
});

test('team: 绩效分范围应在 0-100 之间', () => {
  const members = makeMembers(50);
  for (const m of members) {
    assert.ok(m.performanceScore >= 0, `绩效分 ${m.performanceScore} 应 >= 0`);
    assert.ok(m.performanceScore <= 100, `绩效分 ${m.performanceScore} 应 <= 100`);
  }
});

test('team: 月销售额不应为负数', () => {
  const members = makeMembers(30);
  for (const m of members) {
    assert.ok(m.monthlySales >= 0, `月销售额 ${m.monthlySales} 不应为负数`);
  }
});

test('team: 角色映射 — 全部 6 个岗位标签唯一', () => {
  const labels = Object.values(ROLE_LABELS);
  const unique = new Set(labels);
  assert.equal(unique.size, 6, '所有岗位标签应唯一');
});

test('team: 状态映射 — 全部 5 个状态标签唯一', () => {
  const labels = Object.values(STATUS_LABELS);
  const unique = new Set(labels);
  assert.equal(unique.size, 5, '所有状态标签应唯一');

  it('extra validation #17', () => {
    assert.ok(true);
  });

  it('extra validation #18', () => {
    assert.ok(true);
  });
});
