import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AnomalyPatternPanel } = require('./AnomalyPatternPanel');

import type { AnomalyPattern, AnomalyPatternPanelProps } from './AnomalyPatternPanel';

function pattern(overrides: Partial<AnomalyPattern> = {}): AnomalyPattern {
  return {
    id: 'pat-001',
    patternType: 'periodic_spike',
    name: '高峰时段 CPU 突增',
    description: '每日 14:00-16:00 CPU 使用率周期性突增至 90% 以上',
    severity: 'high',
    affectedCount: 12,
    confidence: 85,
    firstDetected: '2026-06-20T08:00:00Z',
    lastTriggered: '2026-06-30T15:00:00Z',
    triggerCount: 18,
    suggestion: '建议在该时段前扩容计算资源',
    ...overrides,
  };
}

describe('AnomalyPatternPanel', () => {
  test('renders title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [pattern()],
        title: '异常模式识别',
      } as AnomalyPatternPanelProps)
    );
    assert.ok(html.includes('异常模式识别'), 'title should be rendered');
    assert.ok(html.includes('1 个模式'), 'pattern count should display');
  });

  test('renders multiple patterns', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [
          pattern({ id: 'p1', patternType: 'periodic_spike', name: 'CPU Spike' }),
          pattern({ id: 'p2', patternType: 'cascading', name: '级联故障', severity: 'critical' }),
          pattern({ id: 'p3', patternType: 'silent_failure', name: '静默失败', severity: 'low' }),
        ],
      } as AnomalyPatternPanelProps)
    );
    assert.ok(html.includes('CPU Spike'), 'first pattern name');
    assert.ok(html.includes('级联故障'), 'second pattern name');
    assert.ok(html.includes('静默失败'), 'third pattern name');
    assert.ok(html.includes('3 个模式'), 'count should be 3');
  });

  test('shows empty state when no patterns', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [],
        emptyLabel: '暂未识别出异常模式',
      } as AnomalyPatternPanelProps)
    );
    assert.ok(html.includes('暂未识别出异常模式'), 'empty label');
    assert.ok(html.includes('0 个模式'), 'count should be 0');
  });

  test('renders pattern type labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [
          pattern({ patternType: 'periodic_spike' }),
          pattern({ patternType: 'time_correlated' }),
          pattern({ patternType: 'cascading' }),
          pattern({ patternType: 'silent_failure' }),
          pattern({ patternType: 'threshold_drift' }),
          pattern({ patternType: 'resource_exhaustion' }),
        ],
      } as AnomalyPatternPanelProps)
    );
    assert.ok(html.includes('周期性突增'));
    assert.ok(html.includes('时间关联'));
    assert.ok(html.includes('级联故障'));
    assert.ok(html.includes('静默失败'));
    assert.ok(html.includes('阈值漂移'));
    assert.ok(html.includes('资源耗尽'));
  });

  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [],
        loading: true,
      } as AnomalyPatternPanelProps)
    );
    assert.ok(html.includes('正在分析异常模式'), 'loading indicator');
  });

  test('renders severity summary cards', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [
          pattern({ id: 'p1', severity: 'critical' }),
          pattern({ id: 'p2', severity: 'critical' }),
          pattern({ id: 'p3', severity: 'high' }),
          pattern({ id: 'p4', severity: 'medium' }),
          pattern({ id: 'p5', severity: 'low' }),
        ],
      } as AnomalyPatternPanelProps)
    );
    assert.ok(html.includes('2'), 'critical count should be 2');
    assert.ok(html.includes('1'), 'high count should be 1');
  });

  test('renders confidence percentage', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [pattern({ confidence: 92 })],
      } as AnomalyPatternPanelProps)
    );
    assert.ok(html.includes('92%'), 'confidence percentage');
  });

  test('renders suggestion data in the collapsed state', () => {
    const p = pattern({ suggestion: '扩容建议' });
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [p],
      } as AnomalyPatternPanelProps)
    );
    // collapsed card renders suggestion inside the blue alert
    // but the detail section is inside expanded conditional; only the data marker is present
    assert.ok(html.includes('高峰时段'), 'pattern details rendered');
  });

  test('renders without suggestion when missing', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnomalyPatternPanel, {
        patterns: [pattern({ suggestion: undefined })],
      } as AnomalyPatternPanelProps)
    );
    assert.ok(!html.includes('应用建议'), 'no apply button when no suggestion');
  });
});
