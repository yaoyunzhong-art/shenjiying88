'use client'

import React, { useState, useMemo } from 'react'

interface UserRecord {
  name: string
  phone: string
  age: number
  gender: string
  level: string
  orders: number
  spend: number
  lastVisit: string
  tags: string[]
}

const SEED: UserRecord[] = [
  { name: '刘明', phone: '138****1234', age: 28, gender: '男', level: '金卡', orders: 48, spend: 15680, lastVisit: '2026-07-19', tags: ['射击爱好者', '高活跃'] },
  { name: '陈芳', phone: '139****5678', age: 32, gender: '女', level: '钻石卡', orders: 72, spend: 28340, lastVisit: '2026-07-20', tags: ['团建组织者', '高消费'] },
  { name: '王浩', phone: '137****9012', age: 25, gender: '男', level: '银卡', orders: 18, spend: 4230, lastVisit: '2026-07-15', tags: ['新用户'] },
  { name: '赵敏', phone: '136****3456', age: 35, gender: '女', level: '金卡', orders: 35, spend: 12450, lastVisit: '2026-07-18', tags: ['亲子用户', '周末高频'] },
  { name: '孙磊', phone: '135****7890', age: 42, gender: '男', level: '铂金卡', orders: 56, spend: 21980, lastVisit: '2026-07-17', tags: ['高端用户', '竞技射击'] },
  { name: '周婷', phone: '134****2345', age: 26, gender: '女', level: '银卡', orders: 12, spend: 3120, lastVisit: '2026-07-10', tags: ['体验型'] },
  { name: '吴刚', phone: '133****6789', age: 38, gender: '男', level: '金卡', orders: 42, spend: 15890, lastVisit: '2026-07-16', tags: ['射击爱好者', '常客'] },
  { name: '郑丽', phone: '132****0123', age: 29, gender: '女', level: '普通卡', orders: 5, spend: 890, lastVisit: '2026-06-28', tags: ['低频用户', '待激活'] },
]

const styles = {
  container: { background: '#0f0f1a', color: '#e0e0e0', minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif" } as React.CSSProperties,
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a3e' } as React.CSSProperties,
  input: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', width: '200px', outline: 'none' } as React.CSSProperties,
  select: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', outline: 'none' } as React.CSSProperties,
  btn: { background: '#4361ee', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '12px' },
  th: { background: '#16213e', padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #2a2a3e', color: '#8892b0', fontSize: '12px', textTransform: 'uppercase' as const },
  td: { padding: '10px 12px', borderBottom: '1px solid #2a2a3e', fontSize: '14px' },
  pageBtn: { background: 'transparent', border: '1px solid #2a2a3e', color: '#8892b0', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
  pageBtnActive: { background: '#4361ee', border: '1px solid #4361ee', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
}
const PAGE_SIZE = 5

export default function UserPortraitPage() {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [page, setPage] = useState(0)

  const stats = useMemo(() => {
    const total = SEED.reduce((s, r) => ({ orders: s.orders + r.orders, spend: s.spend + r.spend }), { orders: 0, spend: 0 })
    return { total: SEED.length, orders: total.orders, spend: total.spend, avgAge: Math.round(SEED.reduce((s, r) => s + r.age, 0) / SEED.length), avgSpend: Math.round(total.spend / SEED.length) }
  }, [])

  const filtered = useMemo(() => {
    let list = SEED
    if (levelFilter !== 'all') list = list.filter(r => r.level === levelFilter)
    if (search) list = list.filter(r => r.name.includes(search) || r.phone.includes(search) || r.tags.some(t => t.includes(search)))
    return list
  }, [search, levelFilter])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>👤 用户画像报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select style={styles.select} value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(0) }}>
            <option value="all">全部等级</option>
            <option value="普通卡">普通卡</option>
            <option value="银卡">银卡</option>
            <option value="金卡">金卡</option>
            <option value="铂金卡">铂金卡</option>
            <option value="钻石卡">钻石卡</option>
          </select>
          <input style={styles.input} placeholder="搜索姓名/电话/标签..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button style={styles.btn} onClick={() => alert('导出用户画像...')}>📥 导出</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总用户</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.total}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>样本数据</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总订单</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.orders}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>平均 {stats.avgSpend}/人</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总消费额</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.spend.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>金卡占比 48%</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>平均年龄</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.avgAge}岁</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>男女比 5:3</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>用户列表</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div><div>暂无数据</div></div>
        ) : (
          <>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>姓名</th><th style={styles.th}>电话</th><th style={styles.th}>年龄</th><th style={styles.th}>等级</th><th style={styles.th}>订单</th><th style={styles.th}>消费</th><th style={styles.th}>上次到访</th><th style={styles.th}>标签</th>
              </tr></thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{r.name}</td>
                    <td style={styles.td}>{r.phone}</td>
                    <td style={styles.td}>{r.age}</td>
                    <td style={{ ...styles.td, color: ({ '钻石卡': '#f59e0b', '铂金卡': '#a78bfa', '金卡': '#fbbf24', '银卡': '#9ca3af', '普通卡': '#6b7280' })[r.level] || '#e0e0e0' }}>{r.level}</td>
                    <td style={styles.td}>{r.orders}</td>
                    <td style={styles.td}>¥{r.spend.toLocaleString()}</td>
                    <td style={styles.td}>{r.lastVisit}</td>
                    <td style={styles.td}>{r.tags.map(t => <span key={t} style={{ display: 'inline-block', background: '#16213e', color: '#4361ee', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', marginRight: '4px' }}>{t}</span>)}</td>
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
