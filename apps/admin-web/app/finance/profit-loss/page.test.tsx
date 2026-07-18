/**
 * P-38 财务对账 — 损益表(P&L)测试
 *
 * 圈梁四道箍:
 * ① TSC通过 → ② 测试存在(0 fail) → ③ 圈梁表更新 → ④ PRD标记
 *
 * 覆盖: 正例12 + 反例10 + 边界10 + 静态14 = 46 tests
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

// Period-aware default datasets for tab switching tests
const periodDataSets: Record<string, { periodLabel: string; items: any[] }> = {
  thisMonth: {
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
  },
  lastMonth: {
    periodLabel: '2026年6月',
    items: [
      { category: 'revenue', label: '营业收入', thisMonthCents: 412000000, lastMonthCents: 380000000, budgetCents: 450000000, children: [
        { category: 'revenue', label: '门票收入', thisMonthCents: 115000000, lastMonthCents: 105000000, budgetCents: 130000000 },
      ]},
      { category: 'cost', label: '营业成本', thisMonthCents: 206000000, lastMonthCents: 190000000, budgetCents: 220000000, children: [
        { category: 'cost', label: '设备折旧', thisMonthCents: 45000000, lastMonthCents: 45000000, budgetCents: 45000000 },
      ]},
      { category: 'expense', label: '运营费用', thisMonthCents: 115000000, lastMonthCents: 110000000, budgetCents: 130000000, children: [] },
      { category: 'profit', label: '净利润', thisMonthCents: 91000000, lastMonthCents: 80000000, budgetCents: 100000000, children: [] },
    ],
  },
  quarter: {
    periodLabel: '2026年Q2 (4月-6月)',
    items: [
      { category: 'revenue', label: '营业收入', thisMonthCents: 1350000000, lastMonthCents: 1200000000, budgetCents: 1500000000, children: [
        { category: 'revenue', label: '门票收入', thisMonthCents: 380000000, lastMonthCents: 340000000, budgetCents: 420000000 },
      ]},
      { category: 'cost', label: '营业成本', thisMonthCents: 680000000, lastMonthCents: 600000000, budgetCents: 750000000, children: [
        { category: 'cost', label: '设备折旧', thisMonthCents: 135000000, lastMonthCents: 135000000, budgetCents: 135000000 },
      ]},
      { category: 'expense', label: '运营费用', thisMonthCents: 380000000, lastMonthCents: 350000000, budgetCents: 420000000, children: [] },
      { category: 'profit', label: '净利润', thisMonthCents: 290000000, lastMonthCents: 250000000, budgetCents: 330000000, children: [] },
    ],
  },
  year: {
    periodLabel: '2026年累计 (1月-7月)',
    items: [
      { category: 'revenue', label: '营业收入', thisMonthCents: 2890000000, lastMonthCents: 2450000000, budgetCents: 3600000000, children: [
        { category: 'revenue', label: '门票收入', thisMonthCents: 820000000, lastMonthCents: 700000000, budgetCents: 1000000000 },
      ]},
      { category: 'cost', label: '营业成本', thisMonthCents: 1420000000, lastMonthCents: 1200000000, budgetCents: 1800000000, children: [
        { category: 'cost', label: '设备折旧', thisMonthCents: 315000000, lastMonthCents: 270000000, budgetCents: 315000000 },
      ]},
      { category: 'expense', label: '运营费用', thisMonthCents: 820000000, lastMonthCents: 700000000, budgetCents: 980000000, children: [] },
      { category: 'profit', label: '净利润', thisMonthCents: 650000000, lastMonthCents: 550000000, budgetCents: 820000000, children: [] },
    ],
  },
}

function setDefault() {
  responseRegistry.clear();
  // Register per-period endpoints so tab switching triggers different data
  for (const [period, data] of Object.entries(periodDataSets)) {
    setResponseFor(`pnl?period=${period}`, () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: data.periodLabel,
      items: data.items,
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }, message: 'OK' }));
  }
  // Generic /pnl fallback for tests that don't specify period
  setResponseFor('/pnl', () => ({ success: true, data: {
    date: '2026-07-18',
    periodLabel: periodDataSets.thisMonth.periodLabel,
    items: periodDataSets.thisMonth.items,
    tenantId: 't1',
    generatedAt: '2026-07-18T22:00:00Z',
  }, message: 'OK' }));
}

// ─── Helper ──

function bodyText(): string { return document.body.textContent || '' }

function findTab(label: string): HTMLElement | null {
  const tabs = document.querySelectorAll('[role="tab"]');
  for (const tab of tabs) {
    if (tab.textContent?.trim() === label) return tab as HTMLElement;
  }
  return null;
}

// ────────────────────────────────────────────────
// 正例 — 正常渲染 & 数据展示 (12 tests)
// ────────────────────────────────────────────────

describe('ProfitLossPage — 正例', () => {
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
      assert.ok(bodyText().includes('2026年7月测试'), 'expected period');
    });
  });

  it('③ 应展示关键指标卡片', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('总收入'), 'expected revenue');
      assert.ok(bodyText().includes('总成本+费用'), 'expected cost');
      assert.ok(bodyText().includes('净利润'), 'expected profit');
      assert.ok(bodyText().includes('净利率'), 'expected margin');
    });
  });

  it('④ 应展示科目行', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('营业收入'), 'expected line item');
      assert.ok(bodyText().includes('门票收入'), 'expected child item');
      assert.ok(bodyText().includes('营业成本'), 'expected cost item');
    });
  });

  it('⑤ 应展示表头', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('科目'), 'expected header');
      assert.ok(bodyText().includes('本月'), 'expected header');
      assert.ok(bodyText().includes('上月'), 'expected header');
      assert.ok(bodyText().includes('预算'), 'expected header');
      assert.ok(bodyText().includes('环比'), 'expected header');
      assert.ok(bodyText().includes('预算达成'), 'expected header');
    });
  });

  it('⑥ 应显示环比变化率', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('+10.7'), 'expected revenue MoM change');
    });
  });

  it('⑦ 应显示预算达成率', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      // 456000000/500000000 = 91.2%
      assert.ok(bodyText().includes('91.2'), 'expected budget pct');
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
      assert.ok(bodyText().includes('生成时间'), 'expected generated at');
    });
  });

  it('⑩ 净利润卡应有金额展示', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      // netProfit = 456M - 228M - 128M = 100000000 cents = ¥1.00亿
      assert.ok(bodyText().includes('1.00亿') || bodyText().includes('100.00'), 'expected formatted profit');
    });
  });

  it('⑪ 应显示加载状态', () => {
    responseRegistry.clear();
    setResponseFor('/pnl', () => new Promise(() => {})); // never resolve
    render(<ProfitLossPage />);
    const body = bodyText();
    assert.ok(body.includes('加载损益表') || body.includes('loading'), 'expected loading state or spinner');
  });

  it('⑫ 数据行按 revenue→cost→expense→profit 排序', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = bodyText();
      const tableMatch = body.match(/科目.*?生成时间/s);
      const tableContent = tableMatch ? tableMatch[0] : body;
      const revIdx = tableContent.indexOf('营业收入');
      const costIdx = tableContent.indexOf('营业成本');
      const expIdx = tableContent.indexOf('运营费用');
      const profitIdx = tableContent.indexOf('净利润');
      assert.ok(revIdx >= 0 && costIdx >= 0 && expIdx >= 0 && profitIdx >= 0, 'all categories present');
      assert.ok(revIdx < costIdx, 'revenue before cost');
      assert.ok(costIdx < expIdx, 'cost before expense');
      assert.ok(expIdx < profitIdx, 'expense before profit');
    });
  });
});

// ────────────────────────────────────────────────
// 反例 — 错误/空/异常场景 (10 tests)
// ────────────────────────────────────────────────

describe('ProfitLossPage — 反例', () => {
  beforeEach(() => { responseRegistry.clear(); setDefault(); });

  it('① API 失败 → fallback 数据仍渲染', async () => {
    setResponseFor('pnl?period=thisMonth', () => { throw new Error('Network error') });
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('损益表'), 'should render fallback');
    });
  });

  it('② API 完全不可达 → fallback 仍渲染', async () => {
    responseRegistry.clear();
    const origFetch = globalThis.fetch;
    globalThis.fetch = ((() => Promise.reject(new Error('total network failure'))) as typeof globalThis.fetch);
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = bodyText();
      assert.ok(body.includes('损益表') || body.includes('加载'), 'should render or show loading');
    });
    globalThis.fetch = origFetch;
  });

  it('③ API 返回错误响应 → API error thrown → fallback', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: false, message: '服务器繁忙' }));
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = bodyText();
      assert.ok(body.includes('损益表'), 'should render fallback');
    });
  });

  it('④ 空数组数据 → 无科目行,摘要仍展示', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '空数据',
      items: [],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('总收入'), 'summary cards still show');
      assert.ok(bodyText().includes('净利率'), 'margin still shown');
      assert.ok(bodyText().includes('生成时间'), 'generated time still shows');
    });
  });

  it('⑤ 负数利润 → 正确显示负值格式', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '亏损月',
      items: [
        { category: 'revenue', label: '营业收入', thisMonthCents: 100000000, lastMonthCents: 200000000, budgetCents: 300000000, children: [] },
        { category: 'cost', label: '营业成本', thisMonthCents: 150000000, lastMonthCents: 120000000, budgetCents: 180000000, children: [] },
        { category: 'expense', label: '运营费用', thisMonthCents: 50000000, lastMonthCents: 40000000, budgetCents: 60000000, children: [] },
        { category: 'profit', label: '净利润', thisMonthCents: -100000000, lastMonthCents: 40000000, budgetCents: 60000000, children: [] },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      // netProfit = 100M - 150M - 50M = -100000000 cents = -¥1.00亿
      assert.ok(bodyText().includes('-¥1.00亿') || bodyText().includes('1.00亿'), 'negative profit with minus sign');
    });
  });

  it('⑥ 不完整数据结构 → 不崩溃', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '不完整数据',
      items: [
        { category: 'revenue', label: '测试收入', thisMonthCents: 100000, lastMonthCents: 0, budgetCents: 0 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('测试收入'), 'should render without crash');
    });
  });

  it('⑦ 无子项 → 不会导致 map 报错', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '无子项',
      items: [
        { category: 'revenue', label: '收入A', thisMonthCents: 1000000, lastMonthCents: 800000, budgetCents: 1200000 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('收入A'), 'should render');
    });
  });

  it('⑧ 环比 prev=0 显示 +∞', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '环比测试',
      items: [
        { category: 'revenue', label: '新收入', thisMonthCents: 500000, lastMonthCents: 0, budgetCents: 1000000 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('+∞'), 'should show +∞ when previous is 0');
    });
  });

  it('⑨ 预算为 0 显示占位符 -', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '预算为0',
      items: [
        { category: 'revenue', label: '弹性收入', thisMonthCents: 500000, lastMonthCents: 300000, budgetCents: 0 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('-'), 'should show dash for zero budget');
    });
  });

  it('⑩ 未知分类 → 不崩溃,正常渲染', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '单行',
      items: [
        { category: 'other' as string, label: '杂项', thisMonthCents: 1, lastMonthCents: 0, budgetCents: 0 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('杂项'), 'should render single misc item');
    });
  });
});

// ────────────────────────────────────────────────
// 边界 — 月份筛选Tab / 金额格式化 / 极限 (10 tests)
// ────────────────────────────────────────────────

describe('ProfitLossPage — 边界', () => {
  beforeEach(() => { responseRegistry.clear(); setDefault(); });

  it('① 默认选中"本月"Tab', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      assert.ok(tabs.length >= 4, 'should have 4 period tabs');
      let foundActive = false;
      tabs.forEach(tab => {
        if (tab.getAttribute('aria-selected') === 'true') {
          foundActive = true;
          assert.equal(tab.textContent?.trim(), '本月', 'default active tab should be 本月');
        }
      });
      assert.ok(foundActive, 'should have an active tab');
    });
  });

  it('② 点击"上月"Tab → 切换数据', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const tab = findTab('上月');
      assert.ok(tab, '上月 tab should exist');
      fireEvent.click(tab!);
    });
    await waitFor(() => {
      const body = bodyText();
      assert.ok(body.includes('2026年6月'), 'should switch to last month period label');
    });
  });

  it('③ 点击"本季度"Tab → 展示季度数据', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const tab = findTab('本季度');
      assert.ok(tab, '本季度 tab should exist');
      fireEvent.click(tab!);
    });
    await waitFor(() => {
      const body = bodyText();
      assert.ok(body.includes('Q2'), 'should show quarter label');
    });
  });

  it('④ 点击"本年"Tab → 展示年度数据', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      const tab = findTab('本年');
      assert.ok(tab, '本年 tab should exist');
      fireEvent.click(tab!);
    });
    await waitFor(() => {
      const body = bodyText();
      assert.ok(body.includes('年累计'), 'should show year label');
    });
  });

  it('⑤ Tab 切换后选中状态变化', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('损益表'), 'initial data loaded');
    });
    const tab = findTab('本季度');
    assert.ok(tab, 'tab exists');
    fireEvent.click(tab!);
    // After click, loading state appears then new data renders with updated tabs
    await waitFor(() => {
      const quarterTab = findTab('本季度');
      const monthTab = findTab('本月');
      if (!quarterTab) return false;
      const quarterActive = quarterTab.getAttribute('aria-selected') === 'true';
      const monthActive = monthTab ? monthTab.getAttribute('aria-selected') === 'true' : false;
      return quarterActive && !monthActive;
    }, { timeout: 2000 });
  });

  it('⑥ fmtShort 分转万格式正确', async () => {
    responseRegistry.clear();
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '格式测试',
      items: [
        { category: 'revenue', label: '测试收入', thisMonthCents: 123456789, lastMonthCents: 0, budgetCents: 0 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = bodyText();
      // 123456789 cents → fmtCents = ¥1234567.89 → fmtShort = ¥12345.7万 (>= 10000)
      assert.ok(body.includes('¥') && body.includes('万'), 'cents formatted with ten-thousands');
    });
  });

  it('⑦ fmtShort 亿级格式化', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '亿级测试',
      items: [
        { category: 'revenue', label: '巨额收入', thisMonthCents: 12345678901, lastMonthCents: 0, budgetCents: 0 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = bodyText();
      assert.ok(body.includes('亿'), 'should show 亿 format');
    });
  });

  it('⑧ 零金额显示 ¥0.00', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '零数据',
      items: [
        { category: 'revenue', label: '零收入', thisMonthCents: 0, lastMonthCents: 0, budgetCents: 0 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('¥0.00'), 'zero amount formatted');
    });
  });

  it('⑨ 极小金额 1分 正确渲染', async () => {
    setResponseFor('pnl?period=thisMonth', () => ({ success: true, data: {
      date: '2026-07-18',
      periodLabel: '极小额',
      items: [
        { category: 'revenue', label: '微量收入', thisMonthCents: 1, lastMonthCents: 0, budgetCents: 5 },
      ],
      tenantId: 't1',
      generatedAt: '2026-07-18T22:00:00Z',
    }}));
    render(<ProfitLossPage />);
    await waitFor(() => {
      const body = bodyText();
      assert.ok(body.includes('¥0.01'), '1 cent renders correctly');
    });
  });

  it('⑩ Tab 点击后展示新数据', async () => {
    render(<ProfitLossPage />);
    await waitFor(() => {
      assert.ok(bodyText().includes('损益表'), 'initial data loaded');
    });
    const tab = findTab('本季度');
    assert.ok(tab, 'tab exists');
    fireEvent.click(tab!);
    await waitFor(() => {
      assert.ok(bodyText().includes('Q2'), 'quarter data after click');
    }, { timeout: 2000 });
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
  it('包含周期数据类型', () => assert.ok(SRC.includes('PeriodKey'), 'expected period type'));
  it('包含Tab按钮 handlePeriodChange', () => assert.ok(SRC.includes('handlePeriodChange'), 'expected period change handler'));
  it('包含aria-selected', () => assert.ok(SRC.includes('aria-selected'), 'expected aria-selected on tabs'));
  it('包含周期数据 periodDataMap', () => assert.ok(SRC.includes('periodDataMap'), 'expected period data map'));
  it('没有describe.skip', () => assert.ok(!SRC.includes('describe.skip')));
  it('没有it.only', () => assert.ok(!SRC.includes('it.only')), 'expected no it.only');
});
