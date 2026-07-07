'use client'

/**
 * Phase-41 T171: 智能客服工作台 (admin-web)
 *
 * 功能:
 *  - 活跃会话列表 (多租户隔离)
 *  - 实时对话窗口 (AI 消息 + 用户消息 + 转人工)
 *  - 知识库检索面板
 *  - 工单队列
 *  - Provider 健康状态
 *
 * 反模式 v4 防御:
 *  - TenantGuard: 强制 tenantId 注入
 *  - Prompt Injection: 检测到自动标记 + 转人工
 *  - Provider 健康度: 实时显示
 */

import { useState, useEffect, useCallback } from 'react'

type MessageRole = 'user' | 'ai' | 'human-agent' | 'system'
type ConversationStatus = 'ACTIVE' | 'PENDING' | 'HANDED_OFF' | 'CLOSED'

interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  timestamp: string
  metadata?: { provider?: string; confidence?: number }
}

interface Conversation {
  id: string
  tenantId: string
  memberId?: string
  status: ConversationStatus
  messages: Message[]
  channel: string
  metadata: { totalMessages: number; lastActivityAt: string; handoffCount: number }
  createdAt: string
}

interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}

interface ProviderHealth {
  name: string
  priority: number
  available: boolean
}

const CARD_STYLE: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
  padding: 16, marginBottom: 16
}

const MSG_USER: React.CSSProperties = {
  background: '#2563eb', color: '#fff', padding: '8px 12px',
  borderRadius: 12, maxWidth: '70%', marginBottom: 8, marginLeft: 'auto'
}

const MSG_AI: React.CSSProperties = {
  background: '#f3f4f6', color: '#111', padding: '8px 12px',
  borderRadius: 12, maxWidth: '70%', marginBottom: 8
}

const MSG_AGENT: React.CSSProperties = {
  background: '#10b981', color: '#fff', padding: '8px 12px',
  borderRadius: 12, maxWidth: '70%', marginBottom: 8
}

const MSG_SYSTEM: React.CSSProperties = {
  background: '#fef3c7', color: '#92400e', padding: '8px 12px',
  borderRadius: 12, maxWidth: '70%', marginBottom: 8, fontStyle: 'italic'
}

function mockConversations(tenantId: string): Conversation[] {
  return [
    {
      id: 'conv-1', tenantId, memberId: 'm1', status: 'ACTIVE',
      channel: 'web', messages: [
        { id: 'm1', conversationId: 'conv-1', role: 'user', content: '订单什么时候发货?', timestamp: '14:00' },
        { id: 'm2', conversationId: 'conv-1', role: 'ai', content: '您的订单预计 24 小时内发货。', timestamp: '14:00', metadata: { provider: 'openai', confidence: 0.85 } }
      ],
      metadata: { totalMessages: 2, lastActivityAt: '14:00', handoffCount: 0 },
      createdAt: '14:00'
    },
    {
      id: 'conv-2', tenantId, memberId: 'm2', status: 'HANDED_OFF',
      channel: 'wechat', messages: [
        { id: 'm3', conversationId: 'conv-2', role: 'user', content: '我要投诉', timestamp: '13:30' },
        { id: 'm4', conversationId: 'conv-2', role: 'ai', content: '已为您转接人工客服', timestamp: '13:30', metadata: { provider: 'mock', confidence: 0.6 } },
        { id: 'm5', conversationId: 'conv-2', role: 'human-agent', content: '您好, 我是客服小张, 请问什么问题?', timestamp: '13:31' }
      ],
      metadata: { totalMessages: 3, lastActivityAt: '13:31', handoffCount: 1 },
      createdAt: '13:30'
    }
  ]
}

function mockKnowledge(tenantId: string, query: string): KnowledgeItem[] {
  return [
    { id: 'k1', title: '订单发货时效', content: '订单提交后 24 小时内发货, 节假日顺延。', category: 'policy', tags: ['订单', '发货'] },
    { id: 'k2', title: '退款流程', content: '在订单详情页提交退款申请, 3 个工作日内审核。', category: 'policy', tags: ['退款'] }
  ].filter(k => !query || k.title.includes(query) || k.tags.some(t => t.includes(query)))
}

function mockProviders(): ProviderHealth[] {
  return [
    { name: 'openai', priority: 1, available: true },
    { name: 'deepseek', priority: 2, available: true },
    { name: 'mock', priority: 99, available: true }
  ]
}

export default function AiCsPage() {
  const [tenantId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('tenantId') || 'demo-tenant'
    }
    return 'demo-tenant'
  })
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [input, setInput] = useState('')
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [knowledgeQuery, setKnowledgeQuery] = useState('')
  const [providers, setProviders] = useState<ProviderHealth[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 生产环境: const res = await fetch(`/api/ai-cs/sessions?tenantId=${tenantId}`)
      const convs = mockConversations(tenantId)
      setConversations(convs)
      if (convs.length > 0 && !activeConv) setActiveConv(convs[0] ?? null)
      setProviders(mockProviders())
      setKnowledge(mockKnowledge(tenantId, ''))
    } finally {
      setLoading(false)
    }
  }, [tenantId, activeConv])

  useEffect(() => { fetchData() }, [fetchData])

  const sendMessage = () => {
    if (!input.trim() || !activeConv) return
    // Prompt Injection 检测 (反模式 v4)
    const INJECTION_KEYWORDS = ['忽略以上', 'ignore previous', 'DAN', 'pretend']
    const isInjection = INJECTION_KEYWORDS.some(kw => input.toLowerCase().includes(kw.toLowerCase()))

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversationId: activeConv.id,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    }
    const aiMsg: Message = isInjection
      ? { id: `m-${Date.now() + 1}`, conversationId: activeConv.id, role: 'system', content: '⚠️ 检测到 Prompt Injection, 已转人工', timestamp: new Date().toLocaleTimeString().slice(0, 5) }
      : { id: `m-${Date.now() + 1}`, conversationId: activeConv.id, role: 'ai', content: `[Mock AI 回复] 您的问题是: ${input.slice(0, 30)}`, timestamp: new Date().toLocaleTimeString().slice(0, 5), metadata: { provider: 'openai', confidence: 0.82 } }

    const updated: Conversation = {
      ...activeConv,
      messages: [...activeConv.messages, newMsg, aiMsg],
      status: isInjection ? 'HANDED_OFF' : activeConv.status,
      metadata: { ...activeConv.metadata, totalMessages: activeConv.messages.length + 2, handoffCount: activeConv.metadata.handoffCount + (isInjection ? 1 : 0) }
    }
    setActiveConv(updated)
    setConversations(conversations.map(c => c.id === updated.id ? updated : c))
    setInput('')
  }

  const searchKnowledge = () => {
    setKnowledge(mockKnowledge(tenantId, knowledgeQuery))
  }

  if (loading) return <div style={CARD_STYLE}>⏳ 加载智能客服工作台...</div>

  return (
    <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🤖 智能客服工作台</h1>
        <div style={{ display: 'flex', gap: 16, color: '#6b7280', fontSize: 13, marginTop: 8 }}>
          <span>🏢 Tenant: <code>{tenantId}</code></span>
          <span>📊 活跃会话: {conversations.filter(c => c.status === 'ACTIVE').length}</span>
          <span>🤝 转人工: {conversations.filter(c => c.status === 'HANDED_OFF').length}</span>
          <span>📚 知识库: {knowledge.length} 条</span>
        </div>
        {/* Provider 健康度 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {providers.map(p => (
            <span key={p.name} style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 12,
              background: p.available ? '#d1fae5' : '#fee2e2',
              color: p.available ? '#065f46' : '#991b1b'
            }}>
              {p.available ? '🟢' : '🔴'} {p.name} (p={p.priority})
            </span>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 16 }}>
        {/* 左: 会话列表 */}
        <div style={CARD_STYLE}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📋 会话列表</h3>
          {conversations.map(c => (
            <div key={c.id} onClick={() => setActiveConv(c)}
              style={{
                padding: 12, marginBottom: 8, borderRadius: 6,
                border: '1px solid #e5e7eb', cursor: 'pointer',
                background: activeConv?.id === c.id ? '#eff6ff' : '#fff'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{c.id}</span>
                <span style={{
                  fontSize: 11, padding: '2px 6px', borderRadius: 4,
                  background: c.status === 'ACTIVE' ? '#d1fae5' : c.status === 'HANDED_OFF' ? '#fef3c7' : '#e5e7eb',
                  color: c.status === 'ACTIVE' ? '#065f46' : c.status === 'HANDED_OFF' ? '#92400e' : '#374151'
                }}>{c.status}</span>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                {c.memberId || '匿名'} · {c.channel} · {c.metadata.totalMessages} 消息
              </div>
            </div>
          ))}
        </div>

        {/* 中: 对话窗口 */}
        <div style={CARD_STYLE}>
          {activeConv ? (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                💬 会话 {activeConv.id}
                <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280', fontWeight: 'normal' }}>
                  {activeConv.status} · {activeConv.metadata.totalMessages} 消息
                </span>
              </h3>
              <div style={{ height: 400, overflowY: 'auto', padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 12 }}>
                {activeConv.messages.map(m => {
                  const style = m.role === 'user' ? MSG_USER : m.role === 'ai' ? MSG_AI : m.role === 'human-agent' ? MSG_AGENT : MSG_SYSTEM
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={style}>{m.content}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                        {m.role} · {m.timestamp} {m.metadata?.provider && `· ${m.metadata.provider}`} {m.metadata?.confidence && `· conf=${m.metadata.confidence}`}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="输入消息... (Enter 发送)"
                  style={{ flex: 1, padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                  maxLength={2000}
                />
                <button onClick={sendMessage} style={{
                  padding: '10px 20px', background: '#2563eb', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer'
                }}>发送</button>
              </div>
            </>
          ) : (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 60 }}>请选择一个会话</div>
          )}
        </div>

        {/* 右: 知识库 */}
        <div style={CARD_STYLE}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📚 知识库</h3>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <input
              type="text" value={knowledgeQuery} onChange={e => setKnowledgeQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchKnowledge()}
              placeholder="搜索知识..."
              style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
            />
            <button onClick={searchKnowledge} style={{
              padding: '8px 12px', background: '#10b981', color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer'
            }}>搜索</button>
          </div>
          {knowledge.map(k => (
            <div key={k.id} style={{
              padding: 10, marginBottom: 8, background: '#f9fafb',
              borderRadius: 6, fontSize: 12, borderLeft: '3px solid #10b981'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{k.title}</div>
              <div style={{ color: '#6b7280' }}>{k.content}</div>
              <div style={{ marginTop: 4 }}>
                {k.tags.map(t => (
                  <span key={t} style={{
                    display: 'inline-block', padding: '1px 6px',
                    background: '#e5e7eb', borderRadius: 3, fontSize: 10, marginRight: 4
                  }}>#{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ marginTop: 24, fontSize: 12, color: '#9ca3af' }}>
        <p>📌 4 Provider: OpenAI · DeepSeek · Mock · Fallback</p>
        <p>📌 反模式 v4: ai-provider-fallback + prompt-injection (5+4 反模式防御)</p>
        <p>📌 KPI: 首次响应 &lt; 2s · 转人工阈值 conf &lt; 0.7 · Provider 限流 60 req/min</p>
      </footer>
    </div>
  )
}