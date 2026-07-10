import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIAgentPerformancePanel } from './AIAgentPerformancePanel';
import type { AgentPerformanceSummary, AgentPerformanceMetric, AgentLatencyBucket } from './AIAgentPerformancePanel';

/**
 * 辅助函数：渲染 React 元素并返回 HTML 字符串 (SSR 方式)
 * 所有测试都基于 HTML 字符串断言，无需 jsdom
 */
function render(ui: React.ReactElement): string {
  return renderToStaticMarkup(ui);
}

function hasText(html: string, text: string): boolean {
  return html.includes(text);
}

const defaultSummary: AgentPerformanceSummary = {
  totalRequests: 15000,
  successCount: 14985,
  failureCount: 15,
  avgLatencyMs: 245,
  p95LatencyMs: 520,
  p99LatencyMs: 890,
};

const defaultMetrics: AgentPerformanceMetric[] = [
  { key: 'tokens_in', label: '输入 Token', value: 2850000, unit: 't', changePercent: 12.3 },
  { key: 'tokens_out', label: '输出 Token', value: 420000, unit: 't', changePercent: -3.1 },
  { key: 'cost', label: '推理成本', value: 0.0085, unit: '/req', threshold: 0.01 },
  { key: 'timeout_rate', label: '超时率', value: 0.12, unit: '%', changePercent: 5.2, breached: true },
];

const defaultLatencyBuckets: AgentLatencyBucket[] = [
  { label: '<100ms', count: 3200, color: '#22c55e' },
  { label: '100-300ms', count: 7800, color: '#3b82f6' },
  { label: '300-500ms', count: 2400, color: '#eab308' },
  { label: '500-1000ms', count: 1100, color: '#f97316' },
  { label: '>1s', count: 500, color: '#ef4444' },
];

describe('AIAgentPerformancePanel', () => {
  it('应该渲染标题', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, 'AI Agent 性能监控'));
  });

  it('应该渲染自定义标题', () => {
    const html = render(
      <AIAgentPerformancePanel
        title="自定义面板"
        summary={defaultSummary}
        metrics={defaultMetrics}
      />
    );
    assert.ok(hasText(html, '自定义面板'));
  });

  it('应该显示总请求数', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, '15,000'));
  });

  it('应该计算并显示成功率 99.9%', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, '99.9%'));
  });

  it('失败数应该显示', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, '15'));
  });

  it('应该显示延迟指标 (avg / p95 / p99)', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, '245ms'));
    assert.ok(hasText(html, '520ms'));
    assert.ok(hasText(html, '890ms'));
  });

  it('应该渲染延迟分布条形图标签和数量', () => {
    const html = render(
      <AIAgentPerformancePanel
        summary={defaultSummary}
        metrics={defaultMetrics}
        latencyBuckets={defaultLatencyBuckets}
      />
    );
    assert.ok(hasText(html, '100ms'));
    assert.ok(hasText(html, '100-300ms'));
    assert.ok(hasText(html, '1s'));
    assert.ok(hasText(html, '7,800'));
    assert.ok(hasText(html, '3,200'));
    assert.ok(hasText(html, '2,400'));
    assert.ok(hasText(html, '1,100'));
    assert.ok(hasText(html, '500'));
  });

  it('空态时应该显示 emptyText', () => {
    const emptySummary: AgentPerformanceSummary = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
    };
    const html = render(
      <AIAgentPerformancePanel
        summary={emptySummary}
        metrics={[]}
        emptyText="暂无性能数据"
      />
    );
    assert.ok(hasText(html, '暂无性能数据'));
  });

  it('加载态不应该显示实际数据', () => {
    const html = render(
      <AIAgentPerformancePanel
        summary={defaultSummary}
        metrics={defaultMetrics}
        loading
      />
    );
    // 加载态不应该包含实际数据
    assert.equal(hasText(html, '15,000'), false);
    // 应该保留标题
    assert.ok(hasText(html, 'AI Agent 性能监控'));
  });

  it('超限指标（breached）应该显示 ⚠ 标记', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, '⚠'));
  });

  it('应该渲染关键指标区域标题和标签', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, '关键指标'));
    assert.ok(hasText(html, '输入 Token'));
    assert.ok(hasText(html, '输出 Token'));
    assert.ok(hasText(html, '推理成本'));
    assert.ok(hasText(html, '超时率'));
  });

  it('没有 latencyBuckets 时不应该渲染"延迟分布"区域', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.equal(hasText(html, '延迟分布'), false);
  });

  it('应该正确处理单位显示 (unit = /req)', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, '/req'));
  });

  it('加载态应该渲染骨架屏元素', () => {
    const html = render(
      <AIAgentPerformancePanel
        summary={defaultSummary}
        metrics={defaultMetrics}
        loading
      />
    );
    // 加载态应该包含多个骨架占位 div（通过背景色判断）
    assert.ok(hasText(html, '#334155'));
    assert.ok(hasText(html, '#1e293b'));
  });

  it('变化百分比为负值时应该显示负号', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    // 输出 Token changePercent = -3.1 → "-3.1%"
    assert.ok(hasText(html, '-3.1%'));
  });

  it('变化百分比为正值时应该显示加号', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    // 输入 Token changePercent = 12.3 → "+12.3%"
    assert.ok(hasText(html, '+12.3%'));
  });

  it('摘要标题应该包含: 总请求 / 成功率 / 失败数 / 平均延迟 / P95 / P99', () => {
    const html = render(<AIAgentPerformancePanel summary={defaultSummary} metrics={defaultMetrics} />);
    assert.ok(hasText(html, '总请求'));
    assert.ok(hasText(html, '成功率'));
    assert.ok(hasText(html, '失败数'));
    assert.ok(hasText(html, '平均延迟'));
    assert.ok(hasText(html, 'P95'));
    assert.ok(hasText(html, 'P99'));
  });

  it('全部失败时成功率应为 0%', () => {
    const allFailed: AgentPerformanceSummary = {
      totalRequests: 100,
      successCount: 0,
      failureCount: 100,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
    };
    const html = render(
      <AIAgentPerformancePanel summary={allFailed} metrics={[]} />
    );
    assert.ok(hasText(html, '0.0%'));
    assert.ok(hasText(html, '100'));
  });
});
