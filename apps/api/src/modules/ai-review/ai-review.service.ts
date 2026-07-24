/**
 * ai-review.service.ts · AI Code Reviewer 主入口 (Phase-19)
 *
 * 设计依据:
 *   - debt.md TD-002 (AI Review 准确率 ≥70%)
 *   - knowledge/decision-records/DR-005-rag-architecture.md
 *   - knowledge/patterns/quota-guard.md (跨领域知识注入)
 *
 * 核心流程 (完整版):
 *   1. 接收 PR diff (file paths + diff hunks)
 *   2. 调用 RAG 检索相关代码上下文 (RetrievalService.retrieveCode)
 *   3. 调用 RAG 检索知识库上下文 (RetrievalService.retrieveKnowledge)
 *   4. 构建 prompt (buildDiffReviewRequest)
 *   5. 检查 prompt cache (CostTrackerService.checkCache)
 *   6. 调用 LLM (ClaudeProvider.generate)
 *   7. 解析 JSON 输出 → ReviewOutput
 *   8. 记录成本 (CostTrackerService.recordUsage)
 *   9. 写入 cache (CostTrackerService.setCache)
 *  10. 返回 ReviewOutput
 *
 * ⚠️  当前脚手架阶段仅定义接口签名,Pulse-73 实现完整流程
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { llmConfig } from './llm/llm.config'
import { LLMProviderFactory, type ILLMProvider } from './llm/llm.provider'
import { CostTrackerService } from './llm/cost-tracker.service'
import {
  type LLMRequest,
  type LLMResponse,
  type UsageMetrics,
  LLMUnavailableError,
  BudgetExceededError,
} from './llm/types'
import {
  buildDiffReviewRequest,
  buildTestReviewRequest,
  buildPerformanceReviewRequest,
  buildRFCDraftRequest,
  type ReviewOutput,
} from './llm/prompt-templates'

export type { ReviewOutput }

// ─── 输入参数 ──────────────────────────────────────────────────────────

/**
 * PR Diff 评审请求入参
 */
export interface PRDiffReviewParams {
  /** PR 标题 */
  prTitle: string
  /** PR 描述 */
  prDescription: string
  /** 变更文件 (path → diff) */
  files: Array<{
    filePath: string
    language: string
    diff: string
    additions: number
    deletions: number
  }>
  /** 关联领域知识 (由 RAG 检索后传入) */
  knowledgeContext?: string
  /** Cache key (建议: hash(prTitle + files.hash)) */
  cacheKey?: string
}

/**
 * 通用 Review 结果
 */
export interface ReviewResult {
  /** 评审输出 (JSON) */
  output: ReviewOutput
  /** 原始 LLM 响应 */
  raw: LLMResponse
  /** 耗时 (ms) */
  totalLatencyMs: number
  /** 缓存命中 */
  cacheHit: boolean
}

// ─── Service 主类 ──────────────────────────────────────────────────────

@Injectable()
export class AIReviewService {
  private readonly logger = new Logger(AIReviewService.name)

  constructor(
    @Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>,
    private readonly factory: LLMProviderFactory,
    private readonly costTracker: CostTrackerService
  ) {
    this.logger.debug('AIReviewService initialized (Phase-19 skeleton)')
  }

  // ─── 主入口: PR Diff 评审 ─────────────────────────────────────────

  /**
   * 评审 PR diff (主入口)
   */
  async reviewPRDiff(params: PRDiffReviewParams): Promise<ReviewResult> {
    // TODO[Pulse-73]: 完整实现
    //
    //   1. const startTime = Date.now()
    //   2. const filesContext = this.formatFilesContext(params.files)
    //   3. const request = buildDiffReviewRequest({
    //        prTitle: params.prTitle,
    //        prDescription: params.prDescription,
    //        fileCount: params.files.length,
    //        filesContext,
    //        knowledgeContext: params.knowledgeContext,
    //        cacheKey: params.cacheKey,
    //      })
    //   4.
    //     // 4.1 检查 cache
    //     const cached = this.costTracker.checkCache(request)
    //     if (cached.hit && cached.response) {
    //       return {
    //         output: this.parseReviewOutput(cached.response.content),
    //         raw: { ...cached.response, cacheHit: true },
    //         totalLatencyMs: Date.now() - startTime,
    //         cacheHit: true,
    //       }
    //     }
    //     // 4.2 预算闸门
    //     const budget = this.costTracker.checkBudget(request.provider ?? this.cfg.defaultProvider)
    //     if (!budget.allowed && budget.fallback) {
    //       request.provider = budget.fallback
    //     }
    //     // 4.3 LLM 调用
    //     const provider = this.factory.get(request.provider ?? this.cfg.defaultProvider)
    //     const response = await provider.generate(request)
    //     // 4.4 记录成本
    //     this.costTracker.recordUsage(response.usage)
    //     // 4.5 写入 cache
    //     this.costTracker.setCache(request, response)
    //     // 4.6 解析 JSON
    //     const output = this.parseReviewOutput(response.content)
    //     return {
    //       output,
    //       raw: response,
    //       totalLatencyMs: Date.now() - startTime,
    //       cacheHit: false,
    //     }

    this.logger.warn('[AIReviewService.reviewPRDiff] not implemented — Pulse-73 skeleton')
    throw new Error('AIReviewService.reviewPRDiff not implemented (Pulse-73 skeleton)')
  }

  /**
   * 评审测试覆盖
   */
  async reviewTestCoverage(params: {
    filePath: string
    codeSummary: string
    currentCoverage: number
  }): Promise<ReviewResult> {
    // TODO[Pulse-73]: 类似 reviewPRDiff 流程
    this.logger.warn('[AIReviewService.reviewTestCoverage] not implemented — Pulse-73 skeleton')
    throw new Error('AIReviewService.reviewTestCoverage not implemented')
  }

  /**
   * 评审性能瓶颈
   */
  async reviewPerformance(params: {
    filePath: string
    budgetMs: number
    qps: number
  }): Promise<ReviewResult> {
    // TODO[Pulse-73]: 类似 reviewPRDiff 流程
    this.logger.warn('[AIReviewService.reviewPerformance] not implemented — Pulse-73 skeleton')
    throw new Error('AIReviewService.reviewPerformance not implemented')
  }

  /**
   * RFC 起草
   */
  async draftRFC(params: { topic: string; background: string; proposal: string }): Promise<{
    markdown: string
    raw: LLMResponse
  }> {
    // TODO[Pulse-73]: 类似 reviewPRDiff 流程,但输出 markdown 而非 JSON
    this.logger.warn('[AIReviewService.draftRFC] not implemented — Pulse-73 skeleton')
    throw new Error('AIReviewService.draftRFC not implemented')
  }

  // ─── 工具方法 ─────────────────────────────────────────────────────

  /**
   * 解析 LLM 输出的 JSON
   *
   * 鲁棒解析:
   *   - 去除 markdown code block 包装
   *   - 容忍尾部逗号
   *   - 失败时返回降级 output (overallScore=0)
   */
  parseReviewOutput(content: string): ReviewOutput {
    // TODO[Pulse-73]: 实现
    //   const cleaned = content
    //     .replace(/^```json\s*/i, '')
    //     .replace(/^```\s*/i, '')
    //     .replace(/```\s*$/i, '')
    //     .trim()
    //   try {
    //     return JSON.parse(cleaned) as ReviewOutput
    //   } catch (err) {
    //     this.logger.error(`Failed to parse review output: ${err}`)
    //     return {
    //       overallScore: 0,
    //       issues: [],
    //       strengths: [],
    //       summary: `解析失败: ${(err as Error).message}`,
    //       needsApproverReview: true,
    //     }
    //   }
    return {
      overallScore: 0,
      issues: [],
      strengths: [],
      summary: 'skeleton — not implemented',
      needsApproverReview: false,
    }
  }

  /**
   * 格式化 files → context (供 prompt 注入)
   */
  formatFilesContext(files: PRDiffReviewParams['files']): string {
    // TODO[Pulse-73]: 实现
    //   return files.map(f =>
    //     `### ${f.filePath} (${f.language}) +${f.additions}/-${f.deletions}\n\`\`\`diff\n${f.diff}\n\`\`\``
    //   ).join('\n\n')
    return files.map((f) => `${f.filePath}: +${f.additions}/-${f.deletions}`).join('\n')
  }

  // ─── 健康检查 ─────────────────────────────────────────────────────

  /**
   * 服务健康检查 (供 /health 端点)
   */
  async healthcheck(): Promise<{
    ok: boolean
    defaultProvider: string
    budgetUtilization: number
    cacheEnabled: boolean
  }> {
    const snapshot = this.costTracker.snapshot()
    return {
      ok: true,
      defaultProvider: this.cfg.defaultProvider,
      budgetUtilization: snapshot.utilizationPct,
      cacheEnabled: this.cfg.enablePromptCache,
    }
  }
}

// ─── 内部 helper: 异常重新导出 ─────────────────────────────────────────

export { LLMUnavailableError, BudgetExceededError }
