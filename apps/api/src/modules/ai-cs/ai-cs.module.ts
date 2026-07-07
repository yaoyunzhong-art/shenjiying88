import { Module } from '@nestjs/common'
import { CSEngine } from './cs.engine'
import { AiCsController } from './ai-cs.controller'
import { SessionService } from './session.service'
import { IntentService } from './intent.service'
import { KnowledgeService } from './knowledge.service'
import { FallbackService } from './fallback.service'
import { HandoffService } from './handoff.service'
import { ConversationAdapter } from './datasources/conversation.adapter'
import { KnowledgeAdapter } from './datasources/knowledge.adapter'
import { IntentAdapter } from './datasources/intent.adapter'
import { OpenAIProvider } from './providers/openai.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import { MockProvider } from './providers/mock.provider'

/**
 * Phase-41 T171: AiCsModule
 *
 * 13 provider:
 *  - 5 core services
 *  - 3 adapters
 *  - 3 providers
 *  - 1 engine
 *  - 1 controller
 */

@Module({
  controllers: [AiCsController],
  providers: [
    // Adapters
    ConversationAdapter,
    KnowledgeAdapter,
    IntentAdapter,
    // Providers
    OpenAIProvider,
    DeepSeekProvider,
    MockProvider,
    // Core Services
    SessionService,
    IntentService,
    KnowledgeService,
    FallbackService,
    HandoffService,
    // Engine
    CSEngine
  ],
  exports: [
    CSEngine,
    FallbackService,
    HandoffService,
    KnowledgeService,
    SessionService
  ]
})
export class AiCsModule {}