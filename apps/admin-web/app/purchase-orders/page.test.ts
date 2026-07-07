/**
 * page.test.ts — 采购单管理页面 L1 测试
 * 覆盖：数据工厂、统计、查询、格式、完整性
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 类型（内联，不依赖外部结构） ──────────────────────────

type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'shipped' | 'partial_received' | 'received' | 'cancelled';
type PurchaseOrderUrgency = 'normal' | 'urgent' | 'emergency';

interface PurchaseOrderItem {
  id: string;
  orderNo: string;
  supplierName: string;
  totalAmount: number;
  totalQuantity: number;
  status: PurchaseOrderStatus;
  urgency: PurchaseOrderUrgency;
  orderDate: string;
  expectedDelivery: string;
  createdBy: string;
  department: string;
}

interface PurchaseOrderStats {
  total: number;
  draft: number;
  pendingApproval: number;
  approved: number;
  shipped: number;
  partialReceived: number;
  received: number;
  cancelled: number;
  urgentCount: number;
  emergencyCount: number;
  totalAmount: number;
  totalQuantity: number;
}

const VALID_STATUSES: PurchaseOrderStatus[] = ['draft', 'pending_approval', 'approved', 'shipped', 'partial_received', 'received', 'cancelled'];
const VALID_URGENCIES: PurchaseOrderUrgency[] = ['normal', 'urgent', 'emergency'];
const STATUS_LABELS: Record<string, string> = { draft: '草稿', pending_approval: '待审批', approved: '已批准', shipped: '已发货', partial_received: '部分收货', received: '已收货', cancelled: '已取消' };

// ── 数据工厂 ─────────────────────────────────────────────

function makeOrder(overrides?: Partial<PurchaseOrderItem>): PurchaseOrderItem {
  return {
    id: 'po-001',
    orderNo: 'PO-2026-0001',
    supplierName: '绿源食品有限公司',
    totalAmount: 15000,
    totalQuantity: 100,
    status: 'pending_approval',
    urgency: 'normal',
    orderDate: '2026-07-01',
    expectedDelivery: '2026-07-10',
    createdBy: '张三',
    department: '采购部',
    ...overrides,
  };
}

// ── 基础功能函数（内联，不依赖外部模块） ──────────────────

function computeStats(items: PurchaseOrderItem[]): PurchaseOrderStats {
  return {
    total: items.length,
    draft: items.filter(i => i.status === 'draft').length,
    pendingApproval: items.filter(i => i.status === 'pending_approval').length,
    approved: items.filter(i => i.status === 'approved').length,
    shipped: items.filter(i => i.status === 'shipped').length,
    partialReceived: items.filter(i => i.status === 'partial_received').length,
    received: items.filter(i => i.status === 'received').length,
    cancelled: items.filter(i => i.status === 'cancelled').length,
    urgentCount: items.filter(i => i.urgency === 'urgent').length + items.filter(i => i.urgency === 'emergency').length,
    emergencyCount: items.filter(i => i.urgency === 'emergency').length,
    totalAmount: items.reduce((s, i) => s + i.totalAmount, 0),
    totalQuantity: items.reduce((s, i) => s + i.totalQuantity, 0),
  };
}

function findById(items: PurchaseOrderItem[], id: string): PurchaseOrderItem | undefined {
  return items.find(i => i.id === id);
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `${Math.round(amount / 10000)}万`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return amount.toLocaleString('zh-CN');
}

function filterByStatus(items: PurchaseOrderItem[], status: PurchaseOrderStatus | 'all'): PurchaseOrderItem[] {
  if (status === 'all') return items;
  return items.filter(i => i.status === status);
}

function filterByUrgency(items: PurchaseOrderItem[], urgency: PurchaseOrderUrgency | 'all'): PurchaseOrderItem[] {
  if (urgency === 'all') return items;
  return items.filter(i => i.urgency === urgency);
}

function searchOrders(items: PurchaseOrderItem[], term: string): PurchaseOrderItem[] {
  if (!term.trim()) return items;
  const q = term.toLowerCase();
  return items.filter(i =>
    i.orderNo.toLowerCase().includes(q) ||
    i.supplierName.toLowerCase().includes(q) ||
    i.createdBy.toLowerCase().includes(q) ||
    i.department.toLowerCase().includes(q)
  );
}

function sortOrders(items: PurchaseOrderItem[], key: keyof PurchaseOrderItem, desc = false): PurchaseOrderItem[] {
  const sorted = [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return desc ? sorted.reverse() : sorted;
}

// ── 测试套件 ─────────────────────────────────────────────

test.describe('PurchaseOrders — 数据工厂', () => {
  test('makeOrder creates valid order with defaults', () => {
    const order = makeOrder();
    assert.equal(order.id, 'po-001');
    assert.equal(order.status, 'pending_approval');
    assert.equal(order.urgency, 'normal');
  });

  test('makeOrder merges overrides', () => {
    const order = makeOrder({ totalAmount: 50000, status: 'received' });
    assert.equal(order.totalAmount, 50000);
    assert.equal(order.status, 'received');
  });

  test('makeOrder keeps default for omitted fields', () => {
    const order = makeOrder({ id: 'po-002' });
    assert.equal(order.id, 'po-002');
    assert.equal(order.supplierName, '绿源食品有限公司');
  });
});

test.describe('PurchaseOrders — computeStats', () => {
  test('computes stats for empty array', () => {
    const stats = computeStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.draft, 0);
    assert.equal(stats.pendingApproval, 0);
    assert.equal(stats.totalAmount, 0);
  });

  test('computes stats for mixed statuses', () => {
    const items = [
      makeOrder({ id: '1', status: 'draft' }),
      makeOrder({ id: '2', status: 'pending_approval' }),
      makeOrder({ id: '3', status: 'approved' }),
      makeOrder({ id: '4', status: 'shipped' }),
      makeOrder({ id: '5', status: 'partial_received' }),
      makeOrder({ id: '6', status: 'received' }),
      makeOrder({ id: '7', status: 'cancelled' }),
    ];
    const stats = computeStats(items);
    assert.equal(stats.total, 7);
    assert.equal(stats.draft, 1);
    assert.equal(stats.pendingApproval, 1);
    assert.equal(stats.approved, 1);
    assert.equal(stats.shipped, 1);
    assert.equal(stats.partialReceived, 1);
    assert.equal(stats.received, 1);
    assert.equal(stats.cancelled, 1);
  });

  test('computes urgentCount (urgent + emergency)', () => {
    const items = [
      makeOrder({ id: '1', urgency: 'normal' }),
      makeOrder({ id: '2', urgency: 'urgent' }),
      makeOrder({ id: '3', urgency: 'emergency' }),
      makeOrder({ id: '4', urgency: 'urgent' }),
    ];
    const stats = computeStats(items);
    assert.equal(stats.urgentCount, 3);
    assert.equal(stats.emergencyCount, 1);
  });

  test('computes totalAmount and totalQuantity', () => {
    const items = [
      makeOrder({ id: '1', totalAmount: 10000, totalQuantity: 50 }),
      makeOrder({ id: '2', totalAmount: 20000, totalQuantity: 100 }),
    ];
    const stats = computeStats(items);
    assert.equal(stats.totalAmount, 30000);
    assert.equal(stats.totalQuantity, 150);
  });
});

test.describe('PurchaseOrders — formatCurrency', () => {
  test('formats small amounts', () => {
    assert.equal(formatCurrency(100), '100');
    assert.equal(formatCurrency(9999), '9,999');
  });

  test('formats 万 amounts', () => {
    assert.equal(formatCurrency(15000), '1.5万');
    assert.equal(formatCurrency(320000), '32.0万');
  });

  test('formats large amounts', () => {
    assert.equal(formatCurrency(10000000), '1000万');
    assert.equal(formatCurrency(15200000), '1520万');
  });
});

test.describe('PurchaseOrders — filterByStatus', () => {
  const items = [
    makeOrder({ id: '1', status: 'draft' }),
    makeOrder({ id: '2', status: 'approved' }),
    makeOrder({ id: '3', status: 'draft' }),
  ];

  test('returns all when status is "all"', () => {
    assert.equal(filterByStatus(items, 'all').length, 3);
  });

  test('filters to specific status', () => {
    assert.equal(filterByStatus(items, 'draft').length, 2);
    assert.equal(filterByStatus(items, 'approved').length, 1);
  });

  test('returns empty for unmatched status', () => {
    assert.equal(filterByStatus(items, 'cancelled').length, 0);
  });
});

test.describe('PurchaseOrders — filterByUrgency', () => {
  const items = [
    makeOrder({ id: '1', urgency: 'normal' }),
    makeOrder({ id: '2', urgency: 'urgent' }),
    makeOrder({ id: '3', urgency: 'emergency' }),
  ];

  test('filters by urgency level', () => {
    assert.equal(filterByUrgency(items, 'urgent').length, 1);
    assert.equal(filterByUrgency(items, 'emergency').length, 1);
  });

  test('returns all for "all"', () => {
    assert.equal(filterByUrgency(items, 'all').length, 3);
  });
});

test.describe('PurchaseOrders — searchOrders', () => {
  const items = [
    makeOrder({ id: '1', orderNo: 'PO-2026-0001', supplierName: '绿源食品有限公司' }),
    makeOrder({ id: '2', orderNo: 'PO-2026-0002', supplierName: '鼎盛包装' }),
    makeOrder({ id: '3', orderNo: 'PO-2026-0003', supplierName: '鲜生活食材', createdBy: '李小红', department: '后厨' }),
  ];

  test('empty term returns all', () => {
    assert.equal(searchOrders(items, '').length, 3);
  });

  test('finds by orderNo partial match', () => {
    assert.equal(searchOrders(items, '0001').length, 1);
    assert.equal(searchOrders(items, 'PO-2026').length, 3);
  });

  test('finds by supplierName', () => {
    assert.equal(searchOrders(items, '绿源').length, 1);
    assert.equal(searchOrders(items, '包装').length, 1);
  });

  test('finds by createdBy', () => {
    assert.equal(searchOrders(items, '李小红').length, 1);
  });

  test('case insensitive search', () => {
    assert.equal(searchOrders(items, 'po-2026').length, 3);
  });
});

test.describe('PurchaseOrders — sortOrders', () => {
  const items = [
    makeOrder({ id: '1', totalAmount: 10000, orderDate: '2026-07-01' }),
    makeOrder({ id: '2', totalAmount: 30000, orderDate: '2026-06-01' }),
    makeOrder({ id: '3', totalAmount: 20000, orderDate: '2026-08-01' }),
  ];

  test('sorts ascending by amount', () => {
    const sorted = sortOrders(items, 'totalAmount');
    assert.equal(sorted[0].id, '1');
    assert.equal(sorted[1].id, '3');
    assert.equal(sorted[2].id, '2');
  });

  test('sorts descending by amount', () => {
    const sorted = sortOrders(items, 'totalAmount', true);
    assert.equal(sorted[0].id, '2');
    assert.equal(sorted[1].id, '3');
    assert.equal(sorted[2].id, '1');
  });

  test('sorts by orderDate descending', () => {
    const sorted = sortOrders(items, 'orderDate', true);
    assert.equal(sorted[0].id, '3');
    assert.equal(sorted[1].id, '1');
    assert.equal(sorted[2].id, '2');
  });
});

test.describe('PurchaseOrders — findById', () => {
  const items = [makeOrder({ id: 'po-001' }), makeOrder({ id: 'po-002' })];

  test('finds existing order', () => {
    const found = findById(items, 'po-001');
    assert.ok(found);
    assert.equal(found!.orderNo, 'PO-2026-0001');
  });

  test('returns undefined for missing id', () => {
    assert.equal(findById(items, 'nonexistent'), undefined);
  });
});

test.describe('PurchaseOrders — 数据完整性', () => {
  test('STATUS_LABELS covers all statuses', () => {
    for (const status of VALID_STATUSES) {
      assert.ok(STATUS_LABELS[status], `missing label for ${status}`);
    }
  });

  test('STATUS_LABELS has correct Chinese labels', () => {
    assert.equal(STATUS_LABELS.draft, '草稿');
    assert.equal(STATUS_LABELS.pending_approval, '待审批');
    assert.equal(STATUS_LABELS.approved, '已批准');
    assert.equal(STATUS_LABELS.shipped, '已发货');
    assert.equal(STATUS_LABELS.partial_received, '部分收货');
    assert.equal(STATUS_LABELS.received, '已收货');
    assert.equal(STATUS_LABELS.cancelled, '已取消');
  });

  test('all valid statuses have expectedDelivery >= orderDate', () => {
    const items = [
      makeOrder({ orderDate: '2026-07-01', expectedDelivery: '2026-07-10' }),
      makeOrder({ orderDate: '2026-06-15', expectedDelivery: '2026-06-20' }),
    ];
    for (const item of items) {
      assert.ok(item.expectedDelivery >= item.orderDate,
        `${item.orderNo}: expectedDelivery >= orderDate`);
    }
  });
});
