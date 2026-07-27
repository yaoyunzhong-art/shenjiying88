'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { ReturnDetailSnapshot } from './return-detail-data'
import ReturnDetailLegacy from './return-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function ReturnDetailClient({ snapshot }: { snapshot: ReturnDetailSnapshot }) {
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
        extra={<>退换单: {snapshot.id}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <ReturnDetailLegacy params={Promise.resolve({ id: snapshot.id })} />
    </div>
  )
}
