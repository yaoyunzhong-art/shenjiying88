'use client'

import React, { useState, useMemo } from 'react'

interface TaxRecord {
  period: string
  revenue: number
  taxRate: number
  taxAmount: number
  deductible: number
  netTax: number
  status: 'paid' | 'pending' | 'overdue'
}

const SEED: TaxRecord[] = [
  { period: '2026-06', revenue: 1285600, taxRate: 6, taxAmount: 77136, deductible: 15820, netTax: 61316, status: 'paid' },
  { period: '2026-05', revenue: 1152400, taxRate: 6, taxAmount: 69144, deductible: 14350, netTax: 54794, status: 'paid' },
  { period: '2026-04', revenue: 1089300, taxRate: 6, taxAmount: 65358, deductible: 12980, netTax: 52378, status: 'paid' },
  { period: '2026-03', revenue: 985600, taxRate: 3, taxAmount: 29568, deductible: 11200, netTax: 18368, status: 'paid' },
  { period: '2026-02', revenue: 892300, taxRate: 3, taxAmount: 26769, deductible: 9850, netTax: 16919, status: 'paid' },
  { period: '2026-01', revenue: 756800, taxRate: 3, taxAmount: 22704, deductible: 8200, netTax: 14504, status: 'paid' },
  { period: '2026-07', revenue: 423500, taxRate: 6, taxAmount: 25410, deductible: 5600, netTax: 19810, status: 'pending' },
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

export default function TaxReportPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')
  const [page, setPage] = useState(0)

  const stats = useMemo(() => {
    const total = SEED.reduce((s, r) => ({ revenue: s.revenue + r.revenue, tax: s.tax + r.taxAmount, netTax: s.netTax + r.netTax }), { revenue: 0, tax: 0, netTax: 0 })
    return total
  }, [])

  const filtered = useMemo(() => {
    let list = SEED
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    if (search) list = list.filter(r => r.period.includes(search))
    return list
  }, [search, statusFilter])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>📋 税务报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(['all', 'paid', 'pending', 'overdue'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #2a2a3e', cursor: 'pointer', fontSize: '13px',
                background: statusFilter === s ? '#4361ee' : 'transparent', color: statusFilter === s ? '#fff' : '#8892b0' }}>
              {({ all: '全部', paid: '已缴', pending: '待缴', overdue: '逾期' } as Record<string, string>)[s]}
            </button>
          ))}
          <input style={styles.input} placeholder="搜索周期..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button style={styles.btn} onClick={() => alert('导出税务报表...')}>📥 导出</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总营收（报税）</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.revenue.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>近7个月</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>总税额</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.tax.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>含抵扣前</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>实际缴税</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.netTax.toLocaleString()}</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>已抵扣后可抵扣</div></div>
        <div style={styles.card}><div style={{ color: '#8892b0', fontSize: '12px' }}>平均税率</div><div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>4.7%</div><div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>3%-6%政策</div></div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>纳税明细</div>
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div><div>暂无数据</div></div>
        ) : (
          <>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>周期</th><th style={styles.th}>营收</th><th style={styles.th}>税率</th><th style={styles.th}>税额</th><th style={styles.th}>抵扣</th><th style={styles.th}>实缴</th><th style={styles.th}>状态</th>
              </tr></thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{r.period}</td>
                    <td style={styles.td}>¥{r.revenue.toLocaleString()}</td>
                    <td style={styles.td}>{r.taxRate}%</td>
                    <td style={styles.td}>¥{r.taxAmount.toLocaleString()}</td>
                    <td style={styles.td}>¥{r.deductible.toLocaleString()}</td>
                    <td style={styles.td}>¥{r.netTax.toLocaleString()}</td>
                    <td style={{ ...styles.td, color: r.status === 'paid' ? '#4ade80' : r.status === 'pending' ? '#f59e0b' : '#ef4444' }}>
                      {({ paid: '✅ 已缴', pending: '⏳ 待缴', overdue: '🔴 逾期' } as Record<string, string>)[r.status]}
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
