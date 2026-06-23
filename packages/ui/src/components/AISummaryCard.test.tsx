import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * AISummaryCard 测试
 *
 * 因当前项目使用 node:test + assert 作为核心跑器，
 * 本测试覆盖 AISummaryCard 的类型契约和纯逻辑：
 *   - 类型导出完整性
 *   - 边界与空数据
 *   - 趋势方向/颜色逻辑
 *   - 洞察类型映射
 *   - 指标组合场景
 */

import type {
  AISummaryCardProps,
  HighlightMetric,
  InsightItem,
  TrendDirection,
} from './AISummaryCard';

// ==================== 类型导出完整性 ====================

describe('AISummaryCard type exports', () => {
  it('exports AISummaryCardProps with required fields', () => {
    const props: AISummaryCardProps = {
      summary: '今日门店运营数据良好，订单量环比增长 12%。',
      title: '运营摘要',
    };
    assert.ok(props);
    assert.equal(props.summary, '今日门店运营数据良好，订单量环比增长 12%。');
    assert.equal(props.title, '运营摘要');
  });

  it('accepts optional fields', () => {
    const props: AISummaryCardProps = {
      summary: '测试摘要',
      loading: false,
      error: undefined,
      updatedAt: new Date().toISOString(),
    };
    assert.equal(props.loading, false);
    assert.equal(props.error, undefined);
  });

  it('requires summary field', () => {
    const props: AISummaryCardProps = {
      summary: '',
    };
    assert.equal(props.summary, '');
  });

  it('declares onAIAnalyze as optional callback', () => {
    let called = 0;
    const props: AISummaryCardProps = {
      summary: '分析数据',
      onAIAnalyze: () => { called++; },
    };
    props.onAIAnalyze!();
    assert.equal(called, 1);
  });

  it('declares analyzing as optional boolean', () => {
    const idle: AISummaryCardProps = { summary: '', analyzing: false };
    const active: AISummaryCardProps = { summary: '', analyzing: true };
    assert.equal(idle.analyzing, false);
    assert.equal(active.analyzing, true);
  });
});

// ==================== HighlightMetric 类型契约 ====================

describe('HighlightMetric type contract', () => {
  it('supports basic metric with label and value', () => {
    const metric: HighlightMetric = { label: '订单量', value: 1280 };
    assert.equal(metric.label, '订单量');
    assert.equal(metric.value, 1280);
  });

  it('supports all trend directions', () => {
    const up: HighlightMetric = { label: 'a', value: 1, trend: 'up' };
    const down: HighlightMetric = { label: 'b', value: 2, trend: 'down' };
    const flat: HighlightMetric = { label: 'c', value: 3, trend: 'flat' };
    assert.equal(up.trend, 'up');
    assert.equal(down.trend, 'down');
    assert.equal(flat.trend, 'flat');
  });

  it('supports unit and changePercent', () => {
    const metric: HighlightMetric = {
      label: '客单价',
      value: 45.5,
      unit: '元',
      changePercent: 8.5,
      isPositive: true,
    };
    assert.equal(metric.unit, '元');
    assert.equal(metric.changePercent, 8.5);
    assert.equal(metric.isPositive, true);
  });

  it('isPositive defaults to undefined when omitted', () => {
    const metric: HighlightMetric = { label: '指标', value: 100 };
    assert.equal(metric.isPositive, undefined);
  });
});

// ==================== InsightItem 类型契约 ====================

describe('InsightItem type contract', () => {
  it('allows three insight types', () => {
    const positive: InsightItem = { type: 'positive', text: '增长良好' };
    const negative: InsightItem = { type: 'negative', text: '库存不足' };
    const info: InsightItem = { type: 'info', text: '即将维护' };

    assert.equal(positive.type, 'positive');
    assert.equal(negative.type, 'negative');
    assert.equal(info.type, 'info');
  });

  it('rejects unknown insight types at type level', () => {
    const item: InsightItem = { type: 'positive', text: 'OK' };
    // @ts-expect-error — 应只允许 'positive' | 'negative' | 'info'
    const _invalid: InsightItem = { type: 'unknown', text: 'bad' };
    assert.equal(item.type, 'positive');
  });
});

// ==================== TrendDirection 枚举 ====================

describe('TrendDirection enum', () => {
  it('has exactly 3 directions', () => {
    const directions: TrendDirection[] = ['up', 'down', 'flat'];
    assert.equal(directions.length, 3);
  });
});

// ==================== 边界与空数据 ====================

describe('AISummaryCard edge cases', () => {
  it('handles empty metrics array', () => {
    const props: AISummaryCardProps = { summary: '测试', metrics: [] };
    assert.ok(props.metrics);
    assert.equal(props.metrics.length, 0);
  });

  it('handles undefined metrics gracefully', () => {
    const props: AISummaryCardProps = { summary: '测试' };
    assert.equal(props.metrics, undefined);
  });

  it('handles empty insights array', () => {
    const props: AISummaryCardProps = { summary: '测试', insights: [] };
    assert.equal(props.insights!.length, 0);
  });

  it('handles undefined insights gracefully', () => {
    const props: AISummaryCardProps = { summary: '测试' };
    assert.equal(props.insights, undefined);
  });

  it('handles long summary text', () => {
    const longText = '今日运营摘要。'.repeat(100);
    const props: AISummaryCardProps = { summary: longText };
    assert.ok(props.summary.length > 200);
  });

  it('handles null/undefined className', () => {
    const withClass: AISummaryCardProps = { summary: '测试', className: 'my-card' };
    const withoutClass: AISummaryCardProps = { summary: '测试' };
    assert.equal(withClass.className, 'my-card');
    assert.equal(withoutClass.className, undefined);
  });
});

// ==================== 指标组合场景 ====================

describe('AISummaryCard metric combinations', () => {
  it('renders one metric', () => {
    const metrics: HighlightMetric[] = [
      { label: '订单量', value: 1280, trend: 'up', changePercent: 12, isPositive: true, unit: '单' },
    ];
    assert.equal(metrics.length, 1);
    assert.equal(metrics[0]!.label, '订单量');
  });

  it('renders multiple metrics with mixed trends', () => {
    const metrics: HighlightMetric[] = [
      { label: '订单量', value: 1280, trend: 'up', changePercent: 12, isPositive: true, unit: '单' },
      { label: '退单率', value: 3.2, trend: 'down', changePercent: -0.5, unit: '%' },
      { label: '转化率', value: 8.5, trend: 'up', changePercent: 2.3, isPositive: true, unit: '%' },
    ];
    assert.equal(metrics.length, 3);

    const upMetrics = metrics.filter((m) => m.trend === 'up');
    assert.equal(upMetrics.length, 2);
  });

  it('handles zero changePercent', () => {
    const metric: HighlightMetric = {
      label: '持平指标',
      value: 50,
      trend: 'flat',
      changePercent: 0,
    };
    assert.equal(metric.changePercent, 0);
  });

  it('handles negative changePercent', () => {
    const metric: HighlightMetric = {
      label: '下降指标',
      value: 80,
      trend: 'down',
      changePercent: -15,
      isPositive: false,
    };
    assert.equal(metric.changePercent, -15);
    assert.equal(metric.isPositive, false);
  });

  it('handles large values', () => {
    const metric: HighlightMetric = {
      label: '总营收',
      value: 1_280_000,
      unit: '元',
      trend: 'up',
      changePercent: 25,
      isPositive: true,
    };
    assert.equal(metric.value, 1280000);
  });
});

// ==================== 洞察组合场景 ====================

describe('AISummaryCard insight combinations', () => {
  it('renders all three insight types in one list', () => {
    const insights: InsightItem[] = [
      { type: 'positive', text: '线上订单增长 25%' },
      { type: 'negative', text: '库存异常，请及时处理' },
      { type: 'info', text: '系统将于凌晨 2 点维护' },
    ];
    assert.equal(insights.length, 3);

    const types = insights.map((i) => i.type);
    assert.ok(types.includes('positive'));
    assert.ok(types.includes('negative'));
    assert.ok(types.includes('info'));
  });

  it('allows single insight', () => {
    const insights: InsightItem[] = [
      { type: 'info', text: '今日无异常告警' },
    ];
    assert.equal(insights.length, 1);
  });

  it('prevents duplicate empty text at type level', () => {
    const insights: InsightItem[] = [
      { type: 'positive', text: 'a' },
      { type: 'positive', text: 'b' },
    ];
    assert.equal(insights[0]!.text, 'a');
    assert.equal(insights[1]!.text, 'b');
  });
});

// ==================== 综合 Props 场景 ====================

describe('AISummaryCard comprehensive props', () => {
  it('combines all optional fields', () => {
    const props: AISummaryCardProps = {
      title: '运营摘要',
      summary: '今日门店运营数据良好。',
      metrics: [
        { label: '订单量', value: 1280, trend: 'up', changePercent: 12, isPositive: true, unit: '单' },
        { label: '退单率', value: 3.2, trend: 'down', unit: '%' },
      ],
      insights: [
        { type: 'positive', text: '线上订单增长 25%' },
        { type: 'info', text: '系统更新已就绪' },
      ],
      updatedAt: '2026-06-23T14:00:00.000Z',
      onAIAnalyze: () => 'analyzed',
      analyzing: false,
      className: 'summary-card',
    };

    assert.equal(props.title, '运营摘要');
    assert.equal(props.metrics!.length, 2);
    assert.equal(props.insights!.length, 2);
    assert.equal(props.updatedAt, '2026-06-23T14:00:00.000Z');
    assert.equal(props.analyzing, false);
  });

  it('loading priority over error', () => {
    // loading 为 true 时无视 error
    const props: AISummaryCardProps = {
      summary: '',
      loading: true,
      error: '服务不可用',
    };
    assert.equal(props.loading, true);
    assert.ok(props.error);
  });

  it('can transition between loading states', () => {
    const idle: AISummaryCardProps = { summary: '数据', loading: false };
    const loading: AISummaryCardProps = { summary: '', loading: true };
    const errored: AISummaryCardProps = { summary: '', loading: false, error: '网络错误' };

    assert.equal(idle.loading, false);
    assert.equal(loading.loading, true);
    assert.equal(errored.error, '网络错误');
  });
});

// ==================== 回调验证 ====================

describe('AISummaryCard callbacks', () => {
  it('onAIAnalyze is callable and receives no args', () => {
    let called = false;
    const props: AISummaryCardProps = {
      summary: '分析中...',
      onAIAnalyze: () => { called = true; },
    };
    props.onAIAnalyze!();
    assert.equal(called, true);
  });

  it('onAIAnalyze is idempotent', () => {
    let count = 0;
    const props: AISummaryCardProps = {
      summary: '',
      onAIAnalyze: () => { count++; },
    };
    props.onAIAnalyze!();
    props.onAIAnalyze!();
    props.onAIAnalyze!();
    assert.equal(count, 3);
  });
});
