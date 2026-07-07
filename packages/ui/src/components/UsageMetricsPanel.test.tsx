import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { UsageMetricsPanel } = require('./UsageMetricsPanel');

describe('UsageMetricsPanel', () => {
  const sampleMetrics = [
    { key: 'api-calls', label: 'API 调用', value: 28471, unit: '次', changePercent: 12.5, trend: 'up', color: 'info' as const },
    { key: 'errors', label: '错误数', value: 23, unit: '次', changePercent: -8.3, trend: 'down', color: 'error' as const },
    { key: 'avg-latency', label: '平均延迟', value: 142, unit: 'ms', trend: 'up', color: 'warning' as const },
    { key: 'uptime', label: '可用率', value: 99.97, unit: '%', color: 'success' as const },
  ];

  test('renders title', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '系统用量', metrics: sampleMetrics })
    );
    assert.match(html, /系统用量/);
  });

  test('renders time range when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '系统用量', metrics: sampleMetrics, timeRange: '过去 7 天' })
    );
    assert.match(html, /过去 7 天/);
  });

  test('does not render time range when omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '系统用量', metrics: sampleMetrics })
    );
    assert.doesNotMatch(html, /过去 7 天/);
  });

  test('renders all metric labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '系统用量', metrics: sampleMetrics })
    );
    assert.match(html, /API 调用/);
    assert.match(html, /错误数/);
    assert.match(html, /平均延迟/);
    assert.match(html, /可用率/);
  });

  test('renders formatted values with units', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '系统用量', metrics: sampleMetrics })
    );
    assert.match(html, /28,471次/);
    assert.match(html, /23次/);
    assert.match(html, /142ms/);
    assert.match(html, /99.97%/);
  });

  test('renders change percentage and trend arrow when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '系统用量', metrics: sampleMetrics })
    );
    assert.match(html, /12\.5%/);
    assert.match(html, /↑/);
  });

  test('renders down trend arrow and negative change', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '系统用量', metrics: sampleMetrics })
    );
    assert.match(html, /8\.3%/);
    assert.match(html, /↓/);
  });

  test('handles empty metrics array', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '空面板', metrics: [] })
    );
    assert.match(html, /空面板/);
  });

  test('handles single metric without trend', () => {
    const single = [
      { key: 'active', label: '活跃用户', value: 512, unit: '人', color: 'success' as const },
    ];
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '单指标', metrics: single })
    );
    assert.match(html, /512人/);
    assert.match(html, /活跃用户/);
  });

  test('renders value without unit', () => {
    const metric = [{ key: 'count', label: '计数', value: 999, color: 'default' as const }];
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '面板', metrics: metric })
    );
    assert.match(html, /999/);
    assert.doesNotMatch(html, /999%/);
  });

  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '测试', metrics: sampleMetrics, className: 'my-custom-class' })
    );
    assert.match(html, /my-custom-class/);
  });

  test('renders value number that came from flat trend', () => {
    const flatMetric = [{ key: 'flat', label: '稳定指标', value: 50, changePercent: 0, trend: 'flat', color: 'default' as const }];
    const html = renderToStaticMarkup(
      React.createElement(UsageMetricsPanel, { title: '面板', metrics: flatMetric })
    );
    assert.match(html, /50/);
  });
});
