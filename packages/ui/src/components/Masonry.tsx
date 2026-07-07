'use client';

import React, { Children, isValidElement } from 'react';

export interface MasonryProps {
  /** Items to render in the masonry layout */
  children: React.ReactNode;
  /** Number of columns — responsive by breakpoint map or single number (default 3) */
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  /** Gap between items in px (default 16) */
  gap?: number;
  /** Minimum column width in px (when using responsive columns) */
  minColumnWidth?: number;
  /** CSS class name */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
  /** Test id */
  'data-testid'?: string;
}

const BREAKPOINTS = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 };

/**
 * Resolve the column count based on current viewport width and the column config.
 */
function resolveColumns(columns: Exclude<MasonryProps['columns'], undefined | number>): number {
  if (typeof window === 'undefined') return columns.md ?? columns.sm ?? 3;

  const bpKeys = Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[];
  const sorted = bpKeys
    .filter((k) => k in columns && columns[k as keyof typeof columns] != null)
    .sort((a, b) => BREAKPOINTS[a] - BREAKPOINTS[b]);

  const width = window.innerWidth;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const key: keyof typeof BREAKPOINTS = sorted[i] as keyof typeof BREAKPOINTS;
    const val = columns[key];
    if (val != null && width >= BREAKPOINTS[key]) {
      return val;
    }
  }

  return columns.xs ?? 3;
}

/**
 * Masonry — a CSS-columns-based waterfall layout.
 *
 * Renders children into equal-width columns, automatically stacking them
 * by available height. Supports responsive column counts.
 *
 * @example
 * ```tsx
 * <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap={16}>
 *   {items.map(item => <Card key={item.id}>{item.content}</Card>)}
 * </Masonry>
 * ```
 */
export function Masonry({
  children,
  columns = 3,
  gap = 16,
  minColumnWidth: _minColumnWidth,
  className,
  style,
  'data-testid': dataTestId,
}: MasonryProps) {
  // CSS-columns-based masonry (simpler, works great)
  const colCount = typeof columns === 'number' ? columns : resolveColumns(columns);
  const items = Children.toArray(children).filter(isValidElement);

  const containerStyle: React.CSSProperties = {
    columnCount: colCount,
    columnGap: gap,
    ...style,
  };

  const itemStyle: React.CSSProperties = {
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
    marginBottom: gap,
    display: 'inline-block',
    width: '100%',
  };

  return (
    <div
      data-testid={dataTestId ?? 'masonry'}
      className={className}
      style={containerStyle}
    >
      {items.map((item, index) => (
        <div key={index} style={itemStyle}>
          {item}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waterfall sub-component  (JavaScript-driven precise waterfall layout)
// ---------------------------------------------------------------------------

export interface WaterfallMasonryProps extends Omit<MasonryProps, 'columns'> {
  /** Column count (number only for JS-based waterfall) */
  columns?: number;
  /** Whether to animate position changes (default false) */
  animated?: boolean;
}

export interface WaterfallMasonryItem {
  key: string;
  height: number;
  content: React.ReactNode;
}

/**
 * WaterfallMasonry — JavaScript-driven waterfall (Pinterest-style) layout.
 *
 * Places each item into the shortest column, producing a tight waterfall effect.
 * Useful when item heights are known upfront (e.g., from an API).
 */
export function WaterfallMasonry({
  children,
  columns = 3,
  gap = 16,
  className,
  style,
  animated = false,
  'data-testid': dataTestId,
}: WaterfallMasonryProps) {
  // Build column arrays, filling the shortest column each time
  const cols: React.ReactNode[][] = Array.from({ length: columns }, () => []);
  const heights = new Array(columns).fill(0);

  const items = Children.toArray(children).filter(isValidElement);

  items.forEach((item) => {
    const minVal = Math.min(...heights);
    const shortestIdx = heights.indexOf(minVal);
    // shortestIdx is always valid since heights always has items (columns >= 3)
    cols[shortestIdx]!.push(item);
    heights[shortestIdx]! += 1;
  });

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap,
    alignItems: 'flex-start',
    ...style,
  };

  const columnStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap,
    minWidth: 0,
    ...(animated ? { transition: 'all 0.3s ease' } : {}),
  };

  return (
    <div
      data-testid={dataTestId ?? 'waterfall-masonry'}
      className={className}
      style={containerStyle}
    >
      {cols.map((col, colIdx) => (
        <div key={colIdx} style={columnStyle}>
          {col}
        </div>
      ))}
    </div>
  );
}
