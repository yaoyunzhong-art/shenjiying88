'use client'

import React, { useState, useMemo } from 'react'

interface ComparisonRecord {
  period: string
  metric: string
  current: number
  previous: number
  change: number
  direction: 'up' | 'down' | 'flat'
}

const SEED: ComparisonRecord[] = [
  { period: '本周 vs 上周', metric: '营收', current: 358620, previous: 325840, change: 10.1, direction: 'up' },
  { period: '本周 vs 上周', metric: '订单数', current: 1083, previous: 986, change: 9.8, direction: 'up' },
  { period: '本周 vs 上周', metric: '客单价', current: 312.5, previous: 296.8, change: 5.3, direction: 'up' },
  { period: '本周 vs 上周', metric: '退款率', current: 2.1, previous: 2.8, change: 25.0, direction: 'down' },
  { period: '本月 vs 上月', metric: '营收', current: 1425600, previous: 1289200, change: 10.6, direction: 'up' },
  { period: '本月 vs 上月', metric: '新增会员', current: 326, previous: 285, change: 14.4, direction: 'up' },
  { period: '本月 vs 上月', metric: '新客占比', current: 38.2, previous: 35.6, change: 7.3, direction: 'up' },
  { period: '本月 vs 上月', metric: '活跃率', current: 72.5, previous: 68.3, change: 6.2, direction: 'up' },
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
}

export default function SalesComparisonPage() {
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <div>加载中...</div>
  if (error) return <div>数据获取失败: {error}</div>
  if (!SEED || SEED.length === 0) return <div>暂无数据</div>

  const filtered = useMemo(() => {
    let list = SEED
    if (periodFilter !== 'all') list = list.filter(r => r.period === periodFilter)
    if (search) list = list.filter(r => r.metric.includes(search) || r.period.includes(search))
    return list
  }, [search, periodFilter])

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>📊 销售对比报表</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select style={styles.select} value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}>
            <option value="all">全部周期</option>
            <option value="本周 vs 上周">本周 vs 上周</option>
            <option value="本月 vs 上月">本月 vs 上月</option>
          </select>
          <input style={styles.input} placeholder="搜索指标..." value={search} onChange={e => setSearch(e.target.value)} />
          <button style={styles.btn} onClick={() => alert('导出对比数据...')}>📥 导出</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>本周营收</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{SEED[0].current.toLocaleString()}</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>↑ {SEED[0].change}% vs 上周</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>本周订单</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{SEED[1].current.toLocaleString()}</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>↑ {SEED[1].change}% vs 上周</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>本月营收</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>¥{SEED[4].current.toLocaleString()}</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>↑ {SEED[4].change}% vs 上月</div>
        </div>
        <div style={styles.card}>
          <div style={{ color: '#8892b0', fontSize: '12px' }}>退款率变化</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{SEED[3].previous}% → {SEED[3].current}%</div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>↓ 改善 {SEED[3].change}%</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>指标对比</div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8892b0' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div><div>暂无数据</div></div>
        ) : (
          <>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>对比周期</th><th style={styles.th}>指标</th><th style={styles.th}>本期</th><th style={styles.th}>上期</th><th style={styles.th}>变化</th><th style={styles.th}>趋势</th>
              </tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{r.period}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{r.metric}</td>
                    <td style={styles.td}>{r.metric === '退款率' || r.metric === '客单价' || r.metric === '活跃率' || r.metric === '新客占比' ? `${r.current}${r.metric === '退款率' ? '%' : r.metric === '客单价' ? '' : '%'}` : `¥${r.current.toLocaleString()}`}</td>
                    <td style={styles.td}>{r.metric === '退款率' || r.metric === '客单价' || r.metric === '活跃率' || r.metric === '新客占比' ? `${r.previous}${r.metric === '退款率' ? '%' : r.metric === '客单价' ? '' : '%'}` : `¥${r.previous.toLocaleString()}`}</td>
                    <td style={{ ...styles.td, color: r.direction === 'up' ? '#4ade80' : r.direction === 'down' ? '#ef4444' : '#8892b0' }}>
                      {r.direction === 'up' ? '↑' : r.direction === 'down' ? '↓' : '→'} {r.change}%
                    </td>
                    <td style={{ ...styles.td, fontSize: '18px' }}>{r.direction === 'up' ? '📈' : r.direction === 'down' ? '📉' : '➡️'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
