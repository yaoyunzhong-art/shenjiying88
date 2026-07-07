/**
 * DeliveryTimeline — 物流配送时间线组件
 * 展示从发货到签收的完整物流轨迹
 */
'use client';
import React from 'react';

/* ── 物流事件类型 ── */
export interface TrackingEvent {
  /** 事件ID */
  id: string;
  /** 事件时间 ISO */
  timestamp: string;
  /** 事件描述 */
  description: string;
  /** 事件状态 */
  status: 'completed' | 'current' | 'pending';
  /** 操作人/地点 (可选) */
  location?: string;
  /** 备注 (可选) */
  note?: string;
}

export interface DeliveryTimelineProps {
  /** 物流事件列表 */
  events: TrackingEvent[];
  /** 物流单号 */
  trackingNumber?: string;
  /** 物流公司 */
  carrier?: string;
}

/* ── Helpers ── */
function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

/* ── Component ── */
export function DeliveryTimeline({ events, trackingNumber, carrier }: DeliveryTimelineProps) {
  const safeEvents = events ?? [];

  return (
    <div data-testid="delivery-timeline" style={{ padding: '16px 0' }}>
      {/* 物流信息头 */}
      {(trackingNumber || carrier) && (
        <div
          style={{
            marginBottom: 16,
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {carrier && <span style={{ marginRight: 16 }}>📮 {carrier}</span>}
          {trackingNumber && <span>🔖 {trackingNumber}</span>}
        </div>
      )}

      {/* 空状态 */}
      {safeEvents.length === 0 && (
        <div
          data-testid="delivery-timeline-empty"
          style={{
            textAlign: 'center',
            padding: 32,
            color: '#999',
            fontSize: 14,
          }}
        >
          暂无物流信息
        </div>
      )}

      {/* 时间线 */}
      {safeEvents.length > 0 && (
        <ul data-testid="delivery-timeline-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {safeEvents.map((event, idx) => {
            const isLast = idx === safeEvents.length - 1;
            const isCompleted = event.status === 'completed';
            const isCurrent = event.status === 'current';

            return (
              <li
                key={event.id}
                data-testid={`timeline-event-${event.id}`}
                style={{
                  position: 'relative',
                  paddingLeft: 32,
                  paddingBottom: isLast ? 0 : 24,
                }}
              >
                {/* 连接线 */}
                {!isLast && (
                  <div
                    data-testid={`timeline-line-${event.id}`}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: 16,
                      bottom: 0,
                      width: 2,
                      backgroundColor: isCompleted ? '#52c41a' : '#e8e8e8',
                    }}
                  />
                )}

                {/* 圆点 */}
                <div
                  data-testid={`timeline-dot-${event.id}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 4,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCompleted ? '#52c41a' : isCurrent ? '#1890ff' : '#e8e8e8',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {isCompleted ? '✓' : isCurrent ? '●' : idx + 1}
                </div>

                {/* 内容 */}
                <div>
                  <div
                    style={{
                      fontWeight: isCurrent ? 700 : 400,
                      fontSize: 14,
                      color: isCurrent ? '#1890ff' : isCompleted ? '#333' : '#999',
                    }}
                  >
                    {event.description}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    {formatDateTime(event.timestamp)}
                    {event.location && ` · ${event.location}`}
                  </div>
                  {event.note && (
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2, fontStyle: 'italic' }}>
                      {event.note}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
