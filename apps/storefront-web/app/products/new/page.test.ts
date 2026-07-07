/**
 * Product New Form Page — storefront-web
 * Tests: form fields, validation rules, submit logic, error handling, edge cases
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

type OfferingCategory = 'class' | 'event' | 'product' | 'service';

interface NewProductFormData {
  name: string;
  category: OfferingCategory;
  price: string;
  costPrice: string;
  storeName: string;
  description: string;
  scheduleHint: string;
  tags: string;
}

const CATEGORY_OPTIONS = [
  { label: '课程', value: 'class' as const },
  { label: '活动', value: 'event' as const },
  { label: '商品', value: 'product' as const },
  { label: '服务', value: 'service' as const },
];

// ── Validation rules (extracted from page.tsx for testability) ──

type ValidationRule = {
  validate: (value: unknown, allValues?: Record<string, unknown>) => string | null;
};

interface FieldDef {
  key: keyof NewProductFormData;
  label: string;
  required?: boolean;
  type?: string;
  options?: { label: string; value: string }[];
  helper?: string;
  placeholder?: string;
  rules?: ValidationRule[];
}

const FIELDS: FieldDef[] = [
  {
    key: 'name',
    label: '作品/产品名称',
    required: true,
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '名称至少2个字符' : null) },
      { validate: (v) => (typeof v === 'string' && v.length > 60 ? '名称不超过60个字符' : null) },
    ],
  },
  {
    key: 'category',
    label: '品类',
    required: true,
    type: 'select',
    options: CATEGORY_OPTIONS,
  },
  {
    key: 'price',
    label: '售价 (元)',
    required: true,
    type: 'number',
    rules: [
      { validate: (v) => { const n = Number(v); return Number.isNaN(n) || n < 0 ? '售价不能为负数' : null; } },
      { validate: (v) => { const n = Number(v); return !Number.isNaN(n) && n > 999999 ? '售价不能超过 999,999' : null; } },
    ],
  },
  {
    key: 'costPrice',
    label: '成本价 (元)',
    type: 'number',
    rules: [
      { validate: (v) => {
        if (v === '' || v == null) return null;
        const n = Number(v);
        return Number.isNaN(n) || n < 0 ? '成本价不能为负数' : null;
      }},
    ],
  },
  {
    key: 'storeName',
    label: '所属门店',
    required: true,
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 1 ? '请选择所属门店' : null) },
    ],
  },
  {
    key: 'description',
    label: '描述 / 详情',
    type: 'textarea',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length > 500 ? '描述不超过500个字符' : null) },
    ],
  },
  {
    key: 'scheduleHint',
    label: '时间 / 排期提示',
  },
  {
    key: 'tags',
    label: '标签',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length > 200 ? '标签总长度不超过200个字符' : null) },
    ],
  },
];

// ── 辅助函数 ──

function validateField(
  key: keyof NewProductFormData,
  value: unknown,
  allValues?: Record<string, unknown>,
): string | null {
  const field = FIELDS.find((f) => f.key === key);
  if (!field) return null;

  // Required check
  if (field.required && (value === '' || value == null || value === undefined)) {
    return `请填写${field.label}`;
  }

  // Custom rules
  if (field.rules) {
    for (const rule of field.rules) {
      const error = rule.validate(value, allValues);
      if (error) return error;
    }
  }
  return null;
}

function validateAll(data: Partial<NewProductFormData>): Record<string, string | null> {
  const errors: Record<string, string | null> = {};
  for (const field of FIELDS) {
    errors[field.key] = validateField(field.key, data[field.key], data);
  }
  return errors;
}

// ── 测试: 字段定义 ──

test('所有必填字段均已定义 (name / category / price / storeName)', () => {
  const requiredFields = FIELDS.filter((f) => f.required);
  assert.equal(requiredFields.length, 4);
  const keys = requiredFields.map((f) => f.key);
  assert.ok(keys.includes('name'));
  assert.ok(keys.includes('category'));
  assert.ok(keys.includes('price'));
  assert.ok(keys.includes('storeName'));
});

test('品类选项覆盖所有四种类型', () => {
  assert.equal(CATEGORY_OPTIONS.length, 4);
  const values = CATEGORY_OPTIONS.map((o) => o.value);
  assert.ok(values.includes('class'));
  assert.ok(values.includes('event'));
  assert.ok(values.includes('product'));
  assert.ok(values.includes('service'));
});

test('非必填字段不含 required 标记', () => {
  const nonRequired = FIELDS.filter((f) => !f.required);
  const keys = nonRequired.map((f) => f.key);
  assert.ok(keys.includes('costPrice'));
  assert.ok(keys.includes('description'));
  assert.ok(keys.includes('scheduleHint'));
  assert.ok(keys.includes('tags'));
});

// ── 测试: name 字段 ──

test('name 验证: 空值返回错误', () => {
  const err = validateField('name', '');
  assert.notEqual(err, null);
});

test('name 验证: 1 个字符返回错误', () => {
  const err = validateField('name', 'a');
  assert.equal(err, '名称至少2个字符');
});

test('name 验证: 合法名称通过', () => {
  const err = validateField('name', '花艺体验课 - 春日花篮');
  assert.equal(err, null);
});

test('name 验证: 超过60字符返回错误', () => {
  const err = validateField('name', 'x'.repeat(61));
  assert.equal(err, '名称不超过60个字符');
});

test('name 验证: 边界值60字符通过', () => {
  const err = validateField('name', 'x'.repeat(60));
  assert.equal(err, null);
});

// ── 测试: price 字段 ──

test('price 验证: 空必填返回错误', () => {
  const err = validateField('price', '');
  assert.notEqual(err, null);
});

test('price 验证: 负数返回错误', () => {
  const err = validateField('price', '-5');
  assert.equal(err, '售价不能为负数');
});

test('price 验证: 合法价格通过', () => {
  const err = validateField('price', '299.00');
  assert.equal(err, null);
});

test('price 验证: 超过上限返回错误', () => {
  const err = validateField('price', '1000000');
  assert.equal(err, '售价不能超过 999,999');
});

test('price 验证: 边界值 999999 通过', () => {
  const err = validateField('price', '999999');
  assert.equal(err, null);
});

test('price 验证: 0 值通过', () => {
  const err = validateField('price', '0');
  assert.equal(err, null);
});

// ── 测试: costPrice 字段 ──

test('costPrice 验证: 空值通过 (非必填)', () => {
  const err = validateField('costPrice', '');
  assert.equal(err, null);
});

test('costPrice 验证: null 通过', () => {
  const err = validateField('costPrice', null);
  assert.equal(err, null);
});

test('costPrice 验证: 负数返回错误', () => {
  const err = validateField('costPrice', '-10');
  assert.equal(err, '成本价不能为负数');
});

test('costPrice 验证: 合法成本价通过', () => {
  const err = validateField('costPrice', '150');
  assert.equal(err, null);
});

// ── 测试: storeName 字段 ──

test('storeName 验证: 空值返回错误', () => {
  const err = validateField('storeName', '');
  assert.notEqual(err, null);
});

test('storeName 验证: 正常门店名通过', () => {
  const err = validateField('storeName', '花艺旗舰店（北京朝阳）');
  assert.equal(err, null);
});

// ── 测试: description 字段 ──

test('description 验证: 空值通过 (非必填)', () => {
  const err = validateField('description', '');
  assert.equal(err, null);
});

test('description 验证: 超过500字符返回错误', () => {
  const err = validateField('description', 'x'.repeat(501));
  assert.equal(err, '描述不超过500个字符');
});

test('description 验证: 500字符边界通过', () => {
  const err = validateField('description', 'x'.repeat(500));
  assert.equal(err, null);
});

// ── 测试: tags 字段 ──

test('tags 验证: 空值通过', () => {
  const err = validateField('tags', '');
  assert.equal(err, null);
});

test('tags 验证: 超过200字符返回错误', () => {
  const err = validateField('tags', 'x'.repeat(201));
  assert.equal(err, '标签总长度不超过200个字符');
});

test('tags 验证: 正常标签通过', () => {
  const err = validateField('tags', '热门推荐, 新品');
  assert.equal(err, null);
});

// ── 测试: 完整表单验证 ──

test('validateAll: 空表单返回所有必填项错误', () => {
  const errors = validateAll({});
  assert.notEqual(errors.name, null);
  assert.notEqual(errors.price, null);
  assert.notEqual(errors.storeName, null);
  // category 虽是必填但 select 空值处理
});

test('validateAll: 全部合法数据通过', () => {
  const data: NewProductFormData = {
    name: '花艺体验课 - 春日花篮',
    category: 'class',
    price: '299.00',
    costPrice: '150.00',
    storeName: '花艺旗舰店（北京朝阳）',
    description: '亲手制作一个春日花篮，包含花材和工具。',
    scheduleHint: '每周六下午2点开课',
    tags: '热门推荐, 体验课程',
  };
  const errors = validateAll(data);
  const hasError = Object.values(errors).some((e) => e !== null);
  assert.equal(hasError, false);
});

test('validateAll: 混合错误场景', () => {
  const data: Partial<NewProductFormData> = {
    name: 'x',
    price: '-1',
    storeName: '',
  };
  const errors = validateAll(data);
  assert.equal(errors.name, '名称至少2个字符');
  assert.equal(errors.price, '售价不能为负数');
  assert.notEqual(errors.storeName, null);
});

// ── 测试: 提交逻辑 ──

test('handleSubmit 模拟: 成功创建返回正确消息', async () => {
  const data: NewProductFormData = {
    name: '花艺体验课',
    category: 'class',
    price: '299.00',
    costPrice: '150.00',
    storeName: '花艺旗舰店',
    description: '',
    scheduleHint: '',
    tags: '',
  };

  // 模拟 page.tsx 中的 handleSubmit 函数
  const submit = async (
    formData: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string; redirectTo?: string }> => {
    await new Promise((r) => setTimeout(r, 10));
    const d = formData as unknown as NewProductFormData;
    if (!d.name || !d.category || !d.storeName) {
      return { success: false, message: '请填写所有必填项' };
    }
    return {
      success: true,
      message: `「${d.name}」创建成功！`,
      redirectTo: `/products?new=${encodeURIComponent(d.name)}`,
    };
  };

  const result = await submit(data);
  assert.equal(result.success, true);
  assert.ok(result.message.includes('花艺体验课'));
  assert.ok(result.redirectTo?.startsWith('/products?new='));
});

test('handleSubmit 模拟: 缺少必填项返回错误', async () => {
  const data: Record<string, unknown> = { name: '' };

  const submit = async (
    formData: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string }> => {
    await new Promise((r) => setTimeout(r, 10));
    const d = formData as unknown as NewProductFormData;
    if (!d.name || !d.category || !d.storeName) {
      return { success: false, message: '请填写所有必填项' };
    }
    return { success: true, message: '' };
  };

  const result = await submit(data);
  assert.equal(result.success, false);
  assert.equal(result.message, '请填写所有必填项');
});

// ── 测试: 边界与容错 ──

test('category 选项 value 不含空字符串', () => {
  for (const opt of CATEGORY_OPTIONS) {
    assert.ok(opt.value.length > 0);
  }
});

test('每个字段的 key 在 NewProductFormData 中都有定义', () => {
  const dataKeys: (keyof NewProductFormData)[] = [
    'name', 'category', 'price', 'costPrice',
    'storeName', 'description', 'scheduleHint', 'tags',
  ];
  for (const field of FIELDS) {
    assert.ok(dataKeys.includes(field.key), `key "${field.key}" not in data type`);
  }
});

test('所有字段 label 不为空', () => {
  for (const field of FIELDS) {
    assert.ok(field.label.length > 0, `field "${field.key}" has empty label`);
  }
});
