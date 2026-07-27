'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import AuditTrailRecordDetailClient from './audit-trail-record-detail-client'
import type { AuditTrailRecordDetailSnapshot } from './audit-trail-record-detail-data'
import SnapshotRefreshCard from '../../../components/snapshot-refresh-card'

const shellStyle = {
  display: 'grid',
  gap: 16,
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
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        extra={<>审计记录: {snapshot.auditId}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <AuditTrailRecordDetailClient snapshot={snapshot} />
    </div>
  )
}
