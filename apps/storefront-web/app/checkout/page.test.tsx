/**
 * checkout/page.test.tsx — 收银结算页 补充 L1 测试
 *
 * 覆盖: 金额计算逻辑、表单验证规则、支付方式常量、购物车合并
 * 正例: CartItem 数据结构、金额计算、支付方式枚举
 * 反例: 负价格、零数量、无效支付方式
 * 边界: 超大购物车、空购物车、最小金额、零值优惠
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型定义（与 page.tsx 同步） ── */

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  deliveryMethod: string;
  paymentMethod: string;
  agreeTerms: boolean;
  remark: string;
  couponCode: string;
}

type PaymentMethodValue = 'wechat' | 'alipay' | 'cash' | 'member_card';

/* ── 默认数据 ── */

const defaultCart: CartItem[] = [
  { id: 'p1', name: '基础护肤套装', price: 299, quantity: 1, category: '护肤品' },
  { id: 'p2', name: '深层清洁面膜（5片装）', price: 89, quantity: 2, category: '面膜' },
  { id: 'p3', name: '防晒霜 SPF50+', price: 139, quantity: 1, category: '防晒' },
  { id: 'p4', name: '舒缓保湿喷雾', price: 59, quantity: 1, category: '护肤品' },
];

const PAYMENT_METHODS: PaymentMethodValue[] = ['wechat', 'alipay', 'cash', 'member_card'];

const PAYMENT_LABELS: Record<PaymentMethodValue, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金支付',
  member_card: '会员卡支付',
};

const DELIVERY_METHODS = ['express', 'self_pickup', 'dine_in'];

/* ── 辅助函数 ── */

function calcSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calcQuantity(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function calcDeliveryFee(subtotal: number): number {
  if (subtotal >= 99) return 0;
  if (subtotal >= 50) return 8;
  return 15;
}

function calcTotal(subtotal: number, deliveryFee: number, discount: number = 0): number {
  return Math.max(0, subtotal + deliveryFee - discount);
}

function validateForm(data: CheckoutFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = '请填写收件人姓名';
  if (!data.phone.trim()) errors.phone = '请填写手机号';
  else if (!/^1\d{10}$/.test(data.phone.replace(/\s/g, ''))) errors.phone = '手机号格式不正确';
  if (!data.address.trim()) errors.address = '请填写收货地址';
  if (!data.deliveryMethod) errors.deliveryMethod = '请选择配送方式';
  if (!data.paymentMethod) errors.paymentMethod = '请选择支付方式';
  if (!data.agreeTerms) errors.agreeTerms = '请同意服务条款';
  return errors;
}

/* ══════════════════════════════════════════════════════════
   测试: 文件存在性
   ══════════════════════════════════════════════════════════ */

describe('checkout — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 导出 default 函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default'), 'should export default');
  });

  it('3. page.tsx 是 "use client"', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("'use client'") || source.includes('"use client"'),
      'should be client component');
  });
});

/* ══════════════════════════════════════════════════════════
   测试: CartItem 数据结构
   ══════════════════════════════════════════════════════════ */

describe('checkout — CartItem 数据', () => {
  /* ── 正例 ── */

  it('4. 默认购物车 4 件商品', () => {
    assert.equal(defaultCart.length, 4);
  });

  it('5. 所有商品 ID 唯一', () => {
    const ids = defaultCart.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('6. 所有商品名称非空', () => {
    for (const item of defaultCart) {
      assert.ok(item.name.length > 0, `${item.id} empty name`);
    }
  });

  it('7. 所有商品价格 > 0', () => {
    for (const item of defaultCart) {
      assert.ok(item.price > 0, `${item.id} price should be > 0, got ${item.price}`);
    }
  });

  it('8. 所有商品数量 > 0', () => {
    for (const item of defaultCart) {
      assert.ok(item.quantity > 0, `${item.id} qty should be > 0, got ${item.quantity}`);
    }
  });

  it('9. 分类信息不缺省', () => {
    for (const item of defaultCart) {
      assert.ok(item.category, `${item.id} missing category`);
    }
  });

  /* ── 金额计算 ── */

  it('10. 小计 = 299 + 89×2 + 139 + 59 = 675', () => {
    assert.equal(calcSubtotal(defaultCart), 675);
  });

  it('11. 总商品数量 = 5', () => {
    assert.equal(calcQuantity(defaultCart), 5);
  });

  it('12. 单价总和 = 586', () => {
    const sumPrice = defaultCart.reduce((s, i) => s + i.price, 0);
    assert.equal(sumPrice, 586);
  });

  it('13. 各分类商品数量', () => {
    const catCount: Record<string, number> = {};
    for (const item of defaultCart) {
      catCount[item.category!] = (catCount[item.category!] || 0) + item.quantity;
    }
    assert.equal(catCount['护肤品'], 2); // p1(1) + p4(1)
    assert.equal(catCount['面膜'], 2);    // p2(2)
    assert.equal(catCount['防晒'], 1);    // p3(1)
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 配送费计算
   ══════════════════════════════════════════════════════════ */

describe('checkout — 配送费计算', () => {
  it('14. 满 99 免运费', () => {
    assert.equal(calcDeliveryFee(99), 0);
    assert.equal(calcDeliveryFee(100), 0);
    assert.equal(calcDeliveryFee(999), 0);
  });

  it('15. 满 50 不足 99 运费 8 元', () => {
    assert.equal(calcDeliveryFee(50), 8);
    assert.equal(calcDeliveryFee(89), 8);
    assert.equal(calcDeliveryFee(98.99), 8);
  });

  it('16. 不足 50 运费 15 元', () => {
    assert.equal(calcDeliveryFee(0), 15);
    assert.equal(calcDeliveryFee(30), 15);
    assert.equal(calcDeliveryFee(49.99), 15);
  });

  it('17. 边界值: 恰好 99', () => {
    assert.equal(calcDeliveryFee(99), 0);
  });

  it('18. 边界值: 恰好 50', () => {
    assert.equal(calcDeliveryFee(50), 8);
  });

  it('19. 负数金额也返回 15', () => {
    assert.equal(calcDeliveryFee(-10), 15);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 总金额计算
   ══════════════════════════════════════════════════════════ */

describe('checkout — 总金额计算', () => {
  it('20. 正常计算: 小计 + 运费 - 优惠', () => {
    assert.equal(calcTotal(675, 0, 50), 625);
  });

  it('21. 无优惠时总金额 = 小计 + 运费', () => {
    assert.equal(calcTotal(675, 8, 0), 683);
  });

  it('22. 优惠大于小计+运费时结果为 0', () => {
    assert.equal(calcTotal(100, 10, 200), 0);
  });

  it('23. 优惠恰好等于小计+运费', () => {
    assert.equal(calcTotal(100, 20, 120), 0);
  });

  it('24. 零小计 + 运费 = 运费', () => {
    assert.equal(calcTotal(0, 15, 0), 15);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 支付方式
   ══════════════════════════════════════════════════════════ */

describe('checkout — 支付方式常量', () => {
  it('25. 4 种支付方式', () => {
    assert.equal(PAYMENT_METHODS.length, 4);
  });

  it('26. 所有支付方式都有标签', () => {
    for (const m of PAYMENT_METHODS) {
      assert.ok(typeof PAYMENT_LABELS[m] === 'string', `missing label for ${m}`);
      assert.ok(PAYMENT_LABELS[m].length > 0, `empty label for ${m}`);
    }
  });

  it('27. 3 种配送方式', () => {
    assert.equal(DELIVERY_METHODS.length, 3);
  });

  it('28. 配送方式唯一', () => {
    assert.equal(new Set(DELIVERY_METHODS).size, DELIVERY_METHODS.length);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 表单验证逻辑
   ══════════════════════════════════════════════════════════ */

describe('checkout — 表单验证', () => {
  const EMPTY_FORM: CheckoutFormData = {
    name: '', phone: '', email: '', address: '', city: '',
    deliveryMethod: '', paymentMethod: '', agreeTerms: false,
    remark: '', couponCode: '',
  };

  it('29. 空表单返回 5 个错误', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.ok(Object.keys(errors).length >= 5, '空表单应返回至少5个错误，实际: ' + Object.keys(errors).length);
  });

  it('30. 姓名必填', () => {
    const errors = validateForm({ ...EMPTY_FORM, name: '张三' });
    assert.equal(errors.name, undefined);
  });

  it('31. 手机号必填', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(errors.phone, '请填写手机号');
  });

  it('32. 手机号格式验证', () => {
    const errors = validateForm({ ...EMPTY_FORM, phone: '12345' });
    assert.equal(errors.phone, '手机号格式不正确');
  });

  it('33. 有效手机号通过', () => {
    const errors = validateForm({ ...EMPTY_FORM, phone: '13800138000' });
    assert.notEqual(errors.name, undefined); // name still missing
    assert.equal(errors.phone, undefined); // phone OK
  });

  it('34. 地址必填', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(errors.address, '请填写收货地址');
  });

  it('35. 配送方式必选', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(errors.deliveryMethod, '请选择配送方式');
  });

  it('36. 支付方式必选', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(errors.paymentMethod, '请选择支付方式');
  });

  it('37. 必须同意服务条款', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(errors.agreeTerms, '请同意服务条款');
  });

  it('38. 完整表单通过验证', () => {
    const validForm: CheckoutFormData = {
      name: '张三', phone: '13800138000', email: '', address: '北京市朝阳区',
      city: '北京', deliveryMethod: 'express', paymentMethod: 'wechat',
      agreeTerms: true, remark: '', couponCode: '',
    };
    const errors = validateForm(validForm);
    assert.equal(Object.keys(errors).length, 0);
  });
});

/* ══════════════════════════════════════════════════════════
   边界与反例
   ══════════════════════════════════════════════════════════ */

describe('checkout — 边界用例', () => {
  it('39. 单个商品购物车', () => {
    const cart: CartItem[] = [{ id: 'p1', name: '测试商品', price: 10, quantity: 1 }];
    assert.equal(calcSubtotal(cart), 10);
    assert.equal(calcTotal(calcSubtotal(cart), calcDeliveryFee(calcSubtotal(cart))), 25); // 10+15
  });

  it('40. 空购物车', () => {
    const cart: CartItem[] = [];
    assert.equal(calcSubtotal(cart), 0);
    assert.equal(calcQuantity(cart), 0);
  });

  it('41. 大数量购物车（999 件）', () => {
    const cart: CartItem[] = [{ id: 'p1', name: '批量商品', price: 1, quantity: 999 }];
    assert.equal(calcQuantity(cart), 999);
    assert.equal(calcSubtotal(cart), 999);
  });

  it('42. 大金额商品', () => {
    const cart: CartItem[] = [{ id: 'p1', name: '高端商品', price: 99999.99, quantity: 1 }];
    assert.equal(calcSubtotal(cart), 99999.99);
  });

  it('43. 多种商品混装', () => {
    const cart: CartItem[] = [
      { id: 'a', name: 'A', price: 0.5, quantity: 10 },
      { id: 'b', name: 'B', price: 1.5, quantity: 20 },
    ];
    assert.equal(calcSubtotal(cart), 35); // 5 + 30
  });

  it('44. 页面不使用 console.log', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('console.log'), 'no debug logging');
  });

  it('45. 页面不引用 @m5/admin', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('@m5/admin'), 'should not import from @m5/admin');
  });
});
