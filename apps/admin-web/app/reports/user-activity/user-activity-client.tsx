'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'

import { type UserActivitySnapshotDelivery, filterUserActivityRecords } from './user-activity-data'

const PAGE_SIZE = 5

const styles = {
  container: { background: '#0f0f1a', color: '#e0e0e0', minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif" },
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a3e' },
  input: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', width: '220px', outline: 'none' },
  btn: { background: '#4361ee', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '12px' },
  th: { background: '#16213e', padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #2a2a3e', color: '#8892b0', fontSize: '12px', textTransform: 'uppercase' as const },
  td: { padding: '10px 12px', borderBottom: '1px solid #2a2a3e', fontSize: '14px' },
  pageBtn: { background: 'transparent', border: '1px solid #2a2a3e', color: '#8892b0', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
  pageBtnActive: { background: '#4361ee', border: '1px solid #4361ee', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
}

export default function UserActivityClient({
  snapshot,
}: {
  snapshot: UserActivitySnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => filterUserActivityRecords(snapshot.records, search), [search, snapshot.records])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paged = useMemo(() => filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE), [currentPage, filtered])

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', margin: 0 }}>用户活跃报表</h1>
          <div style={{ color: '#8892b0', fontSize: '12px', marginTop: '6px' }}>
            来源标签: {snapshot.sourceLabel} / 峰值活跃: {snapshot.stats.peakUsers}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={{ ...styles.btn, background: 'rgba(67, 97, 238, 0.7)' }} onClick={() => handleRefresh()} disabled={isRefreshing}>
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <input
            style={styles.input}
            placeholder="搜索日期/功能..."
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
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>日均活跃</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.avgUsers}</div><div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>峰值 {snapshot.stats.peakUsers}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总会话</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.totalSessions.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>平均时长 {snapshot.stats.avgDuration} min</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>新增用户</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.totalNewUsers}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>快照记录 {snapshot.records.length} 天</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>互动率</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{(snapshot.stats.avgEngagement * 100).toFixed(1)}%</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>{snapshot.note}</div></div>
      </div>

      <div style={{ ...styles.card, marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>活跃趋势</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
          {snapshot.records.slice(-7).map((record) => (
            <div key={record.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: `${(record.activeUsers / Math.max(snapshot.stats.peakUsers, 1)) * 100}px`, background: 'linear-gradient(to top, #4361ee, #7c3aed)', borderRadius: '4px 4px 0 0', minHeight: '8px' }} />
              <div style={{ fontSize: '10px', color: '#8892b0', marginTop: '4px' }}>{record.date.slice(-5)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>每日活跃明细</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>暂无数据</div>
            <div>当前筛选条件下没有活跃记录。</div>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>日期</th>
                  <th style={styles.th}>活跃用户</th>
                  <th style={styles.th}>新增</th>
                  <th style={styles.th}>会话数</th>
                  <th style={styles.th}>平均时长</th>
                  <th style={styles.th}>互动率</th>
                  <th style={styles.th}>热门功能</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((record) => (
                  <tr key={record.date}>
                    <td style={styles.td}>{record.date}</td>
                    <td style={styles.td}>{record.activeUsers}</td>
                    <td style={{ ...styles.td, color: '#4ade80' }}>+{record.newUsers}</td>
                    <td style={styles.td}>{record.sessions}</td>
                    <td style={styles.td}>{record.avgDuration} min</td>
                    <td style={styles.td}>{(record.engagement * 100).toFixed(0)}%</td>
                    <td style={styles.td}>{record.topFeature}</td>
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
