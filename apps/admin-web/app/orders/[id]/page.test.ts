/**
 * orders/[id]/page.test.ts — Page-level tests for orders detail page.
 * Tests detail lookup, state transitions, not-found handling, amount formatting.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: orders-data.ts, orders-detail-view-model.ts, orders/[id]/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_ORDERS,
  ORDER_STATUS_MAP,
  ORDER_STATUS_FLOW,
  ORDER_STATUSES,
  type OrderItem,
  type OrderStatus,
} from '../../orders-data';
import {
  loadOrderDetail,
  getStatusColor,
} from '../../orders-detail-view-model';

// ========================================
// 1. Detail lookup (mirrors OrderDetailContent)
// ========================================

function findOrderById(id: string): OrderItem | undefined {
  return MOCK_ORDERS.find((o) => o.id === id);
}

describe('OrderDetail — lookup', () => {
  // 正例：查找已有订单
  it('should find an existing order by id', () => {
    const order = findOrderById('ord-001');
    assert.ok(order);
    assert.strictEqual(order.orderNo, 'ORD-20260620-0001');
    assert.strictEqual(order.customerName, '张三');
  });

  // 正例：查找另一笔订单（processing + 已付全款）
  it('should find ord-003 with processing status', () => {
    const order = findOrderById('ord-003');
    assert.ok(order);
    assert.strictEqual(order.status, 'processing');
    assert.strictEqual(order.paidAmount, 128.00);
  });

  // 反例：查找不存在的订单
  it('should return undefined for non-existent id', () => {
    assert.strictEqual(findOrderById('ord-999'), undefined);
  });

  // 反例：传入空字符串
  it('should return undefined for empty id', () => {
    assert.strictEqual(findOrderById(''), undefined);
  });

  // 边界：传入 null-like id
  it('should return undefined for malformed id', () => {
    assert.strictEqual(findOrderById('invalid!@#'), undefined);
  });
});

// ========================================
// 2. loadOrderDetail (ViewModel)
// ========================================

describe('OrderDetail — loadOrderDetail', () => {
  // 正例：已签收订单——详情完整
  it('should return full VM for delivered order', () => {
    const vm = loadOrderDetail('ord-001');
    assert.ok(vm);
    assert.strictEqual(vm.order.id, 'ord-001');
    assert.strictEqual(vm.statusLabel, '已签收');
    assert.strictEqual(vm.statusVariant, 'success');
    assert.strictEqual(vm.channelLabel, '线上');
    assert.strictEqual(vm.isTerminal, false);
    assert.ok(vm.nextStatuses.length > 0);
  });

  // 正例：processing 订单——处理中 & 可流转
  it('should show processing status and transitions', () => {
    const vm = loadOrderDetail('ord-003');
    assert.ok(vm);
    assert.strictEqual(vm.statusLabel, '处理中');
    assert.strictEqual(vm.statusVariant, 'info');
    assert.strictEqual(vm.isTerminal, false);
    const keys = vm.nextStatuses.map((n) => n.key);
    assert.ok(keys.includes('shipped'));
    assert.ok(keys.includes('cancelled'));
  });

  // 正例：cancelled 订单——终态
  it('should mark cancelled order as terminal', () => {
    const vm = loadOrderDetail('ord-006');
    assert.ok(vm);
    assert.strictEqual(vm.statusLabel, '已取消');
    assert.strictEqual(vm.statusVariant, 'danger');
    assert.strictEqual(vm.isTerminal, true);
    assert.strictEqual(vm.nextStatuses.length, 0);
  });

  // 正例：pending 订单（ord-005）
  it('should show pending status for ord-005', () => {
    const vm = loadOrderDetail('ord-005');
    assert.ok(vm);
    assert.strictEqual(vm.statusLabel, '待确认');
    assert.strictEqual(vm.isTerminal, false);
    assert.strictEqual(vm.order.paidAmount, 0);
  });

  // 反例：不存在的订单返回 null
  it('should return null for non-existent order', () => {
    assert.strictEqual(loadOrderDetail('ord-xxx'), null);
  });

  // 边界：所有状态都能正确映射
  for (const status of ORDER_STATUSES) {
    it(`should map status '${status}' correctly`, () => {
      const entry = ORDER_STATUS_MAP[status];
      assert.ok(entry);
      assert.ok(['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant));
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
    });
  }
});

// ========================================
// 3. Status transitions (mirrors ORDER_STATUS_FLOW)
// ========================================

describe('OrderDetail — status transitions', () => {
  // 正例：pending → confirmed / cancelled
  it('pending allows confirmed and cancelled', () => {
    const next = ORDER_STATUS_FLOW['pending'];
    assert.deepStrictEqual(next, ['confirmed', 'cancelled']);
  });

  // 正例：delivered → refunded 仅退款
  it('delivered allows only refunded', () => {
    const next = ORDER_STATUS_FLOW['delivered'];
    assert.deepStrictEqual(next, ['refunded']);
  });

  // 反例：cancelled 不允许任何流转
  it('cancelled is terminal — no next', () => {
    assert.strictEqual(ORDER_STATUS_FLOW['cancelled'].length, 0);
  });

  // 反例：refunded 不允许任何流转
  it('refunded is terminal — no next', () => {
    assert.strictEqual(ORDER_STATUS_FLOW['refunded'].length, 0);
  });

  // 正例：confirmed → processing / cancelled
  it('confirmed allows processing and cancelled', () => {
    const next = ORDER_STATUS_FLOW['confirmed'];
    assert.ok(next.includes('processing'));
    assert.ok(next.includes('cancelled'));
  });
});

// ========================================
// 4. getStatusColor
// ========================================

describe('OrderDetail — getStatusColor', () => {
  it('returns green for delivered', () => {
    assert.strictEqual(getStatusColor('delivered'), '#4ade80');
  });

  it('returns blue for shipped', () => {
    assert.strictEqual(getStatusColor('shipped'), '#60a5fa');
  });

  it('returns red for cancelled/refunded', () => {
    assert.strictEqual(getStatusColor('cancelled'), '#f87171');
    assert.strictEqual(getStatusColor('refunded'), '#f87171');
  });

  it('returns slate fallback for unknown status', () => {
    assert.strictEqual(getStatusColor('unknown'), '#94a3b8');
  });
});

// ========================================
// 5. Amount formatting (mirrors formatAmount in page.tsx)
// ========================================

function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

describe('OrderDetail — formatAmount', () => {
  // 正例：整数金额
  it('formats integer amount with two decimals', () => {
    assert.strictEqual(formatAmount(100), '¥100.00');
  });

  // 正例：带小数
  it('formats decimal amount correctly', () => {
    assert.strictEqual(formatAmount(256.8), '¥256.80');
  });

  // 边界：零
  it('formats zero amount', () => {
    assert.strictEqual(formatAmount(0), '¥0.00');
  });

  // 边界：大额
  it('formats large amount with commas not required', () => {
    assert.strictEqual(formatAmount(12345.67), '¥12345.67');
  });

  // 边界：极小值
  it('formats very small amount', () => {
    assert.strictEqual(formatAmount(0.01), '¥0.01');
  });
});

// ========================================
// 6. Discount ratio calculation (mirrors page.tsx logic)
// ========================================

function calcDiscountRatio(total: number, discount: number): string {
  return total > 0 ? ((discount / total) * 100).toFixed(1) : '0.0';
}

describe('OrderDetail — discount ratio', () => {
  it('calculates for ord-001: 25/256.8', () => {
    const ratio = calcDiscountRatio(256.8, 25);
    assert.strictEqual(ratio, '9.7');
  });

  it('returns 0.0 for zero total', () => {
    assert.strictEqual(calcDiscountRatio(0, 10), '0.0');
  });

  it('returns 0.0 for zero discount', () => {
    assert.strictEqual(calcDiscountRatio(200, 0), '0.0');
  });

  it('100% discount', () => {
    assert.strictEqual(calcDiscountRatio(100, 100), '100.0');
  });
});
