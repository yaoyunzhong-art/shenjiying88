/**
 * AI 模型切换器 - 基础渲染测试 (V9 需求 1 · V10 Day 1)
 *
 * Day 1 交付: 3 个冒烟测试, Day 2+ 补充更多用例
 *
 * 使用 node:test runner (node --test), 统一 node:test / node:assert 语法.
 * 使用 renderToStaticMarkup 而非 @testing-library/react (需要 jsdom).
 *
 * Mock 策略:
 *   通过 Module._resolveFilename hook 将 useAiModelPresets 重定向到
 *   useAiModelPresets.mock.ts, 避免 real react-query 调用.
 *   mock 模块导出一个可变的 mockState 对象, 测试直接修改其属性.
 */

import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';

// ============ Module Resolution Hook ============
// 必须在任何模块 require 之前安装

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

// ---- 加载 mock 模块 (获取 shared mockState) ----
const mockModule = require('./useAiModelPresets.mock');

// ---- 加载被测试组件 (内部 import 重定向到 mock) ----
const { AiModelSwitcher } = require('./AiModelSwitcher');

// ---- react-dom 静态渲染 (沿用项目中其他测试的绝对路径方式) ----
const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);

// ---- 恢复原始 resolve ----
Module._resolveFilename = origResolveFilename;

// ============ Test Data ============

const fakeConfigs = [
  {
    id: 'cfg-1',
    tenantId: 'tenant-1',
    storeId: 'store-001',
    configName: 'GPT-4o 通用',
    provider: 'openai',
    endpointUrl: 'https://api.openai.com/v1',
    apiKeyMasked: 'sk-****-****-abcd',
    contextWindow: 8192,
    temperature: 0.7,
    maxTokens: 2048,
    isCurrent: true,
    createdBy: 'admin',
    createdAt: '2026-06-28T00:00:00Z',
    updatedAt: '2026-06-28T00:00:00Z',
  },
  {
    id: 'cfg-2',
    tenantId: 'tenant-1',
    storeId: 'store-001',
    configName: 'Claude 3.5 游戏',
    provider: 'anthropic',
    endpointUrl: 'https://api.anthropic.com/v1',
    apiKeyMasked: 'sk-ant-****-****-efgh',
    contextWindow: 200000,
    temperature: 0.5,
    maxTokens: 4096,
    isCurrent: false,
    createdBy: 'admin',
    createdAt: '2026-06-27T00:00:00Z',
    updatedAt: '2026-06-27T00:00:00Z',
  },
];

// ============ Tests ============

describe('AiModelSwitcher (V10 Day 1)', () => {
  before(() => {
    // reset mocks to defaults
    mockModule.mockState.storeConfigsData = undefined;
    mockModule.mockState.storeConfigsIsLoading = false;
    mockModule.mockState.storeConfigsError = null;
    mockModule.mockState.switchMutateAsync = async () => ({
      config: { id: 'cfg-2' },
      latencyMs: 320,
      healthCheckOk: true,
    });
  });

  it('PC 端: 渲染门店配置列表与当前配置详情', () => {
    mockModule.mockState.storeConfigsData = fakeConfigs;
    mockModule.mockState.storeConfigsIsLoading = false;

    const html = renderToStaticMarkup(
      React.createElement(AiModelSwitcher, {
        storeId: 'store-001',
        currentConfigId: 'cfg-1',
        device: 'pc',
      }),
    );

    assert.ok(html.includes('AI 模型配置'), '应渲染标题');
    assert.ok(html.includes('sk-****-****-abcd'), '应显示脱敏 API Key');
    assert.ok(html.includes('温度 0.7'), '应显示温度参数');
    assert.ok(html.includes('查看历史版本'), '应显示历史版本按钮');
  });

  it('加载态: 显示 loading 占位文字', () => {
    mockModule.mockState.storeConfigsData = undefined;
    mockModule.mockState.storeConfigsIsLoading = true;

    const html = renderToStaticMarkup(
      React.createElement(AiModelSwitcher, {
        storeId: 'store-001',
        currentConfigId: 'cfg-1',
      }),
    );

    assert.ok(html.includes('加载中...'), '加载中应有占位文字');
  });

  it('小程序端: 使用卡片布局并渲染配置名', () => {
    mockModule.mockState.storeConfigsData = fakeConfigs;
    mockModule.mockState.storeConfigsIsLoading = false;

    const html = renderToStaticMarkup(
      React.createElement(AiModelSwitcher, {
        storeId: 'store-001',
        currentConfigId: 'cfg-1',
        device: 'miniapp',
      }),
    );

    assert.ok(html.includes('GPT-4o 通用'), '应渲染配置名');
    assert.ok(html.includes('Claude 3.5 游戏'), '应渲染所有配置');
    assert.ok(html.includes('AI 模型'), '应显示小程序标题');
    assert.ok(html.includes('✓ 当前生效'), '当前配置应有生效标识');
  });
});
