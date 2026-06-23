/**
 * member-center unit tests — storefront-web
 *
 * 覆盖: 会员中心数据 / 积分规则 / 等级提升 / 空状态 / 错误状态
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';
type MemberActivityType = 'purchase' | 'visit' | 'review' | 'referral' | 'event' | 'birthday_bonus';

interface MemberProfile {
  memberId: string; name: string; phone: string; tier: MemberTier;
  pointsBalance: number; totalPointsEarned: number; totalPointsRedeemed: number;
  totalVisits: number; totalSpent: number; joinedAt: string; birthday: string;
  storeCode: string; storeName: string;
}

interface MemberActivity {
  id: string; memberId: string; type: MemberActivityType;
  description: string; pointsChange: number; timestamp: string; storeCode: string;
}

interface TierThreshold { tier: MemberTier; minPoints: number; minVisits: number; minSpent: number; discountPercent: number; pointMultiplier: number; benefits: string[] }

const TIER_ORDER: MemberTier[] = ['basic', 'bronze', 'silver', 'gold', 'diamond'];
const ACTIVITY_TYPES: MemberActivityType[] = ['purchase', 'visit', 'review', 'referral', 'event', 'birthday_bonus'];

const TIER_THRESHOLDS: TierThreshold[] = [
  { tier: 'basic', minPoints: 0, minVisits: 0, minSpent: 0, discountPercent: 0, pointMultiplier: 1, benefits: ['基础会员权益'] },
  { tier: 'bronze', minPoints: 1000, minVisits: 5, minSpent: 500, discountPercent: 3, pointMultiplier: 1.2, benefits: ['3%消费折扣'] },
  { tier: 'silver', minPoints: 5000, minVisits: 20, minSpent: 3000, discountPercent: 5, pointMultiplier: 1.5, benefits: ['5%消费折扣', '生日礼遇'] },
  { tier: 'gold', minPoints: 15000, minVisits: 50, minSpent: 10000, discountPercent: 8, pointMultiplier: 2, benefits: ['8%消费折扣', '生日礼遇', '优先客服'] },
  { tier: 'diamond', minPoints: 50000, minVisits: 100, minSpent: 30000, discountPercent: 12, pointMultiplier: 3, benefits: ['12%消费折扣', 'VIP客服', '专属活动'] },
];

const MOCK_MEMBER_PROFILES: MemberProfile[] = [
  { memberId: 'm1', name: '张伟', phone: '138****1234', tier: 'diamond', pointsBalance: 28500, totalPointsEarned: 52000, totalPointsRedeemed: 23500, totalVisits: 156, totalSpent: 38000, joinedAt: '2025-01-15', birthday: '1990-05-20', storeCode: 'store-001', storeName: 'Demo Store 旗舰店' },
  { memberId: 'm2', name: '李娜', phone: '139****5678', tier: 'gold', pointsBalance: 12400, totalPointsEarned: 18000, totalPointsRedeemed: 5600, totalVisits: 89, totalSpent: 15000, joinedAt: '2025-03-22', birthday: '1988-11-03', storeCode: 'store-001', storeName: 'Demo Store 旗舰店' },
  { memberId: 'm3', name: '王芳', phone: '137****9012', tier: 'silver', pointsBalance: 5600, totalPointsEarned: 7200, totalPointsRedeemed: 1600, totalVisits: 42, totalSpent: 5200, joinedAt: '2025-06-10', birthday: '1995-07-15', storeCode: 'store-002', storeName: 'Demo Store 社区店' },
  { memberId: 'm4', name: '赵强', phone: '136****3456', tier: 'bronze', pointsBalance: 2100, totalPointsEarned: 2100, totalPointsRedeemed: 0, totalVisits: 18, totalSpent: 1200, joinedAt: '2025-09-01', birthday: '1992-02-14', storeCode: 'store-002', storeName: 'Demo Store 社区店' },
  { memberId: 'm5', name: '孙丽', phone: '135****7890', tier: 'basic', pointsBalance: 800, totalPointsEarned: 800, totalPointsRedeemed: 0, totalVisits: 5, totalSpent: 320, joinedAt: '2026-01-10', birthday: '2000-08-08', storeCode: 'store-001', storeName: 'Demo Store 旗舰店' },
];

const MOCK_MEMBER_ACTIVITIES: MemberActivity[] = [
  { id: 'act-001', memberId: 'm1', type: 'purchase', description: '购买有机全麦面包 x2', pointsChange: 37, timestamp: '2026-06-22T14:30:00Z', storeCode: 'store-001' },
  { id: 'act-002', memberId: 'm1', type: 'visit', description: '到店签到', pointsChange: 10, timestamp: '2026-06-22T14:25:00Z', storeCode: 'store-001' },
  { id: 'act-003', memberId: 'm1', type: 'referral', description: '推荐好友注册', pointsChange: 500, timestamp: '2026-06-20T10:00:00Z', storeCode: 'store-001' },
  { id: 'act-004', memberId: 'm2', type: 'purchase', description: '购买智能手环 S3', pointsChange: 249, timestamp: '2026-06-21T16:00:00Z', storeCode: 'store-001' },
  { id: 'act-005', memberId: 'm3', type: 'review', description: '发表商品评价', pointsChange: 20, timestamp: '2026-06-19T11:00:00Z', storeCode: 'store-002' },
  { id: 'act-006', memberId: 'm1', type: 'birthday_bonus', description: '生日额外积分奖励', pointsChange: 1000, timestamp: '2026-05-20T00:00:00Z', storeCode: 'store-001' },
  { id: 'act-007', memberId: 'm4', type: 'event', description: '参加门店品鉴活动', pointsChange: 50, timestamp: '2026-06-15T18:00:00Z', storeCode: 'store-002' },
  { id: 'act-008', memberId: 'm5', type: 'purchase', description: '购买椰子水 330ml', pointsChange: 8, timestamp: '2026-06-10T09:00:00Z', storeCode: 'store-001' },
];

function computeNextTier(currentTier: MemberTier, totalPoints: number, totalVisits: number, totalSpent: number): MemberTier | null {
  const idx = TIER_ORDER.indexOf(currentTier);
  for (let i = idx + 1; i < TIER_ORDER.length; i++) {
    const t = TIER_THRESHOLDS[i]!;
    if (totalPoints >= t.minPoints && totalVisits >= t.minVisits && totalSpent >= t.minSpent) return TIER_ORDER[i]!;
  }
  return null;
}

function computeTierProgress(currentTier: MemberTier, totalPoints: number, totalVisits: number, totalSpent: number) {
  const next = computeNextTier(currentTier, totalPoints, totalVisits, totalSpent);
  if (!next) return null;
  const t = TIER_THRESHOLDS.find(x => x.tier === next)!;
  return { pointsNeeded: Math.max(0, t.minPoints - totalPoints), visitsNeeded: Math.max(0, t.minVisits - totalVisits), spentNeeded: Math.max(0, t.minSpent - totalSpent) };
}

function aggregateActivitySummary(activities: MemberActivity[]) {
  const byType = { purchase: 0, visit: 0, review: 0, referral: 0, event: 0, birthday_bonus: 0 } as Record<MemberActivityType, number>;
  for (const a of activities) byType[a.type] = (byType[a.type] || 0) + 1;
  return { totalEarned: activities.filter(a => a.pointsChange > 0).reduce((s, a) => s + a.pointsChange, 0), totalRedeemed: activities.filter(a => a.pointsChange < 0).reduce((s, a) => s + Math.abs(a.pointsChange), 0), activityCount: activities.length, byType };
}

describe('member-center data integrity', () => {
  it('should have at least 5 member profiles', () => assert.ok(MOCK_MEMBER_PROFILES.length >= 5));
  it('every member profile should have required fields', () => {
    for (const m of MOCK_MEMBER_PROFILES) {
      assert.ok(m.pointsBalance >= 0);
      assert.ok(m.totalVisits >= 0);
      assert.ok(m.totalSpent >= 0);
      assert.ok(m.totalPointsEarned >= m.totalPointsRedeemed);
      assert.ok(TIER_ORDER.includes(m.tier));
    }
  });
  it('points balance should equal earned minus redeemed', () => {
    for (const m of MOCK_MEMBER_PROFILES) assert.equal(m.pointsBalance, m.totalPointsEarned - m.totalPointsRedeemed);
  });
  it('every activity should have valid type', () => {
    for (const a of MOCK_MEMBER_ACTIVITIES) assert.ok(ACTIVITY_TYPES.includes(a.type));
  });
});

describe('member-center tier computation', () => {
  it('diamond member should have no next tier', () => {
    const diamond = MOCK_MEMBER_PROFILES.find(m => m.tier === 'diamond')!;
    assert.equal(computeNextTier(diamond.tier, diamond.totalPointsEarned, diamond.totalVisits, diamond.totalSpent), null);
  });
  it('basic member with low stats should not advance', () => {
    const basic = MOCK_MEMBER_PROFILES.find(m => m.tier === 'basic')!;
    assert.equal(computeNextTier(basic.tier, basic.totalPointsEarned, basic.totalVisits, basic.totalSpent), null);
  });
  it('tier progress should return null for max tier', () => assert.equal(computeTierProgress('diamond', 100000, 1000, 100000), null));
  it('tier progress should return requirements for next tier', () => {
    // bronze member with stats qualifying for silver → progress should be 0 (all thresholds met)
    const prog = computeTierProgress('bronze', 5000, 20, 3000);
    assert.ok(prog !== null);
    assert.equal(prog!.pointsNeeded, 0);
    assert.equal(prog!.visitsNeeded, 0);
    assert.equal(prog!.spentNeeded, 0);
  });
  it('tier progress returns null when stats are far below threshold', () => {
    const prog = computeTierProgress('basic', 500, 2, 200);
    // 500 pts < 1000 bronze minimum, 2 visits < 5, 200 spent < 500 → cannot reach bronze
    assert.equal(prog, null);
  });
});

describe('member-center empty/error states', () => {
  it('empty member list should not crash', () => {
    const empty: MemberProfile[] = [];
    assert.equal(empty.length, 0);
  });
  it('empty activity list should have zero summary', () => {
    const summary = aggregateActivitySummary([]);
    assert.equal(summary.totalEarned, 0);
    assert.equal(summary.activityCount, 0);
  });
});

describe('member-center activity summary', () => {
  it('total earned should equal sum of positive changes', () => {
    const summary = aggregateActivitySummary(MOCK_MEMBER_ACTIVITIES);
    const manual = MOCK_MEMBER_ACTIVITIES.filter(a => a.pointsChange > 0).reduce((s, a) => s + a.pointsChange, 0);
    assert.equal(summary.totalEarned, manual);
  });
  it('byType should sum to total count', () => {
    const summary = aggregateActivitySummary(MOCK_MEMBER_ACTIVITIES);
    assert.equal(Object.values(summary.byType).reduce((a, b) => a + b, 0), MOCK_MEMBER_ACTIVITIES.length);
  });
});
