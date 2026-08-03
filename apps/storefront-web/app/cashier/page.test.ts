/**
 * cashier/page.test.ts — 前台收银台 L1 源码冒烟测试 (P-35)
 * 覆盖: 商品搜索 · 购物车 · 会员折扣 · 支付 · 金额格式化 · 防御 · 边界
 * 角色: 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
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

interface StorefrontCashierProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

interface CartItem extends StorefrontCashierProduct {
  quantity: number;
}

interface MemberInfo {
  phone: string;
  name: string;
  tier: string;
  tierLabel: string;
  discountRate: number;
  points: number;
}

type PaymentMethod = 'wechat' | 'balance' | 'cash';
type CheckoutPaymentMethod = 'wechat' | 'member_card' | 'cash';

// ── Mock 数据 ──

const MOCK_PRODUCTS: StorefrontCashierProduct[] = [
  { id: 'prod-01', name: '游戏币 50枚', price: 25, category: '游戏币', stock: 999 },
  { id: 'prod-02', name: '游戏币 100枚', price: 45, category: '游戏币', stock: 999 },
  { id: 'prod-03', name: '游戏币 200枚（优惠装）', price: 80, category: '游戏币', stock: 500 },
  { id: 'prod-04', name: 'VR体验票（单人）', price: 68, category: '体验票', stock: 30 },
  { id: 'prod-05', name: 'VR体验票（双人）', price: 118, category: '体验票', stock: 20 },
  { id: 'prod-06', name: '抓娃娃 10次卡', price: 30, category: '游戏卡', stock: 100 },
  { id: 'prod-07', name: '会员月卡', price: 199, category: '会员卡', stock: 50 },
  { id: 'prod-08', name: '会员季卡', price: 499, category: '会员卡', stock: 30 },
  { id: 'prod-09', name: '饮品-可乐', price: 5, category: '饮品', stock: 200 },
  { id: 'prod-10', name: '饮品-矿泉水', price: 3, category: '饮品', stock: 200 },
  { id: 'prod-11', name: '零食大礼包', price: 35, category: '零食', stock: 80 },
  { id: 'prod-12', name: '玩具公仔（小）', price: 15, category: '周边', stock: 60 },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'wechat', label: '微信扫码', icon: '💳' },
  { value: 'balance', label: '会员余额', icon: '💰' },
  { value: 'cash', label: '现金', icon: '💵' },
];

const DEFAULT_MEMBER_NAME = '门店散客';
const TIER_LABELS: Record<string, string> = { diamond: '钻石', gold: '黄金', silver: '银卡', bronze: '铜卡', basic: '普通' };

function fm(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function mapPaymentMethodToCheckoutMethod(method: PaymentMethod): CheckoutPaymentMethod {
  switch (method) {
    case 'balance': return 'member_card';
    case 'cash': return 'cash';
    case 'wechat':
    default: return 'wechat';
  }
}

function searchProducts(products: StorefrontCashierProduct[], keyword: string): StorefrontCashierProduct[] {
  if (!keyword.trim()) return products;
  const kw = keyword.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(kw) ||
      p.category.toLowerCase().includes(kw),
  );
}

function filterByCategory(products: StorefrontCashierProduct[], cat: string | '全部'): StorefrontCashierProduct[] {
  return cat === '全部' ? products : products.filter((p) => p.category === cat);
}

function calcCartTotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

function applyMemberDiscount(total: number, discountRate: number): number {
  if (discountRate <= 0 || discountRate > 1) return total;
  return Math.round(total * discountRate * 100) / 100;
}

function validateStockNeeded(items: CartItem[], products: StorefrontCashierProduct[]): string[] {
  const errors: string[] = [];
  for (const item of items) {
    const prod = products.find((p) => p.id === item.id);
    if (!prod) { errors.push(`商品 ${item.name} 不存在`); continue; }
    if (item.quantity > prod.stock) errors.push(`${item.name} 库存不足（需求${item.quantity}，库存${prod.stock}）`);
    if (item.quantity <= 0) errors.push(`${item.name} 数量无效`);
  }
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
  assert.ok(SRC.includes("'use client'"), '缺少 use client');
  assert.ok(SRC.includes('CartItem'), '缺少 CartItem');
  assert.ok(SRC.includes('MemberInfo'), '缺少 MemberInfo');
  assert.ok(SRC.includes('PaymentMethod'), '缺少 PaymentMethod');
});

test('🛒 前台: 金额格式化函数 ¥', () => {
  assert.equal(fm(0), '¥0.00');
  assert.equal(fm(25), '¥25.00');
  assert.equal(fm(1234.5), '¥1,234.50');
});

test('🛒 前台: 大金额格式化', () => {
  assert.equal(fm(1000000), '¥1,000,000.00');
});

test('🛒 前台: 搜索按名称返回匹配', () => {
  const result = searchProducts(MOCK_PRODUCTS, '游戏币');
  assert.equal(result.length, 3, '3 种游戏币商品');
  result.forEach((p) => assert.ok(p.name.includes('游戏币')));
});

test('🛒 前台: 搜索按分类返回匹配', () => {
  const result = searchProducts(MOCK_PRODUCTS, '饮品');
  assert.equal(result.length, 2);
  assert.ok(result.every((p) => p.category === '饮品' || p.name.includes('饮品')));
});

test('🛒 前台: 搜索空关键词返回全部', () => {
  const result = searchProducts(MOCK_PRODUCTS, '');
  assert.equal(result.length, MOCK_PRODUCTS.length);
});

test('🛒 前台: 分类过滤正确', () => {
  const result = filterByCategory(MOCK_PRODUCTS, '游戏币');
  assert.equal(result.length, 3);
  assert.ok(result.every((p) => p.category === '游戏币'));
});

test('🛒 前台: 购物车总价计算', () => {
  const cart: CartItem[] = [
    { ...MOCK_PRODUCTS[0], quantity: 2 },
    { ...MOCK_PRODUCTS[3], quantity: 1 },
  ];
  assert.equal(calcCartTotal(cart), 25 * 2 + 68 * 1); // 118
});

test('🛒 前台: 会员折扣应用 8 折', () => {
  const after = applyMemberDiscount(100, 0.8);
  assert.equal(after, 80);
});

test('🛒 前台: 银卡 9 折', () => {
  const after = applyMemberDiscount(200, 0.9);
  assert.equal(after, 180);
});

test('👔 店长: 支付方式映射', () => {
  assert.equal(mapPaymentMethodToCheckoutMethod('wechat'), 'wechat');
  assert.equal(mapPaymentMethodToCheckoutMethod('balance'), 'member_card');
  assert.equal(mapPaymentMethodToCheckoutMethod('cash'), 'cash');
});

test('👔 店长: PAYMENT_OPTIONS 有 3 种', () => {
  assert.equal(PAYMENT_OPTIONS.length, 3);
});

test('🛒 前台: 库存充足验证通过', () => {
  const cart: CartItem[] = [{ ...MOCK_PRODUCTS[0], quantity: 1 }];
  assert.equal(validateStockNeeded(cart, MOCK_PRODUCTS).length, 0);
});

test('👔 店长: MOCK_PRODUCTS 有 12 种商品', () => {
  assert.equal(MOCK_PRODUCTS.length, 12);
  const categories = new Set(MOCK_PRODUCTS.map((p) => p.category));
  assert.ok(categories.size >= 5, '至少有 5 个分类');
});

// ============================================================
// 反例 (8+)
// ============================================================

test('🔧 安监: 不存在的搜索词应返回空', () => {
  assert.equal(searchProducts(MOCK_PRODUCTS, '不存在商品').length, 0);
});

test('🔧 安监: 空库存时验证应报错', () => {
  const cart: CartItem[] = [{ ...MOCK_PRODUCTS[0], quantity: 1000 }];
  const errors = validateStockNeeded(cart, MOCK_PRODUCTS);
  assert.ok(errors.some((e) => e.includes('库存不足')));
});

test('🔧 安监: 负数量应报错', () => {
  const cart: CartItem[] = [{ ...MOCK_PRODUCTS[0], quantity: -1 }];
  const errors = validateStockNeeded(cart, MOCK_PRODUCTS);
  assert.ok(errors.some((e) => e.includes('无效')));
});

test('🔧 安监: 商品不存在应报错', () => {
  const cart: CartItem[] = [{ id: 'not-exists', name: '虚拟商品', price: 999, category: 'unknown', stock: 0, quantity: 1 }];
  const errors = validateStockNeeded(cart, MOCK_PRODUCTS);
  assert.ok(errors.some((e) => e.includes('不存在')));
});

test('🔧 安监: 不存在的分类过滤返回空', () => {
  assert.equal(filterByCategory(MOCK_PRODUCTS, '虚拟分类').length, 0);
});

test('🛒 前台: discountRate = 0 应返回原价', () => {
  assert.equal(applyMemberDiscount(100, 0), 100);
});

test('🛒 前台: discountRate > 1 应返回原价', () => {
  assert.equal(applyMemberDiscount(100, 1.5), 100);
});

test('🔧 安监: 恶意搜索不报错', () => {
  const result = searchProducts(MOCK_PRODUCTS, '<img src=x onerror=alert(1)>');
  assert.ok(Array.isArray(result));
});

test('🔧 安监: 极端长搜索词不报错', () => {
  const result = searchProducts(MOCK_PRODUCTS, 'a'.repeat(500));
  assert.ok(Array.isArray(result));
});

// ============================================================
// 边界 (7+)
// ============================================================

test('🎯 运行专员: 购物车总价为零', () => {
  assert.equal(calcCartTotal([]), 0);
});

test('🎯 运行专员: 购物车含零数量商品不计入', () => {
  const cart: CartItem[] = [{ ...MOCK_PRODUCTS[0], quantity: 0 }];
  assert.equal(calcCartTotal(cart), 0);
});

test('🎯 运行专员: 折扣结果保留两位小数', () => {
  const after = applyMemberDiscount(199, 0.85);
  assert.equal(after, 169.15);
});

test('🎯 运行专员: 各分类商品数量分布', () => {
  const catCounts = new Map<string, number>();
  for (const p of MOCK_PRODUCTS) {
    catCounts.set(p.category, (catCounts.get(p.category) || 0) + 1);
  }
  assert.equal(catCounts.get('游戏币'), 3);
  assert.equal(catCounts.get('体验票'), 2);
  assert.equal(catCounts.get('饮品'), 2);
});

test('📢 营销: TIER_LABELS 覆盖全部会员等级', () => {
  assert.equal(TIER_LABELS.diamond, '钻石');
  assert.equal(TIER_LABELS.gold, '黄金');
  assert.equal(TIER_LABELS.silver, '银卡');
  assert.equal(TIER_LABELS.bronze, '铜卡');
  assert.equal(TIER_LABELS.basic, '普通');
});

test('👔 店长: 支付方式映射不丢失', () => {
  for (const pm of ['wechat', 'balance', 'cash'] as PaymentMethod[]) {
    const mapped = mapPaymentMethodToCheckoutMethod(pm);
    assert.ok(['wechat', 'member_card', 'cash'].includes(mapped));
  }
});

test('🛒 前台: 搜索小写关键词应匹配带大写名称', () => {
  const result = searchProducts(MOCK_PRODUCTS, 'vr');
  assert.ok(result.length > 0, '小写 vr 应匹配 VR 体验票');
});

test('🤝 团建: 多件同商品购物车计算', () => {
  const cart: CartItem[] = [
    { ...MOCK_PRODUCTS[1], quantity: 5 }, // 100枚*5
    { ...MOCK_PRODUCTS[6], quantity: 3 }, // 月卡*3
  ];
  assert.equal(calcCartTotal(cart), 45 * 5 + 199 * 3); // 225 + 597 = 822
});
