/**
 * ai-review.module.ts · AI Code Reviewer 模块定义 (Phase-19)
 *
 * 设计依据:
 *   - debt.md TD-001 (LLM API 成本控制)
 *   - debt.md TD-002 (AI Review 准确率 ≥70%)
 *
 * 模块导出:
 *   - AIReviewService          供其他模块调用 (Phase-21 接 GitHub Webhook)
 *   - ClaudeProvider           LLM provider (主)
 *   - OpenAIProvider           LLM provider (fallback)
 *   - LLMProviderFactory       provider 工厂
 *   - CostTrackerService       成本追踪
 *
 * ✅ 已注册到 app.module.ts (Phase-19 · Pulse-80)
 *   - 模块已定义,可被 import (但 service 内部 TODO 未实现)
 *   - service 内部 TODO 由 Pulse-73 接入 (真实 API key + 启动连接)
 */

import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { llmConfig } from './llm/llm.config'
import {
  ClaudeProvider,
  OpenAIProvider,
  LLMProviderFactory,
} from './llm/llm.provider'
import { CostTrackerService } from './llm/cost-tracker.service'
import { AIReviewService } from './ai-review.service'
import { AIReviewController } from './ai-review.controller'

// 导出 llm 子模块 (供外部 / scripts 使用)
export * from './llm/types'
export * from './llm/llm.config'
export * from './llm/llm.provider'
export * from './llm/cost-tracker.service'
export * from './llm/prompt-templates'
export * from './ai-review.service'

@Global()
@Module({
  imports: [ConfigModule.forFeature(llmConfig)],
  controllers: [AIReviewController],
  providers: [
    ClaudeProvider,
    OpenAIProvider,
    LLMProviderFactory,
    CostTrackerService,
    AIReviewService,
  ],
  exports: [
    ClaudeProvider,
    OpenAIProvider,
    LLMProviderFactory,
    CostTrackerService,
    AIReviewService,
  ],
})
export class AIReviewModule {}
