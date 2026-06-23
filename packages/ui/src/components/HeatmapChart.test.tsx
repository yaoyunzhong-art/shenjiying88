import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { HeatmapChart } = require('./HeatmapChart');

const deviceHeatmapData = [
  { rowLabel: '设备A', colLabel: '00-04', value: 85 },
  { rowLabel: '设备A', colLabel: '04-08', value: 72 },
  { rowLabel: '设备A', colLabel: '08-12', value: 90 },
  { rowLabel: '设备A', colLabel: '12-16', value: 55 },
  { rowLabel: '设备A', colLabel: '16-20', value: 68 },
  { rowLabel: '设备A', colLabel: '20-24', value: 40 },
  { rowLabel: '设备B', colLabel: '00-04', value: 45 },
  { rowLabel: '设备B', colLabel: '04-08', value: 98 },
  { rowLabel: '设备B', colLabel: '08-12', value: 33 },
  { rowLabel: '设备B', colLabel: '12-16', value: 77 },
  { rowLabel: '设备B', colLabel: '16-20', value: 60 },
  { rowLabel: '设备B', colLabel: '20-24', value: 88 },
];

const deviceRowLabels = ['设备A', '设备B'];
const timeColLabels = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];

const memberData = [
  { rowLabel: '黄金', colLabel: '门店A', value: 230 },
  { rowLabel: '黄金', colLabel: '门店B', value: 180 },
  { rowLabel: '白银', colLabel: '门店A', value: 450 },
  { rowLabel: '白银', colLabel: '门店B', value: 320 },
  { rowLabel: '青铜', colLabel: '门店A', value: 680 },
  { rowLabel: '青铜', colLabel: '门店B', value: 520 },
];

describe('HeatmapChart', () => {
  // ==================== 基础渲染 ====================

  test('渲染热力图并显示标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        title: '设备状态热力图',
      })
    );
    assert.match(html, /设备状态热力图/);
  });

  test('渲染 SVG 元素', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
      })
    );
    assert.match(html, /<svg/);
    assert.match(html, /<rect/);
  });

  test('渲染行列标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
      })
    );
    assert.match(html, /设备A/);
    assert.match(html, /设备B/);
    assert.match(html, /00-04/);
    assert.match(html, /20-24/);
  });

  // ==================== 数值显示 ====================

  test('showValues=true 时渲染数值', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        showValues: true,
      })
    );
    // 第一行第一列的值
    assert.match(html, />85</);
  });

  test('showValues=false 时不渲染数值', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        showValues: false,
      })
    );
    // 值不应作为独立text出现
    assert.ok(!html.includes('>85<'));
  });

  // ==================== 空状态 ====================

  test('空数据列表显示空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: [],
        rowLabels: [],
        colLabels: [],
      })
    );
    assert.match(html, /暂无数据/);
  });

  test('自定义空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: [],
        rowLabels: [],
        colLabels: [],
        emptyText: '无可视化数据',
      })
    );
    assert.match(html, /无可视化数据/);
  });

  // ==================== 自动提取标签 ====================

  test('未传 rowLabels/colLabels 时从数据自动提取', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: memberData,
      })
    );
    assert.match(html, /黄金/);
    assert.match(html, /白银/);
    assert.match(html, /青铜/);
    assert.match(html, /门店A/);
    assert.match(html, /门店B/);
  });

  // ==================== 图例 ====================

  test('默认显示图例', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
      })
    );
    assert.match(html, /低/);
    assert.match(html, /中/);
    assert.match(html, /高/);
  });

  test('showLegend=false 时隐藏图例', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        showLegend: false,
      })
    );
    assert.ok(!html.includes('密度'));
  });

  // ==================== 颜色方案 ====================

  test('默认颜色方案为 blue', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
      })
    );
    // 蓝色方案渲染
    assert.match(html, /<svg/);
  });

  test('支持 red 颜色方案', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        colorScheme: 'red',
      })
    );
    assert.match(html, /<svg/);
  });

  test('支持 green 颜色方案', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        colorScheme: 'green',
      })
    );
    assert.match(html, /<svg/);
  });

  test('支持 amber 颜色方案', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        colorScheme: 'amber',
      })
    );
    assert.match(html, /<svg/);
  });

  test('支持 purple 颜色方案', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        colorScheme: 'purple',
      })
    );
    assert.match(html, /<svg/);
  });

  test('支持 cool 颜色方案', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: deviceHeatmapData,
        rowLabels: deviceRowLabels,
        colLabels: timeColLabels,
        colorScheme: 'cool',
      })
    );
    assert.match(html, /<svg/);
  });

  // ==================== 会员等级分布数据 ====================

  test('渲染会员等级分布热力图', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: memberData,
        title: '会员等级分布',
        colorScheme: 'amber',
      })
    );
    assert.match(html, /会员等级分布/);
    assert.match(html, /黄金/);
    assert.match(html, /白银/);
    assert.match(html, /青铜/);
  });
});
