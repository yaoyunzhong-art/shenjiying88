/**
 * agent-configs-client.test.tsx — BDD tests for AgentConfigsClient component
 * Phase-26: Agent 配置中心 L1 冒烟测试
 *
 * 覆盖:
 * - 配置表格渲染 (配置名/模型/最大步数/超时/反思/工具数/状态/操作)
 * - Fallback 降级横幅渲染
 * - 空结果占位符
 * - 边界: 空配置列表, 启用/禁用状态, 特殊字符
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AgentConfigsClient from './agent-configs-client';

// ── Helpers ──

function createMockConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cfg-test-001',
    name: '客户服务 Agent',
    systemPrompt: '你是一个客户服务助理...',
    model: 'gpt-4o',
    maxSteps: 10,
    enableReflection: true,
    allowedTools: ['order_query', 'refund', 'customer_info'],
    timeoutMs: 30000,
    enabled: true,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-25T12:00:00.000Z',
    tenantId: 'tenant-demo',
    ...overrides,
  };
}

const MOCK_CONFIGS = [
  createMockConfig(),
  createMockConfig({
    id: 'cfg-test-002',
    name: '数据分析 Agent',
    model: 'gpt-4o-mini',
    maxSteps: 5,
    enableReflection: false,
    allowedTools: ['data_query', 'chart'],
    timeoutMs: 60000,
    enabled: true,
    updatedAt: '2026-06-20T08:00:00.000Z',
  }),
  createMockConfig({
    id: 'cfg-test-003',
    name: '库存管理 Agent',
    model: 'claude-3-haiku',
    maxSteps: 15,
    enableReflection: false,
    allowedTools: ['inventory_check', 'stock_alert'],
    timeoutMs: 120000,
    enabled: false,
    updatedAt: '2026-06-18T10:30:00.000Z',
  }),
  createMockConfig({
    id: 'cfg-test-004',
    name: '优惠券助手',
    model: 'gpt-4o',
    maxSteps: 20,
    enableReflection: true,
    allowedTools: ['coupon_create', 'coupon_query'],
    timeoutMs: 45000,
    enabled: false,
    updatedAt: '2026-06-15T14:00:00.000Z',
  }),
];

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

// ---- 测试套件 ----

test('AgentConfigsClient', async (t) => {
  // ── 正常渲染 ──
  await t.test('renders DataTable with config items', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, /客户服务 Agent/);
    assert.match(html, /数据分析 Agent/);
    assert.match(html, /库存管理 Agent/);
    assert.match(html, /优惠券助手/);
  });

  await t.test('renders model names', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, /gpt-4o/);
    assert.match(html, /gpt-4o-mini/);
    assert.match(html, /claude-3-haiku/);
  });

  await t.test('renders timeout as seconds', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, /30s/);
    assert.match(html, /60s/);
    assert.match(html, /120s/);
  });

  await t.test('renders maxSteps values', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, />10</);
    assert.match(html, />5</);
    assert.match(html, />15</);
  });

  await t.test('renders tool count', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, /3 个/);
    assert.match(html, /2 个/);
  });

  await t.test('renders config id in monospace under name', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, /cfg-test-001/);
    assert.match(html, /cfg-test-002/);
  });

  await t.test('renders formatted updatedAt date', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, /2026-06-25/);
    assert.match(html, /2026-06-20/);
  });

  // ── 状态渲染 ──
  await t.test('renders "已启用" badge for enabled configs', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: [MOCK_CONFIGS[0]],
      deliveryMode: 'api',
    }));
    assert.match(html, /已启用/);
    // Tabs 组件始终渲染所有标签页,因此不用 doesNotMatch 校验
    // 检测 badge 独特的 aria hidden dot 前的配色来区分 badge 与 tab label
    assert.match(html, /rgba\(34,197,94,0\.15\).*?已启用/);
  });

  await t.test('renders "已禁用" badge for disabled configs', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: [MOCK_CONFIGS[2]],
      deliveryMode: 'api',
    }));
    assert.match(html, /已禁用/);
    // Tabs 组件始终渲染所有标签页,因此不用 doesNotMatch 校验
    assert.match(html, /rgba\(148,163,184,0\.10\).*?已禁用/);
  });

  // ── Fallback 降级横幅 ──
  await t.test('renders fallback banner when deliveryMode is fallback', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'fallback',
      error: 'NetworkError: fetch failed',
    }));
    assert.match(html, /⚠️/);
    assert.match(html, /后端不可达/);
    assert.match(html, /NetworkError/);
  });

  await t.test('does not render fallback banner when deliveryMode is api', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.doesNotMatch(html, /后端不可达/);
  });

  await t.test('renders custom fallback error message', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'fallback',
      error: 'timeout after 5000ms',
    }));
    assert.match(html, /timeout after 5000ms/);
  });

  // ── Tab 筛选器 ──
  await t.test('renders tabs with config counts', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, /全部/);
    assert.match(html, /已启用/);
    assert.match(html, /已禁用/);
    assert.match(html, /4/);
  });

  // ── 搜索框 ──
  await t.test('renders search input with placeholder', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.match(html, /搜索配置名、模型或工具/);
  });

  // ── 删除按钮 ──
  await t.test('renders delete button text', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    const deleteCount = (html.match(/删除/g) || []).length;
    assert.ok(deleteCount >= 4);
  });

  // ── 边界情况 ──
  await t.test('renders empty state when configs list is empty', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: [],
      deliveryMode: 'api',
    }));
    assert.ok(html.length > 0);
    assert.doesNotMatch(html, /客户服务 Agent/);
  });

  await t.test('renders single config without crash', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: [MOCK_CONFIGS[0]],
      deliveryMode: 'api',
    }));
    assert.match(html, /客户服务 Agent/);
    assert.doesNotMatch(html, /数据分析 Agent/);
  });

  await t.test('handles config with zero allowed tools', () => {
    const noToolConfig = createMockConfig({
      id: 'cfg-no-tool',
      name: '无工具配置',
      allowedTools: [],
    });
    const html = render(React.createElement(AgentConfigsClient, {
      configs: [noToolConfig],
      deliveryMode: 'api',
    }));
    assert.match(html, /0 个/);
    assert.match(html, /无工具配置/);
  });

  await t.test('handles config with large timeout value', () => {
    const longTimeoutConfig = createMockConfig({
      id: 'cfg-long-to',
      name: '长时间任务',
      timeoutMs: 300000,
    });
    const html = render(React.createElement(AgentConfigsClient, {
      configs: [longTimeoutConfig],
      deliveryMode: 'api',
    }));
    assert.match(html, /300s/);
  });

  await t.test('handles config with 0 maxSteps', () => {
    const zeroStepConfig = createMockConfig({
      id: 'cfg-zero',
      name: '零步配置',
      maxSteps: 0,
    });
    const html = render(React.createElement(AgentConfigsClient, {
      configs: [zeroStepConfig],
      deliveryMode: 'api',
    }));
    assert.match(html, />0</);
  });

  await t.test('renders config name with special characters', () => {
    const specialConfig = createMockConfig({
      id: 'cfg-special',
      name: 'AI Agent (测试/Dev) V2.0',
    });
    const html = render(React.createElement(AgentConfigsClient, {
      configs: [specialConfig],
      deliveryMode: 'api',
    }));
    assert.match(html, /AI Agent/);
    assert.match(html, /V2\.0/);
  });

  await t.test('fallback banner without error message gracefully', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'fallback',
    }));
    assert.match(html, /⚠️/);
    assert.match(html, /后端不可达/);
  });

  // ── 反例: 不存在的数据 ──
  await t.test('does not render non-existent config data', () => {
    const html = render(React.createElement(AgentConfigsClient, {
      configs: MOCK_CONFIGS,
      deliveryMode: 'api',
    }));
    assert.doesNotMatch(html, /不存在/);
    assert.doesNotMatch(html, /dummy/);
  });
});
