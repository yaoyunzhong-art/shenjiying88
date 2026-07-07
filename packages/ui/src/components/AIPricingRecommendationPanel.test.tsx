import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIPricingRecommendationPanel,
} = require('./AIPricingRecommendationPanel');

import type { AIPricingRecommendationPanelProps, PricingRecommendation, PricingSummary } from './AIPricingRecommendationPanel';

// ==================== 测试辅助函数 ====================

function makeRecommendation(overrides: Partial<PricingRecommendation> & { productId: string }): PricingRecommendation {
  return {
    productName: `商品-${overrides.productId}`,
    currentPrice: 100,
    recommendedPrice: 120,
    changePercent: 20,
    estimatedSalesImpact: -5,
    estimatedProfitImpact: 15,
    confidence: 85,
    strategy: 'markup',
    reason: '市场需求旺盛，竞品价格上调',
    ...overrides,
  };
}

function makeSummary(overrides: Partial<PricingSummary> = {}): PricingSummary {
  return {
    totalProducts: 10,
    markupCount: 6,
    markdownCount: 4,
    averageChangePercent: 8.5,
    totalRevenueImpact: 125000,
    analysisTimeRange: '2026-06-22 ~ 2026-06-28',
    ...overrides,
  };
}

function renderComponent(props: Partial<AIPricingRecommendationPanelProps> = {}): string {
  const defaultProps: AIPricingRecommendationPanelProps = {
    recommendations: [],
    summary: makeSummary({ totalProducts: 0 }),
    onApplyRecommendation: () => {},
    onDismissRecommendation: () => {},
    ...props,
  };
  return renderToStaticMarkup(React.createElement(AIPricingRecommendationPanel, defaultProps));
}

// ==================== 测试用例 ====================

describe('AIPricingRecommendationPanel', () => {

  // -------- 加载状态 --------
  test('loading state: renders spinner when loading=true', () => {
    const html = renderComponent({ loading: true });
    assert.ok(html.includes('pricing-panel-loading'), 'should have loading wrapper');
    assert.ok(html.includes('AI 正在分析定价策略'), 'should show loading text');
  });

  // -------- 错误状态 --------
  test('error state: shows error message with retry button', () => {
    const onRefresh = () => {};
    const html = renderComponent({ error: 'API 请求超时', onRefresh });
    assert.ok(html.includes('pricing-panel-error'), 'should have error wrapper');
    assert.ok(html.includes('API 请求超时'), 'should show error text');
    assert.ok(html.includes('重试'), 'should show retry button');
  });

  test('error state: without onRefresh no retry button', () => {
    const html = renderComponent({ error: '错误' });
    assert.ok(html.includes('分析出错了'));
    assert.ok(!html.includes('重试'), 'should not render retry when no callback');
  });

  // -------- 空状态 --------
  test('empty state: shows empty message when no recommendations', () => {
    const html = renderComponent({ summary: makeSummary() });
    assert.ok(html.includes('pricing-panel-empty'), 'should have empty wrapper');
    assert.ok(html.includes('暂无定价建议'), 'should show empty message');
  });

  // -------- 正常渲染 --------
  test('renders summary with correct counts', () => {
    const summary = makeSummary({ totalProducts: 15, markupCount: 9, markdownCount: 6, totalRevenueImpact: 200000 });
    const recommendations = [
      makeRecommendation({ productId: 'p1', productName: '商品A' }),
      makeRecommendation({ productId: 'p2', productName: '商品B', strategy: 'markdown', changePercent: -10, recommendedPrice: 90 }),
    ];
    const html = renderComponent({ recommendations, summary });
    assert.ok(html.includes('pricing-summary'), 'should render summary section');
    assert.ok(html.includes('15'), 'should show total');
    assert.ok(html.includes('9'), 'should show markup count');
    assert.ok(html.includes('6'), 'should show markdown count');
    assert.ok(html.includes('¥200,000.00'), 'should format total revenue impact');
  });

  // -------- 推荐列表渲染 --------
  test('renders recommendation cards with price info', () => {
    const rec = makeRecommendation({ productId: 'p1', productName: '测试商品', currentPrice: 50, recommendedPrice: 65, changePercent: 30 });
    const html = renderComponent({ recommendations: [rec], summary: makeSummary() });
    assert.ok(html.includes('测试商品'), 'should show product name');
    assert.ok(html.includes('¥65.00'), 'should show recommended price');
    assert.ok(html.includes('¥50.00'), 'should show current price');
    assert.ok(html.includes('+30.0%'), 'should show change percent');
  });

  // -------- 策略标签 --------
  test('shows correct strategy labels', () => {
    const recs = [
      makeRecommendation({ productId: 'a', strategy: 'markup' }),
      makeRecommendation({ productId: 'b', strategy: 'markdown' }),
      makeRecommendation({ productId: 'c', strategy: 'promotion' }),
    ];
    const html = renderComponent({ recommendations: recs, summary: makeSummary() });
    assert.ok(html.includes('提价'), 'markup strategy label');
    assert.ok(html.includes('降价'), 'markdown strategy label');
    assert.ok(html.includes('促销'), 'promotion strategy label');
  });

  // -------- 置信度进度条 --------
  test('renders confidence bar with percentage', () => {
    const rec = makeRecommendation({ productId: 'p1', confidence: 72 });
    const html = renderComponent({ recommendations: [rec], summary: makeSummary() });
    assert.ok(html.includes('72%'), 'should show confidence percentage');
    assert.ok(html.includes('width: 72%') || html.includes("width:72%"), 'should set progress width');
  });

  // -------- 竞品比较 --------
  test('renders competitor comparison when present', () => {
    const rec = makeRecommendation({
      productId: 'p1',
      competitorComparison: { competitorName: '竞品A', competitorPrice: 110, position: 'below' },
    });
    const html = renderComponent({ recommendations: [rec], summary: makeSummary() });
    assert.ok(html.includes('竞品A'), 'should show competitor name');
    assert.ok(html.includes('¥110.00'), 'should show competitor price');
    assert.ok(html.includes('高于竞品'), 'should show position description');
  });

  test('omits competitor comparison when absent', () => {
    const rec = makeRecommendation({ productId: 'p1' });
    const html = renderComponent({ recommendations: [rec], summary: makeSummary() });
    assert.ok(!html.includes('竞争对手'), 'should not render competitor section');
  });

  // -------- 操作按钮 --------
  test('renders apply and dismiss buttons for each recommendation', () => {
    const rec = makeRecommendation({ productId: 'p1' });
    const html = renderComponent({ recommendations: [rec], summary: makeSummary() });
    assert.ok(html.includes('data-testid="apply-p1"'), 'should have apply button');
    assert.ok(html.includes('data-testid="dismiss-p1"'), 'should have dismiss button');
  });

  // -------- 批量应用按钮 --------
  test('renders apply-all button when onApplyAll provided and >1 items', () => {
    const recs = [
      makeRecommendation({ productId: 'p1' }),
      makeRecommendation({ productId: 'p2' }),
    ];
    const html = renderComponent({ recommendations: recs, summary: makeSummary(), onApplyAll: () => {} });
    assert.ok(html.includes('apply-all-btn'), 'should render apply all button');
    assert.ok(html.includes('应用全部建议'), 'should show text');
  });

  test('does not render apply-all button when only 1 item', () => {
    const html = renderComponent({
      recommendations: [makeRecommendation({ productId: 'p1' })],
      summary: makeSummary(),
      onApplyAll: () => {},
    });
    assert.ok(!html.includes('apply-all-btn'), 'should not render for single item');
  });

  test('does not render apply-all button when onApplyAll not provided', () => {
    const recs = [
      makeRecommendation({ productId: 'p1' }),
      makeRecommendation({ productId: 'p2' }),
    ];
    const html = renderComponent({ recommendations: recs, summary: makeSummary() });
    assert.ok(!html.includes('apply-all-btn'), 'should not render without callback');
  });

  // -------- 排序 --------
  test('sorts recommendations by abs change descending', () => {
    const recs = [
      makeRecommendation({ productId: 'a', changePercent: 5 }),
      makeRecommendation({ productId: 'b', changePercent: 30 }),
      makeRecommendation({ productId: 'c', changePercent: -15 }),
    ];
    const html = renderComponent({ recommendations: recs, summary: makeSummary() });
    // b has highest abs change (30)
    const indexB = html.indexOf('商品-b');
    const indexC = html.indexOf('商品-c');
    const indexA = html.indexOf('商品-a');
    assert.ok(indexB < indexC, 'b should come before c');
    assert.ok(indexC < indexA, 'c should come before a');
  });

  // -------- 边缘情况 --------
  test('renders with zero recommendations but summary still shown', () => {
    const html = renderComponent({
      recommendations: [],
      summary: makeSummary({ totalProducts: 5, markupCount: 0, markdownCount: 0 }),
    });
    assert.ok(html.includes('暂无定价建议'), 'should show empty');
  });

  test('handles negative profit impact correctly', () => {
    const rec = makeRecommendation({ productId: 'p1', estimatedProfitImpact: -500, strategy: 'markdown' });
    const html = renderComponent({ recommendations: [rec], summary: makeSummary() });
    assert.ok(html.includes('-¥500.00') || html.includes('¥-500.00'), 'should show negative impact');
  });

  test('handles large number of recommendations gracefully', () => {
    const recs = Array.from({ length: 20 }, (_, i) =>
      makeRecommendation({ productId: `p${i}`, changePercent: (i % 10) * 5 })
    );
    const html = renderComponent({ recommendations: recs, summary: makeSummary() });
    assert.ok(html.includes('pricing-recommendations'), 'should render list container');
  });

});
