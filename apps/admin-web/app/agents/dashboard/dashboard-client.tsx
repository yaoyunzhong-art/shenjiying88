'use client';

/* eslint-disable react-hooks/exhaustive-deps */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@m5/ui';
import type {
  AgentSession,
  AgentSessionEvent,
  AgentSessionStatus
} from '@m5/types';
import { runAgentSessionStream } from '../agent-view-model';

interface AgentDashboardClientProps {
  sessions: AgentSession[];
  deliveryMode: 'api' | 'fallback';
  error?: string;
  totalConfigs: number;
  timestamp: string;
}

interface SessionLiveState {
  sessionId: string;
  events: AgentSessionEvent[];
  latestStep: { current: number; max: number };
  messageCount: number;
  status: AgentSessionStatus;
  streamError: string | null;
  streaming: boolean;
  subscribed: boolean;
}

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

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  return iso.slice(11, 19);
}

function emptyLiveState(session: AgentSession): SessionLiveState {
  return {
    sessionId: session.id,
    events: [],
    latestStep: { current: session.currentStep ?? 0, max: session.maxSteps ?? 0 },
    messageCount: session.messages?.length ?? 0,
    status: session.status,
    streamError: null,
    streaming: false,
    subscribed: false
  };
}

function buildInitialState(sessions: AgentSession[]): Record<string, SessionLiveState> {
  const state: Record<string, SessionLiveState> = {};
  for (const s of sessions) {
    state[s.id] = emptyLiveState(s);
  }
  return state;
}

export default function AgentDashboardClient({
  sessions,
  deliveryMode,
  error,
  totalConfigs,
  timestamp
}: AgentDashboardClientProps) {
  const [liveState, setLiveState] = useState<Record<string, SessionLiveState>>(() =>
    buildInitialState(sessions)
  );
  const [paused, setPaused] = useState(false);

  // 每个 RUNNING session 一个独立的 cancelled ref
  const cancelledRefs = useRef<Record<string, { cancelled: boolean }>>({});

  const subscribeStream = useCallback(
    async (session: AgentSession) => {
      if (deliveryMode !== 'api') return;
      if (session.status !== 'RUNNING') return;
      const cancelToken = { cancelled: false };
      cancelledRefs.current[session.id] = cancelToken;

      setLiveState((prev) => {
        const cur = prev[session.id] ?? emptyLiveState(session);
        const next: SessionLiveState = {
          ...cur,
          streaming: true,
          subscribed: true,
          streamError: null
        };
        return { ...prev, [session.id]: next };
      });

      try {
        const generator = runAgentSessionStream({
          configId: session.configId,
          userInput: session.userInput,
          maxSteps: session.maxSteps,
          enableReflection: session.enableReflection,
          createdBy: `${session.createdBy ?? 'user'}-dashboard-replay`,
          tenantId: session.tenantId ?? 'tenant-demo'
        });

        for await (const ev of generator) {
          if (cancelToken.cancelled) break;
          setLiveState((prev) => {
            const cur = prev[session.id];
            if (!cur) return prev;
            const next: SessionLiveState = {
              ...cur,
              events: [...cur.events, ev]
            };
            if (ev.type === 'message_added') {
              next.messageCount = cur.messageCount + 1;
            } else if (ev.type === 'step_progress') {
              next.latestStep = { current: ev.step, max: ev.maxSteps };
            } else if (ev.type === 'session_completed') {
              next.status = 'COMPLETED';
              next.streaming = false;
            } else if (ev.type === 'session_failed') {
              next.status = 'FAILED';
              next.streaming = false;
              next.streamError = ev.error;
            }
            return { ...prev, [session.id]: next };
          });
        }
      } catch (err) {
        if (!cancelToken.cancelled) {
          setLiveState((prev) => {
            const cur = prev[session.id] ?? emptyLiveState(session);
            const next: SessionLiveState = {
              ...cur,
              streamError: err instanceof Error ? err.message : 'stream error',
              streaming: false
            };
            return { ...prev, [session.id]: next };
          });
        }
      }
    },
    [deliveryMode]
  );

  // 并发订阅所有 RUNNING session
  useEffect(() => {
    if (paused) return;
    if (deliveryMode !== 'api') return;

    const running = sessions.filter((s) => s.status === 'RUNNING');
    const controllers = running.map((s) => subscribeStream(s));

    const sessionKey = running.map((s) => s.id).join(',');
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return () => {
      // cleanup: 取消所有 stream
      for (const id of sessionKey.split(',')) {
        if (!id) continue;
        const ref = cancelledRefs.current[id];
        if (ref) ref.cancelled = true;
      }
      void Promise.all(controllers);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.map((s) => `${s.id}:${s.status}`).join(','), deliveryMode, paused]);

  const stats = useMemo(() => {
    let runningLive = 0;
    let completedLive = 0;
    let failedLive = 0;
    let totalEvents = 0;
    for (const id of Object.keys(liveState)) {
      const s = liveState[id];
      if (!s) continue;
      totalEvents += s.events.length;
      if (s.status === 'RUNNING') runningLive++;
      else if (s.status === 'COMPLETED') completedLive++;
      else if (s.status === 'FAILED') failedLive++;
    }
    return { runningLive, completedLive, failedLive, totalEvents };
  }, [liveState]);

  return (
    <div data-testid="dashboard-client">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: '10px 14px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span
            style={{ fontSize: 12, color: '#94a3b8' }}
            data-testid="dashboard-delivery-mode"
          >
            {deliveryMode === 'api' ? '🟢 Live API' : '🟡 Fallback'} · {sessions.length} 个会话
            · {totalConfigs} 个 config · {stats.totalEvents} 事件已接收
          </span>
          <span
            style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}
            data-testid="dashboard-timestamp"
          >
            {fmtTime(timestamp)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            data-testid="dashboard-toggle-pause"
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid rgba(167, 139, 250, 0.3)',
              background: paused ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
              color: '#a78bfa',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {paused ? '▶ 恢复订阅' : '⏸ 暂停订阅'}
          </button>
        </div>
      </div>

      {error ? (
        <div
          data-testid="dashboard-error-banner"
          style={{
            padding: 10,
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: 6,
            color: '#f87171',
            fontSize: 12,
            marginBottom: 12
          }}
        >
          ⚠️ 后端异常: {error}。已切换为 fallback 数据。
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 10 }} data-testid="dashboard-session-list">
        {sessions.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: '#64748b',
              fontSize: 13,
              background: 'rgba(15, 23, 42, 0.3)',
              borderRadius: 8
            }}
            data-testid="dashboard-empty"
          >
            当前没有会话记录
          </div>
        ) : null}
        {sessions.map((session) => {
          const live = liveState[session.id];
          const step = live?.latestStep ?? {
            current: session.currentStep ?? 0,
            max: session.maxSteps ?? 0
          };
          const pct = step.max > 0 ? Math.round((step.current / step.max) * 100) : 0;
          const status = live?.status ?? session.status;
          return (
            <div
              key={session.id}
              data-testid="dashboard-session-row"
              data-session-id={session.id}
              data-session-status={status}
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.5)',
                border:
                  status === 'RUNNING'
                    ? '1px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(100, 116, 139, 0.2)',
                display: 'grid',
                gap: 8
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <StatusBadge
                    label={status}
                    variant={STATUS_VARIANT[status]}
                    size="sm"
                    dot
                  />
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: '#e2e8f0',
                      fontWeight: 600
                    }}
                  >
                    {session.id}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    config: <code style={{ color: '#a78bfa' }}>{session.configId}</code>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {live?.streaming ? (
                    <span
                      data-testid="dashboard-session-streaming"
                      style={{ fontSize: 11, color: '#fbbf24' }}
                    >
                      📡 订阅中
                    </span>
                  ) : null}
                  <Link
                    href={`/agents/sessions/${session.id}`}
                    data-testid="dashboard-session-detail-link"
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(96, 165, 250, 0.15)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      color: '#60a5fa',
                      fontSize: 11,
                      textDecoration: 'none'
                    }}
                  >
                    详情 →
                  </Link>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 11,
                  color: '#94a3b8'
                }}
              >
                <span data-testid="dashboard-session-step">
                  步骤 {step.current}/{step.max}
                </span>
                <div
                  data-testid="dashboard-session-progress"
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background:
                        status === 'COMPLETED'
                          ? '#34d399'
                          : status === 'FAILED'
                            ? '#f87171'
                            : '#fbbf24',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <span
                  style={{ fontFamily: 'monospace', minWidth: 36, textAlign: 'right' }}
                  data-testid="dashboard-session-pct"
                >
                  {pct}%
                </span>
                <span data-testid="dashboard-session-events">
                  {live?.events.length ?? 0} 事件
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#cbd5e1',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                💬 {session.userInput}
              </div>
              {live?.streamError ? (
                <div
                  style={{ fontSize: 11, color: '#f87171' }}
                  data-testid="dashboard-session-error"
                >
                  ⚠️ {live.streamError}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}