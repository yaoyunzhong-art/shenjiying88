/**
 * campaigns/[id]/page.test.ts — L1 角色冒烟测试
 *
 * storefront-web Campaign Detail page — 详情展示、数据完整性、异常处理
 * 角色视角: 📢营销经理 · 👔店长 · 📊运营
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 内联类型 (mirrors page.tsx) ──

type CampaignStatus = 'active' | 'scheduled' | 'ended' | 'paused' | 'draft';
type CampaignChannel = '小程序' | 'H5' | 'App推送' | '短信' | '企微' | '全渠道';

interface CampaignDetail {
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
}

const MOCK_DATA: Record<string, CampaignDetail> = {
  'cmp-001': { id: 'cmp-001', name: '618 年中大促', channel: '全渠道', status: 'active', budget: 500000, spent: 324000, roi: 3.85, conversions: 12850, startAt: '2026-06-01', endAt: '2026-06-30', targetAudience: '全部会员', description: '618 年中大促全场折扣 + 满减活动，覆盖线上线下全渠道，预计触达 50 万会员。' },
  'cmp-004': { id: 'cmp-004', name: '会员积分双倍', channel: 'App推送', status: 'active', budget: 30000, spent: 18200, roi: 8.1, conversions: 5200, startAt: '2026-06-15', endAt: '2026-07-15', targetAudience: '银卡及以上会员', description: '积分双倍活动期间消费翻倍积分，仅限银卡及以上等级会员参与。' },
  'cmp-014': { id: 'cmp-014', name: '推荐有礼', channel: '全渠道', status: 'active', budget: 60000, spent: 32100, roi: 7.2, conversions: 6100, startAt: '2026-06-01', endAt: '2026-12-31', targetAudience: '全部会员', description: '邀请好友注册得 30 元券，老带新裂变增长渠道长期有效。' },
};

const STATUS_VARIANTS: Record<CampaignStatus, string> = {
  active: 'success',
  scheduled: 'info',
  ended: 'neutral',
  paused: 'warning',
  draft: 'default',
};

function getCampaign(id: string): CampaignDetail | undefined {
  return MOCK_DATA[id];
}

function calcRemaining(c: CampaignDetail): number {
  return c.budget - c.spent;
}

function formatCurrency(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

// ── 正例 ──

test('📢 营销经理: detail lookup returns correct data for cmp-001', () => {
  const c = getCampaign('cmp-001');
  assert.ok(c, 'should find cmp-001');
  assert.strictEqual(c!.name, '618 年中大促');
  assert.strictEqual(c!.channel, '全渠道');
  assert.strictEqual(c!.status, 'active');
  assert.strictEqual(c!.budget, 500000);
});

test('📢 营销经理: budget usage is always within range', () => {
  const c = getCampaign('cmp-001')!;
  const remaining = calcRemaining(c);
  assert.ok(remaining >= 0, 'remaining budget should not be negative');
  assert.ok(remaining <= c.budget, 'remaining should not exceed total budget');
});

test('📢 营销经理: status variant exists for all statuses', () => {
  const statuses: CampaignStatus[] = ['active', 'scheduled', 'ended', 'paused', 'draft'];
  for (const s of statuses) {
    assert.ok(STATUS_VARIANTS[s], `variant should exist for ${s}`);
  }
});

test('👔 店长: all mock campaigns have valid channels', () => {
  const validChannels: CampaignChannel[] = ['小程序', 'H5', 'App推送', '短信', '企微', '全渠道'];
  for (const c of Object.values(MOCK_DATA)) {
    assert.ok(validChannels.includes(c.channel), `${c.id}: invalid channel ${c.channel}`);
  }
});

test('👔 店长: ROI is non-negative for all campaigns', () => {
  for (const c of Object.values(MOCK_DATA)) {
    assert.ok(c.roi >= 0, `${c.id}: ROI should be >= 0`);
  }
});

test('📊 运营: all campaigns have non-empty description and target audience', () => {
  for (const [id, c] of Object.entries(MOCK_DATA)) {
    assert.ok(c.description.length > 0, `${id}: description required`);
    assert.ok(c.targetAudience.length > 0, `${id}: targetAudience required`);
  }
});

test('📊 运营: currency formatting produces correct output', () => {
  assert.strictEqual(formatCurrency(500000), '¥500,000.00');
  assert.strictEqual(formatCurrency(324000), '¥324,000.00');
  assert.strictEqual(formatCurrency(0), '¥0.00');
});

// ── 反例 ──

test('反例: lookup nonexistent campaign returns undefined', () => {
  assert.strictEqual(getCampaign('cmp-999'), undefined);
});

test('反例: empty string lookup returns undefined', () => {
  assert.strictEqual(getCampaign(''), undefined);
});

test('反例: special chars id returns undefined', () => {
  assert.strictEqual(getCampaign('<script>alert(1)</script>'), undefined);
});

test('反例: spent must not exceed budget', () => {
  for (const c of Object.values(MOCK_DATA)) {
    assert.ok(c.spent <= c.budget, `${c.id}: spent ${c.spent} should not exceed budget ${c.budget}`);
  }
});

// ── 边界 ──

test('边界: campaign dates are chronologically valid', () => {
  for (const c of Object.values(MOCK_DATA)) {
    assert.ok(c.startAt <= c.endAt, `${c.id}: startAt ${c.startAt} should be <= endAt ${c.endAt}`);
  }
});

test('边界: conversions are non-negative integers', () => {
  for (const c of Object.values(MOCK_DATA)) {
    assert.ok(Number.isInteger(c.conversions) && c.conversions >= 0,
      `${c.id}: conversions should be non-negative integer`);
  }
});

test('边界: at least one campaign has "全渠道" channel', () => {
  const allChannels = Object.values(MOCK_DATA).map((c) => c.channel);
  assert.ok(allChannels.includes('全渠道'), 'should have at least one omni-channel campaign');
});

test('边界: all campaign IDs start with "cmp-"', () => {
  for (const id of Object.keys(MOCK_DATA)) {
    assert.ok(id.startsWith('cmp-'), `id ${id} should start with cmp-`);
  }
});

test('边界: conversion rate (conversions / spent) is calculable', () => {
  for (const c of Object.values(MOCK_DATA)) {
    if (c.spent > 0) {
      const rate = c.conversions / c.spent;
      assert.ok(rate > 0, `${c.id}: conversion rate should be > 0 for active campaigns`);
    }
  }
});

// ═══════════════════════════════════════════════
// CampaignPerformancePanel 数据层测试
// (mirrors page.tsx mockPerformanceMetrics/mockTrendData/mockInsights)
// ═══════════════════════════════════════════════

type CampaignMetric = {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  delta?: string;
  color?: string;
};

type CampaignDataPoint = {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
};

type CampaignInsight = {
  type: 'positive' | 'negative' | 'info' | 'warning';
  message: string;
  recommendation?: string;
};

// ═══ Mock 生成函数 (mirrors page.tsx) ═══

function mockPerformanceMetrics(c: CampaignDetail): CampaignMetric[] {
  const remaining = c.budget - c.spent;
  const spentPct = c.budget > 0 ? ((c.spent / c.budget) * 100).toFixed(1) : '0.0';
  const cpa = c.conversions > 0 ? Math.round(c.spent / c.conversions) : 0;
  return [
    { label: 'ROI', value: c.roi.toFixed(1), unit: 'x', trend: c.roi >= 3 ? 'up' : c.roi > 1 ? 'flat' : 'down', delta: c.roi >= 3 ? '+20%' : c.roi > 1 ? '持平' : '-15%', color: '#3b82f6' },
    { label: 'CPA (单次转化成本)', value: String(cpa), unit: '元', trend: cpa <= 50 ? 'up' : 'down', delta: cpa <= 50 ? '优良' : '偏高', color: '#8b5cf6' },
    { label: '预算消耗', value: spentPct, unit: '%', trend: parseFloat(spentPct) > 80 ? 'down' : 'flat', delta: `${formatCurrency(remaining)} 剩余`, color: '#f59e0b' },
    { label: '转化数', value: c.conversions.toLocaleString(), unit: '人', trend: c.conversions > 5000 ? 'up' : 'flat', delta: `目标 ${(c.conversions * 1.3).toFixed(0)}`, color: '#10b981' },
  ];
}

function mockTrendData(c: CampaignDetail): CampaignDataPoint[] {
  const start = new Date(c.startAt);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const baseConv = Math.round(c.conversions / 14);
    const jitter = Math.round(baseConv * (0.5 + Math.random() * 0.8));
    return {
      date: d.toISOString().slice(0, 10),
      impressions: jitter * 12,
      clicks: jitter * 3,
      conversions: jitter,
      revenue: jitter * 38,
    };
  });
}

function mockInsights(c: CampaignDetail): CampaignInsight[] {
  const insights: CampaignInsight[] = [];
  const spentPct = c.budget > 0 ? c.spent / c.budget : 0;
  if (c.roi >= 4) {
    insights.push({ type: 'positive', message: 'ROI 表现优秀', recommendation: '建议增加预算 20%，扩大受众覆盖面以获取更多转化。' });
  } else if (c.roi < 2) {
    insights.push({ type: 'negative', message: 'ROI 偏低需关注', recommendation: '建议优化投放人群定向，排除低转化渠道。' });
  } else {
    insights.push({ type: 'info', message: 'ROI 处于行业平均水平', recommendation: '可尝试 A/B 测试不同素材，寻找提升空间。' });
  }
  if (spentPct > 0.8) {
    insights.push({ type: 'warning', message: '预算消耗超过 80%', recommendation: `仅剩 ${formatCurrency(c.budget - c.spent)}，建议评估是否需要追加预算。` });
  }
  if (c.conversions > 8000) {
    insights.push({ type: 'positive', message: '转化量突破 8000', recommendation: '本次活动表现亮眼，建议沉淀为案例经验并复用到后续活动。' });
  }
  if (c.targetAudience.includes('新')) {
    insights.push({ type: 'info', message: '新客获取效果可追踪', recommendation: '建议结合新客复购率评估活动长期价值，而非仅关注首单转化。' });
  }
  insights.push({ type: 'info', message: `渠道: ${c.channel}`, recommendation: `当前通过 ${c.channel} 触达，建议同步评估各子渠道的转化贡献差异。` });
  return insights;
}

// ═══ CampaignPerformancePanel: 正例 ═══

test('🤖 AI性能面板: mockPerformanceMetrics returns exactly 4 metrics', () => {
  for (const c of Object.values(MOCK_DATA)) {
    const metrics = mockPerformanceMetrics(c);
    assert.strictEqual(metrics.length, 4, `${c.id}: expected 4 metrics, got ${metrics.length}`);
    for (const m of metrics) {
      assert.ok(m.label.length > 0, 'metric label required');
      assert.ok(m.value.length > 0, 'metric value required');
      assert.ok(['up', 'down', 'flat'].includes(m.trend ?? 'flat'), `valid trend for ${m.label}`);
    }
  }
});

test('🤖 AI性能面板: mockTrendData returns 14 data points with valid fields', () => {
  const c = getCampaign('cmp-001')!;
  const data = mockTrendData(c);
  assert.strictEqual(data.length, 14, 'should generate 14 data points');
  for (const dp of data) {
    assert.ok(dp.date.length === 10, `date ${dp.date} should be YYYY-MM-DD`);
    assert.ok(dp.impressions > 0, 'impressions > 0');
    assert.ok(dp.clicks > 0, 'clicks > 0');
    assert.ok(dp.conversions > 0, 'conversions > 0');
    assert.ok(dp.revenue > 0, 'revenue > 0');
    assert.ok(dp.impressions > dp.clicks, 'impressions should exceed clicks');
    assert.ok(dp.clicks > dp.conversions, 'clicks should exceed conversions');
  }
});

test('🤖 AI性能面板: mockInsights contains positive + info entries for good campaigns', () => {
  // cmp-014: roi=7.2, conversions=6100 — insights: +positive (high ROI), +info (渠道) = 2
  const c = getCampaign('cmp-014')!;
  const insights = mockInsights(c);
  assert.ok(insights.length >= 2, `expected >= 2 insights, got ${insights.length}`);
  const types = insights.map((i) => i.type);
  assert.ok(types.includes('positive'), 'should have positive insight (high ROI)');
  assert.ok(types.includes('info'), 'should have info insight');
  for (const ins of insights) {
    assert.ok(ins.message.length > 0, 'insight message required');
    assert.ok(ins.recommendation && ins.recommendation.length > 0, 'insight recommendation required');
  }
});

test('🤖 AI性能面板: low ROI campaign gets negative insight', () => {
  const lowRoiCampaign: CampaignDetail = {
    id: 'cmp-low-roi', name: '低效活动', channel: '短信', status: 'active',
    budget: 100000, spent: 85000, roi: 1.2, conversions: 1200,
    startAt: '2026-06-01', endAt: '2026-06-30',
    targetAudience: '全部用户', description: '低 ROI 活动测试',
  };
  const insights = mockInsights(lowRoiCampaign);
  const hasNegative = insights.some((i) => i.type === 'negative');
  assert.ok(hasNegative, 'low ROI should produce negative insight');
  const negativeInsight = insights.find((i) => i.type === 'negative');
  assert.ok(negativeInsight!.message.includes('ROI 偏低'), 'negative message should mention low ROI');
});

test('🤖 AI性能面板: high budget consumption triggers warning', () => {
  const nearExhausted: CampaignDetail = {
    id: 'cmp-near-exhaust', name: '高消耗活动', channel: '小程序', status: 'active',
    budget: 100000, spent: 92000, roi: 3.5, conversions: 3500,
    startAt: '2026-06-01', endAt: '2026-06-30',
    targetAudience: '老会员', description: '预算快用完',
  };
  const insights = mockInsights(nearExhausted);
  const hasWarning = insights.some((i) => i.type === 'warning');
  assert.ok(hasWarning, '>80% spent should trigger warning insight');
});

test('🤖 AI性能面板: new-customer campaign includes new customer insight', () => {
  const newCustCampaign: CampaignDetail = {
    id: 'cmp-new', name: '拉新活动', channel: 'H5', status: 'active',
    budget: 50000, spent: 20000, roi: 4.0, conversions: 1500,
    startAt: '2026-07-01', endAt: '2026-07-31',
    targetAudience: '新注册用户', description: '新客拉新活动',
  };
  const insights = mockInsights(newCustCampaign);
  const hasNewCustomerInsight = insights.some((i) => i.message.includes('新客'));
  assert.ok(hasNewCustomerInsight, '新客 target audience should produce relevant insight');
});

test('🤖 AI性能面板: ROI threshold determines trend direction', () => {
  // ROI >= 3 => up trend for ROI metric
  const highRoiMetrics = mockPerformanceMetrics({ ...getCampaign('cmp-014')!, roi: 5.0, conversions: 10000 });
  const roiMetric = highRoiMetrics.find((m) => m.label === 'ROI');
  assert.strictEqual(roiMetric!.trend, 'up', 'ROI >= 3 should be up trend');

  const lowRoiMetrics = mockPerformanceMetrics({ ...getCampaign('cmp-014')!, roi: 0.8, conversions: 100 });
  const lowRoiMetric = lowRoiMetrics.find((m) => m.label === 'ROI');
  assert.strictEqual(lowRoiMetric!.trend, 'down', 'ROI < 1 should be down trend');
});

// ═══ CampaignPerformancePanel: 反例 ═══

test('反例: campaign with zero budget produces safe metric values', () => {
  const zeroBudget: CampaignDetail = {
    id: 'cmp-zero', name: '零预算活动', channel: '短信', status: 'draft',
    budget: 0, spent: 0, roi: 0, conversions: 0,
    startAt: '2026-07-01', endAt: '2026-07-31',
    targetAudience: '无', description: '测试',
  };
  const metrics = mockPerformanceMetrics(zeroBudget);
  assert.strictEqual(metrics.length, 4);
  const budgetMetric = metrics.find((m) => m.label === '预算消耗');
  assert.ok(budgetMetric, 'budget metric should exist');
  assert.strictEqual(budgetMetric!.value, '0.0', 'zero budget shows 0.0%');
});

test('反例: zero-conversion campaign still generates valid metrics', () => {
  const noConv: CampaignDetail = {
    id: 'cmp-noconv', name: '无转化活动', channel: '小程序', status: 'active',
    budget: 10000, spent: 3000, roi: 0, conversions: 0,
    startAt: '2026-06-01', endAt: '2026-06-30',
    targetAudience: '全部', description: '无转化',
  };
  const metrics = mockPerformanceMetrics(noConv);
  const cpaMetric = metrics.find((m) => m.label.includes('CPA'));
  assert.ok(cpaMetric, 'CPA metric should exist even with 0 conversions');
  assert.strictEqual(cpaMetric!.value, '0', 'CPA should be 0 when conversions is 0');
});

// ═══ CampaignPerformancePanel: 边界 ═══

test('边界: trend data dates increment by one day each', () => {
  const c = getCampaign('cmp-001')!;
  const data = mockTrendData(c);
  for (let i = 1; i < data.length; i++) {
    const prev = new Date(data[i - 1]!.date);
    const curr = new Date(data[i]!.date);
    const diffMs = curr.getTime() - prev.getTime();
    assert.strictEqual(diffMs, 86400000, `day ${i}: date should increment by exactly 1 day`);
  }
});

test('边界: all conversions/impressions/clicks/revenue are positive integers and in correct magnitude order', () => {
  const c = getCampaign('cmp-001')!;
  const data = mockTrendData(c);
  for (const dp of data) {
    assert.ok(Number.isInteger(dp.impressions), `impressions ${dp.impressions} should be integer`);
    assert.ok(Number.isInteger(dp.clicks), `clicks ${dp.clicks} should be integer`);
    assert.ok(Number.isInteger(dp.conversions), `conversions ${dp.conversions} should be integer`);
    assert.ok(Number.isInteger(dp.revenue), `revenue ${dp.revenue} should be integer`);
    assert.ok(dp.impressions >= dp.clicks, `impressions ${dp.impressions} >= clicks ${dp.clicks}`);
    assert.ok(dp.clicks >= dp.conversions, `clicks ${dp.clicks} >= conversions ${dp.conversions}`);
    assert.ok(dp.revenue >= dp.conversions * 1, `revenue ${dp.revenue} >= conversions * min price`);
  }
});

test('边界: every campaign status maps to a valid performance panel status', () => {
  const validPanelStatuses: CampaignStatus[] = ['active', 'scheduled', 'ended', 'draft'];
  for (const c of Object.values(MOCK_DATA)) {
    assert.ok(validPanelStatuses.includes(c.status), `${c.id}: status ${c.status} valid for CampaignPerformancePanel`);
  }
});

test('边界: insight recommendation contains actionable suggestion (not empty)', () => {
  for (const c of Object.values(MOCK_DATA)) {
    const insights = mockInsights(c);
    for (const ins of insights) {
      assert.ok(ins.recommendation && ins.recommendation.length > 10,
        `${c.id}: recommendation should be actionable (>= 10 chars): ${ins.recommendation}`);
    }
  }
});
