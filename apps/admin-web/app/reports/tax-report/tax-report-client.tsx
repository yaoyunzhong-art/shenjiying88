'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'

import {
  TAX_RECORD_STATUSES,
  TAX_STATUS_LABELS,
  type TaxRecordStatus,
  type TaxReportSnapshotDelivery,
  filterTaxRecords,
} from './tax-report-data'

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

export default function TaxReportClient({
  snapshot,
}: {
  snapshot: TaxReportSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaxRecordStatus | 'all'>('all')
  const [page, setPage] = useState(0)

  const filtered = useMemo(
    () => filterTaxRecords(snapshot.records, search, statusFilter),
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
          <h1 style={{ fontSize: '22px', margin: 0 }}>税务报表</h1>
          <div style={{ color: '#8892b0', fontSize: '12px', marginTop: '6px' }}>
            来源标签: {snapshot.sourceLabel} / 快照时间: {snapshot.generatedAt}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            style={{ ...styles.btn, background: 'rgba(67, 97, 238, 0.7)' }}
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          {(['all', ...TAX_RECORD_STATUSES] as const).map((status) => (
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
              {status === 'all' ? '全部' : TAX_STATUS_LABELS[status]}
            </button>
          ))}
          <input
            style={styles.input}
            placeholder="搜索周期..."
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
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总营收（报税）</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(snapshot.stats.revenue)}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>快照记录 {snapshot.records.length} 条</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总税额</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(snapshot.stats.tax)}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>含抵扣前</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>实际缴税</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(snapshot.stats.netTax)}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>待缴 {snapshot.stats.pendingCount} / 逾期 {snapshot.stats.overdueCount}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>平均税率</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.averageTaxRate.toFixed(1)}%</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>{snapshot.note}</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>纳税明细</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>暂无数据</div>
            <div>当前筛选条件下没有税务记录。</div>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>周期</th>
                  <th style={styles.th}>营收</th>
                  <th style={styles.th}>税率</th>
                  <th style={styles.th}>税额</th>
                  <th style={styles.th}>抵扣</th>
                  <th style={styles.th}>实缴</th>
                  <th style={styles.th}>状态</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((record) => (
                  <tr key={record.period}>
                    <td style={styles.td}>{record.period}</td>
                    <td style={styles.td}>{formatCurrency(record.revenue)}</td>
                    <td style={styles.td}>{record.taxRate}%</td>
                    <td style={styles.td}>{formatCurrency(record.taxAmount)}</td>
                    <td style={styles.td}>{formatCurrency(record.deductible)}</td>
                    <td style={styles.td}>{formatCurrency(record.netTax)}</td>
                    <td style={{ ...styles.td, color: record.status === 'paid' ? '#4ade80' : record.status === 'pending' ? '#f59e0b' : '#ef4444' }}>
                      {TAX_STATUS_LABELS[record.status]}
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
