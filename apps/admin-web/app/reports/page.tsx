'use client'

/**
 * Phase-39 T169: 报表中心页面 (admin-web)
 *
 * 集成 ECharts CDN, 5+ 图表:
 *  1. 营收趋势 (line)
 *  2. 商品 Top N 排行 (bar)
 *  3. 支付方式占比 (pie)
 *  4. 时段热力图 (heatmap)
 *  5. 订单转化漏斗 (funnel)
 *  6. 库存周转 (gauge)
 *
 * 反模式 v4 防御:
 *  - TenantGuard: 强制 tenantId
 *  - 缓存感知: 显示 ⚡ Cached 标识
 *  - 导出防御: csv-injection 服务端处理
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { buildChartOption } from './reports-utils'
import type { ReportResult, ReportTab } from './reports-utils'

declare global {
  interface Window {
    echarts?: any
  }
}

// ─── ECharts CDN Loader ──────────────────────────────────

let echartsLoading: Promise<any> | null = null

function loadECharts(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject('SSR')
  if (window.echarts) return Promise.resolve(window.echarts)
  if (echartsLoading) return echartsLoading
  echartsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
    script.onload = () => resolve(window.echarts)
    script.onerror = () => reject(new Error('Failed to load ECharts'))
    document.head.appendChild(script)
  })
  return echartsLoading
}

// ─── 通用样式 ─────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16
}

const TAB_STYLE: React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderBottom: '2px solid transparent',
  fontSize: 14,
  fontWeight: 500,
  color: '#6b7280'
}

const TAB_ACTIVE: React.CSSProperties = {
  ...TAB_STYLE,
  color: '#2563eb',
  borderBottom: '2px solid #2563eb'
}

// ─── 主页面 ──────────────────────────────────────────────

export default function ReportsPage() {
  const [tenantId, setTenantId] = useState('demo-tenant')
  const [from, setFrom] = useState('2024-06-01')
  const [to, setTo] = useState('2024-06-30')
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue')
  const [report, setReport] = useState<ReportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportStats, setReportStats] = useState<{
    todayNew: number;
    pendingReview: number;
    published: number;
    total: number;
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [exportToast, setExportToast] = useState<string | null>(null)
  const [echartsReady, setEchartsReady] = useState(false)

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)

  // 加载报表统计汇总
  const loadStats = useCallback(async () => {
    if (!tenantId) return
    setStatsLoading(true)
    try {
      const res = await fetch(`/api/reports/stats/summary?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setReportStats(data)
      }
    } catch {
      // 统计汇总为辅助信息，加载失败不阻塞页面
    } finally {
      setStatsLoading(false)
    }
  }, [tenantId])

  // 加载 ECharts
  useEffect(() => {
    loadECharts()
      .then(() => setEchartsReady(true))
      .catch((e) => console.error('ECharts load failed:', e))
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const loadReport = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/${activeTab}?tenantId=${tenantId}&from=${from}&to=${to}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data: ReportResult = await res.json()
      setReport(data)
    } catch (e: any) {
      setError(e.message)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId, from, to, activeTab])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  // 渲染图表
  useEffect(() => {
    if (!echartsReady || !chartRef.current || !report) return
    if (!chartInstance.current) {
      chartInstance.current = window.echarts!.init(chartRef.current)
    }
    const option = buildChartOption(activeTab, report)
    chartInstance.current.setOption(option, true)
  }, [echartsReady, report, activeTab])

  // 窗口尺寸变化
  useEffect(() => {
    const handler = () => chartInstance.current?.resize()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const exportReport = async (format: 'csv' | 'json' | 'html') => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/reports/export?type=${activeTab}&format=${format}&tenantId=${tenantId}&from=${from}&to=${to}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)
      setExportToast(`已导出 ${data.filename} (${format.toUpperCase()})`)
      setTimeout(() => setExportToast(null), 3000)
    } catch (e: any) {
      setError(`导出失败: ${e.message}`)
    }
  }

  const invalidateCache = async () => {
    if (!tenantId) return
    try {
      const res = await fetch('/api/reports/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      })
      const data = await res.json()
      setExportToast(`已失效 ${data.invalidated} 条缓存`)
      setTimeout(() => setExportToast(null), 3000)
      loadReport()
    } catch (e: any) {
      setError(`失效失败: ${e.message}`)
    }
  }

  return (
    <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>📊 报表中心</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>Phase-39 T169 · 10 类内置报表 + 多维聚合 + LRU 缓存</p>
      </header>

      {/* 报表统计汇总条 */}
      <div style={{ ...CARD_STYLE, display: 'flex', gap: 16, marginBottom: 16 }} data-testid="stats-summary-bar">
        {[
          { label: '今日新增', key: 'todayNew', icon: '📝', color: '#2563eb' },
          { label: '待审核', key: 'pendingReview', icon: '⏳', color: '#f59e0b' },
          { label: '已发布', key: 'published', icon: '✅', color: '#10b981' },
          { label: '总报表', key: 'total', icon: '📊', color: '#8b5cf6' },
        ].map(stat => (
          <div
            key={stat.key}
            data-testid={`stat-card-${stat.key}`}
            style={{
              flex: 1,
              background: '#f9fafb',
              borderRadius: 8,
              padding: '16px 20px',
              textAlign: 'center',
              borderLeft: `4px solid ${stat.color}`,
            }}
          >
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
              {stat.icon} {stat.label}
            </div>
            <div
              data-testid={`stat-value-${stat.key}`}
              style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}
            >
              {statsLoading
                ? '…'
                : reportStats
                  ? String((reportStats as Record<string, number>)[stat.key] ?? 0)
                  : '-'}
            </div>
          </div>
        ))}
      </div>

      {/* 顶部控件 */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>租户</label>
            <input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 180 }}
              data-testid="tenant-input"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>开始</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              data-testid="from-input"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>结束</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              data-testid="to-input"
            />
          </div>
          <button
            onClick={loadReport}
            disabled={loading}
            style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
          >
            {loading ? '加载中…' : '查询'}
          </button>
          <button
            onClick={invalidateCache}
            data-testid="invalidate-btn"
            style={{ padding: '8px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
          >
            ⚡ 失效缓存
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div style={{ ...CARD_STYLE, padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          {[
            { key: 'revenue', label: '📈 营收趋势' },
            { key: 'product-ranking', label: '🏆 商品排行' },
            { key: 'payment-mix', label: '💳 支付占比' },
            { key: 'hourly-heatmap', label: '🔥 时段热力' },
            { key: 'order', label: '🎯 订单漏斗' },
            { key: 'inventory', label: '📦 库存周转' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as ReportTab)}
              style={activeTab === t.key ? TAB_ACTIVE : TAB_STYLE}
              data-testid={`tab-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 16 }}>
          {/* 元数据 */}
          {report && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
              <span>📅 {report.period.from} → {report.period.to}</span>
              <span>📊 {report.rows.length} 行</span>
              <span>🕒 生成于 {new Date(report.generatedAt).toLocaleString('zh-CN')}</span>
              {report.cached && <span style={{ color: '#f59e0b' }}>⚡ Cached</span>}
            </div>
          )}

          {/* 错误 */}
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 6, marginBottom: 12 }}>
              ❌ {error}
            </div>
          )}

          {/* 导出按钮 */}
          {report && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => exportReport('csv')} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                📥 CSV
              </button>
              <button onClick={() => exportReport('json')} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                📥 JSON
              </button>
              <button onClick={() => exportReport('html')} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                📥 HTML
              </button>
            </div>
          )}

          {/* 图表区 */}
          <div
            ref={chartRef}
            data-testid="chart-container"
            style={{ width: '100%', height: 480, background: '#fff', borderRadius: 6 }}
          />

          {/* 数据表 */}
          {report && report.rows.length > 0 && (
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {report.columns.map(c => (
                      <th key={c.field} style={{ padding: '8px 12px', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left', fontWeight: 600 }}>
                        {c.alias}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {report.columns.map(c => (
                        <td key={c.field} style={{ padding: '8px 12px' }}>
                          {String(row[c.field] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {report.totals && (
                  <tfoot>
                    <tr style={{ background: '#f3f4f6', fontWeight: 600 }}>
                      {report.columns.map(c => (
                        <td key={c.field} style={{ padding: '8px 12px', borderTop: '2px solid #d1d5db' }}>
                          {String(report.totals![c.field] ?? (c.type === 'dimension' ? '合计' : ''))}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {exportToast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000 }}>
          ✅ {exportToast}
        </div>
      )}

      {error && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000 }}>
          ❌ {error}
        </div>
      )}
    </div>
  )
}

