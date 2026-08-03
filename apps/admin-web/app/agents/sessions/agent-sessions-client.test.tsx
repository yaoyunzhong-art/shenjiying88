import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AgentSession } from '@m5/types';
import AgentSessionsClient from './agent-sessions-client';

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

function createSession(overrides: Partial<AgentSession> = {}): AgentSession {
  return {
    id: 'sess-001',
    configId: 'cfg-order',
    status: 'RUNNING',
    userInput: '查询订单 ORD-001 状态',
    currentStep: 2,
    maxSteps: 5,
    createdAt: '2026-07-26T12:00:00.000Z',
    finalOutput: undefined,
    error: undefined,
    ...overrides
  };
}

const MOCK_SESSIONS: AgentSession[] = [
  createSession(),
  createSession({
    id: 'sess-002',
    configId: 'cfg-refund',
    status: 'COMPLETED',
    currentStep: 4,
    maxSteps: 4,
    createdAt: '2026-07-26T12:03:00.000Z',
    finalOutput: '退款流程已完成'
  }),
  createSession({
    id: 'sess-003',
    configId: 'cfg-risk',
    status: 'FAILED',
    currentStep: 1,
    maxSteps: 3,
    createdAt: '2026-07-26T11:58:00.000Z',
    error: 'tool timeout'
  })
];

test('AgentSessionsClient', async (t) => {
  await t.test('renders session table shell and status tabs', () => {
    const html = render(
      React.createElement(AgentSessionsClient, {
        sessions: MOCK_SESSIONS,
        deliveryMode: 'api'
      })
    );
    assert.match(html, /会话 ID/);
    assert.match(html, /使用配置/);
    assert.match(html, /最终输出/);
    // Tabs mock 渲染为 "label (count)" 格式
    assert.match(html, /全部/);
    assert.match(html, /全部\s*\(3\)/);
    assert.match(html, /运行中/);
    assert.match(html, /已完成/);
    assert.match(html, /失败/);
  });

  await t.test('renders source evidence banner', () => {
    const html = render(
      React.createElement(AgentSessionsClient, {
        sessions: MOCK_SESSIONS,
        deliveryMode: 'api'
      })
    );
    assert.match(html, /Delivery api/);
    assert.match(html, /控制面来源/);
    assert.match(html, /业务数据/);
    assert.match(html, /刷新路径/);
    assert.match(html, /latestCreatedAt/);
    assert.match(html, /loadAgentSessions/);
  });

  await t.test('renders fallback banner and fallback source evidence', () => {
    const html = render(
      React.createElement(AgentSessionsClient, {
        sessions: MOCK_SESSIONS,
        deliveryMode: 'fallback',
        error: 'NetworkError: fetch failed'
      })
    );
    assert.match(html, /后端不可达/);
    assert.match(html, /NetworkError: fetch failed/);
    assert.match(html, /Delivery fallback/);
    assert.match(html, /FALLBACK_AGENT_SESSIONS \+ FALLBACK_AGENT_STATS/);
  });

  await t.test('renders empty state table without crashing', () => {
    const html = render(
      React.createElement(AgentSessionsClient, {
        sessions: [],
        deliveryMode: 'api'
      })
    );
    assert.ok(html.length > 0);
    assert.match(html, /Delivery api/);
    assert.match(html, /latestCreatedAt: —/);
  });
});
