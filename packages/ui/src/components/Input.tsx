'use client';

import React, { useState, useId, useCallback, type InputHTMLAttributes } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outline' | 'filled' | 'underline';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Visual size */
  size?: InputSize;
  /** Visual variant */
  variant?: InputVariant;
  /** Label text rendered above the input */
  label?: string;
  /** Helper / hint text below the input */
  helperText?: string;
  /** Error message — when set, displays error styling */
  error?: string;
  /** Whether the input is in a loading state */
  loading?: boolean;
  /** Icon / content before the input value */
  prefix?: React.ReactNode;
  /** Icon / content after the input value */
  suffix?: React.ReactNode;
  /** Show a clear button when value is non-empty */
  allowClear?: boolean;
  /** Called when the clear button is clicked */
  onClear?: () => void;
  /** Show character count (when maxLength is set) */
  showCount?: boolean;
  /** Make the input fill its container width */
  block?: boolean;
  /** Test id */
  'data-testid'?: string;
  /** aria-label fallback when no label */
  'aria-label'?: string;
}

const SIZE_MAP: Record<InputSize, { fontSize: number; paddingY: number; paddingX: number }> = {
  sm: { fontSize: 13, paddingY: 4, paddingX: 8 },
  md: { fontSize: 14, paddingY: 6, paddingX: 10 },
  lg: { fontSize: 16, paddingY: 8, paddingX: 12 },
};

const VARIANT_STYLES: Record<InputVariant, (focused: boolean, hasError: boolean, disabled: boolean) => React.CSSProperties> = {
  outline: (focused, hasError, disabled) => ({
    border: `1px solid ${
      disabled ? '#d1d5db' : hasError ? '#ef4444' : focused ? '#3b82f6' : '#d1d5db'
    }`,
    background: disabled ? '#f9fafb' : '#ffffff',
    borderRadius: 6,
    boxShadow: focused && !hasError && !disabled ? '0 0 0 3px rgba(59,130,246,0.12)' : undefined,
  }),
  filled: (focused, hasError, disabled) => ({
    border: `1px solid ${
      disabled ? '#e5e7eb' : hasError ? '#ef4444' : focused ? '#3b82f6' : 'transparent'
    }`,
    background: disabled ? '#f3f4f6' : focused ? '#ffffff' : '#f3f4f6',
    borderRadius: 6,
  }),
  underline: (focused, hasError, disabled) => ({
    border: 'none',
    borderBottom: `2px solid ${
      disabled ? '#d1d5db' : hasError ? '#ef4444' : focused ? '#3b82f6' : '#d1d5db'
    }`,
    background: 'transparent',
    borderRadius: 0,
  }),
};

/**
 * Input — accessible, controlled/uncontrolled text input.
 *
 * Supports labels, helper text, error state, prefix/suffix,
 * clear button, character count, loading state, three sizes
 * and three visual variants.
 */
export const Input = React.memo(function Input({
  size = 'md',
  variant = 'outline',
  label,
  helperText,
  error,
  loading = false,
  prefix,
  suffix,
  allowClear = false,
  onClear,
  showCount = false,
  block = false,
  disabled = false,
  readOnly = false,
  value: valueProp,
  defaultValue,
  onChange,
  maxLength,
  id: idProp,
  className,
  style,
  placeholder,
  type = 'text',
  name,
  required,
  autoFocus,
  autoComplete,
  min,
  max,
  step,
  pattern,
  inputMode,
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = valueProp !== undefined;
  const value = isControlled ? (valueProp as string) : internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
    },
    [isControlled, onChange],
  );

  const handleClear = useCallback(() => {
    if (disabled || readOnly) return;
    if (!isControlled) setInternalValue('');
    onClear?.();
    // synthetic change event for controlled usage
    onChange?.({
      target: { value: '', name: name ?? '', type: 'text' },
    } as React.ChangeEvent<HTMLInputElement>);
  }, [disabled, readOnly, isControlled, onClear, onChange, name]);

  const hasError = Boolean(error);
  const hasValue = value !== undefined && value !== '';
  const showClearBtn = allowClear && hasValue && !disabled && !readOnly;
  const charCount = maxLength !== undefined ? String(value ?? '').length : 0;

  const dims = SIZE_MAP[size];
  const variantStyle = VARIANT_STYLES[variant](focused, hasError, disabled);

  const inputStyle: React.CSSProperties = {
    fontSize: dims.fontSize,
    padding: `${dims.paddingY}px ${dims.paddingX}px`,
    paddingLeft: prefix ? dims.paddingX + 20 : dims.paddingX,
    paddingRight: suffix || showClearBtn ? dims.paddingX + 20 : dims.paddingX,
    width: '100%',
    outline: 'none',
    border: 'none',
    background: 'transparent',
    color: disabled ? '#9ca3af' : '#111827',
    lineHeight: 1.5,
    ...variantStyle,
  };

  return (
    <div
      data-testid={dataTestId}
      className={className}
      style={{
        display: block ? 'block' : 'inline-block',
        width: block ? '100%' : undefined,
        ...style,
      }}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          data-testid={dataTestId ? `${dataTestId}-label` : undefined}
          style={{
            display: 'block',
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

      {/* Input wrapper */}
      <div style={{ position: 'relative', display: 'inline-flex', width: '100%' }}>
        {/* Prefix */}
        {prefix && (
          <span
            data-testid={dataTestId ? `${dataTestId}-prefix` : undefined}
            style={{
              position: 'absolute',
              left: dims.paddingX,
              top: '50%',
              transform: 'translateY(-50%)',
              color: disabled ? '#d1d5db' : '#9ca3af',
              fontSize: dims.fontSize,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {prefix}
          </span>
        )}

        <input
          id={id}
          ref={undefined}
          type={type}
          name={name}
          {...(isControlled ? { value: (valueProp ?? '') as string } : { defaultValue })}
          onChange={handleChange}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-label={ariaLabel ?? label ?? 'Input'}
          aria-invalid={hasError}
          aria-describedby={
            [helperText && `${id}-helper`, error && `${id}-error`]
              .filter(Boolean)
              .join(' ') || undefined
          }
          data-testid={dataTestId ? `${dataTestId}-input` : undefined}
          {...rest}
          style={inputStyle}
        />

        {/* Clear button */}
        {showClearBtn && (
          <button
            type="button"
            aria-label="Clear input"
            data-testid={dataTestId ? `${dataTestId}-clear` : undefined}
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: suffix ? dims.paddingX + 18 : dims.paddingX,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              fontSize: 14,
              color: '#9ca3af',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ✕
          </button>
        )}

        {/* Suffix */}
        {suffix && (
          <span
            data-testid={dataTestId ? `${dataTestId}-suffix` : undefined}
            style={{
              position: 'absolute',
              right: showClearBtn ? dims.paddingX + 22 : dims.paddingX,
              top: '50%',
              transform: 'translateY(-50%)',
              color: disabled ? '#d1d5db' : '#9ca3af',
              fontSize: dims.fontSize,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {suffix}
          </span>
        )}

        {/* Loading spinner */}
        {loading && (
          <span
            data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
            style={{
              position: 'absolute',
              right: dims.paddingX,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            ⟳
          </span>
        )}
      </div>

      {/* Character count */}
      {showCount && maxLength !== undefined && (
        <div
          data-testid={dataTestId ? `${dataTestId}-count` : undefined}
          style={{
            textAlign: 'right',
            fontSize: 12,
            color: charCount > maxLength * 0.9 ? '#ef4444' : '#9ca3af',
            marginTop: 2,
          }}
        >
          {charCount}/{maxLength}
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <div
          id={`${id}-helper`}
          data-testid={dataTestId ? `${dataTestId}-helper` : undefined}
          style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}
        >
          {helperText}
        </div>
      )}

      {/* Error text */}
      {error && (
        <div
          id={`${id}-error`}
          role="alert"
          data-testid={dataTestId ? `${dataTestId}-error` : undefined}
          style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}
        >
          {error}
        </div>
      )}
    </div>
  );
});

export default Input;
