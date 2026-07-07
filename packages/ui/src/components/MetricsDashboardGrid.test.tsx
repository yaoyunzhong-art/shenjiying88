import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { MetricsDashboardGrid } = require('./MetricsDashboardGrid');

const MOCK_TILES = [
  { id: '1', label: '今日订单', value: 128, trend: { value: '12%', positive: true }, variant: 'success' },
  { id: '2', label: '待处理退款', value: 3, variant: 'warning' },
  { id: '3', label: '门店客流量', value: 456, trend: { value: '5%', positive: false }, variant: 'info' },
  { id: '4', label: '异常告警', value: 1, variant: 'error', helper: '设备离线告警' },
];

describe('MetricsDashboardGrid', () => {
  test('renders tiles in a grid', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: MOCK_TILES })
    );
    for (const tile of MOCK_TILES) {
      assert.ok(html.includes(tile.label), `expected ${tile.label} in output`);
    }
    assert.ok(html.includes('role="region"'));
  });

  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: MOCK_TILES, loading: true })
    );
    for (const tile of MOCK_TILES) {
      assert.ok(!html.includes(tile.label), `expected ${tile.label} not in loading output`);
    }
    assert.ok(html.includes('aria-hidden'));
  });

  test('renders empty state when tiles array is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: [] })
    );
    assert.ok(html.includes('暂无指标数据'));
  });

  test('renders custom empty message', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: [], emptyMessage: '请等待数据同步' })
    );
    assert.ok(html.includes('请等待数据同步'));
  });

  test('renders error state with retry button', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: MOCK_TILES, error: '接口返回 500', onRetry: () => {} })
    );
    assert.ok(html.includes('数据加载失败'));
    assert.ok(html.includes('接口返回 500'));
    assert.ok(html.includes('重试'));
  });

  test('renders error state without retry button when onRetry is omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: MOCK_TILES, error: '出错' })
    );
    assert.ok(html.includes('数据加载失败'));
    assert.ok(!html.includes('重试'));
  });

  test('respects custom columns and gap', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: MOCK_TILES, columns: 3, gap: 24 })
    );
    assert.ok(html.includes('grid-template-columns'));
  });

  test('renders clickable tiles with tabIndex', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, {
        tiles: [{ id: 'a', label: '可点击指标', value: 42, onClick: () => {} }]
      })
    );
    assert.ok(html.includes('tabindex="0"'));
  });

  test('renders tile trend indicators', () => {
    const posHtml = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, {
        tiles: [{ id: 'p', label: '上涨', value: 10, trend: { value: '3%', positive: true } }]
      })
    );
    assert.ok(posHtml.includes('↑'));

    const negHtml = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, {
        tiles: [{ id: 'n', label: '下跌', value: 5, trend: { value: '2%', positive: false } }]
      })
    );
    assert.ok(negHtml.includes('↓'));
  });

  test('renders helper text in tiles', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, {
        tiles: [{ id: 'h', label: '有说明', value: 7, helper: '比昨日减少2' }]
      })
    );
    assert.ok(html.includes('比昨日减少2'));
  });

  test('renders auto-fit column template', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: MOCK_TILES, columns: 'auto-fit' })
    );
    assert.ok(html.includes('auto-fill'));
  });

  test('accepts and applies className', () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricsDashboardGrid, { tiles: MOCK_TILES, className: 'my-custom-grid' })
    );
    assert.ok(html.includes('my-custom-grid'));
  });
});
