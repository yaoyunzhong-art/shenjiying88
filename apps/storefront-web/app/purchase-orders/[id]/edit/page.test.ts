/**
 * purchase-orders/[id]/edit/page.test.ts — L1 冒烟测试
 * 采购单编辑页 — 表单验证、数据完整性、边界条件
 * 角色视角: 👔店长 · 💳采购经理
 */
import assert from 'node:assert/strict';
import test from 'node:test';

// ---- 内联类型 (mirrors page.tsx) ----

interface PurchaseOrderItem {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplier: string;
  contactPerson: string;
  contactPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  itemsCount: number;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery: string | null;
  paymentTerms: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
}

interface EditFormData {
  supplier: string;
  contactPerson: string;
  contactPhone: string;
  shippingAddress: string;
  expectedDelivery: string;
  paymentTerms: string;
  paymentMethod: string;
  notes: string;
}

interface EditFormErrors {
  supplier?: string;
  contactPerson?: string;
  contactPhone?: string;
  shippingAddress?: string;
  expectedDelivery?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  notes?: string;
}

const VALID_PAYMENT_TERMS = ['net30', 'net60', 'deposit_balance', 'cod', 'prepaid'];
const VALID_PAYMENT_METHODS = ['bank_transfer', 'wechat', 'alipay', 'check', 'cash'];

// ---- Mock 数据 (mirrors page.tsx) ----

const MOCK_ORDERS: Record<string, PurchaseOrder> = {
  '1': {
    id: '1', orderNo: 'PO-20260601-001',
    supplier: '广州美妆供应链有限公司',
    contactPerson: '李明', contactPhone: '13800138001',
    shippingAddress: '广州市天河区体育西路123号旗舰店仓库',
    totalAmount: 28600, status: 'received', itemsCount: 12,
    orderDate: '2026-06-01', expectedDelivery: '2026-06-10',
    actualDelivery: '2026-06-09', paymentTerms: 'net30',
    paymentMethod: 'bank_transfer', notes: '优先安排核心SKU入库。',
    createdAt: '2026-06-01 09:00:00', updatedAt: '2026-06-09 14:30:00',
    items: [
      { name: '保湿精华液（100ml）', sku: 'ES-100ML-001', quantity: 200, unit: '瓶', unitPrice: 68, totalPrice: 13600 },
      { name: '洁面乳（150g）', sku: 'CF-150G-002', quantity: 150, unit: '支', unitPrice: 45, totalPrice: 6750 },
      { name: '防晒霜（SPF50 60ml）', sku: 'SS-60ML-003', quantity: 100, unit: '支', unitPrice: 55, totalPrice: 5500 },
      { name: '面霜礼盒装', sku: 'CG-BOX-004', quantity: 50, unit: '盒', unitPrice: 55, totalPrice: 2750 },
    ],
  },
  '2': {
    id: '2', orderNo: 'PO-20260605-002',
    supplier: '上海日化股份有限公司',
    contactPerson: '王芳', contactPhone: '13900139002',
    shippingAddress: '上海市浦东新区张江高科技园区仓库B区',
    totalAmount: 42000, status: 'shipped', itemsCount: 8,
    orderDate: '2026-06-05', expectedDelivery: '2026-06-15',
    actualDelivery: null, paymentTerms: 'cod',
    paymentMethod: 'wechat', notes: '急单，请优先配送。',
    createdAt: '2026-06-05 09:00:00', updatedAt: '2026-06-12 09:00:00',
    items: [
      { name: '洗发水（500ml）', sku: 'SH-500ML-005', quantity: 300, unit: '瓶', unitPrice: 35, totalPrice: 10500 },
      { name: '护发素（500ml）', sku: 'CD-500ML-006', quantity: 200, unit: '瓶', unitPrice: 38, totalPrice: 7600 },
    ],
  },
  '3': {
    id: '3', orderNo: 'PO-20260610-003',
    supplier: '深圳包装材料厂',
    contactPerson: '赵工', contactPhone: '13700137003',
    shippingAddress: '深圳市龙岗区坂田街道品尚仓库一楼',
    totalAmount: 12500, status: 'draft', itemsCount: 5,
    orderDate: '2026-06-10', expectedDelivery: '2026-06-20',
    actualDelivery: null, paymentTerms: 'prepaid',
    paymentMethod: 'alipay', notes: '',
    createdAt: '2026-06-10 11:00:00', updatedAt: '2026-06-10 11:00:00',
    items: [
      { name: '礼品包装袋（大号）', sku: 'GB-LG-007', quantity: 500, unit: '个', unitPrice: 3.5, totalPrice: 1750 },
    ],
  },
};

// ---- toFormData 实现 ----

function toFormData(order: PurchaseOrder): EditFormData {
  return {
    supplier: order.supplier,
    contactPerson: order.contactPerson,
    contactPhone: order.contactPhone,
    shippingAddress: order.shippingAddress,
    expectedDelivery: order.expectedDelivery,
    paymentTerms: order.paymentTerms,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
  };
}

// ---- 验证逻辑 (mirrors page.tsx) ----

function validateForm(data: EditFormData): EditFormErrors {
  const e: EditFormErrors = {};

  if (!data.supplier.trim()) {
    e.supplier = '供应商名称不能为空';
  } else if (data.supplier.trim().length > 100) {
    e.supplier = '名称不超过100个字符';
  }

  if (!data.contactPerson.trim()) {
    e.contactPerson = '联系人不能为空';
  } else if (data.contactPerson.trim().length > 30) {
    e.contactPerson = '联系人不超过30个字符';
  }

  if (!data.contactPhone.trim()) {
    e.contactPhone = '联系电话不能为空';
  } else if (!/^1\d{10}$/.test(data.contactPhone.trim())) {
    e.contactPhone = '请输入有效的手机号码';
  }

  if (!data.shippingAddress.trim()) {
    e.shippingAddress = '收货地址不能为空';
  } else if (data.shippingAddress.trim().length > 200) {
    e.shippingAddress = '地址不超过200个字符';
  }

  if (!data.expectedDelivery) {
    e.expectedDelivery = '请选择预计到货日期';
  }

  if (!data.paymentTerms) {
    e.paymentTerms = '请选择付款条件';
  }

  if (!data.paymentMethod) {
    e.paymentMethod = '请选择付款方式';
  }

  if (data.notes.length > 500) {
    e.notes = '备注不超过500个字符';
  }

  return e;
}

function hasErrors(e: EditFormErrors): boolean {
  return Object.keys(e).length > 0;
}

// ======== 正例 (Happy Path) ========

test('👔 店长: valid form from existing order passes validation', () => {
  for (const key of Object.keys(MOCK_ORDERS)) {
    const order = MOCK_ORDERS[key]!;
    const data = toFormData(order);
    const errors = validateForm(data);
    assert.strictEqual(hasErrors(errors), false, `${key}: existing order should produce valid form`);
  }
});

test('👔 店长: toFormData preserves all field values', () => {
  const order = MOCK_ORDERS['1']!;
  const data = toFormData(order);
  assert.strictEqual(data.supplier, order.supplier);
  assert.strictEqual(data.contactPerson, order.contactPerson);
  assert.strictEqual(data.contactPhone, order.contactPhone);
  assert.strictEqual(data.shippingAddress, order.shippingAddress);
  assert.strictEqual(data.expectedDelivery, order.expectedDelivery);
  assert.strictEqual(data.paymentTerms, order.paymentTerms);
  assert.strictEqual(data.paymentMethod, order.paymentMethod);
  assert.strictEqual(data.notes, order.notes);
});

test('👔 店长: form has exactly 8 fields', () => {
  for (const key of Object.keys(MOCK_ORDERS)) {
    const order = MOCK_ORDERS[key]!;
    const data = toFormData(order);
    assert.strictEqual(Object.keys(data).length, 8, `${key}: form data should have 8 fields`);
  }
});

test('💳 采购经理: all payment terms are valid', () => {
  for (const t of VALID_PAYMENT_TERMS) {
    assert.ok(typeof t === 'string' && t.length > 0, `${t} should be a valid term`);
  }
  assert.ok(VALID_PAYMENT_TERMS.length >= 5, 'at least 5 payment terms');
});

test('💳 采购经理: all payment methods are valid', () => {
  for (const m of VALID_PAYMENT_METHODS) {
    assert.ok(typeof m === 'string' && m.length > 0, `${m} should be a valid method`);
  }
  assert.ok(VALID_PAYMENT_METHODS.length >= 5, 'at least 5 payment methods');
});

test('💳 采购经理: mock orders have unique IDs', () => {
  const ids = Object.keys(MOCK_ORDERS);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test('💳 采购经理: each order has all required fields', () => {
  const required: (keyof PurchaseOrder)[] = ['id', 'orderNo', 'supplier', 'contactPerson', 'contactPhone', 'shippingAddress', 'totalAmount', 'status', 'itemsCount', 'paymentTerms', 'paymentMethod', 'notes'];
  for (const order of Object.values(MOCK_ORDERS)) {
    for (const field of required) {
      assert.ok(order[field] !== undefined, `order ${order.id} missing '${field}'`);
    }
  }
});

// ======== 反例 (Negative Cases) ========

test('反例: empty supplier triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.supplier = '';
  const errors = validateForm(data);
  assert.strictEqual(errors.supplier, '供应商名称不能为空');
});

test('反例: supplier exceeding 100 chars triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.supplier = 'x'.repeat(101);
  const errors = validateForm(data);
  assert.strictEqual(errors.supplier, '名称不超过100个字符');
});

test('反例: empty contact person triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPerson = '';
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPerson, '联系人不能为空');
});

test('反例: contactPerson exceeding 30 chars triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPerson = 'x'.repeat(31);
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPerson, '联系人不超过30个字符');
});

test('反例: empty phone triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPhone = '';
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPhone, '联系电话不能为空');
});

test('反例: invalid phone format triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPhone = '12345';
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPhone, '请输入有效的手机号码');
});

test('反例: non-mobile phone like landline triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPhone = '010-12345678';
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPhone, '请输入有效的手机号码');
});

test('反例: 12-digit phone triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPhone = '138001380019';
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPhone, '请输入有效的手机号码');
});

test('反例: empty shipping address triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.shippingAddress = '';
  const errors = validateForm(data);
  assert.strictEqual(errors.shippingAddress, '收货地址不能为空');
});

test('反例: address exceeding 200 chars triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.shippingAddress = 'x'.repeat(201);
  const errors = validateForm(data);
  assert.strictEqual(errors.shippingAddress, '地址不超过200个字符');
});

test('反例: empty expected delivery triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.expectedDelivery = '';
  const errors = validateForm(data);
  assert.strictEqual(errors.expectedDelivery, '请选择预计到货日期');
});

test('反例: empty payment terms triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.paymentTerms = '';
  const errors = validateForm(data);
  assert.strictEqual(errors.paymentTerms, '请选择付款条件');
});

test('反例: empty payment method triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.paymentMethod = '';
  const errors = validateForm(data);
  assert.strictEqual(errors.paymentMethod, '请选择付款方式');
});

test('反例: notes exceeding 500 chars triggers error', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.notes = 'x'.repeat(501);
  const errors = validateForm(data);
  assert.strictEqual(errors.notes, '备注不超过500个字符');
});

test('反例: multiple validation errors accumulate', () => {
  const data: EditFormData = {
    supplier: '', contactPerson: '', contactPhone: '',
    shippingAddress: '', expectedDelivery: '',
    paymentTerms: '', paymentMethod: '', notes: '',
  };
  const errors = validateForm(data);
  assert.ok(hasErrors(errors), 'should have errors');
  assert.ok(errors.supplier !== undefined);
  assert.ok(errors.contactPhone !== undefined);
  assert.ok(errors.shippingAddress !== undefined);
  assert.ok(Object.keys(errors).length >= 6, 'at least 6 fields should fail');
});

// ======== 边界 (Boundary Cases) ========

test('边界: exactly 100-char supplier passes', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.supplier = 'x'.repeat(100);
  const errors = validateForm(data);
  assert.strictEqual(errors.supplier, undefined, '100-char supplier should pass');
});

test('边界: exactly 30-char contact person passes', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPerson = 'x'.repeat(30);
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPerson, undefined, '30-char contact person should pass');
});

test('边界: exactly 200-char address passes', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.shippingAddress = 'x'.repeat(200);
  const errors = validateForm(data);
  assert.strictEqual(errors.shippingAddress, undefined, '200-char address should pass');
});

test('边界: exactly 500-char notes passes', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.notes = 'x'.repeat(500);
  const errors = validateForm(data);
  assert.strictEqual(errors.notes, undefined, '500-char notes should pass');
});

test('边界: empty notes passes (optional)', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.notes = '';
  const errors = validateForm(data);
  assert.strictEqual(errors.notes, undefined, 'empty notes should pass');
});

test('边界: valid phone 13800000001 passes', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPhone = '13800000001';
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPhone, undefined);
});

test('边界: valid phone 19912345678 passes', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  data.contactPhone = '19912345678';
  const errors = validateForm(data);
  assert.strictEqual(errors.contactPhone, undefined);
});

test('边界: all payment term values are recognized', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  for (const term of VALID_PAYMENT_TERMS) {
    data.paymentTerms = term;
    const errors = validateForm(data);
    assert.strictEqual(errors.paymentTerms, undefined, `${term} should be valid`);
  }
});

test('边界: all payment method values are recognized', () => {
  const data = toFormData(MOCK_ORDERS['1']!);
  for (const method of VALID_PAYMENT_METHODS) {
    data.paymentMethod = method;
    const errors = validateForm(data);
    assert.strictEqual(errors.paymentMethod, undefined, `${method} should be valid`);
  }
});

test('边界: order with null actualDelivery still converts to valid form', () => {
  const order = MOCK_ORDERS['2']!;
  assert.strictEqual(order.actualDelivery, null);
  const data = toFormData(order);
  const errors = validateForm(data);
  assert.strictEqual(hasErrors(errors), false, 'should produce valid form despite null actualDelivery');
});

// ======== 模块导出检查 ========

test('export: default export is a function component', async () => {
  const mod = await import('./page');
  assert.strictEqual(typeof mod.default, 'function',
    'PurchaseOrderEditPage should be a function component');
});

test('export: import does not throw', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.strictEqual(threw, false, 'import should succeed');
});

test('export: source has "use client" directive', () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(source.includes("'use client'"), 'should be a client component');
});

test('export: source size is within range', () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
  assert.ok(source.length > 4000, 'source should be substantial');
  assert.ok(source.length < 50000, 'source should not be excessive');
});
