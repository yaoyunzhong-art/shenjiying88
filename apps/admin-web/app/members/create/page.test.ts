/**
 * members/create/page.test.ts — 新增会员页 L1 测试
 *
 * 覆盖:
 *   正例 — 表单验证（姓名/电话/邮箱/生日/门店）、市场选项枚举、会员等级枚举
 *   反例 — 空必填字段、无效邮箱、未来生日、手机号冲突
 *   边界 — 姓名超长、拼音格式、空字符串校验
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型 ────────────────────────────────────────────

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

// ─── 常量 ────────────────────────────────────────────

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

const MEMBER_TIER_MAP: Record<MemberTier, { label: string; variant: string }> = {
  diamond: { label: '钻石卡', variant: 'success' },
  gold: { label: '金卡', variant: 'success' },
  silver: { label: '银卡', variant: 'warning' },
  bronze: { label: '铜卡', variant: 'neutral' },
  standard: { label: '标准', variant: 'neutral' },
};

const MEMBER_STATUS_MAP: Record<MemberStatus, { label: string; variant: string }> = {
  active: { label: '活跃', variant: 'success' },
  frozen: { label: '已冻结', variant: 'warning' },
  dormant: { label: '休眠', variant: 'neutral' },
  cancelled: { label: '已注销', variant: 'danger' },
};

// ─── 验证函数（从 page.tsx 提取）─────────────────────

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

async function submitCreateMember(data: CreateFormData): Promise<{ memberId: string; code: string }> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  if (data.phone === '13800000000') {
    throw new Error('该手机号已被注册为会员');
  }
  return { memberId: 'm00001', code: 'MEM-00001' };
}

// ─── 辅助 ────────────────────────────────────────────

function createValidData(): CreateFormData {
  return {
    name: '张三',
    phone: '13812345678',
    email: 'zhangsan@test.com',
    tier: 'standard',
    gender: 'male',
    birthday: '1990-01-01',
    wechatId: 'zs_wechat',
    address: '北京市朝阳区',
    storeName: '朝阳大悦城旗舰店',
    marketCode: 'cn-mainland',
    notes: '',
    tags: '',
  };
}

// ─── 测试套件 ────────────────────────────────────────

describe('members/create — 表单验证', () => {
  it('1. 有效表单通过验证（正例）', () => {
    const errors = validateForm(createValidData());
    assert.equal(Object.keys(errors).length, 0);
  });

  it('2. 空姓名报错（反例）', () => {
    const data = createValidData();
    data.name = '';
    const errors = validateForm(data);
    assert.ok(errors.name);
  });

  it('3. 空姓名只含空格报错（反例）', () => {
    const data = createValidData();
    data.name = '   ';
    const errors = validateForm(data);
    assert.ok(errors.name);
  });

  it('4. 姓名超 50 字符报错（反例）', () => {
    const data = createValidData();
    data.name = '张'.repeat(51);
    const errors = validateForm(data);
    assert.equal(errors.name, '姓名不能超过50个字符');
  });

  it('5. 姓名恰好 50 字符通过（边界）', () => {
    const data = createValidData();
    data.name = '张'.repeat(50);
    const errors = validateForm(data);
    assert.ok(!errors.name);
  });

  it('6. 空电话报错（反例）', () => {
    const data = createValidData();
    data.phone = '';
    const errors = validateForm(data);
    assert.ok(errors.phone);
  });

  it('7. 有效手机号通过（正例）', () => {
    const data = createValidData();
    data.phone = '13812345678';
    assert.ok(!validateForm(data).phone);
  });

  it('8. 带国家区号的电话通过（正例）', () => {
    const data = createValidData();
    data.phone = '+1-415-555-0000';
    assert.ok(!validateForm(data).phone);
  });

  it('9. 无效电话格式报错（反例）', () => {
    const data = createValidData();
    data.phone = 'abc';
    const errors = validateForm(data);
    assert.ok(errors.phone);
  });

  it('10. 空所属门店报错（反例）', () => {
    const data = createValidData();
    data.storeName = '';
    const errors = validateForm(data);
    assert.ok(errors.storeName);
  });

  it('11. 空 marketCode 报错（反例）', () => {
    const data = createValidData();
    data.marketCode = '';
    const errors = validateForm(data);
    assert.ok(errors.marketCode);
  });

  it('12. 空邮箱不报错（边界）', () => {
    const data = createValidData();
    data.email = '';
    const errors = validateForm(data);
    assert.ok(!errors.email);
  });

  it('13. 无效邮箱格式报错（反例）', () => {
    const data = createValidData();
    data.email = 'not-an-email';
    const errors = validateForm(data);
    assert.ok(errors.email);
  });

  it('14. 有效邮箱通过（正例）', () => {
    const data = createValidData();
    data.email = 'test@example.com';
    assert.ok(!validateForm(data).email);
  });

  it('15. 空生日不报错（边界）', () => {
    const data = createValidData();
    data.birthday = '';
    const errors = validateForm(data);
    assert.ok(!errors.birthday);
  });

  it('16. 无效生日日期报错（反例）', () => {
    const data = createValidData();
    data.birthday = 'not-a-date';
    const errors = validateForm(data);
    assert.ok(errors.birthday);
  });

  it('17. 未来生日报错（反例）', () => {
    const data = createValidData();
    data.birthday = '2099-01-01';
    const errors = validateForm(data);
    assert.equal(errors.birthday, '生日不能是未来日期');
  });
});

describe('members/create — 提交逻辑', () => {
  it('18. 有效数据提交成功（正例）', async () => {
    const result = await submitCreateMember(createValidData());
    assert.ok(result.memberId);
    assert.ok(result.code.startsWith('MEM-'));
  });

  it('19. 重复手机号抛出错误（反例）', async () => {
    const data = createValidData();
    data.phone = '13800000000';
    await assert.rejects(
      () => submitCreateMember(data),
      { message: '该手机号已被注册为会员' }
    );
  });
});

describe('members/create — 枚举常量', () => {
  it('20. 6 个市场选项（正例）', () => {
    assert.equal(MARKET_OPTIONS.length, 6);
    assert.ok(MARKET_OPTIONS.some(o => o.value === 'cn-mainland'));
    assert.ok(MARKET_OPTIONS.some(o => o.value === 'us-default'));
    assert.ok(MARKET_OPTIONS.some(o => o.value === 'de-default'));
  });

  it('21. 5 个等级选项（正例）', () => {
    assert.equal(MEMBER_TIER_KEYS.length, 5);
  });

  it('22. 所有等级在 MEMBER_TIER_MAP 中（正例）', () => {
    const keys = Object.keys(MEMBER_TIER_MAP);
    assert.equal(keys.length, 5);
    for (const t of MEMBER_TIER_KEYS) {
      assert.ok(keys.includes(t.key), `${t.key} 应在 MAP 中`);
    }
  });

  it('23. 所有 status 在 MEMBER_STATUS_MAP 中（正例）', () => {
    const keys = Object.keys(MEMBER_STATUS_MAP);
    assert.equal(keys.length, 4);
  });
});
