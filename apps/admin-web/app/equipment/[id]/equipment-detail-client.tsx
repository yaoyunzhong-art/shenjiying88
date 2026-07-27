'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { EquipmentDetailSnapshot } from './equipment-detail-data'
import EquipmentDetailLegacy from './equipment-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function EquipmentDetailClient({ snapshot }: { snapshot: EquipmentDetailSnapshot }) {
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
        extra={<>设备 ID: {snapshot.id}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <EquipmentDetailLegacy params={Promise.resolve({ id: snapshot.id })} />
    </div>
  )
}
