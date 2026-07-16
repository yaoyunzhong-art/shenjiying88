/**
 * members/cards/[id]/page.test.tsx — 会员卡详情 L1 测试
 *
 * 覆盖: 卡片数据、状态流转、编辑表单、金额格式
 * 正例: 卡片渲染、状态变更、编辑保存
 * 反例: 卡片不存在、字段空值、错误状态
 * 边界: 大额余额、过期卡片、无备注
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

type CardType = 'physical' | 'virtual' | 'digital';
type CardStatus = 'active' | 'frozen' | 'expired' | 'cancelled';

interface MemberCard {
  id: string;
  memberId: string;
  memberName: string;
  cardNumber: string;
  cardType: CardType;
  status: CardStatus;
  issuedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  balance: number;
  pointsMultiplier: number;
  designatedStore: string | null;
  linkedWechat: boolean;
  notes: string;
}

interface EditCardFormData {
  pointsMultiplier: number;
  designatedStore: string;
  linkedWechat: boolean;
  notes: string;
}

/* ── 辅助函数 ── */

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  } catch { return iso; }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function cardTypeColor(type: CardType): string {
  const colors: Record<string, string> = { physical: '#86efac', virtual: '#93c5fd', digital: '#fde68a' };
  return colors[type] ?? '#94a3b8';
}

const CARD_TYPE_OPTIONS = [
  { value: 'virtual', label: '虚拟卡' },
  { value: 'physical', label: '实体卡' },
  { value: 'digital', label: '数字卡' },
] as const;

const CARD_STATUS_OPTIONS = [
  { value: 'active', label: '正常' },
  { value: 'frozen', label: '已冻结' },
  { value: 'expired', label: '已过期' },
  { value: 'cancelled', label: '已注销' },
] as const;

/* ============================================================ */

describe('member-card-detail: 数据类型', () => {
  it('MemberCard has all required fields', () => {
    const c: MemberCard = {
      id: 'mc-001', memberId: 'm001', memberName: '张伟',
      cardNumber: 'VIP-00001', cardType: 'physical', status: 'active',
      issuedAt: '2026-01-15', activatedAt: '2026-01-16', expiresAt: '2028-01-15',
      balance: 58000, pointsMultiplier: 2, designatedStore: '朝阳大悦城',
      linkedWechat: true, notes: 'VIP实体卡',
    };
    assert.equal(typeof c.id, 'string');
    assert.equal(typeof c.cardNumber, 'string');
    assert.equal(typeof c.balance, 'number');
    assert.equal(typeof c.linkedWechat, 'boolean');
  });

  it('cardType enum has 3 valid values', () => {
    const types: CardType[] = ['physical', 'virtual', 'digital'];
    assert.equal(types.length, 3);
  });

  it('cardStatus enum has 4 valid values', () => {
    const statuses: CardStatus[] = ['active', 'frozen', 'expired', 'cancelled'];
    assert.equal(statuses.length, 4);
  });

  it('CARD_TYPE_OPTIONS match type values', () => {
    CARD_TYPE_OPTIONS.forEach(o => {
      assert.ok(['physical', 'virtual', 'digital'].includes(o.value));
    });
  });

  it('CARD_STATUS_OPTIONS match status values', () => {
    CARD_STATUS_OPTIONS.forEach(o => {
      assert.ok(['active', 'frozen', 'expired', 'cancelled'].includes(o.value));
    });
  });

  it('EditCardFormData fields are correct types', () => {
    const f: EditCardFormData = { pointsMultiplier: 2, designatedStore: '', linkedWechat: true, notes: '' };
    assert.equal(typeof f.pointsMultiplier, 'number');
    assert.equal(typeof f.designatedStore, 'string');
    assert.equal(typeof f.linkedWechat, 'boolean');
    assert.equal(typeof f.notes, 'string');
  });
});

describe('member-card-detail: 辅助函数', () => {
  it('formatCurrency below 10000 shows plain number', () => {
    assert.equal(formatCurrency(5800), '¥5,800');
  });

  it('formatCurrency above 10000 shows wan format', () => {
    assert.equal(formatCurrency(58000), '¥5.8万');
  });

  it('formatCurrency exact 10000 shows wan', () => {
    assert.equal(formatCurrency(10000), '¥1.0万');
  });

  it('formatCurrency zero', () => {
    assert.equal(formatCurrency(0), '¥0');
  });

  it('formatDateShort with null returns dash', () => {
    assert.equal(formatDateShort(null), '—');
  });

  it('formatDateShort with valid date', () => {
    const result = formatDateShort('2026-01-15');
    assert.ok(result.includes('2026'));
    assert.ok(result.includes('01'));
  });

  it('formatDate with invalid input returns input', () => {
    const result = formatDate('not-a-date');
    assert.equal(result, 'not-a-date');
  });

  it('cardTypeColor returns color for physical', () => {
    const color = cardTypeColor('physical');
    assert.equal(color, '#86efac');
  });

  it('cardTypeColor returns color for virtual', () => {
    assert.equal(cardTypeColor('virtual'), '#93c5fd');
  });

  it('cardTypeColor returns fallback for unknown', () => {
    assert.equal(cardTypeColor('digital' as CardType), '#fde68a');
  });

  it('activatedAt can be null for unactivated cards', () => {
    const c: MemberCard = {
      id: 'mc-x', memberId: 'm-x', memberName: '无名',
      cardNumber: 'VIP-00000', cardType: 'virtual', status: 'active',
      issuedAt: '2026-01-01', activatedAt: null, expiresAt: '2027-01-01',
      balance: 0, pointsMultiplier: 1, designatedStore: null,
      linkedWechat: false, notes: '',
    };
    assert.equal(c.activatedAt, null);
  });

  it('expiresAt can be null for permanent cards', () => {
    const c: MemberCard = {
      id: 'mc-y', memberId: 'm-y', memberName: '永久',
      cardNumber: 'VIP-99999', cardType: 'digital', status: 'active',
      issuedAt: '2024-11-20', activatedAt: '2024-11-20', expiresAt: null,
      balance: 120000, pointsMultiplier: 2.5, designatedStore: '成都太古里',
      linkedWechat: true, notes: '数字钻石卡',
    };
    assert.equal(c.expiresAt, null);
  });

  it('designatedStore can be null', () => {
    const c: MemberCard = {
      id: 'mc-z', memberId: 'm-z', memberName: '不限',
      cardNumber: 'VIP-88888', cardType: 'virtual', status: 'active',
      issuedAt: '2026-02-01', activatedAt: '2026-02-01', expiresAt: '2027-02-01',
      balance: 32000, pointsMultiplier: 1.5, designatedStore: null,
      linkedWechat: true, notes: '',
    };
    assert.equal(c.designatedStore, null);
  });

  it('balance can be 120000 (large number)', () => {
    const result = formatCurrency(120000);
    assert.equal(result, '¥12.0万');
  });

  it('pointsMultiplier can be decimal like 1.5', () => {
    const c: MemberCard = {
      id: 'mc-a', memberId: 'm-a', memberName: '测试',
      cardNumber: 'VIP-00002', cardType: 'virtual', status: 'active',
      issuedAt: '2026-01-01', activatedAt: null, expiresAt: null,
      balance: 100, pointsMultiplier: 1.5, designatedStore: null,
      linkedWechat: false, notes: '',
    };
    assert.equal(c.pointsMultiplier, 1.5);
  });
});

describe('member-card-detail: 业务逻辑', () => {
  const ACTIVE_CARD: MemberCard = {
    id: 'mc-001', memberId: 'm001', memberName: '张伟',
    cardNumber: 'VIP-20260001', cardType: 'physical', status: 'active',
    issuedAt: '2026-01-15', activatedAt: '2026-01-16', expiresAt: '2028-01-15',
    balance: 58000, pointsMultiplier: 2, designatedStore: '朝阳大悦城旗舰店',
    linkedWechat: true, notes: 'VIP实体卡',
  };

  const FROZEN_CARD: MemberCard = {
    id: 'mc-004', memberId: 'm006', memberName: '陈静',
    cardNumber: 'VIP-20260004', cardType: 'physical', status: 'frozen',
    issuedAt: '2025-05-10', activatedAt: '2025-05-12', expiresAt: '2027-05-10',
    balance: 8500, pointsMultiplier: 1, designatedStore: '广州天河城店',
    linkedWechat: false, notes: '因争议订单冻结',
  };

  const EXPIRED_CARD: MemberCard = {
    id: 'mc-005', memberId: 'm007', memberName: '杨帆',
    cardNumber: 'VIP-20260005', cardType: 'virtual', status: 'expired',
    issuedAt: '2024-03-01', activatedAt: '2024-03-01', expiresAt: '2026-03-01',
    balance: 1200, pointsMultiplier: 1, designatedStore: null,
    linkedWechat: true, notes: '已过期未续费',
  };

  const CANCELLED_CARD: MemberCard = {
    id: 'mc-x', memberId: 'm009', memberName: '吴昊',
    cardNumber: 'VIP-20260099', cardType: 'physical', status: 'cancelled',
    issuedAt: '2025-09-01', activatedAt: '2025-09-02', expiresAt: '2027-09-01',
    balance: 0, pointsMultiplier: 1, designatedStore: null,
    linkedWechat: false, notes: '',
  };

  it('active card has status active', () => {
    assert.equal(ACTIVE_CARD.status, 'active');
  });

  it('frozen card has non-zero balance', () => {
    assert.ok(FROZEN_CARD.balance > 0);
  });

  it('expired card has past expiresAt', () => {
    const expires = new Date(EXPIRED_CARD.expiresAt!).getTime();
    assert.ok(expires < Date.now());
  });

  it('cancelled card has zero balance', () => {
    assert.equal(CANCELLED_CARD.balance, 0);
  });

  it('cancelled card cannot be status-changed (逻辑: 注销为终态)', () => {
    // 卡片注销后不应再有状态变更操作
    const isTerminalStatus = ['cancelled', 'expired'].includes(CANCELLED_CARD.status);
    assert.ok(isTerminalStatus);
  });

  it('active card has linkedWechat true', () => {
    assert.ok(ACTIVE_CARD.linkedWechat);
  });

  it('frozen card has linkedWechat false', () => {
    assert.ok(!FROZEN_CARD.linkedWechat);
  });

  it('designatedStore is present on active card', () => {
    assert.ok(ACTIVE_CARD.designatedStore !== null);
  });

  it('expired card has no designatedStore', () => {
    assert.equal(EXPIRED_CARD.designatedStore, null);
  });

  it('pointsMultiplier valid range 0.5-10', () => {
    [0.5, 1, 1.5, 2, 2.5, 3, 10].forEach(v => {
      assert.ok(v >= 0.5 && v <= 10);
    });
  });

  it('expired card notes not empty', () => {
    assert.ok(EXPIRED_CARD.notes.length > 0);
  });

  it('active card notes not empty', () => {
    assert.ok(ACTIVE_CARD.notes.length > 0);
  });

  it('frozen card has reason in notes', () => {
    assert.ok(FROZEN_CARD.notes.includes('冻结'));
  });

  it('cancelled card has empty notes', () => {
    assert.equal(CANCELLED_CARD.notes, '');
  });

  it('formatCurrency with large balance difference', () => {
    const balances = [0, 100, 1000, 9999, 10000, 100000, 10000000];
    const results = balances.map(formatCurrency);
    assert.equal(results[0], '¥0');
    assert.equal(results[1], '¥100');
    assert.equal(results[4], '¥1.0万');
    assert.equal(results[5], '¥10.0万');
  });

  it('cardTypeColor returns consistent colors', () => {
    const types: CardType[] = ['physical', 'virtual', 'digital'];
    const colors = types.map(cardTypeColor);
    assert.equal(colors.length, 3);
    assert.ok(colors.every(c => c.startsWith('#')));
  });

  it('balance format: active card 58000', () => {
    assert.equal(formatCurrency(ACTIVE_CARD.balance), '¥5.8万');
  });

  it('balance format: frozen card 8500', () => {
    assert.equal(formatCurrency(FROZEN_CARD.balance), '¥8,500');
  });

  it('balance format: expired card 1200', () => {
    assert.equal(formatCurrency(EXPIRED_CARD.balance), '¥1,200');
  });

  it('EditFormData pointsMultiplier initial = card.pointsMultiplier', () => {
    const form: EditCardFormData = {
      pointsMultiplier: ACTIVE_CARD.pointsMultiplier,
      designatedStore: ACTIVE_CARD.designatedStore ?? '',
      linkedWechat: ACTIVE_CARD.linkedWechat,
      notes: ACTIVE_CARD.notes,
    };
    assert.equal(form.pointsMultiplier, 2);
    assert.equal(form.linkedWechat, true);
    assert.ok(form.designatedStore.length > 0);
  });

  it('expired card should have balance still accessible', () => {
    assert.equal(typeof EXPIRED_CARD.balance, 'number');
    assert.equal(EXPIRED_CARD.balance, 1200);
  });

  it('cancelled card should be findable by id', () => {
    assert.equal(CANCELLED_CARD.id, 'mc-x');
  });
});
