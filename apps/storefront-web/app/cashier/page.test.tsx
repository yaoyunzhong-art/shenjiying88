/**
 * cashier/page.test.tsx — 前台收银台 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
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

describe('cashier — 正例', () => {
  it('应导出一个默认组件 CashierPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CashierPage'), '缺少默认导出');
  });

  it('应包含 "收银台 — P-35" 标题', () => {
    const src = readSource();
    assert.ok(src.includes('收银台 — P-35'), '缺少页面标题');
  });

  it('应包含支付方式数据（微信/支付宝/现金）', () => {
    const src = readSource();
    assert.ok(src.includes('wechat'), '缺少微信支付');
    assert.ok(src.includes('alipay'), '缺少支付宝');
    assert.ok(src.includes('cash'), '缺少现金');
  });

  it('应包含 PAYMENT_OPTIONS 常量', () => {
    const src = readSource();
    assert.ok(src.includes('PAYMENT_OPTIONS'), '缺少支付方式配置');
  });

  it('应包含购物车数据结构和操作', () => {
    const src = readSource();
    assert.ok(src.includes('addToCart'), '缺少 addToCart');
    assert.ok(src.includes('removeFromCart'), '缺少 removeFromCart');
    assert.ok(src.includes('updateQuantity'), '缺少 updateQuantity');
  });

  it('应包含结账功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleCheckout'), '缺少结账处理');
    assert.ok(src.includes('checkoutStatus'), '缺少结账状态');
  });

  it('应包含会员信息展示', () => {
    const src = readSource();
    assert.ok(src.includes('MemberInfo'), '缺少 MemberInfo 类型');
    assert.ok(src.includes('cardNo'), '缺少会员卡号字段');
    assert.ok(src.includes('phone'), '缺少手机号字段');
    assert.ok(src.includes('name'), '缺少姓名字段');
  });

  it('应包含 MOCK_PRODUCTS 和 MOCK_MEMBER 数据', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PRODUCTS'), '缺少 Mock 商品数据');
    assert.ok(src.includes('MOCK_MEMBER'), '缺少 Mock 会员数据');
  });
});

describe('cashier — 边界', () => {
  it('购物车为空时应有提示', () => {
    const src = readSource();
    assert.ok(src.includes('购物车为空'), '空购物车提示');
  });

  it('商品搜索过滤应使用 .filter', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), 'filter 过滤');
  });

  it('应支持分类过滤', () => {
    const src = readSource();
    assert.ok(src.includes('selectedCategory'), '分类过滤状态');
  });

  it('应计算合计金额总计', () => {
    const src = readSource();
    assert.ok(src.includes('cartTotal'), '合计金额');
    assert.ok(src.includes('cartCount'), '商品件数');
  });

  it('MOCK_PRODUCTS 至少有 8 个商品', () => {
    const src = readSource();
    const count = (src.match(/{ id:/g) || []).length;
    assert.ok(count >= 8, `Mock 商品数不足: ${count}`);
  });
});

describe('cashier — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useState', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('应包含 useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应使用 PageShell 组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应使用 Card 组件', () => {
    const src = readSource();
    assert.ok(src.includes('Card'), '缺少 Card');
  });

  it('应使用 Tag 组件', () => {
    const src = readSource();
    assert.ok(src.includes('Tag'), '缺少 Tag');
  });

  it('结账前应检查购物车和支付方式', () => {
    const src = readSource();
    assert.ok(src.includes('cart.length === 0'), '空购物车检查');
    assert.ok(src.includes('!paymentMethod'), '支付方式检查');
  });
});
