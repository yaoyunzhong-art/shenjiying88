import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { TierDistributionChart } = require('./TierDistributionChart');
import type { TierDistributionChartProps } from './TierDistributionChart';

describe('TierDistributionChart', () => {
  const defaultProps: TierDistributionChartProps = {
    tiers: [
      { key: 'diamond', label: '钻石', count: 5, color: '#a78bfa' },
      { key: 'gold', label: '黄金', count: 15, color: '#fbbf24' },
      { key: 'silver', label: '白银', count: 25, color: '#94a3b8' },
      { key: 'bronze', label: '青铜', count: 10, color: '#d97706' },
      { key: 'standard', label: '标准', count: 5, color: '#6b7280' },
    ],
    total: 60,
  };

  it('renders the chart container', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, defaultProps),
    );
    assert.match(html, /tier-dist-chart/);
  });

  it('renders chart title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, { ...defaultProps, title: '会员等级分布' }),
    );
    assert.match(html, /tier-dist-chart-title/);
    assert.match(html, /会员等级分布/);
  });

  it('renders correct number of tier segments', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, defaultProps),
    );
    const segmentCount = (html.match(/tier-dist-chart-segment-/g) || []).length;
    assert.strictEqual(segmentCount, 5);
  });

  it('renders tier labels in legend', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, defaultProps),
    );
    assert.match(html, /钻石/);
    assert.match(html, /黄金/);
    assert.match(html, /白银/);
    assert.match(html, /青铜/);
    assert.match(html, /标准/);
  });

  it('renders legend with correct counts and percentages', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, defaultProps),
    );
    assert.match(html, /tier-dist-chart-legend-diamond/);
    assert.match(html, /5/);
    assert.match(html, /tier-dist-chart-legend-gold/);
    assert.match(html, /15/);
  });

  it('shows empty state when no tier data', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, { tiers: [], total: 0 }),
    );
    assert.match(html, /tier-dist-chart-empty/);
    assert.match(html, /暂无等级分布数据/);
  });

  it('shows custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, {
        tiers: [],
        total: 0,
        emptyText: '尚未生成等级数据',
      }),
    );
    assert.match(html, /tier-dist-chart-empty/);
    assert.match(html, /尚未生成等级数据/);
  });

  it('shows loading skeleton when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, { ...defaultProps, loading: true }),
    );
    assert.match(html, /tier-dist-chart-loading/);
  });

  it('renders total label in center when showTotalInCenter is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, { ...defaultProps, showTotalInCenter: true }),
    );
    assert.match(html, /tier-dist-chart-total/);
    assert.match(html, /总会员/);
  });

  it('renders inner arcs for smaller radii', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, { ...defaultProps, size: 200 }),
    );
    const segmentCount = (html.match(/tier-dist-chart-segment-/g) || []).length;
    assert.strictEqual(segmentCount, 5);
  });

  it('handles a single tier that occupies 100%', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, {
        tiers: [{ key: 'standard', label: '标准', count: 60, color: '#6b7280' }],
        total: 60,
      }),
    );
    assert.match(html, /标准/);
    assert.match(html, /tier-dist-chart/);
  });

  it('accepts custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(TierDistributionChart, { ...defaultProps, 'data-testid': 'my-chart' }),
    );
    assert.match(html, /my-chart/);
    assert.equal(html.includes('tier-dist-chart'), false);
  });
});
