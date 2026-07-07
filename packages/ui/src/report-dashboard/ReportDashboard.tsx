/**
 * 报表/看板 - Panel (V10 Day 7 Phase 91)
 */

import React, { useState } from 'react'
import { useReports, useReportData, useDashboards } from './useReportDashboard'
import {
  METRIC_LABELS, METRIC_UNITS, DISPLAY_LABELS,
  type CardDisplay, type ReportMetric, type DashboardCard, type ReportDataPoint,
} from './types'

export interface ReportDashboardProps {
  defaultDashboardId?: string
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  readOnly?: boolean
}

export function ReportDashboard({
  defaultDashboardId = 'dash-overview',
  variant = 'pc',
  readOnly = false,
}: ReportDashboardProps) {
  const [activeReportId, setActiveReportId] = useState<string | null>(null)
  const { data: reports = [] } = useReports()
  const { data: dashboards = [] } = useDashboards()

  const dashboard = dashboards.find((d) => d.id === defaultDashboardId) ?? dashboards[0]

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'

  return (
    <div
      data-testid="report-dashboard"
      data-variant={variant}
      data-readonly={readOnly}
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: isCompact ? 12 : 20,
        background: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: isCompact ? 18 : 24, margin: '0 0 16px' }}>
        {dashboard?.name ?? '报表看板'}
      </h1>

      {/* 报表列表 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <ReportTab
          active={!activeReportId}
          onClick={() => setActiveReportId(null)}
          label="全部"
        />
        {reports.map((r) => (
          <ReportTab
            key={r.id}
            active={activeReportId === r.id}
            onClick={() => setActiveReportId(r.id)}
            label={r.name}
          />
        ))}
      </div>

      {/* 看板卡片网格 */}
      {dashboard && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '1fr' : 'repeat(12, 1fr)',
            gap: 12,
          }}
        >
          {dashboard.cards.map((card) => {
            const span = isCompact ? 1 : card.size.w
            const cardHeight = card.size.h * 60
            return (
              <div
                key={card.id}
                style={{
                  gridColumn: `span ${span}`,
                  minHeight: cardHeight,
                  background: '#fff',
                  borderRadius: 8,
                  padding: isCompact ? 12 : 16,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <DashboardCardView card={card} />
              </div>
            )
          })}
        </div>
      )}

      {/* 报表详情 */}
      {activeReportId && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 8, padding: 16 }}>
          <ReportDetail reportId={activeReportId} />
        </div>
      )}
    </div>
  )
}

// ============ 子组件 ============

function ReportTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`report-tab-${label}`}
      data-active={active}
      style={{
        padding: '6px 14px',
        fontSize: 13,
        border: '1px solid #d9d9d9',
        borderRadius: 16,
        background: active ? '#1677ff' : '#fff',
        color: active ? '#fff' : '#595959',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function DashboardCardView({ card }: { card: DashboardCard }) {
  const { data, isLoading } = useReportData(card.reportId, 'daily')

  const total = data?.data
    ?.filter((d) => d.dimension.startsWith('store-'))
    .reduce((sum, d) => sum + d.value, 0) ?? 0

  if (isLoading) return <div data-testid={`card-loading-${card.id}`}>加载中...</div>

  return (
    <div data-testid={`dashboard-card-${card.id}`} data-display={card.display}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontSize: 14, color: '#262626' }}>{card.title}</strong>
        <span style={{ fontSize: 11, color: '#8c8c8c', background: '#f0f0f0', padding: '2px 8px', borderRadius: 10 }}>
          {DISPLAY_LABELS[card.display]}
        </span>
      </div>
      {card.display === 'number' && (
        <div data-testid={`card-number-${card.id}`} style={{ fontSize: 32, fontWeight: 700, color: '#1677ff' }}>
          {total.toLocaleString()}
        </div>
      )}
      {card.display === 'line' && <LineChartPreview points={data?.data ?? []} />}
      {card.display === 'bar' && <BarChartPreview points={data?.data ?? []} />}
      {card.display === 'pie' && <div>饼图占位</div>}
      {card.display === 'table' && <TablePreview points={data?.data ?? []} />}
      {card.display === 'heatmap' && <div>热力图占位</div>}
    </div>
  )
}

function LineChartPreview({ points }: { points: ReportDataPoint[] }) {
  if (points.length === 0) return <div style={{ color: '#8c8c8c' }}>暂无数据</div>
  const max = Math.max(...points.map((p) => p.value))
  const min = Math.min(...points.map((p) => p.value))
  const range = max - min || 1
  const w = 100
  const h = 40
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w
    const y = h - ((p.value - min) / range) * h
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg
      data-testid="line-chart-preview"
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: 120 }}
    >
      <path d={path} stroke="#1677ff" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function BarChartPreview({ points }: { points: ReportDataPoint[] }) {
  if (points.length === 0) return <div style={{ color: '#8c8c8c' }}>暂无数据</div>
  const max = Math.max(...points.map((p) => p.value))
  return (
    <div data-testid="bar-chart-preview" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
      {points.slice(0, 12).map((p, i) => (
        <div
          key={i}
          data-testid={`bar-${i}`}
          style={{
            flex: 1,
            background: '#1677ff',
            height: `${(p.value / max) * 100}%`,
            minHeight: 4,
            borderRadius: 2,
          }}
          title={`${p.dimension}: ${p.value}`}
        />
      ))}
    </div>
  )
}

function TablePreview({ points }: { points: ReportDataPoint[] }) {
  const rows = points.slice(0, 5)
  return (
    <table data-testid="table-preview" style={{ width: '100%', fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
          <th style={{ textAlign: 'left', padding: 4 }}>维度</th>
          <th style={{ textAlign: 'right', padding: 4 }}>值</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #fafafa' }}>
            <td style={{ padding: 4 }}>{p.dimension}</td>
            <td style={{ textAlign: 'right', padding: 4 }}>{p.value.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ReportDetail({ reportId }: { reportId: string }) {
  const { data, isLoading } = useReportData(reportId, 'daily')
  if (isLoading) return <div>加载中...</div>
  if (!data) return <div>暂无数据</div>

  const byMetric = new Map<ReportMetric, ReportDataPoint[]>()
  for (const dp of data.data) {
    if (!byMetric.has(dp.metric)) byMetric.set(dp.metric, [])
    byMetric.get(dp.metric)!.push(dp)
  }

  return (
    <div data-testid={`report-detail-${reportId}`}>
      <h3 style={{ marginTop: 0 }}>报表详情 ({data.totalPoints} 个数据点)</h3>
      {Array.from(byMetric.entries()).map(([metric, dps]) => (
        <div key={metric} style={{ marginBottom: 16 }}>
          <strong>{METRIC_LABELS[metric]}</strong>
          <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 12 }}>
            共 {dps.length} 条 · 单位 {METRIC_UNITS[metric]}
          </span>
        </div>
      ))}
    </div>
  )
}
