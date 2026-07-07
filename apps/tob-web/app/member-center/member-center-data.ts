export interface MemberLevel {
  level: number;
  name: string;
  minGrowth: number;
  maxGrowth: number;
  privileges: string[];
}

export interface MemberProgress {
  memberId: string;
  level: number;
  growthValue: number;
  nextLevelTarget: number;
  progressPercent: number;
  updatedAt: string;
}

export interface PointsSummary {
  total: number;
  available: number;
  frozen: number;
  expiredSoon: number;
}

export type PointsRecordType = 'earn' | 'redeem' | 'expire' | 'adjust';

export interface PointsRecord {
  recordId: string;
  type: PointsRecordType;
  amount: number;
  balance: number;
  reason: string;
  createdAt: string;
}

export interface CrossStoreActivity {
  storeId: string;
  storeName: string;
  visitCount: number;
  lastVisit: string;
  pointsEarned: number;
}

export const MOCK_LEVELS: MemberLevel[] = [
  {
    level: 1,
    name: 'L1路人',
    minGrowth: 0,
    maxGrowth: 999,
    privileges: ['基础购物九五折', '生日礼物'],
  },
  {
    level: 2,
    name: 'L2会员',
    minGrowth: 1000,
    maxGrowth: 2999,
    privileges: ['基础购物九折', '生日礼物', '每月专属优惠券'],
  },
  {
    level: 3,
    name: 'L3银卡',
    minGrowth: 3000,
    maxGrowth: 5999,
    privileges: ['购物八五折', '生日礼物', '每月专属优惠券', '专属客服'],
  },
  {
    level: 4,
    name: 'L4金卡',
    minGrowth: 6000,
    maxGrowth: 9999,
    privileges: ['购物八折', '生日礼物', '双月专属优惠券', '专属客服', '优先发货'],
  },
  {
    level: 5,
    name: 'L5白金',
    minGrowth: 10000,
    maxGrowth: 19999,
    privileges: ['购物七五折', '生日礼物', '每月专属优惠券', '专属客服', '优先发货', '免费快递'],
  },
  {
    level: 6,
    name: 'L6传奇',
    minGrowth: 20000,
    maxGrowth: 999999,
    privileges: ['购物七折', '生日礼物', '每周专属优惠券', '专属客服', '优先发货', '免费快递', '专属顾问'],
  },
];

export const MOCK_PROGRESS: MemberProgress = {
  memberId: 'M10001',
  level: 3,
  growthValue: 3500,
  nextLevelTarget: 4500,
  progressPercent: 0.78,
  updatedAt: '2026-07-01T10:30:00Z',
};

export const MOCK_POINTS: PointsSummary = {
  total: 12800,
  available: 11500,
  frozen: 800,
  expiredSoon: 500,
};

export const MOCK_POINTS_RECORDS: PointsRecord[] = [
  {
    recordId: 'PR001',
    type: 'earn',
    amount: 500,
    balance: 12000,
    reason: '消费满500元',
    createdAt: '2026-07-01T09:00:00Z',
  },
  {
    recordId: 'PR002',
    type: 'redeem',
    amount: -200,
    balance: 11800,
    reason: '兑换优惠券',
    createdAt: '2026-06-30T15:30:00Z',
  },
  {
    recordId: 'PR003',
    type: 'earn',
    amount: 300,
    balance: 12000,
    reason: '推荐好友',
    createdAt: '2026-06-29T11:20:00Z',
  },
  {
    recordId: 'PR004',
    type: 'expire',
    amount: -100,
    balance: 11700,
    reason: '积分过期',
    createdAt: '2026-06-28T00:00:00Z',
  },
  {
    recordId: 'PR005',
    type: 'adjust',
    amount: 50,
    balance: 11800,
    reason: '活动奖励',
    createdAt: '2026-06-27T14:00:00Z',
  },
  {
    recordId: 'PR006',
    type: 'redeem',
    amount: -500,
    balance: 11300,
    reason: '兑换礼品',
    createdAt: '2026-06-25T10:00:00Z',
  },
  {
    recordId: 'PR007',
    type: 'earn',
    amount: 800,
    balance: 11800,
    reason: '大额消费奖励',
    createdAt: '2026-06-20T16:30:00Z',
  },
  {
    recordId: 'PR008',
    type: 'adjust',
    amount: -30,
    balance: 11000,
    reason: '退换货扣减',
    createdAt: '2026-06-18T09:15:00Z',
  },
  {
    recordId: 'PR009',
    type: 'earn',
    amount: 200,
    balance: 11500,
    reason: '签到奖励',
    createdAt: '2026-06-15T08:00:00Z',
  },
  {
    recordId: 'PR010',
    type: 'expire',
    amount: -200,
    balance: 11300,
    reason: '积分过期',
    createdAt: '2026-06-10T00:00:00Z',
  },
];

export const MOCK_CROSS_STORE: CrossStoreActivity[] = [
  {
    storeId: 'S001',
    storeName: '旗舰店-北京路',
    visitCount: 15,
    lastVisit: '2026-06-28T14:30:00Z',
    pointsEarned: 2800,
  },
  {
    storeId: 'S002',
    storeName: '潮流店-天河城',
    visitCount: 8,
    lastVisit: '2026-06-20T10:00:00Z',
    pointsEarned: 1200,
  },
  {
    storeId: 'S003',
    storeName: '折扣店-万达广场',
    visitCount: 3,
    lastVisit: '2026-06-05T16:45:00Z',
    pointsEarned: 500,
  },
];

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
