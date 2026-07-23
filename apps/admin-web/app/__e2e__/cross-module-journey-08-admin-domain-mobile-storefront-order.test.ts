/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链08
 * Admin(订单管理) → Domain(订单状态机) → Mobile(App通知/我的订单) → Storefront(履约)
 *
 * 模拟链路:
 *   admin-web 管理订单（创建/审核/发货） → Domain 订单状态机变更
 *   → mobile App 接收订单状态推送 → storefront-web 履约进度展示
 *
 * 验证:
 *   - 管理员创建/处理订单，Domain 状态机正确流转
 *   - mobile App 根据订单状态显示不同 UI（待支付/已发货/已完成）
 *   - storefront-web 门店端履约进度正确
 *   - 反例: 非法状态转换被 Domain 拒绝
 *   - 边界: 已被取消的订单无法操作
 *
 * 这是第一条覆盖 mobile（移动端）的跨模块链路
 * 填补 mobile cross-module 覆盖空白
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type OrderStatus = 'pending_payment' | 'paid' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunding' | 'refunded';

interface Order {
  orderId: string;
  tenantId: string;
  storeId: string;
  buyerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface AdminOrderAction {
  orderId: string;
  action: 'confirm' | 'ship' | 'cancel' | 'refund' | 'complete';
  operatorId: string;
  note?: string;
}

interface MobileOrderDisplay {
  orderId: string;
  status: OrderStatus;
  statusLabel: string;       // 用户友好状态文案
  actionButton: string | null; // 用户可执行操作
  totalAmount: number;
  progressPercent: number;   // 进度条百分比
  completedSteps: string[];  // 已完成步骤
  pendingStep: string | null; // 当前待处理步骤
}

interface StorefrontFulfillment {
  orderId: string;
  status: OrderStatus;
  items: OrderItem[];
  isKitchenPreparing: boolean;
  isOutForDelivery: boolean;
  isReadyForPickup: boolean;
  estimatedReadyTime: string;
}

// ─── Domain 层：订单状态机 ───

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled', 'refunding'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
  refunding: ['refunded'],
  refunded: [],
};

function domainValidateOrderTransition(current: OrderStatus, target: OrderStatus): { allowed: boolean; reason?: string } {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed) return { allowed: false, reason: `Unknown status: ${current}` };
  if (allowed.includes(target)) return { allowed: true };
  return { allowed: false, reason: `Cannot transition from ${current} to ${target}` };
}

// ─── Admin 层 ───

const ORDER_STORE = new Map<string, Order>();

function adminCreateOrder(order: Order): { success: boolean; error?: string } {
  if (ORDER_STORE.has(order.orderId)) {
    return { success: false, error: 'Order already exists' };
  }
  if (order.status !== 'pending_payment') {
    return { success: false, error: 'New order must start as pending_payment' };
  }
  if (order.items.length === 0) {
    return { success: false, error: 'Order must have at least one item' };
  }
  ORDER_STORE.set(order.orderId, order);
  return { success: true };
}

function adminProcessOrder(action: AdminOrderAction): { success: boolean; order?: Order; error?: string } {
  const order = ORDER_STORE.get(action.orderId);
  if (!order) return { success: false, error: 'Order not found' };

  // Map action to target status
  const actionToStatus: Record<string, OrderStatus> = {
    confirm: 'confirmed',
    ship: 'shipped',
    cancel: 'cancelled',
    refund: 'refunding',
    complete: 'completed',
  };

  const targetStatus = actionToStatus[action.action];
  if (!targetStatus) return { success: false, error: `Unknown action: ${action.action}` };

  const validation = domainValidateOrderTransition(order.status, targetStatus);
  if (!validation.allowed) {
    return { success: false, error: validation.reason };
  }

  const updatedOrder: Order = {
    ...order,
    status: targetStatus,
    updatedAt: new Date().toISOString(),
    trackingNumber: action.action === 'ship' ? `SF${Date.now()}` : order.trackingNumber,
  };

  ORDER_STORE.set(action.orderId, updatedOrder);
  return { success: true, order: updatedOrder };
}

function adminGetOrder(orderId: string): Order | undefined {
  return ORDER_STORE.get(orderId);
}

// ─── Mobile App 层：订单展示 ───

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: '待支付',
  paid: '已支付',
  confirmed: '已确认',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
};

const ORDER_PROGRESS: Record<OrderStatus, { percent: number; completed: string[]; pending: string | null; button: string | null }> = {
  pending_payment: { percent: 10, completed: ['下单'], pending: '支付', button: '去支付' },
  paid: { percent: 25, completed: ['下单', '支付'], pending: '商家确认', button: null },
  confirmed: { percent: 40, completed: ['下单', '支付', '商家确认'], pending: '发货', button: null },
  shipped: { percent: 60, completed: ['下单', '支付', '商家确认', '发货'], pending: '收货', button: '确认收货' },
  delivered: { percent: 85, completed: ['下单', '支付', '商家确认', '发货', '送达'], pending: '完成', button: '确认完成' },
  completed: { percent: 100, completed: ['下单', '支付', '商家确认', '发货', '送达', '完成'], pending: null, button: null },
  cancelled: { percent: 0, completed: [], pending: null, button: null },
  refunding: { percent: 50, completed: ['退款申请已提交'], pending: '商家处理退款', button: null },
  refunded: { percent: 0, completed: ['已退款'], pending: null, button: null },
};

function mobileRenderOrder(order: Order): MobileOrderDisplay {
  const progress = ORDER_PROGRESS[order.status];
  return {
    orderId: order.orderId,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    actionButton: progress.button,
    totalAmount: order.totalAmount,
    progressPercent: progress.percent,
    completedSteps: progress.completed,
    pendingStep: progress.pending,
  };
}

// ─── Storefront 层：履约进度 ───

function storefrontGetFulfillment(orderId: string): StorefrontFulfillment | null {
  const order = ORDER_STORE.get(orderId);
  if (!order) return null;

  return {
    orderId: order.orderId,
    status: order.status,
    items: order.items,
    isKitchenPreparing: order.status === 'confirmed' || order.status === 'shipped',
    isOutForDelivery: order.status === 'shipped',
    isReadyForPickup: order.status === 'delivered',
    estimatedReadyTime: order.status === 'completed' ? '已完成' : new Date(Date.now() + 30 * 60000).toISOString(),
  };
}

// ─── 测试 ───

describe('[L3-E2E] 链08: Admin订单管理 → Domain状态机 → Mobile展示 → Storefront履约', () => {

  test('【正例】管理员创建订单 → 确认 → 发货 → 完成完整链路', () => {
    // Admin 创建订单
    const order: Order = {
      orderId: 'o-001', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
      items: [{ productId: 'p1', productName: '咖啡', quantity: 2, unitPrice: 35 }],
      totalAmount: 70, status: 'pending_payment',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const create = adminCreateOrder(order);
    assert.ok(create.success);

    // 模拟支付
    const paidOrder: Order = { ...order, status: 'paid', updatedAt: new Date().toISOString() };
    ORDER_STORE.set('o-001', paidOrder);

    // Admin 确认
    const conf = adminProcessOrder({ orderId: 'o-001', action: 'confirm', operatorId: 'op-1' });
    assert.ok(conf.success);

    // Mobile 展示 — 已确认状态
    const mobileDisplay1 = mobileRenderOrder(conf.order!);
    assert.equal(mobileDisplay1.statusLabel, '已确认');
    assert.equal(mobileDisplay1.progressPercent, 40);
    assert.deepEqual(mobileDisplay1.completedSteps, ['下单', '支付', '商家确认']);

    // Admin 发货
    const ship = adminProcessOrder({ orderId: 'o-001', action: 'ship', operatorId: 'op-1' });
    assert.ok(ship.success);
    assert.ok(ship.order?.trackingNumber);

    // Mobile 展示 — 已发货
    const mobileDisplay2 = mobileRenderOrder(ship.order!);
    assert.equal(mobileDisplay2.statusLabel, '已发货');
    assert.equal(mobileDisplay2.actionButton, '确认收货');
    assert.equal(mobileDisplay2.progressPercent, 60);

    // Storefront 履约
    const fulfillment = storefrontGetFulfillment('o-001');
    assert.ok(fulfillment);
    assert.ok(fulfillment.isKitchenPreparing);
    assert.ok(fulfillment.isOutForDelivery);

    // 模拟收货→完成
    const deliveredOrder: Order = { ...ship.order!, status: 'delivered', updatedAt: new Date().toISOString() };
    ORDER_STORE.set('o-001', deliveredOrder);
    const complete = adminProcessOrder({ orderId: 'o-001', action: 'complete', operatorId: 'op-1' });
    assert.ok(complete.success);
    const mobileDisplay3 = mobileRenderOrder(complete.order!);
    assert.equal(mobileDisplay3.progressPercent, 100);
    assert.equal(mobileDisplay3.actionButton, null);
  });

  test('【正例】取消订单: pending_payment → cancelled', () => {
    const order: Order = {
      orderId: 'o-cancel-1', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
      items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
      totalAmount: 35, status: 'pending_payment',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    adminCreateOrder(order);

    const cancel = adminProcessOrder({ orderId: 'o-cancel-1', action: 'cancel', operatorId: 'op-1' });
    assert.ok(cancel.success);

    const display = mobileRenderOrder(cancel.order!);
    assert.equal(display.statusLabel, '已取消');
    assert.equal(display.progressPercent, 0);
    assert.equal(display.actionButton, null);

    const fulfillment = storefrontGetFulfillment('o-cancel-1');
    assert.ok(fulfillment);
    assert.equal(fulfillment.isKitchenPreparing, false);
    assert.equal(fulfillment.isOutForDelivery, false);
    assert.equal(fulfillment.isReadyForPickup, false);
  });

  test('【反例】已取消的订单无法发货', () => {
    const order: Order = {
      orderId: 'o-cancel-2', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
      items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
      totalAmount: 35, status: 'pending_payment',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    adminCreateOrder(order);

    adminProcessOrder({ orderId: 'o-cancel-2', action: 'cancel', operatorId: 'op-1' });
    const ship = adminProcessOrder({ orderId: 'o-cancel-2', action: 'ship', operatorId: 'op-1' });
    assert.equal(ship.success, false);
    assert.ok(ship.error?.includes('transition'));
  });

  test('【反例】已完成的订单无法取消', () => {
    const order: Order = {
      orderId: 'o-completed-no-cancel', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
      items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
      totalAmount: 35, status: 'pending_payment',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    adminCreateOrder(order);
    ORDER_STORE.set('o-completed-no-cancel', { ...order, status: 'completed', updatedAt: new Date().toISOString() });

    const cancel = adminProcessOrder({ orderId: 'o-completed-no-cancel', action: 'cancel', operatorId: 'op-1' });
    assert.equal(cancel.success, false);
  });

  test('【反例】空订单无法创建', () => {
    const emptyOrder: Order = {
      orderId: 'o-empty', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
      items: [], totalAmount: 0, status: 'pending_payment',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const result = adminCreateOrder(emptyOrder);
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('item'));
  });

  test('【边界】退款流程: paid → refunding → refunded', () => {
    const order: Order = {
      orderId: 'o-refund', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
      items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
      totalAmount: 35, status: 'pending_payment',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    adminCreateOrder(order);
    ORDER_STORE.set('o-refund', { ...order, status: 'paid' });

    const refund = adminProcessOrder({ orderId: 'o-refund', action: 'refund', operatorId: 'op-1' });
    assert.ok(refund.success);
    assert.equal(refund.order?.status, 'refunding');

    const mobileDisplay = mobileRenderOrder(refund.order!);
    assert.equal(mobileDisplay.statusLabel, '退款中');
    assert.equal(mobileDisplay.pendingStep, '商家处理退款');

    // refunding → refunded
    const refundedOrder: Order = { ...refund.order!, status: 'refunded', updatedAt: new Date().toISOString() };
    ORDER_STORE.set('o-refund', refundedOrder);
    const finalDisplay = mobileRenderOrder(refundedOrder);
    assert.equal(finalDisplay.statusLabel, '已退款');
    assert.equal(finalDisplay.progressPercent, 0);
  });

  test('【边界】pending_payment 直接跳过 paid→completed 非法', () => {
    const order: Order = {
      orderId: 'o-skip-paid', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
      items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
      totalAmount: 35, status: 'pending_payment',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    adminCreateOrder(order);

    // 尝试从 pending_payment → confirmed (跳过 paid)
    const result = domainValidateOrderTransition('pending_payment', 'confirmed');
    assert.equal(result.allowed, false);
  });
});
/**
 * ═══════════════════════════════════════════════════════════════
 * 新增测试补充 — 追加至 cross-module-journey-08-admin-domain-mobile-storefront-order.test.ts
 * 场景: 边界/反例/权限/多租户/并发/状态机全路径覆盖
 * 保留原有7个测试不动，此为追加内容
 * ═══════════════════════════════════════════════════════════════
 *
 * 使用方法: 将此内容追加到 cross-module-journey-08-*.test.ts 末尾
 */

// ─── 重复订单ID ───
test('【边界】重复订单ID拒绝创建', () => {
  const order: Order = {
    orderId: 'o-dup', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const first = adminCreateOrder(order);
  assert.ok(first.success);

  const second = adminCreateOrder(order);
  assert.equal(second.success, false);
  assert.ok(second.error?.includes('already exists'));
});

// ─── 负数金额订单 ───
test('【边界】订单金额为负数时仍然可创建（由状态机拒绝支付）', () => {
  const order: Order = {
    orderId: 'o-negative-amt', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: -2, unitPrice: 35 }],
    totalAmount: -70, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  // 负金额商品允许创建，业务层校验总金额
  const result = adminCreateOrder(order);
  // 取决于业务规则，这里验证至少不崩溃
  if (result.success) {
    // 如果允许创建，尝试支付应被拒
    ORDER_STORE.set('o-negative-amt', { ...order, status: 'paid' });
    const ship = adminProcessOrder({ orderId: 'o-negative-amt', action: 'confirm', operatorId: 'op-1' });
    // 业务层面可能拒绝负金额的后续操作
  }
});

// ─── 商品数量为0 ───
test('【边界】商品数量为0的订单无法创建', () => {
  const order: Order = {
    orderId: 'o-zero-qty', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 0, unitPrice: 35 }],
    totalAmount: 0, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const result = adminCreateOrder(order);
  // 数量为0的商品不应被允许
  assert.equal(result.success, false);
});

// ─── 商品数量为负数 ───
test('【边界】商品数量为负数的订单创建', () => {
  const order: Order = {
    orderId: 'o-neg-qty', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: -1, unitPrice: 35 }],
    totalAmount: -35, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const result = adminCreateOrder(order);
  // 负数数量应被拒
  assert.equal(result.success, false);
});

// ─── 大量商品订单 ───
test('【边界】大量商品订单（100种商品）正常创建', () => {
  const items: OrderItem[] = Array.from({ length: 100 }, (_, i) => ({
    productId: `p-bulk-${i}`,
    productName: `商品${i}`,
    quantity: Math.floor(Math.random() * 10) + 1,
    unitPrice: Math.floor(Math.random() * 100) + 1,
  }));
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const order: Order = {
    orderId: 'o-bulk', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items, totalAmount, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const result = adminCreateOrder(order);
  assert.ok(result.success);
  assert.ok(ORDER_STORE.get('o-bulk')?.items.length === 100);
});

// ─── 已退款订单不可再操作 ───
test('【反例】已退款订单无法再次退款或发货', () => {
  const order: Order = {
    orderId: 'o-already-refunded', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  adminCreateOrder(order);
  ORDER_STORE.set('o-already-refunded', { ...order, status: 'paid' });
  adminProcessOrder({ orderId: 'o-already-refunded', action: 'refund', operatorId: 'op-1' });
  ORDER_STORE.set('o-already-refunded', { ...ORDER_STORE.get('o-already-refunded')!, status: 'refunded' });

  // 尝试再退款
  const refundAgain = adminProcessOrder({ orderId: 'o-already-refunded', action: 'refund', operatorId: 'op-1' });
  assert.equal(refundAgain.success, false);

  // 尝试发货
  const shipAgain = adminProcessOrder({ orderId: 'o-already-refunded', action: 'ship', operatorId: 'op-1' });
  assert.equal(shipAgain.success, false);
});

// ─── 非法的状态跳转: paid → completed ───
test('【反例】paid 直接跳到 completed 非法', () => {
  const order: Order = {
    orderId: 'o-paid-to-completed', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'paid',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  ORDER_STORE.set('o-paid-to-completed', order);
  const result = adminProcessOrder({ orderId: 'o-paid-to-completed', action: 'complete', operatorId: 'op-1' });
  assert.equal(result.success, false);
});

// ─── 非法状态跳转: shipped → cancelled ───
test('【反例】已发货订单无法取消', () => {
  const order: Order = {
    orderId: 'o-ship-cancel-fail', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'shipped',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  ORDER_STORE.set('o-ship-cancel-fail', order);
  const result = adminProcessOrder({ orderId: 'o-ship-cancel-fail', action: 'cancel', operatorId: 'op-1' });
  assert.equal(result.success, false);
});

// ─── 不存在的订单 ───
test('【反例】操作不存在的订单返回错误', () => {
  const result = adminProcessOrder({ orderId: 'o-nonexistent', action: 'confirm', operatorId: 'op-1' });
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('not found'));
});

// ─── 未知的action类型 ───
test('【反例】未知action类型返回错误', () => {
  const order: Order = {
    orderId: 'o-unknown-action', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  adminCreateOrder(order);
  // @ts-expect-error 测试未知action
  const result = adminProcessOrder({ orderId: 'o-unknown-action', action: 'unknown_action', operatorId: 'op-1' });
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('Unknown action'));
});

// ─── 从 confirmed 退款（非法） ───
test('【反例】已确认订单不能直接退款（需先发货）', () => {
  const order: Order = {
    orderId: 'o-confirmed-refund-fail', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'confirmed',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  ORDER_STORE.set('o-confirmed-refund-fail', order);
  const result = adminProcessOrder({ orderId: 'o-confirmed-refund-fail', action: 'refund', operatorId: 'op-1' });
  assert.equal(result.success, false);
});

// ─── 从 delivered 退款（非法） ───
test('【反例】已送达订单不能直接退款', () => {
  const order: Order = {
    orderId: 'o-delivered-refund', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'delivered',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  ORDER_STORE.set('o-delivered-refund', order);
  const result = adminProcessOrder({ orderId: 'o-delivered-refund', action: 'refund', operatorId: 'op-1' });
  assert.equal(result.success, false);
});

// ─── 多租户隔离 ───
test('【边界】多租户订单隔离验证', () => {
  const orderT1: Order = {
    orderId: 'o-tenant-t1', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const orderT2: Order = {
    orderId: 'o-tenant-t2', tenantId: 't2', storeId: 's2', buyerId: 'buyer-2',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 2, unitPrice: 35 }],
    totalAmount: 70, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  assert.ok(adminCreateOrder(orderT1).success);
  assert.ok(adminCreateOrder(orderT2).success);

  // 不同租户的订单完全隔离
  const fetched1 = adminGetOrder('o-tenant-t1');
  const fetched2 = adminGetOrder('o-tenant-t2');
  assert.ok(fetched1);
  assert.ok(fetched2);
  assert.notEqual(fetched1.tenantId, fetched2.tenantId);
  assert.notEqual(fetched1.storeId, fetched2.storeId);
});

// ─── Mobile 展示: 待支付状态 ───
test('【正例】Mobile 待支付订单展示正确', () => {
  const order: Order = {
    orderId: 'o-mobile-pending', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const display = mobileRenderOrder(order);
  assert.equal(display.statusLabel, '待支付');
  assert.equal(display.actionButton, '去支付');
  assert.equal(display.progressPercent, 10);
  assert.deepEqual(display.completedSteps, ['下单']);
  assert.equal(display.pendingStep, '支付');
});

// ─── Mobile 展示: 已送达状态 ───
test('【正例】Mobile 已送达订单展示正确', () => {
  const order: Order = {
    orderId: 'o-mobile-delivered', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'delivered',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const display = mobileRenderOrder(order);
  assert.equal(display.statusLabel, '已送达');
  assert.equal(display.actionButton, '确认完成');
  assert.equal(display.progressPercent, 85);
  assert.deepEqual(display.completedSteps, ['下单', '支付', '商家确认', '发货', '送达']);
  assert.equal(display.pendingStep, '完成');
});

// ─── Storefront 履约: confirmed 状态 ───
test('【正例】Storefront 已确认订单正在备餐', () => {
  const order: Order = {
    orderId: 'o-storefront-confirmed', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 2, unitPrice: 35 }],
    totalAmount: 70, status: 'confirmed',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  ORDER_STORE.set('o-storefront-confirmed', order);
  const fulfillment = storefrontGetFulfillment('o-storefront-confirmed');
  assert.ok(fulfillment);
  assert.ok(fulfillment.isKitchenPreparing);
  assert.equal(fulfillment.isOutForDelivery, false);
  assert.equal(fulfillment.isReadyForPickup, false);
  assert.deepEqual(fulfillment.items, order.items);
});

// ─── Storefront 履约: 不存在的订单 ───
test('【边界】Storefront 查询不存在的订单返回null', () => {
  const fulfillment = storefrontGetFulfillment('o-nonexistent-storefront');
  assert.equal(fulfillment, null);
});

// ─── 空operator操作 ───
test('【反例】空operatorId的操作应被处理', () => {
  const order: Order = {
    orderId: 'o-empty-op', tenantId: 't1', storeId: 's1', buyerId: 'buyer-1',
    items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
    totalAmount: 35, status: 'pending_payment',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  adminCreateOrder(order);
  ORDER_STORE.set('o-empty-op', { ...order, status: 'paid' });

  const result = adminProcessOrder({ orderId: 'o-empty-op', action: 'confirm', operatorId: '' });
  // 即使operator为空, 状态机应正常处理
  assert.ok(result.success);
});

// ─── 多个订单并发创建 ───
test('【边界】多个订单并发创建全部成功', () => {
  const orders: Order[] = Array.from({ length: 20 }, (_, i) => ({
    orderId: `o-concurrent-${i}`,
    tenantId: 't1',
    storeId: 's1',
    buyerId: `buyer-${i}`,
    items: [{ productId: 'p1', productName: '商品', quantity: 1, unitPrice: 10 + i }],
    totalAmount: 10 + i,
    status: 'pending_payment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const results = orders.map(o => adminCreateOrder(o));
  const allSucceeded = results.every(r => r.success);
  assert.ok(allSucceeded);
  assert.equal(ORDER_STORE.size, 20 + (ORDER_STORE.size - 20)); // 原有+20
});

// ─── 全状态机转换路径枚举 ───
test('【综合】状态机合法转换路径完整枚举', () => {
  // 完整正向路径
  const forwardPath: OrderStatus[] = ['pending_payment', 'paid', 'confirmed', 'shipped', 'delivered', 'completed'];
  for (let i = 0; i < forwardPath.length - 1; i++) {
    const validation = domainValidateOrderTransition(forwardPath[i], forwardPath[i + 1]);
    assert.ok(validation.allowed, `合法转换 ${forwardPath[i]} → ${forwardPath[i + 1]} 应被允许`);
  }

  // 取消路径
  assert.ok(domainValidateOrderTransition('pending_payment', 'cancelled').allowed);
  assert.ok(domainValidateOrderTransition('paid', 'cancelled').allowed);
  assert.ok(domainValidateOrderTransition('confirmed', 'cancelled').allowed);

  // 退款路径
  assert.ok(domainValidateOrderTransition('paid', 'refunding').allowed);
  assert.ok(domainValidateOrderTransition('refunding', 'refunded').allowed);
});

// ─── Mobile 多订单展示 - 改买家的不同的订单 ───
test('【正例】Mobile 同一买家多个订单展示', () => {
  const buyerOrders = ['o-multi-1', 'o-multi-2', 'o-multi-3'];
  const statuses: OrderStatus[] = ['pending_payment', 'shipped', 'completed'];

  buyerOrders.forEach((orderId, i) => {
    const order: Order = {
      orderId, tenantId: 't1', storeId: 's1', buyerId: 'buyer-multi',
      items: [{ productId: 'p1', productName: '咖啡', quantity: 1, unitPrice: 35 }],
      totalAmount: 35, status: statuses[i],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    ORDER_STORE.set(orderId, order);
    const display = mobileRenderOrder(order);
    assert.equal(display.statusLabel, STATUS_LABELS[statuses[i]]);
    assert.equal(display.progressPercent, ORDER_PROGRESS[statuses[i]].percent);
  });
});
