'use client';

import React from 'react';

// ---- Types ----

export type DotVariant = 'filled' | 'outlined' | 'minimal';

export type DotSize = 'sm' | 'md' | 'lg';

export interface DotNavigationProps {
  /** Total number of dots (pages/steps/items). */
  total: number;
  /** 0-based index of the active dot. */
  activeIndex: number;
  /** Callback fired when a dot is clicked. */
  onChange?: (index: number) => void;
  /** Visual variant of the dot. */
  variant?: DotVariant;
  /** Size of each dot. */
  size?: DotSize;
  /** Color for the active dot (CSS color). Defaults to #6366f1 (indigo). */
  activeColor?: string;
  /** Color for inactive dots. Defaults to #d1d5db (gray-300). */
  inactiveColor?: string;
  /** Whether to animate dot transitions. */
  animated?: boolean;
  /** Direction of the dot layout. */
  direction?: 'row' | 'column';
  /** Gap between dots in px. */
  gap?: number;
  /** Whether to show the current position as text (e.g. "2 / 5") below the dots. */
  showCounter?: boolean;
  /** Optional className for external styling. */
  className?: string;
  /** Optional style overrides. */
  style?: React.CSSProperties;
  /** Test id for targeting in tests. */
  'data-testid'?: string;
  /** ARIA label for the navigation region. */
  ariaLabel?: string;
}

// ---- Constants ----

const DOT_SIZE_MAP: Record<DotSize, number> = {
  sm: 6,
  md: 8,
  lg: 12,
};

const DOT_FONT_MAP: Record<DotSize, number> = {
  sm: 10,
  md: 11,
  lg: 12,
};

const ACTIVE_SCALE: Record<DotSize, number> = {
  sm: 1.5,
  md: 1.6,
  lg: 1.4,
};

// ---- DotNavigation Component ----

export function DotNavigation({
  total,
  activeIndex,
  onChange,
  variant = 'filled',
  size = 'md',
  activeColor = '#6366f1',
  inactiveColor = '#d1d5db',
  animated = true,
  direction = 'row',
  gap,
  showCounter = false,
  className,
  style,
  'data-testid': dataTestId,
  ariaLabel = 'Dot navigation',
}: DotNavigationProps) {
  const dotDim = DOT_SIZE_MAP[size];
  const fontDim = DOT_FONT_MAP[size];
  const activeScale = ACTIVE_SCALE[size];

  // Clamp active index to valid range
  const safeIndex = Math.max(0, Math.min(activeIndex, total - 1));

  // Compute dots array for rendering
  const dots = React.useMemo(() => {
    const result: number[] = [];
    for (let i = 0; i < total; i++) {
      result.push(i);
    }
    return result;
  }, [total]);

  const effectiveGap = gap ?? (size === 'sm' ? dotDim : dotDim * 1.5);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: direction,
    alignItems: 'center',
    gap: effectiveGap,
    ...style,
  };

  return (
    <div
      className={className}
      style={containerStyle}
      role="tablist"
      aria-label={ariaLabel}
      data-testid={dataTestId}
    >
      {dots.map((index) => {
        const isActive = index === safeIndex;

        const dotStyle: React.CSSProperties = {
          width: dotDim,
          height: dotDim,
          borderRadius: '50%',
          border: 'none',
          padding: 0,
          cursor: onChange ? 'pointer' : 'default',
          transition: animated
            ? 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        };

        // Variant-specific styles
        switch (variant) {
          case 'filled':
            dotStyle.backgroundColor = isActive ? activeColor : inactiveColor;
            if (isActive) {
              dotStyle.width = dotDim * activeScale;
              dotStyle.height = dotDim;
              dotStyle.borderRadius = dotDim / 2;
            }
            break;
          case 'outlined':
            dotStyle.backgroundColor = isActive ? activeColor : 'transparent';
            dotStyle.border = `1.5px solid ${isActive ? activeColor : inactiveColor}`;
            if (isActive) {
              dotStyle.width = dotDim * activeScale;
            }
            break;
          case 'minimal':
            dotStyle.backgroundColor = isActive ? activeColor : inactiveColor;
            dotStyle.opacity = isActive ? 1 : 0.35;
            dotStyle.transform = isActive ? `scale(${activeScale})` : 'scale(1)';
            break;
        }

        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${ariaLabel} item ${index + 1} of ${total}`}
            data-active={isActive || undefined}
            data-testid={dataTestId ? `${dataTestId}-dot-${index}` : undefined}
            style={dotStyle}
            onClick={() => onChange?.(index)}
            tabIndex={isActive ? 0 : -1}
          />
        );
      })}

      {showCounter && (
        <span
          style={{
            fontSize: fontDim,
            color: '#64748b',
            lineHeight: 1,
            marginLeft: direction === 'row' ? effectiveGap : 0,
            marginTop: direction === 'column' ? effectiveGap : 0,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {safeIndex + 1} / {total}
        </span>
      )}

      {/* Global keyframes for animation */}
      {animated && (
        <style>{`
          @keyframes dot-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(${activeScale * 1.12}); }
          }
        `}</style>
      )}
    </div>
  );
}

export default DotNavigation;
