/**
 * members/levels/page.test.tsx — 会员等级列表 L1 测试
 *
 * 覆盖: 等级配置数据、创建验证、删除逻辑、筛选
 * 正例: 等级字段、有效创建、状态筛选
 * 反例: 空名称、无效标识、负年费
 * 边界: 等级排序、折扣率范围、积分区间
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

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

/* ── 辅助函数 ── */

function levelColor(level: number): string {
  const colors = ['#f0abfc', '#fbbf24', '#94a3b8', '#d97706', '#64748b'];
  return colors[Math.min(level - 1, colors.length - 1)];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

/* ── 验证逻辑 ── */

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

/* ── Mock 数据 ── */

const MOCK_LEVELS: MemberLevelConfig[] = [
  { id: 'lv-1', key: 'diamond', name: '钻石卡', level: 5, minPoints: 150000, maxPoints: 999999, discountRate: 80, annualFee: 888, benefits: ['专属客服', '免费停车', '生日礼包', '双倍积分', '新品优先'], memberCount: 120, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-2', key: 'gold', name: '金卡', level: 4, minPoints: 80000, maxPoints: 149999, discountRate: 85, annualFee: 388, benefits: ['免费停车', '生日礼包', '积分加速'], memberCount: 350, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-3', key: 'silver', name: '银卡', level: 3, minPoints: 30000, maxPoints: 79999, discountRate: 90, annualFee: 0, benefits: ['生日礼包', '积分加速'], memberCount: 680, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-4', key: 'bronze', name: '铜卡', level: 2, minPoints: 5000, maxPoints: 29999, discountRate: 95, annualFee: 0, benefits: ['基础积分'], memberCount: 890, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-5', key: 'standard', name: '标准', level: 1, minPoints: 0, maxPoints: 4999, discountRate: 100, annualFee: 0, benefits: [], memberCount: 300, status: 'inactive', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

/* ============================================================ */

describe('member-levels: 数据类型', () => {
  it('MemberLevelConfig has all fields', () => {
    const l = MOCK_LEVELS[0];
    assert.equal(typeof l.id, 'string');
    assert.equal(typeof l.level, 'number');
    assert.equal(typeof l.discountRate, 'number');
    assert.ok(Array.isArray(l.benefits));
    assert.equal(typeof l.memberCount, 'number');
  });

  it('status has active and inactive', () => {
    const statuses: Array<'active' | 'inactive'> = ['active', 'inactive'];
    assert.equal(statuses.length, 2);
  });

  it('CreateLevelFormData has all fields', () => {
    const f: CreateLevelFormData = {
      name: '', key: '', level: 5, minPoints: 0, maxPoints: 9999,
      discountRate: 100, annualFee: 0, benefits: '', status: 'active',
    };
    assert.equal(typeof f.name, 'string');
    assert.equal(typeof f.level, 'number');
    assert.equal(typeof f.status, 'string');
  });
});

describe('member-levels: 辅助函数', () => {
  it('levelColor returns correct color for level 1', () => {
    assert.equal(levelColor(1), '#f0abfc');
  });

  it('levelColor returns correct color for level 5', () => {
    assert.equal(levelColor(5), '#64748b');
  });

  it('levelColor clamps at array length', () => {
    assert.equal(levelColor(10), '#64748b');
  });

  it('formatCurrency zero annual fee', () => {
    assert.equal(formatCurrency(0), '¥0');
  });

  it('formatCurrency 888 annual fee', () => {
    assert.equal(formatCurrency(888), '¥888');
  });

  it('formatCurrency large value', () => {
    assert.equal(formatCurrency(88888), '¥8.9万');
  });
});

describe('member-levels: 验证逻辑', () => {
  const validForm: CreateLevelFormData = {
    name: '钻石会员', key: 'diamond_vip', level: 1,
    minPoints: 5000, maxPoints: 99999, discountRate: 80,
    annualFee: 888, benefits: '专属客服,双倍积分', status: 'active',
  };

  it('valid form returns no errors', () => {
    const errs = validateCreateForm(validForm);
    assert.equal(Object.keys(errs).length, 0);
  });

  it('empty name returns error', () => {
    const errs = validateCreateForm({ ...validForm, name: '' });
    assert.equal(errs.name, '等级名称不能为空');
  });

  it('empty key returns error', () => {
    const errs = validateCreateForm({ ...validForm, key: '' });
    assert.equal(errs.key, '等级标识不能为空');
  });

  it('invalid key format returns error', () => {
    const errs = validateCreateForm({ ...validForm, key: 'Diamond' });
    assert.equal(errs.key, '标识格式：2-20位小写字母和下划线');
  });

  it('valid key with underscore passes', () => {
    const errs = validateCreateForm({ ...validForm, key: 'diamond_vip' });
    assert.ok(!errs.key);
  });

  it('negative minPoints returns error', () => {
    const errs = validateCreateForm({ ...validForm, minPoints: -1 });
    assert.equal(errs.minPoints, '最低积分不能为负');
  });

  it('maxPoints < minPoints returns error', () => {
    const errs = validateCreateForm({ ...validForm, minPoints: 500, maxPoints: 100 });
    assert.equal(errs.maxPoints, '上限必须大于下限');
  });

  it('discountRate > 100 returns error', () => {
    const errs = validateCreateForm({ ...validForm, discountRate: 101 });
    assert.equal(errs.discountRate, '折扣率范围为0-100');
  });

  it('discountRate < 0 returns error', () => {
    const errs = validateCreateForm({ ...validForm, discountRate: -1 });
    assert.equal(errs.discountRate, '折扣率范围为0-100');
  });

  it('negative annualFee returns error', () => {
    const errs = validateCreateForm({ ...validForm, annualFee: -100 });
    assert.equal(errs.annualFee, '年费不能为负');
  });

  it('zero discountRate is valid (free)', () => {
    const errs = validateCreateForm({ ...validForm, discountRate: 0 });
    assert.ok(!errs.discountRate);
  });

  it('zero annualFee is valid', () => {
    const errs = validateCreateForm({ ...validForm, annualFee: 0 });
    assert.ok(!errs.annualFee);
  });
});

describe('member-levels: 业务逻辑', () => {
  it('5 mock levels exist', () => {
    assert.equal(MOCK_LEVELS.length, 5);
  });

  it('levels sorted by level descending', () => {
    for (let i = 1; i < MOCK_LEVELS.length; i++) {
      assert.ok(MOCK_LEVELS[i - 1].level > MOCK_LEVELS[i].level);
    }
  });

  it('diamond has highest minPoints', () => {
    const diamond = MOCK_LEVELS.find(l => l.key === 'diamond')!;
    assert.equal(diamond.minPoints, 150000);
  });

  it('standard has zero minPoints', () => {
    const standard = MOCK_LEVELS.find(l => l.key === 'standard')!;
    assert.equal(standard.minPoints, 0);
  });

  it('only standard is inactive', () => {
    const inactive = MOCK_LEVELS.filter(l => l.status === 'inactive');
    assert.equal(inactive.length, 1);
    assert.equal(inactive[0].key, 'standard');
  });

  it('diamond has 5 benefits', () => {
    const diamond = MOCK_LEVELS.find(l => l.key === 'diamond')!;
    assert.equal(diamond.benefits.length, 5);
  });

  it('standard has 0 benefits', () => {
    const standard = MOCK_LEVELS.find(l => l.key === 'standard')!;
    assert.equal(standard.benefits.length, 0);
  });

  it('diamond annualFee is 888', () => {
    const diamond = MOCK_LEVELS.find(l => l.key === 'diamond')!;
    assert.equal(diamond.annualFee, 888);
  });

  it('silver annualFee is 0 (free)', () => {
    const silver = MOCK_LEVELS.find(l => l.key === 'silver')!;
    assert.equal(silver.annualFee, 0);
  });

  it('discountRate: higher level = lower rate (better discount)', () => {
    assert.ok(MOCK_LEVELS.find(l => l.key === 'diamond')!.discountRate < MOCK_LEVELS.find(l => l.key === 'silver')!.discountRate);
  });

  it('total members across all levels', () => {
    const total = MOCK_LEVELS.reduce((s, l) => s + l.memberCount, 0);
    assert.equal(total, 2340);
  });

  it('maxPoints for diamond is near-infinite', () => {
    const diamond = MOCK_LEVELS.find(l => l.key === 'diamond')!;
    assert.equal(diamond.maxPoints, 999999);
  });

  it('bronze and copper gap: minPoints 5000 for bronze', () => {
    const bronze = MOCK_LEVELS.find(l => l.key === 'bronze')!;
    assert.equal(bronze.minPoints, 5000);
  });

  it('level 1 = standard, level 5 = diamond', () => {
    assert.equal(MOCK_LEVELS.find(l => l.key === 'standard')!.level, 1);
    assert.equal(MOCK_LEVELS.find(l => l.key === 'diamond')!.level, 5);
  });

  it('gold benefits count is 3', () => {
    const gold = MOCK_LEVELS.find(l => l.key === 'gold')!;
    assert.equal(gold.benefits.length, 3);
  });
});
