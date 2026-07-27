'use client'


import type { EquipmentDetailSnapshot } from './equipment-detail-data'
import EquipmentDetailLegacy from './equipment-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function EquipmentDetailClient({ snapshot }: { snapshot: EquipmentDetailSnapshot }) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()

  return (
    <div style={shellStyle}>
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        extra={<>设备 ID: {snapshot.id}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <EquipmentDetailLegacy params={Promise.resolve({ id: snapshot.id })} />
    </div>
  )
}
