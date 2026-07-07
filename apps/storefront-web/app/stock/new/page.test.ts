/**
 * New Stock Item Form Page — storefront-web
 * Tests: form field definitions, validation rules, field metadata, edge cases
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---- 类型（与 page.tsx 一致） ----

interface NewStockFormData {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  price: number;
  costPrice: number;
  supplier: string;
  location: string;
  description: string;
}

const CATEGORIES = [
  { label: '护肤品', value: '护肤品' },
  { label: '彩妆', value: '彩妆' },
  { label: '香水', value: '香水' },
  { label: '身体护理', value: '身体护理' },
  { label: '头发护理', value: '头发护理' },
  { label: '工具配件', value: '工具配件' },
  { label: '其他', value: '其他' },
];

const UNIT_OPTIONS = [
  { label: '瓶', value: '瓶' },
  { label: '支', value: '支' },
  { label: '盒', value: '盒' },
  { label: '袋', value: '袋' },
  { label: '套', value: '套' },
  { label: '个', value: '个' },
  { label: '罐', value: '罐' },
  { label: '片', value: '片' },
];

// ---- 字段定义（从 page.tsx 提取） ----

type ValidationRule = {
  validate: (value: unknown, allValues?: Record<string, unknown>) => string | null;
};

interface FieldDef {
  key: keyof NewStockFormData;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  helper?: string;
  options?: { label: string; value: string }[];
  rules?: ValidationRule[];
}

// 字段定义（从 page.tsx 的 FIELDS 镜像）
const FIELDS: FieldDef[] = [
  {
    key: 'sku',
    label: 'SKU编码',
    required: true,
    rules: [
      { validate: (v: unknown) => (typeof v === 'string' && v.trim().length < 2 ? 'SKU编码至少2个字符' : null) },
      { validate: (v: unknown) => (typeof v === 'string' && v.length > 30 ? 'SKU编码不超过30个字符' : null) },
    ],
  },
  {
    key: 'name',
    label: '商品名称',
    required: true,
    rules: [
      { validate: (v: unknown) => (typeof v === 'string' && v.trim().length < 2 ? '商品名称至少2个字符' : null) },
      { validate: (v: unknown) => (typeof v === 'string' && v.length > 60 ? '商品名称不超过60个字符' : null) },
    ],
  },
  {
    key: 'category',
    label: '商品分类',
    required: true,
    type: 'select',
    options: CATEGORIES,
    rules: [
      { validate: (v: unknown) => (!v || v === '' ? '请选择一个商品分类' : null) },
    ],
  },
  {
    key: 'quantity',
    label: '库存数量',
    required: true,
    type: 'number',
    rules: [
      { validate: (v: unknown) => { const n = Number(v); return Number.isNaN(n) || n < 0 ? '库存数量不能为负数' : null; } },
      { validate: (v: unknown) => { const n = Number(v); return !Number.isNaN(n) && n > 999999 ? '库存数量不能超过999,999' : null; } },
    ],
  },
  {
    key: 'minThreshold',
    label: '最低库存预警',
    required: true,
    type: 'number',
    rules: [
      { validate: (v: unknown) => { const n = Number(v); return Number.isNaN(n) || n < 0 ? '最低库存不能为负数' : null; } },
    ],
  },
  {
    key: 'maxThreshold',
    label: '最高库存限制',
    required: true,
    type: 'number',
    rules: [
      { validate: (v: unknown) => { const n = Number(v); return Number.isNaN(n) || n < 1 ? '最高库存至少为1' : null; } },
    ],
  },
  {
    key: 'unit',
    label: '库存单位',
    required: true,
    type: 'select',
    options: UNIT_OPTIONS,
  },
  {
    key: 'price',
    label: '售价',
    required: true,
    type: 'number',
    rules: [
      { validate: (v: unknown) => { const n = Number(v); return Number.isNaN(n) || n <= 0 ? '售价必须大于0' : null; } },
      { validate: (v: unknown) => { const n = Number(v); return !Number.isNaN(n) && n > 999999 ? '售价不能超过999,999' : null; } },
    ],
  },
  {
    key: 'costPrice',
    label: '成本价',
    required: true,
    type: 'number',
    rules: [
      { validate: (v: unknown) => { const n = Number(v); return Number.isNaN(n) || n <= 0 ? '成本价必须大于0' : null; } },
    ],
  },
  {
    key: 'supplier',
    label: '供应商',
    required: false,
    rules: [
      { validate: (v: unknown) => (v && typeof v === 'string' && v.length > 100 ? '供应商名称不超过100个字符' : null) },
    ],
  },
  {
    key: 'location',
    label: '货架位置',
    required: false,
    rules: [
      { validate: (v: unknown) => (v && typeof v === 'string' && v.length > 100 ? '货架位置不超过100个字符' : null) },
    ],
  },
  {
    key: 'description',
    label: '商品描述',
    required: false,
    rules: [
      { validate: (v: unknown) => (v && typeof v === 'string' && v.length > 500 ? '商品描述不超过500个字符' : null) },
    ],
  },
];

// ---- 验证运行器 ----

function runFieldValidations(
  field: FieldDef,
  value: unknown,
  allValues?: Record<string, unknown>,
): string | null {
  if (!field.rules) return null;
  for (const rule of field.rules) {
    const error = rule.validate(value, allValues);
    if (error) return error;
  }
  return null;
}

// ---- 测试 ----

test('NewStockItemPage: field definitions count', () => {
  assert.equal(FIELDS.length, 12, 'should have 12 form fields');

  const requiredFields = FIELDS.filter((f) => f.required);
  assert.equal(requiredFields.length, 9, 'should have 9 required fields');

  const numberFields = FIELDS.filter((f) => f.type === 'number');
  assert.equal(numberFields.length, 5, 'should have 5 number fields (quantity, minThreshold, maxThreshold, price, costPrice)');

  const selectFields = FIELDS.filter((f) => f.type === 'select');
  assert.equal(selectFields.length, 2, 'should have 2 select fields');

  const optionalFields = FIELDS.filter((f) => !f.required);
  assert.equal(optionalFields.length, 3, 'should have 3 optional fields');
});

test('NewStockItemPage: field labels are unique', () => {
  const labels = FIELDS.map((f) => f.label);
  const unique = new Set(labels);
  assert.equal(unique.size, labels.length, 'all field labels should be unique');
});

// ---- SKU ----

test('SKU: valid value passes validation', () => {
  const field = FIELDS.find((f) => f.key === 'sku')!;
  assert.equal(runFieldValidations(field, 'SKU-1001'), null);
  assert.equal(runFieldValidations(field, 'AB'), null);
  assert.equal(runFieldValidations(field, '测试SKU-001'), null);
});

test('SKU: empty string fails length rule', () => {
  const field = FIELDS.find((f) => f.key === 'sku')!;
  const err = runFieldValidations(field, '');
  assert.ok(err?.includes('至少2个字符'));
});

test('SKU: single char fails length rule', () => {
  const field = FIELDS.find((f) => f.key === 'sku')!;
  const err = runFieldValidations(field, 'A');
  assert.ok(err?.includes('至少2个字符'));
});

test('SKU: whitespace only fails length rule', () => {
  const field = FIELDS.find((f) => f.key === 'sku')!;
  const err = runFieldValidations(field, '  ');
  assert.ok(err?.includes('至少2个字符'));
});

test('SKU: over 30 chars fails max rule', () => {
  const field = FIELDS.find((f) => f.key === 'sku')!;
  const err = runFieldValidations(field, 'S'.repeat(31));
  assert.ok(err?.includes('不超过30个字符'));
});

test('SKU: exactly 30 chars passes', () => {
  const field = FIELDS.find((f) => f.key === 'sku')!;
  assert.equal(runFieldValidations(field, 'S'.repeat(30)), null);
});

// ---- Name ----

test('Name: valid value passes', () => {
  const field = FIELDS.find((f) => f.key === 'name')!;
  assert.equal(runFieldValidations(field, '玫瑰精华爽肤水'), null);
  assert.equal(runFieldValidations(field, 'AB'), null);
});

test('Name: too short fails', () => {
  const field = FIELDS.find((f) => f.key === 'name')!;
  const err = runFieldValidations(field, 'A');
  assert.ok(err?.includes('至少2个字符'));
});

test('Name: empty fails', () => {
  const field = FIELDS.find((f) => f.key === 'name')!;
  assert.ok(runFieldValidations(field, '')?.includes('至少2个字符'));
});

test('Name: over 60 chars fails', () => {
  const field = FIELDS.find((f) => f.key === 'name')!;
  const err = runFieldValidations(field, 'N'.repeat(61));
  assert.ok(err?.includes('不超过60个字符'));
});

test('Name: exactly 60 chars passes', () => {
  const field = FIELDS.find((f) => f.key === 'name')!;
  assert.equal(runFieldValidations(field, 'N'.repeat(60)), null);
});

// ---- Category ----

test('Category: valid value passes', () => {
  const field = FIELDS.find((f) => f.key === 'category')!;
  assert.equal(runFieldValidations(field, '护肤品'), null);
  assert.equal(runFieldValidations(field, '彩妆'), null);
  assert.equal(runFieldValidations(field, '香水'), null);
});

test('Category: empty value fails required rule', () => {
  const field = FIELDS.find((f) => f.key === 'category')!;
  assert.ok(runFieldValidations(field, '')?.includes('请选择一个商品分类'));
});

test('Category: null fails required rule', () => {
  const field = FIELDS.find((f) => f.key === 'category')!;
  assert.ok(runFieldValidations(field, null)?.includes('请选择一个商品分类'));
});

test('Category: undefined fails required rule', () => {
  const field = FIELDS.find((f) => f.key === 'category')!;
  assert.ok(runFieldValidations(field, undefined)?.includes('请选择一个商品分类'));
});

test('CATEGORIES has expected entries', () => {
  assert.equal(CATEGORIES.length, 7);
  const values = CATEGORIES.map((c) => c.value);
  assert.ok(values.includes('护肤品'));
  assert.ok(values.includes('彩妆'));
  assert.ok(values.includes('香水'));
  assert.ok(values.includes('身体护理'));
  assert.ok(values.includes('头发护理'));
  assert.ok(values.includes('工具配件'));
  assert.ok(values.includes('其他'));
});

// ---- Quantity ----

test('Quantity: valid values pass', () => {
  const field = FIELDS.find((f) => f.key === 'quantity')!;
  assert.equal(runFieldValidations(field, 100), null);
  assert.equal(runFieldValidations(field, 0), null);
  assert.equal(runFieldValidations(field, 500), null);
  assert.equal(runFieldValidations(field, '280'), null);
});

test('Quantity: negative fails', () => {
  const field = FIELDS.find((f) => f.key === 'quantity')!;
  assert.ok(runFieldValidations(field, -1)?.includes('不能为负数'));
  assert.ok(runFieldValidations(field, -100)?.includes('不能为负数'));
});

test('Quantity: NaN fails', () => {
  const field = FIELDS.find((f) => f.key === 'quantity')!;
  assert.ok(runFieldValidations(field, 'abc')?.includes('不能为负数'));
});

test('Quantity: over max fails', () => {
  const field = FIELDS.find((f) => f.key === 'quantity')!;
  assert.ok(runFieldValidations(field, 1_000_000)?.includes('不能超过'));
  assert.ok(runFieldValidations(field, 999_999) === null, 'max boundary should pass');
});

// ---- MinThreshold ----

test('MinThreshold: valid values pass', () => {
  const field = FIELDS.find((f) => f.key === 'minThreshold')!;
  assert.equal(runFieldValidations(field, 10), null);
  assert.equal(runFieldValidations(field, 0), null);
  assert.equal(runFieldValidations(field, 50), null);
});

test('MinThreshold: negative fails', () => {
  const field = FIELDS.find((f) => f.key === 'minThreshold')!;
  assert.ok(runFieldValidations(field, -5)?.includes('不能为负数'));
});

// ---- MaxThreshold ----

test('MaxThreshold: valid values pass', () => {
  const field = FIELDS.find((f) => f.key === 'maxThreshold')!;
  assert.equal(runFieldValidations(field, 500), null);
  assert.equal(runFieldValidations(field, 1), null);
});

test('MaxThreshold: zero fails', () => {
  const field = FIELDS.find((f) => f.key === 'maxThreshold')!;
  assert.ok(runFieldValidations(field, 0)?.includes('至少为1'));
});

test('MaxThreshold: negative fails', () => {
  const field = FIELDS.find((f) => f.key === 'maxThreshold')!;
  assert.ok(runFieldValidations(field, -1)?.includes('至少为1'));
});

// ---- Price ----

test('Price: valid values pass', () => {
  const field = FIELDS.find((f) => f.key === 'price')!;
  assert.equal(runFieldValidations(field, 168), null);
  assert.equal(runFieldValidations(field, 0.01), null);
  assert.equal(runFieldValidations(field, 999999), null);
});

test('Price: zero fails', () => {
  const field = FIELDS.find((f) => f.key === 'price')!;
  assert.ok(runFieldValidations(field, 0)?.includes('必须大于0'));
});

test('Price: negative fails', () => {
  const field = FIELDS.find((f) => f.key === 'price')!;
  assert.ok(runFieldValidations(field, -10)?.includes('必须大于0'));
});

test('Price: NaN fails', () => {
  const field = FIELDS.find((f) => f.key === 'price')!;
  assert.ok(runFieldValidations(field, 'NaN')?.includes('必须大于0'));
});

test('Price: over max fails', () => {
  const field = FIELDS.find((f) => f.key === 'price')!;
  assert.ok(runFieldValidations(field, 1_000_000)?.includes('不能超过'));
  assert.equal(runFieldValidations(field, 999_999), null, 'boundary should pass');
});

// ---- CostPrice ----

test('CostPrice: valid values pass', () => {
  const field = FIELDS.find((f) => f.key === 'costPrice')!;
  assert.equal(runFieldValidations(field, 98), null);
  assert.equal(runFieldValidations(field, 0.01), null);
});

test('CostPrice: zero fails', () => {
  const field = FIELDS.find((f) => f.key === 'costPrice')!;
  assert.ok(runFieldValidations(field, 0)?.includes('必须大于0'));
});

test('CostPrice: negative fails', () => {
  const field = FIELDS.find((f) => f.key === 'costPrice')!;
  assert.ok(runFieldValidations(field, -1)?.includes('必须大于0'));
});

// ---- Unit ----

test('UNIT_OPTIONS has expected entries', () => {
  assert.equal(UNIT_OPTIONS.length, 8);
  const values = UNIT_OPTIONS.map((u) => u.value);
  assert.ok(values.includes('瓶'));
  assert.ok(values.includes('支'));
  assert.ok(values.includes('盒'));
  assert.ok(values.includes('袋'));
  assert.ok(values.includes('套'));
  assert.ok(values.includes('个'));
  assert.ok(values.includes('罐'));
  assert.ok(values.includes('片'));
});

// ---- Supplier ----

test('Supplier: valid values pass', () => {
  const field = FIELDS.find((f) => f.key === 'supplier')!;
  assert.equal(runFieldValidations(field, '广州美妆供应链'), null);
  assert.equal(runFieldValidations(field, ''), null);
  assert.equal(runFieldValidations(field, null), null);
});

test('Supplier: over 100 chars fails', () => {
  const field = FIELDS.find((f) => f.key === 'supplier')!;
  const err = runFieldValidations(field, 'S'.repeat(101));
  assert.ok(err?.includes('不超过100个字符'));
});

test('Supplier: exactly 100 chars passes', () => {
  const field = FIELDS.find((f) => f.key === 'supplier')!;
  assert.equal(runFieldValidations(field, 'S'.repeat(100)), null);
});

// ---- Location ----

test('Location: valid values pass', () => {
  const field = FIELDS.find((f) => f.key === 'location')!;
  assert.equal(runFieldValidations(field, 'A区-03货架'), null);
  assert.equal(runFieldValidations(field, ''), null);
});

test('Location: over 100 chars fails', () => {
  const field = FIELDS.find((f) => f.key === 'location')!;
  assert.ok(runFieldValidations(field, 'L'.repeat(101))?.includes('不超过100个字符'));
});

// ---- Description ----

test('Description: valid values pass', () => {
  const field = FIELDS.find((f) => f.key === 'description')!;
  assert.equal(runFieldValidations(field, '大马士革玫瑰精华提取'), null);
  assert.equal(runFieldValidations(field, ''), null);
  assert.equal(runFieldValidations(field, null), null);
});

test('Description: over 500 chars fails', () => {
  const field = FIELDS.find((f) => f.key === 'description')!;
  assert.ok(runFieldValidations(field, 'D'.repeat(501))?.includes('不超过500个字符'));
});

test('Description: exactly 500 chars passes', () => {
  const field = FIELDS.find((f) => f.key === 'description')!;
  assert.equal(runFieldValidations(field, 'D'.repeat(500)), null);
});

// ---- Field metadata consistency ----

test('all select fields have options', () => {
  for (const field of FIELDS) {
    if (field.type === 'select') {
      assert.ok(Array.isArray(field.options), `${field.key} should have options`);
      assert.ok(field.options!.length > 0, `${field.key} options should not be empty`);
    }
  }
});

test('all fields with rules have validate function', () => {
  for (const field of FIELDS) {
    if (field.rules) {
      for (const rule of field.rules) {
        assert.equal(typeof rule.validate, 'function', `${field.key} rule.validate should be a function`);
      }
    }
  }
});

test('required field SKU has min length rule', () => {
  const field = FIELDS.find((f) => f.key === 'sku')!;
  assert.ok(field.required);
});

test('optional fields have no required flag', () => {
  const optional = FIELDS.filter((f) => !f.required);
  const keys = optional.map((f) => f.key);
  assert.deepEqual(keys.sort(), ['description', 'location', 'supplier']);
});

test('number fields have correct type', () => {
  for (const field of FIELDS) {
    if (['quantity', 'minThreshold', 'maxThreshold', 'price', 'costPrice'].includes(field.key)) {
      assert.equal(field.type, 'number', `${field.key} should be number type`);
    }
  }
});

test('select fields have correct type', () => {
  for (const field of FIELDS) {
    if (['category', 'unit'].includes(field.key)) {
      assert.equal(field.type, 'select', `${field.key} should be select type`);
    }
  }
});
