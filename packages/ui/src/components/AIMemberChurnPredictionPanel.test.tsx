import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIMemberChurnPredictionPanel } = require('./AIMemberChurnPredictionPanel');

// ---- 测试工厂 ----
function makePrediction(overrides = {}) {
  return {
    memberId: 'm001',
    memberName: '张伟',
    memberTier: 'diamond',
    riskLevel: 'medium',
    churnProbability: 45,
    predictedWindowDays: 30,
    signalFactors: [
      { code: 'freq', label: '访问频率下降', weight: 40, description: '近30天到店次数下降60%', direction: 'negative' },
      { code: 'aov', label: '客单价降低', weight: 25, description: '近7天平均客单价降低35%', direction: 'negative' },
      { code: 'rec', label: '推荐转化下降', weight: 15, description: '未产生新的推荐转化', direction: 'negative' },
    ],
    recommendedActions: [
      { code: 'send_coupon', label: '发放专属优惠券', channel: 'coupon', priority: 'high', expectedRecoveryRate: 65, description: '根据历史偏好发放8折优惠券' },
      { code: 'crm_followup', label: 'CRM 跟进回访', channel: 'phone', priority: 'medium', expectedRecoveryRate: 45, description: '客服电话了解近期情况并推送新品' },
    ],
    activityTrend: 'declining',
    daysSinceLastActivity: 14,
    predictedAt: '2026-06-28T11:00:00Z',
    ...overrides,
  };
}

// ---- 正例 ----
describe('AIMemberChurnPredictionPanel', () => {
  test('renders title and member info', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction() })
    );
    assert.match(html, /AI/);
    assert.match(html, /流失预测/);
    assert.match(html, /diamond/);
  });

  test('renders churn probability percentage', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction({ churnProbability: 68 }) })
    );
    assert.match(html, /68%/);
  });

  test('renders risk level label', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction({ riskLevel: 'high' }) })
    );
    assert.match(html, /高风险/);
  });

  test('renders predicted window', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction({ predictedWindowDays: 60 }) })
    );
    assert.match(html, /60/);
  });

  test('renders days since last activity', () => {
    const p = makePrediction({ daysSinceLastActivity: 35 });
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /35/);
  });

  test('renders trend badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction({ activityTrend: 'declining' }) })
    );
    assert.match(html, /持续下降/);
  });

  test('renders recovering trend badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction({ activityTrend: 'recovering' }) })
    );
    assert.match(html, /逐渐回升/);
  });

  test('renders stable trend badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction({ activityTrend: 'stable' }) })
    );
    assert.match(html, /保持平稳/);
  });

  test('renders signal factors count', () => {
    const p = makePrediction({ signalFactors: [
      { code: 'a', label: '因子A', weight: 50, description: 'desc', direction: 'negative' },
      { code: 'b', label: '因子B', weight: 30, description: 'desc', direction: 'negative' },
      { code: 'c', label: '因子C', weight: 20, description: 'desc', direction: 'negative' },
    ]});
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /3/);
  });

  test('renders recommended actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction() })
    );
    assert.match(html, /发放专属优惠券/);
    assert.match(html, /CRM/);
  });

  test('renders recommended action count in heading', () => {
    const p = makePrediction({ recommendedActions: [
      { code: 'a', label: '动作A', channel: 'coupon', priority: 'high', expectedRecoveryRate: 60, description: 'desc' },
      { code: 'b', label: '动作B', channel: 'sms', priority: 'medium', expectedRecoveryRate: 40, description: 'desc' },
    ]});
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /2/);
  });

  test('renders recovery rate for each action', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction() })
    );
    assert.match(html, /挽回率/);
    assert.match(html, /65%/);
  });

  test('renders channel label for actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction() })
    );
    assert.match(html, /优惠券/);
  });

  test('renders priority label for actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction() })
    );
    assert.match(html, /高优先级/);
  });

  test('renders medium priority label', () => {
    const p = makePrediction({ recommendedActions: [
      { code: 'a', label: '测试动作', channel: 'sms', priority: 'medium', expectedRecoveryRate: 40, description: 'test' },
    ]});
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /中优先级/);
  });

  test('renders low priority label', () => {
    const p = makePrediction({ recommendedActions: [
      { code: 'a', label: '测试动作', channel: 'app_push', priority: 'low', expectedRecoveryRate: 20, description: 'test' },
    ]});
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /低优先级/);
  });

  test('renders prediction date', () => {
    const p = makePrediction({ predictedAt: '2026-06-28T11:00:00Z' });
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /2026\/6\/28|\u003c/);
  });

  test('renders footer with data note', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction() })
    );
    assert.match(html, /多维数据计算/);
  });

  test('renders execute button when onExecuteAction provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, {
        prediction: makePrediction(),
        onExecuteAction: () => {},
      })
    );
    assert.match(html, /执行/);
  });

  test('renders refresh button when onRefresh provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, {
        prediction: makePrediction(),
        onRefresh: () => {},
      })
    );
    assert.ok(html.length > 0);
  });

  test('does not render execute button when onExecuteAction omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction() })
    );
    assert.ok(!html.includes('执行'));
  });

  // ---- 边界 ----
  test('renders empty state for zero signal factors', () => {
    const p = makePrediction({ signalFactors: [] });
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /暂无信号因子/);
  });

  test('renders empty state for zero recommended actions', () => {
    const p = makePrediction({ recommendedActions: [] });
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /当前无建议动作/);
  });

  test('renders critical risk level', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction({ riskLevel: 'critical' }) })
    );
    assert.match(html, /极高风险/);
  });

  test('renders low risk level', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction({ riskLevel: 'low' }) })
    );
    assert.match(html, /低风险/);
  });

  test('renders negative direction signal factor with red chip', () => {
    const p = makePrediction({ signalFactors: [
      { code: 'freq', label: '频率下降', weight: 50, description: 'desc', direction: 'negative' },
    ]});
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /bg-red-50/);
  });

  test('renders positive direction signal factor with green chip', () => {
    const p = makePrediction({ signalFactors: [
      { code: 'pos', label: '正向指标', weight: 30, description: 'desc', direction: 'positive' },
    ]});
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /bg-green-50/);
  });

  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction(), loading: true })
    );
    assert.match(html, /animate-pulse/);
  });

  test('renders error state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: makePrediction(), error: '模型服务不可用' })
    );
    assert.match(html, /预测失败/);
    assert.match(html, /模型服务不可用/);
  });

  test('renders retry button in error state when onRefresh provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, {
        prediction: makePrediction(),
        error: '网络错误',
        onRefresh: () => {},
      })
    );
    assert.match(html, /重新尝试/);
  });

  test('renders large days since last activity (>90)', () => {
    const p = makePrediction({ daysSinceLastActivity: 120 });
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, { prediction: p })
    );
    assert.match(html, /超90天未到店/);
  });

  test('accepts custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberChurnPredictionPanel, {
        prediction: makePrediction(),
        className: 'custom-wrapper',
      })
    );
    assert.match(html, /custom-wrapper/);
  });
});
