'use client';
import React from 'react';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed' | 'dotted';

export interface DividerProps {
  /** Orientation: horizontal (default) or vertical */
  orientation?: DividerOrientation;
  /** Visual style: solid (default), dashed, dotted */
  variant?: DividerVariant;
  /** Color override (default: #d1d5db / gray-300) */
  color?: string;
  /** Thickness in px, default 1 */
  thickness?: number;
  /** Spacing around the divider (CSS margin) */
  spacing?: number | string;
  /** For vertical dividers: height in px or CSS value. Default '1em' */
  height?: number | string;
  /** For horizontal dividers: width in px or CSS value. Default '100%' */
  width?: number | string;
  /** For dashed/dotted: dash length in px, default 4 */
  dashLength?: number;
  /** ARIA label */
  'aria-label'?: string;
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
}

const VARIANT_BORDER_STYLES: Record<DividerVariant, string> = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
};

/**
 * Divider — a horizontal or vertical separator line.
 *
 * Used to visually separate content sections, toolbar groups, or list items.
 */
export function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  color,
  thickness = 1,
  spacing,
  height,
  width,
  dashLength = 4,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  className,
  style,
}: DividerProps) {
  const isHorizontal = orientation === 'horizontal';

  const borderStyle = VARIANT_BORDER_STYLES[variant] ?? 'solid';
  const resolvedColor = color ?? '#d1d5db';

  const resolvedWidth = width ?? (isHorizontal ? '100%' : undefined);
  const resolvedHeight = height ?? (isHorizontal ? undefined : '1em');

  return (
    <div
      data-testid={dataTestId}
      className={className}
      role="separator"
      aria-orientation={orientation}
      aria-label={ariaLabel ?? (isHorizontal ? 'divider' : 'vertical divider')}
      style={{
        ...(isHorizontal ? { width: resolvedWidth } : { height: resolvedHeight }),
        ...(spacing != null
          ? { margin: spacing }
          : isHorizontal
            ? { marginTop: 8, marginBottom: 8 }
            : { marginLeft: 8, marginRight: 8 }),
        border: 'none',
        flexShrink: 0,
        background: 'none',
        borderTop: isHorizontal ? `${thickness}px ${borderStyle} ${resolvedColor}` : undefined,
        borderLeft: !isHorizontal ? `${thickness}px ${borderStyle} ${resolvedColor}` : undefined,
        ...style,
      }}
    />
  );
}
