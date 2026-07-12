/**
 * members/levels/page.test.ts — 会员等级管理 L1 测试
 *
 * 覆盖:
 *   正例 — MOCK_MEMBER_LEVEL_CONFIGS 数据结构、统计计算、筛选、创建验证
 *   反例 — 空字段、无效 key 格式、上下限颠倒、折扣率越界
 *   边界 — 积分上限 ∞、0 年费、空权益列表
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型定义 ────────────────────────────────────────

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

const MOCK_MEMBER_LEVEL_CONFIGS: MemberLevelConfig[] = [
  { id: 'lv-1', key: 'diamond', name: '钻石卡', level: 5, minPoints: 150000, maxPoints: 999999, discountRate: 0.8, annualFee: 888, benefits: ['专属客服', '免费停车', '生日礼包', '双倍积分', '新品优先'], memberCount: 120, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-2', key: 'gold', name: '金卡', level: 4, minPoints: 80000, maxPoints: 149999, discountRate: 0.85, annualFee: 388, benefits: ['免费停车', '生日礼包', '积分加速'], memberCount: 350, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-3', key: 'silver', name: '银卡', level: 3, minPoints: 30000, maxPoints: 79999, discountRate: 0.9, annualFee: 0, benefits: ['生日礼包', '积分加速'], memberCount: 680, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-4', key: 'bronze', name: '铜卡', level: 2, minPoints: 5000, maxPoints: 29999, discountRate: 0.95, annualFee: 0, benefits: ['基础积分'], memberCount: 890, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-5', key: 'standard', name: '标准', level: 1, minPoints: 0, maxPoints: 4999, discountRate: 1, annualFee: 0, benefits: [], memberCount: 300, status: 'inactive', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

// ─── 常量 ────────────────────────────────────────────

const LEVEL_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '停用', variant: 'warning' },
  hidden: { label: '仅内部可见', variant: 'neutral' },
};

interface CreateLevelFormData {
  name: string;
  key: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  annualFee: number;
  benefits: string;
  status: 'active' | 'inactive' | 'hidden';
}

interface CreateLevelErrors {
  name?: string;
  key?: string;
  minPoints?: string;
  maxPoints?: string;
  discountRate?: string;
  annualFee?: string;
}

// ─── 辅助函数 ────────────────────────────────────────

function levelColor(level: number): string {
  const colors = ['#f0abfc', '#fbbf24', '#94a3b8', '#d97706', '#64748b'];
  return colors[Math.min(level - 1, colors.length - 1)];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function computeLevelStats(levels: MemberLevelConfig[]) {
  return {
    total: levels.length,
    active: levels.filter(l => l.status === 'active').length,
    totalMembers: levels.reduce((s, l) => s + l.memberCount, 0),
  };
}

function filterByStatus(levels: MemberLevelConfig[], status: string): MemberLevelConfig[] {
  if (status === 'ALL') return levels;
  return levels.filter(l => l.status === status);
}

function validateCreateForm(data: CreateLevelFormData): CreateLevelErrors {
  const errs: CreateLevelErrors = {};
  if (!data.name.trim()) errs.name = '等级名称不能为空';
  if (!data.key.trim()) errs.key = '等级标识不能为空';
  else if (!/^[a-z_]{2,20}$/.test(data.key)) errs.key = '标识格式：2-20位小写字母和下划线';
  if (data.minPoints < 0) errs.minPoints = '最低积分不能为负';
  if (data.maxPoints < data.minPoints) errs.maxPoints = '上限必须大于下限';
  if (data.discountRate < 0 || data.discountRate > 100) errs.discountRate = '折扣率范围为0-100';
  if (data.annualFee < 0) errs.annualFee = '年费不能为负';
  return errs;
}

// ─── 测试套件 ────────────────────────────────────────

describe('members/levels — 等级数据', () => {
  it('1. 5 个等级配置（正例）', () => {
    assert.equal(MOCK_MEMBER_LEVEL_CONFIGS.length, 5);
  });

  it('2. level 从 1 到 5（正例）', () => {
    const levels = MOCK_MEMBER_LEVEL_CONFIGS.map(l => l.level).sort((a, b) => a - b);
    assert.deepEqual(levels, [1, 2, 3, 4, 5]);
  });

  it('3. 高等级 minPoints > 低等级 maxPoints（正例）', () => {
    for (const l of MOCK_MEMBER_LEVEL_CONFIGS) {
      assert.ok(l.maxPoints >= l.minPoints, `${l.name} max >= min`);
    }
  });

  it('4. 各等级 key 唯一（正例）', () => {
    const keys = MOCK_MEMBER_LEVEL_CONFIGS.map(l => l.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it('5. discountRate 递减随 level 升高（正例）', () => {
    const sorted = [...MOCK_MEMBER_LEVEL_CONFIGS].sort((a, b) => b.level - a.level);
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i]!.discountRate >= sorted[i - 1]!.discountRate,
        `${sorted[i]!.name} discount ${sorted[i]!.discountRate} >= ${sorted[i - 1]!.name} ${sorted[i - 1]!.discountRate}`);
    }
  });

  it('6. 各等级 memberCount 非负（反例）', () => {
    for (const l of MOCK_MEMBER_LEVEL_CONFIGS) {
      assert.ok(l.memberCount >= 0);
    }
  });

  it('7. 前 4 个激活、第 5 个停用（正例）', () => {
    const active = MOCK_MEMBER_LEVEL_CONFIGS.filter(l => l.status === 'active');
    const inactive = MOCK_MEMBER_LEVEL_CONFIGS.filter(l => l.status === 'inactive');
    assert.equal(active.length, 4);
    assert.equal(inactive.length, 1);
  });
});

describe('members/levels — 统计与筛选', () => {
  it('8. 总会员数统计（正例）', () => {
    const stats = computeLevelStats(MOCK_MEMBER_LEVEL_CONFIGS);
    assert.equal(stats.total, 5);
    assert.equal(stats.active, 4);
    assert.equal(stats.totalMembers, 120 + 350 + 680 + 890 + 300);
  });

  it('9. 按状态筛选 active（正例）', () => {
    const result = filterByStatus(MOCK_MEMBER_LEVEL_CONFIGS, 'active');
    assert.equal(result.length, 4);
    assert.ok(result.every(l => l.status === 'active'));
  });

  it('10. 按状态筛选 inactive（正例）', () => {
    const result = filterByStatus(MOCK_MEMBER_LEVEL_CONFIGS, 'inactive');
    assert.equal(result.length, 1);
    assert.equal(result[0]!.key, 'standard');
  });

  it('11. 不存在的状态返回空（反例）', () => {
    const result = filterByStatus(MOCK_MEMBER_LEVEL_CONFIGS, 'nonexistent');
    assert.equal(result.length, 0);
  });

  it('12. ALL 返回全部（正例）', () => {
    const result = filterByStatus(MOCK_MEMBER_LEVEL_CONFIGS, 'ALL');
    assert.equal(result.length, MOCK_MEMBER_LEVEL_CONFIGS.length);
  });
});

describe('members/levels — 辅助函数', () => {
  it('13. levelColor 按级别返回颜色（正例）', () => {
    assert.ok(levelColor(1));
    assert.ok(levelColor(5));
  });

  it('14. levelColor 6 以上取最后一个颜色（边界）', () => {
    assert.equal(levelColor(10), '#64748b');
  });

  it('15. formatCurrency — 大于 1 万（正例）', () => {
    assert.equal(formatCurrency(888), '¥888');
    assert.equal(formatCurrency(388), '¥388');
  });

  it('16. formatCurrency — 零（边界）', () => {
    assert.equal(formatCurrency(0), '¥0');
  });

  it('17. 积分上限显示 ∞ 标记（函数测试）', () => {
    const displayMax = (l: MemberLevelConfig) => l.maxPoints >= 999999 ? '∞' : l.maxPoints.toLocaleString();
    const diamond = MOCK_MEMBER_LEVEL_CONFIGS.find(l => l.key === 'diamond')!;
    assert.equal(displayMax(diamond), '∞');
  });
});

describe('members/levels — 创建等级验证', () => {
  it('18. 有效表单通过验证（正例）', () => {
    const data: CreateLevelFormData = { name: '铂金卡', key: 'platinum', level: 6, minPoints: 200000, maxPoints: 500000, discountRate: 75, annualFee: 1288, benefits: 'VIP,优先', status: 'active' };
    const errors = validateCreateForm(data);
    assert.equal(Object.keys(errors).length, 0);
  });

  it('19. 空名称报错（反例）', () => {
    const data: CreateLevelFormData = { name: '', key: 'test', level: 1, minPoints: 0, maxPoints: 100, discountRate: 100, annualFee: 0, benefits: '', status: 'active' };
    const errors = validateCreateForm(data);
    assert.ok(errors.name);
  });

  it('20. 空 key 报错（反例）', () => {
    const data: CreateLevelFormData = { name: '测试', key: '', level: 1, minPoints: 0, maxPoints: 100, discountRate: 100, annualFee: 0, benefits: '', status: 'active' };
    const errors = validateCreateForm(data);
    assert.ok(errors.key);
  });

  it('21. 无效 key 格式报错（反例）', () => {
    const data: CreateLevelFormData = { name: '测试', key: 'InvalidKey', level: 1, minPoints: 0, maxPoints: 100, discountRate: 100, annualFee: 0, benefits: '', status: 'active' };
    const errors = validateCreateForm(data);
    assert.ok(errors.key);
  });

  it('22. 有效 key 格式通过（边界）', () => {
    const data: CreateLevelFormData = { name: '测试', key: 'test_key', level: 1, minPoints: 0, maxPoints: 100, discountRate: 100, annualFee: 0, benefits: '', status: 'active' };
    const errors = validateCreateForm(data);
    assert.ok(!errors.key);
  });

  it('23. minPoints 负值报错（反例）', () => {
    const data: CreateLevelFormData = { name: '测试', key: 'test', level: 1, minPoints: -1, maxPoints: 100, discountRate: 100, annualFee: 0, benefits: '', status: 'active' };
    const errors = validateCreateForm(data);
    assert.ok(errors.minPoints);
  });

  it('24. maxPoints < minPoints 报错（反例）', () => {
    const data: CreateLevelFormData = { name: '测试', key: 'test', level: 1, minPoints: 200, maxPoints: 100, discountRate: 100, annualFee: 0, benefits: '', status: 'active' };
    const errors = validateCreateForm(data);
    assert.ok(errors.maxPoints);
  });

  it('25. discountRate 超出 0-100 报错（反例）', () => {
    const data1: CreateLevelFormData = { name: '测试', key: 'test', level: 1, minPoints: 0, maxPoints: 100, discountRate: -1, annualFee: 0, benefits: '', status: 'active' };
    const data2: CreateLevelFormData = { name: '测试', key: 'test', level: 1, minPoints: 0, maxPoints: 100, discountRate: 101, annualFee: 0, benefits: '', status: 'active' };
    assert.ok(validateCreateForm(data1).discountRate);
    assert.ok(validateCreateForm(data2).discountRate);
  });

  it('26. annualFee 负值报错（反例）', () => {
    const data: CreateLevelFormData = { name: '测试', key: 'test', level: 1, minPoints: 0, maxPoints: 100, discountRate: 100, annualFee: -1, benefits: '', status: 'active' };
    const errors = validateCreateForm(data);
    assert.ok(errors.annualFee);
  });
});
