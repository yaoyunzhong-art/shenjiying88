export interface PnLLineItem {
  category: string
  label: string
  thisMonthCents: number
  lastMonthCents: number
  budgetCents: number
  children?: PnLLineItem[]
}

export interface PnLReport {
  date: string
  periodLabel: string
  items: PnLLineItem[]
  tenantId: string
  generatedAt: string
}

export type PeriodKey = 'thisMonth' | 'lastMonth' | 'quarter' | 'year'

type PeriodDataMap = Record<PeriodKey, { items: PnLLineItem[]; periodLabel: string }>

export interface ProfitLossSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  selectedPeriod: PeriodKey
  report: PnLReport
  generatedAt: string
  error?: string
}

export const periodDataMap: PeriodDataMap = {
  thisMonth: {
    periodLabel: '2026年7月 (截至7月18日)',
    items: [
      {
        category: 'revenue',
        label: '营业收入',
        thisMonthCents: 456000000,
        lastMonthCents: 412000000,
        budgetCents: 500000000,
        children: [
          {
            category: 'revenue',
            label: '门票收入',
            thisMonthCents: 128000000,
            lastMonthCents: 115000000,
            budgetCents: 140000000,
          },
          {
            category: 'revenue',
            label: '游戏币收入',
            thisMonthCents: 185000000,
            lastMonthCents: 168000000,
            budgetCents: 200000000,
          },
          {
            category: 'revenue',
            label: '餐饮收入',
            thisMonthCents: 89000000,
            lastMonthCents: 82000000,
            budgetCents: 95000000,
          },
          {
            category: 'revenue',
            label: '其他收入',
            thisMonthCents: 54000000,
            lastMonthCents: 47000000,
            budgetCents: 65000000,
          },
        ],
      },
      {
        category: 'cost',
        label: '营业成本',
        thisMonthCents: 228000000,
        lastMonthCents: 206000000,
        budgetCents: 250000000,
        children: [
          {
            category: 'cost',
            label: '设备折旧',
            thisMonthCents: 45000000,
            lastMonthCents: 45000000,
            budgetCents: 45000000,
          },
          {
            category: 'cost',
            label: '游戏币成本',
            thisMonthCents: 82000000,
            lastMonthCents: 75000000,
            budgetCents: 90000000,
          },
          {
            category: 'cost',
            label: '原材料成本',
            thisMonthCents: 56000000,
            lastMonthCents: 50000000,
            budgetCents: 60000000,
          },
          {
            category: 'cost',
            label: '其他成本',
            thisMonthCents: 45000000,
            lastMonthCents: 36000000,
            budgetCents: 55000000,
          },
        ],
      },
      {
        category: 'expense',
        label: '运营费用',
        thisMonthCents: 128000000,
        lastMonthCents: 115000000,
        budgetCents: 140000000,
        children: [
          {
            category: 'expense',
            label: '人工成本',
            thisMonthCents: 72000000,
            lastMonthCents: 68000000,
            budgetCents: 75000000,
          },
          {
            category: 'expense',
            label: '场地租金',
            thisMonthCents: 35000000,
            lastMonthCents: 32000000,
            budgetCents: 35000000,
          },
          {
            category: 'expense',
            label: '水电物业',
            thisMonthCents: 12000000,
            lastMonthCents: 10000000,
            budgetCents: 15000000,
          },
          {
            category: 'expense',
            label: '营销费用',
            thisMonthCents: 9000000,
            lastMonthCents: 5000000,
            budgetCents: 15000000,
          },
        ],
      },
      {
        category: 'profit',
        label: '净利润',
        thisMonthCents: 100000000,
        lastMonthCents: 91000000,
        budgetCents: 110000000,
        children: [],
      },
    ],
  },
  lastMonth: {
    periodLabel: '2026年6月',
    items: [
      {
        category: 'revenue',
        label: '营业收入',
        thisMonthCents: 412000000,
        lastMonthCents: 380000000,
        budgetCents: 450000000,
        children: [
          {
            category: 'revenue',
            label: '门票收入',
            thisMonthCents: 115000000,
            lastMonthCents: 105000000,
            budgetCents: 130000000,
          },
          {
            category: 'revenue',
            label: '游戏币收入',
            thisMonthCents: 168000000,
            lastMonthCents: 155000000,
            budgetCents: 180000000,
          },
          {
            category: 'revenue',
            label: '餐饮收入',
            thisMonthCents: 82000000,
            lastMonthCents: 75000000,
            budgetCents: 90000000,
          },
          {
            category: 'revenue',
            label: '其他收入',
            thisMonthCents: 47000000,
            lastMonthCents: 45000000,
            budgetCents: 50000000,
          },
        ],
      },
      {
        category: 'cost',
        label: '营业成本',
        thisMonthCents: 206000000,
        lastMonthCents: 190000000,
        budgetCents: 220000000,
        children: [
          {
            category: 'cost',
            label: '设备折旧',
            thisMonthCents: 45000000,
            lastMonthCents: 45000000,
            budgetCents: 45000000,
          },
          {
            category: 'cost',
            label: '游戏币成本',
            thisMonthCents: 75000000,
            lastMonthCents: 70000000,
            budgetCents: 80000000,
          },
          {
            category: 'cost',
            label: '原材料成本',
            thisMonthCents: 50000000,
            lastMonthCents: 45000000,
            budgetCents: 55000000,
          },
          {
            category: 'cost',
            label: '其他成本',
            thisMonthCents: 36000000,
            lastMonthCents: 30000000,
            budgetCents: 40000000,
          },
        ],
      },
      {
        category: 'expense',
        label: '运营费用',
        thisMonthCents: 115000000,
        lastMonthCents: 110000000,
        budgetCents: 130000000,
        children: [
          {
            category: 'expense',
            label: '人工成本',
            thisMonthCents: 68000000,
            lastMonthCents: 65000000,
            budgetCents: 72000000,
          },
          {
            category: 'expense',
            label: '场地租金',
            thisMonthCents: 32000000,
            lastMonthCents: 30000000,
            budgetCents: 35000000,
          },
          {
            category: 'expense',
            label: '水电物业',
            thisMonthCents: 10000000,
            lastMonthCents: 9000000,
            budgetCents: 12000000,
          },
          {
            category: 'expense',
            label: '营销费用',
            thisMonthCents: 5000000,
            lastMonthCents: 6000000,
            budgetCents: 8000000,
          },
        ],
      },
      {
        category: 'profit',
        label: '净利润',
        thisMonthCents: 91000000,
        lastMonthCents: 80000000,
        budgetCents: 100000000,
        children: [],
      },
    ],
  },
  quarter: {
    periodLabel: '2026年Q2 (4月-6月)',
    items: [
      {
        category: 'revenue',
        label: '营业收入',
        thisMonthCents: 1350000000,
        lastMonthCents: 1200000000,
        budgetCents: 1500000000,
        children: [
          {
            category: 'revenue',
            label: '门票收入',
            thisMonthCents: 380000000,
            lastMonthCents: 340000000,
            budgetCents: 420000000,
          },
          {
            category: 'revenue',
            label: '游戏币收入',
            thisMonthCents: 550000000,
            lastMonthCents: 500000000,
            budgetCents: 600000000,
          },
          {
            category: 'revenue',
            label: '餐饮收入',
            thisMonthCents: 260000000,
            lastMonthCents: 240000000,
            budgetCents: 290000000,
          },
          {
            category: 'revenue',
            label: '其他收入',
            thisMonthCents: 160000000,
            lastMonthCents: 120000000,
            budgetCents: 190000000,
          },
        ],
      },
      {
        category: 'cost',
        label: '营业成本',
        thisMonthCents: 680000000,
        lastMonthCents: 600000000,
        budgetCents: 750000000,
        children: [
          {
            category: 'cost',
            label: '设备折旧',
            thisMonthCents: 135000000,
            lastMonthCents: 135000000,
            budgetCents: 135000000,
          },
          {
            category: 'cost',
            label: '游戏币成本',
            thisMonthCents: 245000000,
            lastMonthCents: 220000000,
            budgetCents: 270000000,
          },
          {
            category: 'cost',
            label: '原材料成本',
            thisMonthCents: 165000000,
            lastMonthCents: 150000000,
            budgetCents: 180000000,
          },
          {
            category: 'cost',
            label: '其他成本',
            thisMonthCents: 135000000,
            lastMonthCents: 95000000,
            budgetCents: 165000000,
          },
        ],
      },
      {
        category: 'expense',
        label: '运营费用',
        thisMonthCents: 380000000,
        lastMonthCents: 350000000,
        budgetCents: 420000000,
        children: [
          {
            category: 'expense',
            label: '人工成本',
            thisMonthCents: 215000000,
            lastMonthCents: 200000000,
            budgetCents: 225000000,
          },
          {
            category: 'expense',
            label: '场地租金',
            thisMonthCents: 105000000,
            lastMonthCents: 95000000,
            budgetCents: 105000000,
          },
          {
            category: 'expense',
            label: '水电物业',
            thisMonthCents: 36000000,
            lastMonthCents: 30000000,
            budgetCents: 45000000,
          },
          {
            category: 'expense',
            label: '营销费用',
            thisMonthCents: 24000000,
            lastMonthCents: 25000000,
            budgetCents: 45000000,
          },
        ],
      },
      {
        category: 'profit',
        label: '净利润',
        thisMonthCents: 290000000,
        lastMonthCents: 250000000,
        budgetCents: 330000000,
        children: [],
      },
    ],
  },
  year: {
    periodLabel: '2026年累计 (1月-7月)',
    items: [
      {
        category: 'revenue',
        label: '营业收入',
        thisMonthCents: 2890000000,
        lastMonthCents: 2450000000,
        budgetCents: 3600000000,
        children: [
          {
            category: 'revenue',
            label: '门票收入',
            thisMonthCents: 820000000,
            lastMonthCents: 700000000,
            budgetCents: 1000000000,
          },
          {
            category: 'revenue',
            label: '游戏币收入',
            thisMonthCents: 1180000000,
            lastMonthCents: 980000000,
            budgetCents: 1450000000,
          },
          {
            category: 'revenue',
            label: '餐饮收入',
            thisMonthCents: 560000000,
            lastMonthCents: 480000000,
            budgetCents: 700000000,
          },
          {
            category: 'revenue',
            label: '其他收入',
            thisMonthCents: 330000000,
            lastMonthCents: 290000000,
            budgetCents: 450000000,
          },
        ],
      },
      {
        category: 'cost',
        label: '营业成本',
        thisMonthCents: 1420000000,
        lastMonthCents: 1200000000,
        budgetCents: 1800000000,
        children: [
          {
            category: 'cost',
            label: '设备折旧',
            thisMonthCents: 315000000,
            lastMonthCents: 270000000,
            budgetCents: 315000000,
          },
          {
            category: 'cost',
            label: '游戏币成本',
            thisMonthCents: 520000000,
            lastMonthCents: 450000000,
            budgetCents: 650000000,
          },
          {
            category: 'cost',
            label: '原材料成本',
            thisMonthCents: 350000000,
            lastMonthCents: 300000000,
            budgetCents: 430000000,
          },
          {
            category: 'cost',
            label: '其他成本',
            thisMonthCents: 235000000,
            lastMonthCents: 180000000,
            budgetCents: 405000000,
          },
        ],
      },
      {
        category: 'expense',
        label: '运营费用',
        thisMonthCents: 820000000,
        lastMonthCents: 700000000,
        budgetCents: 980000000,
        children: [
          {
            category: 'expense',
            label: '人工成本',
            thisMonthCents: 460000000,
            lastMonthCents: 410000000,
            budgetCents: 520000000,
          },
          {
            category: 'expense',
            label: '场地租金',
            thisMonthCents: 220000000,
            lastMonthCents: 190000000,
            budgetCents: 245000000,
          },
          {
            category: 'expense',
            label: '水电物业',
            thisMonthCents: 75000000,
            lastMonthCents: 58000000,
            budgetCents: 105000000,
          },
          {
            category: 'expense',
            label: '营销费用',
            thisMonthCents: 65000000,
            lastMonthCents: 42000000,
            budgetCents: 110000000,
          },
        ],
      },
      {
        category: 'profit',
        label: '净利润',
        thisMonthCents: 650000000,
        lastMonthCents: 550000000,
        budgetCents: 820000000,
        children: [],
      },
    ],
  },
}

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveProfitLossApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

export function normalizePeriodKey(period?: string): PeriodKey {
  if (period === 'lastMonth' || period === 'quarter' || period === 'year' || period === 'thisMonth') {
    return period
  }
  return 'thisMonth'
}

export function getDefaultProfitLossReport(period: PeriodKey): PnLReport {
  const data = periodDataMap[period]
  return {
    date: '2026-07-18',
    periodLabel: data.periodLabel,
    items: data.items,
    tenantId: 't1',
    generatedAt: '2026-07-18T22:00:00Z',
  }
}

async function fetchProfitLossReport(period: PeriodKey): Promise<PnLReport> {
  const upstreamUrl = new URL('finance/pnl', resolveProfitLossApiBaseUrl())
  upstreamUrl.searchParams.set('period', period)

  const response = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`profit-loss upstream failed: ${response.status}`)
  }

  const payload = await response.json()
  return unwrapApiPayload<PnLReport>(payload)
}

export async function loadProfitLossSnapshot(period?: string): Promise<ProfitLossSnapshotDelivery> {
  const selectedPeriod = normalizePeriodKey(period)

  try {
    const report = await fetchProfitLossReport(selectedPeriod)
    return {
      deliveryMode: 'api',
      selectedPeriod,
      generatedAt: report.generatedAt || new Date().toISOString(),
      report,
    }
  } catch {
    const report = getDefaultProfitLossReport(selectedPeriod)
    return {
      deliveryMode: 'fallback',
      selectedPeriod,
      generatedAt: report.generatedAt,
      report,
      error: '损益表实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
