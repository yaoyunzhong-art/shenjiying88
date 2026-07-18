/**
 * P-48 联名券 — 联名活动管理页测试
 *
 * 覆盖: 正例·反例·边界
 * Mock策略: URL-pattern responseRegistry
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor } from '@testing-library/react'
import AlliancesPage from './page'
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
  setResponseFor('/api/brand/alliances', () => ({
    success: true,
    data: {
      alliances: [
        { id: 'al-1', name: '喜茶联名卡', partnerName: '喜茶', description: '喜茶联名卡', type: 'cross-industry', status: 'active', startDate: '2026-06-01', endDate: '2026-09-30', couponCount: 5000, redeemedCount: 1823, costCents: 5000000, revenueCents: 18000000, newMemberCount: 2340, contactPerson: '李经理', contactPhone: '138****5678', tenantId: 't1', createdBy: 'admin', createdAt: '2026-05-20T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z' },
        { id: 'al-2', name: '泡泡玛特IP联名', partnerName: '泡泡玛特', description: 'LABUBU联名', type: 'ip', status: 'active', startDate: '2026-07-01', endDate: '2026-10-31', couponCount: 3000, redeemedCount: 892, costCents: 8000000, revenueCents: 25000000, newMemberCount: 1560, contactPerson: '王总监', contactPhone: '139****9012', tenantId: 't1', createdBy: 'admin', createdAt: '2026-06-10T00:00:00Z', updatedAt: '2026-07-14T14:00:00Z' },
        { id: 'al-3', name: '星巴克联名', partnerName: '星巴克', description: '星巴克赠饮', type: 'brand', status: 'expired', startDate: '2026-03-01', endDate: '2026-05-31', couponCount: 8000, redeemedCount: 6754, costCents: 12000000, revenueCents: 58000000, newMemberCount: 4890, contactPerson: '陈主管', contactPhone: '136****3456', tenantId: 't1', createdBy: 'admin', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
      ],
    },
    message: 'OK',
  }));
}

// ─── Tests ─────────────────────────────────────────────

describe('AlliancesPage', () => {
  beforeEach(() => { setDefault(); });

  it('should render page title', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('联名券管理');
      assert.ok(els.length >= 1);
    });
  });

  it('should show stat cards', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('联名活动'), 'expected total count');
      assert.ok(body.includes('总营收'), 'expected revenue stat');
      assert.ok(body.includes('总成本'), 'expected cost stat');
      assert.ok(body.includes('ROI'), 'expected ROI stat');
    });
  });

  it('should display alliance names', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('喜茶联名卡'), 'expected name');
      assert.ok(body.includes('泡泡玛特IP联名'), 'expected name');
    });
  });

  it('should render tab navigation', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('进行中'), 'expected active tab');
      assert.ok(body.includes('已结束'), 'expected expired tab');
      assert.ok(body.includes('全部'), 'expected all tab');
    });
  });

  it('should show status badges', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('进行中'), 'expected active status');
    });
  });

  it('should show type labels', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('跨界联名') || body.includes('IP联名'), 'expected type label');
    });
  });

  it('should show partner names', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('喜茶'), 'expected partner name');
      assert.ok(body.includes('泡泡玛特'), 'expected partner name');
    });
  });

  it('should show refresh button', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('刷新');
      assert.ok(els.length >= 1);
    });
  });

  it('should show empty state when no alliances', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/alliances', () => ({
      success: true, data: { alliances: [] }, message: 'OK',
    }));
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无联名活动'), 'expected empty state');
    });
  });

  it('should show redemption rate', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 喜茶: 1823/5000 = 36.5%
      assert.ok(body.includes('36.5') || body.includes('36.4'), 'expected redemption rate');
    });
  });

  it('should show ROI', async () => {
    render(<AlliancesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 喜茶: 18000000/5000000 = 3.6x
      assert.ok(body.includes('3.6'), 'expected ROI');
    });
  });
});

// ── 静态代码分析 ──

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('AlliancesPage — hooks验证', () => {
  it('包含useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
});
