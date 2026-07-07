/**
 * OrderDetailScreen.test.tsx - Phase-21 T53
 * 订单详情页单元测试
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { OrderDetailScreen, type OrderDetail } from './OrderDetailScreen';

const SAMPLE_ORDER: OrderDetail = {
  id: 'ord-002',
  orderNo: 'ORD202607080002',
  status: 'confirmed',
  totalAmount: 188.00,
  paidAmount: 188.00,
  createdAt: '2026-07-08 14:00:00',
  updatedAt: '2026-07-08 14:05:00',
  customerName: '赵六',
  customerPhone: '137****6543',
  items: [
    { name: '美式咖啡', quantity: 3, price: 28.00 },
    { name: '蓝莓马芬', quantity: 2, price: 22.00 },
  ],
  remark: '正常冰',
};

describe('OrderDetailScreen', () => {
  it('renders order number', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const orderNoEl = root.findByProps({ children: 'ORD202607080002' });
    expect(orderNoEl).toBeDefined();
  });

  it('renders customer name', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const nameEl = root.findByProps({ children: '赵六' });
    expect(nameEl).toBeDefined();
  });

  it('renders customer phone', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const phoneEl = root.findByProps({ children: '137****6543' });
    expect(phoneEl).toBeDefined();
  });

  it('renders status badge', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const statusEl = root.findByProps({ children: '已确认' });
    expect(statusEl).toBeDefined();
  });

  it('renders order items with names', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const item1 = root.findByProps({ children: '美式咖啡' });
    const item2 = root.findByProps({ children: '蓝莓马芬' });
    expect(item1).toBeDefined();
    expect(item2).toBeDefined();
  });

  it('renders remark when present', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const remarkEl = root.findByProps({ children: '正常冰' });
    expect(remarkEl).toBeDefined();
  });

  it('does not render shipping address when empty', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const allText = root.findAllByType('Text');
    const textContents = allText.map((t) => {
      const c = t.props.children;
      return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : '';
    });
    expect(textContents.some((t) => t.includes('配送地址'))).toBe(false);
  });

  it('renders total amount', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const allText = root.findAllByType('Text');
    const textContents = allText.map((t) => {
      const c = t.props.children;
      return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : '';
    });
    expect(textContents.some((t) => t.includes('¥188.00'))).toBe(true);
  });

  it('renders create time and update time sections', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const createTimeEl = root.findByProps({ children: '2026-07-08 14:00:00' });
    const updateTimeEl = root.findByProps({ children: '2026-07-08 14:05:00' });
    expect(createTimeEl).toBeDefined();
    expect(updateTimeEl).toBeDefined();
  });

  it('shows status transition actions for manager (confirmed → process/cancel)', () => {
    const root = create(
      <OrderDetailScreen order={SAMPLE_ORDER} userRole="manager" />,
    ).root;
    const processBtn = root.findByProps({ accessibilityLabel: '开始处理' });
    const cancelBtn = root.findByProps({ accessibilityLabel: '取消订单' });
    expect(processBtn).toBeDefined();
    expect(cancelBtn).toBeDefined();
  });

  it('hides transition actions for clerk role', () => {
    const root = create(
      <OrderDetailScreen order={SAMPLE_ORDER} userRole="clerk" />,
    ).root;
    const confirmBtns = root.findAllByProps({ accessibilityLabel: '确认订单' });
    expect(confirmBtns.length).toBe(0);
  });

  it('calls onShip when process button pressed (confirmed status)', () => {
    const onShip = vi.fn();
    const root = create(
      <OrderDetailScreen
        order={SAMPLE_ORDER}
        userRole="manager"
        onShip={onShip}
      />,
    ).root;
    const processBtn = root.findByProps({ accessibilityLabel: '开始处理' });
    act(() => processBtn.props.onPress());
    expect(onShip).toHaveBeenCalledWith(SAMPLE_ORDER);
  });

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = vi.fn();
    const root = create(
      <OrderDetailScreen
        order={SAMPLE_ORDER}
        userRole="manager"
        onCancel={onCancel}
      />,
    ).root;
    const cancelBtn = root.findByProps({ accessibilityLabel: '取消订单' });
    act(() => cancelBtn.props.onPress());
    expect(onCancel).toHaveBeenCalledWith(SAMPLE_ORDER);
  });

  it('shows ship and deliver actions for processing/shipped status', () => {
    const processingOrder: OrderDetail = { ...SAMPLE_ORDER, status: 'processing' };
    const root = create(
      <OrderDetailScreen order={processingOrder} userRole="manager" />,
    ).root;
    const shipBtn = root.findByProps({ accessibilityLabel: '标记发货' });
    expect(shipBtn).toBeDefined();
  });

  it('shows deliver action for shipped status', () => {
    const shippedOrder: OrderDetail = { ...SAMPLE_ORDER, status: 'shipped' };
    const root = create(
      <OrderDetailScreen order={shippedOrder} userRole="manager" />,
    ).root;
    const deliverBtn = root.findByProps({ accessibilityLabel: '确认送达' });
    expect(deliverBtn).toBeDefined();
  });

  it('shows refund action for delivered status', () => {
    const deliveredOrder: OrderDetail = { ...SAMPLE_ORDER, status: 'delivered' };
    const root = create(
      <OrderDetailScreen order={deliveredOrder} userRole="manager" />,
    ).root;
    const refundBtn = root.findByProps({ accessibilityLabel: '申请退款' });
    expect(refundBtn).toBeDefined();
  });

  it('shows no transition actions for cancelled status', () => {
    const cancelledOrder: OrderDetail = { ...SAMPLE_ORDER, status: 'cancelled' };
    const root = create(
      <OrderDetailScreen order={cancelledOrder} userRole="manager" />,
    ).root;
    const actionButtons = root.findAllByType('TouchableOpacity');
    const actionLabels = actionButtons.map((b) => b.props.accessibilityLabel).filter(Boolean);
    // Only edit/delete should be visible (admin transitions only, no status transitions)
    expect(actionLabels.some((l) => l === '确认订单')).toBe(false);
    expect(actionLabels.some((l) => l === '取消订单')).toBe(false);
  });

  it('shows edit and delete buttons for admin role', () => {
    const root = create(
      <OrderDetailScreen order={SAMPLE_ORDER} userRole="admin" />,
    ).root;
    const editBtn = root.findByProps({ accessibilityLabel: '编辑订单' });
    const deleteBtn = root.findByProps({ accessibilityLabel: '删除订单' });
    expect(editBtn).toBeDefined();
    expect(deleteBtn).toBeDefined();
  });

  it('hides edit button for clerk role', () => {
    const root = create(
      <OrderDetailScreen order={SAMPLE_ORDER} userRole="clerk" />,
    ).root;
    const editBtns = root.findAllByProps({ accessibilityLabel: '编辑订单' });
    expect(editBtns.length).toBe(0);
  });

  it('calls onEdit when edit button pressed', () => {
    const onEdit = vi.fn();
    const root = create(
      <OrderDetailScreen
        order={SAMPLE_ORDER}
        userRole="admin"
        onEdit={onEdit}
      />,
    ).root;
    const editBtn = root.findByProps({ accessibilityLabel: '编辑订单' });
    act(() => editBtn.props.onPress());
    expect(onEdit).toHaveBeenCalledWith(SAMPLE_ORDER);
  });

  it('calls onDelete when delete button pressed', () => {
    const onDelete = vi.fn();
    const root = create(
      <OrderDetailScreen
        order={SAMPLE_ORDER}
        userRole="admin"
        onDelete={onDelete}
      />,
    ).root;
    const deleteBtn = root.findByProps({ accessibilityLabel: '删除订单' });
    act(() => deleteBtn.props.onPress());
    expect(onDelete).toHaveBeenCalledWith(SAMPLE_ORDER);
  });

  it('calls onShip when ship button pressed (processing status)', () => {
    const onShip = vi.fn();
    const processingOrder: OrderDetail = { ...SAMPLE_ORDER, status: 'processing' };
    const root = create(
      <OrderDetailScreen order={processingOrder} userRole="manager" onShip={onShip} />,
    ).root;
    const shipBtn = root.findByProps({ accessibilityLabel: '标记发货' });
    act(() => shipBtn.props.onPress());
    expect(onShip).toHaveBeenCalledWith(processingOrder);
  });

  it('renders default order when no order prop', () => {
    const root = create(<OrderDetailScreen />).root;
    const orderNoEl = root.findByProps({ children: 'ORD202607080001' });
    expect(orderNoEl).toBeDefined();
    const nameEl = root.findByProps({ children: '王五' });
    expect(nameEl).toBeDefined();
  });

  it('renders quantity and price per item', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const allText = root.findAllByType('Text');
    const textContents = allText.map((t) => {
      const c = t.props.children;
      return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : '';
    });
    // 美式咖啡 ×3 = ¥84.00, 蓝莓马芬 ×2 = ¥44.00
    expect(textContents.some((t) => t.includes('×3'))).toBe(true);
    expect(textContents.some((t) => t.includes('×2'))).toBe(true);
  });

  it('renders paid amount in green', () => {
    const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
    const allText = root.findAllByType('Text');
    const textContents = allText.map((t) => {
      const c = t.props.children;
      return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : '';
    });
    expect(textContents.some((t) => t.includes('¥188.00'))).toBe(true);
  });
});