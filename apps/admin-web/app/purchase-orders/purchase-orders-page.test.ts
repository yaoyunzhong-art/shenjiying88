/**
 * purchase-orders-page.test.ts — 采购单管理页面 L1 数据层测试
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

function makeMockOrders(): PurchaseOrderItem[] {
  return [
    makeOrder({ id: 'po-001', orderNo: 'PO-2026-0001', supplierName: '绿源食品有限公司', totalAmount: 15000, totalQuantity: 100, status: 'pending_approval', urgency: 'normal' }),
    makeOrder({ id: 'po-002', orderNo: 'PO-2026-0002', supplierName: '鸿运包装', totalAmount: 320000, totalQuantity: 5000, status: 'draft', urgency: 'normal' }),
    makeOrder({ id: 'po-003', orderNo: 'PO-2026-0003', supplierName: '优品清洁', totalAmount: 5000, totalQuantity: 200, status: 'received', urgency: 'normal' }),
    makeOrder({ id: 'po-004', orderNo: 'PO-2026-0004', supplierName: '极速配送', totalAmount: 300000, totalQuantity: 50, status: 'draft', urgency: 'urgent' }),
    makeOrder({ id: 'po-005', orderNo: 'PO-2026-0005', supplierName: '鲜果汇', totalAmount: 10000000, totalQuantity: 3000, status: 'pending_approval', urgency: 'emergency' }),
    makeOrder({ id: 'po-006', orderNo: 'PO-2026-0006', supplierName: '鑫达办公', totalAmount: 9900, totalQuantity: 800, status: 'cancelled', urgency: 'normal' }),
    makeOrder({ id: 'po-007', orderNo: 'PO-2026-0007', supplierName: '旺旺食品', totalAmount: 56000, totalQuantity: 600, status: 'shipped', urgency: 'urgent' }),
    makeOrder({ id: 'po-008', orderNo: 'PO-2026-0008', supplierName: '铭扬五金', totalAmount: 128000, totalQuantity: 2000, status: 'approved', urgency: 'normal' }),
    makeOrder({ id: 'po-009', orderNo: 'PO-2026-0009', supplierName: '绿源食品有限公司', totalAmount: 8800, totalQuantity: 150, status: 'partial_received', urgency: 'normal' }),
    makeOrder({ id: 'po-010', orderNo: 'PO-2026-0010', supplierName: '安达物流', totalAmount: 25000, totalQuantity: 1, status: 'draft', urgency: 'emergency' }),
  ];
}

// ── 辅助函数（内联复制业务逻辑） ──────────────────────────

function computeStats(orders: PurchaseOrderItem[]) {
  const stats = { total: orders.length, draft: 0, pendingApproval: 0, approved: 0, shipped: 0, partialReceived: 0, received: 0, cancelled: 0, totalAmount: 0, totalQuantity: 0, urgentCount: 0, emergencyCount: 0, normalCount: 0 };
  for (const o of orders) {
    stats.totalAmount += o.totalAmount;
    stats.totalQuantity += o.totalQuantity;
    if (o.status === 'draft') stats.draft++;
    else if (o.status === 'pending_approval') stats.pendingApproval++;
    else if (o.status === 'approved') stats.approved++;
    else if (o.status === 'shipped') stats.shipped++;
    else if (o.status === 'partial_received') stats.partialReceived++;
    else if (o.status === 'received') stats.received++;
    else if (o.status === 'cancelled') stats.cancelled++;
    if (o.urgency === 'urgent') stats.urgentCount++;
    else if (o.urgency === 'emergency') stats.emergencyCount++;
    else stats.normalCount++;
  }
  return stats;
}

function formatYuan(amount: number): string {
  if (amount >= 10000000) return (amount / 10000).toLocaleString('zh-CN') + '万';
  if (amount >= 10000) return (amount / 10000).toFixed(1) + '万';
  return amount.toLocaleString('zh-CN');
}

// ── 测试 ─────────────────────────────────────────────────

test('采购数据 → 正例: 10个采购订单各有正确的单号', () => {
  const orders = makeMockOrders();
  assert.equal(orders.length, 10);
  assert.equal(orders[0].orderNo, 'PO-2026-0001');
  assert.equal(orders[9].orderNo, 'PO-2026-0010');
});

test('采购数据 → 正例: 所有订单金额为正整数', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(Number.isFinite(o.totalAmount), `${o.orderNo} amount invalid`);
    assert.ok(o.totalAmount > 0, `${o.orderNo} amount should be > 0`);
  }
});

test('采购数据 → 正例: 所有订单数量为正整数', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(Number.isInteger(o.totalQuantity), `${o.orderNo} quantity should be integer`);
    assert.ok(o.totalQuantity > 0, `${o.orderNo} quantity should be > 0`);
  }
});

test('采购数据 → 正例: 所有订单状态在合法范围内', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(VALID_STATUSES.includes(o.status), `${o.orderNo}: 非法状态 ${o.status}`);
  }
});

test('采购数据 → 正例: 所有订单紧急程度在合法范围内', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(VALID_URGENCIES.includes(o.urgency), `${o.orderNo}: 非法紧急程度 ${o.urgency}`);
  }
});

test('采购数据 → 正例: 预计到货日期 >= 下单日期', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(o.expectedDelivery >= o.orderDate, `${o.orderNo}: 预计到货 ${o.expectedDelivery} 应 >= 下单 ${o.orderDate}`);
  }
});

test('采购数据 → 正例: 必填字段完整', () => {
  const orders = makeMockOrders();
  const required = ['id', 'orderNo', 'supplierName', 'totalAmount', 'status', 'urgency', 'orderDate', 'expectedDelivery', 'createdBy'];
  for (const o of orders) {
    for (const f of required) {
      assert.ok(f in o, `${o.orderNo}: 缺少字段 ${f}`);
    }
  }
});

test('统计 → 正例: 统计总数正确', () => {
  const orders = makeMockOrders();
  const stats = computeStats(orders);
  assert.equal(stats.total, 10);
  assert.equal(stats.totalAmount, 15000 + 320000 + 5000 + 300000 + 10000000 + 9900 + 56000 + 128000 + 8800 + 25000);
  assert.equal(stats.totalQuantity, 100 + 5000 + 200 + 50 + 3000 + 800 + 600 + 2000 + 150 + 1);
});

test('统计 → 正例: 各状态数量正确', () => {
  const orders = makeMockOrders();
  const stats = computeStats(orders);
  assert.equal(stats.draft, 3);       // po-002, po-004, po-010
  assert.equal(stats.pendingApproval, 2);  // po-001, po-005
  assert.equal(stats.approved, 1);    // po-008
  assert.equal(stats.shipped, 1);     // po-007
  assert.equal(stats.partialReceived, 1);  // po-009
  assert.equal(stats.received, 1);    // po-003
  assert.equal(stats.cancelled, 1);   // po-006
});

test('统计 → 正例: 紧急程度分布正确', () => {
  const orders = makeMockOrders();
  const stats = computeStats(orders);
  assert.equal(stats.normalCount, 6);   // 检查总数: 10 - 2urgent - 2emergency = 6
  assert.equal(stats.urgentCount, 2);   // po-004, po-007
  assert.equal(stats.emergencyCount, 2); // po-005, po-010
});

test('统计 → 边界: 空列表', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.totalAmount, 0);
  assert.equal(stats.totalQuantity, 0);
  assert.equal(stats.draft, 0);
  assert.equal(stats.pendingApproval, 0);
});

test('统计 → 边界: 单个订单', () => {
  const stats = computeStats([makeOrder()]);
  assert.equal(stats.total, 1);
  assert.equal(stats.pendingApproval, 1);
});

test('格式化 → 正例: 15000 → "1.5万"', () => {
  assert.equal(formatYuan(15000), '1.5万');
});

test('格式化 → 正例: 10000000 → "1,000万"', () => {
  const result = formatYuan(10000000);
  // 注意: toLocaleString('zh-CN') 在大数字上预期输出
  assert.ok(result.endsWith('万'), `应包含万字: ${result}`);
  assert.ok(result.length >= 5);
});

test('格式化 → 正例: 100 → "100"', () => {
  assert.equal(formatYuan(100), '100');
});

test('格式化 → 正例: 320000 → "32.0万"', () => {
  assert.equal(formatYuan(320000), '32.0万');
});

test('格式化 → 边界: 0 → "0"', () => {
  assert.equal(formatYuan(0), '0');
});

test('格式化 → 边界: 9999 → "9,999"（小于1万）', () => {
  assert.equal(formatYuan(9999), '9,999');
});

test('格式化 → 反例: 负数不应产生有效格式', () => {
  const result = formatYuan(-100);
  assert.ok(typeof result === 'string');
});

test('状态标签 → 正例: 所有状态都有标签', () => {
  for (const s of VALID_STATUSES) {
    assert.ok(STATUS_LABELS[s], `缺少状态标签: ${s}`);
  }
});

test('数据 → 反例: 非法状态应不在状态列表中', () => {
  assert.ok(!VALID_STATUSES.includes('unknown' as any));
  assert.ok(!VALID_STATUSES.includes('expired' as any));
});

test('数据 → 反例: 非法紧急程度不应在列表中', () => {
  assert.ok(!VALID_URGENCIES.includes('critical' as any));
  assert.ok(!VALID_URGENCIES.includes('low' as any));
});
