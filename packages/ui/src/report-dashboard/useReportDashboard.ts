/**
 * 报表/看板 - Hooks (V10 Day 7)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ReportDefinition, ReportQueryResponse, DashboardLayout, ReportPeriod,
} from './types'

const MOCK_DELAY = 80
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ============ Mock 数据 ============

const MOCK_REPORTS: ReportDefinition[] = [
  {
    id: 'rpt-sales', name: '销售日报', period: 'daily',
    metrics: ['sales.amount', 'sales.count'], dimensions: ['store'],
    source: 'orders', cacheTtl: 60, createdBy: 'system',
    createdAt: '2026-06-28T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z',
  },
  {
    id: 'rpt-member', name: '会员周报', period: 'weekly',
    metrics: ['member.new', 'member.active'], dimensions: ['member_tier'],
    source: 'members', cacheTtl: 300, createdBy: 'system',
    createdAt: '2026-06-28T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z',
  },
  {
    id: 'rpt-ai', name: 'AI 使用', period: 'daily',
    metrics: ['ai.tokens', 'ai.latency'], dimensions: ['store'],
    source: 'ai_logs', cacheTtl: 30, createdBy: 'system',
    createdAt: '2026-06-28T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z',
  },
]

function genMockData(reportId: string, period: ReportPeriod): ReportQueryResponse {
  const today = new Date()
  const data = []
  for (let day = 0; day < 7; day++) {
    const d = new Date(today)
    d.setDate(d.getDate() - day)
    const dateStr = d.toISOString().slice(0, 10)
    for (const store of ['store-001', 'store-002', 'store-003']) {
      const metric = reportId === 'rpt-sales' ? 'sales.amount' :
                     reportId === 'rpt-ai' ? 'ai.tokens' : 'member.new'
      data.push({
        bucket: dateStr, dimension: store, metric: metric as any,
        value: metric === 'sales.amount' ? 50000 + Math.floor(Math.random() * 30000) :
               metric === 'ai.tokens' ? 10000 + Math.floor(Math.random() * 5000) :
               50 + Math.floor(Math.random() * 30),
      })
    }
  }
  return {
    reportId, period, generatedAt: new Date().toISOString(),
    data, totalPoints: data.length,
  }
}

const MOCK_DASHBOARDS: DashboardLayout[] = [
  {
    id: 'dash-overview', name: '总览看板',
    cards: [
      { id: 'c1', reportId: 'rpt-sales', display: 'number', title: '今日销售额',
        size: { w: 3, h: 2 }, position: { x: 0, y: 0 } },
      { id: 'c2', reportId: 'rpt-sales', display: 'line', title: '销售趋势',
        size: { w: 6, h: 4 }, position: { x: 3, y: 0 } },
      { id: 'c3', reportId: 'rpt-ai', display: 'bar', title: 'AI 使用',
        size: { w: 3, h: 4 }, position: { x: 9, y: 0 } },
    ],
    ownerId: 'tenant-A', isShared: true,
    createdAt: '2026-06-28T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z',
  },
]

async function fetchReportsApi(): Promise<ReportDefinition[]> {
  await delay(MOCK_DELAY); return MOCK_REPORTS
}
async function fetchReportDataApi(reportId: string, period: ReportPeriod): Promise<ReportQueryResponse> {
  await delay(MOCK_DELAY); return genMockData(reportId, period)
}
async function fetchDashboardsApi(): Promise<DashboardLayout[]> {
  await delay(MOCK_DELAY); return MOCK_DASHBOARDS
}

// ============ Hooks ============

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: fetchReportsApi,
    staleTime: 60 * 1000,
  })
}

export function useReportData(reportId: string, period: ReportPeriod = 'daily') {
  return useQuery({
    queryKey: ['report-data', reportId, period],
    queryFn: () => fetchReportDataApi(reportId, period),
    enabled: !!reportId,
    staleTime: 30 * 1000,
  })
}

export function useDashboards() {
  return useQuery({
    queryKey: ['dashboards'],
    queryFn: fetchDashboardsApi,
    staleTime: 60 * 1000,
  })
}

export function useCreateDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>) => {
      await delay(MOCK_DELAY)
      const now = new Date().toISOString()
      return {
        ...input, id: `dash-${Date.now()}`,
        createdAt: now, updatedAt: now,
      } as DashboardLayout
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboards'] }),
  })
}
