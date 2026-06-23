'use client';

import React, { useState, useCallback, useId } from 'react';

export type InputNumberSize = 'sm' | 'md' | 'lg';

export interface InputNumberProps {
  /** Current value (controlled) */
  value?: number;
  /** Default value (uncontrolled) */
  defaultValue?: number;
  /** Called when value changes */
  onChange?: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment / decrement */
  step?: number;
  /** Decimal precision (0 = integer) */
  precision?: number;
  /** Visual size */
  size?: InputNumberSize;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is read-only */
  readOnly?: boolean;
  /** Label text */
  label?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Unit displayed after the number */
  unit?: string;
  /** Prefix text before the number */
  prefix?: string;
  /** Show stepper buttons */
  showStepper?: boolean;
  /** Allow empty value (displays placeholder) */
  allowEmpty?: boolean;
  /** Width in px (default: 160) */
  width?: number;
  /** Test id */
  'data-testid'?: string;
  /** Input name attribute */
  name?: string;
  /** Auto focus */
  autoFocus?: boolean;
  /** Required indicator */
  required?: boolean;
  /** aria-label */
  'aria-label'?: string;
}

const SIZE_MAP: Record<InputNumberSize, { fontSize: number; padding: number; height: number }> = {
  sm: { fontSize: 13, padding: 4, height: 28 },
  md: { fontSize: 14, padding: 6, height: 34 },
  lg: { fontSize: 16, padding: 8, height: 42 },
};

function clampValue(value: number, min?: number, max?: number): number {
  let clamped = value;
  if (min !== undefined && clamped < min) clamped = min;
  if (max !== undefined && clamped > max) clamped = max;
  return clamped;
}

function formatValue(value: number, precision?: number): string {
  if (precision !== undefined && precision >= 0) {
    return value.toFixed(precision);
  }
  return String(value);
}

function parseValue(str: string, precision?: number): number {
  const parsed = precision !== undefined && precision > 0 ? parseFloat(str) : parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * InputNumber — numeric input with optional stepper buttons.
 *
 * Supports min/max clamping, precision, unit/prefix display,
 * three sizes, and controlled / uncontrolled modes.
 */
export function InputNumber({
  value: valueProp,
  defaultValue,
  onChange,
  min,
  max,
  step = 1,
  precision,
  size = 'md',
  disabled = false,
  readOnly = false,
  label,
  helperText,
  error,
  placeholder,
  unit,
  prefix: prefixText,
  showStepper = true,
  allowEmpty = false,
  width = 160,
  'data-testid': dataTestId,
  name,
  autoFocus = false,
  required = false,
  'aria-label': ariaLabel,
}: InputNumberProps) {
  const generatedId = (() => { try { return useId(); } catch { return 'input-fallback'; } })();
  const id = `input-number-${generatedId}`;

  const initialValue = valueProp !== undefined ? valueProp : (defaultValue ?? (allowEmpty ? NaN : 0));
  const isControlled = valueProp !== undefined;

  const [internalValue, setInternalValue] = useState<number>(initialValue);
  const [focused, setFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>(
    isNaN(initialValue) && allowEmpty ? '' : formatValue(initialValue, precision),
  );

  const currentValue = isControlled ? (valueProp as number) : internalValue;
  const hasError = Boolean(error);

  const emitValue = useCallback(
    (next: number) => {
      const clamped = clampValue(next, min, max);
      if (!isControlled) setInternalValue(clamped);
      setDisplayValue(isNaN(clamped) && allowEmpty ? '' : formatValue(clamped, precision));
      onChange?.(clamped);
    },
    [isControlled, min, max, precision, allowEmpty, onChange],
  );

  // Sync external controlled value
  React.useEffect(() => {
    if (isControlled) {
      const v = valueProp as number;
      setDisplayValue(isNaN(v) && allowEmpty ? '' : formatValue(v, precision));
    }
  }, [isControlled, valueProp, precision, allowEmpty]);

  const handleIncrement = useCallback(() => {
    if (disabled || readOnly) return;
    const base = currentValue ?? 0;
    emitValue(base + step);
  }, [disabled, readOnly, currentValue, step, emitValue]);

  const handleDecrement = useCallback(() => {
    if (disabled || readOnly) return;
    const base = currentValue ?? 0;
    emitValue(base - step);
  }, [disabled, readOnly, currentValue, step, emitValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow empty input when allowEmpty is true
      if (raw === '' && allowEmpty) {
        setDisplayValue('');
        return;
      }
      // Allow typing minus sign and decimal point
      if (raw === '-' || raw === '.' || raw === '-.') {
        setDisplayValue(raw);
        return;
      }
      const parsed = parseValue(raw, precision);
      if (!isNaN(parsed)) {
        setDisplayValue(raw);
      }
    },
    [allowEmpty, precision],
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    // On blur, commit the value
    if (displayValue === '' && allowEmpty) {
      // Keep empty
      return;
    }
    const parsed = parseValue(displayValue, precision);
    if (!isNaN(parsed)) {
      const clamped = clampValue(parsed, min, max);
      if (!isControlled) setInternalValue(clamped);
      setDisplayValue(formatValue(clamped, precision));
      onChange?.(clamped);
    } else {
      // Revert to current value
      setDisplayValue(formatValue(currentValue, precision));
    }
  }, [displayValue, allowEmpty, precision, currentValue, isControlled, min, max, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    },
    [disabled, readOnly, handleIncrement, handleDecrement],
  );

  const canIncrement = max === undefined || (currentValue ?? 0) < max;
  const canDecrement = min === undefined || (currentValue ?? 0) > min;
  const dims = SIZE_MAP[size];

  return (
    <div
      data-testid={dataTestId}
      style={{ display: 'inline-flex', flexDirection: 'column', width }}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          data-testid={dataTestId ? `${dataTestId}-label` : undefined}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: disabled ? '#9ca3af' : hasError ? '#ef4444' : '#374151',
            marginBottom: 4,
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {/* Input + stepper wrapper */}
      <div style={{ display: 'flex', alignItems: 'stretch', height: dims.height }}>
        {/* Decrement button */}
        {showStepper && (
          <button
            type="button"
            aria-label="Decrease value"
            data-testid={dataTestId ? `${dataTestId}-decrement` : undefined}
            onClick={handleDecrement}
            disabled={disabled || readOnly || !canDecrement}
            style={{
              width: dims.height,
              border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
              borderRight: 'none',
              borderRadius: '6px 0 0 6px',
              background: disabled ? '#f3f4f6' : '#ffffff',
              cursor: disabled || readOnly || !canDecrement ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: dims.fontSize + 2,
              color: disabled || !canDecrement ? '#d1d5db' : '#374151',
              padding: 0,
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            −
          </button>
        )}

        {/* Input field */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
            borderLeft: showStepper ? 'none' : `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
            borderRight: showStepper ? 'none' : `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
            background: disabled ? '#f9fafb' : focused ? '#ffffff' : '#ffffff',
            boxShadow: focused && !hasError && !disabled ? '0 0 0 2px rgba(59,130,246,0.12)' : undefined,
          }}
        >
          {/* Prefix */}
          {prefixText && (
            <span
              data-testid={dataTestId ? `${dataTestId}-prefix` : undefined}
              style={{
                position: 'absolute',
                left: dims.padding + 2,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: dims.fontSize,
                color: disabled ? '#d1d5db' : '#6b7280',
                pointerEvents: 'none',
              }}
            >
              {prefixText}
            </span>
          )}
          <input
            id={id}
            name={name}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            autoFocus={autoFocus}
            aria-label={ariaLabel ?? label ?? 'Number input'}
            aria-invalid={hasError}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={currentValue}
            data-testid={dataTestId ? `${dataTestId}-input` : undefined}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: dims.fontSize,
              padding: `0 ${dims.padding}px`,
              paddingLeft: prefixText ? dims.padding + 22 : dims.padding + 2,
              paddingRight: unit ? 26 : dims.padding + 2,
              color: disabled ? '#9ca3af' : '#111827',
              textAlign: 'center',
              lineHeight: `${dims.height}px`,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          {/* Unit */}
          {unit && (
            <span
              data-testid={dataTestId ? `${dataTestId}-unit` : undefined}
              style={{
                position: 'absolute',
                right: dims.padding + 2,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: dims.fontSize - 1,
                color: disabled ? '#d1d5db' : '#6b7280',
                pointerEvents: 'none',
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* Increment button */}
        {showStepper && (
          <button
            type="button"
            aria-label="Increase value"
            data-testid={dataTestId ? `${dataTestId}-increment` : undefined}
            onClick={handleIncrement}
            disabled={disabled || readOnly || !canIncrement}
            style={{
              width: dims.height,
              border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
              borderLeft: 'none',
              borderRadius: '0 6px 0 6px',
              background: disabled ? '#f3f4f6' : '#ffffff',
              cursor: disabled || readOnly || !canIncrement ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: dims.fontSize + 2,
              color: disabled || !canIncrement ? '#d1d5db' : '#374151',
              padding: 0,
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <div
          data-testid={dataTestId ? `${dataTestId}-helper` : undefined}
          style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}
        >
          {helperText}
        </div>
      )}

      {/* Error text */}
      {error && (
        <div
          role="alert"
          data-testid={dataTestId ? `${dataTestId}-error` : undefined}
          style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default InputNumber;
