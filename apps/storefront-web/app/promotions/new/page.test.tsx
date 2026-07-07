/**
 * Promotion New Form Page — storefront-web
 * Tests: form field definitions, validation rules, submit flow, edge cases
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型（与 page.tsx 一致）──

interface NewPromotionFormData {
  title: string;
  type: 'discount' | 'coupon' | 'gift' | 'flash-sale';
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageLimit: number;
  storeName: string;
}

const PROMOTION_TYPES = [
  { label: '折扣', value: 'discount' as const },
  { label: '优惠券', value: 'coupon' as const },
  { label: '赠品', value: 'gift' as const },
  { label: '秒杀', value: 'flash-sale' as const },
];

// ── Validation rules（从 page.tsx 提取用于可测试性）──

type ValidationRule = {
  validate: (value: unknown, allValues?: Record<string, unknown>) => string | null;
};

interface FieldDef {
  key: keyof NewPromotionFormData;
  label: string;
  required?: boolean;
  type?: string;
  rules?: ValidationRule[];
}

const FIELDS: FieldDef[] = [
  {
    key: 'title',
    label: '活动标题',
    required: true,
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length < 2 ? '活动标题至少2个字符' : null,
      },
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length > 50 ? '活动标题不超过50个字符' : null,
      },
    ],
  },
  {
    key: 'type',
    label: '活动类型',
    required: true,
    type: 'select',
  },
  {
    key: 'description',
    label: '活动描述',
    required: true,
    type: 'textarea',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'string' && v.length > 500 ? '活动描述不超过500个字符' : null,
      },
    ],
  },
  {
    key: 'startDate',
    label: '开始日期',
    required: true,
    type: 'date',
  },
  {
    key: 'endDate',
    label: '结束日期',
    required: true,
    type: 'date',
  },
  {
    key: 'budget',
    label: '预算 (¥)',
    required: true,
    type: 'number',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'number' && v < 0 ? '预算不能为负数' : null,
      },
    ],
  },
  {
    key: 'usageLimit',
    label: '使用上限',
    required: true,
    type: 'number',
    rules: [
      {
        validate: (v: unknown) =>
          typeof v === 'number' && v < 0 ? '使用上限不能为负数' : null,
      },
    ],
  },
  {
    key: 'storeName',
    label: '所属门店',
    required: true,
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

function mockSubmitPromotion(
  data: NewPromotionFormData,
): Promise<{ data: NewPromotionFormData; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data, message: `促销活动「${data.title}」创建成功！` }), 100);
  });
}

// ═══════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════

test('field definitions — all required fields present', () => {
  const requiredFields = FIELDS.filter((f) => f.required);
  assert.equal(requiredFields.length, 8, 'should have exactly 8 required fields');

  const keys = requiredFields.map((f) => f.key);
  assert.ok(keys.includes('title'), 'title is required');
  assert.ok(keys.includes('type'), 'type is required');
  assert.ok(keys.includes('description'), 'description is required');
  assert.ok(keys.includes('startDate'), 'startDate is required');
  assert.ok(keys.includes('endDate'), 'endDate is required');
  assert.ok(keys.includes('budget'), 'budget is required');
  assert.ok(keys.includes('usageLimit'), 'usageLimit is required');
  assert.ok(keys.includes('storeName'), 'storeName is required');
});

test('field definitions — promotion types select options', () => {
  assert.equal(PROMOTION_TYPES.length, 4, 'should have 4 promotion types');
  const labels = PROMOTION_TYPES.map((t) => t.label);
  assert.ok(labels.includes('折扣'));
  assert.ok(labels.includes('优惠券'));
  assert.ok(labels.includes('赠品'));
  assert.ok(labels.includes('秒杀'));
});

test('validation — required fields reject empty', () => {
  const errors = validateFormFields(FIELDS, {});
  assert.equal(Object.keys(errors).length, 8, 'all 8 required fields should have errors');
  assert.ok(errors.title?.includes('不能为空'));
  assert.ok(errors.type?.includes('不能为空'));
  assert.ok(errors.description?.includes('不能为空'));
  assert.ok(errors.budget?.includes('不能为空'));
  assert.ok(errors.storeName?.includes('不能为空'));
});

test('validation — title must be at least 2 chars', () => {
  const errors = validateFormFields(FIELDS, {
    title: 'x',
    type: 'discount',
    description: '测试活动',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 50000,
    usageLimit: 500,
    storeName: 'Demo Store',
  });
  assert.equal(errors.title, '活动标题至少2个字符');
});

test('validation — title must not exceed 50 chars', () => {
  const errors = validateFormFields(FIELDS, {
    title: '超长标题'.repeat(15),
    type: 'discount',
    description: '测试活动',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 50000,
    usageLimit: 500,
    storeName: 'Demo Store',
  });
  assert.equal(errors.title, '活动标题不超过50个字符');
});

test('validation — budget cannot be negative', () => {
  const errors = validateFormFields(FIELDS, {
    title: '夏日清凉大促',
    type: 'discount',
    description: '全场打折',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: -100,
    usageLimit: 500,
    storeName: 'Demo Store',
  });
  assert.equal(errors.budget, '预算不能为负数');
});

test('validation — usageLimit cannot be negative', () => {
  const errors = validateFormFields(FIELDS, {
    title: '夏日清凉大促',
    type: 'discount',
    description: '全场打折',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 50000,
    usageLimit: -1,
    storeName: 'Demo Store',
  });
  assert.equal(errors.usageLimit, '使用上限不能为负数');
});

test('validation — description cannot exceed 500 chars', () => {
  const errors = validateFormFields(FIELDS, {
    title: '测试活动',
    type: 'flash-sale',
    description: 'X'.repeat(501),
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 80000,
    usageLimit: 300,
    storeName: 'Demo Store',
  });
  assert.equal(errors.description, '活动描述不超过500个字符');
});

test('validation — valid full data passes all rules', () => {
  const errors = validateFormFields(FIELDS, {
    title: '夏日清凉大促',
    type: 'discount',
    description: '全场商品8折起，覆盖夏季新品和经典热销款。',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 50000,
    usageLimit: 500,
    storeName: 'Demo Store 旗舰店',
  });
  assert.equal(Object.keys(errors).length, 0, 'valid data should have no errors');
});

test('submit — mockSubmitPromotion returns correct shape', async () => {
  const data: NewPromotionFormData = {
    title: '夏日清凉大促',
    type: 'discount',
    description: '全场商品8折起',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 50000,
    usageLimit: 500,
    storeName: 'Demo Store 旗舰店',
  };

  const result = await mockSubmitPromotion(data);
  assert.equal(result.data.title, '夏日清凉大促');
  assert.ok(result.message.includes('夏日清凉大促'));
  assert.ok(result.message.includes('创建成功'));
});

test('submit — preserves all fields in returned data', async () => {
  const data: NewPromotionFormData = {
    title: '买一送一活动',
    type: 'gift',
    description: '指定饮品买一送一',
    startDate: '2026-06-10',
    endDate: '2026-07-10',
    budget: 20000,
    usageLimit: 500,
    storeName: 'Demo Store 福田分店',
  };

  const result = await mockSubmitPromotion(data);
  assert.deepEqual(result.data, data);
});

test('validation — budget = 0 is allowed', () => {
  const errors = validateFormFields(FIELDS, {
    title: '测试活动',
    type: 'discount',
    description: '测试',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 0,
    usageLimit: 500,
    storeName: 'Demo',
  });
  assert.equal(errors.budget, undefined, 'budget=0 should not error');
});

test('validation — usageLimit = 0 is allowed (unlimited)', () => {
  const errors = validateFormFields(FIELDS, {
    title: '测试活动',
    type: 'discount',
    description: '测试',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 50000,
    usageLimit: 0,
    storeName: 'Demo',
  });
  assert.equal(errors.usageLimit, undefined, 'usageLimit=0 should not error');
});
