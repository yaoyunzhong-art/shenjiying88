export interface PaymentChannel {
  id: string
  name: string
  provider: 'wechat' | 'alipay' | 'unionpay' | 'cash' | 'card' | 'other'
  type: 'online' | 'offline'
  enabled: boolean
  feeRate: number
  dailyLimitCents: number
  singleLimitCents: number
  supportedStoreIds: string[]
  todayAmountCents: number
  todayCount: number
  status: 'normal' | 'degraded' | 'offline'
  lastHealthCheck?: string
  config: Array<{ key: string; label: string; value: string }>
  createdAt: string
  updatedAt: string
}

export interface PaymentChannelsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  channels: PaymentChannel[]
  generatedAt: string
  error?: string
}

export const defaultChannels: PaymentChannel[] = [
  { id: 'ch-1', name: '微信支付', provider: 'wechat', type: 'online', enabled: true, feeRate: 38, dailyLimitCents: 500000000, singleLimitCents: 5000000, supportedStoreIds: [], todayAmountCents: 12850000, todayCount: 423, status: 'normal', lastHealthCheck: '2026-07-18T21:30:00Z', config: [{ key: 'appId', label: 'AppID', value: 'wx_****' }, { key: 'mchId', label: '商户号', value: '123456' }], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T21:30:00Z' },
  { id: 'ch-2', name: '支付宝', provider: 'alipay', type: 'online', enabled: true, feeRate: 38, dailyLimitCents: 500000000, singleLimitCents: 5000000, supportedStoreIds: [], todayAmountCents: 8920000, todayCount: 287, status: 'normal', lastHealthCheck: '2026-07-18T21:28:00Z', config: [{ key: 'appId', label: 'AppID', value: '2026****' }], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T21:28:00Z' },
  { id: 'ch-3', name: '银联刷卡', provider: 'unionpay', type: 'offline', enabled: true, feeRate: 55, dailyLimitCents: 200000000, singleLimitCents: 10000000, supportedStoreIds: ['s1', 's2'], todayAmountCents: 2350000, todayCount: 18, status: 'degraded', lastHealthCheck: '2026-07-18T18:00:00Z', config: [{ key: 'terminalId', label: '终端号', value: 'UP****' }], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T18:00:00Z' },
  { id: 'ch-4', name: '现金', provider: 'cash', type: 'offline', enabled: true, feeRate: 0, dailyLimitCents: 50000000, singleLimitCents: 1000000, supportedStoreIds: [], todayAmountCents: 1850000, todayCount: 156, status: 'normal', config: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolvePaymentChannelsApiBaseUrl(): string {
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

async function fetchPaymentChannels(): Promise<PaymentChannel[]> {
  const upstreamUrl = new URL('cashier/channels', resolvePaymentChannelsApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`payment channels upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<{ channels: PaymentChannel[] }>(payload)
  return data.channels
}

function getLatestChannelTimestamp(channels: PaymentChannel[]): string {
  if (channels.length === 0) return '—'
  return channels.reduce(
    (latest, channel) => (channel.updatedAt > latest ? channel.updatedAt : latest),
    channels[0]!.updatedAt
  )
}

export async function loadPaymentChannelsSnapshot(): Promise<PaymentChannelsSnapshotDelivery> {
  try {
    const channels = await fetchPaymentChannels()
    return {
      deliveryMode: 'api',
      channels,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      channels: defaultChannels,
      generatedAt: getLatestChannelTimestamp(defaultChannels),
      error: '支付渠道实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
