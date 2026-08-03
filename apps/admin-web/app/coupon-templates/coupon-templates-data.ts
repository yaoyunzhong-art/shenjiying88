export type CouponType = 'amount' | 'discount' | 'cash' | 'exchange'
export type CouponStatus = 'active' | 'expired' | 'stopped'

export interface CouponTemplateItem {
  id: string
  name: string
  faceValue: number
  type: CouponType
  minSpend: number
  validFrom: string
  validTo: string
  totalIssued: number
  usedCount: number
  status: CouponStatus
}

export interface CouponTemplatesSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-coupon-template-snapshot'
  templates: CouponTemplateItem[]
  generatedAt: string
}

export const COUPON_TYPE_MAP: Record<CouponType, { label: string }> = {
  amount: { label: '满减券' },
  discount: { label: '折扣券' },
  cash: { label: '现金券' },
  exchange: { label: '兑换券' },
}

export const COUPON_STATUS_MAP: Record<
  CouponStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  active: { label: '生效中', variant: 'success' },
  expired: { label: '已过期', variant: 'warning' },
  stopped: { label: '已停用', variant: 'danger' },
}

export const defaultCouponTemplates: CouponTemplateItem[] = [
  {
    id: 'ct-001',
    name: '新客满100减20',
    faceValue: 20,
    type: 'amount',
    minSpend: 100,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    totalIssued: 5000,
    usedCount: 3112,
    status: 'active',
  },
  {
    id: 'ct-002',
    name: '端午9折券',
    faceValue: 10,
    type: 'discount',
    minSpend: 50,
    validFrom: '2026-06-01',
    validTo: '2026-06-30',
    totalIssued: 2000,
    usedCount: 1543,
    status: 'expired',
  },
  {
    id: 'ct-003',
    name: '无门槛5元现金券',
    faceValue: 5,
    type: 'cash',
    minSpend: 0,
    validFrom: '2026-03-01',
    validTo: '2026-09-30',
    totalIssued: 10000,
    usedCount: 8234,
    status: 'active',
  },
  {
    id: 'ct-004',
    name: '周年庆兑换券',
    faceValue: 50,
    type: 'exchange',
    minSpend: 200,
    validFrom: '2026-07-01',
    validTo: '2026-07-15',
    totalIssued: 500,
    usedCount: 32,
    status: 'active',
  },
  {
    id: 'ct-005',
    name: '老客满200减30',
    faceValue: 30,
    type: 'amount',
    minSpend: 200,
    validFrom: '2025-01-01',
    validTo: '2025-12-31',
    totalIssued: 3000,
    usedCount: 2984,
    status: 'expired',
  },
  {
    id: 'ct-006',
    name: '双十一7折券',
    faceValue: 30,
    type: 'discount',
    minSpend: 100,
    validFrom: '2026-11-01',
    validTo: '2026-11-11',
    totalIssued: 8000,
    usedCount: 0,
    status: 'stopped',
  },
]

export interface CouponTemplateStats {
  total: number
  active: number
  totalIssued: number
  totalUsed: number
}

export function computeCouponTemplateStats(items: CouponTemplateItem[]): CouponTemplateStats {
  return {
    total: items.length,
    active: items.filter((item) => item.status === 'active').length,
    totalIssued: items.reduce((sum, item) => sum + item.totalIssued, 0),
    totalUsed: items.reduce((sum, item) => sum + item.usedCount, 0),
  }
}

function getLatestCouponTemplateTimestamp(items: CouponTemplateItem[]): string {
  if (items.length === 0) return '—'
  return items.reduce((latest, item) => (item.validTo > latest ? item.validTo : latest), items[0]!.validTo)
}

export async function loadCouponTemplatesSnapshot(): Promise<CouponTemplatesSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-coupon-template-snapshot',
    templates: defaultCouponTemplates,
    generatedAt: getLatestCouponTemplateTimestamp(defaultCouponTemplates),
  }
}
