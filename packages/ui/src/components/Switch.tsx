'use client';
import React, { useId } from 'react';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps {
  /** Controlled checked state */
  checked?: boolean;
  /** Default unchecked (uncontrolled) */
  defaultChecked?: boolean;
  /** Called on toggle with new checked value */
  onChange?: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Visual size */
  size?: SwitchSize;
  /** Accessible label rendered next to the switch */
  label?: string;
  /** Label position relative to the switch */
  labelPosition?: 'left' | 'right';
  /** Color when checked */
  checkedColor?: string;
  /** Color when unchecked */
  uncheckedColor?: string;
  /** Thumb color */
  thumbColor?: string;
  /** ARIA label for the switch input (falls back to `label` when set) */
  'aria-label'?: string;
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<SwitchSize, { width: number; height: number; thumb: number; gap: number }> = {
  sm: { width: 34, height: 20, thumb: 14, gap: 3 },
  md: { width: 44, height: 24, thumb: 18, gap: 3 },
  lg: { width: 56, height: 30, thumb: 24, gap: 4 },
};

const DEFAULT_CHECKED_COLOR = '#3b82f6';
const DEFAULT_UNCHECKED_COLOR = '#d1d5db';
const DEFAULT_THUMB_COLOR = '#ffffff';
const FOCUS_RING_COLOR = 'rgba(59, 130, 246, 0.35)';

/**
 * Switch — toggle control for binary settings.
 *
 * Supports controlled / uncontrolled usage, three sizes, custom colors,
 * labels on either side, disabled state, and full ARIA support.
 */
export function Switch({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  labelPosition = 'right',
  checkedColor = DEFAULT_CHECKED_COLOR,
  uncheckedColor = DEFAULT_UNCHECKED_COLOR,
  thumbColor = DEFAULT_THUMB_COLOR,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  className,
  style,
}: SwitchProps) {
  const id = useId();
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  const dims = SIZE_MAP[size];
  const trackBg = isChecked ? checkedColor : uncheckedColor;
  const thumbOffset = isChecked
    ? dims.width - dims.thumb - dims.gap
    : dims.gap;

  const labelElement = label ? (
    <label
      htmlFor={id}
      data-testid={dataTestId ? `${dataTestId}-label` : undefined}
      style={{
        fontSize: size === 'sm' ? 13 : size === 'lg' ? 15 : 14,
        fontWeight: 500,
        color: disabled ? '#9ca3af' : '#1f2937',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        lineHeight: `${dims.height}px`,
      }}
    >
      {label}
    </label>
  ) : null;

  return (
    <div
      data-testid={dataTestId}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      onClick={handleToggle}
    >
      {label && labelPosition === 'left' ? labelElement : null}

      <div
        role="switch"
        aria-checked={isChecked}
        aria-disabled={disabled}
        aria-label={ariaLabel ?? label ?? 'Switch'}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        data-testid={dataTestId ? `${dataTestId}-track` : undefined}
        style={{
          position: 'relative',
          width: dims.width,
          height: dims.height,
          borderRadius: dims.height / 2,
          background: trackBg,
          transition: 'background 0.2s ease',
          outline: 'none',
          flexShrink: 0,
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 2px ${FOCUS_RING_COLOR}`;
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        }}
      >
        <div
          data-testid={dataTestId ? `${dataTestId}-thumb` : undefined}
          style={{
            position: 'absolute',
            top: dims.gap,
            left: thumbOffset,
            width: dims.thumb,
            height: dims.thumb,
            borderRadius: '50%',
            background: thumbColor,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s ease',
          }}
        />
      </div>

      {label && labelPosition === 'right' ? labelElement : null}
    </div>
  );
}
