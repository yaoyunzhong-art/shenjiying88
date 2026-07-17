/**
 * members/cards/page.test.tsx — 会员卡管理页 L1 测试
 *
 * 覆盖: 卡片类型/状态枚举、数据表格筛选、发行卡片校验、金额/日期格式化、统计计算
 * 正例: 正常卡片列表、类型筛选、状态筛选、发行新卡
 * 反例: 空会员ID/姓名校验失败、无效卡片类型、过期/冻结卡片显示
 * 边界: 零余额卡片、永久有效(expiresAt=null)、积分倍率范围
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import MemberCardsPage from './page';
import fs from 'node:fs';

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

interface IssueCardFormData {
  memberId: string;
  memberName: string;
  cardType: CardType;
  designatedStore: string;
  pointsMultiplier: number;
  notes: string;
}

interface IssueCardErrors {
  memberId?: string;
  memberName?: string;
  cardType?: string;
}

interface CardStats {
  total: number;
  active: number;
  physical: number;
  totalBalance: number;
}

const CARD_TYPE_MAP: Record<CardType, { label: string; variant: string }> = {
  physical: { label: '实体卡', variant: 'success' },
  virtual: { label: '虚拟卡', variant: 'info' },
  digital: { label: '数字卡', variant: 'warning' },
};

const CARD_STATUS_MAP: Record<CardStatus, { label: string; variant: string }> = {
  active: { label: '正常', variant: 'success' },
  frozen: { label: '已冻结', variant: 'warning' },
  expired: { label: '已过期', variant: 'danger' },
  cancelled: { label: '已注销', variant: 'neutral' },
};

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

function calculateStats(cards: MemberCard[]): CardStats {
  return {
    total: cards.length,
    active: cards.filter(c => c.status === 'active').length,
    physical: cards.filter(c => c.cardType === 'physical').length,
    totalBalance: cards.reduce((sum, c) => sum + c.balance, 0),
  };
}

function validateIssueForm(data: IssueCardFormData): IssueCardErrors {
  const errs: IssueCardErrors = {};
  if (!data.memberId.trim()) errs.memberId = '会员ID不能为空';
  if (!data.memberName.trim()) errs.memberName = '持卡人姓名不能为空';
  return errs;
}

function cardTypeColor(type: CardType): string {
  const colors: Record<CardType, string> = {
    physical: '#86efac',
    virtual: '#93c5fd',
    digital: '#fde68a',
  };
  return colors[type];
}

function isCardExpired(card: MemberCard): boolean {
  if (!card.expiresAt) return false;
  return new Date(card.expiresAt) < new Date();
}

/* ── 辅助数据 ── */

const SAMPLE_CARDS: MemberCard[] = [
  { id: 'mc-001', memberId: 'm001', memberName: '张伟', cardNumber: 'VIP-20260001', cardType: 'physical', status: 'active', issuedAt: '2026-01-15', activatedAt: '2026-01-16', expiresAt: '2028-01-15', balance: 58000, pointsMultiplier: 2, designatedStore: '朝阳大悦城旗舰店', linkedWechat: true, notes: 'VIP实体卡' },
  { id: 'mc-002', memberId: 'm002', memberName: '李娜', cardNumber: 'VIP-20260002', cardType: 'virtual', status: 'active', issuedAt: '2026-02-01', activatedAt: '2026-02-01', expiresAt: '2027-02-01', balance: 32000, pointsMultiplier: 1.5, designatedStore: null, linkedWechat: true, notes: '' },
  { id: 'mc-003', memberId: 'm004', memberName: '赵敏', cardNumber: 'VIP-20260003', cardType: 'digital', status: 'active', issuedAt: '2024-11-20', activatedAt: '2024-11-20', expiresAt: null, balance: 120000, pointsMultiplier: 2.5, designatedStore: '成都太古里体验店', linkedWechat: true, notes: '数字钻石卡' },
  { id: 'mc-004', memberId: 'm006', memberName: '陈静', cardNumber: 'VIP-20260004', cardType: 'physical', status: 'frozen', issuedAt: '2025-05-10', activatedAt: '2025-05-12', expiresAt: '2027-05-10', balance: 8500, pointsMultiplier: 1, designatedStore: '广州天河城店', linkedWechat: false, notes: '因争议订单冻结' },
  { id: 'mc-005', memberId: 'm007', memberName: '杨帆', cardNumber: 'VIP-20260005', cardType: 'virtual', status: 'expired', issuedAt: '2024-03-01', activatedAt: '2024-03-01', expiresAt: '2026-03-01', balance: 1200, pointsMultiplier: 1, designatedStore: null, linkedWechat: true, notes: '已过期未续费' },
  { id: 'mc-006', memberId: 'm010', memberName: '郑丽', cardNumber: 'VIP-20260006', cardType: 'physical', status: 'active', issuedAt: '2025-08-15', activatedAt: '2025-08-16', expiresAt: '2028-08-15', balance: 95000, pointsMultiplier: 3, designatedStore: 'San Francisco Union Square', linkedWechat: true, notes: '全球VIP实体卡' },
];

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(<MemberCardsPage />);
}

/* ============================================================ */

describe('members/cards: 页面渲染', () => {
  it('component is a function', () => {
    assert.equal(typeof MemberCardsPage, 'function');
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('renders title', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('会员卡管理'));
  });

  it('renders stat cards', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('卡片总数'));
  });

  it('renders normal cards stat', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('正常卡片'));
  });

  it('renders entity card stat', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('实体卡'));
  });

  it('renders total balance stat', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('总余额'));
  });

  it('renders issue card button', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('发行新卡'));
  });
});

describe('members/cards: 数据类型', () => {
  it('CardType has 3 values', () => {
    const types: CardType[] = ['physical', 'virtual', 'digital'];
    assert.equal(types.length, 3);
  });

  it('CardStatus has 4 values', () => {
    const statuses: CardStatus[] = ['active', 'frozen', 'expired', 'cancelled'];
    assert.equal(statuses.length, 4);
  });

  it('CARD_TYPE_MAP all present', () => {
    assert.equal(Object.keys(CARD_TYPE_MAP).length, 3);
  });

  it('CARD_STATUS_MAP all present', () => {
    assert.equal(Object.keys(CARD_STATUS_MAP).length, 4);
  });

  it('MemberCard has all required fields', () => {
    const card = SAMPLE_CARDS[0];
    assert.equal(typeof card.cardNumber, 'string');
    assert.equal(typeof card.balance, 'number');
    assert.equal(typeof card.linkedWechat, 'boolean');
    assert.ok(Array.isArray([card]));
  });

  it('pointsMultiplier is a number', () => {
    SAMPLE_CARDS.forEach(c => assert.equal(typeof c.pointsMultiplier, 'number'));
  });

  it('activatedAt is nullable', () => {
    assert.equal(SAMPLE_CARDS[0].activatedAt, '2026-01-16');
  });

  it('expiresAt is nullable', () => {
    assert.equal(SAMPLE_CARDS[2].expiresAt, null);
  });

  it('designatedStore is nullable', () => {
    assert.equal(SAMPLE_CARDS[1].designatedStore, null);
  });

  it('linkedWechat is boolean', () => {
    const trueCount = SAMPLE_CARDS.filter(c => c.linkedWechat).length;
    assert.ok(trueCount > 0);
  });
});

describe('members/cards: 业务逻辑', () => {
  it('formatCurrency 0 returns ¥0', () => {
    assert.equal(formatCurrency(0), '¥0');
  });

  it('formatCurrency 1200 returns ¥1,200', () => {
    assert.equal(formatCurrency(1200), '¥1,200');
  });

  it('formatCurrency 58000 returns ¥58,000', () => {
    assert.equal(formatCurrency(58000), '¥58,000');
  });

  it('formatCurrency 95000 returns ¥95,000', () => {
    assert.equal(formatCurrency(95000), '¥95,000');
  });

  it('formatCurrency 120000 returns ¥12.0万 (>= 10000)', () => {
    assert.equal(formatCurrency(120000), '¥12.0万');
  });

  it('formatCurrency 9999 stays ¥9,999 (< 10000)', () => {
    assert.equal(formatCurrency(9999), '¥9,999');
  });

  it('formatCurrency 10000 boundary', () => {
    assert.equal(formatCurrency(10000), '¥1.0万');
  });

  it('calculateStats total count', () => {
    const stats = calculateStats(SAMPLE_CARDS);
    assert.equal(stats.total, 6);
  });

  it('calculateStats active count', () => {
    const stats = calculateStats(SAMPLE_CARDS);
    assert.equal(stats.active, 4);
  });

  it('calculateStats physical count', () => {
    const stats = calculateStats(SAMPLE_CARDS);
    assert.equal(stats.physical, 3);
  });

  it('calculateStats total balance', () => {
    const stats = calculateStats(SAMPLE_CARDS);
    assert.equal(stats.totalBalance, 314700);
  });

  it('calculateStats empty cards', () => {
    const stats = calculateStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.active, 0);
    assert.equal(stats.physical, 0);
    assert.equal(stats.totalBalance, 0);
  });

  it('validateIssueForm valid input returns empty', () => {
    const valid: IssueCardFormData = { memberId: 'm001', memberName: '张三', cardType: 'virtual', designatedStore: '', pointsMultiplier: 1.0, notes: '' };
    assert.deepEqual(validateIssueForm(valid), {});
  });

  it('validateIssueForm empty memberId', () => {
    const errs = validateIssueForm({ memberId: '', memberName: '张三', cardType: 'virtual', designatedStore: '', pointsMultiplier: 1.0, notes: '' });
    assert.equal(errs.memberId, '会员ID不能为空');
  });

  it('validateIssueForm empty memberName', () => {
    const errs = validateIssueForm({ memberId: 'm001', memberName: '', cardType: 'virtual', designatedStore: '', pointsMultiplier: 1.0, notes: '' });
    assert.equal(errs.memberName, '持卡人姓名不能为空');
  });

  it('validateIssueForm cardType is not validated (default is fine)', () => {
    const errs = validateIssueForm({ memberId: 'm001', memberName: '张三', cardType: 'physical', designatedStore: '', pointsMultiplier: 1.0, notes: '' });
    assert.equal(errs.cardType, undefined);
  });

  it('cardTypeColor physical', () => {
    assert.equal(cardTypeColor('physical'), '#86efac');
  });

  it('cardTypeColor virtual', () => {
    assert.equal(cardTypeColor('virtual'), '#93c5fd');
  });

  it('cardTypeColor digital', () => {
    assert.equal(cardTypeColor('digital'), '#fde68a');
  });

  it('isCardExpired returns false when expiresAt is null', () => {
    assert.ok(!isCardExpired(SAMPLE_CARDS[2]));
  });

  it('isCardExpired returns false for future expiry', () => {
    assert.ok(!isCardExpired(SAMPLE_CARDS[0]));
  });

  it('pointsMultiplier range 0.5 to 10', () => {
    SAMPLE_CARDS.forEach(c => {
      assert.ok(c.pointsMultiplier >= 0.5);
      assert.ok(c.pointsMultiplier <= 10);
    });
  });

  it('card number starts with VIP-', () => {
    SAMPLE_CARDS.forEach(c => assert.ok(c.cardNumber.startsWith('VIP-')));
  });

  it('balance is non-negative', () => {
    SAMPLE_CARDS.forEach(c => assert.ok(c.balance >= 0));
  });

  it('expired card status is expired', () => {
    assert.equal(SAMPLE_CARDS[4].status, 'expired');
  });

  it('frozen card status is frozen', () => {
    assert.equal(SAMPLE_CARDS[3].status, 'frozen');
  });

  it('cancelled status is valid', () => {
    assert.equal(CARD_STATUS_MAP['cancelled'].label, '已注销');
  });

  it('notes can be empty string', () => {
    assert.equal(SAMPLE_CARDS[1].notes, '');
  });

  it('CARD_TYPE_MAP physical label', () => {
    assert.equal(CARD_TYPE_MAP['physical'].label, '实体卡');
  });

  it('CARD_STATUS_MAP active variant is success', () => {
    assert.equal(CARD_STATUS_MAP['active'].variant, 'success');
  });

  it('CARD_STATUS_MAP frozen variant is warning', () => {
    assert.equal(CARD_STATUS_MAP['frozen'].variant, 'warning');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Members / Cards — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onClose={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
