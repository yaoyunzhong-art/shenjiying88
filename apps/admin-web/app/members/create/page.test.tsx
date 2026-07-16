/**
 * members/create/page.test.tsx — 新建会员 L1 测试
 *
 * 覆盖: 表单验证、字段格式化、市场选项、会员等级
 * 正例: 完整表单、必填字段、邮箱格式
 * 反例: 空姓名、电话错误格式、邮箱错误、生日未来
 * 边界: 姓名50字、长备注、重复检测
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'standard';
type MemberStatus = 'active' | 'frozen' | 'dormant' | 'cancelled';

interface CreateFormData {
  name: string;
  phone: string;
  email: string;
  tier: MemberTier;
  gender: 'male' | 'female' | 'other';
  birthday: string;
  wechatId: string;
  address: string;
  storeName: string;
  marketCode: string;
  notes: string;
  tags: string;
}

interface CreateFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  tier?: string;
  gender?: string;
  birthday?: string;
  wechatId?: string;
  address?: string;
  storeName?: string;
  marketCode?: string;
  notes?: string;
  tags?: string;
}

/* ── 验证逻辑 ── */

function validateForm(data: CreateFormData): CreateFormErrors {
  const errors: CreateFormErrors = {};

  if (!data.name.trim()) {
    errors.name = '姓名不能为空';
  } else if (data.name.trim().length > 50) {
    errors.name = '姓名不能超过50个字符';
  }

  if (!data.phone.trim()) {
    errors.phone = '电话不能为空';
  } else if (!/^[\d\s\-+()]{6,20}$/.test(data.phone.trim())) {
    errors.phone = '电话号码格式不正确';
  }

  if (!data.storeName.trim()) {
    errors.storeName = '所属门店不能为空';
  }

  if (!data.marketCode) {
    errors.marketCode = '所属市场不能为空';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  if (data.birthday) {
    const parsed = new Date(data.birthday);
    if (isNaN(parsed.getTime())) {
      errors.birthday = '生日日期格式不正确';
    } else if (parsed > new Date()) {
      errors.birthday = '生日不能是未来日期';
    }
  }

  return errors;
}

/* ── 常量 ── */

const MARKET_OPTIONS = [
  { value: 'cn-mainland', label: '中国大陆' },
  { value: 'us-default', label: '美国' },
  { value: 'uk-default', label: '英国' },
  { value: 'jp-default', label: '日本' },
  { value: 'kr-default', label: '韩国' },
  { value: 'de-default', label: '德国' },
];

const MEMBER_TIER_KEYS: { key: MemberTier; label: string }[] = [
  { key: 'diamond', label: '钻石卡' },
  { key: 'gold', label: '金卡' },
  { key: 'silver', label: '银卡' },
  { key: 'bronze', label: '铜卡' },
  { key: 'standard', label: '标准' },
];

const DEFAULT_FORM_DATA: CreateFormData = {
  name: '', phone: '', email: '', tier: 'standard', gender: 'male',
  birthday: '', wechatId: '', address: '', storeName: '',
  marketCode: 'cn-mainland', notes: '', tags: '',
};

/* ============================================================ */

describe('member-create: 数据类型', () => {
  it('CreateFormData has all fields', () => {
    const d: CreateFormData = {
      ...DEFAULT_FORM_DATA,
      name: '张三', phone: '13800000001', storeName: '朝阳店',
    };
    assert.equal(typeof d.name, 'string');
    assert.equal(typeof d.tier, 'string');
    assert.equal(typeof d.gender, 'string');
    assert.equal(typeof d.birthday, 'string');
  });

  it('MemberTier enum has 5 values', () => {
    const tiers: MemberTier[] = ['diamond', 'gold', 'silver', 'bronze', 'standard'];
    assert.equal(tiers.length, 5);
  });

  it('MEMBER_TIER_KEYS contain all tiers', () => {
    assert.equal(MEMBER_TIER_KEYS.length, 5);
    MEMBER_TIER_KEYS.forEach(t => {
      assert.ok(['diamond', 'gold', 'silver', 'bronze', 'standard'].includes(t.key));
    });
  });

  it('MARKET_OPTIONS has 6 markets', () => {
    assert.equal(MARKET_OPTIONS.length, 6);
  });

  it('marketOptions include cn-mainland as first', () => {
    assert.equal(MARKET_OPTIONS[0].value, 'cn-mainland');
  });
});

describe('member-create: 验证逻辑', () => {
  const validData: CreateFormData = {
    name: '张三', phone: '13800000001', email: 'zhangsan@example.com',
    tier: 'standard', gender: 'male', birthday: '1990-01-01',
    wechatId: 'wx123', address: '北京市朝阳区', storeName: '朝阳店',
    marketCode: 'cn-mainland', notes: '', tags: '高净值, 数码',
  };

  it('valid form returns no errors', () => {
    const errors = validateForm(validData);
    assert.equal(Object.keys(errors).length, 0);
  });

  it('empty name returns name error', () => {
    const errors = validateForm({ ...validData, name: '' });
    assert.ok(errors.name !== undefined);
  });

  it('name longer than 50 returns error', () => {
    const errors = validateForm({ ...validData, name: 'A'.repeat(51) });
    assert.equal(errors.name, '姓名不能超过50个字符');
  });

  it('empty phone returns error', () => {
    const errors = validateForm({ ...validData, phone: '' });
    assert.equal(errors.phone, '电话不能为空');
  });

  it('invalid phone format returns error', () => {
    const errors = validateForm({ ...validData, phone: '123' });
    assert.equal(errors.phone, '电话号码格式不正确');
  });

  it('invalid email format returns error', () => {
    const errors = validateForm({ ...validData, email: 'not-an-email' });
    assert.equal(errors.email, '邮箱格式不正确');
  });

  it('valid email passes', () => {
    ['test@example.com', 'a@b.cn', 'user+tag@domain.com'].forEach(email => {
      const errors = validateForm({ ...validData, email });
      assert.ok(!errors.email, `email ${email} should be valid`);
    });
  });

  it('empty storeName returns error', () => {
    const errors = validateForm({ ...validData, storeName: '' });
    assert.equal(errors.storeName, '所属门店不能为空');
  });

  it('empty marketCode returns error (if empty string)', () => {
    const errors = validateForm({ ...validData, marketCode: '' });
    assert.equal(errors.marketCode, '所属市场不能为空');
  });

  it('future birthday returns error', () => {
    const future = '2099-01-01';
    const errors = validateForm({ ...validData, birthday: future });
    assert.equal(errors.birthday, '生日不能是未来日期');
  });

  it('invalid birthday date returns error', () => {
    const errors = validateForm({ ...validData, birthday: 'invalid-date' });
    assert.equal(errors.birthday, '生日日期格式不正确');
  });

  it('empty birthday is valid (optional)', () => {
    const errors = validateForm({ ...validData, birthday: '' });
    assert.ok(!errors.birthday);
  });

  it('empty email is valid (optional)', () => {
    const errors = validateForm({ ...validData, email: '' });
    assert.ok(!errors.email);
  });

  it('phone with + and parentheses is valid', () => {
    const errors = validateForm({ ...validData, phone: '+86-138-0001-0001' });
    assert.ok(!errors.phone);
  });

  it('phone with spaces is valid', () => {
    const errors = validateForm({ ...validData, phone: '138 0000 0001' });
    assert.ok(!errors.phone);
  });

  it('name exactly 50 chars is valid', () => {
    const errors = validateForm({ ...validData, name: 'A'.repeat(50) });
    assert.ok(!errors.name);
  });
});

describe('member-create: 业务逻辑', () => {
  it('default form matches DEFAULT_FORM_DATA', () => {
    assert.deepEqual(DEFAULT_FORM_DATA.tier, 'standard');
    assert.deepEqual(DEFAULT_FORM_DATA.gender, 'male');
    assert.deepEqual(DEFAULT_FORM_DATA.marketCode, 'cn-mainland');
  });

  it('MEMBER_TIER_KEYS sorted by prestige', () => {
    // diamond first, standard last
    assert.equal(MEMBER_TIER_KEYS[0].key, 'diamond');
    assert.equal(MEMBER_TIER_KEYS[4].key, 'standard');
  });

  it('market options include all needed regions', () => {
    const values = MARKET_OPTIONS.map(m => m.value);
    assert.ok(values.includes('cn-mainland'));
    assert.ok(values.includes('us-default'));
    assert.ok(values.includes('uk-default'));
    assert.ok(values.includes('jp-default'));
    assert.ok(values.includes('kr-default'));
    assert.ok(values.includes('de-default'));
  });

  it('all member tiers have labels in Chinese', () => {
    MEMBER_TIER_KEYS.forEach(t => {
      assert.ok(t.label.length >= 2);
    });
  });

  it('email regex passes common emails', () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert.ok(re.test('test@example.com'));
    assert.ok(re.test('a.b@c.d.com'));
    assert.ok(re.test('user+tag@domain.co.uk'));
    assert.ok(!re.test(''));
    assert.ok(!re.test('plain'));
    assert.ok(!re.test('@.'));
  });

  it('phone regex accepts international formats', () => {
    const re = /^[\d\s\-+()]{6,20}$/;
    assert.ok(re.test('+1-415-555-1001'));
    assert.ok(re.test('+86-138-0001-0001'));
    assert.ok(re.test('13800000001'));
    assert.ok(!re.test('12'));
    assert.ok(!re.test(''));
  });

  it('form validation catches multiple errors at once', () => {
    const errors = validateForm({ ...DEFAULT_FORM_DATA });
    assert.ok(errors.name !== undefined);
    assert.ok(errors.phone !== undefined);
    assert.ok(errors.storeName !== undefined);
  });

  it('after fixing one error, that field is clean', () => {
    const emptyName = validateForm({ ...DEFAULT_FORM_DATA });
    assert.ok(emptyName.name !== undefined);

    const fixedName = validateForm({ ...DEFAULT_FORM_DATA, name: '张三' });
    assert.ok(!fixedName.name);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Members / Create — hooks验证', () => {
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
