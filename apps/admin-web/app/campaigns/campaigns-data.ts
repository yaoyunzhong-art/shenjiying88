import { apiFetchJson } from '../api/_client'

export interface Campaign {
  id: string
  name: string
  description: string
  type: 'promotion' | 'new-member' | 'referral' | 'seasonal' | 'clearance'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  budgetCents: number
  spentCents: number
  usageCount: number
  targetMetric: string
  targetValue: number
  currentValue: number
  channels: string[]
  tenantId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CampaignsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  campaigns: Campaign[]
  generatedAt: string
  error?: string
}

export const defaultCampaigns: Campaign[] = [
  {
    id: 'cmp-1', name: '夏日狂欢季', description: '暑期全场8折优惠',
    type: 'promotion', status: 'active',
    startDate: '2026-07-01', endDate: '2026-08-31',
    budgetCents: 5000000, spentCents: 1280000, usageCount: 856,
    targetMetric: 'revenue', targetValue: 30000000, currentValue: 8500000,
    channels: ['mini-app', 'wechat', 'in-store'],
    tenantId: 'tenant-1', createdBy: 'admin',
    createdAt: '2026-06-25T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'cmp-2', name: '新会员专享', description: '注册即送100积分+满减券',
    type: 'new-member', status: 'active',
    startDate: '2026-07-01', endDate: '2026-12-31',
    budgetCents: 2000000, spentCents: 450000, usageCount: 723,
    targetMetric: 'new-users', targetValue: 5000, currentValue: 1820,
    channels: ['mini-app', 'wechat', 'douyin'],
    tenantId: 'tenant-1', createdBy: 'admin',
    createdAt: '2026-06-20T00:00:00Z', updatedAt: '2026-07-14T14:00:00Z',
  },
  {
    id: 'cmp-3', name: '推荐有礼V3', description: '老带新双方得50元券',
    type: 'referral', status: 'active',
    startDate: '2026-06-01', endDate: '2026-09-30',
    budgetCents: 1000000, spentCents: 320000, usageCount: 412,
    targetMetric: 'redemption', targetValue: 2000, currentValue: 876,
    channels: ['mini-app', 'sms'],
    tenantId: 'tenant-1', createdBy: 'market',
    createdAt: '2026-05-28T00:00:00Z', updatedAt: '2026-07-13T09:00:00Z',
  },
  {
    id: 'cmp-4', name: '端午特惠', description: '端午3天限时折扣',
    type: 'seasonal', status: 'completed',
    startDate: '2026-06-08', endDate: '2026-06-10',
    budgetCents: 800000, spentCents: 760000, usageCount: 1340,
    targetMetric: 'revenue', targetValue: 5000000, currentValue: 4820000,
    channels: ['mini-app', 'in-store', 'wechat'],
    tenantId: 'tenant-1', createdBy: 'admin',
    createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-11T10:00:00Z',
  },
  {
    id: 'cmp-5', name: '换季清仓', description: '春季商品5折出清',
    type: 'clearance', status: 'draft',
    startDate: '2026-09-01', endDate: '2026-09-15',
    budgetCents: 3000000, spentCents: 0, usageCount: 0,
    targetMetric: 'traffic', targetValue: 10000, currentValue: 0,
    channels: ['in-store'],
    tenantId: 'tenant-1', createdBy: 'market',
    createdAt: '2026-07-10T00:00:00Z', updatedAt: '2026-07-10T00:00:00Z',
  },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveCampaignsApiBaseUrl(): string {
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

async function fetchCampaigns(): Promise<Campaign[]> {
  const upstreamUrl = new URL('brand/campaigns', resolveCampaignsApiBaseUrl()).toString()
  const data = await apiFetchJson<{ campaigns: Campaign[] }>(upstreamUrl)
  return data.campaigns
}

function getLatestCampaignTimestamp(campaigns: Campaign[]): string {
  if (campaigns.length === 0) return '—'
  return campaigns.reduce(
    (latest, campaign) => (campaign.updatedAt > latest ? campaign.updatedAt : latest),
    campaigns[0]!.updatedAt
  )
}

export async function loadCampaignsSnapshot(): Promise<CampaignsSnapshotDelivery> {
  try {
    const campaigns = await fetchCampaigns()
    return {
      deliveryMode: 'api',
      campaigns,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      campaigns: defaultCampaigns,
      generatedAt: getLatestCampaignTimestamp(defaultCampaigns),
      error: '营销活动实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
