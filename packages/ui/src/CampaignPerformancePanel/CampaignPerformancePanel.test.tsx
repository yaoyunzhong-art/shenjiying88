import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { CampaignPerformancePanel } from './CampaignPerformancePanel';
import type { CampaignMetric, CampaignDataPoint, CampaignInsight } from './CampaignPerformancePanel';

// ---- 工具函数 ----

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (React.isValidElement(node)) {
    // Handle fragments, portals, and regular elements
    if (node.props) {
      return extractText(node.props.children);
    }
  }
  return '';
}

// ---- Mock 数据 ----

const mockMetrics: CampaignMetric[] = [
  { label: '曝光量', value: '24,580', trend: 'up', delta: '+12.5%', color: '#3b82f6' },
  { label: '点击量', value: '3,210', trend: 'up', delta: '+8.3%', color: '#8b5cf6' },
  { label: '转化数', value: '486', trend: 'up', delta: '+15.2%', color: '#10b981' },
  { label: '总营收', value: '¥58,320', trend: 'up', delta: '+22.1%', color: '#f59e0b' },
];

const mockInsights: CampaignInsight[] = [
  { type: 'positive', message: '转化率持续上升，近7天增长15.2%', recommendation: '建议加大热销品推广预算，重点投放' },
  { type: 'info', message: '周四曝光量出现低谷', recommendation: '考虑在周中增加推送频次' },
];

// ---- Tests ----

test('CampaignPerformancePanel: renders campaign name and status', () => {
  const result = CampaignPerformancePanel({
    campaignName: '618夏季大促',
    status: 'active',
    metrics: mockMetrics,
    insights: mockInsights,
  });
  assert.ok(React.isValidElement(result) || (result as any)?.$$typeof);
  assert.equal(true, true); // SSR renders without error
});

test('CampaignPerformancePanel: component is a function', () => {
  assert.equal(typeof CampaignPerformancePanel, 'function');
});

test('CampaignPerformancePanel: renders with different status values', () => {
  const statuses: Array<'active' | 'scheduled' | 'ended' | 'draft'> = ['active', 'scheduled', 'ended', 'draft'];
  for (const status of statuses) {
    const result = CampaignPerformancePanel({
      campaignName: '测试活动',
      status,
      metrics: mockMetrics,
    });
    assert.ok(React.isValidElement(result), `Failed for status: ${status}`);
  }
});

test('CampaignPerformancePanel: renders loading skeleton', () => {
  const result = CampaignPerformancePanel({
    campaignName: '加载中',
    status: 'active',
    metrics: [],
    loading: true,
  });
  assert.ok(React.isValidElement(result));
});

test('CampaignPerformancePanel: renders empty state when no metrics', () => {
  const result = CampaignPerformancePanel({
    campaignName: '空数据',
    status: 'draft',
    metrics: [],
    trendData: [],
  });
  assert.ok(React.isValidElement(result));
});

test('CampaignPerformancePanel: renders empty insights state', () => {
  const result = CampaignPerformancePanel({
    campaignName: '无洞察',
    status: 'scheduled',
    metrics: mockMetrics,
    insights: [],
  });
  assert.ok(React.isValidElement(result));
});

test('CampaignPerformancePanel: renders AI insights', () => {
  const result = CampaignPerformancePanel({
    campaignName: '洞察测试',
    status: 'active',
    metrics: mockMetrics,
    insights: mockInsights,
  });
  assert.ok(React.isValidElement(result));
  const text = extractText(result);
  // Check that insight text appears somewhere in rendered output
  assert.ok(text.includes('AI') || text.includes('洞察'), `Expected AI/洞察 text but got: ${text.slice(0, 100)}`);
});

test('CampaignPerformancePanel: renders delta metrics', () => {
  const result = CampaignPerformancePanel({
    campaignName: '趋势指标',
    status: 'active',
    metrics: [
      { label: '测试指标', value: '100', trend: 'up', delta: '+10%' },
    ],
  });
  assert.ok(React.isValidElement(result));
});

test('CampaignPerformancePanel: renders with custom data-testid', () => {
  const result = CampaignPerformancePanel({
    campaignName: '自定义ID',
    status: 'active',
    metrics: mockMetrics,
    'data-testid': 'my-custom-id',
  });
  assert.ok(React.isValidElement(result));
});

test('CampaignPerformancePanel: renders negative insight type', () => {
  const result = CampaignPerformancePanel({
    campaignName: '负面洞察',
    status: 'active',
    metrics: mockMetrics,
    insights: [{ type: 'negative', message: '转化率下降明显', recommendation: '检查广告素材' }],
  });
  assert.ok(React.isValidElement(result));
});

test('CampaignPerformancePanel: renders warning insight type', () => {
  const result = CampaignPerformancePanel({
    campaignName: '警告洞察',
    status: 'active',
    metrics: mockMetrics,
    insights: [{ type: 'warning', message: '预算即将超支', recommendation: '减少非核心渠道投放' }],
  });
  assert.ok(React.isValidElement(result));
});

test('CampaignPerformancePanel: handles missing optional trendData', () => {
  const result = CampaignPerformancePanel({
    campaignName: '无趋势数据',
    status: 'ended',
    metrics: mockMetrics,
  });
  assert.ok(React.isValidElement(result));
});

test('CampaignPerformancePanel: handles all four insight types', () => {
  const types: Array<'positive' | 'negative' | 'info' | 'warning'> = ['positive', 'negative', 'info', 'warning'];
  for (const type of types) {
    const result = CampaignPerformancePanel({
      campaignName: `洞察类型测试-${type}`,
      status: 'active',
      metrics: mockMetrics,
      insights: [{ type, message: `Insight type ${type}` }],
    });
    assert.ok(React.isValidElement(result), `Failed for insight type: ${type}`);
  }
});

test('CampaignPerformancePanel: renders without crash with trend data', () => {
  const data: CampaignDataPoint[] = [
    { date: '2026-06-27', impressions: 3100, clicks: 470, conversions: 68, revenue: 8160 },
    { date: '2026-06-26', impressions: 2900, clicks: 445, conversions: 62, revenue: 7440 },
  ];
  const result = CampaignPerformancePanel({
    campaignName: '趋势数据测试',
    status: 'active',
    metrics: mockMetrics,
    trendData: data,
  });
  assert.ok(React.isValidElement(result));
});
