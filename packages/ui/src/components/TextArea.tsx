'use client';

import React, { useState, useId, useCallback, useRef, useEffect, type TextareaHTMLAttributes } from 'react';

export type TextAreaSize = 'sm' | 'md' | 'lg';
export type TextAreaResize = 'none' | 'both' | 'horizontal' | 'vertical';

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'value'> {
  value?: string;
  /** Visual size */
  size?: TextAreaSize;
  /** Label text rendered above the textarea */
  label?: string;
  /** Helper / hint text below the textarea */
  helperText?: string;
  /** Error message — when set, displays error styling */
  error?: string;
  /** Whether the textarea is in a loading state */
  loading?: boolean;
  /** Show character count (when maxLength is set) */
  showCount?: boolean;
  /** Make the textarea fill its container width */
  block?: boolean;
  /** Auto-resize height as content grows */
  autoSize?: boolean;
  /** Minimum rows when autoSize is true */
  minRows?: number;
  /** Maximum rows when autoSize is true (scroll beyond this) */
  maxRows?: number;
  /** Resize CSS property */
  resize?: TextAreaResize;
  /** Test id */
  'data-testid'?: string;
  /** aria-label fallback when no label */
  'aria-label'?: string;
}

const SIZE_MAP: Record<TextAreaSize, { fontSize: number; paddingY: number; paddingX: number }> = {
  sm: { fontSize: 13, paddingY: 4, paddingX: 8 },
  md: { fontSize: 14, paddingY: 6, paddingX: 10 },
  lg: { fontSize: 16, paddingY: 8, paddingX: 12 },
};

function computeResize(resize: TextAreaResize): React.CSSProperties['resize'] {
  switch (resize) {
    case 'none': return 'none';
    case 'both': return 'both';
    case 'horizontal': return 'horizontal';
    case 'vertical': return 'vertical';
  }
}

export function TextArea({
  size = 'md',
  label,
  helperText,
  error,
  loading = false,
  showCount = false,
  block = false,
  autoSize = false,
  minRows = 3,
  maxRows = 10,
  resize = 'vertical',
  className = '',
  disabled = false,
  placeholder,
  value,
  defaultValue,
  onChange,
  maxLength,
  id: externalId,
  'data-testid': dataTestId = 'textarea',
  'aria-label': ariaLabel,
  ...rest
}: TextAreaProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const currentValue = String(isControlled ? value : internalValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dims = SIZE_MAP[size];
  const hasError = !!error;

  // Auto-resize logic
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el || !autoSize) return;
    el.style.height = 'auto';
    const lineHeight = dims.fontSize * 1.5;
    const minH = lineHeight * minRows + dims.paddingY * 2 + 2;
    const maxH = lineHeight * maxRows + dims.paddingY * 2 + 2;
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.min(Math.max(scrollH, minH), maxH)}px`;
  }, [autoSize, minRows, maxRows, dims]);

  useEffect(() => {
    if (autoSize) adjustHeight();
  }, [currentValue, autoSize, adjustHeight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
      if (autoSize) {
        requestAnimationFrame(adjustHeight);
      }
    },
    [isControlled, onChange, autoSize, adjustHeight],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setFocused(true);
      rest.onFocus?.(e);
    },
    [rest.onFocus],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setFocused(false);
      rest.onBlur?.(e);
    },
    [rest.onBlur],
  );

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 4,
    width: block ? '100%' : undefined,
    fontFamily: 'system-ui, sans-serif',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    fontSize: dims.fontSize,
    padding: `${dims.paddingY}px ${dims.paddingX}px`,
    border: `1px solid ${
      disabled ? '#d1d5db' : hasError ? '#ef4444' : focused ? '#3b82f6' : '#d1d5db'
    }`,
    borderRadius: 6,
    outline: 'none',
    backgroundColor: disabled ? '#f3f4f6' : '#fff',
    color: disabled ? '#9ca3af' : '#1f2937',
    resize: computeResize(resize),
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    boxShadow: focused && !hasError ? '0 0 0 2px rgba(59,130,246,0.15)' : undefined,
    fontFamily: 'inherit',
    lineHeight: 1.5,
    minHeight: 60,
  };

  return (
    <div
      className={`text-area-wrapper ${className}`}
      style={containerStyle}
      data-testid={`${dataTestId}-wrapper`}
    >
      {label && (
        <label
          htmlFor={id}
          data-testid={`${dataTestId}-label`}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: disabled ? '#9ca3af' : '#374151',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {loading && (
          <div
            data-testid={`${dataTestId}-loading`}
            style={{
              position: 'absolute',
              right: 8,
              top: dims.paddingY + 4,
              width: 14,
              height: 14,
              border: '2px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spinner-spin 0.6s linear infinite',
              zIndex: 1,
            }}
          />
        )}

        <textarea
          ref={textareaRef}
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          value={isControlled ? value : undefined}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          aria-label={ariaLabel ?? (label ? undefined : placeholder)}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || error ? `${id}-helper` : undefined}
          data-testid={dataTestId}
          style={textareaStyle}
          {...rest}
        />
      </div>

      {/* Bottom row: helper/error + character count */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          {error ? (
            <div
              id={`${id}-helper`}
              data-testid={`${dataTestId}-error`}
              style={{ fontSize: 12, color: '#ef4444' }}
            >
              {error}
            </div>
          ) : helperText ? (
            <div
              id={`${id}-helper`}
              data-testid={`${dataTestId}-helper`}
              style={{ fontSize: 12, color: '#6b7280' }}
            >
              {helperText}
            </div>
          ) : null}
        </div>

        {showCount && maxLength && (
          <div
            data-testid={`${dataTestId}-count`}
            style={{
              fontSize: 12,
              color: currentValue.length > maxLength ? '#ef4444' : '#9ca3af',
              whiteSpace: 'nowrap',
            }}
          >
            {currentValue.length}/{maxLength}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spinner-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
