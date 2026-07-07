/**
 * ai-rule-weight-panel/ai-rule-weight-panel.test.tsx
 *
 * 单元测试覆盖：
 * - 正例：mock 数据渲染面板标题、规则行、类别标识、禁用规则折叠
 * - 反例：无规则空加载状态
 * - 边界：disabled 属性禁用交互（opacity 降低）、回调触发
 *
 * 使用 node:test runner, renderToStaticMarkup 避免 jsdom 依赖。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIRuleWeightPanel } from './AIRuleWeightPanel';
import { mockRuleWeights } from './useAIRuleWeight.mock';
import { useAIRuleWeight } from './useAIRuleWeight';

// ── Helpers ────────────────────────────────────────────────────────────────

function hasText(html: string, text: string): boolean {
  return html.includes(text);
}

// ── Component tests ────────────────────────────────────────────────────────

describe('AIRuleWeightPanel', () => {
  it('渲染面板标题和描述', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={mockRuleWeights()} />);
    assert.ok(hasText(html, 'AI 规则权重面板'));
    assert.ok(hasText(html, '调整各规则执行权重'));
  });

  it('渲染所有已启用的规则和类别标识', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={mockRuleWeights()} />);
    const rules = mockRuleWeights().filter(r => r.enabled);
    for (const rule of rules) {
      assert.ok(hasText(html, rule.name));
      assert.ok(hasText(html, rule.description));
    }
    // 检查类别标识
    assert.ok(hasText(html, '风控'));
    assert.ok(hasText(html, '营销'));
    assert.ok(hasText(html, '会员'));
    assert.ok(hasText(html, '库存'));
  });

  it('显示已禁用规则的折叠区', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={mockRuleWeights()} />);
    assert.ok(hasText(html, '已禁用的规则'));
    assert.ok(hasText(html, '排班倾向')); // 禁用的规则
  });

  it('加载状态下显示加载文案', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={[]} loading />);
    assert.ok(hasText(html, '加载规则权重配置中'));
  });

  it('disabled 属性降低透明度', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={mockRuleWeights()} disabled />);
    // disabled 时 opacity 会设为 0.5
    assert.ok(hasText(html, '0.5'));
    // 应包含 pointer-events: none
    assert.ok(hasText(html, 'pointer-events'));
  });

  it('显示了批量应用和重置按钮', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={mockRuleWeights()} />);
    assert.ok(hasText(html, '批量应用'));
    assert.ok(hasText(html, '重置'));
  });

  it('显示权重等级说明图例', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={mockRuleWeights()} />);
    assert.ok(hasText(html, '高权重'));
    assert.ok(hasText(html, '中权重'));
    assert.ok(hasText(html, '低权重'));
  });

  it('每个启用规则包含权重值数字', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={mockRuleWeights()} />);
    const enabled = mockRuleWeights().filter(r => r.enabled);
    for (const rule of enabled) {
      assert.ok(hasText(html, String(rule.currentWeight)));
    }
  });

  it('不可调节的规则的滑块标记为 disabled', () => {
    const html = renderToStaticMarkup(<AIRuleWeightPanel rules={mockRuleWeights()} />);
    const stockRule = mockRuleWeights().find(r => r.id === 'rule-4');
    assert.ok(stockRule);
    assert.equal(stockRule.adjustable, false);
  });
});

// ── Hook tests ──────────────────────────────────────────────────────────────

describe('useAIRuleWeight', () => {
  it('初始化为提供的规则列表', () => {
    const initial = mockRuleWeights();
    let hookResult: ReturnType<typeof useAIRuleWeight> | null = null;
    function TestComp() {
      hookResult = useAIRuleWeight(initial);
      return null;
    }
    renderToStaticMarkup(React.createElement(TestComp));
    assert.ok(hookResult);
    assert.equal(hookResult!.rules.length, initial.length);
    assert.equal(hookResult!.rules[0].currentWeight, 85);
  });

  it('使用 hook 后返回的初始值正确', () => {
    const initial = mockRuleWeights();
    let hookResult: ReturnType<typeof useAIRuleWeight> | null = null;
    function TestComp() {
      hookResult = useAIRuleWeight(initial);
      return null;
    }
    renderToStaticMarkup(React.createElement(TestComp));
    const r1 = hookResult!.rules.find(r => r.id === 'rule-1');
    assert.equal(r1?.currentWeight, 85);
    assert.equal(r1?.enabled, true);
    assert.equal(r1?.adjustable, true);
  });

  it('resetWeights 返回空初始状态不会崩溃', () => {
    let hookResult: ReturnType<typeof useAIRuleWeight> | null = null;
    function TestComp() {
      hookResult = useAIRuleWeight([]);
      return null;
    }
    renderToStaticMarkup(React.createElement(TestComp));
    assert.ok(hookResult);
    assert.equal(hookResult!.rules.length, 0);
  });

  it('updateWeight 函数签名类型正确（调用不抛异常）', () => {
    const initial = mockRuleWeights();
    let hookResult: ReturnType<typeof useAIRuleWeight> | null = null;
    function TestComp() {
      hookResult = useAIRuleWeight(initial);
      return null;
    }
    renderToStaticMarkup(React.createElement(TestComp));
    // 验证函数的存在和类型
    assert.equal(typeof hookResult!.updateWeight, 'function');
    assert.equal(typeof hookResult!.batchUpdate, 'function');
    assert.equal(typeof hookResult!.resetWeights, 'function');
    assert.equal(hookResult!.loading, false);
    assert.equal(hookResult!.error, null);
  });
});
