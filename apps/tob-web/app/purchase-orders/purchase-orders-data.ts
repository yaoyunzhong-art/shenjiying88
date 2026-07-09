/**
 * purchase-orders-data.ts — 采购订单 Mock 数据与类型
 */
import {
  MOCK_SKUS,
  MOCK_PURCHASE_ORDERS,
  formatCurrency,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type POStatus,
} from '../inventory/inventory-data';

export type {
  PurchaseOrder,
  PurchaseOrderItem,
  POStatus,
};

export { formatCurrency };

/** 供应商选项 */
export const SUPPLIER_OPTIONS = [
  { value: 'SUP001', label: '杭州花西子供应链' },
  { value: 'SUP002', label: '广州美妆原料有限公司' },
  { value: 'SUP003', label: '义乌包装材料厂' },
  { value: 'SUP004', label: '深圳设备科技公司' },
  { value: 'SUP005', label: '上海品牌营销物料' },
];

/** 可用 SKU 列表（展示用） */
export const AVAILABLE_SKUS = MOCK_SKUS.map((s) => ({
  value: s.skuId,
  label: `${s.name}（成本 ¥${formatCurrency(s.costPrice)}）`,
  costPrice: s.costPrice,
}));

export const PO_STATUS_OPTIONS: { value: POStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'received', label: '已收货' },
  { value: 'cancelled', label: '已取消' },
];

export interface CreatePOFormValues {
  supplierId: string;
  supplierName: string;
  items: { skuId: string; skuName: string; quantity: number; unitCost: number }[];
  remark: string;
}

export interface CreatePOFormErrors {
  supplierId?: string;
  items?: string;
}
