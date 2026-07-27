'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { StaffDetailSnapshot } from './staff-detail-data'
import StaffDetailLegacy from './staff-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function StaffDetailClient({ snapshot }: { snapshot: StaffDetailSnapshot }) {
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
        extra={<>员工: {snapshot.id}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <StaffDetailLegacy />
    </div>
  )
}
