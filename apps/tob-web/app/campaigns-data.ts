/**
 * campaigns-data.ts — 营销活动 Mock 数据与类型定义
 */
export interface CampaignItem {
  id: string;
  code: string;
  name: string;
  type: 'promotion' | 'seasonal' | 'new_product' | 'retention' | 'cross_sell';
  channel: 'online' | 'offline' | 'omni';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  triggerEvent?: string;
  source?: 'live' | 'mock';
  deletionDisabled?: boolean;
}

export type CampaignStatus = CampaignItem['status'];
export type CampaignType = CampaignItem['type'];
export type CampaignChannel = CampaignItem['channel'];

export type CampaignStatusVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export const CAMPAIGN_STATUS_MAP: Record<CampaignStatus, { label: string; variant: CampaignStatusVariant }> = {
  draft: { label: '草稿', variant: 'neutral' },
  scheduled: { label: '已排期', variant: 'info' },
  active: { label: '进行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  ended: { label: '已结束', variant: 'neutral' },
  archived: { label: '已归档', variant: 'neutral' },
};

export const CAMPAIGN_TYPE_MAP: Record<CampaignType, { label: string; color: string }> = {
  promotion: { label: '促销活动', color: '#f59e0b' },
  seasonal: { label: '季节性活动', color: '#10b981' },
  new_product: { label: '新品推广', color: '#3b82f6' },
  retention: { label: '客户留存', color: '#8b5cf6' },
  cross_sell: { label: '交叉销售', color: '#ec4899' },
};

export const CAMPAIGN_CHANNEL_MAP: Record<CampaignChannel, { label: string; color: string }> = {
  online: { label: '线上', color: '#06b6d4' },
  offline: { label: '线下', color: '#f97316' },
  omni: { label: '全渠道', color: '#a855f7' },
};

export const CAMPAIGN_STATUSES: CampaignStatus[] = ['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'];
export const CAMPAIGN_TYPES: CampaignType[] = ['promotion', 'seasonal', 'new_product', 'retention', 'cross_sell'];
export const CAMPAIGN_CHANNELS: CampaignChannel[] = ['online', 'offline', 'omni'];

export const CAMPAIGN_SEARCH_FIELDS: (keyof CampaignItem)[] = ['code', 'name', 'type', 'channel', 'createdBy'];

export const MOCK_CAMPAIGNS: CampaignItem[] = [
  { id: 'cmp-001', code: 'CAMP-001', name: '618年中大促', type: 'promotion', channel: 'omni', status: 'active', budget: 500000, spent: 385000, impressions: 850000, clicks: 42500, conversions: 3400, roi: 3.8, startDate: '2026-06-01', endDate: '2026-06-20', createdBy: '张三' },
  { id: 'cmp-002', code: 'CAMP-002', name: '夏季新品发布会', type: 'seasonal', channel: 'offline', status: 'scheduled', budget: 200000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-07-10', endDate: '2026-07-12', createdBy: '李四' },
  { id: 'cmp-003', code: 'CAMP-003', name: '会员积分加倍计划', type: 'retention', channel: 'online', status: 'active', budget: 120000, spent: 78000, impressions: 320000, clicks: 18500, conversions: 2100, roi: 4.2, startDate: '2026-06-15', endDate: '2026-07-15', createdBy: '王五' },
  { id: 'cmp-004', code: 'CAMP-004', name: '新品蓝牙耳机推广', type: 'new_product', channel: 'omni', status: 'active', budget: 350000, spent: 215000, impressions: 560000, clicks: 29800, conversions: 1800, roi: 2.5, startDate: '2026-06-10', endDate: '2026-07-10', createdBy: '赵六' },
  { id: 'cmp-005', code: 'CAMP-005', name: '智能家居跨品类推荐', type: 'cross_sell', channel: 'online', status: 'paused', budget: 180000, spent: 92000, impressions: 240000, clicks: 12100, conversions: 780, roi: 1.9, startDate: '2026-05-20', endDate: '2026-06-30', createdBy: '张三' },
  { id: 'cmp-006', code: 'CAMP-006', name: '五一黄金周促销', type: 'promotion', channel: 'omni', status: 'ended', budget: 450000, spent: 420000, impressions: 920000, clicks: 51200, conversions: 4600, roi: 3.2, startDate: '2026-04-25', endDate: '2026-05-05', createdBy: '李四' },
  { id: 'cmp-007', code: 'CAMP-007', name: '企业客户专属优惠', type: 'retention', channel: 'offline', status: 'draft', budget: 80000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-08-01', endDate: '2026-08-31', createdBy: '王五' },
  { id: 'cmp-008', code: 'CAMP-008', name: '开学季学生特惠', type: 'seasonal', channel: 'online', status: 'scheduled', budget: 150000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-08-20', endDate: '2026-09-10', createdBy: '赵六' },
  { id: 'cmp-009', code: 'CAMP-009', name: '双11预售启动', type: 'promotion', channel: 'omni', status: 'draft', budget: 1000000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-10-15', endDate: '2026-11-15', createdBy: '张三' },
  { id: 'cmp-010', code: 'CAMP-010', name: '新注册会员首单礼', type: 'retention', channel: 'online', status: 'active', budget: 60000, spent: 35000, impressions: 185000, clicks: 9600, conversions: 1200, roi: 5.1, startDate: '2026-06-01', endDate: '2026-12-31', createdBy: '李四' },
  { id: 'cmp-011', code: 'CAMP-011', name: '夏季服饰清仓', type: 'seasonal', channel: 'offline', status: 'active', budget: 250000, spent: 168000, impressions: 410000, clicks: 22500, conversions: 3100, roi: 3.5, startDate: '2026-06-20', endDate: '2026-08-15', createdBy: '王五' },
  { id: 'cmp-012', code: 'CAMP-012', name: '高端白酒品鉴会', type: 'new_product', channel: 'offline', status: 'ended', budget: 100000, spent: 95000, impressions: 50000, clicks: 3200, conversions: 420, roi: 1.5, startDate: '2026-05-10', endDate: '2026-05-12', createdBy: '赵六' },
  { id: 'cmp-013', code: 'CAMP-013', name: '全品类满减狂欢', type: 'promotion', channel: 'online', status: 'ended', budget: 300000, spent: 285000, impressions: 680000, clicks: 38900, conversions: 3200, roi: 2.8, startDate: '2026-05-01', endDate: '2026-05-15', createdBy: '张三' },
  { id: 'cmp-014', code: 'CAMP-014', name: '保险产品交叉推荐', type: 'cross_sell', channel: 'online', status: 'paused', budget: 90000, spent: 42000, impressions: 120000, clicks: 6100, conversions: 350, roi: 1.2, startDate: '2026-05-25', endDate: '2026-06-25', createdBy: '李四' },
  { id: 'cmp-015', code: 'CAMP-015', name: '家装季专题促销', type: 'seasonal', channel: 'omni', status: 'active', budget: 380000, spent: 198000, impressions: 490000, clicks: 26100, conversions: 1900, roi: 2.2, startDate: '2026-06-05', endDate: '2026-07-20', createdBy: '王五' },
];

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

export function computeCampaignStats(items: CampaignItem[]) {
  const total = items.length;
  const active = items.filter((c) => c.status === 'active').length;
  const totalBudget = items.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = items.reduce((sum, c) => sum + c.spent, 0);
  const avgRoi =
    items.filter((c) => c.roi > 0).length > 0
      ? items.filter((c) => c.roi > 0).reduce((sum, c) => sum + c.roi, 0) /
        items.filter((c) => c.roi > 0).length
      : 0;
  return { total, active, totalBudget, totalSpent, avgRoi };
}
