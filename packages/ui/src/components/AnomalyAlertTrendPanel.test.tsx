import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AnomalyAlertTrendPanel } = require('./AnomalyAlertTrendPanel');

import type { AlertTrendDataPoint, AnomalyAlertTrendPanelProps } from './AnomalyAlertTrendPanel';

/** 生成模拟趋势数据 */
function mockTrendData(count: number, startDate = '2026-07-01'): AlertTrendDataPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const base = Math.max(0, Math.round(50 + Math.sin(i * 0.5) * 30 + (Math.random() - 0.5) * 20));
    return {
      date,
      total: base + 2,
      critical: Math.round(base * 0.15),
      high: Math.round(base * 0.25),
      medium: Math.round(base * 0.35),
      low: Math.round(base * 0.25),
      resolved: Math.round(base * 0.6),
    };
  });
}

describe('AnomalyAlertTrendPanel', () => {
  test('renders with default props and title', () => {
    const data = mockTrendData(7);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data })
    );

    assert.ok(html.includes('异常告警趋势'), 'should show default title');
    assert.ok(html.includes('anomaly-alert-trend-panel'), 'should have testid');
    assert.ok(html.includes('最新异常'), 'should have stat summary');
  });

  test('renders custom title', () => {
    const data = mockTrendData(14);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data, title: '运营异常趋势' })
    );

    assert.ok(html.includes('运营异常趋势'), 'should show custom title');
  });

  test('renders with month granularity', () => {
    const data = mockTrendData(31);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data, granularity: 'month' })
    );

    assert.ok(html.includes('异常告警趋势'), 'should render with month granularity');
    assert.ok(html.includes('最新异常'), 'should show stats');
  });

  test('handles empty data gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data: [] })
    );

    assert.ok(html.includes('暂无趋势数据'), 'should show empty state');
  });

  test('renders SVG chart element', () => {
    const data = mockTrendData(14);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data })
    );

    assert.ok(html.includes('<svg'), 'should contain SVG element');
    assert.ok(html.includes('aria-label'), 'should have accessibility label');
  });

  test('renders legend toggle buttons', () => {
    const data = mockTrendData(7);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data })
    );

    assert.ok(html.includes('总异常'), 'should show total legend');
    assert.ok(html.includes('严重'), 'should show critical legend');
    assert.ok(html.includes('已解决'), 'should show resolved legend');
  });

  test('renders granularity selector', () => {
    const data = mockTrendData(7);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data })
    );

    assert.ok(html.includes('日视图'), 'should show day option');
    assert.ok(html.includes('周视图'), 'should show week option');
    assert.ok(html.includes('月视图'), 'should show month option');
  });

  test('renders with custom height and width', () => {
    const data = mockTrendData(14);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, {
        data,
        height: 400,
        width: 900,
      })
    );

    assert.ok(html.includes('anomaly-alert-trend-panel'), 'should render with custom dims');
  });

  test('renders resolved fill area', () => {
    const data = mockTrendData(7);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data })
    );

    // resolved 默认显示，应有填充路径
    // SVG 渲染为 fill-opacity (kebab-case)
    assert.ok(html.includes('fill-opacity'), 'should have fill area for resolved');
  });

  test('critical values computed correctly in stats', () => {
    const data = mockTrendData(3);
    // 强制最后一条数据 critical 很高
    data[data.length - 1] = {
      ...data[data.length - 1],
      critical: 999,
    };
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data })
    );

    assert.ok(html.includes('999'), 'should display the high critical value');
  });

  test('renders with all severity series visible by default', () => {
    const data = mockTrendData(7);
    const html = renderToStaticMarkup(
      React.createElement(AnomalyAlertTrendPanel, { data })
    );

    // 默认显示 total, critical, resolved — 即 SVG 内应有至少 3 个 stroke 路径
    const strokeMatches = html.match(/stroke-width="2"/g);
    assert.ok(strokeMatches && strokeMatches.length >= 3, 'should have at least 3 series strokes');
  });
});
