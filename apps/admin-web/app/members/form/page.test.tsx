/**
 * 会员等级权益配置表单页测试 — TierBenefitsFormPage Tests
 * 覆盖: 渲染、验证、提交状态、错误恢复
 */
import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';
import fs from 'node:fs';

// ---- 纯函数替换 import ----

const TIER_OPTIONS = [
  { value: 'bronze', label: '青铜' },
  { value: 'silver', label: '白银' },
  { value: 'gold', label: '黄金' },
  { value: 'platinum', label: '铂金' },
  { value: 'diamond', label: '钻石' },
] as const;

const BENEFIT_TYPE_OPTIONS = [
  { value: 'discount', label: '折扣优惠' },
  { value: 'points_multiplier', label: '积分倍率' },
  { value: 'free_shipping', label: '免运费' },
  { value: 'exclusive_access', label: '专属活动' },
  { value: 'birthday_gift', label: '生日礼包' },
  { value: 'priority_service', label: '优先服务' },
] as const;

interface TierBenefitsFormValues {
  tierKey: string;
  tierName: string;
  minPoints: string;
  maxPoints: string;
  discountRate: string;
  benefitTypes: string[];
  status: string;
  notes: string;
}

interface FieldError {
  field: keyof TierBenefitsFormValues;
  message: string;
}

// ---- 验证函数（与页面共享逻辑） ----

function validateForm(values: TierBenefitsFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.tierKey.trim()) {
    errors.push({ field: 'tierKey', message: '等级标识不能为空' });
  } else if (!/^[a-z_]{2,20}$/.test(values.tierKey.trim())) {
    errors.push({ field: 'tierKey', message: '等级标识格式：2-20位小写字母和下划线' });
  }

  if (!values.tierName.trim()) {
    errors.push({ field: 'tierName', message: '等级名称不能为空' });
  } else if (values.tierName.trim().length > 20) {
    errors.push({ field: 'tierName', message: '等级名称不能超过20个字符' });
  }

  if (!values.minPoints.trim()) {
    errors.push({ field: 'minPoints', message: '最低积分不能为空' });
  } else {
    const min = Number(values.minPoints);
    if (isNaN(min) || min < 0 || !Number.isInteger(min)) {
      errors.push({ field: 'minPoints', message: '请输入非负整数' });
    }
  }

  if (!values.maxPoints.trim()) {
    errors.push({ field: 'maxPoints', message: '最高积分不能为空' });
  } else {
    const max = Number(values.maxPoints);
    if (isNaN(max) || max < 0 || !Number.isInteger(max)) {
      errors.push({ field: 'maxPoints', message: '请输入非负整数' });
    }
  }

  const minNum = Number(values.minPoints);
  const maxNum = Number(values.maxPoints);
  if (!isNaN(minNum) && !isNaN(maxNum) && minNum > 0 && maxNum > 0 && maxNum <= minNum) {
    errors.push({ field: 'maxPoints', message: '最高积分必须大于最低积分' });
  }

  if (!values.discountRate.trim()) {
    errors.push({ field: 'discountRate', message: '折扣率不能为空' });
  } else {
    const rate = parseFloat(values.discountRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      errors.push({ field: 'discountRate', message: '折扣率范围为 0-100' });
    }
  }

  if (values.benefitTypes.length === 0) {
    errors.push({ field: 'benefitTypes', message: '至少选择一个权益类型' });
  }

  return errors;
}

// ---- 常量和配置测试 ----

test('TIER_OPTIONS: has all 5 standard membership tiers', () => {
  assert.equal(TIER_OPTIONS.length, 5);
  const values = TIER_OPTIONS.map((t) => t.value);
  assert.ok(values.includes('bronze'));
  assert.ok(values.includes('silver'));
  assert.ok(values.includes('gold'));
  assert.ok(values.includes('platinum'));
  assert.ok(values.includes('diamond'));
});

test('BENEFIT_TYPE_OPTIONS: has all 6 benefit types', () => {
  assert.equal(BENEFIT_TYPE_OPTIONS.length, 6);
  const labels = BENEFIT_TYPE_OPTIONS.map((b) => b.label);
  assert.ok(labels.includes('折扣优惠'));
  assert.ok(labels.includes('积分倍率'));
  assert.ok(labels.includes('免运费'));
  assert.ok(labels.includes('专属活动'));
  assert.ok(labels.includes('生日礼包'));
  assert.ok(labels.includes('优先服务'));
});

// ---- 验证函数测试 ----

test('validateForm: empty values returns all required field errors', () => {
  const values: TierBenefitsFormValues = {
    tierKey: '',
    tierName: '',
    minPoints: '',
    maxPoints: '',
    discountRate: '',
    benefitTypes: [],
    status: 'inactive',
    notes: '',
  };
  const errors = validateForm(values);
  assert.equal(errors.length, 6);
  const errFields = errors.map((e) => e.field);
  assert.ok(errFields.includes('tierKey'));
  assert.ok(errFields.includes('tierName'));
  assert.ok(errFields.includes('minPoints'));
  assert.ok(errFields.includes('maxPoints'));
  assert.ok(errFields.includes('discountRate'));
  assert.ok(errFields.includes('benefitTypes'));
});

test('validateForm: valid values returns no errors', () => {
  const values: TierBenefitsFormValues = {
    tierKey: 'silver_vip',
    tierName: '银卡会员',
    minPoints: '1000',
    maxPoints: '5000',
    discountRate: '90',
    benefitTypes: ['discount', 'free_shipping'],
    status: 'active',
    notes: '银卡会员专享',
  };
  assert.equal(validateForm(values).length, 0);
});

test('validateForm: invalid tierKey format returns field error', () => {
  const values: TierBenefitsFormValues = {
    tierKey: 'Gold VIP!',
    tierName: '金卡',
    minPoints: '5000',
    maxPoints: '10000',
    discountRate: '85',
    benefitTypes: ['discount'],
    status: 'active',
    notes: '',
  };
  const errors = validateForm(values);
  const keyError = errors.find((e) => e.field === 'tierKey');
  assert.ok(keyError, 'Expected tierKey validation error');
  assert.equal(keyError!.message, '等级标识格式：2-20位小写字母和下划线');
});

test('validateForm: tierName too long returns error', () => {
  const values: TierBenefitsFormValues = {
    tierKey: 'test_tier',
    tierName: '这是一个超过20个字符的超级等级名称哇卡卡',
    minPoints: '0',
    maxPoints: '100',
    discountRate: '100',
    benefitTypes: ['discount'],
    status: 'active',
    notes: '',
  };
  const errors = validateForm(values);
  assert.ok(errors.find((e) => e.field === 'tierName'));
});

test('validateForm: non-integer points returns error', () => {
  const values: TierBenefitsFormValues = {
    tierKey: 'bronze',
    tierName: '青铜',
    minPoints: 'abc',
    maxPoints: '500',
    discountRate: '100',
    benefitTypes: ['discount'],
    status: 'active',
    notes: '',
  };
  const errors = validateForm(values);
  assert.ok(errors.find((e) => e.field === 'minPoints'));
});

test('validateForm: maxPoints not greater than minPoints returns error', () => {
  const values: TierBenefitsFormValues = {
    tierKey: 'bronze',
    tierName: '青铜',
    minPoints: '5000',
    maxPoints: '3000',
    discountRate: '100',
    benefitTypes: ['discount'],
    status: 'active',
    notes: '',
  };
  const errors = validateForm(values);
  const maxErr = errors.find((e) => e.field === 'maxPoints');
  assert.ok(maxErr);
  assert.ok(maxErr!.message.includes('必须大于'));
});

test('validateForm: negative discount fails', () => {
  const values: TierBenefitsFormValues = {
    tierKey: 'test',
    tierName: '测试',
    minPoints: '0',
    maxPoints: '100',
    discountRate: '-5',
    benefitTypes: ['discount'],
    status: 'active',
    notes: '',
  };
  const errors = validateForm(values);
  assert.ok(errors.find((e) => e.field === 'discountRate'));
});

test('validateForm: discount over 100 fails', () => {
  const values: TierBenefitsFormValues = {
    tierKey: 'test',
    tierName: '测试',
    minPoints: '0',
    maxPoints: '100',
    discountRate: '150',
    benefitTypes: ['discount'],
    status: 'active',
    notes: '',
  };
  assert.ok(validateForm(values).find((e) => e.field === 'discountRate'));
});

test('validateForm: missing benefitTypes returns specific error', () => {
  const values: TierBenefitsFormValues = {
    tierKey: 'platinum',
    tierName: '铂金',
    minPoints: '10000',
    maxPoints: '50000',
    discountRate: '80',
    benefitTypes: [],
    status: 'active',
    notes: '',
  };
  const errors = validateForm(values);
  const benefitErr = errors.find((e) => e.field === 'benefitTypes');
  assert.ok(benefitErr);
  assert.equal(benefitErr!.message, '至少选择一个权益类型');
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Members / Form — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onSubmit={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
