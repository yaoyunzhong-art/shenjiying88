'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import LegacyView from './purchase-order-detail-legacy'
import type { PurchaseOrderDetailSnapshot } from './purchase-order-detail-data'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function PurchaseOrderDetailClient({ snapshot }: { snapshot: PurchaseOrderDetailSnapshot }) {
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
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        contextLabel="客户端快照上下文"
        loadingLabel="刷新中..."
        idleLabel="刷新快照"
      />
      <LegacyView id={snapshot.id} />
    </div>
  )
}
