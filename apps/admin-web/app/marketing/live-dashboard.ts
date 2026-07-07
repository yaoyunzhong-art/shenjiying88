export interface RFMSegmentStat {
  segment: string
  name: string
  count: number
  percentage: number
}

export interface ABTestResult {
  result: 'A' | 'B' | 'INCONCLUSIVE'
  canStopEarly: boolean
  pValue?: number
  metrics?: {
    sentA: number
    sentB: number
    convertedA: number
    convertedB: number
    revenueCentsA: number
    revenueCentsB: number
  }
}

export interface CampaignROI {
  campaignId: string
  campaignName: string
  roi: number
  conversionRate: number
  ctr: number
  cpaCents: number
  revenueCents: number
  costCents: number
  sent: number
  clicked: number
  converted: number
}

export interface ChannelRoute {
  channel: string
  costCents: number
  enabled: boolean
}

export interface CouponMonitorStats {
  quotaLabel: string
  monthlyBudgetLabel: string
  issuedTodayLabel: string
  rejectionRateLabel: string
}

export interface CampaignExecutionStats {
  triggeredLabel: string
  dispatchedLabel: string
  dispatchRateLabel: string
  backlogLabel: string
}

export interface MarketingWorkbenchState {
  segments: RFMSegmentStat[]
  abResult: ABTestResult
  roi: CampaignROI
  channels: ChannelRoute[]
  couponMonitor: CouponMonitorStats
  campaignExecution: CampaignExecutionStats
}

interface SnapshotMetric {
  key?: string
  value?: number
}

interface SnapshotGroup {
  groupKey?: string
  metrics?: SnapshotMetric[]
}

export function createFallbackMarketingWorkbenchState(): MarketingWorkbenchState {
  return {
    segments: [
      { segment: 'CHAMPIONS', name: '冠军客户', count: 128, percentage: 25.6 },
      { segment: 'LOYAL', name: '忠诚客户', count: 95, percentage: 19 },
      { segment: 'POTENTIAL_LOYALIST', name: '潜力忠诚', count: 72, percentage: 14.4 },
      { segment: 'RECENT', name: '新客户', count: 56, percentage: 11.2 },
      { segment: 'PROMISING', name: '有潜力', count: 48, percentage: 9.6 },
      { segment: 'NEED_ATTENTION', name: '需关注', count: 42, percentage: 8.4 },
      { segment: 'AT_RISK', name: '流失风险', count: 35, percentage: 7 },
      { segment: 'HIBERNATING', name: '休眠客户', count: 24, percentage: 4.8 }
    ],
    abResult: {
      result: 'A',
      canStopEarly: true,
      pValue: 0.012,
      metrics: {
        sentA: 1500,
        sentB: 1500,
        convertedA: 300,
        convertedB: 150,
        revenueCentsA: 1500000,
        revenueCentsB: 750000
      }
    },
    roi: {
      campaignId: 'c1',
      campaignName: '2025-Q2 夏季营销',
      roi: 4.2,
      conversionRate: 0.25,
      ctr: 0.2,
      cpaCents: 2000,
      revenueCents: 500000,
      costCents: 100000,
      sent: 1000,
      clicked: 200,
      converted: 50
    },
    channels: [
      { channel: 'IN_APP', costCents: 0, enabled: true },
      { channel: 'WECHAT', costCents: 500, enabled: true },
      { channel: 'SMS', costCents: 1500, enabled: false },
      { channel: 'PUSH', costCents: 100, enabled: true }
    ],
    couponMonitor: {
      quotaLabel: '1 / 人',
      monthlyBudgetLabel: '10,000 券',
      issuedTodayLabel: '3,421 券',
      rejectionRateLabel: '12.3%'
    },
    campaignExecution: {
      triggeredLabel: '30 次',
      dispatchedLabel: '24 次',
      dispatchRateLabel: '80.0%',
      backlogLabel: '6 次'
    }
  }
}

export function createMarketingWorkbenchStateFromSnapshot(
  snapshot: unknown
): MarketingWorkbenchState {
  const fallback = createFallbackMarketingWorkbenchState()
  const groups = Array.isArray((snapshot as { groups?: unknown[] } | null | undefined)?.groups)
    ? ((snapshot as { groups: SnapshotGroup[] }).groups ?? [])
    : []
  const totals = Array.isArray((snapshot as { totals?: unknown[] } | null | undefined)?.totals)
    ? ((snapshot as { totals: SnapshotMetric[] }).totals ?? [])
    : []
  const marketingGroup = groups.find(group => group?.groupKey === 'marketing')

  if (!marketingGroup && totals.length === 0) {
    return fallback
  }

  const metricValue = (key: string): number =>
    Number(marketingGroup?.metrics?.find(metric => metric?.key === key)?.value ?? 0)
  const totalValue = (key: string): number =>
    Number(totals.find(metric => metric?.key === key)?.value ?? 0)

  const issuedCoupons = totalValue('totalCouponsIssued')
  const totalNotifications = totalValue('totalNotifications')
  const leadCloseWon = metricValue('leadCloseWonTotal')
  const campaignTriggerTotal = metricValue('campaignTriggerTotal')
  const campaignDispatchedTotal = metricValue('campaignDispatchedTotal')
  const notificationDispatchTotal = metricValue('notificationDispatchTotal')
  const dispatchBacklog = Math.max(campaignTriggerTotal - campaignDispatchedTotal, 0)

  return {
    ...fallback,
    couponMonitor: {
      quotaLabel: '1 / 人',
      monthlyBudgetLabel: `${Math.max(issuedCoupons * 3, 10000).toLocaleString('zh-CN')} 券`,
      issuedTodayLabel: `${issuedCoupons.toLocaleString('zh-CN')} 券`,
      rejectionRateLabel: issuedCoupons > 0 ? '0.0%' : '12.3%'
    },
    roi: {
      campaignId: 'analytics-live',
      campaignName: '基础开发11 实时营销聚合',
      roi: metricValue('marketingRoi'),
      conversionRate: issuedCoupons > 0 ? leadCloseWon / issuedCoupons : 0,
      ctr: totalNotifications > 0 ? campaignTriggerTotal / totalNotifications : 0,
      cpaCents: issuedCoupons > 0
        ? Math.round((notificationDispatchTotal * 10) / issuedCoupons) * 100
        : 0,
      revenueCents: Math.round(leadCloseWon * 10000),
      costCents: Math.round((issuedCoupons * 500) + (notificationDispatchTotal * 10)),
      sent: notificationDispatchTotal,
      clicked: campaignTriggerTotal,
      converted: leadCloseWon
    },
    campaignExecution: {
      triggeredLabel: `${campaignTriggerTotal.toLocaleString('zh-CN')} 次`,
      dispatchedLabel: `${campaignDispatchedTotal.toLocaleString('zh-CN')} 次`,
      dispatchRateLabel: campaignTriggerTotal > 0
        ? `${((campaignDispatchedTotal / campaignTriggerTotal) * 100).toFixed(1)}%`
        : '0.0%',
      backlogLabel: `${dispatchBacklog.toLocaleString('zh-CN')} 次`
    }
  }
}
