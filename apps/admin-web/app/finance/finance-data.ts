export type PaymentMethod = 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH' | 'BALANCE'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED'

export interface Payment {
  id: string
  tenantId: string
  orderId: string
  amountCents: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  version: number
  idempotencyKey: string
  transactionId?: string
  failureReason?: string
  createdAt: string
}

export interface Refund {
  id: string
  tenantId: string
  paymentId: string
  orderId: string
  amountCents: number
  reason: string
  status: RefundStatus
  version: number
  requestedBy: string
  createdAt: string
}

interface FinanceListResponse<T> {
  items: T[]
  total?: number
}

export interface FinanceSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  tenantId: string
  payments: Payment[]
  refunds: Refund[]
  generatedAt: string
  error?: string
}

export const defaultPayments: Payment[] = [
  {
    id: 'pay-demo-1',
    tenantId: 'demo-tenant',
    orderId: 'ord-2026-0701',
    amountCents: 12900,
    currency: 'CNY',
    method: 'WECHAT',
    status: 'SUCCESS',
    version: 2,
    idempotencyKey: 'idem-demo-1',
    transactionId: 'wx-42001',
    createdAt: '2026-07-25T09:00:00.000Z',
  },
  {
    id: 'pay-demo-2',
    tenantId: 'demo-tenant',
    orderId: 'ord-2026-0702',
    amountCents: 8800,
    currency: 'CNY',
    method: 'ALIPAY',
    status: 'PENDING',
    version: 1,
    idempotencyKey: 'idem-demo-2',
    createdAt: '2026-07-25T10:30:00.000Z',
  },
  {
    id: 'pay-demo-3',
    tenantId: 'demo-tenant',
    orderId: 'ord-2026-0703',
    amountCents: 5600,
    currency: 'CNY',
    method: 'CARD',
    status: 'FAILED',
    version: 3,
    idempotencyKey: 'idem-demo-3',
    failureReason: '支付网关超时',
    createdAt: '2026-07-25T11:20:00.000Z',
  },
  {
    id: 'pay-demo-4',
    tenantId: 'demo-tenant',
    orderId: 'ord-2026-0704',
    amountCents: 21900,
    currency: 'CNY',
    method: 'BALANCE',
    status: 'REFUNDED',
    version: 4,
    idempotencyKey: 'idem-demo-4',
    createdAt: '2026-07-24T16:40:00.000Z',
  },
]

export const defaultRefunds: Refund[] = [
  {
    id: 'ref-demo-1',
    tenantId: 'demo-tenant',
    paymentId: 'pay-demo-1',
    orderId: 'ord-2026-0701',
    amountCents: 12900,
    reason: '用户撤单',
    status: 'COMPLETED',
    version: 2,
    requestedBy: 'cs-01',
    createdAt: '2026-07-25T12:10:00.000Z',
  },
  {
    id: 'ref-demo-2',
    tenantId: 'demo-tenant',
    paymentId: 'pay-demo-4',
    orderId: 'ord-2026-0704',
    amountCents: 9900,
    reason: '部分退款',
    status: 'REQUESTED',
    version: 1,
    requestedBy: 'finance-bot',
    createdAt: '2026-07-25T13:05:00.000Z',
  },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveFinanceApiBaseUrl(): string {
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

function getLatestFinanceTimestamp(payments: Payment[], refunds: Refund[]): string {
  const timestamps = [...payments.map((item) => item.createdAt), ...refunds.map((item) => item.createdAt)]
  if (timestamps.length === 0) return '—'
  return timestamps.reduce((latest, current) => (current > latest ? current : latest), timestamps[0]!)
}

async function fetchPayments(tenantId: string): Promise<Payment[]> {
  const upstreamUrl = new URL('api/finance/payments', resolveFinanceApiBaseUrl())
  upstreamUrl.searchParams.set('tenantId', tenantId)
  const response = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`finance payments upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<FinanceListResponse<Payment>>(payload)
  return data.items ?? []
}

async function fetchRefunds(tenantId: string): Promise<Refund[]> {
  const upstreamUrl = new URL('api/finance/refunds', resolveFinanceApiBaseUrl())
  upstreamUrl.searchParams.set('tenantId', tenantId)
  const response = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`finance refunds upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<FinanceListResponse<Refund>>(payload)
  return data.items ?? []
}

export async function loadFinanceSnapshot(tenantId = 'demo-tenant'): Promise<FinanceSnapshotDelivery> {
  try {
    const [payments, refunds] = await Promise.all([fetchPayments(tenantId), fetchRefunds(tenantId)])
    return {
      deliveryMode: 'api',
      tenantId,
      payments,
      refunds,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      tenantId,
      payments: defaultPayments,
      refunds: defaultRefunds,
      generatedAt: getLatestFinanceTimestamp(defaultPayments, defaultRefunds),
      error: '财务支付与退款实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
