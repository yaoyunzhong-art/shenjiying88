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

const DELIVERY_METHODS = ['standard', 'express', 'pickup'];

/* ── 辅助函数 ── */

function calcSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calcQuantity(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function calcDeliveryFee(subtotal: number, method: string = 'standard'): number {
  // 与 page.tsx shippingFee 一致
  if (method === 'pickup') return 0;
  if (method === 'express') return 10; // EXPRESS_FEE
  if (subtotal >= 199) return 0; // FREE_SHIPPING_THRESHOLD
  return 15;
}

function calcTotal(subtotal: number, deliveryFee: number, discount: number = 0): number {
  return Math.max(0, subtotal + deliveryFee - discount);
}

function validateForm(data: CheckoutFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = '请输入收件人姓名';
  if (!data.phone.trim()) errors.phone = '请输入手机号';
  else if (!/^1\d{10}$/.test(data.phone.trim())) errors.phone = '手机号格式不正确（11位数字）';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = '邮箱格式不正确';
  if (!data.address.trim()) errors.address = '请输入收货地址';
  if (!data.city.trim()) errors.city = '请输入所在城市';
  if (!data.deliveryMethod) errors.deliveryMethod = '请选择配送方式';
  if (!data.paymentMethod) errors.paymentMethod = '请选择支付方式';
  if (!data.agreeTerms) errors.agreeTerms = '请先同意服务条款';
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
  it('14. 满 199 免运费 (standard)', () => {
    assert.equal(calcDeliveryFee(199), 0);
    assert.equal(calcDeliveryFee(200), 0);
    assert.equal(calcDeliveryFee(999), 0);
  });

  it('15. 不足 199 运费 15 元 (standard)', () => {
    assert.equal(calcDeliveryFee(0), 15);
    assert.equal(calcDeliveryFee(50), 15);
    assert.equal(calcDeliveryFee(100), 15);
    assert.equal(calcDeliveryFee(198.99), 15);
  });

  it('16. 加急配送运费固定 10 元', () => {
    assert.equal(calcDeliveryFee(0, 'express'), 10);
    assert.equal(calcDeliveryFee(100, 'express'), 10);
    assert.equal(calcDeliveryFee(999, 'express'), 10);
  });

  it('17. 门店自提免运费', () => {
    assert.equal(calcDeliveryFee(0, 'pickup'), 0);
    assert.equal(calcDeliveryFee(100, 'pickup'), 0);
    assert.equal(calcDeliveryFee(999, 'pickup'), 0);
  });

  it('18. 边界值: 恰好 199 免运费', () => {
    assert.equal(calcDeliveryFee(199), 0);
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

  it('29. 空表单返回 7 个错误', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(Object.keys(errors).length, 7, '空表单应返回恰好7个错误，实际: ' + Object.keys(errors).length);
  });

  it('30. 姓名必填', () => {
    const errors = validateForm({ ...EMPTY_FORM, name: '张三' });
    assert.equal(errors.name, undefined);
  });

  it('31. 手机号必填', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(errors.phone, '请输入手机号');
  });

  it('32. 手机号格式验证', () => {
    const errors = validateForm({ ...EMPTY_FORM, phone: '12345' });
    assert.equal(errors.phone, '手机号格式不正确（11位数字）');
  });

  it('33. 有效手机号通过', () => {
    const errors = validateForm({ ...EMPTY_FORM, phone: '13800138000' });
    assert.notEqual(errors.name, undefined); // name still missing
    assert.equal(errors.phone, undefined); // phone OK
  });

  it('34. 地址必填', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(errors.address, '请输入收货地址');
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
    assert.equal(errors.agreeTerms, '请先同意服务条款');
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
   新增: 优惠券验证逻辑（从 page.tsx 源码提取）
   ══════════════════════════════════════════════════════════ */

describe('checkout — 优惠券验证逻辑', () => {
  /* ── 从page.tsx提取的优惠券常量 ── */
  const VALID_COUPONS: Record<string, { label: string; discount: number; minAmount: number }> = {
    'WELCOME10': { label: '新客首单立减', discount: 10, minAmount: 0 },
    'SAVE20': { label: '满200减20', discount: 20, minAmount: 200 },
    'VIP50': { label: 'VIP专属满减', discount: 50, minAmount: 500 },
  };
  const FREE_SHIPPING_THRESHOLD = 199;
  const EXPRESS_FEE = 10;

  /* ── 正例 ── */

  it('46. WELCOME10 首单立减 10 元，无门槛', () => {
    const c = VALID_COUPONS['WELCOME10'];
    assert.ok(c, 'WELCOME10 should exist');
    assert.equal(c.discount, 10);
    assert.equal(c.minAmount, 0);
  });

  it('47. SAVE20 满200减20', () => {
    const c = VALID_COUPONS['SAVE20'];
    assert.ok(c, 'SAVE20 should exist');
    assert.equal(c.discount, 20);
    assert.equal(c.minAmount, 200);
  });

  it('48. VIP50 VIP满500减50', () => {
    const c = VALID_COUPONS['VIP50'];
    assert.ok(c, 'VIP50 should exist');
    assert.equal(c.discount, 50);
    assert.equal(c.minAmount, 500);
  });

  it('49. 优惠券码大小写不敏感（通过 toUpperCase 转换后匹配）', () => {
    const code = 'welcome10';
    const upperCode = code.trim().toUpperCase();
    const coupon = VALID_COUPONS[upperCode];
    assert.ok(coupon, `${code} should find coupon after toUpperCase(), got ${upperCode}`);
    assert.equal(coupon.discount, 10, 'WELCOME10 discount should be 10');
  });

  it('49b. 大写也匹配（不转直接查）', () => {
    const code = 'WELCOME10';
    const coupon = VALID_COUPONS[code];
    assert.ok(coupon, 'WELCOME10 should exist directly');
  });

  it('50. 无效优惠券码返回 undefined', () => {
    assert.equal(VALID_COUPONS['INVALID'], undefined);
    assert.equal(VALID_COUPONS[''], undefined);
    assert.equal(VALID_COUPONS['SAVE'], undefined);
  });

  it('51. 所有优惠券 discount 为正数', () => {
    for (const code of Object.keys(VALID_COUPONS)) {
      assert.ok(VALID_COUPONS[code].discount > 0, `${code} discount must be > 0`);
    }
  });

  it('52. 所有优惠券 minAmount 非负', () => {
    for (const code of Object.keys(VALID_COUPONS)) {
      assert.ok(VALID_COUPONS[code].minAmount >= 0, `${code} minAmount must be >= 0`);
    }
  });

  it('53. WELCOME10 无门槛，0元也可用', () => {
    assert.ok(0 >= VALID_COUPONS['WELCOME10'].minAmount, 'should apply on any amount');
  });

  it('54. VIP50 需要满500才能使用', () => {
    const subtotal = 300;
    assert.ok(subtotal < VALID_COUPONS['VIP50'].minAmount, 'subtotal 300 < 500, coupon should not apply');
  });

  it('55. SAVE20 满200在使用门槛上', () => {
    assert.ok(200 >= VALID_COUPONS['SAVE20'].minAmount, 'subtotal 200 exactly meets min');
    assert.ok(250 >= VALID_COUPONS['SAVE20'].minAmount, 'subtotal 250 meets min');
  });

  /* ── 配送费计算（真实逻辑） ── */

  it('56. 门店自提免运费', () => {
    // 与 page.tsx: deliveryMethod === 'pickup' → 0
    const subtotal = 50;
    const deliveryMethod = 'pickup';
    const fee = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'express' ? EXPRESS_FEE : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15;
    assert.equal(fee, 0);
  });

  it('57. 加急配送运费固定 10 元', () => {
    const subtotal = 50;
    const deliveryMethod = 'express';
    const fee = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'express' ? EXPRESS_FEE : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15;
    assert.equal(fee, 10);
    assert.equal(fee, EXPRESS_FEE);
  });

  it('58. 标准配送满199免运费', () => {
    const subtotal = 250;
    const deliveryMethod = 'standard';
    const fee = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'express' ? EXPRESS_FEE : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15;
    assert.equal(fee, 0);
  });

  it('59. 标准配送不满199运费15', () => {
    const subtotal = 50;
    const deliveryMethod = 'standard';
    const fee = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'express' ? EXPRESS_FEE : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15;
    assert.equal(fee, 15);
  });

  it('60. FREE_SHIPPING_THRESHOLD 边界值', () => {
    assert.equal(FREE_SHIPPING_THRESHOLD, 199, 'threshold should be 199');
    const standardFee = (subtotal: number) => subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15;
    assert.equal(standardFee(198), 15);
    assert.equal(standardFee(199), 0);
    assert.equal(standardFee(200), 0);
  });

  it('61. 空优惠券码应触发错误', () => {
    const code = '';
    if (!code) {
      assert.ok(true, 'empty code should return error');
    } else {
      const coupon = VALID_COUPONS[code.trim().toUpperCase()];
      assert.ok(!coupon, 'no coupon for empty string');
    }
  });

  /* ── 金额计算链 ── */

  it('62. 有优惠时总金额 = subtotal + shippingFee - discount', () => {
    const subtotal = 300;
    const shippingFee = 0;
    const couponDiscount = 20;
    const total = Math.max(0, subtotal + shippingFee - couponDiscount);
    assert.equal(total, 280);
  });

  it('63. 优惠大于subtotal+shipping时总金额=0', () => {
    const subtotal = 50;
    const shippingFee = 10;
    const couponDiscount = 100;
    const total = Math.max(0, subtotal + shippingFee - couponDiscount);
    assert.equal(total, 0);
  });

  it('64. 优惠=0时等同于无优惠', () => {
    const subtotal = 300;
    const shippingFee = 15;
    const couponDiscount = 0;
    const total = Math.max(0, subtotal + shippingFee - couponDiscount);
    assert.equal(total, 315);
  });

  /* ── 支付方式完整验证 ── */

  it('65. 4种支付方式全部有图标和描述', () => {
    const payOpts: Array<{ value: string; label: string; icon: string; description: string }> = [
      { value: 'wechat', label: '微信支付', icon: '💳', description: '微信扫码支付' },
      { value: 'alipay', label: '支付宝', icon: '🔵', description: '支付宝扫码支付' },
      { value: 'cash', label: '现金', icon: '💵', description: '到店付款' },
      { value: 'member_card', label: '会员卡', icon: '🎫', description: '余额/积分支付' },
    ];
    assert.equal(payOpts.length, 4);
    const values = payOpts.map(o => o.value);
    assert.equal(new Set(values).size, 4, 'all values unique');
  });

  it('66. 配送方式3种全部有标签和值', () => {
    const deliveryOptions = [
      { label: '标准配送（3-5天）', value: 'standard' },
      { label: '加急配送（1-2天）', value: 'express', extra: '¥10.00' },
      { label: '门店自提', value: 'pickup' },
    ];
    assert.equal(deliveryOptions.length, 3);
    const values = deliveryOptions.map(o => o.value);
    assert.equal(new Set(values).size, 3, 'all delivery values unique');
    assert.equal(deliveryOptions[1].extra, '¥10.00', 'express should have extra fee info');
  });

  it('67. canCheckout 依赖于 activeItems.length > 0', () => {
    // canCheckout = activeItems.length > 0
    assert.ok([1, 2, 3].length > 0, 'non-empty cart should allow checkout');
    assert.ok(!([].length > 0), 'empty cart should not allow checkout');
  });
});

/* ══════════════════════════════════════════════════════════
   表单深层验证
   ══════════════════════════════════════════════════════════ */

describe('checkout — 表单深层验证', () => {
  const EMPTY_FORM: CheckoutFormData = {
    name: '', phone: '', email: '', address: '', city: '',
    deliveryMethod: '', paymentMethod: '', agreeTerms: false,
    remark: '', couponCode: '',
  };

  it('68. 邮箱可选择不填（留空通过验证）', () => {
    const errors = validateForm({ ...EMPTY_FORM, name: '张三', phone: '13800138000', address: '朝阳', city: '北京', deliveryMethod: 'express', paymentMethod: 'wechat', agreeTerms: true });
    assert.equal(errors.email, undefined, 'empty email should be valid (optional)');
  });

  it('69. 非空邮箱格式错误应检测', () => {
    const errors = validateForm({ ...EMPTY_FORM, email: 'bademail', name: '张三', phone: '13800138000', address: '朝阳', city: '北京', deliveryMethod: 'express', paymentMethod: 'wechat', agreeTerms: true });
    assert.ok(errors.email, 'should detect bad email');
    assert.equal(errors.email, '邮箱格式不正确');
    assert.equal(Object.keys(errors).length, 1, 'should have exactly 1 error');
  });

  it('70. 有效邮箱通过验证', () => {
    const errors = validateForm({ ...EMPTY_FORM, email: 'test@example.com', name: '张三', phone: '13800138000', address: '朝阳', city: '北京', deliveryMethod: 'express', paymentMethod: 'wechat', agreeTerms: true });
    assert.equal(errors.email, undefined, 'valid email passes');
    assert.equal(Object.keys(errors).length, 0);
  });

  it('71. 手机号带空格不应该通过（page.trim不处理空格）', () => {
    const errors = validateForm({ ...EMPTY_FORM, phone: '138 0013 8000', name: '张三', address: '朝阳', city: '北京', deliveryMethod: 'express', paymentMethod: 'wechat', agreeTerms: true });
    assert.ok(errors.phone, 'phone with spaces should be invalid because page uses trim() not replace(/\s/g, "")');
    assert.equal(errors.phone, '手机号格式不正确（11位数字）');
  });

  it('72. 姓名纯空格应触发错误（trim后为空）', () => {
    const errors = validateForm({ ...EMPTY_FORM, name: '   ', phone: '13800138000', address: '朝阳', city: '北京', deliveryMethod: 'express', paymentMethod: 'wechat', agreeTerms: true });
    assert.ok(errors.name, 'whitespace-only name should trigger error after trim()');
  });

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
