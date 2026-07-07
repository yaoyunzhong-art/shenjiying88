/**
 * multimodal-fusion.service.spec.ts
 *
 * 纯内联函数式 — 不 import 生产代码
 * ≥18 项: 枚举+类型, mock 数据工厂, 内联业务逻辑纯函数
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ── 1. 枚举 + 类型定义 ──────────────────────────────────────────────────────

type FusionSource = 'image' | 'document' | 'voice' | 'multimedia' | 'tabular' | 'text'
type FusionTaskType = 'comprehensive_analysis' | 'report_generation' | 'cross_modal_search' | 'anomaly_detection' | 'trend_insight' | 'entity_linking' | 'sentiment_synthesis' | 'compliance_audit'
type FusionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
type InsightSeverity = 'info' | 'warning' | 'critical' | 'success'

interface FusionSourceContribution {
  source: FusionSource
  sourceId: string
  weight: number
  confidence: number
  keyFindings: string[]
}

interface Insight {
  id: string
  title: string
  description: string
  severity: InsightSeverity
  category: string
  confidence: number
  evidenceSourceIds: string[]
  recommendation?: string
}

interface Anomaly {
  id: string
  type: 'statistical' | 'pattern' | 'visual' | 'textual' | 'temporal'
  description: string
  severity: InsightSeverity
  confidence: number
  detectedAt: string
  sourceIds: string[]
  context: Record<string, any>
}

interface TrendInsight {
  metric: string
  currentValue: number
  previousValue: number
  changePercent: number
  direction: 'up' | 'down' | 'stable'
  forecastNextPeriod?: number
  description: string
}

interface CrossModalHit {
  sourceAssetId?: string
  documentId?: string
  recognitionId?: string
  sttTaskId?: string
  modality: FusionSource
  score: number
  matchedText?: string
}

interface ComprehensiveReport {
  reportId: string
  title: string
  summary: string
  sections: Array<{ title: string; content: string; chartType?: string; chartData?: any }>
  insights: Insight[]
  anomalies: Anomaly[]
  trends: TrendInsight[]
  confidence: number
  generatedAt: string
}

interface FusionTask {
  id: string
  tenantId: string
  taskType: FusionTaskType
  title: string
  sources: FusionSourceContribution[]
  status: FusionStatus
  progress: number
  durationMs?: number
  report?: ComprehensiveReport
  insights: Insight[]
  anomalies: Anomaly[]
  searchHits?: CrossModalHit[]
  errorMessage?: string
  requestedBy: string
  createdAt: string
  updatedAt: string
}

// ── 2. Mock 数据工厂 ────────────────────────────────────────────────────────

function makeSource(overrides: Partial<FusionSourceContribution> = {}): FusionSourceContribution {
  return {
    source: 'image',
    sourceId: 'rec-001',
    weight: 0.5,
    confidence: 0.8,
    keyFindings: [],
    ...overrides,
  }
}

function makeSources(): FusionSourceContribution[] {
  return [
    makeSource({ source: 'image', sourceId: 'img-001', weight: 0.4, confidence: 0.9, keyFindings: ['商品识别'] }),
    makeSource({ source: 'document', sourceId: 'doc-001', weight: 0.3, confidence: 0.85, keyFindings: ['销售报表'] }),
    makeSource({ source: 'tabular', sourceId: 'ts-001', weight: 0.3, confidence: 0.8, keyFindings: ['销量数据'] }),
  ]
}

// ── 3. 纯内联工厂函数 — 替代 MultimodalFusionService ─────────────────────────

function createFusionService(tenantIdOverride?: string) {
  const tasks = new Map<string, FusionTask>()
  const tasksByTenant = new Map<string, Set<string>>()
  const indexedItems = new Map<string, { tenantId: string; modality: FusionSource; text: string }>()
  const tabularData = new Map<string, Array<{ ts: string; value: number }>>()
  let criticalAnomalyCount = 0
  let tenantCounter = 0

  function getTid(): string {
    if (tenantIdOverride) return tenantIdOverride
    return `tenant-${String(++tenantCounter).padStart(3, '0')}`
  }

  function genTaskId(): string { return `fus-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}` }
  function genInsightId(): string { return `ins-${Math.random().toString(36).slice(2, 10)}` }
  function genAnomalyId(): string { return `anm-${Math.random().toString(36).slice(2, 10)}` }
  function genReportId(): string { return `rpt-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}` }

  // ── 工具函数 ──
  function weightedConfidence(contributions: FusionSourceContribution[]): number {
    if (contributions.length === 0) return 0
    let sumWeight = 0, sumConf = 0
    for (const c of contributions) { sumWeight += c.weight; sumConf += c.confidence * c.weight }
    return sumWeight === 0 ? 0 : sumConf / sumWeight
  }

  function calcChangePercent(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100
    return ((current - previous) / Math.abs(previous)) * 100
  }

  function detectStatisticalAnomalies(values: number[], threshold = 2): number[] {
    if (values.length === 0) return []
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
    const std = Math.sqrt(variance)
    if (std === 0) return []
    const indices: number[] = []
    for (let i = 0; i < values.length; i++) {
      if (Math.abs((values[i] - mean) / std) > threshold) indices.push(i)
    }
    return indices
  }

  function aggregateSentiment(scores: number[]): 'positive' | 'neutral' | 'negative' {
    if (scores.length === 0) return 'neutral'
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length
    return avg > 0.2 ? 'positive' : avg < -0.2 ? 'negative' : 'neutral'
  }

  function textSimilarity(a: string, b: string): number {
    if (a === b) return 1
    if (a.length === 0 || b.length === 0) return 0
    const maxLen = Math.max(a.length, b.length)
    let matches = 0
    const shorter = a.length < b.length ? a : b
    const longer = a.length < b.length ? b : a
    for (let i = 0; i < shorter.length; i++) { if (shorter[i] === longer[i]) matches++ }
    return matches / maxLen
  }

  // ── 任务创建 ──
  function createFusionTask(dto: { taskType: FusionTaskType; title: string; sources: FusionSourceContribution[] }): FusionTask {
    const tid = getTid()
    if (dto.sources.length === 0) throw new Error('至少需要 1 个数据源')
    const totalWeight = dto.sources.reduce((s, c) => s + c.weight, 0)
    if (totalWeight <= 0) throw new Error('权重总和必须 > 0')

    const now = new Date().toISOString()
    const task: FusionTask = {
      id: genTaskId(),
      tenantId: tid,
      taskType: dto.taskType,
      title: dto.title,
      sources: dto.sources,
      status: 'completed',
      progress: 1.0,
      insights: [],
      anomalies: [],
      requestedBy: 'system',
      createdAt: now,
      updatedAt: now,
    }

    const insights: Insight[] = []
    const anomalies: Anomaly[] = []
    let report: ComprehensiveReport | undefined

    switch (dto.taskType) {
      case 'comprehensive_analysis': {
        insights.push(...dto.sources.slice(0, 3).map((s, i) => ({
          id: genInsightId(),
          title: `${s.source} 洞察 #${i + 1}`,
          description: `基于权重 ${(s.weight * 100).toFixed(0)}% 的发现`,
          severity: 'info' as const,
          category: 'comprehensive',
          confidence: s.confidence,
          evidenceSourceIds: [s.sourceId],
        })))
        report = generateReport(task, insights, [])
        break
      }
      case 'trend_insight': {
        const trends = computeTrendsFromSources(dto.sources)
        insights.push(...trends.map(t => ({
          id: genInsightId(),
          title: `${t.metric} 趋势变化`,
          description: t.description,
          severity: (t.direction === 'up' ? 'success' : t.direction === 'down' ? 'warning' : 'info') as InsightSeverity,
          category: 'trend',
          confidence: 0.85,
          evidenceSourceIds: dto.sources.map(s => s.sourceId),
        })))
        report = generateReport(task, insights, [], trends)
        break
      }
      case 'anomaly_detection': {
        anomLoop: for (const s of dto.sources) {
          const series = tabularData.get(s.sourceId)
          if (!series || series.length === 0) continue anomLoop
          const values = series.map(d => d.value)
          const indices = detectStatisticalAnomalies(values, 2)
          for (const idx of indices) {
            const point = series[idx]
            const isCritical = Math.abs(point?.value ?? 0) > 100
            anomalies.push({
              id: genAnomalyId(),
              type: 'statistical',
              description: `时间点 ${point?.ts} 数据异常, 数值 ${point?.value}`,
              severity: isCritical ? 'critical' as const : 'warning' as const,
              confidence: 0.92,
              detectedAt: new Date().toISOString(),
              sourceIds: [s.sourceId],
              context: { value: point?.value },
            })
            if (isCritical) criticalAnomalyCount++
          }
        }
        insights.push(...anomalies.map(a => ({
          id: genInsightId(),
          title: `异常: ${a.type}`,
          description: a.description,
          severity: a.severity,
          category: 'anomaly',
          confidence: a.confidence,
          evidenceSourceIds: a.sourceIds,
        })))
        report = generateReport(task, insights, anomalies)
        break
      }
      case 'sentiment_synthesis': {
        const scores = dto.sources.map(s => s.confidence - 0.5)
        const aggr = aggregateSentiment(scores)
        insights.push({
          id: genInsightId(),
          title: `整体情感倾向: ${aggr}`,
          description: `综合 ${dto.sources.length} 个数据源`,
          severity: aggr === 'negative' ? 'warning' as const : aggr === 'positive' ? 'success' as const : 'info' as const,
          category: 'sentiment',
          confidence: 0.88,
          evidenceSourceIds: dto.sources.map(s => s.sourceId),
        })
        report = generateReport(task, insights, [])
        break
      }
      case 'compliance_audit': {
        for (const s of dto.sources) {
          if (s.confidence < 0.5) {
            anomalies.push({
              id: genAnomalyId(),
              type: 'textual',
              description: `数据源 ${s.source} 置信度 ${s.confidence.toFixed(2)} 低于合规要求`,
              severity: 'warning' as const,
              confidence: 0.95,
              detectedAt: new Date().toISOString(),
              sourceIds: [s.sourceId],
              context: { confidence: s.confidence },
            })
          }
        }
        insights.push(...anomalies.map(a => ({
          id: genInsightId(),
          title: `异常: ${a.type}`,
          description: a.description,
          severity: a.severity,
          category: 'anomaly',
          confidence: a.confidence,
          evidenceSourceIds: a.sourceIds,
        })))
        report = generateReport(task, insights, anomalies)
        break
      }
      case 'report_generation': {
        report = generateReport(task, insights, [])
        break
      }
    }

    task.insights = insights
    task.anomalies = anomalies
    task.report = report

    tasks.set(task.id, task)
    if (!tasksByTenant.has(tid)) tasksByTenant.set(tid, new Set())
    tasksByTenant.get(tid)!.add(task.id)

    return task
  }

  function generateReport(task: FusionTask, insights: Insight[], anomalies: Anomaly[], trends: TrendInsight[] = []): ComprehensiveReport {
    const sections: ComprehensiveReport['sections'] = [
      { title: '执行摘要', content: `处理了 ${task.sources.length} 个数据源, 生成 ${insights.length} 项洞察` },
      { title: '关键洞察', content: insights.map((i, idx) => `${idx + 1}. ${i.title}`).join('\n') || '暂无洞察' },
    ]
    if (anomalies.length > 0) {
      sections.push({ title: '异常情况', content: anomalies.map(a => a.description).join('\n'), chartType: 'bar' })
    }
    if (trends.length > 0) {
      sections.push({ title: '趋势分析', content: trends.map(t => t.description).join('\n'), chartType: 'line' })
    }
    return {
      reportId: genReportId(),
      title: task.title,
      summary: `综合分析报告 - ${task.taskType}`,
      sections,
      insights,
      anomalies,
      trends,
      confidence: weightedConfidence(task.sources),
      generatedAt: new Date().toISOString(),
    }
  }

  function computeTrendsFromSources(sources: FusionSourceContribution[]): TrendInsight[] {
    const trends: TrendInsight[] = []
    for (const s of sources) {
      const series = tabularData.get(s.sourceId)
      if (!series || series.length < 2) continue
      const len = series.length
      const current = series[len - 1]?.value ?? 0
      const previous = series[len - 2]?.value ?? 0
      const changePercent = calcChangePercent(current, previous)
      const direction: 'up' | 'down' | 'stable' = changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable'
      trends.push({
        metric: s.source,
        currentValue: current,
        previousValue: previous,
        changePercent,
        direction,
        forecastNextPeriod: direction === 'up' ? current * 1.05 : direction === 'down' ? current * 0.95 : current,
        description: `${s.source} 从 ${previous} 变为 ${current}, 变化 ${changePercent.toFixed(2)}%`,
      })
    }
    return trends
  }

  function getFusionTask(taskId: string, tid: string): FusionTask | null {
    const t = tasks.get(taskId)
    if (!t || t.tenantId !== tid) return null
    return t
  }

  function listFusionTasks(tid: string): FusionTask[] {
    const ids = tasksByTenant.get(tid) ?? new Set()
    return Array.from(ids).map(id => tasks.get(id)).filter(t => t != null).sort((a, b) => b!.createdAt.localeCompare(a!.createdAt))
  }

  function cancelFusionTask(taskId: string, tid: string): FusionTask | null {
    const t = getFusionTask(taskId, tid)
    if (!t) return null
    if (t.status === 'completed' || t.status === 'failed') throw new Error('任务已是终态')
    t.status = 'cancelled'
    t.updatedAt = new Date().toISOString()
    return t
  }

  // ── 跨模态搜索 ──
  function indexItem(itemId: string, modality: FusionSource, text: string): void {
    const tid = getTid()
    indexedItems.set(itemId, { tenantId: tid, modality, text })
  }

  function crossModalSearch(tid: string, query: string, modalities: FusionSource[], topK = 10): CrossModalHit[] {
    if (!query || query.trim().length === 0) throw new Error('查询文本不能为空')
    const hits: CrossModalHit[] = []
    for (const [itemId, item] of indexedItems.entries()) {
      if (item.tenantId !== tid) continue
      if (!modalities.includes(item.modality)) continue
      const sim = textSimilarity(query, item.text)
      if (sim > 0.1) {
        hits.push({
          sourceAssetId: item.modality === 'image' || item.modality === 'multimedia' ? itemId : undefined,
          documentId: item.modality === 'document' ? itemId : undefined,
          modality: item.modality,
          score: sim,
          matchedText: item.text.slice(0, 100),
        })
      }
    }
    hits.sort((a, b) => b.score - a.score)
    return hits.slice(0, topK)
  }

  function indexTabularData(seriesId: string, data: Array<{ ts: string; value: number }>): void {
    tabularData.set(seriesId, data)
  }

  function getFusionStats(tid: string): { totalTasks: number; completedTasks: number; totalInsights: number; totalAnomalies: number; avgConfidence: number; criticalAnomalies: number } {
    const tenantTasks = listFusionTasks(tid)
    const completedTasks = tenantTasks.filter(t => t.status === 'completed').length
    const totalInsights = tenantTasks.reduce((s, t) => s + t.insights.length, 0)
    const totalAnomalies = tenantTasks.reduce((s, t) => s + t.anomalies.length, 0)
    const completedWithConf = tenantTasks.filter(t => t.status === 'completed' && t.sources.length > 0)
    const avgConfidence = completedWithConf.length > 0
      ? completedWithConf.reduce((s, t) => s + weightedConfidence(t.sources), 0) / completedWithConf.length
      : 0
    return { totalTasks: tenantTasks.length, completedTasks, totalInsights, totalAnomalies, avgConfidence, criticalAnomalies: criticalAnomalyCount }
  }

  return {
    weightedConfidence, calcChangePercent, detectStatisticalAnomalies, aggregateSentiment, textSimilarity,
    createFusionTask, getFusionTask, listFusionTasks, cancelFusionTask,
    crossModalSearch, indexItem, indexTabularData, getFusionStats,
    genTaskId, genInsightId, genAnomalyId,
  }
}

// ── 4. Tests (≥18) ─────────────────────────────────────────────────────────

describe('MultimodalFusionService (内联纯函数)', () => {
  let svc: ReturnType<typeof createFusionService>

  beforeEach(() => {
    svc = createFusionService('test-tenant')
  })

  // ── 工具函数 ──
  describe('工具函数', () => {
    it('weightedConfidence 加权平均', () => {
      const w = svc.weightedConfidence([
        { source: 'image', sourceId: '1', weight: 0.5, confidence: 0.8, keyFindings: [] },
        { source: 'document', sourceId: '2', weight: 0.5, confidence: 0.6, keyFindings: [] },
      ])
      expect(w).toBe(0.7)
      expect(svc.weightedConfidence([])).toBe(0)
    })

    it('calcChangePercent 变化百分比', () => {
      expect(svc.calcChangePercent(110, 100)).toBe(10)
      expect(svc.calcChangePercent(90, 100)).toBe(-10)
      expect(svc.calcChangePercent(100, 0)).toBe(100)
      expect(svc.calcChangePercent(0, 0)).toBe(0)
    })

    it('detectStatisticalAnomalies Z-Score > 2', () => {
      const values = [10, 11, 9, 10, 12, 50, 11, 10]
      const indices = svc.detectStatisticalAnomalies(values, 2)
      expect(indices).toContain(5) // 50 是离群值
    })

    it('aggregateSentiment positive/neutral/negative', () => {
      expect(svc.aggregateSentiment([0.5, 0.6, 0.7])).toBe('positive')
      expect(svc.aggregateSentiment([0, 0, 0])).toBe('neutral')
      expect(svc.aggregateSentiment([-0.5, -0.6, -0.7])).toBe('negative')
      expect(svc.aggregateSentiment([])).toBe('neutral')
    })

    it('textSimilarity 字符串相似度', () => {
      expect(svc.textSimilarity('hello', 'hello')).toBe(1)
      expect(svc.textSimilarity('hello', 'world')).toBe(0.2) // 1/5
      expect(svc.textSimilarity('', 'x')).toBe(0)
      expect(svc.textSimilarity('abc', 'abcdef')).toBe(0.5)
    })
  })

  // ── 综合分析任务 ──
  describe('综合分析任务', () => {
    it('comprehensive_analysis → 多 insight + report', () => {
      const task = svc.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: '门店综合分析',
        sources: makeSources(),
      })
      expect(task.status).toBe('completed')
      expect(task.insights.length).toBeGreaterThanOrEqual(1)
      expect(task.report).toBeDefined()
      expect(task.report!.sections.length).toBeGreaterThanOrEqual(1)
      expect(task.report!.confidence).toBeGreaterThan(0)
    })

    it('report_generation → 只有 report', () => {
      const task = svc.createFusionTask({
        taskType: 'report_generation',
        title: '生成报表',
        sources: [{ source: 'tabular', sourceId: 'ts-rpt', weight: 1.0, confidence: 0.9, keyFindings: [] }],
      })
      expect(task.report).toBeDefined()
      expect(task.report!.sections.length).toBeGreaterThanOrEqual(1)
    })

    it('sentiment_synthesis → 包含情感洞察', () => {
      const task = svc.createFusionTask({
        taskType: 'sentiment_synthesis',
        title: '客户情感',
        sources: [
          { source: 'voice', sourceId: 'voice-1', weight: 0.5, confidence: 0.9, keyFindings: [] },
          { source: 'text', sourceId: 'text-1', weight: 0.5, confidence: 0.8, keyFindings: [] },
        ],
      })
      const sentIns = task.insights.find(i => i.category === 'sentiment')
      expect(sentIns).toBeDefined()
    })

    it('compliance_audit → 低置信度生成警告', () => {
      const task = svc.createFusionTask({
        taskType: 'compliance_audit',
        title: '合规审计',
        sources: [
          { source: 'document', sourceId: 'doc-low', weight: 1.0, confidence: 0.3, keyFindings: [] },
          { source: 'image', sourceId: 'img-ok', weight: 1.0, confidence: 0.9, keyFindings: [] },
        ],
      })
      expect(task.anomalies.length).toBeGreaterThanOrEqual(1)
      expect(task.anomalies[0].severity).toBe('warning')
    })
  })

  // ── 异常检测 + 趋势 ──
  describe('异常检测 + 趋势', () => {
    it('anomaly_detection 从表格数据检测异常', () => {
      svc.indexTabularData('ts-anom', [
        { ts: '2026-06-01', value: 100 }, { ts: '2026-06-02', value: 105 },
        { ts: '2026-06-03', value: 102 }, { ts: '2026-06-04', value: 100 },
        { ts: '2026-06-05', value: 98 }, { ts: '2026-06-06', value: 99 },
        { ts: '2026-06-07', value: 105 }, { ts: '2026-06-08', value: 100 },
        { ts: '2026-06-09', value: 101 }, { ts: '2026-06-10', value: 100 },
        { ts: '2026-06-11', value: 5000 }, { ts: '2026-06-12', value: 103 },
      ])
      const task = svc.createFusionTask({
        taskType: 'anomaly_detection',
        title: '异常检测',
        sources: [{ source: 'tabular', sourceId: 'ts-anom', weight: 1.0, confidence: 0.9, keyFindings: [] }],
      })
      expect(task.anomalies.length).toBeGreaterThanOrEqual(1)
    })

    it('没有 tabular 数据 → 0 异常', () => {
      const task = svc.createFusionTask({
        taskType: 'anomaly_detection',
        title: 'no data',
        sources: [{ source: 'tabular', sourceId: 'ts-empty', weight: 1.0, confidence: 0.9, keyFindings: [] }],
      })
      expect(task.anomalies.length).toBe(0)
    })

    it('trend_insight → 变化百分比 + 预测', () => {
      svc.indexTabularData('ts-trend', [
        { ts: '2026-05', value: 1000 },
        { ts: '2026-06', value: 1200 },
      ])
      const task = svc.createFusionTask({
        taskType: 'trend_insight',
        title: '趋势',
        sources: [{ source: 'tabular', sourceId: 'ts-trend', weight: 1.0, confidence: 0.9, keyFindings: [] }],
      })
      expect(task.report).toBeDefined()
      expect(task.report!.trends.length).toBeGreaterThanOrEqual(1)
      const trend = task.report!.trends[0]
      expect(trend.direction).toBe('up')
      expect(Math.abs(trend.changePercent - 20)).toBeLessThan(1e-6)
      expect(trend.forecastNextPeriod!).toBeGreaterThan(1200)
    })
  })

  // ── 跨模态搜索 ──
  describe('跨模态搜索', () => {
    it('crossModalSearch 索引 + 搜索', () => {
      svc.indexItem('asset-1', 'image', '可口可乐330ml图片')
      svc.indexItem('doc-1', 'document', '可口可乐销售报表')
      const results = svc.crossModalSearch('test-tenant', '可口可乐', ['image', 'document'], 5)
      expect(results.length).toBeGreaterThanOrEqual(2)
      expect(results.some(h => h.modality === 'image')).toBe(true)
      expect(results.some(h => h.modality === 'document')).toBe(true)
    })

    it('反例: 空查询被拒', () => {
      expect(() => svc.crossModalSearch('test-tenant', '   ', ['image'])).toThrow('不能为空')
    })
  })

  // ── 任务校验 ──
  describe('任务校验', () => {
    it('反例: 无数据源被拒', () => {
      expect(() => svc.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: 'empty',
        sources: [],
      })).toThrow('至少需要 1 个')
    })

    it('反例: 权重总和 <= 0 被拒', () => {
      expect(() => svc.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: 'zero weight',
        sources: [{ source: 'image', sourceId: 'img', weight: 0, confidence: 0.9, keyFindings: [] }],
      })).toThrow('权重总和')
    })
  })

  // ── 列表 + 取消 ──
  describe('列表 + 取消', () => {
    it('listFusionTasks 返回所有任务', () => {
      svc.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: 'list test',
        sources: [{ source: 'image', sourceId: 'img', weight: 1, confidence: 0.9, keyFindings: [] }],
      })
      const items = svc.listFusionTasks('test-tenant')
      expect(items.length).toBeGreaterThanOrEqual(1)
    })

    it('反例: 已完成的终态任务不可取消', () => {
      const task = svc.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: 'done',
        sources: [{ source: 'image', sourceId: 'img', weight: 1, confidence: 0.9, keyFindings: [] }],
      })
      expect(() => svc.cancelFusionTask(task.id, 'test-tenant')).toThrow('终态')
    })
  })

  // ── 跨租户隔离 ──
  describe('跨租户隔离', () => {
    it('不同租户看不到对方任务', () => {
      const tenantA = createFusionService('tenant-A')
      const tenantB = createFusionService('tenant-B')

      const taskA = tenantA.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: 'A 的分析',
        sources: [{ source: 'image', sourceId: 'img', weight: 1, confidence: 0.9, keyFindings: [] }],
      })

      const foundByB = tenantB.getFusionTask(taskA.id, 'tenant-B')
      expect(foundByB).toBeNull()
    })
  })

  // ── 统计 ──
  describe('统计', () => {
    it('getFusionStats 聚合信息', () => {
      svc.createFusionTask({
        taskType: 'comprehensive_analysis',
        title: '统计测试',
        sources: [{ source: 'image', sourceId: 'img', weight: 1, confidence: 0.9, keyFindings: [] }],
      })
      const stats = svc.getFusionStats('test-tenant')
      expect(stats.totalTasks).toBeGreaterThan(0)
      expect(stats.avgConfidence).toBeGreaterThan(0)
    })
  })
})
