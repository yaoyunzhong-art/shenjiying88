export interface Integration {
  id: string
  name: string
  provider: string
  type: 'payment' | 'social' | 'delivery' | 'crm' | 'erp' | 'custom'
  description: string
  status: 'active' | 'inactive' | 'error' | 'pending'
  apiKeyId?: string
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'failed'
  errorMessage?: string
  configFields: Array<{ key: string; label: string; value: string }>
  endpoints: Array<{ name: string; url: string; method: string }>
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface IntegrationsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  integrations: Integration[]
  generatedAt: string
  error?: string
}

export const defaultIntegrations: Integration[] = [
  { id: 'int-1', name: '微信支付', provider: 'wechat', type: 'payment', description: '微信支付商户平台对接', status: 'active', lastSyncAt: '2026-07-18T10:00:00Z', lastSyncStatus: 'success', configFields: [{ key: 'appId', label: 'AppID', value: 'wx_****1234' }, { key: 'mchId', label: '商户号', value: '1234567890' }], endpoints: [{ name: '支付回调', url: 'https://api.example.com/pay/callback', method: 'POST' }], tenantId: 't1', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
  { id: 'int-2', name: '抖音小程序', provider: 'douyin', type: 'social', description: '抖音小程序对接', status: 'active', lastSyncAt: '2026-07-17T08:00:00Z', lastSyncStatus: 'success', configFields: [{ key: 'appId', label: 'AppID', value: 'tt_****5678' }, { key: 'secret', label: '密钥', value: '****' }], endpoints: [{ name: '订单同步', url: 'https://api.example.com/dy/orders', method: 'POST' }, { name: '退款回调', url: 'https://api.example.com/dy/refund', method: 'POST' }], tenantId: 't1', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-07-17T08:00:00Z' },
  { id: 'int-3', name: '美团外卖', provider: 'meituan', type: 'delivery', description: '美团外卖订单推送', status: 'error', lastSyncAt: '2026-07-18T06:00:00Z', lastSyncStatus: 'failed', errorMessage: 'Token过期，请重新授权', configFields: [{ key: 'shopId', label: '门店ID', value: 'mt_****9012' }, { key: 'token', label: 'Token', value: '********' }], endpoints: [{ name: '订单推送', url: 'https://api.example.com/mt/orders', method: 'POST' }], tenantId: 't1', createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-07-18T06:00:00Z' },
  { id: 'int-4', name: '支付宝开放平台', provider: 'alipay', type: 'payment', description: '支付宝商户集成', status: 'active', lastSyncAt: '2026-07-16T12:00:00Z', lastSyncStatus: 'success', configFields: [{ key: 'appId', label: 'AppID', value: '2026****3456' }, { key: 'publicKey', label: '公钥', value: 'MIIB****' }], endpoints: [{ name: '支付通知', url: 'https://api.example.com/alipay/notify', method: 'POST' }], tenantId: 't1', createdAt: '2026-01-20T00:00:00Z', updatedAt: '2026-07-16T12:00:00Z' },
  { id: 'int-5', name: '自建CRM', provider: 'custom', type: 'crm', description: '自建客户系统对接', status: 'inactive', configFields: [{ key: 'apiKey', label: 'API Key', value: 'ak_****7890' }], endpoints: [{ name: '客户同步', url: 'https://crm.example.com/api/sync', method: 'POST' }], tenantId: 't1', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveIntegrationsApiBaseUrl(): string {
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

async function fetchIntegrations(): Promise<Integration[]> {
  const upstreamUrl = new URL('openapi/integrations', resolveIntegrationsApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`integrations upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<{ integrations: Integration[] }>(payload)
  return data.integrations
}

function getLatestIntegrationTimestamp(integrations: Integration[]): string {
  if (integrations.length === 0) return '—'
  return integrations.reduce(
    (latest, integration) => (integration.updatedAt > latest ? integration.updatedAt : latest),
    integrations[0]!.updatedAt
  )
}

export async function loadIntegrationsSnapshot(): Promise<IntegrationsSnapshotDelivery> {
  try {
    const integrations = await fetchIntegrations()
    return {
      deliveryMode: 'api',
      integrations,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      integrations: defaultIntegrations,
      generatedAt: getLatestIntegrationTimestamp(defaultIntegrations),
      error: '第三方集成实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
