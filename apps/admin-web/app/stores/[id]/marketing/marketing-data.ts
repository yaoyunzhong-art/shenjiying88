export type MarketingCampaignStatus = 'active' | 'scheduled' | 'ended'
export type MarketingDiagnosticStatus = 'stable' | 'watch' | 'risk'

export interface MarketingCampaign {
  id: string
  name: string
  type: string
  status: MarketingCampaignStatus
  start: string
  end: string
  budget: number
  used: number
  channel: string
  roi: string
  audience: string
}

export interface MarketingCoupon {
  id: string
  name: string
  type: string
  total: number
  claimed: number
  used: number
  rate: string
  expiry: string
}

export interface MarketingBreakdownItem {
  label: string
  count: number
  usedBudget: number
}

export interface MarketingDiagnostic {
  id: string
  title: string
  status: MarketingDiagnosticStatus
  detail: string
}

export interface MarketingSnapshotSummary {
  activeCount: number
  scheduledCount: number
  totalBudget: number
  totalUsed: number
  useRate: number
  couponCount: number
  couponClaimRate: number
  couponRedeemRate: number
}

export interface MarketingSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-marketing-mock'
  storeId: string
  campaigns: MarketingCampaign[]
  coupons: MarketingCoupon[]
  typeBreakdown: MarketingBreakdownItem[]
  channelBreakdown: MarketingBreakdownItem[]
  summary: MarketingSnapshotSummary
  diagnostics: MarketingDiagnostic[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const MARKETING_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'C001',
    name: '新会员首充有礼',
    type: '充值',
    status: 'active',
    start: '2026-07-01',
    end: '2026-07-31',
    budget: 5000,
    used: 3200,
    channel: '小程序',
    roi: '64%',
    audience: '新会员',
  },
  {
    id: 'C002',
    name: '暑期畅玩卡',
    type: '会员卡',
    status: 'active',
    start: '2026-07-01',
    end: '2026-08-31',
    budget: 20000,
    used: 8500,
    channel: '到店',
    roi: '42%',
    audience: '全体会员',
  },
  {
    id: 'C003',
    name: '分享有礼活动',
    type: '推广',
    status: 'active',
    start: '2026-07-05',
    end: '2026-07-20',
    budget: 3000,
    used: 1800,
    channel: '社交',
    roi: '60%',
    audience: '老客',
  },
  {
    id: 'C004',
    name: '教师节特别活动',
    type: '节日',
    status: 'scheduled',
    start: '2026-09-10',
    end: '2026-09-10',
    budget: 2000,
    used: 0,
    channel: '全部',
    roi: '-',
    audience: '教师群体',
  },
  {
    id: 'C005',
    name: '短视频团购券',
    type: '推广',
    status: 'active',
    start: '2026-07-01',
    end: '2026-07-31',
    budget: 15000,
    used: 9800,
    channel: '抖音',
    roi: '65%',
    audience: '新客',
  },
  {
    id: 'C006',
    name: '会员积分兑换',
    type: '会员',
    status: 'ended',
    start: '2026-06-01',
    end: '2026-06-30',
    budget: 8000,
    used: 7600,
    channel: '小程序',
    roi: '95%',
    audience: '全会员',
  },
  {
    id: 'C007',
    name: '七夕情侣套餐',
    type: '节日',
    status: 'scheduled',
    start: '2026-08-10',
    end: '2026-08-10',
    budget: 3000,
    used: 0,
    channel: '全部',
    roi: '-',
    audience: '情侣人群',
  },
  {
    id: 'C008',
    name: '充值满赠活动',
    type: '充值',
    status: 'active',
    start: '2026-07-10',
    end: '2026-07-25',
    budget: 5000,
    used: 1200,
    channel: '到店',
    roi: '24%',
    audience: '高频用户',
  },
  {
    id: 'C009',
    name: '老客带新券',
    type: '推广',
    status: 'active',
    start: '2026-07-12',
    end: '2026-07-30',
    budget: 4000,
    used: 600,
    channel: '社交',
    roi: '15%',
    audience: '老客',
  },
  {
    id: 'C010',
    name: '开学季学生卡',
    type: '会员卡',
    status: 'scheduled',
    start: '2026-08-20',
    end: '2026-09-10',
    budget: 10000,
    used: 0,
    channel: '抖音+到店',
    roi: '-',
    audience: '学生群体',
  },
]

export const MARKETING_COUPONS: MarketingCoupon[] = [
  { id: 'CP-001', name: '满100减20', type: '满减', total: 500, claimed: 320, used: 180, rate: '56%', expiry: '2026-07-31' },
  { id: 'CP-002', name: '新客8折券', type: '折扣', total: 300, claimed: 240, used: 155, rate: '65%', expiry: '2026-07-31' },
  { id: 'CP-003', name: '饮品买一送一', type: '兑换', total: 200, claimed: 150, used: 98, rate: '65%', expiry: '2026-07-20' },
  { id: 'CP-004', name: '满200减50', type: '满减', total: 200, claimed: 85, used: 42, rate: '49%', expiry: '2026-08-15' },
]

export function buildMarketingSummary(
  campaigns: MarketingCampaign[],
  coupons: MarketingCoupon[]
): MarketingSnapshotSummary {
  const totalBudget = campaigns.reduce((sum, item) => sum + item.budget, 0)
  const totalUsed = campaigns.reduce((sum, item) => sum + item.used, 0)
  const totalCouponClaimed = coupons.reduce((sum, item) => sum + item.claimed, 0)
  const totalCouponIssued = coupons.reduce((sum, item) => sum + item.total, 0)
  const totalCouponUsed = coupons.reduce((sum, item) => sum + item.used, 0)

  return {
    activeCount: campaigns.filter((item) => item.status === 'active').length,
    scheduledCount: campaigns.filter((item) => item.status === 'scheduled').length,
    totalBudget,
    totalUsed,
    useRate: totalBudget ? Math.round((totalUsed / totalBudget) * 100) : 0,
    couponCount: coupons.length,
    couponClaimRate: totalCouponIssued ? Math.round((totalCouponClaimed / totalCouponIssued) * 100) : 0,
    couponRedeemRate: totalCouponClaimed ? Math.round((totalCouponUsed / totalCouponClaimed) * 100) : 0,
  }
}

export function buildMarketingBreakdown(
  campaigns: MarketingCampaign[],
  pickLabel: (campaign: MarketingCampaign) => string
): MarketingBreakdownItem[] {
  const grouped = new Map<string, { count: number; usedBudget: number }>()
  campaigns.forEach((campaign) => {
    const label = pickLabel(campaign)
    const current = grouped.get(label) ?? { count: 0, usedBudget: 0 }
    current.count += 1
    current.usedBudget += campaign.used
    grouped.set(label, current)
  })

  return Array.from(grouped.entries()).map(([label, value]) => ({
    label,
    count: value.count,
    usedBudget: value.usedBudget,
  }))
}

export function buildMarketingDiagnostics(storeId: string): MarketingDiagnostic[] {
  return [
    {
      id: 'source-transparency',
      title: '来源态已固化',
      status: 'stable',
      detail: `门店 ${storeId} 当前通过 server wrapper 下发营销 mock 快照，来源标签为 store-marketing-mock。`,
    },
    {
      id: 'budget-watch',
      title: '预算燃烧需复核',
      status: 'watch',
      detail: '短视频团购券与暑期畅玩卡为当前主要预算消耗项，仍缺少真实投放平台回执。',
    },
    {
      id: 'write-path-risk',
      title: '创建与编辑仍为假写链路',
      status: 'risk',
      detail: '创建活动、编辑活动和模板管理尚未接入真实营销控制面，只做结构演示与来源态透明化。',
    },
  ]
}

export async function loadMarketingSnapshot(storeId: string): Promise<MarketingSnapshot> {
  const campaigns = MARKETING_CAMPAIGNS.map((campaign) => ({ ...campaign }))
  const coupons = MARKETING_COUPONS.map((coupon) => ({ ...coupon }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-marketing-mock',
    storeId,
    campaigns,
    coupons,
    typeBreakdown: buildMarketingBreakdown(campaigns, (campaign) => campaign.type),
    channelBreakdown: buildMarketingBreakdown(campaigns, (campaign) => campaign.channel),
    summary: buildMarketingSummary(campaigns, coupons),
    diagnostics: buildMarketingDiagnostics(storeId),
    generatedAt: '2026-07-27T10:15:00.000Z',
    controlPlaneSource: 'loadMarketingSnapshot -> MARKETING_CAMPAIGNS + MARKETING_COUPONS',
    businessDataSource: 'local marketing samples + derived diagnostics',
    refreshPath: 'MarketingPage -> loadMarketingSnapshot',
    note: '当前页面消费本地 marketing snapshot loader，仅用于来源态固证、交互演示与定向回归，不作为真实投放闭环复签证据。',
    error: '门店营销控制面尚未接入实时上游，当前展示 mock 快照。',
  }
}
