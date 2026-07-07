// ---- 供应商管理数据类型与 Mock 数据 ----

export interface SupplierItem {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  category: SupplierCategory;
  status: SupplierStatus;
  creditRating: SupplierCredit;
  cooperationMonths: number;
  totalOrders: number;
  totalAmount: number;
  defectRate: number; // 0-100
  avgDeliveryDays: number;
  address: string;
  marketCode: string;
  createdBy: string;
  createdAt: string;
  lastOrderAt: string;
}

export type SupplierStatus = 'active' | 'paused' | 'blacklisted' | 'pending_audit';
export type SupplierCategory = 'raw_material' | 'packaging' | 'equipment' | 'logistics' | 'service' | 'others';
export type SupplierCredit = 'AAA' | 'AA' | 'A' | 'B' | 'C';

export const SUPPLIER_STATUS_MAP: Record<SupplierStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  active: { label: '合作中', variant: 'success' },
  paused: { label: '暂停合作', variant: 'warning' },
  blacklisted: { label: '黑名单', variant: 'danger' },
  pending_audit: { label: '待审核', variant: 'info' },
};

export const SUPPLIER_CATEGORY_MAP: Record<SupplierCategory, string> = {
  raw_material: '原材料',
  packaging: '包装耗材',
  equipment: '设备',
  logistics: '物流配送',
  service: '服务',
  others: '其他',
};

export const SUPPLIER_CREDIT_MAP: Record<SupplierCredit, { label: string; color: string }> = {
  AAA: { label: 'AAA', color: '#22c55e' },
  AA: { label: 'AA', color: '#34d399' },
  A: { label: 'A', color: '#facc15' },
  B: { label: 'B', color: '#fb923c' },
  C: { label: 'C', color: '#ef4444' },
};

export const SUPPLIER_STATUSES: SupplierStatus[] = ['active', 'paused', 'blacklisted', 'pending_audit'];
export const SUPPLIER_CATEGORIES: SupplierCategory[] = ['raw_material', 'packaging', 'equipment', 'logistics', 'service', 'others'];

export const SUPPLIER_LIST_SEARCH_FIELDS: (keyof SupplierItem)[] = [
  'name', 'code', 'contactPerson', 'contactPhone', 'email', 'category', 'address',
];

export const SUPPLIER_LIST_COLUMN_KEYS: (keyof SupplierItem)[] = [
  'code', 'name', 'category', 'status', 'creditRating', 'contactPerson',
  'totalOrders', 'totalAmount', 'defectRate', 'avgDeliveryDays', 'lastOrderAt',
];

export const MOCK_SUPPLIERS: SupplierItem[] = [
  { id: 'sp-001', code: 'SUP-001', name: '绿源食品有限公司', contactPerson: '王建国', contactPhone: '13800010001', email: 'wjg@lyfood.com', category: 'raw_material', status: 'active', creditRating: 'AA', cooperationMonths: 36, totalOrders: 142, totalAmount: 3850000, defectRate: 0.8, avgDeliveryDays: 2, address: '北京市大兴区生物医药基地', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-01-15', lastOrderAt: '2026-06-20' },
  { id: 'sp-002', code: 'SUP-002', name: '鼎盛包装科技有限公司', contactPerson: '李志强', contactPhone: '13800010002', email: 'lzq@dsbz.com', category: 'packaging', status: 'active', creditRating: 'AAA', cooperationMonths: 24, totalOrders: 89, totalAmount: 1260000, defectRate: 0.3, avgDeliveryDays: 3, address: '上海市松江区新桥镇', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-06-01', lastOrderAt: '2026-06-22' },
  { id: 'sp-003', code: 'SUP-003', name: '海龙物流集团', contactPerson: '陈海', contactPhone: '13800010003', email: 'chenhai@hllog.com', category: 'logistics', status: 'active', creditRating: 'A', cooperationMonths: 48, totalOrders: 520, totalAmount: 7200000, defectRate: 1.2, avgDeliveryDays: 1, address: '广州市白云区太和镇', marketCode: 'cn-mainland', createdBy: '刘强', createdAt: '2022-08-20', lastOrderAt: '2026-06-23' },
  { id: 'sp-004', code: 'SUP-004', name: '鲜生活食材配送', contactPerson: '赵敏', contactPhone: '13800010004', email: 'zhaomin@freshlife.com', category: 'raw_material', status: 'active', creditRating: 'AAA', cooperationMonths: 18, totalOrders: 68, totalAmount: 980000, defectRate: 0.1, avgDeliveryDays: 1, address: '深圳市南山区西丽街道', marketCode: 'cn-mainland', createdBy: '李小红', createdAt: '2024-01-10', lastOrderAt: '2026-06-24' },
  { id: 'sp-005', code: 'SUP-005', name: '锦华设备制造厂', contactPerson: '钱锦华', contactPhone: '13800010005', email: 'qjh@jhdevice.com', category: 'equipment', status: 'paused', creditRating: 'B', cooperationMonths: 12, totalOrders: 6, totalAmount: 450000, defectRate: 5.5, avgDeliveryDays: 15, address: '浙江省宁波市鄞州区', marketCode: 'cn-mainland', createdBy: '陈芳', createdAt: '2024-03-15', lastOrderAt: '2025-11-05' },
  { id: 'sp-006', code: 'SUP-006', name: '嘉华物业管理有限公司', contactPerson: '周建华', contactPhone: '13800010006', email: 'zhoujh@jiahua.com', category: 'service', status: 'pending_audit', creditRating: 'A', cooperationMonths: 0, totalOrders: 0, totalAmount: 0, defectRate: 0, avgDeliveryDays: 0, address: '成都市武侯区天府大道', marketCode: 'cn-mainland', createdBy: '周涛', createdAt: '2026-06-10', lastOrderAt: '-' },
  { id: 'sp-007', code: 'SUP-007', name: '恒达包装材料厂', contactPerson: '李恒', contactPhone: '13800010007', email: 'liheng@hdpack.com', category: 'packaging', status: 'active', creditRating: 'AA', cooperationMonths: 30, totalOrders: 76, totalAmount: 890000, defectRate: 0.6, avgDeliveryDays: 4, address: '江苏省苏州市工业园区', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-04-01', lastOrderAt: '2026-06-18' },
  { id: 'sp-008', code: 'SUP-008', name: '源广达食材供应链', contactPerson: '孙广源', contactPhone: '13800010008', email: 'sgy@ygdsc.com', category: 'raw_material', status: 'blacklisted', creditRating: 'C', cooperationMonths: 6, totalOrders: 12, totalAmount: 185000, defectRate: 12.3, avgDeliveryDays: 5, address: '湖北省武汉市江汉区', marketCode: 'cn-mainland', createdBy: '赵丽', createdAt: '2024-03-01', lastOrderAt: '2024-09-20' },
  { id: 'sp-009', code: 'SUP-009', name: '星空科技服务有限公司', contactPerson: '林星辰', contactPhone: '13800010009', email: 'linx@starlight.com', category: 'service', status: 'active', creditRating: 'AA', cooperationMonths: 20, totalOrders: 34, totalAmount: 620000, defectRate: 0.4, avgDeliveryDays: 7, address: '北京市海淀区中关村', marketCode: 'cn-mainland', createdBy: '黄志明', createdAt: '2024-02-01', lastOrderAt: '2026-06-15' },
  { id: 'sp-010', code: 'SUP-010', name: 'Global Trade Logistics Inc.', contactPerson: 'John Miller', contactPhone: '14150001001', email: 'jmiller@gtl.com', category: 'logistics', status: 'active', creditRating: 'AAA', cooperationMonths: 60, totalOrders: 410, totalAmount: 15800000, defectRate: 0.2, avgDeliveryDays: 5, address: '200 Mission St, San Francisco, CA', marketCode: 'us-default', createdBy: 'James Smith', createdAt: '2021-07-01', lastOrderAt: '2026-06-24' },
  { id: 'sp-011', code: 'SUP-011', name: 'Eco Pack Solutions Ltd.', contactPerson: 'Sarah Connor', contactPhone: '12120001001', email: 'sconnor@ecopack.com', category: 'packaging', status: 'active', creditRating: 'AA', cooperationMonths: 28, totalOrders: 95, totalAmount: 2100000, defectRate: 0.5, avgDeliveryDays: 6, address: '55 Broadway, New York, NY', marketCode: 'us-default', createdBy: 'Emily Chen', createdAt: '2024-01-05', lastOrderAt: '2026-06-21' },
  { id: 'sp-012', code: 'SUP-012', name: '华北粮油批发市场', contactPerson: '郑大勇', contactPhone: '13800010012', email: 'zdy@hbliang.com', category: 'raw_material', status: 'active', creditRating: 'A', cooperationMonths: 15, totalOrders: 42, totalAmount: 1560000, defectRate: 1.5, avgDeliveryDays: 3, address: '天津市河北区粮库路18号', marketCode: 'cn-mainland', createdBy: '王伟', createdAt: '2024-04-20', lastOrderAt: '2026-06-19' },
  { id: 'sp-013', code: 'SUP-013', name: '西南冷链物流有限公司', contactPerson: '张凯', contactPhone: '13800010013', email: 'zhangk@xnll.com', category: 'logistics', status: 'pending_audit', creditRating: 'A', cooperationMonths: 0, totalOrders: 0, totalAmount: 0, defectRate: 0, avgDeliveryDays: 0, address: '重庆市渝北区回兴街道', marketCode: 'cn-mainland', createdBy: '周涛', createdAt: '2026-06-12', lastOrderAt: '-' },
  { id: 'sp-014', code: 'SUP-014', name: '福瑞德咖啡设备有限公司', contactPerson: '陈福瑞', contactPhone: '13800010014', email: 'cfr@friendcoffee.com', category: 'equipment', status: 'active', creditRating: 'AA', cooperationMonths: 42, totalOrders: 28, totalAmount: 3200000, defectRate: 0.9, avgDeliveryDays: 10, address: '广东省佛山市顺德区', marketCode: 'cn-mainland', createdBy: '杨帆', createdAt: '2022-10-01', lastOrderAt: '2026-06-10' },
  { id: 'sp-015', code: 'SUP-015', name: '悦读文化传媒', contactPerson: '文艺', contactPhone: '13800010015', email: 'wenyi@yuedu.com', category: 'others', status: 'paused', creditRating: 'B', cooperationMonths: 8, totalOrders: 5, totalAmount: 45000, defectRate: 3.0, avgDeliveryDays: 7, address: '长沙市岳麓区大学城', marketCode: 'cn-mainland', createdBy: '孙静', createdAt: '2024-11-01', lastOrderAt: '2025-08-15' },
  { id: 'sp-016', code: 'SUP-016', name: '欧风烘焙原料进口', contactPerson: '欧阳雪', contactPhone: '13800010016', email: 'oyx@oufeng.com', category: 'raw_material', status: 'active', creditRating: 'AAA', cooperationMonths: 40, totalOrders: 110, totalAmount: 4500000, defectRate: 0.1, avgDeliveryDays: 4, address: '上海市浦东新区外高桥保税区', marketCode: 'cn-mainland', createdBy: '陈芳', createdAt: '2023-01-05', lastOrderAt: '2026-06-23' },
];

export function getSupplierById(id: string): SupplierItem | undefined {
  return MOCK_SUPPLIERS.find((s) => s.id === id);
}

export interface SupplierStats {
  total: number;
  active: number;
  paused: number;
  pendingAudit: number;
  blacklisted: number;
  totalOrders: number;
  totalAmount: number;
  avgDefectRate: number;
  avgDeliveryDays: number;
  topCategory: string;
}

export function computeSupplierStats(items: SupplierItem[]): SupplierStats {
  const active = items.filter((s) => s.status === 'active');
  return {
    total: items.length,
    active: items.filter((s) => s.status === 'active').length,
    paused: items.filter((s) => s.status === 'paused').length,
    pendingAudit: items.filter((s) => s.status === 'pending_audit').length,
    blacklisted: items.filter((s) => s.status === 'blacklisted').length,
    totalOrders: items.reduce((s, i) => s + i.totalOrders, 0),
    totalAmount: items.reduce((s, i) => s + i.totalAmount, 0),
    avgDefectRate: items.length > 0 ? items.reduce((s, i) => s + i.defectRate, 0) / items.length : 0,
    avgDeliveryDays: items.filter((s) => s.avgDeliveryDays > 0).length > 0
      ? items.filter((s) => s.avgDeliveryDays > 0).reduce((s, i) => s + i.avgDeliveryDays, 0) / items.filter((s) => s.avgDeliveryDays > 0).length
      : 0,
    topCategory: (() => {
      const counts: Record<string, number> = {};
      items.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    })(),
  };
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `${(amount / 10000).toFixed(1)}万`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(2)}万`;
  return amount.toLocaleString('zh-CN');
}
