// ---- 采购单管理数据类型与 Mock 数据 ----

export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'shipped' | 'partial_received' | 'received' | 'cancelled';
export type PurchaseOrderUrgency = 'normal' | 'urgent' | 'emergency';

export interface PurchaseOrderItem {
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

export const PURCHASE_ORDER_STATUS_MAP: Record<PurchaseOrderStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'danger' | 'pending' | 'neutral' }> = {
  draft: { label: '草稿', variant: 'neutral' },
  pending_approval: { label: '待审批', variant: 'pending' },
  approved: { label: '已批准', variant: 'info' },
  shipped: { label: '已发货', variant: 'warning' },
  partial_received: { label: '部分收货', variant: 'warning' },
  received: { label: '已收货', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
};

export const PURCHASE_ORDER_URGENCY_MAP: Record<PurchaseOrderUrgency, { label: string; variant: 'info' | 'warning' | 'danger' }> = {
  normal: { label: '普通', variant: 'info' },
  urgent: { label: '紧急', variant: 'warning' },
  emergency: { label: '特急', variant: 'danger' },
};

export const PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = [
  'draft', 'pending_approval', 'approved', 'shipped', 'partial_received', 'received', 'cancelled',
];

export const PURCHASE_ORDER_URGENCIES: PurchaseOrderUrgency[] = ['normal', 'urgent', 'emergency'];

export const PURCHASE_ORDER_LIST_SEARCH_FIELDS: (keyof PurchaseOrderItem)[] = [
  'orderNo', 'supplierName', 'contactPerson', 'department', 'storeCode',
];

export const MOCK_PURCHASE_ORDERS: PurchaseOrderItem[] = [
  { id: 'po-001', orderNo: 'PO-2026-0001', supplierName: '绿源食品有限公司', supplierId: 'sp-001', totalAmount: 86500, status: 'received', urgency: 'normal', itemsCount: 8, totalQuantity: 240, orderDate: '2026-06-15', expectedDelivery: '2026-06-20', actualDelivery: '2026-06-19', contactPerson: '王建国', contactPhone: '13800010001', remark: '月度常规采购', createdBy: '张建国', createdAt: '2026-06-15T09:00:00Z', updatedAt: '2026-06-19T14:30:00Z', storeCode: 'SH-001', department: '后厨' },
  { id: 'po-002', orderNo: 'PO-2026-0002', supplierName: '鼎盛包装科技有限公司', supplierId: 'sp-002', totalAmount: 32000, status: 'shipped', urgency: 'urgent', itemsCount: 5, totalQuantity: 10000, orderDate: '2026-06-22', expectedDelivery: '2026-06-25', contactPerson: '李志强', contactPhone: '13800010002', remark: '外卖包装盒加急', createdBy: '李小红', createdAt: '2026-06-22T10:30:00Z', updatedAt: '2026-06-24T08:00:00Z', storeCode: 'SH-001', department: '前厅' },
  { id: 'po-003', orderNo: 'PO-2026-0003', supplierName: '鲜生活食材配送', supplierId: 'sp-004', totalAmount: 12800, status: 'pending_approval', urgency: 'normal', itemsCount: 6, totalQuantity: 85, orderDate: '2026-06-24', expectedDelivery: '2026-06-28', contactPerson: '赵敏', contactPhone: '13800010004', remark: '周末活动特供食材', createdBy: '陈芳', createdAt: '2026-06-24T16:45:00Z', updatedAt: '2026-06-24T16:45:00Z', storeCode: 'SH-001', department: '后厨' },
  { id: 'po-004', orderNo: 'PO-2026-0004', supplierName: '海龙物流集团', supplierId: 'sp-003', totalAmount: 45500, status: 'approved', urgency: 'urgent', itemsCount: 3, totalQuantity: 1, orderDate: '2026-06-23', expectedDelivery: '2026-06-25', contactPerson: '陈海', contactPhone: '13800010003', remark: '冷链配送服务续约', createdBy: '周涛', createdAt: '2026-06-23T11:20:00Z', updatedAt: '2026-06-24T09:15:00Z', storeCode: 'SH-002', department: '物流' },
  { id: 'po-005', orderNo: 'PO-2026-0005', supplierName: '欧风烘焙原料进口', supplierId: 'sp-016', totalAmount: 98000, status: 'draft', urgency: 'normal', itemsCount: 12, totalQuantity: 300, orderDate: '2026-06-25', expectedDelivery: '2026-07-05', contactPerson: '欧阳雪', contactPhone: '13800010016', remark: '进口黄油及乳制品', createdBy: '杨帆', createdAt: '2026-06-25T08:30:00Z', updatedAt: '2026-06-25T08:30:00Z', storeCode: 'SH-001', department: '西点房' },
  { id: 'po-006', orderNo: 'PO-2026-0006', supplierName: '星空科技服务有限公司', supplierId: 'sp-009', totalAmount: 25000, status: 'partial_received', urgency: 'normal', itemsCount: 4, totalQuantity: 20, orderDate: '2026-06-10', expectedDelivery: '2026-06-18', actualDelivery: '2026-06-17', contactPerson: '林星辰', contactPhone: '13800010009', remark: 'POS系统维护配件', createdBy: '黄志明', createdAt: '2026-06-10T14:00:00Z', updatedAt: '2026-06-17T11:30:00Z', storeCode: 'SH-002', department: 'IT' },
  { id: 'po-007', orderNo: 'PO-2026-0007', supplierName: '福瑞德咖啡设备有限公司', supplierId: 'sp-014', totalAmount: 156000, status: 'cancelled', urgency: 'emergency', itemsCount: 2, totalQuantity: 3, orderDate: '2026-06-20', expectedDelivery: '2026-06-22', contactPerson: '陈福瑞', contactPhone: '13800010014', remark: '咖啡机紧急维修配件（已取消，改为现场维修）', createdBy: '杨帆', createdAt: '2026-06-20T09:15:00Z', updatedAt: '2026-06-21T16:00:00Z', storeCode: 'SH-001', department: '设备维护' },
  { id: 'po-008', orderNo: 'PO-2026-0008', supplierName: '华北粮油批发市场', supplierId: 'sp-012', totalAmount: 67500, status: 'received', urgency: 'normal', itemsCount: 10, totalQuantity: 500, orderDate: '2026-06-18', expectedDelivery: '2026-06-22', actualDelivery: '2026-06-21', contactPerson: '郑大勇', contactPhone: '13800010012', remark: '米面油月度采购', createdBy: '王伟', createdAt: '2026-06-18T07:30:00Z', updatedAt: '2026-06-21T15:00:00Z', storeCode: 'SH-001', department: '后厨' },
  { id: 'po-009', orderNo: 'PO-2026-0009', supplierName: 'Global Trade Logistics Inc.', supplierId: 'sp-010', totalAmount: 320000, status: 'shipped', urgency: 'urgent', itemsCount: 1, totalQuantity: 1, orderDate: '2026-06-01', expectedDelivery: '2026-06-30', contactPerson: 'John Miller', contactPhone: '14150001001', remark: '跨境物流季度服务', createdBy: 'James Smith', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-24T12:00:00Z', storeCode: 'SH-002', department: '供应链' },
  { id: 'po-010', orderNo: 'PO-2026-0010', supplierName: '鲜生活食材配送', supplierId: 'sp-004', totalAmount: 9200, status: 'pending_approval', urgency: 'emergency', itemsCount: 3, totalQuantity: 40, orderDate: '2026-06-25', expectedDelivery: '2026-06-26', contactPerson: '赵敏', contactPhone: '13800010004', remark: '明日店庆活动紧急补货', createdBy: '李小红', createdAt: '2026-06-25T19:00:00Z', updatedAt: '2026-06-25T19:00:00Z', storeCode: 'SH-001', department: '前厅' },
  { id: 'po-011', orderNo: 'PO-2026-0011', supplierName: '恒达包装材料厂', supplierId: 'sp-007', totalAmount: 15000, status: 'draft', urgency: 'normal', itemsCount: 4, totalQuantity: 5000, orderDate: '2026-06-24', expectedDelivery: '2026-07-01', contactPerson: '李恒', contactPhone: '13800010007', remark: '常规包装袋补货', createdBy: '张建国', createdAt: '2026-06-24T13:00:00Z', updatedAt: '2026-06-24T13:00:00Z', storeCode: 'SH-001', department: '前厅' },
  { id: 'po-012', orderNo: 'PO-2026-0012', supplierName: 'Eco Pack Solutions Ltd.', supplierId: 'sp-011', totalAmount: 78500, status: 'approved', urgency: 'normal', itemsCount: 7, totalQuantity: 20000, orderDate: '2026-06-20', expectedDelivery: '2026-07-10', contactPerson: 'Sarah Connor', contactPhone: '12120001001', remark: '环保包装盒（出口订单）', createdBy: 'Emily Chen', createdAt: '2026-06-20T15:30:00Z', updatedAt: '2026-06-22T10:00:00Z', storeCode: 'SH-002', department: '出口贸易' },
  { id: 'po-013', orderNo: 'PO-2026-0013', supplierName: '西南冷链物流有限公司', supplierId: 'sp-013', totalAmount: 44000, status: 'pending_approval', urgency: 'normal', itemsCount: 2, totalQuantity: 1, orderDate: '2026-06-23', expectedDelivery: '2026-07-01', contactPerson: '张凯', contactPhone: '13800010013', remark: '新供应商试合作（冷链）', createdBy: '周涛', createdAt: '2026-06-23T08:45:00Z', updatedAt: '2026-06-23T08:45:00Z', storeCode: 'SH-002', department: '供应链' },
  { id: 'po-014', orderNo: 'PO-2026-0014', supplierName: '绿源食品有限公司', supplierId: 'sp-001', totalAmount: 43200, status: 'partial_received', urgency: 'normal', itemsCount: 6, totalQuantity: 180, orderDate: '2026-06-19', expectedDelivery: '2026-06-24', actualDelivery: '2026-06-23', contactPerson: '王建国', contactPhone: '13800010001', remark: '蔬菜水果补货', createdBy: '张建国', createdAt: '2026-06-19T08:00:00Z', updatedAt: '2026-06-23T16:30:00Z', storeCode: 'SH-001', department: '后厨' },
  { id: 'po-015', orderNo: 'PO-2026-0015', supplierName: '嘉华物业管理有限公司', supplierId: 'sp-006', totalAmount: 12000, status: 'draft', urgency: 'normal', itemsCount: 3, totalQuantity: 6, orderDate: '2025-06-25', expectedDelivery: '2026-07-05', contactPerson: '周建华', contactPhone: '13800010006', remark: '清洁用品采购', createdBy: '周涛', createdAt: '2026-06-25T11:20:00Z', updatedAt: '2026-06-25T11:20:00Z', storeCode: 'SH-002', department: '后勤' },
];

export function getPurchaseOrderById(id: string): PurchaseOrderItem | undefined {
  return MOCK_PURCHASE_ORDERS.find((po) => po.id === id);
}

export interface PurchaseOrderStats {
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

export function computePurchaseOrderStats(items: PurchaseOrderItem[]): PurchaseOrderStats {
  return {
    total: items.length,
    draft: items.filter((i) => i.status === 'draft').length,
    pendingApproval: items.filter((i) => i.status === 'pending_approval').length,
    approved: items.filter((i) => i.status === 'approved').length,
    shipped: items.filter((i) => i.status === 'shipped').length,
    partialReceived: items.filter((i) => i.status === 'partial_received').length,
    received: items.filter((i) => i.status === 'received').length,
    cancelled: items.filter((i) => i.status === 'cancelled').length,
    urgentCount: items.filter((i) => i.urgency === 'urgent').length + items.filter((i) => i.urgency === 'emergency').length,
    emergencyCount: items.filter((i) => i.urgency === 'emergency').length,
    totalAmount: items.reduce((s, i) => s + i.totalAmount, 0),
    totalQuantity: items.reduce((s, i) => s + i.totalQuantity, 0),
  };
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000).toFixed(0)}万`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return amount.toLocaleString('zh-CN');
}
