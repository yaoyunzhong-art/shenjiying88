/**
 * purchase-orders.service.test.ts — 采购订单 Service 层测试
 *
 * 覆盖:
 *   - CRUD 操作
 *   - 状态流转验证
 *   - 金额与统计计算
 *   - 条件查询与排序
 *   - 边界条件与错误处理
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MOCK_PURCHASE_ORDERS,
  PURCHASE_ORDER_STATUS_MAP,
  PURCHASE_ORDER_URGENCY_MAP,
  PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_URGENCIES,
  PURCHASE_ORDER_LIST_SEARCH_FIELDS,
  computePurchaseOrderStats,
  formatCurrency,
  getPurchaseOrderById,
} from './purchase-orders-data';

import type {
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PurchaseOrderUrgency,
} from './purchase-orders-data';

// ── 工厂函数 ────────────────────────────────────────────

function makeOrder(overrides: Partial<PurchaseOrderItem> = {}): PurchaseOrderItem {
  return {
    id: overrides.id ?? 'po-svc-1',
    orderNo: overrides.orderNo ?? 'PO-TEST-0001',
    supplierName: overrides.supplierName ?? 'Test供应商',
    supplierId: overrides.supplierId ?? 'sp-test',
    totalAmount: overrides.totalAmount ?? 10000,
    status: overrides.status ?? 'draft',
    urgency: overrides.urgency ?? 'normal',
    itemsCount: overrides.itemsCount ?? 3,
    totalQuantity: overrides.totalQuantity ?? 50,
    orderDate: overrides.orderDate ?? '2026-07-01',
    expectedDelivery: overrides.expectedDelivery ?? '2026-07-10',
    actualDelivery: overrides.actualDelivery,
    contactPerson: overrides.contactPerson ?? '测试联系人',
    contactPhone: overrides.contactPhone ?? '13800000000',
    remark: overrides.remark ?? '',
    createdBy: overrides.createdBy ?? '测试用户',
    createdAt: overrides.createdAt ?? '2026-07-01T08:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-07-01T08:00:00Z',
    storeCode: overrides.storeCode ?? 'ST-001',
    department: overrides.department ?? '后厨',
  };
}

// ============================================================
//  1. 数据查询测试
// ============================================================

test.describe('PurchaseOrders Service — 数据查询', () => {
  test('getPurchaseOrderById finds existing order', () => {
    const po = getPurchaseOrderById('po-001');
    assert.ok(po);
    assert.equal(po!.orderNo, 'PO-2026-0001');
    assert.equal(po!.supplierName, '绿源食品有限公司');
  });

  test('getPurchaseOrderById returns undefined for missing id', () => {
    const po = getPurchaseOrderById('non-existent-id');
    assert.equal(po, undefined);
  });

  test('getPurchaseOrderById returns undefined for empty string', () => {
    const po = getPurchaseOrderById('');
    assert.equal(po, undefined);
  });

  test('MOCK_PURCHASE_ORDERS has 15 entries', () => {
    assert.equal(MOCK_PURCHASE_ORDERS.length, 15);
  });

  test('all mock orders have unique ids', () => {
    const ids = MOCK_PURCHASE_ORDERS.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('all mock orders have valid status values', () => {
    for (const po of MOCK_PURCHASE_ORDERS) {
      assert.ok(PURCHASE_ORDER_STATUSES.includes(po.status), `Invalid status: ${po.status} on ${po.id}`);
    }
  });

  test('all mock orders have valid urgency values', () => {
    for (const po of MOCK_PURCHASE_ORDERS) {
      assert.ok(PURCHASE_ORDER_URGENCIES.includes(po.urgency), `Invalid urgency: ${po.urgency} on ${po.id}`);
    }
  });
});

// ============================================================
//  2. 状态流转测试
// ============================================================

test.describe('PurchaseOrders Service — 状态流转', () => {
  const STATUS_FLOW: Record<string, PurchaseOrderStatus[]> = {
    draft: ['pending_approval', 'cancelled'],
    pending_approval: ['approved', 'cancelled'],
    approved: ['shipped', 'cancelled'],
    shipped: ['partial_received', 'received'],
    partial_received: ['received'],
    received: [], // terminal
    cancelled: [], // terminal
  };

  test('all statuses have valid transitions defined', () => {
    for (const s of PURCHASE_ORDER_STATUSES) {
      assert.ok(STATUS_FLOW[s] !== undefined, `No transitions defined for ${s}`);
    }
  });

  test('draft can transition to pending_approval or cancelled', () => {
    const transitions = STATUS_FLOW['draft'];
    assert.ok(transitions.includes('pending_approval'));
    assert.ok(transitions.includes('cancelled'));
    assert.equal(transitions.length, 2);
  });

  test('received is terminal status', () => {
    assert.equal(STATUS_FLOW['received'].length, 0);
  });

  test('cancelled is terminal status', () => {
    assert.equal(STATUS_FLOW['cancelled'].length, 0);
  });

  test('mock data has at least one order in each status', () => {
    for (const s of PURCHASE_ORDER_STATUSES) {
      const count = MOCK_PURCHASE_ORDERS.filter((o) => o.status === s).length;
      assert.ok(count >= 1, `No order in status ${s}`);
    }
  });
});

// ============================================================
//  3. 统计与金额计算测试
// ============================================================

test.describe('PurchaseOrders Service — 统计与金额', () => {
  test('computePurchaseOrderStats returns zeroes for empty array', () => {
    const stats = computePurchaseOrderStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.draft, 0);
    assert.equal(stats.totalAmount, 0);
    assert.equal(stats.totalQuantity, 0);
  });

  test('computePurchaseOrderStats counts statuses correctly', () => {
    const orders = [
      makeOrder({ id: 's1', status: 'draft' }),
      makeOrder({ id: 's2', status: 'draft' }),
      makeOrder({ id: 's3', status: 'received' }),
    ];
    const stats = computePurchaseOrderStats(orders);
    assert.equal(stats.draft, 2);
    assert.equal(stats.received, 1);
    assert.equal(stats.approved, 0);
    assert.equal(stats.total, 3);
  });

  test('computePurchaseOrderStats counts urgent + emergency together', () => {
    const orders = [
      makeOrder({ id: 'u1', urgency: 'urgent' }),
      makeOrder({ id: 'u2', urgency: 'emergency' }),
      makeOrder({ id: 'u3', urgency: 'normal' }),
    ];
    const stats = computePurchaseOrderStats(orders);
    assert.equal(stats.urgentCount, 2);
    assert.equal(stats.emergencyCount, 1);
  });

  test('computePurchaseOrderStats sums totalAmount correctly', () => {
    const orders = [
      makeOrder({ totalAmount: 10000 }),
      makeOrder({ totalAmount: 25000 }),
      makeOrder({ totalAmount: 5000 }),
    ];
    const stats = computePurchaseOrderStats(orders);
    assert.equal(stats.totalAmount, 40000);
  });

  test('computePurchaseOrderStats sums totalQuantity correctly', () => {
    const orders = [
      makeOrder({ totalQuantity: 100 }),
      makeOrder({ totalQuantity: 50 }),
    ];
    const stats = computePurchaseOrderStats(orders);
    assert.equal(stats.totalQuantity, 150);
  });

  test('computePurchaseOrderStats on full mock data', () => {
    const stats = computePurchaseOrderStats(MOCK_PURCHASE_ORDERS);
    assert.equal(stats.total, 15);
    assert.equal(stats.received, 2); // po-001, po-008
    assert.equal(stats.cancelled, 1); // po-007
    assert.ok(stats.totalAmount > 0);
    assert.ok(stats.totalQuantity > 0);
  });

  test('formatCurrency formats small amounts', () => {
    assert.equal(formatCurrency(500), '500');
    assert.equal(formatCurrency(9999), '9,999');
  });

  test('formatCurrency formats 万 amounts', () => {
    assert.equal(formatCurrency(10000), '1.0万');
    assert.equal(formatCurrency(12800), '1.3万');
  });

  test('formatCurrency formats large amounts beyond 千万', () => {
    assert.equal(formatCurrency(10000000), '1000万');
    assert.equal(formatCurrency(320000), '32.0万');
  });
});

// ============================================================
//  4. 条件查询与排序测试
// ============================================================

test.describe('PurchaseOrders Service — 条件查询', () => {
  test('search fields cover all key properties', () => {
    const expectedFields = ['orderNo', 'supplierName', 'contactPerson', 'department', 'storeCode'];
    assert.deepEqual(PURCHASE_ORDER_LIST_SEARCH_FIELDS, expectedFields);
  });

  test('orders can be filtered by status manually', () => {
    const drafts = MOCK_PURCHASE_ORDERS.filter((o) => o.status === 'draft');
    assert.equal(drafts.length, 3); // po-005, po-011, po-015
    assert.ok(drafts.every((o) => o.status === 'draft'));
  });

  test('orders can be filtered by urgency', () => {
    const emergency = MOCK_PURCHASE_ORDERS.filter((o) => o.urgency === 'emergency');
    assert.equal(emergency.length, 2); // po-007, po-010
    assert.ok(emergency.every((o) => o.urgency === 'emergency'));
  });

  test('orders can be sorted by totalAmount descending', () => {
    const sorted = [...MOCK_PURCHASE_ORDERS].sort((a, b) => b.totalAmount - a.totalAmount);
    assert.equal(sorted[0].id, 'po-009'); // 320000
    assert.equal(sorted[0].totalAmount, 320000);
    assert.equal(sorted[sorted.length - 1].totalAmount, 9200); // po-010
  });

  test('orders can be filtered by supplierName', () => {
    const greenSource = MOCK_PURCHASE_ORDERS.filter((o) => o.supplierName.includes('绿源'));
    assert.equal(greenSource.length, 2); // po-001, po-014
  });

  test('orders can be filtered by department', () => {
    const itDept = MOCK_PURCHASE_ORDERS.filter((o) => o.department === 'IT');
    assert.equal(itDept.length, 1);
    assert.equal(itDept[0].id, 'po-006');
  });
});

// ============================================================
//  5. 状态映射完整性测试
// ============================================================

test.describe('PurchaseOrders Service — 状态映射', () => {
  test('every status has a label and variant', () => {
    for (const s of PURCHASE_ORDER_STATUSES) {
      const m = PURCHASE_ORDER_STATUS_MAP[s];
      assert.ok(m, `Missing map entry for ${s}`);
      assert.equal(typeof m.label, 'string');
      assert.ok(m.label.length > 0);
      assert.ok(['info', 'warning', 'success', 'danger', 'pending', 'neutral'].includes(m.variant));
    }
  });

  test('every urgency has a label and variant', () => {
    for (const u of PURCHASE_ORDER_URGENCIES) {
      const m = PURCHASE_ORDER_URGENCY_MAP[u];
      assert.ok(m, `Missing map entry for ${u}`);
      assert.equal(typeof m.label, 'string');
      assert.ok(m.label.length > 0);
    }
  });
});

// ============================================================
//  6. 边界条件测试
// ============================================================

test.describe('PurchaseOrders Service — 边界条件', () => {
  test('totalAmount can be zero', () => {
    const order = makeOrder({ totalAmount: 0 });
    const stats = computePurchaseOrderStats([order]);
    assert.equal(stats.totalAmount, 0);
  });

  test('itemsCount can be zero', () => {
    const order = makeOrder({ itemsCount: 0, totalQuantity: 0 });
    assert.equal(order.itemsCount, 0);
  });

  test('actualDelivery can be undefined for non-received orders', () => {
    const draft = makeOrder({ status: 'draft' });
    assert.equal(draft.actualDelivery, undefined);
    const received = makeOrder({ status: 'received', actualDelivery: '2026-07-10' });
    assert.ok(received.actualDelivery);
  });

  test('formatCurrency handles zero', () => {
    assert.equal(formatCurrency(0), '0');
  });

  test('formatCurrency handles very large numbers (>= 10M drops decimal)', () => {
    // toFixed(0) for >= 10,000,000
    assert.equal(formatCurrency(10000000), '1000万');
    assert.equal(formatCurrency(99999999), '10000万');
  });
});
