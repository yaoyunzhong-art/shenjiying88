'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@m5/ui';
import type {
  AgentConfig,
  AgentExecution,
  AgentMessage,
  AgentSession,
  AgentSessionEvent,
  AgentSessionStatus,
  QualityEvaluation
} from '@m5/types';
import { runAgentSessionStream } from '../../agent-view-model';

interface AgentSessionDetailClientProps {
  session: AgentSession;
  execution: AgentExecution | null;
  evaluation: QualityEvaluation | null;
  config: AgentConfig | null;
  deliveryMode: 'api' | 'fallback';
  error?: string;
}

const STATUS_LABEL: Record<AgentSessionStatus, string> = {
  PENDING: '等待中',
  RUNNING: '运行中',
  COMPLETED: '已完成',
  FAILED: '失败',
  CANCELLED: '已取消'
};

const STATUS_VARIANT: Record<
  AgentSessionStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  PENDING: 'info',
  RUNNING: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral'
};

const ROLE_META: Record<AgentMessage['role'], { label: string; color: string; emoji: string }> = {
  system: { label: 'System', color: '#60a5fa', emoji: '⚙️' },
  user: { label: 'User', color: '#34d399', emoji: '👤' },
  assistant: { label: 'Assistant', color: '#a78bfa', emoji: '🤖' },
  tool: { label: 'Tool', color: '#fbbf24', emoji: '🔧' }
};

const EVAL_DIMENSIONS = [
  { key: 'relevanceScore' as const, label: '相关性', color: '#60a5fa' },
  { key: 'accuracyScore' as const, label: '准确性', color: '#34d399' },
  { key: 'completenessScore' as const, label: '完整性', color: '#a78bfa' },
  { key: 'safetyScore' as const, label: '安全性', color: '#fbbf24' },
  { key: 'helpfulnessScore' as const, label: '有用性', color: '#f472b6' },
  { key: 'concisenessScore' as const, label: '简洁性', color: '#22d3ee' }
];

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  return iso.slice(11, 19);
}

function fmtDuration(ms?: number): string {
  if (!ms && ms !== 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

interface MessageBubbleProps {
  message: AgentMessage;
  index: number;
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const meta = ROLE_META[message.role];
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 10,
        background: 'rgba(15, 23, 42, 0.5)',
        border: `1px solid ${meta.color}33`,
        borderLeft: `3px solid ${meta.color}`
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: `${meta.color}22`,
          border: `1px solid ${meta.color}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          flexShrink: 0
        }}
      >
        {meta.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
              #{index + 1}
            </span>
            {message.toolCallId ? (
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#fbbf24',
                  fontFamily: 'monospace'
                }}
              >
                toolCallId: {message.toolCallId}
              </span>
            ) : null}
          </div>
          <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
            {fmtTime(message.timestamp)}
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#e2e8f0',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {message.content}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 ? (
          <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            {message.toolCalls.map((tc) => (
              <div
                key={tc.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(167, 139, 250, 0.1)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  fontSize: 11,
                  fontFamily: 'monospace'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#a78bfa' }}>🔧 {tc.name}</span>
                  <span style={{ color: '#64748b' }}>{tc.durationMs ?? 0}ms · {tc.status}</span>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  input: {JSON.stringify(tc.input)}
                </div>
                {tc.output !== undefined ? (
                  <div style={{ color: '#cbd5e1', marginTop: 2 }}>
                    output: {String(typeof tc.output === 'string' ? tc.output : JSON.stringify(tc.output))}
                  </div>
                ) : null}
                {tc.error ? (
                  <div style={{ color: '#f87171', marginTop: 2 }}>error: {tc.error}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface EvaluationCardProps {
  evaluation: QualityEvaluation;
}

function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const passed = evaluation.overallScore >= 0.7;
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(96, 165, 250, 0.2)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
          ⭐ 质量评估
        </div>
        <StatusBadge
          label={passed ? `通过 (${(evaluation.overallScore * 100).toFixed(0)}%)` : `未通过 (${(evaluation.overallScore * 100).toFixed(0)}%)`}
          variant={passed ? 'success' : 'danger'}
          size="sm"
          dot
        />
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: passed ? '#34d399' : '#f87171',
          marginBottom: 4,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {(evaluation.overallScore * 100).toFixed(1)}
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>
        综合分 · 评估人 {evaluation.evaluatedBy} · {fmtTime(evaluation.evaluatedAt)}
      </div>
      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        {EVAL_DIMENSIONS.map((dim) => {
          const value = evaluation[dim.key];
          return (
            <div key={dim.key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: '#94a3b8',
                  marginBottom: 3
                }}
              >
                <span>{dim.label}</span>
                <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${value * 100}%`,
                    height: '100%',
                    background: dim.color,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {evaluation.feedback ? (
        <div
          style={{
            padding: 10,
            borderRadius: 6,
            background: 'rgba(96, 165, 250, 0.08)',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            fontSize: 12,
            color: '#cbd5e1',
            lineHeight: 1.5
          }}
        >
          💬 {evaluation.feedback}
        </div>
      ) : null}
    </div>
  );
}

interface ExecutionCardProps {
  execution: AgentExecution | null;
  sessionMaxSteps: number;
}

function ExecutionCard({ execution, sessionMaxSteps }: ExecutionCardProps) {
  if (!execution) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 10,
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(100, 116, 139, 0.3)',
          color: '#64748b',
          fontSize: 12,
          textAlign: 'center'
        }}
      >
        ⏳ 等待执行记录生成
      </div>
    );
  }
  const execVariant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' =
    execution.status === 'SUCCESS'
      ? 'success'
      : execution.status === 'RUNNING'
        ? 'warning'
        : execution.status === 'TIMEOUT'
          ? 'warning'
          : 'danger';
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(96, 165, 250, 0.2)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
          ⚡ 执行记录
        </div>
        <StatusBadge label={execution.status} variant={execVariant} size="sm" dot />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="步数" value={`${execution.steps} / ${sessionMaxSteps}`} />
        <Field label="总耗时" value={fmtDuration(execution.totalDurationMs)} />
        <Field label="LLM 调用" value={String(execution.llmCalls)} />
        <Field label="工具调用" value={String(execution.toolCalls)} />
        <Field label="开始" value={fmtTime(execution.startedAt)} />
        <Field label="完成" value={fmtTime(execution.completedAt)} />
      </div>
      {execution.error ? (
        <div
          style={{
            marginTop: 10,
            padding: 8,
            borderRadius: 6,
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            fontSize: 11,
            color: '#fca5a5',
            fontFamily: 'monospace'
          }}
        >
          ⚠ {execution.error}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

export default function AgentSessionDetailClient({
  session,
  execution,
  evaluation,
  config,
  deliveryMode,
  error
}: AgentSessionDetailClientProps) {
  const [messageFilter, setMessageFilter] = useState<'all' | AgentMessage['role']>('all');
  const [showRaw, setShowRaw] = useState(false);

  // ── Phase-28: 详情页接入 stream ──
  // 策略: 对 RUNNING 状态的会话,自动订阅 stream(re-run 同一 config + userInput)
  // 增量合并 message_added 事件到原 messages,不替换 session(因为是新 session.id)
  const initialIsRunning = session.status === 'RUNNING';
  const [streamEnabled, setStreamEnabled] = useState(initialIsRunning);
  const [streamRunning, setStreamRunning] = useState(false);
  const [streamEvents, setStreamEvents] = useState<AgentSessionEvent[]>([]);
  const [streamMessages, setStreamMessages] = useState<AgentMessage[]>([]);
  const [streamStep, setStreamStep] = useState<{
    current: number;
    max: number;
  } | null>(null);
  const [streamStatus, setStreamStatus] = useState<AgentSessionStatus>(session.status);
  const [streamError, setStreamError] = useState<string | null>(null);
  const streamCancelledRef = useRef(false);

  const subscribeStream = useCallback(async () => {
    if (streamRunning) return;
    setStreamRunning(true);
    setStreamEvents([]);
    setStreamMessages([]);
    setStreamStep(null);
    setStreamError(null);
    streamCancelledRef.current = false;
    try {
      for await (const ev of runAgentSessionStream({
        configId: session.configId,
        userInput: session.userInput,
        maxSteps: session.maxSteps,
        enableReflection: session.enableReflection,
        createdBy: `${session.createdBy}-detail-replay`,
        tenantId: session.tenantId
      })) {
        if (streamCancelledRef.current) break;
        setStreamEvents((prev) => [...prev, ev]);
        if (ev.type === 'message_added') {
          setStreamMessages((prev) => {
            // 去重: 同 id 不重复 push
            if (prev.some((m) => m.id === ev.message.id)) return prev;
            return [...prev, ev.message];
          });
        } else if (ev.type === 'step_progress') {
          setStreamStep({ current: ev.step, max: ev.maxSteps });
        } else if (ev.type === 'session_completed') {
          setStreamStatus('COMPLETED');
        } else if (ev.type === 'session_failed') {
          setStreamStatus('FAILED');
          setStreamError(ev.error);
        }
      }
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : String(err));
    } finally {
      setStreamRunning(false);
    }
  }, [session.configId, session.userInput, session.maxSteps, session.enableReflection, session.createdBy, session.tenantId, streamRunning]);

  useEffect(() => {
    if (streamEnabled && initialIsRunning) {
      subscribeStream();
    }
    return () => {
      streamCancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamEnabled]);

  // 合并 messages: 原 session.messages + stream 增量(去重 by id, 累积 seen)
  const mergedMessages = useMemo(() => {
    if (streamMessages.length === 0) return session.messages;
    const seen = new Set(session.messages.map((m) => m.id));
    const extras: AgentMessage[] = [];
    for (const m of streamMessages) {
      if (!seen.has(m.id)) {
        extras.push(m);
        seen.add(m.id);
      }
    }
    return [...session.messages, ...extras];
  }, [session.messages, streamMessages]);

  const filteredMessages = useMemo(() => {
    if (messageFilter === 'all') return mergedMessages;
    return mergedMessages.filter((m) => m.role === messageFilter);
  }, [mergedMessages, messageFilter]);

  const messageStats = useMemo(() => {
    const counts: Record<AgentMessage['role'], number> = {
      system: 0,
      user: 0,
      assistant: 0,
      tool: 0
    };
    mergedMessages.forEach((m) => {
      counts[m.role]++;
    });
    return counts;
  }, [mergedMessages]);

  const effectiveStatus: AgentSessionStatus = streamStatus;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* fallback 警告 */}
      {deliveryMode === 'fallback' ? (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
            fontSize: 12
          }}
        >
          ⚠️ {error ?? '后端不可达,正在展示 fallback 数据'}
        </div>
      ) : null}

      {/* Phase-28: stream 状态条 */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          background:
            streamStatus === 'RUNNING' && streamRunning
              ? 'rgba(96, 165, 250, 0.1)'
              : streamStatus === 'FAILED'
              ? 'rgba(248, 113, 113, 0.08)'
              : streamStatus === 'COMPLETED'
              ? 'rgba(74, 222, 128, 0.08)'
              : 'rgba(100, 116, 139, 0.08)',
          border:
            streamStatus === 'RUNNING' && streamRunning
              ? '1px solid rgba(96, 165, 250, 0.3)'
              : streamStatus === 'FAILED'
              ? '1px solid rgba(248, 113, 113, 0.3)'
              : streamStatus === 'COMPLETED'
              ? '1px solid rgba(74, 222, 128, 0.3)'
              : '1px solid rgba(100, 116, 139, 0.3)',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}
        data-testid="detail-stream-status"
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background:
              streamStatus === 'RUNNING' && streamRunning
                ? '#60a5fa'
                : streamStatus === 'FAILED'
                ? '#f87171'
                : streamStatus === 'COMPLETED'
                ? '#4ade80'
                : '#64748b',
            animation: streamRunning ? 'pulse 1s infinite' : 'none'
          }}
        />
        <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
          {streamStatus === 'RUNNING' && streamRunning
            ? '🟢 实时流式订阅中'
            : streamStatus === 'RUNNING' && !streamRunning
            ? '⏸ 未订阅'
            : streamStatus === 'COMPLETED'
            ? '✅ 已完成 (历史快照)'
            : streamStatus === 'FAILED'
            ? `❌ 执行失败${streamError ? `: ${streamError}` : ''}`
            : `📜 ${STATUS_LABEL[streamStatus]}`}
        </span>
        <span
          style={{ color: '#64748b', fontFamily: 'monospace' }}
          data-testid="detail-stream-event-count"
        >
          · 已接收 {streamEvents.length} 事件
          {streamStep ? ` · 步骤 ${streamStep.current}/${streamStep.max}` : ''}
        </span>
        {streamMessages.length > 0 ? (
          <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
            · +{streamMessages.length} 新消息
          </span>
        ) : null}
        <div style={{ flex: 1 }} />
        {!streamRunning && initialIsRunning && streamStatus === 'RUNNING' ? (
          <button
            onClick={() => {
              setStreamEnabled(true);
              subscribeStream();
            }}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(96, 165, 250, 0.3)',
              background: 'transparent',
              color: '#60a5fa',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
            data-testid="detail-stream-resubscribe"
          >
            🔁 重新订阅
          </button>
        ) : null}
        {streamRunning ? (
          <button
            onClick={() => {
              streamCancelledRef.current = true;
            }}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(248, 113, 113, 0.3)',
              background: 'transparent',
              color: '#f87171',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
            data-testid="detail-stream-cancel"
          >
            ⏹ 取消订阅
          </button>
        ) : null}
      </div>

      {/* Phase-28: stream 进度条(只在订阅中显示) */}
      {streamStep && streamRunning ? (
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: 'rgba(100, 116, 139, 0.2)',
            overflow: 'hidden'
          }}
          data-testid="detail-stream-progress"
        >
          <div
            style={{
              height: '100%',
              width: `${(streamStep.current / streamStep.max) * 100}%`,
              background: 'linear-gradient(90deg, #60a5fa, #4ade80)',
              transition: 'width 0.3s'
            }}
          />
        </div>
      ) : null}

      {/* 状态头部 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          borderRadius: 10,
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(96, 165, 250, 0.2)'
        }}
      >
        <StatusBadge
          label={STATUS_LABEL[effectiveStatus]}
          variant={STATUS_VARIANT[effectiveStatus]}
          dot
          size="md"
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>
            {session.userInput}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            创建于 {fmtTime(session.createdAt)} · 创建者 {session.createdBy} · 租户{' '}
            {session.tenantId}
          </div>
        </div>
        <button
          onClick={() => setShowRaw((v) => !v)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(96, 165, 250, 0.3)',
            background: showRaw ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
            color: '#60a5fa',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'monospace'
          }}
        >
          {showRaw ? '🙈 隐藏' : '🧬 '} 原始 JSON
        </button>
      </div>

      {showRaw ? (
        <pre
          style={{
            padding: 16,
            borderRadius: 10,
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            color: '#94a3b8',
            fontSize: 11,
            overflow: 'auto',
            maxHeight: 480,
            fontFamily: 'monospace'
          }}
        >
          {JSON.stringify({ session, execution, evaluation, config }, null, 2)}
        </pre>
      ) : null}

      {/* 左右两栏 */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
        {/* 左:messages timeline */}
        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
              💬 消息时间线 ({session.messages.length})
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'system', 'user', 'assistant', 'tool'] as const).map((role) => {
                const isAll = role === 'all';
                const meta = isAll ? ROLE_META.system : ROLE_META[role];
                return (
                  <button
                    key={role}
                    onClick={() => setMessageFilter(role)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: `1px solid ${messageFilter === role ? meta.color : 'rgba(100, 116, 139, 0.3)'}`,
                      background:
                        messageFilter === role ? `${meta.color}22` : 'transparent',
                      color: messageFilter === role ? meta.color : '#94a3b8',
                      fontSize: 10,
                      cursor: 'pointer',
                      fontFamily: 'monospace'
                    }}
                  >
                    {isAll ? '全部' : meta.label}
                    {isAll ? ` (${session.messages.length})` : ` (${messageStats[role]})`}
                  </button>
                );
              })}
            </div>
          </div>
          {filteredMessages.length === 0 ? (
            <div
              style={{
                padding: 32,
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.3)',
                border: '1px dashed rgba(100, 116, 139, 0.3)',
                textAlign: 'center',
                color: '#64748b',
                fontSize: 13
              }}
            >
              {mergedMessages.length === 0
                ? '此会话暂无消息记录 (fallback 数据不展开 messages)'
                : `没有 ${messageFilter === 'all' ? ROLE_META.system.label : ROLE_META[messageFilter].label} 角色的消息`}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {filteredMessages.map((m, i) => (
                <MessageBubble key={m.id} message={m} index={i} />
              ))}
            </div>
          )}
          {session.finalOutput ? (
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#34d399',
                  marginBottom: 6,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                ✓ 最终输出
              </div>
              <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>
                {session.finalOutput}
              </div>
            </div>
          ) : null}
          {session.error ? (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                color: '#fca5a5',
                fontSize: 12,
                fontFamily: 'monospace'
              }}
            >
              ⚠ {session.error}
            </div>
          ) : null}
        </div>

        {/* 右:side panel */}
        <div style={{ display: 'grid', gap: 12 }}>
          {/* Config meta */}
          {config ? (
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(96, 165, 250, 0.2)'
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>
                🤖 使用配置
              </div>
              <div style={{ fontSize: 14, color: '#e2e8f0', marginBottom: 4 }}>{config.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, fontFamily: 'monospace' }}>
                {config.id} · {config.model}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <Field label="Max Steps" value={String(config.maxSteps)} />
                <Field
                  label="Reflection"
                  value={config.enableReflection ? '✓ 启用' : '✗ 关闭'}
                />
                <Field label="Timeout" value={`${config.timeoutMs}ms`} />
                <Field label="工具" value={config.allowedTools.join(', ') || '—'} />
              </div>
            </div>
          ) : null}

          {/* Session metadata */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(96, 165, 250, 0.2)'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>
              📋 会话元数据
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <Field label="Session ID" value={session.id} />
              <Field label="Config ID" value={session.configId} />
              <Field label="Started" value={fmtTime(session.startedAt)} />
              <Field label="Completed" value={fmtTime(session.completedAt)} />
              <Field
                label="Reflection"
                value={session.enableReflection ? '✓ 启用' : '✗ 关闭'}
              />
            </div>
          </div>

          {/* Execution */}
          <ExecutionCard execution={execution} sessionMaxSteps={session.maxSteps} />

          {/* Evaluation */}
          {evaluation ? <EvaluationCard evaluation={evaluation} /> : null}
        </div>
      </div>
    </div>
  );
}