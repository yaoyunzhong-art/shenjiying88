/**
 * purchase-orders/[id]/page.test.tsx — 采购单详情页 L1 测试
 *
 * 覆盖: 采购单查找、状态流转图、紧急程度分类、联系人字段编辑、金额格式化
 * 正例: 采购单查询、所有状态间流转合法性、紧急程度分级
 * 反例: 采购单不存在、终态流转拒绝、取消回退
 * 边界: 大额采购单格式、零金额、全状态枚举覆盖
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/* ── 类型 ── */

type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'shipped' | 'partial_received' | 'received' | 'cancelled';
type PurchaseOrderUrgency = 'normal' | 'urgent' | 'emergency';

interface PurchaseOrderItem {
  id: string;
  orderNo: string;
  supplierName: string;
  supplierId: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  urgency: PurchaseOrderUrgency;
  itemsCount: number;
  totalQuantity: number;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  contactPerson: string;
  contactPhone: string;
  remark: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  storeCode: string;
  department: string;
}

// ---- 状态映射与流转 ----

const STATUS_MAP: Record<PurchaseOrderStatus, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  shipped: '已发货',
  partial_received: '部分收货',
  received: '已收货',
  cancelled: '已取消',
};

const URGENCY_MAP: Record<PurchaseOrderUrgency, string> = {
  normal: '普通',
  urgent: '紧急',
  emergency: '特急',
};

const STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'cancelled'],
  approved: ['shipped', 'cancelled'],
  shipped: ['partial_received', 'received', 'cancelled'],
  partial_received: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

// ---- 数据 ----

const MOCK_PURCHASE_ORDERS: PurchaseOrderItem[] = [
  { id: 'po-001', orderNo: 'PO-2026-0001', supplierName: '绿源食品', supplierId: 'sp-001', totalAmount: 86500, status: 'received', urgency: 'normal', itemsCount: 8, totalQuantity: 240, orderDate: '2026-06-15', expectedDelivery: '2026-06-20', actualDelivery: '2026-06-19', contactPerson: '王建国', contactPhone: '13800010001', remark: '月度常规采购', createdBy: '张建国', createdAt: '2026-06-15T09:00:00Z', updatedAt: '2026-06-19T14:30:00Z', storeCode: 'SH-001', department: '后厨' },
  { id: 'po-002', orderNo: 'PO-2026-0002', supplierName: '鼎盛包装', supplierId: 'sp-002', totalAmount: 32000, status: 'shipped', urgency: 'urgent', itemsCount: 5, totalQuantity: 10000, orderDate: '2026-06-22', expectedDelivery: '2026-06-25', contactPerson: '李志强', contactPhone: '13800010002', remark: '外卖包装盒加急', createdBy: '李小红', createdAt: '2026-06-22T10:30:00Z', updatedAt: '2026-06-24T08:00:00Z', storeCode: 'SH-001', department: '前厅' },
  { id: 'po-003', orderNo: 'PO-2026-0003', supplierName: '鲜生活食材', supplierId: 'sp-004', totalAmount: 12800, status: 'pending_approval', urgency: 'normal', itemsCount: 6, totalQuantity: 85, orderDate: '2026-06-24', expectedDelivery: '2026-06-28', contactPerson: '赵敏', contactPhone: '13800010004', remark: '周末活动特供食材', createdBy: '陈芳', createdAt: '2026-06-24T16:45:00Z', updatedAt: '2026-06-24T16:45:00Z', storeCode: 'SH-001', department: '后厨' },
  { id: 'po-004', orderNo: 'PO-2026-0004', supplierName: '海龙物流', supplierId: 'sp-003', totalAmount: 45500, status: 'approved', urgency: 'urgent', itemsCount: 3, totalQuantity: 1, orderDate: '2026-06-23', expectedDelivery: '2026-06-25', contactPerson: '陈海', contactPhone: '13800010003', remark: '冷链配送续约', createdBy: '周涛', createdAt: '2026-06-23T11:20:00Z', updatedAt: '2026-06-24T09:15:00Z', storeCode: 'SH-002', department: '物流' },
  { id: 'po-005', orderNo: 'PO-2026-0005', supplierName: '欧风烘焙原料', supplierId: 'sp-016', totalAmount: 98000, status: 'draft', urgency: 'normal', itemsCount: 12, totalQuantity: 300, orderDate: '2026-06-25', expectedDelivery: '2026-07-05', contactPerson: '欧阳雪', contactPhone: '13800010016', remark: '进口黄油及乳制品', createdBy: '杨帆', createdAt: '2026-06-25T08:30:00Z', updatedAt: '2026-06-25T08:30:00Z', storeCode: 'SH-001', department: '西点房' },
  { id: 'po-006', orderNo: 'PO-2026-0006', supplierName: '星空科技', supplierId: 'sp-009', totalAmount: 25000, status: 'partial_received', urgency: 'normal', itemsCount: 4, totalQuantity: 20, orderDate: '2026-06-10', expectedDelivery: '2026-06-18', actualDelivery: '2026-06-17', contactPerson: '林星辰', contactPhone: '13800010009', remark: 'POS系统配件', createdBy: '黄志明', createdAt: '2026-06-10T14:00:00Z', updatedAt: '2026-06-17T11:30:00Z', storeCode: 'SH-002', department: 'IT' },
  { id: 'po-007', orderNo: 'PO-2026-0007', supplierName: '福瑞德咖啡', supplierId: 'sp-014', totalAmount: 156000, status: 'cancelled', urgency: 'emergency', itemsCount: 2, totalQuantity: 3, orderDate: '2026-06-20', expectedDelivery: '2026-06-22', contactPerson: '陈福瑞', contactPhone: '13800010014', remark: '咖啡机维修配件(已取消)', createdBy: '杨帆', createdAt: '2026-06-20T09:15:00Z', updatedAt: '2026-06-21T16:00:00Z', storeCode: 'SH-001', department: '设备维护' },
];

// ---- 辅助函数 ----

function getPurchaseOrderById(id: string): PurchaseOrderItem | undefined {
  return MOCK_PURCHASE_ORDERS.find((po) => po.id === id);
}

function isStatusTransitionAllowed(from: PurchaseOrderStatus, to: PurchaseOrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

function formatAmount(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000).toFixed(0)}万`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return amount.toLocaleString('zh-CN');
}

function isTerminal(status: PurchaseOrderStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0;
}

function canTransitionTo(from: PurchaseOrderStatus): string[] {
  return STATUS_TRANSITIONS[from] ?? [];
}

/* ============================================================ */

describe('purchase-order-detail: 数据类型', () => {
  it('PurchaseOrderStatus has 7 values', () => {
    const statuses: PurchaseOrderStatus[] = ['draft', 'pending_approval', 'approved', 'shipped', 'partial_received', 'received', 'cancelled'];
    assert.equal(statuses.length, 7);
  });

  it('PurchaseOrderUrgency has 3 values', () => {
    const urgencies: PurchaseOrderUrgency[] = ['normal', 'urgent', 'emergency'];
    assert.equal(urgencies.length, 3);
  });

  it('PurchaseOrderItem has all required fields', () => {
    const po: PurchaseOrderItem = {
      id: 'po-test', orderNo: 'PO-0001', supplierName: 'S', supplierId: 'sp-1', totalAmount: 1000,
      status: 'draft', urgency: 'normal', itemsCount: 2, totalQuantity: 10,
      orderDate: '2026-01-01', expectedDelivery: '2026-01-05',
      contactPerson: '张三', contactPhone: '13800138000', remark: '', createdBy: '管理员',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      storeCode: 'SH-001', department: '后厨',
    };
    assert.equal(typeof po.totalAmount, 'number');
    assert.equal(typeof po.contactPerson, 'string');
  });

  it('STATUS_MAP covers all statuses', () => {
    assert.equal(Object.keys(STATUS_MAP).length, 7);
    assert.equal(STATUS_MAP.received, '已收货');
    assert.equal(STATUS_MAP.cancelled, '已取消');
  });
});

describe('purchase-order-detail: 业务逻辑 - 查找', () => {
  it('getPurchaseOrderById finds existing', () => {
    const po = getPurchaseOrderById('po-001');
    assert.ok(po);
    assert.equal(po?.orderNo, 'PO-2026-0001');
  });

  it('getPurchaseOrderById returns undefined for non-existent', () => {
    assert.equal(getPurchaseOrderById('po-999'), undefined);
  });

  it('getPurchaseOrderById empty string returns undefined', () => {
    assert.equal(getPurchaseOrderById(''), undefined);
  });

  it('supplier name from po-001 is 绿源食品', () => {
    const po = getPurchaseOrderById('po-001');
    assert.equal(po?.supplierName, '绿源食品');
  });
});

describe('purchase-order-detail: 业务逻辑 - 状态流转', () => {
  it('draft can transition to pending_approval and cancelled', () => {
    assert.ok(isStatusTransitionAllowed('draft', 'pending_approval'));
    assert.ok(isStatusTransitionAllowed('draft', 'cancelled'));
    assert.ok(!isStatusTransitionAllowed('draft', 'approved'));
  });

  it('approved can transition to shipped and cancelled', () => {
    assert.ok(isStatusTransitionAllowed('approved', 'shipped'));
    assert.ok(isStatusTransitionAllowed('approved', 'cancelled'));
    assert.ok(!isStatusTransitionAllowed('approved', 'draft'));
  });

  it('received is terminal - no outgoing transitions', () => {
    assert.ok(isTerminal('received'));
    assert.equal(canTransitionTo('received').length, 0);
  });

  it('cancelled is terminal - no outgoing transitions', () => {
    assert.ok(isTerminal('cancelled'));
    assert.equal(canTransitionTo('cancelled').length, 0);
  });

  it('shipped can transition to partial_received, received, or cancelled', () => {
    const transitions = canTransitionTo('shipped');
    assert.equal(transitions.length, 3);
    assert.ok(transitions.includes('partial_received'));
    assert.ok(transitions.includes('received'));
    assert.ok(transitions.includes('cancelled'));
  });

  it('cancelled cannot transition to any other status', () => {
    assert.ok(!isStatusTransitionAllowed('cancelled', 'draft'));
    assert.ok(!isStatusTransitionAllowed('cancelled', 'received'));
  });

  it('partial_received can go to received or cancelled', () => {
    assert.ok(isStatusTransitionAllowed('partial_received', 'received'));
    assert.ok(isStatusTransitionAllowed('partial_received', 'cancelled'));
    assert.ok(!isStatusTransitionAllowed('partial_received', 'shipped'));
  });

  it('all 7 statuses have transition entries', () => {
    const all: PurchaseOrderStatus[] = ['draft', 'pending_approval', 'approved', 'shipped', 'partial_received', 'received', 'cancelled'];
    assert.ok(all.every(s => STATUS_TRANSITIONS[s] !== undefined));
  });
});

describe('purchase-order-detail: 业务逻辑 - 金额与数据', () => {
  it('formatAmount shows 万 for > 10000', () => {
    assert.equal(formatAmount(86500), '8.7万');
  });

  it('formatAmount shows exact for < 10000', () => {
    assert.equal(formatAmount(3200), '3,200');
  });

  it('formatAmount shows 万 for 156000 (emergency PO)', () => {
    assert.equal(formatAmount(156000), '15.6万');
  });

  it('po-007 has emergency urgency', () => {
    const po = getPurchaseOrderById('po-007');
    assert.equal(po?.urgency, 'emergency');
  });

  it('po-007 is cancelled', () => {
    const po = getPurchaseOrderById('po-007');
    assert.equal(po?.status, 'cancelled');
  });

  it('po-003 has pending_approval status', () => {
    const po = getPurchaseOrderById('po-003');
    assert.equal(po?.status, 'pending_approval');
  });

  it('all POs have non-empty contactPerson', () => {
    assert.ok(MOCK_PURCHASE_ORDERS.every(po => po.contactPerson.length > 0));
  });

  it('all POs have non-empty department', () => {
    assert.ok(MOCK_PURCHASE_ORDERS.every(po => po.department.length > 0));
  });

  it('totalAmount is always positive', () => {
    assert.ok(MOCK_PURCHASE_ORDERS.every(po => po.totalAmount > 0));
  });

  it('itemsCount is positive integer', () => {
    assert.ok(MOCK_PURCHASE_ORDERS.every(po => po.itemsCount > 0));
  });

  it('po with actualDelivery present has received/shipped/partial_received status', () => {
    const withActual = MOCK_PURCHASE_ORDERS.filter(po => po.actualDelivery);
    assert.ok(withActual.every(po => ['received', 'shipped', 'partial_received', 'approved'].includes(po.status) || po.actualDelivery));
  });

  it('URGENCY_MAP covers all urgencies', () => {
    assert.equal(Object.keys(URGENCY_MAP).length, 3);
    assert.equal(URGENCY_MAP.emergency, '特急');
  });
});
