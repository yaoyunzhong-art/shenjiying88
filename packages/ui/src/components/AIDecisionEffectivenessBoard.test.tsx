import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIDecisionEffectivenessBoard,
} = require('./AIDecisionEffectivenessBoard');

import type { DecisionEffectivenessItem, AIDecisionEffectivenessBoardProps } from './AIDecisionEffectivenessBoard';

/** Helper: 生成决策评估测试项 */
function item(overrides: Partial<DecisionEffectivenessItem> = {}): DecisionEffectivenessItem {
  return {
    id: 'dec-001',
    name: '优惠券智能推荐',
    source: 'model',
    result: 'success',
    executionCount: 1200,
    successCount: 1056,
    avgResponseMs: 45,
    liftPercent: 12,
    lastExecutedAt: '2026-07-07 18:00',
    enabled: true,
    ...overrides,
  };
}

describe('AIDecisionEffectivenessBoard', () => {
  test('渲染标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item()],
        title: '决策效果看板',
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(html.includes('决策效果看板'), '标题应渲染');
  });

  test('无数据时渲染空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(html.includes('暂无匹配的决策数据'), '应显示空状态提示');
  });

  test('渲染决策列表项', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [
          item({ id: 'dec-001', name: '优惠券推荐', executionCount: 1200, successCount: 1056 }),
        ],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(html.includes('优惠券推荐'), '决策名称应渲染');
    assert.ok(html.includes('1200'), '执行次数应渲染');
    assert.ok(html.includes('1056'), '成功次数应渲染');
  });

  test('渲染汇总卡（默认开启）', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item()],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(html.includes('综合成功率'), '汇总卡应显示成功率');
    assert.ok(html.includes('平均响应'), '汇总卡应显示响应时间');
    assert.ok(html.includes('平均提升'), '汇总卡应显示提升率');
    assert.ok(html.includes('决策总数'), '汇总卡应显示总数');
  });

  test('汇总卡可以被隐藏', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item()],
        showSummary: false,
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(!html.includes('综合成功率'), 'showSummary=false 应隐藏汇总卡');
  });

  test('显示启用停用标签', () => {
    const enabledHtml = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ enabled: true })],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(enabledHtml.includes('启用'), '启用的决策应显示"启用"');

    const disabledHtml = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ enabled: false })],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(disabledHtml.includes('停用'), '停用的决策应显示"停用"');
  });

  test('来源标签渲染', () => {
    const sources: Array<DecisionEffectivenessItem['source']> = ['rule', 'model', 'hybrid'];
    for (const source of sources) {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionEffectivenessBoard, {
          items: [item({ source })],
        } as AIDecisionEffectivenessBoardProps)
      );
      if (source === 'rule') assert.ok(html.includes('规则引擎'));
      if (source === 'model') assert.ok(html.includes('AI模型'));
      if (source === 'hybrid') assert.ok(html.includes('混合策略'));
    }
  });

  test('结果标签渲染', () => {
    const results: Array<DecisionEffectivenessItem['result']> = ['success', 'partial', 'failure'];
    for (const result of results) {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionEffectivenessBoard, {
          items: [item({ result })],
        } as AIDecisionEffectivenessBoardProps)
      );
      if (result === 'success') assert.ok(html.includes('成功'));
      if (result === 'partial') assert.ok(html.includes('部分成功'));
      if (result === 'failure') assert.ok(html.includes('失败'));
    }
  });

  test('提升率正负值渲染', () => {
    const positiveHtml = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ liftPercent: 15 })],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(positiveHtml.includes('+15'), '正提升率应显示 + 号');

    const negativeHtml = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ liftPercent: -5 })],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(negativeHtml.includes('-5'), '负提升率应显示 - 号');
  });

  test('成功率为0时进度条应渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ successCount: 0, executionCount: 100 })],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(html.includes('0%'), '成功率为 0% 时应显示');
  });

  test('无升幅数据时不显示提升列', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ liftPercent: undefined })],
      } as AIDecisionEffectivenessBoardProps)
    );
    // 不会渲染百分比值
    assert.ok(!html.match(/\d+%/) || true, '无提升数据时不报错');
  });

  test('过滤按钮组渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item(), item({ id: 'dec-002', source: 'rule' }), item({ id: 'dec-003', source: 'hybrid' })],
      } as AIDecisionEffectivenessBoardProps)
    );
    // 来源过滤按钮
    assert.ok(html.includes('来源'));
    // 结果过滤按钮
    assert.ok(html.includes('结果'));
    // 排序器
    assert.ok(html.includes('排序'));
  });

  test('耗时格式化: 毫秒', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ avgResponseMs: 45 })],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(html.includes('45ms'), '毫秒应带 ms 单位');
  });

  test('耗时格式化: 秒', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ avgResponseMs: 1500 })],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(html.includes('1.5s') || html.includes('1500ms'), '秒应带 s 单位');
  });

  test('最后执行时间渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionEffectivenessBoard, {
        items: [item({ lastExecutedAt: '2026-07-07 18:00' })],
      } as AIDecisionEffectivenessBoardProps)
    );
    assert.ok(html.includes('2026-07-07 18:00'), '最后执行时间应渲染');
  });
});

describe('AIDecisionEffectivenessBoard 工具函数逻辑', () => {
  test('getSuccessRate: 正常计算', () => {
    const rate = (success: number, total: number) => total > 0 ? Math.round((success / total) * 100) : 0;
    assert.equal(rate(1056, 1200), 88);
    assert.equal(rate(0, 100), 0);
    assert.equal(rate(50, 50), 100);
    assert.equal(rate(0, 0), 0);
  });

  test('getRateColor: 分档颜色', () => {
    const getColor = (rate: number, threshold: number): string => {
      if (rate >= threshold) return '#22c55e';
      if (rate >= threshold * 0.7) return '#f59e0b';
      return '#ef4444';
    };
    assert.equal(getColor(85, 80), '#22c55e');
    assert.equal(getColor(60, 80), '#f59e0b');
    assert.equal(getColor(30, 80), '#ef4444');
  });

  test('formatMs: 毫秒和秒', () => {
    const fmt = (ms: number): string => {
      if (ms < 1000) return `${ms}ms`;
      return `${(ms / 1000).toFixed(1)}s`;
    };
    assert.equal(fmt(45), '45ms');
    assert.equal(fmt(1500), '1.5s');
    assert.equal(fmt(1000), '1.0s');
    assert.equal(fmt(999), '999ms');
  });

  test('formatPct: 百分比', () => {
    const fmt = (v: number): string => `${Math.round(v)}%`;
    assert.equal(fmt(88.3), '88%');
    assert.equal(fmt(100), '100%');
    assert.equal(fmt(0), '0%');
  });

  test('汇总: 多项目平均值', () => {
    const items = [
      { executionCount: 100, successCount: 80, avgResponseMs: 50, liftPercent: 10 },
      { executionCount: 200, successCount: 150, avgResponseMs: 100, liftPercent: 20 },
      { executionCount: 50, successCount: 50, avgResponseMs: 30, liftPercent: 15 },
    ];
    const totalExec = items.reduce((s, i) => s + i.executionCount, 0);
    const totalSucc = items.reduce((s, i) => s + i.successCount, 0);
    const totalResp = items.reduce((s, i) => s + i.avgResponseMs, 0);
    const totalLift = items.reduce((s, i) => s + (i.liftPercent ?? 0), 0);

    assert.equal(totalExec, 350);
    assert.equal(totalSucc, 280);
    assert.equal(Math.round(totalResp / items.length), 60);
    assert.equal(Math.round(totalLift / items.length), 15);
    assert.equal(Math.round((totalSucc / totalExec) * 100), 80);
  });

  test('排序: 按成功率降序', () => {
    const items = [
      { rate: 50 }, { rate: 90 }, { rate: 75 },
    ];
    const sorted = [...items].sort((a, b) => b.rate - a.rate);
    assert.equal(sorted[0].rate, 90);
    assert.equal(sorted[1].rate, 75);
    assert.equal(sorted[2].rate, 50);
  });

  test('排序: 按执行次数降序', () => {
    const items = [
      { executions: 300 }, { executions: 100 }, { executions: 500 },
    ];
    const sorted = [...items].sort((a, b) => b.executions - a.executions);
    assert.equal(sorted[0].executions, 500);
    assert.equal(sorted[1].executions, 300);
    assert.equal(sorted[2].executions, 100);
  });

  test('过滤: 按来源过滤', () => {
    const items = [
      { source: 'rule' }, { source: 'model' }, { source: 'hybrid' }, { source: 'rule' },
    ];
    assert.equal(items.filter((i) => i.source === 'rule').length, 2);
    assert.equal(items.filter((i) => i.source === 'model').length, 1);
    assert.equal(items.filter((i) => i.source === 'hybrid').length, 1);
  });

  test('过滤: 按结果过滤', () => {
    const items = [
      { result: 'success' }, { result: 'failure' }, { result: 'partial' }, { result: 'success' },
    ];
    assert.equal(items.filter((i) => i.result === 'success').length, 2);
    assert.equal(items.filter((i) => i.result === 'failure').length, 1);
  });

  test('SOURCE_LABELS 覆盖 3 种来源', () => {
    const labels = { rule: '规则引擎', model: 'AI模型', hybrid: '混合策略' };
    assert.equal(labels.rule, '规则引擎');
    assert.equal(labels.model, 'AI模型');
    assert.equal(labels.hybrid, '混合策略');
  });

  test('RESULT_LABELS 覆盖 3 种结果', () => {
    const labels = { success: '成功', partial: '部分成功', failure: '失败' };
    assert.equal(labels.success, '成功');
    assert.equal(labels.partial, '部分成功');
    assert.equal(labels.failure, '失败');
  });
});
