'use client';

import React from 'react';

export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple';

export interface TagProps {
  /** Display text */
  children: React.ReactNode;
  /** Color variant */
  variant?: TagVariant;
  /** Size */
  size?: 'sm' | 'md';
  /** Whether the tag can be closed */
  closable?: boolean;
  /** Callback when close icon is clicked */
  onClose?: () => void;
  /** Whether the tag has a border */
  bordered?: boolean;
  /** Optional className for the wrapper */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<TagVariant, { bg: string; text: string; border: string }> = {
  default: { bg: 'rgba(148,163,184,0.10)', text: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
  primary: { bg: 'rgba(59,130,246,0.12)', text: '#93c5fd', border: 'rgba(59,130,246,0.30)' },
  success: { bg: 'rgba(34,197,94,0.12)', text: '#86efac', border: 'rgba(34,197,94,0.30)' },
  warning: { bg: 'rgba(245,158,11,0.12)', text: '#fcd34d', border: 'rgba(245,158,11,0.30)' },
  error:   { bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', border: 'rgba(239,68,68,0.30)' },
  info:    { bg: 'rgba(6,182,212,0.12)', text: '#67e8f9', border: 'rgba(6,182,212,0.30)' },
  purple:  { bg: 'rgba(168,85,247,0.12)', text: '#c4b5fd', border: 'rgba(168,85,247,0.30)' },
};

const CLOSE_ICON = (
  <svg viewBox="0 0 12 12" fill="none" width="10" height="10" aria-hidden="true">
    <path d="M1 1l5 5m0 0l5 5m-5-5L1 11m5-5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function Tag({
  children,
  variant = 'default',
  size = 'md',
  closable = false,
  onClose,
  bordered = false,
  className,
  style,
}: TagProps) {
  const colors = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  const padding = size === 'sm' ? '1px 6px' : '2px 10px';
  const fontSize = size === 'sm' ? 11 : 12;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: 6,
        background: colors.bg,
        color: colors.text,
        border: bordered ? `1px solid ${colors.border}` : '1px solid transparent',
        whiteSpace: 'nowrap',
        lineHeight: '20px',
        ...style,
      }}
    >
      {children}
      {closable && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Remove tag"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            opacity: 0.6,
            flexShrink: 0,
          }}
        >
          {CLOSE_ICON}
        </button>
      )}
    </span>
  );
}

/** Horizontal wrapper with gaps for a group of tags */
export function TagGroup({
  children,
  gap = 6,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap }} role="list">
      {React.Children.map(children, (child, i) => (
        <span key={i} role="listitem">
          {child}
        </span>
      ))}
    </div>
  );
}
