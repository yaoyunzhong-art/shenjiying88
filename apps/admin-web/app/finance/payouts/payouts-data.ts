export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type PayoutMethod = 'BANK' | 'ALIPAY' | 'WECHAT'

export interface PayoutRecord {
  id: string
  tenantId: string
  storeId: string
  orderId: string
  amountCents: number
  currency: string
  method: PayoutMethod
  status: PayoutStatus
  bankCardNo?: string
  bankName?: string
  alipayAccount?: string
  wechatAccount?: string
  applicant: string
  reviewer?: string
  reviewNote?: string
  failureReason?: string
  idempotencyKey: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface FinancePayoutsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  payouts: PayoutRecord[]
  generatedAt: string
  error?: string
}

export const defaultPayouts: PayoutRecord[] = [
  {
    id: 'po-001',
    tenantId: 'demo-tenant',
    storeId: 'store-01',
    orderId: 'ord-2026-0001',
    amountCents: 500000,
    currency: 'CNY',
    method: 'BANK',
    status: 'PENDING',
    bankCardNo: '6228****1234',
    bankName: '中国银行',
    applicant: '张三',
    idempotencyKey: 'ik-po-001',
    version: 1,
    createdAt: '2026-07-25T10:00:00.000Z',
    updatedAt: '2026-07-25T10:00:00.000Z',
  },
  {
    id: 'po-002',
    tenantId: 'demo-tenant',
    storeId: 'store-02',
    orderId: 'ord-2026-0002',
    amountCents: 120000,
    currency: 'CNY',
    method: 'ALIPAY',
    status: 'APPROVED',
    alipayAccount: '138****8888',
    applicant: '李四',
    reviewer: 'finance-manager',
    reviewNote: '审核通过',
    idempotencyKey: 'ik-po-002',
    version: 2,
    createdAt: '2026-07-24T09:00:00.000Z',
    updatedAt: '2026-07-25T08:00:00.000Z',
  },
  {
    id: 'po-003',
    tenantId: 'demo-tenant',
    storeId: 'store-01',
    orderId: 'ord-2026-0003',
    amountCents: 250000,
    currency: 'CNY',
    method: 'WECHAT',
    status: 'COMPLETED',
    wechatAccount: 'wx_zhang',
    applicant: '王五',
    reviewer: 'finance-manager',
    idempotencyKey: 'ik-po-003',
    version: 4,
    createdAt: '2026-07-23T10:00:00.000Z',
    updatedAt: '2026-07-25T06:00:00.000Z',
  },
]

function getLatestPayoutTimestamp(payouts: PayoutRecord[]): string {
  if (payouts.length === 0) return '—'
  return payouts.reduce(
    (latest, current) => (current.updatedAt > latest ? current.updatedAt : latest),
    payouts[0]!.updatedAt
  )
}

export async function loadFinancePayoutsSnapshot(): Promise<FinancePayoutsSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    payouts: defaultPayouts,
    generatedAt: getLatestPayoutTimestamp(defaultPayouts),
    error: '提现实时接口尚未接入，当前展示 fallback 样本数据。',
  }
}
