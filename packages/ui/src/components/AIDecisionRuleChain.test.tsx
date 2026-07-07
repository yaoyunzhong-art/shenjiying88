import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AIDecisionRuleChain } = require('./AIDecisionRuleChain');

import type { RuleChainNode, DecisionSummary, AIDecisionRuleChainProps } from './AIDecisionRuleChain';

/** 创建示例规则节点 */
function makeRule(overrides: Partial<RuleChainNode> = {}): RuleChainNode {
  return {
    id: 'r1',
    name: '消费门槛检查',
    status: 'passed',
    tag: '风控',
    confidence: 0.95,
    durationMs: 12,
    output: '近30天消费达 ¥2,000',
    description: '检查近30天累计消费金额是否达标',
    ...overrides,
  };
}

/** 创建示例摘要 */
function makeSummary(overrides: Partial<DecisionSummary> = {}): DecisionSummary {
  return {
    totalRules: 5,
    triggeredRules: 4,
    blockedRules: 1,
    totalDurationMs: 87,
    finalDecision: 'approve',
    finalDecisionReason: '用户满足所有升级条件',
    ...overrides,
  };
}

describe('AIDecisionRuleChain', () => {

  // --- 1. 基础渲染 ---
  test('renders root element with data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [] })
    );
    assert.ok(html.includes('data-testid="decision-rule-chain"'));
  });

  // --- 2. 标题渲染 ---
  test('renders title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [],
        title: '会员自动升级规则链',
      })
    );
    assert.ok(html.includes('data-testid="chain-title"'));
    assert.match(html, /会员自动升级规则链/);
  });

  // --- 3. 无标题时不渲染标题 ---
  test('does not render title when omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [] })
    );
    assert.equal(html.includes('chain-title'), false);
  });

  // --- 4. 空数据提示 ---
  test('shows empty state when no rules', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [] })
    );
    assert.ok(html.includes('data-testid="chain-empty"'));
    assert.match(html, /暂无规则链数据/);
  });

  // --- 5. 渲染单个规则节点 ---
  test('renders a single rule node', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [makeRule()],
      })
    );
    assert.ok(html.includes('data-testid="rule-node-r1"'));
    assert.ok(html.includes('消费门槛检查'));
    assert.ok(html.includes('近30天消费达 ¥2,000'));
  });

  // --- 6. 渲染 summary 栏 ---
  test('renders summary bar when summary provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [makeRule()],
        summary: makeSummary(),
      })
    );
    assert.ok(html.includes('data-testid="summary-bar"'));
    assert.ok(html.includes('data-testid="summary-total"'));
    assert.ok(html.includes('data-testid="summary-triggered"'));
    assert.ok(html.includes('data-testid="summary-blocked"'));
    assert.ok(html.includes('data-testid="summary-duration"'));
  });

  // --- 7. summary 中显示最终决策 ---
  test('shows final decision in summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [makeRule()],
        summary: makeSummary({ finalDecision: 'approve' }),
      })
    );
    assert.ok(html.includes('通过'));
  });

  // --- 8. reject 决策显示拒绝 ---
  test('shows reject decision', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [makeRule()],
        summary: makeSummary({ finalDecision: 'reject' }),
      })
    );
    assert.ok(html.includes('拒绝'));
  });

  // --- 9. review 决策显示人工审核 ---
  test('shows review decision', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [makeRule()],
        summary: makeSummary({ finalDecision: 'review' }),
      })
    );
    assert.ok(html.includes('人工审核'));
  });

  // --- 10. 所有状态均渲染对应图标 ---
  test('renders all rule statuses', () => {
    const statuses: RuleChainNode['status'][] = ['pending', 'running', 'passed', 'blocked', 'skipped', 'error'];
    const nodes = statuses.map((status, i) =>
      makeRule({ id: `r${i}`, name: `Status-${status}`, status })
    );
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: nodes })
    );
    for (const status of statuses) {
      assert.ok(html.includes(`data-testid="rule-node-r${statuses.indexOf(status)}"`));
    }
  });

  // --- 11. 渲染子节点 ---
  test('renders child nodes recursively', () => {
    const node = makeRule({
      id: 'parent',
      name: '父规则',
      children: [
        makeRule({ id: 'child1', name: '子规则1' }),
        makeRule({ id: 'child2', name: '子规则2' }),
      ],
    });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('data-testid="rule-node-child1"'));
    assert.ok(html.includes('data-testid="rule-node-child2"'));
    assert.ok(html.includes('子规则1'));
    assert.ok(html.includes('子规则2'));
  });

  // --- 12. variant 属性 ---
  test('renders variant attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [],
        variant: 'h5',
      })
    );
    assert.ok(html.includes('data-variant="h5"'));
  });

  // --- 13. 所有 variant 不崩溃 ---
  test('renders all variants without crash', () => {
    const variants: AIDecisionRuleChainProps['variant'][] = ['pc', 'h5', 'app', 'pad', 'miniprogram'];
    for (const v of variants) {
      const html = renderToStaticMarkup(
        React.createElement(AIDecisionRuleChain, { rules: [makeRule()], variant: v })
      );
      assert.ok(html.includes(`data-variant="${v}"`));
    }
  });

  // --- 14. compact 模式下不渲染描述 ---
  test('does not render description in compact mode', () => {
    const node = makeRule({ description: '这是一个描述文字' });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [node],
        compact: true,
      })
    );
    assert.equal(html.includes('这是一个描述文字'), false);
  });

  // --- 15. 非 compact 渲染描述 ---
  test('renders description when compact is false', () => {
    const node = makeRule({ description: '检查近30天累计消费金额' });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('检查近30天累计消费金额'));
  });

  // --- 16. blocked 规则显示拦截文字 ---
  test('shows blocked status text', () => {
    const node = makeRule({ status: 'blocked' });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('已拦截'));
  });

  // --- 17. 置信度渲染 ---
  test('renders confidence percentage', () => {
    const node = makeRule({ confidence: 0.85 });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('85%'));
  });

  // --- 18. 耗时渲染 ---
  test('renders duration', () => {
    const node = makeRule({ durationMs: 45 });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('45ms'));
  });

  // --- 19. 标签渲染 ---
  test('renders type tag', () => {
    const node = makeRule({ tag: '信用评分' });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('信用评分'));
  });

  // --- 20. summary 中显示决策理由 ---
  test('renders final decision reason in summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, {
        rules: [],
        summary: makeSummary({ finalDecisionReason: '用户信用分达标' }),
      })
    );
    assert.ok(html.includes('用户信用分达标'));
  });

  // --- 21. summary 总数字正确 ---
  test('displays correct total rule count', () => {
    const summary = makeSummary({ totalRules: 8 });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [], summary })
    );
    assert.ok(html.includes('8'));
  });

  // --- 22. blocked 计数 ---
  test('displays correct blocked count', () => {
    const summary = makeSummary({ blockedRules: 3 });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [], summary })
    );
    assert.ok(html.includes('3'));
  });

  // --- 23. 多重子节点层级 ---
  test('renders deeply nested rule chains', () => {
    const root = makeRule({
      id: 'root',
      name: '根规则',
      children: [
        makeRule({
          id: 'branch',
          name: '分支规则',
          children: [makeRule({ id: 'leaf', name: '叶子规则' })],
        }),
      ],
    });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [root] })
    );
    assert.ok(html.includes('data-testid="rule-node-leaf"'));
    assert.ok(html.includes('叶子规则'));
  });

  // --- 24. pending 状态 -- 
  test('renders pending status', () => {
    const node = makeRule({ status: 'pending' });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('待执行'));
  });

  // --- 25. running 状态 ---
  test('renders running status', () => {
    const node = makeRule({ status: 'running' });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('执行中'));
  });

  // --- 26. error 状态 ---
  test('renders error status', () => {
    const node = makeRule({ status: 'error' });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('异常'));
  });

  // --- 27. skipped 状态 ---
  test('renders skipped status', () => {
    const node = makeRule({ status: 'skipped' });
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [node] })
    );
    assert.ok(html.includes('已跳过'));
  });

  // --- 28. 默认 variant ---
  test('defaults variant to pc', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: [makeRule()] })
    );
    assert.ok(html.includes('data-variant="pc"'));
  });

  // --- 29. 多条规则并列渲染 ---
  test('renders multiple root-level rules', () => {
    const nodes = [
      makeRule({ id: 'a', name: '规则A' }),
      makeRule({ id: 'b', name: '规则B' }),
      makeRule({ id: 'c', name: '规则C' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionRuleChain, { rules: nodes })
    );
    assert.ok(html.includes('规则A'));
    assert.ok(html.includes('规则B'));
    assert.ok(html.includes('规则C'));
  });

  // --- 30. 导出类型一致性 ---
  test('exports match expected interface', () => {
    // 验证模块导出的函数存在
    assert.equal(typeof AIDecisionRuleChain, 'function');
  });
});
