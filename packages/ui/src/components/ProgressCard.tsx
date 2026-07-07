'use client';
import React from 'react';

export interface ProgressCardProps {
  /** Card title */
  title: string;
  /** Main metric value */
  value: string | number;
  /** Progress value (0-100 or against max) */
  progress: number;
  /** Maximum progress value, default 100 */
  maxProgress?: number;
  /** Short label for the metric (e.g. "¥", "件", "人") */
  unit?: string;
  /** Visual variant for progress bar */
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  /** Optional icon rendered before the title */
  icon?: React.ReactNode;
  /** Extra description line below progress */
  description?: string;
  /** Optional trend arrow */
  trend?: { direction: 'up' | 'down' | 'stable'; label?: string; invert?: boolean };
  /** Click handler for the whole card */
  onClick?: () => void;
  /** Optional footer content */
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

const VARIANT_COLORS: Record<string, { bar: string; bg: string; accent: string; text: string }> = {
  primary: { bar: '#3b82f6', bg: 'rgba(59,130,246,0.10)', accent: '#3b82f6', text: '#1e40af' },
  success: { bar: '#22c55e', bg: 'rgba(34,197,94,0.10)', accent: '#16a34a', text: '#15803d' },
  warning: { bar: '#f59e0b', bg: 'rgba(245,158,11,0.10)', accent: '#d97706', text: '#b45309' },
  danger:  { bar: '#ef4444', bg: 'rgba(239,68,68,0.10)', accent: '#dc2626', text: '#b91c1c' },
};

const TREND_SYMBOLS: Record<string, string> = { up: '▲', down: '▼', stable: '—' };

/**
 * ProgressCard — displays a key metric with an embedded progress bar.
 *
 * Use for completion rates, budget attainment, SLA targets, quota tracking, etc.
 */
export function ProgressCard({
  title,
  value,
  progress,
  maxProgress = 100,
  unit,
  variant = 'primary',
  icon,
  description,
  trend,
  onClick,
  footer,
  className,
  style,
  'data-testid': dataTestId,
}: ProgressCardProps) {
  const colors = VARIANT_COLORS[variant]!;
  const pct = maxProgress > 0 ? Math.min(100, Math.max(0, (progress / maxProgress) * 100)) : 0;
  const isClickable = !!onClick;

  return (
    <div
      data-testid={dataTestId}
      className={className}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px 20px',
        borderRadius: 12,
        background: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        ...style,
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon ? <span style={{ flexShrink: 0, lineHeight: 0 }}>{icon}</span> : null}
        <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', lineHeight: '20px' }}>
          {title}
        </span>
      </div>

      {/* Value + unit */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          data-testid={dataTestId ? `${dataTestId}-value` : undefined}
          style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: '32px', letterSpacing: '-0.02em' }}
        >
          {value}
        </span>
        {unit ? (
          <span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af', marginLeft: 2 }}>
            {unit}
          </span>
        ) : null}
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>进度</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>
            {Math.round(pct)}%
          </span>
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 3, background: colors.bg, overflow: 'hidden' }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 3,
              background: colors.bar,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Description + trend */}
      {description || trend ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {description ? (
            <span style={{ fontSize: 12, color: '#9ca3af', lineHeight: '16px' }}>{description}</span>
          ) : <span />}
          {trend ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: trend.invert
                  ? trend.direction === 'down' ? '#22c55e' : trend.direction === 'up' ? '#ef4444' : '#6b7280'
                  : trend.direction === 'up' ? '#22c55e' : trend.direction === 'down' ? '#ef4444' : '#6b7280',
              }}
            >
              {TREND_SYMBOLS[trend.direction] ?? '—'} {trend.label ?? ''}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Footer */}
      {footer ? <div style={{ marginTop: 4 }}>{footer}</div> : null}
    </div>
  );
}
