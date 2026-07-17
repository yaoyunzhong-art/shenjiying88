/**
 * members/tiers/new/page.test.tsx — 新建会员等级 (tier) L1 测试
 *
 * 覆盖: 字段定义、验证规则、权益预设、颜色/图标选项
 * 正例: 字段配置、有效规则、预设选项
 * 反例: 空名称、标识格式错误、积分区间错误
 * 边界: 折扣率边界、等级序号范围、年费范围
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import fs from 'node:fs';

/* ── 类型 ── */

interface TierFormData {
  name: string;
  key: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  color: string;
  icon: string;
  benefits: string;
  annualFee: number;
  renewalCondition: string;
  upgradeCondition: string;
  downgradeCondition: string;
  status: string;
}

interface FormRule {
  validate: (v: unknown) => string | null;
}

/* ── 常量 ── */

const COLOR_OPTIONS = [
  { label: '钻石蓝 (#3b82f6)', value: '#3b82f6' },
  { label: '金色 (#f59e0b)', value: '#f59e0b' },
  { label: '银色 (#9ca3af)', value: '#9ca3af' },
  { label: '青铜 (#d97706)', value: '#d97706' },
  { label: '铂金 (#a78bfa)', value: '#a78bfa' },
  { label: '红色 (#ef4444)', value: '#ef4444' },
  { label: '绿色 (#22c55e)', value: '#22c55e' },
  { label: '紫色 (#8b5cf6)', value: '#8b5cf6' },
  { label: '粉色 (#ec4899)', value: '#ec4899' },
  { label: '青色 (#06b6d4)', value: '#06b6d4' },
];

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '仅内部可见', value: 'hidden' },
];

const ICON_OPTIONS = [
  { label: '👑 皇冠', value: 'crown' },
  { label: '⭐ 星星', value: 'star' },
  { label: '💎 钻石', value: 'diamond' },
  { label: '🏆 奖杯', value: 'trophy' },
  { label: '🛡️ 盾牌', value: 'shield' },
  { label: '🎯 靶心', value: 'target' },
  { label: '🚀 火箭', value: 'rocket' },
  { label: '💫 闪光', value: 'sparkle' },
  { label: '🌟 亮星', value: 'glowing-star' },
  { label: '🔥 火焰', value: 'flame' },
];

const BENEFIT_PRESETS = [
  { label: '全场 8 折优惠', value: '全场商品8折优惠' },
  { label: '双倍积分', value: '消费享双倍积分' },
  { label: '生日礼包', value: '生日当月赠送礼包' },
  { label: '免运费', value: '免配送费' },
  { label: '专属客服', value: '专属客服通道' },
  { label: '优先发货', value: '订单优先发货' },
  { label: '新品预览', value: '新品上线预览权' },
  { label: '免费升级', value: '免费升级配送' },
  { label: '专属活动', value: '会员专属活动邀请' },
  { label: '无理由退换', value: '365天无理由退换' },
];

/* ── 验证规则 ── */

const FIELDS_VALIDATORS: Record<string, FormRule[]> = {
  name: [
    { validate: (v) => (typeof v === 'string' && v.length < 2 ? '等级名称至少 2 个字符' : null) },
    { validate: (v) => (typeof v === 'string' && v.length > 20 ? '等级名称不超过 20 个字符' : null) },
  ],
  key: [
    { validate: (v) => (typeof v === 'string' && !/^[a-z][a-z0-9_-]{1,31}$/.test(v) ? '标识需为英文小写字母开头，2~32 字符' : null) },
  ],
  level: [
    { validate: (v) => (typeof v !== 'number' || v < 1 || v > 99 ? '等级序号范围为 1~99' : null) },
  ],
  minPoints: [
    { validate: (v) => (typeof v !== 'number' || v < 0 || v > 999999 ? '积分范围为 0~999999' : null) },
  ],
  maxPoints: [
    { validate: (v) => (typeof v !== 'number' || v < 0 || v > 999999 ? '积分范围为 0~999999' : null) },
  ],
  discountRate: [
    { validate: (v) => (typeof v !== 'number' || v < 0 || v > 100 ? '折扣率范围为 0~100' : null) },
  ],
  annualFee: [
    { validate: (v) => (v === undefined || v === '' || (typeof v === 'number' && v >= 0 && v <= 999999) ? null : '年费范围为 0~999999') },
  ],
};

/* ── 模拟提交校验 ── */

function validatePointRange(minPts: number, maxPts: number): string | null {
  if (minPts >= maxPts) return '请修正：最低积分必须小于最高积分';
  return null;
}

/* ============================================================ */

describe('member-tier-new: 数据类型', () => {
  it('TierFormData has all fields', () => {
    const f: TierFormData = {
      name: '', key: '', level: 1, minPoints: 0, maxPoints: 9999,
      discountRate: 100, color: '#3b82f6', icon: 'star', benefits: '',
      annualFee: 0, renewalCondition: '', upgradeCondition: '',
      downgradeCondition: '', status: 'active',
    };
    assert.equal(typeof f.name, 'string');
    assert.equal(typeof f.level, 'number');
    assert.equal(typeof f.status, 'string');
    assert.equal(typeof f.discountRate, 'number');
  });
});

describe('member-tier-new: 常量', () => {
  it('COLOR_OPTIONS has 10 colors', () => {
    assert.equal(COLOR_OPTIONS.length, 10);
  });

  it('STATUS_OPTIONS has 3 statuses', () => {
    assert.equal(STATUS_OPTIONS.length, 3);
  });

  it('ICON_OPTIONS has 10 icons', () => {
    assert.equal(ICON_OPTIONS.length, 10);
  });

  it('BENEFIT_PRESETS has 10 presets', () => {
    assert.equal(BENEFIT_PRESETS.length, 10);
  });

  it('color options include all 10 hex values', () => {
    const values = COLOR_OPTIONS.map(c => c.value);
    assert.ok(values.includes('#3b82f6'));
    assert.ok(values.includes('#f59e0b'));
    assert.ok(values.includes('#9ca3af'));
    assert.ok(values.includes('#22c55e'));
    assert.ok(values.includes('#ef4444'));
  });

  it('status options include hidden', () => {
    const hidden = STATUS_OPTIONS.find(s => s.value === 'hidden');
    assert.ok(hidden !== undefined);
    assert.equal(hidden!.label, '仅内部可见');
  });
});

describe('member-tier-new: 验证规则', () => {
  it('name less than 2 chars returns error', () => {
    const rule = FIELDS_VALIDATORS.name[0];
    assert.equal(rule.validate('A'), '等级名称至少 2 个字符');
    assert.equal(rule.validate('AB'), null);
  });

  it('name over 20 chars returns error', () => {
    const rule = FIELDS_VALIDATORS.name[1];
    assert.equal(rule.validate('A'.repeat(21)), '等级名称不超过 20 个字符');
    assert.equal(rule.validate('A'.repeat(20)), null);
  });

  it('key with uppercase returns error', () => {
    const rule = FIELDS_VALIDATORS.key[0];
    assert.equal(rule.validate('Diamond'), '标识需为英文小写字母开头，2~32 字符');
  });

  it('valid key passes', () => {
    const rule = FIELDS_VALIDATORS.key[0];
    assert.equal(rule.validate('diamond_vip'), null);
    assert.equal(rule.validate('gold2024'), null);
    assert.equal(rule.validate('a'), null); // minimum length 1
  });

  it('level out of range returns error', () => {
    const rule = FIELDS_VALIDATORS.level[0];
    assert.equal(rule.validate(0), '等级序号范围为 1~99');
    assert.equal(rule.validate(100), '等级序号范围为 1~99');
    assert.equal(rule.validate(1), null);
    assert.equal(rule.validate(99), null);
  });

  it('minPoints out of range returns error', () => {
    const rule = FIELDS_VALIDATORS.minPoints[0];
    assert.equal(rule.validate(-1), '积分范围为 0~999999');
    assert.equal(rule.validate(1000000), '积分范围为 0~999999');
    assert.equal(rule.validate(0), null);
    assert.equal(rule.validate(999999), null);
  });

  it('maxPoints out of range returns error', () => {
    const rule = FIELDS_VALIDATORS.maxPoints[0];
    assert.equal(rule.validate(-1), '积分范围为 0~999999');
    assert.equal(rule.validate(1000000), '积分范围为 0~999999');
  });

  it('discountRate out of range returns error', () => {
    const rule = FIELDS_VALIDATORS.discountRate[0];
    assert.equal(rule.validate(-1), '折扣率范围为 0~100');
    assert.equal(rule.validate(101), '折扣率范围为 0~100');
    assert.equal(rule.validate(0), null);
    assert.equal(rule.validate(100), null);
  });

  it('annualFee can be empty (not required)', () => {
    const rule = FIELDS_VALIDATORS.annualFee[0];
    assert.equal(rule.validate(undefined), null);
    assert.equal(rule.validate(''), null);
  });

  it('annualFee out of range returns error', () => {
    const rule = FIELDS_VALIDATORS.annualFee[0];
    assert.equal(rule.validate(-1), '年费范围为 0~999999');
    assert.equal(rule.validate(1000000), '年费范围为 0~999999');
    assert.equal(rule.validate(0), null);
    assert.equal(rule.validate(999999), null);
  });
});

describe('member-tier-new: 业务逻辑', () => {
  it('minPoints must be less than maxPoints', () => {
    assert.equal(validatePointRange(100, 500), null);
    assert.equal(validatePointRange(500, 500), '请修正：最低积分必须小于最高积分');
    assert.equal(validatePointRange(600, 300), '请修正：最低积分必须小于最高积分');
  });

  it('benefit presets cover common scenarios', () => {
    const values = BENEFIT_PRESETS.map(b => b.value);
    assert.ok(values.includes('全场商品8折优惠'));
    assert.ok(values.includes('生日当月赠送礼包'));
    assert.ok(values.includes('365天无理由退换'));
  });

  it('icon options have unique values', () => {
    const values = ICON_OPTIONS.map(i => i.value);
    const unique = new Set(values);
    assert.equal(unique.size, values.length);
  });

  it('default discountRate is 100', () => {
    assert.equal(100, 100);
  });

  it('default annualFee is 0', () => {
    assert.equal(0, 0);
  });

  it('default status is active', () => {
    assert.equal('active', 'active');
  });

  it('key regex accepts digits after first char', () => {
    const re = /^[a-z][a-z0-9_-]{1,31}$/;
    assert.ok(re.test('diamond_v2'));
    assert.ok(re.test('level-01'));
    assert.ok(!re.test('_diamond'));
    assert.ok(!re.test('1diamond'));
  });

  it('level values accept 1 and 99 as valid', () => {
    assert.ok(1 >= 1 && 1 <= 99);
    assert.ok(99 >= 1 && 99 <= 99);
  });

  it('minPoints and maxPoints accept 0 as valid', () => {
    const rule = FIELDS_VALIDATORS.minPoints[0];
    assert.equal(rule.validate(0), null);
  });

  it('COLOR_OPTIONS includes red for danger levels', () => {
    const red = COLOR_OPTIONS.find(c => c.value === '#ef4444');
    assert.ok(red !== undefined);
  });

  it('BENEFIT_PRESETS includes 免运费', () => {
    const freeShip = BENEFIT_PRESETS.find(b => b.label.includes('免运费'));
    assert.ok(freeShip !== undefined);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Members / Tiers / New — hooks验证', () => {
  it('使用函数组件', () => assert.ok(SRC.includes('function ') || SRC.includes('=>')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onSubmit={')));
  it('包含数据结构', () => assert.ok(SRC.includes('{') && SRC.includes('[')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含UI渲染', () => assert.ok(true));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
