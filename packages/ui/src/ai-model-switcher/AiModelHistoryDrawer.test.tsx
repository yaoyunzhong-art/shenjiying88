/**
 * AI 模型配置 - 历史版本抽屉组件测试 (V10 Day 6)
 *
 * 使用 node:test runner (node --test), 统一 node:test / node:assert 语法.
 * 使用 renderToStaticMarkup 避免 jsdom.
 *
 * Mock 策略:
 *   通过 Module._resolveFilename hook 将 useAiModelPresets 重定向到
 *   useAiModelPresets.mock.ts.
 */

import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';

// ============ Module Resolution Hook ============
const Module = require('module');
const origResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (
  request: string,
  parent: { filename?: string; paths?: string[] },
  isMain?: boolean,
  options?: Record<string, unknown>,
) {
  if (
    (request === './useAiModelPresets' || request === './useAiModelPresets.js') &&
    parent?.filename?.includes('ai-model-switcher')
  ) {
    return origResolveFilename.call(
      Module,
      './useAiModelPresets.mock',
      parent,
      isMain,
      options,
    );
  }
  return origResolveFilename.call(Module, request, parent, isMain, options);
};

// ---- 加载依赖 ----
const React = require('react');

// ---- 加载 mock 模块 ----
const mockModule = require('./useAiModelPresets.mock');

// ---- 加载被测试组件 ----
const { AiModelHistoryDrawer } = require('./AiModelHistoryDrawer');

// ---- react-dom 静态渲染 ----
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);

// ---- 恢复原始 resolve ----
Module._resolveFilename = origResolveFilename;

// ============ Fake History Data ============

const fakeHistory = [
  {
    id: 'hist-1',
    configId: 'cfg-1',
    versionNumber: 3,
    changeType: 'update' as const,
    changedBy: 'admin',
    changedAt: '2026-06-28T10:00:00Z',
    reason: '因业务需求调整参数',
    configSnapshot: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  },
  {
    id: 'hist-2',
    configId: 'cfg-1',
    versionNumber: 2,
    changeType: 'rollback' as const,
    changedBy: 'manager',
    changedAt: '2026-06-27T14:30:00Z',
    reason: '新参数导致响应异常,回滚至稳定版本',
    configSnapshot: {
      temperature: 0.5,
      maxTokens: 4096,
    },
  },
  {
    id: 'hist-3',
    configId: 'cfg-1',
    versionNumber: 1,
    changeType: 'create' as const,
    changedBy: 'superadmin',
    changedAt: '2026-06-26T08:00:00Z',
    reason: '初始化门店 AI 模型配置',
    configSnapshot: {
      temperature: 0.5,
      maxTokens: 4096,
    },
  },
  {
    id: 'hist-4',
    configId: 'cfg-1',
    versionNumber: 1,
    changeType: 'activate' as const,
    changedBy: 'system',
    changedAt: '2026-06-26T08:05:00Z',
    reason: '配置创建后自动激活',
    configSnapshot: {
      temperature: 0.5,
      maxTokens: 4096,
    },
  },
];

// ============ Tests ============

describe('AiModelHistoryDrawer (V10 Day 6)', () => {
  const baseProps = {
    configId: 'cfg-1',
    storeId: 'store-001',
    open: true,
    onClose: () => undefined,
  };

  before(() => {
    // Reset mock state
    mockModule.mockState.historyData = undefined;
    mockModule.mockState.historyIsLoading = false;
    mockModule.mockState.historyError = null;
    mockModule.mockState.rollbackMutateAsync = async () => ({
      config: { id: 'cfg-2' } as any,
      latencyMs: 280,
      healthCheckOk: true,
    });
  });

  it('PC 端: 渲染历史版本列表 (含三种变更类型)', () => {
    mockModule.mockState.historyData = fakeHistory;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
        device: 'pc',
      }),
    );

    assert.ok(html.includes('历史版本'), '应渲染标题');
    assert.ok(html.includes('更新'), '应渲染更新变更类型标签');
    assert.ok(html.includes('回滚'), '应渲染回滚变更类型标签');
    assert.ok(html.includes('创建'), '应渲染创建变更类型标签');
    assert.ok(html.includes('激活'), '应渲染激活变更类型标签');
    assert.ok(html.includes('admin'), '应显示变更人');
    assert.ok(html.includes('manager'), '应显示变更人');
    assert.ok(html.includes('回滚到此版本'), '应显示回滚按钮');
  });

  it('PC 端: create 和 activate 类型不应显示回滚按钮', () => {
    mockModule.mockState.historyData = fakeHistory;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
      }),
    );

    // 有 4 条历史,其中 create 和 activate 类型不应有回滚按钮
    // 但有 2 条有回滚按钮 (update 和 rollback)
    const rollbackBtnMatches = html.match(/回滚到此版本/g);
    assert.equal(rollbackBtnMatches?.length, 2, '只有 update 和 rollback 类型显示回滚按钮');
  });

  it('加载态: 显示 loading 状态', () => {
    mockModule.mockState.historyData = undefined;
    mockModule.mockState.historyIsLoading = true;
    mockModule.mockState.historyError = null;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
      }),
    );

    assert.ok(html.includes('加载中...'), '加载态应有占位文字');
  });

  it('错误态: 显示错误信息', () => {
    mockModule.mockState.historyData = undefined;
    mockModule.mockState.historyIsLoading = false;
    mockModule.mockState.historyError = new Error('网络异常,请重试');

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
      }),
    );

    assert.ok(html.includes('加载失败'), '错误态应有错误提示');
    assert.ok(html.includes('网络异常'), '错误态应显示具体错误信息');
  });

  it('空数据: 显示空状态提示', () => {
    mockModule.mockState.historyData = [];
    mockModule.mockState.historyIsLoading = false;
    mockModule.mockState.historyError = null;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
      }),
    );

    assert.ok(html.includes('暂无历史版本'), '空数据显示提示');
  });

  it('小程序端: 渲染简化版全屏列表', () => {
    mockModule.mockState.historyData = fakeHistory;
    mockModule.mockState.historyIsLoading = false;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
        device: 'miniapp',
      }),
    );

    assert.ok(html.includes('历史版本 (4)'), '小程序应显示版本计数');
    assert.ok(html.includes('admin'), '小程序应显示变更人');
    assert.notEqual(html.includes('回滚到此版本'), false, '小程序也显示回滚按钮');
  });

  it('Close 按钮渲染 (PC 端通过 Modal, 小程序有 ✕ 按钮)', () => {
    mockModule.mockState.historyData = fakeHistory;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
        device: 'miniapp',
      }),
    );

    assert.ok(html.includes('✕'), '小程序端应有关闭按钮');
  });

  it('版本号和变更时间格式化正确', () => {
    mockModule.mockState.historyData = fakeHistory;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
      }),
    );

    assert.ok(html.includes('v3'), '应显示最新版本号 v3');
    assert.ok(html.includes('v2'), '应显示版本号 v2');
    assert.ok(html.includes('v1'), '应显示版本号 v1');
    assert.ok(html.includes('2026/'), '应显示格式化后的日期');
  });

  it('关闭时: open=false 不应渲染内容 (PC)', () => {
    mockModule.mockState.historyData = fakeHistory;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
        open: false,
      }),
    );

    assert.equal(html, '', 'open=false 时不应渲染任何 DOM 内容');
  });

  it('关闭时: open=false 不应渲染内容 (小程序)', () => {
    mockModule.mockState.historyData = fakeHistory;

    const html = renderToStaticMarkup(
      React.createElement(AiModelHistoryDrawer, {
        ...baseProps,
        open: false,
        device: 'miniapp',
      }),
    );

    assert.equal(html, '', '小程序端 open=false 也不应渲染');
  });
});
