/**
 * Phase-41 T171: AI 智能客服实体
 */

export type MessageRole = 'user' | 'ai' | 'human-agent' | 'system'
export type ConversationStatus = 'ACTIVE' | 'PENDING' | 'HANDED_OFF' | 'CLOSED' | 'ARCHIVED'
export type ConversationChannel = 'web' | 'mobile' | 'wechat' | 'email' | 'phone'
export type ProviderType = 'openai' | 'deepseek' | 'mock' | 'fallback'
export type HandoffReason = 'low-confidence' | 'user-request' | 'complex-query' | 'sentiment-negative' | 'customer-unhappy'

export interface Message {
  id: string
  conversationId: string
  tenantId: string
  role: MessageRole
  content: string
  timestamp: string
  metadata?: {
    provider?: ProviderType
    intent?: string
    confidence?: number
    knowledgeIds?: string[]
    tokens?: number
    latencyMs?: number
  }
}

export interface Conversation {
  id: string
  tenantId: string
  memberId?: string
  agentId?: string
  channel: ConversationChannel
  status: ConversationStatus
  title?: string
  messages: Message[]
  context: string[]
  metadata: {
    totalMessages: number
    lastActivityAt: string
    firstResponseMs?: number
    avgResponseMs?: number
    fallbackCount: number
    handoffCount: number
    language: string
    sentiment: 'positive' | 'neutral' | 'negative'
  }
  createdAt: string
  updatedAt: string
}

export interface Knowledge {
  id: string
  tenantId: string
  category: string
  title: string
  content: string
  tags: string[]
  vector?: number[]
  metadata: {
    source?: string
    author?: string
    viewCount: number
    helpfulCount: number
    lastReviewedAt?: string
  }
  createdAt: string
  updatedAt: string
}

export interface Intent {
  id: string
  tenantId: string
  name: string
  description: string
  keywords: string[]
  confidence: number
  matchedKnowledgeIds: string[]
  fallbackMessage: string
  createdAt: string
}

export interface HandoffTicket {
  id: string
  tenantId: string
  conversationId: string
  reason: HandoffReason
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'queued' | 'assigned' | 'in-progress' | 'resolved' | 'abandoned'
  agentId?: string
  summary: string
  lastUserMessage: string
  context: Message[]
  createdAt: string
  assignedAt?: string
  resolvedAt?: string
  rating?: number
}

export interface SendMessageRequest {
  tenantId: string
  conversationId?: string
  memberId?: string
  channel: ConversationChannel
  content: string
  options?: {
    forceHandoff?: boolean
    preferredProvider?: ProviderType
    language?: string
    metadata?: Record<string, any>
  }
}

export interface SendMessageResponse {
  conversationId: string
  message: Message
  intent?: Intent
  knowledgeMatched: Knowledge[]
  handoffTriggered: boolean
  handoffTicketId?: string
  provider: ProviderType
  latencyMs: number
  confidence: number
  cached: boolean
}

export interface HandoffRequest {
  tenantId: string
  conversationId: string
  reason: HandoffReason
  agentId?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface HandoffResponse {
  ticket: HandoffTicket
  estimatedWaitMs: number
  queuePosition: number
}

export interface AIProviderRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  maxTokens?: number
  stop?: string[]
}

export interface AIProviderResponse {
  content: string
  confidence: number
  provider: ProviderType
  tokensUsed: number
  latencyMs: number
  cached: boolean
  finishReason: 'stop' | 'length' | 'error'
}

export interface AIProvider {
  readonly name: ProviderType
  readonly priority: number
  isAvailable(): Promise<boolean>
  complete(req: AIProviderRequest): Promise<AIProviderResponse>
}

export interface SessionContext {
  conversationId: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  lastActivityAt: number
}

export interface SessionCacheOptions {
  maxRounds: number
  maxSessions: number
  ttlMs: number
}