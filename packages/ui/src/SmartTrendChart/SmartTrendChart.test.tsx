import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);

import { SmartTrendChart, type TrendDataPoint } from './SmartTrendChart';

const mockData: TrendDataPoint[] = [
  { label: 'Mon', value: 120, target: 100 },
  { label: 'Tue', value: 95, target: 100 },
  { label: 'Wed', value: 150, target: 130 },
  { label: 'Thu', value: 130, target: 130 },
  { label: 'Fri', value: 180, target: 150 },
];

const renderComponent = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    React.createElement(SmartTrendChart, { data: mockData, title: 'Week KPI', ...props }),
  );

const staticRender = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(React.createElement(SmartTrendChart, props));

test('SmartTrendChart: renders title when provided', () => {
  const html = renderComponent();
  assert.ok(html.includes('Week KPI'));
});

test('SmartTrendChart: renders data-testid on root', () => {
  const html = renderComponent();
  assert.ok(html.includes('data-testid="smart-trend-chart"'));
});

test('SmartTrendChart: renders custom data-testid', () => {
  const html = renderToStaticMarkup(
    React.createElement(SmartTrendChart, {
      data: mockData,
      'data-testid': 'my-chart',
    }),
  );
  assert.ok(html.includes('data-testid="my-chart"'));
});

test('SmartTrendChart: renders SVG element', () => {
  const html = renderComponent();
  assert.ok(html.includes('<svg'));
  assert.ok(html.includes('</svg>'));
});

test('SmartTrendChart: renders title testid', () => {
  const html = renderComponent();
  assert.ok(html.includes('smart-trend-chart-title'));
});

test('SmartTrendChart: renders x-axis labels for all data points', () => {
  const html = renderComponent();
  for (const point of mockData) {
    assert.ok(html.includes(point.label));
  }
});

test('SmartTrendChart: renders data values when showValues=true', () => {
  const html = renderComponent();
  for (const point of mockData) {
    assert.ok(html.includes(String(point.value)));
  }
});

test('SmartTrendChart: hides values when showValues=false', () => {
  const html = renderComponent({ showValues: false });
  for (const point of mockData) {
    assert.ok(!html.includes(`>${point.value}<`));
  }
});

test('SmartTrendChart: renders loading skeleton', () => {
  const html = staticRender({ data: mockData, loading: true });
  assert.ok(html.includes('smart-trend-chart--loading'));
});

test('SmartTrendChart: renders empty state when data is empty', () => {
  const html = staticRender({ data: [] });
  assert.ok(html.includes('smart-trend-chart--empty'));
  assert.ok(html.includes('暂无趋势数据'));
});

test('SmartTrendChart: renders custom empty text', () => {
  const html = staticRender({ data: [], emptyText: 'No Data' });
  assert.ok(html.includes('No Data'));
});

test('SmartTrendChart: renders bar markers', () => {
  const html = renderComponent();
  assert.ok(html.includes('smart-trend-chart-bar-0'));
  assert.ok(html.includes('smart-trend-chart-bar-4'));
});

test('SmartTrendChart: renders value markers', () => {
  const html = renderComponent();
  assert.ok(html.includes('smart-trend-chart-value-0'));
  assert.ok(html.includes('smart-trend-chart-value-4'));
});

test('SmartTrendChart: renders label markers', () => {
  const html = renderComponent();
  assert.ok(html.includes('smart-trend-chart-label-0'));
  assert.ok(html.includes('smart-trend-chart-label-4'));
});

test('SmartTrendChart: renders target circles when showTarget=true', () => {
  const html = renderComponent({ showTarget: true });
  assert.ok(html.includes('smart-trend-chart-target-0'));
});

test('SmartTrendChart: renders target lines when showTarget=true', () => {
  const html = renderComponent({ showTarget: true });
  assert.ok(html.includes('smart-trend-chart-target-line-1'));
});

test('SmartTrendChart: applies custom className', () => {
  const html = renderComponent({ className: 'my-chart' });
  assert.ok(html.includes('my-chart'));
});

test('SmartTrendChart: handles single data point', () => {
  const html = renderToStaticMarkup(
    React.createElement(SmartTrendChart, {
      data: [{ label: 'Today', value: 50 }],
    }),
  );
  assert.ok(html.includes('Today'));
  assert.ok(html.includes('50'));
  assert.ok(html.includes('smart-trend-chart-bar-0'));
});

test('SmartTrendChart: hides title testid when no title', () => {
  const html = renderToStaticMarkup(React.createElement(SmartTrendChart, { data: mockData }));
  assert.ok(!html.includes('smart-trend-chart-title'));
});

test('SmartTrendChart: handles zero values', () => {
  const html = renderToStaticMarkup(
    React.createElement(SmartTrendChart, {
      data: [{ label: 'Test', value: 0 }],
    }),
  );
  assert.ok(html.includes('smart-trend-chart-bar-0'));
});

test('SmartTrendChart: handles equal values', () => {
  const html = renderToStaticMarkup(
    React.createElement(SmartTrendChart, {
      data: [
        { label: 'A', value: 100 },
        { label: 'B', value: 100 },
      ],
    }),
  );
  assert.ok(html.includes('smart-trend-chart-bar-0'));
  assert.ok(html.includes('smart-trend-chart-bar-1'));
});

test('SmartTrendChart: custom barColor does not crash', () => {
  const html = renderComponent({ barColor: '#10b981' });
  assert.ok(html.includes('smart-trend-chart-bar-0'));
});

test('SmartTrendChart: type exports exist', () => {
  assert.equal(typeof SmartTrendChart, 'function');
});

test('SmartTrendChart: large numbers display correctly', () => {
  const html = renderToStaticMarkup(
    React.createElement(SmartTrendChart, {
      data: [
        { label: 'Q1', value: 10000 },
        { label: 'Q2', value: 25000 },
      ],
    }),
  );
  assert.ok(html.includes('10000'));
  assert.ok(html.includes('25000'));
});

test('SmartTrendChart: empty data renders without crash', () => {
  const html = renderToStaticMarkup(React.createElement(SmartTrendChart, { data: [] }));
  assert.ok(html.length > 0);
});
