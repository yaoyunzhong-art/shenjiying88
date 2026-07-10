/**
 * Phase 94 智能分析 Service (V10 Sprint 2 Day 16)
 *
 * 核心流:
 * 1. 校验权限 + 解析模板
 * 2. 检查缓存 (24h TTL) - 命中直接返回
 * 3. 调用 LLM (复用 Phase 87 AI 模型配置 + decryptField)
 * 4. 持久化 + 记录 token 用量
 *
 * 复用:
 * - Phase 87 AiModelConfigService (拿 LLM API key)
 * - Phase 91 ReportService (数据源)
 * - tenant context (强制)
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  InsightReport,
  InsightSource,
  InsightStatus,
  InsightTemplateType,
  buildInsightCacheKey,
  hashSources,
} from './insight.entity'
import {
  GenerateInsightRequest,
  ListInsightRequest,
  InsightResponse,
  toInsightResponse,
} from './insight.dto'
import { getTemplate, buildLLMRequest } from './insight.prompt'
import {
  AiModelConfigService,
} from '../ai-model-config/ai-model-config.service'
import type { StoreConfigResponse } from '../ai-model-config/ai-model-config.service'

/**
 * LLM Provider 接口 (与 ai-cs/providers 类似)
 */
export interface LLMProvider {
  complete(req: {
    systemPrompt: string
    userPrompt: string
    maxTokens: number
    temperature: number
    apiKey: string
    endpointUrl: string
    modelName: string
  }): Promise<{
    content: string
    promptTokens: number
    completionTokens: number
  }>
}

/**
 * 默认 Mock LLM Provider (Phase 94 测试用 + 开发环境兜底)
 * 生产环境由 Sprint 2 配置真实 deepseek/openai
 */
class MockLLMProvider implements LLMProvider {
  async complete(req: {
    systemPrompt: string
    userPrompt: string
    maxTokens: number
    temperature: number
    apiKey: string
    endpointUrl: string
    modelName: string
  }) {
    // 基于 systemPrompt 类型生成简易响应 (模拟 LLM)
    const lines = req.userPrompt.split('\n').filter((l) => l.trim())
    const dataLines = lines.filter((l) => l.startsWith('###') || l.startsWith('```'))
    const summary = dataLines.slice(0, 3).join('\n')
    const content = [
      '## 关键发现',
      `- 数据源包含 ${dataLines.length} 行原始数据`,
      `- 已识别主要指标趋势 (基于 systemPrompt: ${req.systemPrompt.slice(0, 30)}...)`,
      '',
      '## 行动建议',
      '- 持续监控核心指标波动',
      '- 关注异常数据点',
      '',
      '## 风险提示',
      '- 当前为 mock 输出,生产请配置真实 LLM',
    ].join('\n')
    return {
      content,
      promptTokens: req.userPrompt.length,
      completionTokens: content.length,
    }
  }
}

@Injectable()
export class InsightService {
  private readonly reports = new Map<string, InsightReport>()
  /** LRU 缓存: cacheKey → { reportId, expiresAt } */
  private readonly cache = new Map<
    string,
    { reportId: string; expiresAt: number }
  >()
  /** LLM Provider (可注入) */
  private llmProvider: LLMProvider = new MockLLMProvider()

  constructor(private readonly aiConfigService: AiModelConfigService) {}

  // ============ 注入 LLM Provider (测试用) ============

  setLLMProvider(provider: LLMProvider): void {
    this.llmProvider = provider
  }

  // ============ 1. 生成洞察 ============

  async generate(req: GenerateInsightRequest): Promise<InsightResponse> {
    const ctx = requireTenantContext()
    if (!ctx.tenantId) {
      throw new BadRequestException('Missing tenant context')
    }
    if (!req.sources || req.sources.length === 0) {
      throw new BadRequestException('At least one source is required')
    }
    if (req.sources.length > 10) {
      throw new BadRequestException('Max 10 sources per insight')
    }

    // 1. 获取模板
    const template = getTemplate(req.templateType)

    // 2. 转换 sources 为 InsightSource
    const sources: InsightSource[] = req.sources.map((s) => ({
      type: s.type,
      refId: s.refId,
      dataSnapshot: s.dataSnapshot,
      period: s.period,
    }))

    // 3. 检查缓存 (除非 force=true)
    const cacheKey = buildInsightCacheKey(
      ctx.tenantId,
      req.templateType,
      hashSources(sources),
    )
    if (!req.force) {
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        const cachedReport = this.reports.get(cached.reportId)
        if (cachedReport && cachedReport.status === 'completed') {
          return toInsightResponse(cachedReport, true)
        }
      }
    }

    // 4. 拿当前生效 AI 配置 (Phase 87)
    const aiConfig = await this.getActiveAiConfig(ctx.storeId)
    if (!aiConfig) {
      throw new BadRequestException(
        'No active AI model configured for current store. Configure one in Phase 87 first.',
      )
    }

    // 5. 构建 LLM 请求
    const llmReq = buildLLMRequest(template, sources, {
      maxTokens: req.maxTokens,
    })

    // 6. 解密 API key (Phase 87 getDecryptedApiKey)
    const apiKey = await this.aiConfigService.getDecryptedApiKey(aiConfig.id)
    if (!apiKey) {
      throw new BadRequestException('Failed to decrypt AI API key')
    }

    // 7. 创建 pending report
    const reportId = `ins-${randomUUID().slice(0, 8)}-${Date.now().toString(36)}`
    const report: InsightReport = {
      id: reportId,
      tenantId: ctx.tenantId,
      storeId: ctx.storeId,
      templateType: req.templateType,
      status: 'generating',
      prompt: llmReq.userPrompt.slice(0, 500), // 截断存
      modelId: aiConfig.id,
      sources,
      createdAt: new Date().toISOString(),
      createdBy: ctx.userId ?? 'system',
      cacheTtlSec: 86400, // 24h
    }
    this.reports.set(reportId, report)

    try {
      // 8. 调用 LLM
      const llmRes = await this.llmProvider.complete({
        systemPrompt: llmReq.systemPrompt,
        userPrompt: llmReq.userPrompt,
        maxTokens: llmReq.maxTokens,
        temperature: llmReq.temperature,
        apiKey,
        endpointUrl: aiConfig.endpointUrl,
        modelName: aiConfig.provider,
      })

      // 9. 更新为 completed
      report.content = llmRes.content
      report.status = 'completed'
      report.completedAt = new Date().toISOString()
      report.tokenUsage = {
        prompt: llmRes.promptTokens,
        completion: llmRes.completionTokens,
        total: llmRes.promptTokens + llmRes.completionTokens,
      }

      // 10. 写入缓存
      this.cache.set(cacheKey, {
        reportId,
        expiresAt: Date.now() + report.cacheTtlSec * 1000,
      })

      return toInsightResponse(report, false)
    } catch (err: any) {
      report.status = 'failed'
      report.error = err.message ?? String(err)
      report.completedAt = new Date().toISOString()
      throw err
    }
  }

  // ============ 2. 列表查询 ============

  async list(req: ListInsightRequest): Promise<{
    items: InsightResponse[]
    total: number
    nextCursor?: string
  }> {
    const ctx = requireTenantContext()
    const limit = Math.min(req.limit ?? 20, 100)
    let items = Array.from(this.reports.values()).filter(
      (r) => r.tenantId === ctx.tenantId,
    )
    if (req.templateType) {
      items = items.filter((r) => r.templateType === req.templateType)
    }
    if (req.status) {
      items = items.filter((r) => r.status === req.status)
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const startIdx = req.cursor ? Number(req.cursor) : 0
    const paged = items.slice(startIdx, startIdx + limit)
    const nextCursor =
      startIdx + limit < items.length ? String(startIdx + limit) : undefined

    return {
      items: paged.map((r) => toInsightResponse(r, false)),
      total: items.length,
      nextCursor,
    }
  }

  // ============ 3. 按 ID 查询 ============

  async getById(id: string): Promise<InsightResponse> {
    const ctx = requireTenantContext()
    const report = this.reports.get(id)
    if (!report) {
      throw new NotFoundException(`Insight ${id} not found`)
    }
    if (report.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`Insight ${id} not found`)
    }
    return toInsightResponse(report, false)
  }

  // ============ 4. 内部辅助 ============

  private async getActiveAiConfig(
    storeId?: string,
  ): Promise<StoreConfigResponse | null> {
    if (!storeId) return null
    try {
      return await this.aiConfigService.getCurrentConfig(storeId)
    } catch {
      return null
    }
  }

  /** 清理过期缓存 (测试用 + 内存回收) */
  pruneExpiredCache(): number {
    const now = Date.now()
    let pruned = 0
    for (const [key, val] of this.cache.entries()) {
      if (val.expiresAt <= now) {
        this.cache.delete(key)
        pruned++
      }
    }
    return pruned
  }

  // ============ 5. 删除洞察 ============

  /** 删除指定洞察 */
  deleteInsight(id: string): { deleted: boolean } {
    const ctx = requireTenantContext()
    const report = this.reports.get(id)
    if (!report) {
      throw new NotFoundException(`Insight ${id} not found`)
    }
    if (report.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`Insight ${id} not found`)
    }
    this.reports.delete(id)

    // 同时清理关联的缓存条目
    for (const [key, val] of this.cache.entries()) {
      if (val.reportId === id) {
        this.cache.delete(key)
        break
      }
    }

    return { deleted: true }
  }

  /** 状态计数 (测试用) */
  countByStatus(): Record<InsightStatus, number> {
    const counts: Record<InsightStatus, number> = {
      pending: 0,
      generating: 0,
      completed: 0,
      failed: 0,
    }
    for (const r of this.reports.values()) {
      counts[r.status]++
    }
    return counts
  }
}
