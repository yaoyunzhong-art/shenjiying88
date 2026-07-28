'use client'

/**
 * Phase-42 T188: 报表详情页 (admin-web)
 *
 * 使用 @m5/ui 的 CombinedDetailPage 脚手架展示单份报表的
 * 基本信息、图表预览、数据表格。
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  WorkspaceBreadcrumb,
  DetailShell,
  CombinedDetailPage,
  DetailActionBar,
  StatCard,
  Spinner,
} from '@m5/ui'
import type { DetailInfoRow, DetailTab } from '@m5/ui'
import type { ReportResult, ReportTab } from '../reports-utils'
import { AdminPermissionGate } from '../../components/admin-permission-gate'

// ─── Mock Data ───────────────────────────────────────────

const MOCK_REPORTS: Record<string, ReportResult> = {
  'report-revenue-001': {
    type: 'revenue',
    tenantId: 'demo-tenant',
    period: { from: '2026-01-01', to: '2026-06-30' },
    columns: [
      { field: 'period', alias: '月份', type: 'dimension' },
      { field: 'revenue', alias: '营收(元)', type: 'metric' },
      { field: 'orders', alias: '订单数', type: 'metric' },
    ],
    rows: [
      { period: '2026-01', revenue: 580000, orders: 1200 },
      { period: '2026-02', revenue: 620000, orders: 1350 },
      { period: '2026-03', revenue: 710000, orders: 1520 },
      { period: '2026-04', revenue: 690000, orders: 1480 },
      { period: '2026-05', revenue: 835000, orders: 1710 },
      { period: '2026-06', revenue: 920000, orders: 1890 },
    ],
    totals: { period: '合计', revenue: 4355000, orders: 9150 },
    generatedAt: '2026-07-01T00:00:00Z',
    cached: false,
  },
  'report-product-001': {
    type: 'product-ranking',
    tenantId: 'demo-tenant',
    period: { from: '2026-06-01', to: '2026-06-30' },
    columns: [
      { field: 'sku', alias: 'SKU', type: 'dimension' },
      { field: 'name', alias: '商品名', type: 'dimension' },
      { field: 'soldQty', alias: '销量', type: 'metric' },
      { field: 'amountCents', alias: '销售额(分)', type: 'metric' },
    ],
    rows: [
      { sku: 'SKU-A001', name: '经典拿铁(大杯)', soldQty: 4520, amountCents: 18080000 },
      { sku: 'SKU-A002', name: '美式咖啡(中杯)', soldQty: 3810, amountCents: 11430000 },
      { sku: 'SKU-B001', name: '抹茶星冰乐', soldQty: 2930, amountCents: 13185000 },
      { sku: 'SKU-C001', name: '提拉米苏', soldQty: 1870, amountCents: 7480000 },
      { sku: 'SKU-D001', name: '三明治(火腿)', soldQty: 1560, amountCents: 6240000 },
    ],
    generatedAt: '2026-07-01T00:00:00Z',
    cached: false,
  },
}

interface ReportPageState {
  report: ReportResult | null
  loading: boolean
  error: string | null
}

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '报表详情访问受限',
  description:
    '报表详情页已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看指标概览、图表预览与导出数据表。',
} as const

// ─── Data Loader ─────────────────────────────────────────

async function loadReportDetail(id: string): Promise<ReportResult | null> {
  await new Promise((r) => setTimeout(r, 300))
  return MOCK_REPORTS[id] ?? null
}

// ─── Helpers ─────────────────────────────────────────────

function getReportTitle(report: ReportResult): string {
  switch (report.type) {
    case 'revenue': return '营收趋势报表'
    case 'product-ranking': return '商品销量排行'
    case 'payment-mix': return '支付方式占比'
    case 'hourly-heatmap': return '时段热力图'
    case 'order': return '订单转化漏斗'
    case 'inventory': return '库存周转报表'
    default: return `报表 ${report.type}`
  }
}

function getReportTab(type: string): ReportTab {
  if (['revenue'].includes(type)) return 'revenue'
  if (['product-ranking'].includes(type)) return 'product-ranking'
  if (['payment-mix'].includes(type)) return 'payment-mix'
  if (['hourly-heatmap'].includes(type)) return 'hourly-heatmap'
  if (['order'].includes(type)) return 'order'
  if (['inventory'].includes(type)) return 'inventory'
  return 'revenue'
}

// ─── Page Component ──────────────────────────────────────

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [state, setState] = useState<ReportPageState>({
    report: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))

    loadReportDetail(id).then((report) => {
      if (cancelled) return
      if (!report) {
        setState({ report: null, loading: false, error: '未找到该报表' })
      } else {
        setState({ report, loading: false, error: null })
      }
    })

    return () => { cancelled = true }
  }, [id])

  const handleExport = useCallback(async () => {
    if (!state.report) return ''
    const { serializeToCsv } = await import('@m5/ui')
    const csv = serializeToCsv(state.report.rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${getReportTitle(state.report)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    return csv
  }, [state.report])

  if (state.loading) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <DetailShell title="报表详情" loading>
        </DetailShell>
      </AdminPermissionGate>
    )
  }

  if (state.error || !state.report) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <DetailShell title="报表详情">
          <WorkspaceBreadcrumb
            workspaceLabel="报表中心"
            workspaceHref="/reports"
            detailLabel="报表详情"
          />
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-gray-500">
            <span className="text-5xl">📊</span>
            <p className="text-lg">{state.error ?? '报表不存在'}</p>
          </div>
        </DetailShell>
      </AdminPermissionGate>
    )
  }

  const { report } = state
  const title = getReportTitle(report)
  const tab = getReportTab(report.type)

  // Build info rows (with 'key' field required by DetailInfoRow)
  const infoRows: DetailInfoRow[] = [
    { key: 'type', label: '报表类型', value: title },
    { key: 'period', label: '统计周期', value: `${report.period.from} ~ ${report.period.to}` },
    { key: 'generatedAt', label: '生成时间', value: new Date(report.generatedAt).toLocaleString('zh-CN') },
    { key: 'cached', label: '数据缓存', value: report.cached ? '⚡ 缓存数据' : '实时数据' },
  ]

  // Build tabs
  const tabs: DetailTab[] = [
    {
      key: 'overview',
      label: '概览',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {report.columns
              .filter((c) => c.type === 'metric')
              .slice(0, 3)
              .map((col) => (
                <StatCard
                  key={col.field}
                  label={col.alias}
                  value={String(report.totals?.[col.field] ?? '-')}
                />
              ))}
          </div>
          <div
            id="report-chart"
            className="w-full h-[400px] bg-gray-50 rounded-lg border flex items-center justify-center"
          >
            <p className="text-gray-400 text-sm">
              📈 图表区域 (ChartId: {tab}) — 需集成 ECharts 时渲染
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'data',
      label: '数据表格',
      content: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              导出 CSV
            </button>
          </div>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {report.columns.map((col) => (
                    <th
                      key={col.field}
                      className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap"
                    >
                      {col.alias}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {report.columns.map((col) => (
                      <td key={col.field} className="px-4 py-2 text-gray-700 whitespace-nowrap">
                        {String(row[col.field] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
                {report.totals && (
                  <tr className="bg-gray-100 font-semibold">
                    {report.columns.map((col) => (
                      <td key={col.field} className="px-4 py-2 whitespace-nowrap">
                        {String(report.totals![col.field] ?? '-')}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
  ]

  return (
    <AdminPermissionGate {...permissionGate}>
      <DetailShell title={title} subtitle={`ID: ${id} · ${report.period.from} ~ ${report.period.to}`}>
        <WorkspaceBreadcrumb
          workspaceLabel="报表中心"
          workspaceHref="/reports"
          detailLabel={title}
        />

        <DetailActionBar
          actions={[
            { key: 'back', label: '返回列表', onClick: () => router.push('/reports'), variant: 'default' as const },
          ]}
        />

        <CombinedDetailPage
          title={title}
          subtitle={`ID: ${id} · ${report.period.from} ~ ${report.period.to}`}
          infoRows={infoRows}
          tabs={tabs}
          backHref="/reports"
        />
      </DetailShell>
    </AdminPermissionGate>
  )
}
