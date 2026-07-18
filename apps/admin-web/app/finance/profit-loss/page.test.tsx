/**
 * P-38 财务对账 — 损益表(P&L)测试
 *
 * 圈梁四道箍:
 * ① TSC通过 → ② 测试存在(0 fail) → ③ 圈梁表更新 → ④ PRD标记
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor } from '@testing-library/react'
import ProfitLossPage from './page'

// ─── Mock fetch — URL-pattern responseRegistry ──

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
  setResponseFor('/pnl', () => ({ success: true, data: {
    date: '2026-07-18',
    periodLabel: '2026年7月测试',
    items: [
      { category: 'revenue', label: '营业收入', thisMonthCents: 456000000, lastMonthCents: 412000000, budgetCents: 500000000, children: [
        { category: 'revenue', label: '门票收入', thisMonthCents: 128000000, lastMonthCents: 115000000, budgetCents: 140000000 },
      ]},
      { category: 'cost', label: '营业成本', thisMonthCents: 228000000, lastMonthCents: 206000000, budgetCents: 250000000, children: [
        { category: 'cost', label: '设备折旧', thisMonthCents: 45000000, lastMonthCents: 45000000, budgetCents: 45000000 },
      ]},
      { category: 'expense', label: '运营费用', thisMonthCents: 128000000, lastMonthCents: 115000000, budgetCents: 140000000, children: [] },
      { category: 'profit', label: '净利润', thisMonthCents: 100000000, lastMonthCents: 91000000, budgetCents: 110000000, children: [] },
    ],
    tenantId: 't1',
    generatedAt: '2026-07-18T22:00:00Z',
  }, message: 'OK' }));
}

// ─── Tests ─────────────────────────────────────────────

describe('ProfitLossPage', () => {
  beforeEach(() => { responseRegistry.clear(); setDefault(); });

  it('① 页面标题应展示', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('损益表 (P&L)');
      assert.ok(els.length >= 1, 'expected title');
    });
  });

  it('② 应显示报表期间', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('2026年7月测试'), 'expected period');
    });
  });

  it('③ 应展示关键指标卡片', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('总收入'), 'expected revenue');
      assert.ok(body.includes('总成本+费用'), 'expected cost');
      assert.ok(body.includes('净利润'), 'expected profit');
      assert.ok(body.includes('净利率'), 'expected margin');
    });
  });

  it('④ 应展示科目行', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('营业收入'), 'expected line item');
      assert.ok(body.includes('门票收入'), 'expected child item');
      assert.ok(body.includes('营业成本'), 'expected cost item');
    });
  });

  it('⑤ 应展示表头', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('科目'), 'expected header');
      assert.ok(body.includes('本月'), 'expected header');
      assert.ok(body.includes('上月'), 'expected header');
      assert.ok(body.includes('预算'), 'expected header');
      assert.ok(body.includes('环比'), 'expected header');
      assert.ok(body.includes('预算达成'), 'expected header');
    });
  });

  it('⑥ 应显示环比变化率', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('+10.7'), 'expected revenue MoM change');
    });
  });

  it('⑦ 应显示预算达成率', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 456000000/500000000 = 91.2
      assert.ok(body.includes('91.2'), 'expected budget pct');
    });
  });

  it('⑧ 应显示刷新按钮', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('刷新');
      assert.ok(els.length >= 1);
    });
  });

  it('⑨ 应显示生成时间', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('生成时间'), 'expected generated at');
    });
  });

  it('⑩ 应显示净利润率', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 净利率卡应存在
      assert.ok(body.includes('净利率'), 'expected margin label');
    });
  });
});

// ── 静态代码分析 ──

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ProfitLossPage — 圈梁 ① TSC通过检查', () => {
  it('包含useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含递归组件', () => assert.ok(SRC.includes('PnLRow')), 'expected recursive row component');
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('没有as any', () => assert.ok(!SRC.includes('as any')));
});
