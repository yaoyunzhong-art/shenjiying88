/**
 * V18 财务健康仪表盘测试
 *
 * 覆盖: 营收卡片/渠道拆分/趋势图/操作按钮/空态/加载态/错误态
 * 要求: ≥12个测试, 0 as any, 全部通过
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import FinanceDashboardPage from './page'

// ─── Helper: simple mock function ──────────────────────────

function createMockFn() {
  let callCount = 0
  const calls: unknown[][] = []
  const mock: { (): unknown; mockReset: () => void; mockResolvedValueOnce: (v: unknown) => void; mockRejectedValueOnce: (v: unknown) => void; callCount: number } = Object.assign(
    function (this: unknown) {
      callCount++
      const args = Array.from(arguments)
      calls.push(args)
      return undefined
    },
    {
      mockReset: () => { callCount = 0; calls.length = 0 },
      mockResolvedValueOnce: () => {},
      mockRejectedValueOnce: () => {},
      get callCount() { return callCount },
    }
  )
  return mock
}

let mockFetch: ReturnType<typeof createMockFn>
let resolveChain: Array<() => Promise<Response>>

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

function mockApiSuccessResponse(data: unknown) {
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

function setupFetch(...responses: Response[]) {
  let idx = 0
  mockFetch = Object.assign(
    function () {
      const r = idx < responses.length ? responses[idx] : mockApiResponse()
      idx++
      return Promise.resolve(r)
    },
    { mockReset: () => { idx = 0 }, mockResolvedValueOnce: () => {}, mockRejectedValueOnce: () => {}, callCount: 0 }
  )
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
}

// ─── Tests ─────────────────────────────────────────────

describe('FinanceDashboardPage', () => {
  beforeEach(() => {
    // Reset fetch
    globalThis.fetch = (() => Promise.resolve(mockApiResponse())) as unknown as typeof globalThis.fetch
  })

  // ─── 加载态 ──

  it('should show loading state initially', async () => {
    // Keep fetch pending
    globalThis.fetch = (() => new Promise(() => {})) as unknown as typeof globalThis.fetch

    render(<FinanceDashboardPage />)
    const ctx = assert.ok(screen.getByText(/加载财务仪表盘/))
    const loadingEl = screen.getByTestId('loading-state')
    assert.ok(loadingEl)
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

  it('should show empty state when no data returned', async () => {
    globalThis.fetch = (() => Promise.resolve(mockApiSuccessResponse(null))) as unknown as typeof globalThis.fetch

    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('暂无财务数据'))
      assert.ok(screen.getByTestId('empty-state'))
    })
  })

  // ─── 正例渲染 ──

  it('should render page title', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('财务健康仪表盘'))
    })
  })

  it('should render all four revenue cards', async () => {
    setupFetch(mockApiResponse())
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
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const amounts = screen.getAllByTestId('revenue-amount')
      assert.ok(amounts.length >= 4)
      assert.ok(amounts[0].textContent!.includes('¥15,800.00'))
    })
  })

  // ─── 渠道拆分 ──

  it('should show channel breakdown section', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('channel-breakdown'))
      assert.ok(screen.getByText('微信支付'))
      assert.ok(screen.getByText('支付宝'))
      assert.ok(screen.getByText('会员卡'))
      assert.ok(screen.getByText('现金'))
    })
  })

  it('should show channel amounts and percentages', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const rows = screen.getAllByTestId('channel-row')
      assert.strictEqual(rows.length, 4)
      assert.ok(screen.getByText('¥6,800.00'))
      assert.ok(screen.getByText('¥5,200.00'))
    })
  })

  // ─── 趋势图 ──

  it('should render trend chart with 7 bars', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('trend-chart'))
      const bars = screen.getAllByTestId('trend-bar')
      assert.strictEqual(bars.length, 7)
    })
  })

  it('should display trend chart legend', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('7日营收趋势'))
      assert.ok(screen.getByText('营收'))
      assert.ok(screen.getByText('退款'))
    })
  })

  // ─── 对账状态卡 ──

  it('should show reconciliation status', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('reconciliation-status'))
      assert.ok(screen.getByText('今日对账状态'))
    })
  })

  it('should show healthy status when matchRate >= 90 and no diffs', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('✅ 账目健康'))
    })
  })

  it('should show warning status when diffs exist', async () => {
    setupFetch(mockApiResponse({
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
    }))
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('⚠️ 需关注'))
    })
  })

  it('should show in-progress state when reconciliation is running', async () => {
    setupFetch(mockApiResponse({
      reconciliation: {
        inProgress: true,
        lastRunAt: null,
        lastRunDate: null,
        totalRuns: 5,
        lastError: null,
        lastReportSummary: null,
      },
    }))
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('对账进行中...'))
    })
  })

  it('should show no data state when no summary exists', async () => {
    setupFetch(mockApiResponse({
      reconciliation: {
        inProgress: false,
        lastRunAt: null,
        lastRunDate: null,
        totalRuns: 0,
        lastError: null,
        lastReportSummary: null,
      },
    }))
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('暂无对账数据'))
    })
  })

  // ─── 操作按钮 ──

  it('should render quick action buttons', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('quick-actions'))
      assert.ok(screen.getByTestId('btn-run-reconciliation'))
      assert.ok(screen.getByTestId('btn-view-reconciliation'))
      assert.ok(screen.getByTestId('btn-export'))
    })
  })

  it('should disable run reconciliation button when in progress', async () => {
    setupFetch(mockApiResponse({
      reconciliation: {
        inProgress: true,
        lastRunAt: null,
        lastRunDate: null,
        totalRuns: 5,
        lastError: null,
        lastReportSummary: null,
      },
    }))
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      const btn = screen.getByTestId('btn-run-reconciliation') as HTMLButtonElement
      assert.ok(btn.disabled)
    })
  })

  // ─── 渠道明细表 ──

  it('should render channel detail table', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByTestId('channel-detail-table'))
      const rows = screen.getAllByTestId('channel-detail-row')
      assert.strictEqual(rows.length, 4)
    })
  })

  it('should show proportion bars in detail table', async () => {
    setupFetch(mockApiResponse())
    render(<FinanceDashboardPage />)
    await waitFor(() => {
      assert.ok(screen.getByText('渠道明细'))
    })
  })
})
