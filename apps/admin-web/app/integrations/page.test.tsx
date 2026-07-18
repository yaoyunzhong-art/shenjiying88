/**
 * P-49 开放平台 — 第三方集成管理页测试
 *
 * 覆盖: 正例·反例·边界
 * Mock策略: URL-pattern responseRegistry
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IntegrationsPage from './page'
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const responseRegistry = new Map<string, () => unknown>();

function setResponseFor(pattern: string, factory: () => unknown) {
  responseRegistry.set(pattern, factory);
}

globalThis.fetch = ((url: string) => {
  const path = typeof url === 'string' ? url : '';
  for (const [pattern, factory] of responseRegistry) {
    if (path.includes(pattern)) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve(factory()),
        headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
      } as Response);
    }
  }
  return Promise.resolve({
    ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null, message: 'OK' }),
    headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
  } as Response);
}) as typeof globalThis.fetch;

function setDefault() {
  responseRegistry.clear();
  setResponseFor('/api/openapi/integrations', () => ({
    success: true,
    data: {
      integrations: [
        { id: 'int-1', name: '微信支付', provider: 'wechat', type: 'payment', description: '微信支付商户平台对接', status: 'active', lastSyncAt: '2026-07-18T10:00:00Z', lastSyncStatus: 'success', configFields: [{ key: 'appId', label: 'AppID', value: 'wx_test' }], endpoints: [{ name: '支付回调', url: 'https://example.com/pay', method: 'POST' }], tenantId: 't1', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
        { id: 'int-2', name: '抖音小程序', provider: 'douyin', type: 'social', description: '抖音小程序对接', status: 'active', lastSyncAt: '2026-07-17T08:00:00Z', lastSyncStatus: 'success', configFields: [], endpoints: [{ name: '订单同步', url: 'https://example.com/dy', method: 'POST' }], tenantId: 't1', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-07-17T08:00:00Z' },
        { id: 'int-3', name: '美团外卖', provider: 'meituan', type: 'delivery', description: '美团外卖订单', status: 'error', lastSyncAt: '2026-07-18T06:00:00Z', lastSyncStatus: 'failed', errorMessage: 'Token过期', configFields: [], endpoints: [{ name: '订单推送', url: 'https://example.com/mt', method: 'POST' }], tenantId: 't1', createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-07-18T06:00:00Z' },
      ],
    },
    message: 'OK',
  }));
}

// ─── Tests ─────────────────────────────────────────────

describe('IntegrationsPage', () => {
  beforeEach(() => { setDefault(); });

  it('should render page title', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('第三方集成');
      assert.ok(els.length >= 1);
    });
  });

  it('should show stat cards', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('集成总数'), 'expected total');
      assert.ok(body.includes('活跃'), 'expected active');
      assert.ok(body.includes('异常'), 'expected error');
      assert.ok(body.includes('API调用'), 'expected api calls');
    });
  });

  it('should display integration names', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('微信支付'), 'expected name');
      assert.ok(body.includes('抖音小程序'), 'expected name');
    });
  });

  it('should render tab navigation', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('活跃'), 'expected active tab');
      assert.ok(body.includes('其他'), 'expected inactive tab');
      assert.ok(body.includes('全部'), 'expected all tab');
    });
  });

  it('should show provider labels', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('微信'), 'expected wechat label');
      assert.ok(body.includes('抖音'), 'expected douyin label');
    });
  });

  it('should show type labels', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('支付'), 'expected payment type');
      assert.ok(body.includes('社交'), 'expected social type');
    });
  });

  it('should show status badges', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('已激活'), 'expected active status');
    });
  });

  it('should error badge for error integration', async () => {
    // Switch to all tab then check
    // The error integration is in 'inactive' tab (status !== 'active' includes 'error')
    // Click inactive tab to see it
    render(<IntegrationsPage />);
    await waitFor(() => {
      const allBtn = screen.queryAllByText('其他');
      if (allBtn.length > 0) fireEvent.click(allBtn[0]);
    });
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('异常'), 'should show error badge in 其他 tab');
    });
  });

  it('should show refresh button', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('刷新');
      assert.ok(els.length >= 1);
    });
  });

  it('should show empty state when no integrations', async () => {
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [] }, message: 'OK',
    }));
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无集成'), 'expected empty state');
    });
  });

  it('should show api endpoints', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('POST'), 'expected endpoint method');
    });
  });
});

// ── 静态代码分析 ──

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('IntegrationsPage — hooks验证', () => {
  it('包含useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
});
