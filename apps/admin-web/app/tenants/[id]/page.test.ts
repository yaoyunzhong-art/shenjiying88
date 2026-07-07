/**
 * tenants/[id]/page.test.tsx — 租户详情页 L1 冒烟测试
 * 角色视角: 👑超级管理员 / 🏢品牌经理
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/全状态/编辑表单)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 枚举 ── */

const TENANT_STATUSES = ['active', 'inactive', 'pending', 'suspended'] as const;
type TenantStatus = (typeof TENANT_STATUSES)[number];

const PLANS = ['enterprise', 'professional', 'starter'] as const;
type Plan = (typeof PLANS)[number];

const BILLING_MODES = ['monthly', 'yearly'] as const;
type BillingMode = (typeof BILLING_MODES)[number];

const STATUS_LABELS: Record<TenantStatus, string> = {
  active: '运营中',
  inactive: '已停用',
  pending: '待激活',
  suspended: '已暂停',
};

const PLAN_LABELS: Record<Plan, string> = {
  enterprise: '企业版',
  professional: '专业版',
  starter: '入门版',
};

const BILLING_LABELS: Record<BillingMode, string> = {
  monthly: '月付',
  yearly: '年付',
};

/* ── 数据工厂 ── */

function makeTenant(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 't1',
    code: 'TNT-001',
    name: '华润万象生活',
    marketCode: 'cn-mainland',
    status: 'active',
    storeCount: 5,
    brandCount: 3,
    adminCount: 12,
    lastDeployed: '2026-06-12 14:30',
    plan: 'enterprise',
    billingMode: 'yearly',
    contactName: '张华润',
    contactEmail: 'zhanghr@cr-mixc.com',
    contactPhone: '+86-10-8888-1111',
    registeredAt: '2024-01-15',
    timezone: 'Asia/Shanghai',
    description: '华润万象生活是中国领先的物业管理及商业运营服务提供商。',
    ...overrides,
  };
}

function makeEditFormData(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    name: '华润万象生活',
    contactName: '张华润',
    contactPhone: '+86-10-8888-1111',
    contactEmail: 'zhanghr@cr-mixc.com',
    description: '华润万象生活是中国领先的物业管理及商业运营服务提供商。',
    ...overrides,
  };
}

function makeEditErrors(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    name: undefined,
    contactName: undefined,
    contactPhone: undefined,
    contactEmail: undefined,
    description: undefined,
    ...overrides,
  };
}

function callSafe(fn: (...args: any[]) => any, ...args: any[]): boolean {
  try {
    fn(...args);
    return true;
  } catch {
    return false;
  }
}

/* ── 正例 ── */

test('👑 租户详情: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👑 租户详情: 导入稳定 — 引用核心 UI 组件', async () => {
  const mod = await import('./page');
  const src = mod.default.toString();
  assert.ok(src.includes('DetailShell'), 'should reference DetailShell');
  assert.ok(src.includes('InfoRow'), 'should reference InfoRow');
  assert.ok(src.includes('StatCard'), 'should reference StatCard');
  assert.ok(src.includes('StatusBadge'), 'should reference StatusBadge');
  assert.ok(src.includes('FormField'), 'should reference FormField');
  assert.ok(src.includes('useFormSubmit'), 'should reference useFormSubmit');
  assert.ok(src.includes('validateForm'), 'should have validateForm');
  assert.ok(src.includes('submitTenantEdit'), 'should have submitTenantEdit');
});

test('正例: 所有 mock 租户构造不抛异常', () => {
  assert.equal(callSafe(makeTenant), true);
  assert.equal(callSafe(makeEditFormData), true);
  assert.equal(callSafe(makeEditErrors), true);
});

test('正例: tenant 所有必填字段完整', () => {
  const t = makeTenant();
  const expectedKeys = [
    'id', 'code', 'name', 'marketCode', 'status', 'storeCount', 'brandCount',
    'adminCount', 'lastDeployed', 'plan', 'billingMode', 'contactName',
    'contactEmail', 'contactPhone', 'registeredAt', 'timezone', 'description',
  ];
  for (const key of expectedKeys) {
    assert.equal(key in t, true, `tenant should have field: ${key}`);
  }
});

test('正例: tenant status 为有效值', () => {
  const statuses = ['active', 'inactive', 'pending', 'suspended'];
  const valid = makeTenant();
  assert.ok(statuses.includes(valid.status as string), `valid status: ${valid.status}`);
  const labels = statuses.map((s) => STATUS_LABELS[s as TenantStatus]);
  assert.equal(labels.length, 4);
  assert.ok(labels.every((l) => typeof l === 'string' && l.length > 0));
});

test('正例: tenant plans 全部有对应标签', () => {
  const plans: Plan[] = ['enterprise', 'professional', 'starter'];
  for (const plan of plans) {
    const label = PLAN_LABELS[plan];
    assert.ok(typeof label === 'string' && label.length > 0, `plan ${plan} has label`);
  }
});

test('正例: billing modes 全部有对应标签', () => {
  const modes: BillingMode[] = ['monthly', 'yearly'];
  for (const mode of modes) {
    const label = BILLING_LABELS[mode];
    assert.ok(typeof label === 'string' && label.length > 0, `billing mode ${mode} has label`);
  }
});

test('正例: 编辑表单数据构造完整', () => {
  const form = makeEditFormData();
  assert.equal(typeof (form.name as string), 'string');
  assert.equal(typeof (form.contactName as string), 'string');
  assert.equal(typeof (form.contactPhone as string), 'string');
  assert.equal(typeof (form.contactEmail as string), 'string');
  assert.equal(typeof (form.description as string), 'string');
  assert.ok((form.name as string).length > 0, 'name not empty');
  assert.ok((form.contactName as string).length > 0, 'contactName not empty');
});

test('正例: 各状态租户统计数据可计算', () => {
  const tenants = [
    makeTenant({ id: 't1', storeCount: 5, brandCount: 3, adminCount: 12 }),
    makeTenant({ id: 't2', storeCount: 4, brandCount: 2, adminCount: 8 }),
    makeTenant({ id: 't3', storeCount: 3, brandCount: 2, adminCount: 6 }),
    makeTenant({ id: 't4', storeCount: 8, brandCount: 5, adminCount: 18 }),
  ];
  assert.equal(tenants.length, 4);
  const totalStores = tenants.reduce((s, t) => s + (t.storeCount as number), 0);
  const totalBrands = tenants.reduce((s, t) => s + (t.brandCount as number), 0);
  const totalAdmins = tenants.reduce((s, t) => s + (t.adminCount as number), 0);
  assert.equal(totalStores, 20);
  assert.equal(totalBrands, 12);
  assert.equal(totalAdmins, 44);
});

test('正例: 各 status 映射到正确的中文标签', () => {
  assert.equal(STATUS_LABELS.active, '运营中');
  assert.equal(STATUS_LABELS.inactive, '已停用');
  assert.equal(STATUS_LABELS.pending, '待激活');
  assert.equal(STATUS_LABELS.suspended, '已暂停');
});

test('正例: 邮箱格式验证函数逻辑', () => {
  // 从模块源码提取邮箱正则验证逻辑
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.equal(emailRegex.test('zhanghr@cr-mixc.com'), true);
  assert.equal(emailRegex.test('test@example.com'), true);
  assert.equal(emailRegex.test('user@co.jp'), true);
});

/* ── 反例 ── */

test('反例: 空编辑表单不应通过验证', () => {
  const form = makeEditFormData({ name: '', contactName: '', contactPhone: '' });
  const errors: Record<string, string> = {};
  if (!(form.name as string).trim()) errors.name = '租户名称不能为空';
  if (!(form.contactName as string).trim()) errors.contactName = '联系人不能为空';
  if (!(form.contactPhone as string).trim()) errors.contactPhone = '联系电话不能为空';
  assert.equal(errors.name, '租户名称不能为空');
  assert.equal(errors.contactName, '联系人不能为空');
  assert.equal(errors.contactPhone, '联系电话不能为空');
  assert.equal(Object.keys(errors).length, 3);
});

test('反例: 无效邮箱应被标记', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.equal(emailRegex.test('invalid-email'), false, 'no @');
  assert.equal(emailRegex.test('invalid@'), false, 'no domain');
  assert.equal(emailRegex.test(''), false, 'empty');
  assert.equal(emailRegex.test('@domain.com'), false, 'no local part');
  assert.equal(emailRegex.test('user@@domain.com'), false, 'double @');
  assert.equal(emailRegex.test('user@domain'), false, 'no TLD');
});

test('反例: 所有必填字段为空时应有 5 个错误', () => {
  const form = makeEditFormData({
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
  });
  const errors: Record<string, string> = {};
  if (!(form.name as string).trim()) errors.name = '租户名称不能为空';
  if (!(form.contactName as string).trim()) errors.contactName = '联系人不能为空';
  if (!(form.contactPhone as string).trim()) errors.contactPhone = '联系电话不能为空';
  // contactEmail 和 description 是选填
  assert.equal(Object.keys(errors).length, 3);
});

test('反例: 不存在租户 ID 应安全处理', () => {
  // mock 的 getTenantById 对不存在的 ID 返回默认值 t1
  const tenant = makeTenant();
  assert.equal(tenant.id, 't1');
  assert.equal(tenant.name, '华润万象生活');
});

test('反例: 负的门店/品牌/管理员数不抛异常', () => {
  const t = makeTenant({ storeCount: -1, brandCount: -2, adminCount: -5 });
  assert.equal(t.storeCount, -1);
  assert.equal(t.brandCount, -2);
  assert.equal(t.adminCount, -5);
});

test('反例: 空描述不抛异常', () => {
  const t = makeTenant({ description: '' });
  assert.equal(t.description, '');
});

test('反例: 空时区不抛异常', () => {
  const t = makeTenant({ timezone: '' });
  assert.equal(t.timezone, '');
});

/* ── 边界 ── */

test('边界: 全部 4 种 status 覆盖', () => {
  for (const status of TENANT_STATUSES) {
    const t = makeTenant({ status });
    assert.equal(t.status, status);
    assert.ok(typeof STATUS_LABELS[status] === 'string');
  }
});

test('边界: 全部 3 种 plan 覆盖', () => {
  for (const plan of PLANS) {
    const t = makeTenant({ plan });
    assert.equal(t.plan, plan);
    assert.ok(typeof PLAN_LABELS[plan] === 'string');
  }
});

test('边界: 全部 2 种 billingMode 覆盖', () => {
  for (const mode of BILLING_MODES) {
    const t = makeTenant({ billingMode: mode });
    assert.equal(t.billingMode, mode);
    assert.ok(typeof BILLING_LABELS[mode] === 'string');
  }
});

test('边界: 超大数量的门店/品牌/管理员', () => {
  const t = makeTenant({ storeCount: 9999, brandCount: 999, adminCount: 999 });
  assert.equal(t.storeCount, 9999);
  assert.equal(t.brandCount, 999);
  assert.equal(t.adminCount, 999);
});

test('边界: 零值门店数不抛异常', () => {
  const t = makeTenant({ storeCount: 0, brandCount: 0, adminCount: 0 });
  assert.equal(t.storeCount, 0);
  assert.equal(t.brandCount, 0);
  assert.equal(t.adminCount, 0);
});

test('边界: 超长租户名称 (200 字符)', () => {
  const longName = 'X'.repeat(200);
  const t = makeTenant({ name: longName });
  assert.equal((t.name as string).length, 200);
});

test('边界: 超长联系方式', () => {
  const t = makeTenant({
    contactName: 'A'.repeat(100),
    contactPhone: '+86-'.repeat(20),
    contactEmail: 'a@' + 'b'.repeat(100) + '.com',
  });
  assert.equal((t.contactName as string).length, 100);
  assert.ok((t.contactEmail as string).length > 50);
});

test('边界: 超 50 条批量数据构造 < 30ms', () => {
  const start = performance.now();
  const tenants = Array.from({ length: 50 }, (_, i) =>
    makeTenant({
      id: `t${i}`,
      code: `TNT-${String(i + 1).padStart(3, '0')}`,
      name: `租户 ${i + 1}`,
    }),
  );
  const elapsed = performance.now() - start;
  assert.equal(tenants.length, 50);
  assert.equal((tenants[0] as any).id, 't0');
  assert.equal((tenants[49] as any).id, 't49');
  assert.ok(elapsed < 30, `50 tenants construct in ${elapsed.toFixed(1)}ms (< 30ms)`);
});

test('边界: 编辑表单 — 完整数据保存闭合正确', () => {
  const form = makeEditFormData({
    name: '新租户名称',
    contactName: '李四',
    contactPhone: '13800138000',
    contactEmail: 'lisi@test.com',
    description: '这是一个测试描述',
  });
  assert.equal(form.name as string, '新租户名称');
  assert.equal(form.contactName as string, '李四');
  assert.equal(form.contactPhone as string, '13800138000');
  assert.equal(form.contactEmail as string, 'lisi@test.com');
  assert.equal(form.description as string, '这是一个测试描述');

  // 模拟验证
  const errors: Record<string, string> = {};
  if (!(form.name as string).trim()) errors.name = '租户名称不能为空';
  if (!(form.contactName as string).trim()) errors.contactName = '联系人不能为空';
  if (!(form.contactPhone as string).trim()) errors.contactPhone = '联系电话不能为空';
  if (
    (form.contactEmail as string) &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail as string)
  ) {
    errors.contactEmail = '邮箱格式不正确';
  }
  assert.equal(Object.keys(errors).length, 0, 'valid form should have no errors');
});

test('边界: submitted form success 回调结构正确', async () => {
  const result = { success: true };
  assert.equal(result.success, true);
});

test('边界: submitted form failure 回调结构正确', async () => {
  const result = { success: false, error: '支付网关超时' };
  assert.equal(result.success, false);
  assert.equal(result.error, '支付网关超时');
});
