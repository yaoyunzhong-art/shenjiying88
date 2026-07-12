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

// ============================================================
// P0-E1: 前端 API 集成诊断
// 目标: 确认 storefront cashier 页与后端 API 的集成状态
// 诊断结果: 🔴 现阶段为纯 Mock 页面,未连接真实后端
// ============================================================

describe('cashier — API 集成诊断 [P0-E1]', () => {
  it('[GAP] 页面使用 setTimeout 模拟结账,未调用真实 API', () => {
    const src = readSource();
    const hasApiCall =
      src.includes('fetch(') ||
      src.includes('axios.') ||
      src.includes('/api/cashier') ||
      src.includes('cashierOrder') ||
      src.includes('createOrder');
    assert.equal(hasApiCall, false, '页面不应存在真实 API 调用（诊断确认）');
    // handleCheckout 使用 setTimeout + Math.random, 无真实请求
    assert.ok(src.includes('setTimeout('), 'handleCheckout 使用 setTimeout');
    assert.ok(src.includes('Math.random()'), 'handleCheckout 使用随机模拟');
  });

  it('[GAP] 商品和会员数据为内联 Mock,未从 API 获取', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PRODUCTS'), '商品数据为内联 Mock');
    assert.ok(src.includes('MOCK_MEMBER'), '会员数据为内联 Mock');
    // 未引用任何远程数据源
    const hasDataFetching =
      src.includes('useEffect') &&
      (src.includes('fetch(') || src.includes('loadProducts') || src.includes('loadMember'));
    assert.equal(hasDataFetching, false, '页面未使用 useEffect 获取数据');
  });

  it('[GAP] 未导入 @m5/sdk 或其他 API 客户端', () => {
    const src = readSource();
    const hasSdkImport =
      src.includes('@m5/sdk') ||
      src.includes('@m5/domain') ||
      src.includes('cashier-pos-service') ||
      src.includes('ApiClient');
    assert.equal(hasSdkImport, false, '未导入 API 客户端模块');
  });

  it('[GAP] 支付处理无真实后端交互,仅前端模拟', () => {
    const src = readSource();
    // 支付选择仅更新状态,未触发 API
    assert.ok(src.includes('handlePaymentSelect'), '支付选择函数存在');
    assert.ok(src.includes('setPaymentMethod'), '支付状态管理存在');
    // 无支付 API 调用
    const hasPaymentApi =
      src.includes('paymentSubmit') ||
      src.includes('submitPayment') ||
      src.includes('/api/payments');
    assert.equal(!!hasPaymentApi, false, '无支付 API 调用');
  });

  it('[GAP] 无会员查询 API 交互', () => {
    const src = readSource();
    // 会员信息直接使用 MOCK_MEMBER,无查询 API
    assert.ok(src.includes('MemberInfo'), '会员类型定义存在');
    assert.ok(src.includes('cardNo'), '会员卡号字段存在');
    // 无会员查询
    const hasMemberLookup =
      src.includes('lookupMember') ||
      src.includes('searchMember') ||
      src.includes('fetchMember');
    assert.equal(!!hasMemberLookup, false, '无会员查询 API');
  });

  it('[READY] 页面结构支持后续接入 API (handleCheckout 已设计为 async-capable)', () => {
    const src = readSource();
    // useCallback + useState 结构可被替换为 async function
    assert.ok(src.includes('useCallback'), '使用 useCallback 可包装');
    assert.ok(src.includes('setIsProcessing'), '加载状态管理就绪');
    assert.ok(src.includes('setCheckoutStatus'), '结账状态管理就绪');
    assert.ok(src.includes('setMessageText'), '消息状态管理就绪');
  });

  it('[SUMMARY] 后端 API 已存在 (cashier.service.ts + cashier-pos-service.ts)', () => {
    // 诊断发现:
    //   - apps/api/src/modules/cashier/cashier.service.ts  — 后端收银 API
    //   - apps/tob-web/app/cashier-pos/cashier-pos-service.ts — TOB 端集成服务层
    //   - packages/sdk/src/index.ts — ApiClient 通用客户端
    // 但 storefront-web 的 cashier/page.tsx 未使用以上任何模块
    const src = readSource();
    // 确认 storefront 页面结构
    assert.ok(src.includes('export default function CashierPage'), '页面组件就绪');
    assert.ok(src.includes('PaymentMethod'), '支付类型就绪');
    assert.ok(src.includes('checkoutStatus'), '结账状态就绪');

    // 打印集成摘要
    const gapItems = [
      '❌ 无 API 调用 (纯 setTimeout 模拟)',
      '❌ 无 useEffect 数据获取',
      '❌ 未导入 @m5/sdk 或 cashier 服务',
      '❌ 无真实会员查询',
      '❌ 无真实支付交互',
      '❌ 无真实商品数据加载',
      '✅ 页面 UI 组件完整 (PageShell, Card, Tag, Select, Input, Button)',
      '✅ 状态管理就绪 (isProcessing, checkoutStatus, messageText)',
      '✅ 后端 Cashier API 已实现',
      '✅ TOB cashier-pos-service 提供集成参考',
    ];
    // 通过 console 输出集成摘要
    console.log('\n📊 [P0-E1] Storefront Cashier API 集成诊断报告');
    console.log('   =============================================');
    gapItems.forEach((item, i) => console.log(`   ${item}`));
    console.log('   =============================================');
    console.log('   🔴 整体状态: 纯 Mock 前端,需进行真实 API 集成');
    console.log('   🎯 下一步: 参考 tob-web cashier-pos-service.ts 模式');
    console.log('         引入 @m5/sdk ApiClient 或新建 cashier-service.ts');
    console.log('         替换 MOCK_PRODUCTS/MOCK_MEMBER -> API 获取');
    console.log('         替换 setTimeout checkout -> POST /api/cashier/orders');
  });
});
