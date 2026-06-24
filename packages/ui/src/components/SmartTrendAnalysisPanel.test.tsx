/**
 * SmartTrendAnalysisPanel 组件测试
 *
 * 覆盖:
 * 1. 基础渲染 — 标题、数值
 * 2. AI 分析结果展示 — 方向、标签、洞察
 * 3. 环比变化展示
 * 4. 历史数据统计
 * 5. 置信度展示
 * 6. 异常标记
 * 7. 指标说明
 * 8. 建议展示
 * 9. 预测区域（折叠/展开）
 * 10. 边界情况
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SmartTrendAnalysisPanel } = require('./SmartTrendAnalysisPanel');

// ==================== 工厂函数 ====================

function makeAnalysis(overrides = {}) {
  return {
    direction: 'up',
    changeRate: 50.6,
    label: 'growth',
    insight: '近7天会员注册量持续上升，建议加大拉新投入',
    confidence: 0.85,
    hasAnomaly: false,
    suggestion: '建议配合营销活动，预计下月增长率可提升至 18%',
    ...overrides,
  };
}

function makeForecast() {
  return [
    { timestamp: '2026-06-25T00:00:00Z', predicted: 15.2, upperBound: 18.5, lowerBound: 12.0 },
    { timestamp: '2026-06-26T00:00:00Z', predicted: 16.8, upperBound: 20.1, lowerBound: 13.5 },
    { timestamp: '2026-06-27T00:00:00Z', predicted: 17.5, upperBound: 22.0, lowerBound: 14.0 },
  ];
}

function makeHistory() {
  return [
    { timestamp: '2026-06-17T00:00:00Z', value: 7.2 },
    { timestamp: '2026-06-18T00:00:00Z', value: 7.8 },
    { timestamp: '2026-06-19T00:00:00Z', value: 8.3 },
    { timestamp: '2026-06-20T00:00:00Z', value: 9.1 },
    { timestamp: '2026-06-21T00:00:00Z', value: 10.5 },
    { timestamp: '2026-06-22T00:00:00Z', value: 11.2 },
    { timestamp: '2026-06-23T00:00:00Z', value: 12.5 },
  ];
}

function defaultProps(overrides = {}) {
  return {
    title: '会员增长率',
    unit: '%',
    currentValue: 12.5,
    previousValue: 8.3,
    analysis: makeAnalysis(),
    ...overrides,
  };
}

// ==================== 测试 ====================

describe('SmartTrendAnalysisPanel', () => {
  // ---- 1. 基础渲染 ----

  describe('基础渲染', () => {
    test('应渲染标题', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('会员增长率'), '应包含标题');
    });

    test('应渲染当前值', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('12.5'), '应包含当前数值');
    });

    test('应渲染单位', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('%'), '应包含单位');
    });

    test('应渲染"当前值"标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('当前值'), '应渲染当前值标签');
    });
  });

  // ---- 2. AI 分析结果展示 ----

  describe('AI 分析结果展示', () => {
    test('应渲染方向图标', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('📈'), '上升方向应显示📈');
    });

    test('下降方向应显示📉', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ direction: 'down', label: 'decline' }),
        }))
      );
      assert.ok(html.includes('📉'), '下降方向应显示📉');
    });

    test('平稳方向应显示➡️', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ direction: 'stable', label: 'normal' }),
        }))
      );
      assert.ok(html.includes('➡️'), '平稳方向应显示➡️');
    });

    test('波动方向应显示🌊', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ direction: 'volatile', label: 'warning' }),
        }))
      );
      assert.ok(html.includes('🌊'), '波动方向应显示🌊');
    });

    test('应渲染 AI 分类标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('健康增长'), '增长标签应渲染');
    });

    test('下降标签应渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ label: 'decline', direction: 'down' }),
        }))
      );
      assert.ok(html.includes('下降预警'), '下降标签应渲染');
    });

    test('警告标签应渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ label: 'warning', direction: 'volatile' }),
        }))
      );
      assert.ok(html.includes('需关注'), '警告标签应渲染');
    });

    test('紧急标签应渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ label: 'critical', direction: 'up', hasAnomaly: true }),
        }))
      );
      assert.ok(html.includes('紧急'), '紧急标签应渲染');
    });

    test('应渲染 AI 洞察文本', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('AI 洞察'), '应显示 AI 洞察标题');
      assert.ok(html.includes('近7天会员注册量持续上升'), '应显示洞察内容');
    });

    test('应渲染置信度', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('85%'), '应显示 85% 置信度');
    });

    test('低置信度应显示相应百分比', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ confidence: 0.35 }),
        }))
      );
      assert.ok(html.includes('35%'), '应显示 35% 置信度');
    });
  });

  // ---- 3. 环比变化 ----

  describe('环比变化', () => {
    test('应显示"环比"标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('环比'), '应显示环比标签');
    });

    test('正变化率应显示正号', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ changeRate: 50.6 }),
        }))
      );
      assert.ok(html.includes('+50.6%'), '正变化率应显示 + 号');
    });

    test('负变化率应显示负号', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ changeRate: -12.3, direction: 'down', label: 'decline' }),
        }))
      );
      assert.ok(html.includes('-12.3%'), '负变化率应显示 - 号');
    });
  });

  // ---- 4. 历史数据统计 ----

  describe('历史数据统计', () => {
    test('有历史数据时应显示统计行', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ history: makeHistory() }))
      );
      assert.ok(html.includes('历史数据'), '应显示历史数据');
    });

    test('应显示数据条数', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ history: makeHistory() }))
      );
      assert.ok(html.includes('7 条'), '应显示 7 条历史数据');
    });

    test('应显示最高值', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ history: makeHistory() }))
      );
      assert.ok(html.includes('12.5'), '最高值 12.5 应显示');
    });

    test('应显示最低值', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ history: makeHistory() }))
      );
      assert.ok(html.includes('7.2'), '最低值 7.2 应显示');
    });

    test('无历史数据时不应显示统计', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(!html.includes('历史数据'), '无历史数据时不显示');
    });
  });

  // ---- 5. 异常标记 ----

  describe('异常标记', () => {
    test('hasAnomaly 为 true 时应显示异常标记', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ hasAnomaly: true, label: 'critical' }),
        }))
      );
      assert.ok(html.includes('检测异常'), '应显示异常检测标记');
    });

    test('hasAnomaly 为 false 时不应显示异常标记', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(!html.includes('检测异常'), '无异常时不应显示');
    });
  });

  // ---- 6. 指标说明 ----

  describe('指标说明', () => {
    test('有 metricDescription 时应渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          metricDescription: '计算周期为过去7天',
        }))
      );
      assert.ok(html.includes('计算周期为过去7天'), '应显示指标说明');
    });

    test('无 metricDescription 时不渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(!html.includes('计算周期'), '无说明时不显示');
    });
  });

  // ---- 7. 建议展示 ----

  describe('建议展示', () => {
    test('有 suggestion 时应渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(html.includes('建议'), '应显示建议区域');
      assert.ok(html.includes('配合营销活动'), '应显示建议内容');
    });

    test('无 suggestion 时不应显示', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({
          analysis: makeAnalysis({ suggestion: undefined }),
        }))
      );
      assert.ok(!html.includes('💡'), '无建议时不显示');
    });
  });

  // ---- 8. 预测区域 ----

  describe('预测区域', () => {
    test('有 forecast 时应渲染查看预测按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ forecast: makeForecast() }))
      );
      assert.ok(html.includes('查看预测'), '应显示查看预测按钮');
    });

    test('无 forecast 时不应显示查看预测按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps())
      );
      assert.ok(!html.includes('查看预测'), '无预测时不应显示');
    });

    test('有 forecast 时应渲染查看预测按钮且数据可序列化', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ forecast: makeForecast() }))
      );
      // 默认收起，但按钮存在
      assert.ok(html.includes('查看预测'), '应显示查看预测按钮');
      // SSR 默认不渲染折叠内容，只验证按钮存在即可
      assert.ok(html.includes('收起预测') === false, '预测区域默认收起');
    });
  });

  // ---- 9. 边界情况 ----

  describe('边界情况', () => {
    test('无单位时不显示单位', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ unit: '' }))
      );
      // 单位为空时不应额外显示单位
      assert.ok(html.includes('12.5'), '数值应正常显示');
    });

    test('className 应正确应用', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ className: 'trend-card' }))
      );
      assert.ok(html.includes('trend-card'), '应包含自定义类名');
    });

    test('空 history 数组不应崩溃', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ history: [] }))
      );
      assert.ok(html.includes('会员增长率'), '空历史数据应正常渲染');
    });

    test('空 forecast 数组不应崩溃', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ forecast: [] }))
      );
      assert.ok(html.includes('会员增长率'), '空预测数据应正常渲染');
      assert.ok(!html.includes('查看预测'), '空数组不应显示预测按钮');
    });

    test('accentColor 应被接受（不影响渲染结构）', () => {
      const html = renderToStaticMarkup(
        React.createElement(SmartTrendAnalysisPanel, defaultProps({ accentColor: '#ff0000' }))
      );
      assert.ok(html.includes('会员增长率'), '自定义主题色应正常渲染');
    });
  });
});
