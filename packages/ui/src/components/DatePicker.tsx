'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ---- Types ----

export interface DatePickerProps {
  /** 当前值 (ISO 8601 日期字符串 YYYY-MM-DD) */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 最小值 */
  min?: string;
  /** 最大值 */
  max?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** 标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 占位文本 */
  placeholder?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

// ---- Helpers ----

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseDate(str: string): Date | null {
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDisabled(
  year: number,
  month: number,
  day: number,
  min?: string,
  max?: string,
): boolean {
  const dateStr = formatDate(year, month, day);
  if (min && dateStr < min) return true;
  if (max && dateStr > max) return true;
  return false;
}

// ---- Styles ----

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: 'relative', display: 'inline-block', fontFamily: 'system-ui, sans-serif' },
  label: { display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#333' },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    background: '#fff',
    minWidth: 200,
    justifyContent: 'space-between',
  },
  triggerDisabled: { opacity: 0.5, cursor: 'not-allowed', background: '#f9fafb' },
  triggerError: { borderColor: '#ef4444' },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    padding: 16,
    zIndex: 1000,
    minWidth: 280,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '4px 8px',
    fontSize: 16,
    borderRadius: 4,
    lineHeight: 1,
  },
  navBtnHover: { background: '#f3f4f6' },
  title: { fontSize: 15, fontWeight: 600 },
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 },
  weekCell: { textAlign: 'center', fontSize: 12, color: '#6b7280', padding: '4px 0' },
  dayGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  dayCell: {
    textAlign: 'center',
    padding: '6px 0',
    fontSize: 14,
    borderRadius: 6,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
  },
  dayCellSelected: { background: '#3b82f6', color: '#fff', fontWeight: 600 },
  dayCellToday: { border: '1px solid #3b82f6' },
  dayCellDisabled: { color: '#d1d5db', cursor: 'not-allowed' },
  dayCellHover: { background: '#eff6ff' },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  helpText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  calendarIcon: { fontSize: 16, color: '#9ca3af' },
  clearBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 14,
    color: '#9ca3af',
    padding: '2px 4px',
    lineHeight: 1,
  },
  footer: { display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 8 },
  todayBtn: { border: 'none', background: '#f3f4f6', cursor: 'pointer', padding: '4px 12px', borderRadius: 4, fontSize: 13 },
};

// ---- Component ----

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  label,
  error,
  helpText,
  placeholder = '选择日期',
  style,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // View state
  const parsed = value ? parseDate(value) : null;
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  // Click outside
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

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  }, [viewMonth]);

  const handleSelectDay = useCallback(
    (year: number, month: number, day: number) => {
      if (isDisabled(year, month, day, min, max)) return;
      const dateStr = formatDate(year, month, day);
      onChange?.(dateStr);
      setOpen(false);
    },
    [onChange, min, max],
  );

  const handleToday = useCallback(() => {
    const d = new Date();
    const dateStr = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
    onChange?.(dateStr);
    setOpen(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange?.('');
    setOpen(false);
  }, [onChange]);

  // Build days
  const days: React.ReactNode[] = [];
  const dim = daysInMonth(viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }

  for (let d = 1; d <= dim; d++) {
    const isSelected = parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === d;
    const isToday =
      today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
    const disabled_ = isDisabled(viewYear, viewMonth, d, min, max);
    const dateStr = formatDate(viewYear, viewMonth, d);

    days.push(
      <button
        key={dateStr}
        type="button"
        onClick={() => handleSelectDay(viewYear, viewMonth, d)}
        disabled={disabled_}
        style={{
          ...styles.dayCell,
          ...(isSelected ? styles.dayCellSelected : {}),
          ...(isToday && !isSelected ? styles.dayCellToday : {}),
          ...(disabled_ ? styles.dayCellDisabled : {}),
        }}
        onMouseEnter={(e) => {
          if (!disabled_ && !isSelected) {
            (e.target as HTMLElement).style.background = '#eff6ff';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled_ && !isSelected) {
            (e.target as HTMLElement).style.background = 'transparent';
          }
        }}
        aria-label={dateStr}
        aria-selected={!!isSelected}
        role="gridcell"
      >
        {d}
      </button>,
    );
  }

  return (
    <div ref={wrapperRef} style={{ ...styles.wrapper, ...style }} className={className}>
      {label && <label style={styles.label}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}

      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={value || placeholder}
        tabIndex={disabled ? -1 : 0}
        style={{
          ...styles.trigger,
          ...(disabled ? styles.triggerDisabled : {}),
          ...(error ? styles.triggerError : {}),
        }}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) setOpen(o => !o); } }}
      >
        <span style={{ color: value ? '#111' : '#9ca3af' }}>
          {value || placeholder}
        </span>
        <span style={styles.calendarIcon}>
          {value ? (
            <span
              role="button"
              aria-label="清除"
              style={styles.clearBtn}
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
            >
              ✕
            </span>
          ) : (
            '📅'
          )}
        </span>
      </div>

      {error && <div style={styles.errorText}>{error}</div>}
      {helpText && !error && <div style={styles.helpText}>{helpText}</div>}

      {open && !disabled && (
        <div role="dialog" aria-label="日期选择面板" style={styles.dropdown}>
          {/* Header */}
          <div style={styles.header}>
            <button
              type="button"
              style={{ ...styles.navBtn, ...(hoveredBtn === 0 ? styles.navBtnHover : {}) }}
              onMouseEnter={() => setHoveredBtn(0)}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={handlePrevMonth}
              aria-label="上个月"
            >
              ◀
            </button>
            <span style={styles.title}>
              {viewYear}年{MONTH_NAMES[viewMonth]}
            </span>
            <button
              type="button"
              style={{ ...styles.navBtn, ...(hoveredBtn === 1 ? styles.navBtnHover : {}) }}
              onMouseEnter={() => setHoveredBtn(1)}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={handleNextMonth}
              aria-label="下个月"
            >
              ▶
            </button>
          </div>

          {/* Week day names */}
          <div style={styles.weekRow}>
            {DAY_NAMES.map(n => (
              <div key={n} style={styles.weekCell}>{n}</div>
            ))}
          </div>

          {/* Day grid */}
          <div role="grid" aria-label="日期网格" style={styles.dayGrid}>
            {days}
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <button type="button" style={styles.todayBtn} onClick={handleToday}>
              今天
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

DatePicker.displayName = 'DatePicker';

export default DatePicker;
