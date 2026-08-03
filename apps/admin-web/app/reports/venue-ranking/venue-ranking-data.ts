export type VenueRankingSortKey = 'revenue' | 'orders' | 'rating'

export interface VenueRecord {
  name: string
  city: string
  orders: number
  revenue: number
  members: number
  rating: number
  popularService: string
}

export interface VenueRankingStats {
  totalVenues: number
  revenue: number
  orders: number
  members: number
  avgRevenue: number
  topRating: number
  topVenue: string
}

export interface VenueRankingSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'venue-ranking-api-live' | 'venue-ranking-local-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
  records: VenueRecord[]
  stats: VenueRankingStats
}

export const VENUE_RANKING_SORT_OPTIONS: VenueRankingSortKey[] = ['revenue', 'orders', 'rating']

export const VENUE_SORT_LABELS: Record<VenueRankingSortKey, string> = {
  revenue: '营收',
  orders: '订单',
  rating: '评分',
}

export const MOCK_VENUE_RECORDS: VenueRecord[] = [
  { name: '胜也射击-陆家嘴旗舰', city: '上海', orders: 2846, revenue: 856200, members: 1832, rating: 4.8, popularService: '竞技射击套餐' },
  { name: '胜也射击-静安寺店', city: '上海', orders: 1950, revenue: 589400, members: 1240, rating: 4.7, popularService: '新手体验课' },
  { name: '胜也射击-成都IFS', city: '成都', orders: 1620, revenue: 498500, members: 1056, rating: 4.6, popularService: 'VR射击套餐' },
  { name: '胜也射击-广州天河', city: '广州', orders: 1432, revenue: 425000, members: 924, rating: 4.5, popularService: '团建射击包场' },
  { name: '胜也射击-深圳南山', city: '深圳', orders: 1287, revenue: 386500, members: 835, rating: 4.5, popularService: '会员专属练习' },
  { name: '胜也射击-杭州西湖', city: '杭州', orders: 986, revenue: 298700, members: 625, rating: 4.4, popularService: '亲子射击体验' },
  { name: '胜也射击-南京新街口', city: '南京', orders: 843, revenue: 256800, members: 534, rating: 4.3, popularService: '激光射击' },
  { name: '胜也射击-重庆解放碑', city: '重庆', orders: 756, revenue: 228900, members: 487, rating: 4.2, popularService: '射击挑战赛' },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

type VenueRankingApiPayload = VenueRecord[] | { records?: VenueRecord[]; generatedAt?: string }

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveVenueRankingApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) return `${DEFAULT_API_ORIGIN}/api/`
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) return ensureTrailingSlash(normalized)
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized.replace(/\/v1\/?$/, '/'))
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) throw new Error(wrapped.message ?? 'API error')
    return wrapped.data as T
  }
  return payload as T
}

async function fetchVenueRankingPayload(): Promise<VenueRankingApiPayload> {
  const upstreamUrl = new URL('reports/venue-ranking', resolveVenueRankingApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, { method: 'GET', cache: 'no-store' })
  if (!response.ok) throw new Error(`venue-ranking upstream failed: ${response.status}`)
  return unwrapApiPayload<VenueRankingApiPayload>(await response.json())
}

function extractVenueRecords(payload: VenueRankingApiPayload): VenueRecord[] {
  if (Array.isArray(payload)) return payload
  return Array.isArray(payload.records) ? payload.records : []
}

function buildFallbackSnapshot(error?: string): VenueRankingSnapshotDelivery {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'venue-ranking-local-snapshot',
    generatedAt: '2026-07-27T08:15:00Z',
    controlPlaneSource: 'loadVenueRankingSnapshot -> MOCK_VENUE_RECORDS fallback',
    businessDataSource: 'local venue-ranking workspace samples',
    refreshPath: 'VenueRankingPage -> loadVenueRankingSnapshot',
    note: '当前场馆排名页展示的是本地样本快照，不可作为实时场馆排名复签证据。',
    error,
    records: MOCK_VENUE_RECORDS,
    stats: computeVenueRankingStats(MOCK_VENUE_RECORDS),
  }
}

export function computeVenueRankingStats(records: VenueRecord[]): VenueRankingStats {
  const revenue = records.reduce((sum, record) => sum + record.revenue, 0)
  const orders = records.reduce((sum, record) => sum + record.orders, 0)
  const members = records.reduce((sum, record) => sum + record.members, 0)
  const topRated = [...records].sort((left, right) => right.rating - left.rating)[0]
  return {
    totalVenues: records.length,
    revenue,
    orders,
    members,
    avgRevenue: records.length > 0 ? Math.round(revenue / records.length) : 0,
    topRating: topRated?.rating ?? 0,
    topVenue: topRated?.name ?? '—',
  }
}

export function sortVenueRecords(records: VenueRecord[], sortBy: VenueRankingSortKey): VenueRecord[] {
  return [...records].sort((left, right) => right[sortBy] - left[sortBy])
}

export function filterVenueRecords(records: VenueRecord[], search: string): VenueRecord[] {
  if (!search.trim()) return records
  const keyword = search.trim()
  return records.filter((record) => record.name.includes(keyword) || record.city.includes(keyword))
}

export async function loadVenueRankingSnapshot(): Promise<VenueRankingSnapshotDelivery> {
  try {
    const payload = await fetchVenueRankingPayload()
    const records = extractVenueRecords(payload)
    if (records.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'venue-ranking-api-live',
        generatedAt: Array.isArray(payload) ? '2026-07-27T08:15:00Z' : payload.generatedAt ?? '2026-07-27T08:15:00Z',
        controlPlaneSource: 'loadVenueRankingSnapshot -> reports/venue-ranking',
        businessDataSource: 'reports/venue-ranking upstream response',
        refreshPath: 'VenueRankingPage -> loadVenueRankingSnapshot',
        note: '当前场馆排名页已优先接入真实排名快照，接口异常时会显式降级为 fallback 样本。',
        records,
        stats: computeVenueRankingStats(records),
      }
    }
  } catch (error) {
    return buildFallbackSnapshot(
      error instanceof Error
        ? `${error.message}，已切换到 fallback 样本数据。`
        : '场馆排名实时接口不可达，已切换到 fallback 样本数据。'
    )
  }

  return buildFallbackSnapshot('场馆排名实时接口返回空列表，已切换到 fallback 样本数据。')
}
