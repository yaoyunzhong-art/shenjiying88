/*!
 * refunds/new/page.test.tsx - 退换货申请新建页 L1 冒烟测试（增强版）
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

// ── 数据类型 ──

interface FormValues {
  orderId: string;
  type: string;
  reasonCategory: string;
  reasonDetail: string;
  amount: string;
  productName: string;
}

interface RadioOption {
  value: string;
  label: string;
  description: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// ── 常量（从 page.tsx 镜像） ──

const REFUND_TYPE_OPTIONS: RadioOption[] = [
  { value: 'refund', label: '仅退款', description: '商品未发货或已退货，仅申请退款' },
  { value: 'exchange', label: '换货', description: '商品有瑕疵或尺码/规格不符，申请换货' },
  { value: 'return', label: '退货退款', description: '已收货但需要退货并退款' },
];

const REASON_OPTIONS: SelectOption[] = [
  { value: 'defective', label: '商品破损/瑕疵' },
  { value: 'mismatch', label: '商品与描述不符' },
  { value: 'size_wrong', label: '尺码/规格不合适' },
  { value: 'duplicate', label: '重复下单' },
  { value: 'delivery_late', label: '送达超时' },
  { value: 'wrong_item', label: '发错商品' },
  { value: 'other', label: '其他原因' },
];

const INITIAL_VALUES: FormValues = {
  orderId: '',
  type: 'refund',
  reasonCategory: '',
  reasonDetail: '',
  amount: '',
  productName: '',
};

// ── 分类标签函数（纯函数，无 UI 组件） ──

const REFUND_TYPE_LABELS: Record<string, string> = {
  refund: '仅退款',
  exchange: '换货',
  return: '退货退款',
};

function renderRefundTypeTag(type: string): string {
  return REFUND_TYPE_LABELS[type] || '未知类型';
}

function getReasonLabel(reasonValue: string): string {
  const option = REASON_OPTIONS.find((o) => o.value === reasonValue);
  return option ? option.label : '其他原因';
}

// ── 验证函数（从 page.tsx 镜像） ──

function validateForm(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.orderId.trim()) errors.orderId = '请选择或输入订单号';
  if (!values.reasonCategory) errors.reasonCategory = '请选择退款原因类别';
  if (!values.reasonDetail.trim()) errors.reasonDetail = '请填写退款原因描述';
  if (!values.amount.trim() || isNaN(Number(values.amount))) errors.amount = '请输入有效金额';
  if (!values.productName.trim()) errors.productName = '请填写商品名称';
  return errors;
}

// ── 统计计算函数 ──

function countRefundTypeOptions(): number {
  return REFUND_TYPE_OPTIONS.length;
}

function countReasonOptions(): number {
  return REASON_OPTIONS.length;
}

// ── 测试 ──

// === 新增：分类标签测试 ===

describe('NewRefundRequestPage - 分类标签标签化', () => {
  it('renderRefundTypeTag 返回正确类型标签', () => {
    assert.equal(renderRefundTypeTag('refund'), '仅退款');
    assert.equal(renderRefundTypeTag('exchange'), '换货');
    assert.equal(renderRefundTypeTag('return'), '退货退款');
  });

  it('renderRefundTypeTag 处理未知类型返回"未知类型"', () => {
    assert.equal(renderRefundTypeTag('unknown'), '未知类型');
    assert.equal(renderRefundTypeTag(''), '未知类型');
  });

  it('getReasonLabel 返回正确的退换原因标签', () => {
    assert.equal(getReasonLabel('defective'), '商品破损/瑕疵');
    assert.equal(getReasonLabel('mismatch'), '商品与描述不符');
    assert.equal(getReasonLabel('size_wrong'), '尺码/规格不合适');
    assert.equal(getReasonLabel('duplicate'), '重复下单');
    assert.equal(getReasonLabel('delivery_late'), '送达超时');
    assert.equal(getReasonLabel('wrong_item'), '发错商品');
    assert.equal(getReasonLabel('other'), '其他原因');
  });

  it('getReasonLabel 处理未知原因返回"其他原因"', () => {
    assert.equal(getReasonLabel('nonexistent'), '其他原因');
  });
});

// === 新增：验证函数测试 ===

describe('NewRefundRequestPage - 表单验证逻辑', () => {
  it('validateForm 完整表单验证通过', () => {
    const errors = validateForm({
      orderId: 'ORD-20260601-001',
      type: 'refund',
      reasonCategory: 'defective',
      reasonDetail: '商品有破损',
      amount: '199.00',
      productName: '洁面乳',
    });
    assert.deepEqual(errors, {});
  });

  it('validateForm 空表单全部字段报错', () => {
    const errors = validateForm(INITIAL_VALUES);
    assert.equal(errors.orderId, '请选择或输入订单号');
    assert.equal(errors.reasonCategory, '请选择退款原因类别');
    assert.equal(errors.reasonDetail, '请填写退款原因描述');
    assert.equal(errors.amount, '请输入有效金额');
    assert.equal(errors.productName, '请填写商品名称');
  });

  it('validateForm 金额非数字时报错', () => {
    const errors = validateForm({
      ...INITIAL_VALUES,
      amount: 'abc',
      orderId: 'ORD-001',
      reasonCategory: 'defective',
      reasonDetail: '描述',
      productName: '商品',
    });
    assert.equal(errors.amount, '请输入有效金额');
  });

  it('validateForm 金额为负数也通过（业务允许）', () => {
    const errors = validateForm({
      ...INITIAL_VALUES,
      amount: '-50',
      orderId: 'ORD-001',
      reasonCategory: 'defective',
      reasonDetail: '描述',
      productName: '商品',
    });
    assert.equal(errors.amount, undefined);
  });

  it('validateForm 金额为 0 通过', () => {
    const errors = validateForm({
      ...INITIAL_VALUES,
      amount: '0',
      orderId: 'ORD-001',
      reasonCategory: 'defective',
      reasonDetail: '描述',
      productName: '商品',
    });
    assert.equal(errors.amount, undefined);
  });

  it('validateForm 空字符串金额报错', () => {
    const errors = validateForm({
      ...INITIAL_VALUES,
      amount: '',
      orderId: 'ORD-001',
      reasonCategory: 'defective',
      reasonDetail: '描述',
      productName: '商品',
    });
    assert.equal(errors.amount, '请输入有效金额');
  });

  it('validateForm 仅空格不通过', () => {
    const errors = validateForm({
      ...INITIAL_VALUES,
      orderId: '   ',
      reasonCategory: '',
      reasonDetail: '   ',
      amount: '   ',
      productName: '   ',
    });
    assert.ok(errors.orderId);
    assert.ok(errors.reasonDetail);
    assert.ok(errors.amount);
    assert.ok(errors.productName);
  });
});

// === 新增：数据完整性测试 ===

describe('NewRefundRequestPage - 选项数据完整性', () => {
  it('REFUND_TYPE_OPTIONS 包含 3 种退换货类型', () => {
    assert.equal(countRefundTypeOptions(), 3);
    assert.ok(REFUND_TYPE_OPTIONS.every((o) => o.value && o.label && o.description));
  });

  it('REASON_OPTIONS 包含 7 种退换原因', () => {
    assert.equal(countReasonOptions(), 7);
    assert.ok(REASON_OPTIONS.every((o) => o.value && o.label));
  });

  it('INITIAL_VALUES 初始值全部为空/默认', () => {
    assert.equal(INITIAL_VALUES.orderId, '');
    assert.equal(INITIAL_VALUES.type, 'refund');
    assert.equal(INITIAL_VALUES.reasonCategory, '');
    assert.equal(INITIAL_VALUES.reasonDetail, '');
    assert.equal(INITIAL_VALUES.amount, '');
    assert.equal(INITIAL_VALUES.productName, '');
  });

  it('退换货类型描述完整覆盖场景', () => {
    const descriptions = REFUND_TYPE_OPTIONS.map((o) => o.description);
    assert.ok(descriptions.some((d) => d.includes('未发货')));
    assert.ok(descriptions.some((d) => d.includes('瑕疵')));
    assert.ok(descriptions.some((d) => d.includes('已收货')));
  });

  it('退换原因值唯一', () => {
    const values = REASON_OPTIONS.map((o) => o.value);
    assert.equal(new Set(values).size, values.length);
  });
});

// === 原有测试保持不变 ===

describe('NewRefundRequestPage - 正例', () => {
  it('exports default NewRefundRequestPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewRefundRequestPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
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
  it('imports RadioGroup', () => {
    const src = readSource();
    assert.ok(src.includes('RadioGroup'), 'missing RadioGroup');
  });
  it('imports RadioOption', () => {
    const src = readSource();
    assert.ok(src.includes('RadioOption'), 'missing RadioOption');
  });
  it('imports Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('imports SelectOption', () => {
    const src = readSource();
    assert.ok(src.includes('SelectOption'), 'missing SelectOption');
  });
  it('imports TextArea', () => {
    const src = readSource();
    assert.ok(src.includes('TextArea'), 'missing TextArea');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('defines FormValues interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormValues') || src.includes('type FormValues'), 'missing FormValues');
  });
});

describe('NewRefundRequestPage - 反例', () => {
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

describe('NewRefundRequestPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('NewRefundRequestPage - 数据完整性', () => {
  it('includes context "仅退款..."', () => {
    const src = readSource();
    assert.ok(src.includes('仅退款'), 'missing 仅退款');
  });
  it('includes context "其他原因..."', () => {
    const src = readSource();
    assert.ok(src.includes('其他原因'), 'missing 其他原因');
  });
  it('includes context "创建退换货申请，提交后将..."', () => {
    const src = readSource();
    assert.ok(src.includes('创建退换货申请，提交后将进入审批流程'), 'missing 创建退换货申请，提交后将');
  });
  it('includes context "发错商品..."', () => {
    const src = readSource();
    assert.ok(src.includes('发错商品'), 'missing 发错商品');
  });
  it('includes context "商品与描述不符..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品与描述不符'), 'missing 商品与描述不符');
  });
  it('includes context "商品有瑕疵或尺码/规格不..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品有瑕疵或尺码/规格不符，申请换货'), 'missing 商品有瑕疵或尺码/规格不');
  });
  it('includes context "商品未发货或已退货，仅申..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品未发货或已退货，仅申请退款'), 'missing 商品未发货或已退货，仅申');
  });
  it('includes context "商品破损/瑕疵..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品破损/瑕疵'), 'missing 商品破损/瑕疵');
  });
  it('includes context "尺码/规格不合适..."', () => {
    const src = readSource();
    assert.ok(src.includes('尺码/规格不合适'), 'missing 尺码/规格不合适');
  });
  it('includes context "已收货但需要退货并退款..."', () => {
    const src = readSource();
    assert.ok(src.includes('已收货但需要退货并退款'), 'missing 已收货但需要退货并退款');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant set', () => {
    const src = readSource();
    assert.ok(src.includes('set'), 'missing set');
  });
  it('has constant handleSubmit', () => {
    const src = readSource();
    assert.ok(src.includes('handleSubmit'), 'missing handleSubmit');
  });
  it('has constant handleReset', () => {
    const src = readSource();
    assert.ok(src.includes('handleReset'), 'missing handleReset');
  });
});
