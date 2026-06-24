'use client';

import React, { useState, useId, useCallback } from 'react';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps {
  /** Controlled checked state */
  checked?: boolean;
  /** Default unchecked (uncontrolled) */
  defaultChecked?: boolean;
  /** Called when checked state changes */
  onChange?: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Indeterminate state (dash instead of check) */
  indeterminate?: boolean;
  /** Visual size */
  size?: CheckboxSize;
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Error state */
  error?: string;
  /** Value sent with form */
  value?: string;
  /** Form name */
  name?: string;
  /** Whether the checkbox is required */
  required?: boolean;
  /** ARIA label fallback */
  'aria-label'?: string;
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<CheckboxSize, number> = { sm: 14, md: 18, lg: 22 };
const CHECK_MARK_SCALE: Record<CheckboxSize, number> = { sm: 0.7, md: 0.75, lg: 0.78 };

/**
 * Checkbox — binary / indeterminate selection control.
 *
 * Supports controlled/uncontrolled usage, indeterminate state,
 * three sizes, labels, error state, and full keyboard/ARIA support.
 */
export function Checkbox({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  indeterminate = false,
  size = 'md',
  label,
  labelPosition = 'right',
  error,
  value,
  name,
  required = false,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  className,
  style,
}: CheckboxProps) {
  const id = useId();
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const hasError = Boolean(error);
  const boxSize = SIZE_MAP[size];
  const checkSize = Math.round(boxSize * CHECK_MARK_SCALE[size]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  }, [disabled, isChecked, isControlled, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    },
    [disabled, handleToggle],
  );

  const borderColor = disabled
    ? '#d1d5db'
    : hasError
      ? '#ef4444'
      : isChecked || indeterminate
        ? '#3b82f6'
        : '#d1d5db';

  const bgColor = disabled
    ? '#f3f4f6'
    : isChecked || indeterminate
      ? '#3b82f6'
      : '#ffffff';

  // Indeterminate dash
  const dashWidth = Math.round(boxSize * 0.5);
  const dashHeight = 2;

  const labelElement = label ? (
    <label
      htmlFor={id}
      data-testid={dataTestId ? `${dataTestId}-label` : undefined}
      style={{
        fontSize: size === 'sm' ? 13 : size === 'lg' ? 15 : 14,
        color: disabled ? '#9ca3af' : '#1f2937',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        lineHeight: `${boxSize}px`,
      }}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {label}
      {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>
  ) : null;

  const checkMark = indeterminate ? (
    // Dash for indeterminate
    <div
      style={{
        width: dashWidth,
        height: dashHeight,
        borderRadius: 1,
        backgroundColor: disabled ? '#d1d5db' : '#ffffff',
      }}
    />
  ) : isChecked ? (
    // Check mark SVG
    <svg
      width={checkSize}
      height={checkSize}
      viewBox="0 0 12 10"
      fill="none"
      style={{ display: 'block' }}
    >
      <path
        d="M1 5l3 3 7-7"
        stroke={disabled ? '#d1d5db' : '#ffffff'}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

      {/* Hidden native checkbox for form participation */}
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={isChecked}
        disabled={disabled}
        required={required}
        onChange={handleToggle}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Visible box */}
      <div
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : isChecked}
        aria-disabled={disabled}
        aria-label={ariaLabel ?? label ?? 'Checkbox'}
        tabIndex={disabled ? -1 : 0}
        data-testid={dataTestId ? `${dataTestId}-box` : undefined}
        onKeyDown={handleKeyDown}
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: 3,
          border: `1.5px solid ${borderColor}`,
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
          flexShrink: 0,
          outline: 'none',
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 2px rgba(59,130,246,0.25)`;
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        }}
      >
        {checkMark}
      </div>

      {label && labelPosition === 'right' ? labelElement : null}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          data-testid={dataTestId ? `${dataTestId}-error` : undefined}
          style={{
            fontSize: 12,
            color: '#ef4444',
            marginTop: 4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default Checkbox;
