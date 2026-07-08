/**
 * AIDecisionExplainerPanel.test.tsx — L1 测试（正例 + 反例 + 边界）
 * 测试 AI 可解释性决策面板的完整场景：
 * - 基本渲染与置信度环
 * - 因素分析与权重柱
 * - 候选方案对比卡
 * - 执行链路步骤
 * - 折叠展开交互
 * - 边界情况（空因素/无候选/低置信度）
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AIDecisionExplainerPanel } = require('./AIDecisionExplainerPanel');

import type { ExplainabilityData, DecisionFactor, DecisionCandidate, DecisionStep } from './AIDecisionExplainerPanel';

// ---- Mock data ----

function makeStandardData(): ExplainabilityData {
  return {
    decisionId: 'dec-20260708-001',
    timestamp: '2026-07-08 13:23:00',
    decisionType: '会员等级晋升评估',
    finalDecision: '晋升为黄金会员',
    overallConfidence: 0.87,
    summary: '基于会员近3个月消费频次、客单价及活跃度综合分析，会员各项指标均超过黄金会员晋升阈值。',
    alternative: '若考虑流失风险，建议先进入观察期2周再做最终晋升确认。',
    factors: [
      { name: '近3月消费频次', weight: 35, type: 'positive' as const, icon: '🛒', description: '月均消费 4.2 次，超过黄金阈值 3.5 次', details: ['6月: 5次', '5月: 4次', '4月: 3次'] },
      { name: '客单价趋势', weight: 28, type: 'positive' as const, icon: '💰', description: '客单价 ¥286，同比增长 15%' },
      { name: '活跃度积分', weight: 22, type: 'positive' as const, icon: '🔥', description: '活跃度评分 92/100，连续2月提升' },
      { name: '退货率', weight: 15, type: 'negative' as const, icon: '📦', description: '近3月退货率 8%，略高于会员均值 5%' },
    ],
    candidates: [
      { id: 'gold', label: '晋升黄金会员', score: 87, confidence: 0.87, selected: true, strengths: ['消费频次达标', '客单价增长'], weaknesses: ['退货率偏高'] },
      { id: 'silver', label: '维持白银会员', score: 45, confidence: 0.45, selected: false, strengths: ['无风险'], weaknesses: ['增长动力未被充分利用'] },
      { id: 'probation', label: '观察期2周', score: 62, confidence: 0.62, selected: false, strengths: ['降低流失风险'], weaknesses: ['延迟晋升体验'] },
    ],
    steps: [
      { order: 1, name: '数据拉取', status: 'completed' as const, durationMs: 12, output: '从数仓拉取近90天消费记录，共 127 条' },
      { order: 2, name: '特征工程', status: 'completed' as const, durationMs: 45, output: '计算 6 个核心指标: 频次、客单价、活跃度、退货率、品类偏好、支付方式' },
      { order: 3, name: '规则引擎匹配', status: 'completed' as const, durationMs: 8, output: '15 条等级规则全部匹配，8 条通过，2 条预警' },
      { order: 4, name: '综合评分计算', status: 'completed' as const, durationMs: 23, output: '加权总分 87/100，超过黄金阈值 80' },
      { order: 5, name: '决策输出', status: 'completed' as const, durationMs: 3, output: '推荐操作: 晋升黄金会员' },
    ],
  };
}

function makeEmptyFactorsData(): ExplainabilityData {
  const data = makeStandardData();
  return { ...data, factors: [] };
}

function makeLowConfidenceData(): ExplainabilityData {
  const data = makeStandardData();
  return {
    ...data,
    overallConfidence: 0.32,
    finalDecision: '需人工审核',
    summary: '多个核心指标数据不充分，无法自动决策，建议转人工审核。',
    alternative: undefined,
    candidates: [],
  };
}

function makeNegativeFactorsData(): ExplainabilityData {
  const data = makeStandardData();
  return {
    ...data,
    factors: [
      { name: '不活跃天数', weight: 40, type: 'negative' as const, icon: '📉', description: '连续15天未登录App' },
      { name: '消费降级', weight: 30, type: 'positive' as const, icon: '📊', description: '6月客单价环比下降20%' },
      { name: '投诉记录', weight: 20, type: 'neutral' as const, icon: '📋', description: '近30天无投诉' },
      { name: '竞品倾向', weight: 10, type: 'negative' as const, icon: '🔍', description: '近7天浏览竞品频次上升' },
    ],
  };
}

function makeWithFactorDetails(): ExplainabilityData {
  const data = makeStandardData();
  return {
    ...data,
    factors: [
      { name: '消费频次', weight: 40, type: 'positive' as const, description: '正向因素详情', details: ['6月到店5次', '5月到店3次', '4月到店4次'] },
      { name: '客单价', weight: 30, type: 'negative' as const },
      { name: '活跃度', weight: 30, type: 'neutral' as const, description: '活跃度评分85' },
    ],
  };
}

// ---- 测试 ----

describe('AIDecisionExplainerPanel', () => {
  // ============ 正例 ============

  describe('正例 (positive cases)', () => {
    test('should render with default title', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('AI 决策解释'), 'should include default title');
    });

    test('should render custom title', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, {
          data: makeStandardData(),
          title: '自定义解释标题',
        })
      );
      assert.ok(html.includes('自定义解释标题'), 'should include custom title');
    });

    test('should render decision ID and type in header', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('dec-20260708'), 'should include decision ID part');
      assert.ok(html.includes('会员等级晋升评估'), 'should include decision type');
    });

    test('should render decision summary text', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('消费频次'), 'should include factor analysis text');
    });

    test('should render alternative suggestion', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('备选建议'), 'should show alternative section');
    });

    test('should render factor section header', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('影响因素分析'), 'should show factor section header');
    });

    test('should render all 4 factor names', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('近3月消费频次'), 'factor 1 name');
      assert.ok(html.includes('客单价趋势'), 'factor 2 name');
      assert.ok(html.includes('活跃度积分'), 'factor 3 name');
      assert.ok(html.includes('退货率'), 'factor 4 name');
    });

    test('should render factor weight percentages', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('35%'), 'first factor weight 35%');
      assert.ok(html.includes('28%'), 'second factor weight 28%');
      assert.ok(html.includes('22%'), 'third factor weight 22%');
      assert.ok(html.includes('15%'), 'fourth factor weight 15%');
    });

    test('should render factor type labels (正向贡献 / 负向抑制)', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('正向贡献'), 'positive factor label');
      assert.ok(html.includes('负向抑制'), 'negative factor label');
    });

    test('should render factor descriptions', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('月均消费 4.2'), 'factor description text');
      assert.ok(html.includes('客单价 ¥286'), 'factor description text');
    });

    test('should render factor detail list items', () => {
      const data = makeWithFactorDetails();
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data })
      );
      assert.ok(html.includes('6月到店5次'), 'detail item 1');
      assert.ok(html.includes('5月到店3次'), 'detail item 2');
    });

    test('should render candidate section header', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('候选方案对比'), 'candidate section header');
    });

    test('should render all 3 candidate labels', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('晋升黄金会员'), 'gold candidate label');
      assert.ok(html.includes('维持白银会员'), 'silver candidate label');
      assert.ok(html.includes('观察期2周'), 'probation candidate label');
    });

    test('should render selected badge on gold candidate', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('已选'), 'selected badge should appear');
    });

    test('should render candidate scores', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('87'), 'gold score');
      assert.ok(html.includes('45'), 'silver score');
      assert.ok(html.includes('62'), 'probation score');
    });

    test('should render candidate strengths and weaknesses', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('消费频次达标'), 'strength');
      assert.ok(html.includes('退货率偏高'), 'weakness');
    });

    test('should render step section header', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('决策执行链路'), 'step section header');
    });

    test('should render all 5 step names', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('数据拉取'), 'step 1');
      assert.ok(html.includes('特征工程'), 'step 2');
      assert.ok(html.includes('规则引擎匹配'), 'step 3');
      assert.ok(html.includes('综合评分计算'), 'step 4');
      assert.ok(html.includes('决策输出'), 'step 5');
    });

    test('should render step descriptions', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('从数仓拉取近90天消费记录'), 'step 1 output');
      assert.ok(html.includes('计算 6 个核心指标'), 'step 2 output');
    });

    test('should render step durations', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('12ms'), 'step 1 duration');
      assert.ok(html.includes('45ms'), 'step 2 duration');
      assert.ok(html.includes('8ms'), 'step 3 duration');
    });

    test('should render confidence ring element with SVG', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('<svg'), 'should contain SVG element for confidence ring');
    });

    test('should render timestamp in footer', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeStandardData() })
      );
      assert.ok(html.includes('2026-07-08'), 'should render timestamp');
    });
  });

  // ============ 反例 ============

  describe('反例 (negative cases)', () => {
    test('should not render alternative when not provided', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeLowConfidenceData() })
      );
      assert.ok(!html.includes('备选建议'), 'should not render alternative when undefined');
    });

    test('should not render candidate cards section when candidates array is empty', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeLowConfidenceData() })
      );
      assert.ok(!html.includes('候选方案对比'), 'should not render candidate section when empty');
    });

    test('should not reference removed candidate labels for low confidence data', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeLowConfidenceData() })
      );
      // candidates section should be hidden
      assert.ok(!html.includes('候选方案对比'), 'candidate section hidden for empty candidates');
    });

    test('should not render step durations when not provided', () => {
      const data = makeStandardData();
      data.steps = [
        { order: 1, name: '分析', status: 'completed' as const, output: 'done' },
      ];
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data })
      );
      assert.ok(html.includes('分析'), 'should render step name');
      // No duration => no ms string
      assert.ok(!html.includes('undefined'), 'should not render undefined duration values');
    });

    test('should not throw on null data (graceful handling)', () => {
      // Pass undefined data instead of null to test graceful behavior
      // The component should render without crashing
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: undefined as any })
      );
      assert.ok(typeof html === 'string', 'should render even with undefined data');
      assert.ok(html.includes('AI 决策解释'), 'header still rendered');
    });
  });

  // ============ 边界 ============

  describe('边界 (edge cases)', () => {
    test('should render factor section header even with empty factors', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeEmptyFactorsData() })
      );
      assert.ok(html.includes('影响因素分析'), 'factors section header rendered');
    });

    test('should collapse content when defaultExpanded is false', () => {
      const data = makeStandardData();
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, {
          data,
          collapsible: true,
          defaultExpanded: false,
        })
      );
      // Title should still be visible
      assert.ok(html.includes('AI 决策解释'), 'title rendered');
      // But content sections should not appear
      assert.ok(!html.includes('影响因素分析'), 'factors section should be hidden when collapsed');
    });

    test('should render with variant h5', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, {
          data: makeStandardData(),
          variant: 'h5',
        })
      );
      assert.ok(html.includes('AI 决策解释'), 'h5 variant renders');
    });

    test('should render with variant pc', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, {
          data: makeStandardData(),
          variant: 'pc',
        })
      );
      assert.ok(html.includes('AI 决策解释'), 'pc variant renders');
    });

    test('should render all three factor types (positive/negative/neutral)', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data: makeNegativeFactorsData() })
      );
      assert.ok(html.includes('正向贡献'), 'positive factor');
      assert.ok(html.includes('负向抑制'), 'negative factor');
      assert.ok(html.includes('中性参考'), 'neutral factor');
    });

    test('should render factor without details or description gracefully', () => {
      const data = makeStandardData();
      const factorWithoutDetails: DecisionFactor = { name: '单因素测试', weight: 100, type: 'positive' };
      data.factors = [factorWithoutDetails];
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionExplainerPanel, { data })
      );
      assert.ok(html.includes('单因素测试'), 'should render factor name');
    });
  });
});
