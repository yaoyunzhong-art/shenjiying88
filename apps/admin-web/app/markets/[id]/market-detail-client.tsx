'use client'


import type { MarketDetailSnapshot } from './market-detail-data'
import MarketDetailLegacy from './market-detail-legacy'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function MarketDetailClient({ snapshot }: { snapshot: MarketDetailSnapshot }) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()

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
