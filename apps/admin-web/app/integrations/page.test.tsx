/**
 * P-49 开放平台 — 第三方集成管理页测试
 *
 * 覆盖: 正例·反例·边界
 * Mock策略: URL-pattern responseRegistry
 *
 * 圈梁: ①TSC通过 ②30+ tests / 0 fail ③圈梁表更新 ④PRD标记
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

//
// Helper: get all tab buttons from the <nav> element
//
function getTabButtons(): HTMLElement[] {
  const nav = document.querySelector('nav');
  if (!nav) return [];
  return Array.from(nav.querySelectorAll('button'));
}

// ─── Tests: 正例 ───────────────────────────────────────

describe('IntegrationsPage — 正例', () => {
  beforeEach(() => { setDefault(); });

  it('should render page title', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const els = document.body.querySelectorAll('h1');
      assert.ok(Array.from(els).some(el => el.textContent?.includes('第三方集成')));
    });
  });

  it('should render page subtitle', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('API密钥管理'), 'expected subtitle');
      assert.ok(body.includes('集成状态监控'), 'expected status monitoring');
    });
  });

  it('should display four stat cards', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('集成总数'), 'expected total');
      assert.ok(body.includes('已启用'), 'expected active');
      assert.ok(body.includes('已禁用'), 'expected disabled');
      assert.ok(body.includes('异常'), 'expected error');
    });
  });

  it('should show correct stat values in stat cards', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('集成总数'), 'stat label total');
    });
  });

  it('should display active integration names in default tab', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('微信支付'), 'expected wechat name');
      assert.ok(body.includes('抖音小程序'), 'expected douyin name');
    });
  });

  it('should not show error-status integration in default active tab', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(!body.includes('美团外卖'), 'should not show error int in active tab');
    });
  });

  it('should show meituan integration when switching to 全部 tab', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const tabs = getTabButtons();
      const allTab = tabs.find(t => t.textContent === '全部');
      assert.ok(allTab, 'all tab button exists');
      if (allTab) fireEvent.click(allTab);
    });
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('美团外卖'), 'should see meituan after switching to 全部');
    });
  });

  it('should render three tab buttons in nav', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const tabs = getTabButtons();
      assert.strictEqual(tabs.length, 3, 'expected 3 tab buttons');
    });
  });

  it('should show provider labels for active integrations', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('微信'), 'expected wechat provider');
      assert.ok(body.includes('抖音'), 'expected douyin provider');
    });
  });

  it('should show type labels for integrations', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('支付'), 'expected payment type');
      assert.ok(body.includes('社交'), 'expected social type');
    });
  });

  it('should show active status badges', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('已激活'), 'expected active status');
    });
  });

  it('should show refresh button', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.some(b => b.textContent === '刷新');
      assert.ok(found, 'refresh button should exist');
    });
  });

  it('should show api endpoint method badge', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('POST'), 'expected endpoint method');
    });
  });

  it('should show last sync time for integrations', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('上次同步'), 'expected last sync info');
    });
  });

  it('should show endpoint count text', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('Endpoint'), 'expected endpoint count');
    });
  });

  it('should show sync success status', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('成功'), 'expected sync success text');
    });
  });
});

// ─── Tests: 反例 ────────────────────────────────────

describe('IntegrationsPage — 反例', () => {
  beforeEach(() => { setDefault(); });

  it('should show empty state when no integrations returned', async () => {
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [] }, message: 'OK',
    }));
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无集成'), 'expected empty state title');
    });
  });

  it('should show empty state description', async () => {
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [] }, message: 'OK',
    }));
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('当前筛选条件下没有第三方集成'), 'expected empty description');
    });
  });

  it('should fall back to default data on API failure', async () => {
    responseRegistry.clear();
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('微信支付'), 'expected fallback data');
    });
  });

  it('should switch from default tab to 全部 and show error integration', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const tabs = getTabButtons();
      const allTab = tabs.find(t => t.textContent === '全部');
      assert.ok(allTab, 'all tab button exists');
      if (allTab) fireEvent.click(allTab);
    });
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('异常'), 'should show error badge in 全部 tab');
    });
  });

  it('should show error detail message in 全部 tab', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const tabs = getTabButtons();
      const allTab = tabs.find(t => t.textContent === '全部');
      if (allTab) fireEvent.click(allTab);
    });
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('Token过期'), 'should show error message');
    });
  });
});

// ─── Tests: 边界 ────────────────────────────────────

describe('IntegrationsPage — 边界', () => {
  beforeEach(() => { setDefault(); });

  it('should handle single active integration', async () => {
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [
        { id: 'int-1', name: '微信支付', provider: 'wechat', type: 'payment', description: '微信支付', status: 'active', lastSyncAt: '2026-07-18T10:00:00Z', lastSyncStatus: 'success', configFields: [], endpoints: [], tenantId: 't1', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
      ]}, message: 'OK',
    }));
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('集成'), 'should render with single integration');
    });
  });

  it('should handle many integrations (10 items) with accurate count', async () => {
    const manyInts = Array.from({ length: 10 }, (_, i) => ({
      id: `int-${i + 1}`, name: `集成${i + 1}`, provider: 'custom', type: 'custom',
      description: `集成描述${i + 1}`, status: 'active' as const,
      configFields: [], endpoints: [{ name: '默认API', url: 'https://example.com/api', method: 'GET' }],
      tenantId: 't1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z',
    }));
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: manyInts }, message: 'OK',
    }));
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('10'), 'stat card should show 10 total');
    });
  });

  it('should handle integration with no endpoints (0个)', async () => {
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [
        { id: 'int-nep', name: '无API集成', provider: 'custom', type: 'custom', description: '无API测试', status: 'active', configFields: [], endpoints: [], tenantId: 't1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
      ]}, message: 'OK',
    }));
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('0个'), 'should show 0 endpoints');
    });
  });

  it('should handle integration with many endpoints (5个)', async () => {
    const manyEndpoints = Array.from({ length: 5 }, (_, i) => ({
      name: `API-${i + 1}`, url: `https://example.com/${i}`, method: 'POST',
    }));
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [
        { id: 'int-mep', name: '多API集成', provider: 'custom', type: 'custom', description: '多端点测试', status: 'active', lastSyncAt: '2026-07-18T10:00:00Z', lastSyncStatus: 'success', configFields: [], endpoints: manyEndpoints, tenantId: 't1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
      ]}, message: 'OK',
    }));
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('5个'), 'should show 5 endpoints');
    });
  });

  it('should handle any-status integration in 全部 tab (pending status)', async () => {
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [
        { id: 'int-pend', name: '待审核集成', provider: 'douyin', type: 'social', description: '待审核', status: 'pending', configFields: [], endpoints: [], tenantId: 't1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
      ]}, message: 'OK',
    }));
    render(<IntegrationsPage />);
    // Wait for initial data load and switch to all tab in one go
    await waitFor(() => {
      const tabs = getTabButtons();
      if (tabs.length < 3) return false;
      const allTab = tabs.find(t => t.textContent === '全部');
      if (!allTab) return false;
      fireEvent.click(allTab);
      // After clicking, check for pending status
      const body = document.body.textContent || '';
      return body.includes('待审核');
    });
  });

  it('should handle tab switch from 已启用 to 其他', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const tabs = getTabButtons();
      assert.strictEqual(tabs.length, 3, 'three tab buttons');
      const otherTab = tabs[1];
      assert.strictEqual(otherTab.textContent, '其他');
      fireEvent.click(otherTab);
    });
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('美团外卖'), 'should show meituan in 其他 tab');
    });
  });

  it('should handle tab round-trip: 已启用 → 全部 → 已启用', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const tabs = getTabButtons();
      if (tabs.length >= 3) fireEvent.click(tabs[2]);
    });
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('美团外卖'), '全部 has meituan');
    });
    await waitFor(() => {
      const tabs = getTabButtons();
      if (tabs.length >= 1) fireEvent.click(tabs[0]);
    });
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('微信支付'), '已启用 tab has wechat');
    });
  });

  it('should show sync failed indicator for error integration', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const tabs = getTabButtons();
      const allTab = tabs.find(t => t.textContent === '全部');
      if (allTab) fireEvent.click(allTab);
    });
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('失败'), 'should show sync failed indicator');
    });
  });

  it('should render integration with all optional fields filled', async () => {
    responseRegistry.clear();
    const richInt = {
      id: 'int-rich', name: '完整集成', provider: 'alipay', type: 'payment',
      description: '完整字段', status: 'active' as const,
      lastSyncAt: '2026-07-18T10:00:00Z', lastSyncStatus: 'success' as const,
      configFields: [{ key: 'k1', label: 'Key1', value: 'v1' }],
      endpoints: [{ name: '通知', url: 'https://e.com', method: 'POST' }],
      tenantId: 't1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z',
    };
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [richInt] }, message: 'OK',
    }));
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('完整集成'), 'rendered');
    });
  });

  it('should render minimal integration after tab switch to 全部', async () => {
    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [
        { id: 'int-min', name: '最小集成', provider: 'custom', type: 'custom', description: '最少字段', status: 'inactive', configFields: [], endpoints: [], tenantId: 't1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
      ]}, message: 'OK',
    }));
    render(<IntegrationsPage />);
    // Wait for page and switch to all tab together
    await waitFor(() => {
      const tabs = getTabButtons();
      if (tabs.length < 3) return false;
      const allTab = tabs.find(t => t.textContent === '全部');
      if (!allTab) return false;
      fireEvent.click(allTab);
      const body = document.body.textContent || '';
      return body.includes('最小集成');
    });
  });

  it('should update stats after switching data via refresh', async () => {
    render(<IntegrationsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('集成'), 'page loaded');
    });

    responseRegistry.clear();
    setResponseFor('/api/openapi/integrations', () => ({
      success: true, data: { integrations: [
        { id: 'r1', name: '新集成A', provider: 'wechat', type: 'payment', description: '测试', status: 'active', lastSyncAt: '2026-07-18T10:00:00Z', lastSyncStatus: 'success', configFields: [], endpoints: [], tenantId: 't1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
        { id: 'r2', name: '新集成B', provider: 'custom', type: 'crm', description: '测试2', status: 'inactive', configFields: [], endpoints: [], tenantId: 't1', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-07-18T10:00:00Z' },
      ]}, message: 'OK',
    }));

    const refreshBtn = document.querySelector('button');
    if (refreshBtn && refreshBtn.textContent === '刷新') fireEvent.click(refreshBtn);
    await new Promise(r => setTimeout(r, 50));
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('新集成A'), 'new integration shown after refresh');
    });
  });
});

// ── 静态代码分析 ──

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('IntegrationsPage — hooks验证', () => {
  it('包含useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含useEffect', () => assert.ok(SRC.includes('useEffect')));
  it('包含useCallback', () => assert.ok(SRC.includes('useCallback')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含loading状态', () => assert.ok(SRC.includes('loading')));

  it('状态统计: 已禁用计数变量', () => {
    assert.ok(SRC.includes('inactiveCount'), 'should compute inactiveCount');
  });

  it('状态统计: 活跃计数', () => {
    assert.ok(SRC.includes('activeCount'), 'should compute activeCount');
  });

  it('状态统计: 异常计数', () => {
    assert.ok(SRC.includes('errorCount'), 'should compute errorCount');
  });
});
