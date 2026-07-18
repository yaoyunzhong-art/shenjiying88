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

  it('should show rate info', async () => {
    render(<PaymentChannelsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('0.38'), 'expected fee rate');
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
