import type { CSSProperties, ReactNode } from 'react'

const cardStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.3)',
  padding: 12,
  color: '#cbd5e1',
  fontSize: 12,
}

const buttonStyle: CSSProperties = {
  borderRadius: 8,
  border: '1px solid rgba(96, 165, 250, 0.35)',
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#bfdbfe',
  padding: '8px 14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

type SnapshotRefreshCardProps = {
  sourceLabel: string
  refreshPath: string
  onRefresh: () => void
  isRefreshing: boolean
  extra?: ReactNode
  contextLabel?: string
  loadingLabel?: string
  idleLabel?: string
}

export default function SnapshotRefreshCard({
  sourceLabel,
  refreshPath,
  onRefresh,
  isRefreshing,
  extra,
  contextLabel = '客户端快照上下文',
  loadingLabel = '刷新中...',
  idleLabel = '刷新快照',
}: SnapshotRefreshCardProps) {
  return (
    <div style={cardStyle}>
      <div>
        {contextLabel}: {sourceLabel}
        {extra ? <> · {extra}</> : null} · 刷新路径: {refreshPath}
      </div>
      <button type="button" onClick={onRefresh} style={buttonStyle}>
        {isRefreshing ? loadingLabel : idleLabel}
      </button>
    </div>
  )
}
