export interface APIKey {
  id: string
  tenantId: string
  keyId: string
  environment: 'LIVE' | 'TEST' | 'SANDBOX'
  name: string
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  scopes: Array<{ resource: string; actions: string[] }>
  createdAt: string
  lastUsedAt?: string
}

export interface WebhookSubscription {
  id: string
  tenantId: string
  url: string
  events: string[]
  status: 'ACTIVE' | 'PAUSED' | 'DELETED'
  createdAt: string
  description?: string
}

export interface WebhookDelivery {
  id: string
  subscriptionId: string
  eventType: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'DEAD_LETTER'
  attempts: number
  responseStatus?: number
  lastAttemptAt?: string
  nextRetryAt?: string
  errorMessage?: string
  createdAt: string
}

export interface SandboxWorkspace {
  id: string
  tenantId: string
  parentTenantId: string
  name: string
  status: 'ACTIVE' | 'EXPIRED' | 'PURGED'
  ttlDays: number
  dataMaskingEnabled: boolean
  createdAt: string
  expiresAt: string
}

export interface UsageReport {
  totalBuckets: number
  activeBuckets: number
  totalUsageToday: number
  overageKeys: number
  topEndpoints: Array<{ endpoint: string; count: number }>
}

export interface OpenApiWorkbenchSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-openapi-workbench-snapshot'
  tenantId: string
  apiKeys: APIKey[]
  webhooks: WebhookSubscription[]
  deliveries: WebhookDelivery[]
  deadLetters: WebhookDelivery[]
  sandboxes: SandboxWorkspace[]
  usageReport: UsageReport
  generatedAt: string
}

export const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  DELETED: 'bg-slate-100 text-slate-700',
  REVOKED: 'bg-rose-100 text-rose-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
  PURGED: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-blue-100 text-blue-700',
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-rose-100 text-rose-700',
  DEAD_LETTER: 'bg-purple-100 text-purple-700',
}

export const ENV_COLOR: Record<string, string> = {
  LIVE: 'bg-blue-100 text-blue-700',
  TEST: 'bg-yellow-100 text-yellow-700',
  SANDBOX: 'bg-green-100 text-green-700',
}

export function maskPII(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data }
  const piiKeys = ['email', 'phone', 'idCard', 'password', 'token', 'ssn', 'creditCard']
  for (const key of Object.keys(result)) {
    if (piiKeys.includes(key)) result[key] = '***MASKED***'
  }
  return result
}

export function buildCanonicalString({
  method,
  url,
  timestamp,
  nonce,
  body,
}: {
  method: string
  url: string
  timestamp: number
  nonce: string
  body: string
}): string {
  return `${method.toUpperCase()}\n${url}\n${timestamp}\n${nonce}\n${body}`
}

export function verifySignatureWindow(timestamp: number, now: number): {
  valid: boolean
  reason?: string
} {
  const skew = Math.abs(now - timestamp)
  if (skew > 5 * 60 * 1000) {
    return { valid: false, reason: 'timestamp_out_of_window' }
  }
  return { valid: true }
}

const tenantId = 't-demo'

const defaultApiKeys: APIKey[] = [
  {
    id: 'k1',
    tenantId,
    keyId: `sk_live_${'a'.repeat(16)}`,
    environment: 'LIVE',
    name: 'prod-orders',
    status: 'ACTIVE',
    scopes: [{ resource: 'orders', actions: ['read', 'write'] }],
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'k2',
    tenantId,
    keyId: `sk_test_${'b'.repeat(16)}`,
    environment: 'TEST',
    name: 'qa-team',
    status: 'ACTIVE',
    scopes: [{ resource: '*', actions: ['read'] }],
    createdAt: '2026-06-15T14:30:00Z',
  },
]

const defaultWebhooks: WebhookSubscription[] = [
  {
    id: 'wh1',
    tenantId,
    url: 'https://hooks.example.com/orders',
    events: ['order.created', 'order.paid'],
    status: 'ACTIVE',
    description: '订单事件回传',
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'wh2',
    tenantId,
    url: 'https://hooks.example.com/members',
    events: ['member.registered'],
    status: 'PAUSED',
    description: '会员注册事件回调',
    createdAt: '2026-06-12T11:00:00Z',
  },
]

const defaultDeliveries: WebhookDelivery[] = [
  {
    id: 'd1',
    subscriptionId: 'wh1',
    eventType: 'order.created',
    status: 'SUCCESS',
    attempts: 1,
    responseStatus: 200,
    lastAttemptAt: '2026-06-28T08:30:00Z',
    createdAt: '2026-06-28T08:30:00Z',
  },
  {
    id: 'd2',
    subscriptionId: 'wh1',
    eventType: 'order.paid',
    status: 'FAILED',
    attempts: 2,
    responseStatus: 500,
    lastAttemptAt: '2026-06-28T08:35:00Z',
    nextRetryAt: '2026-06-28T08:36:00Z',
    errorMessage: 'HTTP 500',
    createdAt: '2026-06-28T08:35:00Z',
  },
]

const defaultDeadLetters: WebhookDelivery[] = [
  {
    id: 'd9',
    subscriptionId: 'wh1',
    eventType: 'order.created',
    status: 'DEAD_LETTER',
    attempts: 5,
    responseStatus: 500,
    lastAttemptAt: '2026-06-28T07:00:00Z',
    errorMessage: '持久失败，已达 5 次重试上限',
    createdAt: '2026-06-28T06:00:00Z',
  },
]

const defaultSandboxes: SandboxWorkspace[] = [
  {
    id: 'sb1',
    tenantId: 't-sandbox-qa',
    parentTenantId: tenantId,
    name: 'qa-env',
    status: 'ACTIVE',
    ttlDays: 30,
    dataMaskingEnabled: true,
    createdAt: '2026-06-01T10:00:00Z',
    expiresAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'sb2',
    tenantId: 't-sandbox-load',
    parentTenantId: tenantId,
    name: 'load-test',
    status: 'EXPIRED',
    ttlDays: 7,
    dataMaskingEnabled: true,
    createdAt: '2026-05-15T10:00:00Z',
    expiresAt: '2026-05-22T10:00:00Z',
  },
]

const defaultUsageReport: UsageReport = {
  totalBuckets: 3,
  activeBuckets: 3,
  totalUsageToday: 1245,
  overageKeys: 0,
  topEndpoints: [
    { endpoint: '/api/orders', count: 580 },
    { endpoint: '/api/members', count: 320 },
    { endpoint: '/api/products', count: 245 },
    { endpoint: '/api/payments', count: 100 },
  ],
}

export async function loadOpenApiWorkbenchSnapshot(): Promise<OpenApiWorkbenchSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-openapi-workbench-snapshot',
    tenantId,
    apiKeys: defaultApiKeys,
    webhooks: defaultWebhooks,
    deliveries: defaultDeliveries,
    deadLetters: defaultDeadLetters,
    sandboxes: defaultSandboxes,
    usageReport: defaultUsageReport,
    generatedAt: '2026-07-26T21:00:00Z',
  }
}
