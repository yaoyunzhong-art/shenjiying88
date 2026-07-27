'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { SalesSummaryPeriod, SalesSummarySnapshot } from './sales-summary-data'

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.55)',
  padding: 16,
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`
}

const periodLabel: Record<SalesSummaryPeriod, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
}

export default function SalesSummaryClient({ snapshot }: { snapshot: SalesSummarySnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [keyword, setKeyword] = useState('')
  const [period, setPeriod] = useState<SalesSummaryPeriod>('week')
  const [channel, setChannel] = useState<'all' | SalesSummarySnapshot['records'][number]['channel']>('all')
  const [actionMessage, setActionMessage] = useState('')

  const visibleRecords = useMemo(() => {
    const recordsByPeriod = period === 'today' ? snapshot.records.slice(-1) : period === 'week' ? snapshot.records.slice(-7) : snapshot.records

    return recordsByPeriod.filter((item) => {
      const matchesKeyword = !keyword || item.date.includes(keyword) || item.topProduct.includes(keyword)
      const matchesChannel = channel === 'all' || item.channel === channel
      return matchesKeyword && matchesChannel
    })
  }, [channel, keyword, period, snapshot.records])

  const summary = useMemo(() => {
    const orders = visibleRecords.reduce((sum, item) => sum + item.orders, 0)
    const revenue = visibleRecords.reduce((sum, item) => sum + item.revenue, 0)
    const refunds = visibleRecords.reduce((sum, item) => sum + item.refunds, 0)
    const netRevenue = visibleRecords.reduce((sum, item) => sum + item.netRevenue, 0)

    return {
      orders,
      revenue,
      refunds,
      netRevenue,
      avgTicket: orders === 0 ? 0 : Math.round(netRevenue / orders),
    }
  }, [visibleRecords])

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={{ display: 'grid', gap: 16, color: '#e2e8f0' }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>销售汇总报表</h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
            订单、收入、退款与净收入的周期汇总。Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
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
          generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer 拆层，导出能力仍处于 mock 演示态。
        </div>
      </div>

      {actionMessage ? (
        <div style={{ borderRadius: 12, border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(8, 47, 73, 0.25)', padding: 14, color: '#bae6fd' }}>
          {actionMessage}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>周期</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{periodLabel[period]}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>订单数</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{summary.orders.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>收入</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(summary.revenue)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>净收入</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(summary.netRevenue)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>平均客单</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(summary.avgTicket)}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索日期/热销商品"
            style={{ width: 220, borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          />
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as SalesSummaryPeriod)}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          >
            {snapshot.periodOptions.map((item) => (
              <option key={item} value={item}>
                {periodLabel[item]}
              </option>
            ))}
          </select>
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value as 'all' | SalesSummarySnapshot['records'][number]['channel'])}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          >
            <option value="all">全部渠道</option>
            {Array.from(new Set(snapshot.records.map((item) => item.channel))).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setActionMessage('销售汇总导出仍为 mock 演示链路，当前仅固证过滤条件、汇总指标与刷新入口。')}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#0f172a', color: '#e2e8f0' }}
          >
            导出销售汇总
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>日期</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>渠道</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>订单数</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>收入</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>退款</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>净收入</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>热销商品</th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((item) => (
              <tr key={`${item.date}-${item.channel}`}>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.date}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.channel}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{item.orders}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.revenue)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.refunds)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.netRevenue)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.topProduct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
