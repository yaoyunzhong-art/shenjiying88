"use client"


import LegacyView from './cashier-workbench-legacy'
import type { CashierWorkbenchSnapshot } from './cashier-workbench-data'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

export default function CashierWorkbenchClient({ snapshot }: { snapshot: CashierWorkbenchSnapshot }) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()

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
      <LegacyView snapshot={snapshot} />
    </div>
  )
}
