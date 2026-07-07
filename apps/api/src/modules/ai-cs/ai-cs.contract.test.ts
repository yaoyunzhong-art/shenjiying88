import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [ai-cs] [D] contract spec 补全
 *
 * ai-cs 合约测试
 * 正例 + 反例 + 边界
 */
import {
  toMessageContract,
  toConversationContract,
  toKnowledgeContract,
  toIntentContract,
  toHandoffTicketContract,
  toSendMessageResponseContract,
  toMessageContracts,
  toConversationContracts,
  toKnowledgeContracts,
  toHandoffTicketContracts,
} from './ai-cs.contract'
import type {
  Message,
  Conversation,
  Knowledge,
  Intent,
  HandoffTicket,
  SendMessageResponse,
} from './ai-cs.entity'

// ─── Helper: 工厂函数 ────────────────────────────────

function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    tenantId: 'tenant-1',
    role: 'user',
    content: '你好，我想咨询会员等级',
    timestamp: '2026-06-28T04:00:00.000Z',
    metadata: {
      provider: 'deepseek',
      intent: 'member-level-query',
      confidence: 0.92,
      tokens: 128,
      latencyMs: 350,
    },
    ...overrides,
  }
}

function createMockConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conv-1',
    tenantId: 'tenant-1',
    memberId: 'member-1',
    agentId: undefined,
    channel: 'web',
    status: 'ACTIVE',
    title: '会员等级咨询',
    messages: [createMockMessage()],
    context: [],
    metadata: {
      totalMessages: 5,
      lastActivityAt: '2026-06-28T04:05:00.000Z',
      firstResponseMs: 1200,
      avgResponseMs: 850,
      fallbackCount: 0,
      handoffCount: 0,
      language: 'zh-CN',
      sentiment: 'positive',
    },
    createdAt: '2026-06-28T04:00:00.000Z',
    updatedAt: '2026-06-28T04:05:00.000Z',
    ...overrides,
  }
}

function createMockKnowledge(overrides: Partial<Knowledge> = {}): Knowledge {
  return {
    id: 'kb-1',
    tenantId: 'tenant-1',
    category: 'membership',
    title: '会员等级如何升级',
    content: '消费满1000元可升级到银卡会员...',
    tags: ['会员', '升级', '等级'],
    vector: [0.1, 0.2, 0.3],
    metadata: {
      source: 'manual',
      author: 'admin',
      viewCount: 42,
      helpfulCount: 38,
      lastReviewedAt: '2026-06-01T00:00:00.000Z',
    },
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  }
}

function createMockIntent(overrides: Partial<Intent> = {}): Intent {
  return {
    id: 'intent-1',
    tenantId: 'tenant-1',
    name: 'member_level_query',
    description: '用户查询会员等级信息',
    keywords: ['会员', '等级', '升级', '积分'],
    confidence: 0.95,
    matchedKnowledgeIds: ['kb-1'],
    fallbackMessage: '请问您想了解会员等级的哪些方面？',
    createdAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

function createMockHandoffTicket(overrides: Partial<HandoffTicket> = {}): HandoffTicket {
  return {
    id: 'ticket-1',
    tenantId: 'tenant-1',
    conversationId: 'conv-1',
    reason: 'complex-query',
    priority: 'high',
    status: 'assigned',
    agentId: 'agent-1',
    summary: '用户投诉退款流程过长',
    lastUserMessage: '我已经等了一个星期了！',
    context: [createMockMessage()],
    createdAt: '2026-06-28T04:10:00.000Z',
    assignedAt: '2026-06-28T04:12:00.000Z',
    resolvedAt: undefined,
    rating: undefined,
    ...overrides,
  }
}

function createMockSendMessageResponse(
  overrides: Partial<SendMessageResponse> = {},
): SendMessageResponse {
  return {
    conversationId: 'conv-1',
    message: createMockMessage({
      role: 'ai',
      content: '您好，我来帮您查询会员等级。',
      id: 'msg-2',
    }),
    intent: createMockIntent(),
    knowledgeMatched: [createMockKnowledge()],
    handoffTriggered: false,
    handoffTicketId: undefined,
    provider: 'deepseek',
    latencyMs: 420,
    confidence: 0.95,
    cached: false,
    ...overrides,
  }
}

// ─── 正例测试 ────────────────────────────────────────

describe('ai-cs Contract Mappers', () => {
  describe('toMessageContract', () => {
    it('应正确映射消息实体到合约', () => {
      const msg = createMockMessage()
      const contract = toMessageContract(msg)

      expect(contract.id).toBe('msg-1')
      expect(contract.role).toBe('user')
      expect(contract.content).toBe('你好，我想咨询会员等级')
      expect(contract.metadata?.provider).toBe('deepseek')
      expect(contract.metadata?.confidence).toBe(0.92)
      expect(contract.metadata?.tokens).toBe(128)
    })

    it('应处理无 metadata 的消息', () => {
      const msg = createMockMessage({ metadata: undefined })
      const contract = toMessageContract(msg)

      expect(contract.metadata).toBeUndefined()
      expect(contract.content).toBe('你好，我想咨询会员等级')
    })

    it('应处理空消息内容', () => {
      const msg = createMockMessage({ content: '' })
      const contract = toMessageContract(msg)

      expect(contract.content).toBe('')
      expect(contract.role).toBe('user')
    })
  })

  describe('toConversationContract', () => {
    it('应正确映射会话实体到合约', () => {
      const conv = createMockConversation()
      const contract = toConversationContract(conv)

      expect(contract.id).toBe('conv-1')
      expect(contract.channel).toBe('web')
      expect(contract.status).toBe('ACTIVE')
      expect(contract.memberId).toBe('member-1')
      expect(contract.messageCount).toBe(1)
      expect(contract.sentiment).toBe('positive')
    })

    it('应截取最后一条消息内容（超过200字符）', () => {
      const longContent = 'A'.repeat(500)
      const conv = createMockConversation({
        messages: [
          createMockMessage({ content: longContent, role: 'user' }),
        ],
      })
      const contract = toConversationContract(conv)

      expect(contract.lastMessage?.length).toBe(200)
      expect(contract.lastMessage).toBe('A'.repeat(200))
    })

    it('应处理无消息的会话', () => {
      const conv = createMockConversation({ messages: [] })
      const contract = toConversationContract(conv)

      expect(contract.lastMessage).toBeUndefined()
      expect(contract.messageCount).toBe(0)
    })

    it('应处理缺少字段的会话', () => {
      const conv = createMockConversation({ title: undefined, memberId: undefined })
      const contract = toConversationContract(conv)

      expect(contract.title).toBeUndefined()
      expect(contract.memberId).toBeUndefined()
    })
  })

  describe('toKnowledgeContract', () => {
    it('应正确映射知识条目到合约', () => {
      const kb = createMockKnowledge()
      const contract = toKnowledgeContract(kb)

      expect(contract.id).toBe('kb-1')
      expect(contract.category).toBe('membership')
      expect(contract.title).toBe('会员等级如何升级')
      expect(contract.helpfulCount).toBe(38)
      expect(contract.viewCount).toBe(42)
    })

    it('应省略 vector 字段', () => {
      const kb = createMockKnowledge()
      const contract = toKnowledgeContract(kb)

      expect(contract).not.toHaveProperty('vector')
    })

    it('应省略 content 字段', () => {
      const kb = createMockKnowledge()
      const contract = toKnowledgeContract(kb)

      expect(contract).not.toHaveProperty('content')
    })
  })

  describe('toIntentContract', () => {
    it('应正确映射意图实体到合约', () => {
      const intent = createMockIntent()
      const contract = toIntentContract(intent)

      expect(contract.id).toBe('intent-1')
      expect(contract.name).toBe('member_level_query')
      expect(contract.description).toBe('用户查询会员等级信息')
      expect(contract.keywords).toEqual(['会员', '等级', '升级', '积分'])
      expect(contract.confidence).toBe(0.95)
    })

    it('应返回关键词的副本而非引用', () => {
      const intent = createMockIntent()
      const contract = toIntentContract(intent)

      contract.keywords.push('新关键词')
      expect(intent.keywords).not.toContain('新关键词')
    })
  })

  describe('toHandoffTicketContract', () => {
    it('应正确映射转人工工单到合约', () => {
      const ticket = createMockHandoffTicket()
      const contract = toHandoffTicketContract(ticket)

      expect(contract.id).toBe('ticket-1')
      expect(contract.reason).toBe('complex-query')
      expect(contract.priority).toBe('high')
      expect(contract.status).toBe('assigned')
      expect(contract.agentId).toBe('agent-1')
      expect(contract.summary).toBe('用户投诉退款流程过长')
    })

    it('应处理未分配和未解决的工单', () => {
      const ticket = createMockHandoffTicket({
        agentId: undefined,
        assignedAt: undefined,
        resolvedAt: undefined,
      })
      const contract = toHandoffTicketContract(ticket)

      expect(contract.agentId).toBeUndefined()
      expect(contract.resolvedAt).toBeUndefined()
    })
  })

  describe('toSendMessageResponseContract', () => {
    it('应正确映射发送消息响应到合约', () => {
      const resp = createMockSendMessageResponse()
      const contract = toSendMessageResponseContract(resp)

      expect(contract.conversationId).toBe('conv-1')
      expect(contract.message.role).toBe('ai')
      expect(contract.intent?.name).toBe('member_level_query')
      expect(contract.knowledgeMatched).toHaveLength(1)
      expect(contract.knowledgeMatched[0].title).toBe('会员等级如何升级')
      expect(contract.handoffTriggered).toBe(false)
      expect(contract.provider).toBe('deepseek')
      expect(contract.confidence).toBe(0.95)
    })

    it('应处理触发转人工的响应', () => {
      const resp = createMockSendMessageResponse({
        handoffTriggered: true,
        handoffTicketId: 'ticket-2',
      })
      const contract = toSendMessageResponseContract(resp)

      expect(contract.handoffTriggered).toBe(true)
      expect(contract.handoffTicketId).toBe('ticket-2')
    })

    it('应处理无意图匹配的响应', () => {
      const resp = createMockSendMessageResponse({ intent: undefined })
      const contract = toSendMessageResponseContract(resp)

      expect(contract.intent).toBeUndefined()
    })

    it('应处理空知识匹配列表', () => {
      const resp = createMockSendMessageResponse({ knowledgeMatched: [] })
      const contract = toSendMessageResponseContract(resp)

      expect(contract.knowledgeMatched).toHaveLength(0)
    })
  })

  // ─── 批量映射 ───────────────────────────────────────

  describe('批量映射函数', () => {
    it('toMessageContracts 应处理空数组', () => {
      expect(toMessageContracts([])).toHaveLength(0)
    })

    it('toMessageContracts 应处理多个消息', () => {
      const msgs = [
        createMockMessage({ id: 'msg-1' }),
        createMockMessage({ id: 'msg-2', content: '第二条消息' }),
        createMockMessage({ id: 'msg-3', content: '第三条消息' }),
      ]
      const contracts = toMessageContracts(msgs)

      expect(contracts).toHaveLength(3)
      expect(contracts[0].id).toBe('msg-1')
      expect(contracts[2].content).toBe('第三条消息')
    })

    it('toConversationContracts 应处理空数组', () => {
      expect(toConversationContracts([])).toHaveLength(0)
    })

    it('toConversationContracts 应处理多个会话', () => {
      const convs = [
        createMockConversation({ id: 'conv-a' }),
        createMockConversation({ id: 'conv-b' }),
      ]
      const contracts = toConversationContracts(convs)

      expect(contracts).toHaveLength(2)
      expect(contracts[0].id).toBe('conv-a')
      expect(contracts[1].id).toBe('conv-b')
    })

    it('toKnowledgeContracts 应处理空数组', () => {
      expect(toKnowledgeContracts([])).toHaveLength(0)
    })

    it('toHandoffTicketContracts 应处理空数组', () => {
      expect(toHandoffTicketContracts([])).toHaveLength(0)
    })
  })

  // ─── 类型兼容性 ─────────────────────────────────────

  describe('类型兼容性', () => {
    it('MessageContract 不应包含 context/handoff fields', () => {
      const msg = createMockMessage()
      const contract = toMessageContract(msg)

      // @ts-expect-error - 合约不应包含完整实体字段
      expect(contract?.context).toBeUndefined()
    })

    it('ConversationContract 不应包含完整 messages 数组', () => {
      const conv = createMockConversation()
      const contract = toConversationContract(conv)

      // @ts-expect-error - 合约只暴露摘要信息
      expect(contract?.messages).toBeUndefined()
    })
  })
})
