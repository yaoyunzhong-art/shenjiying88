'use client'

import React, { useState, useMemo } from 'react'

interface StoreRecord {
  name: string
  location: string
  orders: number
  revenue: number
  members: number
  rating: number
  status: 'active' | 'inactive'
}

const SEED: StoreRecord[] = [
  { name: '旗舰店-陆家嘴', location: '上海浦东', orders: 1248, revenue: 385620, members: 892, rating: 4.8, status: 'active' },
  { name: '徐汇店', location: '上海徐汇', orders: 876, revenue: 256780, members: 543, rating: 4.6, status: 'active' },
  { name: '静安店', location: '上海静安', orders: 654, revenue: 189320, members: 421, rating: 4.5, status: 'active' },
  { name: '成都IFS店', location: '四川成都', orders: 543, revenue: 168920, members: 356, rating: 4.7, status: 'active' },
  { name: '广州天河店', location: '广东广州', orders: 432, revenue: 129870, members: 298, rating: 4.4, status: 'active' },
  { name: '深圳南山店', location: '广东深圳', orders: 387, revenue: 115640, members: 267, rating: 4.5, status: 'active' },
  { name: '杭州湖滨店', location: '浙江杭州', orders: 356, revenue: 108920, members: 234, rating: 4.3, status: 'inactive' },
  { name: '南京新街口店', location: '江苏南京', orders: 298, revenue: 92680, members: 198, rating: 4.2, status: 'active' },
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

export default function StoreSummaryPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(0)

  const stats = useMemo(() => {
    const total = SEED.reduce((s, r) => ({ orders: s.orders + r.orders, revenue: s.revenue + r.revenue, members: s.members + r.members }), { orders: 0, revenue: 0, members: 0 })
    return { ...total, avgRating: SEED.reduce((s, r) => s + r.rating, 0) / SEED.length, avgRevenue: total.revenue / SEED.length }
  }, [])

  const filtered = useMemo(() => {
    let list = SEED
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    if (search) list = list.filter(r => r.name.includes(search) || r.location.includes(search))
    return list
  }, [search, statusFilter])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>🏪 门店汇总报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
              style={{ ...({ all: '全部', active: '营业中', inactive: '已关闭' }[s] ? {} : {}), padding: '6px 12px', borderRadius: '6px', border: '1px solid #2a2a3e', cursor: 'pointer', fontSize: '13px',
                background: statusFilter === s ? '#4361ee' : 'transparent', color: statusFilter === s ? '#fff' : '#8892b0' }}>
              {({ all: '全部', active: '营业中', inactive: '已关闭' } as Record<string, string>)[s]}
            </button>
          ))}
          <input style={styles.input} placeholder="搜索门店/城市..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button style={styles.btn} onClick={() => alert('导出门店汇总...')}>📥 导出</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>门店总数</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{SEED.length}</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>{SEED.filter(s => s.status === 'active').length}家营业中</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>总营收</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.revenue.toLocaleString()}</div>
          <div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>平均 ¥{Math.round(stats.avgRevenue).toLocaleString()}/店</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>总订单</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.orders.toLocaleString()}</div>
          <div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>会员总数 {stats.members}</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>平均评分</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.avgRating.toFixed(1)}</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>最高 4.8 · 最低 4.2</div>
        </div>
      </div>

      {/* 营收排行 */}
      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>门店排名</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <div>暂无数据</div>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>排名</th>
                  <th style={styles.th}>门店名称</th>
                  <th style={styles.th}>城市</th>
                  <th style={styles.th}>订单数</th>
                  <th style={styles.th}>营收</th>
                  <th style={styles.th}>会员</th>
                  <th style={styles.th}>评分</th>
                  <th style={styles.th}>状态</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{page * PAGE_SIZE + i + 1}</td>
                    <td style={styles.td}>{r.name}</td>
                    <td style={styles.td}>{r.location}</td>
                    <td style={styles.td}>{r.orders}</td>
                    <td style={styles.td}>¥{r.revenue.toLocaleString()}</td>
                    <td style={styles.td}>{r.members}</td>
                    <td style={styles.td}>{'⭐'.repeat(Math.floor(r.rating))} {r.rating}</td>
                    <td style={{ ...styles.td, color: r.status === 'active' ? '#4ade80' : '#ef4444' }}>{r.status === 'active' ? '营业中' : '已关闭'}</td>
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
