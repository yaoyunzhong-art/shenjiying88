/**
 * AIAgentToolCallPanel.test.tsx — AI 智能体工具调用面板测试
 *
 * 测试范围：
 *  - 正例：正常渲染、多种状态、完整数据、汇总信息
 *  - 反例：空数据、加载态
 *  - 边界：大量数据、嵌套层级、混合状态、自定义 testid
 *
 * 模式：使用 renderToStaticMarkup 进行无 DOM 组件渲染测试
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIAgentToolCallPanel } = require('./AIAgentToolCallPanel');

// ==================== 测试数据工厂 ====================

function createCall(overrides = {}) {
  return {
    id: `call-${Math.random().toString(36).slice(2, 8)}`,
    toolName: 'search_products',
    toolLabel: '商品搜索',
    toolIcon: '🔍',
    status: 'success',
    parameters: [{ name: 'keyword', value: '夏季连衣裙' }],
    resultSummary: '找到 15 件商品',
    startedAt: '2026-07-07T04:00:00Z',
    durationMs: 320,
    ...overrides,
  };
}

function createSubCalls(level = 1) {
  if (level <= 0) return [];
  const sub = createCall({
    id: `sub-${level}`,
    toolLabel: '数据库查询',
    toolName: 'db_query',
    toolIcon: '🗄️',
    status: 'success',
    parameters: [{ name: 'table', value: 'products' }, { name: 'limit', value: '20' }],
    resultSummary: '查询到 20 条记录',
    durationMs: 45,
  });
  if (level > 1) {
    sub.subCalls = createSubCalls(level - 1);
  }
  return [sub];
}

// ====================================================================
// 正例 (positive cases)
// ====================================================================

describe('AIAgentToolCallPanel: 正例', () => {
  it('应正确渲染面板默认标题', () => {
    const calls = [createCall()];
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls })
    );
    assert.match(html, /工具调用链/);
    assert.match(html, /🛠️/);
  });

  it('应渲染自定义标题', () => {
    const calls = [createCall()];
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls, title: '我的工具链' })
    );
    assert.match(html, /我的工具链/);
  });

  it('应正确渲染单个成功工具调用', () => {
    const call = createCall();
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call] })
    );
    assert.match(html, /商品搜索/);
    assert.match(html, /成功/);
    assert.match(html, /320ms/);
  });

  it('应渲染多种不同状态的工具调用', () => {
    const calls = [
      createCall({ id: 's1', status: 'success', toolLabel: '成功调用', durationMs: 150 }),
      createCall({ id: 'e1', status: 'error', toolLabel: '失败调用', durationMs: 2000, errorMessage: 'API 超时' }),
      createCall({ id: 'p1', status: 'pending', toolLabel: '等待调用', durationMs: 0 }),
      createCall({ id: 'r1', status: 'running', toolLabel: '执行中调用', durationMs: 450 }),
      createCall({ id: 't1', status: 'timeout', toolLabel: '超时调用', durationMs: 30000 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls })
    );
    assert.match(html, /成功调用/);
    assert.match(html, /失败调用/);
    assert.match(html, /等待调用/);
    assert.match(html, /执行中调用/);
    assert.match(html, /超时调用/);
    // 各状态标签
    assert.match(html, /成功/);
    assert.match(html, /失败/);
    assert.match(html, /等待中/);
    assert.match(html, /执行中/);
    assert.match(html, /超时/);
    // 耗时应可见
    assert.match(html, /150ms/);
    assert.match(html, /2.0s/);
    assert.match(html, /0ms/);
    assert.match(html, /450ms/);
    assert.match(html, /30.0s/);
  });

  it('应渲染完整参数、结果和错误详情（defaultExpanded）', () => {
    const call = createCall({
      id: 'full',
      parameters: [
        { name: 'keyword', value: '夏季连衣裙' },
        { name: 'category', value: 'clothing' },
      ],
      resultSummary: '找到 15 件商品，其中 8 件有库存',
    });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call], defaultExpanded: true })
    );
    assert.match(html, /keyword/);
    assert.match(html, /夏季连衣裙/);
    assert.match(html, /category/);
    assert.match(html, /找到 15 件商品/);
  });

  it('应渲染错误信息', () => {
    const call = createCall({
      status: 'error',
      errorMessage: 'Rate limit exceeded: 100 requests per minute',
      durationMs: 5230,
    });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call], defaultExpanded: true })
    );
    assert.match(html, /Rate limit exceeded/);
    assert.match(html, /5.2s/);
  });

  it('应显示全部成功的汇总', () => {
    const calls = [
      createCall({ id: 'a', status: 'success' }),
      createCall({ id: 'b', status: 'success' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls })
    );
    assert.match(html, /全部 2 个工具调用成功/);
  });

  it('应显示有异常的汇总', () => {
    const calls = [
      createCall({ id: 'a', status: 'success' }),
      createCall({ id: 'b', status: 'error' }),
      createCall({ id: 'c', status: 'timeout' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls })
    );
    assert.match(html, /1\/3 成功/);
    assert.match(html, /2 异常/);
  });

  it('应渲染紧凑模式', () => {
    const calls = [createCall()];
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls, compact: true })
    );
    assert.match(html, /商品搜索/);
  });

  it('格式化耗时 - 毫秒', () => {
    const call = createCall({ durationMs: 500 });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call] })
    );
    assert.match(html, /500ms/);
  });

  it('格式化耗时 - 秒', () => {
    const call = createCall({ durationMs: 2500 });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call] })
    );
    assert.match(html, /2.5s/);
  });

  it('格式化耗时 - 分秒', () => {
    const call = createCall({ durationMs: 125000 });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call] })
    );
    assert.match(html, /2m/);
    assert.match(html, /5s/);
  });

  it('应支持嵌套子调用并展开', () => {
    const sub = createSubCalls(1);
    const call = createCall({ id: 'parent', subCalls: sub });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call], defaultExpanded: true })
    );
    assert.match(html, /数据库查询/);
  });

  it('应渲染自定义 data-testid', () => {
    const calls = [createCall()];
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls, 'data-testid': 'custom-tool-panel' })
    );
    assert.match(html, /custom-tool-panel/);
  });
});

// ====================================================================
// 反例 (negative cases)
// ====================================================================

describe('AIAgentToolCallPanel: 反例', () => {
  it('空数据时应显示空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [] })
    );
    assert.match(html, /暂无工具调用记录/);
  });

  it('空数据时应支持自定义空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [], emptyText: '没有数据' })
    );
    assert.match(html, /没有数据/);
  });

  it('加载态不应显示空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [], loading: true, emptyText: '暂无数据' })
    );
    assert.match(html, /加载中/);
    assert.ok(!html.includes('暂无数据'), '加载态不应包含空文案');
  });
});

// ====================================================================
// 边界 (boundary cases)
// ====================================================================

describe('AIAgentToolCallPanel: 边界', () => {
  it('大量工具调用不应报错', () => {
    const calls = Array.from({ length: 50 }, (_, i) =>
      createCall({ id: `bulk-${i}`, status: i % 3 === 0 ? 'error' : 'success' }),
    );
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls })
    );
    assert.ok(html.length > 100, '大量数据应渲染出内容');
  });

  it('深度嵌套调用链应正常渲染', () => {
    const deepSub = createCall({ id: 'level-4', toolLabel: '最底层查询' });
    const midSub = createCall({ id: 'level-2', toolLabel: '中层聚合', subCalls: [deepSub] });
    const root = createCall({ id: 'level-1', toolLabel: '顶层编排', subCalls: [midSub] });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [root], defaultExpanded: true })
    );
    assert.match(html, /顶层编排/);
    assert.match(html, /中层聚合/);
    assert.match(html, /最底层查询/);
  });

  it('混合状态调用链汇总正确', () => {
    const calls = [
      createCall({ id: 'm1', status: 'success' }),
      createCall({ id: 'm2', status: 'pending' }),
      createCall({ id: 'm3', status: 'running' }),
      createCall({ id: 'm4', status: 'error', errorMessage: '网络错误' }),
      createCall({ id: 'm5', status: 'timeout' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls })
    );
    assert.match(html, /1\/5 成功/);
    assert.match(html, /2 异常/);
  });

  it('空参数列表不应渲染参数区域', () => {
    const call = createCall({ parameters: [] });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call], defaultExpanded: true })
    );
    // 不应有参数标签
    assert.ok(!html.includes('参数'), '空参数时不显示参数');
  });

  it('空 resultSummary 不应显示结果区域', () => {
    const call = createCall({ resultSummary: undefined });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call], defaultExpanded: true })
    );
    assert.ok(!html.includes('结果'), '无结果时不显示结果区域');
  });

  it('零耗时显示正确', () => {
    const call = createCall({ durationMs: 0 });
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call] })
    );
    assert.match(html, /0ms/);
  });

  it('超长参数值在展开后应渲染（组件逻辑截断展示）', () => {
    const longValue = 'A'.repeat(100);
    const call = createCall({
      parameters: [{ name: 'longParam', value: longValue }],
    });
    // 即使展开，值在渲染中被截断展示，但仍应渲染出参数名
    const html = renderToStaticMarkup(
      React.createElement(AIAgentToolCallPanel, { calls: [call], defaultExpanded: true })
    );
    assert.match(html, /longParam/);
  });
});
