'use client';

import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple';
export type BadgePlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** The content to display inside the badge (number, text, dot indicator) */
  children?: React.ReactNode;
  /** Color variant */
  variant?: BadgeVariant;
  /** Size */
  size?: BadgeSize;
  /** Placement relative to the wrapping element */
  placement?: BadgePlacement;
  /** Whether to show as a dot (no children displayed) */
  dot?: boolean;
  /** Max count to display (e.g. 99+), only for numeric children */
  overflowCount?: number;
  /** Whether the badge is visible */
  visible?: boolean;
  /** Offset adjustment from default position, e.g. { x: 2, y: -2 } */
  offset?: { x?: number; y?: number };
  /** Show badge as standalone (not overlapping) */
  standalone?: boolean;
  /** Optional className for the wrapper */
  className?: string;
  /** Test id */
  'data-testid'?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: { bg: '#94a3b8', text: '#ffffff', border: '#ffffff' },
  primary: { bg: '#3b82f6', text: '#ffffff', border: '#ffffff' },
  success: { bg: '#22c55e', text: '#ffffff', border: '#ffffff' },
  warning: { bg: '#f59e0b', text: '#ffffff', border: '#ffffff' },
  error: { bg: '#ef4444', text: '#ffffff', border: '#ffffff' },
  info: { bg: '#06b6d4', text: '#ffffff', border: '#ffffff' },
  purple: { bg: '#a855f7', text: '#ffffff', border: '#ffffff' },
};

const SIZE_MAP: Record<
  BadgeSize,
  { dotSize: number; badgeMinW: number; fontSize: number; padding: string }
> = {
  sm: { dotSize: 8, badgeMinW: 16, fontSize: 10, padding: '0 4px' },
  md: { dotSize: 10, badgeMinW: 20, fontSize: 11, padding: '0 5px' },
  lg: { dotSize: 12, badgeMinW: 24, fontSize: 12, padding: '0 6px' },
};

const PLACEMENT_STYLES: Record<BadgePlacement, React.CSSProperties> = {
  'top-right': { top: 0, right: 0, transform: 'translate(50%, -50%)' },
  'top-left': { top: 0, left: 0, transform: 'translate(-50%, -50%)' },
  'bottom-right': { bottom: 0, right: 0, transform: 'translate(50%, 50%)' },
  'bottom-left': { bottom: 0, left: 0, transform: 'translate(-50%, 50%)' },
};

/**
 * Badge — a numeric indicator, status dot, or content badge typically
 * overlaid on another UI element.
 *
 * - `dot`: renders a small colored circle without content
 * - `overflowCount`: clamps displayed number, e.g. overflowCount=99 renders "99+"
 * - `standalone`: renders as a normal inline element without absolute positioning
 */
export function Badge({
  children,
  variant = 'error',
  size = 'md',
  placement = 'top-right',
  dot = false,
  overflowCount = 99,
  visible = true,
  offset,
  standalone = false,
  className,
  'data-testid': dataTestId,
}: BadgeProps) {
  if (!visible) return null;
  const colors = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  const dims = SIZE_MAP[size] ?? SIZE_MAP.md;

  // Format display content
  const displayContent = React.useMemo(() => {
    if (dot || !children) return null;
    const num = Number(children);
    if (!Number.isNaN(num) && num > overflowCount) {
      return `${overflowCount}+`;
    }
    return children;
  }, [children, dot, overflowCount]);

  const badgeElement = (
    <span
      data-testid={dataTestId ?? 'badge'}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: dot ? dims.dotSize : dims.badgeMinW,
        height: dot ? dims.dotSize : dims.badgeMinW,
        padding: dot ? 0 : dims.padding,
        fontSize: dims.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        color: colors.text,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: Math.max(dims.badgeMinW, dims.dotSize) / 2,
        boxSizing: 'content-box',
        pointerEvents: 'none',
        userSelect: 'none',
        ...(standalone
          ? {}
          : {
              position: 'absolute' as const,
              ...PLACEMENT_STYLES[placement],
              ...(offset
                ? {
                    transform: `translate(calc(50% + ${offset.x ?? 0}px), calc(-50% + ${offset.y ?? 0}px))`,
                  }
                : {}),
            }),
      }}
    >
      {!dot && displayContent}
    </span>
  );

  if (standalone) return badgeElement;

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {badgeElement}
    </span>
  );
}
