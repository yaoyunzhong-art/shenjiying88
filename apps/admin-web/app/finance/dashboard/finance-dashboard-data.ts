export interface RevenueSummary {
  totalRevenueCents: number
  totalRefundCents: number
  netIncomeCents: number
  transactionCount: number
  date: string
}

export interface ChannelBreakdown {
  wechatCents: number
  alipayCents: number
  memberCardCents: number
  cashCents: number
  totalCents: number
}

export interface DailyTrendPoint {
  date: string
  revenueCents: number
  refundCents: number
  netCents: number
}

export interface ReconciliationStatus {
  inProgress: boolean
  lastRunAt: string | null
  lastRunDate: string | null
  totalRuns: number
  lastError: string | null
  lastReportSummary: {
    date: string
    matchedCount: number
    exactMatchCount: number
    totalDiffCents: number
    matchRate: number
  } | null
}

export interface CostAnalysisData {
  totalCostCents: number
  categories: Array<{
    category: string
    amountCents: number
    count: number
    percentage: number
  }>
  monthOverMonthChange: number
  yearOverYearChange: number
}

export interface DashboardData {
  revenue: RevenueSummary
  channels: ChannelBreakdown
  trend: DailyTrendPoint[]
  reconciliation: ReconciliationStatus
  costAnalysis: CostAnalysisData | null
  profit: {
    storeProfit: number
    storeMargin: number
    brandProfit: number
    brandRevenue: number
    brandCost: number
  }
}

export interface FinanceDashboardSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  dashboard: DashboardData
  generatedAt: string
  error?: string
}

export const defaultFinanceDashboard: DashboardData = {
  revenue: {
    totalRevenueCents: 1580000,
    totalRefundCents: 50000,
    netIncomeCents: 1530000,
    transactionCount: 42,
    date: '2026-07-25',
  },
  channels: {
    wechatCents: 680000,
    alipayCents: 520000,
    memberCardCents: 280000,
    cashCents: 100000,
    totalCents: 1580000,
  },
  trend: [
    { date: '2026-07-19', revenueCents: 1200000, refundCents: 30000, netCents: 1170000 },
    { date: '2026-07-20', revenueCents: 1450000, refundCents: 20000, netCents: 1430000 },
    { date: '2026-07-21', revenueCents: 1100000, refundCents: 10000, netCents: 1090000 },
    { date: '2026-07-22', revenueCents: 1350000, refundCents: 40000, netCents: 1310000 },
    { date: '2026-07-23', revenueCents: 1600000, refundCents: 25000, netCents: 1575000 },
    { date: '2026-07-24', revenueCents: 1520000, refundCents: 35000, netCents: 1485000 },
    { date: '2026-07-25', revenueCents: 1580000, refundCents: 50000, netCents: 1530000 },
  ],
  reconciliation: {
    inProgress: false,
    lastRunAt: '2026-07-25T10:00:00.000Z',
    lastRunDate: '2026-07-25',
    totalRuns: 5,
    lastError: null,
    lastReportSummary: {
      date: '2026-07-25',
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
      { category: '人力成本', amountCents: 180000, count: 8, percentage: 31 },
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
}

import { apiFetchJson } from '../../api/_client'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveFinanceDashboardApiBaseUrl(): string {
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

async function fetchFinanceDashboard(): Promise<DashboardData> {
  const upstreamUrl = new URL('finance/dashboard', resolveFinanceDashboardApiBaseUrl())
  return apiFetchJson<DashboardData>(upstreamUrl.toString())
}

export async function loadFinanceDashboardSnapshot(): Promise<FinanceDashboardSnapshotDelivery> {
  try {
    const dashboard = await fetchFinanceDashboard()
    return {
      deliveryMode: 'api',
      dashboard,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      dashboard: defaultFinanceDashboard,
      generatedAt: defaultFinanceDashboard.reconciliation.lastRunAt ?? defaultFinanceDashboard.revenue.date,
      error: '财务仪表盘实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
