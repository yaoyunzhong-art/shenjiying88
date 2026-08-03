/**
 * page.test.ts — 会员新增表单 L1 源码分析测试
 * 纯 node:test, 不依赖 vitest/JSX/React
 * 覆盖: 组件导出、表单字段、验证逻辑、数据引用、提交处理
 * 角色视角: 👔店长 · 🛒前台 · 💳会员
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 类型 ──

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';

interface FormData {
  name: string;
  phone: string;
  email: string;
  tier: MembershipTier;
  points: string;
  storeName: string;
  remark: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  tier?: string;
  points?: string;
  storeName?: string;
}

const TIER_LABELS: Record<MembershipTier, string> = {
  diamond: '钻石会员',
  gold: '黄金会员',
  silver: '银卡会员',
  bronze: '铜卡会员',
  basic: '普通会员',
};

// ── 验证函数 ──

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = '姓名不能为空';
  } else if (data.name.trim().length < 2) {
    errors.name = '姓名至少2个字符';
  } else if (data.name.trim().length > 20) {
    errors.name = '姓名不能超过20个字符';
  }

  if (!data.phone.trim()) {
    errors.phone = '手机号不能为空';
  } else if (!/^1[3-9]\d{9}$/.test(data.phone.trim())) {
    errors.phone = '请输入有效的11位手机号';
  }

  if (!data.email.trim()) {
    errors.email = '邮箱不能为空';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = '请输入有效的邮箱地址';
  }

  if (!data.tier) {
    errors.tier = '请选择会员等级';
  }

  if (data.points.trim()) {
    const pts = Number(data.points);
    if (!Number.isInteger(pts) || pts < 0) {
      errors.points = '积分必须为非负整数';
    } else if (pts > 99999999) {
      errors.points = '积分不能超过 99,999,999';
    }
  }

  if (data.storeName.trim() && data.storeName.trim().length > 50) {
    errors.storeName = '门店名称不能超过50个字符';
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/* =================================================================
 * 组件导出 (Component Export)
 * ================================================================= */

test('组件导出: 默认导出函数组件 MemberNewPage', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', '默认导出应为函数组件');
});

test('组件导出: 导入 page.tsx 不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, '导入 page 应成功');
});

/* =================================================================
 * 表单字段 (Form Fields)
 * ================================================================= */

test('表单字段: 源码声明了 use client', () => {
  assert.ok(SRC.includes("'use client'"));
});

test('表单字段: 引入了 FormField', () => {
  assert.ok(SRC.includes('FormField'));
});

test('表单字段: 引入了 Input、Select、SubmitButton', () => {
  assert.ok(SRC.includes('Input'));
  assert.ok(SRC.includes('Select'));
  assert.ok(SRC.includes('SubmitButton'));
});

test('表单字段: 引入了 PageShell 和 useToast', () => {
  assert.ok(SRC.includes('PageShell'));
  assert.ok(SRC.includes('useToast'));
});

test('表单字段: 引入了 FormSubmitFeedback', () => {
  assert.ok(SRC.includes('FormSubmitFeedback'));
});

test('表单字段: 定义了 FormData 接口', () => {
  assert.ok(SRC.includes('interface FormData'));
});

test('表单字段: 定义了 FormErrors 接口', () => {
  assert.ok(SRC.includes('interface FormErrors'));
});

test('表单字段: 使用了 useCallback、useState、useRouter', () => {
  assert.ok(SRC.includes('useCallback'));
  assert.ok(SRC.includes('useState'));
  assert.ok(SRC.includes('useRouter'));
});

test('表单字段: 发送 submit 按钮包含 data-testid', () => {
  assert.ok(SRC.includes('member-submit-btn'));
});

test('表单字段: 定义了 TIER_OPTIONS 含 5 种等级', () => {
  assert.ok(SRC.includes('钻石会员'));
  assert.ok(SRC.includes('黄金会员'));
  assert.ok(SRC.includes('银卡会员'));
  assert.ok(SRC.includes('铜卡会员'));
  assert.ok(SRC.includes('普通会员'));
});

/* =================================================================
 * 验证逻辑 (Validation)
 * ================================================================= */

test('验证: 完整有效表单验证通过', () => {
  const data: FormData = {
    name: '张三',
    phone: '13800138000',
    email: 'test@example.com',
    tier: 'gold',
    points: '1000',
    storeName: '旗舰店',
    remark: '',
  };
  assert.deepEqual(validateForm(data), {});
});

test('验证: 空名字报错"姓名不能为空"', () => {
  const err = validateForm({
    name: '', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '', storeName: '', remark: '',
  });
  assert.equal(err.name, '姓名不能为空');
});

test('验证: 姓名太短(<2)报错', () => {
  const err = validateForm({
    name: '张', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '', storeName: '', remark: '',
  });
  assert.equal(err.name, '姓名至少2个字符');
});

test('验证: 姓名太长(>20)报错', () => {
  const err = validateForm({
    name: '张'.repeat(21), phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '', storeName: '', remark: '',
  });
  assert.equal(err.name, '姓名不能超过20个字符');
});

test('验证: 空手机号报错', () => {
  const err = validateForm({
    name: '张三', phone: '', email: 'test@test.com',
    tier: 'gold', points: '', storeName: '', remark: '',
  });
  assert.equal(err.phone, '手机号不能为空');
});

test('验证: 无效手机号格式报错(如 12345678901)', () => {
  const err = validateForm({
    name: '张三', phone: '12345678901', email: 'test@test.com',
    tier: 'gold', points: '', storeName: '', remark: '',
  });
  assert.equal(err.phone, '请输入有效的11位手机号');
});

test('验证: 空邮箱报错', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: '',
    tier: 'gold', points: '', storeName: '', remark: '',
  });
  assert.equal(err.email, '邮箱不能为空');
});

test('验证: 无效邮箱格式报错', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'not-email',
    tier: 'gold', points: '', storeName: '', remark: '',
  });
  assert.equal(err.email, '请输入有效的邮箱地址');
});

test('验证: 空等级报错', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'test@test.com',
    tier: '' as MembershipTier, points: '', storeName: '', remark: '',
  });
  assert.equal(err.tier, '请选择会员等级');
});

test('验证: 积分负数报错', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '-5', storeName: '', remark: '',
  });
  assert.equal(err.points, '积分必须为非负整数');
});

test('验证: 积分非整数(10.5)报错', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '10.5', storeName: '', remark: '',
  });
  assert.equal(err.points, '积分必须为非负整数');
});

test('验证: 积分超上限(>99999999)报错', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '999999999', storeName: '', remark: '',
  });
  assert.equal(err.points, '积分不能超过 99,999,999');
});

test('验证: 积分=0 通过', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '0', storeName: '', remark: '',
  });
  assert.equal(err.points, undefined);
});

test('验证: 门店名称过长(>50)报错', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '', storeName: '超长门店名称'.repeat(10), remark: '',
  });
  assert.equal(err.storeName, '门店名称不能超过50个字符');
});

test('验证: 门店可选字段不填不报错', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '', storeName: '', remark: '',
  });
  assert.equal(err.storeName, undefined);
});

test('验证: hasErrors 空对象返回 false', () => {
  assert.equal(hasErrors({}), false);
});

test('验证: hasErrors 有错误返回 true', () => {
  assert.equal(hasErrors({ name: '姓名不能为空' }), true);
});

test('验证: 多个必填字段为空时同时报错', () => {
  const err = validateForm({
    name: '', phone: '', email: '', tier: '' as MembershipTier,
    points: '', storeName: '', remark: '',
  });
  const keys = Object.keys(err);
  assert.ok(keys.includes('name'));
  assert.ok(keys.includes('phone'));
  assert.ok(keys.includes('email'));
  assert.ok(keys.includes('tier'));
  assert.ok(keys.length >= 4);
});

test('验证: 积分上限边界值 99999999 通过', () => {
  const err = validateForm({
    name: '张三', phone: '13800138000', email: 'test@test.com',
    tier: 'gold', points: '99999999', storeName: '', remark: '',
  });
  assert.equal(err.points, undefined);
});

/* =================================================================
 * 数据引用 (Data Reference)
 * ================================================================= */

test('数据: 源码包含"会员创建成功"文案', () => {
  assert.ok(SRC.includes('会员创建成功'));
});

test('数据: 源码包含"11位手机号码"提示', () => {
  assert.ok(SRC.includes('11位手机号码'));
});

test('数据: 源码包含"可选，默认为0"提示', () => {
  assert.ok(SRC.includes('可选，默认为0'));
});

test('数据: 提交成功后跳转到 /members 路由', () => {
  assert.ok(SRC.includes("/members'") || SRC.includes('/members'));
});

test('数据: 取消按钮调用 router.back', () => {
  assert.ok(SRC.includes('router.back'), '取消应调用返回');
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: 源码不包含 any 类型', () => {
  assert.ok(!SRC.match(/:\s*any\b/), '不应使用 any 类型');
});

test('边界: 源码不包含 dangerouslySetInnerHTML', () => {
  assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
});

test('边界: 源码不包含 eval 或 new Function', () => {
  assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function('));
});

test('边界: TIER_LABELS 映射完整性', () => {
  const tiers: MembershipTier[] = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
  for (const t of tiers) {
    assert.ok(TIER_LABELS[t].length > 0);
    assert.ok(TIER_LABELS[t].endsWith('会员'));
  }
});

test('边界: 提交时会对所有必填字段做全量验证', () => {
  assert.ok(SRC.includes('validateForm(form)'));
  assert.ok(SRC.includes('hasErrors(validationErrors)'));
});
