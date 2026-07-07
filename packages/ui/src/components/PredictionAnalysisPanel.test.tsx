import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PredictionAnalysisPanel } = require('./PredictionAnalysisPanel');

// ---- 测试工厂 ----
function makePrediction(overrides = {}) {
  return {
    label: 'Q3 销售额',
    predictedValue: 1280000,
    actualValue: 1150000,
    confidenceInterval: { lowerBound: 1100000, upperBound: 1450000, confidenceLevel: 0.95 },
    trend: 'up',
    anomalyScore: 0.12,
    ...overrides,
  };
}

const defaultSummary = {
  bestPrediction: 'Q3 销售额 128万',
  overallTrend: 'up' as const,
  changePercent: 12.5,
  riskLevel: 'low' as const,
  recommendation: '建议加大Q3营销投入，预计ROI可达3.2倍。',
};

// ---- 正例 ----
describe('PredictionAnalysisPanel', () => {
  test('renders title', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        title: '销售预测',
        predictions: [makePrediction()],
      })
    );
    assert.match(html, /销售预测/);
  });

  test('renders default title when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, { predictions: [makePrediction()] })
    );
    assert.match(html, /预测分析面板/);
  });

  test('renders summary with best prediction and trend', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [makePrediction()],
        summary: defaultSummary,
        unit: '元',
      })
    );
    assert.match(html, /最佳预测/);
    assert.match(html, /\+12\.5%/);
    assert.match(html, /低风险/);
  });

  test('renders recommendation from summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [makePrediction()],
        summary: defaultSummary,
      })
    );
    assert.match(html, /建议加大Q3营销投入/);
  });

  test('renders prediction bars with values', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [
          makePrediction({ label: '门店A', predictedValue: 500000 }),
          makePrediction({ label: '门店B', predictedValue: 800000 }),
        ],
        unit: '元',
      })
    );
    assert.match(html, /门店A/);
    assert.match(html, /门店B/);
    assert.match(html, /50/);
    assert.match(html, /80/);
  });

  test('shows actual value when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [makePrediction({ actualValue: 1100000 })],
        unit: '元',
      })
    );
    assert.match(html, /实际/);
    assert.match(html, /110/);
  });

  test('shows anomaly score when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [makePrediction({ anomalyScore: 0.85 })],
      })
    );
    assert.match(html, /异常分/);
    assert.match(html, /0.85/);
  });

  test('renders confidence interval bar', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [makePrediction()],
      })
    );
    assert.match(html, /CI/);
    assert.match(html, /95% CI/);
  });

  test('renders trend indicators', () => {
    const predictions = [
      makePrediction({ label: '上升项', trend: 'up', predictedValue: 100 }),
      makePrediction({ label: '下降项', trend: 'down', predictedValue: 50 }),
      makePrediction({ label: '稳定项', trend: 'stable', predictedValue: 75 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, { predictions })
    );
    assert.match(html, /上升/);
    assert.match(html, /下降/);
    assert.match(html, /稳定/);
  });

  // ---- 异常状态 ----
  test('shows loading skeleton when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [],
        loading: true,
      })
    );
    assert.match(html, /shimmer/);
    assert.match(html, /预测分析面板/);
  });

  test('shows error message when error is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [],
        error: '数据源连接超时',
      })
    );
    assert.match(html, /数据源连接超时/);
  });

  test('shows empty text when no predictions', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [],
        emptyText: '暂无预测数据，请稍后再试',
      })
    );
    assert.match(html, /暂无预测数据，请稍后再试/);
  });

  test('renders risk level chip in header', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [makePrediction()],
        summary: { ...defaultSummary, riskLevel: 'high' },
      })
    );
    assert.match(html, /高风险/);
  });

  test('renders multiple predictions with formatting', () => {
    const predictions = [
      makePrediction({ label: '门店A', predictedValue: 150000000 }),
      makePrediction({ label: '门店B', predictedValue: 25000 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, { predictions, unit: '元' })
    );
    assert.match(html, /门店A/);
    assert.match(html, /门店B/);
    assert.match(html, /亿/);
    assert.match(html, /万/);
  });

  test('supports custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictionAnalysisPanel, {
        predictions: [makePrediction()],
        className: 'custom-panel',
      })
    );
    assert.match(html, /custom-panel/);
  });
});
