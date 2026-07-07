import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { CampaignTrendForecast } from './CampaignTrendForecast';
import type { CampaignTrendHistoricalPoint, CampaignTrendForecastPoint, CampaignTrendModelInfo, CampaignTrendImpactFactor } from './CampaignTrendForecast';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(CampaignTrendForecast, props));
}

// ---- Mock 数据 ----

const mockHistorical: CampaignTrendHistoricalPoint[] = [
  { date: '2026-01', actual: 12000 },
  { date: '2026-02', actual: 13500 },
  { date: '2026-03', actual: 14200 },
  { date: '2026-04', actual: 15800 },
  { date: '2026-05', actual: 16500 },
];

const mockForecast: CampaignTrendForecastPoint[] = [
  { date: '2026-06', predicted: 17200, lowerBound: 15800, upperBound: 18600 },
  { date: '2026-07', predicted: 18100, lowerBound: 16300, upperBound: 19900 },
  { date: '2026-08', predicted: 19000, lowerBound: 16900, upperBound: 21100 },
];

const mockModelInfo: CampaignTrendModelInfo = {
  modelName: 'Prophet-ARIMA',
  accuracy: 0.94,
  confidence: 'high',
};

const mockFactors: CampaignTrendImpactFactor[] = [
  { factor: '季节性', direction: 'positive', weight: 0.8, description: '暑期促销旺季' },
  { factor: '竞品活动', direction: 'negative', weight: 0.3, description: '竞品同期降价' },
  { factor: '营销预算', direction: 'positive', weight: 0.6, description: 'Q3 预算追加' },
];

// ---- Props builders ----

function baseProps() {
  return {
    title: '销售额预测',
    historical: mockHistorical,
    forecast: mockForecast,
  };
}

// ---- 用例 ----

test('CampaignTrendForecast: renders title', () => {
  const html = renderHTML(baseProps());
  assert.ok(html.includes('销售额预测'), 'should display title');
});

test('CampaignTrendForecast: renders latest forecast value', () => {
  const html = renderHTML(baseProps());
  assert.ok(html.includes('19000') || html.includes('19,000'), 'should display latest forecast value');
});

test('CampaignTrendForecast: renders forecast upper bound', () => {
  const html = renderHTML(baseProps());
  assert.ok(html.includes('21100') || html.includes('21,100'), 'should show prediction interval');
});

test('CampaignTrendForecast: renders model info when provided', () => {
  const html = renderHTML({ ...baseProps(), modelInfo: mockModelInfo });
  assert.ok(html.includes('Prophet-ARIMA'), 'should display model name');
  assert.ok(html.includes('高置信度'), 'should display confidence label');
});

test('CampaignTrendForecast: renders impact factors when provided', () => {
  const html = renderHTML({ ...baseProps(), impactFactors: mockFactors });
  assert.ok(html.includes('季节性'), 'should show factor name');
  assert.ok(html.includes('竞品活动'), 'should show another factor name');
  assert.ok(html.includes('关键影响因子') || html.includes('影响因子'), 'should show factors section');
});

test('CampaignTrendForecast: renders AI conclusion when provided', () => {
  const conclusion = '基于历史趋势和季节性因素，预计Q3销售额将稳步增长，建议加大暑期营销投入。';
  const html = renderHTML({ ...baseProps(), aiConclusion: conclusion });
  assert.ok(html.includes('Q3'), 'should contain AI conclusion content');
});

test('CampaignTrendForecast: renders empty state when no data', () => {
  const html = renderHTML({ title: '销售额预测', historical: [], forecast: [] });
  assert.ok(html.includes('暂无预测数据'), 'should show empty text');
});

test('CampaignTrendForecast: renders custom empty text', () => {
  const customText = '请选择活动后查看预测';
  const html = renderHTML({ title: '销售额预测', historical: [], forecast: [], emptyText: customText });
  assert.ok(html.includes(customText), 'should show custom empty text');
});

test('CampaignTrendForecast: renders loading state', () => {
  const html = renderHTML({ ...baseProps(), loading: true });
  // Loading should show skeleton (div with background color), not model info
  assert.ok(!html.includes('Prophet'), 'loading should not show model info');
  assert.ok(html.includes('style'), 'loading should render elements');
});

test('CampaignTrendForecast: renders error state', () => {
  const errMsg = '预测服务暂时不可用，请稍后重试';
  const html = renderHTML({ ...baseProps(), error: errMsg });
  assert.ok(html.includes(errMsg), 'should show error message');
});

test('CampaignTrendForecast: renders updatedAt timestamp', () => {
  const html = renderHTML({ ...baseProps(), updatedAt: '2026-06-28 15:00' });
  assert.ok(html.includes('更新于'), 'should show update label');
  assert.ok(html.includes('2026-06-28'), 'should show timestamp');
});

test('CampaignTrendForecast: renders unit text', () => {
  const html = renderHTML({ ...baseProps(), unit: '元' });
  assert.ok(html.includes('元'), 'should display unit');
});

test('CampaignTrendForecast: renders SVG mini chart', () => {
  const html = renderHTML(baseProps());
  assert.ok(html.includes('<svg'), 'should render SVG element');
  assert.ok(html.includes('polyline'), 'should render trend lines');
});

test('CampaignTrendForecast: renders upward trend badge for rising forecast', () => {
  const risingForecast: CampaignTrendForecastPoint[] = [
    { date: '2026-06', predicted: 10000, lowerBound: 9000, upperBound: 11000 },
    { date: '2026-07', predicted: 18000, lowerBound: 15000, upperBound: 21000 },
  ];
  const html = renderHTML({ ...baseProps(), forecast: risingForecast });
  assert.ok(html.includes('上升趋势'), 'should show upward trend badge');
});

test('CampaignTrendForecast: renders downward trend badge', () => {
  const fallingForecast: CampaignTrendForecastPoint[] = [
    { date: '2026-06', predicted: 20000, lowerBound: 18000, upperBound: 22000 },
    { date: '2026-07', predicted: 12000, lowerBound: 10000, upperBound: 14000 },
  ];
  const html = renderHTML({ ...baseProps(), forecast: fallingForecast });
  assert.ok(html.includes('下降趋势'), 'should show downward trend badge');
});
