import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ShiftHandoverPanel } = require('./ShiftHandoverPanel');
import type { ShiftSummary, ShiftHandoverEntry, ShiftHandoverPanelProps } from './ShiftHandoverPanel';

const mockSummary: ShiftSummary = {
  totalItems: 5,
  pendingCount: 2,
  resolvedCount: 2,
  escalatedCount: 1,
  cashTotal: 15800.5,
  orderTotal: 47,
  shiftStart: '08:00',
  shiftEnd: '16:00',
  currentStaff: '张三',
  incomingStaff: '李四',
};

const mockItems: ShiftHandoverEntry[] = [
  {
    id: '1',
    category: 'cash',
    title: '现金盘点差异',
    description: '保险柜现金与系统差异 +50 元',
    status: 'pending',
    createdBy: '张三',
    createdAt: '2026-06-27 15:30',
    handoverTo: '李四',
  },
  {
    id: '2',
    category: 'order',
    title: '退货订单处理',
    description: '订单 #20260627001 退货待审核',
    status: 'pending',
    createdBy: '张三',
    createdAt: '2026-06-27 14:20',
  },
  {
    id: '3',
    category: 'device',
    title: '打印机卡纸',
    description: '前台小票打印机已恢复',
    status: 'resolved',
    createdBy: '张三',
    createdAt: '2026-06-27 10:00',
    handoverTo: '李四',
    resolvedAt: '2026-06-27 11:30',
    notes: '重启后恢复正常',
  },
  {
    id: '4',
    category: 'inventory',
    title: '库存预警',
    description: '矿泉水库存不足 (剩余3箱)',
    status: 'escalated',
    createdBy: '张三',
    createdAt: '2026-06-27 09:00',
    handoverTo: '经理',
    notes: '已通知采购部',
  },
  {
    id: '5',
    category: 'member',
    title: '会员投诉跟进',
    description: 'VIP 会员张先生投诉服务态度',
    status: 'resolved',
    createdBy: '张三',
    createdAt: '2026-06-26 18:00',
    handoverTo: '李四',
    resolvedAt: '2026-06-27 08:30',
    notes: '已致歉并赠送积分',
  },
];

const baseProps: ShiftHandoverPanelProps = {
  summary: mockSummary,
  items: mockItems,
  onResolveItem: () => {},
  onEscalateItem: () => {},
  onStartHandover: () => {},
  onEditNotes: () => {},
};

function renderHTML(props: Partial<ShiftHandoverPanelProps> = {}): string {
  return renderToStaticMarkup(
    React.createElement(ShiftHandoverPanel, { ...baseProps, ...props }),
  );
}

describe('ShiftHandoverPanel', () => {
  test('renders shift summary with start and end time', () => {
    const html = renderHTML();
    assert.ok(html.includes('08:00 - 16:00'));
  });

  test('renders current staff and incoming staff names', () => {
    const html = renderHTML();
    assert.ok(html.includes('张三'));
    assert.ok(html.includes('李四'));
  });

  test('renders cash total in formatted currency', () => {
    const html = renderHTML();
    assert.ok(html.includes('¥15,800.5') || html.includes('¥15,801'));
  });

  test('renders order total count', () => {
    const html = renderHTML();
    assert.ok(html.includes('47'));
  });

  test('shows pending items section title when there are pending items', () => {
    const html = renderHTML();
    assert.ok(html.includes('待处理事项'));
  });

  test('renders handover table title', () => {
    const html = renderHTML();
    assert.ok(html.includes('交接事项清单'));
  });

  test('renders item category badges', () => {
    const html = renderHTML();
    assert.ok(html.includes('现金'));
    assert.ok(html.includes('订单'));
    assert.ok(html.includes('设备'));
    assert.ok(html.includes('库存'));
    assert.ok(html.includes('会员'));
  });

  test('renders status labels in table', () => {
    const html = renderHTML();
    assert.ok(html.includes('待处理'));
    assert.ok(html.includes('已完成'));
    assert.ok(html.includes('已升级'));
  });

  test('renders table with all item titles', () => {
    const html = renderHTML();
    assert.ok(html.includes('现金盘点差异'));
    assert.ok(html.includes('退货订单处理'));
    assert.ok(html.includes('打印机卡纸'));
    assert.ok(html.includes('库存预警'));
    assert.ok(html.includes('会员投诉跟进'));
  });

  test('shows pending count text when disallowing handover', () => {
    const html = renderHTML();
    assert.ok(html.includes('尚有'));
    assert.ok(html.includes('项待处理，无法交接'));
  });

  test('enables handover button when no pending items', () => {
    const resolvedItems: ShiftHandoverEntry[] = mockItems.map((item) => ({
      ...item,
      status: 'resolved' as const,
    }));
    const html = renderHTML({ items: resolvedItems, summary: { ...mockSummary, pendingCount: 0 } });
    assert.ok(html.includes('开始交接班'));
    // Should not contain the disabled pending message
    assert.ok(!html.includes('项待处理，无法交接'));
  });

  test('renders resolved item title in table', () => {
    const html = renderHTML();
    assert.ok(html.includes('打印机卡纸'));
  });

  test('renders escalated item title in table', () => {
    const html = renderHTML();
    assert.ok(html.includes('库存预警'));
  });

  test('loading state renders loading text', () => {
    const html = renderHTML({ loading: true });
    assert.ok(html.includes('加载中...'));
  });

  test('renders empty state gracefully with no items', () => {
    const html = renderHTML({ items: [], summary: { ...mockSummary, pendingCount: 0, totalItems: 0 } });
    assert.ok(html.includes('交接事项清单'));
    assert.ok(html.includes('开始交接班'));
  });

  test('renders category badges for all handover items', () => {
    const html = renderHTML();
    // All unique categories present: cash, order, device, inventory, member
    assert.ok(html.includes('现金'));
    assert.ok(html.includes('订单'));
    assert.ok(html.includes('设备'));
    assert.ok(html.includes('库存'));
    assert.ok(html.includes('会员'));
  });

  test('renders summary stat cards', () => {
    const html = renderHTML();
    // Summary card title
    assert.ok(html.includes('交班摘要'));
  });
});
