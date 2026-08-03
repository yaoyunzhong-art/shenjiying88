'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'

import type { SalesComparisonPeriod, SalesComparisonSnapshot } from './sales-comparison-data'

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.55)',
  padding: 16,
}

function formatMetric(value: number, unit: SalesComparisonSnapshot['records'][number]['unit']) {
  if (unit === 'currency') {
    return `¥${value.toLocaleString()}`
  }

  if (unit === 'percent') {
    return `${value}%`
  }

  return value.toLocaleString()
}

function formatGrowth(current: number, previous: number) {
  if (previous === 0) {
    return '0.0%'
  }

  const delta = ((current - previous) / previous) * 100
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
}

export default function SalesComparisonClient({ snapshot }: { snapshot: SalesComparisonSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [period, setPeriod] = useState<'all' | SalesComparisonPeriod>('all')
  const [keyword, setKeyword] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const visibleRecords = useMemo(() => {
    return snapshot.records.filter((item) => {
      const matchesPeriod = period === 'all' || item.period === period
      const matchesKeyword = !keyword || item.metric.includes(keyword) || item.period.includes(keyword)
      return matchesPeriod && matchesKeyword
    })
  }, [keyword, period, snapshot.records])

  const summary = useMemo(() => {
    const positiveCount = visibleRecords.filter((item) => item.current >= item.previous).length
    const negativeCount = visibleRecords.filter((item) => item.current < item.previous).length
    const headline = visibleRecords.find((item) => item.metric === '营收')

    return {
      positiveCount,
      negativeCount,
      headline,
    }
  }, [visibleRecords])

  

  return (
    <div style={{ display: 'grid', gap: 16, color: '#e2e8f0' }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>销售对比报表</h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
            周期对比、增长率与经营指标异动。Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
          </p>
        </div>
        <button type="button" onClick={handleRefresh} style={{ borderRadius: 10, border: 'none', padding: '10px 14px', background: '#2563eb', color: '#fff' }}>
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      {snapshot.error ? (
        <div style={{ borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(120, 53, 15, 0.22)', padding: 14, color: '#fde68a' }}>
          {snapshot.error}
        </div>
      ) : null}

      <div style={cardStyle}>
        <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8 }}>
          generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer 拆层，指标钻取仍为 mock 演示态。
        </div>
      </div>

      {actionMessage ? (
        <div style={{ borderRadius: 12, border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(8, 47, 73, 0.25)', padding: 14, color: '#bae6fd' }}>
          {actionMessage}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>营收主指标</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>
            {summary.headline ? formatMetric(summary.headline.current, summary.headline.unit) : '--'}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>正向增长指标</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{summary.positiveCount}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>逆向波动指标</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{summary.negativeCount}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索指标/周期"
            style={{ width: 220, borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          />
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as 'all' | SalesComparisonPeriod)}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          >
            <option value="all">全部周期</option>
            {Array.from(new Set(snapshot.records.map((item) => item.period))).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setActionMessage('销售对比导出仍为 mock 演示链路，当前仅固证筛选条件、增长率计算与刷新入口。')}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#0f172a', color: '#e2e8f0' }}
          >
            导出对比快照
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>周期</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>指标</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>本期</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>上期</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>增长率</th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((item) => {
              const growth = formatGrowth(item.current, item.previous)
              const isPositive = item.current >= item.previous

              return (
                <tr key={`${item.period}-${item.metric}`}>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.period}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.metric}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatMetric(item.current, item.unit)}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatMetric(item.previous, item.unit)}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right', color: isPositive ? '#4ade80' : '#f87171' }}>{growth}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
