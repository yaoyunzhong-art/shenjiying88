'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ---- Types ----

export interface MonthPickerProps {
  /** Current value (ISO 8601 month string YYYY-MM) */
  value?: string;
  /** Value change callback */
  onChange?: (value: string) => void;
  /** Minimum month (YYYY-MM) */
  min?: string;
  /** Maximum month (YYYY-MM) */
  max?: string;
  /** Whether disabled */
  disabled?: boolean;
  /** Required */
  required?: boolean;
  /** Label */
  label?: string;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Placeholder */
  placeholder?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Custom class name */
  className?: string;
  /** Month name labels (default: 1月…12月) */
  monthLabels?: string[];
  /** Start year for year dropdown (default: current year - 10) */
  startYear?: number;
  /** End year for year dropdown (default: current year + 10) */
  endYear?: number;
}

// ---- Defaults ----

const DEFAULT_MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

// ---- Helpers ----

function parseMonth(str: string): { year: number; month: number } | null {
  const [yearStr, monthStr] = str.split('-');
  if (!yearStr || !monthStr) return null;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) return null;
  return { year, month };
}

function formatMonth(year: number, month: number): string {
  const m = String(month + 1).padStart(2, '0');
  return `${year}-${m}`;
}

function getMonthBounds(
  minStr?: string,
  maxStr?: string
): { minYear: number; minMonth: number; maxYear: number; maxMonth: number } | null {
  const min = minStr ? parseMonth(minStr!) : null;
  const max = maxStr ? parseMonth(maxStr!) : null;
  return {
    minYear: min?.year ?? -Infinity,
    minMonth: min?.month ?? 0,
    maxYear: max?.year ?? Infinity,
    maxMonth: max?.month ?? 11,
  };
}

function isDisabled(
  year: number,
  month: number,
  bounds: { minYear: number; minMonth: number; maxYear: number; maxMonth: number }
): boolean {
  if (year < bounds.minYear) return true;
  if (year === bounds.minYear && month < bounds.minMonth) return true;
  if (year > bounds.maxYear) return true;
  if (year === bounds.maxYear && month > bounds.maxMonth) return true;
  return false;
}

const popoverBaseStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1050,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  padding: 16,
  marginTop: 4,
  minWidth: 280,
};

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  lineHeight: 1.5,
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'pointer',
  background: '#fff',
  color: '#1e293b',
};

// ---- Component ----

export function MonthPicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  label,
  error,
  helpText,
  placeholder = '选择月份',
  style,
  className,
  monthLabels = DEFAULT_MONTH_LABELS,
  startYear,
  endYear,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const effectiveStartYear = startYear ?? currentYear - 10;
  const effectiveEndYear = endYear ?? currentYear + 10;

  const parsed = value ? parseMonth(value) : null;
  const [viewYear, setViewYear] = useState(parsed?.year ?? currentYear);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view year when value changes
  useEffect(() => {
    if (parsed) setViewYear(parsed.year);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const bounds = useMemo(() => getMonthBounds(min, max), [min, max]);

  const handleSelect = useCallback(
    (month: number) => {
      if (!bounds) return;
      if (isDisabled(viewYear, month, bounds)) return;
      const newVal = formatMonth(viewYear, month);
      setOpen(false);
      onChange?.(newVal);
    },
    [viewYear, bounds, onChange]
  );

  const handlePrevYear = useCallback(() => {
    setViewYear((y) => y - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setViewYear((y) => y + 1);
  }, []);

  const handleYearSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewYear(parseInt(e.target.value, 10));
  }, []);

  // Input display value
  const displayValue = parsed
    ? `${parsed.year}年${monthLabels[parsed.month]}`
    : '';

  const hasError = !!error;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', ...style }}
      className={className}
    >
      {/* Label */}
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: 4,
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {/* Input trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label ? `${label}, ${displayValue || placeholder}` : displayValue || placeholder}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setOpen((o) => !o);
          }
        }}
        style={{
          ...inputBaseStyle,
          borderColor: hasError ? '#ef4444' : open ? '#3b82f6' : '#d1d5db',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {displayValue || (
          <span style={{ color: '#9ca3af' }}>{placeholder}</span>
        )}
        <span
          style={{
            float: 'right',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
            color: '#6b7280',
          }}
        >
          ▼
        </span>
      </div>

      {/* Error */}
      {hasError && (
        <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</div>
      )}

      {/* Help */}
      {!hasError && helpText && (
        <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>{helpText}</div>
      )}

      {/* Popover */}
      {open && (
        <div style={popoverBaseStyle}>
          {/* Header: Year navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              aria-label="上一年"
              onClick={handlePrevYear}
              style={{
                background: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#475569',
              }}
            >
              ‹
            </button>

            <select
              value={viewYear}
              onChange={handleYearSelect}
              style={{
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#1e293b',
                textAlign: 'center',
              }}
              aria-label="选择年份"
            >
              {Array.from(
                { length: effectiveEndYear - effectiveStartYear + 1 },
                (_, i) => effectiveStartYear + i
              ).map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-label="下一年"
              onClick={handleNextYear}
              style={{
                background: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#475569',
              }}
            >
              ›
            </button>
          </div>

          {/* Month Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {monthLabels.map((label, idx) => {
              const isSelected = parsed?.year === viewYear && parsed.month === idx;
              const isDisabledMonth = bounds ? isDisabled(viewYear, idx, bounds) : false;
              const isHovered = hoveredMonth === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabledMonth}
                  aria-label={`${viewYear}年${label}`}
                  aria-selected={isSelected}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setHoveredMonth(idx)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  style={{
                    padding: '10px 4px',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: isDisabledMonth ? 'not-allowed' : 'pointer',
                    background: isSelected
                      ? '#3b82f6'
                      : isHovered
                      ? '#eff6ff'
                      : 'transparent',
                    color: isSelected
                      ? '#fff'
                      : isDisabledMonth
                      ? '#d1d5db'
                      : '#1e293b',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {value && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onChange?.('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                清除
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
