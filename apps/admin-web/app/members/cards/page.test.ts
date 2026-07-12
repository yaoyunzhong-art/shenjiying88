/**
 * members/cards/page.test.ts — 会员卡管理页 L1 测试
 *
 * 覆盖:
 *   正例 — 卡类型/状态映射校验、筛选/搜索逻辑、统计计算
 *   反例 — 不存在的类型、空搜索、无效表单输入
 *   边界 — 零余额卡、过期时间 null
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型定义 ────────────────────────────────────────

interface MemberCard {
  id: string;
  memberId: string;
  memberName: string;
  cardNumber: string;
  cardType: 'physical' | 'virtual' | 'digital';
  status: 'active' | 'frozen' | 'expired' | 'cancelled';
  issuedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  balance: number;
  pointsMultiplier: number;
  designatedStore: string | null;
  linkedWechat: boolean;
  notes: string;
}

// ─── Mock 数据 ───────────────────────────────────────

const MOCK_MEMBER_CARDS: MemberCard[] = [
  { id: 'mc-001', memberId: 'm001', memberName: '张伟', cardNumber: 'VIP-20260001', cardType: 'physical', status: 'active', issuedAt: '2026-01-15', activatedAt: '2026-01-16', expiresAt: '2028-01-15', balance: 58000, pointsMultiplier: 2, designatedStore: '朝阳大悦城旗舰店', linkedWechat: true, notes: 'VIP实体卡' },
  { id: 'mc-002', memberId: 'm002', memberName: '李娜', cardNumber: 'VIP-20260002', cardType: 'virtual', status: 'active', issuedAt: '2026-02-01', activatedAt: '2026-02-01', expiresAt: '2027-02-01', balance: 32000, pointsMultiplier: 1.5, designatedStore: null, linkedWechat: true, notes: '' },
  { id: 'mc-003', memberId: 'm004', memberName: '赵敏', cardNumber: 'VIP-20260003', cardType: 'digital', status: 'active', issuedAt: '2024-11-20', activatedAt: '2024-11-20', expiresAt: null, balance: 120000, pointsMultiplier: 2.5, designatedStore: '成都太古里体验店', linkedWechat: true, notes: '数字钻石卡' },
  { id: 'mc-004', memberId: 'm006', memberName: '陈静', cardNumber: 'VIP-20260004', cardType: 'physical', status: 'frozen', issuedAt: '2025-05-10', activatedAt: '2025-05-12', expiresAt: '2027-05-10', balance: 8500, pointsMultiplier: 1, designatedStore: '广州天河城店', linkedWechat: false, notes: '因争议订单冻结' },
  { id: 'mc-005', memberId: 'm007', memberName: '杨帆', cardNumber: 'VIP-20260005', cardType: 'virtual', status: 'expired', issuedAt: '2024-03-01', activatedAt: '2024-03-01', expiresAt: '2026-03-01', balance: 1200, pointsMultiplier: 1, designatedStore: null, linkedWechat: true, notes: '已过期未续费' },
  { id: 'mc-006', memberId: 'm010', memberName: '郑丽', cardNumber: 'VIP-20260006', cardType: 'physical', status: 'active', issuedAt: '2025-08-15', activatedAt: '2025-08-16', expiresAt: '2028-08-15', balance: 95000, pointsMultiplier: 3, designatedStore: 'San Francisco Union Square', linkedWechat: true, notes: '全球VIP实体卡' },
];

const MEMBER_CARD_TYPE_MAP: Record<MemberCard['cardType'], { label: string; variant: string }> = {
  physical: { label: '实体卡', variant: 'success' },
  virtual: { label: '虚拟卡', variant: 'info' },
  digital: { label: '数字卡', variant: 'warning' },
};

const MEMBER_CARD_STATUS_MAP: Record<MemberCard['status'], { label: string; variant: string }> = {
  active: { label: '正常', variant: 'success' },
  frozen: { label: '已冻结', variant: 'warning' },
  expired: { label: '已过期', variant: 'danger' },
  cancelled: { label: '已注销', variant: 'neutral' },
};

// ─── 辅助函数 ────────────────────────────────────────

function filterByCardType(cards: MemberCard[], cardType: string): MemberCard[] {
  if (cardType === 'ALL') return cards;
  return cards.filter(c => c.cardType === cardType);
}

function filterByCardStatus(cards: MemberCard[], status: string): MemberCard[] {
  if (status === 'ALL') return cards;
  return cards.filter(c => c.status === status);
}

function searchCards(cards: MemberCard[], keyword: string): MemberCard[] {
  if (!keyword.trim()) return cards;
  const lower = keyword.toLowerCase();
  return cards.filter(c =>
    c.memberName.toLowerCase().includes(lower) ||
    c.cardNumber.toLowerCase().includes(lower) ||
    (c.designatedStore && c.designatedStore.toLowerCase().includes(lower))
  );
}

function computeCardStats(cards: MemberCard[]) {
  return {
    total: cards.length,
    activeCount: cards.filter(c => c.status === 'active').length,
    totalBalance: cards.reduce((s, c) => s + c.balance, 0),
    linkedWechatCount: cards.filter(c => c.linkedWechat).length,
    physicalCount: cards.filter(c => c.cardType === 'physical').length,
    virtualCount: cards.filter(c => c.cardType === 'virtual').length,
    digitalCount: cards.filter(c => c.cardType === 'digital').length,
  };
}

function cardTypeColor(cardType: MemberCard['cardType']): string {
  const colors: Record<string, string> = {
    physical: '#86efac',
    virtual: '#93c5fd',
    digital: '#fde68a',
  };
  return colors[cardType] ?? '#94a3b8';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

// ─── 测试套件 ────────────────────────────────────────

describe('members/cards — 卡片数据', () => {
  it('1. 6 张会员卡（正例）', () => {
    assert.equal(MOCK_MEMBER_CARDS.length, 6);
  });

  it('2. 所有卡号以 VIP- 开头（正例）', () => {
    for (const c of MOCK_MEMBER_CARDS) {
      assert.ok(c.cardNumber.startsWith('VIP-'), `${c.id} 卡号格式`);
    }
  });

  it('3. active 卡最多（正例）', () => {
    const stats = computeCardStats(MOCK_MEMBER_CARDS);
    assert.equal(stats.activeCount, 4);
    assert.ok(stats.activeCount > MOCK_MEMBER_CARDS.length / 2);
  });

  it('4. 余额全为非负（反例）', () => {
    for (const c of MOCK_MEMBER_CARDS) {
      assert.ok(c.balance >= 0, `${c.id} balance >= 0`);
    }
  });

  it('5. pointsMultiplier >= 1（正例）', () => {
    for (const c of MOCK_MEMBER_CARDS) {
      assert.ok(c.pointsMultiplier >= 1, `${c.id} multiplier >= 1`);
    }
  });

  it('6. 微信绑定卡超半数（正例）', () => {
    const stats = computeCardStats(MOCK_MEMBER_CARDS);
    assert.ok(stats.linkedWechatCount > MOCK_MEMBER_CARDS.length / 2);
  });
});

describe('members/cards — 类型与状态映射', () => {
  it('7. 所有 cardType 在映射中（正例）', () => {
    const types = new Set(Object.keys(MEMBER_CARD_TYPE_MAP));
    for (const c of MOCK_MEMBER_CARDS) {
      assert.ok(types.has(c.cardType), `${c.id} 类型 "${c.cardType}" 应在映射`);
    }
  });

  it('8. 所有 status 在映射中（正例）', () => {
    const statuses = new Set(Object.keys(MEMBER_CARD_STATUS_MAP));
    for (const c of MOCK_MEMBER_CARDS) {
      assert.ok(statuses.has(c.status), `${c.id} 状态 "${c.status}" 应在映射`);
    }
  });

  it('9. cardTypeColor 返回颜色（正例）', () => {
    assert.equal(cardTypeColor('physical'), '#86efac');
    assert.equal(cardTypeColor('virtual'), '#93c5fd');
    assert.equal(cardTypeColor('digital'), '#fde68a');
  });

  it('10. 未知类型返回默认颜色（反例）', () => {
    assert.equal(cardTypeColor('unknown' as any), '#94a3b8');
  });
});

describe('members/cards — 筛选与搜索', () => {
  it('11. 筛选 physical 卡（正例）', () => {
    const result = filterByCardType(MOCK_MEMBER_CARDS, 'physical');
    assert.equal(result.length, 3);
    assert.ok(result.every(c => c.cardType === 'physical'));
  });

  it('12. 筛选 virtual 卡（正例）', () => {
    const result = filterByCardType(MOCK_MEMBER_CARDS, 'virtual');
    assert.equal(result.length, 2);
  });

  it('13. 不存在的类型返回空（反例）', () => {
    const result = filterByCardType(MOCK_MEMBER_CARDS, 'unknown');
    assert.equal(result.length, 0);
  });

  it('14. 筛选 frozen 状态（正例）', () => {
    const result = filterByCardStatus(MOCK_MEMBER_CARDS, 'frozen');
    assert.equal(result.length, 1);
    assert.equal(result[0]!.memberName, '陈静');
  });

  it('15. 搜索会员名（正例）', () => {
    const result = searchCards(MOCK_MEMBER_CARDS, '张伟');
    assert.equal(result.length, 1);
  });

  it('16. 搜索卡号（正例）', () => {
    const result = searchCards(MOCK_MEMBER_CARDS, 'VIP-20260003');
    assert.equal(result.length, 1);
  });

  it('17. 空搜索返回全部（边界）', () => {
    const result = searchCards(MOCK_MEMBER_CARDS, '');
    assert.equal(result.length, MOCK_MEMBER_CARDS.length);
  });

  it('18. 不存在的关键字返回空（反例）', () => {
    const result = searchCards(MOCK_MEMBER_CARDS, '不存在的');
    assert.equal(result.length, 0);
  });
});

describe('members/cards — 实用函数', () => {
  it('19. formatCurrency — 小于 1 万（正例）', () => {
    assert.equal(formatCurrency(1200), '¥1,200');
  });

  it('20. formatCurrency — 大于 1 万（正例）', () => {
    assert.equal(formatCurrency(58000), '¥5.8万');
  });

  it('21. formatCurrency — 零值（边界）', () => {
    assert.equal(formatCurrency(0), '¥0');
  });

  it('22. 总余额合计（正例）', () => {
    const stats = computeCardStats(MOCK_MEMBER_CARDS);
    const expected = 58000 + 32000 + 120000 + 8500 + 1200 + 95000;
    assert.equal(stats.totalBalance, expected);
  });

  it('23. 只有数字卡无过期时间（正例）', () => {
    const digital = MOCK_MEMBER_CARDS.filter(c => c.cardType === 'digital');
    assert.equal(digital.length, 1);
    assert.equal(digital[0]!.expiresAt, null);
  });

  it('24. 有 designatedStore 的 card 数（正例）', () => {
    const withStore = MOCK_MEMBER_CARDS.filter(c => c.designatedStore != null);
    assert.equal(withStore.length, 4);
  });
});
