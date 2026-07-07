'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ---- Types ----

export interface WeekPickerProps {
  /** Current value (ISO 8601 week string YYYY-Www, e.g. "2026-W28") */
  value?: string;
  /** Value change callback */
  onChange?: (value: string) => void;
  /** Minimum week (YYYY-Www) */
  min?: string;
  /** Maximum week (YYYY-Www) */
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
  /** Start year for year dropdown (default: current year - 2) */
  startYear?: number;
  /** End year for year dropdown (default: current year + 2) */
  endYear?: number;
  /** Week label prefix, default "第" */
  weekPrefix?: string;
  /** Week label suffix, default "周" */
  weekSuffix?: string;
}

// ---- Helpers ----

/** Get ISO week number and year for a given Date */
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

/** Create a Date from ISO year + week number (Monday) */
function dateFromISOWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7;
  const jan4Monday = new Date(jan4);
  jan4Monday.setUTCDate(jan4.getUTCDate() - (dayNum - 1));
  const result = new Date(jan4Monday);
  result.setUTCDate(result.getUTCDate() + (week - 1) * 7);
  return result;
}

/** Format week value as YYYY-Www */
function formatWeek(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Parse week value string to year+week */
function parseWeek(val: string): { year: number; week: number } | null {
  const m = val.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  return { year, week };
}

/** Get week range text, e.g. "7月13日 - 7月19日" */
function getWeekRangeText(year: number, week: number): string {
  const mon = dateFromISOWeek(year, week);
  const sun = new Date(mon);
  sun.setUTCDate(sun.getUTCDate() + 6);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
  return `${fmt(mon)} - ${fmt(sun)}`;
}

// ---- Component ----

export function WeekPicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  label,
  error,
  helpText,
  placeholder = '选择周',
  style,
  className,
  startYear,
  endYear,
  weekPrefix = '第',
  weekSuffix = '周',
}: WeekPickerProps) {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const sy = startYear ?? now.getFullYear() - 2;
  const ey = endYear ?? now.getFullYear() + 2;

  // Internal state for dropdown
  const [open, setOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    value ? (parseWeek(value)?.year ?? currentWeek.year) : currentWeek.year
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedValue = value ? parseWeek(value) : null;

  // Generate week list for selected year
  const weeks = useMemo(() => {
    const list: { year: number; week: number }[] = [];
    for (let w = 1; w <= 53; w++) {
      if (dateFromISOWeek(selectedYear, w).getUTCFullYear() === selectedYear) {
        list.push({ year: selectedYear, week: w });
      }
    }
    return list;
  }, [selectedYear]);

  const isDisabled = (y: number, w: number): boolean => {
    const wk = formatWeek(y, w);
    if (min && wk < min) return true;
    if (max && wk > max) return true;
    return false;
  };

  const handleSelect = useCallback(
    (y: number, w: number) => {
      if (isDisabled(y, w)) return;
      onChange?.(formatWeek(y, w));
      setOpen(false);
    },
    [onChange, min, max]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ---- Styles ----

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    ...style,
  };

  const triggerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '8px 12px',
    border: `1px solid ${error ? '#ef4444' : 'rgba(148,163,184,0.3)'}`,
    borderRadius: 6,
    background: disabled ? 'rgba(148,163,184,0.05)' : '#1e293b',
    color: parsedValue ? '#e2e8f0' : '#64748b',
    fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    minWidth: 200,
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    background: '#1e293b',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    zIndex: 1000,
    minWidth: 280,
    maxHeight: 360,
    overflow: 'hidden',
    display: open ? 'block' : 'none',
  };

  const yearBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(148,163,184,0.1)',
    gap: 8,
  };

  const yearBtnStyle: React.CSSProperties = {
    background: 'rgba(59,130,246,0.1)',
    border: 'none',
    color: '#60a5fa',
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  };

  const weekGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 4,
    padding: 12,
    overflowY: 'auto',
    maxHeight: 280,
  };

  const weekItemStyle = (disabled: boolean, selected: boolean): React.CSSProperties => ({
    padding: '6px 4px',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.3 : 1,
    background: selected ? 'rgba(59,130,246,0.2)' : 'transparent',
    color: selected ? '#60a5fa' : '#cbd5e1',
    border: selected ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
  });

  const rangeTextStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  };

  // Rendered display value
  let displayText = placeholder;
  let rangeText = '';
  if (parsedValue) {
    displayText = `${weekPrefix}${parsedValue.week}${weekSuffix}`;
    rangeText = getWeekRangeText(parsedValue.year, parsedValue.week);
  }

  return (
    <div ref={containerRef} style={containerStyle} className={className}>
      {label && (
        <div
          style={{
            fontSize: 13,
            color: '#94a3b8',
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </div>
      )}

      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label || '选择周'}
        tabIndex={disabled ? -1 : 0}
        style={triggerStyle}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <span>
          {displayText}
          {rangeText && <span style={rangeTextStyle}> ({rangeText})</span>}
        </span>
        <span style={{ fontSize: 10, color: '#64748b' }}>{open ? '▲' : '▼'}</span>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</div>
      )}
      {helpText && !error && (
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{helpText}</div>
      )}

      {/* Dropdown */}
      <div style={dropdownStyle} role="listbox">
        {/* Year selector */}
        <div style={yearBarStyle}>
          <button
            type="button"
            style={yearBtnStyle}
            onClick={() => setSelectedYear((y) => Math.max(sy, y - 1))}
            disabled={selectedYear <= sy}
            aria-label="上一年"
          >
            ◀
          </button>
          <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>
            {selectedYear}年
          </span>
          <button
            type="button"
            style={yearBtnStyle}
            onClick={() => setSelectedYear((y) => Math.min(ey, y + 1))}
            disabled={selectedYear >= ey}
            aria-label="下一年"
          >
            ▶
          </button>
        </div>

        {/* Week grid */}
        <div style={weekGridStyle}>
          {weeks.map(({ year, week }) => {
            const disabled = isDisabled(year, week);
            const selected = parsedValue !== null && parsedValue.year === year && parsedValue.week === week;
            return (
              <div
                key={`${year}-W${week}`}
                role="option"
                aria-selected={selected}
                aria-disabled={disabled}
                style={weekItemStyle(disabled, selected)}
                onClick={() => handleSelect(year, week)}
              >
                <div>{weekPrefix}{week}{weekSuffix}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                  {getWeekRangeText(year, week).slice(0, 10)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
