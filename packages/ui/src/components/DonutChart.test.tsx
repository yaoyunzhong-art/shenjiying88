/**
 * DonutChart 环形图组件测试
 *
 * 覆盖:
 * 1. 基础渲染 — SVG 圆形元素数量
 * 2. 中心总计文字
 * 3. 自定义 centerFormatter
 * 4. 无中心标签模式
 * 5. 图例渲染所有项
 * 6. 隐藏图例
 * 7. 空数据 / 全零
 * 8. 自定义 className / size
 * 9. aria-label 可访问性
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DonutChart } = require('./DonutChart');

const mockData = [
  { key: 'diamond', label: '钻石会员', value: 120, color: '#a78bfa' },
  { key: 'gold',   label: '黄金会员', value: 80,  color: '#facc15' },
  { key: 'silver', label: '银卡会员', value: 50,  color: '#94a3b8' },
  { key: 'bronze', label: '铜卡会员', value: 30,  color: '#fb923c' },
  { key: 'basic',  label: '普通会员', value: 20,  color: '#64748b' },
];

describe('DonutChart 环形图', () => {
  it('渲染 SVG 包含背景 + 数据圆形', () => {
    const html = renderToStaticMarkup(React.createElement(DonutChart, { data: mockData }));
    // 6 个 circle (1 bg + 5 data)
    const matches = html.match(/<circle /g);
    assert.equal(matches ? matches.length : 0, 6, '应有 6 个 circle 元素');
  });

  it('包含 SVG 元素', () => {
    const html = renderToStaticMarkup(React.createElement(DonutChart, { data: mockData }));
    assert.ok(html.includes('<svg'), '应包含 SVG');
  });

  it('默认显示中心总计', () => {
    const html = renderToStaticMarkup(React.createElement(DonutChart, { data: mockData }));
    assert.ok(html.includes('300'), '应显示总和');
    assert.ok(html.includes('总计'), '应显示"总计"');
  });

  it('支持自定义 centerFormatter', () => {
    const html = renderToStaticMarkup(
      React.createElement(DonutChart, {
        data: mockData,
        centerFormatter: (t) => `${t}人`,
      }),
    );
    assert.ok(html.includes('300人'));
  });

  it('showCenterLabel=false 不显示中心标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(DonutChart, { data: mockData, showCenterLabel: false }),
    );
    assert.ok(!html.includes('总计'), '不应出现"总计"');
  });

  it('显示所有图例项', () => {
    const html = renderToStaticMarkup(React.createElement(DonutChart, { data: mockData }));
    assert.ok(html.includes('钻石会员'));
    assert.ok(html.includes('黄金会员'));
    assert.ok(html.includes('银卡会员'));
    assert.ok(html.includes('铜卡会员'));
    assert.ok(html.includes('普通会员'));
  });

  it('showLegend=false 时数据渲染正常', () => {
    const html = renderToStaticMarkup(
      React.createElement(DonutChart, { data: mockData, showLegend: false }),
    );
    // 即使隐藏图例，SVG 仍应正常渲染
    assert.ok(html.includes('<svg'), 'SVG 应正常输出');
    assert.ok(html.includes('300'), '中心数值应正常显示');
  });

  it('空数据时显示 "暂无数据"', () => {
    const html = renderToStaticMarkup(React.createElement(DonutChart, { data: [] }));
    assert.ok(html.includes('暂无数据'));
  });

  it('全零数据时显示 "暂无数据"', () => {
    const html = renderToStaticMarkup(
      React.createElement(DonutChart, {
        data: [{ key: 'a', label: 'A', value: 0, color: '#f00' }],
      }),
    );
    assert.ok(html.includes('暂无数据'));
  });

  it('接受自定义 className', () => {
    const html = renderToStaticMarkup(
      React.createElement(DonutChart, { data: mockData, className: 'my-donut' }),
    );
    assert.ok(html.includes('class="my-donut"'));
  });

  it('自定义 size 和 thickness', () => {
    const html = renderToStaticMarkup(
      React.createElement(DonutChart, { data: mockData, size: 300, thickness: 48 }),
    );
    assert.ok(html.includes('width="300"'));
    assert.ok(html.includes('height="300"'));
  });

  it('切片含 aria-label', () => {
    const html = renderToStaticMarkup(React.createElement(DonutChart, { data: mockData }));
    assert.ok(html.includes('aria-label="钻石会员'));
    assert.ok(html.includes('aria-label="黄金会员'));
  });

  it('小数据合并为 "其他"', () => {
    const data = [
      { key: 'a', label: 'A', value: 100, color: '#f00' },
      { key: 'b', label: 'B', value: 80,  color: '#0f0' },
      { key: 'c', label: 'C', value: 5,   color: '#00f' },
    ];
    const html = renderToStaticMarkup(React.createElement(DonutChart, { data, minPercent: 5 }));
    // C (5/185 ≈ 2.7%) < 5% 应合并
    // 因为有 "其他" 所以 3 个数据变 3 个 circle (bg + A + B + other)
    assert.ok(html.includes('其他'));
  });

  it('渲染 5 项数据示例', () => {
    const html = renderToStaticMarkup(React.createElement(DonutChart, { data: mockData }));
    // 应该包含百分比
    assert.ok(html.includes('%'));
    // 钻石会员 120/300=40%
    assert.ok(html.includes('40.0%'));
  });
});
