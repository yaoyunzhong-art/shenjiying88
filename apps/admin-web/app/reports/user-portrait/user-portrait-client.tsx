'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  USER_LEVEL_OPTIONS,
  type UserPortraitSnapshotDelivery,
  filterUserPortraitRecords,
} from './user-portrait-data'

const PAGE_SIZE = 5

const styles = {
  container: { background: '#0f0f1a', color: '#e0e0e0', minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif" },
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a3e' },
  input: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', width: '220px', outline: 'none' },
  select: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', outline: 'none' },
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

export default function UserPortraitClient({
  snapshot,
}: {
  snapshot: UserPortraitSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [page, setPage] = useState(0)

  const filtered = useMemo(
    () => filterUserPortraitRecords(snapshot.records, search, levelFilter),
    [levelFilter, search, snapshot.records]
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paged = useMemo(() => filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE), [currentPage, filtered])

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', margin: 0 }}>用户画像报表</h1>
          <div style={{ color: '#8892b0', fontSize: '12px', marginTop: '6px' }}>
            来源标签: {snapshot.sourceLabel} / 高价值用户: {snapshot.stats.highValueCount}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={{ ...styles.btn, background: 'rgba(67, 97, 238, 0.7)' }} onClick={() => startRefresh(() => router.refresh())} disabled={isRefreshing}>
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <select
            style={styles.select}
            value={levelFilter}
            onChange={(event) => {
              setLevelFilter(event.target.value)
              setPage(0)
            }}
          >
            <option value="all">全部等级</option>
            {USER_LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <input
            style={styles.input}
            placeholder="搜索姓名/电话/标签..."
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
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总用户</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.total}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>样本/快照记录</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总订单</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.orders}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>人均消费 {formatCurrency(snapshot.stats.avgSpend)}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总消费额</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(snapshot.stats.spend)}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>高价值用户 {snapshot.stats.highValueCount}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>平均年龄</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{snapshot.stats.avgAge} 岁</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>{snapshot.note}</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>用户列表</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>暂无数据</div>
            <div>当前筛选条件下没有用户画像记录。</div>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>姓名</th>
                  <th style={styles.th}>电话</th>
                  <th style={styles.th}>年龄</th>
                  <th style={styles.th}>等级</th>
                  <th style={styles.th}>订单</th>
                  <th style={styles.th}>消费</th>
                  <th style={styles.th}>上次到访</th>
                  <th style={styles.th}>标签</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((record) => (
                  <tr key={`${record.name}-${record.phone}`}>
                    <td style={styles.td}>{record.name}</td>
                    <td style={styles.td}>{record.phone}</td>
                    <td style={styles.td}>{record.age}</td>
                    <td style={styles.td}>{record.level}</td>
                    <td style={styles.td}>{record.orders}</td>
                    <td style={styles.td}>{formatCurrency(record.spend)}</td>
                    <td style={styles.td}>{record.lastVisit}</td>
                    <td style={styles.td}>{record.tags.join(' / ')}</td>
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
