'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ---- Types ----

export interface YearPickerProps {
  /** Current value (ISO 8601 year string YYYY) */
  value?: string;
  /** Value change callback */
  onChange?: (value: string) => void;
  /** Minimum year (YYYY) */
  min?: string;
  /** Maximum year (YYYY) */
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
  /** Start year (default: current year - 20) */
  startYear?: number;
  /** End year (default: current year + 10) */
  endYear?: number;
  /** Whether to show current decade as initial view */
  decadeView?: boolean;
}

// ---- Helpers ----

function parseYear(str: string): number | null {
  const year = parseInt(str, 10);
  return isNaN(year) || year < 1900 || year > 2200 ? null : year;
}

function isYearDisabled(
  year: number,
  minYear: number,
  maxYear: number
): boolean {
  return year < minYear || year > maxYear;
}

/** Get the decade start for a given year (e.g., 2026 -> 2020) */
function getDecadeStart(year: number): number {
  return Math.floor(year / 10) * 10;
}

// ---- Styles ----

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    gap: '4px',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    fontWeight: 500,
  },
  asterisk: {
    color: '#f43f5e',
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '1.5',
    minWidth: '160px',
    color: '#111827',
    transition: 'border-color 0.15s',
  },
  triggerDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    background: '#f9fafb',
  },
  triggerOpen: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 2px rgba(59,130,246,0.15)',
  },
  placeholder: {
    color: '#9ca3af',
  },
  arrow: {
    fontSize: '10px',
    color: '#6b7280',
    transition: 'transform 0.15s',
  },
  arrowOpen: {
    transform: 'rotate(180deg)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    marginTop: '4px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    zIndex: 50,
    padding: '12px',
    minWidth: '240px',
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  navBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#374151',
  },
  navBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  decadeLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '4px',
  },
  yearCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 4px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#374151',
    transition: 'background 0.1s',
    border: 'none',
    background: 'transparent',
  },
  yearCellSelected: {
    background: '#3b82f6',
    color: '#fff',
    fontWeight: 600,
  },
  yearCellDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  yearCellToday: {
    outline: '2px solid #3b82f6',
    outlineOffset: '-2px',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  errorText: {
    fontSize: '12px',
    color: '#f43f5e',
  },
};

// ---- Component ----

export const YearPicker: React.FC<YearPickerProps> = ({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  label,
  error,
  helpText,
  placeholder = '选择年份',
  style,
  className,
  startYear: startYearProp,
  endYear: endYearProp,
  decadeView: initialDecadeView = false,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();

  const startYear = startYearProp ?? currentYear - 20;
  const endYear = endYearProp ?? currentYear + 10;
  const minYear = min ? (parseYear(min) ?? startYear) : startYear;
  const maxYear = max ? (parseYear(max) ?? endYear) : endYear;

  const selectedYear = value ? (parseYear(value) ?? null) : null;

  const [open, setOpen] = useState(false);
  const [decadeStart, setDecadeStart] = useState(() => {
    const seed = selectedYear ?? currentYear;
    return getDecadeStart(seed);
  });

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Reset decade when opened
  useEffect(() => {
    if (open) {
      const seed = selectedYear ?? currentYear;
      setDecadeStart(getDecadeStart(seed));
    }
  }, [open, selectedYear, currentYear]);

  const handleSelect = useCallback(
    (year: number) => {
      if (isYearDisabled(year, minYear, maxYear)) return;
      onChange?.(String(year));
      setOpen(false);
    },
    [onChange, minYear, maxYear]
  );

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
  }, [disabled]);

  const years = useMemo(() => {
    const result: number[] = [];
    for (let y = decadeStart; y < decadeStart + 10; y++) {
      if (y >= startYear && y <= endYear) {
        result.push(y);
      }
    }
    return result;
  }, [decadeStart, startYear, endYear]);

  const canPrev = decadeStart - 10 >= startYear;
  const canNext = decadeStart + 10 <= endYear;

  const handlePrevDecade = useCallback(() => {
    if (canPrev) setDecadeStart((d) => d - 10);
  }, [canPrev]);

  const handleNextDecade = useCallback(() => {
    if (canNext) setDecadeStart((d) => d + 10);
  }, [canNext]);

  const displayText = selectedYear
    ? `${selectedYear}年`
    : '';

  const triggerStyles = {
    ...styles.trigger,
    ...(disabled ? styles.triggerDisabled : {}),
    ...(open ? styles.triggerOpen : {}),
  };

  const arrowStyles = {
    ...styles.arrow,
    ...(open ? styles.arrowOpen : {}),
  };

  return (
    <div ref={wrapperRef} style={{ ...styles.wrapper, ...style }} className={className}>
      {/* Label */}
      {label && (
        <div style={styles.labelRow}>
          <span>{label}</span>
          {required && <span style={styles.asterisk}>*</span>}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        style={triggerStyles}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label ? `${label}, ${displayText || placeholder}` : (displayText || placeholder)}
      >
        <span style={displayText ? undefined : styles.placeholder}>
          {displayText || placeholder}
        </span>
        <span style={arrowStyles}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown} role="dialog">
          {/* Decade navigation */}
          <div style={styles.navRow}>
            <button
              type="button"
              onClick={handlePrevDecade}
              disabled={!canPrev}
              style={{
                ...styles.navBtn,
                ...(!canPrev ? styles.navBtnDisabled : {}),
              }}
              aria-label="上一个十年"
            >
              ◀
            </button>
            <span style={styles.decadeLabel}>
              {decadeStart} - {decadeStart + 9}
            </span>
            <button
              type="button"
              onClick={handleNextDecade}
              disabled={!canNext}
              style={{
                ...styles.navBtn,
                ...(!canNext ? styles.navBtnDisabled : {}),
              }}
              aria-label="下一个十年"
            >
              ▶
            </button>
          </div>

          {/* Grid */}
          <div style={styles.grid} role="listbox" aria-label="年份选择">
            {years.map((year) => {
              const isSel = selectedYear === year;
              const isDis = isYearDisabled(year, minYear, maxYear);
              const isToday = year === currentYear;

              return (
                <button
                  key={year}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  disabled={isDis}
                  onClick={() => handleSelect(year)}
                  style={{
                    ...styles.yearCell,
                    ...(isSel ? styles.yearCellSelected : {}),
                    ...(isDis ? styles.yearCellDisabled : {}),
                    ...(isToday && !isSel ? styles.yearCellToday : {}),
                  }}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Help / Error text */}
      {error && <span style={styles.errorText}>{error}</span>}
      {!error && helpText && <span style={styles.helpText}>{helpText}</span>}
    </div>
  );
};
