"use client"
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useEffect, useMemo, useState } from 'react'

import {
  buildAiReply,
  computeStats,
  filterConversations,
  mockKnowledge,
  type AiCsSnapshot,
  type Conversation,
  type ConversationStatus,
  type KnowledgeItem,
  type Message,
  type ProviderHealth,
} from './ai-cs-data'

const CARD: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
}

const MSG_USER: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 12,
  maxWidth: '70%',
  marginBottom: 8,
  marginLeft: 'auto',
}

const MSG_AI: React.CSSProperties = {
  background: '#f3f4f6',
  color: '#111',
  padding: '8px 12px',
  borderRadius: 12,
  maxWidth: '70%',
  marginBottom: 8,
}

const MSG_AGENT: React.CSSProperties = {
  background: '#10b981',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 12,
  maxWidth: '70%',
  marginBottom: 8,
}

const MSG_SYSTEM: React.CSSProperties = {
  background: '#fef3c7',
  color: '#92400e',
  padding: '8px 12px',
  borderRadius: 12,
  maxWidth: '70%',
  marginBottom: 8,
  fontStyle: 'italic',
}

const BTN_PRIMARY: React.CSSProperties = {
  padding: '10px 20px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
}

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
}

const STATUS_CONFIG: Record<ConversationStatus, { label: string; bg: string; color: string }> = {
  ACTIVE: { label: '活跃', bg: '#d1fae5', color: '#065f46' },
  PENDING: { label: '待接', bg: '#fef3c7', color: '#92400e' },
  HANDED_OFF: { label: '已转人工', bg: '#dbeafe', color: '#1e40af' },
  CLOSED: { label: '已关闭', bg: '#e5e7eb', color: '#374151' },
}

const CHANNEL_LABEL: Record<string, string> = {
  web: '网页',
  wechat: '微信',
  app: 'APP',
  phone: '电话',
}

function ProviderBadge({ provider }: { provider: ProviderHealth }) {
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 12,
        fontSize: 12,
        background: provider.available ? '#d1fae5' : '#fee2e2',
        color: provider.available ? '#065f46' : '#991b1b',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: provider.available ? '#22c55e' : '#ef4444',
          display: 'inline-block',
        }}
      />
      {provider.name}
      <span style={{ opacity: 0.6 }}>({provider.latencyMs}ms)</span>
    </span>
  )
}

function SummaryCard({ label, value, sub, bg, color }: { label: string; value: number | string; sub?: string; bg: string; color: string }) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '12px 16px', flex: 1 }}>
      <div style={{ fontSize: 12, color }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color, opacity: 0.7, marginTop: 2 }}>{sub}</div> : null}
    </div>
  )
}

function ConversationRow({ conversation, isActive, onClick }: { conversation: Conversation; isActive: boolean; onClick: () => void }) {
  const config = STATUS_CONFIG[conversation.status]

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: 12,
        marginBottom: 8,
        borderRadius: 6,
        border: isActive ? '2px solid #2563eb' : '1px solid #e5e7eb',
        cursor: 'pointer',
        background: isActive ? '#eff6ff' : '#fff',
        transition: 'border-color 0.15s',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{conversation.memberId || '匿名用户'}</span>
        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: config.bg, color: config.color }}>
          {config.label}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
        {CHANNEL_LABEL[conversation.channel] || conversation.channel} · {conversation.messages.length} 消息 · {conversation.metadata.lastActivityAt}
      </div>
    </button>
  )
}

export default function AiCsClient({ snapshot }: { snapshot: AiCsSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [conversations, setConversations] = useState(snapshot.conversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(snapshot.conversations[0]?.id ?? null)
  const [input, setInput] = useState('')
  const [knowledgeQuery, setKnowledgeQuery] = useState('')
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(snapshot.knowledge)
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 3

  useEffect(() => {
    setConversations(snapshot.conversations)
    setActiveConversationId(snapshot.conversations[0]?.id ?? null)
    setKnowledge(snapshot.knowledge)
  }, [snapshot])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, searchQuery])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  )
  const stats = useMemo(() => computeStats(conversations), [conversations])
  const filteredConversations = useMemo(
    () => filterConversations(conversations, statusFilter, searchQuery),
    [conversations, searchQuery, statusFilter]
  )
  const totalPages = Math.max(1, Math.ceil(filteredConversations.length / pageSize))
  const pagedConversations = filteredConversations.slice((page - 1) * pageSize, page * pageSize)

  const sendMessage = () => {
    if (!input.trim() || !activeConversation) {
      return
    }

    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      conversationId: activeConversation.id,
      role: 'user',
      content: input,
      timestamp,
    }
    const reply = buildAiReply(input)
    const assistantMessage: Message = {
      id: `assistant-${Date.now() + 1}`,
      conversationId: activeConversation.id,
      role: reply.role,
      content: reply.content,
      timestamp,
      metadata: reply.role === 'ai' ? { provider: 'openai', confidence: 0.82 } : undefined,
    }

    const nextConversation: Conversation = {
      ...activeConversation,
      status: reply.shouldHandoff ? 'HANDED_OFF' : activeConversation.status,
      messages: [...activeConversation.messages, userMessage, assistantMessage],
      metadata: {
        totalMessages: activeConversation.messages.length + 2,
        lastActivityAt: timestamp,
        handoffCount: activeConversation.metadata.handoffCount + (reply.shouldHandoff ? 1 : 0),
      },
    }

    setConversations((current) => current.map((conversation) => (conversation.id === nextConversation.id ? nextConversation : conversation)))
    setInput('')
  }

  const searchKnowledge = () => {
    setKnowledge(mockKnowledge(snapshot.tenantId, knowledgeQuery))
  }

  return (
    <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>智能客服工作台</h1>
          <div style={{ display: 'flex', gap: 16, color: '#6b7280', fontSize: 13, marginTop: 8, flexWrap: 'wrap' }}>
            <span>
              Tenant: <code style={{ background: '#e5e7eb', padding: '1px 6px', borderRadius: 3 }}>{snapshot.tenantId}</code>
            </span>
            <span>来源标签: {snapshot.sourceLabel}</span>
            <span>活跃: {stats.active}</span>
            <span>转人工: {stats.handedOff}</span>
            <span>知识库: {knowledge.length} 条</span>
          </div>
        </div>
        <button type="button" onClick={() => handleRefresh()} style={{ ...BTN_PRIMARY, opacity: isRefreshing ? 0.7 : 1 }} disabled={isRefreshing}>
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </header>

      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>AI Provider 健康度</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {snapshot.providers.map((provider) => (
            <ProviderBadge key={provider.name} provider={provider} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <SummaryCard label="活跃会话" value={stats.active} bg="#d1fae5" color="#065f46" />
        <SummaryCard label="待接会话" value={stats.pending} bg="#fef3c7" color="#92400e" />
        <SummaryCard label="转人工" value={stats.handedOff} bg="#dbeafe" color="#1e40af" />
        <SummaryCard label="总转接次数" value={stats.totalHandoffs} bg="#ede9fe" color="#5b21b6" sub={`${stats.total} 会话`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: 16 }}>
        <div style={CARD}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>会话列表</h3>
          <input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="搜索成员/ID/内容..." style={{ ...INPUT, marginBottom: 8, fontSize: 13 }} />

          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {(['ALL', 'ACTIVE', 'PENDING', 'HANDED_OFF', 'CLOSED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  cursor: 'pointer',
                  background: statusFilter === status ? '#2563eb' : '#e5e7eb',
                  color: statusFilter === status ? '#fff' : '#374151',
                  border: 'none',
                }}
              >
                {status === 'ALL' ? '全部' : STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>

          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>搜索无结果</div>
              <div style={{ fontSize: 14 }}>没有匹配的会话</div>
            </div>
          ) : (
            <>
              {pagedConversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  isActive={activeConversation?.id === conversation.id}
                  onClick={() => setActiveConversationId(conversation.id)}
                />
              ))}
              {totalPages > 1 ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12 }}>
                  <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, border: '1px solid #d1d5db', background: '#fff' }}>
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        border: '1px solid #d1d5db',
                        background: page === pageNumber ? '#2563eb' : '#fff',
                        color: page === pageNumber ? '#fff' : '#374151',
                      }}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div style={CARD}>
          {activeConversation ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>{activeConversation.memberId || '匿名用户'}</h3>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: STATUS_CONFIG[activeConversation.status].bg, color: STATUS_CONFIG[activeConversation.status].color }}>
                  {STATUS_CONFIG[activeConversation.status].label} · {activeConversation.metadata.totalMessages} 消息
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                {activeConversation.id} · {CHANNEL_LABEL[activeConversation.channel] || activeConversation.channel}
              </div>
              <div style={{ height: 400, overflowY: 'auto', padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 12 }}>
                {activeConversation.messages.map((message) => {
                  const style =
                    message.role === 'user'
                      ? MSG_USER
                      : message.role === 'ai'
                        ? MSG_AI
                        : message.role === 'human-agent'
                          ? MSG_AGENT
                          : MSG_SYSTEM
                  const roleLabel = { user: '用户', ai: 'AI', 'human-agent': '客服', system: '系统' }[message.role]
                  return (
                    <div key={message.id} style={{ display: 'flex', flexDirection: 'column', alignItems: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={style}>{message.content}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                        {roleLabel} · {message.timestamp}
                        {message.metadata?.provider ? ` · ${message.metadata.provider}` : ''}
                        {message.metadata?.confidence != null ? ` · conf=${message.metadata.confidence}` : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      sendMessage()
                    }
                  }}
                  placeholder="输入消息... (Enter 发送)"
                  style={{ flex: 1, padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                  maxLength={2000}
                />
                <button type="button" onClick={sendMessage} style={BTN_PRIMARY}>发送</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>暂无会话</div>
              <div>请选择一个会话</div>
            </div>
          )}
        </div>

        <div style={CARD}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>知识库</h3>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <input
              type="text"
              value={knowledgeQuery}
              onChange={(event) => setKnowledgeQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  searchKnowledge()
                }
              }}
              placeholder="搜索知识..."
              style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
            />
            <button type="button" onClick={searchKnowledge} style={{ padding: '8px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
              搜索
            </button>
          </div>

          {knowledge.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>无匹配知识</div>
              <div style={{ fontSize: 13 }}>未找到匹配知识</div>
            </div>
          ) : (
            knowledge.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 10,
                  marginBottom: 8,
                  background: '#f9fafb',
                  borderRadius: 6,
                  fontSize: 12,
                  borderLeft: '3px solid #10b981',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>{item.content}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, padding: '1px 5px', background: '#d1fae5', borderRadius: 3, color: '#065f46' }}>{item.category}</span>
                  {item.tags.map((tag) => (
                    <span key={tag} style={{ display: 'inline-block', padding: '1px 6px', background: '#e5e7eb', borderRadius: 3, fontSize: 10 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
