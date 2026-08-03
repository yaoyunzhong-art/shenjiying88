export interface ActivityRecord {
  date: string
  activeUsers: number
  newUsers: number
  sessions: number
  avgDuration: number
  engagement: number
  topFeature: string
}

export interface UserActivityStats {
  avgUsers: number
  totalSessions: number
  totalNewUsers: number
  avgEngagement: number
  peakUsers: number
  avgDuration: number
}

export interface UserActivitySnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'user-activity-api-live' | 'user-activity-local-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
  records: ActivityRecord[]
  stats: UserActivityStats
}

export const MOCK_ACTIVITY_RECORDS: ActivityRecord[] = [
  { date: '2026-07-14', activeUsers: 328, newUsers: 42, sessions: 1654, avgDuration: 37, engagement: 0.72, topFeature: '射击预约' },
  { date: '2026-07-15', activeUsers: 376, newUsers: 51, sessions: 1820, avgDuration: 42, engagement: 0.76, topFeature: '会员充值' },
  { date: '2026-07-16', activeUsers: 298, newUsers: 35, sessions: 1432, avgDuration: 33, engagement: 0.68, topFeature: 'VR体验' },
  { date: '2026-07-17', activeUsers: 452, newUsers: 67, sessions: 2150, avgDuration: 45, engagement: 0.81, topFeature: '组队竞技' },
  { date: '2026-07-18', activeUsers: 510, newUsers: 78, sessions: 2430, avgDuration: 48, engagement: 0.85, topFeature: '射击挑战赛' },
  { date: '2026-07-19', activeUsers: 486, newUsers: 63, sessions: 2280, avgDuration: 42, engagement: 0.79, topFeature: '团购核销' },
  { date: '2026-07-20', activeUsers: 215, newUsers: 28, sessions: 980, avgDuration: 29, engagement: 0.62, topFeature: '积分兑换' },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

type UserActivityApiPayload = ActivityRecord[] | { records?: ActivityRecord[]; generatedAt?: string }

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveUserActivityApiBaseUrl(): string {
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

async function fetchUserActivityPayload(): Promise<UserActivityApiPayload> {
  const upstreamUrl = new URL('reports/user-activity', resolveUserActivityApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, { method: 'GET', cache: 'no-store' })
  if (!response.ok) throw new Error(`user-activity upstream failed: ${response.status}`)
  return unwrapApiPayload<UserActivityApiPayload>(await response.json())
}

function extractActivityRecords(payload: UserActivityApiPayload): ActivityRecord[] {
  if (Array.isArray(payload)) return payload
  return Array.isArray(payload.records) ? payload.records : []
}

function buildFallbackSnapshot(error?: string): UserActivitySnapshotDelivery {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'user-activity-local-snapshot',
    generatedAt: '2026-07-27T08:05:00Z',
    controlPlaneSource: 'loadUserActivitySnapshot -> MOCK_ACTIVITY_RECORDS fallback',
    businessDataSource: 'local user-activity workspace samples',
    refreshPath: 'UserActivityPage -> loadUserActivitySnapshot',
    note: '当前用户活跃页展示的是本地样本快照，不可作为实时活跃审计证据。',
    error,
    records: MOCK_ACTIVITY_RECORDS,
    stats: computeUserActivityStats(MOCK_ACTIVITY_RECORDS),
  }
}

export function computeUserActivityStats(records: ActivityRecord[]): UserActivityStats {
  const totalSessions = records.reduce((sum, record) => sum + record.sessions, 0)
  const totalNewUsers = records.reduce((sum, record) => sum + record.newUsers, 0)
  const totalUsers = records.reduce((sum, record) => sum + record.activeUsers, 0)
  return {
    avgUsers: records.length > 0 ? Math.round(totalUsers / records.length) : 0,
    totalSessions,
    totalNewUsers,
    avgEngagement: records.length > 0 ? records.reduce((sum, record) => sum + record.engagement, 0) / records.length : 0,
    peakUsers: records.length > 0 ? Math.max(...records.map((record) => record.activeUsers)) : 0,
    avgDuration: records.length > 0 ? Math.round(records.reduce((sum, record) => sum + record.avgDuration, 0) / records.length) : 0,
  }
}

export function filterUserActivityRecords(records: ActivityRecord[], search: string): ActivityRecord[] {
  if (!search.trim()) return records
  const keyword = search.trim()
  return records.filter((record) => record.date.includes(keyword) || record.topFeature.includes(keyword))
}

export async function loadUserActivitySnapshot(): Promise<UserActivitySnapshotDelivery> {
  try {
    const payload = await fetchUserActivityPayload()
    const records = extractActivityRecords(payload)
    if (records.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'user-activity-api-live',
        generatedAt: Array.isArray(payload) ? '2026-07-27T08:05:00Z' : payload.generatedAt ?? '2026-07-27T08:05:00Z',
        controlPlaneSource: 'loadUserActivitySnapshot -> reports/user-activity',
        businessDataSource: 'reports/user-activity upstream response',
        refreshPath: 'UserActivityPage -> loadUserActivitySnapshot',
        note: '当前用户活跃页已优先接入真实活跃快照，接口异常时会显式降级为 fallback 样本。',
        records,
        stats: computeUserActivityStats(records),
      }
    }
  } catch (error) {
    return buildFallbackSnapshot(
      error instanceof Error
        ? `${error.message}，已切换到 fallback 样本数据。`
        : '用户活跃实时接口不可达，已切换到 fallback 样本数据。'
    )
  }

  return buildFallbackSnapshot('用户活跃实时接口返回空列表，已切换到 fallback 样本数据。')
}
