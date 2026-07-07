/**
 * inventory-data.ts — 进销存 Mock 数据与类型定义
 */

// ===================== 类型定义 =====================

export interface SKU {
  skuId: string;
  productId: string;
  skuCode: string;
  name: string;
  specs: Record<string, string>;
  stock: number;
  safetyStock: number;
  costPrice: number;
  retailPrice: number;
}

export interface Product {
  productId: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type POStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  itemId: string;
  skuId: string;
  skuName: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  poId: string;
  poNo: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  appliedAt: string;
  approvedAt: string | null;
  receivedAt: string | null;
}

export type CheckStatus = 'draft' | 'in_progress' | 'completed';

export interface InventoryCheckItem {
  itemId: string;
  skuId: string;
  skuName: string;
  bookStock: number;
  actualStock: number;
  difference: number;
}

export interface InventoryCheck {
  checkId: string;
  checkNo: string;
  storeId: string;
  storeName: string;
  status: CheckStatus;
  items: InventoryCheckItem[];
  checkedAt: string | null;
  completedAt: string | null;
}

export type TransferStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
export type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse';

export interface CrossStoreTransferItem {
  itemId: string;
  skuId: string;
  skuName: string;
  quantity: number;
  costPrice: number;
}

export interface CrossStoreTransfer {
  transferId: string;
  transferNo: string;
  type: TransferType;
  fromStore: string;
  toStore: string;
  status: TransferStatus;
  items: CrossStoreTransferItem[];
  totalCost: number;
  applicant: string;
  approver: string;
  appliedAt: string;
  approvedAt: string | null;
  executedAt: string | null;
  receivedAt: string | null;
}

export interface StoreStats {
  storeId: string;
  storeName: string;
  totalProducts: number;
  totalSKUs: number;
  totalStock: number;
  lowStockAlerts: number;
  outOfStock: number;
}

// ===================== 常量 =====================

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  received: '已收货',
  cancelled: '已取消',
};

export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  draft: '待盘点',
  in_progress: '盘点中',
  completed: '已完成',
};

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  in_transit: '调拨中',
  completed: '已完成',
  cancelled: '已取消',
};

export const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店⇄门店',
  warehouse_to_store: '仓库→门店',
  store_to_warehouse: '门店→仓库',
};

// ===================== Mock 数据 =====================

export const MOCK_PRODUCTS: Product[] = [
  { productId: 'P001', name: '氨基酸洁面乳', category: '护肤', brand: '花西子', unit: '支', status: 'active', createdAt: '2026-01-15' },
  { productId: 'P002', name: '玻尿酸保湿水', category: '护肤', brand: '花西子', unit: '瓶', status: 'active', createdAt: '2026-01-15' },
  { productId: 'P003', name: '胶原蛋白面霜', category: '护肤', brand: '花西子', unit: '罐', status: 'active', createdAt: '2026-01-20' },
  { productId: 'P004', name: '防晒隔离霜 SPF50', category: '彩妆', brand: '花西子', unit: '支', status: 'active', createdAt: '2026-02-01' },
  { productId: 'P005', name: '玫瑰精华液', category: '护肤', brand: '花西子', unit: '瓶', status: 'active', createdAt: '2026-02-10' },
  { productId: 'P006', name: '控油爽肤水', category: '护肤', brand: '花西子', unit: '瓶', status: 'active', createdAt: '2026-02-15' },
  { productId: 'P007', name: '柔雾持妆粉底液', category: '彩妆', brand: '花西子', unit: '支', status: 'active', createdAt: '2026-03-01' },
  { productId: 'P008', name: '纤长睫毛膏', category: '彩妆', brand: '花西子', unit: '支', status: 'active', createdAt: '2026-03-05' },
  { productId: 'P009', name: '保湿润唇膏', category: '护肤', brand: '花西子', unit: '支', status: 'active', createdAt: '2026-03-10' },
  { productId: 'P010', name: '卸妆油', category: '护肤', brand: '花西子', unit: '瓶', status: 'active', createdAt: '2026-03-15' },
];

export const MOCK_SKUS: SKU[] = [
  // P001 氨基酸洁面乳
  { skuId: 'S001-1', productId: 'P001', skuCode: 'SKU-P001-50ml', name: '氨基酸洁面乳 50ml', specs: { '规格': '50ml' }, stock: 120, safetyStock: 20, costPrice: 25, retailPrice: 68 },
  { skuId: 'S001-2', productId: 'P001', skuCode: 'SKU-P001-100ml', name: '氨基酸洁面乳 100ml', specs: { '规格': '100ml' }, stock: 85, safetyStock: 15, costPrice: 42, retailPrice: 108 },
  // P002 玻尿酸保湿水
  { skuId: 'S002-1', productId: 'P002', skuCode: 'SKU-P002-120ml', name: '玻尿酸保湿水 120ml', specs: { '规格': '120ml' }, stock: 60, safetyStock: 10, costPrice: 55, retailPrice: 158 },
  { skuId: 'S002-2', productId: 'P002', skuCode: 'SKU-P002-200ml', name: '玻尿酸保湿水 200ml', specs: { '规格': '200ml' }, stock: 42, safetyStock: 8, costPrice: 88, retailPrice: 238 },
  // P003 胶原蛋白面霜
  { skuId: 'S003-1', productId: 'P003', skuCode: 'SKU-P003-50g', name: '胶原蛋白面霜 50g', specs: { '规格': '50g' }, stock: 38, safetyStock: 10, costPrice: 68, retailPrice: 198 },
  // P004 防晒隔离霜
  { skuId: 'S004-1', productId: 'P004', skuCode: 'SKU-P004-30ml', name: '防晒隔离霜 SPF50 30ml', specs: { '规格': '30ml' }, stock: 95, safetyStock: 20, costPrice: 48, retailPrice: 128 },
  { skuId: 'S004-2', productId: 'P004', skuCode: 'SKU-P004-50ml', name: '防晒隔离霜 SPF50 50ml', specs: { '规格': '50ml' }, stock: 12, safetyStock: 15, costPrice: 72, retailPrice: 188 },
  // P005 玫瑰精华液
  { skuId: 'S005-1', productId: 'P005', skuCode: 'SKU-P005-30ml', name: '玫瑰精华液 30ml', specs: { '规格': '30ml' }, stock: 55, safetyStock: 10, costPrice: 78, retailPrice: 218 },
  // P006 控油爽肤水
  { skuId: 'S006-1', productId: 'P006', skuCode: 'SKU-P006-150ml', name: '控油爽肤水 150ml', specs: { '规格': '150ml' }, stock: 0, safetyStock: 12, costPrice: 38, retailPrice: 98 },
  // P007 粉底液
  { skuId: 'S007-1', productId: 'P007', skuCode: 'SKU-P007-01', name: '柔雾持妆粉底液 01自然色', specs: { '色号': '01自然色' }, stock: 73, safetyStock: 15, costPrice: 58, retailPrice: 158 },
  { skuId: 'S007-2', productId: 'P007', skuCode: 'SKU-P007-02', name: '柔雾持妆粉底液 02象牙白', specs: { '色号': '02象牙白' }, stock: 68, safetyStock: 15, costPrice: 58, retailPrice: 158 },
  // P008 睫毛膏
  { skuId: 'S008-1', productId: 'P008', skuCode: 'SKU-P008-BK', name: '纤长睫毛膏 BK黑色', specs: { '颜色': 'BK黑色' }, stock: 110, safetyStock: 20, costPrice: 32, retailPrice: 88 },
  // P009 润唇膏
  { skuId: 'S009-1', productId: 'P009', skuCode: 'SKU-P009-rose', name: '保湿润唇膏 玫瑰味', specs: { '口味': '玫瑰味' }, stock: 200, safetyStock: 30, costPrice: 12, retailPrice: 38 },
  // P010 卸妆油
  { skuId: 'S010-1', productId: 'P010', skuCode: 'SKU-P010-150ml', name: '卸妆油 150ml', specs: { '规格': '150ml' }, stock: 45, safetyStock: 10, costPrice: 35, retailPrice: 88 },
];

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    poId: 'PO2026070101',
    poNo: 'PO-20260701-001',
    supplierId: 'SUP001',
    supplierName: '杭州花西子供应链',
    status: 'approved',
    items: [
      { itemId: 'POI-001', skuId: 'S001-1', skuName: '氨基酸洁面乳 50ml', quantity: 100, receivedQuantity: 0, unitCost: 25 },
      { itemId: 'POI-002', skuId: 'S001-2', skuName: '氨基酸洁面乳 100ml', quantity: 50, receivedQuantity: 0, unitCost: 42 },
    ],
    totalAmount: 4600,
    appliedAt: '2026-07-01 09:00',
    approvedAt: '2026-07-01 10:30',
    receivedAt: null,
  },
  {
    poId: 'PO2026070102',
    poNo: 'PO-20260701-002',
    supplierId: 'SUP001',
    supplierName: '杭州花西子供应链',
    status: 'pending',
    items: [
      { itemId: 'POI-003', skuId: 'S004-2', skuName: '防晒隔离霜 SPF50 50ml', quantity: 80, receivedQuantity: 0, unitCost: 72 },
    ],
    totalAmount: 5760,
    appliedAt: '2026-07-01 14:00',
    approvedAt: null,
    receivedAt: null,
  },
  {
    poId: 'PO2026070201',
    poNo: 'PO-20260702-001',
    supplierId: 'SUP002',
    supplierName: '上海美妆批发中心',
    status: 'received',
    items: [
      { itemId: 'POI-004', skuId: 'S006-1', skuName: '控油爽肤水 150ml', quantity: 60, receivedQuantity: 60, unitCost: 38 },
    ],
    totalAmount: 2280,
    appliedAt: '2026-06-28 11:00',
    approvedAt: '2026-06-28 13:00',
    receivedAt: '2026-07-01 09:00',
  },
  {
    poId: 'PO2026063001',
    poNo: 'PO-20260630-001',
    supplierId: 'SUP003',
    supplierName: '广州仓储配送中心',
    status: 'cancelled',
    items: [
      { itemId: 'POI-005', skuId: 'S005-1', skuName: '玫瑰精华液 30ml', quantity: 30, receivedQuantity: 0, unitCost: 78 },
    ],
    totalAmount: 2340,
    appliedAt: '2026-06-30 08:00',
    approvedAt: null,
    receivedAt: null,
  },
  {
    poId: 'PO2026062901',
    poNo: 'PO-20260629-001',
    supplierId: 'SUP001',
    supplierName: '杭州花西子供应链',
    status: 'draft',
    items: [
      { itemId: 'POI-006', skuId: 'S007-1', skuName: '柔雾持妆粉底液 01自然色', quantity: 40, receivedQuantity: 0, unitCost: 58 },
      { itemId: 'POI-007', skuId: 'S007-2', skuName: '柔雾持妆粉底液 02象牙白', quantity: 40, receivedQuantity: 0, unitCost: 58 },
    ],
    totalAmount: 4640,
    appliedAt: '2026-06-29 16:00',
    approvedAt: null,
    receivedAt: null,
  },
];

export const MOCK_INVENTORY_CHECKS: InventoryCheck[] = [
  {
    checkId: 'IC2026070101',
    checkNo: 'CK-20260701-001',
    storeId: 'STORE001',
    storeName: '上海旗舰店',
    status: 'completed',
    items: [
      { itemId: 'ICI-001', skuId: 'S001-1', skuName: '氨基酸洁面乳 50ml', bookStock: 120, actualStock: 118, difference: -2 },
      { itemId: 'ICI-002', skuId: 'S002-1', skuName: '玻尿酸保湿水 120ml', bookStock: 60, actualStock: 60, difference: 0 },
      { itemId: 'ICI-003', skuId: 'S003-1', skuName: '胶原蛋白面霜 50g', bookStock: 38, actualStock: 35, difference: -3 },
      { itemId: 'ICI-004', skuId: 'S006-1', skuName: '控油爽肤水 150ml', bookStock: 0, actualStock: 0, difference: 0 },
    ],
    checkedAt: '2026-07-01 18:00',
    completedAt: '2026-07-01 20:30',
  },
  {
    checkId: 'IC2026070201',
    checkNo: 'CK-20260702-001',
    storeId: 'STORE002',
    storeName: '北京分店',
    status: 'in_progress',
    items: [
      { itemId: 'ICI-005', skuId: 'S004-1', skuName: '防晒隔离霜 SPF50 30ml', bookStock: 95, actualStock: 90, difference: -5 },
      { itemId: 'ICI-006', skuId: 'S005-1', skuName: '玫瑰精华液 30ml', bookStock: 55, actualStock: 55, difference: 0 },
      { itemId: 'ICI-007', skuId: 'S008-1', skuName: '纤长睫毛膏 BK黑色', bookStock: 110, actualStock: 112, difference: 2 },
    ],
    checkedAt: '2026-07-02 10:00',
    completedAt: null,
  },
  {
    checkId: 'IC2026062801',
    checkNo: 'CK-20260628-001',
    storeId: 'STORE003',
    storeName: '广州分店',
    status: 'completed',
    items: [
      { itemId: 'ICI-008', skuId: 'S009-1', skuName: '保湿润唇膏 玫瑰味', bookStock: 200, actualStock: 198, difference: -2 },
      { itemId: 'ICI-009', skuId: 'S010-1', skuName: '卸妆油 150ml', bookStock: 45, actualStock: 45, difference: 0 },
    ],
    checkedAt: '2026-06-28 14:00',
    completedAt: '2026-06-28 16:00',
  },
];

export const MOCK_TRANSFERS: CrossStoreTransfer[] = [
  {
    transferId: 'TR2026070101',
    transferNo: 'DB-20260701-001',
    type: 'warehouse_to_store',
    fromStore: '中央仓库',
    toStore: '上海旗舰店',
    status: 'in_transit',
    items: [
      { itemId: 'TRI-001', skuId: 'S001-1', skuName: '氨基酸洁面乳 50ml', quantity: 50, costPrice: 25 },
      { itemId: 'TRI-002', skuId: 'S002-1', skuName: '玻尿酸保湿水 120ml', quantity: 30, costPrice: 55 },
    ],
    totalCost: 2900,
    applicant: '张经理',
    approver: '陈主管',
    appliedAt: '2026-07-01 08:30',
    approvedAt: '2026-07-01 09:00',
    executedAt: '2026-07-01 10:00',
    receivedAt: null,
  },
  {
    transferId: 'TR2026070102',
    transferNo: 'DB-20260701-002',
    type: 'store_to_store',
    fromStore: '上海旗舰店',
    toStore: '北京分店',
    status: 'pending',
    items: [
      { itemId: 'TRI-003', skuId: 'S004-1', skuName: '防晒隔离霜 SPF50 30ml', quantity: 20, costPrice: 48 },
    ],
    totalCost: 960,
    applicant: '李店长',
    approver: '',
    appliedAt: '2026-07-01 11:00',
    approvedAt: null,
    executedAt: null,
    receivedAt: null,
  },
  {
    transferId: 'TR2026062801',
    transferNo: 'DB-20260628-001',
    type: 'store_to_warehouse',
    fromStore: '北京分店',
    toStore: '中央仓库',
    status: 'completed',
    items: [
      { itemId: 'TRI-004', skuId: 'S006-1', skuName: '控油爽肤水 150ml', quantity: 10, costPrice: 38 },
    ],
    totalCost: 380,
    applicant: '王店长',
    approver: '陈主管',
    appliedAt: '2026-06-28 14:00',
    approvedAt: '2026-06-28 15:00',
    executedAt: '2026-06-28 16:00',
    receivedAt: '2026-06-28 18:00',
  },
];

export const MOCK_STORE_STATS: StoreStats[] = [
  { storeId: 'STORE001', storeName: '上海旗舰店', totalProducts: 8, totalSKUs: 11, totalStock: 560, lowStockAlerts: 2, outOfStock: 0 },
  { storeId: 'STORE002', storeName: '北京分店', totalProducts: 6, totalSKUs: 6, totalStock: 345, lowStockAlerts: 1, outOfStock: 0 },
  { storeId: 'STORE003', storeName: '广州分店', totalProducts: 5, totalSKUs: 5, totalStock: 290, lowStockAlerts: 0, outOfStock: 0 },
];

// ===================== 辅助函数 =====================

export function getProductById(productId: string): Product | undefined {
  return MOCK_PRODUCTS.find(p => p.productId === productId);
}

export function getSKUsByProductId(productId: string): SKU[] {
  return MOCK_SKUS.filter(s => s.productId === productId);
}

export function getSKUStockStatus(sku: SKU): 'normal' | 'low' | 'out' {
  if (sku.stock === 0) return 'out';
  if (sku.stock < sku.safetyStock) return 'low';
  return 'normal';
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('zh-CN', { hour12: false });
}
