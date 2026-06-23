import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { MemberTierDistribution } = require('./MemberTierDistribution');
import type { MemberTier } from './MemberTierDistribution';

const sampleTiers: MemberTier[] = [
  { tier: '钻石会员', key: 'diamond', count: 128, growth: 0.12 },
  { tier: '黄金会员', key: 'gold', count: 450, growth: 0.05 },
  { tier: '白银会员', key: 'silver', count: 620, growth: -0.03 },
  { tier: '青铜会员', key: 'bronze', count: 890, growth: 0.01 },
];

describe('MemberTierDistribution', () => {
  // ============ 基础渲染 ============
  test('renders title', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers, title: '会员等级分布' })
    );
    assert.match(html, /会员等级分布/);
  });

  test('renders all tier names', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers })
    );
    assert.match(html, /钻石会员/);
    assert.match(html, /黄金会员/);
    assert.match(html, /白银会员/);
    assert.match(html, /青铜会员/);
  });

  test('renders tier counts', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers })
    );
    assert.match(html, /128/);
    assert.match(html, /450/);
    assert.match(html, /620/);
    assert.match(html, /890/);
  });

  // ============ 空状态 ============
  test('renders empty state when tiers is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: [] })
    );
    assert.match(html, /暂无会员数据/);
  });

  test('renders empty state when tiers is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: undefined as unknown as MemberTier[] })
    );
    assert.match(html, /暂无会员数据/);
  });

  test('renders custom emptyText', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: [], emptyText: '还没有会员哦' })
    );
    assert.match(html, /还没有会员哦/);
  });

  // ============ showTotal ============
  test('renders total count when showTotal is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers, showTotal: true })
    );
    assert.match(html, /总计/);
    const total = sampleTiers.reduce((s, t) => s + t.count, 0);
    assert.match(html, new RegExp(total.toLocaleString()));
  });

  test('does not render total badge when showTotal is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers, showTotal: false })
    );
    // "总计 N 人" badge 不应出现 (Chart 本身可能有总计文字，排除之)
    assert.doesNotMatch(html, /总计 \d/);
  });

  // ============ showTrends (growth) ============
  test('renders growth arrows when showTrends is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers, showTrends: true })
    );
    // 正增长
    assert.match(html, /↑/);
    // 负增长
    assert.match(html, /↓/);
    // 百分比
    assert.match(html, /12\.0%/);
    assert.match(html, /5\.0%/);
  });

  test('does not render growth arrows when showTrends is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers, showTrends: false })
    );
    assert.doesNotMatch(html, /↑/);
    assert.doesNotMatch(html, /↓/);
  });

  test('renders flat arrow for zero growth', () => {
    const flatTiers: MemberTier[] = [
      { tier: '普通', key: 'regular', count: 100, growth: 0 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: flatTiers, showTrends: true })
    );
    assert.match(html, /持平/);
  });

  test('renders no arrow when growth is undefined', () => {
    const noGrowthTiers: MemberTier[] = [
      { tier: '普通', key: 'regular', count: 100 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: noGrowthTiers, showTrends: true })
    );
    // 不应该有箭头标记——undefined growth 不渲染
    assert.doesNotMatch(html, /↑/);
    assert.doesNotMatch(html, /↓/);
  });

  // ============ 百分比 ============
  test('renders percentage for each tier', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers })
    );
    const total = sampleTiers.reduce((s, t) => s + t.count, 0);
    for (const t of sampleTiers) {
      const pct = ((t.count / total) * 100).toFixed(1);
      assert.match(html, new RegExp(pct.replace('.', '\\.') + '%'));
    }
  });

  // ============ 图表区域 ============
  test('renders donut chart via Chart component', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers })
    );
    // Chart 组件渲染 SVG
    assert.match(html, /<svg/);
  });

  // ============ 自定义颜色 / 图标 ============
  test('uses custom color from tier', () => {
    const customTiers: MemberTier[] = [
      { tier: '自定义', key: 'custom', count: 50, color: '#ff0000' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: customTiers })
    );
    assert.match(html, /#ff0000/);
  });

  test('uses custom icon from tier', () => {
    const customTiers: MemberTier[] = [
      { tier: '自定义', key: 'custom', count: 50, icon: '🚀' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: customTiers })
    );
    assert.match(html, /🚀/);
  });

  // ============ built-in palette icon ============
  test('renders diamond icon for diamond key', () => {
    const tiers: MemberTier[] = [{ tier: '钻石', key: 'diamond', count: 1 }];
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers, showTrends: false })
    );
    assert.match(html, /💎/);
  });

  test('renders gold icon for gold key', () => {
    const tiers: MemberTier[] = [{ tier: '黄金', key: 'gold', count: 1 }];
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers, showTrends: false })
    );
    assert.match(html, /🥇/);
  });

  // ============ onTierClick ============
  test('does not crash when onTierClick omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers })
    );
    assert.ok(html.length > 0);
  });

  // ============ className ============
  test('passes className to root element', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: sampleTiers, className: 'my-custom-class' })
    );
    assert.match(html, /my-custom-class/);
  });

  // ============ 单等级 ============
  test('renders single tier correctly', () => {
    const singleTier: MemberTier[] = [
      { tier: 'VIP会员', key: 'vip', count: 999, growth: 0.2 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(MemberTierDistribution, { tiers: singleTier })
    );
    assert.match(html, /VIP会员/);
    assert.match(html, /999/);
    assert.match(html, /100\.0%/);
    assert.match(html, /↑/);
    assert.match(html, /20\.0%/);
  });
});
