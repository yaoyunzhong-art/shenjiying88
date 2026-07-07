import { Injectable, Logger } from '@nestjs/common'
import { SessionService } from './session.service'
import { IntentService } from './intent.service'
import { KnowledgeService } from './knowledge.service'
import { FallbackService } from './fallback.service'
import { HandoffService } from './handoff.service'
import { ConversationAdapter } from './datasources/conversation.adapter'
import { KnowledgeAdapter } from './datasources/knowledge.adapter'
import type {
  SendMessageRequest,
  SendMessageResponse,
  Conversation,
  Message,
  ConversationStatus,
  ConversationChannel
} from './ai-cs.entity'

/**
 * Phase-41 T171: CSEngine (智能客服主引擎)
 *
 * 7 步主流程:
 *  1. 创建/获取会话
 *  2. Prompt Injection 检测 (黑名单 + 长度)
 *  3. Session 上下文加载 (LRU 5 轮)
 *  4. 意图识别 + RAG 检索
 *  5. AI Provider 调用 (含 Fallback)
 *  6. 置信度判断 + 转人工决策
 *  7. 消息持久化 + Session 滑动
 *
 * DR-41-D: Prompt 注入防御 (黑名单 + 2000 chars 限制)
 */

@Injectable()
export class CSEngine {
  private readonly logger = new Logger(CSEngine.name)

  // Prompt 注入黑名单 (反模式 v4 prompt-injection-pattern)
  private readonly INJECTION_KEYWORDS = [
    'ignore previous', 'ignore above', 'disregard',
    'forget everything', 'system prompt',
    '你是谁', '忽略以上', '忽略前面', '忘了', '扮演', 'pretend', 'roleplay',
    'jailbreak', 'DAN', 'developer mode'
  ]
  private readonly MAX_CONTENT_LENGTH = 2000

  // 置信度阈值
  private readonly HANDOFF_CONFIDENCE_THRESHOLD = 0.7

  // 兜底回复
  private readonly FALLBACK_MESSAGE = '抱歉, 我暂时无法理解您的问题, 正在为您转接人工客服...'

  constructor(
    private readonly sessionService: SessionService,
    private readonly intentService: IntentService,
    private readonly knowledgeService: KnowledgeService,
    private readonly fallbackService: FallbackService,
    private readonly handoffService: HandoffService,
    private readonly conversationAdapter: ConversationAdapter,
    private readonly knowledgeAdapter: KnowledgeAdapter
  ) {}

  /**
   * 主入口: 发送消息并获取 AI 回复
   */
  async sendMessage(req: SendMessageRequest): Promise<SendMessageResponse> {
    const startTime = Date.now()

    // 1. 创建/获取会话
    const conversation = this.ensureConversation(req)

    // 2. Prompt Injection 检测
    const injectionDetected = this.detectInjection(req.content)
    if (injectionDetected) {
      return this.handleInjection(req, conversation)
    }

    // 3. 加载 Session 上下文
    this.sessionService.hydrateFromMessages(req.tenantId, conversation.messages)
    const sessionCtx = this.sessionService.getOrCreate(req.conversationId ?? conversation.id)

    // 4. 意图识别 + RAG 检索
    const intentResult = this.intentService.recognize(req.tenantId, req.content)
    const knowledgeMatched = this.knowledgeService.searchHighConfidence(req.tenantId, req.content)

    // 5. AI Provider 调用
    const sessionMessages = sessionCtx.messages.length > 0
      ? [...sessionCtx.messages, { role: 'user' as const, content: req.content }]
      : [{ role: 'user' as const, content: req.content }]

    const aiResponse = await this.fallbackService.complete({
      messages: sessionMessages,
      temperature: 0.7,
      maxTokens: 500
    })

    // 6. 置信度判断 + 转人工决策
    const confidence = aiResponse.confidence
    const userExplicitHandoff = /人工|human|transfer|转接/i.test(req.content)
    const needHandoff = req.options?.forceHandoff ||
                        this.intentService.shouldHandoff(confidence) ||
                        injectionDetected ||
                        userExplicitHandoff

    let handoffTicketId: string | undefined
    let handoffTriggered = false

    if (needHandoff) {
      const handoff = this.handoffService.createTicket({
        tenantId: req.tenantId,
        conversationId: conversation.id,
        reason: this.inferHandoffReason(req.content, intentResult.intent?.id, confidence),
        priority: 'medium'
      })
      handoffTicketId = handoff.ticket.id
      handoffTriggered = true
    }

    // 7. 消息持久化
    const aiMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId: conversation.id,
      tenantId: req.tenantId,
      role: 'ai',
      content: handoffTriggered ? this.FALLBACK_MESSAGE : aiResponse.content,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: aiResponse.provider,
        intent: intentResult.intent?.id,
        confidence,
        knowledgeIds: knowledgeMatched.map(k => k.id),
        tokens: aiResponse.tokensUsed,
        latencyMs: aiResponse.latencyMs
      }
    }

    this.conversationAdapter.appendMessage(req.tenantId, conversation.id, aiMessage)
    this.sessionService.appendMessage(conversation.id, 'assistant', aiMessage.content)
    this.sessionService.appendMessage(conversation.id, 'user', req.content)

    return {
      conversationId: conversation.id,
      message: aiMessage,
      intent: intentResult.intent ?? undefined,
      knowledgeMatched,
      handoffTriggered,
      handoffTicketId,
      provider: aiResponse.provider,
      latencyMs: Date.now() - startTime,
      confidence,
      cached: aiResponse.cached
    }
  }

  /**
   * 创建会话
   */
  createConversation(
    tenantId: string,
    memberId: string | undefined,
    channel: ConversationChannel
  ): Conversation {
    const conversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      memberId,
      channel,
      status: 'ACTIVE' as ConversationStatus,
      messages: [],
      context: [],
      metadata: {
        totalMessages: 0,
        lastActivityAt: new Date().toISOString(),
        fallbackCount: 0,
        handoffCount: 0,
        language: 'zh-CN',
        sentiment: 'neutral'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return this.conversationAdapter.create(conversation)
  }

  /**
   * 主动转人工
   */
  requestHandoff(req: HandoffRequest) {
    return this.handoffService.createTicket(req)
  }

  // ─── 内部方法 ────────────────────────────────────────

  private ensureConversation(req: SendMessageRequest): Conversation {
    if (req.conversationId) {
      const existing = this.conversationAdapter.query(req.tenantId, req.conversationId)
      if (!existing) throw new Error(`Conversation ${req.conversationId} not found`)
      // 追加用户消息
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: existing.id,
        tenantId: req.tenantId,
        role: 'user',
        content: req.content,
        timestamp: new Date().toISOString()
      }
      return this.conversationAdapter.appendMessage(req.tenantId, existing.id, userMsg)
    }
    // 创建新会话
    const created = this.createConversation(req.tenantId, req.memberId, req.channel)
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: created.id,
      tenantId: req.tenantId,
      role: 'user',
      content: req.content,
      timestamp: new Date().toISOString()
    }
    return this.conversationAdapter.appendMessage(req.tenantId, created.id, userMsg)
  }

  /**
   * Prompt Injection 检测 (反模式 v4)
   */
  private detectInjection(content: string): boolean {
    if (content.length > this.MAX_CONTENT_LENGTH) return true  // 超长
    const lower = content.toLowerCase()
    return this.INJECTION_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))
  }

  private handleInjection(req: SendMessageRequest, conversation: Conversation): SendMessageResponse {
    const safeReply: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conversation.id,
      tenantId: req.tenantId,
      role: 'ai',
      content: '您的输入包含敏感内容, 已转人工客服处理。',
      timestamp: new Date().toISOString(),
      metadata: { provider: 'mock', confidence: 0 }
    }
    this.conversationAdapter.appendMessage(req.tenantId, conversation.id, safeReply)

    const handoff = this.handoffService.createTicket({
      tenantId: req.tenantId,
      conversationId: conversation.id,
      reason: 'sentiment-negative',
      priority: 'high'
    })

    return {
      conversationId: conversation.id,
      message: safeReply,
      knowledgeMatched: [],
      handoffTriggered: true,
      handoffTicketId: handoff.ticket.id,
      provider: 'mock',
      latencyMs: 0,
      confidence: 0,
      cached: false
    }
  }

  private inferHandoffReason(content: string, intentId?: string, confidence?: number): 'low-confidence' | 'user-request' | 'complex-query' | 'sentiment-negative' {
    const lower = content.toLowerCase()
    if (lower.includes('人工') || lower.includes('人工客服') || lower.includes('human')) {
      return 'user-request'
    }
    if (lower.includes('投诉') || lower.includes('差评') || lower.includes('生气')) {
      return 'sentiment-negative'
    }
    if (confidence !== undefined && confidence < 0.5) {
      return 'low-confidence'
    }
    return 'complex-query'
  }
}

// 需导入 HandoffRequest (上面已用)
import type { HandoffRequest } from './ai-cs.entity'