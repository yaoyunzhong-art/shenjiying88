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
 *   - AdvancedCSService        客服高级分析 (🐜 V17)
 *   - AdvancedDiagnosisService 诊断高级分析 (🐜 V17)
 *   - AdvancedModelConfigService 模型配置高级服务 (🐜 V17)
 *   - SalesInsightService      销售洞察高级服务 (🐜 V17)
 *   - ForecastInsightService   预测洞察高级服务 (🐜 V17)
 *   - AdvancedReviewService    高级代码审查服务
 *
 * ✅ 已注册到 app.module.ts (Phase-19 · Pulse-80)
 *   - 模块已定义,可被 import
 *   - service 内部 TODO 由 Pulse-73 接入 (真实 API key + 启动连接)
 */

import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { llmConfig } from './llm/llm.config'
import {
  ClaudeProvider,
  DeepSeekProvider,
  OpenAIProvider,
  LLMProviderFactory,
} from './llm/llm.provider'
import { CostTrackerService } from './llm/cost-tracker.service'
import { AIReviewService } from './ai-review.service'
import { AIReviewController } from './ai-review.controller'
import { AdvancedCSService } from './ai-cs-advanced.service'
import { AdvancedDiagnosisService } from './ai-diagnosis-advanced.service'
import { AdvancedModelConfigService } from './ai-model-config-advanced.service'
import { SalesInsightService } from './ai-sales-insight.service'
import { ForecastInsightService } from './ai-forecast-insight.service'
import { AdvancedReviewService } from './ai-review-advanced.service'

// 导出 llm 子模块 (供外部 / scripts 使用)
export * from './llm/types'
export * from './llm/llm.config'
export * from './llm/llm.provider'
export * from './llm/cost-tracker.service'
export * from './llm/prompt-templates'
export * from './ai-review.service'
export * from './ai-cs-advanced.service'
export * from './ai-diagnosis-advanced.service'
export * from './ai-model-config-advanced.service'
export * from './ai-sales-insight.service'
export * from './ai-forecast-insight.service'
export * from './ai-review-advanced.service'

@Global()
@Module({
  imports: [ConfigModule.forFeature(llmConfig)],
  controllers: [AIReviewController],
  providers: [
    ClaudeProvider,
    DeepSeekProvider,
    OpenAIProvider,
    LLMProviderFactory,
    CostTrackerService,
    AIReviewService,
    AdvancedCSService,
    AdvancedDiagnosisService,
    AdvancedModelConfigService,
    SalesInsightService,
    ForecastInsightService,
    AdvancedReviewService,
  ],
  exports: [
    ClaudeProvider,
    DeepSeekProvider,
    OpenAIProvider,
    LLMProviderFactory,
    CostTrackerService,
    AIReviewService,
    AdvancedCSService,
    AdvancedDiagnosisService,
    AdvancedModelConfigService,
    SalesInsightService,
    ForecastInsightService,
    AdvancedReviewService,
  ],
})
export class AIReviewModule {}
