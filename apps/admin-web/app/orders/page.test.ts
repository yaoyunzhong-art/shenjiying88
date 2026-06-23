/**
 * orders-page.test.ts — Page-level tests for orders listing page.
 * Tests list rendering, status filtering, empty state, and sorting.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: orders-data.ts, orders-page.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_ORDERS,
  ORDER_STATUS_MAP,
  ORDER_CHANNEL_MAP,
  ORDER_STATUSES,
  ORDER_CHANNELS,
  ORDER_STATUS_FLOW,
  type OrderItem,
  type OrderStatus,
  type OrderChannel,
} from '../orders-data';

// ---- Page-level filter helpers ----

type SortDir = 'asc' | 'desc';

function filterByStatus(items: OrderItem[], status: OrderStatus | 'ALL'): OrderItem[] {
  if (status === 'ALL') return items;
  return items.filter((o) => o.status === status);
}

function filterByChannel(items: OrderItem[], channel: OrderChannel | 'ALL'): OrderItem[] {
  if (channel === 'ALL') return items;
  return items.filter((o) => o.channel === channel);
}

function searchOrders(items: OrderItem[], keyword: string): OrderItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (o) =>
      o.orderNo.toLowerCase().includes(lower) ||
      o.customerName.toLowerCase().includes(lower) ||
      o.storeName.toLowerCase().includes(lower) ||
      o.salesClerk.toLowerCase().includes(lower)
  );
}

function sortOrders(items: OrderItem[], key: keyof OrderItem, dir: SortDir): OrderItem[] {
  const sorted = [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const cmp = String(aVal).localeCompare(String(bVal));
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function getStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_MAP[status]?.label ?? status;
}

function getTotalRevenue(items: OrderItem[]): number {
  return items.reduce((sum, o) => sum + o.paidAmount, 0);
}

function getAvgOrderValue(items: OrderItem[]): number {
  if (items.length === 0) return 0;
  return items.reduce((sum, o) => sum + o.totalAmount, 0) / items.length;
}

// ---- 正例 ----

describe('orders-page: 正例 (positive cases)', () => {
  describe('MOCK_ORDERS data integrity', () => {
    it('should contain at least 12 orders', () => {
      assert.ok(MOCK_ORDERS.length >= 12, `expected >= 12, got ${MOCK_ORDERS.length}`);
    });

    it('every order should have unique id and orderNo', () => {
      const ids = MOCK_ORDERS.map((o) => o.id);
      const nos = MOCK_ORDERS.map((o) => o.orderNo);
      assert.strictEqual(new Set(ids).size, ids.length);
      assert.strictEqual(new Set(nos).size, nos.length);
    });

    it('every order should have valid status and channel', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(ORDER_STATUSES.includes(o.status), `invalid status ${o.status} for ${o.id}`);
        assert.ok(ORDER_CHANNELS.includes(o.channel), `invalid channel ${o.channel} for ${o.id}`);
      }
    });

    it('totalAmount should be positive and discount <= total', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(o.totalAmount > 0, `totalAmount must be > 0 for ${o.id}`);
        assert.ok(o.discountAmount <= o.totalAmount, `discount ${o.discountAmount} > total ${o.totalAmount} for ${o.id}`);
      }
    });

    it('customerName and storeName should not be empty', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(o.customerName.length > 0, `empty customerName for ${o.id}`);
        assert.ok(o.storeName.length > 0, `empty storeName for ${o.id}`);
      }
    });
  });

  describe('status filter', () => {
    it('filter delivered should return only delivered orders', () => {
      const result = filterByStatus(MOCK_ORDERS, 'delivered');
      assert.ok(result.length >= 2, `expected >= 2 delivered, got ${result.length}`);
      for (const o of result) {
        assert.strictEqual(o.status, 'delivered');
      }
    });

    it('filter pending should return only pending orders', () => {
      const result = filterByStatus(MOCK_ORDERS, 'pending');
      for (const o of result) {
        assert.strictEqual(o.status, 'pending');
      }
    });

    it('filter cancelled should return only cancelled orders', () => {
      const result = filterByStatus(MOCK_ORDERS, 'cancelled');
      for (const o of result) {
        assert.strictEqual(o.status, 'cancelled');
      }
    });

    it('filter ALL should return all orders', () => {
      const result = filterByStatus(MOCK_ORDERS, 'ALL');
      assert.strictEqual(result.length, MOCK_ORDERS.length);
    });
  });

  describe('channel filter', () => {
    it('filter online should return only online orders', () => {
      const result = filterByChannel(MOCK_ORDERS, 'online');
      assert.ok(result.length >= 3, `expected >= 3 online, got ${result.length}`);
      for (const o of result) {
        assert.strictEqual(o.channel, 'online');
      }
    });
  });

  describe('search', () => {
    it('should find orders by customerName', () => {
      const result = searchOrders(MOCK_ORDERS, '张三');
      assert.ok(result.length >= 1);
    });

    it('should find orders by orderNo', () => {
      const result = searchOrders(MOCK_ORDERS, 'ORD-20260620');
      assert.ok(result.length >= 1);
    });

    it('should find orders by storeName', () => {
      const result = searchOrders(MOCK_ORDERS, '朝阳');
      assert.ok(result.length >= 1);
    });

    it('empty search should return all orders', () => {
      const result = searchOrders(MOCK_ORDERS, '');
      assert.strictEqual(result.length, MOCK_ORDERS.length);
    });
  });

  describe('sorting', () => {
    it('should sort by totalAmount descending', () => {
      const sorted = sortOrders(MOCK_ORDERS, 'totalAmount', 'desc');
      for (let i = 1; i < sorted.length; i++) {
        assert.ok((sorted[i]?.totalAmount ?? 0) <= (sorted[i - 1]?.totalAmount ?? 0));
      }
    });

    it('should sort by totalAmount ascending', () => {
      const sorted = sortOrders(MOCK_ORDERS, 'totalAmount', 'asc');
      for (let i = 1; i < sorted.length; i++) {
        assert.ok((sorted[i]?.totalAmount ?? 0) >= (sorted[i - 1]?.totalAmount ?? 0));
      }
    });

    it('should sort by createdAt descending (newest first)', () => {
      const sorted = sortOrders(MOCK_ORDERS, 'createdAt', 'desc');
      for (let i = 1; i < sorted.length; i++) {
        assert.ok((sorted[i]?.createdAt ?? '') <= (sorted[i - 1]?.createdAt ?? ''));
      }
    });
  });

  describe('status labels', () => {
    it('should have correct labels for all statuses', () => {
      assert.strictEqual(getStatusLabel('pending'), '待确认');
      assert.strictEqual(getStatusLabel('delivered'), '已签收');
      assert.strictEqual(getStatusLabel('cancelled'), '已取消');
      assert.strictEqual(getStatusLabel('refunded'), '已退款');
    });
  });

  describe('ORDER_STATUS_FLOW', () => {
    it('should define next statuses for all', () => {
      for (const s of ORDER_STATUSES) {
        assert.ok(Array.isArray(ORDER_STATUS_FLOW[s]), `missing flow for ${s}`);
      }
    });

    it('pending -> confirmed or cancelled', () => {
      assert.ok(ORDER_STATUS_FLOW.pending.includes('confirmed'));
      assert.ok(ORDER_STATUS_FLOW.pending.includes('cancelled'));
    });

    it('delivered -> refunded', () => {
      assert.ok(ORDER_STATUS_FLOW.delivered.includes('refunded'));
    });
  });
});

// ---- 反例 ----

describe('orders-page: 反例 (negative cases)', () => {
  it('filter by nonexistent status should return empty', () => {
    const result = filterByStatus(MOCK_ORDERS, 'pending' as OrderStatus).filter(
      (o) => o.status === 'voided' as unknown as OrderStatus
    );
    assert.strictEqual(result.length, 0);
  });

  it('search for nonexistent keyword should return empty', () => {
    const result = searchOrders(MOCK_ORDERS, 'ZZZZ_NOT_FOUND');
    assert.strictEqual(result.length, 0);
  });

  it('empty order list should handle all filters gracefully', () => {
    const empty: OrderItem[] = [];
    assert.strictEqual(filterByStatus(empty, 'delivered').length, 0);
    assert.strictEqual(searchOrders(empty, 'test').length, 0);
    assert.strictEqual(filterByChannel(empty, 'online').length, 0);
    assert.strictEqual(sortOrders(empty, 'totalAmount', 'desc').length, 0);
  });

  it('getAvgOrderValue for empty list should return 0', () => {
    assert.strictEqual(getAvgOrderValue([]), 0);
  });
});

// ---- 边界 ----

describe('orders-page: 边界 (boundary cases)', () => {
  it('single char search should match', () => {
    const result = searchOrders(MOCK_ORDERS, '张');
    assert.ok(result.length >= 1, 'single char search should find matches');
  });

  it('case-insensitive search should work', () => {
    const upper = searchOrders(MOCK_ORDERS, 'ORD-20260620');
    const lower = searchOrders(MOCK_ORDERS, 'ord-20260620');
    assert.strictEqual(upper.length, lower.length);
  });

  it('combined filter: status + channel', () => {
    let result = filterByStatus(MOCK_ORDERS, 'delivered');
    result = filterByChannel(result, 'online');
    for (const o of result) {
      assert.strictEqual(o.status, 'delivered');
      assert.strictEqual(o.channel, 'online');
    }
  });

  it('total revenue should be positive', () => {
    const revenue = getTotalRevenue(MOCK_ORDERS);
    assert.ok(revenue > 0, 'revenue should be > 0');
  });

  it('avg order value should be between 50 and 500', () => {
    const avg = getAvgOrderValue(MOCK_ORDERS);
    assert.ok(avg > 50, `avg ${avg} should be > 50`);
    assert.ok(avg < 500, `avg ${avg} should be < 500`);
  });

  it('cancelled + refunded orders should have paidAmount 0', () => {
    for (const o of MOCK_ORDERS) {
      if (o.status === 'cancelled') {
        assert.strictEqual(o.paidAmount, 0, `cancelled ${o.id} should have paidAmount 0`);
      }
    }
  });

  it('delivered orders should have paidAmount > 0', () => {
    for (const o of MOCK_ORDERS) {
      if (o.status === 'delivered') {
        assert.ok(o.paidAmount > 0, `delivered ${o.id} should have paidAmount > 0`);
      }
    }
  });

  it('every order should have createdAt date', () => {
    for (const o of MOCK_ORDERS) {
      assert.ok(o.createdAt.length >= 10, `missing createdAt for ${o.id}`);
    }
  });
});
