const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface Alert {
  id: string
  storeName: string
  city: string
  type: 'price_change' | 'new_activity' | 'new_promotion' | 'rating_change' | 'equipment_change' | 'policy_change'
  severity: 'high' | 'medium' | 'low'
  description: string
  detectedAt: string
  recommendedAction: string
  deduped?: boolean
  scanMode?: 'incremental' | 'full'
}

export interface TrendPoint {
  date: string
  type: Alert['type']
  count: number
}

export interface MonitorSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  alerts: Alert[]
  trend: TrendPoint[]
  scanTimestamp: string
  scanMode: 'incremental' | 'full'
  freshnessMinutes: number
  generatedAt: string
  error?: string
}

export const defaultAlerts: Alert[] = [
  {
    id: 'alert-1',
    storeName: '玩咖电玩城',
    city: '上海',
    type: 'price_change',
    severity: 'high',
    description: '晚场畅玩票从 99 元下调到 79 元，疑似暑期拉新。',
    detectedAt: '2026-07-26T09:10:00+08:00',
    recommendedAction: '建议同步核验同商圈票价弹性，并准备 48 小时防守券包。',
    scanMode: 'incremental',
  },
  {
    id: 'alert-2',
    storeName: '潮玩空间',
    city: '上海',
    type: 'new_activity',
    severity: 'medium',
    description: '上线暑期联名挑战赛，主打亲子客群。',
    detectedAt: '2026-07-26T08:45:00+08:00',
    recommendedAction: '建议评估是否跟进周末团购活动，并监控社媒扩散。',
    scanMode: 'full',
  },
  {
    id: 'alert-3',
    storeName: '星际乐园',
    city: '杭州',
    type: 'rating_change',
    severity: 'low',
    description: '大众点评评分从 4.6 上升到 4.7。',
    detectedAt: '2026-07-26T08:12:00+08:00',
    recommendedAction: '建议跟踪用户评价关键词，识别服务亮点。',
    scanMode: 'incremental',
  },
  {
    id: 'alert-4',
    storeName: '电竞部落',
    city: '深圳',
    type: 'equipment_change',
    severity: 'medium',
    description: '新增赛车模拟器 4 台，周末主打竞速赛事。',
    detectedAt: '2026-07-25T22:00:00+08:00',
    recommendedAction: '建议复核本店高毛利设备组合，并评估体验区升级窗口。',
    deduped: true,
    scanMode: 'full',
  },
]

export const defaultTrend: TrendPoint[] = [
  { date: '2026-07-20', type: 'price_change', count: 2 },
  { date: '2026-07-20', type: 'new_activity', count: 1 },
  { date: '2026-07-21', type: 'price_change', count: 3 },
  { date: '2026-07-21', type: 'new_promotion', count: 2 },
  { date: '2026-07-22', type: 'rating_change', count: 1 },
  { date: '2026-07-22', type: 'equipment_change', count: 2 },
  { date: '2026-07-23', type: 'policy_change', count: 1 },
  { date: '2026-07-24', type: 'new_activity', count: 3 },
  { date: '2026-07-25', type: 'price_change', count: 2 },
  { date: '2026-07-25', type: 'rating_change', count: 1 },
  { date: '2026-07-26', type: 'price_change', count: 4 },
  { date: '2026-07-26', type: 'new_activity', count: 2 },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveIntelligenceApiBaseUrl(): string {
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

async function fetchMonitorSummary(): Promise<{
  alerts: Alert[]
  trend: TrendPoint[]
  scanTimestamp: string
  scanMode: 'incremental' | 'full'
  freshnessMinutes: number
}> {
  const upstreamUrl = new URL('intelligence/monitor/summary', resolveIntelligenceApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`intelligence monitor upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  return unwrapApiPayload<{
    alerts: Alert[]
    trend: TrendPoint[]
    scanTimestamp: string
    scanMode: 'incremental' | 'full'
    freshnessMinutes: number
  }>(payload)
}

export async function loadMonitorSnapshot(): Promise<MonitorSnapshotDelivery> {
  try {
    const summary = await fetchMonitorSummary()
    return {
      deliveryMode: 'api',
      alerts: summary.alerts,
      trend: summary.trend,
      scanTimestamp: summary.scanTimestamp,
      scanMode: summary.scanMode,
      freshnessMinutes: summary.freshnessMinutes,
      generatedAt: summary.scanTimestamp,
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      alerts: defaultAlerts,
      trend: defaultTrend,
      scanTimestamp: '2026-07-26T09:30:00+08:00',
      scanMode: 'incremental',
      freshnessMinutes: 8,
      generatedAt: '2026-07-26T09:30:00+08:00',
      error: '竞争监控实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
