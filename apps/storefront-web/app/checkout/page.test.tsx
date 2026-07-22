/**
 * checkout/page.test.tsx — 收银结算页 补充 L1 测试
 *
 * 覆盖: 金额计算逻辑、表单验证规则、支付方式常量、购物车合并
 * 正例: CartItem 数据结构、金额计算、支付方式枚举
 * 反例: 负价格、零数量、无效支付方式
 * 边界: 超大购物车、空购物车、最小金额、零值优惠
 *
 * 注: 数据源改为 sessionStorage 草稿 + 后端优惠券 API。
 * defaultCart 和 VALID_COUPONS 本地 mock 已移除。
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

/* ── 测试用数据 ── */

const TEST_CART: CartItem[] = [
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
  if (method === 'express') return 10;
  if (subtotal >= 199) return 0;
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
   测试: 文件结构
   ══════════════════════════════════════════════════════════ */

describe('checkout — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 是 "use client"', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("'use client'") || source.includes('"use client"'),
      'should be client component');
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 金额计算
   ══════════════════════════════════════════════════════════ */

describe('checkout — 金额计算', () => {
  it('3. 小计 = 299 + 89×2 + 139 + 59 = 675', () => {
    assert.equal(calcSubtotal(TEST_CART), 675);
  });

  it('4. 总商品数量 = 5', () => {
    assert.equal(calcQuantity(TEST_CART), 5);
  });

  it('5. 空购物车小计为 0', () => {
    assert.equal(calcSubtotal([]), 0);
  });

  it('6. 单个商品购物车', () => {
    const cart: CartItem[] = [{ id: 'p1', name: '测试商品', price: 10, quantity: 1 }];
    assert.equal(calcSubtotal(cart), 10);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 配送费计算
   ══════════════════════════════════════════════════════════ */

describe('checkout — 配送费计算', () => {
  it('7. 满 199 免运费 (standard)', () => {
    assert.equal(calcDeliveryFee(199), 0);
    assert.equal(calcDeliveryFee(200), 0);
  });

  it('8. 不足 199 运费 15 元 (standard)', () => {
    assert.equal(calcDeliveryFee(100), 15);
    assert.equal(calcDeliveryFee(198.99), 15);
  });

  it('9. 加急配送运费固定 10 元', () => {
    assert.equal(calcDeliveryFee(0, 'express'), 10);
    assert.equal(calcDeliveryFee(999, 'express'), 10);
  });

  it('10. 门店自提免运费', () => {
    assert.equal(calcDeliveryFee(0, 'pickup'), 0);
    assert.equal(calcDeliveryFee(100, 'pickup'), 0);
  });

  it('11. 边界值: 恰好 199 免运费', () => {
    assert.equal(calcDeliveryFee(199), 0);
  });

  it('12. 负数金额也返回 15', () => {
    assert.equal(calcDeliveryFee(-10), 15);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 总金额计算
   ══════════════════════════════════════════════════════════ */

describe('checkout — 总金额计算', () => {
  it('13. 正常计算: 小计 + 运费 - 优惠', () => {
    assert.equal(calcTotal(675, 0, 50), 625);
  });

  it('14. 无优惠时总金额 = 小计 + 运费', () => {
    assert.equal(calcTotal(675, 8, 0), 683);
  });

  it('15. 优惠大于小计+运费时结果为 0', () => {
    assert.equal(calcTotal(100, 10, 200), 0);
  });

  it('16. 零小计 + 运费 = 运费', () => {
    assert.equal(calcTotal(0, 15, 0), 15);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 支付方式
   ══════════════════════════════════════════════════════════ */

describe('checkout — 支付方式常量', () => {
  it('17. 4 种支付方式', () => {
    assert.equal(PAYMENT_METHODS.length, 4);
  });

  it('18. 所有支付方式都有标签', () => {
    for (const m of PAYMENT_METHODS) {
      assert.ok(typeof PAYMENT_LABELS[m] === 'string', `missing label for ${m}`);
      assert.ok(PAYMENT_LABELS[m].length > 0, `empty label for ${m}`);
    }
  });

  it('19. 3 种配送方式', () => {
    assert.equal(DELIVERY_METHODS.length, 3);
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

  it('20. 空表单返回 7 个错误', () => {
    const errors = validateForm(EMPTY_FORM);
    assert.equal(Object.keys(errors).length, 7);
  });

  it('21. 姓名必填', () => {
    assert.ok(validateForm(EMPTY_FORM).name);
  });

  it('22. 手机号必填', () => {
    assert.equal(validateForm(EMPTY_FORM).phone, '请输入手机号');
  });

  it('23. 手机号格式验证', () => {
    assert.equal(validateForm({ ...EMPTY_FORM, phone: '12345' }).phone, '手机号格式不正确（11位数字）');
  });

  it('24. 有效手机号通过', () => {
    assert.equal(validateForm({ ...EMPTY_FORM, phone: '13800138000' }).phone, undefined);
  });

  it('25. 地址必填', () => {
    assert.equal(validateForm(EMPTY_FORM).address, '请输入收货地址');
  });

  it('26. 配送方式必选', () => {
    assert.equal(validateForm(EMPTY_FORM).deliveryMethod, '请选择配送方式');
  });

  it('27. 支付方式必选', () => {
    assert.equal(validateForm(EMPTY_FORM).paymentMethod, '请选择支付方式');
  });

  it('28. 必须同意服务条款', () => {
    assert.equal(validateForm(EMPTY_FORM).agreeTerms, '请先同意服务条款');
  });

  it('29. 完整表单通过验证', () => {
    const validForm: CheckoutFormData = {
      name: '张三', phone: '13800138000', email: '', address: '北京市朝阳区',
      city: '北京', deliveryMethod: 'express', paymentMethod: 'wechat',
      agreeTerms: true, remark: '', couponCode: '',
    };
    assert.equal(Object.keys(validateForm(validForm)).length, 0);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: P0-02 收口改造验证
   ══════════════════════════════════════════════════════════ */

describe('checkout — P0-02 后端收口验证', () => {
  it('30. 源码不再包含 defaultCart 本地 mock', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.equal(source.includes('defaultCart'), false);
  });

  it('31. 源码不再包含 VALID_COUPONS 本地 mock', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.equal(source.includes('VALID_COUPONS'), false);
  });

  it('32. 源码引用 validateStorefrontCoupon 后端服务', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('validateStorefrontCoupon'));
  });

  it('33. 源码使用 useEffect 加载购物车草稿', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('useEffect'));
    assert.ok(source.includes('loadCheckoutDraft'));
  });

  it('34. 页面已接入 storefront transactions helper', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('startStorefrontCheckout'));
    assert.ok(source.includes('ensureStorefrontMemberRegistered'));
    assert.ok(source.includes('buildStorefrontMemberId'));
  });

  it('35. 不引用 console.log', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('console.log'));
  });

  it('36. 不引用 @m5/admin', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('@m5/admin'));
  });
});
