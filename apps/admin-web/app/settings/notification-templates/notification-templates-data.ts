const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface NotificationTemplateSnapshot {
  id: string
  code: string
  scene: string
  channel: string
  titleTemplate: string
  bodyTemplate: string
  variables: string[]
  version: number
  enabled: boolean
  updatedAt: string
}

export interface VariableRuleSnapshot {
  key: string
  value: string
}

export interface NotificationTemplatesSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'notification-templates-api' | 'notification-templates-fallback'
  templates: NotificationTemplateSnapshot[]
  variableRules: VariableRuleSnapshot[]
  generatedAt: string
  error?: string
}

interface NotificationTemplateApiRecord {
  id?: string
  code?: string
  channel?: string
  scopeType?: string
  locale?: string
  titleTemplate?: string
  bodyTemplate?: string
  variables?: string[]
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
}

export const defaultNotificationTemplates: NotificationTemplateSnapshot[] = [
  {
    id: 'tpl-order-confirmed-sms',
    code: 'order_confirmed',
    scene: '订单确认',
    channel: '短信',
    titleTemplate: '订单确认通知',
    bodyTemplate: '尊敬的{userName}，您的订单{orderId}已确认，预计{deliveryDate}送达。',
    variables: ['userName', 'orderId', 'deliveryDate'],
    version: 2,
    enabled: true,
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    id: 'tpl-payment-success-email',
    code: 'payment_received',
    scene: '支付成功',
    channel: '邮件',
    titleTemplate: '支付成功 - 订单{orderId}',
    bodyTemplate: '您已成功支付{amount}元，订单号:{orderId}',
    variables: ['orderId', 'amount'],
    version: 1,
    enabled: true,
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    id: 'tpl-verification-code-sms',
    code: 'verification_code',
    scene: '验证码',
    channel: '短信',
    titleTemplate: '验证码',
    bodyTemplate: '您的验证码是{code}，有效期为{expireMinutes}分钟。',
    variables: ['code', 'expireMinutes'],
    version: 3,
    enabled: true,
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    id: 'tpl-shipping-sms',
    code: 'order_shipped',
    scene: '发货通知',
    channel: '短信',
    titleTemplate: '发货提醒',
    bodyTemplate: '订单{orderId}已发货，物流单号{trackingNo}，承运商{company}。',
    variables: ['orderId', 'trackingNo', 'company'],
    version: 1,
    enabled: false,
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    id: 'tpl-system-alert-email',
    code: 'system_alert',
    scene: '系统告警',
    channel: '邮件',
    titleTemplate: '系统异常告警',
    bodyTemplate: '告警项{alertName} 当前级别{severity}，触发时间{timestamp}。',
    variables: ['alertName', 'severity', 'timestamp'],
    version: 1,
    enabled: true,
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
]

export const defaultVariableRules: VariableRuleSnapshot[] = [
  { key: '变量格式', value: '{变量名} 大括号包裹' },
  { key: '变量命名', value: 'camelCase，只含字母与数字' },
  { key: '声明要求', value: '模板使用的变量必须在 variables 中显式声明' },
  { key: '未闭合变量', value: '系统自动检测并告警' },
  { key: '默认值', value: '缺失变量保留原始 {占位符}' },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveNotificationTemplatesApiBaseUrl(): string {
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

function humanizeCode(code: string): string {
  const keywordMap: Record<string, string> = {
    order_confirmed: '订单确认',
    payment_received: '支付成功',
    verification_code: '验证码',
    order_shipped: '发货通知',
    system_alert: '系统告警',
  }
  return keywordMap[code] ?? code.replace(/_/g, ' ')
}

function channelLabel(channel: string): string {
  const labels: Record<string, string> = {
    sms: '短信',
    email: '邮件',
    push: 'Push',
    in_app: 'App内',
  }
  return labels[channel] ?? channel
}

function mapApiTemplate(
  record: NotificationTemplateApiRecord,
  index: number
): NotificationTemplateSnapshot {
  const code = record.code ?? `template_${index + 1}`
  return {
    id: record.id ?? `notification-template-${index + 1}`,
    code,
    scene: humanizeCode(code),
    channel: channelLabel(record.channel ?? 'sms'),
    titleTemplate: record.titleTemplate ?? humanizeCode(code),
    bodyTemplate: record.bodyTemplate ?? '',
    variables: record.variables ?? [],
    version: 1,
    enabled: record.enabled ?? true,
    updatedAt: record.updatedAt ?? record.createdAt ?? new Date().toISOString(),
  }
}

async function fetchNotificationTemplates(): Promise<NotificationTemplateSnapshot[]> {
  const upstreamUrl = new URL(
    'notifications/templates',
    resolveNotificationTemplatesApiBaseUrl()
  ).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`notification templates upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<
    { items?: NotificationTemplateApiRecord[]; templates?: NotificationTemplateApiRecord[] } | NotificationTemplateApiRecord[]
  >(payload)
  const items = Array.isArray(data) ? data : data.templates ?? data.items ?? []
  return items.map(mapApiTemplate)
}

function getLatestTimestamp(items: NotificationTemplateSnapshot[]): string {
  const timestamps = items
    .map((item) => item.updatedAt)
    .filter(Boolean)
    .sort()
  return timestamps.at(-1) ?? new Date().toISOString()
}

export async function loadNotificationTemplatesSnapshot(): Promise<NotificationTemplatesSnapshotDelivery> {
  try {
    const templates = await fetchNotificationTemplates()
    if (templates.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'notification-templates-api',
        templates,
        variableRules: defaultVariableRules,
        generatedAt: new Date().toISOString(),
      }
    }
  } catch {
    // fall through to fallback snapshot
  }

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'notification-templates-fallback',
    templates: defaultNotificationTemplates,
    variableRules: defaultVariableRules,
    generatedAt: getLatestTimestamp(defaultNotificationTemplates),
    error: '通知模板实时接口不可达，已切换到 fallback 样本数据。',
  }
}
