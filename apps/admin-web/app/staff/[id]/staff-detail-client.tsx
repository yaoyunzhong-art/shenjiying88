'use client'


import type { StaffDetailSnapshot } from './staff-detail-data'
import StaffDetailLegacy from './staff-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function StaffDetailClient({ snapshot }: { snapshot: StaffDetailSnapshot }) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()

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
