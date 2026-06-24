/**
 * members-detail.test.ts — Unit tests for member detail page pure functions
 *
 * Tests cover: validateForm, tierUpgradeMap, tierDowngradeMap, apiLevelSequence,
 * toTierFromApiLevel, memberTierToApiLevel, toStatusFromApiStatus, lifecycleColor,
 * formatCurrency, truncateMiddle, formatBackoff, tierOrder, pointsColor, levelLabel
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_LIFECYCLE_MAP,
  MEMBER_TIERS,
  MEMBER_STATUSES,
  MOCK_MEMBERS,
  MOCK_MEMBER_DETAILS,
  type MemberTier,
  type MemberStatus,
} from '../app/members-data';

// ---- Replicated pure functions from members/[id]/page.tsx ----

function validateForm(data: { name: string; phone: string; email: string; address: string; notes: string }) {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = '姓名不能为空';
  if (!data.phone.trim()) errors.phone = '电话不能为空';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

const tierUpgradeMap: Record<MemberTier, MemberTier | null> = {
  diamond: null,
  gold: 'diamond',
  silver: 'gold',
  bronze: 'silver',
  standard: 'bronze',
};

const tierDowngradeMap: Record<MemberTier, MemberTier | null> = {
  diamond: 'gold',
  gold: 'silver',
  silver: 'bronze',
  bronze: 'standard',
  standard: null,
};

type ApiLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

const apiLevelSequence: ApiLevel[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

function getNextApiLevel(level: ApiLevel | undefined): ApiLevel | null {
  const currentIndex = level ? apiLevelSequence.indexOf(level) : -1;
  if (currentIndex === -1 || currentIndex >= apiLevelSequence.length - 1) return null;
  return apiLevelSequence[currentIndex + 1] ?? null;
}

function getPreviousApiLevel(level: ApiLevel | undefined): ApiLevel | null {
  const currentIndex = level ? apiLevelSequence.indexOf(level) : -1;
  if (currentIndex <= 0) return null;
  return apiLevelSequence[currentIndex - 1] ?? null;
}

function toTierFromApiLevel(level: ApiLevel | undefined): MemberTier {
  switch (level) {
    case 'DIAMOND': return 'diamond';
    case 'PLATINUM':
    case 'GOLD': return 'gold';
    case 'SILVER': return 'silver';
    case 'BRONZE':
    default: return 'bronze';
  }
}

function memberTierToApiLevel(tier: MemberTier): ApiLevel {
  switch (tier) {
    case 'diamond': return 'DIAMOND';
    case 'gold': return 'GOLD';
    case 'silver': return 'SILVER';
    case 'bronze':
    case 'standard':
    default: return 'BRONZE';
  }
}

function toStatusFromApiStatus(status: 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'BLACKLISTED' | undefined): MemberStatus {
  switch (status) {
    case 'ACTIVE': return 'active';
    case 'FROZEN': return 'frozen';
    case 'EXPIRED': return 'dormant';
    case 'BLACKLISTED': return 'cancelled';
    default: return 'active';
  }
}

function lifecycleColor(stage: string): string {
  const map: Record<string, string> = {
    new: '#fbbf24',
    growing: '#4ade80',
    loyal: '#818cf8',
    declining: '#fb923c',
    lost: '#f87171',
  };
  return map[stage] ?? '#94a3b8';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function truncateMiddle(value: string, edge = 10): string {
  if (value.length <= edge * 2 + 3) return value;
  return `${value.slice(0, edge)}...${value.slice(-edge)}`;
}

function formatBackoff(ms: number): string {
  if (ms >= 60_000) return `${Math.round(ms / 60_000)}m`;
  if (ms >= 1_000) return `${Math.round(ms / 1_000)}s`;
  return `${ms}ms`;
}

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

function pointsColor(points: number): string {
  if (points >= 150000) return '#f0abfc';
  if (points >= 80000) return '#fbbf24';
  if (points >= 30000) return '#94a3b8';
  return '#cbd5e1';
}

function levelLabel(level: ApiLevel | null): string {
  switch (level) {
    case 'DIAMOND': return '钻石卡';
    case 'PLATINUM': return '铂金卡';
    case 'GOLD': return '金卡';
    case 'SILVER': return '银卡';
    case 'BRONZE': return '铜卡';
    default: return '—';
  }
}

// ---- Tests ----

describe('validateForm', () => {
  it('should accept valid form data', () => {
    const errors = validateForm({
      name: '张三',
      phone: '13800000001',
      email: 'test@example.com',
      address: '北京',
      notes: '',
    });
    assert.deepStrictEqual(errors, {});
  });

  it('should accept form without email', () => {
    const errors = validateForm({
      name: '李四',
      phone: '13800000002',
      email: '',
      address: '',
      notes: '',
    });
    assert.deepStrictEqual(errors, {});
  });

  it('should reject empty name', () => {
    const errors = validateForm({
      name: '   ',
      phone: '13800000003',
      email: '',
      address: '',
      notes: '',
    });
    assert.strictEqual(errors.name, '姓名不能为空');
  });

  it('should reject empty phone', () => {
    const errors = validateForm({
      name: '王五',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    assert.strictEqual(errors.phone, '电话不能为空');
  });

  it('should reject invalid email', () => {
    const errors = validateForm({
      name: '赵六',
      phone: '13800000004',
      email: 'not-an-email',
      address: '',
      notes: '',
    });
    assert.strictEqual(errors.email, '邮箱格式不正确');
  });

  it('should accept email with subdomain', () => {
    const errors = validateForm({
      name: '孙七',
      phone: '13800000005',
      email: 'user@mail.example.com',
      address: '',
      notes: '',
    });
    assert.deepStrictEqual(errors, {});
  });

  it('should return multiple errors at once', () => {
    const errors = validateForm({
      name: '',
      phone: '',
      email: 'bad@@email',
      address: '',
      notes: '',
    });
    assert.strictEqual(errors.name, '姓名不能为空');
    assert.strictEqual(errors.phone, '电话不能为空');
    assert.strictEqual(errors.email, '邮箱格式不正确');
  });
});

describe('tierUpgradeMap', () => {
  it('diamond should have no upgrade', () => {
    assert.strictEqual(tierUpgradeMap.diamond, null);
  });

  it('gold should upgrade to diamond', () => {
    assert.strictEqual(tierUpgradeMap.gold, 'diamond');
  });

  it('silver should upgrade to gold', () => {
    assert.strictEqual(tierUpgradeMap.silver, 'gold');
  });

  it('bronze should upgrade to silver', () => {
    assert.strictEqual(tierUpgradeMap.bronze, 'silver');
  });

  it('standard should upgrade to bronze', () => {
    assert.strictEqual(tierUpgradeMap.standard, 'bronze');
  });
});

describe('tierDowngradeMap', () => {
  it('diamond should downgrade to gold', () => {
    assert.strictEqual(tierDowngradeMap.diamond, 'gold');
  });

  it('gold should downgrade to silver', () => {
    assert.strictEqual(tierDowngradeMap.gold, 'silver');
  });

  it('silver should downgrade to bronze', () => {
    assert.strictEqual(tierDowngradeMap.silver, 'bronze');
  });

  it('bronze should downgrade to standard', () => {
    assert.strictEqual(tierDowngradeMap.bronze, 'standard');
  });

  it('standard should have no downgrade', () => {
    assert.strictEqual(tierDowngradeMap.standard, null);
  });
});

describe('getNextApiLevel', () => {
  it('BRONZE -> SILVER', () => {
    assert.strictEqual(getNextApiLevel('BRONZE'), 'SILVER');
  });

  it('SILVER -> GOLD', () => {
    assert.strictEqual(getNextApiLevel('SILVER'), 'GOLD');
  });

  it('GOLD -> PLATINUM', () => {
    assert.strictEqual(getNextApiLevel('GOLD'), 'PLATINUM');
  });

  it('PLATINUM -> DIAMOND', () => {
    assert.strictEqual(getNextApiLevel('PLATINUM'), 'DIAMOND');
  });

  it('DIAMOND -> null', () => {
    assert.strictEqual(getNextApiLevel('DIAMOND'), null);
  });

  it('undefined -> null', () => {
    assert.strictEqual(getNextApiLevel(undefined), null);
  });
});

describe('getPreviousApiLevel', () => {
  it('DIAMOND -> PLATINUM', () => {
    assert.strictEqual(getPreviousApiLevel('DIAMOND'), 'PLATINUM');
  });

  it('PLATINUM -> GOLD', () => {
    assert.strictEqual(getPreviousApiLevel('PLATINUM'), 'GOLD');
  });

  it('GOLD -> SILVER', () => {
    assert.strictEqual(getPreviousApiLevel('GOLD'), 'SILVER');
  });

  it('SILVER -> BRONZE', () => {
    assert.strictEqual(getPreviousApiLevel('SILVER'), 'BRONZE');
  });

  it('BRONZE -> null', () => {
    assert.strictEqual(getPreviousApiLevel('BRONZE'), null);
  });

  it('undefined -> null', () => {
    assert.strictEqual(getPreviousApiLevel(undefined), null);
  });
});

describe('toTierFromApiLevel', () => {
  it('DIAMOND -> diamond', () => {
    assert.strictEqual(toTierFromApiLevel('DIAMOND'), 'diamond');
  });

  it('PLATINUM -> gold', () => {
    assert.strictEqual(toTierFromApiLevel('PLATINUM'), 'gold');
  });

  it('GOLD -> gold', () => {
    assert.strictEqual(toTierFromApiLevel('GOLD'), 'gold');
  });

  it('SILVER -> silver', () => {
    assert.strictEqual(toTierFromApiLevel('SILVER'), 'silver');
  });

  it('BRONZE -> bronze', () => {
    assert.strictEqual(toTierFromApiLevel('BRONZE'), 'bronze');
  });

  it('undefined -> bronze', () => {
    assert.strictEqual(toTierFromApiLevel(undefined), 'bronze');
  });
});

describe('memberTierToApiLevel', () => {
  it('diamond -> DIAMOND', () => {
    assert.strictEqual(memberTierToApiLevel('diamond'), 'DIAMOND');
  });

  it('gold -> GOLD', () => {
    assert.strictEqual(memberTierToApiLevel('gold'), 'GOLD');
  });

  it('silver -> SILVER', () => {
    assert.strictEqual(memberTierToApiLevel('silver'), 'SILVER');
  });

  it('bronze -> BRONZE', () => {
    assert.strictEqual(memberTierToApiLevel('bronze'), 'BRONZE');
  });

  it('standard -> BRONZE', () => {
    assert.strictEqual(memberTierToApiLevel('standard'), 'BRONZE');
  });
});

describe('toStatusFromApiStatus', () => {
  it('ACTIVE -> active', () => {
    assert.strictEqual(toStatusFromApiStatus('ACTIVE'), 'active');
  });

  it('FROZEN -> frozen', () => {
    assert.strictEqual(toStatusFromApiStatus('FROZEN'), 'frozen');
  });

  it('EXPIRED -> dormant', () => {
    assert.strictEqual(toStatusFromApiStatus('EXPIRED'), 'dormant');
  });

  it('BLACKLISTED -> cancelled', () => {
    assert.strictEqual(toStatusFromApiStatus('BLACKLISTED'), 'cancelled');
  });

  it('undefined -> active', () => {
    assert.strictEqual(toStatusFromApiStatus(undefined), 'active');
  });
});

describe('lifecycleColor', () => {
  it('new -> amber', () => {
    assert.strictEqual(lifecycleColor('new'), '#fbbf24');
  });

  it('growing -> green', () => {
    assert.strictEqual(lifecycleColor('growing'), '#4ade80');
  });

  it('loyal -> indigo', () => {
    assert.strictEqual(lifecycleColor('loyal'), '#818cf8');
  });

  it('declining -> orange', () => {
    assert.strictEqual(lifecycleColor('declining'), '#fb923c');
  });

  it('lost -> red', () => {
    assert.strictEqual(lifecycleColor('lost'), '#f87171');
  });

  it('unknown -> fallback gray', () => {
    assert.strictEqual(lifecycleColor('nonexistent'), '#94a3b8');
  });
});

describe('formatCurrency', () => {
  it('should format amounts >= 10000 as 万', () => {
    assert.strictEqual(formatCurrency(367800), '¥36.8万');
  });

  it('should format exactly 10000', () => {
    assert.strictEqual(formatCurrency(10000), '¥1.0万');
  });

  it('should format amounts below 10000 with commas', () => {
    const result = formatCurrency(6400);
    assert.ok(result.startsWith('¥'));
    assert.ok(result.includes(','));
  });

  it('should format zero', () => {
    assert.strictEqual(formatCurrency(0), '¥0');
  });
});

describe('truncateMiddle', () => {
  it('should not truncate short strings', () => {
    assert.strictEqual(truncateMiddle('abc'), 'abc');
  });

  it('should not truncate exactly at edge*2+3', () => {
    const value = '12345678901234567890123'; // 23 chars, edge=10 => 20+3=23
    assert.strictEqual(truncateMiddle(value), value);
  });

  it('should truncate long strings', () => {
    const result = truncateMiddle('1234567890abcdefghij1234567890');
    assert.ok(result.includes('...'));
    assert.ok(result.startsWith('1234567890'));
    assert.ok(result.endsWith('1234567890'));
  });

  it('should use custom edge', () => {
    const result = truncateMiddle('abcdefghijklmnopqrstuvwxyz', 3);
    assert.ok(result.includes('...'));
    assert.ok(result.startsWith('abc'));
    assert.ok(result.endsWith('xyz'));
  });
});

describe('formatBackoff', () => {
  it('should format minutes', () => {
    assert.strictEqual(formatBackoff(120_000), '2m');
  });

  it('should format seconds', () => {
    assert.strictEqual(formatBackoff(5_000), '5s');
  });

  it('should format milliseconds', () => {
    assert.strictEqual(formatBackoff(500), '500ms');
  });

  it('should round minutes', () => {
    assert.strictEqual(formatBackoff(90_000), '2m');
  });
});

describe('tierOrder', () => {
  it('diamond should be highest', () => {
    assert.ok(tierOrder('diamond') > tierOrder('gold'));
  });

  it('gold > silver', () => {
    assert.ok(tierOrder('gold') > tierOrder('silver'));
  });

  it('silver > bronze', () => {
    assert.ok(tierOrder('silver') > tierOrder('bronze'));
  });

  it('bronze > standard', () => {
    assert.ok(tierOrder('bronze') > tierOrder('standard'));
  });

  it('values should be unique', () => {
    const orders = MEMBER_TIERS.map(tierOrder);
    assert.strictEqual(new Set(orders).size, orders.length);
  });
});

describe('pointsColor', () => {
  it('>= 150000 should be purple', () => {
    assert.strictEqual(pointsColor(150000), '#f0abfc');
  });

  it('>= 80000 should be amber', () => {
    assert.strictEqual(pointsColor(80000), '#fbbf24');
  });

  it('>= 30000 should be slate', () => {
    assert.strictEqual(pointsColor(30000), '#94a3b8');
  });

  it('< 30000 should be light slate', () => {
    assert.strictEqual(pointsColor(0), '#cbd5e1');
  });
});

describe('levelLabel', () => {
  it('DIAMOND -> 钻石卡', () => {
    assert.strictEqual(levelLabel('DIAMOND'), '钻石卡');
  });

  it('PLATINUM -> 铂金卡', () => {
    assert.strictEqual(levelLabel('PLATINUM'), '铂金卡');
  });

  it('GOLD -> 金卡', () => {
    assert.strictEqual(levelLabel('GOLD'), '金卡');
  });

  it('SILVER -> 银卡', () => {
    assert.strictEqual(levelLabel('SILVER'), '银卡');
  });

  it('BRONZE -> 铜卡', () => {
    assert.strictEqual(levelLabel('BRONZE'), '铜卡');
  });

  it('null -> —', () => {
    assert.strictEqual(levelLabel(null), '—');
  });
});

describe('MEMBER_TIER_MAP', () => {
  it('every tier should have a label and variant', () => {
    for (const tier of MEMBER_TIERS) {
      const info = MEMBER_TIER_MAP[tier];
      assert.ok(info, `missing tier info for ${tier}`);
      assert.ok(info.label.length > 0, `missing label for ${tier}`);
      assert.ok(['success', 'warning', 'neutral', 'danger'].includes(info.variant), `invalid variant for ${tier}`);
    }
  });
});

describe('MEMBER_STATUS_MAP', () => {
  it('every status should have a label and variant', () => {
    for (const status of MEMBER_STATUSES) {
      const info = MEMBER_STATUS_MAP[status];
      assert.ok(info, `missing status info for ${status}`);
      assert.ok(info.label.length > 0, `missing label for ${status}`);
      assert.ok(['success', 'warning', 'neutral', 'danger'].includes(info.variant), `invalid variant for ${status}`);
    }
  });
});

describe('MEMBER_LIFECYCLE_MAP', () => {
  const stages = ['new', 'growing', 'loyal', 'declining', 'lost'] as const;
  it('every lifecycle stage should have a label and variant', () => {
    for (const stage of stages) {
      const info = MEMBER_LIFECYCLE_MAP[stage];
      assert.ok(info, `missing lifecycle info for ${stage}`);
      assert.ok(info.label.length > 0, `missing label for ${stage}`);
    }
  });
});

describe('MOCK_MEMBERS', () => {
  it('should contain at least 15 members', () => {
    assert.ok(MOCK_MEMBERS.length >= 15, `expected >= 15, got ${MOCK_MEMBERS.length}`);
  });

  it('every member should have a unique id', () => {
    const ids = MOCK_MEMBERS.map((m) => m.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('every member should have a valid tier', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(MEMBER_TIERS.includes(m.tier), `invalid tier ${m.tier} for ${m.id}`);
    }
  });

  it('every member should have a valid status', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(MEMBER_STATUSES.includes(m.status), `invalid status ${m.status} for ${m.id}`);
    }
  });

  it('points should be non-negative', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.points >= 0, `negative points for ${m.id}`);
    }
  });

  it('totalSpent should be non-negative', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.totalSpent >= 0, `negative totalSpent for ${m.id}`);
    }
  });

  it('visitCount should be non-negative', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.visitCount >= 0, `negative visitCount for ${m.id}`);
    }
  });
});

describe('MOCK_MEMBER_DETAILS', () => {
  it('should have at least 5 details', () => {
    const keys = Object.keys(MOCK_MEMBER_DETAILS);
    assert.ok(keys.length >= 5, `expected >= 5, got ${keys.length}`);
  });

  it('every detail should have a valid lifecycle stage', () => {
    const validStages = ['new', 'growing', 'loyal', 'declining', 'lost'];
    for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
      assert.ok(validStages.includes(detail.lifecycleStage), `invalid lifecycleStage ${detail.lifecycleStage} for ${id}`);
    }
  });

  it('every detail should match its corresponding member data', () => {
    for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
      const member = MOCK_MEMBERS.find((m) => m.id === id);
      if (member) {
        assert.strictEqual(detail.code, member.code);
        assert.strictEqual(detail.name, member.name);
        assert.strictEqual(detail.tier, member.tier);
        assert.strictEqual(detail.status, member.status);
        assert.strictEqual(detail.points, member.points);
        assert.strictEqual(detail.totalSpent, member.totalSpent);
        assert.strictEqual(detail.storeName, member.storeName);
        assert.strictEqual(detail.marketCode, member.marketCode);
      }
    }
  });

  it('loyal members should have lifecycleStage loyal', () => {
    const loyalIds = ['m001', 'm002', 'm004', 'm006', 'm010'];
    for (const id of loyalIds) {
      const detail = MOCK_MEMBER_DETAILS[id];
      if (detail) {
        assert.strictEqual(detail.lifecycleStage, 'loyal');
      }
    }
  });
});

describe('MemberTier ordinal convergence', () => {
  it('memberTierToApiLevel round-trip with toTierFromApiLevel should hold for gold/silver/bronze/diamond', () => {
    const tiers: MemberTier[] = ['diamond', 'gold', 'silver', 'bronze'];
    for (const tier of tiers) {
      const apiLevel = memberTierToApiLevel(tier);
      const back = toTierFromApiLevel(apiLevel);
      assert.strictEqual(back, tier, `round-trip failed for ${tier}: ${apiLevel} -> ${back}`);
    }
  });

  it('standard maps to BRONZE then back to bronze', () => {
    const apiLevel = memberTierToApiLevel('standard');
    assert.strictEqual(apiLevel, 'BRONZE');
    assert.strictEqual(toTierFromApiLevel(apiLevel), 'bronze');
  });
});
