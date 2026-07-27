'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  PROMOTION_ADJUSTMENT_STATUSES,
  PROMOTION_STATUS_LABELS,
  type PromotionAdjustmentStatus,
  type PromotionsAdjustmentsSnapshotDelivery,
  filterPromotionAdjustmentRecords,
} from './promotions-adjustments-data'

const PAGE_SIZE = 5

const styles = {
  container: { background: '#0f0f1a', color: '#e0e0e0', minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif" },
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a3e' },
  input: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', width: '200px', outline: 'none' },
  btn: { background: '#4361ee', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '12px' },
  th: { background: '#16213e', padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #2a2a3e', color: '#8892b0', fontSize: '12px', textTransform: 'uppercase' as const },
  td: { padding: '10px 12px', borderBottom: '1px solid #2a2a3e', fontSize: '14px' },
  pageBtn: { background: 'transparent', border: '1px solid #2a2a3e', color: '#8892b0', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
  pageBtnActive: { background: '#4361ee', border: '1px solid #4361ee', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
}

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString()}`
}

export default function PromotionsAdjustmentsClient({
  snapshot,
}: {
  snapshot: PromotionsAdjustmentsSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PromotionAdjustmentStatus | 'all'>('all')
  const [page, setPage] = useState(0)

  const filtered = useMemo(
    () => filterPromotionAdjustmentRecords(snapshot.records, search, statusFilter),
    [search, snapshot.records, statusFilter]
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paged = useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [currentPage, filtered])

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', margin: 0 }}>促销调整报表</h1>
          <div style={{ color: '#8892b0', fontSize: '12px', marginTop: '6px' }}>
            来源标签: {snapshot.sourceLabel} / 快照时间: {snapshot.generatedAt}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            style={{ ...styles.btn, background: 'rgba(67, 97, 238, 0.7)' }}
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          {(['all', ...PROMOTION_ADJUSTMENT_STATUSES] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status)
                setPage(0)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #2a2a3e',
                cursor: 'pointer',
                fontSize: '13px',
                background: statusFilter === status ? '#4361ee' : 'transparent',
                color: statusFilter === status ? '#fff' : '#8892b0',
              }}
            >
              {status === 'all' ? '全部' : PROMOTION_STATUS_LABELS[status]}
            </button>
          ))}
          <input
            style={styles.input}
            placeholder="搜索活动名称..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
          />
        </div>
      </div>

      {snapshot.error ? (
        <div style={{ ...styles.card, marginBottom: '16px', color: '#fbbf24' }}>fallback 提示: {snapshot.error}</div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>进行中活动</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.activeCount}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>总预算 {formatCurrency(snapshot.stats.activeBudget)}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总花费</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(snapshot.stats.totalSpend)}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>已产生核销收入</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>核销次数</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.totalRedemptions.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>共产生收入 {formatCurrency(snapshot.stats.totalRevenue)}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总ROI</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.totalRoi.toFixed(2)}x</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>{snapshot.note}</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>活动列表</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>暂无数据</div>
            <div>当前筛选条件下没有促销活动记录。</div>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>活动名称</th>
                  <th style={styles.th}>类型</th>
                  <th style={styles.th}>预算</th>
                  <th style={styles.th}>花费</th>
                  <th style={styles.th}>核销</th>
                  <th style={styles.th}>收入</th>
                  <th style={styles.th}>ROI</th>
                  <th style={styles.th}>状态</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((record) => (
                  <tr key={record.id}>
                    <td style={styles.td}>{record.name}</td>
                    <td style={styles.td}>{record.type}</td>
                    <td style={styles.td}>{formatCurrency(record.budget)}</td>
                    <td style={styles.td}>{formatCurrency(record.spend)}</td>
                    <td style={styles.td}>{record.redemptions.toLocaleString()}</td>
                    <td style={styles.td}>{formatCurrency(record.revenue)}</td>
                    <td style={{ ...styles.td, color: record.roi > 5 ? '#4ade80' : record.roi > 3 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                      {record.roi > 0 ? `${record.roi.toFixed(2)}x` : '-'}
                    </td>
                    <td style={{ ...styles.td, color: record.status === 'active' ? '#4ade80' : record.status === 'ended' ? '#8892b0' : '#4361ee' }}>
                      {PROMOTION_STATUS_LABELS[record.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '16px' }}>
              {Array.from({ length: totalPages }, (_, index) => (
                <button key={index} type="button" style={index === currentPage ? styles.pageBtnActive : styles.pageBtn} onClick={() => setPage(index)}>{index + 1}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
