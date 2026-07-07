'use client'

/**
 * Phase-43 T173: 数据分析工作台
 *
 * 5 大模块:
 *  - Cohort 同期群留存矩阵 (热力图)
 *  - Funnel 漏斗转化分析
 *  - Retention 留存健康度评分
 *  - Metrics 仪表板 (DAU/转化/营收)
 *  - 实时事件流 + CDC 状态
 */

import React from 'react';
import { useEffect, useState } from 'react'

interface CohortMatrix {
  cohort: string
  size: number
  retention: number[]
}

interface FunnelResult {
  id: string
  name: string
  totalConversionRate: number
  stepResults: Array<{
    stepName: string
    enteredCount: number
    conversionRate: number
    dropOffRate: number
  }>
}

interface RetentionHealth {
  score: number
  level: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
  d1: number
  d7: number
  d30: number
  recommendations: string[]
}

interface MetricCard {
  name: string
  value: number
  unit: string
  change?: number
  trend?: 'UP' | 'DOWN' | 'STABLE'
}

interface MetricsSummary {
  tenantId: string
  period: string
  metrics: MetricCard[]
  series: {
    dau: Array<{ timestamp: string; value: number }>
    events: Array<{ timestamp: string; value: number }>
    revenue: Array<{ timestamp: string; value: number }>
  }
}

interface CDCStatus {
  currentWatermark: number
  events: number
}

const TENANT = 'demo-tenant'

export default function AnalyticsV2Workbench() {
  const [cohorts, setCohorts] = useState<CohortMatrix[]>([])
  const [funnels, setFunnels] = useState<FunnelResult[]>([])
  const [retentionHealth, setRetentionHealth] = useState<RetentionHealth | null>(null)
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [cdcStatus, setCdcStatus] = useState<CDCStatus | null>(null)
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟数据 (生产环境从 /analytics-v2/* API 获取)
  useEffect(() => {
    const demoCohorts: CohortMatrix[] = [
      { cohort: '2025-W22', size: 120, retention: [1, 0.45, 0.32, 0.21, 0.15, 0.10] },
      { cohort: '2025-W23', size: 145, retention: [1, 0.52, 0.38, 0.25, 0.18, 0.12] },
      { cohort: '2025-W24', size: 168, retention: [1, 0.48, 0.35, 0.22, 0.16, 0.11] },
      { cohort: '2025-W25', size: 192, retention: [1, 0.55, 0.42, 0.28, 0.20, 0.14] },
      { cohort: '2025-W26', size: 215, retention: [1, 0.58, 0.45, 0.30, 0.22, 0.15] }
    ]

    const demoFunnels: FunnelResult[] = [
      {
        id: 'f1',
        name: '电商转化漏斗',
        totalConversionRate: 0.18,
        stepResults: [
          { stepName: '浏览商品', enteredCount: 1000, conversionRate: 1, dropOffRate: 0 },
          { stepName: '加入购物车', enteredCount: 450, conversionRate: 0.45, dropOffRate: 0.55 },
          { stepName: '提交订单', enteredCount: 280, conversionRate: 0.62, dropOffRate: 0.38 },
          { stepName: '完成支付', enteredCount: 180, conversionRate: 0.64, dropOffRate: 0.36 }
        ]
      }
    ]

    const demoHealth: RetentionHealth = {
      score: 72,
      level: 'GOOD',
      d1: 0.55,
      d7: 0.32,
      d30: 0.18,
      recommendations: [
        'D1 = 55% 表现良好',
        'D7 留存有提升空间, 建议增加 7 日回流激励',
        'D30 = 18% 可接受, 继续观察'
      ]
    }

    const demoSummary: MetricsSummary = {
      tenantId: TENANT,
      period: '7d',
      metrics: [
        { name: '总事件数', value: 12580, unit: 'count', trend: 'UP' },
        { name: '活跃会员数', value: 3450, unit: 'members', trend: 'UP' },
        { name: '转化率', value: 0.062, unit: 'ratio', trend: 'UP' },
        { name: '点击率', value: 0.182, unit: 'ratio', trend: 'STABLE' },
        { name: '营收', value: 12580000, unit: 'cents', trend: 'UP' },
        { name: '漏斗数', value: 4, unit: 'count' },
        { name: '留存期数', value: 2, unit: 'periods' },
        { name: 'Cohort 数', value: 12, unit: 'cohorts' }
      ],
      series: {
        dau: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
          value: 2800 + Math.floor(Math.random() * 800)
        })),
        events: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
          value: 1500 + Math.floor(Math.random() * 500)
        })),
        revenue: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
          value: 1500000 + Math.floor(Math.random() * 500000)
        }))
      }
    }

    const demoCdc: CDCStatus = {
      currentWatermark: Date.now(),
      events: 1248
    }

    const demoEvents = [
      { id: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'home', timestamp: new Date().toISOString() },
      { id: 'e2', type: 'CLICK', who: 'm2', what: 'add_cart', timestamp: new Date().toISOString() },
      { id: 'e3', type: 'PURCHASE', who: 'm3', what: 'checkout', revenueCents: 12800, timestamp: new Date().toISOString() }
    ]

    setTimeout(() => {
      setCohorts(demoCohorts)
      setFunnels(demoFunnels)
      setRetentionHealth(demoHealth)
      setSummary(demoSummary)
      setCdcStatus(demoCdc)
      setRecentEvents(demoEvents)
      setLoading(false)
    }, 300)
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">📊 数据分析工作台</h1>
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📊 数据分析工作台</h1>
        <span className="text-sm text-gray-500">Phase-43 T173 · tenant: {TENANT}</span>
      </div>

      {/* 指标卡 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">📈 核心指标 (近 7 天)</h2>
        <div className="grid grid-cols-4 gap-4">
          {summary?.metrics.map((m, i) => (
            <div key={i} className="bg-white p-4 rounded shadow border">
              <div className="text-sm text-gray-500">{m.name}</div>
              <div className="text-2xl font-bold mt-1">
                {m.unit === 'cents' ? `¥${(m.value / 100).toFixed(2)}` : m.value.toLocaleString()}
                {m.unit === 'ratio' && ' (' + (m.value * 100).toFixed(1) + '%)'}
              </div>
              {m.trend && (
                <span className={`text-xs mt-1 inline-block ${
                  m.trend === 'UP' ? 'text-green-600' :
                  m.trend === 'DOWN' ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {m.trend === 'UP' ? '↑' : m.trend === 'DOWN' ? '↓' : '→'} {m.trend}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Cohort 同期群留存矩阵 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">🔥 Cohort 留存矩阵 (周维度)</h2>
        <div className="bg-white rounded shadow border overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-sm font-semibold">Cohort</th>
                <th className="px-3 py-2 text-sm font-semibold">Size</th>
                <th className="px-3 py-2 text-sm font-semibold">D0</th>
                <th className="px-3 py-2 text-sm font-semibold">D1</th>
                <th className="px-3 py-2 text-sm font-semibold">D7</th>
                <th className="px-3 py-2 text-sm font-semibold">D30</th>
                <th className="px-3 py-2 text-sm font-semibold">D60</th>
                <th className="px-3 py-2 text-sm font-semibold">D90</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-sm">{c.cohort}</td>
                  <td className="px-3 py-2 text-sm">{c.size}</td>
                  {c.retention.map((r, j) => (
                    <td key={j} className="px-3 py-2 text-sm">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-white"
                        style={{
                          backgroundColor: r < 0 ? '#e5e7eb' :
                            r > 0.5 ? '#10b981' :
                            r > 0.3 ? '#3b82f6' :
                            r > 0.15 ? '#f59e0b' : '#ef4444',
                          color: r < 0.15 ? 'white' : 'white',
                          opacity: r < 0 ? 0.3 : 1
                        }}
                      >
                        {r < 0 ? '—' : (r * 100).toFixed(0) + '%'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Funnel + Retention */}
      <div className="grid grid-cols-2 gap-6">
        {/* Funnel */}
        <section>
          <h2 className="text-xl font-semibold mb-3">⏬ 漏斗转化分析</h2>
          {funnels.map(f => {
            const firstCount = f.stepResults[0]?.enteredCount ?? 1
            return (
              <div key={f.id} className="bg-white p-4 rounded shadow border">
                <h3 className="font-semibold mb-3">{f.name}</h3>
                <div className="space-y-2">
                  {f.stepResults.map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm">
                        <span>{s.stepName}</span>
                        <span className="font-mono">
                          {s.enteredCount.toLocaleString()} ({((s.enteredCount / firstCount) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded mt-1">
                        <div
                          className="h-full bg-blue-500 rounded transition-all"
                          style={{ width: (s.enteredCount / firstCount) * 100 + '%' }}
                        />
                      </div>
                      {i > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          步转化 {(s.conversionRate * 100).toFixed(1)}% · 流失 {(s.dropOffRate * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t text-sm">
                  <span className="text-gray-500">总转化率:</span>{' '}
                  <span className="font-bold text-blue-600">{(f.totalConversionRate * 100).toFixed(2)}%</span>
                </div>
              </div>
            )
          })}
        </section>

        {/* Retention 健康度 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">💗 留存健康度</h2>
          {retentionHealth && (
            <div className="bg-white p-4 rounded shadow border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-500">综合评分</div>
                  <div className="text-4xl font-bold" style={{
                    color: retentionHealth.level === 'EXCELLENT' ? '#10b981' :
                           retentionHealth.level === 'GOOD' ? '#3b82f6' :
                           retentionHealth.level === 'FAIR' ? '#f59e0b' : '#ef4444'
                  }}>
                    {retentionHealth.score}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${
                  retentionHealth.level === 'EXCELLENT' ? 'bg-green-100 text-green-700' :
                  retentionHealth.level === 'GOOD' ? 'bg-blue-100 text-blue-700' :
                  retentionHealth.level === 'FAIR' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {retentionHealth.level}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>D1 留存</span>
                  <span className="font-mono">{(retentionHealth.d1 * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>D7 留存</span>
                  <span className="font-mono">{(retentionHealth.d7 * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>D30 留存</span>
                  <span className="font-mono">{(retentionHealth.d30 * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-gray-500 mb-2">建议</div>
                <ul className="text-sm space-y-1">
                  {retentionHealth.recommendations.map((r, i) => (
                    <li key={i} className="text-gray-700">• {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* CDC + 实时事件流 */}
      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">🔄 CDC 增量同步状态</h2>
          {cdcStatus && (
            <div className="bg-white p-4 rounded shadow border">
              <div className="text-sm text-gray-500">当前 Watermark</div>
              <div className="font-mono text-lg">{cdcStatus.currentWatermark.toLocaleString()}</div>
              <div className="mt-2 text-sm text-gray-500">已同步事件数</div>
              <div className="font-mono text-lg">{cdcStatus.events.toLocaleString()}</div>
              <div className="mt-2 text-xs text-green-600">✓ watermark 单调递增 · 重放幂等</div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">⚡ 实时事件流</h2>
          <div className="bg-white rounded shadow border">
            <ul className="divide-y">
              {recentEvents.map((e, i) => (
                <li key={i} className="px-4 py-2 text-sm flex justify-between">
                  <span>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      e.type === 'PURCHASE' ? 'bg-green-500' :
                      e.type === 'CLICK' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    {e.type} · {e.what}
                  </span>
                  <span className="text-gray-500 text-xs font-mono">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* 反模式 v4 提示 */}
      <section className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
        <h3 className="font-semibold text-blue-900 mb-2">🛡️ 反模式 v4 防御已激活 (38 文件)</h3>
        <ul className="text-blue-800 space-y-1 text-xs">
          <li>• event-tracking-pattern: PII 脱敏 + 幂等键 + 5W1H + 服务端时间戳 + properties ≤ 50</li>
          <li>• cohort-bias-pattern: ISO 周对齐 + cohort_size ≥ 10 + 失活 ≠ 流失 + 加权平均</li>
          <li>• cdc-consistency-pattern: watermark 单调递增 + 重放幂等 + DELETED 必须 before</li>
        </ul>
      </section>
    </div>
  )
}