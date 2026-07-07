// Campaign types
export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'ended';
  roi: number;
  reachCount: number;
  createdAt: string;
  description: string;
}

export interface CopyVariant {
  id: string;
  campaignId: string;
  title: string;
  body: string;
  cta: string;
  variant: 'A' | 'B' | 'C';
}

export interface ABExperiment {
  id: string;
  campaignId: string;
  name: string;
  variants: CopyVariant[];
  lift: number;
  confidence: number;
  status: 'running' | 'completed' | 'draft';
  startDate: string;
  endDate?: string;
}

export interface MemberSegment {
  id: string;
  name: string;
  type: 'new' | 'active' | 'dormant' | 'churned';
  memberCount: number;
  description: string;
  avgOrderValue: number;
  lastActiveDays: number;
}

export interface ROIMetrics {
  campaignId: string;
  revenue: number;
  cost: number;
  roi: number;
  conversions: number;
  impressions: number;
  ctr: number;
}

// MOCK Data
export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'C001',
    name: '618大促狂欢',
    status: 'active',
    roi: 4.2,
    reachCount: 125000,
    createdAt: '2026-06-01T10:00:00Z',
    description: '618年中大促活动',
  },
  {
    id: 'C002',
    name: '新用户首单礼',
    status: 'active',
    roi: 3.8,
    reachCount: 45000,
    createdAt: '2026-06-15T09:00:00Z',
    description: '新用户首单满减优惠',
  },
  {
    id: 'C003',
    name: '会员日特惠',
    status: 'paused',
    roi: 2.9,
    reachCount: 78000,
    createdAt: '2026-05-20T14:00:00Z',
    description: '会员专属折扣活动',
  },
  {
    id: 'C004',
    name: '沉睡用户唤醒',
    status: 'active',
    roi: 1.8,
    reachCount: 32000,
    createdAt: '2026-06-10T11:00:00Z',
    description: '唤醒90天未消费用户',
  },
  {
    id: 'C005',
    name: '爆款推荐',
    status: 'ended',
    roi: 5.6,
    reachCount: 200000,
    createdAt: '2026-04-01T08:00:00Z',
    description: '爆款产品推广活动',
  },
];

export const MOCK_AB_EXPERIMENTS: ABExperiment[] = [
  {
    id: 'AB001',
    campaignId: 'C001',
    name: '618促销文案测试',
    variants: [
      { id: 'V001', campaignId: 'C001', title: '618大促 全场5折起', body: '爆款商品限时抢购', cta: '立即抢购', variant: 'A' },
      { id: 'V002', campaignId: 'C001', title: '错过等一年 618重磅来袭', body: '百款商品专属优惠', cta: '领取优惠券', variant: 'B' },
    ],
    lift: 15.3,
    confidence: 95.2,
    status: 'completed',
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-06-18T23:59:59Z',
  },
  {
    id: 'AB002',
    campaignId: 'C002',
    name: '首单礼文案优化',
    variants: [
      { id: 'V003', campaignId: 'C002', title: '新用户专属福利', body: '首单满100减20', cta: '去领取', variant: 'A' },
      { id: 'V004', campaignId: 'C002', title: '首次下单 立享优惠', body: '新用户首单满减', cta: '立即注册', variant: 'B' },
    ],
    lift: 8.7,
    confidence: 88.5,
    status: 'running',
    startDate: '2026-06-15T00:00:00Z',
  },
  {
    id: 'AB003',
    campaignId: 'C004',
    name: '唤醒文案对比',
    variants: [
      { id: 'V005', campaignId: 'C004', title: '好久不见 优惠等你', body: '专属折扣仅限老用户', cta: '回来看看', variant: 'A' },
      { id: 'V006', campaignId: 'C004', title: '我们想你了', body: '送你一张专属优惠券', cta: '查看优惠', variant: 'B' },
    ],
    lift: 22.1,
    confidence: 97.8,
    status: 'running',
    startDate: '2026-06-20T00:00:00Z',
  },
];

export const MOCK_SEGMENTS: MemberSegment[] = [
  {
    id: 'S001',
    name: '新用户',
    type: 'new',
    memberCount: 12500,
    description: '注册30天内有消费记录的用户',
    avgOrderValue: 128,
    lastActiveDays: 7,
  },
  {
    id: 'S002',
    name: '活跃用户',
    type: 'active',
    memberCount: 45000,
    description: '近30天有消费的用户',
    avgOrderValue: 356,
    lastActiveDays: 5,
  },
  {
    id: 'S003',
    name: '沉睡用户',
    type: 'dormant',
    memberCount: 28000,
    description: '31-90天未消费的用户',
    avgOrderValue: 198,
    lastActiveDays: 45,
  },
  {
    id: 'S004',
    name: '流失用户',
    type: 'churned',
    memberCount: 15000,
    description: '90天以上未消费的用户',
    avgOrderValue: 0,
    lastActiveDays: 120,
  },
];

export const MOCK_ROI_METRICS: ROIMetrics[] = MOCK_CAMPAIGNS.map(c => ({
  campaignId: c.id,
  revenue: Math.round(c.roi * 100000),
  cost: 100000,
  roi: c.roi,
  conversions: Math.round(c.reachCount * 0.12),
  impressions: c.reachCount,
  ctr: 12.5,
}));
