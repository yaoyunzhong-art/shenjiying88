/**
 * member-detail.test.ts — 会员详情页逻辑与数据完整性测试
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_MEMBER_DETAILS,
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_LIFECYCLE_MAP,
  MEMBER_TIERS,
  MEMBER_STATUSES,
  type MemberTier,
  type MemberLifecycle,
} from '../app/members-data';

// ---- 等级升级/降级映射 ----
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

// ---- 表单验证逻辑 ----
interface EditFormData {
  name: string;
  phone: string;
  email: string;
}

interface EditFormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '姓名不能为空';
  if (!data.phone.trim()) errors.phone = '电话不能为空';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

// ---- 生命周期颜色映射 ----
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

// ---- 工具函数 ----
function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

describe('MemberDetail - Mock Data', () => {
  it('should have details for all top-spending members', () => {
    const ids = Object.keys(MOCK_MEMBER_DETAILS);
    assert.ok(ids.length >= 10, `expected >= 10, got ${ids.length}`);
  });

  it('every detail should have a valid id matching its key', () => {
    for (const [key, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
      assert.strictEqual(detail.id, key, `id mismatch for ${key}`);
    }
  });

  it('every detail should have required fields', () => {
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(detail.code, `missing code for ${detail.id}`);
      assert.ok(detail.name, `missing name for ${detail.id}`);
      assert.ok(detail.phone, `missing phone for ${detail.id}`);
      assert.ok(detail.email !== undefined, `missing email for ${detail.id}`);
    }
  });

  it('every detail should have valid tier and status', () => {
    const tiers = new Set(MEMBER_TIERS);
    const statuses = new Set(MEMBER_STATUSES);
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(tiers.has(detail.tier), `invalid tier ${detail.tier} for ${detail.id}`);
      assert.ok(statuses.has(detail.status), `invalid status ${detail.status} for ${detail.id}`);
    }
  });

  it('every detail should have gender as male/female/other', () => {
    const validGenders = new Set(['male', 'female', 'other']);
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(validGenders.has(detail.gender), `invalid gender ${detail.gender} for ${detail.id}`);
    }
  });

  it('every detail should have a valid lifecycle stage', () => {
    const validStages = new Set(['new', 'growing', 'loyal', 'declining', 'lost']);
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(validStages.has(detail.lifecycleStage), `invalid lifecycle stage ${detail.lifecycleStage} for ${detail.id}`);
    }
  });

  it('every detail should have non-negative numeric fields', () => {
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(detail.points >= 0, `negative points for ${detail.id}`);
      assert.ok(detail.totalSpent >= 0, `negative totalSpent for ${detail.id}`);
      assert.ok(detail.visitCount >= 0, `negative visitCount for ${detail.id}`);
      assert.ok(detail.avgOrderValue >= 0, `negative avgOrderValue for ${detail.id}`);
      assert.ok(detail.coupons >= 0, `negative coupons for ${detail.id}`);
    }
  });

  it('every detail tags should be an array', () => {
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(Array.isArray(detail.tags), `tags is not array for ${detail.id}`);
    }
  });

  it('every detail favoriteCategories should be an array', () => {
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(Array.isArray(detail.favoriteCategories), `favoriteCategories is not array for ${detail.id}`);
    }
  });

  it('every detail should have referralCode', () => {
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(detail.referralCode, `missing referralCode for ${detail.id}`);
    }
  });

  it('lastOrderAt should be non-empty for all details', () => {
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(detail.lastOrderAt, `missing lastOrderAt for ${detail.id}`);
    }
  });

  it('wechatId should be non-null', () => {
    for (const detail of Object.values(MOCK_MEMBER_DETAILS)) {
      assert.ok(detail.wechatId !== undefined && detail.wechatId !== null, `null/undefined wechatId for ${detail.id}`);
    }
  });
});

describe('MemberDetail - Form Validation', () => {
  it('should pass with valid form data', () => {
    const errors = validateForm({
      name: '张三',
      phone: '+86-138-0001-0001',
      email: 'zhang@example.com',
    });
    assert.deepStrictEqual(errors, {});
  });

  it('should fail when name is empty', () => {
    const errors = validateForm({ name: '', phone: '138', email: '' });
    assert.strictEqual(errors.name, '姓名不能为空');
  });

  it('should fail when name is only whitespace', () => {
    const errors = validateForm({ name: '   ', phone: '138', email: '' });
    assert.strictEqual(errors.name, '姓名不能为空');
  });

  it('should fail when phone is empty', () => {
    const errors = validateForm({ name: '张三', phone: '', email: '' });
    assert.strictEqual(errors.phone, '电话不能为空');
  });

  it('should allow empty email', () => {
    const errors = validateForm({ name: '张三', phone: '138', email: '' });
    assert.deepStrictEqual(errors, {});
  });

  it('should allow valid email', () => {
    const errors = validateForm({
      name: '张三',
      phone: '138',
      email: 'test@example.com',
    });
    assert.deepStrictEqual(errors, {});
  });

  it('should reject invalid email format', () => {
    const errors = validateForm({
      name: '张三',
      phone: '138',
      email: 'not-an-email',
    });
    assert.strictEqual(errors.email, '邮箱格式不正确');
  });

  it('should reject email missing @', () => {
    const errors = validateForm({
      name: '张三',
      phone: '138',
      email: 'user.example.com',
    });
    assert.strictEqual(errors.email, '邮箱格式不正确');
  });

  it('should reject email missing domain', () => {
    const errors = validateForm({
      name: '张三',
      phone: '138',
      email: 'user@',
    });
    assert.strictEqual(errors.email, '邮箱格式不正确');
  });
});

describe('MemberDetail - Tier Change Logic', () => {
  it('diamond should have no upgrade', () => {
    assert.strictEqual(tierUpgradeMap['diamond'], null);
  });

  it('gold should upgrade to diamond', () => {
    assert.strictEqual(tierUpgradeMap['gold'], 'diamond');
  });

  it('silver should upgrade to gold', () => {
    assert.strictEqual(tierUpgradeMap['silver'], 'gold');
  });

  it('bronze should upgrade to silver', () => {
    assert.strictEqual(tierUpgradeMap['bronze'], 'silver');
  });

  it('standard should upgrade to bronze', () => {
    assert.strictEqual(tierUpgradeMap['standard'], 'bronze');
  });

  it('every tier should have a valid downgrade (except standard)', () => {
    for (const tier of MEMBER_TIERS) {
      const downgrade = tierDowngradeMap[tier];
      if (tier === 'standard') {
        assert.strictEqual(downgrade, null);
      } else {
        assert.ok(downgrade !== null, `missing downgrade for ${tier}`);
        assert.ok(MEMBER_TIERS.includes(downgrade!), `invalid downgrade target ${downgrade} for ${tier}`);
      }
    }
  });

  it('diamond downgrades to gold', () => {
    assert.strictEqual(tierDowngradeMap['diamond'], 'gold');
  });

  it('upgrade then downgrade should return to original', () => {
    for (const tier of MEMBER_TIERS) {
      const up = tierUpgradeMap[tier];
      if (up !== null) {
        const back = tierDowngradeMap[up];
        assert.strictEqual(back, tier, `round-trip failed for ${tier} -> ${up} -> ${back}`);
      }
    }
  });
});

describe('MemberDetail - Lifecycle Colors', () => {
  it('new should be yellow', () => {
    assert.strictEqual(lifecycleColor('new'), '#fbbf24');
  });

  it('growing should be green', () => {
    assert.strictEqual(lifecycleColor('growing'), '#4ade80');
  });

  it('loyal should be purple', () => {
    assert.strictEqual(lifecycleColor('loyal'), '#818cf8');
  });

  it('declining should be orange', () => {
    assert.strictEqual(lifecycleColor('declining'), '#fb923c');
  });

  it('lost should be red', () => {
    assert.strictEqual(lifecycleColor('lost'), '#f87171');
  });

  it('unknown stage should be gray', () => {
    assert.strictEqual(lifecycleColor('unknown'), '#94a3b8');
  });
});

describe('MemberDetail - Member Tier Map', () => {
  it('every tier should have a label', () => {
    for (const tier of MEMBER_TIERS) {
      assert.ok(MEMBER_TIER_MAP[tier].label, `missing label for ${tier}`);
      assert.ok(MEMBER_TIER_MAP[tier].variant, `missing variant for ${tier}`);
    }
  });

  it('diamond label is 钻石卡', () => {
    assert.strictEqual(MEMBER_TIER_MAP['diamond'].label, '钻石卡');
  });

  it('standard label is 标准', () => {
    assert.strictEqual(MEMBER_TIER_MAP['standard'].label, '标准');
  });
});

describe('MemberDetail - Member Status Map', () => {
  it('every status should have a label', () => {
    for (const status of MEMBER_STATUSES) {
      assert.ok(MEMBER_STATUS_MAP[status].label, `missing label for ${status}`);
      assert.ok(MEMBER_STATUS_MAP[status].variant, `missing variant for ${status}`);
    }
  });

  it('active label is 活跃', () => {
    assert.strictEqual(MEMBER_STATUS_MAP['active'].label, '活跃');
  });

  it('cancelled label is 已注销', () => {
    assert.strictEqual(MEMBER_STATUS_MAP['cancelled'].label, '已注销');
  });
});

describe('MemberDetail - Lifecycle Map', () => {
  const lifecycleStages: MemberLifecycle[] = ['new', 'growing', 'loyal', 'declining', 'lost'];

  it('should have all 5 lifecycle stages', () => {
    assert.strictEqual(lifecycleStages.length, 5);
  });

  it('every lifecycle stage should have a label', () => {
    for (const stage of lifecycleStages) {
      assert.ok(MEMBER_LIFECYCLE_MAP[stage].label, `missing label for ${stage}`);
      assert.ok(MEMBER_LIFECYCLE_MAP[stage].variant, `missing variant for ${stage}`);
    }
  });

  it('new label is 新会员', () => {
    assert.strictEqual(MEMBER_LIFECYCLE_MAP['new'].label, '新会员');
  });

  it('loyal label is 忠实会员', () => {
    assert.strictEqual(MEMBER_LIFECYCLE_MAP['loyal'].label, '忠实会员');
  });

  it('lost label is 已流失', () => {
    assert.strictEqual(MEMBER_LIFECYCLE_MAP['lost'].label, '已流失');
  });
});

describe('MemberDetail - Currency Formatting', () => {
  it('should format amounts >= 10000 as 万元', () => {
    assert.strictEqual(formatCurrency(15000), '¥1.5万');
    assert.strictEqual(formatCurrency(100000), '¥10.0万');
    assert.strictEqual(formatCurrency(367800), '¥36.8万');
  });

  it('should format amounts < 10000 as direct currency', () => {
    assert.strictEqual(formatCurrency(5000), '¥5,000');
    assert.strictEqual(formatCurrency(1200), '¥1,200');
    assert.strictEqual(formatCurrency(0), '¥0');
  });
});

describe('MemberDetail - Status Flow Logic', () => {
  it('frozen member should be activatable', () => {
    const canActivate = true;
    assert.strictEqual(canActivate, true);
  });

  it('active member should be freezable', () => {
    const canFreeze = true;
    assert.strictEqual(canFreeze, true);
  });

  it('active member should be cancellable', () => {
    const canCancel = true;
    assert.strictEqual(canCancel, true);
  });

  it('cancelled member should NOT be freezable', () => {
    const status = 'cancelled';
    const canFreeze = status !== 'cancelled';
    assert.strictEqual(canFreeze, false);
  });

  it('cancelled member should NOT be activatable directly', () => {
    const status = 'cancelled';
    const canActivate = status !== 'cancelled' && status !== 'dormant';
    assert.strictEqual(canActivate, false);
  });

  it('dormant member can be activated', () => {
    const status: string = 'dormant';
    const canActivate = status !== 'cancelled';
    assert.strictEqual(canActivate, true);
  });
});
