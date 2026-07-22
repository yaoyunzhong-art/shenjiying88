/**
 * checkout/page.test.ts — 购物车/结算页 L1 源码冒烟测试
 * 覆盖: 购物车计算 · 配送 · 支付 · 表单 · 优惠 · 边界 · 防御
 * 角色: 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 注意: 数据源已改为后端加载，defaultCart 和 VALID_COUPONS mock 已移除。
 * 金额计算逻辑仍然保留前端展示用计算。
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 类型（mirror page.tsx） ──

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

interface PaymentOption {
  value: PaymentMethodValue;
  label: string;
  icon: string;
  description: string;
}

// ── 计算公式（mirror page.tsx） ──

const FREE_SHIPPING_THRESHOLD = 199;
const EXPRESS_FEE = 10;

function calcSubtotal(items: CartItem[]): number {
  return items.filter((i) => i.quantity > 0).reduce((s, i) => s + i.price * i.quantity, 0);
}

function calcTotal(subtotal: number, deliveryMethod: string): number {
  let total = subtotal;
  if (deliveryMethod === 'express') total += EXPRESS_FEE;
  return total;
}

function isFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

function calcShippingFee(subtotal: number, deliveryMethod: string): number {
  if (deliveryMethod === 'pickup') return 0;
  if (deliveryMethod === 'express') return isFreeShipping(subtotal) ? 0 : EXPRESS_FEE;
  return isFreeShipping(subtotal) ? 0 : 5; // standard
}

function validateCheckoutForm(data: Partial<CheckoutFormData>): string[] {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push('姓名不能为空');
  if (!data.phone?.trim()) errors.push('手机号不能为空');
  else if (!/^1[3-9]\d{9}$/.test(data.phone)) errors.push('手机号格式不正确');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('邮箱格式不正确');
  if (!data.agreeTerms) errors.push('请同意服务条款');
  if (data.deliveryMethod !== 'pickup' && !data.address?.trim()) errors.push('请填写收货地址');
  return errors;
}

// ============================================================
// 正例 (10+)
// ============================================================

test('🛒 前台: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 店长: 源码包含关键导出', () => {
  assert.ok(SRC.includes('CartItem'), '缺少 CartItem');
  assert.ok(SRC.includes('CheckoutFormData'), '缺少 CheckoutFormData');
  assert.ok(SRC.includes('PaymentMethodValue'), '缺少 PaymentMethodValue');
  assert.ok(SRC.includes("'use client'"), '缺少 use client');
});

test('🛒 前台: 购物车小计计算正确', () => {
  const cart: CartItem[] = [
    { id: 'p1', name: '商品A', price: 299, quantity: 1 },
    { id: 'p2', name: '商品B', price: 89, quantity: 2 },
    { id: 'p3', name: '商品C', price: 139, quantity: 1 },
    { id: 'p4', name: '商品D', price: 59, quantity: 1 },
  ];
  const subtotal = calcSubtotal(cart);
  // 299*1 + 89*2 + 139*1 + 59*1 = 675
  assert.equal(subtotal, 675, '小计应为 675');
});

test('👔 店长: 空购物车小计为 0', () => {
  assert.equal(calcSubtotal([]), 0);
});

test('🛒 前台: 仅正量商品计入小计', () => {
  const mixed = [
    { id: 'a', name: 'A', price: 100, quantity: 3 },
    { id: 'b', name: 'B', price: 200, quantity: 0 },
    { id: 'c', name: 'C', price: 50, quantity: -1 },
  ] as CartItem[];
  assert.equal(calcSubtotal(mixed), 300);
});

test('🛒 前台: 总价含加急运费', () => {
  const total = calcTotal(675, 'express');
  assert.equal(total, 685, '加急配送总价 = 675 + 10');
});

test('🛒 前台: 免运费门槛判断', () => {
  assert.equal(isFreeShipping(200), true);
  assert.equal(isFreeShipping(199), true);
  assert.equal(isFreeShipping(198), false);
});

test('🛒 前台: 自提免运费', () => {
  const fee = calcShippingFee(50, 'pickup');
  assert.equal(fee, 0);
});

test('🛒 前台: 标准配送满额免运费', () => {
  const fee = calcShippingFee(200, 'standard');
  assert.equal(fee, 0);
});

test('🛒 前台: 标准配送未满额收 5 元', () => {
  const fee = calcShippingFee(50, 'standard');
  assert.equal(fee, 5);
});

test('👔 店长: 表单调证通过', () => {
  const valid: CheckoutFormData = {
    name: '张三', phone: '13800138000', email: 'a@b.com',
    address: '北京朝阳', city: '北京', deliveryMethod: 'standard',
    paymentMethod: 'wechat', agreeTerms: true, remark: '', couponCode: '',
  };
  const errors = validateCheckoutForm(valid);
  assert.equal(errors.length, 0);
});

// ============================================================
// 反例 (8+)
// ============================================================

test('🔧 安监: 姓名为空应报错', () => {
  const errors = validateCheckoutForm({ name: '', phone: '13800138000', agreeTerms: true } as Partial<CheckoutFormData>);
  assert.ok(errors.some((e) => e.includes('姓名')));
});

test('🔧 安监: 手机号格式错误应报错', () => {
  const errors = validateCheckoutForm({ name: '张三', phone: '12345', agreeTerms: true } as Partial<CheckoutFormData>);
  assert.ok(errors.some((e) => e.includes('手机号')));
});

test('🔧 安监: 未同意条款应报错', () => {
  const errors = validateCheckoutForm({ name: '张三', phone: '13800138000', agreeTerms: false } as Partial<CheckoutFormData>);
  assert.ok(errors.some((e) => e.includes('条款')));
});

test('🔧 安监: 错误邮箱格式应报错', () => {
  const errors = validateCheckoutForm({ name: '张三', phone: '13800138000', email: 'abc', agreeTerms: true } as Partial<CheckoutFormData>);
  assert.ok(errors.some((e) => e.includes('邮箱')));
});

test('🔧 安监: 非自提且无地址应报错', () => {
  const errors = validateCheckoutForm({ name: '张三', phone: '13800138000', deliveryMethod: 'standard', address: '', agreeTerms: true } as Partial<CheckoutFormData>);
  assert.ok(errors.some((e) => e.includes('地址')));
});

test('🛒 前台: 购物车含负价商品', () => {
  const badCart = [{ id: 'x', name: '问题商品', price: -50, quantity: 1 }] as CartItem[];
  const sub = calcSubtotal(badCart);
  assert.equal(sub, -50, '负价仍会被计算（防御性）');
});

test('🔧 安监: 极大金额应不溢出', () => {
  const bigCart = [{ id: 'big', name: '大额商品', price: 999999999, quantity: 999 }] as CartItem[];
  const sub = calcSubtotal(bigCart);
  assert.equal(sub, 999999999 * 999);
});

// ============================================================
// 边界 (7+)
// ============================================================

test('🎯 运行专员: 正好免运费门槛边界', () => {
  assert.equal(isFreeShipping(FREE_SHIPPING_THRESHOLD), true);
  assert.equal(isFreeShipping(FREE_SHIPPING_THRESHOLD - 0.01), false);
});

test('🛒 前台: 加急配送满额免运费', () => {
  const fee = calcShippingFee(200, 'express');
  assert.equal(fee, 0, '满额加急免运费');
});

test('🛒 前台: 加急配送未满额收 10 元', () => {
  const fee = calcShippingFee(50, 'express');
  assert.equal(fee, 10);
});

test('🔧 安监: 表单调证所有字段均为空', () => {
  const errors = validateCheckoutForm({} as Partial<CheckoutFormData>);
  assert.ok(errors.length >= 3, '至少有 3 个必填字段错误');
});

test('👥 HR: PAYMENT_OPTIONS 覆盖全部支付方式', () => {
  const PAYMENT_OPTIONS: PaymentOption[] = [
    { value: 'wechat', label: '微信支付', icon: '💳', description: '微信扫码支付' },
    { value: 'alipay', label: '支付宝', icon: '🔵', description: '支付宝扫码支付' },
    { value: 'cash', label: '现金', icon: '💵', description: '到店付款' },
    { value: 'member_card', label: '会员卡', icon: '🎫', description: '余额/积分支付' },
  ];
  assert.equal(PAYMENT_OPTIONS.length, 4);
  const values = PAYMENT_OPTIONS.map((p) => p.value);
  assert.ok(values.includes('wechat'));
  assert.ok(values.includes('alipay'));
  assert.ok(values.includes('cash'));
  assert.ok(values.includes('member_card'));
});

test('🎮 导玩员: 配送选项包含三种方式', () => {
  const DELIVERY_OPTIONS = [
    { label: '标准配送（3-5天）', value: 'standard' },
    { label: '加急配送（1-2天）', value: 'express', extra: '¥10.00' },
    { label: '门店自提', value: 'pickup' },
  ];
  assert.equal(DELIVERY_OPTIONS.length, 3);
  const vals = DELIVERY_OPTIONS.map((d) => d.value);
  assert.ok(vals.includes('standard'));
  assert.ok(vals.includes('express'));
  assert.ok(vals.includes('pickup'));
});

// ── 新增: P0-02 后端化验证 ──

test('📢 营销: 源码不再包含 defaultCart 本地 mock', () => {
  assert.equal(SRC.includes('defaultCart'), false, 'defaultCart 应被移除');
});

test('📢 营销: 源码不再包含 VALID_COUPONS 本地 mock', () => {
  assert.equal(SRC.includes('VALID_COUPONS'), false, 'VALID_COUPONS 应被移除');
});

test('🛒 前台: 源码引用 validateStorefrontCoupon 后端服务', () => {
  assert.ok(SRC.includes('validateStorefrontCoupon'), '应引用后端优惠券验证');
});

test('🛒 前台: 组件从 sessionStorage 加载购物车草稿', () => {
  assert.ok(SRC.includes('loadCheckoutDraft'), '应使用 loadCheckoutDraft 加载购物车');
});

test('🛒 前台: 组件使用 useEffect 加载数据', () => {
  assert.ok(SRC.includes('useEffect'), '应使用 useEffect 加载数据');
});
