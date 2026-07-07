/**
 * LicenseGate 组件测试
 *
 * 覆盖:
 * 1. 加载态 — 显示"授权校验中..."
 * 2. 错误态 — 显示错误信息
 * 3. 未授权 + 默认升级提示 — 显示 upgrade 按钮与 scope title
 * 4. 未授权 + 自定义 fallback
 * 5. 已授权 — 渲染 children
 * 6. 试用期剩余天数展示
 * 7. 试用期已结束
 * 8. 配额已用完
 * 9. h5 适配样式
 * 10. 自定义 fallback 优先级高于默认
 */

import React from 'react';
const assert = require('node:assert/strict');
const { describe, test, before } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

// ==================== mock 辅助 ====================

let mockState = { data: null, isLoading: true, error: null };

/**
 * 替换 useLicenseCheck hook 实现，避免依赖 @tanstack/react-query
 */
function setupMock() {
  const hookPath = require.resolve('./useLicenseCheck');
  delete require.cache[hookPath];

  const modPath = require.resolve('./LicenseGate');
  delete require.cache[modPath];

  // 注入 mock hook 到 require.cache
  require.cache[hookPath] = {
    id: hookPath,
    filename: hookPath,
    loaded: true,
    exports: {
      useLicenseCheck() {
        return mockState;
      },
    },
  };
}

function resetMock() {
  mockState = { data: null, isLoading: true, error: null };
}

// ==================== 测试 ====================

describe('LicenseGate', () => {
  let LicenseGate;

  before(() => {
    setupMock();
    LicenseGate = require('./LicenseGate').LicenseGate;
  });

  test('1. loading state shows spinner text', () => {
    resetMock();
    mockState.isLoading = true;
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.capability',
        children: React.createElement('div', null, '已授权内容'),
      })
    );
    assert.match(html, /授权校验中/);
    assert.match(html, /data-license-gate="loading"/);
    // 未授权内容不应出现
    assert.doesNotMatch(html, /已授权内容/);
  });

  test('2. error state shows error message', () => {
    resetMock();
    mockState.isLoading = false;
    mockState.error = new Error('网络异常');
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.capability',
        children: React.createElement('div', null, '已授权内容'),
      })
    );
    assert.match(html, /授权校验失败/);
    assert.match(html, /网络异常/);
    assert.match(html, /data-license-gate="error"/);
    assert.doesNotMatch(html, /已授权内容/);
  });

  test('3. denied state shows upgrade prompt with scope title', () => {
    resetMock();
    mockState.isLoading = false;
    mockState.data = { allowed: false, reason: '未购买该模块' };
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.capability',
        children: React.createElement('div', null, '已授权内容'),
      })
    );
    assert.match(html, /AI 能力未授权/);
    assert.match(html, /未购买该模块/);
    assert.match(html, /立即升级/);
    assert.match(html, /data-license-gate="denied"/);
    assert.doesNotMatch(html, /已授权内容/);
  });

  test('4. denied state — custom fallback replaces default upgrade prompt', () => {
    resetMock();
    mockState.isLoading = false;
    mockState.data = { allowed: false };
    const customFallback = React.createElement('div', {
      'data-testid': 'custom-fallback',
    }, '请联系管理员开通');
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.knowledge',
        fallback: customFallback,
        children: React.createElement('div', null, '已授权内容'),
      })
    );
    assert.match(html, /请联系管理员开通/);
    assert.doesNotMatch(html, /知识库容量不足/); // 不应渲染默认提示
    assert.doesNotMatch(html, /立即升级/);
  });

  test('5. allowed state renders children', () => {
    resetMock();
    mockState.isLoading = false;
    mockState.data = { allowed: true };
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.capability',
        children: React.createElement('div', null, '已授权内容'),
      })
    );
    assert.match(html, /已授权内容/);
    assert.doesNotMatch(html, /授权校验中/);
    assert.doesNotMatch(html, /授权校验失败/);
  });

  test('6. upgrade prompt shows trial days remaining', () => {
    resetMock();
    mockState.isLoading = false;
    mockState.data = {
      allowed: false,
      reason: '试用中',
      trialDaysRemaining: 5,
    };
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.capability',
        children: null,
      })
    );
    assert.match(html, /试用剩余 5 天/);
    assert.doesNotMatch(html, /试用期已结束/);
  });

  test('7. upgrade prompt shows trial expired', () => {
    resetMock();
    mockState.isLoading = false;
    mockState.data = {
      allowed: false,
      reason: '试用期结束',
      trialDaysRemaining: 0,
    };
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.capability',
        children: null,
      })
    );
    assert.match(html, /试用期已结束/);
  });

  test('8. upgrade prompt shows quota exhausted', () => {
    resetMock();
    mockState.isLoading = false;
    mockState.data = {
      allowed: false,
      reason: '配额不足',
      quotaRemaining: 0,
    };
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.capability',
        children: null,
      })
    );
    assert.match(html, /配额已用完/);
  });

  test('9. integration.open scope shows correct title', () => {
    resetMock();
    mockState.isLoading = false;
    mockState.data = { allowed: false, reason: '未授权' };
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'integration.open',
        children: null,
      })
    );
    assert.match(html, /多系统对接未授权/);
  });

  test('10. h5 device uses smaller padding', () => {
    resetMock();
    mockState.isLoading = true;
    const html = renderToStaticMarkup(
      React.createElement(LicenseGate, {
        scope: 'ai.capability',
        device: 'h5',
        children: null,
      })
    );
    assert.match(html, /padding:\s*16px/);
  });
});
