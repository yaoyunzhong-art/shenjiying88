'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ==================== 类型定义 ====================

/** 消息角色 */
export type ChatMessageRole = 'user' | 'agent' | 'system';

/** 消息状态 */
export type ChatMessageStatus = 'sending' | 'sent' | 'error';

/** 单条聊天消息 */
export interface ChatMessage {
  /** 消息 ID */
  id: string;
  /** 角色 */
  role: ChatMessageRole;
  /** 消息内容 */
  content: string;
  /** 时间戳 ISO */
  timestamp: string;
  /** 状态（仅 agent 消息） */
  status?: ChatMessageStatus;
  /** token 消耗 */
  tokenUsage?: number;
  /** 耗时(ms) */
  durationMs?: number;
}

/** AI Agent 聊天面板 Props */
export interface AIAgentChatPanelProps {
  /** 代理名称 */
  agentName: string;
  /** 代理头像 emoji */
  agentAvatar?: string;
  /** 初始消息列表 */
  initialMessages?: ChatMessage[];
  /** 发送消息回调 */
  onSend: (message: string) => Promise<string | void>;
  /** 面板标题 */
  title?: string;
  /** 欢迎消息 */
  welcomeMessage?: string;
  /** 输入占位符 */
  placeholder?: string;
  /** 是否加载中 */
  loading?: boolean;
  /** 最大消息数 */
  maxMessages?: number;
  /** 快捷建议列表 */
  suggestions?: string[];
  /** 空状态文本 */
  emptyText?: string;
  /** 是否禁用输入 */
  disabled?: boolean;
  /** 测试 id */
  'data-testid'?: string;
  /** 类名 */
  className?: string;
}

// ==================== 常量 ====================

const DEFAULT_AGENT_AVATAR = '🤖';
const DEFAULT_WELCOME = '您好！我是 AI 助手，有什么可以帮您的吗？';
const DEFAULT_PLACEHOLDER = '输入您的问题...';

// ==================== 工具函数 ====================

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// ==================== 子组件 ====================

function ChatBubble({ message, agentName, agentAvatar }: {
  message: ChatMessage;
  agentName: string;
  agentAvatar: string;
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const statusIndicator = (() => {
    if (isSystem) return null;
    if (message.status === 'sending') return <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>发送中...</span>;
    if (message.status === 'error') return <span style={{ fontSize: 11, color: '#f87171', marginLeft: 6 }}>发送失败</span>;
    return null;
  })();

  return (
    <div
      data-testid={`chat-message-${message.role}`}
      style={{
        display: 'flex',
        flexDirection: isUser || isSystem ? 'row-reverse' : 'row',
        gap: 10,
        marginBottom: 14,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          background: isUser ? '#3b82f6' : isSystem ? '#64748b' : '#1e293b',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {isUser ? '👤' : isSystem ? '⚙️' : agentAvatar}
      </div>

      <div style={{ maxWidth: '75%', minWidth: 0 }}>
        {!isUser && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, marginLeft: 2 }}>
            {isSystem ? '系统' : agentName}
          </div>
        )}

        <div
          style={{
            borderRadius: 14,
            padding: '10px 14px',
            background: isUser ? '#3b82f6' : isSystem ? '#334155' : '#1e293b',
            color: isUser ? '#fff' : '#e2e8f0',
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderBottomRightRadius: isUser ? 4 : 14,
            borderBottomLeftRadius: isUser ? 14 : 4,
          }}
        >
          {message.content}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 3,
            marginLeft: isUser ? 'auto' : 2,
            fontSize: 11,
            color: '#64748b',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <span>{formatTime(message.timestamp)}</span>
          {message.durationMs != null && (
            <span>{message.durationMs}ms</span>
          )}
          {message.tokenUsage != null && (
            <span>{message.tokenUsage} tokens</span>
          )}
          {statusIndicator}
        </div>
      </div>
    </div>
  );
}

function SuggestionChips({ suggestions, onSelect, disabled }: {
  suggestions: string[];
  onSelect: (s: string) => void;
  disabled: boolean;
}) {
  if (!suggestions.length) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        padding: '8px 0 4px',
      }}
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(s)}
          data-testid={`suggestion-${i}`}
          style={{
            border: '1px solid #334155',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 13,
            color: '#93c5fd',
            background: 'rgba(59,130,246,0.08)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ==================== 主组件 ====================

export function AIAgentChatPanel({
  agentName,
  agentAvatar = DEFAULT_AGENT_AVATAR,
  initialMessages = [],
  onSend,
  title = 'AI 助手',
  welcomeMessage = DEFAULT_WELCOME,
  placeholder = DEFAULT_PLACEHOLDER,
  loading = false,
  maxMessages = 100,
  suggestions = [],
  emptyText = '暂无对话记录',
  disabled = false,
  'data-testid': dataTestId = 'ai-agent-chat-panel',
  className,
}: AIAgentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessages.length > 0) return initialMessages;
    return [
      {
        id: generateId(),
        role: 'agent',
        content: welcomeMessage,
        timestamp: new Date().toISOString(),
        status: 'sent',
      },
    ];
  });

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // 自动调整输入框高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > maxMessages ? next.slice(next.length - maxMessages) : next;
    });
  }, [maxMessages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || disabled) return;

    setInput('');
    setSending(true);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    const agentMsgId = generateId();
    const agentMsg: ChatMessage = {
      id: agentMsgId,
      role: 'agent',
      content: '',
      timestamp: new Date().toISOString(),
      status: 'sending',
    };
    addMessage(agentMsg);

    const startTime = Date.now();

    try {
      const reply = await onSend(text);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId
            ? {
                ...m,
                content: reply || '暂无回复',
                status: 'sent',
                durationMs: Date.now() - startTime,
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId
            ? { ...m, content: '请求失败，请重试', status: 'error' }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }, [input, sending, disabled, addMessage, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleSuggestionClick = useCallback(
    (s: string) => {
      setInput(s);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [],
  );

  // ==================== 渲染 ====================

  return (
    <div
      data-testid={dataTestId}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 18,
        border: '1px solid #334155',
        background: '#0f172a',
        overflow: 'hidden',
        maxHeight: 600,
        minHeight: 360,
      }}
    >
      {/* 面板头部 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px',
          borderBottom: '1px solid #1e293b',
          background: '#1e293b',
        }}
      >
        <span style={{ fontSize: 20 }}>{agentAvatar}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {agentName}
            {loading && <span style={{ marginLeft: 6, color: '#fbbf24' }}>思考中...</span>}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {messages.length - 1} 条对话
        </span>
      </div>

      {/* 消息列表 */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: 14,
            }}
          >
            {emptyText}
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              agentName={agentName}
              agentAvatar={agentAvatar}
            />
          ))
        )}
      </div>

      {/* 快捷建议 */}
      {suggestions.length > 0 && (
        <div style={{ padding: '0 18px' }}>
          <SuggestionChips
            suggestions={suggestions}
            onSelect={handleSuggestionClick}
            disabled={sending || disabled}
          />
        </div>
      )}

      {/* 输入区域 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 18px 14px',
          borderTop: '1px solid #1e293b',
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={sending || disabled}
          rows={1}
          data-testid="chat-input"
          style={{
            flex: 1,
            borderRadius: 12,
            border: '1px solid #334155',
            padding: '10px 14px',
            fontSize: 14,
            lineHeight: 1.5,
            background: '#1e293b',
            color: '#e2e8f0',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            minHeight: 40,
            maxHeight: 120,
            opacity: sending || disabled ? 0.6 : 1,
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || disabled || !input.trim()}
          data-testid="send-button"
          style={{
            borderRadius: 12,
            border: 'none',
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: !input.trim() || sending || disabled ? '#334155' : '#3b82f6',
            cursor: !input.trim() || sending || disabled ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
            height: 40,
          }}
        >
          {sending ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
