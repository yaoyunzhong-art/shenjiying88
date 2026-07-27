'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'

import type { StoreSummarySnapshot } from './store-summary-data'

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.55)',
  padding: 16,
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`
}

export default function StoreSummaryClient({ snapshot }: { snapshot: StoreSummarySnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'all' | StoreSummarySnapshot['stores'][number]['status']>('all')
  const [actionMessage, setActionMessage] = useState('')

  const visibleStores = useMemo(() => {
    return snapshot.stores.filter((item) => {
      const matchesKeyword = !keyword || item.name.includes(keyword) || item.city.includes(keyword)
      const matchesStatus = status === 'all' || item.status === status
      return matchesKeyword && matchesStatus
    })
  }, [keyword, snapshot.stores, status])

  const summary = useMemo(() => {
    const totalRevenue = visibleStores.reduce((sum, item) => sum + item.revenue, 0)
    const totalOrders = visibleStores.reduce((sum, item) => sum + item.orders, 0)
    const totalMembers = visibleStores.reduce((sum, item) => sum + item.members, 0)

    return {
      totalRevenue,
      totalOrders,
      totalMembers,
      averageRating:
        visibleStores.length === 0
          ? 0
          : visibleStores.reduce((sum, item) => sum + item.rating, 0) / visibleStores.length,
    }
  }, [visibleStores])

  

  return (
    <div style={{ display: 'grid', gap: 16, color: '#e2e8f0' }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>门店汇总报表</h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
            门店排名、营收汇总与区域分布。Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
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
          generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer 拆层，导出与钻取仍为 mock 演示态。
        </div>
      </div>

      {actionMessage ? (
        <div style={{ borderRadius: 12, border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(8, 47, 73, 0.25)', padding: 14, color: '#bae6fd' }}>
          {actionMessage}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>门店数</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{visibleStores.length}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>总营收</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(summary.totalRevenue)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>总订单</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{summary.totalOrders.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>平均评分</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{summary.averageRating.toFixed(1)}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索门店/城市"
            style={{ width: 220, borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'all' | StoreSummarySnapshot['stores'][number]['status'])}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          >
            <option value="all">全部状态</option>
            <option value="active">营业中</option>
            <option value="inactive">已关闭</option>
          </select>
          <button
            type="button"
            onClick={() => setActionMessage('门店汇总导出仍为 mock 演示链路，当前仅固证筛选条件、区域摘要与刷新入口。')}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#0f172a', color: '#e2e8f0' }}
          >
            导出门店汇总
          </button>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 0.8fr' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>门店</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>城市</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>营收</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>订单</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>会员</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>评分</th>
              </tr>
            </thead>
            <tbody>
              {visibleStores.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.name}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.city}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.revenue)}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{item.orders}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{item.members}</td>
                  <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{item.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'grid', gap: 10 }}>
            {snapshot.regions.map((item) => (
              <div key={item.region} style={{ borderRadius: 12, background: 'rgba(15, 23, 42, 0.9)', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.region}</span>
                  <span>{item.storeCount} 家</span>
                </div>
                <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 12 }}>区域营收</div>
                <div style={{ marginTop: 4, fontSize: 20, fontWeight: 700 }}>{formatCurrency(item.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
