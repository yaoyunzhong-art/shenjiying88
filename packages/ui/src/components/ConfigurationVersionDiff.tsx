'use client';

import React, { useMemo } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export interface DiffEntry {
  /** Configuration key path (e.g. "features.newCheckout.enabled"). */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Previous version value (stringified). */
  oldValue: string;
  /** Current version value (stringified). */
  newValue: string;
  /** Optional description of the field. */
  description?: string;
}

export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ConfigurationVersionDiffProps {
  /** Array of entries to compare. */
  entries: DiffEntry[];
  /** Left-column label (previous version). */
  oldLabel?: string;
  /** Right-column label (current version). */
  newLabel?: string;
  /** CSS class name. */
  className?: string;
  /** Inline styles. */
  style?: React.CSSProperties;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function classifyChange(entry: DiffEntry): DiffChangeType {
  const oldVal = entry.oldValue.trim();
  const newVal = entry.newValue.trim();
  if (oldVal === '' && newVal !== '') return 'added';
  if (oldVal !== '' && newVal === '') return 'removed';
  if (oldVal !== newVal) return 'modified';
  return 'unchanged';
}

const CHANGE_COLORS: Record<DiffChangeType, { bg: string; text: string; badge: string }> = {
  added:      { bg: 'rgba(34,197,94,0.08)', text: '#16a34a', badge: '#16a34a' },
  removed:    { bg: 'rgba(239,68,68,0.08)', text: '#dc2626', badge: '#dc2626' },
  modified:   { bg: 'rgba(234,179,8,0.08)', text: '#ca8a04', badge: '#ca8a04' },
  unchanged:  { bg: 'transparent',          text: '#6b7280', badge: '#9ca3af' },
};

const CHANGE_LABEL: Record<DiffChangeType, string> = {
  added:     '新增',
  removed:   '删除',
  modified:  '修改',
  unchanged: '未变',
};

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  padding: '1px 6px',
  borderRadius: 4,
  lineHeight: '18px',
  whiteSpace: 'nowrap',
};

// ── Component ───────────────────────────────────────────────────────────────

export function ConfigurationVersionDiff({
  entries,
  oldLabel = '旧版本',
  newLabel = '新版本',
  className,
  style,
}: ConfigurationVersionDiffProps) {
  const rows = useMemo(
    () => entries.map((e) => ({ ...e, change: classifyChange(e) })),
    [entries],
  );

  return (
    <div
      className={className}
      style={{
        fontFamily: '"SF Mono", "JetBrains Mono", "Fira Code", monospace',
        fontSize: 13,
        lineHeight: 1.6,
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 2fr 72px',
          gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: 600,
          color: '#374151',
          background: '#f9fafb',
        }}
      >
        <span>配置项</span>
        <span>{oldLabel}</span>
        <span>{newLabel}</span>
        <span style={{ textAlign: 'center' }}>变更</span>
      </div>

      {/* Body */}
      {rows.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
          暂无配置差异
        </div>
      )}
      {rows.map((row, idx) => {
        const palette = CHANGE_COLORS[row.change];
        return (
          <div
            key={row.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 2fr 72px',
              gap: 8,
              padding: '10px 12px',
              borderBottom: '1px solid #f0f0f0',
              background: palette.bg,
              transition: 'background 0.15s',
            }}
          >
            {/* Key */}
            <div>
              <div style={{ fontWeight: 500, color: '#111827', wordBreak: 'break-all' }}>
                {row.label}
              </div>
              {row.description && (
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  {row.description}
                </div>
              )}
            </div>

            {/* Old value */}
            <ValueBox value={row.oldValue} dim={row.change === 'added'} />

            {/* New value */}
            <ValueBox value={row.newValue} dim={row.change === 'removed'} />

            {/* Change badge */}
            <div style={{ textAlign: 'center' }}>
              <span
                style={{
                  ...BADGE_BASE,
                  color: '#fff',
                  background: palette.badge,
                }}
              >
                {CHANGE_LABEL[row.change]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ValueBox({ value, dim }: { value: string; dim: boolean }) {
  return (
    <div
      style={{
        background: dim ? 'transparent' : 'rgba(255,255,255,0.6)',
        padding: '4px 8px',
        borderRadius: 4,
        border: dim ? '1px dashed #e5e7eb' : '1px solid #e5e7eb',
        color: dim ? '#d1d5db' : '#1f2937',
        wordBreak: 'break-all',
        minHeight: 26,
        display: 'flex',
        alignItems: 'center',
        fontSize: 12,
      }}
    >
      {value || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>空</span>}
    </div>
  );
}
