'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ---- Types ----

export interface DateRangeValue {
  /** 开始日期 (ISO 8601 日期字符串 YYYY-MM-DD) */
  start: string;
  /** 结束日期 (ISO 8601 日期字符串 YYYY-MM-DD) */
  end: string;
}

export interface DateRangePickerProps {
  /** 当前值 */
  value?: DateRangeValue;
  /** 值变化回调 */
  onChange?: (value: DateRangeValue) => void;
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
  placeholder?: [string, string];
  /** 快捷选项 */
  presets?: DateRangePreset[];
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

export interface DateRangePreset {
  label: string;
  getValue: () => DateRangeValue;
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

function parseDate(str: string): { year: number; month: number; day: number } | null {
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return {
    year: parseInt(year!, 10),
    month: parseInt(month!, 10) - 1,
    day: parseInt(day!, 10),
  };
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isBefore(ymd: { year: number; month: number; day: number }, target: string): boolean {
  const d1 = new Date(ymd.year, ymd.month, ymd.day);
  const parsed = parseDate(target);
  if (!parsed) return false;
  const d2 = new Date(parsed.year, parsed.month, parsed.day);
  return d1 < d2;
}

function isAfter(ymd: { year: number; month: number; day: number }, target: string): boolean {
  const d1 = new Date(ymd.year, ymd.month, ymd.day);
  const parsed = parseDate(target);
  if (!parsed) return false;
  const d2 = new Date(parsed.year, parsed.month, parsed.day);
  return d1 > d2;
}

function isSameDay(a: { year: number; month: number; day: number }, b: { year: number; month: number; day: number }): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function isInRange(
  ymd: { year: number; month: number; day: number },
  range: { start: { year: number; month: number; day: number }; end: { year: number; month: number; day: number } },
): boolean {
  const d = new Date(ymd.year, ymd.month, ymd.day);
  const s = new Date(range.start.year, range.start.month, range.start.day);
  const e = new Date(range.end.year, range.end.month, range.end.day);
  return d >= s && d <= e;
}

// ---- Preset helpers ----

function today(): string {
  const d = new Date();
  return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: '今天',
    getValue: () => ({ start: today(), end: today() }),
  },
  {
    label: '最近7天',
    getValue: () => ({ start: daysAgo(6), end: today() }),
  },
  {
    label: '最近30天',
    getValue: () => ({ start: daysAgo(29), end: today() }),
  },
  {
    label: '最近90天',
    getValue: () => ({ start: daysAgo(89), end: today() }),
  },
];

// ---- Component ----

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  label,
  error,
  helpText,
  placeholder = ['开始日期', '结束日期'],
  presets = DEFAULT_PRESETS,
  style,
  className,
}) => {
  // Panel state
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar navigation
  const todayDate = new Date();
  const [leftYear, setLeftYear] = useState(todayDate.getFullYear());
  const [leftMonth, setLeftMonth] = useState(todayDate.getMonth());
  const [rightYear, setRightYear] = useState(
    todayDate.getMonth() === 11
      ? todayDate.getFullYear() + 1
      : todayDate.getFullYear(),
  );
  const [rightMonth, setRightMonth] = useState(
    todayDate.getMonth() === 11 ? 0 : todayDate.getMonth() + 1,
  );

  // Selection state
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [hoverDate, setHoverDate] = useState<{
    year: number;
    month: number;
    day: number;
  } | null>(null);

  const startParsed = value?.start ? parseDate(value.start) : null;
  const endParsed = value?.end ? parseDate(value.end) : null;

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

  const handleDayClick = useCallback(
    (year: number, month: number, day: number) => {
      if (disabled) return;
      const clickedDate = formatDate(year, month, day);

      // Check bounds
      if (min && isBefore({ year, month, day }, min)) return;
      if (max && isAfter({ year, month, day }, max)) return;

      if (selecting === 'start') {
        const newValue: DateRangeValue = {
          start: clickedDate,
          end: clickedDate,
        };
        onChange?.(newValue);
        setSelecting('end');
      } else {
        const currentStart = value?.start || clickedDate;
        const s = parseDate(currentStart);
        if (s) {
          const startDt = new Date(s.year, s.month, s.day);
          const clickedDt = new Date(year, month, day);
          if (clickedDt < startDt) {
            // User clicked before start → restart
            const newValue: DateRangeValue = {
              start: clickedDate,
              end: clickedDate,
            };
            onChange?.(newValue);
            setSelecting('end');
          } else {
            const newValue: DateRangeValue = {
              start: currentStart,
              end: clickedDate,
            };
            onChange?.(newValue);
            setSelecting('start');
            setOpen(false);
          }
        }
      }
    },
    [disabled, min, max, onChange, selecting, value],
  );

  const handlePresetClick = useCallback(
    (preset: DateRangePreset) => {
      const range = preset.getValue();
      onChange?.(range);
      setSelecting('start');
      setOpen(false);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange?.({ start: '', end: '' });
    setSelecting('start');
  }, [onChange]);

  const renderCalendar = (
    year: number,
    month: number,
    onPrev: () => void,
    onNext: () => void,
  ) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: React.ReactNode[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="drp-day drp-day--empty" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const ymd = { year, month, day };
      const isDisabled = !!(
        (min && isBefore(ymd, min)) ||
        (max && isAfter(ymd, max))
      );
      const isToday = isSameDay(ymd, {
        year: todayDate.getFullYear(),
        month: todayDate.getMonth(),
        day: todayDate.getDate(),
      });
      const isStart =
        startParsed && isSameDay(ymd, startParsed);
      const isEnd =
        endParsed && isSameDay(ymd, endParsed);

      // Range highlight
      const inRange =
        startParsed &&
        endParsed &&
        startParsed.year !== undefined &&
        endParsed.year !== undefined &&
        isInRange(ymd, { start: startParsed, end: endParsed });

      // Hover preview (when selecting end)
      const inHoverRange =
        selecting === 'end' &&
        startParsed &&
        hoverDate &&
        isInRange(ymd, {
          start: { year: startParsed.year, month: startParsed.month, day: startParsed.day },
          end: hoverDate,
        });

      const classes = ['drp-day'];
      if (isDisabled) classes.push('drp-day--disabled');
      if (isToday) classes.push('drp-day--today');
      if (isStart) classes.push('drp-day--start');
      if (isEnd) classes.push('drp-day--end');
      if ((inRange || inHoverRange) && !isStart && !isEnd)
        classes.push('drp-day--in-range');

      cells.push(
        <button
          key={`${year}-${month}-${day}`}
          type="button"
          className={classes.join(' ')}
          disabled={isDisabled}
          onClick={() => handleDayClick(year, month, day)}
          onMouseEnter={() => setHoverDate(ymd)}
          onMouseLeave={() => setHoverDate(null)}
          aria-label={`${year}年${month + 1}月${day}日`}
        >
          {day}
        </button>,
      );
    }

    return (
      <div className="drp-calendar">
        <div className="drp-calendar-header">
          <button
            type="button"
            className="drp-nav-btn"
            onClick={onPrev}
            aria-label="上一月"
          >
            ‹
          </button>
          <span className="drp-month-label">
            {year}年 {MONTH_NAMES[month]}
          </span>
          <button
            type="button"
            className="drp-nav-btn"
            onClick={onNext}
            aria-label="下一月"
          >
            ›
          </button>
        </div>
        <div className="drp-day-header">
          {DAY_NAMES.map((n) => (
            <div key={n} className="drp-day-name">
              {n}
            </div>
          ))}
        </div>
        <div className="drp-day-grid">{cells}</div>
      </div>
    );
  };

  const displayText =
    value?.start && value?.end
      ? `${value.start} ~ ${value.end}`
      : value?.start
        ? `${value.start} ~ `
        : '';

  const hasValue = value?.start || value?.end;

  return (
    <div
      ref={containerRef}
      className={`drp-root${className ? ` ${className}` : ''}`}
      style={style}
    >
      {label && (
        <label className="drp-label">
          {label}
          {required && <span className="drp-required">*</span>}
        </label>
      )}
      <div className="drp-trigger-wrapper">
        <input
          type="text"
          readOnly
          className={`drp-trigger${error ? ' drp-trigger--error' : ''}${disabled ? ' drp-trigger--disabled' : ''}`}
          value={displayText}
          placeholder={placeholder[0] + ' ~ ' + placeholder[1]}
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          onFocus={() => !disabled && setOpen(true)}
          aria-expanded={open}
          role="combobox"
        />
        {hasValue && !disabled && (
          <button
            type="button"
            className="drp-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            aria-label="清除"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="drp-panel">
          {/* Presets */}
          <div className="drp-presets">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                className="drp-preset-btn"
                onClick={() => handlePresetClick(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendars */}
          <div className="drp-calendars">
            {renderCalendar(leftYear, leftMonth, () => {
              if (leftMonth === 0) {
                setLeftYear(leftYear - 1);
                setLeftMonth(11);
              } else {
                setLeftMonth(leftMonth - 1);
              }
            }, () => {
              if (leftMonth === 11) {
                setLeftYear(leftYear + 1);
                setLeftMonth(0);
              } else {
                setLeftMonth(leftMonth + 1);
              }
              // Keep right panel one month ahead
              const newLeftMonth = leftMonth === 11 ? 0 : leftMonth + 1;
              const newLeftYear = leftMonth === 11 ? leftYear + 1 : leftYear;
              if (newLeftYear === rightYear && newLeftMonth >= rightMonth) {
                if (rightMonth === 11) {
                  setRightYear(rightYear + 1);
                  setRightMonth(0);
                } else {
                  setRightMonth(rightMonth + 1);
                }
              }
            })}

            {renderCalendar(rightYear, rightMonth, () => {
              if (rightMonth === 0) {
                setRightYear(rightYear - 1);
                setRightMonth(11);
              } else {
                setRightMonth(rightMonth - 1);
              }
              // Keep left panel one month behind
              if (leftYear === rightYear && leftMonth >= rightMonth - 1) {
                if (leftMonth === 0) {
                  setLeftYear(leftYear - 1);
                  setLeftMonth(11);
                } else {
                  setLeftMonth(leftMonth - 1);
                }
              }
            }, () => {
              if (rightMonth === 11) {
                setRightYear(rightYear + 1);
                setRightMonth(0);
              } else {
                setRightMonth(rightMonth + 1);
              }
            })}
          </div>
        </div>
      )}

      {error && <div className="drp-error">{error}</div>}
      {helpText && !error && <div className="drp-help">{helpText}</div>}

      <style>{`
        .drp-root {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          gap: 4px;
          min-width: 280px;
        }
        .drp-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .drp-required {
          color: #ef4444;
          margin-left: 2px;
        }
        .drp-trigger-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .drp-trigger {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          background: #fff;
          outline: none;
          box-sizing: border-box;
          color: #111827;
        }
        .drp-trigger::placeholder {
          color: #9ca3af;
        }
        .drp-trigger:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .drp-trigger--error {
          border-color: #ef4444;
        }
        .drp-trigger--error:focus {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }
        .drp-trigger--disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }
        .drp-clear-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: #9ca3af;
          padding: 2px 4px;
          line-height: 1;
        }
        .drp-clear-btn:hover {
          color: #6b7280;
        }
        .drp-panel {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1000;
          margin-top: 4px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .drp-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f3f4f6;
        }
        .drp-preset-btn {
          padding: 4px 10px;
          font-size: 12px;
          color: #3b82f6;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
        }
        .drp-preset-btn:hover {
          background: #dbeafe;
        }
        .drp-calendars {
          display: flex;
          gap: 16px;
        }
        .drp-calendar {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .drp-calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 0;
        }
        .drp-nav-btn {
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          color: #374151;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .drp-nav-btn:hover {
          background: #f3f4f6;
        }
        .drp-month-label {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .drp-day-header {
          display: grid;
          grid-template-columns: repeat(7, 32px);
          gap: 2px;
          text-align: center;
          margin-bottom: 2px;
        }
        .drp-day-name {
          font-size: 12px;
          color: #6b7280;
          width: 32px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .drp-day-grid {
          display: grid;
          grid-template-columns: repeat(7, 32px);
          gap: 2px;
        }
        .drp-day {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          border-radius: 4px;
          font-size: 13px;
          color: #111827;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .drp-day:hover:not(:disabled):not(.drp-day--empty) {
          background: #f3f4f6;
        }
        .drp-day--empty {
          cursor: default;
        }
        .drp-day--disabled {
          color: #d1d5db;
          cursor: not-allowed;
        }
        .drp-day--today {
          font-weight: 700;
          color: #3b82f6;
        }
        .drp-day--start,
        .drp-day--end {
          background: #3b82f6 !important;
          color: #fff !important;
          border-radius: 4px;
        }
        .drp-day--in-range {
          background: #dbeafe;
          color: #1d4ed8;
          border-radius: 0;
        }
        .drp-error {
          font-size: 12px;
          color: #ef4444;
        }
        .drp-help {
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default DateRangePicker;
