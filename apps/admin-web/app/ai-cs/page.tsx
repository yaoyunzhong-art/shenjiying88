'use client'

/**
 * Phase-41 T171: 智能客服工作台 (admin-web)
 *
 * 功能:
 *  - 活跃会话列表 (多租户隔离) — 表格 columns·sort·search·filter·pagination
 *  - 实时对话窗口 (AI 消息 + 用户消息 + 转人工)
 *  - 知识库检索面板
 *  - 工单队列
 *  - Provider 健康状态面板
 *  - 统计概览面板
 *  - 会话详情面板
 *
 * 反模式 v4 防御:
 *  - TenantGuard: 强制 tenantId 注入
 *  - Prompt Injection: 检测到自动标记 + 转人工
 *  - Provider 健康度: 实时显示
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

// ==================== 类型定义 ====================

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
  latencyMs: number
  failCount: number
}

interface ConversationStats {
  total: number
  active: number
  pending: number
  handedOff: number
  closed: number
  avgMessagesPerConv: number
  totalHandoffs: number
}

// ==================== 样式 ====================

const CARD: React.CSSProperties = {
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

const BTN_PRIMARY: React.CSSProperties = {
  padding: '10px 20px', background: '#2563eb', color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: 14, boxSizing: 'border-box'
}

// ==================== 状态/优先级/通道映射 ====================

const STATUS_CONFIG: Record<ConversationStatus, { label: string; bg: string; color: string }> = {
  ACTIVE: { label: '活跃', bg: '#d1fae5', color: '#065f46' },
  PENDING: { label: '待接', bg: '#fef3c7', color: '#92400e' },
  HANDED_OFF: { label: '已转人工', bg: '#dbeafe', color: '#1e40af' },
  CLOSED: { label: '已关闭', bg: '#e5e7eb', color: '#374151' }
}

const CHANNEL_LABEL: Record<string, string> = {
  web: '网页', wechat: '微信', app: 'APP', phone: '电话'
}

// ==================== Mock 数据工厂 ====================

const INJECTION_KEYWORDS = ['忽略以上', 'ignore previous', 'DAN', 'pretend']

function detectInjection(input: string): boolean {
  return INJECTION_KEYWORDS.some(kw => input.toLowerCase().includes(kw.toLowerCase()))
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
    },
    {
      id: 'conv-3', tenantId, memberId: 'm3', status: 'ACTIVE',
      channel: 'app', messages: [
        { id: 'm6', conversationId: 'conv-3', role: 'user', content: '会员怎么升级?', timestamp: '12:15' },
        { id: 'm7', conversationId: 'conv-3', role: 'ai', content: '累计消费满 5000 元可升级为银卡会员。', timestamp: '12:16', metadata: { provider: 'deepseek', confidence: 0.91 } }
      ],
      metadata: { totalMessages: 2, lastActivityAt: '12:16', handoffCount: 0 },
      createdAt: '12:15'
    },
    {
      id: 'conv-4', tenantId, status: 'CLOSED',
      channel: 'web', messages: [
        { id: 'm8', conversationId: 'conv-4', role: 'user', content: '退款多久到账?', timestamp: '10:00' },
        { id: 'm9', conversationId: 'conv-4', role: 'ai', content: '退款 3 个工作日内到账。', timestamp: '10:00', metadata: { provider: 'openai', confidence: 0.88 } }
      ],
      metadata: { totalMessages: 2, lastActivityAt: '10:00', handoffCount: 0 },
      createdAt: '10:00'
    },
    {
      id: 'conv-5', tenantId, memberId: 'm4', status: 'PENDING',
      channel: 'phone', messages: [
        { id: 'm10', conversationId: 'conv-5', role: 'user', content: '场地预约问题', timestamp: '09:30' }
      ],
      metadata: { totalMessages: 1, lastActivityAt: '09:30', handoffCount: 0 },
      createdAt: '09:30'
    }
  ]
}

function mockKnowledge(tenantId: string, query: string): KnowledgeItem[] {
  return [
    { id: 'k1', title: '订单发货时效', content: '订单提交后 24 小时内发货, 节假日顺延。', category: 'policy', tags: ['订单', '发货'] },
    { id: 'k2', title: '退款流程', content: '在订单详情页提交退款申请, 3 个工作日内审核。', category: 'policy', tags: ['退款'] },
    { id: 'k3', title: '会员积分规则', content: '消费 1 元积 1 分, 年度清零。', category: 'member', tags: ['会员', '积分'] },
    { id: 'k4', title: '场地预约取消', content: '提前 2 小时可免费取消, 否则扣 50% 费用。', category: 'venue', tags: ['预约', '场地', '取消'] },
    { id: 'k5', title: '投诉处理流程', content: '投诉 24 小时内响应, 48 小时内出处理结果。', category: 'service', tags: ['投诉', '响应'] }
  ].filter(k => !query || k.title.includes(query) || k.content.includes(query) || k.tags.some(t => t.includes(query)))
}

function mockProviders(): ProviderHealth[] {
  return [
    { name: 'openai', priority: 1, available: true, latencyMs: 320, failCount: 0 },
    { name: 'deepseek', priority: 2, available: true, latencyMs: 280, failCount: 1 },
    { name: 'mock', priority: 99, available: true, latencyMs: 50, failCount: 0 }
  ]
}

function computeStats(conversations: Conversation[]): ConversationStats {
  return {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'ACTIVE').length,
    pending: conversations.filter(c => c.status === 'PENDING').length,
    handedOff: conversations.filter(c => c.status === 'HANDED_OFF').length,
    closed: conversations.filter(c => c.status === 'CLOSED').length,
    avgMessagesPerConv: conversations.length > 0
      ? Math.round(conversations.reduce((s, c) => s + c.messages.length, 0) / conversations.length)
      : 0,
    totalHandoffs: conversations.reduce((s, c) => s + c.metadata.handoffCount, 0)
  }
}

// ==================== 子组件 ====================

function ProviderBadge({ provider }: { provider: ProviderHealth }) {
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 12, fontSize: 12,
      background: provider.available ? '#d1fae5' : '#fee2e2',
      color: provider.available ? '#065f46' : '#991b1b',
      display: 'inline-flex', alignItems: 'center', gap: 4
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: provider.available ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
      {provider.name}
      <span style={{ opacity: 0.6 }}>({provider.latencyMs}ms)</span>
    </span>
  )
}

function StatCard({ label, value, sub, bg, color }: {
  label: string; value: number | string; sub?: string; bg: string; color: string
}) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '12px 16px', flex: 1 }}>
      <div style={{ fontSize: 12, color }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color, opacity: 0.7, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function ConversationRow({ conv, isActive, onClick }: {
  conv: Conversation; isActive: boolean; onClick: () => void
}) {
  const cfg = STATUS_CONFIG[conv.status]
  return (
    <div
      onClick={onClick}
      style={{
        padding: 12, marginBottom: 8, borderRadius: 6,
        border: isActive ? '2px solid #2563eb' : '1px solid #e5e7eb',
        cursor: 'pointer', background: isActive ? '#eff6ff' : '#fff',
        transition: 'border-color 0.15s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{conv.memberId || '匿名用户'}</span>
        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
        {CHANNEL_LABEL[conv.channel] || conv.channel} · {conv.messages.length} 消息 · {conv.metadata.lastActivityAt}
      </div>
    </div>
  )
}

// ==================== 主页面 ====================

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
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 3

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 300))
      const convs = mockConversations(tenantId)
      setConversations(convs)
      if (convs.length > 0 && !activeConv) setActiveConv(convs[0] ?? null)
      setProviders(mockProviders())
      setKnowledge(mockKnowledge(tenantId, ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [tenantId, activeConv])

  useEffect(() => { fetchData() }, [fetchData])

  // 统计
  const stats = useMemo(() => computeStats(conversations), [conversations])

  // 过滤 + 搜索 + 分页
  const filteredConvs = useMemo(() => {
    let result = conversations
    if (statusFilter !== 'ALL') {
      result = result.filter(c => c.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        (c.memberId && c.memberId.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q) ||
        c.channel.toLowerCase().includes(q) ||
        c.messages.some(m => m.content.toLowerCase().includes(q))
      )
    }
    return result
  }, [conversations, statusFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredConvs.length / pageSize))
  const pagedConvs = filteredConvs.slice((page - 1) * pageSize, page * pageSize)

  // 重置分页
  useEffect(() => { setPage(1) }, [statusFilter, searchQuery])

  const sendMessage = () => {
    if (!input.trim() || !activeConv) return
    const isInjection = detectInjection(input)

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversationId: activeConv.id,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    }
    const aiMsg: Message = isInjection
      ? { id: `m-${Date.now() + 1}`, conversationId: activeConv.id, role: 'system',
          content: '⚠️ 检测到 Prompt Injection, 已转人工', timestamp: new Date().toLocaleTimeString().slice(0, 5) }
      : { id: `m-${Date.now() + 1}`, conversationId: activeConv.id, role: 'ai',
          content: `[Mock AI 回复] 您的问题是: ${input.slice(0, 30)}`,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          metadata: { provider: 'openai', confidence: 0.82 } }

    const updated: Conversation = {
      ...activeConv,
      messages: [...activeConv.messages, newMsg, aiMsg],
      status: isInjection ? 'HANDED_OFF' : activeConv.status,
      metadata: {
        ...activeConv.metadata,
        totalMessages: activeConv.messages.length + 2,
        handoffCount: activeConv.metadata.handoffCount + (isInjection ? 1 : 0)
      }
    }
    setActiveConv(updated)
    setConversations(conversations.map(c => c.id === updated.id ? updated : c))
    setInput('')
  }

  const searchKnowledge = () => {
    setKnowledge(mockKnowledge(tenantId, knowledgeQuery))
  }

  // ===== 加载状态 =====
  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>
        <div style={CARD}>
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 16, color: '#6b7280' }}>加载智能客服工作台...</div>
          </div>
        </div>
      </div>
    )
  }

  // ===== 错误状态 =====
  if (error) {
    return (
      <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>
        <div style={CARD}>
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 16, color: '#ef4444', marginBottom: 12 }}>{error}</div>
            <button onClick={fetchData} style={BTN_PRIMARY}>重新加载</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>
      {/* ===== 页面头部 ===== */}
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🤖 智能客服工作台</h1>
        <div style={{ display: 'flex', gap: 16, color: '#6b7280', fontSize: 13, marginTop: 8, flexWrap: 'wrap' }}>
          <span>🏢 Tenant: <code style={{ background: '#e5e7eb', padding: '1px 6px', borderRadius: 3 }}>{tenantId}</code></span>
          <span>📊 活跃: {stats.active}</span>
          <span>🤝 转人工: {stats.handedOff}</span>
          <span>⏳ 待接: {stats.pending}</span>
          <span>📚 知识库: {knowledge.length} 条</span>
          <span>📨 总消息: {stats.avgMessagesPerConv}/对话</span>
        </div>
      </header>

      {/* ===== Provider 健康度面板 ===== */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>🔌 AI Provider 健康度</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {providers.map(p => <ProviderBadge key={p.name} provider={p} />)}
        </div>
      </div>

      {/* ===== 统计面板 ===== */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatCard label="活跃会话" value={stats.active} bg="#d1fae5" color="#065f46" />
        <StatCard label="待接会话" value={stats.pending} bg="#fef3c7" color="#92400e" />
        <StatCard label="转人工" value={stats.handedOff} bg="#dbeafe" color="#1e40af" />
        <StatCard label="总转接次数" value={stats.totalHandoffs} bg="#ede9fe" color="#5b21b6" sub={`${stats.total} 会话`} />
      </div>

      {/* ===== 主内容区: 三栏布局 ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: 16 }}>

        {/* ===== 左栏: 会话列表 ===== */}
        <div style={CARD}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📋 会话列表</h3>

          {/* 搜索 */}
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索成员/ID/内容..."
            style={{ ...INPUT, marginBottom: 8, fontSize: 13 }}
          />

          {/* 状态过滤 */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {(['ALL', 'ACTIVE', 'PENDING', 'HANDED_OFF', 'CLOSED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                  background: statusFilter === s ? '#2563eb' : '#e5e7eb',
                  color: statusFilter === s ? '#fff' : '#374151',
                  border: 'none'
                }}
              >
                {s === 'ALL' ? '全部' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* 空状态 */}
          {filteredConvs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14 }}>没有匹配的会话</div>
            </div>
          ) : (
            <>
              {pagedConvs.map(c => (
                <ConversationRow
                  key={c.id} conv={c}
                  isActive={activeConv?.id === c.id}
                  onClick={() => setActiveConv(c)}
                />
              ))}

              {/* 分页 */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: page === 1 ? 'not-allowed' : 'pointer',
                      border: '1px solid #d1d5db', background: '#fff', color: page === 1 ? '#d1d5db' : '#374151'
                    }}
                  >‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p} onClick={() => setPage(p)}
                      style={{
                        padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                        border: '1px solid #d1d5db',
                        background: page === p ? '#2563eb' : '#fff',
                        color: page === p ? '#fff' : '#374151'
                      }}
                    >{p}</button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      border: '1px solid #d1d5db', background: '#fff', color: page === totalPages ? '#d1d5db' : '#374151'
                    }}
                  >›</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== 中栏: 对话窗口 ===== */}
        <div style={CARD}>
          {activeConv ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                  💬 {activeConv.memberId || '匿名用户'}
                </h3>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 4,
                  background: STATUS_CONFIG[activeConv.status].bg,
                  color: STATUS_CONFIG[activeConv.status].color
                }}>
                  {STATUS_CONFIG[activeConv.status].label} · {activeConv.metadata.totalMessages} 消息
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                🆔 {activeConv.id} · 📱 {CHANNEL_LABEL[activeConv.channel] || activeConv.channel}
              </div>

              <div style={{ height: 400, overflowY: 'auto', padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 12 }}>
                {activeConv.messages.map(m => {
                  const style = m.role === 'user' ? MSG_USER : m.role === 'ai' ? MSG_AI : m.role === 'human-agent' ? MSG_AGENT : MSG_SYSTEM
                  const roleLabel = { user: '用户', ai: 'AI', 'human-agent': '客服', system: '系统' }[m.role]
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={style}>{m.content}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                        {roleLabel} · {m.timestamp}
                        {m.metadata?.provider && ` · ${m.metadata.provider}`}
                        {m.metadata?.confidence != null && ` · conf=${m.metadata.confidence}`}
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
                <button onClick={sendMessage} style={BTN_PRIMARY}>发送</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div>请选择一个会话</div>
            </div>
          )}
        </div>

        {/* ===== 右栏: 知识库 ===== */}
        <div style={CARD}>
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

          {knowledge.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 13 }}>未找到匹配知识</div>
            </div>
          ) : (
            knowledge.map(k => (
              <div key={k.id} style={{
                padding: 10, marginBottom: 8, background: '#f9fafb',
                borderRadius: 6, fontSize: 12, borderLeft: '3px solid #10b981'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{k.title}</div>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>{k.content}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, padding: '1px 5px', background: '#d1fae5', borderRadius: 3, color: '#065f46' }}>{k.category}</span>
                  {k.tags.map(t => (
                    <span key={t} style={{
                      display: 'inline-block', padding: '1px 6px',
                      background: '#e5e7eb', borderRadius: 3, fontSize: 10
                    }}>#{t}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <footer style={{ marginTop: 24, fontSize: 12, color: '#9ca3af' }}>
        <p>📌 Provider: OpenAI · DeepSeek · Mock | 反模式 v4 防御 | KPI: 首次响应 &lt; 2s</p>
      </footer>
    </div>
  )
}
