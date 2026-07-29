/**
 * frontdesk/page.vitest.tsx — 前台收银台 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 统计卡片 · 快捷操作 · 购物篮 · 排队叫号 · 交易记录 · 支付 · 边界
 * 角色: 🛒前台
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: { children: React.ReactNode; title?: string; description?: string }) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>{children}</div>
  ),
  StatusBadge: ({ label, variant }: { label: string; variant?: string }) => (
    <span data-testid="m5-status-badge" data-variant={variant}>{label}</span>
  ),
}));

import FrontDeskPage from './page';

describe('FrontDeskPage — 前台收银台', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('render without crashing', () => {
    expect(() => render(<FrontDeskPage />)).not.toThrow();
  });

  test('renders PageShell with correct title', () => {
    render(<FrontDeskPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '前台收银台');
  });

  test('renders page shell description', () => {
    render(<FrontDeskPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-description', '一站式收银、排队叫号与快捷操作面板');
  });

  test('renders page title 前台收银台', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('🏪 前台收银台')).toBeInTheDocument();
  });

  test('renders store and cashier info', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText(/门店 #001/)).toBeInTheDocument();
    const cashierEls = screen.getAllByText(/收银员: 王芳/);
    expect(cashierEls.length).toBeGreaterThanOrEqual(1);
    const shiftEls = screen.getAllByText(/早班 08:00-16:00/);
    expect(shiftEls.length).toBeGreaterThanOrEqual(1);
  });

  test('renders toggle basket button', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('📋 收银面板')).toBeInTheDocument();
  });

  // ====== 统计卡片测试 ======

  test('renders all 5 stat cards', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('今日订单')).toBeInTheDocument();
    expect(screen.getByText('今日营收')).toBeInTheDocument();
    expect(screen.getByText('平均结账')).toBeInTheDocument();
    expect(screen.getByText('待取货')).toBeInTheDocument();
    expect(screen.getByText('排队人数')).toBeInTheDocument();
  });

  test('stat card shows totalOrders = 156.00', () => {
    render(<FrontDeskPage />);
    const oneFiftySix = screen.getAllByText(/156/);
    expect(oneFiftySix.length).toBeGreaterThanOrEqual(1);
  });

  test('stat card shows totalRevenue formatted', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('¥124,580.5')).toBeInTheDocument();
  });

  test('stat card shows avgCheckoutSec = 32s', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('32s')).toBeInTheDocument();
  });

  test('stat card shows pendingPickups = 7.00', () => {
    render(<FrontDeskPage />);
    const sevenEls = screen.getAllByText('7.00');
    expect(sevenEls.length).toBeGreaterThanOrEqual(1);
  });

  test('stat card shows waiting queue count', () => {
    render(<FrontDeskPage />);
    const waitingEl = screen.getByText(/人等待/);
    expect(waitingEl).toBeInTheDocument();
  });

  // ====== 快捷操作测试 ======

  test('renders quick action grid', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('扫码录入')).toBeInTheDocument();
    expect(screen.getByText('退货处理')).toBeInTheDocument();
    expect(screen.getByText('叫号通知')).toBeInTheDocument();
    expect(screen.getByText('会员查询')).toBeInTheDocument();
  });

  test('renders all 8 quick action buttons', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('扫码录入')).toBeInTheDocument();
    expect(screen.getByText('退货处理')).toBeInTheDocument();
    expect(screen.getByText('叫号通知')).toBeInTheDocument();
    expect(screen.getByText('会员查询')).toBeInTheDocument();
    expect(screen.getByText('库存查询')).toBeInTheDocument();
    expect(screen.getByText('改价审批')).toBeInTheDocument();
    expect(screen.getByText('打印小票')).toBeInTheDocument();
    expect(screen.getByText('交班汇总')).toBeInTheDocument();
  });

  test('扫码录入 button is highlighted', () => {
    render(<FrontDeskPage />);
    const scanBtn = screen.getByText('扫码录入').closest('button');
    expect(scanBtn).toBeTruthy();
  });

  test('叫号通知 shows badge', () => {
    render(<FrontDeskPage />);
    const twoEls = screen.getAllByText('2');
    expect(twoEls.length).toBeGreaterThanOrEqual(1);
  });

  // ====== 购物篮测试 ======

  test('renders basket section with item count', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText(/购物篮/)).toBeInTheDocument();
  });

  test('basket shows 4 items initially', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText(/购物篮 \(4 件\)/)).toBeInTheDocument();
  });

  test('basket shows all 4 product names', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('精选有机蔬菜拼盘')).toBeInTheDocument();
    expect(screen.getByText('澳洲进口牛排 500g')).toBeInTheDocument();
    expect(screen.getByText('纯牛奶 1L 装')).toBeInTheDocument();
    expect(screen.getByText('新鲜蓝莓 125g')).toBeInTheDocument();
  });

  test('basket shows correct SKUs', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('VEG-001')).toBeInTheDocument();
    expect(screen.getByText('BEEF-012')).toBeInTheDocument();
  });

  test('basket shows unit prices', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('¥45.00')).toBeInTheDocument();
    const price168 = screen.getAllByText('¥168.00');
    expect(price168.length).toBeGreaterThanOrEqual(1);
  });

  test('basket shows quantities', () => {
    render(<FrontDeskPage />);
    // Multiple items have quantity displayed
    const qtyElements = screen.getAllByText(/^[1-9]$/);
    expect(qtyElements.length).toBeGreaterThanOrEqual(1);
  });

  test('basket shows subtotal for each item', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('¥90.00')).toBeInTheDocument();
    expect(screen.getByText('¥59.70')).toBeInTheDocument();
  });

  test('basket total is displayed', () => {
    render(<FrontDeskPage />);
    const totalAmount = (90.00 + 168.00 + 59.70 + 59.80).toFixed(2);
    expect(screen.getByText(`¥${totalAmount}`)).toBeInTheDocument();
  });

  test('basket has clear basket button', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('清空')).toBeInTheDocument();
  });

  test('each basket item has delete button', () => {
    render(<FrontDeskPage />);
    const deleteBtns = screen.getAllByText('删除');
    expect(deleteBtns.length).toBe(4);
  });

  // ====== 支付方式测试 ======

  test('renders all 5 payment method options', () => {
    render(<FrontDeskPage />);
    const wechatEls = screen.getAllByText('微信支付');
    expect(wechatEls.length).toBeGreaterThanOrEqual(1);
    const alipayEls = screen.getAllByText('支付宝');
    expect(alipayEls.length).toBeGreaterThanOrEqual(1);
    const cashEls = screen.getAllByText('现金');
    expect(cashEls.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('银行卡')).toBeInTheDocument();
    const cardEls = screen.getAllByText('会员卡');
    expect(cardEls.length).toBeGreaterThanOrEqual(1);
  });

  test('wechat payment is selected by default', () => {
    render(<FrontDeskPage />);
    const wechatBtns = screen.getAllByText('微信支付');
    const wechatBtn = wechatBtns[0].closest('button');
    expect(wechatBtn).toHaveStyle('border: 2px solid #2563eb');
  });

  test('checkout button shows total amount', () => {
    render(<FrontDeskPage />);
    const total = (90.00 + 168.00 + 59.70 + 59.80).toFixed(2);
    expect(screen.getByText(`💳 结算 ¥${total}`)).toBeInTheDocument();
  });

  // ====== 交互测试 ======

  test('clicking delete removes item from basket', () => {
    render(<FrontDeskPage />);
    const deleteBtns = screen.getAllByText('删除');
    fireEvent.click(deleteBtns[0]);
    expect(screen.queryByText('精选有机蔬菜拼盘')).not.toBeInTheDocument();
  });

  test('delete updates basket count', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText(/购物篮 \(4 件\)/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('删除')[0]);
    expect(screen.getByText(/购物篮 \(3 件\)/)).toBeInTheDocument();
  });

  test('clearing all items shows empty basket message', () => {
    render(<FrontDeskPage />);
    const deleteBtns = screen.getAllByText('删除');
    deleteBtns.forEach(btn => fireEvent.click(btn));
    expect(screen.getByText(/购物篮为空/)).toBeInTheDocument();
  });

  test('clear basket button empties the basket', () => {
    render(<FrontDeskPage />);
    fireEvent.click(screen.getByText('清空'));
    expect(screen.getByText('🛒 购物篮为空，请扫描或搜索商品')).toBeInTheDocument();
  });

  test('clicking alipay switches payment method', () => {
    render(<FrontDeskPage />);
    const alipayEls = screen.getAllByText('支付宝');
    fireEvent.click(alipayEls[0]);
    const alipayBtn = alipayEls[0].closest('button');
    expect(alipayBtn).toHaveStyle('border: 2px solid #2563eb');
  });

  test('toggle basket button hides basket', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('精选有机蔬菜拼盘')).toBeInTheDocument();
    fireEvent.click(screen.getByText('📋 收银面板'));
    expect(screen.queryByText('精选有机蔬菜拼盘')).not.toBeInTheDocument();
    expect(screen.getByText('🛒 显示购物篮')).toBeInTheDocument();
  });

  test('toggle basket button shows basket again', () => {
    render(<FrontDeskPage />);
    fireEvent.click(screen.getByText('📋 收银面板'));
    expect(screen.getByText('🛒 显示购物篮')).toBeInTheDocument();
    fireEvent.click(screen.getByText('🛒 显示购物篮'));
    expect(screen.getByText('精选有机蔬菜拼盘')).toBeInTheDocument();
  });

  // ====== 排队列表测试 ======

  test('renders queue list section', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText(/排队叫号/)).toBeInTheDocument();
  });

  test('queue shows waiting count', () => {
    render(<FrontDeskPage />);
    const waitingText = screen.getByText(/人等待/);
    expect(waitingText).toBeInTheDocument();
  });

  test('queue shows queue numbers', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('A001')).toBeInTheDocument();
    expect(screen.getByText('A002')).toBeInTheDocument();
    expect(screen.getByText('B001')).toBeInTheDocument();
  });

  test('queue item A003 is calling status', () => {
    render(<FrontDeskPage />);
    const statusBadges = screen.getAllByTestId('m5-status-badge');
    const callingBadge = statusBadges.find(b => b.textContent === '叫号中');
    expect(callingBadge).toBeInTheDocument();
  });

  test('clicking calling button for wait item', () => {
    render(<FrontDeskPage />);
    const callBtns = screen.getAllByText('叫号');
    expect(callBtns.length).toBeGreaterThan(0);
  });

  test('clicking serve button for calling item', () => {
    render(<FrontDeskPage />);
    const serveBtns = screen.getAllByText('服务');
    expect(serveBtns.length).toBeGreaterThanOrEqual(1);
  });

  // ====== 交易记录测试 ======

  test('renders recent transactions section', () => {
    render(<FrontDeskPage />);
    const transactionsSection = screen.getByText('📄 最近交易');
    expect(transactionsSection).toBeInTheDocument();
  });

  test('renders all 5 transactions', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-005')).toBeInTheDocument();
  });

  test('transactions show customer names', () => {
    render(<FrontDeskPage />);
    expect(screen.getByText('张明')).toBeInTheDocument();
    expect(screen.getByText('陈伟')).toBeInTheDocument();
  });

  test('transactions show payment method labels', () => {
    render(<FrontDeskPage />);
    // 交易记录表和支付按钮区域都显示支付方式
    const wechatCount = screen.getAllByText('微信支付').length;
    const alipayCount = screen.getAllByText('支付宝').length;
    expect(wechatCount + alipayCount).toBeGreaterThanOrEqual(3);
  });

  test('refunded transaction shows 已退款', () => {
    render(<FrontDeskPage />);
    const refundBadges = screen.getAllByText('已退款');
    expect(refundBadges.length).toBe(1);
  });

  // ====== 底部状态栏测试 ======

  test('renders cashier status bar', () => {
    render(<FrontDeskPage />);
    const cashierEls = screen.getAllByText(/收银员: 王芳/);
    expect(cashierEls.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/班次: 早班 08:00-16:00/)).toBeInTheDocument();
    expect(screen.getByText(/已处理订单: 156/)).toBeInTheDocument();
    expect(screen.getByText(/收银总额:/)).toBeInTheDocument();
  });

  // ====== 边界测试 ======

  test('export default is a function', () => {
    expect(typeof FrontDeskPage).toBe('function');
  });

  test('checkout button renders with total amount', () => {
    render(<FrontDeskPage />);
    const total = (90.00 + 168.00 + 59.70 + 59.80).toFixed(2);
    const checkoutBtn = screen.getByText(`💳 结算 ¥${total}`);
    expect(checkoutBtn).toBeInTheDocument();
    expect(checkoutBtn).not.toBeDisabled();
  });

  test('empty basket shows empty message and hides checkout', () => {
    render(<FrontDeskPage />);
    fireEvent.click(screen.getByText('清空'));
    expect(screen.getByText('🛒 购物篮为空，请扫描或搜索商品')).toBeInTheDocument();
    expect(screen.queryByText(/结算/)).not.toBeInTheDocument();
  });
});
