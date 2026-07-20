'use client'

import React, { useState, useMemo } from 'react'

// ─── Types ──────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'quarter'

interface DailySale {
  date: string
  orders: number
  revenue: number
  refunds: number
  netRevenue: number
  avgOrder: number
  topProduct: string
}

const SEED: DailySale[] = [
  { date: '2026-07-14', orders: 128, revenue: 38620, refunds: 3, netRevenue: 37420, avgOrder: 301.7, topProduct: '射击体验券' },
  { date: '2026-07-15', orders: 145, revenue: 43210, refunds: 2, netRevenue: 42610, avgOrder: 298.0, topProduct: 'VR射击套餐' },
  { date: '2026-07-16', orders: 112, revenue: 30180, refunds: 5, netRevenue: 27980, avgOrder: 269.5, topProduct: '射击体验券' },
  { date: '2026-07-17', orders: 168, revenue: 52850, refunds: 4, netRevenue: 51250, avgOrder: 314.6, topProduct: '会员续费' },
  { date: '2026-07-18', orders: 198, revenue: 62370, refunds: 6, netRevenue: 59970, avgOrder: 315.0, topProduct: 'VR射击套餐' },
  { date: '2026-07-19', orders: 203, revenue: 68920, refunds: 1, netRevenue: 68520, avgOrder: 339.5, topProduct: '团购射击套餐' },
  { date: '2026-07-20', orders: 87, revenue: 25680, refunds: 2, netRevenue: 24480, avgOrder: 295.2, topProduct: '射击体验券' },
  { date: '2026-07-21', orders: 42, revenue: 12340, refunds: 0, netRevenue: 12340, avgOrder: 293.8, topProduct: '会员续费' },
]

const PERIOD_LABELS: Record<Period, string> = ['today', 'week', 'month', 'quarter'].reduce((acc, k) => ({ ...acc, [k]: { today: '今日', week: '本周', month: '本月', quarter: '本季' }[k] }), {}) as Record<Period, string>

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

export default function SalesSummaryPage() {
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<Period>('week')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!SEED || SEED.length === 0) return <div>暂无数据</div>

  const stats = useMemo(() => {
    const total = SEED.reduce((s, r) => ({ orders: s.orders + r.orders, revenue: s.revenue + r.revenue, refunds: s.refunds + r.refunds, netRevenue: s.netRevenue + r.netRevenue }), { orders: 0, revenue: 0, refunds: 0, netRevenue: 0 })
    return { ...total, avgOrder: total.revenue / total.orders }
  }, [])

  const filtered = useMemo(() => {
    return SEED.filter(r => !search || r.date.includes(search) || r.topProduct.includes(search))
  }, [search])

  const paged = useMemo(() => {
    const start = page * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>📊 销售汇总报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select style={styles.select} value={period} onChange={e => { setPeriod(e.target.value as Period); setPage(0) }}>
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="quarter">本季</option>
          </select>
          <input style={styles.input} placeholder="搜索日期/商品..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button style={styles.btn} onClick={() => alert('导出销售汇总...')}>📥 导出</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>总订单</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{stats.orders.toLocaleString()}</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>↑ 12.3% vs 上周</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>总收入</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.revenue.toLocaleString()}</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>↑ 15.8% vs 上周</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>净收入</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.netRevenue.toLocaleString()}</div>
          <div style={{ color: '#8892b0', fontSize: '11px', marginTop: '4px' }}>退款: {stats.refunds}笔</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>平均客单价</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{stats.avgOrder.toFixed(1)}</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>↑ 3.2% vs 上周</div>
        </div>
      </div>

      {/* 订单趋势占位 */}
      <div style={{ ...styles.card, marginBottom: '20px', padding: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>📈 销售趋势（模拟图表占位）</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
          {SEED.slice(-7).map((r, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: `${(r.revenue / 70000) * 100}px`, background: '#4361ee', borderRadius: '4px 4px 0 0', minHeight: '8px' }} />
              <div style={{ fontSize: '10px', color: '#8892b0', marginTop: '4px' }}>{r.date.slice(-5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 每日明细 */}
      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>每日销售明细</div>
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
                  <th style={styles.th}>日期</th>
                  <th style={styles.th}>订单数</th>
                  <th style={styles.th}>收入</th>
                  <th style={styles.th}>退款</th>
                  <th style={styles.th}>净收入</th>
                  <th style={styles.th}>客单价</th>
                  <th style={styles.th}>热销商品</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{r.date}</td>
                    <td style={styles.td}>{r.orders}</td>
                    <td style={styles.td}>¥{r.revenue.toLocaleString()}</td>
                    <td style={styles.td}><span style={{ color: r.refunds > 3 ? '#ef4444' : '#8892b0' }}>{r.refunds}</span></td>
                    <td style={styles.td}>¥{r.netRevenue.toLocaleString()}</td>
                    <td style={styles.td}>¥{r.avgOrder.toFixed(1)}</td>
                    <td style={styles.td}>{r.topProduct}</td>
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
