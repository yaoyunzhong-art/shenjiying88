'use client';

import React from 'react';

export type ChipVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'purple';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps {
  /** Label text or content */
  children?: React.ReactNode;
  /** Color variant */
  variant?: ChipVariant;
  /** Size */
  size?: ChipSize;
  /** Whether the chip is outlined (ghost) style */
  outlined?: boolean;
  /** Whether the chip is disabled */
  disabled?: boolean;
  /** Makes the chip removable, calls onClose when X clicked */
  removable?: boolean;
  /** Callback when remove button clicked */
  onRemove?: () => void;
  /** Callback when the chip itself is clicked */
  onClick?: () => void;
  /** Left icon / avatar element */
  icon?: React.ReactNode;
  /** Optional className */
  className?: string;
  /** Test id */
  'data-testid'?: string;
}

const VARIANT_STYLES: Record<ChipVariant, { bg: string; text: string; border: string; removeHover: string }> = {
  default: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', removeHover: '#cbd5e1' },
  primary: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', removeHover: '#93c5fd' },
  success: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', removeHover: '#86efac' },
  warning: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', removeHover: '#fcd34d' },
  error: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', removeHover: '#fca5a5' },
  info: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc', removeHover: '#67e8f9' },
  neutral: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', removeHover: '#cbd5e1' },
  purple: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', removeHover: '#d8b4fe' },
};

const OUTLINED_STYLES: Record<ChipVariant, { bg: string; text: string; border: string }> = {
  default: { bg: 'transparent', text: '#475569', border: '#94a3b8' },
  primary: { bg: 'transparent', text: '#1d4ed8', border: '#3b82f6' },
  success: { bg: 'transparent', text: '#15803d', border: '#22c55e' },
  warning: { bg: 'transparent', text: '#b45309', border: '#f59e0b' },
  error: { bg: 'transparent', text: '#b91c1c', border: '#ef4444' },
  info: { bg: 'transparent', text: '#0e7490', border: '#06b6d4' },
  neutral: { bg: 'transparent', text: '#64748b', border: '#94a3b8' },
  purple: { bg: 'transparent', text: '#7e22ce', border: '#a855f7' },
};

const SIZE_MAP: Record<ChipSize, { fontSize: number; height: number; px: number; removeSize: number }> = {
  sm: { fontSize: 11, height: 22, px: 6, removeSize: 12 },
  md: { fontSize: 12, height: 28, px: 10, removeSize: 14 },
  lg: { fontSize: 14, height: 34, px: 14, removeSize: 16 },
};

/**
 * Chip — a compact element representing an input, attribute, or action.
 *
 * - `removable`: shows an × button that fires onRemove
 * - `outlined`: ghost / bordered variant with transparent background
 * - `icon`: optional leading icon or avatar
 * - `onClick`: makes the chip interactive
 */
export function Chip({
  children,
  variant = 'default',
  size = 'md',
  outlined = false,
  disabled = false,
  removable = false,
  onRemove,
  onClick,
  icon,
  className,
  'data-testid': dataTestId,
}: ChipProps) {
  const colors = outlined
    ? OUTLINED_STYLES[variant] ?? OUTLINED_STYLES.default
    : VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  const dims = SIZE_MAP[size] ?? SIZE_MAP.md;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: dims.height,
    padding: `0 ${dims.px}px`,
    fontSize: dims.fontSize,
    fontWeight: 500,
    lineHeight: 1,
    color: colors.text,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: dims.height / 2,
    cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    boxSizing: 'border-box',
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onRemove) onRemove();
  };

  const handleClick = () => {
    if (!disabled && onClick) onClick();
  };

  return (
    <span
      data-testid={dataTestId ?? 'chip'}
      className={className}
      style={baseStyle}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={
        onClick && !disabled
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {icon && (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
      {removable && (
        <span
          data-testid={`${dataTestId ?? 'chip'}-remove`}
          role="button"
          tabIndex={0}
          aria-label="Remove"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: dims.removeSize,
            height: dims.removeSize,
            borderRadius: '50%',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: dims.removeSize - 2,
            lineHeight: 1,
            color: 'inherit',
            transition: 'background 0.15s ease',
            flexShrink: 0,
          }}
          onClick={handleRemove}
          onKeyDown={(e: React.KeyboardEvent) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && onRemove) {
              e.preventDefault();
              onRemove();
            }
          }}
        >
          ×
        </span>
      )}
    </span>
  );
}
