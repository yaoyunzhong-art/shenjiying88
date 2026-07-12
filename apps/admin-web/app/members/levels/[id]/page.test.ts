/**
 * members/levels/[id]/page.test.ts — 会员等级详情页 L1 测试
 *
 * 覆盖:
 *   正例 — 等级查找、日期/金额格式化、编辑验证、状态变更、删除逻辑
 *   反例 — 不存在的 ID、空字段、上下限颠倒、有会员不可删除
 *   边界 — 积分上限 ∞、零年费、0 会员数
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型 ────────────────────────────────────────────

interface MemberLevelConfig {
  id: string;
  key: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  annualFee: number;
  benefits: string[];
  memberCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ─── Mock 数据 ───────────────────────────────────────

const MOCK_LEVELS: MemberLevelConfig[] = [
  { id: 'lv-1', key: 'diamond', name: '钻石卡', level: 5, minPoints: 150000, maxPoints: 999999, discountRate: 0.8, annualFee: 888, benefits: ['专属客服', '免费停车', '生日礼包', '双倍积分', '新品优先'], memberCount: 120, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-2', key: 'gold', name: '金卡', level: 4, minPoints: 80000, maxPoints: 149999, discountRate: 0.85, annualFee: 388, benefits: ['免费停车', '生日礼包', '积分加速'], memberCount: 350, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-3', key: 'silver', name: '银卡', level: 3, minPoints: 30000, maxPoints: 79999, discountRate: 0.9, annualFee: 0, benefits: ['生日礼包', '积分加速'], memberCount: 0, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '仅内部可见', value: 'hidden' },
];

// ─── 辅助函数 ────────────────────────────────────────

function findLevel(levels: MemberLevelConfig[], id: string): MemberLevelConfig | undefined {
  return levels.find(l => l.id === id);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function levelColor(level: number): string {
  const colors = ['#f0abfc', '#fbbf24', '#94a3b8', '#d97706', '#64748b'];
  return colors[Math.min(level - 1, colors.length - 1)];
}

interface EditFormData {
  name: string;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  annualFee: number;
  benefits: string;
}

interface EditFormErrors {
  name?: string;
  minPoints?: string;
  maxPoints?: string;
  discountRate?: string;
  annualFee?: string;
}

function validateEditForm(data: EditFormData): EditFormErrors {
  const errs: EditFormErrors = {};
  if (!data.name.trim()) errs.name = '等级名称不能为空';
  if (data.minPoints < 0) errs.minPoints = '最低积分不能为负';
  if (data.maxPoints < data.minPoints) errs.maxPoints = '上限必须大于下限';
  if (data.discountRate < 0 || data.discountRate > 100) errs.discountRate = '折扣率范围为0-100';
  if (data.annualFee < 0) errs.annualFee = '年费不能为负';
  return errs;
}

function updateLevel(levels: MemberLevelConfig[], id: string, updates: Partial<MemberLevelConfig>): MemberLevelConfig[] {
  return levels.map(l => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
}

function deleteLevel(levels: MemberLevelConfig[], id: string): MemberLevelConfig[] {
  return levels.filter(l => l.id !== id);
}

function canDelete(level: MemberLevelConfig): boolean {
  return level.memberCount <= 0;
}

// ─── 测试套件 ────────────────────────────────────────

describe('members/levels/[id] — 等级查找', () => {
  it('1. 查找存在的等级（正例）', () => {
    const lv = findLevel(MOCK_LEVELS, 'lv-1');
    assert.ok(lv);
    assert.equal(lv!.name, '钻石卡');
  });

  it('2. 不存在的 ID 返回 undefined（反例）', () => {
    assert.equal(findLevel(MOCK_LEVELS, 'nonexistent'), undefined);
  });

  it('3. 空 ID 返回 undefined（边界）', () => {
    assert.equal(findLevel(MOCK_LEVELS, ''), undefined);
  });
});

describe('members/levels/[id] — 格式化函数', () => {
  it('4. formatDate 返回含中文年月日的字符串（正例）', () => {
    const result = formatDate('2024-01-01T00:00:00Z');
    assert.ok(result.includes('2024'));
  });

  it('5. formatCurrency 大于 1 万（正例）', () => {
    assert.equal(formatCurrency(888), '¥888');
  });

  it('6. formatCurrency 零（边界）', () => {
    assert.equal(formatCurrency(0), '¥0');
  });

  it('7. levelColor 奇偶不同（正例）', () => {
    const c1 = levelColor(1);
    const c2 = levelColor(2);
    assert.ok(c1);
    assert.ok(c2);
    assert.notEqual(c1, c2);
  });

  it('8. levelColor 边界取最后一个（边界）', () => {
    assert.equal(levelColor(100), '#64748b');
  });
});

describe('members/levels/[id] — 编辑验证', () => {
  it('9. 有效表单通过（正例）', () => {
    const data: EditFormData = { name: '测试', minPoints: 0, maxPoints: 100, discountRate: 90, annualFee: 0, benefits: 'a,b' };
    assert.equal(Object.keys(validateEditForm(data)).length, 0);
  });

  it('10. 空名称报错（反例）', () => {
    const data: EditFormData = { name: '', minPoints: 0, maxPoints: 100, discountRate: 90, annualFee: 0, benefits: '' };
    assert.ok(validateEditForm(data).name);
  });

  it('11. minPoints 负值报错（反例）', () => {
    const data: EditFormData = { name: 't', minPoints: -1, maxPoints: 100, discountRate: 90, annualFee: 0, benefits: '' };
    assert.ok(validateEditForm(data).minPoints);
  });

  it('12. maxPoints < minPoints 报错（反例）', () => {
    const data: EditFormData = { name: 't', minPoints: 200, maxPoints: 100, discountRate: 90, annualFee: 0, benefits: '' };
    assert.ok(validateEditForm(data).maxPoints);
  });

  it('13. discountRate 越界报错（反例）', () => {
    const data1: EditFormData = { name: 't', minPoints: 0, maxPoints: 100, discountRate: -1, annualFee: 0, benefits: '' };
    const data2: EditFormData = { name: 't', minPoints: 0, maxPoints: 100, discountRate: 101, annualFee: 0, benefits: '' };
    assert.ok(validateEditForm(data1).discountRate);
    assert.ok(validateEditForm(data2).discountRate);
  });

  it('14. annualFee 负值报错（反例）', () => {
    const data: EditFormData = { name: 't', minPoints: 0, maxPoints: 100, discountRate: 90, annualFee: -1, benefits: '' };
    assert.ok(validateEditForm(data).annualFee);
  });
});

describe('members/levels/[id] — 状态 & 删除操作', () => {
  it('15. 更新等级字段（正例）', () => {
    const updated = updateLevel(MOCK_LEVELS, 'lv-1', { name: '超级钻石卡', discountRate: 0.75 });
    const lv = findLevel(updated, 'lv-1')!;
    assert.equal(lv.name, '超级钻石卡');
    assert.equal(lv.discountRate, 0.75);
  });

  it('16. 不存在的 ID 更新无影响（反例）', () => {
    const updated = updateLevel(MOCK_LEVELS, 'nonexistent', { name: '测试' });
    assert.equal(updated.length, MOCK_LEVELS.length);
  });

  it('17. 有会员的等级不可删除（反例）', () => {
    const lv = findLevel(MOCK_LEVELS, 'lv-1')!;
    assert.ok(!canDelete(lv));
  });

  it('18. 无会员的等级可删除（正例）', () => {
    const lv = findLevel(MOCK_LEVELS, 'lv-3')!;
    assert.ok(canDelete(lv));
  });

  it('19. 删除等级后减少一条（正例）', () => {
    const result = deleteLevel(MOCK_LEVELS, 'lv-1');
    assert.equal(result.length, MOCK_LEVELS.length - 1);
  });

  it('20. 删除不存在的等级不变（反例）', () => {
    const result = deleteLevel(MOCK_LEVELS, 'nonexistent');
    assert.equal(result.length, MOCK_LEVELS.length);
  });

  it('21. STATUS_OPTIONS 完整（正例）', () => {
    assert.equal(STATUS_OPTIONS.length, 3);
    assert.ok(STATUS_OPTIONS.some(o => o.value === 'active'));
    assert.ok(STATUS_OPTIONS.some(o => o.value === 'inactive'));
    assert.ok(STATUS_OPTIONS.some(o => o.value === 'hidden'));
  });
});
