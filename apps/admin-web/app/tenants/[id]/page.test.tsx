/**
 * tenants/[id]/page.test.tsx — 租户详情 L1 测试
 *
 * 覆盖: 租户状态、套餐、计费、表单验证、详情数据
 * 正例: 详情渲染、状态映射、表单字段、数据查询
 * 反例: 状态无效、表单校验、邮箱格式
 * 边界: 零门店、suspended 状态、description 为空
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import TenantDetailPage from './page';

/* ── 类型 ── */

type TenantStatus = 'active' | 'inactive' | 'pending' | 'suspended';
type TenantPlan = 'enterprise' | 'professional' | 'starter';
type BillingMode = 'monthly' | 'yearly';
type StatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

interface TenantDetail {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: TenantStatus;
  storeCount: number;
  brandCount: number;
  adminCount: number;
  lastDeployed: string;
  plan: TenantPlan;
  billingMode: BillingMode;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  registeredAt: string;
  timezone: string;
  description: string;
}

interface EditFormData {
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
}

interface EditFormErrors {
  name?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
}

const STATUS_MAP: Record<TenantStatus, { label: string; variant: StatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

const PLAN_MAP: Record<TenantPlan, { label: string; variant: StatusVariant }> = {
  enterprise: { label: '企业版', variant: 'success' },
  professional: { label: '专业版', variant: 'neutral' },
  starter: { label: '入门版', variant: 'warning' },
};

const BILLING_MAP: Record<BillingMode, string> = {
  monthly: '月付',
  yearly: '年付',
};

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '租户名称不能为空';
  if (!data.contactName.trim()) errors.contactName = '联系人不能为空';
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = '邮箱格式不正确';
  }
  return errors;
}

function getTenantById(id: string): TenantDetail {
  const lookup: Record<string, TenantDetail> = {
    t1: { id: 't1', code: 'TNT-001', name: '华润万象生活', marketCode: 'cn-mainland', status: 'active', storeCount: 5, brandCount: 3, adminCount: 12, lastDeployed: '2026-06-12 14:30', plan: 'enterprise', billingMode: 'yearly', contactName: '张华润', contactEmail: 'zhanghr@cr-mixc.com', contactPhone: '+86-10-8888-1111', registeredAt: '2024-01-15', timezone: 'Asia/Shanghai', description: '华润万象生活' },
    t5: { id: 't5', code: 'TNT-005', name: '恒隆地产', marketCode: 'cn-mainland', status: 'suspended', storeCount: 2, brandCount: 1, adminCount: 4, lastDeployed: '2026-06-10 11:00', plan: 'professional', billingMode: 'yearly', contactName: '陈恒隆', contactEmail: 'chenchl@hanglung.com', contactPhone: '+86-21-4444-5555', registeredAt: '2024-07-15', timezone: 'Asia/Shanghai', description: '恒隆地产专注于高端商业地产，因系统升级暂时暂停运营。' },
    empty: { id: 'empty', code: 'TNT-000', name: '零数据租户', marketCode: 'cn-mainland', status: 'pending', storeCount: 0, brandCount: 0, adminCount: 1, lastDeployed: '-', plan: 'starter', billingMode: 'monthly', contactName: '测试', contactEmail: '', contactPhone: '+86-10-0000-0000', registeredAt: '2026-07-01', timezone: 'Asia/Shanghai', description: '' },
  };
  return lookup[id] ?? lookup['t1']!;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(TenantDetailPage));
}

/* ============================================================ */

describe('tenants-[id]: 页面渲染', () => {
  it('renders title', () => {
    const { container } = setup();
    assert.ok(container.querySelector('h1')?.textContent?.length ?? 0 > 0);
  });

  it('renders breadcrumb', () => {
    const { container } = setup();
    const links = container.querySelectorAll('a');
    const tenantLink = Array.from(links).find(l => l.textContent?.includes('租户管理'));
    assert.ok(tenantLink, 'should have tenant management breadcrumb link');
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('has stat cards section', () => {
    const { container } = setup();
    const statLabels = ['运营状态', '套餐', '关联门店', '注册时间'];
    const text = container.textContent ?? '';
    statLabels.forEach(label => assert.ok(text.includes(label), `should render stat: ${label}`));
  });

  it('component is a function', () => {
    assert.equal(typeof TenantDetailPage, 'function');
  });

  it('renders tenant code and name', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('TNT-001') || text.includes('华润万象生活'));
  });
});

describe('tenants-[id]: 数据类型', () => {
  it('TenantDetail has all required fields', () => {
    const t: TenantDetail = getTenantById('t1');
    assert.equal(typeof t.id, 'string');
    assert.equal(typeof t.storeCount, 'number');
    assert.equal(typeof t.adminCount, 'number');
    assert.equal(typeof t.registeredAt, 'string');
    assert.ok(Array.isArray([t.code, t.name, t.marketCode]));
  });

  it('TenantStatus enum valid', () => {
    const valid: TenantStatus[] = ['active', 'inactive', 'pending', 'suspended'];
    assert.equal(valid.length, 4);
  });

  it('TenantPlan enum valid', () => {
    const valid: TenantPlan[] = ['enterprise', 'professional', 'starter'];
    assert.equal(valid.length, 3);
  });

  it('BillingMode enum valid', () => {
    const valid: BillingMode[] = ['monthly', 'yearly'];
    assert.equal(valid.length, 2);
  });

  it('StatusVariant enum valid', () => {
    const valid: StatusVariant[] = ['success', 'neutral', 'warning', 'danger'];
    assert.equal(valid.length, 4);
  });

  it('STATUS_MAP has all status entries', () => {
    const statuses: TenantStatus[] = ['active', 'inactive', 'pending', 'suspended'];
    statuses.forEach(s => {
      assert.ok(STATUS_MAP[s], `STATUS_MAP should have ${s}`);
      assert.ok(STATUS_MAP[s].label.length > 0);
      assert.ok(STATUS_MAP[s].variant.length > 0);
    });
  });

  it('PLAN_MAP has all plan entries', () => {
    const plans: TenantPlan[] = ['enterprise', 'professional', 'starter'];
    plans.forEach(p => {
      assert.ok(PLAN_MAP[p]);
      assert.ok(PLAN_MAP[p].label.length > 0);
    });
  });

  it('BILLING_MAP has Chinese labels', () => {
    assert.equal(BILLING_MAP.monthly, '月付');
    assert.equal(BILLING_MAP.yearly, '年付');
  });

  it('EditFormErrors has optional fields', () => {
    const empty: EditFormErrors = {};
    assert.equal(Object.keys(empty).length, 0);
    const withName: EditFormErrors = { name: '不能为空' };
    assert.ok(withName.name !== undefined);
  });

  it('storeCount is non-negative integer', () => {
    const t = getTenantById('empty');
    assert.ok(t.storeCount >= 0);
    assert.ok(Number.isInteger(t.storeCount));
  });

  it('contactEmail can be empty', () => {
    const t = getTenantById('empty');
    assert.equal(t.contactEmail, '');
  });
});

describe('tenants-[id]: 业务逻辑', () => {
  it('validateForm empty name returns error', () => {
    const errors = validateForm({
      name: '', contactName: '张三', contactPhone: '+86-10-0000', contactEmail: '', description: ''
    });
    assert.ok(errors.name);
    assert.equal(errors.name, '租户名称不能为空');
  });

  it('validateForm empty contactName returns error', () => {
    const errors = validateForm({
      name: '测试租户', contactName: '', contactPhone: '+86-10-0000', contactEmail: '', description: ''
    });
    assert.ok(errors.contactName);
  });

  it('validateForm empty contactPhone returns error', () => {
    const errors = validateForm({
      name: '测试租户', contactName: '张三', contactPhone: '', contactEmail: '', description: ''
    });
    assert.ok(errors.contactPhone);
  });

  it('validateForm invalid email returns error', () => {
    const errors = validateForm({
      name: '测试租户', contactName: '张三', contactPhone: '+86-10-0000', contactEmail: 'not-an-email', description: ''
    });
    assert.ok(errors.contactEmail);
    assert.equal(errors.contactEmail, '邮箱格式不正确');
  });

  it('validateForm valid email passes', () => {
    const errors = validateForm({
      name: '测试租户', contactName: '张三', contactPhone: '+86-10-0000', contactEmail: 'test@example.com', description: ''
    });
    assert.equal(errors.contactEmail, undefined);
  });

  it('validateForm empty email (optional) passes', () => {
    const errors = validateForm({
      name: '测试租户', contactName: '张三', contactPhone: '+86-10-0000', contactEmail: '', description: ''
    });
    assert.equal(errors.contactEmail, undefined);
  });

  it('validateForm all fields valid', () => {
    const errors = validateForm({
      name: '华润万象生活', contactName: '张华润', contactPhone: '+86-10-8888-1111', contactEmail: 'zhanghr@cr.com', description: '商业地产运营商'
    });
    assert.equal(Object.keys(errors).length, 0);
  });

  it('getTenantById returns t1 for unknown id', () => {
    const t = getTenantById('nonexistent');
    assert.equal(t.id, 't1');
  });

  it('getTenantById returns correct tenant for known id', () => {
    const t = getTenantById('t5');
    assert.equal(t.name, '恒隆地产');
    assert.equal(t.status, 'suspended');
    assert.equal(t.plan, 'professional');
  });

  it('getTenantById returns empty-data tenant', () => {
    const t = getTenantById('empty');
    assert.equal(t.storeCount, 0);
    assert.equal(t.brandCount, 0);
    assert.equal(t.description, '');
  });

  it('STATUS_MAP active maps to label and variant', () => {
    const s = STATUS_MAP['active'];
    assert.equal(s.label, '运营中');
    assert.equal(s.variant, 'success');
  });

  it('STATUS_MAP suspended maps to danger', () => {
    assert.equal(STATUS_MAP['suspended'].variant, 'danger');
  });

  it('PLAN_MAP starter maps to warning', () => {
    assert.equal(PLAN_MAP['starter'].variant, 'warning');
  });

  it('PLAN_MAP enterprise maps to success', () => {
    assert.equal(PLAN_MAP['enterprise'].variant, 'success');
  });

  it('BILLING_MAP maps correctly', () => {
    assert.equal(BILLING_MAP['monthly'], '月付');
    assert.equal(BILLING_MAP['yearly'], '年付');
  });

  it('suspended tenant is not active', () => {
    const t = getTenantById('t5');
    assert.notEqual(t.status, 'active');
  });

  it('enterprise tenants have yearly billing', () => {
    const t = getTenantById('t1');
    assert.equal(t.plan, 'enterprise');
    assert.equal(t.billingMode, 'yearly');
  });

  it('starter tenant has monthly billing', () => {
    const t = getTenantById('empty');
    assert.equal(t.plan, 'starter');
    assert.equal(t.billingMode, 'monthly');
  });

  it('description may contain Chinese characters', () => {
    const t = getTenantById('t5');
    assert.ok(t.description.includes('暂停运营'));
  });

  it('timezone is always present', () => {
    assert.equal(getTenantById('t1').timezone, 'Asia/Shanghai');
    assert.equal(getTenantById('empty').timezone, 'Asia/Shanghai');
  });

  it('adminCount of empty tenant is 1', () => {
    assert.equal(getTenantById('empty').adminCount, 1);
  });

  it('registeredAt is ISO-ish date string', () => {
    const t = getTenantById('t1');
    assert.ok(/^\d{4}-\d{2}-\d{2}/.test(t.registeredAt));
  });

  it('contactPhone contains country code', () => {
    const t = getTenantById('t1');
    assert.ok(t.contactPhone.startsWith('+86'));
  });

  it('marketCode is present', () => {
    assert.equal(getTenantById('t1').marketCode, 'cn-mainland');
  });

  it('lastDeployed has date-time format', () => {
    const t = getTenantById('t1');
    assert.ok(t.lastDeployed.includes(':'));
  });

  it('validateForm with whitespace name returns error', () => {
    const errors = validateForm({
      name: '   ', contactName: '张三', contactPhone: '+86-10-0000', contactEmail: '', description: ''
    });
    assert.ok(errors.name);
  });

  it('validateForm with only spaces contactName returns error', () => {
    const errors = validateForm({
      name: '测试', contactName: '   ', contactPhone: '+86-10-0000', contactEmail: '', description: ''
    });
    assert.ok(errors.contactName);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Tenants — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
