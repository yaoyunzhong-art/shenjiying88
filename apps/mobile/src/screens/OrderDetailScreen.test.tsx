/**
 * OrderDetailScreen.test.tsx - Phase-21 T53
 * 订单详情页测试 (node:test + react-test-renderer)
 * 三态覆盖: 正常渲染 / 边界状态 / 角色权限 / 交互回调
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { OrderDetailScreen, type OrderDetail, type OrderStatus } from './OrderDetailScreen';

/* ------------------------------------------------------------------ */
/*  Test fixtures                                                      */
/* ------------------------------------------------------------------ */

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
  shippingAddress: '北京市朝阳区xxx大厦',
  remark: '正常冰',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectTexts(root: ReturnType<typeof create>['root']): string[] {
  const allText = root.findAllByType('Text');
  return allText.map((t) => {
    const c = t.props.children;
    return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : String(c ?? '');
  });
}

function textContains(root: ReturnType<typeof create>['root'], substr: string): boolean {
  return collectTexts(root).some((t) => t.includes(substr));
}

function findByProps(root: ReturnType<typeof create>['root'], prop: string, value: unknown) {
  return root.findByProps({ [prop]: value });
}

/* ================================================================== */
/*  正例: 正常渲染 + 核心数据                                          */
/* ================================================================== */

test('OrderDetailScreen: renders order number', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(findByProps(root, 'children', 'ORD202607080002'));
});

test('OrderDetailScreen: renders customer name', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(findByProps(root, 'children', '赵六'));
});

test('OrderDetailScreen: renders customer phone', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(findByProps(root, 'children', '137****6543'));
});

test('OrderDetailScreen: renders status badge text', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  const statusEl = findByProps(root, 'children', '已确认');
  assert.ok(statusEl);
});

test('OrderDetailScreen: renders order item names', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(findByProps(root, 'children', '美式咖啡'));
  assert.ok(findByProps(root, 'children', '蓝莓马芬'));
});

test('OrderDetailScreen: renders remark when present', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(findByProps(root, 'children', '正常冰'));
});

test('OrderDetailScreen: renders shipping address when present', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  const texts = collectTexts(root);
  assert.ok(texts.some((t) => t.includes('北京市朝阳区')));
});

test('OrderDetailScreen: renders total amount formatted', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(textContains(root, '¥188.00'));
});

test('OrderDetailScreen: renders create time', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(findByProps(root, 'children', '2026-07-08 14:00:00'));
});

test('OrderDetailScreen: renders update time', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(findByProps(root, 'children', '2026-07-08 14:05:00'));
});

test('OrderDetailScreen: renders quantity per item', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(textContains(root, '×3'));
  assert.ok(textContains(root, '×2'));
});

test('OrderDetailScreen: renders item subtotal prices', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  // 美式咖啡 ×3 = ¥84.00, 蓝莓马芬 ×2 = ¥44.00
  assert.ok(textContains(root, '¥84.00'));
  assert.ok(textContains(root, '¥44.00'));
});

test('OrderDetailScreen: renders paid amount', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} />).root;
  assert.ok(textContains(root, '¥188.00'));
});

test('OrderDetailScreen: renders default order when no order prop', () => {
  const root = create(<OrderDetailScreen />).root;
  assert.ok(findByProps(root, 'children', 'ORD202607080001'));
  assert.ok(findByProps(root, 'children', '王五'));
  // Default order has status 'confirmed', so should show '已确认'
  assert.ok(textContains(root, '已确认'));
});

/* ================================================================== */
/*  交互: 状态流转按钮                                                  */
/* ================================================================== */

test('OrderDetailScreen: shows process and cancel for manager (confirmed)', () => {
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="manager" />,
  ).root;
  const processBtn = findByProps(root, 'accessibilityLabel', '开始处理');
  assert.ok(processBtn);
  const cancelBtn = findByProps(root, 'accessibilityLabel', '取消订单');
  assert.ok(cancelBtn);
});

test('OrderDetailScreen: hides transition actions for clerk role', () => {
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="clerk" />,
  ).root;
  const confirmBtns = root.findAllByProps({ accessibilityLabel: '确认订单' });
  assert.equal(confirmBtns.length, 0);
});

test('OrderDetailScreen: calls onShip when process button pressed (confirmed)', () => {
  const calls: OrderDetail[] = [];
  const onShip = (o: OrderDetail) => { calls.push(o); };
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="manager" onShip={onShip} />,
  ).root;
  const processBtn = findByProps(root, 'accessibilityLabel', '开始处理');
  act(() => processBtn.props.onPress());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, SAMPLE_ORDER.id);
});

test('OrderDetailScreen: calls onCancel when cancel button pressed', () => {
  const calls: OrderDetail[] = [];
  const onCancel = (o: OrderDetail) => { calls.push(o); };
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="manager" onCancel={onCancel} />,
  ).root;
  const cancelBtn = findByProps(root, 'accessibilityLabel', '取消订单');
  act(() => cancelBtn.props.onPress());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, SAMPLE_ORDER.id);
});

test('OrderDetailScreen: shows ship button for processing status', () => {
  const processing: OrderDetail = { ...SAMPLE_ORDER, status: 'processing' };
  const root = create(
    <OrderDetailScreen order={processing} userRole="manager" />,
  ).root;
  assert.ok(findByProps(root, 'accessibilityLabel', '标记发货'));
});

test('OrderDetailScreen: calls onShip when ship button pressed (processing)', () => {
  const calls: OrderDetail[] = [];
  const onShip = (o: OrderDetail) => { calls.push(o); };
  const processing: OrderDetail = { ...SAMPLE_ORDER, status: 'processing' };
  const root = create(
    <OrderDetailScreen order={processing} userRole="manager" onShip={onShip} />,
  ).root;
  const shipBtn = findByProps(root, 'accessibilityLabel', '标记发货');
  act(() => shipBtn.props.onPress());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, SAMPLE_ORDER.id);
});

test('OrderDetailScreen: shows deliver button for shipped status', () => {
  const shipped: OrderDetail = { ...SAMPLE_ORDER, status: 'shipped' };
  const root = create(
    <OrderDetailScreen order={shipped} userRole="manager" />,
  ).root;
  assert.ok(findByProps(root, 'accessibilityLabel', '确认送达'));
});

test('OrderDetailScreen: shows refund button for delivered status', () => {
  const delivered: OrderDetail = { ...SAMPLE_ORDER, status: 'delivered' };
  const root = create(
    <OrderDetailScreen order={delivered} userRole="manager" />,
  ).root;
  assert.ok(findByProps(root, 'accessibilityLabel', '申请退款'));
});

test('OrderDetailScreen: shows no status transitions for cancelled status', () => {
  const cancelled: OrderDetail = { ...SAMPLE_ORDER, status: 'cancelled' };
  const root = create(
    <OrderDetailScreen order={cancelled} userRole="manager" />,
  ).root;
  // No status action buttons for cancelled
  const actionBtns = root.findAllByProps({ accessibilityLabel: '确认订单' });
  const cancelBtns = root.findAllByProps({ accessibilityLabel: '取消订单' });
  const shipBtns = root.findAllByProps({ accessibilityLabel: '标记发货' });
  const deliverBtns = root.findAllByProps({ accessibilityLabel: '确认送达' });
  const refundBtns = root.findAllByProps({ accessibilityLabel: '申请退款' });
  assert.equal(actionBtns.length + cancelBtns.length + shipBtns.length + deliverBtns.length + refundBtns.length, 0);
});

test('OrderDetailScreen: shows no status transitions for refunded status', () => {
  const refunded: OrderDetail = { ...SAMPLE_ORDER, status: 'refunded' };
  const root = create(
    <OrderDetailScreen order={refunded} userRole="manager" />,
  ).root;
  const actionBtns = root.findAllByProps({ accessibilityLabel: '确认订单' });
  assert.equal(actionBtns.length, 0);
});

/* ================================================================== */
/*  管理权限: admin 特有按钮                                             */
/* ================================================================== */

test('OrderDetailScreen: shows edit and delete for admin role', () => {
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="admin" />,
  ).root;
  assert.ok(findByProps(root, 'accessibilityLabel', '编辑订单'));
  assert.ok(findByProps(root, 'accessibilityLabel', '删除订单'));
});

test('OrderDetailScreen: hides edit button for clerk role', () => {
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="clerk" />,
  ).root;
  const editBtns = root.findAllByProps({ accessibilityLabel: '编辑订单' });
  assert.equal(editBtns.length, 0);
});

test('OrderDetailScreen: hides edit button for manager role', () => {
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="manager" />,
  ).root;
  const editBtns = root.findAllByProps({ accessibilityLabel: '编辑订单' });
  assert.equal(editBtns.length, 0);
});

test('OrderDetailScreen: calls onEdit when edit button pressed', () => {
  const calls: OrderDetail[] = [];
  const onEdit = (o: OrderDetail) => { calls.push(o); };
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="admin" onEdit={onEdit} />,
  ).root;
  const editBtn = findByProps(root, 'accessibilityLabel', '编辑订单');
  act(() => editBtn.props.onPress());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, SAMPLE_ORDER.id);
});

test('OrderDetailScreen: calls onDelete when delete button pressed', () => {
  const calls: OrderDetail[] = [];
  const onDelete = (o: OrderDetail) => { calls.push(o); };
  const root = create(
    <OrderDetailScreen order={SAMPLE_ORDER} userRole="admin" onDelete={onDelete} />,
  ).root;
  const deleteBtn = findByProps(root, 'accessibilityLabel', '删除订单');
  act(() => deleteBtn.props.onPress());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, SAMPLE_ORDER.id);
});

/* ================================================================== */
/*  边界: 不同状态 + 全状态流转覆盖                                      */
/* ================================================================== */

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

for (const status of ALL_STATUSES) {
  test(`OrderDetailScreen: renders status badge for ${status}`, () => {
    const order: OrderDetail = { ...SAMPLE_ORDER, status };
    const root = create(
      <OrderDetailScreen order={order} userRole="manager" />,
    ).root;
    // Status badge should always exist for any valid status
    const statusLabels: Record<string, string> = {
      pending: '待确认', confirmed: '已确认', processing: '处理中',
      shipped: '已发货', delivered: '已送达', cancelled: '已取消', refunded: '已退款',
    };
    assert.ok(textContains(root, statusLabels[status]));
  });
}

test('OrderDetailScreen: does not render shipping address when empty', () => {
  const order: OrderDetail = {
    ...SAMPLE_ORDER,
    shippingAddress: undefined,
  };
  const root = create(<OrderDetailScreen order={order} />).root;
  assert.ok(!textContains(root, '配送地址'));
});

test('OrderDetailScreen: does not render remark when absent', () => {
  const order: OrderDetail = {
    ...SAMPLE_ORDER,
    remark: undefined,
  };
  const root = create(<OrderDetailScreen order={order} />).root;
  assert.ok(!textContains(root, '备注'));
});

test('OrderDetailScreen: renders section titles', () => {
  const root = create(<OrderDetailScreen order={SAMPLE_ORDER} userRole="admin" />).root;
  assert.ok(textContains(root, '客户信息'));
  assert.ok(textContains(root, '商品明细'));
  assert.ok(textContains(root, '时间信息'));
  assert.ok(textContains(root, '操作'));
  assert.ok(textContains(root, '管理'));
});

test('OrderDetailScreen: handles pending status with confirm and cancel buttons', () => {
  const pending: OrderDetail = { ...SAMPLE_ORDER, status: 'pending' };
  const root = create(
    <OrderDetailScreen order={pending} userRole="manager" />,
  ).root;
  assert.ok(findByProps(root, 'accessibilityLabel', '确认订单'));
  assert.ok(findByProps(root, 'accessibilityLabel', '取消订单'));
});

test('OrderDetailScreen: calls onConfirm when confirm button pressed', () => {
  const calls: OrderDetail[] = [];
  const onConfirm = (o: OrderDetail) => { calls.push(o); };
  const pending: OrderDetail = { ...SAMPLE_ORDER, status: 'pending' };
  const root = create(
    <OrderDetailScreen order={pending} userRole="manager" onConfirm={onConfirm} />,
  ).root;
  const confirmBtn = findByProps(root, 'accessibilityLabel', '确认订单');
  act(() => confirmBtn.props.onPress());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, pending.id);
});

test('OrderDetailScreen: calls onDeliver when deliver button pressed', () => {
  const calls: OrderDetail[] = [];
  const onDeliver = (o: OrderDetail) => { calls.push(o); };
  const shipped: OrderDetail = { ...SAMPLE_ORDER, status: 'shipped' };
  const root = create(
    <OrderDetailScreen order={shipped} userRole="manager" onDeliver={onDeliver} />,
  ).root;
  const deliverBtn = findByProps(root, 'accessibilityLabel', '确认送达');
  act(() => deliverBtn.props.onPress());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, shipped.id);
});

test('OrderDetailScreen: calls onRefund when refund button pressed', () => {
  const calls: OrderDetail[] = [];
  const onRefund = (o: OrderDetail) => { calls.push(o); };
  const delivered: OrderDetail = { ...SAMPLE_ORDER, status: 'delivered' };
  const root = create(
    <OrderDetailScreen order={delivered} userRole="manager" onRefund={onRefund} />,
  ).root;
  const refundBtn = findByProps(root, 'accessibilityLabel', '申请退款');
  act(() => refundBtn.props.onPress());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, delivered.id);
});
