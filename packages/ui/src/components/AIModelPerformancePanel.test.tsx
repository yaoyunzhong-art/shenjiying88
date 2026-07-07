/**
 * AIModelPerformancePanel.test.tsx — AI模型性能监控面板 L1 冒烟测试
 * 类型: C-AI前端组件
 * 覆盖: 正例 + 反例(防御) + 边界(空数据/加载/单模型)
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIModelPerformancePanel } = require('./AIModelPerformancePanel');

// ── 数据工厂 ─────────────────────────────────────────────────────────────────

function makeModel(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    modelId: 'gpt-4o-001',
    modelName: 'GPT-4o',
    version: '2026-06-15',
    provider: 'OpenAI',
    metrics: [
      { key: 'latency', label: '平均延迟', value: 320, unit: 'ms', trend: 'down', changePct: 5.2, positiveDirection: 'down', warnThreshold: 500, dangerThreshold: 1000 },
      { key: 'accuracy', label: '准确率', value: 94.7, unit: '%', trend: 'up', changePct: 1.3, positiveDirection: 'up', warnThreshold: 85, dangerThreshold: 75 },
      { key: 'cost', label: '单次成本', value: 0.0032, unit: '¥', trend: 'down', changePct: 2.1 },
      { key: 'requests', label: '请求数', value: 12850, unit: 'count', trend: 'up', changePct: 12.5 },
    ],
    requestCount24h: 12850,
    status: 'online',
    lastUpdated: '2026-07-06 23:55',
    ...overrides,
  };
}

const MOCK_MODELS = [
  makeModel(),
  makeModel({
    modelId: 'claude-4',
    modelName: 'Claude 4',
    version: '2026-06-20',
    provider: 'Anthropic',
    metrics: [
      { key: 'latency', label: '平均延迟', value: 480, unit: 'ms', trend: 'up', changePct: 3.8, positiveDirection: 'down', warnThreshold: 500, dangerThreshold: 1000 },
      { key: 'accuracy', label: '准确率', value: 96.2, unit: '%', trend: 'up', changePct: 0.8, positiveDirection: 'up', warnThreshold: 85 },
      { key: 'cost', label: '单次成本', value: 0.0045, unit: '¥', trend: 'flat' },
      { key: 'requests', label: '请求数', value: 8700, unit: 'count', trend: 'down', changePct: 2.3 },
    ],
    requestCount24h: 8700,
    status: 'degraded',
  }),
  makeModel({
    modelId: 'deepseek-v3',
    modelName: 'DeepSeek-V3',
    version: '2026-07-01',
    provider: 'DeepSeek',
    metrics: [
      { key: 'latency', label: '平均延迟', value: 1520, unit: 'ms', trend: 'up', changePct: 15.2, positiveDirection: 'down', warnThreshold: 1000, dangerThreshold: 2000 },
      { key: 'accuracy', label: '准确率', value: 88.5, unit: '%', trend: 'down', changePct: 2.1, positiveDirection: 'up', warnThreshold: 85, dangerThreshold: 75 },
      { key: 'cost', label: '单次成本', value: 0.0015, unit: '¥' },
      { key: 'requests', label: '请求数', value: 3200, unit: 'count', trend: 'flat' },
    ],
    requestCount24h: 3200,
    status: 'offline',
  }),
];

// ── 正例 ────────────────────────────────────────────────────────────────────

describe('AIModelPerformancePanel — positive cases', () => {

  test('renders title and summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS })
    );
    assert.ok(html.includes('AI 模型性能监控'), 'should render default title');
    assert.ok(html.includes('在线'), 'should show 在线 label');
  });

  test('renders all model names', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS })
    );
    assert.ok(html.includes('GPT-4o'), 'should render GPT-4o');
    assert.ok(html.includes('Claude 4'), 'should render Claude 4');
    assert.ok(html.includes('DeepSeek-V3'), 'should render DeepSeek-V3');
  });

  test('renders providers and versions', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS })
    );
    assert.ok(html.includes('OpenAI'), 'should show OpenAI');
    assert.ok(html.includes('Anthropic'), 'should show Anthropic');
    assert.ok(html.includes('DeepSeek'), 'should show DeepSeek');
    assert.ok(html.includes('v2026-06-15'), 'should show version');
  });

  test('renders status indicators', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS })
    );
    assert.ok(html.includes('在线'), 'should show 在线 status');
    assert.ok(html.includes('降级'), 'should show 降级 status');
    assert.ok(html.includes('离线'), 'should show 离线 status');
  });

  test('renders metric values', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS })
    );
    assert.ok(html.includes('320.0 ms'), 'should show latency 320ms');
    assert.ok(html.includes('94.7%'), 'should show accuracy 94.7%');
    assert.ok(html.includes('96.2%'), 'should show Claude accuracy');
    assert.ok(html.includes('480.0 ms'), 'should show Claude latency');
  });

  test('renders trend arrows and change percentages', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS })
    );
    assert.ok(html.includes('5.2%'), 'should show GPT-4o latency change');
    assert.ok(html.includes('2.1%'), 'should show DeepSeek cost change');
    assert.ok(html.includes('15.2%'), 'should show DeepSeek latency change');
  });

  test('renders 24h request count', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS })
    );
    assert.ok(html.includes('24h'), 'should contain 24h label');
    // total = 12850 + 8700 + 3200 = 24750 → 24.8k
    assert.ok(html.includes('24.8k'), 'should format total 24750 as 24.8k');
  });

  test('renders custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS, title: '模型健康看板' })
    );
    assert.ok(html.includes('模型健康看板'), 'should use custom title');
    assert.ok(!html.includes('AI 模型性能监控'), 'should not show default title');
  });

  test('fires onModelClick callback', () => {
    let clickedId = '';
    const handleClick = (model: { modelId: string }) => { clickedId = model.modelId; };

    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS, onModelClick: handleClick })
    );
    assert.ok(html.includes('role="button"'), 'should have button role when clickable');
    assert.ok(html.includes('tabindex="0"'), 'should have tabindex 0 when clickable');
  });
});

// ── 反例 (防御) ─────────────────────────────────────────────────────────────

describe('AIModelPerformancePanel — defensive cases', () => {

  test('handles null/undefined models gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: null as unknown as [] })
    );
    assert.ok(html.includes('暂无模型性能数据'), 'should show empty text for null');
  });

  test('handles empty array', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: [] })
    );
    assert.ok(html.includes('暂无模型性能数据'), 'should show empty text for empty');
  });

  test('handles custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: [], emptyText: '未接入任何模型' })
    );
    assert.ok(html.includes('未接入任何模型'), 'should show custom empty text');
  });

  test('renders loading skeleton', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: [], loading: true })
    );
    assert.ok(html.includes('animate-pulse'), 'loading should show pulse animation');
    assert.ok(!html.includes('暂无模型性能数据'), 'loading should not show empty state');
  });

  test('handles model with no metrics gracefully', () => {
    const emptyMetricsModel = makeModel({ metrics: [] });
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: [emptyMetricsModel] })
    );
    assert.ok(html.includes('GPT-4o'), 'should still render model name');
    assert.ok(html.includes('在线'), 'should still render status');
  });

  test('handles cross-threshold metric (danger)', () => {
    const criticalLatencyModel = makeModel({
      modelId: 'slow-model',
      metrics: [
        { key: 'latency', label: '平均延迟', value: 1800, unit: 'ms', trend: 'up', changePct: 20, positiveDirection: 'down', dangerThreshold: 2000 },
      ],
    });
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: [criticalLatencyModel] })
    );
    assert.ok(html.includes('1800.0 ms'), 'should render dangerous latency');
  });

  test('handles flat trend', () => {
    const mixedModel = makeModel({
      metrics: [
        { key: 'm1', label: '指标A', value: 50, unit: '%', trend: 'flat' },
      ],
    });
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: [mixedModel] })
    );
    assert.ok(html.includes('50.0%'), 'should render flat trend metric');
  });
});

// ── 边界 ────────────────────────────────────────────────────────────────────

describe('AIModelPerformancePanel — edge cases', () => {

  test('handles single model display', () => {
    const single = [makeModel()];
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: single })
    );
    assert.ok(html.includes('1/1'), 'summary should show 1/1 online');
    assert.ok(html.includes('GPT-4o'), 'should render single model');
    // 12850 → 12.8k (IEEE 754: 12.85.toFixed(1) === 12.8)
    assert.ok(html.includes('12.8k'), 'should format 12850 as 12.8k');
  });

  test('handles large request count formatting', () => {
    const bigModel = makeModel({ requestCount24h: 245000, metrics: [] });
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: [bigModel] })
    );
    assert.ok(html.includes('24.5万'), 'should format 245000 as 24.5万');
  });

  test('handles many models rendering all', () => {
    const manyModels = Array.from({ length: 10 }, (_, i) => makeModel({
      modelId: `model-${i}`,
      modelName: `Model-${i}`,
      provider: i % 2 === 0 ? 'OpenAI' : 'Anthropic',
    }));
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: manyModels })
    );
    assert.ok(html.includes('Model-9'), 'should render 10th model');
    assert.ok(html.includes('10/10'), 'summary should show correct count');
  });

  test('handles className merge', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS, className: 'custom-extra-class' })
    );
    assert.ok(html.includes('custom-extra-class'), 'should include custom class');
  });

  test('renders role=button only when clickable', () => {
    const clickable = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS, onModelClick: () => {} })
    );
    assert.ok(clickable.includes('role="button"'), 'clickable should have button role');

    const nonClickable = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: MOCK_MODELS })
    );
    assert.ok(!nonClickable.includes('role="button"'), 'non-clickable should not have button role');
  });

  test('renders degraded and offline status labels', () => {
    const mixedStatus = [
      makeModel({ status: 'online' }),
      makeModel({ modelId: 'm2', modelName: 'M2', provider: 'X', version: '1', metrics: [], requestCount24h: 0, status: 'degraded', lastUpdated: '' }),
      makeModel({ modelId: 'm3', modelName: 'M3', provider: 'Y', version: '1', metrics: [], requestCount24h: 0, status: 'offline', lastUpdated: '' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIModelPerformancePanel, { models: mixedStatus })
    );
    assert.ok(html.includes('1/3'), 'should show correct online/total');
    assert.ok(html.includes('在线'), 'should show online');
    assert.ok(html.includes('降级'), 'should show degraded');
    assert.ok(html.includes('离线'), 'should show offline');
  });
});
