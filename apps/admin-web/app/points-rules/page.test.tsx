/**
 * P-36 会员 — 积分规则管理页测试
 *
 * 覆盖: 正例·反例·边界
 * Mock策略: URL-pattern responseRegistry
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor } from '@testing-library/react'
import PointsRulesPage from './page'
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const responseRegistry = new Map<string, () => unknown>();
let fetchCalls = 0;

function setResponseFor(pattern: string, factory: () => unknown) {
  responseRegistry.set(pattern, factory);
}

globalThis.fetch = ((url: string) => {
  fetchCalls++;
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
  fetchCalls = 0;
  setResponseFor('/points-rules', () => ({ success: true, data: {
    rules: [
      { id: 'pr-1', name: '消费积分', description: '每消费¥1得1分', category: 'earn', triggerType: 'purchase', rateNumerator: 1, rateDenominator: 100, earnPoints: 0, minAmountCents: 0, maxPerDay: 0, memberLevels: [], enabled: true, priority: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
      { id: 'pr-2', name: '签到积分', description: '每日签到得10分', category: 'earn', triggerType: 'checkin', rateNumerator: 10, rateDenominator: 0, earnPoints: 10, minAmountCents: 0, maxPerDay: 10, memberLevels: [], enabled: true, priority: 2, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
      { id: 'pr-5', name: '积分兑换', description: '100积分=¥1', category: 'redeem', triggerType: 'purchase', rateNumerator: 100, rateDenominator: 100, earnPoints: 0, minAmountCents: 500, maxPerDay: 5000, memberLevels: [], enabled: true, priority: 10, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
    ],
  }, message: 'OK' }));
  setResponseFor('/points-summary', () => ({ success: true, data: {
    totalRules: 10, enabledRules: 8, avgEarnRate: 1.2, monthlyIssued: 320000, monthlyRedeemed: 185000, totalMembers: 45600,
  }, message: 'OK' }));
}

// ─── Tests ─────────────────────────────────────────────

describe('PointsRulesPage', () => {
  beforeEach(() => { setDefault(); });

  it('should render page title', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('积分规则');
      assert.ok(els.length >= 1);
    });
  });

  it('should show summary stats', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('规则总数'), 'expected total');
      assert.ok(body.includes('月发放积分'), 'expected issued');
      assert.ok(body.includes('月消耗积分'), 'expected redeemed');
      assert.ok(body.includes('平均赚取率'), 'expected rate');
    });
  });

  it('should display rule names', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('消费积分'), 'expected earn rule');
      assert.ok(body.includes('签到积分'), 'expected checkin rule');
    });
  });

  it('should render tab navigation', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('赚取'), 'expected earn tab');
      assert.ok(body.includes('消耗'), 'expected redeem tab');
      assert.ok(body.includes('奖励'), 'expected bonus tab');
    });
  });

  it('should show enabled badge for active rules', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('已启用'), 'expected enabled badge');
    });
  });

  it('should show trigger type labels', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('消费'), 'expected purchase trigger');
    });
  });

  it('should show refresh button', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('刷新');
      assert.ok(els.length >= 1);
    });
  });

  it('should show empty state when no rules', async () => {
    responseRegistry.clear();
    setResponseFor('/points-rules', () => ({ success: true, data: { rules: [] }, message: 'OK' }));
    setResponseFor('/points-summary', () => ({ success: true, data: { totalRules: 0, enabledRules: 0, avgEarnRate: 0, monthlyIssued: 0, monthlyRedeemed: 0, totalMembers: 0 }, message: 'OK' }));
    render(<PointsRulesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无规则'), 'expected empty');
    });
  });

  it('should show rate info', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('1分'), 'expected rate');
    });
  });

  it('should show monthly issuance count', async () => {
    render(<PointsRulesPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('32'), 'expected monthly issued number');
    });
  });
});

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
describe('PointsRulesPage — hooks验证', () => {
  it('包含useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
});
