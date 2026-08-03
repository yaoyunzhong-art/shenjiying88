'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState } from 'react'
import type { AnalyticsV2SnapshotDelivery, CohortMatrix, MetricCard } from './analytics-v2-data'

function computePeriodComparison(cohorts: CohortMatrix[]) {
  if (cohorts.length < 2) {
    return { previousPeriod: 'N/A', currentPeriod: 'N/A', dauChange: 0 }
  }
  const previous = cohorts[cohorts.length - 2]
  const current = cohorts[cohorts.length - 1]
  return {
    previousPeriod: previous.cohort,
    currentPeriod: current.cohort,
    dauChange: Math.round(((current.size - previous.size) / previous.size) * 100),
  }
}

function formatMetric(metric: MetricCard) {
  if (metric.unit === 'cents') return `¥${(metric.value / 100).toFixed(2)}`
  if (metric.unit === 'ratio') return `${(metric.value * 100).toFixed(1)}%`
  return metric.value.toLocaleString()
}

export default function AnalyticsV2Client({
  snapshot,
}: {
  snapshot: AnalyticsV2SnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  const periodComparison = useMemo(() => computePeriodComparison(snapshot.cohorts), [snapshot.cohorts])

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>数据分析工作台</h1>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Tenant: {snapshot.tenantId} · Delivery {snapshot.deliveryMode} · generatedAt {snapshot.generatedAt}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['1d', '7d', '30d'].map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: selectedPeriod === period ? '#2563eb' : '#fff',
                color: selectedPeriod === period ? '#fff' : '#374151',
              }}
            >
              {period}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
        {snapshot.summary.metrics.map((metric) => (
          <article key={metric.name} style={{ padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{metric.name}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{formatMetric(metric)}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{metric.trend ?? 'STABLE'}</div>
          </article>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
        <article style={{ padding: 16, borderRadius: 12, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#166534' }}>DAU 变化</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{periodComparison.dauChange}%</div>
          <div style={{ fontSize: 11, color: '#166534' }}>
            {periodComparison.previousPeriod} → {periodComparison.currentPeriod}
          </div>
        </article>
        <article style={{ padding: 16, borderRadius: 12, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#1d4ed8' }}>CDC 状态</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{snapshot.cdcStatus.events}</div>
          <div style={{ fontSize: 11, color: '#1d4ed8' }}>watermark {snapshot.cdcStatus.currentWatermark}</div>
        </article>
        <article style={{ padding: 16, borderRadius: 12, background: '#fefce8' }}>
          <div style={{ fontSize: 12, color: '#a16207' }}>留存健康度</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{snapshot.retentionHealth.score}</div>
          <div style={{ fontSize: 11, color: '#a16207' }}>{snapshot.retentionHealth.level}</div>
        </article>
      </section>

      <section style={{ marginBottom: 24, padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Cohort 留存矩阵</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingBottom: 8 }}>Cohort</th>
              <th style={{ textAlign: 'right', paddingBottom: 8 }}>Size</th>
              <th style={{ textAlign: 'right', paddingBottom: 8 }}>D1</th>
              <th style={{ textAlign: 'right', paddingBottom: 8 }}>D7</th>
              <th style={{ textAlign: 'right', paddingBottom: 8 }}>D30</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.cohorts.map((cohort) => (
              <tr key={cohort.cohort}>
                <td style={{ padding: '8px 0' }}>{cohort.cohort}</td>
                <td style={{ textAlign: 'right' }}>{cohort.size}</td>
                <td style={{ textAlign: 'right' }}>{(cohort.retention[1] * 100).toFixed(0)}%</td>
                <td style={{ textAlign: 'right' }}>{(cohort.retention[2] * 100).toFixed(0)}%</td>
                <td style={{ textAlign: 'right' }}>{(cohort.retention[3] * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
        <article style={{ padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>漏斗转化分析</h2>
          {snapshot.funnels[0].stepResults.map((step) => (
            <div key={step.stepName} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{step.stepName}</span>
                <span>{step.enteredCount.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                转化 {(step.conversionRate * 100).toFixed(1)}% · 流失 {(step.dropOffRate * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </article>
        <article style={{ padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>留存建议</h2>
          {snapshot.retentionHealth.recommendations.map((item) => (
            <div key={item} style={{ marginBottom: 8 }}>
              {item}
            </div>
          ))}
        </article>
      </section>

      <section style={{ padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>实时事件流</h2>
        {snapshot.recentEvents.map((event) => (
          <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
            <span>
              {event.type} · {event.what}
            </span>
            <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
