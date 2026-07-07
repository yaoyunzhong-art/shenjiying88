import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIAgentThinkingPanel } = require('./AIAgentThinkingPanel');

// ==================== 测试数据 ====================

const sampleSteps = [
  {
    id: 'step-1',
    index: 1,
    title: '数据加载',
    description: '从数据库加载会员消费数据',
    status: 'completed',
    durationMs: 120,
    conclusion: '成功加载最近30天的消费记录',
    confidence: 95,
    alternatives: ['使用缓存加速', '分页加载减少延迟'],
  },
  {
    id: 'step-2',
    index: 2,
    title: '异常检测',
    description: '检测消费行为中的异常模式',
    status: 'completed',
    durationMs: 85,
    conclusion: '发现3个异常交易模式',
    confidence: 82,
  },
  {
    id: 'step-3',
    index: 3,
    title: '规则匹配',
    description: '将异常模式匹配到风控规则引擎',
    status: 'running',
    durationMs: 45,
    confidence: 60,
  },
  {
    id: 'step-4',
    index: 4,
    title: '生成建议',
    description: '基于匹配结果生成处理建议',
    status: 'pending',
    confidence: 30,
  },
];

const sampleConclusion = {
  action: '建议冻结涉及异常交易的会员账户，并发送人工复核通知',
  confidence: 85,
  rationale: '基于消费频率突增及异地登录的异常模式匹配，命中3条高风险风控规则',
  risks: ['可能误伤正常高消费用户', '需要48小时内完成复核避免客诉'],
  priority: 'urgent',
};

function containsText(html, text) {
  // 去除 HTML 标签后检查是否包含文本
  const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.includes(text);
}

// ==================== 测试用例 ====================

describe('AIAgentThinkingPanel', () => {
  test('渲染面板标题和代理名称', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="风控分析助手" steps={sampleSteps} />,
    );
    assert.ok(html.includes('ai-agent-thinking-panel'));
    assert.ok(containsText(html, '风控分析助手'));
    assert.ok(containsText(html, '推理过程'));
  });

  test('显示总耗时', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={sampleSteps} totalDurationMs={350} />,
    );
    assert.ok(html.includes('350ms'));
  });

  test('思考中显示 thinking 标识', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={sampleSteps} thinking />,
    );
    assert.ok(html.includes('ai-agent-thinking-panel-thinking-badge'));
  });

  test('显示进度计数', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={sampleSteps} />,
    );
    assert.ok(html.includes('ai-agent-thinking-panel-progress'));
    assert.ok(containsText(html, '2/4'));
  });

  test('空状态渲染', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={[]} />,
    );
    assert.ok(html.includes('ai-agent-thinking-panel-empty'));
    assert.ok(containsText(html, '暂无推理过程'));
  });

  test('自定义空状态文本', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={[]} emptyText="空数据" />,
    );
    assert.ok(containsText(html, '空数据'));
  });

  test('有结论时渲染决策建议区域', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel
        agentName="风控分析助手"
        steps={sampleSteps}
        conclusion={sampleConclusion}
      />,
    );
    assert.ok(html.includes('ai-agent-thinking-panel-conclusion'));
    assert.ok(html.includes('ai-agent-thinking-panel-action'));
    assert.ok(html.includes('ai-agent-thinking-panel-rationale'));
    assert.ok(html.includes('ai-agent-thinking-panel-confidence-bar'));
    assert.ok(html.includes('ai-agent-thinking-panel-risks'));
    assert.ok(containsText(html, '紧急'));
    assert.ok(containsText(html, '建议冻结'));
  });

  test('渲染步骤状态图标', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={sampleSteps} />,
    );
    assert.ok(html.includes('step-status-icon-completed'));
    assert.ok(html.includes('step-status-icon-running'));
    assert.ok(html.includes('step-status-icon-pending'));
  });

  test('渲染自定义标题', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel
        agentName="风控分析助手"
        steps={sampleSteps}
        title="AI 风控推理面板"
      />,
    );
    assert.ok(containsText(html, 'AI 风控推理面板'));
  });

  test('渲染步骤耗时', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={sampleSteps} />,
    );
    assert.ok(html.includes('120ms'));
    assert.ok(html.includes('85ms'));
    assert.ok(html.includes('45ms'));
  });

  test('渲染步骤结论', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={sampleSteps} />,
    );
    assert.ok(html.includes('成功加载最近30天的消费记录'));
    assert.ok(html.includes('发现3个异常交易模式'));
  });

  test('渲染步骤替代方案', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={sampleSteps} />,
    );
    assert.ok(html.includes('使用缓存加速'));
    assert.ok(html.includes('分页加载减少延迟'));
  });

  test('渲染风险提示区域', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel
        agentName="助手"
        steps={sampleSteps}
        conclusion={sampleConclusion}
      />,
    );
    assert.ok(containsText(html, '风险提示'));
    assert.ok(html.includes('可能误伤正常高消费用户'));
    assert.ok(html.includes('需要48小时内完成复核避免客诉'));
  });

  test('渲染优先级徽章', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel
        agentName="助手"
        steps={sampleSteps}
        conclusion={sampleConclusion}
      />,
    );
    assert.ok(html.includes('priority-badge-urgent'));
  });

  test('不渲染结论区域当没有提供结论时', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={sampleSteps} />,
    );
    assert.ok(!html.includes('ai-agent-thinking-panel-conclusion'));
  });

  test('支持自定义 data-testid', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel
        agentName="助手"
        steps={sampleSteps}
        data-testid="my-custom-panel"
      />,
    );
    assert.ok(html.includes('my-custom-panel'));
  });

  test('支持自定义 className', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel
        agentName="助手"
        steps={sampleSteps}
        className="my-custom-class"
      />,
    );
    assert.ok(html.includes('my-custom-class'));
  });

  test('全部完成状态显示正确进度', () => {
    const allDone = sampleSteps.map(s => ({
      ...s,
      status: 'completed',
      durationMs: 50,
    }));
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={allDone} />,
    );
    assert.ok(containsText(html, '4/4'));
  });

  test('有错误步骤时显示错误计数', () => {
    const withError = sampleSteps.map((s, i) => ({
      ...s,
      status: i === 2 ? 'error' : s.status,
    }));
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel agentName="助手" steps={withError} />,
    );
    assert.ok(html.includes('1 个错误'));
  });

  test('默认展开步骤内容', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel
        agentName="助手"
        steps={sampleSteps}
        defaultExpanded
      />,
    );
    // All step bodies should be rendered since defaultExpanded=true shows the button content
    assert.ok(html.includes('步骤 1'));
    assert.ok(html.includes('步骤 2'));
    assert.ok(html.includes('步骤 3'));
    assert.ok(html.includes('步骤 4'));
  });

  test('置信度条渲染正确宽度', () => {
    const html = renderToStaticMarkup(
      <AIAgentThinkingPanel
        agentName="助手"
        steps={sampleSteps}
        conclusion={sampleConclusion}
        defaultExpanded
      />,
    );
    // steps with confidence should have confidence bars
    assert.ok(html.includes('95%'));
    assert.ok(html.includes('82%'));
    assert.ok(html.includes('60%'));
    assert.ok(html.includes('85%')); // conclusion confidence
  });
});
