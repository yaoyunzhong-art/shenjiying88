'use client'

import React, { useState, useMemo } from 'react'

interface PromotionRecord {
  id: string
  name: string
  type: string
  budget: number
  spend: number
  redemptions: number
  revenue: number
  roi: number
  status: 'active' | 'ended' | 'scheduled'
}

const SEED: PromotionRecord[] = [
  { id: 'PROMO-001', name: '新人首次射击体验', type: '新客优惠', budget: 50000, spend: 32600, redemptions: 438, revenue: 152800, roi: 3.69, status: 'active' },
  { id: 'PROMO-002', name: '暑期团建特惠', type: '团购优惠', budget: 80000, spend: 45600, redemptions: 186, revenue: 295400, roi: 5.48, status: 'active' },
  { id: 'PROMO-003', name: '会员充值满赠', type: '会员活动', budget: 30000, spend: 28500, redemptions: 312, revenue: 198600, roi: 5.97, status: 'active' },
  { id: 'PROMO-004', name: '双倍积分周', type: '积分活动', budget: 15000, spend: 9800, redemptions: 542, revenue: 82300, roi: 7.40, status: 'ended' },
  { id: 'PROMO-005', name: '好友邀请奖励', type: '裂变活动', budget: 20000, spend: 14200, redemptions: 128, revenue: 96800, roi: 5.82, status: 'ended' },
  { id: 'PROMO-006', name: '射击挑战赛', type: '赛事活动', budget: 40000, spend: 38200, redemptions: 96, revenue: 215400, roi: 4.64, status: 'active' },
  { id: 'PROMO-007', name: '国庆射击嘉年华', type: '节庆活动', budget: 120000, spend: 0, redemptions: 0, revenue: 0, roi: 0, status: 'scheduled' },
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

export default function PromotionsAdjustmentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended' | 'scheduled'>('all')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let list = SEED
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    if (search) list = list.filter(r => r.name.includes(search) || r.type.includes(search))
    return list
  }, [search, statusFilter])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>🎯 促销调整报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(['all', 'active', 'ended', 'scheduled'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #2a2a3e', cursor: 'pointer', fontSize: '13px',
                background: statusFilter === s ? '#4361ee' : 'transparent', color: statusFilter === s ? '#fff' : '#8892b0' }}>
              {({ all: '全部', active: '进行中', ended: '已结束', scheduled: '已计划' } as Record<string, string>)[s]}
            </button>
          ))}
          <input style={styles.input} placeholder="搜索活动名称..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button style={styles.btn} onClick={() => alert('新增促销活动...')}>+ 新建活动</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>进行中活动</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{SEED.filter(r => r.status === 'active').length}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>总预算 ¥{SEED.filter(r => r.status === 'active').reduce((s, r) => s + r.budget, 0).toLocaleString()}</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总花费</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{SEED.reduce((s, r) => s + r.spend, 0).toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>已产生核销收入</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>核销次数</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{SEED.reduce((s, r) => s + r.redemptions, 0).toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>共产生收入</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总ROI</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{(SEED.reduce((s, r) => s + r.revenue, 0) / Math.max(SEED.reduce((s, r) => s + r.spend, 0), 1)).toFixed(2)}x</div><div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>收入 ¥{SEED.reduce((s, r) => s + r.revenue, 0).toLocaleString()}</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>活动列表</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div><div>暂无数据</div></div>
        ) : (
          <>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>活动名称</th><th style={styles.th}>类型</th><th style={styles.th}>预算</th><th style={styles.th}>花费</th><th style={styles.th}>核销</th><th style={styles.th}>收入</th><th style={styles.th}>ROI</th><th style={styles.th}>状态</th>
              </tr></thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{r.name}</td>
                    <td style={styles.td}><span style={{ background: '#16213e', color: '#4361ee', borderRadius: '4px', padding: '2px 6px', fontSize: '12px' }}>{r.type}</span></td>
                    <td style={styles.td}>¥{r.budget.toLocaleString()}</td>
                    <td style={styles.td}>¥{r.spend.toLocaleString()}</td>
                    <td style={styles.td}>{r.redemptions}</td>
                    <td style={styles.td}>¥{r.revenue.toLocaleString()}</td>
                    <td style={{ ...styles.td, color: r.roi > 5 ? '#4ade80' : r.roi > 3 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{r.roi > 0 ? `${r.roi.toFixed(2)}x` : '-'}</td>
                    <td style={{ ...styles.td, color: r.status === 'active' ? '#4ade80' : r.status === 'ended' ? '#8892b0' : '#4361ee' }}>
                      {({ active: '🟢 进行中', ended: '⚪ 已结束', scheduled: '🔵 已计划' } as Record<string, string>)[r.status]}
                    </td>
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
