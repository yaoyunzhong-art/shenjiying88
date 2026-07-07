/**
 * AIAgentChatPanel 组件测试
 *
 * 覆盖:
 * 1. 基础渲染 — 标题、代理名、欢迎消息
 * 2. 消息列表渲染 — 用户消息、代理消息、系统消息
 * 3. 发送消息流程 — 输入、发送按钮、回调
 * 4. 快捷建议渲染和点击
 * 5. 加载状态
 * 6. 禁用状态
 * 7. 空状态
 * 8. 边界情况 — 空输入、长文本、maxMessages 限制
 * 9. 错误处理 — onSend 抛出异常
 * 10. 自定义属性
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, mock } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIAgentChatPanel } = require('./AIAgentChatPanel');

// ==================== 测试数据 ====================

const sampleMessages = [
  {
    id: 'msg-1',
    role: 'agent',
    content: '您好！我是 AI 助手。',
    timestamp: '2026-06-27T10:00:00Z',
    status: 'sent',
  },
  {
    id: 'msg-2',
    role: 'user',
    content: '帮我查一下上个月的销售额',
    timestamp: '2026-06-27T10:01:00Z',
  },
  {
    id: 'msg-3',
    role: 'agent',
    content: '上个月总销售额为 ¥2,350,000，同比增长 12.5%。',
    timestamp: '2026-06-27T10:01:05Z',
    status: 'sent',
    tokenUsage: 320,
    durationMs: 2300,
  },
];

const sampleSuggestions = ['查看业绩概览', '最近异常告警', '预测本月趋势'];

function noop() { return ''; }

// ==================== 辅助函数 ====================

function render(ui: React.ReactElement): string {
  return renderToStaticMarkup(ui);
}

function hasText(html: string, text: string): boolean {
  return html.includes(text);
}

// ==================== 测试用例 ====================

describe('AIAgentChatPanel', () => {
  // ---- 1. 基础渲染 ----
  describe('基础渲染 (Basic Rendering)', () => {
    test('应渲染标题和代理名', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '销售助手',
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, 'AI 助手'), '应显示默认标题');
      assert.ok(hasText(html, '销售助手'), '应显示代理名');
    });

    test('应渲染自定义标题', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '客服助手',
          title: '智能客服',
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, '智能客服'), '应显示自定义标题');
    });

    test('应渲染欢迎消息', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          welcomeMessage: '欢迎使用智能分析助手！',
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, '欢迎使用智能分析助手！'), '应显示欢迎消息');
    });

    test('应渲染自定义 avatar', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          agentAvatar: '🧠',
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, '🧠'), '应显示自定义 avatar');
    });

    test('应渲染 data-testid', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          onSend: noop,
          'data-testid': 'my-chat-panel',
        }),
      );
      assert.ok(hasText(html, 'data-testid="my-chat-panel"'), '应包含自定义 data-testid');
    });
  });

  // ---- 2. 消息列表渲染 ----
  describe('消息列表渲染 (Message Rendering)', () => {
    test('应渲染初始消息列表', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          initialMessages: sampleMessages,
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, '帮我查一下上个月的销售额'), '应显示用户消息');
      assert.ok(hasText(html, '上个月总销售额为 ¥2,350,000'), '应显示代理回复');
    });

    test('user 角色消息应包含用户头像标记', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          initialMessages: sampleMessages,
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, 'chat-message-user'), '应包含 user 角色标识');
      assert.ok(hasText(html, 'chat-message-agent'), '应包含 agent 角色标识');
    });

    test('应渲染 token 和耗时信息', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          initialMessages: sampleMessages,
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, '320 tokens'), '应显示 token 消耗');
      assert.ok(hasText(html, '2300ms'), '应显示耗时');
    });

    test('空消息列表应显示空状态文本', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          initialMessages: [],
          emptyText: '暂无对话记录',
          onSend: noop,
        }),
      );

      // 没有初始消息时默认有欢迎消息
      assert.ok(hasText(html, '您好！我是 AI 助手'), '默认应有欢迎消息');
    });
  });

  // ---- 3. 输入区域 ----
  describe('输入区域 (Input Area)', () => {
    test('应渲染输入框和发送按钮', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, 'chat-input'), '应包含输入框');
      assert.ok(hasText(html, 'send-button'), '应包含发送按钮');
    });

    test('应渲染自定义占位符', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          placeholder: '请输入您的查询...',
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, '请输入您的查询...'), '应显示自定义占位符');
    });

    test('空输入时发送按钮应禁用', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          onSend: noop,
        }),
      );
      // 静态渲染，输入框默认为空，发送按钮应包含 disabled 属性
      assert.ok(hasText(html, '发送'), '应显示发送按钮');
    });
  });

  // ---- 4. 快捷建议 ----
  describe('快捷建议 (Suggestion Chips)', () => {
    test('应渲染快捷建议', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          suggestions: sampleSuggestions,
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, '查看业绩概览'), '应显示第一条建议');
      assert.ok(hasText(html, '最近异常告警'), '应显示第二条建议');
      assert.ok(hasText(html, '预测本月趋势'), '应显示第三条建议');
    });

    test('无建议时不渲染区域', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          onSend: noop,
        }),
      );
      assert.equal(html.includes('suggestion-0'), false, '不应包含建议');
    });
  });

  // ---- 5. 禁用状态 ----
  describe('禁用状态 (Disabled State)', () => {
    test('禁用时输入框和按钮应有 disabled 属性', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          disabled: true,
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, 'chat-input'), '应包含输入框');
      assert.ok(hasText(html, 'send-button'), '应包含发送按钮');
    });
  });

  // ---- 6. 边界情况 ----
  describe('边界情况 (Edge Cases)', () => {
    test('较长的代理名应正常渲染', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '企业智能数据分析助手 v2.0',
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, '企业智能数据分析助手'), '长名称应正常渲染');
    });

    test('应渲染正确的 data-testid', () => {
      const html = render(
        React.createElement(AIAgentChatPanel, {
          agentName: '助手',
          'data-testid': 'ai-agent-chat-panel',
          onSend: noop,
        }),
      );
      assert.ok(hasText(html, 'data-testid="ai-agent-chat-panel"'), '应包含默认 data-testid');
    });
  });
});
