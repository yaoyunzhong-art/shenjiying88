/**
 * Phase 95 Webhook 投递日志 (V10 Sprint 2 Day 21)
 */

import React from 'react'
import { useWebhookDeliveries } from './useWebhook'
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  EVENT_LABELS,
  type WebhookEndpointView,
} from './types'

export interface WebhookDeliveryLogProps {
  endpoint?: WebhookEndpointView
  limit?: number
}

export function WebhookDeliveryLog({ endpoint, limit = 50 }: WebhookDeliveryLogProps) {
  const { data: deliveries = [] } = useWebhookDeliveries(endpoint?.id)

  const items = deliveries.slice(0, limit)
  const successCount = deliveries.filter((d) => d.status === 'success').length
  const failCount = deliveries.filter((d) => ['failed', 'dead_letter'].includes(d.status)).length
  const retryCount = deliveries.filter((d) => d.status === 'retrying').length

  return (
    <div data-testid="delivery-log" data-endpoint={endpoint?.id ?? ''} style={{ padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>
          投递日志{endpoint ? ` - ${endpoint.name}` : ''}
        </h2>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', marginTop: 4 }}>
          <span data-testid="stat-success">✓ 成功 {successCount}</span>
          <span data-testid="stat-retry">↻ 重试 {retryCount}</span>
          <span data-testid="stat-fail">✗ 失败 {failCount}</span>
          <span>共 {deliveries.length} 条</span>
        </div>
      </header>

      <table
        data-testid="delivery-table"
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
      >
        <thead>
          <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
            <th style={th}>事件</th>
            <th style={th}>状态</th>
            <th style={th}>尝试</th>
            <th style={th}>HTTP</th>
            <th style={th}>耗时</th>
            <th style={th}>时间</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id} data-testid={`delivery-${d.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={td}>{EVENT_LABELS[d.eventType]}</td>
              <td style={td}>
                <span
                  data-testid="delivery-status"
                  style={{
                    padding: '2px 6px',
                    background: DELIVERY_STATUS_COLORS[d.status],
                    color: '#fff',
                    borderRadius: 3,
                    fontSize: 11,
                  }}
                >
                  {DELIVERY_STATUS_LABELS[d.status]}
                </span>
              </td>
              <td style={td}>{d.attempt + 1}/{d.maxAttempts}</td>
              <td style={td}>{d.responseStatus ?? '-'}</td>
              <td style={td}>{d.durationMs ? `${d.durationMs}ms` : '-'}</td>
              <td style={td}>
                <div>{d.createdAt}</div>
                {d.error && (
                  <div style={{ fontSize: 11, color: '#dc2626' }}>{d.error}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <div data-testid="empty-deliveries" style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
          暂无投递记录
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: '8px 12px', fontWeight: 500 }
const td: React.CSSProperties = { padding: '8px 12px' }
