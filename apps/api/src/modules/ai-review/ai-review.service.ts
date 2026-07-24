import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { llmConfig } from './llm/llm.config'
import { LLMProviderFactory } from './llm/llm.provider'
import { CostTrackerService } from './llm/cost-tracker.service'
import { type LLMResponse, type UsageMetrics } from './llm/types'
import { buildDiffReviewRequest, type ReviewOutput } from './llm/prompt-templates'

export type { ReviewOutput }

export interface PRDiffReviewParams {
  prTitle: string
  prDescription: string
  files: Array<{ filePath: string; language: string; diff: string; additions: number; deletions: number }>
  knowledgeContext?: string
  cacheKey?: string
}

export interface ReviewResult {
  output: ReviewOutput
  raw: LLMResponse
  totalLatencyMs: number
  cacheHit: boolean
}

@Injectable()
export class AIReviewService {
  private readonly logger = new Logger(AIReviewService.name)

  constructor(
    @Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>,
    private readonly factory: LLMProviderFactory,
    private readonly costTracker: CostTrackerService
  ) {
    this.logger.debug('AIReviewService initialized (Pulse-73 refactored)')
  }

  async reviewPRDiff(params: PRDiffReviewParams): Promise<ReviewResult> {
    const start = Date.now()
    const filesContext = this.formatFilesContext(params.files)
    const request = buildDiffReviewRequest({
      prTitle: params.prTitle,
      prDescription: params.prDescription,
      fileCount: params.files.length,
      filesContext,
      knowledgeContext: params.knowledgeContext,
      cacheKey: params.cacheKey,
    })

    const cached = this.costTracker.checkCache(request)
    if (cached.hit && cached.response) {
      return { output: this.parseReviewOutput(cached.response.content), raw: { ...cached.response, cacheHit: true }, totalLatencyMs: Date.now() - start, cacheHit: true }
    }

    const provider = this.factory.get(request.provider ?? this.cfg.defaultProvider)
    const response = await provider.generate(request)
    this.costTracker.recordUsage(response.usage)
    this.costTracker.setCache(request, response)

    return {
      output: this.parseReviewOutput(response.content),
      raw: response,
      totalLatencyMs: Date.now() - start,
      cacheHit: false,
    }
  }

  async reviewTestCoverage(params: { filePath: string; codeSummary: string; currentCoverage: number }): Promise<ReviewResult> {
    const provider = this.factory.get(this.cfg.defaultProvider)
    const response = await provider.generate({
      provider: this.cfg.defaultProvider,
      systemPrompt: `Review test coverage for ${params.filePath} (current: ${params.currentCoverage}%)`,
      userPrompt: params.codeSummary,
      maxOutputTokens: 2048,
    })
    return { output: this.parseReviewOutput(response.content), raw: response, totalLatencyMs: response.latencyMs, cacheHit: false }
  }

  async reviewPerformance(params: { filePath: string; budgetMs: number; qps: number }): Promise<ReviewResult> {
    const provider = this.factory.get(this.cfg.defaultProvider)
    const response = await provider.generate({
      provider: this.cfg.defaultProvider,
      systemPrompt: `Performance review for ${params.filePath} (budget: ${params.budgetMs}ms, QPS: ${params.qps})`,
      userPrompt: params.filePath,
      maxOutputTokens: 1024,
    })
    return { output: this.parseReviewOutput(response.content), raw: response, totalLatencyMs: response.latencyMs, cacheHit: false }
  }

  async draftRFC(params: { topic: string; background: string; proposal: string }): Promise<{ markdown: string; raw: LLMResponse }> {
    const provider = this.factory.get(this.cfg.defaultProvider)
    const response = await provider.generate({
      provider: this.cfg.defaultProvider,
      systemPrompt: `Draft RFC for: ${params.topic}`,
      userPrompt: `Background:\n${params.background}\n\nProposal:\n${params.proposal}`,
      maxOutputTokens: 4096,
    })
    return { markdown: response.content, raw: response }
  }

  parseReviewOutput(content: string): ReviewOutput {
    const cleaned = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    try {
      return JSON.parse(cleaned) as ReviewOutput
    } catch (err) {
      return { overallScore: 0, issues: [], strengths: [], summary: `parse failed: ${(err as Error).message}`, needsApproverReview: true }
    }
  }

  formatFilesContext(files: PRDiffReviewParams['files']): string {
    return files.map(f => `### ${f.filePath} (${f.language}) +${f.additions}/-${f.deletions}\n\`\`\`diff\n${f.diff}\n\`\`\``).join('\n\n')
  }

  async healthcheck(): Promise<{ ok: boolean; defaultProvider: string; budgetUtilization: number; cacheEnabled: boolean }> {
    const snapshot = this.costTracker.snapshot()
    return { ok: true, defaultProvider: this.cfg.defaultProvider, budgetUtilization: snapshot.utilizationPct, cacheEnabled: this.cfg.enablePromptCache }
  }
}

export { LLMUnavailableError, BudgetExceededError } from './llm/types'
