/**
 * members/[id]/edit/page.test.ts — 会员编辑页 L1 测试
 *
 * 覆盖:
 *   正例 — 表单验证（姓名/电话/邮箱/生日）、日期格式化、枚举常量
 *   反例 — 空必填字段、无效邮箱、未来生日、无效性别值
 *   边界 — 姓名超长、空字符串校验
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型 ────────────────────────────────────────────

interface EditFormData {
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  birthday: string;
  wechatId: string;
  address: string;
  notes: string;
  tags: string;
}

interface EditFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
  wechatId?: string;
  address?: string;
  notes?: string;
  tags?: string;
}

// ─── 常量 ────────────────────────────────────────────

const MEMBER_TIER_ITEMS = [
  { key: 'diamond', label: '钻石卡' },
  { key: 'gold', label: '金卡' },
  { key: 'silver', label: '银卡' },
  { key: 'bronze', label: '铜卡' },
  { key: 'standard', label: '标准' },
] as const;

const MEMBER_STATUS_ITEMS = [
  { key: 'active', label: '活跃' },
  { key: 'frozen', label: '已冻结' },
  { key: 'dormant', label: '休眠' },
  { key: 'cancelled', label: '已注销' },
] as const;

// ─── 辅助函数（从 page.tsx 提取）─────────────────────

function formatDateForInput(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};

  if (!data.name.trim()) errors.name = '姓名不能为空';
  else if (data.name.trim().length > 50) errors.name = '姓名不能超过50个字符';

  if (!data.phone.trim()) errors.phone = '电话不能为空';
  else if (!/^[\d\s\-+()]{6,20}$/.test(data.phone.trim())) errors.phone = '电话号码格式不正确';

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
    errors.gender = '性别选择不正确';
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

// ─── 辅助 ────────────────────────────────────────────

function createValidData(): EditFormData {
  return {
    name: '张三',
    phone: '13812345678',
    email: 'test@example.com',
    gender: 'male',
    birthday: '1990-01-01',
    wechatId: 'wechat_123',
    address: '北京市朝阳区',
    notes: '',
    tags: 'VIP,老客户',
  };
}

// ─── 测试套件 ────────────────────────────────────────

describe('members/[id]/edit — formatDateForInput', () => {
  it('1. ISO 日期转换为 YYYY-MM-DD（正例）', () => {
    const result = formatDateForInput('1990-01-15T00:00:00Z');
    assert.equal(result, '1990-01-15');
  });

  it('2. 无效日期返回空字符串（反例）', () => {
    assert.equal(formatDateForInput('not-a-date'), '');
  });

  it('3. 空字符串返回空字符串（边界）', () => {
    assert.equal(formatDateForInput(''), '');
  });
});

describe('members/[id]/edit — 表单验证', () => {
  it('4. 有效数据通过验证（正例）', () => {
    const errors = validateForm(createValidData());
    assert.equal(Object.keys(errors).length, 0);
  });

  it('5. 空姓名报错（反例）', () => {
    const data = createValidData();
    data.name = '';
    assert.ok(validateForm(data).name);
  });

  it('6. 空白姓名报错（反例）', () => {
    const data = createValidData();
    data.name = '   ';
    assert.ok(validateForm(data).name);
  });

  it('7. 姓名超 50 字符报错（反例）', () => {
    const data = createValidData();
    data.name = '张'.repeat(51);
    assert.equal(validateForm(data).name, '姓名不能超过50个字符');
  });

  it('8. 姓名 50 字符通过（边界）', () => {
    const data = createValidData();
    data.name = '张'.repeat(50);
    assert.ok(!validateForm(data).name);
  });

  it('9. 空电话报错（反例）', () => {
    const data = createValidData();
    data.phone = '';
    assert.ok(validateForm(data).phone);
  });

  it('10. 有效手机号通过（正例）', () => {
    const data = createValidData();
    data.phone = '13900001111';
    assert.ok(!validateForm(data).phone);
  });

  it('11. 带区号电话通过（正例）', () => {
    const data = createValidData();
    data.phone = '+86-138-0000-1111';
    assert.ok(!validateForm(data).phone);
  });

  it('12. 无效电话格式报错（反例）', () => {
    const data = createValidData();
    data.phone = 'abc';
    assert.ok(validateForm(data).phone);
  });

  it('13. 空邮箱通过（边界）', () => {
    const data = createValidData();
    data.email = '';
    assert.ok(!validateForm(data).email);
  });

  it('14. 无效邮箱报错（反例）', () => {
    const data = createValidData();
    data.email = 'bad-email';
    assert.ok(validateForm(data).email);
  });

  it('15. 有效邮箱通过（正例）', () => {
    const data = createValidData();
    data.email = 'user@domain.com';
    assert.ok(!validateForm(data).email);
  });

  it('16. 无效性别值报错（反例）', () => {
    const data = createValidData();
    data.gender = 'unknown' as any;
    assert.ok(validateForm(data).gender);
  });

  it('17. 空生日通过（边界）', () => {
    const data = createValidData();
    data.birthday = '';
    assert.ok(!validateForm(data).birthday);
  });

  it('18. 无效生日日期报错（反例）', () => {
    const data = createValidData();
    data.birthday = 'abc';
    assert.ok(validateForm(data).birthday);
  });

  it('19. 未来生日报错（反例）', () => {
    const data = createValidData();
    data.birthday = '2099-06-15';
    assert.equal(validateForm(data).birthday, '生日不能是未来日期');
  });
});

describe('members/[id]/edit — 枚举常量', () => {
  it('20. 5 个等级选项（正例）', () => {
    assert.equal(MEMBER_TIER_ITEMS.length, 5);
    const keys = MEMBER_TIER_ITEMS.map(i => i.key);
    assert.ok(keys.includes('diamond'));
    assert.ok(keys.includes('standard'));
  });

  it('21. 4 个状态选项（正例）', () => {
    assert.equal(MEMBER_STATUS_ITEMS.length, 4);
    const keys = MEMBER_STATUS_ITEMS.map(i => i.key);
    assert.ok(keys.includes('active'));
    assert.ok(keys.includes('cancelled'));
  });
});
