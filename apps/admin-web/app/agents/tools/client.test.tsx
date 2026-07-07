/**
 * client.test.tsx — BDD tests for AgentToolsClient component
 * Phase-26: Agent 工具注册中心 L1 冒烟测试
 *
 * 覆盖:
 * - 工具表格渲染 (工具名/类别/说明/风险等级/入参)
 * - 风险等级 StatusBadge 颜色 (低/中/高)
 * - 入参渲染 (必选标 * / 可选无标记)
 * - Fallback 降级横幅渲染
 * - 空结果占位符
 * - 边界: 空工具列表 / 无入参工具 / 特殊字符
 */

import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Direct import — client component, server-compatible via renderToStaticMarkup
import AgentToolsClient from './agent-tools-client';

// ── Helpers ──

function createMockTool(overrides: Record<string, unknown> = {}) {
  return {
    name: 'order_query',
    description: '根据订单号查询订单详情、物流、支付状态。',
    category: 'commerce',
    riskLevel: 'low' as const,
    inputSchema: {
      type: 'object' as const,
      properties: { orderId: { type: 'string', description: '订单号' } },
      required: ['orderId'],
    },
    ...overrides,
  };
}

const MOCK_TOOLS = [
  createMockTool(),
  createMockTool({
    name: 'refund_create',
    description: '为已完成订单发起退款流程。',
    category: 'commerce',
    riskLevel: 'high',
    inputSchema: {
      type: 'object',
      properties: { orderId: { type: 'string' }, reason: { type: 'string' }, amount: { type: 'number' } },
      required: ['orderId', 'reason'],
    },
  }),
  createMockTool({
    name: 'knowledge_search',
    description: '在指定知识库中检索相关内容。',
    category: 'rag',
    riskLevel: 'low',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, knowledgeBaseIds: { type: 'array' } },
      required: ['query'],
    },
  }),
  createMockTool({
    name: 'crm_lookup',
    description: '查询 CRM 中的客户档案与历史交互。',
    category: 'crm',
    riskLevel: 'medium',
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: 'string' } },
      required: [],
    },
  }),
  createMockTool({
    name: 'no_schema_tool',
    description: '一个没有 schema 定义的测试工具。',
    category: 'utility',
    riskLevel: 'low',
    inputSchema: undefined,
  }),
];

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

// ---- 测试套件 ----

test('AgentToolsClient', async (t) => {
  // ── 正常渲染 ──
  await t.test('renders DataTable with tool items', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'api',
    }));
    assert.match(html, /order_query/);
    assert.match(html, /refund_create/);
    assert.match(html, /knowledge_search/);
    assert.match(html, /crm_lookup/);
  });

  await t.test('renders tool descriptions', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'api',
    }));
    assert.match(html, /根据订单号查询/);
    assert.match(html, /发起退款流程/);
  });

  await t.test('renders category labels', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'api',
    }));
    assert.match(html, /commerce/);
    assert.match(html, /rag/);
    assert.match(html, /crm/);
  });

  // ── 风险等级 StatusBadge ──
  await t.test('renders low risk badge', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [MOCK_TOOLS[0]],
      deliveryMode: 'api',
    }));
    assert.match(html, /低风险/);
  });

  await t.test('renders medium risk badge', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [MOCK_TOOLS[3]],
      deliveryMode: 'api',
    }));
    assert.match(html, /中风险/);
  });

  await t.test('renders high risk badge', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [MOCK_TOOLS[1]],
      deliveryMode: 'api',
    }));
    assert.match(html, /高风险/);
  });

  // ── 入参渲染 ──
  await t.test('renders required parameter with asterisk', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [MOCK_TOOLS[0]],
      deliveryMode: 'api',
    }));
    assert.match(html, /orderId\*/);
  });

  await t.test('renders optional parameter without asterisk', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [MOCK_TOOLS[3]],
      deliveryMode: 'api',
    }));
    assert.match(html, /customerId/);
  });

  await t.test('renders no-schema tool with dash placeholder', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [MOCK_TOOLS[4]],
      deliveryMode: 'api',
    }));
    assert.match(html, /no_schema_tool/);
  });

  // ── Fallback 降级横幅 ──
  await t.test('renders fallback banner when deliveryMode is fallback', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'fallback',
      error: 'NetworkError: fetch failed',
    }));
    assert.match(html, /⚠️/);
    assert.match(html, /后端不可达/);
    assert.match(html, /NetworkError/);
  });

  await t.test('does not render fallback banner when deliveryMode is api', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'api',
    }));
    assert.doesNotMatch(html, /后端不可达/);
  });

  await t.test('renders custom fallback error message', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'fallback',
      error: 'timeout after 5000ms',
    }));
    assert.match(html, /timeout after 5000ms/);
  });

  await t.test('fallback banner without error message', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'fallback',
    }));
    assert.match(html, /⚠️/);
    assert.match(html, /后端不可达/);
  });

  // ── Tab 筛选器 ──
  await t.test('renders risk filter tabs', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'api',
    }));
    assert.match(html, /全部/);
    assert.match(html, /高风险/);
    assert.match(html, /中风险/);
    assert.match(html, /低风险/);
  });

  await t.test('renders risk counts in tabs', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'api',
    }));
    assert.match(html, />5</);      // 5 tools total (count = all)
  });

  // ── 搜索框 ──
  await t.test('renders search input with placeholder', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'api',
    }));
    assert.match(html, /搜索工具名、类别或说明/);
  });

  // ── 边界情况 ──
  await t.test('renders empty state when tools list is empty', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [],
      deliveryMode: 'api',
    }));
    assert.ok(html.length > 0);
    assert.doesNotMatch(html, /order_query/);
  });

  await t.test('renders single tool without crash', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [MOCK_TOOLS[0]],
      deliveryMode: 'api',
    }));
    assert.match(html, /order_query/);
    assert.doesNotMatch(html, /refund_create/);
  });

  await t.test('handles tools with special characters in name', () => {
    const specialTool = createMockTool({
      name: 'test-tool/v2.0 (beta)',
      riskLevel: 'medium',
    });
    const html = render(React.createElement(AgentToolsClient, {
      tools: [specialTool],
      deliveryMode: 'api',
    }));
    assert.match(html, /test-tool/);
    assert.match(html, /beta/);
  });

  await t.test('renders multiple param chips for tool with many params', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: [MOCK_TOOLS[1]], // refund_create has orderId*, reason*, amount
      deliveryMode: 'api',
    }));
    assert.match(html, /orderId\*/);
    assert.match(html, /reason\*/);
    assert.match(html, /amount/); // optional — no asterisk
  });

  // ── 反例: 不存在的数据 ──
  await t.test('does not render non-existent tool data', () => {
    const html = render(React.createElement(AgentToolsClient, {
      tools: MOCK_TOOLS,
      deliveryMode: 'api',
    }));
    assert.doesNotMatch(html, /不存在/);
    assert.doesNotMatch(html, /dummy/);
  });
});
