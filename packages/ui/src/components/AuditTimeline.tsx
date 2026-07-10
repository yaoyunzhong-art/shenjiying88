import React from 'react';

// ============================================================
// Types
// ============================================================

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  detail?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  status?: 'completed' | 'pending' | 'failed';
}

export interface AuditTimelineProps {
  events: AuditEvent[];
  maxHeight?: string;
  emptyText?: string;
  'data-testid'?: string;
}

// ============================================================
// Helpers
// ============================================================

const SEVERITY_ICON: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '🚫',
  success: '✅',
};

const STATUS_DOT: Record<string, string> = {
  completed: '🟢',
  pending: '🟡',
  failed: '🔴',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ============================================================
// Component
// ============================================================

export function AuditTimeline({
  events,
  maxHeight,
  emptyText = '暂无审计事件',
  'data-testid': testId,
}: AuditTimelineProps) {
  if (!events.length) {
    return (
      <div
        data-testid={testId}
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: '#999',
          fontSize: 14,
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      style={{
        overflowY: 'auto',
        maxHeight: maxHeight ?? '400px',
        padding: '8px 0',
      }}
    >
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const severityColor =
          event.severity === 'error'
            ? '#f5222d'
            : event.severity === 'warning'
              ? '#faad14'
              : event.severity === 'success'
                ? '#52c41a'
                : '#1677ff';

        return (
          <div
            key={event.id}
            data-testid={testId ? `${testId}-event-${idx}` : undefined}
            style={{ display: 'flex', gap: 12, padding: '0 16px 0 24px', position: 'relative' }}
          >
            {/* 时间轴连线 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 20,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: severityColor,
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: '#e8e8e8',
                    minHeight: 12,
                  }}
                />
              )}
            </div>

            {/* 事件内容 */}
            <div style={{ flex: 1, paddingBottom: isLast ? 4 : 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap' }}>
                  {formatTime(event.timestamp)}
                </span>
                {event.status && (
                  <span style={{ fontSize: 12 }}>{STATUS_DOT[event.status] ?? ''}</span>
                )}
                {event.severity && (
                  <span style={{ fontSize: 12 }}>{SEVERITY_ICON[event.severity] ?? ''}</span>
                )}
              </div>

              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>
                <span style={{ color: severityColor }}>{event.action}</span>
              </div>

              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                <strong>{event.actor}</strong>
                {' 对 '}
                <strong>{event.target}</strong>
                {' 执行了操作'}
              </div>

              {event.detail && (
                <div
                  style={{
                    marginTop: 6,
                    padding: '6px 10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    fontSize: 13,
                    color: '#333',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {event.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
