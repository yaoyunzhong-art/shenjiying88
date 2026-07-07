/**
 * TOB 库存详情页 — 常量与辅助函数
 * 从 page.tsx 分离，避免 Next.js App Router 对导出的严格校验
 */

export type TobStockStatus = 'normal' | 'low' | 'critical' | 'out_of_stock' | 'overstocked';

export const STATUS_LABELS: Record<TobStockStatus, string> = {
  normal: '正常',
  low: '偏低',
  critical: '告急',
  out_of_stock: '缺货',
  overstocked: '过剩',
};

export const STATUS_COLORS: Record<TobStockStatus, string> = {
  normal: '#059669',
  low: '#d97706',
  critical: '#dc2626',
  out_of_stock: '#991b1b',
  overstocked: '#7c3aed',
};

export const STATUS_FLOW: TobStockStatus[] = ['out_of_stock', 'critical', 'low', 'normal', 'overstocked'];

export const NEXT_STATUS: Partial<Record<TobStockStatus, TobStockStatus>> = {
  out_of_stock: 'critical',
  critical: 'low',
  low: 'normal',
  normal: 'overstocked',
};

export const PREV_STATUS: Partial<Record<TobStockStatus, TobStockStatus>> = {
  overstocked: 'normal',
  normal: 'low',
  low: 'critical',
  critical: 'out_of_stock',
};

export function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(2)}万`;
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export function calcMarginPercent(item: { price: number; costPrice: number }): number {
  return item.price > 0 ? ((item.price - item.costPrice) / item.price) * 100 : 0;
}

export interface TobStockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  price: number;
  costPrice: number;
  supplier: string;
  warehouse: string;
  manager: string;
  updatedAt: string;
  createdAt: string;
  status: TobStockStatus;
  description: string;
}

export const MOCK_ITEMS: Record<string, TobStockItem> = {
  '1': {
    id: '1', sku: 'TOB-SKU-001', name: '企业级面部识别终端 Pro', category: '智能硬件',
    quantity: 120, minThreshold: 30, maxThreshold: 300, unit: '台',
    price: 12800, costPrice: 7800,
    supplier: '深圳智能设备有限公司',
    warehouse: '华南总仓-A区',
    manager: '张经理',
    updatedAt: '2026-06-28 14:30', createdAt: '2026-01-10 09:00',
    status: 'normal',
    description: '支持活体检测、红外测温、人脸识别门禁一体机，适用于企业办公场景。',
  },
  '2': {
    id: '2', sku: 'TOB-SKU-002', name: '门店智能收银一体机', category: '智能硬件',
    quantity: 8, minThreshold: 20, maxThreshold: 100, unit: '台',
    price: 6800, costPrice: 4200,
    supplier: '杭州商业设备科技有限公司',
    warehouse: '华东仓-B区',
    manager: '李主管',
    updatedAt: '2026-06-28 09:15', createdAt: '2026-03-05 10:00',
    status: 'critical',
    description: '15.6寸触控屏，支持扫码/NFC/刷卡支付，预装门店管理系统。',
  },
  '3': {
    id: '3', sku: 'TOB-SKU-003', name: '会员营销 SaaS 年卡', category: '软件服务',
    quantity: 0, minThreshold: 10, maxThreshold: 500, unit: '份',
    price: 9800, costPrice: 2000,
    supplier: '自研产品',
    warehouse: '数字交付',
    manager: '王运营',
    updatedAt: '2026-06-27 18:00', createdAt: '2026-04-01 14:00',
    status: 'out_of_stock',
    description: '含会员管理、精准营销、数据分析模块，按年订阅。',
  },
};
