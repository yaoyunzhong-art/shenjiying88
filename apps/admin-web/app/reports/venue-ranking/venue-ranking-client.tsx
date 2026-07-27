'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  VENUE_RANKING_SORT_OPTIONS,
  VENUE_SORT_LABELS,
  type VenueRankingSortKey,
  type VenueRankingSnapshotDelivery,
  filterVenueRecords,
  sortVenueRecords,
} from './venue-ranking-data'

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

export default function VenueRankingClient({
  snapshot,
}: {
  snapshot: VenueRankingSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<VenueRankingSortKey>('revenue')
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => sortVenueRecords(snapshot.records, sortBy), [snapshot.records, sortBy])
  const filtered = useMemo(() => filterVenueRecords(sorted, search), [search, sorted])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paged = useMemo(() => filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE), [currentPage, filtered])

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', margin: 0 }}>场馆排名报表</h1>
          <div style={{ color: '#8892b0', fontSize: '12px', marginTop: '6px' }}>
            来源标签: {snapshot.sourceLabel} / 最高评分: {snapshot.stats.topRating}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={{ ...styles.btn, background: 'rgba(67, 97, 238, 0.7)' }} onClick={() => startRefresh(() => router.refresh())} disabled={isRefreshing}>
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          {VENUE_RANKING_SORT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setSortBy(option)
                setPage(0)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #2a2a3e',
                cursor: 'pointer',
                fontSize: '13px',
                background: sortBy === option ? '#4361ee' : 'transparent',
                color: sortBy === option ? '#fff' : '#8892b0',
              }}
            >
              {VENUE_SORT_LABELS[option]}
            </button>
          ))}
          <input
            style={styles.input}
            placeholder="搜索场馆..."
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
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>场馆总数</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.totalVenues}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>冠军 {snapshot.stats.topVenue}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总营收</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(snapshot.stats.revenue)}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>平均 {formatCurrency(snapshot.stats.avgRevenue)}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总订单</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.orders.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>总会员 {snapshot.stats.members}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>最高评分</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.topRating.toFixed(1)}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>{snapshot.note}</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>场馆排名</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>暂无数据</div>
            <div>当前筛选条件下没有场馆排名记录。</div>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>排名</th>
                  <th style={styles.th}>场馆</th>
                  <th style={styles.th}>城市</th>
                  <th style={styles.th}>订单</th>
                  <th style={styles.th}>营收</th>
                  <th style={styles.th}>会员</th>
                  <th style={styles.th}>评分</th>
                  <th style={styles.th}>热门服务</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((record, index) => (
                  <tr key={`${record.name}-${record.city}`}>
                    <td style={{ ...styles.td, color: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : '#8892b0', fontWeight: index < 3 ? 700 : 400 }}>#{currentPage * PAGE_SIZE + index + 1}</td>
                    <td style={styles.td}>{record.name}</td>
                    <td style={styles.td}>{record.city}</td>
                    <td style={styles.td}>{record.orders.toLocaleString()}</td>
                    <td style={styles.td}>{formatCurrency(record.revenue)}</td>
                    <td style={styles.td}>{record.members}</td>
                    <td style={styles.td}>{record.rating.toFixed(1)}</td>
                    <td style={styles.td}>{record.popularService}</td>
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
