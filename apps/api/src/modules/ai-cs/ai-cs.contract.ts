/**
 * 🐜 自动: [ai-cs] [A] contract 补全
 *
 * AI 智能客服：跨模块合约类型
 * 定义 ai-cs 模块对外暴露的稳定合约接口，
 * 供其他模块（portal, notification, analytics 等）消费。
 */
import type {
  Message,
  Conversation,
  Knowledge,
  Intent,
  HandoffTicket,
  SendMessageResponse,
  HandoffResponse,
  ConversationStatus,
  ConversationChannel,
  HandoffReason,
  ProviderType,
} from './ai-cs.entity'

/**
 * 消息合约（跨模块安全子集）
 */
export interface MessageContract {
  id: string
  conversationId: string
  tenantId: string
  role: Message['role']
  content: string
  timestamp: string
  metadata?: {
    provider?: ProviderType
    intent?: string
    confidence?: number
    tokens?: number
    latencyMs?: number
  }
}

/**
 * 会话合约（跨模块安全子集）
 */
export interface ConversationContract {
  id: string
  tenantId: string
  memberId?: string
  agentId?: string
  channel: ConversationChannel
  status: ConversationStatus
  title?: string
  lastMessage?: string
  messageCount: number
  lastActivityAt: string
  sentiment: Conversation['metadata']['sentiment']
  createdAt: string
  updatedAt: string
}

/**
 * 知识库合约（跨模块安全子集）
 */
export interface KnowledgeContract {
  id: string
  tenantId: string
  category: string
  title: string
  tags: string[]
  helpfulCount: number
  viewCount: number
  createdAt: string
}

/**
 * 意图合约（跨模块安全子集）
 */
export interface IntentContract {
  id: string
  tenantId: string
  name: string
  description: string
  keywords: string[]
  confidence: number
}

/**
 * 转人工工单合约（跨模块安全子集）
 */
export interface HandoffTicketContract {
  id: string
  tenantId: string
  conversationId: string
  reason: HandoffReason
  priority: HandoffTicket['priority']
  status: HandoffTicket['status']
  agentId?: string
  summary: string
  createdAt: string
  resolvedAt?: string
}

/**
 * 发送消息响应合约（跨模块安全子集）
 */
export interface SendMessageResponseContract {
  conversationId: string
  message: MessageContract
  intent?: IntentContract
  knowledgeMatched: Array<{ id: string; title: string }>
  handoffTriggered: boolean
  handoffTicketId?: string
  provider: ProviderType
  latencyMs: number
  confidence: number
  cached: boolean
}

/**
 * 会话统计合约（跨模块安全子集）
 */
export interface SessionStatsContract {
  activeSessions: number
  totalSessions: number
  averageMessagesPerSession: number
  handoffRate: number
  averageResponseTimeMs: number
}

/**
 * 客服健康合约（跨模块安全子集）
 */
export interface CsHealthContract {
  status: 'ok' | 'degraded' | 'down'
  providers: Array<{ name: ProviderType; available: boolean }>
  activeSessionCount: number
  queueLength: number
  timestamp: string
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toMessageContract(entity: Message): MessageContract {
  return {
    id: entity.id,
    conversationId: entity.conversationId,
    tenantId: entity.tenantId,
    role: entity.role,
    content: entity.content,
    timestamp: entity.timestamp,
    metadata: entity.metadata
      ? {
          provider: entity.metadata.provider,
          intent: entity.metadata.intent,
          confidence: entity.metadata.confidence,
          tokens: entity.metadata.tokens,
          latencyMs: entity.metadata.latencyMs,
        }
      : undefined,
  }
}

/** 实体 -> 合约映射 */
export function toConversationContract(entity: Conversation): ConversationContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    memberId: entity.memberId,
    agentId: entity.agentId,
    channel: entity.channel,
    status: entity.status,
    title: entity.title,
    lastMessage: entity.messages.length > 0
      ? entity.messages[entity.messages.length - 1].content.slice(0, 200)
      : undefined,
    messageCount: entity.messages.length,
    lastActivityAt: entity.metadata.lastActivityAt,
    sentiment: entity.metadata.sentiment,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toKnowledgeContract(entity: Knowledge): KnowledgeContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    category: entity.category,
    title: entity.title,
    tags: [...entity.tags],
    helpfulCount: entity.metadata.helpfulCount,
    viewCount: entity.metadata.viewCount,
    createdAt: entity.createdAt,
  }
}

/** 实体 -> 合约映射 */
export function toIntentContract(entity: Intent): IntentContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    name: entity.name,
    description: entity.description,
    keywords: [...entity.keywords],
    confidence: entity.confidence,
  }
}

/** 实体 -> 合约映射 */
export function toHandoffTicketContract(entity: HandoffTicket): HandoffTicketContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    conversationId: entity.conversationId,
    reason: entity.reason,
    priority: entity.priority,
    status: entity.status,
    agentId: entity.agentId,
    summary: entity.summary,
    createdAt: entity.createdAt,
    resolvedAt: entity.resolvedAt,
  }
}

/** 响应 -> 合约映射 */
export function toSendMessageResponseContract(
  entity: SendMessageResponse,
): SendMessageResponseContract {
  return {
    conversationId: entity.conversationId,
    message: toMessageContract(entity.message),
    intent: entity.intent ? toIntentContract(entity.intent) : undefined,
    knowledgeMatched: entity.knowledgeMatched.map((k) => ({
      id: k.id,
      title: k.title,
    })),
    handoffTriggered: entity.handoffTriggered,
    handoffTicketId: entity.handoffTicketId,
    provider: entity.provider,
    latencyMs: entity.latencyMs,
    confidence: entity.confidence,
    cached: entity.cached,
  }
}

/** 批量映射 */
export function toMessageContracts(entities: Message[]): MessageContract[] {
  return entities.map(toMessageContract)
}

/** 批量映射 */
export function toConversationContracts(entities: Conversation[]): ConversationContract[] {
  return entities.map(toConversationContract)
}

/** 批量映射 */
export function toKnowledgeContracts(entities: Knowledge[]): KnowledgeContract[] {
  return entities.map(toKnowledgeContract)
}

/** 批量映射 */
export function toHandoffTicketContracts(entities: HandoffTicket[]): HandoffTicketContract[] {
  return entities.map(toHandoffTicketContract)
}
