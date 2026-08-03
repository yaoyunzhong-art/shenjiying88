/**
 * Coupons New Form Page — storefront-web (源码分析模式)
 * Tests: status mapping, stat computation, data formatting, validation, coupon logic
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ═══════════════════════════════════════════════
//  类型 & 常量（与 page.tsx 一致）
// ═══════════════════════════════════════════════

type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';

interface NewCouponFormData {
  name: string;
  type: CouponType;
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

const COUPON_TYPES: { label: string; value: CouponType }[] = [
  { label: '打折券', value: 'discount' },
  { label: '代金券', value: 'cash' },
  { label: '免运费', value: 'free_shipping' },
  { label: '礼品券', value: 'voucher' },
];

const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费',
  voucher: '礼品券',
};

const COUPON_TYPE_COLORS: Record<CouponType, string> = {
  discount: '#3b82f6',
  cash: '#f59e0b',
  free_shipping: '#10b981',
  voucher: '#8b5cf6',
};

const COUPON_TYPE_ALL: CouponType[] = ['discount', 'cash', 'free_shipping', 'voucher'];

// ── 工具函数 ──

function renderCouponTypeLabel(type: CouponType): string {
  return COUPON_TYPE_LABELS[type] ?? '未知类型';
}

function renderCouponTypeColor(type: CouponType): string {
  return COUPON_TYPE_COLORS[type] ?? '#64748b';
}

function formatCouponValue(type: CouponType, value: string): string {
  switch (type) {
    case 'discount':
      return `${value}折`;
    case 'cash':
      return `¥${value}`;
    case 'free_shipping':
      return '免运费';
    case 'voucher':
      return `¥${value}`;
    default:
      return value;
  }
}

function couponDisplayValue(value: string): string {
  return value.startsWith('¥') ? value : `¥${value}`;
}

/** 解析 CNY 数额 */
function parseCouponAmount(str: string): number {
  const cleaned = str.replace(/[¥￥,\s]/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isNaN(num) ? 0 : num;
}

function computeCouponStatus(
  totalIssued: number,
  usageLimit: number,
  validFrom: string,
  validTo: string,
): 'draft' | 'active' | 'expired' | 'sold_out' {
  const now = new Date();
  const from = new Date(validFrom);
  const to = new Date(validTo);

  if (totalIssued <= 0 && usageLimit <= 0) return 'draft';
  if (now > to) return 'expired';
  if (now < from) return 'draft';
  if (totalIssued <= 0 && usageLimit > 0) return 'sold_out';
  return 'active';
}

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
  { key: 'type', label: '优惠券类型', required: true, type: 'select' },
  { key: 'value', label: '面值', required: true },
  { key: 'minAmount', label: '使用门槛', required: true },
  { key: 'maxAmount', label: '最高抵扣限额' },
  {
    key: 'totalIssued', label: '发放总量', required: true, type: 'number',
    rules: [{ validate: (v) => (typeof v === 'number' && v < 0 ? '发放总量不能为负数' : null) }],
  },
  {
    key: 'usageLimit', label: '每人限用次数', type: 'number',
    rules: [{ validate: (v) => (typeof v === 'number' && v < 0 ? '限用次数不能为负数' : null) }],
  },
  { key: 'validFrom', label: '生效日期', required: true, type: 'date' },
  { key: 'validTo', label: '截止日期', required: true, type: 'date' },
  { key: 'storeName', label: '适用门店', required: true },
  {
    key: 'description', label: '优惠券说明', type: 'textarea',
    rules: [{ validate: (v) => (typeof v === 'string' && v.length > 500 ? '优惠券说明不超过500个字符' : null) }],
  },
];

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

function mockSubmitCoupon(
  data: NewCouponFormData,
): Promise<{ data: NewCouponFormData; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data, message: `优惠券「${data.name}」创建成功！` }), 100);
  });
}

function validateDateRange(validFrom: string, validTo: string): string | null {
  const from = new Date(validFrom);
  const to = new Date(validTo);
  if (Number.isNaN(from.getTime())) return '生效日期格式无效';
  if (Number.isNaN(to.getTime())) return '截止日期格式无效';
  if (to <= from) return '截止日期必须晚于生效日期';
  return null;
}

function filterCouponsByName(coupons: { name: string }[], query: string) {
  return coupons.filter((c) => c.name.includes(query));
}

// ═══════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════

// ── 1. 分类标签标签化 ──

test('renderCouponTypeLabel: 返回正确中文标签', () => {
  assert.equal(renderCouponTypeLabel('discount'), '打折券');
  assert.equal(renderCouponTypeLabel('cash'), '代金券');
  assert.equal(renderCouponTypeLabel('free_shipping'), '免运费');
  assert.equal(renderCouponTypeLabel('voucher'), '礼品券');
});

test('renderCouponTypeLabel: 未知类型兜底', () => {
  assert.equal(renderCouponTypeLabel('' as CouponType), '未知类型');
});

test('renderCouponTypeColor: 返回正确颜色', () => {
  assert.equal(renderCouponTypeColor('discount'), '#3b82f6');
  assert.equal(renderCouponTypeColor('cash'), '#f59e0b');
  assert.equal(renderCouponTypeColor('free_shipping'), '#10b981');
  assert.equal(renderCouponTypeColor('voucher'), '#8b5cf6');
});

test('renderCouponTypeColor: 未知类型兜底', () => {
  assert.equal(renderCouponTypeColor('' as CouponType), '#64748b');
});

test('COUPON_TYPES: 所有类型都有定义', () => {
  assert.equal(COUPON_TYPES.length, 4);
  for (const ct of COUPON_TYPES) {
    assert.ok(COUPON_TYPE_LABELS[ct.value] === ct.label);
  }
});

// ── 2. 统计计算 ──

test('computeCouponStatus: 活跃状态', () => {
  const status = computeCouponStatus(100, 1, '2020-01-01', '2099-12-31');
  assert.equal(status, 'active');
});

test('computeCouponStatus: 已过期', () => {
  const status = computeCouponStatus(100, 1, '2020-01-01', '2020-12-31');
  assert.equal(status, 'expired');
});

test('computeCouponStatus: 草稿（未生效）', () => {
  const status = computeCouponStatus(0, 0, '2099-01-01', '2099-12-31');
  assert.equal(status, 'draft');
});

test('computeCouponStatus: 已发完', () => {
  const status = computeCouponStatus(0, 1, '2020-01-01', '2099-12-31');
  assert.equal(status, 'sold_out');
});

test('computeCouponStatus: 未生效（将来）', () => {
  const status = computeCouponStatus(100, 1, '2099-01-01', '2099-12-31');
  assert.equal(status, 'draft');
});

// ── 3. 数据转换/格式化 ──

test('formatCouponValue: 打折券', () => {
  assert.equal(formatCouponValue('discount', '8'), '8折');
  assert.equal(formatCouponValue('discount', '8.5'), '8.5折');
});

test('formatCouponValue: 代金券', () => {
  assert.equal(formatCouponValue('cash', '50'), '¥50');
  assert.equal(formatCouponValue('cash', '100'), '¥100');
});

test('formatCouponValue: 免运费', () => {
  assert.equal(formatCouponValue('free_shipping', ''), '免运费');
  assert.equal(formatCouponValue('free_shipping', '任意'), '免运费');
});

test('formatCouponValue: 礼品券', () => {
  assert.equal(formatCouponValue('voucher', '30'), '¥30');
});

test('formatCouponValue: 未知类型原值返回', () => {
  assert.equal(formatCouponValue('' as CouponType, '其他'), '其他');
});

test('couponDisplayValue: 已含¥前缀', () => {
  assert.equal(couponDisplayValue('¥50'), '¥50');
});

test('couponDisplayValue: 无前缀添加', () => {
  assert.equal(couponDisplayValue('50'), '¥50');
});

test('parseCouponAmount: 解析数字', () => {
  assert.equal(parseCouponAmount('¥50'), 50);
  assert.equal(parseCouponAmount('￥100'), 100);
  assert.equal(parseCouponAmount('50'), 50);
});

test('parseCouponAmount: 千分位金额', () => {
  assert.equal(parseCouponAmount('¥1,000'), 1000);
  assert.equal(parseCouponAmount('1,234'), 1234);
});

test('parseCouponAmount: 无效数字返回0', () => {
  assert.equal(parseCouponAmount('abc'), 0);
  assert.equal(parseCouponAmount(''), 0);
});

// ── 4. 验证函数 ──

test('validateFormFields: 完整合法数据通过', () => {
  const errs = validateFormFields(FIELDS, {
    name: '夏季特惠8折券',
    type: 'discount',
    value: '8折',
    minAmount: '满100元',
    totalIssued: 500,
    validFrom: '2026-07-01',
    validTo: '2026-08-31',
    storeName: '旗舰店',
    description: '夏季限时优惠',
    usageLimit: 1,
    maxAmount: '',
  });
  assert.equal(Object.keys(errs).length, 0);
});

test('validateFormFields: 所有必填字段为空报错', () => {
  const errs = validateFormFields(FIELDS, {});
  assert.equal(Object.keys(errs).length, 8);
  assert.ok(errs.name?.includes('不能为空'));
  assert.ok(errs.type?.includes('不能为空'));
  assert.ok(errs.value?.includes('不能为空'));
  assert.ok(errs.minAmount?.includes('不能为空'));
  assert.ok(errs.totalIssued?.includes('不能为空'));
  assert.ok(errs.validFrom?.includes('不能为空'));
  assert.ok(errs.validTo?.includes('不能为空'));
  assert.ok(errs.storeName?.includes('不能为空'));
});

test('validateFormFields: name 太短', () => {
  const errs = validateFormFields(FIELDS, {
    name: 'x', type: 'discount', value: '8折', minAmount: '满0元',
    totalIssued: 100, validFrom: '2026-07-01', validTo: '2026-07-31', storeName: 'Demo',
  });
  assert.equal(errs.name, '优惠券名称至少2个字符');
});

test('validateFormFields: name 超长', () => {
  const errs = validateFormFields(FIELDS, {
    name: '超'.repeat(51), type: 'discount', value: '8折', minAmount: '满0元',
    totalIssued: 100, validFrom: '2026-07-01', validTo: '2026-07-31', storeName: 'Demo',
  });
  assert.equal(errs.name, '优惠券名称不超过50个字符');
});

test('validateFormFields: totalIssued 负值', () => {
  const errs = validateFormFields(FIELDS, {
    name: '测试券', type: 'cash', value: '¥50', minAmount: '满200元',
    totalIssued: -5, validFrom: '2026-07-01', validTo: '2026-07-31', storeName: 'Demo',
  });
  assert.equal(errs.totalIssued, '发放总量不能为负数');
});

test('validateFormFields: usageLimit 负值', () => {
  const errs = validateFormFields(FIELDS, {
    name: '测试券', type: 'cash', value: '¥50', minAmount: '满200元',
    totalIssued: 100, usageLimit: -1, validFrom: '2026-07-01', validTo: '2026-07-31', storeName: 'Demo',
  });
  assert.equal(errs.usageLimit, '限用次数不能为负数');
});

test('validateFormFields: description 超长', () => {
  const errs = validateFormFields(FIELDS, {
    name: '测试券', type: 'voucher', value: '¥50', minAmount: '满200元',
    totalIssued: 50, validFrom: '2026-07-01', validTo: '2026-07-31', storeName: 'Demo',
    description: 'X'.repeat(501),
  });
  assert.equal(errs.description, '优惠券说明不超过500个字符');
});

test('validateFormFields: totalIssued=0 允许不限量', () => {
  const errs = validateFormFields(FIELDS, {
    name: '测试券', type: 'discount', value: '8折', minAmount: '满0元',
    totalIssued: 0, validFrom: '2026-07-01', validTo: '2026-07-31', storeName: 'Demo',
  });
  assert.equal(errs.totalIssued, undefined);
});

test('validateFormFields: usageLimit=0 允许', () => {
  const errs = validateFormFields(FIELDS, {
    name: '测试券', type: 'discount', value: '8折', minAmount: '满0元',
    totalIssued: 100, usageLimit: 0, validFrom: '2026-07-01', validTo: '2026-07-31', storeName: 'Demo',
  });
  assert.equal(errs.usageLimit, undefined);
});

// ── 日期范围验证 ──

test('validateDateRange: 合法日期范围', () => {
  assert.equal(validateDateRange('2026-07-01', '2026-07-31'), null);
});

test('validateDateRange: 截止日期等于生效日期拒绝', () => {
  assert.ok(validateDateRange('2026-07-01', '2026-07-01')?.includes('晚于'));
});

test('validateDateRange: 截止日期早于生效日期拒绝', () => {
  assert.ok(validateDateRange('2026-07-31', '2026-07-01')?.includes('晚于'));
});

test('validateDateRange: 生效日期格式无效', () => {
  assert.ok(validateDateRange('无效日期', '2026-07-31')?.includes('格式无效'));
});

test('validateDateRange: 截止日期格式无效', () => {
  assert.ok(validateDateRange('2026-07-01', '无效日期')?.includes('格式无效'));
});

// ── 5. 搜索/过滤 ──

test('filterCouponsByName: 匹配到结果', () => {
  const coupons = [{ name: '夏季八折券' }, { name: '满减券' }, { name: '新客券' }];
  assert.equal(filterCouponsByName(coupons, '夏季').length, 1);
  assert.equal(filterCouponsByName(coupons, '券').length, 3);
});

test('filterCouponsByName: 无匹配返回空', () => {
  const coupons = [{ name: '夏季券' }];
  assert.equal(filterCouponsByName(coupons, '冬季').length, 0);
});

test('filterCouponsByName: 空列表返回空', () => {
  assert.equal(filterCouponsByName([], '夏季').length, 0);
});

// ── 6. 提交 ──

test('mockSubmitCoupon: 返回正确结构', async () => {
  const data: NewCouponFormData = {
    name: '新客首单8折', type: 'discount', value: '8折', minAmount: '满0元',
    maxAmount: '¥50', totalIssued: 500, validFrom: '2026-07-01', validTo: '2026-07-31',
    storeName: '旗舰店', description: '新用户8折', usageLimit: 1,
  };
  const result = await mockSubmitCoupon(data);
  assert.equal(result.data.name, '新客首单8折');
  assert.ok(result.message.includes('创建成功'));
});

test('mockSubmitCoupon: 保留所有字段', async () => {
  const data: NewCouponFormData = {
    name: '满300减50', type: 'cash', value: '¥50', minAmount: '满300元',
    maxAmount: '', totalIssued: 200, validFrom: '2026-06-01', validTo: '2026-06-30',
    storeName: '社区店', description: '单笔满300减50', usageLimit: 1,
  };
  const result = await mockSubmitCoupon(data);
  assert.deepEqual(result.data, data);
});
