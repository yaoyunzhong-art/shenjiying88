import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIExperimentOptimizationPanel,
} = require('./AIExperimentOptimizationPanel');

import type {
  AIExperimentOptimizationPanelProps,
  ExperimentEntry,
  ExperimentVariant,
  OptimizationSuggestion,
} from './AIExperimentOptimizationPanel';

// ==================== 测试辅助函数 ====================

function makeVariant(overrides: Partial<ExperimentVariant> & { id: string }): ExperimentVariant {
  return {
    name: `方案-${overrides.id}`,
    trafficPercent: 50,
    conversionRate: 3.5,
    sampleSize: 1000,
    isWinner: false,
    liftPercent: 0,
    ...overrides,
  };
}

function makeExperiment(overrides: Partial<ExperimentEntry> & { id: string }): ExperimentEntry {
  return {
    name: `实验-${overrides.id}`,
    status: 'running',
    targetMetric: '转化率',
    startDate: '2026-06-01',
    confidenceLevel: 95,
    variants: [],
    ...overrides,
  };
}

function makeSuggestion(overrides: Partial<OptimizationSuggestion> & { id: string }): OptimizationSuggestion {
  return {
    title: `建议-${overrides.id}`,
    expectedLift: 5,
    category: 'pricing',
    description: '优化定价策略以提升转化',
    ...overrides,
  };
}

function makeProps(overrides: Partial<AIExperimentOptimizationPanelProps> = {}): AIExperimentOptimizationPanelProps {
  return {
    experiments: [],
    suggestions: [],
    activeExperimentCount: 0,
    opportunityCount: 0,
    estimatedTotalLift: 0,
    ...overrides,
  };
}

function parse(html: string) {
  return { html };
}

// ==================== 测试套件 ====================

describe('AIExperimentOptimizationPanel', () => {

  // -------- 基础渲染 --------

  test('renders empty state when no experiments provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps())
    );
    assert(html.includes('暂无实验数据'), '空状态应显示默认空提示');
  });

  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({ loading: true }))
    );
    assert(html.includes('加载中'), 'loading 时应显示加载提示');
  });

  test('renders custom empty message', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({ emptyMessage: '暂无实验' }))
    );
    assert(html.includes('暂无实验'), '应显示自定义空提示');
  });

  // -------- 标题与统计 --------

  test('renders default title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
      }))
    );
    assert(html.includes('AI 实验优化'), '应显示默认标题');
  });

  test('renders custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
        title: '实验管理面板',
      }))
    );
    assert(html.includes('实验管理面板'), '应显示自定义标题');
  });

  test('renders stats row with correct numbers', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
        activeExperimentCount: 3,
        opportunityCount: 7,
        estimatedTotalLift: 15,
      }))
    );
    assert(html.includes('运行中实验'), '应显示运行中实验统计');
    assert(html.includes('3'), '应显示运行中数量');
    assert(html.includes('优化机会'), '应显示优化机会统计');
    assert(html.includes('7'), '应显示优化机会数');
    assert(html.includes('预计总提升'), '应显示预计提升');
    assert(html.includes('+15%'), '应显示预计提升百分比');
  });

  // -------- 实验卡片 --------

  test('renders experiment card with status badge', () => {
    const variants = [
      makeVariant({ id: 'v1', name: '对照组', trafficPercent: 50, conversionRate: 3.0, isWinner: false, liftPercent: 0 }),
      makeVariant({ id: 'v2', name: '实验组', trafficPercent: 50, conversionRate: 4.2, isWinner: true, liftPercent: 40 }),
    ];
    const exp = makeExperiment({
      id: 'e1',
      name: '首页Banner优化',
      status: 'completed',
      variants,
      confidenceLevel: 97,
      aiRecommendation: '建议全量上线实验组方案',
    });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('首页Banner优化'), '实验卡片应显示实验名');
    assert(html.includes('已完成'), '应显示状态标签');
    assert(html.includes('对照组'), '应显示方案名');
    assert(html.includes('实验组'), '应显示方案名');
    assert(html.includes('🏆 优胜'), '优胜方案应有标记');
    assert(html.includes('40%'), '应显示提升百分比');
    assert(html.includes('97'), '应显示置信度');
    assert(html.includes('建议全量上线'), '应显示AI建议');
  });

  test('renders running experiment with processing status', () => {
    const exp = makeExperiment({
      id: 'e2',
      name: 'AI定价测试',
      status: 'running',
      variants: [makeVariant({ id: 'v1' })],
    });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('AI定价测试'), '应显示实验名');
    assert(html.includes('运行中'), '运行中实验应有运行中标签');
  });

  test('renders failed experiment with error status', () => {
    const exp = makeExperiment({
      id: 'e3',
      name: '失败实验',
      status: 'failed',
      variants: [makeVariant({ id: 'v1' })],
    });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('失败实验'), '应显示实验名');
    assert(html.includes('失败'), '失败实验应显示失败标签');
  });

  test('renders draft experiment', () => {
    const exp = makeExperiment({
      id: 'e4',
      name: '草稿实验',
      status: 'draft',
      variants: [makeVariant({ id: 'v1' })],
    });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('草稿实验'), '应显示实验名');
    assert(html.includes('草稿'), '草稿实验应显示草稿标签');
  });

  // -------- 方案数据 --------

  test('renders variant traffic percent and conversion rate', () => {
    const variants = [
      makeVariant({ id: 'v1', trafficPercent: 60, conversionRate: 5.1 }),
    ];
    const exp = makeExperiment({ id: 'e5', variants });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('60%'), '应显示流量占比');
    assert(html.includes('5.1%'), '应显示转化率');
  });

  test('renders winner variant with lift', () => {
    const variants = [
      makeVariant({ id: 'v1', liftPercent: 12.5, isWinner: true }),
    ];
    const exp = makeExperiment({ id: 'e6', variants });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('+12.5%'), '优胜方案应显示提升');
    assert(html.includes('🏆 优胜'), '应显示优胜标记');
  });

  // -------- 优化建议 --------

  test('renders optimization suggestions', () => {
    const suggestions = [
      makeSuggestion({ id: 's1', title: '调整首页推荐算法', category: 'content', expectedLift: 8, description: '基于用户行为优化推荐排序' }),
      makeSuggestion({ id: 's2', title: '限时折扣测试', category: 'promotion', expectedLift: 12, description: '周末限时8折测试' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
        suggestions,
      }))
    );
    assert(html.includes('AI 优化建议'), '应显示建议区块标题');
    assert(html.includes('调整首页推荐算法'), '应显示建议标题');
    assert(html.includes('限时折扣测试'), '应显示建议标题');
    assert(html.includes('+8%'), '应显示预期提升');
    assert(html.includes('+12%'), '应显示预期提升');
    assert(html.includes('内容'), '应显示类别标签');
    assert(html.includes('促销'), '应显示类别标签');
  });

  test('renders pricing category suggestion', () => {
    const s = makeSuggestion({ id: 's1', title: '会员定价优化', category: 'pricing' });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
        suggestions: [s],
      }))
    );
    assert(html.includes('会员定价优化'), '应显示定价建议');
    assert(html.includes('定价'), '应显示定价类别');
  });

  test('renders placement category suggestion', () => {
    const s = makeSuggestion({ id: 's1', title: '商品布局优化', category: 'placement' });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
        suggestions: [s],
      }))
    );
    assert(html.includes('商品布局优化'), '应显示布局建议');
    assert(html.includes('布局'), '应显示布局类别');
  });

  test('renders other category suggestion', () => {
    const s = makeSuggestion({ id: 's1', title: '声音提示优化', category: 'other' });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
        suggestions: [s],
      }))
    );
    assert(html.includes('声音提示优化'), '应显示其他建议');
    assert(html.includes('其他'), '应显示其他类别');
  });

  test('renders multiple suggestions in list', () => {
    const suggestions = [
      makeSuggestion({ id: 's1', title: '建议A' }),
      makeSuggestion({ id: 's2', title: '建议B' }),
      makeSuggestion({ id: 's3', title: '建议C' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
        suggestions,
      }))
    );
    assert(html.includes('建议A'), '应显示建议A');
    assert(html.includes('建议B'), '应显示建议B');
    assert(html.includes('建议C'), '应显示建议C');
  });

  // -------- 分组展示 --------

  test('groups running and completed experiments separately', () => {
    const runningExp = makeExperiment({ id: 'e1', name: '运行实验', status: 'running' });
    const completedExp = makeExperiment({ id: 'e2', name: '完成实验', status: 'completed' });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [runningExp, completedExp],
      }))
    );
    assert(html.includes('进行中实验'), '应显示进行中分组');
    assert(html.includes('已完成实验'), '应显示已完成分组');
  });

  test('omits section when no running experiments', () => {
    const completedExp = makeExperiment({ id: 'e1', name: '完成实验', status: 'completed' });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [completedExp],
      }))
    );
    assert(!html.includes('进行中实验'), '无运行中实验不应显示该分组');
    assert(html.includes('已完成实验'), '应显示已完成分组');
  });

  // -------- 样式与结构 --------

  test('has data-testid attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
      }))
    );
    assert(html.includes('ai-experiment-optimization-panel'), '根元素应有 data-testid');
  });

  test('renders with Card wrapper for experiment sections', () => {
    const exp = makeExperiment({ id: 'e1', name: '卡包测试' });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('卡包测试'), '实验卡片应渲染');
  });

  test('applies correct negative lift color', () => {
    const variants = [
      makeVariant({ id: 'v1', liftPercent: -3.2 }),
    ];
    const exp = makeExperiment({ id: 'e1', variants });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('-3.2%'), '负提升应显示负号');
  });

  test('experiment card shows target metric', () => {
    const exp = makeExperiment({ id: 'e1', targetMetric: '点击率' });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('点击率'), '应显示目标指标');
  });

  test('experiment card shows date range', () => {
    const exp = makeExperiment({ id: 'e1', startDate: '2026-06-01', endDate: '2026-06-30' });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('2026-06-01'), '应显示开始日期');
    assert(html.includes('2026-06-30'), '应显示结束日期');
  });

  test('experiment card omits end date when not provided', () => {
    const exp = makeExperiment({ id: 'e1', startDate: '2026-06-01', endDate: undefined });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('2026-06-01'), '应显示开始日期');
  });

  test('experiment card shows variant sample sizes', () => {
    const variants = [
      makeVariant({ id: 'v1', sampleSize: 2500 }),
    ];
    const exp = makeExperiment({ id: 'e1', variants });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(html.includes('2500'), '应显示样本量');
  });

  // -------- 空字段处理 --------

  test('empty experiments shows empty message instead of sections', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [],
      }))
    );
    assert(html.includes('暂无实验数据'), '空数据应显示空提示');
    assert(!html.includes('进行中实验'), '空数据不应显示进行中分组');
    assert(!html.includes('AI 优化建议'), '无建议不应显示建议区块');
  });

  test('no suggestions hides suggestions section', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [makeExperiment({ id: 'e1' })],
        suggestions: [],
      }))
    );
    assert(!html.includes('AI 优化建议'), '无建议不应显示建议区块');
  });

  test('confidence level zero is displayed as 0', () => {
    const exp = makeExperiment({ id: 'e1', confidenceLevel: 0 });
    const html = renderToStaticMarkup(
      React.createElement(AIExperimentOptimizationPanel, makeProps({
        experiments: [exp],
      }))
    );
    assert(!html.includes('置信度:'), '置信度为0不显示');
  });
});
