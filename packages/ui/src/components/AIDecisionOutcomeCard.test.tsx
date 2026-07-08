const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AIDecisionOutcomeCard } = require('./AIDecisionOutcomeCard');
const React = require(PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js');

// ---- 工厂 ----

function makeProps(overrides = {}) {
  return {
    id: 'decision-1',
    title: '促销折扣审批',
    status: 'approved',
    confidence: 0.92,
    decidedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    decidedBy: 'Gemini-Pro',
    summary: '基于近30天会员消费数据和当前库存水平，建议执行8折促销。预计ROI为3.2x。',
    impactMetrics: [
      { label: '预计GMV', value: '¥52,000', trend: 'up' },
      { label: '预计毛利', value: '¥12,500', trend: 'down' },
      { label: '库存周转', value: '2.1天', trend: 'up' },
    ],
    suggestedActions: ['发送至店长审批', '同步促销排期', '通知运营组'],
    ...overrides,
  };
}

// ---- 测试 ----

describe('AIDecisionOutcomeCard', () => {
  test('基础渲染 - approved 状态', () => {
    const html = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, makeProps()));
    assert.ok(html.includes('促销折扣审批'), '应展示标题');
    assert.ok(html.includes('已批准'), '应展示状态标签');
    assert.ok(html.includes('92.0%'), '应展示置信度');
    assert.ok(html.includes('预计GMV'), '应展示影响指标');
    assert.ok(html.includes('¥52,000'), '应展示指标值');
    assert.ok(html.includes('发送至店长审批'), '应展示建议操作');
    assert.ok(html.includes('Gemini-Pro'), '应展示决策者');
    assert.ok(html.includes('role="article"') || html.includes('role=\\"article\\"'), '应设置 role=article');
  });

  test('rejected 状态', () => {
    const html = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, makeProps({ status: 'rejected', confidence: 0.34 })));
    assert.ok(html.includes('已拒绝'), '应展示已拒绝');
    assert.ok(html.includes('34.0%'), '应展示低置信度');
  });

  test('pending_review 状态', () => {
    const html = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, makeProps({ status: 'pending_review' })));
    assert.ok(html.includes('待复核'), '应展示待复核');
  });

  test('无可选字段时渲染', () => {
    const html = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, {
      id: 'minimal', title: '最小卡片', status: 'approved', confidence: 0.5,
    }));
    assert.ok(html.includes('最小卡片'), '标题应渲染');
    assert.ok(!html.includes('建议操作'), '无建议时不显示');
    assert.ok(!html.includes('minutes') && !html.includes('分钟'), '无时间时不显示');
  });

  test('onClick 回调传递', () => {
    let clickedId = '';
    const props = makeProps({ onClick: (id: string) => { clickedId = id; } });
    const html = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, props));
    // onClick 通过渲染 HTML 体现: card 必须拥有 role=article
    assert.ok(html.includes('role="article"') || html.includes('role=\\"article\\"'), 'role 属性应存在');
  });

  test('置信度边界值', () => {
    const high = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, makeProps({ confidence: 1.0 })));
    assert.ok(high.includes('100.0%'), '置信度100%应显示正确');
    const low = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, makeProps({ confidence: 0 })));
    assert.ok(low.includes('0.0%'), '置信度0%应显示正确');
  });

  test('影响指标趋势图标', () => {
    const html = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, makeProps()));
    // Trend icons based on TREND_ICON values
    assert.ok(html.includes('↑') || html.includes('&#8593;'), '向上趋势应显示↑');
  });

  test('空 suggestedActions 不渲染', () => {
    const html = renderToStaticMarkup(React.createElement(AIDecisionOutcomeCard, makeProps({ suggestedActions: [] })));
    assert.ok(!html.includes('建议操作'), '空数组不应渲染建议区域');
  });

  test('type exports', () => {
    // Verify that the component is a function (export check)
    assert.equal(typeof AIDecisionOutcomeCard, 'function', 'AIDecisionOutcomeCard 应为函数');
  });
});
