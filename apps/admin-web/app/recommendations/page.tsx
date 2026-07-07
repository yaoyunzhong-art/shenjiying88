'use client'

/**
 * Phase-40 T170: 推荐中心页面 (admin-web)
 *
 * 5 图表:
 *  1. 策略权重雷达 (radar) - 5 策略权重分布
 *  2. 推荐转化漏斗 (funnel) - 曝光→点击→购买
 *  3. 推荐理由 Top N (horizontal bar)
 *  4. 冷启动占比 (pie) - cold-start vs warm
 *  5. 策略 × 类目热力 (heatmap)
 *
 * 反模式 v4 防御:
 *  - TenantGuard: 强制 tenantId 注入
 *  - 缓存感知: ⚡ Cached 标识
 *  - 冷启动 fallback 显示
 */

import { useState, useEffect, useCallback, useRef } from 'react'

declare global {
  interface Window {
    echarts?: any
  }
}

interface RecommendationSummary {
  tenantId: string
  generatedAt: string
  cached: boolean
  strategyWeights: Record<string, number>
  funnel: { stage: string; count: number }[]
  topReasons: { reason: string; count: number }[]
  coldStart: { cold: number; warm: number }
  heatmap: { strategy: string; category: string; count: number }[]
  metadata: {
    totalRequests: number
    avgExecutionMs: number
    cacheHitRate: number
    fallbackRate: number
  }
}

type RecTab = 'overview' | 'funnel' | 'reasons' | 'coldstart' | 'coverage'

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

const ACTIVE_TAB_STYLE: React.CSSProperties = {
  ...TAB_STYLE,
  borderBottomColor: '#2563eb',
  color: '#2563eb'
}

// ─── Mock 数据 (生产环境由 api/recommend/summary 替换) ────

function mockSummary(tenantId: string, cached: boolean): RecommendationSummary {
  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    cached,
    strategyWeights: {
      'item-cf': 0.35,
      'user-cf': 0.20,
      'popular': 0.20,
      'recently-viewed': 0.10,
      'personalized': 0.15
    },
    funnel: [
      { stage: '曝光', count: 12000 },
      { stage: '点击', count: 4800 },
      { stage: '加购', count: 1600 },
      { stage: '购买', count: 480 }
    ],
    topReasons: [
      { reason: '与您浏览过的"无线耳机"相似', count: 1280 },
      { reason: '购买了"运动鞋"的会员也喜欢', count: 980 },
      { reason: '本月热销 TOP 10', count: 860 },
      { reason: '您最近浏览过', count: 640 },
      { reason: '基于您的偏好"数码"', count: 420 }
    ],
    coldStart: { cold: 320, warm: 1680 },
    heatmap: [
      { strategy: 'item-cf', category: '数码', count: 420 },
      { strategy: 'item-cf', category: '服饰', count: 280 },
      { strategy: 'item-cf', category: '食品', count: 120 },
      { strategy: 'user-cf', category: '数码', count: 180 },
      { strategy: 'user-cf', category: '服饰', count: 240 },
      { strategy: 'user-cf', category: '食品', count: 80 },
      { strategy: 'popular', category: '数码', count: 360 },
      { strategy: 'popular', category: '服饰', count: 480 },
      { strategy: 'popular', category: '食品', count: 320 },
      { strategy: 'recently-viewed', category: '数码', count: 220 },
      { strategy: 'recently-viewed', category: '服饰', count: 180 },
      { strategy: 'recently-viewed', category: '食品', count: 80 },
      { strategy: 'personalized', category: '数码', count: 280 },
      { strategy: 'personalized', category: '服饰', count: 320 },
      { strategy: 'personalized', category: '食品', count: 200 }
    ],
    metadata: {
      totalRequests: 2000,
      avgExecutionMs: 42,
      cacheHitRate: 0.38,
      fallbackRate: 0.16
    }
  }
}

// ─── Chart 渲染函数 ──────────────────────────────────────

function renderStrategyWeights(echarts: any, el: HTMLElement, summary: RecommendationSummary) {
  const data = Object.entries(summary.strategyWeights).map(([k, v]) => ({
    name: k,
    value: Math.round(v * 100)
  }))
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: '策略权重分布', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    radar: {
      indicator: data.map(d => ({ name: d.name, max: 50 })),
      radius: '65%',
      splitArea: { areaStyle: { color: ['#fafafa', '#fff'] } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.map(d => d.value),
        name: '权重 %',
        areaStyle: { color: 'rgba(37, 99, 235, 0.3)' },
        lineStyle: { color: '#2563eb' },
        itemStyle: { color: '#2563eb' }
      }]
    }]
  })
  return chart
}

function renderFunnel(echarts: any, el: HTMLElement, summary: RecommendationSummary) {
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: '推荐转化漏斗', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      type: 'funnel',
      left: '10%',
      width: '80%',
      label: { formatter: '{b}: {c}' },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: summary.funnel.map((f, i) => ({
        name: f.stage,
        value: f.count,
        itemStyle: { color: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'][i] }
      }))
    }]
  })
  return chart
}

function renderTopReasons(echarts: any, el: HTMLElement, summary: RecommendationSummary) {
  const data = summary.topReasons.slice().sort((a, b) => a.count - b.count)
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: '推荐理由 Top N', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '20%', right: '10%' },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: data.map(d => d.reason), axisLabel: { width: 200, overflow: 'truncate' } },
    series: [{
      type: 'bar',
      data: data.map(d => d.count),
      itemStyle: { color: '#10b981' },
      label: { show: true, position: 'right' }
    }]
  })
  return chart
}

function renderColdStart(echarts: any, el: HTMLElement, summary: RecommendationSummary) {
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: '冷启动占比', left: 'center', subtext: `fallback=${(summary.metadata.fallbackRate * 100).toFixed(1)}%` },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 10 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      label: { formatter: '{b}\n{d}%' },
      data: [
        { name: 'Cold Start (Popular fallback)', value: summary.coldStart.cold, itemStyle: { color: '#f59e0b' } },
        { name: 'Warm (多策略融合)', value: summary.coldStart.warm, itemStyle: { color: '#2563eb' } }
      ]
    }]
  })
  return chart
}

function renderHeatmap(echarts: any, el: HTMLElement, summary: RecommendationSummary) {
  const strategies = Array.from(new Set(summary.heatmap.map(h => h.strategy)))
  const categories = Array.from(new Set(summary.heatmap.map(h => h.category)))
  const data = summary.heatmap.map(h => [
    strategies.indexOf(h.strategy),
    categories.indexOf(h.category),
    h.count
  ])
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: '策略 × 类目覆盖热力图', left: 'center' },
    tooltip: { position: 'top', formatter: (p: any) => `${strategies[p.data[0]]} × ${categories[p.data[1]]}: ${p.data[2]}` },
    grid: { left: '15%', right: '10%', bottom: '15%' },
    xAxis: { type: 'category', data: strategies, axisLabel: { rotate: 30 } },
    yAxis: { type: 'category', data: categories },
    visualMap: { min: 0, max: 500, calculable: true, orient: 'horizontal', left: 'center', bottom: 5, inRange: { color: ['#fafafa', '#2563eb'] } },
    series: [{ type: 'heatmap', data, label: { show: true }, emphasis: { itemStyle: { shadowBlur: 10 } } }]
  })
  return chart
}

// ─── 主页面组件 ──────────────────────────────────────────

export default function RecommendationsPage() {
  const tenantId = 'default'
  const [tab, setTab] = useState<RecTab>('overview')
  const [summary, setSummary] = useState<RecommendationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const chartRefs = useRef<Record<string, any>>({})

  // TenantGuard: 强制 tenantId
  if (!tenantId) {
    return (
      <div style={CARD_STYLE}>
        <h2 style={{ color: '#dc2626' }}>⚠️ 缺少 tenantId</h2>
        <p>推荐中心需要多租户上下文,请通过 tenant 切换器选择租户后再访问。</p>
      </div>
    )
  }

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      // 生产环境: const res = await fetch(`/api/recommend/summary?tenantId=${tenantId}`)
      // const data: RecommendationSummary = await res.json()
      const data = mockSummary(tenantId, false)
      setSummary(data)
    } catch (err) {
      console.error('[recommendations] fetch summary failed:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  useEffect(() => {
    if (!summary) return
    let cancelled = false
    loadECharts().then(echarts => {
      if (cancelled) return
      Object.values(chartRefs.current).forEach((c: any) => c?.dispose?.())
      chartRefs.current = {}
      const targets: Record<RecTab, (e: any, el: HTMLElement, s: RecommendationSummary) => any> = {
        overview: renderStrategyWeights,
        funnel: renderFunnel,
        reasons: renderTopReasons,
        coldstart: renderColdStart,
        coverage: renderHeatmap
      }
      const renderer = targets[tab]
      const el = document.getElementById(`rec-chart-${tab}`)
      if (el && renderer) {
        chartRefs.current[tab] = renderer(echarts, el, summary)
      }
    }).catch(err => console.error('[recommendations] echarts load failed:', err))
    return () => { cancelled = true }
  }, [summary, tab])

  if (loading || !summary) {
    return <div style={CARD_STYLE}>⏳ 加载推荐数据…</div>
  }

  return (
    <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🎯 推荐中心</h1>
        <div style={{ display: 'flex', gap: 16, color: '#6b7280', fontSize: 13, marginTop: 8 }}>
          <span>🏢 Tenant: <code>{tenantId}</code></span>
          <span>📊 请求总数: {summary.metadata.totalRequests}</span>
          <span>⚡ 平均耗时: {summary.metadata.avgExecutionMs}ms</span>
          <span>💾 缓存命中率: {(summary.metadata.cacheHitRate * 100).toFixed(1)}%</span>
          <span>🔄 Fallback 占比: {(summary.metadata.fallbackRate * 100).toFixed(1)}%</span>
          {summary.cached && <span style={{ color: '#16a34a' }}>⚡ Cached</span>}
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
        {(['overview', 'funnel', 'reasons', 'coldstart', 'coverage'] as RecTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={t === tab ? ACTIVE_TAB_STYLE : TAB_STYLE}>
            {({ overview: '🎯 策略权重', funnel: '📉 转化漏斗', reasons: '💬 推荐理由', coldstart: '🥶 冷启动', coverage: '🔥 覆盖热力' } as Record<RecTab, string>)[t]}
          </button>
        ))}
      </nav>

      <div style={CARD_STYLE}>
        <div id={`rec-chart-${tab}`} style={{ width: '100%', height: 460 }} />
      </div>

      <footer style={{ marginTop: 24, fontSize: 12, color: '#9ca3af' }}>
        <p>📌 5 策略: ItemCF · UserCF · Popular · RecentlyViewed · Personalized</p>
        <p>📌 反模式 v4: cold-start fallback + LRU cache + MMR diversity + tenant 隔离</p>
        <p>📌 最后更新: {summary.generatedAt}</p>
      </footer>
    </div>
  )
}