export type BrandStatus = 'active' | 'inactive' | 'pending' | 'suspended'
export type BrandTier = 'premium' | 'standard' | 'basic'
export type BrandStatusVariant = 'success' | 'neutral' | 'warning' | 'danger'

export interface BrandItem {
  id: string
  code: string
  name: string
  marketCode: string
  category: string
  status: BrandStatus
  tier: BrandTier
  storeCount: number
  tenantCount: number
  lastDeployed: string
}

export interface BrandsSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-brand-snapshot'
  brands: BrandItem[]
  generatedAt: string
}

export const BRAND_STATUSES: BrandStatus[] = ['active', 'pending', 'inactive', 'suspended']
export const BRAND_TIERS: BrandTier[] = ['premium', 'standard', 'basic']

export const BRAND_STATUS_MAP: Record<BrandStatus, { label: string; variant: BrandStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  pending: { label: '待激活', variant: 'warning' },
  inactive: { label: '已停用', variant: 'neutral' },
  suspended: { label: '已暂停', variant: 'danger' },
}

export const BRAND_TIER_MAP: Record<BrandTier, { label: string; variant: BrandStatusVariant }> = {
  premium: { label: '旗舰', variant: 'success' },
  standard: { label: '标准', variant: 'neutral' },
  basic: { label: '基础', variant: 'warning' },
}

export const defaultBrands: BrandItem[] = [
  {
    id: 'b1',
    code: 'BRAND-001',
    name: 'M5 Premium 旗舰品牌',
    marketCode: 'cn-mainland',
    category: '综合商业',
    status: 'active',
    tier: 'premium',
    storeCount: 5,
    tenantCount: 3,
    lastDeployed: '2026-07-25T10:30:00Z',
  },
  {
    id: 'b2',
    code: 'BRAND-002',
    name: '轻奢生活馆',
    marketCode: 'cn-mainland',
    category: '生活方式',
    status: 'active',
    tier: 'standard',
    storeCount: 3,
    tenantCount: 2,
    lastDeployed: '2026-07-24T08:15:00Z',
  },
  {
    id: 'b3',
    code: 'BRAND-003',
    name: 'CityStyle 城市时尚',
    marketCode: 'cn-mainland',
    category: '服饰零售',
    status: 'pending',
    tier: 'basic',
    storeCount: 1,
    tenantCount: 1,
    lastDeployed: '2026-07-22T09:00:00Z',
  },
  {
    id: 'b4',
    code: 'BRAND-004',
    name: 'TechCore 科技核心',
    marketCode: 'cn-mainland',
    category: '数码体验',
    status: 'active',
    tier: 'premium',
    storeCount: 4,
    tenantCount: 2,
    lastDeployed: '2026-07-26T01:45:00Z',
  },
  {
    id: 'b5',
    code: 'BRAND-005',
    name: 'NatureEssence 自然精华',
    marketCode: 'cn-mainland',
    category: '生活方式',
    status: 'suspended',
    tier: 'standard',
    storeCount: 2,
    tenantCount: 1,
    lastDeployed: '2026-07-20T11:00:00Z',
  },
  {
    id: 'b6',
    code: 'BRAND-006',
    name: 'GlobalFit 全球健身',
    marketCode: 'us-default',
    category: '运动健身',
    status: 'active',
    tier: 'premium',
    storeCount: 3,
    tenantCount: 2,
    lastDeployed: '2026-07-25T03:30:00Z',
  },
  {
    id: 'b7',
    code: 'BRAND-007',
    name: 'FoodieLabs 美食实验室',
    marketCode: 'us-default',
    category: '餐饮体验',
    status: 'active',
    tier: 'standard',
    storeCount: 2,
    tenantCount: 1,
    lastDeployed: '2026-07-23T12:00:00Z',
  },
  {
    id: 'b8',
    code: 'BRAND-008',
    name: 'LondonStyle 伦敦风尚',
    marketCode: 'uk-default',
    category: '服饰零售',
    status: 'pending',
    tier: 'basic',
    storeCount: 1,
    tenantCount: 1,
    lastDeployed: '2026-07-21T15:20:00Z',
  },
  {
    id: 'b9',
    code: 'BRAND-009',
    name: 'HomeSelect 家居优选',
    marketCode: 'cn-mainland',
    category: '家居生活',
    status: 'inactive',
    tier: 'basic',
    storeCount: 2,
    tenantCount: 1,
    lastDeployed: '2026-07-19T18:00:00Z',
  },
]

export interface BrandStats {
  total: number
  active: number
  inactive: number
  pending: number
  suspended: number
  premium: number
  standard: number
  basic: number
  totalStores: number
  totalTenants: number
}

export function computeBrandStats(brands: BrandItem[]): BrandStats {
  return {
    total: brands.length,
    active: brands.filter((brand) => brand.status === 'active').length,
    inactive: brands.filter((brand) => brand.status === 'inactive').length,
    pending: brands.filter((brand) => brand.status === 'pending').length,
    suspended: brands.filter((brand) => brand.status === 'suspended').length,
    premium: brands.filter((brand) => brand.tier === 'premium').length,
    standard: brands.filter((brand) => brand.tier === 'standard').length,
    basic: brands.filter((brand) => brand.tier === 'basic').length,
    totalStores: brands.reduce((sum, brand) => sum + brand.storeCount, 0),
    totalTenants: brands.reduce((sum, brand) => sum + brand.tenantCount, 0),
  }
}

export function getBrandUniqueMarkets(brands: BrandItem[]): string[] {
  return [...new Set(brands.map((brand) => brand.marketCode))]
}

function getLatestBrandTimestamp(brands: BrandItem[]): string {
  if (brands.length === 0) return '—'
  return brands.reduce(
    (latest, brand) => (brand.lastDeployed > latest ? brand.lastDeployed : latest),
    brands[0]!.lastDeployed
  )
}

export async function loadBrandsSnapshot(): Promise<BrandsSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-brand-snapshot',
    brands: defaultBrands,
    generatedAt: getLatestBrandTimestamp(defaultBrands),
  }
}
