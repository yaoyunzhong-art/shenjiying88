'use client';
import React, { useState, useCallback } from 'react';

export interface RatingProps {
  /** Current rating value (0 to max). */
  value?: number;
  /** Maximum rating value (number of stars). */
  max?: number;
  /** Star size in pixels. */
  size?: number;
  /** Active star color. */
  activeColor?: string;
  /** Inactive star color. */
  inactiveColor?: string;
  /** Allow user to change the rating. When false, stars are read-only. */
  interactive?: boolean;
  /** Called when the user selects a rating. */
  onChange?: (value: number) => void;
  /** Show numeric label next to stars (e.g. "4.2"). */
  showValue?: boolean;
  /** Custom label format; receives current value. */
  formatLabel?: (value: number, max: number) => string;
  /** Tooltip / title per star index (1-based). */
  starLabels?: string[];
  /** Allow half-star precision. */
  half?: boolean;
  /** Accessible name for the rating group. */
  'aria-label'?: string;
  /** Test id. */
  'data-testid'?: string;
  /** Extra class name. */
  className?: string;
  /** Inline style overrides. */
  style?: React.CSSProperties;
}

const DEFAULT_STAR_LABELS = ['很差', '较差', '一般', '好', '很好'];

/**
 * Rating — a reusable star-rating component supporting half-star precision,
 * interactive selection, and read-only display modes.
 *
 * Used across M5 apps for product reviews, member satisfaction scoring, and
 * service quality evaluation.
 */
export function Rating({
  value = 0,
  max = 5,
  size = 24,
  activeColor = '#f59e0b',
  inactiveColor = '#d4d4d8',
  interactive = true,
  onChange,
  showValue = true,
  formatLabel,
  starLabels = DEFAULT_STAR_LABELS,
  half = false,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  className,
  style,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [internalValue, setInternalValue] = useState(value);

  const currentValue = interactive ? (hoverValue ?? internalValue) : value;
  const safeValue = Math.max(0, Math.min(currentValue, max));

  const handleClick = useCallback(
    (starIndex: number, event: React.MouseEvent) => {
      if (!interactive) return;
      let newValue: number;

      if (half) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const isHalf = x < rect.width / 2;
        newValue = isHalf ? starIndex + 0.5 : starIndex + 1;
      } else {
        newValue = starIndex + 1;
      }

      setInternalValue(newValue);
      onChange?.(newValue);
    },
    [interactive, half, onChange],
  );

  const handleMouseEnter = useCallback(
    (starIndex: number, event: React.MouseEvent) => {
      if (!interactive || !half) {
        setHoverValue(starIndex + 1);
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const isHalf = x < rect.width / 2;
      setHoverValue(isHalf ? starIndex + 0.5 : starIndex + 1);
    },
    [interactive, half],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverValue(null);
  }, []);

  const displayValue = hoverValue ?? internalValue;

  const renderStar = (starIndex: number) => {
    const fillRatio = Math.min(1, Math.max(0, displayValue - starIndex));
    const isHalfFilled = half && fillRatio > 0 && fillRatio < 1;
    const isFilled = fillRatio >= 1;

    const label = starLabels?.[starIndex] ?? `${starIndex + 1} star${starIndex > 0 ? 's' : ''}`;

    return (
      <span
        key={starIndex}
        role="radio"
        aria-checked={isFilled}
        aria-label={label}
        tabIndex={interactive ? 0 : -1}
        data-testid={dataTestId ? `${dataTestId}-star-${starIndex}` : undefined}
        data-star-index={starIndex}
        data-filled={isFilled ? 'true' : 'false'}
        data-half={isHalfFilled ? 'true' : 'false'}
        onClick={(e) => handleClick(starIndex, e)}
        onMouseMove={(e) => handleMouseEnter(starIndex, e)}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setInternalValue(starIndex + 1);
            onChange?.(starIndex + 1);
          }
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.min(starIndex + 1, max - 1);
            setHoverValue(next + 1);
            setInternalValue(next + 1);
            onChange?.(next + 1);
          }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = Math.max(starIndex - 1, 0);
            setHoverValue(prev + 1);
            setInternalValue(prev + 1);
            onChange?.(prev + 1);
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          cursor: interactive ? 'pointer' : 'default',
          position: 'relative',
          outline: 'none',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          aria-hidden="true"
          style={{ display: 'block' }}
        >
          {half ? (
            <>
              {/* Background star (inactive) */}
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={inactiveColor}
              />
              {/* Filled portion */}
              {fillRatio > 0 && (
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={activeColor}
                  clipPath={`url(#rating-half-clip-${starIndex})`}
                />
              )}
            </>
          ) : (
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={isFilled ? activeColor : inactiveColor}
            />
          )}
          {half && (
            <defs>
              <clipPath id={`rating-half-clip-${starIndex}`}>
                <rect x="0" y="0" width={fillRatio * 24} height="24" />
              </clipPath>
            </defs>
          )}
        </svg>
      </span>
    );
  };

  const label = formatLabel
    ? formatLabel(safeValue, max)
    : `${safeValue} / ${max}`;

  return (
    <div
      data-testid={dataTestId}
      className={className}
      role="radiogroup"
      aria-label={ariaLabel ?? '评分'}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        ...style,
      }}
    >
      {Array.from({ length: max }, (_, i) => renderStar(i))}

      {showValue && (
        <span
          data-testid={dataTestId ? `${dataTestId}-label` : undefined}
          style={{
            marginLeft: 8,
            fontSize: 14,
            fontWeight: 600,
            color: activeColor,
            minWidth: 50,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
