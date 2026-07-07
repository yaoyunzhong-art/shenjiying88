import type { MarketingDashboardData } from './marketing-view-model';

export const adminMarketingRoute = {
  href: '/marketing',
  title: '营销管理',
  description: '管理营销活动、会员增长和投放效果的统一看板。',
} as const;

export function getAdminMarketingDashboardSnapshot(): MarketingDashboardData {
  return {
    managerName: '张营销',
    generatedAt: new Date().toISOString(),
    growthMetrics: {
      totalMembers: 18420,
      netNewMembers: 920,
      netNewTrend: 12.5,
      activeMembers: 11280,
      activeRate: 61.2,
      churnedMembers: 680,
      churnRate: 3.7,
    },
    marketingKpi: {
      totalSpend: 158000,
      cac: 85.6,
      ltv: 420,
      ltvCacRatio: 4.91,
      repurchaseRate: 34.2,
      monthlyBudgetUtilization: 78.5,
    },
    recentCampaigns: [
      {
        id: 'c1',
        name: '年中促销活动',
        channel: 'wechat' as const,
        status: 'running' as const,
        targetSegment: '活跃会员',
        reachCount: 28000,
        conversionRate: 6.8,
        cost: 35000,
        roi: 4.2,
        startAt: '2026-06-01',
        endAt: '2026-06-20',
      },
      {
        id: 'c2',
        name: '新注册福利券',
        channel: 'app_push' as const,
        status: 'ended' as const,
        targetSegment: '新用户',
        reachCount: 5200,
        conversionRate: 18.3,
        cost: 8000,
        roi: 3.5,
        startAt: '2026-05-15',
        endAt: '2026-05-31',
      },
      {
        id: 'c3',
        name: '会员日双倍积分',
        channel: 'sms' as const,
        status: 'scheduled' as const,
        targetSegment: '全部会员',
        reachCount: 18420,
        conversionRate: 0,
        cost: 1200,
        roi: 0,
        startAt: '2026-07-05',
        endAt: undefined,
      },
    ],
    quickActions: [
      { key: 'new_campaign', label: '新建活动', primary: true },
      { key: 'member_segment', label: '会员分群' },
      { key: 'performance_report', label: '效果报告' },
    ],
  };
}
