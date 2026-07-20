'use client'

import React, { useState, useMemo } from 'react'

interface VenueRecord {
  name: string
  city: string
  orders: number
  revenue: number
  members: number
  rating: number
  popularService: string
}

const SEED: VenueRecord[] = [
  { name: '胜也射击-陆家嘴旗舰', city: '上海', orders: 2846, revenue: 856200, members: 1832, rating: 4.8, popularService: '竞技射击套餐' },
  { name: '胜也射击-静安寺店', city: '上海', orders: 1950, revenue: 589400, members: 1240, rating: 4.7, popularService: '新手体验课' },
  { name: '胜也射击-成都IFS', city: '成都', orders: 1620, revenue: 498500, members: 1056, rating: 4.6, popularService: 'VR射击套餐' },
  { name: '胜也射击-广州天河', city: '广州', orders: 1432, revenue: 425000, members: 924, rating: 4.5, popularService: '团建射击包场' },
  { name: '胜也射击-深圳南山', city: '深圳', orders: 1287, revenue: 386500, members: 835, rating: 4.5, popularService: '会员专属练习' },
  { name: '胜也射击-杭州西湖', city: '杭州', orders: 986, revenue: 298700, members: 625, rating: 4.4, popularService: '亲子射击体验' },
  { name: '胜也射击-南京新街口', city: '南京', orders: 843, revenue: 256800, members: 534, rating: 4.3, popularService: '激光射击' },
  { name: '胜也射击-重庆解放碑', city: '重庆', orders: 756, revenue: 228900, members: 487, rating: 4.2, popularService: '射击挑战赛' },
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

export default function VenueRankingPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'rating'>('revenue')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!SEED || SEED.length === 0) return <div>暂无数据</div>

  const stats = useMemo(() => {
    const total = SEED.reduce((s, r) => ({ revenue: s.revenue + r.revenue, orders: s.orders + r.orders, members: s.members + r.members }), { revenue: 0, orders: 0, members: 0 })
    return { ...total, avgRevenue: Math.round(total.revenue / SEED.length) }
  }, [])

  const sorted = useMemo(() => {
    const list = [...SEED]
    list.sort((a, b) => b[sortBy] - a[sortBy])
    return list
  }, [sortBy])

  const filtered = useMemo(() => {
    if (!search) return sorted
    return sorted.filter(r => r.name.includes(search) || r.city.includes(search))
  }, [search, sorted])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>🏆 场馆排名报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(['revenue', 'orders', 'rating'] as const).map(s => (
            <button key={s} onClick={() => { setSortBy(s); setPage(0) }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #2a2a3e', cursor: 'pointer', fontSize: '13px',
                background: sortBy === s ? '#4361ee' : 'transparent', color: sortBy === s ? '#fff' : '#8892b0' }}>
              {({ revenue: '营收', orders: '订单', rating: '评分' } as Record<string, string>)[s]}
            </button>
          ))}
          <input style={styles.input} placeholder="搜索场馆..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button style={styles.btn} onClick={() => alert('导出排名...')}>📥 导出</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>场馆总数</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{SEED.length}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>覆盖 7 城市</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总营收</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.revenue.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>平均 ¥{stats.avgRevenue.toLocaleString()}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总订单</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.orders.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>总会员 {stats.members}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>最高评分</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>4.8</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>陆家嘴旗舰店</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>场馆排名</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div><div>暂无数据</div></div>
        ) : (
          <>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>排名</th><th style={styles.th}>场馆</th><th style={styles.th}>城市</th><th style={styles.th}>订单</th><th style={styles.th}>营收</th><th style={styles.th}>会员</th><th style={styles.th}>评分</th><th style={styles.th}>热门服务</th>
              </tr></thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...styles.td, color: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#8892b0', fontWeight: i < 3 ? 700 : 400 }}>#{page * PAGE_SIZE + i + 1}</td>
                    <td style={styles.td}>{r.name}</td>
                    <td style={styles.td}>{r.city}</td>
                    <td style={styles.td}>{r.orders.toLocaleString()}</td>
                    <td style={styles.td}>¥{r.revenue.toLocaleString()}</td>
                    <td style={styles.td}>{r.members}</td>
                    <td style={styles.td}>{'⭐'.repeat(Math.floor(r.rating))} {r.rating}</td>
                    <td style={styles.td}>{r.popularService}</td>
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
