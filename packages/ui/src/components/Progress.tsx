'use client';
import React from 'react';

export interface ProgressProps {
  /** Current value (0-100) */
  value: number;
  /** Maximum value, default 100 */
  max?: number;
  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** Show percentage label */
  showLabel?: boolean;
  /** Label format; receives computed percentage number */
  formatLabel?: (pct: number) => string;
  /** Height in px, default 8 */
  height?: number;
  /** Whether to animate the bar width transition */
  animated?: boolean;
  /** Whether to show an indeterminate loading animation (ignores value) */
  indeterminate?: boolean;
  /** ARIA label */
  'aria-label'?: string;
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
}

const VARIANT_COLORS: Record<string, string> = {
  default: '#38bdf8',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#818cf8',
};

const VARIANT_BG: Record<string, string> = {
  default: 'rgba(56, 189, 248, 0.12)',
  success: 'rgba(34, 197, 94, 0.12)',
  warning: 'rgba(245, 158, 11, 0.12)',
  danger: 'rgba(239, 68, 68, 0.12)',
  info: 'rgba(129, 140, 248, 0.12)',
};

const STYLESHEET_ID = 'm5-progress-indeterminate';

function ensureIndeterminateKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLESHEET_ID)) return;
  const style = document.createElement('style');
  style.id = STYLESHEET_ID;
  style.textContent = `
    @keyframes m5-progress-indeterminate-slide {
      0%   { left: -40%; width: 40%; }
      50%  { left: 30%;  width: 40%; }
      100% { left: 100%; width: 40%; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Progress — a reusable progress bar with variants, labels, and indeterminate state.
 *
 * Used across M5 apps for loading indicators, step completion, and resource usage.
 */
export function Progress({
  value,
  max = 100,
  variant = 'default',
  showLabel = true,
  formatLabel,
  height = 8,
  animated = true,
  indeterminate = false,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  className,
  style,
}: ProgressProps) {
  if (typeof window !== 'undefined') {
    ensureIndeterminateKeyframes();
  }

  const clampedValue = Math.max(0, Math.min(value, max));
  const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0;
  const color = VARIANT_COLORS[variant] ?? VARIANT_COLORS.default;
  const bg = VARIANT_BG[variant] ?? VARIANT_BG.default;

  const label = formatLabel ? formatLabel(percentage) : `${percentage}%`;

  return (
    <div
      data-testid={dataTestId}
      className={className}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={indeterminate ? undefined : label}
      aria-label={ariaLabel ?? `Progress: ${indeterminate ? 'loading' : label}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: showLabel ? 6 : 0,
        width: '100%',
        ...style,
      }}
    >
      {/* Label */}
      {showLabel ? (
        <div
          data-testid={dataTestId ? `${dataTestId}-label` : undefined}
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: 13,
            fontWeight: 600,
            color,
          }}
        >
          {label}
        </div>
      ) : null}

      {/* Track */}
      <div
        data-testid={dataTestId ? `${dataTestId}-track` : undefined}
        style={{
          width: '100%',
          height,
          borderRadius: height / 2,
          background: bg,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Fill bar */}
        <div
          data-testid={dataTestId ? `${dataTestId}-fill` : undefined}
          style={{
            height: '100%',
            borderRadius: height / 2,
            background: indeterminate
              ? `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`
              : color,
            width: indeterminate ? '40%' : `${percentage}%`,
            transition: animated && !indeterminate ? 'width 0.3s ease' : undefined,
            position: indeterminate ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            ...(indeterminate
              ? { animation: 'm5-progress-indeterminate-slide 1.5s ease-in-out infinite' }
              : {}),
          }}
        />
      </div>
    </div>
  );
}
