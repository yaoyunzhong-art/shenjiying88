import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIDemandForecastPanel,
} = require('./AIDemandForecastPanel');

import type { AIDemandForecastPanelProps, DemandForecastEntry, ForecastModelMeta } from './AIDemandForecastPanel';

// ==================== 测试辅助函数 ====================

/** 构建一个默认的预测实体 */
function makeEntry(overrides: Partial<DemandForecastEntry> & { id: string }): DemandForecastEntry {
  return {
    name: `预测项-${overrides.id}`,
    forecastValue: 1000,
    confidence: 85,
    changePercent: 5,
    ...overrides,
  };
}

/** 构建默认模型元信息 */
function makeModelMeta(overrides: Partial<ForecastModelMeta> = {}): ForecastModelMeta {
  return {
    modelName: 'Prophet+XGBoost',
    modelVersion: '2.3.1',
    accuracy: 91,
    trainingRange: '2025-01 ~ 2026-05',
    updatedAt: '2026-06-27',
    ...overrides,
  };
}

/** 构建默认 props */
function makeProps(overrides: Partial<AIDemandForecastPanelProps> = {}): AIDemandForecastPanelProps {
  return {
    entries: [],
    ...overrides,
  };
}

/** 解析渲染出的 HTML */
function parse(html: string) {
  // 用简单的字符串查找来验证，无需 DOM 解析器
  return { html };
}

// ==================== 测试套件 ====================

describe('AIDemandForecastPanel', () => {

  // -------- 基础渲染 --------
  test('renders title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        title: '6月品类预测',
        entries: [makeEntry({ id: 'cat-1' })],
      }))
    );
    assert.ok(html.includes('6月品类预测'), 'should render custom title');
    assert.ok(html.includes('ai-demand-forecast-panel'), 'should have default testid');
  });

  test('renders default title when no title given', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        dimension: 'category',
        entries: [makeEntry({ id: 'cat-1' })],
      }))
    );
    assert.ok(html.includes('AI 品类预测'), 'should render AI + dimension title');
  });

  test('renders empty state when entries are empty', () => {
    const emptyText = '暂无数据';
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({ emptyText }))
    );
    assert.ok(html.includes('暂无数据'), 'should show custom empty text');
  });

  test('renders default empty text when entries empty and no custom text', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps())
    );
    assert.ok(html.includes('暂无需求预测数据'), 'should show default empty text');
  });

  // -------- 加载状态 --------
  test('shows loading indicator when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        loading: true,
        entries: [makeEntry({ id: 'demo' })],
      }))
    );
    assert.ok(html.includes('AI 正在计算预测'), 'should show loading text');
    assert.ok(!html.includes('forecast-total-summary'), 'should NOT show summary when loading');
    assert.ok(!html.includes('forecast-model-info'), 'should NOT show model info when loading');
  });

  // -------- 模型信息条 --------
  test('renders model meta info when provided', () => {
    const meta = makeModelMeta({ modelName: 'LightGBM', accuracy: 88 });
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        modelMeta: meta,
        entries: [makeEntry({ id: 'x' })],
      }))
    );
    assert.ok(html.includes('LightGBM'), 'should render model name');
    assert.ok(html.includes('88%'), 'should render accuracy');
    assert.ok(html.includes('forecast-model-info'), 'should contain model info testid');
  });

  test('does not render model info when modelMeta is not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [makeEntry({ id: 'x' })],
      }))
    );
    assert.ok(!html.includes('forecast-model-info'), 'should NOT have model info element');
  });

  // -------- 总体汇总 --------
  test('renders total forecast summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        totalForecast: 50000,
        totalChangePercent: 12.5,
        entries: [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })],
      }))
    );
    assert.ok(html.includes('总预测需求'), 'should have summary label');
    assert.ok(html.includes('forecast-total-summary'), 'should have summary testid');
  });

  test('computes total from entries when totalForecast not given', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [
          makeEntry({ id: 'a', forecastValue: 3000 }),
          makeEntry({ id: 'b', forecastValue: 7000 }),
        ],
      }))
    );
    // 合计 10000
    assert.ok(html.includes('1.0w') || html.includes('10000'), 'should compute total from entries');
  });

  // -------- 预测条目 --------
  test('renders each forecast entry with name and value', () => {
    const entries = [
      makeEntry({ id: 'e1', name: '饮品', forecastValue: 12500, confidence: 92, changePercent: 8.5 }),
      makeEntry({ id: 'e2', name: '零食', forecastValue: 8200, confidence: 76, changePercent: -3.2 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({ entries }))
    );
    assert.ok(html.includes('饮品'), 'should render first entry name');
    assert.ok(html.includes('零食'), 'should render second entry name');
    assert.ok(html.includes('forecast-entry-e1'), 'should have entry testid');
    assert.ok(html.includes('forecast-entry-e2'), 'should have entry testid');
  });

  test('renders anomaly text when present on entry', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [
          makeEntry({ id: 'x', anomaly: '库存周转异常' }),
        ],
      }))
    );
    assert.ok(html.includes('库存周转异常'), 'should render anomaly warning');
  });

  test('renders season effect when present on entry', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [
          makeEntry({ id: 'x', seasonEffect: 'positive' }),
        ],
      }))
    );
    assert.ok(html.includes('旺季效应'), 'should render season effect label');
  });

  // -------- 置信度显示 --------
  test('renders confidence bar for entries', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [makeEntry({ id: 'x1', confidence: 95 })],
      }))
    );
    assert.ok(html.includes('95%') || html.includes('高置信'), 'should show confidence value');
  });

  test('shows correct confidence classification', () => {
    const high = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [makeEntry({ id: 'h', confidence: 85 })],
      }))
    );
    assert.ok(high.includes('高置信'), 'confidence >= 85 should show 高置信');

    const mid = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [makeEntry({ id: 'm', confidence: 70 })],
      }))
    );
    assert.ok(mid.includes('中置信'), 'confidence 60-84 should show 中置信');

    const low = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [makeEntry({ id: 'l', confidence: 40 })],
      }))
    );
    assert.ok(low.includes('低置信'), 'confidence < 60 should show 低置信');
  });

  // -------- 尺寸/维度 --------
  test('renders product unit by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [makeEntry({ id: 'p1' })],
        totalForecast: 500,
      }))
    );
    assert.ok(html.includes('件'), 'default dimension should use "件" unit');
  });

  test('uses custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        'data-testid': 'custom-panel',
        entries: [makeEntry({ id: 'x' })],
      }))
    );
    assert.ok(html.includes('custom-panel'), 'should render custom testid');
  });

  // -------- 紧凑模式 --------
  test('renders in compact mode', () => {
    // 紧凑模式不应影响渲染本身，只是样式不同
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        compact: true,
        entries: [makeEntry({ id: 'c1' })],
      }))
    );
    assert.ok(html.includes('forecast-entry-c1'), 'should still render entries in compact mode');
  });

  // -------- 趋势显示 --------
  test('shows up trend for positive change', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        totalChangePercent: 15,
        entries: [makeEntry({ id: 't', changePercent: 15 })],
      }))
    );
    assert.ok(html.includes('+15.0%') || html.includes('上升'), 'should show positive trend');
  });

  test('shows down trend for negative change', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        totalChangePercent: -10,
        entries: [makeEntry({ id: 't', changePercent: -10 })],
      }))
    );
    assert.ok(html.includes('-10.0%') || html.includes('下降'), 'should show negative trend');
  });

  test('shows stable trend for small change', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        totalChangePercent: 2,
        entries: [makeEntry({ id: 't', changePercent: 2 })],
      }))
    );
    assert.ok(html.includes('平稳'), 'change within [-5,5] should show stable');
  });

  // -------- 空状态兜底 --------
  test('empty entries with loading=false shows empty text not loading text', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({ loading: false }))
    );
    assert.ok(html.includes('暂无需求预测数据'), 'should show empty text');
    assert.ok(!html.includes('AI 正在计算预测'), 'should NOT show loading text');
  });

  // -------- 分类统计 --------
  test('shows confidence distribution stats', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDemandForecastPanel, makeProps({
        entries: [
          makeEntry({ id: 'a', confidence: 90 }),
          makeEntry({ id: 'b', confidence: 88 }),
          makeEntry({ id: 'c', confidence: 70 }),
          makeEntry({ id: 'd', confidence: 40 }),
        ],
      }))
    );
    assert.ok(html.includes('2高'), 'should count 2 high confidence');
    assert.ok(html.includes('1中'), 'should count 1 medium confidence');
    assert.ok(html.includes('1低'), 'should count 1 low confidence');
  });
});
