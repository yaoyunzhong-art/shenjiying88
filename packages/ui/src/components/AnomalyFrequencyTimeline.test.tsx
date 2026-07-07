import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AnomalyFrequencyTimeline,
} = require('./AnomalyFrequencyTimeline');

import type { AnomalyTimeBucket, AnomalyFrequencyTimelineProps } from './AnomalyFrequencyTimeline';

/** Helper: produce a sample time bucket */
function bucket(overrides: Partial<AnomalyTimeBucket> = {}): AnomalyTimeBucket {
  return {
    label: '06-26 08:00',
    total: 5,
    bySeverity: { critical: 1, high: 1, medium: 2, low: 1 },
    ...overrides,
  };
}

/** Render a component to static HTML string */
function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

/** Check if rendered HTML contains a string */
function contains(html: string, str: string): boolean {
  return html.includes(str);
}

/* ── 正例 ── */

describe('AnomalyFrequencyTimeline — 正例', () => {
  test('导出存在且为函数', () => {
    assert.equal(typeof AnomalyFrequencyTimeline, 'function');
  });

  test('默认渲染标题', () => {
    const buckets = [bucket()];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(contains(html, '异常时序频率'), 'should render default title');
  });

  test('自定义标题', () => {
    const buckets = [bucket()];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} title="自定义标题" />);
    assert.ok(contains(html, '自定义标题'));
  });

  test('渲染图例', () => {
    const buckets = [bucket()];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(contains(html, '严重'), 'should have critical legend');
    assert.ok(contains(html, '高'), 'should have high legend');
    assert.ok(contains(html, '中'), 'should have medium legend');
    assert.ok(contains(html, '低'), 'should have low legend');
  });

  test('渲染正常数据桶', () => {
    const buckets = [
      bucket({ label: '08:00', total: 3, bySeverity: { critical: 1, high: 0, medium: 1, low: 1 } }),
      bucket({ label: '09:00', total: 5, bySeverity: { critical: 2, high: 1, medium: 1, low: 1 } }),
    ];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(contains(html, '08:00'), 'should render first bucket label');
    assert.ok(contains(html, '09:00'), 'should render second bucket label');
    // Values should appear
    assert.ok(contains(html, '3'), 'should render total 3');
    assert.ok(contains(html, '5'), 'should render total 5');
  });

  test('渲染单桶数据', () => {
    const buckets = [bucket({ label: '10:00', total: 2, bySeverity: { critical: 0, high: 0, medium: 2, low: 0 } })];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(contains(html, '10:00'));
    assert.ok(contains(html, '2'));
  });

  test('data-testid 默认值', () => {
    const html = render(<AnomalyFrequencyTimeline buckets={[bucket()]} />);
    assert.ok(contains(html, 'anomaly-frequency-timeline'));
  });

  test('data-testid 自定义', () => {
    const html = render(<AnomalyFrequencyTimeline buckets={[bucket()]} data-testid="custom-timeline" />);
    assert.ok(contains(html, 'custom-timeline'));
  });

  test('role="region" 存在且含 aria-label', () => {
    const html = render(<AnomalyFrequencyTimeline buckets={[bucket()]} />);
    assert.ok(contains(html, 'region'));
    assert.ok(contains(html, '异常时序频率'));
  });
});

/* ── 空数据 / 边界 ── */

describe('AnomalyFrequencyTimeline — 边界', () => {
  test('空 bucket 数组显示空状态', () => {
    const html = render(<AnomalyFrequencyTimeline buckets={[]} />);
    assert.ok(contains(html, '暂无异常时序数据'));
  });

  test('自定义空状态文本', () => {
    const html = render(<AnomalyFrequencyTimeline buckets={[]} emptyText="无数据" />);
    assert.ok(contains(html, '无数据'));
  });

  test('加载中状态', () => {
    const html = render(<AnomalyFrequencyTimeline buckets={[]} loading />);
    assert.ok(contains(html, '加载中...'));
  });

  test('maxBuckets 截断', () => {
    const buckets = Array.from({ length: 10 }, (_, i) =>
      bucket({ label: `h${i}`, total: i + 1, bySeverity: { critical: 0, high: 0, medium: 0, low: i + 1 } })
    );
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} maxBuckets={3} />);
    // Should render last 3 labels
    assert.ok(!contains(html, 'h0'), 'h0 should be truncated');
    assert.ok(!contains(html, 'h1'), 'h1 should be truncated');
    assert.ok(!contains(html, 'h6'), 'h6 should be truncated');
    assert.ok(contains(html, 'h7'), 'h7 should be shown');
    assert.ok(contains(html, 'h8'), 'h8 should be shown');
    assert.ok(contains(html, 'h9'), 'h9 should be shown');
  });

  test('全零数据', () => {
    const buckets = [bucket({ total: 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 0 } })];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(contains(html, '0'), 'should render 0 total');
  });

  test('大量数据桶不崩溃', () => {
    const buckets = Array.from({ length: 48 }, (_, i) =>
      bucket({ label: `h${i}`, total: Math.floor(Math.random() * 100), bySeverity: { critical: 1, high: 1, medium: 2, low: 1 } })
    );
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} />);
    // Default maxBuckets=24 -> shows last 24 buckets
    assert.ok(!contains(html, 'h0'), 'h0 should be truncated (last 24 shown)');
    assert.ok(contains(html, 'h47'), 'last bucket visible');
    assert.ok(contains(html, 'h24'), 'h24 should be visible (start of last 24)');
  });

  test('只有 critical 级别', () => {
    const buckets = [bucket({ total: 3, bySeverity: { critical: 3, high: 0, medium: 0, low: 0 } })];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(contains(html, '3'), 'should show total 3');
  });

  test('无 total 但有各严重级别计数', () => {
    const buckets = [bucket({ total: 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 0 } })];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(contains(html, '0'), 'should show 0');
  });

  test('自定义高度', () => {
    // 高度不会在 HTML 中直接显示为数字，但验证不崩溃
    const buckets = [bucket()];
    const html = render(<AnomalyFrequencyTimeline buckets={buckets} height={400} />);
    assert.ok(contains(html, '异常时序频率'));
  });
});

/* ── 反例 ── */

describe('AnomalyFrequencyTimeline — 反例', () => {
  test('buckets 为 undefined（默认 prop）', () => {
    // @ts-expect-error - intentionally testing missing required prop
    const html = render(<AnomalyFrequencyTimeline />);
    assert.ok(contains(html, '暂无异常时序数据'), 'should show empty state');
  });

  test('严重程度字段缺失（防御）', () => {
    const buckets = [{
      label: 'test',
      total: 5,
      // @ts-expect-error - intentionally incomplete
      bySeverity: { critical: 2 },
    }];
    const html = render(<AnomalyFrequencyTimeline buckets={[buckets[0] as AnomalyTimeBucket]} />);
    assert.ok(contains(html, 'test'), 'should still render label');
  });

  test('负数值不崩溃', () => {
    const buckets = [bucket({ total: -1, bySeverity: { critical: -1, high: 0, medium: 0, low: 0 } })];
    // 应渲染而不抛出异常
    render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(true, 'should not crash with negative values');
  });

  test('NaN 不崩溃', () => {
    const buckets = [bucket({ total: NaN, bySeverity: { critical: NaN, high: NaN, medium: NaN, low: NaN } })];
    // 应渲染而不抛出异常
    render(<AnomalyFrequencyTimeline buckets={buckets} />);
    assert.ok(true, 'should not crash with NaN values');
  });
});
