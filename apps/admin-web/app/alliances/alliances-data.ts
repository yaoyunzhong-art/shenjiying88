const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export type PartnerGrade = 'S' | 'A' | 'B' | 'C'
export type PartnerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type BusinessType = 'RETAIL' | 'F&B' | 'SERVICE' | 'TECH' | 'OTHER'
export type SettlementStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface AlliancePartner {
  id: string
  name: string
  businessType: BusinessType
  contact: string
  address: string
  status: PartnerStatus
  currentGrade: PartnerGrade | null
  healthScore: number | null
  revenueShare: number
  settlementStatus: SettlementStatus
  totalRevenue: number
  totalOrders: number
  registeredAt: string
  updatedAt: string
}

export interface PartnerFilter {
  search: string
  status: PartnerStatus | 'ALL'
  grade: PartnerGrade | 'ALL'
  businessType: BusinessType | 'ALL'
}

export interface AlliancesSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  partners: AlliancePartner[]
  generatedAt: string
  error?: string
}

interface ApiAlliancePartner {
  id: string
  name: string
  businessType: BusinessType
  contact: string
  address: string
  status: PartnerStatus
  currentGrade: PartnerGrade | null
  healthScore: number | null
  registeredAt: string
  updatedAt: string
}

export const defaultPartners: AlliancePartner[] = [
  {
    id: 'p-1',
    name: '喜茶',
    businessType: 'F&B',
    contact: '李经理 138****5678',
    address: '深圳市南山区科技园',
    status: 'ACTIVE',
    currentGrade: 'S',
    healthScore: 92,
    revenueShare: 0.08,
    settlementStatus: 'completed',
    totalRevenue: 58000000,
    totalOrders: 18230,
    registeredAt: '2025-03-15T00:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 'p-2',
    name: '泡泡玛特',
    businessType: 'RETAIL',
    contact: '王总监 139****9012',
    address: '北京市朝阳区望京',
    status: 'ACTIVE',
    currentGrade: 'A',
    healthScore: 85,
    revenueShare: 0.12,
    settlementStatus: 'approved',
    totalRevenue: 25000000,
    totalOrders: 8920,
    registeredAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-07-19T14:00:00Z',
  },
  {
    id: 'p-3',
    name: '星巴克',
    businessType: 'F&B',
    contact: '陈主管 136****3456',
    address: '上海市静安区',
    status: 'ACTIVE',
    currentGrade: 'A',
    healthScore: 78,
    revenueShare: 0.1,
    settlementStatus: 'completed',
    totalRevenue: 42000000,
    totalOrders: 15200,
    registeredAt: '2025-01-10T00:00:00Z',
    updatedAt: '2026-07-18T09:00:00Z',
  },
  {
    id: 'p-4',
    name: '支付宝',
    businessType: 'TECH',
    contact: '赵经理 137****7890',
    address: '杭州市西湖区',
    status: 'ACTIVE',
    currentGrade: 'S',
    healthScore: 95,
    revenueShare: 0.05,
    settlementStatus: 'completed',
    totalRevenue: 120000000,
    totalOrders: 42100,
    registeredAt: '2025-04-20T00:00:00Z',
    updatedAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'p-5',
    name: '美团',
    businessType: 'TECH',
    contact: '刘经理 135****1234',
    address: '北京市海淀区',
    status: 'INACTIVE',
    currentGrade: 'B',
    healthScore: 62,
    revenueShare: 0.06,
    settlementStatus: 'rejected',
    totalRevenue: 15000000,
    totalOrders: 5120,
    registeredAt: '2025-02-01T00:00:00Z',
    updatedAt: '2026-06-30T10:00:00Z',
  },
  {
    id: 'p-6',
    name: '肯德基',
    businessType: 'F&B',
    contact: '孙经理 158****2233',
    address: '广州市天河区',
    status: 'ACTIVE',
    currentGrade: 'B',
    healthScore: 70,
    revenueShare: 0.15,
    settlementStatus: 'pending',
    totalRevenue: 18500000,
    totalOrders: 7230,
    registeredAt: '2025-07-01T00:00:00Z',
    updatedAt: '2026-07-17T11:00:00Z',
  },
  {
    id: 'p-7',
    name: '蔚来汽车',
    businessType: 'SERVICE',
    contact: '周经理 159****4455',
    address: '上海市嘉定区',
    status: 'SUSPENDED',
    currentGrade: 'C',
    healthScore: 35,
    revenueShare: 0.2,
    settlementStatus: 'rejected',
    totalRevenue: 3200000,
    totalOrders: 890,
    registeredAt: '2025-09-10T00:00:00Z',
    updatedAt: '2026-07-10T16:00:00Z',
  },
  {
    id: 'p-8',
    name: '屈臣氏',
    businessType: 'RETAIL',
    contact: '吴主管 136****7788',
    address: '成都市锦江区',
    status: 'ACTIVE',
    currentGrade: 'A',
    healthScore: 82,
    revenueShare: 0.07,
    settlementStatus: 'completed',
    totalRevenue: 31000000,
    totalOrders: 11200,
    registeredAt: '2025-05-15T00:00:00Z',
    updatedAt: '2026-07-16T13:00:00Z',
  },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveAlliancesApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

function mapToAlliancePartner(partner: ApiAlliancePartner): AlliancePartner {
  return {
    ...partner,
    revenueShare: 0,
    settlementStatus: 'pending',
    totalRevenue: 0,
    totalOrders: 0,
  }
}

async function fetchAlliancePartners(): Promise<AlliancePartner[]> {
  const upstreamUrl = new URL('alliance/partner', resolveAlliancesApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`alliances upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<ApiAlliancePartner[] | { partners?: ApiAlliancePartner[] }>(payload)
  const partners = Array.isArray(data) ? data : Array.isArray(data.partners) ? data.partners : []
  if (partners.length === 0) {
    throw new Error('alliances upstream empty')
  }
  return partners.map(mapToAlliancePartner)
}

export async function loadAlliancesSnapshot(): Promise<AlliancesSnapshotDelivery> {
  try {
    const partners = await fetchAlliancePartners()
    return {
      deliveryMode: 'api',
      partners,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      partners: defaultPartners,
      generatedAt: new Date().toISOString(),
      error: '联盟伙伴实时接口不可达或为空，已切换到 fallback 样本数据。',
    }
  }
}
