'use client'

import React, { useState, useMemo } from 'react'

interface ActivityRecord {
  date: string
  activeUsers: number
  newUsers: number
  sessions: number
  avgDuration: number
  engagement: number
  topFeature: string
}

const SEED: ActivityRecord[] = [
  { date: '2026-07-14', activeUsers: 328, newUsers: 42, sessions: 1654, avgDuration: 37, engagement: 0.72, topFeature: '射击预约' },
  { date: '2026-07-15', activeUsers: 376, newUsers: 51, sessions: 1820, avgDuration: 42, engagement: 0.76, topFeature: '会员充值' },
  { date: '2026-07-16', activeUsers: 298, newUsers: 35, sessions: 1432, avgDuration: 33, engagement: 0.68, topFeature: 'VR体验' },
  { date: '2026-07-17', activeUsers: 452, newUsers: 67, sessions: 2150, avgDuration: 45, engagement: 0.81, topFeature: '组队竞技' },
  { date: '2026-07-18', activeUsers: 510, newUsers: 78, sessions: 2430, avgDuration: 48, engagement: 0.85, topFeature: '射击挑战赛' },
  { date: '2026-07-19', activeUsers: 486, newUsers: 63, sessions: 2280, avgDuration: 42, engagement: 0.79, topFeature: '团购核销' },
  { date: '2026-07-20', activeUsers: 215, newUsers: 28, sessions: 980, avgDuration: 29, engagement: 0.62, topFeature: '积分兑换' },
]

const styles = {
  container: { background: '#0f0f1a', color: '#e0e0e0', minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif" } as React.CSSProperties,
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a3e' } as React.CSSProperties,
  input: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', width: '200px', outline: 'none' } as React.CSSProperties,
  btn: { background: '#4361ee', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '12px' },
  th: { background: '#16213e', padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #2a2a3e', color: '#8892b0', fontSize: '12px', textTransform: 'uppercase' as const },
  td: { padding: '10px 12px', borderBottom: '1px solid #2a2a3e', fontSize: '14px' },
  pageBtn: { background: 'transparent', border: '1px solid #2a2a3e', color: '#8892b0', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
  pageBtnActive: { background: '#4361ee', border: '1px solid #4361ee', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
}
const PAGE_SIZE = 5

export default function UserActivityPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const stats = useMemo(() => {
    const total = SEED.reduce((s, r) => ({ users: s.users + r.activeUsers, sessions: s.sessions + r.sessions, duration: s.duration + r.avgDuration, newUsers: s.newUsers + r.newUsers }), { users: 0, sessions: 0, duration: 0, newUsers: 0 })
    return { ...total, avgUsers: Math.round(total.users / SEED.length), avgEngagement: SEED.reduce((s, r) => s + r.engagement, 0) / SEED.length }
  }, [])

  const filtered = useMemo(() => {
    if (!search) return SEED
    return SEED.filter(r => r.date.includes(search) || r.topFeature.includes(search))
  }, [search])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>📱 用户活跃报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input style={styles.input} placeholder="搜索日期/功能..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button style={styles.btn} onClick={() => alert('导出活跃数据...')}>📥 导出</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>日均活跃</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.avgUsers}</div><div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>峰值 510</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总会话</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.sessions.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>平均时长 {Math.round(stats.duration / SEED.length)}min</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>新增用户</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.newUsers}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>平均 {Math.round(stats.newUsers / SEED.length)}/天</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>互动率</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{(stats.avgEngagement * 100).toFixed(1)}%</div><div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>↑ 5.2% vs 上周</div></div>
      </div>

      <div style={{ ...styles.card, marginBottom: '20px', padding: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>📈 活跃趋势</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
          {SEED.slice(-7).map((r, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: `${(r.activeUsers / 520) * 100}px`, background: 'linear-gradient(to top, #4361ee, #7c3aed)', borderRadius: '4px 4px 0 0', minHeight: '8px' }} />
              <div style={{ fontSize: '10px', color: '#8892b0', marginTop: '4px' }}>{r.date.slice(-5)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>每日活跃明细</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div><div>暂无数据</div></div>
        ) : (
          <>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>日期</th><th style={styles.th}>活跃用户</th><th style={styles.th}>新增</th><th style={styles.th}>会话数</th><th style={styles.th}>平均时长(min)</th><th style={styles.th}>互动率</th><th style={styles.th}>热门功能</th>
              </tr></thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{r.date}</td>
                    <td style={styles.td}>{r.activeUsers}</td>
                    <td style={{ ...styles.td, color: '#4ade80' }}>+{r.newUsers}</td>
                    <td style={styles.td}>{r.sessions}</td>
                    <td style={styles.td}>{r.avgDuration}</td>
                    <td style={styles.td}>{(r.engagement * 100).toFixed(0)}%</td>
                    <td style={styles.td}>{r.topFeature}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '16px' }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} style={i === page ? styles.pageBtnActive : styles.pageBtn} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
