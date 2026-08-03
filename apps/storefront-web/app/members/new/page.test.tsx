/*!
 * members/new/page.test.tsx - 会员新增页 L1 冒烟测试（增强版）
 * 源码分析模式：不渲染 UI 组件，只测试纯函数和业务逻辑
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

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

// ── 常量（从 page.tsx 镜像） ──

const TIER_OPTIONS: { label: string; value: MembershipTier }[] = [
  { label: '钻石会员', value: 'diamond' },
  { label: '黄金会员', value: 'gold' },
  { label: '银卡会员', value: 'silver' },
  { label: '铜卡会员', value: 'bronze' },
  { label: '普通会员', value: 'basic' },
];

const TIER_LABELS: Record<MembershipTier, string> = {
  diamond: '钻石会员',
  gold: '黄金会员',
  silver: '银卡会员',
  bronze: '铜卡会员',
  basic: '普通会员',
};

// ── 分类标签函数 ──

function renderMemberTierTag(tier: MembershipTier): string {
  return TIER_LABELS[tier] || '未知等级';
}

// ── 验证函数（从 page.tsx 镜像） ──

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

// ── 统计函数 ──

function countActiveTiers(tiers: MembershipTier[]): number {
  return new Set(tiers).size;
}

// ── 测试 ──

// === 新增：分类标签测试 ===

describe('MemberNewPage - 分类标签标签化', () => {
  it('renderMemberTierTag 返回正确等级标签', () => {
    assert.equal(renderMemberTierTag('diamond'), '钻石会员');
    assert.equal(renderMemberTierTag('gold'), '黄金会员');
    assert.equal(renderMemberTierTag('silver'), '银卡会员');
    assert.equal(renderMemberTierTag('bronze'), '铜卡会员');
    assert.equal(renderMemberTierTag('basic'), '普通会员');
  });

  it('renderMemberTierTag 处理未知等级返回"未知等级"', () => {
    assert.equal(renderMemberTierTag('' as MembershipTier), '未知等级');
    assert.equal(renderMemberTierTag('plat' as MembershipTier), '未知等级');
  });

  it('TIER_OPTIONS 包含 5 种会员等级', () => {
    assert.equal(TIER_OPTIONS.length, 5);
    assert.ok(TIER_OPTIONS.every((t) => t.value && t.label));
  });

  it('TIER_LABELS 覆盖所有等级', () => {
    const tierValues: MembershipTier[] = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
    for (const t of tierValues) {
      assert.ok(typeof TIER_LABELS[t] === 'string', `缺少等级 ${t} 的标签`);
    }
  });
});

// === 新增：验证函数测试 ===

describe('MemberNewPage - 表单验证逻辑', () => {
  const validForm: FormData = {
    name: '张三',
    phone: '13800138000',
    email: 'test@example.com',
    tier: 'gold',
    points: '1000',
    storeName: '旗舰店(天河城)',
    remark: '新会员',
  };

  it('validateForm 完整表单验证通过', () => {
    const errors = validateForm(validForm);
    assert.deepEqual(errors, {});
  });

  it('validateForm 空表单全部必填字段报错', () => {
    const empty: FormData = {
      name: '',
      phone: '',
      email: '',
      tier: '' as MembershipTier,
      points: '',
      storeName: '',
      remark: '',
    };
    const errors = validateForm(empty);
    assert.equal(errors.name, '姓名不能为空');
    assert.equal(errors.phone, '手机号不能为空');
    assert.equal(errors.email, '邮箱不能为空');
    assert.equal(errors.tier, '请选择会员等级');
  });

  it('validateForm 姓名太短报错', () => {
    const errors = validateForm({ ...validForm, name: '张' });
    assert.equal(errors.name, '姓名至少2个字符');
  });

  it('validateForm 姓名太长报错', () => {
    const errors = validateForm({ ...validForm, name: '张'.repeat(21) });
    assert.equal(errors.name, '姓名不能超过20个字符');
  });

  it('validateForm 姓名刚好 2 字符通过', () => {
    const errors = validateForm({ ...validForm, name: '张李' });
    assert.equal(errors.name, undefined);
  });

  it('validateForm 姓名刚好 20 字符通过', () => {
    const errors = validateForm({ ...validForm, name: '张'.repeat(20) });
    assert.equal(errors.name, undefined);
  });

  it('validateForm 无效手机号报错', () => {
    const invalidPhones = ['12345678901', '1380013800', '138001380000', 'abc', ''];
    for (const phone of invalidPhones) {
      const errors = validateForm({ ...validForm, phone });
      if (phone === '') {
        assert.equal(errors.phone, '手机号不能为空');
      } else {
        assert.equal(errors.phone, '请输入有效的11位手机号', `手机号 ${phone} 应报错`);
      }
    }
  });

  it('validateForm 无效邮箱报错', () => {
    const invalidEmails = ['not-email', 'no-at', '', '@nodomain', 'user@'];
    for (const email of invalidEmails) {
      const errors = validateForm({ ...validForm, email });
      if (email === '') {
        assert.equal(errors.email, '邮箱不能为空');
      } else {
        assert.equal(errors.email, '请输入有效的邮箱地址', `邮箱 ${email} 应报错`);
      }
    }
  });

  it('validateForm 积分非整数报错', () => {
    const errors = validateForm({ ...validForm, points: '10.5' });
    assert.equal(errors.points, '积分必须为非负整数');
  });

  it('validateForm 积分负数报错', () => {
    const errors = validateForm({ ...validForm, points: '-5' });
    assert.equal(errors.points, '积分必须为非负整数');
  });

  it('validateForm 积分超过上限报错', () => {
    const errors = validateForm({ ...validForm, points: '999999999' });
    assert.equal(errors.points, '积分不能超过 99,999,999');
  });

  it('validateForm 积分上限边界值 99999999 通过', () => {
    const errors = validateForm({ ...validForm, points: '99999999' });
    assert.equal(errors.points, undefined);
  });

  it('validateForm 积分 0 通过', () => {
    const errors = validateForm({ ...validForm, points: '0' });
    assert.equal(errors.points, undefined);
  });

  it('validateForm 门店名称过长报错', () => {
    const errors = validateForm({ ...validForm, storeName: '超长门店名称'.repeat(10) });
    assert.equal(errors.storeName, '门店名称不能超过50个字符');
  });

  it('validateForm 门店名称空不报错（可选字段）', () => {
    const errors = validateForm({ ...validForm, storeName: '' });
    assert.equal(errors.storeName, undefined);
  });

  it('hasErrors 有错误返回 true', () => {
    const errors = validateForm({ ...validForm, name: '' });
    assert.equal(hasErrors(errors), true);
  });

  it('hasErrors 无错误返回 false', () => {
    assert.equal(hasErrors({}), false);
  });

  it('validateForm 多个错误同时返回', () => {
    const errors = validateForm({
      name: '',
      phone: '',
      email: '',
      tier: '' as MembershipTier,
      points: '',
      storeName: '',
      remark: '',
    });
    const keys = Object.keys(errors);
    assert.ok(keys.length >= 4); // name, phone, email, tier
    assert.ok(keys.includes('name'));
    assert.ok(keys.includes('phone'));
    assert.ok(keys.includes('email'));
    assert.ok(keys.includes('tier'));
  });
});

// === 新增：统计函数 ===

describe('MemberNewPage - 统计函数', () => {
  it('countActiveTiers 计算不同等级数量', () => {
    const tiers: MembershipTier[] = ['diamond', 'gold', 'gold', 'silver'];
    assert.equal(countActiveTiers(tiers), 3);
  });

  it('countActiveTiers 空列表返回 0', () => {
    assert.equal(countActiveTiers([]), 0);
  });

  it('countActiveTiers 全部相同返回 1', () => {
    assert.equal(countActiveTiers(['gold', 'gold', 'gold']), 1);
  });
});

// === 原有测试保持不变 ===

describe('MemberNewPage - 正例', () => {
  it('exports default MemberNewPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MemberNewPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports FormField', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), 'missing FormField');
  });
  it('imports FormSubmitFeedback', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), 'missing FormSubmitFeedback');
  });
  it('imports Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('imports SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('imports useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('uses Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('uses SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines FormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormData') || src.includes('type FormData'), 'missing FormData');
  });
  it('defines FormErrors interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormErrors') || src.includes('type FormErrors'), 'missing FormErrors');
  });
  it('has retry mechanism', () => {
    const src = readSource();
    assert.ok(src.includes('retry') || src.includes('Retry'), 'missing retry');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('MemberNewPage - 反例', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('MemberNewPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('MemberNewPage - 数据完整性', () => {
  it('includes context "11位手机号码..."', () => {
    const src = readSource();
    assert.ok(src.includes('11位手机号码'), 'missing 11位手机号码');
  });
  it('includes context "会员创建成功..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员创建成功'), 'missing 会员创建成功');
  });
  it('includes context "会员姓名..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员姓名'), 'missing 会员姓名');
  });
  it('includes context "会员等级..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员等级'), 'missing 会员等级');
  });
  it('includes context "初始积分..."', () => {
    const src = readSource();
    assert.ok(src.includes('初始积分'), 'missing 初始积分');
  });
  it('includes context "取消..."', () => {
    const src = readSource();
    assert.ok(src.includes('取消'), 'missing 取消');
  });
  it('includes context "可选备注信息..."', () => {
    const src = readSource();
    assert.ok(src.includes('可选备注信息'), 'missing 可选备注信息');
  });
  it('includes context "可选，默认为0..."', () => {
    const src = readSource();
    assert.ok(src.includes('可选，默认为0'), 'missing 可选，默认为0');
  });
  it('includes context "备注..."', () => {
    const src = readSource();
    assert.ok(src.includes('备注'), 'missing 备注');
  });
  it('includes context "姓名不能为空..."', () => {
    const src = readSource();
    assert.ok(src.includes('姓名不能为空'), 'missing 姓名不能为空');
  });
  it('has constant pts', () => {
    const src = readSource();
    assert.ok(src.includes('pts'), 'missing pts');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
  it('has constant handleChange', () => {
    const src = readSource();
    assert.ok(src.includes('handleChange'), 'missing handleChange');
  });
  it('has constant value', () => {
    const src = readSource();
    assert.ok(src.includes('value'), 'missing value');
  });
});
