'use client';

import React, { useState, useCallback } from 'react';

interface SearchFilterInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  debounceMs?: number;
  /** 显示清空按钮（默认 true） */
  clearable?: boolean;
  /** 宽度覆盖 */
  width?: number | string;
  /** 禁用状态 */
  disabled?: boolean;
}

export function useSearchFilter(initialValue = '', debounceMs = 300) {
  const [rawValue, setRawValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  const setValue = useCallback(
    (value: string) => {
      setRawValue(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setDebouncedValue(value), debounceMs);
    },
    [debounceMs]
  );

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { value: rawValue, debouncedValue, setValue };
}

export function SearchFilterInput({
  value,
  onChange,
  onKeyDown,
  placeholder = 'Search...',
  debounceMs = 300,
  clearable = true,
  width = 260,
  disabled = false,
}: SearchFilterInputProps) {
  const { value: localValue, setValue } = useSearchFilter(value, debounceMs);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasValue = localValue.length > 0;

  React.useEffect(() => {
    onChange(localValue);
  }, [localValue, onChange]);

  const handleClear = useCallback(() => {
    setValue('');
    inputRef.current?.focus();
  }, [setValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && hasValue) {
        e.preventDefault();
        handleClear();
      }
      onKeyDown?.(e);
    },
    [hasValue, handleClear, onKeyDown]
  );

  const inputPaddingRight = clearable && hasValue ? 36 : 12;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* 搜索图标 */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <path
          d="M7 1a6 6 0 1 0 3.47 10.88l3.32 3.33a.75.75 0 1 0 1.06-1.06l-3.32-3.33A6 6 0 0 0 7 1Zm-4.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"
          fill="#64748b"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          padding: `8px ${inputPaddingRight}px 8px 36px`,
          fontSize: 14,
          borderRadius: 8,
          border: '1px solid rgba(148,163,184,0.18)',
          background: disabled ? 'rgba(15,23,42,0.2)' : 'rgba(15,23,42,0.4)',
          color: disabled ? '#64748b' : '#e2e8f0',
          outline: 'none',
          width,
          transition: 'border-color 0.15s',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => {
          if (!disabled) (e.target as HTMLInputElement).style.borderColor = 'rgba(96,165,250,0.4)';
        }}
        onBlur={(e) => {
          (e.target as HTMLInputElement).style.borderColor = 'rgba(148,163,184,0.18)';
        }}
      />
      {/* 清空按钮 */}
      {clearable && hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="清空搜索"
          title="清空 (Esc)"
          style={{
            position: 'absolute',
            right: 6,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            padding: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
          }}
        >
          {/* X 图标 */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M10.03 3.97a.75.75 0 0 1 0 1.06L8.06 7l1.97 1.97a.75.75 0 1 1-1.06 1.06L7 8.06l-1.97 1.97a.75.75 0 0 1-1.06-1.06L5.94 7 3.97 5.03a.75.75 0 0 1 1.06-1.06L7 5.94l1.97-1.97a.75.75 0 0 1 1.06 0Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
