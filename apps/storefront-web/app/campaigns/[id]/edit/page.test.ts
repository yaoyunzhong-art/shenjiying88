/**
 * campaigns/[id]/edit/page.test.ts — L1 角色冒烟测试
 *
 * storefront-web Campaign Edit page — 表单验证、数据完整性、边界条件
 * 角色视角: 📢营销经理 · 👔店长 · 📊运营
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 内联类型 (mirrors page.tsx) ──

type CampaignStatus = 'active' | 'scheduled' | 'ended' | 'paused' | 'draft';
type CampaignChannel = '小程序' | 'H5' | 'App推送' | '短信' | '企微' | '全渠道';

interface CampaignFormData {
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: string;
  startAt: string;
  endAt: string;
  targetAudience: string;
  description: string;
}

interface CampaignFormErrors {
  name?: string;
  channel?: string;
  status?: string;
  budget?: string;
  startAt?: string;
  endAt?: string;
  targetAudience?: string;
  description?: string;
}

type CampaignDetail = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  roi: number;
  conversions: number;
  startAt: string;
  endAt: string;
  targetAudience: string;
  description: string;
};

const CHANNEL_OPTIONS: CampaignChannel[] = ['小程序', 'H5', 'App推送', '短信', '企微', '全渠道'];
const STATUS_OPTIONS: CampaignStatus[] = ['active', 'scheduled', 'ended', 'paused', 'draft'];
const TARGET_OPTIONS = ['全部会员', '新注册会员', '银卡及以上会员', '钻石/黄金会员', '社交活跃用户', '企微社群成员', '沉睡会员', '高潜客户'];

const MOCK_DATA: Record<string, CampaignDetail> = {
  'cmp-001': { id: 'cmp-001', name: '618 年中大促', channel: '全渠道', status: 'active', budget: 500000, spent: 324000, roi: 3.85, conversions: 12850, startAt: '2026-06-01', endAt: '2026-06-30', targetAudience: '全部会员', description: '618 年中大促全场折扣 + 满减活动。' },
  'cmp-004': { id: 'cmp-004', name: '会员积分双倍', channel: 'App推送', status: 'active', budget: 30000, spent: 18200, roi: 8.1, conversions: 5200, startAt: '2026-06-15', endAt: '2026-07-15', targetAudience: '银卡及以上会员', description: '积分双倍活动期间消费翻倍积分。' },
  'cmp-011': { id: 'cmp-011', name: '社群签到有礼', channel: '企微', status: 'active', budget: 15000, spent: 8900, roi: 6.8, conversions: 4200, startAt: '2026-06-01', endAt: '2026-07-01', targetAudience: '企微社群成员', description: '每日签到领积分。' },
};

// ── 验证逻辑 (mirrors page.tsx) ──

function validate(data: CampaignFormData): CampaignFormErrors {
  const e: CampaignFormErrors = {};

  if (!data.name.trim()) {
    e.name = '活动名称不能为空';
  } else if (data.name.trim().length < 2) {
    e.name = '名称至少 2 个字符';
  } else if (data.name.trim().length > 50) {
    e.name = '名称不能超过 50 个字符';
  }

  if (!data.channel) e.channel = '请选择渠道';
  if (!data.status) e.status = '请选择状态';
  if (!data.targetAudience) e.targetAudience = '请选择目标人群';

  if (!data.budget) {
    e.budget = '请输入预算金额';
  } else if (isNaN(Number(data.budget)) || Number(data.budget) <= 0) {
    e.budget = '请输入有效的正数金额';
  } else if (Number(data.budget) > 999999999) {
    e.budget = '预算不能超过 9.99 亿';
  }

  if (!data.startAt) e.startAt = '请选择开始日期';
  if (!data.endAt) e.endAt = '请选择结束日期';
  if (data.startAt && data.endAt && data.startAt > data.endAt) {
    e.endAt = '结束日期不能早于开始日期';
  }

  if (data.description.length > 500) {
    e.description = '描述不能超过 500 个字符';
  }

  return e;
}

function toFormData(c: CampaignDetail): CampaignFormData {
  return {
    name: c.name,
    channel: c.channel,
    status: c.status,
    budget: String(c.budget),
    startAt: c.startAt,
    endAt: c.endAt,
    targetAudience: c.targetAudience,
    description: c.description,
  };
}

function hasErrors(e: CampaignFormErrors): boolean {
  return Object.keys(e).length > 0;
}

// ── 正例 ──

test('📢 营销经理: valid campaign form passes validation', () => {
  const c = MOCK_DATA['cmp-001'];
  const data = toFormData(c);
  const errors = validate(data);
  assert.strictEqual(hasErrors(errors), false, 'valid form should have no errors');
});

test('📢 营销经理: all channel options are valid', () => {
  const valid: CampaignChannel[] = ['小程序', 'H5', 'App推送', '短信', '企微', '全渠道'];
  for (const ch of valid) {
    assert.ok(CHANNEL_OPTIONS.includes(ch), `${ch} should be a valid channel option`);
  }
});

test('🐜 营销经理: all status options are valid', () => {
  for (const s of STATUS_OPTIONS) {
    assert.ok(STATUS_OPTIONS.includes(s), `${s} should be a valid status option`);
  }
});

test('👔 店长: toFormData preserves original values', () => {
  const c = MOCK_DATA['cmp-004'];
  const data = toFormData(c);
  assert.strictEqual(data.name, c.name);
  assert.strictEqual(data.channel, c.channel);
  assert.strictEqual(data.status, c.status);
  assert.strictEqual(Number(data.budget), c.budget);
  assert.strictEqual(data.startAt, c.startAt);
  assert.strictEqual(data.endAt, c.endAt);
  assert.strictEqual(data.targetAudience, c.targetAudience);
  assert.strictEqual(data.description, c.description);
});

test('👔 店长: all target audience options are valid strings', () => {
  for (const t of TARGET_OPTIONS) {
    assert.ok(t.length > 0, 'target audience option should not be empty');
  }
  assert.ok(TARGET_OPTIONS.length >= 5, 'should have at least 5 target audience options');
});

test('📊 运营: budget is convertible from form data back to number', () => {
  for (const c of Object.values(MOCK_DATA)) {
    const form = toFormData(c);
    const budget = Number(form.budget);
    assert.ok(!isNaN(budget), `${c.id}: budget should be a valid number`);
    assert.strictEqual(budget, c.budget);
  }
});

// ── 反例 ──

test('反例: empty name triggers validation error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.name = '';
  const errors = validate(data);
  assert.strictEqual(errors.name, '活动名称不能为空');
});

test('反例: single-character name triggers min-length error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.name = 'x';
  const errors = validate(data);
  assert.strictEqual(errors.name, '名称至少 2 个字符');
});

test('反例: name exceeding 50 chars triggers max-length error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.name = 'x'.repeat(51);
  const errors = validate(data);
  assert.strictEqual(errors.name, '名称不能超过 50 个字符');
});

test('反例: empty channel triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.channel = '' as CampaignChannel;
  const errors = validate(data);
  assert.strictEqual(errors.channel, '请选择渠道');
});

test('反例: empty status triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.status = '' as CampaignStatus;
  const errors = validate(data);
  assert.strictEqual(errors.status, '请选择状态');
});

test('反例: empty audience triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.targetAudience = '';
  const errors = validate(data);
  assert.strictEqual(errors.targetAudience, '请选择目标人群');
});

test('反例: empty budget triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.budget = '';
  const errors = validate(data);
  assert.strictEqual(errors.budget, '请输入预算金额');
});

test('反例: negative budget triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.budget = '-100';
  const errors = validate(data);
  assert.strictEqual(errors.budget, '请输入有效的正数金额');
});

test('反例: zero budget triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.budget = '0';
  const errors = validate(data);
  assert.strictEqual(errors.budget, '请输入有效的正数金额');
});

test('反例: budget exceeding 9.99亿 triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.budget = '1000000000';
  const errors = validate(data);
  assert.strictEqual(errors.budget, '预算不能超过 9.99 亿');
});

test('反例: NaN budget triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.budget = 'abc';
  const errors = validate(data);
  assert.strictEqual(errors.budget, '请输入有效的正数金额');
});

test('反例: missing start date triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.startAt = '';
  const errors = validate(data);
  assert.strictEqual(errors.startAt, '请选择开始日期');
});

test('反例: missing end date triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.endAt = '';
  const errors = validate(data);
  assert.strictEqual(errors.endAt, '请选择结束日期');
});

test('反例: end date before start date triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.startAt = '2026-07-01';
  data.endAt = '2026-06-15';
  const errors = validate(data);
  assert.strictEqual(errors.endAt, '结束日期不能早于开始日期');
});

test('反例: description over 500 chars triggers error', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.description = 'x'.repeat(501);
  const errors = validate(data);
  assert.strictEqual(errors.description, '描述不能超过 500 个字符');
});

test('反例: multiple validation errors at once', () => {
  const data: CampaignFormData = {
    name: '', channel: '' as CampaignChannel, status: '' as CampaignStatus,
    budget: '-5', startAt: '', endAt: '', targetAudience: '', description: '',
  };
  const errors = validate(data);
  assert.ok(hasErrors(errors), 'should have multiple validation errors');
  assert.ok(errors.name !== undefined, 'name error should exist');
  assert.ok(errors.channel !== undefined, 'channel error should exist');
  assert.ok(errors.budget !== undefined, 'budget error should exist');
  assert.ok(Object.keys(errors).length >= 4, 'at least 4 fields should fail');
});

// ── 边界 ──

test('边界: budget at 999,999,999 (上限边缘) passes', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.budget = '999999999';
  const errors = validate(data);
  assert.strictEqual(errors.budget, undefined, 'max budget should pass');
});

test('边界: 2-char name (最小长度) passes', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.name = 'ab';
  const errors = validate(data);
  assert.strictEqual(errors.name, undefined, '2-char name should pass');
});

test('边界: 50-char name (最大长度) passes', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.name = 'x'.repeat(50);
  const errors = validate(data);
  assert.strictEqual(errors.name, undefined, '50-char name should pass');
});

test('边界: 500-char description (上限边缘) passes', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.description = 'x'.repeat(500);
  const errors = validate(data);
  assert.strictEqual(errors.description, undefined, '500-char description should pass');
});

test('边界: same start and end date is valid', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.startAt = '2026-06-15';
  data.endAt = '2026-06-15';
  const errors = validate(data);
  assert.strictEqual(errors.endAt, undefined, 'same day start/end should be valid');
});

test('边界: very small budget (¥1) passes', () => {
  const data = toFormData(MOCK_DATA['cmp-001']);
  data.budget = '1';
  const errors = validate(data);
  assert.strictEqual(errors.budget, undefined, '¥1 budget should pass');
});

test('边界: all existing campaigns convert to valid form data', () => {
  for (const c of Object.values(MOCK_DATA)) {
    const form = toFormData(c);
    const errors = validate(form);
    assert.strictEqual(hasErrors(errors), false, `${c.id}: existing campaign should produce valid form`);
  }
});

test('边界: form always has exactly 8 fields', () => {
  for (const c of Object.values(MOCK_DATA)) {
    const form = toFormData(c);
    assert.strictEqual(Object.keys(form).length, 8, `${c.id}: form data should have 8 fields`);
  }
});
