import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SalesForecastPanel } = require('./SalesForecastPanel');

// ==================== Mock 数据 ====================

const mockDataPoints = [
  { label: '6/15', predicted: 38500, optimistic: 41000, pessimistic: 36000, actual: 37800 },
  { label: '6/16', predicted: 39200, optimistic: 42000, pessimistic: 36500, actual: 40100 },
  { label: '6/17', predicted: 40600, optimistic: 43500, pessimistic: 37800, actual: 39500 },
  { label: '6/18', predicted: 41800, optimistic: 45000, pessimistic: 38800 },
  { label: '6/19', predicted: 43200, optimistic: 46500, pessimistic: 40000 },
];

const mockStats = [
  { label: '同比变化', value: '+12.5%', trend: 'up' as const },
  { label: '环比变化', value: '+3.2%', trend: 'up' as const },
  { label: '预测偏差率', value: '2.1%', trend: 'neutral' as const },
];

// ==================== 测试 ====================

describe('SalesForecastPanel', () => {
  // ==================== 基础渲染 ====================

  test('渲染面板标题和摘要', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'up',
        accuracy: 'high',
        confidence: 85,
        title: '销售预测',
        description: '基于 AI 模型的未来5日销售预测',
      })
    );

    assert.ok(html.includes('销售预测'), '应包含面板标题');
    assert.ok(html.includes('基于 AI 模型的未来5日销售预测'), '应包含描述');
  });

  test('渲染预测金额', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'up',
        accuracy: 'high',
        confidence: 85,
      })
    );

    // 最后一位是 43200 -> 4.3w
    assert.ok(html.includes('4.3w'), '应渲染下一期预测金额');
    assert.ok(html.includes('4.0w'), '应显示悲观区间');
    assert.ok(html.includes('4.7w'), '应显示乐观区间');
  });

  test('渲染趋势标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'down',
        accuracy: 'medium',
        confidence: 65,
      })
    );

    assert.ok(html.includes('📉'), '应显示下降趋势图标');
    assert.ok(html.includes('下降趋势'), '应显示下降趋势文字');
    assert.ok(html.includes('准确度: 中'), '应显示准确度');
  });

  test('渲染数据测试 ID', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'stable',
        accuracy: 'low',
        confidence: 35,
        'data-testid': 'my-forecast',
      })
    );

    assert.ok(html.includes('my-forecast'), '应包含自定义 testid');
  });

  test('渲染统计卡片', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'up',
        accuracy: 'high',
        confidence: 80,
        stats: mockStats,
      })
    );

    assert.ok(html.includes('同比变化'), '应显示同比变化');
    assert.ok(html.includes('环比变化'), '应显示环比变化');
    assert.ok(html.includes('预测偏差率'), '应显示预测偏差率');
    assert.ok(html.includes('+12.5%'), '应显示同比值');
  });

  // ==================== 边界情况 ====================

  test('空数据点不崩溃', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: [],
        trend: 'stable',
        accuracy: 'medium',
        confidence: 50,
      })
    );

    assert.ok(html.includes('暂无预测数据'), '空数据时应显示占位');
  });

  test('单数据点不渲染图表', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: [{ label: '6/24', predicted: 40000, optimistic: 42000, pessimistic: 38000 }],
        trend: 'stable',
        accuracy: 'medium',
        confidence: 70,
      })
    );

    assert.ok(!html.includes('forecast-chart-svg'), '单数据点不应渲染 SVG 图表');
  });

  test('showChart=false 时不渲染图表', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'up',
        accuracy: 'high',
        confidence: 85,
        showChart: false,
      })
    );

    assert.ok(!html.includes('forecast-chart-svg'), 'showChart=false 时不渲染 SVG 图表');
  });

  test('渲染置信度仪表盘', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'up',
        accuracy: 'high',
        confidence: 90,
      })
    );

    // GaugeChart 渲染 SVG 视图
    assert.ok(html.includes('90'), '应显示 90 置信度');
  });

  test('渲染实际值数据点', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'up',
        accuracy: 'high',
        confidence: 80,
      })
    );

    // 前 3 个数据点有 actual 值
    assert.ok(html.includes('forecast-actual-dot'), '应渲染实际值散点');
  });

  test('自定义 footerActions 渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesForecastPanel, {
        dataPoints: mockDataPoints,
        trend: 'up',
        accuracy: 'high',
        confidence: 80,
        footerActions: React.createElement('button', { 'data-testid': 'forecast-action-btn' }, '导出预测'),
      })
    );

    assert.ok(html.includes('导出预测'), '应渲染 footer 按钮');
  });
});
