export type PromotionStatus = 'active' | 'scheduled' | 'ended' | 'draft'

export interface PromotionRecord {
  id: string
  name: string
  type: string
  discount: string
  scope: string
  start: string
  end: string
  budget: number
  used: number
  status: PromotionStatus
  targetGoal?: string
}

export interface PromotionsSnapshotSummary {
  totalCount: number
  activeCount: number
  scheduledCount: number
  draftCount: number
  totalBudget: number
  totalUsed: number
  usageRate: number
}

export interface PromotionsSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-promotions-mock'
  storeId: string
  promotions: PromotionRecord[]
  summary: PromotionsSnapshotSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const PROMOTION_RECORDS: PromotionRecord[] = [
  {
    id: 'PROMO-001',
    name: '暑期8折优惠',
    type: '折扣',
    discount: '8折',
    scope: '全场',
    start: '2026-07-15',
    end: '2026-08-31',
    budget: 30000,
    used: 8500,
    status: 'active',
    targetGoal: '提升客流20%',
  },
  {
    id: 'PROMO-002',
    name: '新客满100减20',
    type: '满减',
    discount: '减20',
    scope: '新用户',
    start: '2026-07-10',
    end: '2026-07-31',
    budget: 10000,
    used: 3200,
    status: 'active',
  },
  {
    id: 'PROMO-003',
    name: '会员生日特惠',
    type: '折扣',
    discount: '7折',
    scope: '会员',
    start: '2026-07-01',
    end: '2026-12-31',
    budget: 5000,
    used: 1250,
    status: 'active',
  },
  {
    id: 'PROMO-004',
    name: '充值满赠',
    type: '满赠',
    discount: '充200送50',
    scope: '全场',
    start: '2026-08-01',
    end: '2026-08-15',
    budget: 15000,
    used: 0,
    status: 'scheduled',
  },
  {
    id: 'PROMO-005',
    name: '国庆特惠',
    type: '折扣',
    discount: '7.5折',
    scope: '全场',
    start: '2026-10-01',
    end: '2026-10-07',
    budget: 50000,
    used: 0,
    status: 'draft',
  },
  {
    id: 'PROMO-006',
    name: '618狂欢',
    type: '满减',
    discount: '满200减50',
    scope: '全场',
    start: '2026-06-18',
    end: '2026-06-20',
    budget: 20000,
    used: 18600,
    status: 'ended',
  },
]

export function buildPromotionsSummary(
  promotions: PromotionRecord[]
): PromotionsSnapshotSummary {
  const totalBudget = promotions.reduce((sum, item) => sum + item.budget, 0)
  const totalUsed = promotions.reduce((sum, item) => sum + item.used, 0)

  return {
    totalCount: promotions.length,
    activeCount: promotions.filter((item) => item.status === 'active').length,
    scheduledCount: promotions.filter((item) => item.status === 'scheduled').length,
    draftCount: promotions.filter((item) => item.status === 'draft').length,
    totalBudget,
    totalUsed,
    usageRate: totalBudget ? Math.round((totalUsed / totalBudget) * 100) : 0,
  }
}

export async function loadPromotionsSnapshot(
  storeId: string
): Promise<PromotionsSnapshot> {
  const promotions = PROMOTION_RECORDS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-promotions-mock',
    storeId,
    promotions,
    summary: buildPromotionsSummary(promotions),
    generatedAt: '2026-07-27T17:25:00.000Z',
    controlPlaneSource: 'loadPromotionsSnapshot -> PROMOTION_RECORDS + buildPromotionsSummary',
    businessDataSource: 'local promotions samples + derived budget usage counters',
    refreshPath: `PromotionsPage -> loadPromotionsSnapshot(${storeId})`,
    note: '当前门店促销页消费本地 promotions snapshot loader，已显式暴露来源态与刷新路径，发布、结束与创建活动仍为 mock 演示。',
    error: '门店促销控制面尚未接入实时投放中台，当前展示 mock 快照。',
  }
}
