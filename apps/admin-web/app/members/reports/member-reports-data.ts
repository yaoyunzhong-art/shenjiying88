export interface MemberMetrics {
  date: string
  newMembers: number
  totalMembers: number
  activeMembers: number
  activeRate: number
  newRevenue: number
  repeatRevenue: number
  totalRevenue: number
  avgRecharge: number
  avgSpend: number
  churnRate: number
  retentionRate: number
  ltv30: number
  ltv90: number
}

export interface RFMSegment {
  segment: string
  count: number
  avgRecency: number
  avgFrequency: number
  avgMonetary: number
  totalValue: number
  pctOfRevenue: number
  color: string
}

export interface MemberActivity {
  period: string
  dailyActive: number
  weeklyActive: number
  monthlyActive: number
  avgSessionMinutes: number
  avgVisitsPerWeek: number
  peakDay: string
  peakHour: string
}

export interface MemberReportsTotals {
  totalNewMembers: number
  avgActiveRate: number
  totalRevenue: number
  avgChurn: number
  avgLtv30: number
  avgLtv90: number
}

export interface MemberReportsPageSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'member-reports-fallback-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  metrics: MemberMetrics[]
  rfm: RFMSegment[]
  activity: MemberActivity
  totals: MemberReportsTotals
}

export function buildMemberMetrics(days = 90): MemberMetrics[] {
  const data: MemberMetrics[] = []
  let total = 2800
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(2026, 3, 11 + i))
    const newMembers = 3 + (i % 8)
    const activeMembers = Math.floor(total * (0.45 + (i % 15) * 0.01))
    const churnRate = 0.03 + (i % 5) * 0.01
    total += newMembers - Math.floor(total * churnRate)
    const newRevenue = newMembers * (80 + (i % 120))
    const repeatRevenue = activeMembers * (40 + (i % 80))
    data.push({
      date: date.toISOString().split('T')[0] ?? '',
      newMembers,
      totalMembers: total,
      activeMembers,
      activeRate: Math.round((activeMembers / total) * 10000) / 100,
      newRevenue,
      repeatRevenue,
      totalRevenue: newRevenue + repeatRevenue,
      avgRecharge: 150 + (i % 200),
      avgSpend: 55 + (i % 45),
      churnRate,
      retentionRate: Math.round((1 - churnRate) * 10000) / 100,
      ltv30: 180 + (i % 120),
      ltv90: 400 + (i % 300),
    })
  }
  return data
}

export function buildRfmSegments(): RFMSegment[] {
  return [
    { segment: '重要价值会员', count: 245, avgRecency: 2, avgFrequency: 8.5, avgMonetary: 850, totalValue: 208250, pctOfRevenue: 28, color: '#22c55e' },
    { segment: '重要发展会员', count: 380, avgRecency: 5, avgFrequency: 4.2, avgMonetary: 420, totalValue: 159600, pctOfRevenue: 22, color: '#3b82f6' },
    { segment: '重要保持会员', count: 210, avgRecency: 15, avgFrequency: 3.8, avgMonetary: 380, totalValue: 79800, pctOfRevenue: 11, color: '#8b5cf6' },
    { segment: '重要挽留会员', count: 156, avgRecency: 30, avgFrequency: 2.1, avgMonetary: 350, totalValue: 54600, pctOfRevenue: 7.5, color: '#f97316' },
    { segment: '一般价值会员', count: 420, avgRecency: 7, avgFrequency: 3.5, avgMonetary: 180, totalValue: 75600, pctOfRevenue: 10.5, color: '#06b6d4' },
    { segment: '一般发展会员', count: 345, avgRecency: 10, avgFrequency: 2.8, avgMonetary: 150, totalValue: 51750, pctOfRevenue: 7, color: '#eab308' },
    { segment: '一般保持会员', count: 280, avgRecency: 20, avgFrequency: 2.0, avgMonetary: 120, totalValue: 33600, pctOfRevenue: 4.5, color: '#6b7280' },
    { segment: '流失会员', count: 509, avgRecency: 60, avgFrequency: 1.5, avgMonetary: 90, totalValue: 45810, pctOfRevenue: 6.5, color: '#ef4444' },
  ]
}

export function buildMemberActivity(): MemberActivity {
  return {
    period: '近30天',
    dailyActive: 320,
    weeklyActive: 980,
    monthlyActive: 1876,
    avgSessionMinutes: 68,
    avgVisitsPerWeek: 2.4,
    peakDay: '星期六',
    peakHour: '19:00-21:00',
  }
}

export function formatMemberReportMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

export function computeMemberReportsTotals(
  metrics: MemberMetrics[]
): MemberReportsTotals {
  return {
    totalNewMembers: metrics.reduce((sum, metric) => sum + metric.newMembers, 0),
    avgActiveRate:
      metrics.reduce((sum, metric) => sum + metric.activeRate, 0) / metrics.length,
    totalRevenue:
      metrics.reduce((sum, metric) => sum + metric.totalRevenue, 0),
    avgChurn: metrics.reduce((sum, metric) => sum + metric.churnRate, 0) / metrics.length,
    avgLtv30: metrics.reduce((sum, metric) => sum + metric.ltv30, 0) / metrics.length,
    avgLtv90: metrics.reduce((sum, metric) => sum + metric.ltv90, 0) / metrics.length,
  }
}

export async function loadMemberReportsPageSnapshot(): Promise<MemberReportsPageSnapshot> {
  const metrics = buildMemberMetrics()
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'member-reports-fallback-snapshot',
    generatedAt: '2026-07-27T15:30:00Z',
    controlPlaneSource:
      'loadMemberReportsPageSnapshot -> buildMemberMetrics / buildRfmSegments / buildMemberActivity',
    businessDataSource: 'local member analytics samples',
    refreshPath: 'MemberReportsPage -> loadMemberReportsPageSnapshot',
    note: '当前会员报表页使用本地样本快照，已显式暴露来源态与刷新路径，不可作为实时复签证据。',
    metrics,
    rfm: buildRfmSegments(),
    activity: buildMemberActivity(),
    totals: computeMemberReportsTotals(metrics),
  }
}
