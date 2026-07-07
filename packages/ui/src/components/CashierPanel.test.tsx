/**
 * CashierPanel 组件测试
 *
 * 覆盖: 基础渲染、统计数据、终端状态、班次详情、流水记录、空状态、加载/错误状态
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { CashierPanel } = require('./CashierPanel');

// ==================== 测试数据 ====================

const MOCK_SHIFT = {
  type: 'morning' as const,
  startAt: '08:00',
  endAt: '14:00',
  duration: 6,
};

const MOCK_METRICS = {
  transactionCount: 87,
  totalRevenue: 28650,
  cashAmount: 12300,
  mobileAmount: 16350,
  expectedCashRemit: 12000,
  changeFloatUsed: 300,
  refundCount: 2,
  refundTotal: 598,
};

const MOCK_TILL = {
  tillNo: 'POS-01',
  version: 'v3.2.1',
  printerOnline: true,
  cashDrawerOpen: false,
  scannerOnline: true,
  networkOnline: true,
};

const MOCK_TRANSACTIONS = [
  { id: 't1', receiptNo: 'R20260628-001', time: '08:12', type: 'sale' as const, amount: 299, payment: 'wechat', memberName: '王磊' },
  { id: 't2', receiptNo: 'R20260628-002', time: '08:35', type: 'sale' as const, amount: 1580, payment: 'alipay' },
  { id: 't3', receiptNo: 'R20260628-003', time: '08:47', type: 'refund' as const, amount: -299, payment: 'wechat', memberName: '王磊' },
  { id: 't4', receiptNo: 'R20260628-010', time: '10:03', type: 'void' as const, amount: 0, payment: '-' },
  { id: 't5', receiptNo: 'R20260628-015', time: '10:28', type: 'sale' as const, amount: 4500, payment: 'cash', memberName: '刘芳' },
];

// ==================== 测试套件 ====================

describe('CashierPanel', () => {
  // ── 加载状态 ──
  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, { loading: true })
    );
    assert.match(html, /data-testid="cashier-loading"/);
    assert.match(html, /正在加载收银员工作台/);
  });

  // ── 错误状态 ──
  test('renders error state', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, { error: '无法连接收银系统' })
    );
    assert.match(html, /data-testid="cashier-error"/);
    assert.match(html, /无法连接收银系统/);
    assert.match(html, /data-testid="cashier-retry"/);
  });

  // ── 完整数据渲染 ──
  test('renders panel with full data', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, {
        title: '收银员工作台',
        cashierName: '张丽',
        cashierStatus: 'active',
        shiftInfo: MOCK_SHIFT,
        metrics: MOCK_METRICS,
        transactions: MOCK_TRANSACTIONS,
        tillStatus: MOCK_TILL,
      })
    );
    // 标题与名称
    assert.match(html, /收银员工作台/);
    assert.match(html, /张丽/);
    // 状态徽章
    assert.match(html, /在班/);
    // 班次信息
    assert.match(html, /早班/);
    assert.match(html, /08:00/);
    assert.match(html, /14:00/);
    assert.match(html, /6 小时/);
    // 统计指标
    assert.match(html, /87 单/);
    assert.match(html, /28650/);
    assert.match(html, /12000/);
    assert.match(html, /2 单/);
    // 终端状态
    assert.match(html, /POS-01/);
    assert.match(html, /打印机/);
    assert.match(html, /扫码枪/);
    assert.match(html, /网络/);
    assert.match(html, /钱箱/);
    // 班次详情
    assert.match(html, /现金收款/);
    assert.match(html, /12300/);
    assert.match(html, /16350/);
    assert.match(html, /300/);
    assert.match(html, /598/);
    // 流水记录
    assert.match(html, /R20260628-001/);
    assert.match(html, /R20260628-002/);
    assert.match(html, /R20260628-003/);
    assert.match(html, /R20260628-015/);
    assert.match(html, /王磊/);
    assert.match(html, /刘芳/);
    assert.match(html, /收款/);
    assert.match(html, /退款/);
    assert.match(html, /作废/);
    assert.match(html, /5 笔/);
  });

  // ── 空数据渲染 ──
  test('renders empty state when no transactions', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, {
        cashierName: '李四',
        metrics: MOCK_METRICS,
        transactions: [],
      })
    );
    assert.match(html, /李四/);
    assert.match(html, /暂无流水记录/);
  });

  // ── 无班次信息 ──
  test('hides shift detail section when no shiftInfo/metrics', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, {
        cashierName: '测试',
      })
    );
    assert.doesNotMatch(html, /班次详情/);
    assert.doesNotMatch(html, /现金收款/);
  });

  // ── 默认标题 ──
  test('uses default title when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, {})
    );
    assert.match(html, /收银员工作台/);
  });

  // ── 收银员状态 ──
  test('renders different cashier status badges', () => {
    const active = renderToStaticMarkup(
      React.createElement(CashierPanel, { cashierStatus: 'active' })
    );
    assert.match(active, /在班/);

    const breakPanel = renderToStaticMarkup(
      React.createElement(CashierPanel, { cashierStatus: 'break' })
    );
    assert.match(breakPanel, /休息中/);

    const offline = renderToStaticMarkup(
      React.createElement(CashierPanel, { cashierStatus: 'offline' })
    );
    assert.match(offline, /离线/);
  });

  // ── 操作按钮 ──
  test('renders action buttons when callbacks provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, {
        cashierName: '测试',
        onClockIn: () => {},
        onShiftHandover: () => {},
      })
    );
    assert.match(html, /data-testid="cashier-clockin"/);
    assert.match(html, /data-testid="cashier-handover"/);
    assert.match(html, /上班打卡/);
    assert.match(html, /交班结算/);
  });

  // ── 无操作按钮 ──
  test('hides action buttons when callbacks not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, { cashierName: '测试' })
    );
    assert.doesNotMatch(html, /上班打卡/);
    assert.doesNotMatch(html, /交班结算/);
  });

  // ── 终端异常显示 ──
  test('renders offline device status correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, {
        tillStatus: {
          tillNo: 'POS-02',
          version: 'v3.2.1',
          printerOnline: false,
          cashDrawerOpen: true,
          scannerOnline: false,
          networkOnline: true,
        },
      })
    );
    assert.match(html, /打印机/);
    assert.match(html, /钱箱/);
    // 异常状态显示
    assert.match(html, /异常/);
  });

  // ── 退款按钮 ──
  test('renders refund button per transaction when onRefund provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, {
        transactions: MOCK_TRANSACTIONS,
        onRefund: () => {},
      })
    );
    // 退款图标 ↩ (对 sale 类型显示)
    assert.match(html, /↩/);
  });

  // ── 打印按钮 ──
  test('renders print button per transaction when onPrint provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CashierPanel, {
        transactions: [MOCK_TRANSACTIONS[0]],
        onPrint: () => {},
      })
    );
    assert.match(html, /🖨/);
  });
});
