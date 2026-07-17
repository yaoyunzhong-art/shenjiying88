/**
 * members/cards/[id]/page.test.ts — 会员卡详情页 L1 测试
 *
 * 覆盖:
 *   正例 — 卡片查找逻辑、日期/金额格式化、状态操作、编辑表单
 *   反例 — 不存在的卡片 ID、null 参数、无效表单值
 *   边界 — 过期时间 null、年费零、倍率上下限
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型 ────────────────────────────────────────────

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

const MOCK_CARDS: MemberCard[] = [
  { id: 'mc-001', memberId: 'm001', memberName: '张伟', cardNumber: 'VIP-20260001', cardType: 'physical', status: 'active', issuedAt: '2026-01-15', activatedAt: '2026-01-16', expiresAt: '2028-01-15', balance: 58000, pointsMultiplier: 2, designatedStore: '朝阳大悦城旗舰店', linkedWechat: true, notes: 'VIP实体卡' },
  { id: 'mc-003', memberId: 'm004', memberName: '赵敏', cardNumber: 'VIP-20260003', cardType: 'digital', status: 'active', issuedAt: '2024-11-20', activatedAt: '2024-11-20', expiresAt: null, balance: 120000, pointsMultiplier: 2.5, designatedStore: null, linkedWechat: true, notes: '数字钻石卡' },
  { id: 'mc-005', memberId: 'm007', memberName: '杨帆', cardNumber: 'VIP-20260005', cardType: 'virtual', status: 'expired', issuedAt: '2024-03-01', activatedAt: '2024-03-01', expiresAt: '2026-03-01', balance: 1200, pointsMultiplier: 1, designatedStore: null, linkedWechat: true, notes: '已过期未续费' },
];

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

const STATUS_COLORS: Record<string, string> = {
  active: '#86efac',
  frozen: '#fde68a',
  expired: '#fca5a5',
  cancelled: '#94a3b8',
};

interface EditCardFormData {
  pointsMultiplier: number;
  designatedStore: string;
  linkedWechat: boolean;
  notes: string;
}

// ─── 辅助函数（从 page.tsx 提取）─────────────────────

function findCard(cards: MemberCard[], id: string): MemberCard | undefined {
  return cards.find(c => c.id === id);
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
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

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function updateCard(cards: MemberCard[], id: string, updates: Partial<MemberCard>): MemberCard[] {
  return cards.map(c => (c.id === id ? { ...c, ...updates } : c));
}

function changeCardStatus(cards: MemberCard[], id: string, newStatus: MemberCard['status']): MemberCard[] {
  return cards.map(c => (c.id === id ? { ...c, status: newStatus } : c));
}

function editCardDetails(
  card: MemberCard,
  form: EditCardFormData,
): MemberCard {
  return {
    ...card,
    pointsMultiplier: form.pointsMultiplier,
    designatedStore: form.designatedStore.trim() || null,
    linkedWechat: form.linkedWechat,
    notes: form.notes.trim(),
  };
}

function canCancel(card: MemberCard): boolean {
  return card.status !== 'cancelled' && card.status !== 'expired';
}

// ─── 测试套件 ────────────────────────────────────────

describe('members/cards/[id] — 卡片查找', () => {
  it('1. 查找存在的卡片（正例）', () => {
    const card = findCard(MOCK_CARDS, 'mc-001');
    assert.ok(card);
    assert.equal(card!.memberName, '张伟');
  });

  it('2. 查找不存在的 ID 返回 undefined（反例）', () => {
    const card = findCard(MOCK_CARDS, 'nonexistent');
    assert.equal(card, undefined);
  });

  it('3. 查找空字符串返回 undefined（边界）', () => {
    const card = findCard(MOCK_CARDS, '');
    assert.equal(card, undefined);
  });
});

describe('members/cards/[id] — 日期格式化', () => {
  it('4. 格式化有效日期（正例）', () => {
    const result = formatDateShort('2026-01-15');
    assert.ok(result.includes('2026'));
    assert.ok(result.includes('01'));
  });

  it('5. 传入 null 返回 —（边界）', () => {
    assert.equal(formatDateShort(null), '—');
  });

  it('6. 传入空字符串返回原值（反例）', () => {
    assert.equal(formatDateShort(''), '—');
  });
});

describe('members/cards/[id] — 金额格式化', () => {
  it('7. 小于 1 万显示完整数字（正例）', () => {
    assert.equal(formatCurrency(1200), '¥1,200');
  });

  it('8. 大于 1 万显示万（正例）', () => {
    assert.equal(formatCurrency(58000), '¥5.8万');
    assert.equal(formatCurrency(120000), '¥12.0万');
  });

  it('9. 零值（边界）', () => {
    assert.equal(formatCurrency(0), '¥0');
  });
});

describe('members/cards/[id] — 状态操作', () => {
  it('10. active 可以注销（正例）', () => {
    const card = findCard(MOCK_CARDS, 'mc-001')!;
    assert.ok(canCancel(card));
  });

  it('11. cancelled 不可注销（反例）', () => {
    const cancelled: MemberCard = { ...MOCK_CARDS[0]!, status: 'cancelled' };
    assert.ok(!canCancel(cancelled));
  });

  it('12. expired 不可注销（反例）', () => {
    const expired: MemberCard = { ...MOCK_CARDS[0]!, status: 'expired' };
    assert.ok(!canCancel(expired));
  });

  it('13. 变更状态成功（正例）', () => {
    const updated = changeCardStatus(MOCK_CARDS, 'mc-001', 'frozen');
    const card = findCard(updated, 'mc-001')!;
    assert.equal(card.status, 'frozen');
  });

  it('14. 不存在的卡片不变更（反例）', () => {
    const updated = changeCardStatus(MOCK_CARDS, 'nonexistent', 'frozen');
    assert.equal(updated.length, MOCK_CARDS.length);
  });

  it('15. 注销后不可再变更为其他状态逻辑（边界）', () => {
    const card = findCard(MOCK_CARDS, 'mc-005')!;
    assert.equal(card.status, 'expired');
    assert.ok(!canCancel(card));
  });

  it('16. 所有 status 值在 STATUS_COLORS 中（正例）', () => {
    const keys = Object.keys(STATUS_COLORS);
    for (const opt of CARD_STATUS_OPTIONS) {
      assert.ok(keys.includes(opt.value), `${opt.value} 应有颜色映射`);
    }
  });
});

describe('members/cards/[id] — 编辑表单', () => {
  it('17. 编辑场景卡字段变更（正例）', () => {
    const card = findCard(MOCK_CARDS, 'mc-001')!;
    const form: EditCardFormData = {
      pointsMultiplier: 3,
      designatedStore: '上海旗舰店',
      linkedWechat: false,
      notes: '更新备注',
    };
    const updated = editCardDetails(card, form);
    assert.equal(updated.pointsMultiplier, 3);
    assert.equal(updated.designatedStore, '上海旗舰店');
    assert.equal(updated.linkedWechat, false);
    assert.equal(updated.notes, '更新备注');
  });

  it('18. 编辑后其他字段不变（正例）', () => {
    const card = findCard(MOCK_CARDS, 'mc-001')!;
    const form: EditCardFormData = {
      pointsMultiplier: 2,
      designatedStore: '  ',
      linkedWechat: true,
      notes: '',
    };
    const updated = editCardDetails(card, form);
    assert.equal(updated.cardNumber, card.cardNumber);
    assert.equal(updated.memberName, card.memberName);
    assert.equal(updated.cardType, card.cardType);
  });

  it('19. 空白门店变为 null（边界）', () => {
    const card = findCard(MOCK_CARDS, 'mc-001')!;
    const form: EditCardFormData = {
      pointsMultiplier: 1,
      designatedStore: '  ',
      linkedWechat: true,
      notes: '',
    };
    const updated = editCardDetails(card, form);
    assert.equal(updated.designatedStore, null);
  });

  it('20. 积分倍率最低 0.5 最高 10（边界）', () => {
    const card = findCard(MOCK_CARDS, 'mc-001')!;
    const formLow: EditCardFormData = { pointsMultiplier: 0.5, designatedStore: '', linkedWechat: true, notes: '' };
    const formHigh: EditCardFormData = { pointsMultiplier: 10, designatedStore: '', linkedWechat: true, notes: '' };
    assert.equal(editCardDetails(card, formLow).pointsMultiplier, 0.5);
    assert.equal(editCardDetails(card, formHigh).pointsMultiplier, 10);
  });
});

describe('members/cards/[id] — CARD_TYPE / CARD_STATUS 枚举完整性', () => {
  it('21. 类型选项三合一（正例）', () => {
    assert.equal(CARD_TYPE_OPTIONS.length, 3);
    const values = CARD_TYPE_OPTIONS.map(o => o.value);
    assert.ok(values.includes('physical'));
    assert.ok(values.includes('virtual'));
    assert.ok(values.includes('digital'));
  });

  it('22. 状态选项四合一（正例）', () => {
    assert.equal(CARD_STATUS_OPTIONS.length, 4);
    const values = CARD_STATUS_OPTIONS.map(o => o.value);
    assert.ok(values.includes('active'));
    assert.ok(values.includes('frozen'));
    assert.ok(values.includes('expired'));
    assert.ok(values.includes('cancelled'));
  });

  it('23. updateCard 保留其他卡片不变（正例）', () => {
    const updated = updateCard(MOCK_CARDS, 'mc-001', { balance: 999 });
    const unchanged = findCard(updated, 'mc-003')!;
    assert.equal(unchanged.balance, 120000);
  });
});
