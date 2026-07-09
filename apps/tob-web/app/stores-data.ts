/**
 * stores-data.ts — 门店管理 Mock 数据 (ToB 门店管理)
 */

export interface StoreItem {
  id: string;
  storeCode: string;
  storeName: string;
  region: string;
  city: string;
  address: string;
  managerName: string;
  managerMobile: string;
  employeeCount: number;
  status: 'active' | 'inactive' | 'maintenance';
  monthlyRevenue: number;
  dailyTraffic: number;
  createdAt: string;
  lastInspection: string;
}

export type StoreStatus = StoreItem['status'];
export const STORE_STATUSES: StoreStatus[] = ['active', 'inactive', 'maintenance'];

export const STORE_STATUS_MAP: Record<StoreStatus, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  active: { label: '营业中', variant: 'success' },
  inactive: { label: '已停业', variant: 'default' },
  maintenance: { label: '维护中', variant: 'warning' },
};

export const REGIONS = ['华东', '华南', '华北', '华中', '西南', '西北', '东北'];

export const STORE_REGION_MAP: Record<string, string[]> = {
  '华东': ['上海', '杭州', '南京', '苏州', '宁波'],
  '华南': ['广州', '深圳', '东莞', '佛山', '厦门'],
  '华北': ['北京', '天津', '石家庄', '太原', '呼和浩特'],
  '华中': ['武汉', '长沙', '郑州', '南昌'],
  '西南': ['成都', '重庆', '昆明', '贵阳'],
  '西北': ['西安', '兰州', '银川', '西宁', '乌鲁木齐'],
  '东北': ['沈阳', '大连', '长春', '哈尔滨'],
};

export const MOCK_STORES: StoreItem[] = [
  {
    id: 'store_001',
    storeCode: 'SZ-CENTER-01',
    storeName: '深圳南山旗舰店',
    region: '华南',
    city: '深圳',
    address: '深圳市南山区科技园南路88号',
    managerName: '张店长',
    managerMobile: '13800138001',
    employeeCount: 12,
    status: 'active',
    monthlyRevenue: 2580000,
    dailyTraffic: 1560,
    createdAt: '2024-01-15',
    lastInspection: '2026-06-20',
  },
  {
    id: 'store_002',
    storeCode: 'SZ-FUTIAN-02',
    storeName: '深圳福田会展中心店',
    region: '华南',
    city: '深圳',
    address: '深圳市福田区福华三路111号',
    managerName: '李店长',
    managerMobile: '13800138002',
    employeeCount: 8,
    status: 'active',
    monthlyRevenue: 1820000,
    dailyTraffic: 980,
    createdAt: '2024-03-01',
    lastInspection: '2026-06-18',
  },
  {
    id: 'store_003',
    storeCode: 'GZ-TH-01',
    storeName: '广州天河城店',
    region: '华南',
    city: '广州',
    address: '广州市天河区天河路230号',
    managerName: '王店长',
    managerMobile: '13800138003',
    employeeCount: 10,
    status: 'active',
    monthlyRevenue: 2150000,
    dailyTraffic: 1320,
    createdAt: '2024-02-20',
    lastInspection: '2026-06-15',
  },
  {
    id: 'store_004',
    storeCode: 'SH-LUJIAZUI-01',
    storeName: '上海陆家嘴店',
    region: '华东',
    city: '上海',
    address: '上海市浦东新区陆家嘴环路166号',
    managerName: '陈店长',
    managerMobile: '13800138004',
    employeeCount: 15,
    status: 'active',
    monthlyRevenue: 3200000,
    dailyTraffic: 2100,
    createdAt: '2023-11-01',
    lastInspection: '2026-06-22',
  },
  {
    id: 'store_005',
    storeCode: 'BJ-CBD-01',
    storeName: '北京国贸店',
    region: '华北',
    city: '北京',
    address: '北京市朝阳区建国门外大街1号',
    managerName: '刘店长',
    managerMobile: '13800138005',
    employeeCount: 14,
    status: 'maintenance',
    monthlyRevenue: 0,
    dailyTraffic: 0,
    createdAt: '2023-12-10',
    lastInspection: '2026-06-10',
  },
  {
    id: 'store_006',
    storeCode: 'CD-CENTER-01',
    storeName: '成都春熙路店',
    region: '西南',
    city: '成都',
    address: '成都市锦江区春熙路118号',
    managerName: '赵店长',
    managerMobile: '13800138006',
    employeeCount: 9,
    status: 'active',
    monthlyRevenue: 1680000,
    dailyTraffic: 1420,
    createdAt: '2024-04-15',
    lastInspection: '2026-06-08',
  },
  {
    id: 'store_007',
    storeCode: 'WH-JH-01',
    storeName: '武汉江汉路店',
    region: '华中',
    city: '武汉',
    address: '武汉市江汉区江汉路178号',
    managerName: '周店长',
    managerMobile: '13800138007',
    employeeCount: 7,
    status: 'inactive',
    monthlyRevenue: 0,
    dailyTraffic: 0,
    createdAt: '2024-05-01',
    lastInspection: '2026-05-20',
  },
  {
    id: 'store_008',
    storeCode: 'XA-GX-01',
    storeName: '西安高新店',
    region: '西北',
    city: '西安',
    address: '西安市高新区高新路68号',
    managerName: '吴店长',
    managerMobile: '13800138008',
    employeeCount: 6,
    status: 'active',
    monthlyRevenue: 1250000,
    dailyTraffic: 780,
    createdAt: '2024-06-01',
    lastInspection: '2026-06-12',
  },
  {
    id: 'store_009',
    storeCode: 'HZ-WL-01',
    storeName: '杭州西湖店',
    region: '华东',
    city: '杭州',
    address: '杭州市西湖区湖滨路55号',
    managerName: '孙店长',
    managerMobile: '13800138009',
    employeeCount: 11,
    status: 'active',
    monthlyRevenue: 1950000,
    dailyTraffic: 1680,
    createdAt: '2024-01-20',
    lastInspection: '2026-06-19',
  },
  {
    id: 'store_010',
    storeCode: 'DL-AL-01',
    storeName: '大连中山路店',
    region: '东北',
    city: '大连',
    address: '大连市中山区中山路156号',
    managerName: '钱店长',
    managerMobile: '13800138010',
    employeeCount: 5,
    status: 'inactive',
    monthlyRevenue: 0,
    dailyTraffic: 0,
    createdAt: '2024-07-01',
    lastInspection: '2026-05-30',
  },
  {
    id: 'store_011',
    storeCode: 'NJ-XJ-01',
    storeName: '南京新街口店',
    region: '华东',
    city: '南京',
    address: '南京市秦淮区新街口广场88号',
    managerName: '黄店长',
    managerMobile: '13800138011',
    employeeCount: 13,
    status: 'active',
    monthlyRevenue: 2350000,
    dailyTraffic: 1850,
    createdAt: '2024-02-01',
    lastInspection: '2026-06-21',
  },
  {
    id: 'store_012',
    storeCode: 'CS-JF-01',
    storeName: '长沙解放西路店',
    region: '华中',
    city: '长沙',
    address: '长沙市芙蓉区解放西路188号',
    managerName: '陈店长',
    managerMobile: '13800138012',
    employeeCount: 8,
    status: 'active',
    monthlyRevenue: 1450000,
    dailyTraffic: 1120,
    createdAt: '2024-03-10',
    lastInspection: '2026-06-14',
  },
];

function formatCurrency(n: number): string {
  if (n >= 10_000) return `¥${(n / 10_000).toFixed(0)}万`;
  if (n >= 1_000) return `¥${(n / 1_000).toFixed(1)}K`;
  return `¥${n}`;
}

export { formatCurrency };
