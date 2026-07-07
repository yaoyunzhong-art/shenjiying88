import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

// ── 被测试组件 ──────────────────────────────────────
const { AIMetricGoalPanel } = require('./AIMetricGoalPanel');

// ── Mock 数据 ────────────────────────────────────────
const mockGoals = [
  {
    id: '1',
    label: '月营收',
    actual: 1200000,
    target: 1500000,
    predicted: 1550000,
    unit: '元',
    trend: 'up',
    changePercent: 12.5,
    category: 'revenue',
    icon: '💰',
    primary: true,
  },
  {
    id: '2',
    label: '新增会员数',
    actual: 850,
    target: 1000,
    unit: '人',
    trend: 'up',
    changePercent: 8.3,
    category: 'member',
    icon: '👤',
  },
  {
    id: '3',
    label: '客单价',
    actual: 368,
    target: 400,
    predicted: 420,
    unit: '元',
    trend: 'down',
    changePercent: -2.1,
    category: 'sales',
    icon: '🛒',
  },
  {
    id: '4',
    label: '到店转化率',
    actual: 23.5,
    target: 30,
    unit: '%',
    trend: 'flat',
    changePercent: 0.5,
    category: 'operation',
    icon: '📈',
  },
];

// ── Helper: 渲染组件到字符串 ─────────────────────────
function renderToString(Component: React.ReactElement): string {
  const { renderToStaticMarkup } = require('react-dom/server');
  return renderToStaticMarkup(Component);
}

// ======================================================
describe('[AI] AIMetricGoalPanel 指标目标看板', () => {
  test('1. 组件正确导出为函数', () => {
    assert.equal(typeof AIMetricGoalPanel, 'function');
  });

  test('2. 渲染默认标题', () => {
    const html = renderToString(React.createElement(AIMetricGoalPanel, { goals: mockGoals }));
    assert.ok(html.includes('AI 指标目标看板'), '应包含默认标题');
  });

  test('3. 渲染自定义标题', () => {
    const html = renderToString(React.createElement(AIMetricGoalPanel, { goals: mockGoals, title: '门店目标看板' }));
    assert.ok(html.includes('门店目标看板'), '应包含自定义标题');
  });

  test('4. 渲染周期文本', () => {
    const html = renderToString(React.createElement(AIMetricGoalPanel, { goals: mockGoals, period: '本月' }));
    assert.ok(html.includes('本月'), '应包含周期文本');
  });

  test('5. 渲染 4 个指标的 label', () => {
    const html = renderToString(React.createElement(AIMetricGoalPanel, { goals: mockGoals }));
    assert.ok(html.includes('月营收'), '应包含月营收');
    assert.ok(html.includes('新增会员数'), '应包含新增会员数');
    assert.ok(html.includes('客单价'), '应包含客单价');
    assert.ok(html.includes('到店转化率'), '应包含到店转化率');
  });

  test('6. primary 指标显示"核心"徽标', () => {
    const html = renderToString(React.createElement(AIMetricGoalPanel, { goals: mockGoals }));
    assert.ok(html.includes('核心'), 'primary 指标应显示核心徽标');
  });

  test('7. 空状态展示', () => {
    const html = renderToString(React.createElement(AIMetricGoalPanel, { goals: [] }));
    assert.ok(html.includes('暂无指标数据'), '空状态应显示暂无指标数据');
  });

  test('8. 自定义空状态文案', () => {
    const html = renderToString(React.createElement(AIMetricGoalPanel, { goals: [], emptyText: '空空如也' }));
    assert.ok(html.includes('空空如也'), '自定义空状态应生效');
  });

  test('9. loading 时显示加载文案', () => {
    const html = renderToString(React.createElement(AIMetricGoalPanel, { goals: [], loading: true }));
    assert.ok(html.includes('加载指标数据'), 'loading 态应显示加载文案');
  });
});
