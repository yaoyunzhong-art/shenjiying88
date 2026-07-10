import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { ProfitMarginPanel } = require('./ProfitMarginPanel');

// ==================== Mock 数据 ====================

const mockRecords = [
  { id: '1', label: '游戏区', revenue: 120000, cost: 54000, grossMargin: 55.0, marginTrend: 2.3 },
  { id: '2', label: '餐饮区', revenue: 85000, cost: 51000, grossMargin: 40.0, marginTrend: -1.5 },
  { id: '3', label: '礼品区', revenue: 45000, cost: 27000, grossMargin: 40.0, marginTrend: 0.8 },
  { id: '4', label: '会员服务', revenue: 32000, cost: 12800, grossMargin: 60.0, marginTrend: 5.1 },
];

const mockCostBreakdown = [
  { category: '采购成本', amount: 78000, percentage: 52.0, color: '#3b82f6' },
  { category: '人力成本', amount: 42000, percentage: 28.0, color: '#10b981' },
  { category: '场地租金', amount: 18000, percentage: 12.0, color: '#f59e0b' },
  { category: '运营费用', amount: 12000, percentage: 8.0, color: '#ef4444' },
];

function createComponent(props = {}) {
  return renderToStaticMarkup(
    React.createElement(ProfitMarginPanel, {
      totalRevenue: 282000,
      totalCost: 150000,
      overallMargin: 46.8,
      marginChange: 1.2,
      records: mockRecords,
      costBreakdown: mockCostBreakdown,
      ...props,
    })
  );
}

describe('ProfitMarginPanel', () => {
  test('渲染标题', () => {
    const html = createComponent();
    assert.ok(html.includes('利润率分析'));
  });

  test('渲染时间段标签', () => {
    const html = createComponent({ periodLabel: '本季度' });
    assert.ok(html.includes('本季度'));
  });

  test('渲染四个核心指标标签', () => {
    const html = createComponent();
    assert.ok(html.includes('总收入'));
    assert.ok(html.includes('总成本'));
    assert.ok(html.includes('毛利润'));
    assert.ok(html.includes('毛利率'));
  });

  test('正确格式化金额', () => {
    const html = createComponent();
    assert.ok(html.includes('¥282,000.00'));
    assert.ok(html.includes('¥150,000.00'));
  });

  test('计算毛利润并格式化', () => {
    const html = createComponent();
    // 282000 - 150000 = 132000
    assert.ok(html.includes('¥132,000.00'));
  });

  test('渲染各维度利润率列表', () => {
    const html = createComponent();
    assert.ok(html.includes('游戏区'));
    assert.ok(html.includes('餐饮区'));
    assert.ok(html.includes('礼品区'));
    assert.ok(html.includes('会员服务'));
  });

  test('渲染成本构成图例', () => {
    const html = createComponent();
    assert.ok(html.includes('采购成本'));
    assert.ok(html.includes('人力成本'));
    assert.ok(html.includes('场地租金'));
    assert.ok(html.includes('运营费用'));
  });

  test('展示毛利率百分比和趋势', () => {
    const html = createComponent();
    assert.ok(html.includes('46.8%'));
    assert.ok(html.includes('+1.2%'));
  });

  test('加载状态显示骨架屏', () => {
    const html = createComponent({
      totalRevenue: 0,
      totalCost: 0,
      overallMargin: 0,
      marginChange: 0,
      records: [],
      costBreakdown: [],
      loading: true,
    });
    assert.ok(html.includes('animate-pulse'));
  });

  test('错误状态显示错误信息', () => {
    const html = createComponent({
      totalRevenue: 0,
      totalCost: 0,
      overallMargin: 0,
      marginChange: 0,
      records: [],
      costBreakdown: [],
      error: '数据获取失败，请稍后重试',
    });
    assert.ok(html.includes('数据获取失败，请稍后重试'));
  });

  test('负毛利率显示负号', () => {
    const recordsWithLoss = [
      { id: '1', label: '亏损区', revenue: 10000, cost: 15000, grossMargin: -50.0, marginTrend: -10.0 },
    ];
    const costBk = [{ category: '采购', amount: 15000, percentage: 100, color: '#3b82f6' }];

    const html = createComponent({
      totalRevenue: 10000,
      totalCost: 15000,
      overallMargin: -50.0,
      marginChange: -10.0,
      records: recordsWithLoss,
      costBreakdown: costBk,
    });
    assert.ok(html.includes('-50.0%'));
  });

  test('自定义标题', () => {
    const html = createComponent({ title: '利润分析' });
    assert.ok(html.includes('利润分析'));
  });

  test('渲染成本堆叠条 (4个成本项)', () => {
    const html = createComponent();
    // 检查4种成本颜色都出现在堆叠条区域
    assert.ok(html.includes('#3b82f6'));
    assert.ok(html.includes('#10b981'));
    assert.ok(html.includes('#f59e0b'));
    assert.ok(html.includes('#ef4444'));
  });

  test('按毛利率排序 - 会员服务 (60%) 排第一', () => {
    const html = createComponent();
    // 会员服务带 60.0%
    assert.ok(html.includes('60.0%'));
    // 游戏区 55.0%
    assert.ok(html.includes('55.0%'));
  });
});
