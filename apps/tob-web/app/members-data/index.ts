/**
 * members-data — ToB member management mock data
 */

export type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'standard';
export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'churned';

export interface MemberItem {
  id: string;
  code: string;
  name: string;
  phone: string;
  marketCode: string;
  storeName: string;
  tier: MemberTier;
  status: MemberStatus;
  points: number;
  totalSpent: number;
  lastVisit: string;
  createdAt: string;
  salesperson: string;
  tags: string[];
}

export const MEMBER_TIER_MAP: Record<MemberTier, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; color: string }> = {
  diamond: { label: '钻石', variant: 'info', color: '#a78bfa' },
  gold: { label: '黄金', variant: 'warning', color: '#fbbf24' },
  silver: { label: '白银', variant: 'neutral', color: '#94a3b8' },
  bronze: { label: '青铜', variant: 'danger', color: '#d97706' },
  standard: { label: '标准', variant: 'success', color: '#4ade80' },
};

export const MEMBER_STATUS_MAP: Record<MemberStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '活跃', variant: 'success' },
  inactive: { label: '静默', variant: 'warning' },
  suspended: { label: '冻结', variant: 'danger' },
  churned: { label: '流失', variant: 'neutral' },
};

export const MEMBER_TIERS: MemberTier[] = ['diamond', 'gold', 'silver', 'bronze', 'standard'];
export const MEMBER_STATUSES: MemberStatus[] = ['active', 'inactive', 'suspended', 'churned'];

export const ALL_STORES = ['旗舰店(上海)', '旗舰店(北京)', '标准店(深圳)', '标准店(成都)', '体验店(杭州)'];
export const ALL_MARKETS = ['CN-SH', 'CN-BJ', 'CN-GD', 'CN-SC', 'CN-ZJ'];
export const ALL_SALESPERSONS = ['张三', '李四', '王五', '赵六'];

const firstNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '马'];
const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞'];

export function createMockMembers(count = 60): MemberItem[] {
  const now = new Date('2026-06-24');
  const members: MemberItem[] = [];
  for (let i = 1; i <= count; i++) {
    const tier: MemberTier = MEMBER_TIERS[Math.floor(Math.random() * MEMBER_TIERS.length)]!;
    const statusWeights = ['active', 'active', 'active', 'inactive', 'inactive', 'suspended', 'churned'] as const;
    const status: MemberStatus = statusWeights[Math.floor(Math.random() * statusWeights.length)]!;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]!;
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]!;
    const lastVisitDays = Math.floor(Math.random() * 180) + 1;
    const createdDays = Math.floor(Math.random() * 365) + 30;

    const tierPointsMap: Record<MemberTier, [number, number]> = {
      diamond: [150000, 500000],
      gold: [80000, 149999],
      silver: [30000, 79999],
      bronze: [5000, 29999],
      standard: [0, 4999],
    };
    const [pointsMin, pointsMax] = tierPointsMap[tier];
    const points = Math.floor(Math.random() * (pointsMax - pointsMin) + pointsMin);
    const avgSpend = points * 0.08;
    const totalSpent = Math.round(Math.random() * avgSpend + avgSpend * 0.5);

    const tagPool = ['高潜客户', '大额订单', '新客户', '复购高', '价格敏感', '投诉记录', 'VIP', '休眠唤醒'];
    const tagCount = Math.floor(Math.random() * 3);
    const tags = [...tagPool].sort(() => Math.random() - 0.5).slice(0, tagCount);

    members.push({
      id: `tob-mem-${String(i).padStart(4, '0')}`,
      code: `M${String(now.getFullYear()).slice(2)}${String(i).padStart(6, '0')}`,
      name: `${firstName}${lastName}`,
      phone: `1${(['38', '39', '50', '86', '35', '36', '52', '58'] as const)[Math.floor(Math.random() * 8)]!}${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      marketCode: ALL_MARKETS[Math.floor(Math.random() * ALL_MARKETS.length)]!,
      storeName: ALL_STORES[Math.floor(Math.random() * ALL_STORES.length)]!,
      tier,
      status,
      points,
      totalSpent,
      lastVisit: new Date(now.getTime() - lastVisitDays * 86400000).toISOString().slice(0, 10),
      createdAt: new Date(now.getTime() - createdDays * 86400000).toISOString().slice(0, 10),
      salesperson: ALL_SALESPERSONS[Math.floor(Math.random() * ALL_SALESPERSONS.length)]!,
      tags,
    });
  }
  // Sort by most recent first
  members.sort((a, b) => b.totalSpent - a.totalSpent);
  return members;
}

export const MOCK_MEMBERS = createMockMembers(60);
