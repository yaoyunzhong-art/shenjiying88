'use client';

import React from 'react';

interface CardProps {
  /** Card title (optional header) */
  title?: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** Additional header actions rendered to the right of the title */
  headerActions?: React.ReactNode;
  /** Card body content */
  children?: React.ReactNode;
  /** Visual variant */
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  /** Extra padding override */
  padding?: number | string;
  /** Custom style overrides */
  style?: React.CSSProperties;
  /** Footer content */
  footer?: React.ReactNode;
  /** Test id */
  'data-testid'?: string;
}

const VARIANT_STYLES: Record<CardProps['variant'] & string, React.CSSProperties> = {
  default: {
    background: 'rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  elevated: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
  },
  outlined: {
    background: 'transparent',
    border: '1px solid rgba(148, 163, 184, 0.2)',
  },
  ghost: {
    background: 'transparent',
    border: 'none',
  },
};

/**
 * Card — a reusable glassmorphism card container used across all M5 apps.
 *
 * Encapsulates the common `rgba(15,23,42,…)` + border pattern repeated in 20+ files.
 * Supports optional title header, variant selection, and footer slot.
 */
export function Card({
  title,
  subtitle,
  headerActions,
  children,
  variant = 'default',
  padding = 20,
  style,
  footer,
  'data-testid': dataTestId,
}: CardProps) {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;

  return (
    <div
      data-testid={dataTestId}
      style={{
        borderRadius: 16,
        padding,
        ...variantStyle,
        ...style,
      }}
    >
      {/* Header */}
      {title || subtitle || headerActions ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: subtitle ? 'flex-start' : 'center',
            gap: 12,
            marginBottom: children || footer ? 16 : 0,
          }}
        >
          <div>
            {title ? (
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#f8fafc',
                }}
              >
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <div
                style={{
                  marginTop: title ? 6 : 0,
                  fontSize: 13,
                  color: '#94a3b8',
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
          {headerActions ? <div style={{ flexShrink: 0 }}>{headerActions}</div> : null}
        </div>
      ) : null}

      {/* Body */}
      {children}

      {/* Footer */}
      {footer ? (
        <div
          style={{
            marginTop: children ? 16 : 0,
            paddingTop: 16,
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
