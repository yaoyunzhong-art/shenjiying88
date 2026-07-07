/**
 * Phase 95 Webhook 列表 (V10 Sprint 2 Day 21)
 */

import React from 'react'
import {
  useWebhookList,
  useDeleteWebhook,
  useTestWebhook,
} from './useWebhook'
import {
  PLATFORM_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  EVENT_LABELS,
  type WebhookEndpointView,
} from './types'

export interface WebhookListProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  onEdit?: (endpoint: WebhookEndpointView) => void
  onViewDeliveries?: (endpoint: WebhookEndpointView) => void
}

export function WebhookList({ variant = 'pc', onEdit, onViewDeliveries }: WebhookListProps) {
  const { data: endpoints = [] } = useWebhookList()
  const del = useDeleteWebhook()
  const test = useTestWebhook()

  const isCompact = variant === 'h5' || variant === 'app'

  return (
    <div data-testid="webhook-list" data-variant={variant} style={{ padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Webhook 配置</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
          共 {endpoints.length} 个端点
        </p>
      </header>

      <ul data-testid="endpoint-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {endpoints.map((ep) => (
          <li
            key={ep.id}
            data-testid={`endpoint-${ep.id}`}
            style={{
              padding: 12,
              marginBottom: 8,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>{ep.name}</span>
              <span
                data-testid="platform-badge"
                style={{ fontSize: 12, color: '#64748b' }}
              >
                {PLATFORM_LABELS[ep.platform]}
              </span>
              <span
                data-testid="status-badge"
                style={{
                  padding: '2px 8px',
                  background: STATUS_COLORS[ep.status],
                  color: '#fff',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                {STATUS_LABELS[ep.status]}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                🔑 {ep.secretFingerprint}
              </span>
            </div>

            <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>
              <code data-testid="endpoint-url" style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 3 }}>
                {ep.url}
              </code>
            </div>

            {!isCompact && (
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                订阅事件:{' '}
                {ep.events.map((e) => (
                  <span
                    key={e}
                    data-testid={`event-${e}`}
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      margin: '0 4px 4px 0',
                      background: '#eff6ff',
                      borderRadius: 4,
                    }}
                  >
                    {EVENT_LABELS[e]}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                data-testid={`btn-test-${ep.id}`}
                onClick={() => test.mutate({ id: ep.id, eventType: 'license.expired' })}
                disabled={test.isPending}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                🧪 测试
              </button>
              <button
                type="button"
                data-testid={`btn-deliveries-${ep.id}`}
                onClick={() => onViewDeliveries?.(ep)}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                📜 投递日志
              </button>
              {onEdit && (
                <button
                  type="button"
                  data-testid={`btn-edit-${ep.id}`}
                  onClick={() => onEdit(ep)}
                  style={{
                    padding: '4px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✏️ 编辑
                </button>
              )}
              <button
                type="button"
                data-testid={`btn-delete-${ep.id}`}
                onClick={() => del.mutate(ep.id)}
                disabled={del.isPending}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #fca5a5',
                  borderRadius: 4,
                  background: '#fef2f2',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                🗑️ 删除
              </button>
            </div>
          </li>
        ))}
      </ul>

      {endpoints.length === 0 && (
        <div data-testid="empty-state" style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
          暂无 Webhook 配置
        </div>
      )}
    </div>
  )
}
