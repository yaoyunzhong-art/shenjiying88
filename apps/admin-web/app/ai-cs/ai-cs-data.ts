export type MessageRole = 'user' | 'ai' | 'human-agent' | 'system'
export type ConversationStatus = 'ACTIVE' | 'PENDING' | 'HANDED_OFF' | 'CLOSED'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  timestamp: string
  metadata?: { provider?: string; confidence?: number }
}

export interface Conversation {
  id: string
  tenantId: string
  memberId?: string
  status: ConversationStatus
  messages: Message[]
  channel: string
  metadata: { totalMessages: number; lastActivityAt: string; handoffCount: number }
  createdAt: string
}

export interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}

export interface ProviderHealth {
  name: string
  priority: number
  available: boolean
  latencyMs: number
  failCount: number
}

export interface ConversationStats {
  total: number
  active: number
  pending: number
  handedOff: number
  closed: number
  avgMessagesPerConv: number
  totalHandoffs: number
}

export interface AiCsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'ai-cs-fallback-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  tenantId: string
  conversations: Conversation[]
  knowledge: KnowledgeItem[]
  providers: ProviderHealth[]
  stats: ConversationStats
}

const FALLBACK_GENERATED_AT = '2026-07-27T14:00:00Z'
export const INJECTION_KEYWORDS = ['忽略以上', 'ignore previous', 'DAN', 'pretend'] as const

export function detectInjection(input: string): boolean {
  return INJECTION_KEYWORDS.some((keyword) => input.toLowerCase().includes(keyword.toLowerCase()))
}

export function mockConversations(tenantId: string): Conversation[] {
  return [
    {
      id: 'conv-1',
      tenantId,
      memberId: 'm1',
      status: 'ACTIVE',
      channel: 'web',
      messages: [
        { id: 'm1', conversationId: 'conv-1', role: 'user', content: '订单什么时候发货?', timestamp: '14:00' },
        {
          id: 'm2',
          conversationId: 'conv-1',
          role: 'ai',
          content: '您的订单预计 24 小时内发货。',
          timestamp: '14:00',
          metadata: { provider: 'openai', confidence: 0.85 },
        },
      ],
      metadata: { totalMessages: 2, lastActivityAt: '14:00', handoffCount: 0 },
      createdAt: '14:00',
    },
    {
      id: 'conv-2',
      tenantId,
      memberId: 'm2',
      status: 'HANDED_OFF',
      channel: 'wechat',
      messages: [
        { id: 'm3', conversationId: 'conv-2', role: 'user', content: '我要投诉', timestamp: '13:30' },
        {
          id: 'm4',
          conversationId: 'conv-2',
          role: 'ai',
          content: '已为您转接人工客服',
          timestamp: '13:30',
          metadata: { provider: 'mock', confidence: 0.6 },
        },
        {
          id: 'm5',
          conversationId: 'conv-2',
          role: 'human-agent',
          content: '您好, 我是客服小张, 请问什么问题?',
          timestamp: '13:31',
        },
      ],
      metadata: { totalMessages: 3, lastActivityAt: '13:31', handoffCount: 1 },
      createdAt: '13:30',
    },
    {
      id: 'conv-3',
      tenantId,
      memberId: 'm3',
      status: 'ACTIVE',
      channel: 'app',
      messages: [
        { id: 'm6', conversationId: 'conv-3', role: 'user', content: '会员怎么升级?', timestamp: '12:15' },
        {
          id: 'm7',
          conversationId: 'conv-3',
          role: 'ai',
          content: '累计消费满 5000 元可升级为银卡会员。',
          timestamp: '12:16',
          metadata: { provider: 'deepseek', confidence: 0.91 },
        },
      ],
      metadata: { totalMessages: 2, lastActivityAt: '12:16', handoffCount: 0 },
      createdAt: '12:15',
    },
    {
      id: 'conv-4',
      tenantId,
      status: 'CLOSED',
      channel: 'web',
      messages: [
        { id: 'm8', conversationId: 'conv-4', role: 'user', content: '退款多久到账?', timestamp: '10:00' },
        {
          id: 'm9',
          conversationId: 'conv-4',
          role: 'ai',
          content: '退款 3 个工作日内到账。',
          timestamp: '10:00',
          metadata: { provider: 'openai', confidence: 0.88 },
        },
      ],
      metadata: { totalMessages: 2, lastActivityAt: '10:00', handoffCount: 0 },
      createdAt: '10:00',
    },
    {
      id: 'conv-5',
      tenantId,
      memberId: 'm4',
      status: 'PENDING',
      channel: 'phone',
      messages: [{ id: 'm10', conversationId: 'conv-5', role: 'user', content: '场地预约问题', timestamp: '09:30' }],
      metadata: { totalMessages: 1, lastActivityAt: '09:30', handoffCount: 0 },
      createdAt: '09:30',
    },
  ]
}

export function mockKnowledge(_tenantId: string, query: string): KnowledgeItem[] {
  return [
    { id: 'k1', title: '订单发货时效', content: '订单提交后 24 小时内发货, 节假日顺延。', category: 'policy', tags: ['订单', '发货'] },
    { id: 'k2', title: '退款流程', content: '在订单详情页提交退款申请, 3 个工作日内审核。', category: 'policy', tags: ['退款'] },
    { id: 'k3', title: '会员积分规则', content: '消费 1 元积 1 分, 年度清零。', category: 'member', tags: ['会员', '积分'] },
    { id: 'k4', title: '场地预约取消', content: '提前 2 小时可免费取消, 否则扣 50% 费用。', category: 'venue', tags: ['预约', '场地', '取消'] },
    { id: 'k5', title: '投诉处理流程', content: '投诉 24 小时内响应, 48 小时内出处理结果。', category: 'service', tags: ['投诉', '响应'] },
  ].filter(
    (item) =>
      !query.trim() ||
      item.title.includes(query) ||
      item.content.includes(query) ||
      item.tags.some((tag) => tag.includes(query))
  )
}

export function mockProviders(): ProviderHealth[] {
  return [
    { name: 'openai', priority: 1, available: true, latencyMs: 320, failCount: 0 },
    { name: 'deepseek', priority: 2, available: true, latencyMs: 280, failCount: 1 },
    { name: 'mock', priority: 99, available: true, latencyMs: 50, failCount: 0 },
  ]
}

export function computeStats(conversations: Conversation[]): ConversationStats {
  return {
    total: conversations.length,
    active: conversations.filter((conversation) => conversation.status === 'ACTIVE').length,
    pending: conversations.filter((conversation) => conversation.status === 'PENDING').length,
    handedOff: conversations.filter((conversation) => conversation.status === 'HANDED_OFF').length,
    closed: conversations.filter((conversation) => conversation.status === 'CLOSED').length,
    avgMessagesPerConv:
      conversations.length > 0
        ? Math.round(conversations.reduce((sum, conversation) => sum + conversation.messages.length, 0) / conversations.length)
        : 0,
    totalHandoffs: conversations.reduce((sum, conversation) => sum + conversation.metadata.handoffCount, 0),
  }
}

export function filterConversations(
  conversations: Conversation[],
  statusFilter: ConversationStatus | 'ALL',
  searchQuery: string
): Conversation[] {
  let result = conversations
  if (statusFilter !== 'ALL') {
    result = result.filter((conversation) => conversation.status === statusFilter)
  }
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    result = result.filter(
      (conversation) =>
        (conversation.memberId && conversation.memberId.toLowerCase().includes(query)) ||
        conversation.id.toLowerCase().includes(query) ||
        conversation.channel.toLowerCase().includes(query) ||
        conversation.messages.some((message) => message.content.toLowerCase().includes(query))
    )
  }
  return result
}

export function buildAiReply(input: string): { content: string; shouldHandoff: boolean; role: MessageRole } {
  if (detectInjection(input)) {
    return {
      content: '检测到 Prompt Injection 风险，已自动转人工复核。',
      shouldHandoff: true,
      role: 'system',
    }
  }

  return {
    content: `[Mock AI 回复] 已记录问题: ${input.slice(0, 30)}`,
    shouldHandoff: false,
    role: 'ai',
  }
}

export async function loadAiCsSnapshot(tenantId = 'demo-tenant'): Promise<AiCsSnapshot> {
  const conversations = mockConversations(tenantId)
  const providers = mockProviders()
  const knowledge = mockKnowledge(tenantId, '')

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'ai-cs-fallback-snapshot',
    generatedAt: FALLBACK_GENERATED_AT,
    controlPlaneSource: 'loadAiCsSnapshot -> mockConversations / mockProviders / mockKnowledge',
    businessDataSource: 'local AI CS workspace samples',
    refreshPath: 'AiCsPage -> loadAiCsSnapshot',
    note: '当前页面使用本地智能客服样本快照，已显式固化来源态与刷新路径，不可作为实时复签证据。',
    tenantId,
    conversations,
    knowledge,
    providers,
    stats: computeStats(conversations),
  }
}
