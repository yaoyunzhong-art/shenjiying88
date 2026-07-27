'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { SettlementReconciliationSnapshot } from './settlement-reconciliation-data'

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.55)',
  padding: 16,
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`
}

const statusText: Record<SettlementReconciliationSnapshot['records'][number]['status'], string> = {
  settled: '已结算',
  pending: '待结算',
  disputed: '有争议',
}

export default function SettlementReconciliationClient({ snapshot }: { snapshot: SettlementReconciliationSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'all' | SettlementReconciliationSnapshot['records'][number]['status']>('all')
  const [actionMessage, setActionMessage] = useState('')

  const visibleRecords = useMemo(() => {
    return snapshot.records.filter((item) => {
      const matchesKeyword = !keyword || item.store.includes(keyword) || item.id.includes(keyword)
      const matchesStatus = status === 'all' || item.status === status
      return matchesKeyword && matchesStatus
    })
  }, [keyword, snapshot.records, status])

  const summary = useMemo(() => {
    const pendingAmount = visibleRecords
      .filter((item) => item.status === 'pending')
      .reduce((sum, item) => sum + item.netSettlement, 0)
    const settledAmount = visibleRecords
      .filter((item) => item.status === 'settled')
      .reduce((sum, item) => sum + item.netSettlement, 0)
    const disputedAmount = visibleRecords
      .filter((item) => item.status === 'disputed')
      .reduce((sum, item) => sum + item.netSettlement, 0)
    const totalFee = visibleRecords.reduce((sum, item) => sum + item.platformFee + item.commission, 0)

    return {
      pendingAmount,
      settledAmount,
      disputedAmount,
      totalFee,
    }
  }, [visibleRecords])

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={{ display: 'grid', gap: 16, color: '#e2e8f0' }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>结算对账报表</h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
            结算金额、费用拆分与异常状态汇总。Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
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
          generatedAt {snapshot.generatedAt} · 当前页面已完成 server wrapper + snapshot loader + client renderer 拆层，发起结算与差异处理仍为 mock 演示态。
        </div>
      </div>

      {actionMessage ? (
        <div style={{ borderRadius: 12, border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(8, 47, 73, 0.25)', padding: 14, color: '#bae6fd' }}>
          {actionMessage}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>待结算金额</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(summary.pendingAmount)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>已结算金额</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(summary.settledAmount)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>争议金额</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(summary.disputedAmount)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>平台费用</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{formatCurrency(summary.totalFee)}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索门店/单号"
            style={{ width: 220, borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'all' | SettlementReconciliationSnapshot['records'][number]['status'])}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#020617', color: '#e2e8f0' }}
          >
            <option value="all">全部状态</option>
            <option value="settled">已结算</option>
            <option value="pending">待结算</option>
            <option value="disputed">有争议</option>
          </select>
          <button
            type="button"
            onClick={() => setActionMessage('批量结算仍为 mock 演示链路，当前仅固证筛选条件、费用汇总与刷新入口。')}
            style={{ borderRadius: 10, border: '1px solid #334155', padding: '10px 12px', background: '#0f172a', color: '#e2e8f0' }}
          >
            发起批量结算
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>结算单号</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>门店</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>周期</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>营收</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>费用</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>退款扣减</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>实结</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.id}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.store}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{item.period}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.totalRevenue)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.platformFee + item.commission)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.refundDeduction)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>{formatCurrency(item.netSettlement)}</td>
                <td style={{ padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>{statusText[item.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
