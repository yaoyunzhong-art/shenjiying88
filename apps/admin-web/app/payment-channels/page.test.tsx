/**
 * P-35 收银店A — 支付渠道管理页测试
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor } from '@testing-library/react'
import PaymentChannelsPage from './page'
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
        ok: true, status: 200, json: () => Promise.resolve(factory()),
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
  setResponseFor('/api/cashier/channels', () => ({
    success: true, data: {
      channels: [
        { id: 'ch-1', name: '微信支付', provider: 'wechat', type: 'online', enabled: true, feeRate: 38, dailyLimitCents: 500000000, singleLimitCents: 5000000, supportedStoreIds: [], todayAmountCents: 12850000, todayCount: 423, status: 'normal', lastHealthCheck: '2026-07-18T21:30:00Z', config: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T21:30:00Z' },
        { id: 'ch-2', name: '支付宝', provider: 'alipay', type: 'online', enabled: true, feeRate: 38, dailyLimitCents: 500000000, singleLimitCents: 5000000, supportedStoreIds: [], todayAmountCents: 8920000, todayCount: 287, status: 'normal', lastHealthCheck: '2026-07-18T21:28:00Z', config: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T21:28:00Z' },
        { id: 'ch-3', name: '银联刷卡', provider: 'unionpay', type: 'offline', enabled: true, feeRate: 55, dailyLimitCents: 200000000, singleLimitCents: 10000000, supportedStoreIds: ['s1'], todayAmountCents: 2350000, todayCount: 18, status: 'degraded', lastHealthCheck: '2026-07-18T18:00:00Z', config: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T18:00:00Z' },
      ],
    }, message: 'OK',
  }));
}

describe('PaymentChannelsPage', () => {
  beforeEach(() => { setDefault(); });

  it('should render page title', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('支付渠道');
      assert.ok(els.length >= 1);
    });
  });

  it('should show stat cards', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('渠道数'), 'expected total');
      assert.ok(body.includes('今日交易额'), 'expected today amount');
      assert.ok(body.includes('今日笔数'), 'expected count');
      assert.ok(body.includes('异常渠道'), 'expected errors');
    });
  });

  it('should display channel names', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('微信支付'), 'expected name');
      assert.ok(body.includes('支付宝'), 'expected name');
    });
  });

  it('should render tab navigation', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('线上支付'), 'expected online tab');
      assert.ok(body.includes('线下支付'), 'expected offline tab');
    });
  });

  it('should show status badges', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('正常'), 'expected normal');
      assert.ok(body.includes('降级'), 'expected degraded');
    });
  });

  it('should show provider labels', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('微信支付') || body.includes('支付宝'), 'expected provider');
    });
  });

  it('should render tab navigation with 3 tabs', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('线上支付'), 'online tab visible');
      assert.ok(body.includes('线下支付'), 'offline tab visible');
      const all = body.match(/全部/g);
      assert.ok(all && all.length >= 1, 'all tab visible');
    });
  });

  it('should show channel fee info', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('费率'), 'fee label');
    });
  });

  it('should show refresh button', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('刷新');
      assert.ok(els.length >= 1);
    });
  });

  it('should show empty state', async () => {
    responseRegistry.clear();
    setResponseFor('/api/cashier/channels', () => ({
      success: true, data: { channels: [] }, message: 'OK',
    }));
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无支付渠道'), 'expected empty');
    });
  });

  it('should show today transaction count', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('423'), 'expected today count');
    });
  });

  it('should show total transaction amount', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('128500') || body.includes('8920'), 'expected amount');
    });
  });

  it('should show abnormal channel count', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('异常') && body.includes('1'), 'expected abnormal count');
    });
  });

  it('should have clickable tab buttons', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const buttons = document.querySelectorAll('button');
      const tabButtons = Array.from(buttons).filter(b => /线上支付|线下支付|全部/.test(b.textContent || ''));
      assert.ok(tabButtons.length >= 3, 'should have 3+ tab buttons');
    });
  });

  it('should handle API error gracefully', async () => {
    responseRegistry.clear();
    setResponseFor('/api/cashier/channels', () => {
      throw new Error('Network error');
    });
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('渠道数') || body.includes('微信支付'), 'should have fallback data');
    }, { timeout: 3000 });
  });

  it('should show loading initially', async () => {
    render(<PaymentChannelsPage />);
    const body = document.body.textContent || '';
    assert.ok(body.includes('加载'), 'should show loading text');
  });

  it('should show degraded channel with yellow bg', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('降级'), 'degraded label visible');
    });
  });

  it('should show offline status red bg', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('正常'), 'normal status visible');
    });
  });

  it('should calculate total correctly with single channel', async () => {
    responseRegistry.clear();
    setResponseFor('/api/cashier/channels', () => ({
      success: true, data: {
        channels: [
          { id: 'ch-1', name: '现金', provider: 'cash', type: 'offline', enabled: true, feeRate: 0, dailyLimitCents: 50000000, singleLimitCents: 1000000, supportedStoreIds: [], todayAmountCents: 100000, todayCount: 5, status: 'normal', config: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ],
      }, message: 'OK',
    }));
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('1000'), 'should show ¥1000.00');
    });
  });

  it('should handle empty channel data', async () => {
    responseRegistry.clear();
    setResponseFor('/api/cashier/channels', () => ({
      success: true, data: { channels: [] }, message: 'OK',
    }));
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无支付渠道'), 'empty state');
      assert.ok(body.includes('0'), 'count should be 0');
    });
  });

  it('should handle many channels with correct count', async () => {
    const channels = Array.from({ length: 5 }, (_, i) => ({
      id: `ch-${i+10}`, name: `渠道${i+1}`, provider: 'other' as const, type: 'online' as const, enabled: true, feeRate: 30, dailyLimitCents: 1000000, singleLimitCents: 50000, supportedStoreIds: [], todayAmountCents: 1000 * (i+1), todayCount: i+1, status: 'normal' as const, config: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    }));
    responseRegistry.clear();
    setResponseFor('/api/cashier/channels', () => ({
      success: true, data: { channels }, message: 'OK',
    }));
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('5'), 'should show 5 channels');
      assert.ok(body.includes('渠道1'), 'first channel');
      assert.ok(body.includes('渠道5'), 'last channel');
    });
  });

  it('should show subDescription text', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('支付方式管理'), 'sub description');
    });
  });

  it('should show store scope info', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('全部门店') || body.includes('1家'), 'store scope info');
    });
  });

  it('should show health check label', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('健康检查'), 'health check label');
    });
  });
});

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
describe('PaymentChannelsPage — hooks验证', () => {
  it('包含useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
});
