'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { RevenueSnapshot } from './revenue-data'

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.55)',
  padding: 16,
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`
}

function formatDelta(current: number, previous: number) {
  if (previous === 0) {
    return '0.0%'
  }

  const delta = ((current - previous) / previous) * 100
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
}

export default function RevenueClient({ snapshot }: { snapshot: RevenueSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [search, setSearch] = useState('')
  const [windowSize, setWindowSize] = useState<3 | 7>(7)
  const [focusSource, setFocusSource] = useState<'all' | RevenueSnapshot['sourceBreakdown'][number]['id']>('all')
  const [actionMessage, setActionMessage] = useState('')

  const visibleTrend = useMemo(() => {
    return snapshot.trend
      .filter((item) => !search || item.date.includes(search))
      .slice(-windowSize)
  }, [search, snapshot.trend, windowSize])

  const revenueSummary = useMemo(() => {
    const totalRevenue = visibleTrend.reduce((sum, item) => sum + item.revenue, 0)
    const totalOrders = visibleTrend.reduce((sum, item) => sum + item.orders, 0)
    const totalPrevious = visibleTrend.reduce((sum, item) => sum + item.prevPeriodRevenue, 0)

    return {
      totalRevenue,
      totalOrders,
      avgTicket: totalOrders === 0 ? 0 : Math.round(totalRevenue / totalOrders),
      revenueDelta: formatDelta(totalRevenue, totalPrevious),
    }
  }, [visibleTrend])

  const visibleSources = useMemo(() => {
    return snapshot.sourceBreakdown.filter((item) => focusSource === 'all' || item.id === focusSource)
  }, [focusSource, snapshot.sourceBreakdown])

  const maxRevenue = Math.max(...visibleTrend.map((item) => item.revenue))

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={{ display: 'grid', gap: 16, color: '#e2e8f0' }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>营收报表</h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
            近七日营收趋势、订单密度与收入来源拆分。Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
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
          generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer 拆层，筛选与刷新均基于快照样本固证。
        </div>
      </div>

      {actionMessage ? (
        <div style={{ borderRadius: 12, border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(8, 47, 73, 0.25)', padding: 14, color: '#bae6fd' }}>
          {actionMessage}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>周期营收</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(revenueSummary.totalRevenue)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>订单数</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{revenueSummary.totalOrders.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>平均客单</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(revenueSummary.avgTicket)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>较前周期</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{revenueSummary.revenueDelta}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索日期，例如 07-27"
            style={{ width: 220, borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          />
          <select
            value={String(windowSize)}
            onChange={(event) => setWindowSize(Number(event.target.value) as 3 | 7)}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          >
            <option value="3">近 3 天</option>
            <option value="7">近 7 天</option>
          </select>
          <select
            value={focusSource}
            onChange={(event) => setFocusSource(event.target.value as 'all' | RevenueSnapshot['sourceBreakdown'][number]['id'])}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          >
            <option value="all">全部来源</option>
            {snapshot.sourceBreakdown.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setActionMessage('营收导出仍为 mock 演示链路，当前仅固证过滤条件与来源态透明化。')}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#0f172a', color: '#e2e8f0' }}
          >
            导出营收快照
          </button>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 0.8fr' }}>
          <div>
            <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>营收趋势</div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(${visibleTrend.length}, minmax(0, 1fr))`, alignItems: 'end', minHeight: 220 }}>
              {visibleTrend.map((item) => (
                <div key={item.date} style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(40, Math.round((item.revenue / maxRevenue) * 180))}px`,
                      borderRadius: '12px 12px 4px 4px',
                      background: 'linear-gradient(180deg, #38bdf8 0%, #1d4ed8 100%)',
                    }}
                  />
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.date.slice(5)}</div>
                  <div style={{ fontSize: 12 }}>{formatCurrency(item.revenue)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>收入来源</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {visibleSources.map((item) => {
                const total = snapshot.sourceBreakdown.reduce((sum, entry) => sum + entry.amount, 0)
                const percent = total === 0 ? 0 : Math.round((item.amount / total) * 100)
                return (
                  <div key={item.id} style={{ borderRadius: 12, background: 'rgba(15, 23, 42, 0.9)', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>{item.label}</span>
                      <span>{percent}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: '#1e293b' }}>
                      <div style={{ width: `${percent}%`, height: '100%', borderRadius: 999, background: '#22c55e' }} />
                    </div>
                    <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 12 }}>{formatCurrency(item.amount)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>每日营收明细</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>日期</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>营收</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>订单</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>前周期营收</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>变化</th>
            </tr>
          </thead>
          <tbody>
            {visibleTrend.map((item) => (
              <tr key={item.date}>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.date}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.revenue)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{item.orders}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.prevPeriodRevenue)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatDelta(item.revenue, item.prevPeriodRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
