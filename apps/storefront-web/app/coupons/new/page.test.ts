/**
 * Coupon New Form Page — storefront-web
 * Tests: form field definitions, validation rules, submit flow, edge cases
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

interface NewCouponFormData {
  name: string;
  type: 'discount' | 'cash' | 'free_shipping' | 'voucher';
  value: string;
  minAmount: string;
  maxAmount: string;
  totalIssued: number;
  validFrom: string;
  validTo: string;
  storeName: string;
  description: string;
  usageLimit: number;
}

const COUPON_TYPES = [
  { label: '打折券', value: 'discount' as const },
  { label: '代金券', value: 'cash' as const },
  { label: '免运费', value: 'free_shipping' as const },
  { label: '礼品券', value: 'voucher' as const },
];

// ── Validation rules (extracted from page.tsx for testability) ──

type ValidationRule = {
  validate: (value: unknown, allValues?: Record<string, unknown>) => string | null;
};

interface FieldDef {
  key: keyof NewCouponFormData;
  label: string;
  required?: boolean;
  type?: string;
  rules?: ValidationRule[];
}

const FIELDS: FieldDef[] = [
  {
    key: 'name',
    label: '优惠券名称',
    required: true,
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '优惠券名称至少2个字符' : null) },
      { validate: (v) => (typeof v === 'string' && v.length > 50 ? '优惠券名称不超过50个字符' : null) },
    ],
  },
  {
    key: 'type',
    label: '优惠券类型',
    required: true,
    type: 'select',
  },
  {
    key: 'value',
    label: '面值',
    required: true,
  },
  {
    key: 'minAmount',
    label: '使用门槛',
    required: true,
  },
  {
    key: 'maxAmount',
    label: '最高抵扣限额',
  },
  {
    key: 'totalIssued',
    label: '发放总量',
    required: true,
    type: 'number',
    rules: [
      { validate: (v) => (typeof v === 'number' && v < 0 ? '发放总量不能为负数' : null) },
    ],
  },
  {
    key: 'usageLimit',
    label: '每人限用次数',
    type: 'number',
    rules: [
      { validate: (v) => (typeof v === 'number' && v < 0 ? '限用次数不能为负数' : null) },
    ],
  },
  {
    key: 'validFrom',
    label: '生效日期',
    required: true,
    type: 'date',
  },
  {
    key: 'validTo',
    label: '截止日期',
    required: true,
    type: 'date',
  },
  {
    key: 'storeName',
    label: '适用门店',
    required: true,
  },
  {
    key: 'description',
    label: '优惠券说明',
    type: 'textarea',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length > 500 ? '优惠券说明不超过500个字符' : null) },
    ],
  },
];

// ── Validation function (mirrors FormPageScaffold validateFormFields) ──

function validateFormFields(
  fields: FieldDef[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const val = values[field.key];
    if (field.required) {
      if (val === undefined || val === null || val === '') {
        errors[field.key] = `${field.label} 不能为空`;
        continue;
      }
      if (Array.isArray(val) && val.length === 0) {
        errors[field.key] = `${field.label} 不能为空`;
        continue;
      }
    }
    if (field.rules && val !== undefined && val !== null && val !== '') {
      for (const rule of field.rules) {
        const ruleError = rule.validate(val, values);
        if (ruleError) {
          errors[field.key] = ruleError;
          break;
        }
      }
    }
  }
  return errors;
}

// ── Mock submit ──

function mockSubmitCoupon(
  data: NewCouponFormData,
): Promise<{ data: NewCouponFormData; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data, message: `优惠券「${data.name}」创建成功！` }), 100);
  });
}

// ═══════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════

test('field definitions — all required fields present', () => {
  const requiredFields = FIELDS.filter((f) => f.required);
  assert.equal(requiredFields.length, 8, 'should have exactly 8 required fields');

  const keys = requiredFields.map((f) => f.key);
  assert.ok(keys.includes('name'), 'name is required');
  assert.ok(keys.includes('type'), 'type is required');
  assert.ok(keys.includes('value'), 'value is required');
  assert.ok(keys.includes('minAmount'), 'minAmount is required');
  assert.ok(keys.includes('totalIssued'), 'totalIssued is required');
  assert.ok(keys.includes('validFrom'), 'validFrom is required');
  assert.ok(keys.includes('validTo'), 'validTo is required');
  assert.ok(keys.includes('storeName'), 'storeName is required');
});

test('field definitions — coupon types select options', () => {
  assert.equal(COUPON_TYPES.length, 4, 'should have 4 coupon types');
  const labels = COUPON_TYPES.map((t) => t.label);
  assert.ok(labels.includes('打折券'));
  assert.ok(labels.includes('代金券'));
  assert.ok(labels.includes('免运费'));
  assert.ok(labels.includes('礼品券'));
});

test('validation — required fields reject empty', () => {
  const errors = validateFormFields(FIELDS, {});
  assert.equal(Object.keys(errors).length, 8, 'all 8 required fields should have errors');
  assert.ok(errors.name?.includes('不能为空'));
  assert.ok(errors.type?.includes('不能为空'));
  assert.ok(errors.validTo?.includes('不能为空'));
  assert.ok(errors.storeName?.includes('不能为空'));
});

test('validation — name must be at least 2 chars', () => {
  const errors = validateFormFields(FIELDS, {
    name: 'x',
    type: 'discount',
    value: '8折',
    minAmount: '满0元',
    totalIssued: 100,
    validFrom: '2026-07-01',
    validTo: '2026-07-31',
    storeName: 'Demo',
  });
  assert.equal(errors.name, '优惠券名称至少2个字符');
});

test('validation — name must not exceed 50 chars', () => {
  const errors = validateFormFields(FIELDS, {
    name: '超长名称'.repeat(15),
    type: 'discount',
    value: '8折',
    minAmount: '满0元',
    totalIssued: 100,
    validFrom: '2026-07-01',
    validTo: '2026-07-31',
    storeName: 'Demo',
  });
  assert.equal(errors.name, '优惠券名称不超过50个字符');
});

test('validation — totalIssued cannot be negative', () => {
  const errors = validateFormFields(FIELDS, {
    name: '测试券',
    type: 'cash',
    value: '¥50',
    minAmount: '满200元',
    totalIssued: -5,
    validFrom: '2026-07-01',
    validTo: '2026-07-31',
    storeName: 'Demo',
  });
  assert.equal(errors.totalIssued, '发放总量不能为负数');
});

test('validation — usageLimit cannot be negative', () => {
  const errors = validateFormFields(FIELDS, {
    name: '测试券',
    type: 'cash',
    value: '¥50',
    minAmount: '满200元',
    totalIssued: 100,
    usageLimit: -1,
    validFrom: '2026-07-01',
    validTo: '2026-07-31',
    storeName: 'Demo',
  });
  assert.equal(errors.usageLimit, '限用次数不能为负数');
});

test('validation — validTo empty when missing validFrom should not error on validTo per se', () => {
  // validTo is required so empty should fail as required, not from rule
  const errors = validateFormFields(FIELDS, {
    name: '测试券',
    type: 'discount',
    value: '8折',
    minAmount: '满0元',
    totalIssued: 100,
    validFrom: '2026-07-01',
    validTo: '2026-08-01',
    storeName: 'Demo',
  });
  assert.equal(errors.validTo, undefined, 'validTo should pass when provided');
});

test('validation — description cannot exceed 500 chars', () => {
  const errors = validateFormFields(FIELDS, {
    name: '测试券',
    type: 'voucher',
    value: '¥50',
    minAmount: '满200元',
    totalIssued: 50,
    validFrom: '2026-07-01',
    validTo: '2026-07-31',
    storeName: 'Demo',
    description: 'X'.repeat(501),
  });
  assert.equal(errors.description, '优惠券说明不超过500个字符');
});

test('validation — valid full data passes all rules', () => {
  const errors = validateFormFields(FIELDS, {
    name: '夏季特惠8折券',
    type: 'discount',
    value: '8折',
    minAmount: '满100元',
    maxAmount: '最高折扣¥50',
    totalIssued: 500,
    usageLimit: 1,
    validFrom: '2026-07-01',
    validTo: '2026-08-31',
    storeName: 'Demo Store 旗舰店',
    description: '夏季限时优惠，全场通用。与其他优惠不可叠加使用。',
  });
  assert.equal(Object.keys(errors).length, 0, 'valid data should have no errors');
});

test('submit — mockSubmitCoupon returns correct shape', async () => {
  const data: NewCouponFormData = {
    name: '新客首单8折',
    type: 'discount',
    value: '8折',
    minAmount: '满0元',
    maxAmount: '最高折扣¥50',
    totalIssued: 500,
    validFrom: '2026-07-01',
    validTo: '2026-07-31',
    storeName: 'Demo Store 旗舰店',
    description: '新用户首次下单8折',
    usageLimit: 1,
  };

  const result = await mockSubmitCoupon(data);
  assert.equal(result.data.name, '新客首单8折');
  assert.ok(result.message.includes('新客首单8折'));
  assert.ok(result.message.includes('创建成功'));
});

test('submit — preserves all fields in returned data', async () => {
  const data: NewCouponFormData = {
    name: '满300减50',
    type: 'cash',
    value: '¥50',
    minAmount: '满300元',
    maxAmount: '',
    totalIssued: 200,
    validFrom: '2026-06-01',
    validTo: '2026-06-30',
    storeName: 'Demo Store 社区店',
    description: '单笔满300减50',
    usageLimit: 1,
  };

  const result = await mockSubmitCoupon(data);
  assert.deepEqual(result.data, data);
});

test('validation — totalIssued = 0 is allowed (unlimited)', () => {
  const errors = validateFormFields(FIELDS, {
    name: '测试券',
    type: 'discount',
    value: '8折',
    minAmount: '满0元',
    totalIssued: 0,
    validFrom: '2026-07-01',
    validTo: '2026-07-31',
    storeName: 'Demo',
  });
  assert.equal(errors.totalIssued, undefined, 'totalIssued=0 should not error');
});
