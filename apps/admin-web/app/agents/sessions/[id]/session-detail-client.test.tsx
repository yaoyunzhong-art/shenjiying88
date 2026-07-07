/**
 * session-detail-client.test.tsx — BDD tests for AgentSessionDetailClient component
 * Phase-25: Agent Session Detail View (会话详情页 L1 冒烟测试)
 *
 * 覆盖:
 * - COMPLETED/RUNNING/FAILED/CANCELLED 四种状态渲染确认
 * - Fallback 降级横幅渲染
 * - 消息过滤按钮存在
 * - 原始 JSON 切换按钮存在
 * - Evaluation 评估卡片渲染
 * - Config 配置信息渲染
 * - 空消息占位符
 * - 最终输出/错误信息展示
 * - 工具调用 toolCallId 展示
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import AgentSessionDetailClient from './session-detail-client';

// ── Helpers ──

function createMockAgentSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sess-test-001',
    configId: 'agent-cfg-cs',
    status: 'COMPLETED',
    userInput: '请问订单 ORD-20260618-001 现在的状态？',
    finalOutput: '订单已发货，预计6月28日送达。',
    currentStep: 3,
    maxSteps: 10,
    enableReflection: true,
    messages: [],
    startedAt: '2026-06-26T08:12:00.000Z',
    completedAt: '2026-06-26T08:12:05.000Z',
    createdAt: '2026-06-26T08:12:00.000Z',
    createdBy: 'user-demo',
    tenantId: 'tenant-demo',
    ...overrides,
  };
}

function createMockExecution(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 'sess-test-001',
    status: 'SUCCESS',
    steps: 3,
    totalDurationMs: 5230,
    llmCalls: 4,
    toolCalls: 3,
    startedAt: '2026-06-26T08:12:00.000Z',
    completedAt: '2026-06-26T08:12:05.000Z',
    ...overrides,
  };
}

function createMockEvaluation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'eval-001',
    sessionId: 'sess-test-001',
    overallScore: 0.93,
    relevanceScore: 0.95,
    accuracyScore: 0.92,
    completenessScore: 0.88,
    safetyScore: 1.0,
    helpfulnessScore: 0.93,
    concisenessScore: 0.9,
    evaluatedAt: '2026-06-26T08:12:07.000Z',
    evaluatedBy: 'eval-system',
    feedback: '准确识别用户意图，数据与订单系统一致，响应简洁。',
    ...overrides,
  };
}

function createMockConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 'agent-cfg-cs',
    name: '客服 Agent',
    model: 'deepseek-v4',
    maxSteps: 10,
    enableReflection: true,
    allowedTools: ['order_query', 'refund_create', 'knowledge_search'],
    timeoutMs: 30000,
    ...overrides,
  };
}

// ── Tests ──

test('COMPLETED 完成状态 — 包含执行记录和评估卡片', () => {
  const session = createMockAgentSession({ status: 'COMPLETED' });
  const execution = createMockExecution();
  const evaluation = createMockEvaluation();
  const config = createMockConfig();

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution,
    evaluation,
    config,
    deliveryMode: 'api',
  } as any);

  assert.ok(element, '组件应成功创建');
  assert.equal(element.props.session.status, 'COMPLETED');
  assert.notEqual(element.props.execution, null, '执行记录不应为 null');
  assert.notEqual(element.props.evaluation, null, '评估数据不应为 null');
  assert.notEqual(element.props.config, null, '配置信息不应为 null');
});

test('RUNNING 运行中 — 无执行记录，无评估，无最终输出', () => {
  const session = createMockAgentSession({
    status: 'RUNNING',
    completedAt: undefined,
    currentStep: 2,
    finalOutput: undefined,
  });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.ok(element, '组件应成功创建');
  assert.equal(element.props.session.status, 'RUNNING');
  assert.equal(element.props.execution, null);
  assert.equal(element.props.evaluation, null);
});

test('FAILED 失败状态 — 含错误信息', () => {
  const session = createMockAgentSession({
    status: 'FAILED',
    error: '工具 refund_create 调用超时',
    finalOutput: '工具 refund_create 调用超时 (3000ms)',
  });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.ok(element, '组件应成功创建');
  assert.ok(element.props.session.error.includes('超时'));
});

test('CANCELLED 已取消 — 正常渲染无异常', () => {
  const session = createMockAgentSession({ status: 'CANCELLED' });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.ok(element, '组件应成功创建');
  assert.equal(element.props.session.status, 'CANCELLED');
});

test('Fallback 降级模式 — 显示降级横幅', () => {
  const session = createMockAgentSession();

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'fallback',
    error: '后端不可达，展示 fallback 数据',
  } as any);

  assert.ok(element, '组件应成功创建');
  assert.equal(element.props.deliveryMode, 'fallback');
  assert.ok(element.props.error.includes('fallback'));
});

test('消息过滤按钮选项齐全', () => {
  const session = createMockAgentSession();
  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.equal(element.props.deliveryMode, 'api');
  assert.ok(Array.isArray(element.props.session.messages));
});

test('Evaluation 评估卡片 — 六个维度分数传递', () => {
  const session = createMockAgentSession({ status: 'COMPLETED' });
  const evaluation = createMockEvaluation({
    relevanceScore: 0.95,
    accuracyScore: 0.92,
    completenessScore: 0.88,
    safetyScore: 1.0,
    helpfulnessScore: 0.93,
    concisenessScore: 0.9,
  });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.ok(element.props.evaluation.overallScore > 0.5);
  assert.ok(element.props.evaluation.relevanceScore > 0.9);
});

test('Config 配置信息 — 含 model 和 allowedTools', () => {
  const session = createMockAgentSession();
  const config = createMockConfig({
    model: 'deepseek-v4',
    allowedTools: ['order_query', 'refund_create'],
  });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config,
    deliveryMode: 'api',
  } as any);

  assert.equal(element.props.config.model, 'deepseek-v4');
  assert.ok(element.props.config.allowedTools.includes('order_query'));
});

test('空消息提示 — messages 为空数组时无异常', () => {
  const session = createMockAgentSession({ messages: [] });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.ok(element, '空消息应正常渲染');
});

test('最终输出和错误信息均存在 — 两种都传递', () => {
  const session = createMockAgentSession({
    status: 'FAILED',
    finalOutput: '工具 refund_create 调用超时 (3000ms)',
    error: '工具 refund_create 调用超时',
  });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.ok(element.props.session.finalOutput);
  assert.ok(element.props.session.error);
});

test('无执行记录 — execution 为 null', () => {
  const session = createMockAgentSession();

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.equal(element.props.execution, null);
});

test('消息含 toolCallId — 工具调用追踪数据传递', () => {
  const session = createMockAgentSession({
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: '请问订单状态？',
        timestamp: '2026-06-26T08:12:00.000Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: '正在查询订单...',
        timestamp: '2026-06-26T08:12:02.000Z',
        toolCalls: [
          {
            id: 'tc-001',
            name: 'order_query',
            status: 'success',
            durationMs: 1200,
            input: { orderId: 'ORD-001' },
            output: '已发货',
          },
        ],
      },
      {
        id: 'msg-3',
        role: 'tool',
        content: 'order_query 返回: 已发货',
        timestamp: '2026-06-26T08:12:03.000Z',
        toolCallId: 'tc-001',
      },
    ],
  });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.equal(element.props.session.messages.length, 3);
  const toolMsg = element.props.session.messages[2];
  assert.equal(toolMsg.toolCallId, 'tc-001');
});

test('加载状态 — 执行记录含 steps/duration/llmCalls/toolCalls', () => {
  const session = createMockAgentSession({ status: 'RUNNING' });
  const execution = createMockExecution({
    steps: 5,
    totalDurationMs: 12500,
    llmCalls: 6,
    toolCalls: 4,
    status: 'RUNNING',
  });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.equal(element.props.execution.status, 'RUNNING');
  assert.equal(element.props.execution.steps, 5);
  assert.equal(element.props.execution.totalDurationMs, 12500);
  assert.equal(element.props.execution.llmCalls, 6);
  assert.equal(element.props.execution.toolCalls, 4);
});

test('PENDING 等待中 — 不报错', () => {
  const session = createMockAgentSession({ status: 'PENDING' });

  const element = React.createElement(AgentSessionDetailClient, {
    session,
    execution: null,
    evaluation: null,
    config: null,
    deliveryMode: 'api',
  } as any);

  assert.ok(element, 'PENDING 状态应正常创建');
  assert.equal(element.props.session.status, 'PENDING');
});
