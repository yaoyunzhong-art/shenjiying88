'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { EquipmentEditSnapshot } from './equipment-edit-data'
import EquipmentEditLegacy from './equipment-edit-legacy'
import SnapshotRefreshCard from '../../../components/snapshot-refresh-card'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function EquipmentEditClient({ snapshot }: { snapshot: EquipmentEditSnapshot }) {
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
        extra={<>编辑设备: {snapshot.id}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <EquipmentEditLegacy params={Promise.resolve({ id: snapshot.id })} />
    </div>
  )
}
