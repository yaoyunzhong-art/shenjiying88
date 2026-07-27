'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { AdminAlertDetailRouteView } from './detail-presenter'
import type { AlertDetailSnapshot } from './alert-detail-data'

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.42)',
  padding: 20,
  color: '#e2e8f0',
} as const

const buttonStyle = {
  borderRadius: 8,
  border: '1px solid rgba(96, 165, 250, 0.35)',
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#bfdbfe',
  padding: '8px 14px',
  cursor: 'pointer',
} as const

export default function AlertDetailClient({ snapshot }: { snapshot: AlertDetailSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          客户端快照上下文: {snapshot.sourceLabel} · 刷新路径: {snapshot.refreshPath}
        </div>
        <button type="button" onClick={handleRefresh} style={buttonStyle}>
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div style={cardStyle}>
        <AdminAlertDetailRouteView alertId={snapshot.alertId} governance={snapshot.governance} />
      </div>
    </div>
  )
}
