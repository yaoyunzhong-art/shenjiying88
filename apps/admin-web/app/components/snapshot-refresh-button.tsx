import type { CSSProperties } from 'react'

const baseStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontSize: 12,
}

const variantStyleMap: Record<'light' | 'dark' | 'accent', CSSProperties> = {
  light: {
    border: '1px solid rgba(148, 163, 184, 0.4)',
    background: '#fff',
    color: '#0f172a',
  },
  dark: {
    border: '1px solid rgba(148, 163, 184, 0.28)',
    background: 'rgba(15, 23, 42, 0.55)',
    color: '#e2e8f0',
  },
  accent: {
    border: '1px solid rgba(59, 130, 246, 0.35)',
    background: 'rgba(59, 130, 246, 0.12)',
    color: '#93c5fd',
    fontWeight: 600,
  },
}

type SnapshotRefreshButtonProps = {
  onRefresh: () => void
  isRefreshing: boolean
  variant?: 'light' | 'dark' | 'accent'
  idleLabel?: string
  loadingLabel?: string
}

export default function SnapshotRefreshButton({
  onRefresh,
  isRefreshing,
  variant = 'light',
  idleLabel = '刷新快照',
  loadingLabel = '刷新中...',
}: SnapshotRefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      style={{
        ...baseStyle,
        ...variantStyleMap[variant],
        opacity: isRefreshing ? 0.72 : 1,
      }}
    >
      {isRefreshing ? loadingLabel : idleLabel}
    </button>
  )
}
