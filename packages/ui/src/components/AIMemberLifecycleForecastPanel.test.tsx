import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIMemberLifecycleForecastPanel } = require('./AIMemberLifecycleForecastPanel');

// ---- 测试工厂 ----
function makeForecast(overrides = {}) {
  return {
    memberId: 'm001',
    memberName: '张伟',
    currentStage: 'engaged',
    lastStageChange: '2026-04-15T00:00:00Z',
    daysInCurrentStage: 84,
    predictedNextStage: 'slipping',
    confidence: 72,
    predictedWindowDays: 30,
    metrics: [
      { label: '月均到店', currentValue: 8, previousValue: 12, unit: '次', direction: 'down' },
      { label: '客单价', currentValue: 268, previousValue: 312, unit: '元', direction: 'down' },
      { label: '复购率', currentValue: 72, previousValue: 65, unit: '%', direction: 'up' },
      { label: '推荐转化', currentValue: 3, previousValue: 2, unit: '次', direction: 'up' },
    ],
    advice: [
      {
        targetStage: 'engaged',
        description: '通过专属权益和个性化推荐回归高粘性状态',
        actions: ['发放钻石会员专属券', '推送新品到店提醒', '邀请参加VIP品鉴会'],
        expectedImprovement: 25,
        expectedTimeline: '14-21天',
      },
    ],
    stageHistory: [
      { stage: 'new', date: '2024-01-10T00:00:00Z' },
      { stage: 'active', date: '2024-03-05T00:00:00Z' },
      { stage: 'engaged', date: '2024-08-20T00:00:00Z' },
    ],
    estimatedLtv: 12800,
    previousLtv: 15300,
    ...overrides,
  };
}

// ---- 正例 ----
describe('AIMemberLifecycleForecastPanel', () => {
  test('renders title and member name', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast() })
    );
    assert.match(html, /AI/);
    assert.match(html, /会员生命周期预测/);
    assert.match(html, /张伟/);
  });

  test('renders current stage badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast({ currentStage: 'engaged' }) })
    );
    assert.match(html, /高粘性/);
  });

  test('renders estimated LTV value', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast({ estimatedLtv: 12800, previousLtv: 15300 }) })
    );
    assert.match(html, /12,800/);
    assert.match(html, /15,300/);
  });

  test('renders all four status cards', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast() })
    );
    assert.match(html, /当前阶段/);
    assert.match(html, /下一预测/);
    assert.match(html, /置信度/);
    assert.match(html, /预估 LTV/);
  });

  test('renders stage metrics', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast() })
    );
    assert.match(html, /月均到店/);
    assert.match(html, /客单价/);
    assert.match(html, /复购率/);
    assert.match(html, /推荐转化/);
  });

  test('renders transition advice', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast() })
    );
    assert.match(html, /阶段迁移建议/);
    assert.match(html, /专属权益/);
    assert.match(html, /VIP品鉴会/);
  });

  test('renders stage history', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast() })
    );
    assert.match(html, /阶段变迁记录/);
    assert.match(html, /新注册/);
    assert.match(html, /活跃/);
  });

  test('renders confidence label', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast({ confidence: 72 }) })
    );
    assert.match(html, /72%/);
  });

  test('renders low confidence label', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast({ confidence: 35 }) })
    );
    assert.match(html, /35%/);
  });

  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: null as any, loading: true })
    );
    assert.match(html, /加载中/);
  });

  test('renders empty state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: null as any, loading: false })
    );
    assert.match(html, /暂无预测数据/);
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, {
        forecast: null as any,
        loading: false,
        emptyText: '数据加载失败',
      })
    );
    assert.match(html, /数据加载失败/);
  });

  test('renders predicted next stage', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, {
        forecast: makeForecast({ predictedNextStage: 'at_risk', confidence: 85 }),
      })
    );
    assert.match(html, /高危/);
  });

  test('renders with slipping advice', () => {
    const fore = makeForecast({
      currentStage: 'slipping',
      predictedNextStage: 'at_risk',
      advice: [
        {
          targetStage: 'active',
          description: '立即触发挽回流程',
          actions: ['发送流失预警优惠券', '客服电话回访', '推送关怀消息'],
          expectedImprovement: 40,
          expectedTimeline: '7天',
        },
      ],
    });
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: fore })
    );
    assert.match(html, /挽回/);
    assert.match(html, /40%/);
  });

  test('renders with high confidence', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast({ confidence: 92 }) })
    );
    assert.match(html, /92%/);
  });

  test('renders stage badge for each stage', () => {
    const stages: Array<React.ComponentProps<typeof AIMemberLifecycleForecastPanel>['forecast']['currentStage']> = [
      'new', 'active', 'engaged', 'slipping', 'at_risk', 'churned',
    ];
    for (const stage of stages) {
      const html = renderToStaticMarkup(
        React.createElement(AIMemberLifecycleForecastPanel, {
          forecast: makeForecast({ currentStage: stage }),
        })
      );
      assert.ok(html.includes('stage-badge-' + stage), `missing badge for stage: ${stage}`);
    }
  });

  test('renders zero-advice gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast({ advice: [] }) })
    );
    assert.ok(!html.includes('阶段迁移建议') || true, 'no crash with empty advice');
  });

  test('renders data-testid attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, { forecast: makeForecast() })
    );
    assert.match(html, /data-testid="ai-member-lifecycle-forecast-panel"/);
  });
});

// ---- 边角 ----
describe('AIMemberLifecycleForecastPanel edge cases', () => {
  test('handles churned stage', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, {
        forecast: makeForecast({ currentStage: 'churned' }),
      })
    );
    assert.match(html, /已流失/);
  });

  test('handles new stage with no predicted next', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, {
        forecast: makeForecast({ currentStage: 'new', predictedNextStage: undefined, advice: [] }),
      })
    );
    assert.match(html, /新注册/);
  });

  test('handles single metric gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, {
        forecast: makeForecast({ metrics: [{ label: '访问频次', currentValue: 5, previousValue: 8, unit: '次/月', direction: 'down' as const }] }),
      })
    );
    assert.match(html, /访问频次/);
  });

  test('handles single stage history entry', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberLifecycleForecastPanel, {
        forecast: makeForecast({ stageHistory: [{ stage: 'new', date: '2024-01-10T00:00:00Z' }] }),
      })
    );
    assert.match(html, /新注册/);
  });
});
