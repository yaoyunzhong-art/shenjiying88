// ---- 门店管理数据类型与 Mock 数据 ----

// ---- 类型定义 ----

export interface StoreItem {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: StoreStatus;
  tenantCount: number;
  brandCount: number;
  lastDeployed: string;
  riskLevel: StoreRiskLevel;
}

export interface StoreDetail extends StoreItem {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  managerName: string;
  managerPhone: string;
  floorCount: number;
  totalArea: number;
  openingHours: string;
  parkingSpots: number;
  tenantNames: string[];
  brandNames: string[];
  deviceCount: number;
  deviceOnlineRate: number;
  lastInspectionAt: string;
  nextInspectionAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type StoreStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type StoreRiskLevel = 'low' | 'medium' | 'high';
export type StoreStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

export const STORE_STATUSES: StoreStatus[] = ['active', 'pending', 'inactive', 'suspended'];
export const STORE_RISK_LEVELS: StoreRiskLevel[] = ['low', 'medium', 'high'];

export const STORE_STATUS_MAP: Record<StoreStatus, { label: string; variant: StoreStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

export const STORE_RISK_LEVEL_MAP: Record<StoreRiskLevel, { label: string; variant: StoreStatusVariant }> = {
  low: { label: '低', variant: 'success' },
  medium: { label: '中', variant: 'warning' },
  high: { label: '高', variant: 'danger' },
};

export function getStoreStatusLabel(status: StoreStatus): string {
  return STORE_STATUS_MAP[status]?.label ?? status;
}

export function getStoreRiskLevelLabel(level: StoreRiskLevel): string {
  return STORE_RISK_LEVEL_MAP[level]?.label ?? level;
}

export function getStoreStatusVariant(status: StoreStatus): StoreStatusVariant {
  return STORE_STATUS_MAP[status]?.variant ?? 'neutral';
}

export function getStoreRiskLevelVariant(level: StoreRiskLevel): StoreStatusVariant {
  return STORE_RISK_LEVEL_MAP[level]?.variant ?? 'neutral';
}

// ---- 路由 ----

export const adminStoreRoute = {
  href: '/stores',
  title: '门店管理中心',
  description: '统一管理所有市场下的门店运营状态、租户品牌关联及风险等级。',
};

// ---- Mock 数据 ----

export const MOCK_STORES: StoreItem[] = [
  { id: 's1', code: 'STORE-001', name: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 12, brandCount: 8, lastDeployed: '2026-06-12 14:30', riskLevel: 'low' },
  { id: 's2', code: 'STORE-002', name: '上海陆家嘴中心店', marketCode: 'cn-mainland', status: 'active', tenantCount: 9, brandCount: 6, lastDeployed: '2026-06-12 10:15', riskLevel: 'medium' },
  { id: 's3', code: 'STORE-003', name: '深圳万象天地店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-11 09:00', riskLevel: 'low' },
  { id: 's4', code: 'STORE-004', name: '成都太古里体验店', marketCode: 'cn-mainland', status: 'active', tenantCount: 6, brandCount: 4, lastDeployed: '2026-06-12 16:45', riskLevel: 'low' },
  { id: 's5', code: 'STORE-005', name: '杭州银泰旗舰店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-10 11:00', riskLevel: 'high' },
  { id: 's6', code: 'STORE-006', name: 'San Francisco Union Square', marketCode: 'us-default', status: 'active', tenantCount: 5, brandCount: 3, lastDeployed: '2026-06-12 08:30', riskLevel: 'medium' },
  { id: 's7', code: 'STORE-007', name: 'New York Fifth Avenue', marketCode: 'us-default', status: 'active', tenantCount: 8, brandCount: 5, lastDeployed: '2026-06-12 12:00', riskLevel: 'low' },
  { id: 's8', code: 'STORE-008', name: 'London Oxford Street', marketCode: 'uk-default', status: 'pending', tenantCount: 2, brandCount: 2, lastDeployed: '2026-06-11 15:20', riskLevel: 'low' },
  { id: 's9', code: 'STORE-009', name: '广州天河城店', marketCode: 'cn-mainland', status: 'inactive', tenantCount: 3, brandCount: 1, lastDeployed: '2026-06-09 18:00', riskLevel: 'medium' },
  { id: 's10', code: 'STORE-010', name: '南京德基广场店', marketCode: 'cn-mainland', status: 'active', tenantCount: 7, brandCount: 5, lastDeployed: '2026-06-12 13:45', riskLevel: 'low' },
  { id: 's11', code: 'STORE-011', name: '武汉天地旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-12 09:30', riskLevel: 'medium' },
  { id: 's12', code: 'STORE-012', name: '重庆来福士店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 1, brandCount: 1, lastDeployed: '2026-06-11 14:00', riskLevel: 'low' },
  { id: 's13', code: 'STORE-013', name: 'Seattle Downtown', marketCode: 'us-default', status: 'active', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-12 07:00', riskLevel: 'low' },
  { id: 's14', code: 'STORE-014', name: '苏州中心旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 5, brandCount: 4, lastDeployed: '2026-06-12 11:30', riskLevel: 'low' },
  { id: 's15', code: 'STORE-015', name: '西安大唐不夜城店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 2, brandCount: 1, lastDeployed: '2026-06-08 10:00', riskLevel: 'high' },
];

export const MOCK_STORE_DETAILS: Record<string, StoreDetail> = {
  s1: {
    id: 's1', code: 'STORE-001', name: '朝阳大悦城旗舰店', marketCode: 'cn-mainland',
    status: 'active', tenantCount: 12, brandCount: 8, lastDeployed: '2026-06-12 14:30', riskLevel: 'low',
    address: '北京市朝阳区朝阳北路101号', city: '北京', province: '北京市', postalCode: '100025',
    phone: '010-8888-0001', email: 'store-001@m5.com', managerName: '王建国', managerPhone: '+86-139-0001-0001',
    floorCount: 6, totalArea: 45000, openingHours: '10:00-22:00', parkingSpots: 800,
    tenantNames: ['华润万象生活', '万达集团', '龙湖集团'],
    brandNames: ['M5 Premium 旗舰品牌', 'LightLux 轻奢生活馆', 'CityStyle', 'TechCore'],
    deviceCount: 128, deviceOnlineRate: 0.97,
    lastInspectionAt: '2026-06-01', nextInspectionAt: '2026-09-01', notes: '旗舰门店，配置最高标准。',
    createdAt: '2024-01-15', updatedAt: '2026-06-12'
  },
  s2: {
    id: 's2', code: 'STORE-002', name: '上海陆家嘴中心店', marketCode: 'cn-mainland',
    status: 'active', tenantCount: 9, brandCount: 6, lastDeployed: '2026-06-12 10:15', riskLevel: 'medium',
    address: '上海市浦东新区陆家嘴环路1000号', city: '上海', province: '上海市', postalCode: '200120',
    phone: '021-6888-0002', email: 'store-002@m5.com', managerName: '李芳', managerPhone: '+86-139-0001-0002',
    floorCount: 8, totalArea: 62000, openingHours: '09:00-22:30', parkingSpots: 1200,
    tenantNames: ['新鸿基地产', '万科集团'],
    brandNames: ['LightLux 轻奢生活馆', 'GlobalFit 全球健身', 'FoodieLabs'],
    deviceCount: 203, deviceOnlineRate: 0.94,
    lastInspectionAt: '2026-05-15', nextInspectionAt: '2026-08-15', notes: '日均客流 5 万+，需要加强安全监控。',
    createdAt: '2024-03-01', updatedAt: '2026-06-12'
  },
  s5: {
    id: 's5', code: 'STORE-005', name: '杭州银泰旗舰店', marketCode: 'cn-mainland',
    status: 'suspended', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-10 11:00', riskLevel: 'high',
    address: '杭州市上城区延安路530号', city: '杭州', province: '浙江省', postalCode: '310006',
    phone: '0571-8777-0005', email: 'store-005@m5.com', managerName: '张勇', managerPhone: '+86-139-0001-0005',
    floorCount: 5, totalArea: 32000, openingHours: '10:00-22:00', parkingSpots: 500,
    tenantNames: ['华润万象生活', '新城控股'],
    brandNames: ['NatureEssence 自然精华', 'KidJoy 儿童乐园'],
    deviceCount: 76, deviceOnlineRate: 0.52,
    lastInspectionAt: '2026-05-01', nextInspectionAt: '2026-05-15', notes: '因消防安全整改暂停运营，预计 2 周内恢复。',
    createdAt: '2024-06-20', updatedAt: '2026-06-10'
  },
};

// ---- 统计计算 ----

export function computeStoreStats(stores: StoreItem[]) {
  return {
    total: stores.length,
    active: stores.filter((s) => s.status === 'active').length,
    inactive: stores.filter((s) => s.status === 'inactive').length,
    pending: stores.filter((s) => s.status === 'pending').length,
    suspended: stores.filter((s) => s.status === 'suspended').length,
    highRisk: stores.filter((s) => s.riskLevel === 'high').length,
    mediumRisk: stores.filter((s) => s.riskLevel === 'medium').length,
    lowRisk: stores.filter((s) => s.riskLevel === 'low').length,
    totalBrands: stores.reduce((sum, s) => sum + s.brandCount, 0),
    totalTenants: stores.reduce((sum, s) => sum + s.tenantCount, 0),
  };
}

export function computeStoreMarketDistribution(stores: StoreItem[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const store of stores) {
    distribution[store.marketCode] = (distribution[store.marketCode] || 0) + 1;
  }
  return distribution;
}
