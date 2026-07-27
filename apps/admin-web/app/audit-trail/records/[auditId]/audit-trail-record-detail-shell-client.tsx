'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import AuditTrailRecordDetailClient from './audit-trail-record-detail-client'
import type { AuditTrailRecordDetailSnapshot } from './audit-trail-record-detail-data'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

const refreshCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.3)',
  padding: 12,
  color: '#cbd5e1',
  fontSize: 12,
} as const

const refreshButtonStyle = {
  borderRadius: 8,
  border: '1px solid rgba(96, 165, 250, 0.35)',
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#bfdbfe',
  padding: '8px 14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
} as const

export default function AuditTrailRecordDetailShellClient({
  snapshot,
}: {
  snapshot: AuditTrailRecordDetailSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={shellStyle}>
      <div style={refreshCardStyle}>
        <div>客户端快照上下文: {snapshot.sourceLabel} · 审计记录 {snapshot.auditId}</div>
        <button type="button" onClick={handleRefresh} style={refreshButtonStyle}>
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>
      <AuditTrailRecordDetailClient snapshot={snapshot} />
    </div>
  )
}
