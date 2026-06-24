/**
 * TOB member detail page unit tests
 *
 * Tests data-level functions that don't require React rendering
 * and validates the mock data used by the detail page.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_MEMBERS, MEMBER_TIERS, MEMBER_STATUSES, MEMBER_TIER_MAP, MEMBER_STATUS_MAP } from '../../members-data';
import type { MemberStatus } from '../../members-data';

// ── 工具函数（与 page.tsx 中保持一致） ──

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

const NEXT_STATUS: Partial<Record<MemberStatus, MemberStatus>> = {
  active: 'inactive',
  inactive: 'active',
  suspended: 'churned',
  churned: 'active',
};

const STATUS_ACTION_LABELS: Partial<Record<MemberStatus, string>> = {
  active: '静默标记',
  inactive: '重新激活',
  suspended: '标记流失',
  churned: '恢复激活',
};

// ── 测试 ──

describe('tob-web /members/[id] — mock data', () => {
  it('MOCK_MEMBERS should contain 60 items', () => {
    assert.equal(MOCK_MEMBERS.length, 60);
  });

  it('each member should have required fields', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.id, `member ${m.name} missing id`);
      assert.ok(m.code, `member ${m.name} missing code`);
      assert.ok(m.name, `member ${m.name} missing name`);
      assert.ok(m.phone, `member ${m.name} missing phone`);
      assert.ok(m.marketCode, `member ${m.name} missing marketCode`);
      assert.ok(m.storeName, `member ${m.name} missing storeName`);
      assert.ok(m.salesperson, `member ${m.name} missing salesperson`);
      assert.ok(MEMBER_TIERS.includes(m.tier), `member ${m.name} has invalid tier ${m.tier}`);
      assert.ok(MEMBER_STATUSES.includes(m.status), `member ${m.name} has invalid status ${m.status}`);
    }
  });

  it('each members data should have unique ids', () => {
    const ids = MOCK_MEMBERS.map((m) => m.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('MEMBER_TIER_MAP should cover all tiers', () => {
    for (const tier of MEMBER_TIERS) {
      assert.ok(MEMBER_TIER_MAP[tier], `missing tier map entry for ${tier}`);
    }
  });

  it('MEMBER_STATUS_MAP should cover all statuses', () => {
    for (const status of MEMBER_STATUSES) {
      assert.ok(MEMBER_STATUS_MAP[status], `missing status map entry for ${status}`);
    }
  });
});

describe('tob-web /members/[id] — formatCurrency', () => {
  it('formats small amounts with commas', () => {
    const result = formatCurrency(1280);
    assert.ok(result.includes('1,280'));
  });

  it('formats large amounts in 万', () => {
    const result = formatCurrency(1280000);
    assert.ok(result.includes('万'));
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0);
    assert.ok(result.includes('0'));
  });
});

describe('tob-web /members/[id] — status transition', () => {
  it('NEXT_STATUS should define transitions for all statuses', () => {
    for (const status of MEMBER_STATUSES) {
      assert.ok(NEXT_STATUS[status] !== undefined, `missing transition for ${status}`);
    }
  });

  it('churned should transition back to active', () => {
    assert.equal(NEXT_STATUS.churned, 'active');
  });

  it('active should transition to inactive', () => {
    assert.equal(NEXT_STATUS.active, 'inactive');
  });

  it('STATUS_ACTION_LABELS should cover all statuses', () => {
    for (const status of MEMBER_STATUSES) {
      const label = STATUS_ACTION_LABELS[status];
      assert.ok(label, `missing action label for ${status}`);
      assert.ok(label.length > 0, `empty action label for ${status}`);
    }
  });
});
