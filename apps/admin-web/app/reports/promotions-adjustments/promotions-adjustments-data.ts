import { apiFetchJson } from '../../api/_client'

export type PromotionAdjustmentStatus = 'active' | 'ended' | 'scheduled'

export interface PromotionAdjustmentRecord {
  id: string
  name: string
  type: string
  budget: number
  spend: number
  redemptions: number
  revenue: number
  roi: number
  status: PromotionAdjustmentStatus
}

export interface PromotionsAdjustmentsStats {
  activeCount: number
  activeBudget: number
  totalSpend: number
  totalRedemptions: number
  totalRevenue: number
  totalRoi: number
}

export interface PromotionsAdjustmentsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'promotions-adjustments-api-live' | 'promotions-adjustments-local-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
  records: PromotionAdjustmentRecord[]
  stats: PromotionsAdjustmentsStats
}

export const PROMOTION_ADJUSTMENT_STATUSES: PromotionAdjustmentStatus[] = ['active', 'ended', 'scheduled']

export const PROMOTION_STATUS_LABELS: Record<PromotionAdjustmentStatus, string> = {
  active: '进行中',
  ended: '已结束',
  scheduled: '已计划',
}

export const MOCK_PROMOTION_ADJUSTMENT_RECORDS: PromotionAdjustmentRecord[] = [
  { id: 'PROMO-001', name: '新人首次射击体验', type: '新客优惠', budget: 50000, spend: 32600, redemptions: 438, revenue: 152800, roi: 3.69, status: 'active' },
  { id: 'PROMO-002', name: '暑期团建特惠', type: '团购优惠', budget: 80000, spend: 45600, redemptions: 186, revenue: 295400, roi: 5.48, status: 'active' },
  { id: 'PROMO-003', name: '会员充值满赠', type: '会员活动', budget: 30000, spend: 28500, redemptions: 312, revenue: 198600, roi: 5.97, status: 'active' },
  { id: 'PROMO-004', name: '双倍积分周', type: '积分活动', budget: 15000, spend: 9800, redemptions: 542, revenue: 82300, roi: 7.4, status: 'ended' },
  { id: 'PROMO-005', name: '好友邀请奖励', type: '裂变活动', budget: 20000, spend: 14200, redemptions: 128, revenue: 96800, roi: 5.82, status: 'ended' },
  { id: 'PROMO-006', name: '射击挑战赛', type: '赛事活动', budget: 40000, spend: 38200, redemptions: 96, revenue: 215400, roi: 4.64, status: 'active' },
  { id: 'PROMO-007', name: '国庆射击嘉年华', type: '节庆活动', budget: 120000, spend: 0, redemptions: 0, revenue: 0, roi: 0, status: 'scheduled' },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

type PromotionsAdjustmentsApiPayload =
  | PromotionAdjustmentRecord[]
  | { records?: PromotionAdjustmentRecord[]; generatedAt?: string }

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolvePromotionsAdjustmentsApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) return `${DEFAULT_API_ORIGIN}/api/`
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) return ensureTrailingSlash(normalized)
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized.replace(/\/v1\/?$/, '/'))
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) throw new Error(wrapped.message ?? 'API error')
    return wrapped.data as T
  }
  return payload as T
}

async function fetchPromotionsAdjustmentsPayload(): Promise<PromotionsAdjustmentsApiPayload> {
  const upstreamUrl = new URL('reports/promotions-adjustments', resolvePromotionsAdjustmentsApiBaseUrl()).toString()
  return apiFetchJson<PromotionsAdjustmentsApiPayload>(upstreamUrl)
}

function extractPromotionAdjustmentRecords(payload: PromotionsAdjustmentsApiPayload): PromotionAdjustmentRecord[] {
  if (Array.isArray(payload)) return payload
  return Array.isArray(payload.records) ? payload.records : []
}

function buildFallbackSnapshot(error?: string): PromotionsAdjustmentsSnapshotDelivery {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'promotions-adjustments-local-snapshot',
    generatedAt: '2026-07-27T08:20:00Z',
    controlPlaneSource: 'loadPromotionsAdjustmentsSnapshot -> MOCK_PROMOTION_ADJUSTMENT_RECORDS fallback',
    businessDataSource: 'local promotions-adjustments workspace samples',
    refreshPath: 'PromotionsAdjustmentsPage -> loadPromotionsAdjustmentsSnapshot',
    note: '当前促销调整页展示的是本地样本快照，不可作为实时活动 ROI 审计证据。',
    error,
    records: MOCK_PROMOTION_ADJUSTMENT_RECORDS,
    stats: computePromotionsAdjustmentsStats(MOCK_PROMOTION_ADJUSTMENT_RECORDS),
  }
}

export function computePromotionsAdjustmentsStats(
  records: PromotionAdjustmentRecord[]
): PromotionsAdjustmentsStats {
  const activeRecords = records.filter((record) => record.status === 'active')
  const totalSpend = records.reduce((sum, record) => sum + record.spend, 0)
  const totalRevenue = records.reduce((sum, record) => sum + record.revenue, 0)

  return {
    activeCount: activeRecords.length,
    activeBudget: activeRecords.reduce((sum, record) => sum + record.budget, 0),
    totalSpend,
    totalRedemptions: records.reduce((sum, record) => sum + record.redemptions, 0),
    totalRevenue,
    totalRoi: totalRevenue > 0 ? totalRevenue / Math.max(totalSpend, 1) : 0,
  }
}

export function filterPromotionAdjustmentRecords(
  records: PromotionAdjustmentRecord[],
  search: string,
  statusFilter: PromotionAdjustmentStatus | 'all'
): PromotionAdjustmentRecord[] {
  let result = records
  if (statusFilter !== 'all') result = result.filter((record) => record.status === statusFilter)
  if (search.trim()) {
    const keyword = search.trim()
    result = result.filter((record) => record.name.includes(keyword) || record.type.includes(keyword))
  }
  return result
}

export async function loadPromotionsAdjustmentsSnapshot(): Promise<PromotionsAdjustmentsSnapshotDelivery> {
  try {
    const payload = await fetchPromotionsAdjustmentsPayload()
    const records = extractPromotionAdjustmentRecords(payload)
    if (records.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'promotions-adjustments-api-live',
        generatedAt: Array.isArray(payload) ? '2026-07-27T08:20:00Z' : payload.generatedAt ?? '2026-07-27T08:20:00Z',
        controlPlaneSource: 'loadPromotionsAdjustmentsSnapshot -> reports/promotions-adjustments',
        businessDataSource: 'reports/promotions-adjustments upstream response',
        refreshPath: 'PromotionsAdjustmentsPage -> loadPromotionsAdjustmentsSnapshot',
        note: '当前促销调整页已优先接入真实活动快照，接口异常时会显式降级为 fallback 样本。',
        records,
        stats: computePromotionsAdjustmentsStats(records),
      }
    }
  } catch (error) {
    return buildFallbackSnapshot(
      error instanceof Error
        ? `${error.message}，已切换到 fallback 样本数据。`
        : '促销调整实时接口不可达，已切换到 fallback 样本数据。'
    )
  }

  return buildFallbackSnapshot('促销调整实时接口返回空列表，已切换到 fallback 样本数据。')
}
