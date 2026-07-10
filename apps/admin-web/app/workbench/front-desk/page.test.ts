/**
 * workbench/front-desk/page.test.ts — 前台操作面板 L1 冒烟测试
 * 覆盖: 正例 · 边界 · 防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('FrontDeskWorkbench — 正例', () => {
  it('应导出一个默认组件 FrontDeskWorkbenchPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function FrontDeskWorkbenchPage'), '缺少默认导出组件');
  });

  it('应使用 FrontDeskPanel 组件', () => {
    const src = readSource();
    assert.ok(src.includes('FrontDeskPanel'), '缺少 FrontDeskPanel');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 DetailActionBar 工具栏', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), '缺少 DetailActionBar');
  });

  it('应包含今日统计卡片区域 (summaryCards)', () => {
    const src = readSource();
    const hasStatCards =
      src.includes('今日订单') && src.includes('今日营收') && src.includes('平均结账') && src.includes('待取餐');
    assert.ok(hasStatCards, '缺少统计卡片');
  });

  it('应包含支付方式处理逻辑', () => {
    const src = readSource();
    const hasPaymentLogic =
      src.includes('handlePaymentChange') && src.includes('onPaymentChange');
    assert.ok(hasPaymentLogic, '缺少支付方式处理');
  });

  it('应包含结账逻辑 (handleCheckout)', () => {
    const src = readSource();
    assert.ok(src.includes('handleCheckout'), '缺少 handleCheckout');
  });

  it('应包含排队叫号展示', () => {
    const src = readSource();
    assert.ok(src.includes('排队'), '缺少排队展示');
  });

  it('应包含快捷功能按钮定义', () => {
    const src = readSource();
    assert.ok(src.includes('quickActions'), '缺少 quickActions');
    assert.ok(src.includes('叫号'), '缺少叫号功能');
    assert.ok(src.includes('查商品'), '缺少查商品功能');
  });

  it('应包含商品添加逻辑 (handleAddProduct)', () => {
    const src = readSource();
    assert.ok(src.includes('handleAddProduct'), '缺少 handleAddProduct');
  });

  it('应包含购物篮操作 (handleRemoveItem, handleClearBasket)', () => {
    const src = readSource();
    assert.ok(src.includes('handleRemoveItem'), '缺少 handleRemoveItem');
    assert.ok(src.includes('handleClearBasket'), '缺少 handleClearBasket');
  });
});

// ---- 边界 ----

describe('FrontDeskWorkbench — 边界', () => {
  it('空购物篮结账应显示错误', () => {
    const src = readSource();
    // handleCheckout 中 basket.length === 0 分支
    assert.ok(src.includes('购物篮为空，无法结账'), '缺少空购物篮错误提示');
  });

  it('确认清空购物篮应有 confirm 提示', () => {
    const src = readSource();
    assert.ok(src.includes('确认清空购物篮'), '缺少清空确认提示');
  });

  it('商品搜索弹出层支持显示/隐藏', () => {
    const src = readSource();
    assert.ok(src.includes('showProductSearch'), '缺少 showProductSearch 状态');
  });

  it('应包含库存不足的视觉区分', () => {
    const src = readSource();
    assert.ok(src.includes('stock > 30'), '缺少库存阈值判断');
  });

  it('排队叫号功能应有完成操作', () => {
    const src = readSource();
    assert.ok(src.includes('handleCompleteServing'), '缺少 handleCompleteServing');
  });

  it('队列数据应有初始 3 条', () => {
    const src = readSource();
    assert.ok(src.includes('queueIdCounter = 3'), '缺少 queueIdCounter 初始值');
  });

  it('应处理支付方式切换回调', () => {
    const src = readSource();
    assert.ok(src.includes('onPaymentChange'), '缺少 onPaymentChange 传递');
  });

  it('交班/日结按钮应存在', () => {
    const src = readSource();
    assert.ok(src.includes('交班'), '缺少交班按钮');
    assert.ok(src.includes('日结'), '缺少日结按钮');
  });
});

// ---- 防御 ----

describe('FrontDeskWorkbench — 防御', () => {
  it('调用 @m5/ui 的类型导入应完整', () => {
    const src = readSource();
    const typeImports = [
      'FrontDeskPanelProps',
      'BasketItem',
      'CheckoutStatus',
      'QueueItem',
      'QuickFnButton',
      'PaymentMethod',
    ];
    for (const t of typeImports) {
      assert.ok(src.includes(t), `缺少类型导入: ${t}`);
    }
  });

  it('所有状态变量应正确初始化', () => {
    const src = readSource();
    assert.ok(src.includes('useState<BasketItem[]>'), 'BasketItem 状态类型错误');
    assert.ok(src.includes("useState<CheckoutStatus>('idle')"), 'checkoutStatus 初始值错误');
  });

  it('不应包含危险的内联 style 注入', () => {
    const src = readSource();
    // 不应使用 dangerouslySetInnerHTML
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
  });

  it('所有统计卡片应正确定义', () => {
    const src = readSource();
    assert.ok(src.includes("variant: 'info'"), '缺少 info 变体');
    assert.ok(src.includes("variant: 'success'"), '缺少 success 变体');
    assert.ok(src.includes("variant: 'warning'"), '缺少 warning 变体');
    assert.ok(src.includes("variant: 'neutral'"), '缺少 neutral 变体');
  });
});
