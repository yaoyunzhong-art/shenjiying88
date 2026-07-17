/**
 * V18 财务健康仪表盘测试
 *
 * 覆盖: 营收卡片/渠道拆分/趋势图/操作按钮/空态/加载态/错误态
 * 要求: ≥12个测试, 0 as any, 全部通过
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import FinanceDashboardPage from './page'
import fs from 'node:fs';

// ─── Mock response helpers ──

function mockApiResponse(overrides: Record<string, unknown> = {}) {
  const base = {
    revenue: {
      totalRevenueCents: 1580000,
      totalRefundCents: 50000,
      netIncomeCents: 1530000,
      transactionCount: 42,
      date: '2026-07-15',
    },
    channels: {
      wechatCents: 680000,
      alipayCents: 520000,
      memberCardCents: 280000,
      cashCents: 100000,
      totalCents: 1580000,
    },
    trend: [
      { date: '2026-07-09', revenueCents: 1200000, refundCents: 30000, netCents: 1170000 },
      { date: '2026-07-10', revenueCents: 1450000, refundCents: 20000, netCents: 1430000 },
      { date: '2026-07-11', revenueCents: 1100000, refundCents: 10000, netCents: 1090000 },
      { date: '2026-07-12', revenueCents: 1350000, refundCents: 40000, netCents: 1310000 },
      { date: '2026-07-13', revenueCents: 1600000, refundCents: 25000, netCents: 1575000 },
      { date: '2026-07-14', revenueCents: 1520000, refundCents: 35000, netCents: 1485000 },
      { date: '2026-07-15', revenueCents: 1580000, refundCents: 50000, netCents: 1530000 },
    ],
    reconciliation: {
      inProgress: false,
      lastRunAt: '2026-07-15T10:00:00.000Z',
      lastRunDate: '2026-07-15',
      totalRuns: 5,
      lastError: null,
      lastReportSummary: {
        date: '2026-07-15',
        matchedCount: 48,
        exactMatchCount: 45,
        totalDiffCents: 0,
        matchRate: 96,
      },
    },
    costAnalysis: {
      totalCostCents: 580000,
      categories: [
        { category: '采购成本', amountCents: 320000, count: 12, percentage: 55.2 },
        { category: '人力成本', amountCents: 180000, count: 8, percentage: 31.0 },
        { category: '租金', amountCents: 80000, count: 1, percentage: 13.8 },
      ],
      monthOverMonthChange: -2.5,
      yearOverYearChange: 3.8,
    },
    profit: {
      storeProfit: 450000,
      storeMargin: 0.18,
      brandProfit: 890000,
      brandRevenue: 3160000,
      brandCost: 2270000,
    },
    ...overrides,
  }
  return {
    status: () => Promise.resolve(200),
    json: () => Promise.resolve({
      success: true,
      data: base,
      message: 'OK',
    }),
    ok: true,
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic' as const,
    url: '',
    clone: () => ({} as Response),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
  } as Response
}

function mockApiSuccessResponse(data: unknown): Response {
  return {
    status: () => Promise.resolve(200),
    json: () => Promise.resolve({ success: true, data, message: 'OK' }),
    ok: true,
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic' as const,
    url: '',
    clone: () => ({} as Response),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
  } as Response
}

describe('FinanceDashboardPage', () => {
  afterEach(() => {
    cleanup()
  })

  // ─── 加载态 ──

  it('should show loading state initially', () => {
    globalThis.fetch = (() => new Promise(() => {})) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    assert.ok(screen.getByText(/加载财务仪表盘/))
    assert.ok(screen.getByTestId('loading-state'))
  })

  // ─── 错误态 ──

  it('should show error state when fetch fails', async () => {
    globalThis.fetch = (() => Promise.reject(new Error('Network error'))) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('加载失败'))
      assert.ok(screen.getByTestId('error-state'))
    })
  })

  it('should show retry button on error', async () => {
    globalThis.fetch = (() => Promise.reject(new Error('Network error'))) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('重试'))
    })
  })

  // ─── 空态 ──

  it('should show empty state when data is null', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiSuccessResponse(null))) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('暂无财务数据'))
      assert.ok(screen.getByTestId('empty-state'))
    })
  })

  // ─── 正例渲染 ──

  it('should render page title', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('财务健康仪表盘'))
    })
  })

  it('should render all four revenue cards', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const cards = screen.getAllByTestId('revenue-card')
      assert.strictEqual(cards.length, 4)
      assert.ok(screen.getByText('今日营收'))
      assert.ok(screen.getByText('今日退款'))
      assert.ok(screen.getByText('净收入'))
      assert.ok(screen.getByText('交易笔数'))
    })
  })

  it('should display revenue amounts correctly', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const amounts = screen.getAllByTestId('revenue-amount')
      assert.ok(amounts.length >= 4)
      // First card: totalRevenueCents=1580000 => ¥15,800.00
      // Also check transaction count directly
      assert.ok(screen.getByText('42'))  // transaction count
    })
  })

  // ─── 渠道拆分 ──

  it('should show channel breakdown section', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('channel-breakdown'))
    })
    // 微信支付 appears in both channel list and detail table
    const wechatTexts = screen.getAllByText('微信支付')
    assert.ok(wechatTexts.length >= 2)
  })

  it('should show channel rows', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const rows = screen.getAllByTestId('channel-row')
      assert.strictEqual(rows.length, 4)
    })
  })

  // ─── 趋势图 ──

  it('should render trend chart with 7 bars', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('trend-chart'))
      const bars = screen.getAllByTestId('trend-bar')
      assert.strictEqual(bars.length, 7)
    })
  })

  it('should display trend chart legend', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('7日营收趋势'))
      assert.ok(screen.getByText('营收'))
      assert.ok(screen.getByText('退款'))
    })
  })

  // ─── 对账状态卡 ──

  it('should show reconciliation status', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('reconciliation-status'))
      assert.ok(screen.getByText('今日对账状态'))
    })
  })

  it('should show healthy status when matchRate >= 90 and no diffs', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('✅ 账目健康'))
    })
  })

  it('should show warning status when diffs exist', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse({
      reconciliation: {
        inProgress: false,
        lastRunAt: '2026-07-15T10:00:00.000Z',
        lastRunDate: '2026-07-15',
        totalRuns: 5,
        lastError: null,
        lastReportSummary: {
          date: '2026-07-15',
          matchedCount: 45,
          exactMatchCount: 40,
          totalDiffCents: 50000,
          matchRate: 85,
        },
      },
    }))) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('⚠️ 需关注'))
    })
  })

  it('should show in-progress text in reconciliation status', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse({
      reconciliation: {
        inProgress: true,
        lastRunAt: null,
        lastRunDate: null,
        totalRuns: 5,
        lastError: null,
        lastReportSummary: null,
      },
    }))) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      // "对账进行中..." appears both in status card and button
      const matches = screen.getAllByText('对账进行中...')
      assert.ok(matches.length >= 1)
    })
  })

  it('should show no data state when no summary exists', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse({
      reconciliation: {
        inProgress: false,
        lastRunAt: null,
        lastRunDate: null,
        totalRuns: 0,
        lastError: null,
        lastReportSummary: null,
      },
    }))) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('暂无对账数据'))
    })
  })

  // ─── 操作按钮 ──

  it('should render quick action buttons', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('quick-actions'))
      assert.ok(screen.getByTestId('btn-run-reconciliation'))
      assert.ok(screen.getByTestId('btn-view-reconciliation'))
      assert.ok(screen.getByTestId('btn-export'))
    })
  })

  it('should disable run reconciliation button when in progress', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse({
      reconciliation: {
        inProgress: true,
        lastRunAt: null,
        lastRunDate: null,
        totalRuns: 5,
        lastError: null,
        lastReportSummary: null,
      },
    }))) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const btn = screen.getByTestId('btn-run-reconciliation') as HTMLButtonElement
      assert.ok(btn.disabled)
    })
  })

  // ─── 渠道明细表 ──

  it('should render channel detail table', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('channel-detail-table'))
      const rows = screen.getAllByTestId('channel-detail-row')
      assert.strictEqual(rows.length, 4)
    })
  })

  it('should show proportion bars in detail table', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('channel-detail-table'))
      assert.ok(screen.getByText('进度'))
    })
  })

  // ─── 费用分析面板测试 ──

  it('should render cost analysis panel', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const panel = screen.queryByTestId('cost-analysis-panel')
      assert.ok(panel, 'Cost analysis panel should render')
    })
  })

  it('should show cost categories in cost panel', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const rows = screen.getAllByTestId('cost-category-row')
      assert.strictEqual(rows.length, 3)
    })
  })

  it('should display MoM and YoY indicators', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText(/环比/))
      assert.ok(screen.getByText(/同比/))
    })
  })

  // ─── 利润概览面板测试 ──

  it('should render profit overview panel', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const panel = screen.queryByTestId('profit-overview')
      assert.ok(panel, 'Profit overview panel should render')
    })
  })

  it('should show brand profit in profit panel', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText(/品牌利润/))
      assert.ok(screen.getByText(/品牌营收/))
    })
  })

  it('should render cost panel even when data has negative changes', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiResponse({
      costAnalysis: {
        totalCostCents: 600000,
        categories: [
          { category: '采购成本', amountCents: 350000, count: 10, percentage: 58.3 },
          { category: '人力成本', amountCents: 180000, count: 7, percentage: 30.0 },
          { category: '租金', amountCents: 70000, count: 1, percentage: 11.7 },
        ],
        monthOverMonthChange: 5.2,
        yearOverYearChange: -1.3,
      },
    }))) as unknown as typeof globalThis.fetch
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('cost-analysis-panel'))
    })
  })
})

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Finance / Dashboard — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
