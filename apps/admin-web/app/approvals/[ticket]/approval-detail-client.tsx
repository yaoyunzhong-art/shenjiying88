'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useTransition } from 'react'

import type { ApprovalDetailSnapshot } from './approval-detail-data'
import ApprovalDetailLegacy from './approval-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function ApprovalDetailClient({ snapshot }: { snapshot: ApprovalDetailSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  

  return (
    <div style={shellStyle}>
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        extra={<>审批单: {snapshot.ticket}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <ApprovalDetailLegacy params={Promise.resolve({ ticket: snapshot.ticket })} />
    </div>
  )
}
