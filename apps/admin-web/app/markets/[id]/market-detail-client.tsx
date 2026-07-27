'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { MarketDetailSnapshot } from './market-detail-data'
import MarketDetailLegacy from './market-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function MarketDetailClient({ snapshot }: { snapshot: MarketDetailSnapshot }) {
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
        extra={<>市场: {snapshot.id}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <MarketDetailLegacy params={Promise.resolve({ id: snapshot.id })} />
    </div>
  )
}
