const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface SystemConfigItem {
  key: string
  label: string
  value: string
  description: string
  category: string
  valueType: string
  updatedAt: string
}

export interface SystemConfigGroup {
  key: string
  title: string
  description: string
  items: SystemConfigItem[]
}

export interface SystemConfigSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'system-config-api' | 'system-config-fallback'
  groups: SystemConfigGroup[]
  categories: string[]
  generatedAt: string
  error?: string
}

interface SystemConfigApiRecord {
  key?: string
  category?: string
  value?: string
  valueType?: string
  description?: string
  updatedAt?: string
}

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  feature_flag: {
    title: '功能开关',
    description: '平台级启停项、实验开关与默认治理策略。',
  },
  rate_limit: {
    title: '限流阈值',
    description: 'API 与租户级流量保护阈值。',
  },
  maintenance: {
    title: '维护模式',
    description: '维护窗口、提示文案与临时封控信息。',
  },
  whitelist: {
    title: '白名单策略',
    description: '域名/IP 白名单与跨域治理约束。',
  },
  sso: {
    title: 'SSO 配置',
    description: '默认身份源与认证入口编排。',
  },
  notification: {
    title: '通知总开关',
    description: '全局邮件、短信等通知能力总开关。',
  },
  platform: {
    title: '平台参数',
    description: '语言、会话时长和平台默认参数。',
  },
}

export const fallbackSettings: SystemConfigApiRecord[] = [
  {
    key: 'feature_flag.auto_approve_new_tenant',
    category: 'feature_flag',
    value: 'false',
    valueType: 'boolean',
    description: '新租户注册自动审核开关',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'rate_limit.api_global',
    category: 'rate_limit',
    value: '1000',
    valueType: 'number',
    description: '全局 API 限流 (QPS)',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'rate_limit.api_per_tenant',
    category: 'rate_limit',
    value: '100',
    valueType: 'number',
    description: '每租户 API 限流 (QPS)',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'maintenance.mode',
    category: 'maintenance',
    value: 'false',
    valueType: 'boolean',
    description: '平台维护模式总开关',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'maintenance.message',
    category: 'maintenance',
    value: '系统维护中，请稍后访问',
    valueType: 'string',
    description: '维护模式提示文案',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'whitelist.allowed_domains',
    category: 'whitelist',
    value: '["shenjiying.com"]',
    valueType: 'json_array',
    description: '允许访问的域名白名单',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'whitelist.allowed_ips',
    category: 'whitelist',
    value: '[]',
    valueType: 'json_array',
    description: '平台 IP 白名单',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'sso.default_provider',
    category: 'sso',
    value: 'internal',
    valueType: 'string',
    description: '默认 SSO 提供商',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'notification.email_global_enabled',
    category: 'notification',
    value: 'true',
    valueType: 'boolean',
    description: '全局邮件通知开关',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'notification.sms_global_enabled',
    category: 'notification',
    value: 'true',
    valueType: 'boolean',
    description: '全局短信通知开关',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'platform.default_locale',
    category: 'platform',
    value: 'zh-CN',
    valueType: 'string',
    description: '平台默认语言',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    key: 'platform.session_timeout_minutes',
    category: 'platform',
    value: '1440',
    valueType: 'number',
    description: '会话超时时间 (分钟)',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
]

export const fallbackCategories = Object.keys(CATEGORY_META)

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveSystemConfigApiBaseUrl(): string {
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

function toLabel(key: string): string {
  const lastSegment = key.split('.').pop() ?? key
  return lastSegment
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ')
}

function toGroup(category: string, items: SystemConfigApiRecord[]): SystemConfigGroup {
  const meta = CATEGORY_META[category] ?? {
    title: category,
    description: '未登记分类，作为原始配置项透出。',
  }
  return {
    key: category,
    title: meta.title,
    description: meta.description,
    items: items.map((item) => ({
      key: item.key ?? `${category}-unknown`,
      label: toLabel(item.key ?? `${category}-unknown`),
      value: item.value ?? '—',
      description: item.description ?? '未提供说明',
      category: item.category ?? category,
      valueType: item.valueType ?? 'string',
      updatedAt: item.updatedAt ?? '—',
    })),
  }
}

function buildGroups(records: SystemConfigApiRecord[], categories: string[]): SystemConfigGroup[] {
  const grouped = new Map<string, SystemConfigApiRecord[]>()
  for (const record of records) {
    const category = record.category ?? 'uncategorized'
    const current = grouped.get(category) ?? []
    current.push(record)
    grouped.set(category, current)
  }

  const orderedCategories = categories.length > 0 ? categories : Array.from(grouped.keys())
  return orderedCategories
    .filter((category) => (grouped.get(category) ?? []).length > 0)
    .map((category) => toGroup(category, grouped.get(category) ?? []))
}

function getLatestTimestamp(records: SystemConfigApiRecord[]): string {
  const timestamps = records
    .map((item) => item.updatedAt ?? '')
    .filter(Boolean)
    .sort()
  return timestamps.at(-1) ?? new Date().toISOString()
}

async function fetchSystemConfigRecords(): Promise<{
  records: SystemConfigApiRecord[]
  categories: string[]
}> {
  const settingsUrl = new URL('system-config', resolveSystemConfigApiBaseUrl()).toString()
  const categoriesUrl = new URL('system-config/meta/categories', resolveSystemConfigApiBaseUrl()).toString()

  const [settingsResponse, categoriesResponse] = await Promise.all([
    fetch(settingsUrl, { method: 'GET', cache: 'no-store' }),
    fetch(categoriesUrl, { method: 'GET', cache: 'no-store' }),
  ])

  if (!settingsResponse.ok) {
    throw new Error(`system-config upstream failed: ${settingsResponse.status}`)
  }
  if (!categoriesResponse.ok) {
    throw new Error(`system-config categories upstream failed: ${categoriesResponse.status}`)
  }

  const settingsPayload = await settingsResponse.json()
  const categoriesPayload = await categoriesResponse.json()
  const settingsData = unwrapApiPayload<{
    items?: SystemConfigApiRecord[]
    settings?: SystemConfigApiRecord[]
  }>(settingsPayload)
  const categoriesData = unwrapApiPayload<{ categories?: string[] }>(categoriesPayload)

  return {
    records: settingsData.items ?? settingsData.settings ?? [],
    categories: categoriesData.categories ?? [],
  }
}

export async function loadSystemConfigSnapshot(): Promise<SystemConfigSnapshotDelivery> {
  try {
    const { records, categories } = await fetchSystemConfigRecords()
    if (records.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'system-config-api',
        groups: buildGroups(records, categories),
        categories,
        generatedAt: new Date().toISOString(),
      }
    }
  } catch {
    // fall through to fallback snapshot
  }

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'system-config-fallback',
    groups: buildGroups(fallbackSettings, fallbackCategories),
    categories: fallbackCategories,
    generatedAt: getLatestTimestamp(fallbackSettings),
    error: '系统配置实时接口不可达，已切换到 fallback 样本数据。',
  }
}
