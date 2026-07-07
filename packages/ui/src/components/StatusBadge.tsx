'use client';

import React from 'react';

type Severity = 'info' | 'warning' | 'error' | 'success';

export interface StatusBadgeProps {
  label: string;
  variant?: Severity | 'neutral' | 'default' | 'pending' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const COLORS: Record<string, { bg: string; text: string; dot?: string }> = {
  info: { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd' },
  warning: { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d' },
  error: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5' },
  success: { bg: 'rgba(34,197,94,0.15)', text: '#86efac' },
  neutral: { bg: 'rgba(148,163,184,0.10)', text: '#94a3b8' },
  default: { bg: 'rgba(148,163,184,0.10)', text: '#cbd5e1' },
  pending: { bg: 'rgba(168,85,247,0.12)', text: '#c4b5fd' },
  danger: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5' },
};

export function StatusBadge({ label, variant = 'default', size = 'md', dot = true }: StatusBadgeProps) {
  const colors: { bg: string; text: string } = COLORS[variant] ?? COLORS.default!;
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: 999,
        background: colors.bg,
        color: colors.text,
        whiteSpace: 'nowrap',
      }}
    >
      {dot ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: colors.text,
            flexShrink: 0,
          }}
        />
      ) : null}
      {label}
    </span>
  );
}

export interface StatusBadgeGroupProps {
  items?: { label: string; variant?: Severity | 'neutral' | 'default' | 'pending' | 'danger' }[];
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export function StatusBadgeGroup({ items, children, size = 'md' }: StatusBadgeGroupProps) {
  if (children) {
    const childArray = Array.isArray(children) ? children : [children];
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{childArray}</div>
    );
  }
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <StatusBadge key={i} label={item.label} variant={item.variant} size={size} />
      ))}
    </div>
  );
}
