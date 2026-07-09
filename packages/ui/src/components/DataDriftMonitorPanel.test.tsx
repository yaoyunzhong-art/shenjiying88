/**
 * DataDriftMonitorPanel.test.tsx — 数据漂移监控面板 L1 冒烟测试
 * 类型: C-AI前端组件
 * 覆盖: 正例 + 反例(防御) + 边界(空数据/加载/单特征)
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DataDriftMonitorPanel } = require('./DataDriftMonitorPanel');

// ── 数据工厂 ─────────────────────────────────────────────────────────────────

function makeOverview(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    totalFeatures: 12,
    driftedFeatures: 3,
    maxDriftScore: 0.68,
    avgDriftScore: 0.15,
    timeWindow: '最近 24h',
    dataSource: '会员画像',
    ...overrides,
  };
}

function makeFeature(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    key: 'age',
    name: '年龄分布',
    driftScore: 0.32,
    severity: 'medium',
    currentDistribution: '25-35岁 45%, 36-45岁 30%',
    baselineDistribution: '25-35岁 38%, 36-45岁 35%',
    currentCount: 15800,
    baselineCount: 14200,
    ...overrides,
  };
}

const MOCK_FEATURES = [
  makeFeature(),
  makeFeature({
    key: 'gender',
    name: '性别比例',
    driftScore: 0.05,
    severity: 'low',
    currentDistribution: '男 52%, 女 48%',
    baselineDistribution: '男 51%, 女 49%',
    currentCount: 15800,
    baselineCount: 14200,
  }),
  makeFeature({
    key: 'consumption_tier',
    name: '消费等级',
    driftScore: 0.68,
    severity: 'high',
    currentDistribution: '高客 22%, 中客 45%, 低客 33%',
    baselineDistribution: '高客 15%, 中客 50%, 低客 35%',
    currentCount: 15600,
    baselineCount: 14000,
  }),
  makeFeature({
    key: 'membership_duration',
    name: '会员时长',
    driftScore: 0.82,
    severity: 'critical',
    currentDistribution: '<1年 40%, 1-3年 35%, >3年 25%',
    baselineDistribution: '<1年 28%, 1-3年 42%, >3年 30%',
    currentCount: 15200,
    baselineCount: 13800,
  }),
];

// ── 测试 ────────────────────────────────────────────────────────────────────

describe('DataDriftMonitorPanel', () => {

  // 正例: 正常渲染多特征
  test('should render with multiple features and overview', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: MOCK_FEATURES,
      })
    );
    assert.ok(html.includes('数据漂移监控'), '应显示默认标题');
    assert.ok(html.includes('会员画像'), '应显示数据源');
    assert.ok(html.includes('12'), '应显示总特征数');
    assert.ok(html.includes('3'), '应显示漂移特征数');
    assert.ok(html.includes('68.0%'), '应显示最高漂移分数');
    assert.ok(html.includes('15.0%'), '应显示平均漂移分数');

    // 每个特征应出现
    assert.ok(html.includes('年龄分布'), '应显示年龄分布');
    assert.ok(html.includes('性别比例'), '应显示性别比例');
    assert.ok(html.includes('消费等级'), '应显示消费等级');
    assert.ok(html.includes('会员时长'), '应显示会员时长');

    // 严重程度标签
    assert.ok(html.includes('正常'), '应显示低漂移标签');
    assert.ok(html.includes('轻微'), '应显示中漂移标签');
    assert.ok(html.includes('显著'), '应显示高漂移标签');
    assert.ok(html.includes('严重'), '应显示严重漂移标签');

    // 超过告警阈值的应有标记
    assert.ok(html.includes('⚠'), '超阈值特征应有告警标记');
  });

  // 正例: 自定义标题
  test('should render with custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: [makeFeature()],
        title: 'AI 模型漂移监控',
      })
    );
    assert.ok(html.includes('AI 模型漂移监控'), '应显示自定义标题');
    assert.ok(!html.includes('数据漂移监控'), '不应显示默认标题');
  });

  // 反例: null / undefined 保护
  test('should handle null or undefined features gracefully', () => {
    const html1 = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: null,
      })
    );
    assert.ok(html1.includes('暂无漂移数据'), 'null features 应显示空状态');

    const html2 = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: undefined,
      })
    );
    assert.ok(html2.includes('暂无漂移数据'), 'undefined features 应显示空状态');
  });

  // 反例: null overview
  test('should handle null overview gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: null,
        features: [],
      })
    );
    assert.ok(html.includes('暂无漂移数据'), 'null overview 应显示空状态');
  });

  // 反例: 部分缺失属性
  test('should handle feature with missing optional fields', () => {
    const features = [
      makeFeature({
        currentDistribution: undefined,
        baselineDistribution: undefined,
        currentCount: undefined,
        baselineCount: undefined,
      }),
    ] as Record<string, unknown>[];
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features,
      })
    );
    assert.ok(html.includes('年龄分布'), '缺少可选字段仍应渲染');
  });

  // 边界: 加载状态
  test('should show loading skeleton when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: MOCK_FEATURES,
        loading: true,
      })
    );
    assert.ok(html.includes('animate-pulse'), '加载态应有动画');
    assert.ok(!html.includes('数据漂移监控'), '加载态不应显示标题');
  });

  // 边界: 空数组
  test('should show empty text when features is empty array', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: [],
        emptyText: '当前无漂移检测数据',
      })
    );
    assert.ok(html.includes('当前无漂移检测数据'), '空数组应显示自定义空文本');
  });

  // 边界: 单特征
  test('should render single feature correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: [makeFeature()],
      })
    );
    assert.ok(html.includes('年龄分布'), '单特征应显示');
    assert.ok(html.includes('总特征数'), '单特征应显示概览');
  });

  // 边界: 自定义阈值
  test('should respect custom warning threshold', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: MOCK_FEATURES,
        warningThreshold: 0.1,
      })
    );
    // warningThreshold=0.1 大部分特征都超阈值
    const warningCount = (html.match(/⚠/g) || []).length;
    assert.ok(warningCount >= 2, '低阈值应产生更多告警标记');
  });

  // 边界: 极端漂移值
  test('should render extreme drift score without crashing', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview({ maxDriftScore: 1.0 }),
        features: [makeFeature({ driftScore: 1.0, severity: 'critical' })],
      })
    );
    assert.ok(html.includes('100.0%'), '极端漂移分数应显示');
    assert.ok(html.includes('严重'), '极端漂移应显示严重标签');
  });

  // 正例: 点击回调
  test('should include click handler when onFeatureClick provided', () => {
    let clickedKey = '';
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: [makeFeature()],
        onFeatureClick: (f: { key: string }) => { clickedKey = f.key; },
      })
    );
    assert.ok(html.includes('role="button"'), '有回调时应设置为 button role');
    assert.ok(html.includes('tabindex="0"'), '有回调时应可聚焦');
  });

  // 正例: className 和 style 透传
  test('should pass through className and style', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataDriftMonitorPanel, {
        overview: makeOverview(),
        features: [makeFeature()],
        className: 'custom-panel',
        style: { maxWidth: '800px' },
      })
    );
    assert.ok(html.includes('custom-panel'), 'className 应透传');
  });
});
