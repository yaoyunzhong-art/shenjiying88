/**
 * Sales Forecast Page — storefront-web
 * Tests: forecast data integrity, metric calculation, trend analysis
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── Types ──

type ForecastTrend = 'up' | 'down' | 'stable';

interface ForecastStat {
  label: string;
  value: string;
  trend: ForecastTrend | 'neutral';
}

// ── Mock data (mirrors page.tsx logic) ──

const FORECAST_STATS: ForecastStat[] = [
  { label: '明日预测', value: '¥52,380', trend: 'up' },
  { label: '周同比', value: '+12.5%', trend: 'up' },
  { label: '预测置信度', value: '88%', trend: 'neutral' },
  { label: '库存建议', value: '补货 3,200 件', trend: 'neutral' },
];

function renderTrendArrow(trend: ForecastStat['trend']): string | null {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return null;
}

// ── Tests ──

test('SalesForecastPage: stats array has correct items', () => {
  assert.equal(FORECAST_STATS.length, 4);
  assert.equal(FORECAST_STATS[0].label, '明日预测');
  assert.equal(FORECAST_STATS[1].label, '周同比');
  assert.equal(FORECAST_STATS[2].label, '预测置信度');
  assert.equal(FORECAST_STATS[3].label, '库存建议');
});

test('SalesForecastPage: stats contain numeric values', () => {
  const hasYuan = FORECAST_STATS.some((s) => s.value.startsWith('¥'));
  const hasPercent = FORECAST_STATS.some((s) => s.value.includes('%'));
  assert.ok(hasYuan);
  assert.ok(hasPercent);
});

test('SalesForecastPage: renderTrendArrow returns correct arrow', () => {
  assert.equal(renderTrendArrow('up'), '↑');
  assert.equal(renderTrendArrow('down'), '↓');
  assert.equal(renderTrendArrow('neutral'), null);
  assert.equal(renderTrendArrow('stable'), null);
});

test('SalesForecastPage: trend states are within allowed values', () => {
  const validTrends = new Set<ForecastStat['trend']>(['up', 'down', 'neutral']);
  for (const stat of FORECAST_STATS) {
    assert.ok(validTrends.has(stat.trend), `Stat "${stat.label}" has invalid trend: "${stat.trend}"`);
  }
});

test('SalesForecastPage: at least one stat has up trend', () => {
  const hasUp = FORECAST_STATS.some((s) => s.trend === 'up');
  assert.ok(hasUp);
});

test('SalesForecastPage: forecast data point generator produces valid structure', () => {
  // Simulate the same data generation as page.tsx
  const generated = generateForecastDays(10);
  assert.equal(generated.length, 10);
  for (const point of generated) {
    assert.ok(typeof point.label === 'string' && point.label.length > 0);
    assert.ok(typeof point.predicted === 'number' && point.predicted > 0);
    assert.ok(typeof point.optimistic === 'number' && point.optimistic > 0);
    assert.ok(typeof point.pessimistic === 'number' && point.pessimistic > 0);
    // optimistic >= predicted >= pessimistic
    assert.ok(point.optimistic >= point.predicted);
    assert.ok(point.predicted >= point.pessimistic);
  }
});

test('SalesForecastPage: past days have actual value', () => {
  const points = generateForecastDays(10);
  for (let i = 0; i < 3; i++) {
    assert.ok(points[i].actual !== undefined, `Day ${i} should have actual value`);
  }
});

test('SalesForecastPage: future days have no actual value', () => {
  const points = generateForecastDays(10);
  for (let i = 3; i < points.length; i++) {
    assert.equal(points[i].actual, undefined, `Day ${i} should not have actual value`);
  }
});

test('SalesForecastPage: predicted values are within reasonable range', () => {
  const points = generateForecastDays(10);
  for (const point of points) {
    // Predictions should be between 30k and 70k
    assert.ok(point.predicted >= 30000 && point.predicted <= 70000,
      `Predicted ${point.predicted} for ${point.label} out of range`);
  }
});

// ── Helper: forecast data generator (mirror of page.tsx) ──

interface ForecastDataPoint {
  label: string;
  predicted: number;
  optimistic: number;
  pessimistic: number;
  actual?: number;
}

function generateForecastDays(count: number): ForecastDataPoint[] {
  const points: ForecastDataPoint[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i - 3);
    const label = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const predicted = 48000 + Math.round(Math.sin(i * 0.8 + 0.5) * 12000 + (Math.random() - 0.5) * 3000);
    const actual = i < 3 ? predicted + Math.round((Math.random() - 0.5) * 6000) : undefined;
    const optimistic = Math.round(predicted * (1.08 + Math.random() * 0.06));
    const pessimistic = Math.round(predicted * (0.85 + Math.random() * 0.05));
    points.push({ label, predicted, optimistic, pessimistic, actual });
  }
  return points;
}
