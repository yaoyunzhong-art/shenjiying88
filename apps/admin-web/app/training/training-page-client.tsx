'use client'

import TrainingLegacy from './training-legacy'
import type { TrainingPageShellSnapshot } from './training-page-data'
import SnapshotRefreshCard from '../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function TrainingPageClient({ snapshot }: { snapshot: TrainingPageShellSnapshot }) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()

  return (
    <div style={shellStyle}>
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        extra={
          <>
            记录: {snapshot.totalRecords} 条 · 参训: {snapshot.totalAttendees} 人次
          </>
        }
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <TrainingLegacy />
    </div>
  )
}
