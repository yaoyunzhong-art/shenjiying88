'use client';

import React from 'react';

// --- Types ---

export interface MetricTile {
  id: string;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
  helper?: React.ReactNode;
  onClick?: () => void;
}

export interface MetricsDashboardGridProps {
  tiles: MetricTile[];
  columns?: 2 | 3 | 4 | 'auto-fit';
  gap?: number;
  loading?: boolean;
  loadingSkeletonCount?: number;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

// --- Column widths ---

const COLUMN_FR = {
  2: '1fr 1fr',
  3: '1fr 1fr 1fr',
  4: '1fr 1fr 1fr 1fr',
  'auto-fit': 'repeat(auto-fill, minmax(220px, 1fr))',
} as const;

// --- Styles ---

const ACCENTS: Record<string, string> = {
  'default': '#3b82f6',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#22c55e',
} as const;

const ACCENT_MAP: Record<string, string> = {
  default: '#3b82f6',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#22c55e',
};

function tileStyle(accent: string): React.CSSProperties {
  return {
    background: 'rgba(15,23,42,0.5)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    cursor: 'default',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };
}

function skeletonStyle(): React.CSSProperties {
  return {
    background: 'rgba(15,23,42,0.3)',
    border: '1px solid rgba(148,163,184,0.08)',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };
}

// --- Skeleton tile ---

function SkeletonTile() {
  return (
    <div style={skeletonStyle()} aria-hidden>
      <div
        style={{
          width: '60%',
          height: 12,
          background: 'rgba(148,163,184,0.15)',
          borderRadius: 4,
        }}
      />
      <div
        style={{
          width: '40%',
          height: 24,
          background: 'rgba(148,163,184,0.12)',
          borderRadius: 4,
        }}
      />
      <div
        style={{
          width: '80%',
          height: 10,
          background: 'rgba(148,163,184,0.10)',
          borderRadius: 4,
        }}
      />
    </div>
  );
}

// --- Tile component ---

function MetricTileCard({ tile }: { tile: MetricTile }) {
  const resolved = tile.variant ?? 'default';
  const accent: string = ACCENT_MAP[resolved] as string;

  return (
    <div
      role="article"
      style={tileStyle(accent)}
      onClick={tile.onClick}
      onKeyDown={
        tile.onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tile.onClick?.();
              }
            }
          : undefined
      }
      tabIndex={tile.onClick ? 0 : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{tile.label}</span>
        {tile.icon && <span style={{ color: accent }}>{tile.icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>{tile.value}</span>
        {tile.trend && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: tile.trend.positive ? '#22c55e' : '#ef4444',
            }}
          >
            {tile.trend.positive ? '↑' : '↓'} {tile.trend.value}
          </span>
        )}
      </div>
      {tile.helper ? <div style={{ fontSize: 12, color: '#94a3b8' }}>{tile.helper}</div> : null}
    </div>
  );
}

// --- Main component ---

export function MetricsDashboardGrid({
  tiles,
  columns = 'auto-fit',
  gap = 16,
  loading = false,
  loadingSkeletonCount = 6,
  emptyMessage,
  emptyAction,
  error,
  onRetry,
  className,
}: MetricsDashboardGridProps) {
  // Error state
  if (error) {
    return (
      <div
        style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>
          数据加载失败
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 8,
              padding: '8px 20px',
              color: '#60a5fa',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLUMN_FR[columns],
          gap,
        }}
      >
        {Array.from({ length: loadingSkeletonCount }).map((_, i) => (
          <SkeletonTile key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!tiles.length) {
    return (
      <div
        style={{
          background: 'rgba(15,23,42,0.3)',
          border: '1px solid rgba(148,163,184,0.1)',
          borderRadius: 12,
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
          {emptyMessage ?? '暂无指标数据'}
        </div>
        {emptyAction && <div style={{ marginTop: 12 }}>{emptyAction}</div>}
      </div>
    );
  }

  // Normal grid
  return (
    <div
      className={className}
      role="region"
      aria-label="指标仪表盘"
      style={{
        display: 'grid',
        gridTemplateColumns: COLUMN_FR[columns],
        gap,
      }}
    >
      {tiles.map((tile) => (
        <MetricTileCard key={tile.id} tile={tile} />
      ))}
    </div>
  );
}
