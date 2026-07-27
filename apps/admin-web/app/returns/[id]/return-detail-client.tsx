'use client'


import type { ReturnDetailSnapshot } from './return-detail-data'
import ReturnDetailLegacy from './return-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function ReturnDetailClient({ snapshot }: { snapshot: ReturnDetailSnapshot }) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()

  return (
    <div style={shellStyle}>
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        extra={<>退换单: {snapshot.id}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <ReturnDetailLegacy params={Promise.resolve({ id: snapshot.id })} />
    </div>
  )
}
