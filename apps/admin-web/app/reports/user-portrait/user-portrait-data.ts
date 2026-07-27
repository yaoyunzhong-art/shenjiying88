export interface UserRecord {
  name: string
  phone: string
  age: number
  gender: string
  level: string
  orders: number
  spend: number
  lastVisit: string
  tags: string[]
}

export interface UserPortraitStats {
  total: number
  orders: number
  spend: number
  avgAge: number
  avgSpend: number
  highValueCount: number
}

export interface UserPortraitSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'user-portrait-api-live' | 'user-portrait-local-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
  records: UserRecord[]
  stats: UserPortraitStats
}

export const USER_LEVEL_OPTIONS = ['普通卡', '银卡', '金卡', '铂金卡', '钻石卡'] as const

export const MOCK_USER_RECORDS: UserRecord[] = [
  { name: '刘明', phone: '138****1234', age: 28, gender: '男', level: '金卡', orders: 48, spend: 15680, lastVisit: '2026-07-19', tags: ['射击爱好者', '高活跃'] },
  { name: '陈芳', phone: '139****5678', age: 32, gender: '女', level: '钻石卡', orders: 72, spend: 28340, lastVisit: '2026-07-20', tags: ['团建组织者', '高消费'] },
  { name: '王浩', phone: '137****9012', age: 25, gender: '男', level: '银卡', orders: 18, spend: 4230, lastVisit: '2026-07-15', tags: ['新用户'] },
  { name: '赵敏', phone: '136****3456', age: 35, gender: '女', level: '金卡', orders: 35, spend: 12450, lastVisit: '2026-07-18', tags: ['亲子用户', '周末高频'] },
  { name: '孙磊', phone: '135****7890', age: 42, gender: '男', level: '铂金卡', orders: 56, spend: 21980, lastVisit: '2026-07-17', tags: ['高端用户', '竞技射击'] },
  { name: '周婷', phone: '134****2345', age: 26, gender: '女', level: '银卡', orders: 12, spend: 3120, lastVisit: '2026-07-10', tags: ['体验型'] },
  { name: '吴刚', phone: '133****6789', age: 38, gender: '男', level: '金卡', orders: 42, spend: 15890, lastVisit: '2026-07-16', tags: ['射击爱好者', '常客'] },
  { name: '郑丽', phone: '132****0123', age: 29, gender: '女', level: '普通卡', orders: 5, spend: 890, lastVisit: '2026-06-28', tags: ['低频用户', '待激活'] },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

type UserPortraitApiPayload = UserRecord[] | { records?: UserRecord[]; generatedAt?: string }

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveUserPortraitApiBaseUrl(): string {
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

async function fetchUserPortraitPayload(): Promise<UserPortraitApiPayload> {
  const upstreamUrl = new URL('reports/user-portrait', resolveUserPortraitApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, { method: 'GET', cache: 'no-store' })
  if (!response.ok) throw new Error(`user-portrait upstream failed: ${response.status}`)
  return unwrapApiPayload<UserPortraitApiPayload>(await response.json())
}

function extractUserRecords(payload: UserPortraitApiPayload): UserRecord[] {
  if (Array.isArray(payload)) return payload
  return Array.isArray(payload.records) ? payload.records : []
}

function buildFallbackSnapshot(error?: string): UserPortraitSnapshotDelivery {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'user-portrait-local-snapshot',
    generatedAt: '2026-07-27T08:10:00Z',
    controlPlaneSource: 'loadUserPortraitSnapshot -> MOCK_USER_RECORDS fallback',
    businessDataSource: 'local user-portrait workspace samples',
    refreshPath: 'UserPortraitPage -> loadUserPortraitSnapshot',
    note: '当前用户画像页展示的是本地样本快照，不可作为实时用户画像复签证据。',
    error,
    records: MOCK_USER_RECORDS,
    stats: computeUserPortraitStats(MOCK_USER_RECORDS),
  }
}

export function computeUserPortraitStats(records: UserRecord[]): UserPortraitStats {
  const orders = records.reduce((sum, record) => sum + record.orders, 0)
  const spend = records.reduce((sum, record) => sum + record.spend, 0)
  return {
    total: records.length,
    orders,
    spend,
    avgAge: records.length > 0 ? Math.round(records.reduce((sum, record) => sum + record.age, 0) / records.length) : 0,
    avgSpend: records.length > 0 ? Math.round(spend / records.length) : 0,
    highValueCount: records.filter((record) => record.spend >= 15000).length,
  }
}

export function filterUserPortraitRecords(records: UserRecord[], search: string, levelFilter: string): UserRecord[] {
  let result = records
  if (levelFilter !== 'all') result = result.filter((record) => record.level === levelFilter)
  if (search.trim()) {
    const keyword = search.trim()
    result = result.filter((record) => record.name.includes(keyword) || record.phone.includes(keyword) || record.tags.some((tag) => tag.includes(keyword)))
  }
  return result
}

export async function loadUserPortraitSnapshot(): Promise<UserPortraitSnapshotDelivery> {
  try {
    const payload = await fetchUserPortraitPayload()
    const records = extractUserRecords(payload)
    if (records.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'user-portrait-api-live',
        generatedAt: Array.isArray(payload) ? '2026-07-27T08:10:00Z' : payload.generatedAt ?? '2026-07-27T08:10:00Z',
        controlPlaneSource: 'loadUserPortraitSnapshot -> reports/user-portrait',
        businessDataSource: 'reports/user-portrait upstream response',
        refreshPath: 'UserPortraitPage -> loadUserPortraitSnapshot',
        note: '当前用户画像页已优先接入真实画像快照，接口异常时会显式降级为 fallback 样本。',
        records,
        stats: computeUserPortraitStats(records),
      }
    }
  } catch (error) {
    return buildFallbackSnapshot(
      error instanceof Error
        ? `${error.message}，已切换到 fallback 样本数据。`
        : '用户画像实时接口不可达，已切换到 fallback 样本数据。'
    )
  }

  return buildFallbackSnapshot('用户画像实时接口返回空列表，已切换到 fallback 样本数据。')
}
