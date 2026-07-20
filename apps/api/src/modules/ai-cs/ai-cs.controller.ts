import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { CSEngine } from './cs.engine'
import { SessionService } from './session.service'
import { IntentService } from './intent.service'
import { KnowledgeService } from './knowledge.service'
import { HandoffService } from './handoff.service'
import { ConversationAdapter } from './datasources/conversation.adapter'
import { FallbackService } from './fallback.service'
import type {
  SendMessageRequest,
  HandoffRequest,
  ConversationChannel,
  Knowledge
} from './ai-cs.entity'
import { TenantGuard } from '../agent/tenant.guard'

/**
 * Phase-41 T171: AI 客服 Controller
 *
 * 7 endpoint:
 *  - POST /ai-cs/send          主入口: 发送消息
 *  - POST /ai-cs/handoff       主动转人工
 *  - POST /ai-cs/knowledge     添加知识库条目
 *  - GET  /ai-cs/knowledge/search  知识库检索
 *  - GET  /ai-cs/sessions      列出活跃会话
 *  - GET  /ai-cs/sessions/:id  会话详情
 *  - GET  /ai-cs/health        健康检查
 */

@Controller('ai-cs')
@UseGuards(TenantGuard)
export class AiCsController {
  constructor(
    private readonly engine: CSEngine,
    private readonly sessionService: SessionService,
    private readonly intentService: IntentService,
    private readonly knowledgeService: KnowledgeService,
    private readonly handoffService: HandoffService,
    private readonly conversationAdapter: ConversationAdapter,
    private readonly fallbackService: FallbackService
  ) {}

  @Post('send')
  async sendMessage(@Body() req: SendMessageRequest) {
    return this.engine.sendMessage(req)
  }

  @Post('handoff')
  async handoff(@Body() req: HandoffRequest) {
    return this.handoffService.createTicket(req)
  }

  @Post('knowledge')
  async addKnowledge(@Body() knowledge: Knowledge) {
    return this.knowledgeService.search(knowledge.tenantId, knowledge.title).length > 0
      ? { ...knowledge, id: knowledge.id }
      : this.knowledgeService.search(knowledge.tenantId, knowledge.title)
  }

  @Get('knowledge/search')
  async searchKnowledge(
    @Query('tenantId') tenantId: string,
    @Query('q') query: string,
    @Query('topK') topK?: string
  ) {
    return this.knowledgeService.search(tenantId, query, { topK: topK ? parseInt(topK) : 5 })
  }

  @Get('sessions')
  async listSessions(
    @Query('tenantId') tenantId: string,
    @Query('memberId') memberId?: string
  ) {
    if (memberId) {
      return this.conversationAdapter.queryByMember(tenantId, memberId)
    }
    return this.conversationAdapter.queryAll(tenantId)
  }

  @Get('sessions/:id')
  async getSession(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    const conversation = this.conversationAdapter.query(tenantId, id)
    if (!conversation) return { error: 'not_found' }
    const sessionStats = this.sessionService.stats()
    const queueStats = this.handoffService.queueStats(tenantId)
    return {
      conversation,
      sessionCache: sessionStats,
      handoffQueue: queueStats
    }
  }

  @Get('health')
  async health() {
    const providers = await this.fallbackService.listAvailable()
    return {
      status: 'ok',
      providers,
      timestamp: new Date().toISOString()
    }
  }
}