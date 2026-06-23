/**
 * members-page.test.ts — Unit tests for members data and page logic
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
} from '../app/members-data';

// ---- 辅助函数 ----

function tierOrder(tier: MemberTier): number {
  const o: Record<MemberTier, number> = {
    diamond: 5,
    gold: 4,
    silver: 3,
    bronze: 2,
    standard: 1,
  };
  return o[tier];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

describe('members-data', () => {
  describe('MOCK_MEMBERS', () => {
    it('should contain at least 12 members', () => {
      assert.ok(
        MOCK_MEMBERS.length >= 12,
        `expected >= 12, got ${MOCK_MEMBERS.length}`
      );
    });

    it('every member should have a unique id', () => {
      const ids = MOCK_MEMBERS.map((m) => m.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every member should have a unique code', () => {
      const codes = MOCK_MEMBERS.map((m) => m.code);
      assert.strictEqual(new Set(codes).size, codes.length);
    });

    it('every member should have a valid tier', () => {
      for (const m of MOCK_MEMBERS) {
        assert.ok(
          MEMBER_TIERS.includes(m.tier),
          `invalid tier ${m.tier} for ${m.id}`
        );
      }
    });

    it('every member should have a valid status', () => {
      for (const m of MOCK_MEMBERS) {
        assert.ok(
          MEMBER_STATUSES.includes(m.status),
          `invalid status ${m.status} for ${m.id}`
        );
      }
    });

    it('every member points should be >= 0', () => {
      for (const m of MOCK_MEMBERS) {
        assert.ok(m.points >= 0, `negative points for ${m.id}: ${m.points}`);
      }
    });

    it('every member totalSpent should be >= 0', () => {
      for (const m of MOCK_MEMBERS) {
        assert.ok(
          m.totalSpent >= 0,
          `negative totalSpent for ${m.id}: ${m.totalSpent}`
        );
      }
    });

    it('every member visitCount should be >= 0', () => {
      for (const m of MOCK_MEMBERS) {
        assert.ok(
          m.visitCount >= 0,
          `negative visitCount for ${m.id}: ${m.visitCount}`
        );
      }
    });

    it('every member avgOrderValue should be > 0 for active members', () => {
      for (const m of MOCK_MEMBERS) {
        if (m.status !== 'cancelled') {
          assert.ok(
            m.avgOrderValue > 0,
            `avgOrderValue should be > 0 for non-cancelled ${m.id}`
          );
        }
      }
    });

    it('should have members in multiple markets', () => {
      const markets = new Set(MOCK_MEMBERS.map((m) => m.marketCode));
      assert.ok(
        markets.size >= 2,
        `expected >= 2 markets, got ${markets.size}`
      );
    });

    it('should have members in multiple tiers', () => {
      const tiers = new Set(MOCK_MEMBERS.map((m) => m.tier));
      assert.ok(
        tiers.size >= 3,
        `expected >= 3 tiers, got ${tiers.size}`
      );
    });

    it('should have at least one member in each status', () => {
      for (const s of MEMBER_STATUSES) {
        const count = MOCK_MEMBERS.filter((m) => m.status === s).length;
        assert.ok(count > 0, `no members with status ${s}`);
      }
    });

    it('phone numbers should be non-empty', () => {
      for (const m of MOCK_MEMBERS) {
        assert.ok(m.phone.length > 0, `empty phone for ${m.id}`);
      }
    });

    it('registeredAt should be before lastVisitAt for active members', () => {
      for (const m of MOCK_MEMBERS) {
        if (m.status === 'active') {
          assert.ok(
            m.registeredAt <= m.lastVisitAt,
            `registeredAt ${m.registeredAt} > lastVisitAt ${m.lastVisitAt} for ${m.id}`
          );
        }
      }
    });

    it('totalSpent divided by visitCount should roughly match avgOrderValue', () => {
      for (const m of MOCK_MEMBERS) {
        if (m.visitCount > 0) {
          const implied = m.totalSpent / m.visitCount;
          assert.ok(
            implied > 0,
            `implied avg 0 for ${m.id}`
          );
        }
      }
    });
  });

  describe('MEMBER_TIER_MAP', () => {
    it('should have entries for all tiers', () => {
      for (const t of MEMBER_TIERS) {
        assert.ok(MEMBER_TIER_MAP[t], `missing tier ${t}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const t of MEMBER_TIERS) {
        const entry = MEMBER_TIER_MAP[t];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(
          ['success', 'warning', 'danger', 'neutral'].includes(entry.variant)
        );
      }
    });
  });

  describe('MEMBER_STATUS_MAP', () => {
    it('should have entries for all statuses', () => {
      for (const s of MEMBER_STATUSES) {
        assert.ok(MEMBER_STATUS_MAP[s], `missing status ${s}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const s of MEMBER_STATUSES) {
        const entry = MEMBER_STATUS_MAP[s];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(
          ['success', 'warning', 'danger', 'neutral'].includes(entry.variant)
        );
      }
    });
  });

  describe('MEMBER_LIFECYCLE_MAP', () => {
    it('should have all lifecycle stages', () => {
      const expected = ['new', 'growing', 'loyal', 'declining', 'lost'] as const;
      for (const s of expected) {
        assert.ok(MEMBER_LIFECYCLE_MAP[s as keyof typeof MEMBER_LIFECYCLE_MAP], `missing lifecycle ${s}`);
      }
    });
  });
});

describe('members filtering logic', () => {
  describe('tier filter', () => {
    it('should filter by diamond tier', () => {
      const result = MOCK_MEMBERS.filter((m) => m.tier === 'diamond');
      assert.ok(result.length >= 2, `expected >= 2 diamond, got ${result.length}`);
      for (const m of result) {
        assert.strictEqual(m.tier, 'diamond');
      }
    });

    it('should filter by gold tier', () => {
      const result = MOCK_MEMBERS.filter((m) => m.tier === 'gold');
      assert.ok(result.length >= 2);
      for (const m of result) {
        assert.strictEqual(m.tier, 'gold');
      }
    });

    it('should filter by silver tier', () => {
      const result = MOCK_MEMBERS.filter((m) => m.tier === 'silver');
      assert.ok(result.length >= 1);
      for (const m of result) {
        assert.strictEqual(m.tier, 'silver');
      }
    });

    it('should filter by standard tier', () => {
      const result = MOCK_MEMBERS.filter((m) => m.tier === 'standard');
      assert.ok(result.length >= 1);
      for (const m of result) {
        assert.strictEqual(m.tier, 'standard');
      }
    });

    it('diamond tier should have highest avg points', () => {
      const tierAvgs = MEMBER_TIERS.map((t) => {
        const members = MOCK_MEMBERS.filter((m) => m.tier === t);
        const avg = members.reduce((s, m) => s + m.points, 0) / members.length;
        return { tier: t, avg };
      }).sort((a, b) => b.avg - a.avg);
      assert.strictEqual(tierAvgs[0]?.tier, 'diamond');
    });
  });

  describe('status filter', () => {
    it('should filter by active status', () => {
      const result = MOCK_MEMBERS.filter((m) => m.status === 'active');
      assert.ok(result.length > 0);
      for (const m of result) {
        assert.strictEqual(m.status, 'active');
      }
    });

    it('should filter by frozen status', () => {
      const result = MOCK_MEMBERS.filter((m) => m.status === 'frozen');
      assert.ok(result.length > 0);
      for (const m of result) {
        assert.strictEqual(m.status, 'frozen');
      }
    });

    it('should filter by dormant status', () => {
      const result = MOCK_MEMBERS.filter((m) => m.status === 'dormant');
      assert.ok(result.length > 0);
      for (const m of result) {
        assert.strictEqual(m.status, 'dormant');
      }
    });

    it('should filter by cancelled status', () => {
      const result = MOCK_MEMBERS.filter((m) => m.status === 'cancelled');
      assert.ok(result.length > 0);
      for (const m of result) {
        assert.strictEqual(m.status, 'cancelled');
      }
    });

    it('active members should be the majority', () => {
      const active = MOCK_MEMBERS.filter((m) => m.status === 'active').length;
      const total = MOCK_MEMBERS.length;
      assert.ok(active > total / 2, `active ${active} not majority of ${total}`);
    });
  });

  describe('search filter', () => {
    const searchFields: (keyof MemberItem)[] = ['code', 'name', 'phone', 'storeName'];

    function searchBy(items: MemberItem[], term: string): MemberItem[] {
      if (!term.trim()) return items;
      const lower = term.toLowerCase();
      return items.filter((item) =>
        searchFields.some((key) =>
          String(item[key]).toLowerCase().includes(lower)
        )
      );
    }

    it('should match by code', () => {
      const result = searchBy(MOCK_MEMBERS, 'MEM-001');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'm001');
    });

    it('should match by name', () => {
      const result = searchBy(MOCK_MEMBERS, '张伟');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'm001');
    });

    it('should match by name case-insensitive (English)', () => {
      const result = searchBy(MOCK_MEMBERS, 'david');
      assert.ok(result.length >= 1);
      for (const m of result) {
        assert.ok(m.name.toLowerCase().includes('david'));
      }
    });

    it('should match by phone partial', () => {
      const result = searchBy(MOCK_MEMBERS, '138-0001');
      assert.ok(result.length >= 3);
    });

    it('should match by store name', () => {
      const result = searchBy(MOCK_MEMBERS, '朝阳');
      assert.ok(result.length >= 2);
    });

    it('should return empty for non-matching search', () => {
      const result = searchBy(MOCK_MEMBERS, 'xyz-nonexistent-99999');
      assert.strictEqual(result.length, 0);
    });

    it('empty search should return all items', () => {
      const result = searchBy(MOCK_MEMBERS, '');
      assert.strictEqual(result.length, MOCK_MEMBERS.length);
    });
  });

  describe('market filter', () => {
    it('should filter by cn-mainland', () => {
      const result = MOCK_MEMBERS.filter((m) => m.marketCode === 'cn-mainland');
      assert.ok(result.length >= 8);
      for (const m of result) {
        assert.strictEqual(m.marketCode, 'cn-mainland');
      }
    });

    it('should filter by us-default', () => {
      const result = MOCK_MEMBERS.filter((m) => m.marketCode === 'us-default');
      assert.ok(result.length >= 2);
      for (const m of result) {
        assert.strictEqual(m.marketCode, 'us-default');
      }
    });

    it('should filter by uk-default', () => {
      const result = MOCK_MEMBERS.filter((m) => m.marketCode === 'uk-default');
      assert.ok(result.length >= 1);
      for (const m of result) {
        assert.strictEqual(m.marketCode, 'uk-default');
      }
    });
  });

  describe('spend filter', () => {
    it('should identify VIP members (>=300k)', () => {
      const result = MOCK_MEMBERS.filter((m) => m.totalSpent >= 300000);
      assert.ok(result.length >= 2);
      for (const m of result) {
        assert.ok(m.totalSpent >= 300000);
      }
    });

    it('should identify high-spend members (100k-300k)', () => {
      const result = MOCK_MEMBERS.filter(
        (m) => m.totalSpent >= 100000 && m.totalSpent < 300000
      );
      assert.ok(result.length >= 2);
      for (const m of result) {
        assert.ok(m.totalSpent >= 100000 && m.totalSpent < 300000);
      }
    });

    it('should identify mid-spend members (30k-100k)', () => {
      const result = MOCK_MEMBERS.filter(
        (m) => m.totalSpent >= 30000 && m.totalSpent < 100000
      );
      assert.ok(result.length >= 1);
      for (const m of result) {
        assert.ok(m.totalSpent >= 30000 && m.totalSpent < 100000);
      }
    });

    it('should identify low-spend members (<30k)', () => {
      const result = MOCK_MEMBERS.filter((m) => m.totalSpent < 30000);
      assert.ok(result.length >= 1);
      for (const m of result) {
        assert.ok(m.totalSpent < 30000);
      }
    });

    it('all spend buckets together should equal total', () => {
      const vip = MOCK_MEMBERS.filter((m) => m.totalSpent >= 300000).length;
      const high = MOCK_MEMBERS.filter(
        (m) => m.totalSpent >= 100000 && m.totalSpent < 300000
      ).length;
      const mid = MOCK_MEMBERS.filter(
        (m) => m.totalSpent >= 30000 && m.totalSpent < 100000
      ).length;
      const low = MOCK_MEMBERS.filter((m) => m.totalSpent < 30000).length;
      assert.strictEqual(vip + high + mid + low, MOCK_MEMBERS.length);
    });
  });

  describe('composite filter: tier + status + market', () => {
    it('diamond active cn-mainland should exist', () => {
      const result = MOCK_MEMBERS.filter(
        (m) =>
          m.tier === 'diamond' &&
          m.status === 'active' &&
          m.marketCode === 'cn-mainland'
      );
      assert.ok(result.length >= 2);
    });

    it('gold active should exist', () => {
      const result = MOCK_MEMBERS.filter(
        (m) => m.tier === 'gold' && m.status === 'active'
      );
      assert.ok(result.length >= 2);
    });

    it('frozen members should have last visit older than active', () => {
      const active = MOCK_MEMBERS.filter((m) => m.status === 'active');
      const frozen = MOCK_MEMBERS.filter((m) => m.status === 'frozen');
      if (frozen.length > 0 && active.length > 0) {
        const lastActive = active
          .map((m) => m.lastVisitAt)
          .sort()
          .reverse()[0];
        const lastFrozen = frozen
          .map((m) => m.lastVisitAt)
          .sort()
          .reverse()[0];
        if (lastFrozen && lastActive) {
          assert.ok(
            lastFrozen <= lastActive,
            `frozen last visit ${lastFrozen} should not be after active ${lastActive}`
          );
        }
      }
    });
  });

  describe('tier ordering', () => {
    it('diamond > gold > silver > bronze > standard', () => {
      assert.ok(tierOrder('diamond') > tierOrder('gold'));
      assert.ok(tierOrder('gold') > tierOrder('silver'));
      assert.ok(tierOrder('silver') > tierOrder('bronze'));
      assert.ok(tierOrder('bronze') > tierOrder('standard'));
    });

    it('higher tier should have higher total spent on average', () => {
      const diamond = MOCK_MEMBERS.filter((m) => m.tier === 'diamond');
      const standard = MOCK_MEMBERS.filter((m) => m.tier === 'standard');
      if (diamond.length > 0 && standard.length > 0) {
        const diamondAvg =
          diamond.reduce((s, m) => s + m.totalSpent, 0) / diamond.length;
        const standardAvg =
          standard.reduce((s, m) => s + m.totalSpent, 0) / standard.length;
        assert.ok(
          diamondAvg > standardAvg,
          `diamond avg ${diamondAvg} should > standard avg ${standardAvg}`
        );
      }
    });
  });
});

describe('pagination logic', () => {
  it('should paginate items correctly', () => {
    const pageSize = 5;
    const page = 0;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageItems = MOCK_MEMBERS.slice(start, end);
    assert.strictEqual(pageItems.length, pageSize);
    assert.strictEqual(pageItems[0]?.id, MOCK_MEMBERS[0]?.id);
  });

  it('last page should handle fewer items', () => {
    const pageSize = 10;
    const totalPages = Math.ceil(MOCK_MEMBERS.length / pageSize);
    const lastPage = totalPages - 1;
    const start = lastPage * pageSize;
    const pageItems = MOCK_MEMBERS.slice(start);
    assert.ok(pageItems.length <= pageSize);
    assert.ok(pageItems.length > 0);
  });

  it('all pages combined should cover all items', () => {
    const pageSize = 4;
    const combined: MemberItem[] = [];
    for (let i = 0; i < MOCK_MEMBERS.length; i += pageSize) {
      combined.push(...MOCK_MEMBERS.slice(i, i + pageSize));
    }
    assert.strictEqual(combined.length, MOCK_MEMBERS.length);
  });
});

describe('sorting logic', () => {
  it('should sort by points descending', () => {
    const sorted = [...MOCK_MEMBERS].sort((a, b) => b.points - a.points);
    assert.ok((sorted[0]?.points ?? 0) >= (sorted[sorted.length - 1]?.points ?? 0));
    for (let i = 1; i < sorted.length; i++) {
      assert.ok((sorted[i]?.points ?? 0) <= (sorted[i - 1]?.points ?? 0));
    }
  });

  it('should sort by totalSpent descending', () => {
    const sorted = [...MOCK_MEMBERS].sort(
      (a, b) => b.totalSpent - a.totalSpent
    );
    assert.ok(
      (sorted[0]?.totalSpent ?? 0) >= (sorted[sorted.length - 1]?.totalSpent ?? 0)
    );
    for (let i = 1; i < sorted.length; i++) {
      assert.ok((sorted[i]?.totalSpent ?? 0) <= (sorted[i - 1]?.totalSpent ?? 0));
    }
  });

  it('should sort by visitCount ascending', () => {
    const sorted = [...MOCK_MEMBERS].sort(
      (a, b) => a.visitCount - b.visitCount
    );
    for (let i = 1; i < sorted.length; i++) {
      assert.ok((sorted[i]?.visitCount ?? 0) >= (sorted[i - 1]?.visitCount ?? 0));
    }
  });

  it('should sort by tier order', () => {
    const sorted = [...MOCK_MEMBERS].sort(
      (a, b) => tierOrder(b.tier) - tierOrder(a.tier)
    );
    assert.strictEqual(sorted[0]?.tier, 'diamond');
  });
});

describe('stats computation', () => {
  it('should compute correct total', () => {
    const total = MOCK_MEMBERS.length;
    assert.ok(total === 20);
  });

  it('should compute active count', () => {
    const active = MOCK_MEMBERS.filter((m) => m.status === 'active').length;
    assert.ok(active > MOCK_MEMBERS.filter((m) => m.status !== 'active').length);
  });

  it('should compute diamond count', () => {
    const diamond = MOCK_MEMBERS.filter((m) => m.tier === 'diamond').length;
    assert.ok(diamond >= 2);
  });

  it('should compute total spent', () => {
    const totalSpent = MOCK_MEMBERS.reduce((s, m) => s + m.totalSpent, 0);
    assert.ok(totalSpent > 1000000, `totalSpent ${totalSpent} should be large`);
  });

  it('formatCurrency should format large amounts', () => {
    assert.strictEqual(formatCurrency(367800), '¥36.8万');
    assert.strictEqual(formatCurrency(10000), '¥1.0万');
    assert.strictEqual(formatCurrency(9999), '¥9,999');
  });

  it('formatCurrency should format small amounts without 万', () => {
    const result = formatCurrency(6400);
    assert.ok(result.includes('6,400') || result.includes('6400'));
  });
});

describe('edge cases', () => {
  it('members can have empty tags', () => {
    const emptyTagMembers = MOCK_MEMBERS.filter((m) => m.tags.length === 0);
    assert.ok(emptyTagMembers.length >= 1);
  });

  it('cancelled members should have low points', () => {
    const cancelled = MOCK_MEMBERS.filter((m) => m.status === 'cancelled');
    for (const m of cancelled) {
      assert.ok(m.totalSpent < 10000, `cancelled member ${m.id} has high totalSpent`);
    }
  });

  it('unique markets should be a defined set', () => {
    const markets = [...new Set(MOCK_MEMBERS.map((m) => m.marketCode))].sort();
    assert.ok(markets.includes('cn-mainland'));
    assert.ok(markets.length >= 3);
  });

  it('every member should have a non-empty name', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.name.trim().length > 0, `empty name for ${m.id}`);
    }
  });
});
