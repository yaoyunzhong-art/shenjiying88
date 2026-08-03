import {
  resolveServerRequestContext,
  type ServerRequestContextEvidence,
} from '../../lib/server-request-context'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'
const NOTIFICATION_TEMPLATES_ACTOR = {
  actorId: 'admin-notification-templates-workspace',
  actorName: 'Admin Notification Templates Workspace',
  actorType: 'employee-user',
  roles: ['TENANT_ADMIN', 'OPERATIONS'],
  permissions: ['notification:read', 'foundation.governance.read'],
} as const

export interface NotificationTemplateSnapshot {
  id: string
  code: string
  scene: string
  channel: string
  channelCode: string
  scopeType: string
  scopeLabel: string
  tenantId?: string
  brandId?: string
  storeId?: string
  marketCode?: string
  locale: string
  titleTemplate: string
  bodyTemplate: string
  variables: string[]
  version: number | null
  enabled: boolean
  createdAt: string
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
  requestContext: ServerRequestContextEvidence
  error?: string
}

interface NotificationTemplateApiRecord {
  id?: string
  code?: string
  channel?: string
  tenantId?: string
  brandId?: string
  storeId?: string
  marketCode?: string
  scopeType?: string
  locale?: string
  titleTemplate?: string
  bodyTemplate?: string
  variables?: string[]
  version?: number
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
    channelCode: 'sms',
    scopeType: 'TENANT',
    scopeLabel: '租户',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    locale: 'zh-CN',
    titleTemplate: '订单确认通知',
    bodyTemplate: '尊敬的{userName}，您的订单{orderId}已确认，预计{deliveryDate}送达。',
    variables: ['userName', 'orderId', 'deliveryDate'],
    version: 2,
    enabled: true,
    createdAt: '2026-07-26T13:30:00.000Z',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    id: 'tpl-payment-success-email',
    code: 'payment_received',
    scene: '支付成功',
    channel: '邮件',
    channelCode: 'email',
    scopeType: 'BRAND',
    scopeLabel: '品牌',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    marketCode: 'cn-mainland',
    locale: 'zh-CN',
    titleTemplate: '支付成功 - 订单{orderId}',
    bodyTemplate: '您已成功支付{amount}元，订单号:{orderId}',
    variables: ['orderId', 'amount'],
    version: 1,
    enabled: true,
    createdAt: '2026-07-26T13:30:00.000Z',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    id: 'tpl-verification-code-sms',
    code: 'verification_code',
    scene: '验证码',
    channel: '短信',
    channelCode: 'sms',
    scopeType: 'STORE',
    scopeLabel: '门店',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    locale: 'zh-CN',
    titleTemplate: '验证码',
    bodyTemplate: '您的验证码是{code}，有效期为{expireMinutes}分钟。',
    variables: ['code', 'expireMinutes'],
    version: 3,
    enabled: true,
    createdAt: '2026-07-26T13:30:00.000Z',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    id: 'tpl-shipping-sms',
    code: 'order_shipped',
    scene: '发货通知',
    channel: '短信',
    channelCode: 'sms',
    scopeType: 'TENANT',
    scopeLabel: '租户',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    locale: 'zh-CN',
    titleTemplate: '发货提醒',
    bodyTemplate: '订单{orderId}已发货，物流单号{trackingNo}，承运商{company}。',
    variables: ['orderId', 'trackingNo', 'company'],
    version: 1,
    enabled: false,
    createdAt: '2026-07-26T13:30:00.000Z',
    updatedAt: '2026-07-26T13:30:00.000Z',
  },
  {
    id: 'tpl-system-alert-email',
    code: 'system_alert',
    scene: '系统告警',
    channel: '邮件',
    channelCode: 'email',
    scopeType: 'PLATFORM',
    scopeLabel: '平台',
    marketCode: 'cn-mainland',
    locale: 'zh-CN',
    titleTemplate: '系统异常告警',
    bodyTemplate: '告警项{alertName} 当前级别{severity}，触发时间{timestamp}。',
    variables: ['alertName', 'severity', 'timestamp'],
    version: 1,
    enabled: true,
    createdAt: '2026-07-26T13:30:00.000Z',
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
  const normalized = channel.trim().toLowerCase()
  return labels[normalized] ?? channel
}

function scopeLabel(scopeType: string): string {
  const labels: Record<string, string> = {
    PLATFORM: '平台',
    TENANT: '租户',
    BRAND: '品牌',
    STORE: '门店',
  }
  return labels[scopeType.toUpperCase()] ?? scopeType
}

function formatNotificationTemplateError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return `通知模板实时接口不可达，已切换到 fallback 样本数据。原因: ${error.message}`
  }
  return '通知模板实时接口不可达，已切换到 fallback 样本数据。'
}

function mapApiTemplate(
  record: NotificationTemplateApiRecord,
  index: number
): NotificationTemplateSnapshot {
  const code = record.code ?? `template_${index + 1}`
  const rawChannel = record.channel ?? 'sms'
  const rawScopeType = record.scopeType ?? 'TENANT'
  const createdAt = record.createdAt ?? record.updatedAt ?? new Date().toISOString()
  return {
    id: record.id ?? `notification-template-${index + 1}`,
    code,
    scene: humanizeCode(code),
    channel: channelLabel(rawChannel),
    channelCode: rawChannel,
    scopeType: rawScopeType,
    scopeLabel: scopeLabel(rawScopeType),
    tenantId: record.tenantId,
    brandId: record.brandId,
    storeId: record.storeId,
    marketCode: record.marketCode,
    locale: record.locale ?? 'zh-CN',
    titleTemplate: record.titleTemplate ?? humanizeCode(code),
    bodyTemplate: record.bodyTemplate ?? '',
    variables: record.variables ?? [],
    version: record.version ?? null,
    enabled: record.enabled ?? true,
    createdAt,
    updatedAt: record.updatedAt ?? createdAt,
  }
}

async function fetchNotificationTemplates(init: RequestInit = {}): Promise<NotificationTemplateSnapshot[]> {
  const upstreamUrl = new URL(
    'notifications/templates',
    resolveNotificationTemplatesApiBaseUrl()
  ).toString()
  const response = await fetch(upstreamUrl, {
    ...init,
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

export async function loadNotificationTemplatesSnapshot(
  init: RequestInit = {}
): Promise<NotificationTemplatesSnapshotDelivery> {
  const requestContext = resolveServerRequestContext({
    requestHeaders: init.headers,
    fallbackScope: {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
    },
    actorFallback: NOTIFICATION_TEMPLATES_ACTOR,
  })

  try {
    const templates = await fetchNotificationTemplates({
      ...init,
      headers: requestContext.headers,
    })
    if (templates.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'notification-templates-api',
        templates,
        variableRules: defaultVariableRules,
        generatedAt: getLatestTimestamp(templates),
        requestContext: requestContext.evidence,
      }
    }
  } catch (error) {
    // fall through to fallback snapshot
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'notification-templates-fallback',
      templates: defaultNotificationTemplates,
      variableRules: defaultVariableRules,
      generatedAt: getLatestTimestamp(defaultNotificationTemplates),
      requestContext: requestContext.evidence,
      error: formatNotificationTemplateError(error),
    }
  }

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'notification-templates-fallback',
    templates: defaultNotificationTemplates,
    variableRules: defaultVariableRules,
    generatedAt: getLatestTimestamp(defaultNotificationTemplates),
    requestContext: requestContext.evidence,
    error: '通知模板实时接口不可达，已切换到 fallback 样本数据。',
  }
}
