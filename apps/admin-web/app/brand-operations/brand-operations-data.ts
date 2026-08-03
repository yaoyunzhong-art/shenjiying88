const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface BrandAssetItem {
  id: string
  type: 'logo' | 'banner' | 'video' | 'copy'
  name: string
  active: boolean
  url: string
  createdAt: string
}

export interface BrandCampaignItem {
  id: string
  title: string
  description: string
  storeIds: string[]
  status: 'draft' | 'pending_review' | 'approved' | 'active' | 'ended' | 'cancelled'
  startDate: string
  endDate: string
  createdBy: string
}

export interface BrandCollaborationItem {
  id: string
  title: string
  partner: {
    name: string
    grade: 'platinum' | 'gold' | 'silver' | 'bronze'
    contactName: string
  }
  type: string
  status: 'draft' | 'negotiating' | 'active' | 'ended' | 'terminated'
  startDate: string
  endDate: string
}

export interface BrandOperationsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  assets: BrandAssetItem[]
  campaigns: BrandCampaignItem[]
  collaborations: BrandCollaborationItem[]
  generatedAt: string
  error?: string
}

export const defaultAssets: BrandAssetItem[] = [
  { id: 'A1', type: 'logo', name: '神机营主 Logo', active: true, url: '/assets/logo-main.png', createdAt: '2026-01-15' },
  { id: 'A2', type: 'banner', name: '夏季主 KV Banner', active: true, url: '/assets/banner-summer.jpg', createdAt: '2026-03-01' },
  { id: 'A3', type: 'video', name: '品牌宣传片', active: false, url: '/assets/brand-video.mp4', createdAt: '2026-02-10' },
  { id: 'A4', type: 'copy', name: '品牌 Slogan 集', active: true, url: '/assets/slogans.txt', createdAt: '2026-01-20' },
]

export const defaultCampaigns: BrandCampaignItem[] = [
  {
    id: 'C1',
    title: '夏日狂欢季',
    description: '2026 夏季跨城促销主战役',
    storeIds: ['s1', 's2', 's3'],
    status: 'active',
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    createdBy: 'marketing.director',
  },
  {
    id: 'C2',
    title: '中秋联名周',
    description: '与饮品品牌联动的节庆传播活动',
    storeIds: ['s1', 's4'],
    status: 'approved',
    startDate: '2026-09-10',
    endDate: '2026-09-30',
    createdBy: 'brand.ops',
  },
  {
    id: 'C3',
    title: '双十一预热',
    description: '预售拉新和会员转化活动',
    storeIds: ['s1', 's2', 's3', 's4'],
    status: 'pending_review',
    startDate: '2026-10-20',
    endDate: '2026-11-11',
    createdBy: 'ecommerce.team',
  },
]

export const defaultCollaborations: BrandCollaborationItem[] = [
  {
    id: 'CO1',
    title: 'SEGA 联名推广',
    partner: { name: 'SEGA', grade: 'platinum', contactName: '田中' },
    type: 'co_branding',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
  {
    id: 'CO2',
    title: '可口可乐夏季联名',
    partner: { name: '可口可乐', grade: 'gold', contactName: '刘经理' },
    type: 'joint_promotion',
    status: 'active',
    startDate: '2026-06-01',
    endDate: '2026-09-30',
  },
  {
    id: 'CO3',
    title: 'VR 设备赞助合作',
    partner: { name: 'VR 设备商', grade: 'silver', contactName: '王总' },
    type: 'sponsorship',
    status: 'negotiating',
    startDate: '2026-09-01',
    endDate: '2027-08-31',
  },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveBrandOperationsApiBaseUrl(): string {
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

async function fetchBrandOperationsPart<T>(path: string): Promise<T> {
  const upstreamUrl = new URL(path, resolveBrandOperationsApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`brand operations upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  return unwrapApiPayload<T>(payload)
}

function getLatestBrandTimestamp(
  assets: BrandAssetItem[],
  campaigns: BrandCampaignItem[],
  collaborations: BrandCollaborationItem[]
): string {
  const values = [
    ...assets.map((item) => item.createdAt),
    ...campaigns.map((item) => item.endDate),
    ...collaborations.map((item) => item.endDate),
  ]
  if (values.length === 0) return '—'
  return values.sort().at(-1) ?? '—'
}

export async function loadBrandOperationsSnapshot(): Promise<BrandOperationsSnapshotDelivery> {
  try {
    const [assets, campaigns, collaborations] = await Promise.all([
      fetchBrandOperationsPart<BrandAssetItem[]>('brand-operations/assets'),
      fetchBrandOperationsPart<BrandCampaignItem[]>('brand-operations/campaigns'),
      fetchBrandOperationsPart<BrandCollaborationItem[]>('brand-operations/collaborations'),
    ])

    return {
      deliveryMode: 'api',
      assets,
      campaigns,
      collaborations,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      assets: defaultAssets,
      campaigns: defaultCampaigns,
      collaborations: defaultCollaborations,
      generatedAt: getLatestBrandTimestamp(defaultAssets, defaultCampaigns, defaultCollaborations),
      error: '品牌运营实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
