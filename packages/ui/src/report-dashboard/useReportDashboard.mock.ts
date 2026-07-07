/**
 * useReportDashboard Mock (V10 Day 7)
 */

import type { ReportDefinition, DashboardLayout, ReportPeriod, ReportQueryResponse } from './types'

const MOCK_REPORTS: ReportDefinition[] = [
  { id: 'rpt-sales', name: '销售日报', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'system', createdAt: '2026-06-28', updatedAt: '2026-06-28' },
  { id: 'rpt-member', name: '会员周报', period: 'weekly', metrics: ['member.new'], dimensions: ['member_tier'], source: 'members', cacheTtl: 300, createdBy: 'system', createdAt: '2026-06-28', updatedAt: '2026-06-28' },
  { id: 'rpt-ai', name: 'AI 使用', period: 'daily', metrics: ['ai.tokens'], dimensions: ['store'], source: 'ai_logs', cacheTtl: 30, createdBy: 'system', createdAt: '2026-06-28', updatedAt: '2026-06-28' },
]

const MOCK_DASHBOARDS: DashboardLayout[] = [
  {
    id: 'dash-overview', name: '总览看板', isShared: true, ownerId: 'tenant-A',
    createdAt: '2026-06-28', updatedAt: '2026-06-28',
    cards: [
      { id: 'c1', reportId: 'rpt-sales', display: 'number', title: '今日销售额', size: { w: 3, h: 2 }, position: { x: 0, y: 0 } },
      { id: 'c2', reportId: 'rpt-sales', display: 'line', title: '销售趋势', size: { w: 6, h: 4 }, position: { x: 3, y: 0 } },
      { id: 'c3', reportId: 'rpt-ai', display: 'bar', title: 'AI 使用', size: { w: 3, h: 4 }, position: { x: 9, y: 0 } },
    ],
  },
]

function genData(reportId: string, period: ReportPeriod): ReportQueryResponse {
  const data = []
  for (let day = 0; day < 7; day++) {
    const d = new Date()
    d.setDate(d.getDate() - day)
    const dateStr = d.toISOString().slice(0, 10)
    for (const store of ['store-001', 'store-002', 'store-003']) {
      data.push({
        bucket: dateStr, dimension: store,
        metric: (reportId === 'rpt-ai' ? 'ai.tokens' : 'sales.amount') as any,
        value: 5000 + Math.floor(Math.random() * 1000),
      })
    }
  }
  return { reportId, period, generatedAt: new Date().toISOString(), data, totalPoints: data.length }
}

export function useReports() {
  return { data: MOCK_REPORTS, isLoading: false }
}

export function useReportData(reportId: string, period: ReportPeriod = 'daily') {
  return { data: reportId ? genData(reportId, period) : null, isLoading: false }
}

export function useDashboards() {
  return { data: MOCK_DASHBOARDS, isLoading: false }
}

export function useCreateDashboard() {
  return { mutate: () => undefined, mutateAsync: async () => MOCK_DASHBOARDS[0], isPending: false }
}
