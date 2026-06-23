// ---- 品牌管理数据类型与 Mock 数据 ----

// ---- 类型定义 ----

export interface BrandItem {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: BrandStatus;
  storeCount: number;
  tenantCount: number;
  lastDeployed: string;
  tier: BrandTier;
}

export interface BrandDetail extends BrandItem {
  description: string;
  foundedAt: string;
  headquarterCity: string;
  headquarterProvince: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  category: string;
  subCategories: string[];
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  socialLinks: Record<string, string>;
  storeNames: string[];
  tenantNames: string[];
  productLineCount: number;
  memberCount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type BrandStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type BrandTier = 'premium' | 'standard' | 'basic';
export type BrandStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

export const BRAND_STATUSES: BrandStatus[] = ['active', 'pending', 'inactive', 'suspended'];
export const BRAND_TIERS: BrandTier[] = ['premium', 'standard', 'basic'];

export const BRAND_STATUS_MAP: Record<BrandStatus, { label: string; variant: BrandStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

export const BRAND_TIER_MAP: Record<BrandTier, { label: string; variant: BrandStatusVariant }> = {
  premium: { label: '旗舰', variant: 'success' },
  standard: { label: '标准', variant: 'neutral' },
  basic: { label: '基础', variant: 'warning' },
};

export function getBrandStatusLabel(status: BrandStatus): string {
  return BRAND_STATUS_MAP[status]?.label ?? status;
}

export function getBrandTierLabel(tier: BrandTier): string {
  return BRAND_TIER_MAP[tier]?.label ?? tier;
}

export function getBrandStatusVariant(status: BrandStatus): BrandStatusVariant {
  return BRAND_STATUS_MAP[status]?.variant ?? 'neutral';
}

export function getBrandTierVariant(tier: BrandTier): BrandStatusVariant {
  return BRAND_TIER_MAP[tier]?.variant ?? 'neutral';
}

// ---- 路由 ----

export const adminBrandRoute = {
  href: '/brands',
  detailHrefBase: '/brands',
  title: '品牌管理中心',
  description: '统一管理所有市场下的品牌运营状态、门店关联与等级分类。',
};

export function buildBrandDetailHref(id: string): string {
  return `${adminBrandRoute.detailHrefBase}/${id}`;
}

// ---- Mock 数据 ----

export const MOCK_BRANDS: BrandItem[] = [
  { id: 'b1', code: 'BRAND-001', name: 'M5 Premium 旗舰品牌', marketCode: 'cn-mainland', status: 'active', storeCount: 5, tenantCount: 3, lastDeployed: '2026-06-12 14:30', tier: 'premium' },
  { id: 'b2', code: 'BRAND-002', name: '轻奢生活馆', marketCode: 'cn-mainland', status: 'active', storeCount: 3, tenantCount: 2, lastDeployed: '2026-06-12 10:15', tier: 'standard' },
  { id: 'b3', code: 'BRAND-003', name: 'CityStyle 城市时尚', marketCode: 'cn-mainland', status: 'pending', storeCount: 1, tenantCount: 1, lastDeployed: '2026-06-11 09:00', tier: 'basic' },
  { id: 'b4', code: 'BRAND-004', name: 'TechCore 科技核心', marketCode: 'cn-mainland', status: 'active', storeCount: 4, tenantCount: 2, lastDeployed: '2026-06-12 16:45', tier: 'premium' },
  { id: 'b5', code: 'BRAND-005', name: 'NatureEssence 自然精华', marketCode: 'cn-mainland', status: 'suspended', storeCount: 2, tenantCount: 1, lastDeployed: '2026-06-10 11:00', tier: 'standard' },
  { id: 'b6', code: 'BRAND-006', name: 'GlobalFit 全球健身', marketCode: 'us-default', status: 'active', storeCount: 3, tenantCount: 2, lastDeployed: '2026-06-12 08:30', tier: 'premium' },
  { id: 'b7', code: 'BRAND-007', name: 'FoodieLabs 美食实验室', marketCode: 'us-default', status: 'active', storeCount: 2, tenantCount: 1, lastDeployed: '2026-06-12 12:00', tier: 'standard' },
  { id: 'b8', code: 'BRAND-008', name: 'LondonStyle 伦敦风尚', marketCode: 'uk-default', status: 'pending', storeCount: 1, tenantCount: 1, lastDeployed: '2026-06-11 15:20', tier: 'basic' },
  { id: 'b9', code: 'BRAND-009', name: '家居优选 HomeSelect', marketCode: 'cn-mainland', status: 'inactive', storeCount: 2, tenantCount: 1, lastDeployed: '2026-06-09 18:00', tier: 'basic' },
  { id: 'b10', code: 'BRAND-010', name: 'SportMax 运动极限', marketCode: 'cn-mainland', status: 'active', storeCount: 4, tenantCount: 2, lastDeployed: '2026-06-12 13:45', tier: 'standard' },
  { id: 'b11', code: 'BRAND-011', name: 'KidJoy 儿童乐园', marketCode: 'cn-mainland', status: 'active', storeCount: 3, tenantCount: 1, lastDeployed: '2026-06-12 09:30', tier: 'standard' },
  { id: 'b12', code: 'BRAND-012', name: 'PetSpace 萌宠空间', marketCode: 'cn-mainland', status: 'pending', storeCount: 1, tenantCount: 1, lastDeployed: '2026-06-11 14:00', tier: 'basic' },
];

export const MOCK_BRAND_DETAILS: Record<string, BrandDetail> = {
  b1: {
    id: 'b1', code: 'BRAND-001', name: 'M5 Premium 旗舰品牌', marketCode: 'cn-mainland',
    status: 'active', storeCount: 5, tenantCount: 3, lastDeployed: '2026-06-12 14:30', tier: 'premium',
    description: 'M5 平台旗舰商业空间品牌，覆盖全球核心商圈，定义下一代零售体验。',
    foundedAt: '2023-03-01', headquarterCity: '上海', headquarterProvince: '上海市',
    website: 'https://m5-premium.com', contactEmail: 'premium@m5.com', contactPhone: '021-6888-8888',
    category: '综合商业', subCategories: ['零售租赁', '体验空间', '数字互动'],
    logoUrl: '/logos/brand-001.png', primaryColor: '#1e40af', secondaryColor: '#f59e0b',
    socialLinks: { wechat: 'm5_premium', douyin: 'm5_premium_official' },
    storeNames: ['朝阳大悦城旗舰店', '上海陆家嘴中心店', '深圳万象天地店', '成都太古里体验店', '杭州银泰旗舰店'],
    tenantNames: ['华润万象生活', '万达集团', '龙湖集团'],
    productLineCount: 24, memberCount: 156000,
    notes: '最高等级品牌，享受最高标准运营支持和资源倾斜。',
    createdAt: '2024-01-15', updatedAt: '2026-06-12'
  },
  b5: {
    id: 'b5', code: 'BRAND-005', name: 'NatureEssence 自然精华', marketCode: 'cn-mainland',
    status: 'suspended', storeCount: 2, tenantCount: 1, lastDeployed: '2026-06-10 11:00', tier: 'standard',
    description: '天然与纯净生活方式品牌，主打有机产品和可持续商业空间。',
    foundedAt: '2024-01-10', headquarterCity: '杭州', headquarterProvince: '浙江省',
    website: 'https://natureessence.cn', contactEmail: 'nature@m5.com', contactPhone: '0571-8777-7777',
    category: '生活方式', subCategories: ['有机产品', '可持续空间', '社区活动'],
    logoUrl: '/logos/brand-005.png', primaryColor: '#15803d', secondaryColor: '#fef3c7',
    socialLinks: { wechat: 'nature_essence' },
    storeNames: ['杭州银泰旗舰店', '南京德基广场店'],
    tenantNames: ['新城控股'],
    productLineCount: 8, memberCount: 28000,
    notes: '因健康合规审查暂停运营，预计 3 周内恢复。',
    createdAt: '2024-06-20', updatedAt: '2026-06-10'
  },
};

// ---- 统计计算 ----

export interface BrandStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  premium: number;
  standard: number;
  basic: number;
  totalStores: number;
  totalTenants: number;
}

export function computeBrandStats(brands: BrandItem[]): BrandStats {
  return {
    total: brands.length,
    active: brands.filter((b) => b.status === 'active').length,
    inactive: brands.filter((b) => b.status === 'inactive').length,
    pending: brands.filter((b) => b.status === 'pending').length,
    suspended: brands.filter((b) => b.status === 'suspended').length,
    premium: brands.filter((b) => b.tier === 'premium').length,
    standard: brands.filter((b) => b.tier === 'standard').length,
    basic: brands.filter((b) => b.tier === 'basic').length,
    totalStores: brands.reduce((sum, b) => sum + b.storeCount, 0),
    totalTenants: brands.reduce((sum, b) => sum + b.tenantCount, 0),
  };
}

export function computeBrandMarketDistribution(brands: BrandItem[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const brand of brands) {
    distribution[brand.marketCode] = (distribution[brand.marketCode] || 0) + 1;
  }
  return distribution;
}

export function getBrandUniqueMarkets(brands: BrandItem[]): string[] {
  return [...new Set(brands.map((b) => b.marketCode))];
}
