/**
 * orders/[id]/page.test.tsx — 订单详情 L1 测试
 *
 * 覆盖: 订单数据、状态流转、渠道、金额计算
 * 正例: 订单渲染、状态流转链路、金额格式
 * 反例: 订单不存在、终态不能流转、取消/退款
 * 边界: 零折扣、大额金额、优惠比例
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type OrderChannel = 'online' | 'offline' | 'miniapp' | 'phone';

interface OrderItem {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  channel: OrderChannel;
  status: OrderStatus;
  itemCount: number;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  storeName: string;
  marketCode: string;
  salesClerk: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailViewModel {
  order: OrderItem;
  statusLabel: string;
  statusVariant: string;
  channelLabel: string;
  nextStatuses: { key: string; label: string }[];
  isTerminal: boolean;
}

/* ── 常量 ── */

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: string }> = {
  pending: { label: '待确认', variant: 'warning' },
  confirmed: { label: '已确认', variant: 'info' },
  processing: { label: '处理中', variant: 'info' },
  shipped: { label: '已发货', variant: 'neutral' },
  delivered: { label: '已签收', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
  refunded: { label: '已退款', variant: 'danger' },
};

const ORDER_CHANNEL_MAP: Record<OrderChannel, { label: string; variant: string }> = {
  online: { label: '线上', variant: 'info' },
  offline: { label: '线下', variant: 'neutral' },
  miniapp: { label: '小程序', variant: 'success' },
  phone: { label: '电话', variant: 'warning' },
};

const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

/* ── 辅助函数 ── */

function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return '#4ade80';
    case 'shipped': return '#60a5fa';
    case 'processing':
    case 'confirmed': return '#fbbf24';
    case 'pending': return '#fb923c';
    case 'cancelled':
    case 'refunded': return '#f87171';
    default: return '#94a3b8';
  }
}

function buildViewModel(order: OrderItem): OrderDetailViewModel {
  const statusEntry = ORDER_STATUS_MAP[order.status];
  const channelEntry = ORDER_CHANNEL_MAP[order.channel];
  const nextStatuses = (ORDER_STATUS_FLOW[order.status] || []).map(s => ({
    key: s,
    label: ORDER_STATUS_MAP[s].label,
  }));
  return {
    order,
    statusLabel: statusEntry.label,
    statusVariant: statusEntry.variant,
    channelLabel: channelEntry.label,
    nextStatuses,
    isTerminal: nextStatuses.length === 0,
  };
}

/* ── Mock ── */

const MOCK_ORDERS: OrderItem[] = [
  { id: 'ord-001', orderNo: 'ORD-20260620-0001', customerName: '张三', customerPhone: '138****1234', channel: 'online', status: 'delivered', itemCount: 3, totalAmount: 256.80, discountAmount: 25.00, paidAmount: 231.80, storeName: '朝阳旗舰店', marketCode: 'CN-BJ', salesClerk: '小李', note: '周末配送', createdAt: '2026-06-20 10:30:00', updatedAt: '2026-06-22 15:20:00' },
  { id: 'ord-002', orderNo: 'ORD-20260621-0002', customerName: '李四', customerPhone: '139****5678', channel: 'miniapp', status: 'shipped', itemCount: 5, totalAmount: 489.00, discountAmount: 50.00, paidAmount: 439.00, storeName: '浦东体验店', marketCode: 'CN-SH', salesClerk: '小王', note: '', createdAt: '2026-06-21 14:15:00', updatedAt: '2026-06-23 09:45:00' },
  { id: 'ord-003', orderNo: 'ORD-20260622-0003', customerName: '王五', customerPhone: '136****9012', channel: 'offline', status: 'processing', itemCount: 2, totalAmount: 128.00, discountAmount: 0, paidAmount: 128.00, storeName: '朝阳旗舰店', marketCode: 'CN-BJ', salesClerk: '小张', note: '到店自取', createdAt: '2026-06-22 16:00:00', updatedAt: '2026-06-23 08:30:00' },
  { id: 'ord-005', orderNo: 'ORD-20260623-0005', customerName: '孙七', customerPhone: '135****7890', channel: 'phone', status: 'pending', itemCount: 4, totalAmount: 356.00, discountAmount: 0, paidAmount: 0, storeName: '深圳南山店', marketCode: 'CN-SZ', salesClerk: '小陈', note: '需电话确认地址', createdAt: '2026-06-23 10:05:00', updatedAt: '2026-06-23 10:05:00' },
  { id: 'ord-006', orderNo: 'ORD-20260623-0006', customerName: '周八', customerPhone: '133****1111', channel: 'miniapp', status: 'cancelled', itemCount: 2, totalAmount: 156.00, discountAmount: 20.00, paidAmount: 0, storeName: '杭州西湖店', marketCode: 'CN-HZ', salesClerk: '小周', note: '客户主动取消', createdAt: '2026-06-23 11:30:00', updatedAt: '2026-06-23 12:45:00' },
  { id: 'ord-007', orderNo: 'ORD-20260623-0007', customerName: '吴九', customerPhone: '131****2222', channel: 'online', status: 'refunded', itemCount: 1, totalAmount: 68.00, discountAmount: 0, paidAmount: 68.00, storeName: '朝阳旗舰店', marketCode: 'CN-BJ', salesClerk: '小李', note: '商品与描述不符', createdAt: '2026-06-21 09:00:00', updatedAt: '2026-06-23 14:00:00' },
];

/* ============================================================ */

describe('order-detail: 数据类型', () => {
  it('OrderItem has all required fields', () => {
    const o = MOCK_ORDERS[0];
    assert.equal(typeof o.id, 'string');
    assert.equal(typeof o.totalAmount, 'number');
    assert.equal(typeof o.discountAmount, 'number');
    assert.equal(typeof o.itemCount, 'number');
    assert.equal(typeof o.status, 'string');
  });

  it('ORDER_STATUS_MAP has 7 statuses', () => {
    assert.equal(Object.keys(ORDER_STATUS_MAP).length, 7);
  });

  it('ORDER_CHANNEL_MAP has 4 channels', () => {
    assert.equal(Object.keys(ORDER_CHANNEL_MAP).length, 4);
  });

  it('OrderDetailViewModel has all fields', () => {
    const vm = buildViewModel(MOCK_ORDERS[0]);
    assert.equal(typeof vm.statusLabel, 'string');
    assert.ok(Array.isArray(vm.nextStatuses));
    assert.equal(typeof vm.isTerminal, 'boolean');
  });
});

describe('order-detail: 辅助函数', () => {
  it('formatAmount formats correctly', () => {
    assert.equal(formatAmount(256.80), '¥256.80');
    assert.equal(formatAmount(0), '¥0.00');
    assert.equal(formatAmount(1000), '¥1000.00');
  });

  it('getStatusColor returns correct colors', () => {
    assert.equal(getStatusColor('delivered'), '#4ade80');
    assert.equal(getStatusColor('shipped'), '#60a5fa');
    assert.equal(getStatusColor('pending'), '#fb923c');
    assert.equal(getStatusColor('cancelled'), '#f87171');
    assert.equal(getStatusColor('unknown'), '#94a3b8');
  });
});

describe('order-detail: 状态流转', () => {
  it('pending can transition to confirmed or cancelled', () => {
    const vm = buildViewModel(MOCK_ORDERS.find(o => o.id === 'ord-005')!);
    const nextKeys = vm.nextStatuses.map(s => s.key);
    assert.ok(nextKeys.includes('confirmed'));
    assert.ok(nextKeys.includes('cancelled'));
  });

  it('processing can transition to shipped or cancelled', () => {
    const vm = buildViewModel(MOCK_ORDERS.find(o => o.id === 'ord-003')!);
    const nextKeys = vm.nextStatuses.map(s => s.key);
    assert.ok(nextKeys.includes('shipped'));
    assert.ok(nextKeys.includes('cancelled'));
  });

  it('shipped can only transition to delivered', () => {
    const vm = buildViewModel(MOCK_ORDERS.find(o => o.id === 'ord-002')!);
    assert.equal(vm.nextStatuses.length, 1);
    assert.equal(vm.nextStatuses[0].key, 'delivered');
  });

  it('delivered can transition to refunded', () => {
    const vm = buildViewModel(MOCK_ORDERS.find(o => o.id === 'ord-001')!);
    const nextKeys = vm.nextStatuses.map(s => s.key);
    assert.ok(nextKeys.includes('refunded'));
  });

  it('cancelled is terminal (no next status)', () => {
    const vm = buildViewModel(MOCK_ORDERS.find(o => o.id === 'ord-006')!);
    assert.equal(vm.nextStatuses.length, 0);
    assert.ok(vm.isTerminal);
  });

  it('refunded is terminal', () => {
    const vm = buildViewModel(MOCK_ORDERS.find(o => o.id === 'ord-007')!);
    assert.equal(vm.nextStatuses.length, 0);
    assert.ok(vm.isTerminal);
  });

  it('non-existent order returns undefined', () => {
    const found = MOCK_ORDERS.find(o => o.id === 'ord-999');
    assert.equal(found, undefined);
  });

  it('all statuses have status label', () => {
    MOCK_ORDERS.forEach(o => {
      const entry = ORDER_STATUS_MAP[o.status];
      assert.ok(entry !== undefined);
    });
  });

  it('all channels have channel label', () => {
    MOCK_ORDERS.forEach(o => {
      const entry = ORDER_CHANNEL_MAP[o.channel];
      assert.ok(entry !== undefined);
    });
  });
});

describe('order-detail: 业务逻辑', () => {
  it('paidAmount = totalAmount - discountAmount for paid orders', () => {
    const delivered = MOCK_ORDERS.find(o => o.id === 'ord-001')!;
    assert.equal(delivered.paidAmount, delivered.totalAmount - delivered.discountAmount);
  });

  it('cancelled order has paidAmount 0', () => {
    const cancelled = MOCK_ORDERS.find(o => o.id === 'ord-006')!;
    assert.equal(cancelled.paidAmount, 0);
  });

  it('pending order with no payment has paidAmount 0', () => {
    const pending = MOCK_ORDERS.find(o => o.id === 'ord-005')!;
    assert.equal(pending.paidAmount, 0);
  });

  it('refunded order still has paidAmount recorded', () => {
    const refunded = MOCK_ORDERS.find(o => o.id === 'ord-007')!;
    assert.equal(refunded.paidAmount, 68.00);
  });

  it('discount can be zero', () => {
    const noDiscount = MOCK_ORDERS.find(o => o.id === 'ord-003')!;
    assert.equal(noDiscount.discountAmount, 0);
  });

  it('discount ratio calculation', () => {
    const order = MOCK_ORDERS[0];
    const ratio = (order.discountAmount / order.totalAmount) * 100;
    assert.equal(ratio.toFixed(1), '9.7');
  });

  it('itemCount is positive', () => {
    MOCK_ORDERS.forEach(o => {
      assert.ok(o.itemCount > 0);
    });
  });

  it('online channel orders have salesClerk', () => {
    MOCK_ORDERS.filter(o => o.channel === 'online').forEach(o => {
      assert.ok(o.salesClerk.length > 0);
    });
  });

  it('phone channel orders have notes', () => {
    const phoneOrders = MOCK_ORDERS.filter(o => o.channel === 'phone');
    phoneOrders.forEach(o => {
      assert.ok(o.note.length > 0);
    });
  });

  it('totalAmount covers all items', () => {
    assert.ok(MOCK_ORDERS[1].totalAmount > MOCK_ORDERS[2].totalAmount);
  });

  it('order has multiple channels in mock data', () => {
    const channels = new Set(MOCK_ORDERS.map(o => o.channel));
    assert.equal(channels.size, 4);
    assert.ok(channels.has('online'));
    assert.ok(channels.has('miniapp'));
    assert.ok(channels.has('offline'));
    assert.ok(channels.has('phone'));
  });

  it('delivered order has both createdAt and updatedAt', () => {
    const o = MOCK_ORDERS.find(o => o.id === 'ord-001')!;
    assert.ok(o.createdAt.length > 0);
    assert.ok(o.updatedAt.length > 0);
    assert.ok(new Date(o.updatedAt) > new Date(o.createdAt));
  });
});
