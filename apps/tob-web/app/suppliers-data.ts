/**
 * suppliers-data.ts — 供应商 Mock 数据与类型定义 (ToB 供应商管理)
 */

export type SupplierStatus = 'active' | 'paused' | 'pending' | 'terminated';
export type SupplierCategory = '护肤品' | '彩妆' | '香水' | '包装材料' | '美妆工具' | '原料';

export interface SupplierItem {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: SupplierCategory;
  status: SupplierStatus;
  totalProducts: number;
  totalAmount: number;
  cooperationStart: string;
  updatedAt: string;
  address: string;
}

export const SUPPLIER_STATUS_MAP: Record<SupplierStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '合作中', variant: 'success' },
  paused: { label: '暂停合作', variant: 'warning' },
  pending: { label: '待审核', variant: 'neutral' },
  terminated: { label: '已终止', variant: 'danger' },
};

export const SUPPLIER_CATEGORY_MAP: Record<SupplierCategory, string> = {
  '护肤品': '护肤品',
  '彩妆': '彩妆',
  '香水': '香水',
  '包装材料': '包装材料',
  '美妆工具': '美妆工具',
  '原料': '原料',
};

export const SUPPLIER_STATUSES: SupplierStatus[] = ['active', 'paused', 'pending', 'terminated'];
export const SUPPLIER_CATEGORIES: SupplierCategory[] = ['护肤品', '彩妆', '香水', '包装材料', '美妆工具', '原料'];

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

export { formatCurrency };

export const MOCK_SUPPLIERS: SupplierItem[] = [
  {
    id: 'sup-001',
    code: 'SUP-001',
    name: '广州美妆供应链有限公司',
    contactPerson: '李明',
    phone: '13800138001',
    email: 'liming@gzbeauty.com',
    category: '护肤品',
    status: 'active',
    totalProducts: 48,
    totalAmount: 1268000,
    cooperationStart: '2024-01-15',
    updatedAt: '2026-06-25 10:32',
    address: '广州市白云区美妆产业园区A栋',
  },
  {
    id: 'sup-002',
    code: 'SUP-002',
    name: '上海日化贸易有限公司',
    contactPerson: '王芳',
    phone: '13900139002',
    email: 'wangfang@shdaily.com',
    category: '彩妆',
    status: 'active',
    totalProducts: 36,
    totalAmount: 892000,
    cooperationStart: '2024-03-20',
    updatedAt: '2026-06-25 09:15',
    address: '上海市浦东新区外高桥保税区B座',
  },
  {
    id: 'sup-003',
    code: 'SUP-003',
    name: '杭州香氛科技有限公司',
    contactPerson: '张伟',
    phone: '13700137003',
    email: 'zhangwei@hzperfume.com',
    category: '香水',
    status: 'paused',
    totalProducts: 12,
    totalAmount: 345000,
    cooperationStart: '2024-06-01',
    updatedAt: '2026-06-24 18:00',
    address: '杭州市余杭区未来科技城C座',
  },
  {
    id: 'sup-004',
    code: 'SUP-004',
    name: '深圳包材创新有限公司',
    contactPerson: '刘洋',
    phone: '13600136004',
    email: 'liuyang@szpackaging.com',
    category: '包装材料',
    status: 'active',
    totalProducts: 85,
    totalAmount: 523000,
    cooperationStart: '2024-02-10',
    updatedAt: '2026-06-25 08:45',
    address: '深圳市宝安区福永街道工业园',
  },
  {
    id: 'sup-005',
    code: 'SUP-005',
    name: '韩国美妆株式会社上海代表处',
    contactPerson: '朴俊昊',
    phone: '13500135005',
    email: 'park@korea-beauty.com',
    category: '彩妆',
    status: 'pending',
    totalProducts: 0,
    totalAmount: 0,
    cooperationStart: '-',
    updatedAt: '2026-06-26 09:00',
    address: '上海市长宁区虹桥开发区',
  },
  {
    id: 'sup-006',
    code: 'SUP-006',
    name: '北京草本护肤品有限公司',
    contactPerson: '陈静',
    phone: '13400134006',
    email: 'chenjing@bjherb.com',
    category: '护肤品',
    status: 'terminated',
    totalProducts: 18,
    totalAmount: 210000,
    cooperationStart: '2023-09-01',
    updatedAt: '2026-06-20 14:00',
    address: '北京市大兴区生物医药基地',
  },
  {
    id: 'sup-007',
    code: 'SUP-007',
    name: '广州妆具工贸有限公司',
    contactPerson: '赵鹏',
    phone: '13300133007',
    email: 'zhaopeng@gzzhuangju.com',
    category: '美妆工具',
    status: 'active',
    totalProducts: 52,
    totalAmount: 389000,
    cooperationStart: '2024-05-15',
    updatedAt: '2026-06-25 11:00',
    address: '广州市番禺区南村镇工业园',
  },
  {
    id: 'sup-008',
    code: 'SUP-008',
    name: '青岛海洋生物科技有限公司',
    contactPerson: '周鑫',
    phone: '13200132008',
    email: 'zhouxin@qdmarine.com',
    category: '护肤品',
    status: 'active',
    totalProducts: 24,
    totalAmount: 678000,
    cooperationStart: '2024-07-01',
    updatedAt: '2026-06-23 16:20',
    address: '青岛市黄岛区前湾港路',
  },
  {
    id: 'sup-009',
    code: 'SUP-009',
    name: '云南植物原料供应公司',
    contactPerson: '杨丽',
    phone: '13100131009',
    email: 'yangli@ynplant.com',
    category: '原料',
    status: 'active',
    totalProducts: 31,
    totalAmount: 456000,
    cooperationStart: '2024-08-10',
    updatedAt: '2026-06-22 14:10',
    address: '昆明市呈贡区云南白药产业园区',
  },
  {
    id: 'sup-010',
    code: 'SUP-010',
    name: '成都印刷包装有限公司',
    contactPerson: '黄强',
    phone: '13000130010',
    email: 'huangqiang@cdprint.com',
    category: '包装材料',
    status: 'pending',
    totalProducts: 0,
    totalAmount: 0,
    cooperationStart: '-',
    updatedAt: '2026-06-21 08:30',
    address: '成都市郫都区现代工业港',
  },
  {
    id: 'sup-011',
    code: 'SUP-011',
    name: '台湾彩妆科技有限公司',
    contactPerson: '陈建宏',
    phone: '18800188011',
    email: 'chenjh@twcosmetics.com',
    category: '彩妆',
    status: 'active',
    totalProducts: 41,
    totalAmount: 978000,
    cooperationStart: '2024-04-01',
    updatedAt: '2026-06-24 16:00',
    address: '台北市内湖区瑞光路科技园区',
  },
  {
    id: 'sup-012',
    code: 'SUP-012',
    name: '长沙护肤品包装设计公司',
    contactPerson: '李悦',
    phone: '18600186012',
    email: 'liyue@cspackage.com',
    category: '包装材料',
    status: 'paused',
    totalProducts: 7,
    totalAmount: 98000,
    cooperationStart: '2025-01-20',
    updatedAt: '2026-06-10 11:00',
    address: '长沙市雨花区环保科技园',
  },
];
