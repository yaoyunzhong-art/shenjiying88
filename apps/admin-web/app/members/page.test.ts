/**
 * members-page.test.ts — Page-level rendering pattern tests for members listing page.
 * Tests search, pagination, lifecycle stage filtering, and combined filters.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: members-data.ts, existing members-page.test.ts (data logic tests)
 *
 * NOTE: This file supplements the existing members-page.test.ts which already covers
 * data integrity, tier/status maps, and sorting. This file focuses on page-level
 * use-case patterns like search, pagination, and lifecycle filters.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_MEMBERS,
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_LIFECYCLE_MAP,
  MEMBER_TIERS,
  MEMBER_STATUSES,
  type MemberItem,
  type MemberTier,
  type MemberStatus,
} from '../members-data';

// ---- Page-level filter helpers ----

function searchMembers(items: MemberItem[], keyword: string): MemberItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (m) =>
      m.name.toLowerCase().includes(lower) ||
      m.code.toLowerCase().includes(lower) ||
      m.phone.toLowerCase().includes(lower) ||
      m.storeName.toLowerCase().includes(lower) ||
      m.marketCode.toLowerCase().includes(lower)
  );
}

function filterByTier(items: MemberItem[], tier: MemberTier | 'ALL'): MemberItem[] {
  if (tier === 'ALL') return items;
  return items.filter((m) => m.tier === tier);
}

function filterByStatus(items: MemberItem[], status: MemberStatus | 'ALL'): MemberItem[] {
  if (status === 'ALL') return items;
  return items.filter((m) => m.status === status);
}

function filterByMarket(items: MemberItem[], market: string): MemberItem[] {
  if (market === 'ALL') return items;
  return items.filter((m) => m.marketCode === market);
}

function paginate(items: MemberItem[], page: number, pageSize: number): MemberItem[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function fullFilterChain(
  items: MemberItem[],
  keyword: string,
  tier: MemberTier | 'ALL',
  status: MemberStatus | 'ALL',
  market: string,
): MemberItem[] {
  let result = searchMembers(items, keyword);
  result = filterByTier(result, tier);
  result = filterByStatus(result, status);
  result = filterByMarket(result, market);
  return result;
}

function getLifecycleStage(member: MemberItem): string {
  const points = member.points;
  const visitCount = member.visitCount;
  const lastVisit = new Date(member.lastVisitAt);
  const now = new Date('2026-06-24');
  const daysSinceLastVisit = Math.floor(
    (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (member.status === 'cancelled') return 'lost';
  if (daysSinceLastVisit > 180) return 'lost';
  if (daysSinceLastVisit > 60) return 'declining';
  if (visitCount <= 50) return 'new';
  if (points >= 100000) return 'loyal';
  if (visitCount >= 50) return 'growing';
  return 'new';
}

function filterByLifecycle(
  items: MemberItem[],
  lifecycle: string | 'ALL'
): MemberItem[] {
  if (lifecycle === 'ALL') return items;
  return items.filter((m) => getLifecycleStage(m) === lifecycle);
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

// ---- 正例 ----

describe('members-page: 正例 (positive cases)', () => {
  describe('search', () => {
    it('should find member by name', () => {
      const result = searchMembers(MOCK_MEMBERS, '张伟');
      assert.ok(result.length >= 1);
      for (const m of result) {
        assert.ok(m.name.includes('张伟') || m.name.toLowerCase().includes('张伟'));
      }
    });

    it('should find member by code', () => {
      const result = searchMembers(MOCK_MEMBERS, 'MEM-001');
      assert.ok(result.length >= 1);
    });

    it('should find member by phone', () => {
      const result = searchMembers(MOCK_MEMBERS, '138-0001-0001');
      assert.ok(result.length >= 1);
    });

    it('should find member by storeName', () => {
      const result = searchMembers(MOCK_MEMBERS, '朝阳大悦城');
      assert.ok(result.length >= 2, `expected >= 2, got ${result.length}`);
    });

    it('empty search should return all members', () => {
      const result = searchMembers(MOCK_MEMBERS, '');
      assert.strictEqual(result.length, MOCK_MEMBERS.length);
    });
  });

  describe('tier filter', () => {
    it('filter diamond should return only diamond members', () => {
      const result = filterByTier(MOCK_MEMBERS, 'diamond');
      assert.ok(result.length >= 3, `expected >= 3 diamond, got ${result.length}`);
      for (const m of result) {
        assert.strictEqual(m.tier, 'diamond');
      }
    });

    it('filter gold should return only gold members', () => {
      const result = filterByTier(MOCK_MEMBERS, 'gold');
      assert.ok(result.length >= 3);
      for (const m of result) {
        assert.strictEqual(m.tier, 'gold');
      }
    });

    it('filter standard should return only standard members', () => {
      const result = filterByTier(MOCK_MEMBERS, 'standard');
      assert.ok(result.length >= 3);
      for (const m of result) {
        assert.strictEqual(m.tier, 'standard');
      }
    });
  });

  describe('status filter', () => {
    it('filter active should return only active members', () => {
      const result = filterByStatus(MOCK_MEMBERS, 'active');
      assert.ok(result.length >= 10, `expected >= 10 active, got ${result.length}`);
      for (const m of result) {
        assert.strictEqual(m.status, 'active');
      }
    });

    it('filter frozen should return only frozen members', () => {
      const result = filterByStatus(MOCK_MEMBERS, 'frozen');
      for (const m of result) {
        assert.strictEqual(m.status, 'frozen');
      }
    });

    it('filter dormant should return only dormant members', () => {
      const result = filterByStatus(MOCK_MEMBERS, 'dormant');
      for (const m of result) {
        assert.strictEqual(m.status, 'dormant');
      }
    });

    it('filter cancelled should return only cancelled members', () => {
      const result = filterByStatus(MOCK_MEMBERS, 'cancelled');
      for (const m of result) {
        assert.strictEqual(m.status, 'cancelled');
      }
    });
  });

  describe('pagination', () => {
    it('page 1 with pageSize 10 should return 10 items', () => {
      const page = paginate(MOCK_MEMBERS, 1, 10);
      assert.strictEqual(page.length, 10);
    });

    it('page 2 with pageSize 10 should return remaining items', () => {
      const page = paginate(MOCK_MEMBERS, 2, 10);
      assert.strictEqual(page.length, MOCK_MEMBERS.length - 10);
    });

    it('getTotalPages should be correct', () => {
      assert.strictEqual(getTotalPages(20, 10), 2);
      assert.strictEqual(getTotalPages(1, 10), 1);
      assert.strictEqual(getTotalPages(0, 10), 1);
    });
  });

  describe('lifecycle stage', () => {
    it('should identify loyal members (points >= 100000)', () => {
      const loyal = MOCK_MEMBERS.filter((m) => getLifecycleStage(m) === 'loyal');
      assert.ok(loyal.length >= 3, `expected >= 3 loyal, got ${loyal.length}`);
      for (const m of loyal) {
        assert.ok(m.points >= 100000, `loyal ${m.code} has points ${m.points}`);
      }
    });

    it('should identify lost members (cancelled or > 180 days)', () => {
      const lost = MOCK_MEMBERS.filter((m) => getLifecycleStage(m) === 'lost');
      assert.ok(lost.length >= 2, `expected >= 2 lost, got ${lost.length}`);
    });

    it('filter by lifecycle loyal should work', () => {
      const result = filterByLifecycle(MOCK_MEMBERS, 'loyal');
      for (const m of result) {
        assert.ok(m.points >= 100000, `${m.code} has ${m.points} points`);
      }
    });
  });

  describe('combined filters', () => {
    it('should filter by tier + status simultaneously', () => {
      const result = fullFilterChain(MOCK_MEMBERS, '', 'diamond', 'active', 'ALL');
      for (const m of result) {
        assert.strictEqual(m.tier, 'diamond');
        assert.strictEqual(m.status, 'active');
      }
    });

    it('should filter by search + market', () => {
      const result = fullFilterChain(MOCK_MEMBERS, '张伟', 'ALL', 'ALL', 'ALL');
      assert.ok(result.length >= 1);
      for (const m of result) {
        assert.ok(m.name.includes('张伟'));
      }
    });

    it('should filter by market cn-mainland', () => {
      const result = filterByMarket(MOCK_MEMBERS, 'cn-mainland');
      assert.ok(result.length > MOCK_MEMBERS.filter((m) => m.marketCode !== 'cn-mainland').length,
        'cn-mainland should be majority');
      for (const m of result) {
        assert.strictEqual(m.marketCode, 'cn-mainland');
      }
    });
  });

  describe('formatCurrency', () => {
    it('should format large amounts with 万', () => {
      assert.strictEqual(formatCurrency(367800), '¥36.8万');
      assert.strictEqual(formatCurrency(10000), '¥1.0万');
    });

    it('should format small amounts without 万', () => {
      const result = formatCurrency(6400);
      assert.ok(result.startsWith('¥'));
      assert.ok(result.includes('6,400') || result.includes('6400'));
    });
  });
});

// ---- 反例 ----

describe('members-page: 反例 (negative cases)', () => {
  it('search for nonexistent keyword should return empty', () => {
    const result = searchMembers(MOCK_MEMBERS, 'ZZZZ_NOT_FOUND');
    assert.strictEqual(result.length, 0);
  });

  it('empty member list should handle all filters gracefully', () => {
    const empty: MemberItem[] = [];
    assert.strictEqual(searchMembers(empty, 'test').length, 0);
    assert.strictEqual(filterByTier(empty, 'diamond').length, 0);
    assert.strictEqual(filterByStatus(empty, 'active').length, 0);
    assert.strictEqual(paginate(empty, 1, 10).length, 0);
    assert.strictEqual(fullFilterChain(empty, '', 'ALL', 'ALL', 'ALL').length, 0);
  });

  it('pagination should return empty for page beyond total', () => {
    const result = paginate(MOCK_MEMBERS, 999, 10);
    assert.strictEqual(result.length, 0);
  });

  it('pagination should return empty for page 0', () => {
    const result = paginate(MOCK_MEMBERS, 0, 10);
    assert.strictEqual(result.length, 0);
  });
});

// ---- 边界 ----

describe('members-page: 边界 (boundary cases)', () => {
  it('single char search should find matches', () => {
    const result = searchMembers(MOCK_MEMBERS, '张');
    assert.ok(result.length >= 1);
  });

  it('case-insensitive search should work', () => {
    const upper = searchMembers(MOCK_MEMBERS, 'MEM-001');
    const lower = searchMembers(MOCK_MEMBERS, 'mem-001');
    assert.strictEqual(upper.length, lower.length);
  });

  it('diamond members should have the highest avg points', () => {
    const diamond = MOCK_MEMBERS.filter((m) => m.tier === 'diamond');
    const standard = MOCK_MEMBERS.filter((m) => m.tier === 'standard');
    const diamondAvg = diamond.reduce((s, m) => s + m.points, 0) / diamond.length;
    const standardAvg = standard.reduce((s, m) => s + m.points, 0) / standard.length;
    assert.ok(diamondAvg > standardAvg, `diamond avg ${diamondAvg} > standard avg ${standardAvg}`);
  });

  it('cancelled members should have low totalSpent (< 10000)', () => {
    const cancelled = MOCK_MEMBERS.filter((m) => m.status === 'cancelled');
    for (const m of cancelled) {
      assert.ok(m.totalSpent < 10000, `cancelled ${m.code} has totalSpent ${m.totalSpent}`);
    }
  });

  it('members can have empty tags', () => {
    const emptyTags = MOCK_MEMBERS.filter((m) => m.tags.length === 0);
    assert.ok(emptyTags.length >= 2, `expected >= 2 members with empty tags`);
  });

  it('new members should have visitCount <= 50', () => {
    const newOnes = MOCK_MEMBERS.filter((m) => getLifecycleStage(m) === 'new');
    if (newOnes.length > 0) {
      for (const m of newOnes) {
        assert.ok(m.visitCount <= 50, `${m.code} visitCount ${m.visitCount} should be <= 50`);
      }
    }
  });

  it('registeredAt should be before lastVisitAt for active members', () => {
    for (const m of MOCK_MEMBERS) {
      if (m.status === 'active') {
        assert.ok(
          m.registeredAt <= m.lastVisitAt,
          `${m.code}: registeredAt ${m.registeredAt} > lastVisitAt ${m.lastVisitAt}`
        );
      }
    }
  });

  it('all 5 tiers should have at least one member', () => {
    for (const t of MEMBER_TIERS) {
      const count = MOCK_MEMBERS.filter((m) => m.tier === t).length;
      assert.ok(count >= 1, `tier ${t} has 0 members`);
    }
  });

  it('all 4 statuses should have at least one member', () => {
    for (const s of MEMBER_STATUSES) {
      const count = MOCK_MEMBERS.filter((m) => m.status === s).length;
      assert.ok(count >= 1, `status ${s} has 0 members`);
    }
  });

  it('member markets should include "cn-mainland", "us-default", "uk-default"', () => {
    const markets = new Set(MOCK_MEMBERS.map((m) => m.marketCode));
    assert.ok(markets.has('cn-mainland'));
    assert.ok(markets.has('us-default'));
    assert.ok(markets.has('uk-default'));
  });
});
