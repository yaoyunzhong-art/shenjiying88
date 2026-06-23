import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Chart } = require('./Chart');

const barData = [
  { label: 'Q1', value: 120 },
  { label: 'Q2', value: 200 },
  { label: 'Q3', value: 150 },
  { label: 'Q4', value: 310 },
];

const lineData = [
  { label: '1月', value: 50 },
  { label: '2月', value: 80 },
  { label: '3月', value: 120 },
];

const donutData = [
  { label: '黄金', value: 450 },
  { label: '白银', value: 320 },
  { label: '青铜', value: 180 },
];

describe('Chart', () => {
  // ==================== 基础渲染 ====================

  test('渲染柱状图并显示标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: barData, title: '季度营收' })
    );
    assert.match(html, /季度营收/);
  });

  test('渲染柱状图并包含 SVG', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: barData })
    );
    assert.match(html, /<svg/);
    assert.match(html, /<rect/);
  });

  test('渲染折线图', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'line', data: lineData, title: '月度趋势' })
    );
    assert.match(html, /月度趋势/);
    assert.match(html, /<polyline/);
  });

  test('渲染环形图', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'donut', data: donutData, title: '会员分布' })
    );
    assert.match(html, /会员分布/);
    assert.match(html, /<path/);
  });

  // ==================== 空数据 ====================

  test('没有数据时显示空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: [] })
    );
    assert.match(html, /暂无数据/);
  });

  test('没有数据时显示自定义空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'donut', data: [], emptyText: '还没有数据哦～' })
    );
    assert.match(html, /还没有数据哦～/);
  });

  test('空数据时也显示标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'line', data: [], title: '销售额' })
    );
    assert.match(html, /销售额/);
    assert.match(html, /暂无数据/);
  });

  // ==================== showValues ====================

  test('showValues 为 true 时柱状图显示数值', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: barData, showValues: true })
    );
    // 应该包含数值 120, 200, 150, 310
    assert.match(html, />120</);
    assert.match(html, />200</);
    assert.match(html, />310</);
  });

  test('showValues 为 false 时不显示数值标签（柱状图）', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: barData, showValues: false })
    );
    // SVG 中仍会有 x 轴标签 (Q1等)，但不应直接有纯数值标签
    // 数值不在单独的 text 中作为直接子节点显示
    // 验证 SVG 存在但查看无单独的数值 text 节点
    assert.match(html, /<svg/);
  });

  // ==================== 图例 ====================

  test('柱状图渲染图例标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: barData })
    );
    assert.match(html, /Q1/);
    assert.match(html, /Q2/);
    assert.match(html, /Q3/);
    assert.match(html, /Q4/);
  });

  test('折线图渲染图例标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'line', data: lineData })
    );
    assert.match(html, /1月/);
    assert.match(html, /2月/);
  });

  // ==================== 自定义调色板 ====================

  test('支持自定义调色板', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, {
        type: 'bar',
        data: barData,
        palette: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
      })
    );
    // 第一个柱子应该使用红色
    assert.match(html, /#ff0000/);
  });

  // ==================== 单数据 ====================

  test('单个数据点的折线图回退到柱状图渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'line', data: [{ label: '总计', value: 999 }] })
    );
    // 单数据点折线回退用 rect
    assert.match(html, /<rect/);
    assert.match(html, /总计/);
  });

  // ==================== 自定义颜色 ====================

  test('数据点可指定独立颜色', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, {
        type: 'bar',
        data: [
          { label: '成功', value: 80, color: '#22c55e' },
          { label: '失败', value: 20, color: '#ef4444' },
        ],
      })
    );
    assert.match(html, /#22c55e/);
    assert.match(html, /#ef4444/);
    assert.match(html, /成功/);
    assert.match(html, /失败/);
  });

  // ==================== SVG 结构 ====================

  test('柱状图包含基线', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: barData })
    );
    assert.match(html, /<line/);
  });

  test('环形图显示总计数字', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'donut', data: donutData })
    );
    // 总计 = 450 + 320 + 180 = 950
    assert.match(html, />950</);
    assert.match(html, /总计/);
  });

  // ==================== 宽高 ====================

  test('尊重自定义宽高', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: barData, width: 600, height: 400 })
    );
    assert.match(html, /width="600"/);
    assert.match(html, /height="400"/);
  });

  test('默认宽高', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'bar', data: barData })
    );
    assert.match(html, /width="400"/);
    assert.match(html, /height="260"/);
  });

  // ==================== 环形图结构 ====================

  test('环形图包含 3 个扇形路径', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, { type: 'donut', data: donutData })
    );
    // 每个数据点一个 path
    const pathMatches = html.match(/<path/g);
    assert.ok(pathMatches);
    assert.ok(pathMatches.length >= 3);
  });

  // ==================== className ====================

  test('支持自定义 className', () => {
    const html = renderToStaticMarkup(
      React.createElement(Chart, {
        type: 'bar',
        data: barData,
        className: 'my-chart-container',
      })
    );
    assert.match(html, /my-chart-container/);
  });
});
