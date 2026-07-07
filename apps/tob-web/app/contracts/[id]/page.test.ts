/**
 * TOB contract detail page unit tests
 *
 * Tests data-level functions that don't require React rendering
 * and validates the mock data used by the contract detail page.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_CONTRACTS, CONTRACT_STATUSES, CONTRACT_STATUS_MAP, CONTRACT_TYPE_MAP } from '../../contracts-data';
import type { ContractStatus } from '../../contracts-data';

// ── 工具函数（与 page.tsx 中保持一致） ──

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1_000).toFixed(1)}K`;
  return `¥${n.toLocaleString()}`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NEXT_STATUS: Partial<Record<ContractStatus, ContractStatus>> = {
  draft: 'pending_approval',
  pending_approval: 'active',
  active: 'suspended',
  suspended: 'terminated',
  expiring_soon: 'active',
  terminated: 'draft',
};

const STATUS_ACTION_LABELS: Partial<Record<ContractStatus, string>> = {
  draft: '提交审批',
  pending_approval: '激活合同',
  active: '暂停合同',
  suspended: '终止合同',
  expiring_soon: '续约激活',
  terminated: '重新起草',
};

function confirmMessage(contract: { title: string; status: ContractStatus }, next: ContractStatus): string {
  const from = CONTRACT_STATUS_MAP[contract.status].label;
  const to = CONTRACT_STATUS_MAP[next].label;
  return `确定将合同 "${contract.title}" 从 [${from}] 变更为 [${to}] 吗？`;
}

function daysUntil(endDate: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return '已到期';
  if (diff === 0) return '今日到期';
  return `${diff}天`;
}

function calcProgress(startDate: string, endDate: string): number {
  const total = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000;
  const elapsed = (new Date(today()).getTime() - new Date(startDate).getTime()) / 86400000;
  if (total <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, elapsed / total));
  return Math.round(ratio * 100);
}

function calcPaidRatio(paid: number, amount: number): string {
  return amount > 0 ? (paid / amount * 100).toFixed(0) : '0';
}

// ── 测试 ──

describe('tob-web /contracts/[id] — mock data', () => {
  it('MOCK_CONTRACTS should contain 16 items', () => {
    assert.equal(MOCK_CONTRACTS.length, 16);
  });

  it('each contract should have required fields', () => {
    for (const c of MOCK_CONTRACTS) {
      assert.ok(c.id, `contract ${c.title} missing id`);
      assert.ok(c.contractNo, `contract ${c.title} missing contractNo`);
      assert.ok(c.title, `contract ${c.id} missing title`);
      assert.ok(c.companyName, `contract ${c.id} missing companyName`);
      assert.ok(c.companyId, `contract ${c.id} missing companyId`);
      assert.ok(c.signatory, `contract ${c.id} missing signatory`);
      assert.ok(CONTRACT_STATUSES.includes(c.status), `contract ${c.id} has invalid status ${c.status}`);
      assert.ok(c.amount > 0, `contract ${c.id} has non-positive amount`);
      assert.ok(c.paid >= 0, `contract ${c.id} has negative paid`);
      assert.ok(c.startDate, `contract ${c.id} missing startDate`);
      assert.ok(c.endDate, `contract ${c.id} missing endDate`);
      assert.ok(typeof c.renewalCount === 'number', `contract ${c.id} missing renewalCount`);
      assert.ok(c.updatedAt, `contract ${c.id} missing updatedAt`);
    }
  });

  it('each contract id should be unique', () => {
    const ids = MOCK_CONTRACTS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('each contractNo should be unique', () => {
    const nos = MOCK_CONTRACTS.map((c) => c.contractNo);
    assert.equal(new Set(nos).size, nos.length);
  });

  it('CONTRACT_STATUS_MAP should cover all statuses', () => {
    for (const s of CONTRACT_STATUSES) {
      assert.ok(CONTRACT_STATUS_MAP[s], `missing status map entry for ${s}`);
      assert.ok(CONTRACT_STATUS_MAP[s].label, `missing label for ${s}`);
      assert.ok(CONTRACT_STATUS_MAP[s].variant, `missing variant for ${s}`);
    }
  });

  it('CONTRACT_TYPE_MAP should cover common types', () => {
    const known = ['subscription', 'service', 'license', 'maintenance', 'project'];
    for (const t of known) {
      assert.ok(CONTRACT_TYPE_MAP[t as keyof typeof CONTRACT_TYPE_MAP], `missing type map entry for ${t}`);
    }
  });

  it('NEXT_STATUS should define transitions for all statuses', () => {
    for (const s of CONTRACT_STATUSES) {
      assert.ok(s in NEXT_STATUS, `missing transition for status ${s}`);
      const next = NEXT_STATUS[s as ContractStatus]!;
      assert.ok(CONTRACT_STATUSES.includes(next), `invalid target status ${next} for ${s}`);
    }
  });

  it('STATUS_ACTION_LABELS should cover all statuses', () => {
    for (const s of CONTRACT_STATUSES) {
      assert.ok(s in STATUS_ACTION_LABELS, `missing action label for ${s}`);
    }
  });

  it('confirmMessage should produce correct string', () => {
    const mockContract = {
      id: 'co-001',
      title: '测试合同',
      status: 'active' as ContractStatus,
      contractNo: 'CT-001',
      companyName: '测试公司',
      companyId: 'c-001',
      type: 'subscription' as const,
      amount: 100000,
      paid: 50000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      signatory: '张三',
      renewalCount: 0,
      updatedAt: '2026-06-01',
      description: '',
    };
    const msg = confirmMessage(mockContract, 'suspended');
    assert.ok(msg.includes('测试合同'));
    assert.ok(msg.includes('执行中'));
    assert.ok(msg.includes('已暂停'));
  });

  it('confirmMessage should handle terminated → draft transition', () => {
    const mockContract = {
      id: 'co-014',
      title: '已结束项目',
      status: 'terminated' as ContractStatus,
    } as any;
    const msg = confirmMessage(mockContract, 'draft');
    assert.ok(msg.includes('已终止'));
    assert.ok(msg.includes('草稿'));
  });
});

describe('tob-web /contracts/[id] — helper functions', () => {
  it('formatAmount should format >= 1M as 万', () => {
    assert.match(formatAmount(1_500_000), /万/);
  });

  it('formatAmount should format >= 1K as K', () => {
    assert.match(formatAmount(88_000), /K/);
  });

  it('formatAmount should format small values as ¥', () => {
    assert.equal(formatAmount(500), '¥500');
  });

  it('formatAmount should handle zero', () => {
    assert.equal(formatAmount(0), '¥0');
  });

  it('formatAmount should handle edge 999', () => {
    assert.equal(formatAmount(999), '¥999');
  });

  it('formatAmount should handle edge 1000', () => {
    assert.match(formatAmount(1000), /K/);
  });

  it('formatAmount should handle edge 999999', () => {
    assert.match(formatAmount(999_999), /K/);
  });

  it('formatAmount should handle edge 1000000', () => {
    assert.match(formatAmount(1_000_000), /万/);
  });

  it('today should return ISO date string', () => {
    const t = today();
    assert.match(t, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('today should be a valid date', () => {
    assert.ok(!Number.isNaN(new Date(today()).getTime()));
  });

  it('daysUntil should return positive string for future dates', () => {
    const future = '2099-12-31';
    const result = daysUntil(future);
    assert.match(result, /^\d+天$/);
  });

  it('daysUntil should return "今日到期" for today', () => {
    const dt = today();
    assert.equal(daysUntil(dt), '今日到期');
  });

  it('daysUntil should return "已到期" for past dates', () => {
    assert.equal(daysUntil('2020-01-01'), '已到期');
  });

  it('calcProgress should return 0 for future start dates', () => {
    assert.equal(calcProgress('2099-01-01', '2099-12-31'), 0);
  });

  it('calcProgress should return 100 for ended contracts', () => {
    assert.equal(calcProgress('2020-01-01', '2020-01-02'), 100);
  });

  it('calcProgress should return a value between 0 and 100', () => {
    const p = calcProgress('2026-01-01', '2026-12-31');
    assert.ok(p >= 0 && p <= 100, `progress ${p} out of range`);
  });

  it('calcPaidRatio should return correct percentage', () => {
    assert.equal(calcPaidRatio(30_000, 100_000), '30');
  });

  it('calcPaidRatio should return 100 for full payment', () => {
    assert.equal(calcPaidRatio(100_000, 100_000), '100');
  });

  it('calcPaidRatio should return 0 for no payment', () => {
    assert.equal(calcPaidRatio(0, 100_000), '0');
  });

  it('calcPaidRatio should handle zero amount gracefully', () => {
    assert.equal(calcPaidRatio(0, 0), '0');
  });
});

describe('tob-web /contracts/[id] — status transition logic', () => {
  it('draft → pending_approval', () => {
    assert.equal(NEXT_STATUS.draft, 'pending_approval');
  });

  it('pending_approval → active', () => {
    assert.equal(NEXT_STATUS.pending_approval, 'active');
  });

  it('active → suspended', () => {
    assert.equal(NEXT_STATUS.active, 'suspended');
  });

  it('suspended → terminated', () => {
    assert.equal(NEXT_STATUS.suspended, 'terminated');
  });

  it('expiring_soon → active', () => {
    assert.equal(NEXT_STATUS.expiring_soon, 'active');
  });

  it('terminated → draft (restart)', () => {
    assert.equal(NEXT_STATUS.terminated, 'draft');
  });

  it('NEXT_STATUS transitions should form a cycle', () => {
    // 从 draft 走一轮，看能否回到 draft
    const states: ContractStatus[] = ['draft', 'pending_approval', 'active', 'suspended', 'terminated'];
    let current: ContractStatus = 'draft';
    for (const expected of states) {
      assert.equal(current, expected);
      current = NEXT_STATUS[current]!;
    }
    // terminated → draft
    assert.equal(current, 'draft');
  });
});

describe('tob-web /contracts/[id] — edge cases', () => {
  it('should handle terminated contracts with full payment', () => {
    const terminated = MOCK_CONTRACTS.filter((c) => c.status === 'terminated');
    for (const c of terminated) {
      assert.equal(c.paid, c.amount, `terminated contract ${c.id} should be fully paid`);
    }
  });

  it('should handle draft contracts with zero payment', () => {
    const drafts = MOCK_CONTRACTS.filter((c) => c.status === 'draft');
    for (const c of drafts) {
      assert.equal(c.paid, 0, `draft contract ${c.id} should have zero payment`);
    }
  });

  it('all active contracts should have startDate <= endDate', () => {
    for (const c of MOCK_CONTRACTS) {
      const start = new Date(c.startDate).getTime();
      const end = new Date(c.endDate).getTime();
      assert.ok(start <= end, `contract ${c.id} has startDate after endDate`);
    }
  });

  it('paid should never exceed amount', () => {
    for (const c of MOCK_CONTRACTS) {
      assert.ok(c.paid <= c.amount, `contract ${c.id} paid exceeds amount`);
    }
  });

  it('description should be optional', () => {
    for (const c of MOCK_CONTRACTS) {
      // description is optional, just check it's string or undefined
      assert.ok(c.description === undefined || typeof c.description === 'string');
    }
  });
});
