'use client'

import React, { useState, useMemo } from 'react'

interface SettlementRecord {
  id: string
  store: string
  period: string
  totalRevenue: number
  platformFee: number
  commission: number
  refundDeduction: number
  netSettlement: number
  status: 'settled' | 'pending' | 'disputed'
  settlementDate: string
}

const SEED: SettlementRecord[] = [
  { id: 'STL-2026-07-001', store: '陆家嘴旗舰店', period: '2026-06-16~06-30', totalRevenue: 198600, platformFee: 5960, commission: 9930, refundDeduction: 3200, netSettlement: 179510, status: 'settled', settlementDate: '2026-07-05' },
  { id: 'STL-2026-07-002', store: '静安寺店', period: '2026-06-16~06-30', totalRevenue: 132400, platformFee: 3970, commission: 6620, refundDeduction: 1850, netSettlement: 119960, status: 'settled', settlementDate: '2026-07-05' },
  { id: 'STL-2026-07-003', store: '成都IFS店', period: '2026-06-16~06-30', totalRevenue: 108300, platformFee: 3250, commission: 5415, refundDeduction: 1200, netSettlement: 98435, status: 'settled', settlementDate: '2026-07-05' },
  { id: 'STL-2026-07-004', store: '广州天河店', period: '2026-07-01~07-15', totalRevenue: 95600, platformFee: 2870, commission: 4780, refundDeduction: 850, netSettlement: 87100, status: 'pending', settlementDate: '2026-07-20' },
  { id: 'STL-2026-07-005', store: '深圳南山店', period: '2026-07-01~07-15', totalRevenue: 82300, platformFee: 2470, commission: 4115, refundDeduction: 620, netSettlement: 75095, status: 'pending', settlementDate: '2026-07-20' },
  { id: 'STL-2026-07-006', store: '杭州西湖店', period: '2026-06-16~06-30', totalRevenue: 68700, platformFee: 2060, commission: 3435, refundDeduction: 950, netSettlement: 62255, status: 'disputed', settlementDate: '2026-07-05' },
  { id: 'STL-2026-07-007', store: '南京新街口店', period: '2026-07-01~07-15', totalRevenue: 56200, platformFee: 1690, commission: 2810, refundDeduction: 430, netSettlement: 51270, status: 'pending', settlementDate: '2026-07-20' },
  { id: 'STL-2026-07-008', store: '重庆解放碑店', period: '2026-07-01~07-15', totalRevenue: 49800, platformFee: 1490, commission: 2490, refundDeduction: 380, netSettlement: 45440, status: 'pending', settlementDate: '2026-07-20' },
]

const styles = {
  container: { background: '#0f0f1a', color: '#e0e0e0', minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif" } as React.CSSProperties,
  card: { background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a3e' } as React.CSSProperties,
  input: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', width: '200px', outline: 'none' } as React.CSSProperties,
  select: { background: '#16213e', border: '1px solid #2a2a3e', color: '#e0e0e0', borderRadius: '6px', padding: '8px 12px', outline: 'none' } as React.CSSProperties,
  btn: { background: '#4361ee', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' } as React.CSSProperties,
  btnOutline: { background: 'transparent', border: '1px solid #4361ee', color: '#4361ee', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '12px' },
  th: { background: '#16213e', padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #2a2a3e', color: '#8892b0', fontSize: '12px', textTransform: 'uppercase' as const },
  td: { padding: '10px 12px', borderBottom: '1px solid #2a2a3e', fontSize: '14px' },
  pageBtn: { background: 'transparent', border: '1px solid #2a2a3e', color: '#8892b0', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
  pageBtnActive: { background: '#4361ee', border: '1px solid #4361ee', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px' },
}
const PAGE_SIZE = 5

export default function SettlementReconciliationPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'pending' | 'disputed'>('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!SEED || SEED.length === 0) return <div>暂无数据</div>

  const stats = useMemo(() => {
    const total = SEED.reduce((s, r) => ({ revenue: s.revenue + r.totalRevenue, settlement: s.settlement + r.netSettlement, fee: s.fee + r.platformFee + r.commission }), { revenue: 0, settlement: 0, fee: 0 })
    return total
  }, [])

  const filtered = useMemo(() => {
    let list = SEED
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    if (search) list = list.filter(r => r.store.includes(search) || r.id.includes(search))
    return list
  }, [search, statusFilter])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>💰 结算对账报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(['all', 'settled', 'pending', 'disputed'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #2a2a3e', cursor: 'pointer', fontSize: '13px',
                background: statusFilter === s ? '#4361ee' : 'transparent', color: statusFilter === s ? '#fff' : '#8892b0' }}>
              {({ all: '全部', settled: '已结算', pending: '待结算', disputed: '有争议' } as Record<string, string>)[s]}
            </button>
          ))}
          <input style={styles.input} placeholder="搜索门店/单号..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button style={styles.btn} onClick={() => alert('发起批量结算...')}>📤 批量结算</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>待结算金额</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{SEED.filter(r => r.status === 'pending').reduce((s, r) => s + r.netSettlement, 0).toLocaleString()}</div><div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '4px' }}>{SEED.filter(r => r.status === 'pending').length}笔待处理</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>已结算金额</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{SEED.filter(r => r.status === 'settled').reduce((s, r) => s + r.netSettlement, 0).toLocaleString()}</div><div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>{SEED.filter(r => r.status === 'settled').length}笔已到账</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>有争议金额</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{SEED.filter(r => r.status === 'disputed').reduce((s, r) => s + r.netSettlement, 0).toLocaleString()}</div><div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{SEED.filter(r => r.status === 'disputed').length}笔争议</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>平台费用</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.fee.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>平台费+佣金</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>结算明细</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div><div>暂无数据</div></div>
        ) : (
          <>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>结算单号</th><th style={styles.th}>门店</th><th style={styles.th}>周期</th><th style={styles.th}>营收</th><th style={styles.th}>费用</th><th style={styles.th}>退款扣减</th><th style={styles.th}>实结</th><th style={styles.th}>状态</th>
              </tr></thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{r.id}</td>
                    <td style={styles.td}>{r.store}</td>
                    <td style={styles.td}>{r.period}</td>
                    <td style={styles.td}>¥{r.totalRevenue.toLocaleString()}</td>
                    <td style={styles.td}>¥{(r.platformFee + r.commission).toLocaleString()}</td>
                    <td style={{ ...styles.td, color: r.refundDeduction > 1000 ? '#ef4444' : '#8892b0' }}>-¥{r.refundDeduction.toLocaleString()}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>¥{r.netSettlement.toLocaleString()}</td>
                    <td style={{ ...styles.td, color: r.status === 'settled' ? '#4ade80' : r.status === 'pending' ? '#f59e0b' : '#ef4444' }}>
                      {({ settled: '✅ 已结', pending: '⏳ 待结', disputed: '⚠️ 争议' } as Record<string, string>)[r.status]}
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
