export interface MarketingGrowthMetrics {
  totalMembers: number;
  netNewMembers: number;
  netNewTrend: number;
  activeMembers: number;
  activeRate: number;
  churnedMembers: number;
  churnRate: number;
}

export interface MarketingKpi {
  totalSpend: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  repurchaseRate: number;
  monthlyBudgetUtilization: number;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: 'wechat' | 'app_push' | 'sms' | 'douyin' | 'xiaohongshu';
  status: 'running' | 'ended' | 'scheduled' | 'draft';
  targetSegment: string;
  reachCount: number;
  conversionRate: number;
  cost: number;
  roi: number;
  startAt: string;
  endAt?: string;
}

export interface QuickAction {
  key: string;
  label: string;
  primary?: boolean;
}

export interface MarketingDashboardData {
  managerName: string;
  generatedAt: string;
  growthMetrics: MarketingGrowthMetrics;
  marketingKpi: MarketingKpi;
  recentCampaigns: MarketingCampaign[];
  quickActions: QuickAction[];
}

/** Format a number for display, e.g. 18420 -> "1.8万" */
export function formatMemberCount(count: number): string {
  if (count >= 10000) {
    return (count / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  }
  return count.toLocaleString('zh-CN');
}

/** Format currency in yuan, e.g. 158000 -> "15.8万" */
export function formatCurrency(value: number): string {
  if (value >= 10000) {
    return (value / 10000).toFixed(1).replace(/\.0$/, '') + '万元';
  }
  return value.toLocaleString('zh-CN') + '元';
}

/** Format percentage 12.5 -> "12.5%" */
export function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

/** Compute campaign status label in Chinese */
export function campaignStatusLabel(status: MarketingCampaign['status']): string {
  switch (status) {
    case 'running': return '进行中';
    case 'ended': return '已结束';
    case 'scheduled': return '已排期';
    case 'draft': return '草稿';
  }
}

/** Compute campaign channel label in Chinese */
export function campaignChannelLabel(channel: MarketingCampaign['channel']): string {
  switch (channel) {
    case 'wechat': return '微信';
    case 'app_push': return 'App推送';
    case 'sms': return '短信';
    case 'douyin': return '抖音';
    case 'xiaohongshu': return '小红书';
  }
}
