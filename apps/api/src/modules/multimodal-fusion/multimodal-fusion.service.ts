/**
 * Phase 103 多模态融合分析 Service (V11 Sprint 3 Day 40)
 *
 * 核心能力:
 * 1. 综合分析 (cross-source insight generation)
 * 2. 智能报告生成 (multi-section markdown report)
 * 3. 跨模态搜索 (unified search across modalities)
 * 4. 异常检测 (Z-Score + 模式)
 * 5. 趋势洞察 (变化百分比 + 预测)
 * 6. 情感合成 (multi-modal sentiment)
 * 7. 合规审计
 */

import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  FusionTask, Insight, Anomaly, CrossModalHit, ComprehensiveReport,
  FusionSource, FusionTaskType, FusionEngine,
  FusionSourceContribution, TrendInsight,
  generateFusionTaskId, generateInsightId, generateAnomalyId, generateReportId,
  weightedConfidence, calcChangePercent, detectStatisticalAnomalies,
  aggregateSentiment, textSimilarity,
  FUSION_TEMPLATES, FUSION_ENGINES,
} from './multimodal-fusion.entity'
import type {
  CreateFusionTaskDto, CrossModalSearchDto, ListFusionTasksQuery,
  FusionTaskResponse, FusionStatsResponse,
} from './multimodal-fusion.dto'

@Injectable()
export class MultimodalFusionService {
  /** 融合任务 */
  private readonly tasks = new Map<string, FusionTask>()
  private readonly tasksByTenant = new Map<string, Set<string>>()
  private readonly tasksByType = new Map<string, Set<string>>()

  /** Insights 索引 (按 task) */
  private readonly insightsByTask = new Map<string, Set<string>>()
  private readonly insights = new Map<string, Insight>()

  /** Anomalies 索引 */
  private readonly anomaliesByTask = new Map<string, Set<string>>()
  private readonly anomalies = new Map<string, Anomaly>()

  /** 跨模态搜索索引 (简化 mock: source → text/embedding) */
  private readonly indexedItems = new Map<string, {
    tenantId: string
    modality: FusionSource
    text: string
    metadata: Record<string, any>
  }>()

  /** 表格数据缓存 (用于 anomaly detection / trend) */
  private readonly tabularData = new Map<string, Array<{ ts: string; value: number }>>()

  /** 关键异常计数 */
  private criticalAnomalyCount = 0

  // ============ 1. 融合任务 ============

  async createFusionTask(dto: CreateFusionTaskDto): Promise<FusionTask> {
    const ctx = requireTenantContext()
    if (dto.sources.length === 0) {
      throw new BadRequestException('至少需要 1 个数据源')
    }
    // 权重和检查
    const totalWeight = dto.sources.reduce((s, c) => s + c.weight, 0)
    if (totalWeight <= 0) {
      throw new BadRequestException('数据源权重总和必须 > 0')
    }
    const engine = dto.engine ?? 'mock-gpt4-multimodal'
    const engineInfo = FUSION_ENGINES.find((e) => e.type === engine)
    if (!engineInfo) throw new BadRequestException(`融合引擎 ${engine} 不存在`)

    // 检查模板
    if (dto.templateId) {
      const tpl = FUSION_TEMPLATES.find((t) => t.id === dto.templateId)
      if (!tpl) throw new BadRequestException(`模板 ${dto.templateId} 不存在`)
    }

    const now = new Date().toISOString()
    const task: FusionTask = {
      id: generateFusionTaskId(),
      tenantId: ctx.tenantId,
      taskType: dto.taskType,
      title: dto.title,
      description: dto.description,
      sources: dto.sources,
      status: 'processing',
      progress: 0.3,
      insights: [],
      anomalies: [],
      requestedBy: ctx.userId ?? 'system',
      linkedEntity: dto.linkedEntity,
      createdAt: now,
      updatedAt: now,
    }
    this.tasks.set(task.id, task)
    this.addTaskToIndexes(task)

    const start = Date.now()
    // 综合分析 - 按 taskType 生成结果
    const insights: Insight[] = []
    const anomalies: Anomaly[] = []
    let report: ComprehensiveReport | undefined
    let searchHits: CrossModalHit[] | undefined

    switch (dto.taskType) {
      case 'comprehensive_analysis': {
        insights.push(...this.makeMockInsights(task, dto.sources, 'comprehensive'))
        report = this.generateReport(task, insights, [])
        break
      }
      case 'anomaly_detection': {
        anomalies.push(...this.detectAnomaliesFromSources(dto.sources))
        insights.push(...this.anomaliesToInsights(anomalies))
        report = this.generateReport(task, insights, anomalies)
        break
      }
      case 'trend_insight': {
        const trends = this.computeTrendsFromSources(dto.sources)
        report = this.generateReport(task, insights, [], trends)
        insights.push(...trends.map((t) => ({
          id: generateInsightId(),
          title: `${t.metric} 趋势变化`,
          description: t.description,
          severity: (t.direction === 'up' ? 'success' : t.direction === 'down' ? 'warning' : 'info') as 'success' | 'warning' | 'info',
          category: 'trend',
          confidence: 0.85,
          evidenceSourceIds: dto.sources.map((s) => s.sourceId),
        })))
        break
      }
      case 'cross_modal_search': {
        // 这里简化: 仅返回占位, 实际搜索走 dedicated endpoint
        break
      }
      case 'sentiment_synthesis': {
        const sent = this.synthesizeSentimentFromSources(dto.sources)
        insights.push({
          id: generateInsightId(),
          title: `整体情感倾向: ${sent.aggregate}`,
          description: `综合 ${dto.sources.length} 个数据源,整体情感分数 ${sent.score.toFixed(2)}`,
          severity: sent.aggregate === 'negative' ? 'warning' : sent.aggregate === 'positive' ? 'success' : 'info',
          category: 'sentiment',
          confidence: 0.88,
          evidenceSourceIds: dto.sources.map((s) => s.sourceId),
        })
        report = this.generateReport(task, insights, [])
        break
      }
      case 'compliance_audit': {
        const issues = this.runComplianceAudit(dto.sources)
        anomalies.push(...issues)
        insights.push(...this.anomaliesToInsights(issues))
        report = this.generateReport(task, insights, issues)
        break
      }
      case 'report_generation': {
        report = this.generateReport(task, insights, [])
        break
      }
      case 'entity_linking': {
        insights.push(...this.linkEntities(dto.sources))
        break
      }
    }

    for (const ins of insights) {
      this.insights.set(ins.id, ins)
      if (!this.insightsByTask.has(task.id)) this.insightsByTask.set(task.id, new Set())
      this.insightsByTask.get(task.id)!.add(ins.id)
    }
    for (const an of anomalies) {
      this.anomalies.set(an.id, an)
      if (!this.anomaliesByTask.has(task.id)) this.anomaliesByTask.set(task.id, new Set())
      this.anomaliesByTask.get(task.id)!.add(an.id)
      if (an.severity === 'critical') this.criticalAnomalyCount++
    }

    task.insights = insights
    task.anomalies = anomalies
    task.report = report
    task.searchHits = searchHits
    task.status = 'completed'
    task.progress = 1.0
    task.durationMs = Date.now() - start + engineInfo.avgLatencyMs
    task.updatedAt = new Date().toISOString()
    return task
  }

  async getFusionTask(taskId: string): Promise<FusionTask> {
    const ctx = requireTenantContext()
    return await this.getTaskRaw(taskId, ctx.tenantId)
  }

  async listFusionTasks(query: ListFusionTasksQuery = {}): Promise<FusionTaskResponse[]> {
    const ctx = requireTenantContext()
    const all: FusionTask[] = Array.from(this.tasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.tasks.get(id))
      .filter((t): t is FusionTask => t != null)
    let filtered = all
    if (query.taskType) filtered = filtered.filter((t) => t.taskType === query.taskType)
    if (query.status) filtered = filtered.filter((t) => t.status === query.status)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const limit = query.limit ?? 50
    return filtered.slice(0, limit).map((t) => this.toTaskResponse(t))
  }

  async cancelFusionTask(taskId: string): Promise<FusionTask> {
    const ctx = requireTenantContext()
    const task = await this.getTaskRaw(taskId, ctx.tenantId)
    if (task.status === 'completed' || task.status === 'failed') {
      throw new BadRequestException(`任务已是终态 ${task.status}`)
    }
    task.status = 'cancelled'
    task.updatedAt = new Date().toISOString()
    return task
  }

  // ============ 2. 跨模态搜索 ============

  async crossModalSearch(dto: CrossModalSearchDto): Promise<CrossModalHit[]> {
    const ctx = requireTenantContext()
    if (!dto.query || dto.query.trim().length === 0) {
      throw new BadRequestException('查询文本不能为空')
    }
    const topK = dto.topK ?? 10
    const hits: CrossModalHit[] = []
    for (const [itemId, item] of this.indexedItems.entries()) {
      if (item.tenantId !== ctx.tenantId) continue
      if (!dto.modalities.includes(item.modality)) continue
      const sim = textSimilarity(dto.query, item.text)
      if (sim > 0.1) {
        hits.push({
          sourceAssetId: item.modality === 'image' || item.modality === 'multimedia' ? itemId : undefined,
          documentId: item.modality === 'document' ? itemId : undefined,
          sttTaskId: item.modality === 'voice' ? itemId : undefined,
          recognitionId: item.modality === 'image' ? itemId : undefined,
          modality: item.modality,
          score: sim,
          matchedText: item.text.slice(0, 100),
        })
      }
    }
    hits.sort((a, b) => b.score - a.score)
    return hits.slice(0, topK)
  }

  // ============ 3. 数据源管理 (用于搜索索引) ============

  async indexItem(itemId: string, modality: FusionSource, text: string, metadata: Record<string, any> = {}): Promise<void> {
    const ctx = requireTenantContext()
    this.indexedItems.set(itemId, {
      tenantId: ctx.tenantId,
      modality,
      text,
      metadata,
    })
  }

  async indexTabularData(seriesId: string, data: Array<{ ts: string; value: number }>): Promise<void> {
    this.tabularData.set(seriesId, data)
  }

  // ============ 4. 模板与引擎 ============

  listTemplates() { return FUSION_TEMPLATES }
  listEngines() { return FUSION_ENGINES }

  // ============ 5. 统计 ============

  async getFusionStats(): Promise<FusionStatsResponse> {
    const ctx = requireTenantContext()
    const tasks: FusionTask[] = Array.from(this.tasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.tasks.get(id))
      .filter((t): t is FusionTask => t != null)
    const completedTasks = tasks.filter((t) => t.status === 'completed').length
    const failedTasks = tasks.filter((t) => t.status === 'failed').length
    const totalInsights = tasks.reduce((s, t) => s + t.insights.length, 0)
    const totalAnomalies = tasks.reduce((s, t) => s + t.anomalies.length, 0)
    const byTaskType: Record<string, number> = {}
    for (const t of tasks) {
      byTaskType[t.taskType] = (byTaskType[t.taskType] ?? 0) + 1
    }
    const completedWithConf = tasks.filter((t) => t.status === 'completed' && t.sources.length > 0)
    const avgConfidence = completedWithConf.length > 0
      ? completedWithConf.reduce((s, t) => s + weightedConfidence(t.sources), 0) / completedWithConf.length
      : 0
    const completedWithDuration = tasks.filter((t) => t.status === 'completed' && t.durationMs)
    const avgDurationMs = completedWithDuration.length > 0
      ? completedWithDuration.reduce((s, t) => s + (t.durationMs ?? 0), 0) / completedWithDuration.length
      : 0
    return {
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      totalInsights,
      totalAnomalies,
      byTaskType,
      avgConfidence,
      avgDurationMs,
      criticalAnomalies: this.criticalAnomalyCount,
    }
  }

  // ============ 工具 ============
  countTasks(): number { return this.tasks.size }
  countInsights(): number { return this.insights.size }
  countAnomalies(): number { return this.anomalies.size }
  countIndexedItems(): number { return this.indexedItems.size }

  // ============ Helpers ============

  private async getTaskRaw(taskId: string, tenantId: string): Promise<FusionTask> {
    const t = this.tasks.get(taskId)
    if (!t || t.tenantId !== tenantId) throw new NotFoundException(`融合任务 ${taskId} 不存在`)
    return t
  }

  private addTaskToIndexes(task: FusionTask): void {
    if (!this.tasksByTenant.has(task.tenantId)) this.tasksByTenant.set(task.tenantId, new Set())
    this.tasksByTenant.get(task.tenantId)!.add(task.id)
    if (!this.tasksByType.has(task.taskType)) this.tasksByType.set(task.taskType, new Set())
    this.tasksByType.get(task.taskType)!.add(task.id)
  }

  private makeMockInsights(task: FusionTask, sources: FusionSourceContribution[], category: string): Insight[] {
    return sources.slice(0, 3).map((s, i) => ({
      id: generateInsightId(),
      title: `${s.source} 洞察 #${i + 1}`,
      description: `基于权重 ${(s.weight * 100).toFixed(0)}% 与置信度 ${(s.confidence * 100).toFixed(0)}% 的发现`,
      severity: 'info' as const,
      category,
      confidence: s.confidence,
      evidenceSourceIds: [s.sourceId],
      recommendation: '建议进一步深入分析',
    }))
  }

  private detectAnomaliesFromSources(sources: FusionSourceContribution[]): Anomaly[] {
    const anomalies: Anomaly[] = []
    for (const s of sources) {
      const series = this.tabularData.get(s.sourceId)
      if (!series || series.length === 0) continue
      const values = series.map((d) => d.value)
      const indices = detectStatisticalAnomalies(values, 2)
      for (const idx of indices) {
        const point = series[idx]
        anomalies.push({
          id: generateAnomalyId(),
          type: 'statistical',
          description: `时间点 ${point?.ts} 数据异常 (Z-Score > 2), 数值 ${point?.value}`,
          severity: Math.abs(point?.value ?? 0) > 100 ? 'critical' : 'warning',
          confidence: 0.92,
          detectedAt: new Date().toISOString(),
          sourceIds: [s.sourceId],
          context: { index: idx, value: point?.value, mean: values.reduce((a, b) => a + b, 0) / values.length },
        })
      }
    }
    return anomalies
  }

  private anomaliesToInsights(anomalies: Anomaly[]): Insight[] {
    return anomalies.map((a) => ({
      id: generateInsightId(),
      title: `异常: ${a.type}`,
      description: a.description,
      severity: a.severity,
      category: 'anomaly',
      confidence: a.confidence,
      evidenceSourceIds: a.sourceIds,
      recommendation: a.severity === 'critical' ? '立即处理' : '关注',
    }))
  }

  private computeTrendsFromSources(sources: FusionSourceContribution[]): TrendInsight[] {
    const trends: TrendInsight[] = []
    for (const s of sources) {
      const series = this.tabularData.get(s.sourceId)
      if (!series || series.length < 2) continue
      const len = series.length
      const current = series[len - 1]?.value ?? 0
      const previous = series[len - 2]?.value ?? 0
      const changePercent = calcChangePercent(current, previous)
      const direction = changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable'
      trends.push({
        metric: s.source,
        currentValue: current,
        previousValue: previous,
        changePercent,
        direction,
        forecastNextPeriod: direction === 'up' ? current * 1.05 : direction === 'down' ? current * 0.95 : current,
        description: `${s.source} 从 ${previous} 变为 ${current},变化 ${changePercent.toFixed(2)}%`,
      })
    }
    return trends
  }

  private synthesizeSentimentFromSources(sources: FusionSourceContribution[]): { aggregate: 'positive' | 'neutral' | 'negative'; score: number } {
    const scores = sources.map((s) => s.confidence - 0.5) // 把 confidence 0.5 视为中性
    return {
      aggregate: aggregateSentiment(scores),
      score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    }
  }

  private runComplianceAudit(sources: FusionSourceContribution[]): Anomaly[] {
    const issues: Anomaly[] = []
    for (const s of sources) {
      if (s.confidence < 0.5) {
        issues.push({
          id: generateAnomalyId(),
          type: 'textual',
          description: `数据源 ${s.source} 置信度 ${s.confidence.toFixed(2)} 低于合规要求 0.5`,
          severity: 'warning',
          confidence: 0.95,
          detectedAt: new Date().toISOString(),
          sourceIds: [s.sourceId],
          context: { confidence: s.confidence, threshold: 0.5 },
        })
      }
    }
    return issues
  }

  private linkEntities(sources: FusionSourceContribution[]): Insight[] {
    return sources.slice(0, 2).map((s, i) => ({
      id: generateInsightId(),
      title: `实体链接 #${i + 1}`,
      description: `从 ${s.source} 提取到 ${s.keyFindings.length} 个关键实体`,
      severity: 'info',
      category: 'entity',
      confidence: s.confidence,
      evidenceSourceIds: [s.sourceId],
    }))
  }

  private generateReport(
    task: FusionTask,
    insights: Insight[],
    anomalies: Anomaly[],
    trends: TrendInsight[] = [],
  ): ComprehensiveReport {
    const sections: ComprehensiveReport['sections'] = [
      {
        title: '执行摘要',
        content: `本次${task.taskType}综合分析任务,处理了 ${task.sources.length} 个数据源,生成 ${insights.length} 项洞察,识别 ${anomalies.length} 项异常。`,
        chartType: undefined,
      },
      {
        title: '关键洞察',
        content: insights.map((i, idx) => `${idx + 1}. **${i.title}** (${i.severity}): ${i.description}`).join('\n\n') || '暂无洞察',
      },
    ]
    if (anomalies.length > 0) {
      sections.push({
        title: '异常情况',
        content: anomalies.map((a, idx) => `${idx + 1}. ${a.description} [${a.severity}]`).join('\n'),
        chartType: 'bar',
        chartData: { categories: anomalies.map((a) => a.type), values: anomalies.map((a) => a.confidence) },
      })
    }
    if (trends.length > 0) {
      sections.push({
        title: '趋势分析',
        content: trends.map((t) => `${t.metric}: ${t.description}`).join('\n'),
        chartType: 'line',
        chartData: { series: trends.map((t) => ({ name: t.metric, current: t.currentValue, previous: t.previousValue })) },
      })
    }
    return {
      reportId: generateReportId(),
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

  private toTaskResponse(t: FusionTask): FusionTaskResponse {
    return {
      id: t.id,
      tenantId: t.tenantId,
      taskType: t.taskType,
      title: t.title,
      status: t.status,
      progress: t.progress,
      durationMs: t.durationMs,
      sourceCount: t.sources.length,
      insightCount: t.insights.length,
      anomalyCount: t.anomalies.length,
      avgConfidence: weightedConfidence(t.sources),
      errorMessage: t.errorMessage,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }
}