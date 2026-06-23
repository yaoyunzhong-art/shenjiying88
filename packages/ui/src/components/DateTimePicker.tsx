'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ---- Types ----

export type DateTimePickerMode = 'date' | 'datetime' | 'time' | 'month';

export interface DateTimePickerProps {
  /** 当前值 (ISO 8601 字符串) */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 选择模式 */
  mode?: DateTimePickerMode;
  /** 占位文本 */
  placeholder?: string;
  /** 最小值 (ISO 8601) */
  min?: string;
  /** 最大值 (ISO 8601) */
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
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

// ---- Helpers ----

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1);
  return d.getDay();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateValue(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatTimeValue(h: number, min: number, s: number): string {
  return `${pad(h)}:${pad(min)}:${pad(s)}`;
}

function parseDateParts(dateStr?: string): { y: number; m: number; d: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const p0 = parts[0]!;
  const p1 = parts[1]!;
  const p2 = parts[2]!;
  if (!p0 || !p1 || !p2) return null;
  const y = parseInt(p0, 10);
  const m = parseInt(p1, 10) - 1;
  const d = parseInt(p2, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { y, m, d };
}

function parseTimeParts(dateStr?: string): { h: number; m: number; s: number } | null {
  if (!dateStr) return null;
  // Support both full datetime and time-only strings
  const afterT = dateStr.includes('T') ? dateStr.split('T')[1]! : undefined;
  const timePart = afterT ? afterT.split('.')[0] : dateStr;
  if (!timePart) return null;
  const parts = timePart.split(':');
  if (parts.length < 2) return null;
  const p0 = parts[0]!;
  const p1 = parts[1]!;
  if (!p0 || !p1) return null;
  const h = parseInt(p0, 10);
  const m = parseInt(p1, 10);
  const p2 = parts.length >= 3 ? parts[2] : undefined;
  const s = p2 ? parseInt(p2, 10) : 0;
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
  return { h, m, s };
}

function isDateDisabled(dateStr?: string, min?: string, max?: string): boolean {
  if (!dateStr) return false;
  if (min && dateStr < min) return true;
  if (max && dateStr > max) return true;
  return false;
}

// ---- Styles ----

const POPOVER_BG = 'rgba(15, 23, 42, 0.97)';
const BORDER_COLOR = 'rgba(148, 163, 184, 0.15)';
const TEXT_COLOR = '#e2e8f0';
const MUTED_COLOR = '#64748b';
const ACCENT_COLOR = '#3b82f6';
const ACCENT_BG = 'rgba(59, 130, 246, 0.15)';

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 13,
  lineHeight: 1.5,
  color: TEXT_COLOR,
  background: 'rgba(15, 23, 42, 0.4)',
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: 8,
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

// ---- Calendar Popover ----

interface CalendarPopoverProps {
  year: number;
  month: number;
  selectedDate: string | null;
  onChange: (dateStr: string) => void;
  onClose: () => void;
  min?: string;
  max?: string;
  anchorRect: DOMRect;
}

function CalendarPopover({
  year,
  month,
  selectedDate,
  onChange,
  onClose,
  min,
  max,
  anchorRect,
}: CalendarPopoverProps) {
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const today = new Date();
  const todayStr = formatDateValue(today.getFullYear(), today.getMonth(), today.getDate());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (day: number) => {
    const dateStr = formatDateValue(viewYear, viewMonth, day);
    if (isDateDisabled(dateStr, min, max)) return;
    onChange(dateStr);
    onClose();
  };

  // Calculate popover position
  const popStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9998,
    top: anchorRect.bottom + 4,
    left: anchorRect.left,
    minWidth: 280,
  };

  // Prevent going off screen
  if (anchorRect.right - 280 < 0) {
    popStyle.left = 8;
  }

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: TEXT_COLOR,
    cursor: 'pointer',
    fontSize: 11,
  };

  return (
    <div ref={popoverRef} style={popStyle}>
      <div
        style={{
          background: POPOVER_BG,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 12,
          padding: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button type="button" onClick={handlePrevMonth} style={btnStyle}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_COLOR }}>
            {viewYear}年 {MONTH_NAMES[viewMonth]}
          </span>
          <button type="button" onClick={handleNextMonth} style={btnStyle}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Day names */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              style={{
                fontSize: 11,
                color: MUTED_COLOR,
                textAlign: 'center',
                padding: '4px 0',
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: totalCells }, (_, i) => {
            const day = i - firstDay + 1;
            const isEmpty = day < 1 || day > daysInMonth;
            if (isEmpty) {
              return <div key={i} />;
            }

            const dateStr = formatDateValue(viewYear, viewMonth, day);
            const selected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const disabled = isDateDisabled(dateStr, min, max);

            let dayBg = 'transparent';
            let dayColor = TEXT_COLOR;
            let dayWeight: number | string = 400;

            if (selected) {
              dayBg = ACCENT_BG;
              dayColor = ACCENT_COLOR;
              dayWeight = 600;
            } else if (isToday) {
              dayColor = ACCENT_COLOR;
              dayWeight = 600;
            }

            if (disabled) {
              dayColor = MUTED_COLOR;
            }

            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(day)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: selected ? `1px solid ${ACCENT_COLOR}` : '1px solid transparent',
                  background: dayBg,
                  color: dayColor,
                  fontWeight: dayWeight,
                  fontSize: 12,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: disabled ? 0.4 : 1,
                  margin: '0 auto',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Today button */}
        <div style={{ marginTop: 8, borderTop: `1px solid ${BORDER_COLOR}`, paddingTop: 8, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              onChange(todayStr);
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: ACCENT_COLOR,
              fontSize: 12,
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 4,
            }}
          >
            今天
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Time Picker Popover ----

interface TimePopoverProps {
  selectedTime: string | null;
  onChange: (timeStr: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}

function TimePopover({ selectedTime, onChange, onClose, anchorRect }: TimePopoverProps) {
  const parts = parseTimeParts(selectedTime ?? '00:00:00');
  const [hour, setHour] = useState(parts?.h ?? 0);
  const [minute, setMinute] = useState(parts?.m ?? 0);
  const [second, setSecond] = useState(parts?.s ?? 0);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleApply = () => {
    onChange(formatTimeValue(hour, minute, second));
    onClose();
  };

  const spinBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    color: MUTED_COLOR,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
  };

  const numberStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: TEXT_COLOR,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
    minWidth: 36,
  };

  const popStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9998,
    top: anchorRect.bottom + 4,
    left: anchorRect.left,
  };

  return (
    <div ref={popoverRef} style={popStyle}>
      <div
        style={{
          background: POPOVER_BG,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(16px)',
          minWidth: 200,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          {/* Hour */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              type="button"
              style={spinBtnStyle}
              onClick={() => setHour((h) => (h + 1) % 24)}
            >
              ▲
            </button>
            <span style={numberStyle}>{pad(hour)}</span>
            <button
              type="button"
              style={spinBtnStyle}
              onClick={() => setHour((h) => (h - 1 + 24) % 24)}
            >
              ▼
            </button>
          </div>
          <span style={{ fontSize: 18, color: MUTED_COLOR, fontWeight: 600 }}>:</span>
          {/* Minute */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              type="button"
              style={spinBtnStyle}
              onClick={() => setMinute((m) => (m + 1) % 60)}
            >
              ▲
            </button>
            <span style={numberStyle}>{pad(minute)}</span>
            <button
              type="button"
              style={spinBtnStyle}
              onClick={() => setMinute((m) => (m - 1 + 60) % 60)}
            >
              ▼
            </button>
          </div>
          <span style={{ fontSize: 18, color: MUTED_COLOR, fontWeight: 600 }}>:</span>
          {/* Second */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              type="button"
              style={spinBtnStyle}
              onClick={() => setSecond((s) => (s + 1) % 60)}
            >
              ▲
            </button>
            <span style={numberStyle}>{pad(second)}</span>
            <button
              type="button"
              style={spinBtnStyle}
              onClick={() => setSecond((s) => (s - 1 + 60) % 60)}
            >
              ▼
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleApply}
            style={{
              background: ACCENT_COLOR,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 20px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Component ----

export const DateTimePicker = React.memo(function DateTimePicker({
  value,
  onChange,
  mode = 'date',
  placeholder,
  min,
  max,
  disabled = false,
  required = false,
  label,
  error,
  helpText,
  style,
  className,
}: DateTimePickerProps) {
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isTimeOpen, setTimeOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleDateSelect = useCallback(
    (dateStr: string) => {
      let newValue: string;
      if (mode === 'datetime') {
        const timeParts = parseTimeParts(internalValue);
        if (timeParts) {
          newValue = `${dateStr}T${formatTimeValue(timeParts.h, timeParts.m, timeParts.s)}`;
        } else {
          newValue = `${dateStr}T00:00:00`;
        }
      } else if (mode === 'date') {
        newValue = dateStr;
      } else {
        newValue = dateStr;
      }

      setInternalValue(newValue);
      onChange?.(newValue);
      setCalendarOpen(false);
    },
    [internalValue, mode, onChange],
  );

  const handleTimeSelect = useCallback(
    (timeStr: string) => {
      let newValue: string;
      if (mode === 'datetime') {
        const dateParts = parseDateParts(internalValue);
        if (dateParts) {
          newValue = `${formatDateValue(dateParts.y, dateParts.m, dateParts.d)}T${timeStr}`;
        } else {
          const today = new Date();
          newValue = `${formatDateValue(today.getFullYear(), today.getMonth(), today.getDate())}T${timeStr}`;
        }
      } else if (mode === 'time') {
        newValue = timeStr;
      } else {
        newValue = timeStr;
      }

      setInternalValue(newValue);
      onChange?.(newValue);
      setTimeOpen(false);
    },
    [internalValue, mode, onChange],
  );

  const handleInputClick = useCallback(() => {
    if (disabled) return;
    if (mode === 'time') {
      setTimeOpen(true);
    } else {
      setCalendarOpen(true);
    }
  }, [disabled, mode]);

  // Calculate display value
  const getDisplayValue = (): string => {
    if (!internalValue) return '';
    if (mode === 'date') return internalValue;
    if (mode === 'time') return internalValue;
    if (mode === 'datetime') {
      return internalValue.replace('T', ' ');
    }
    if (mode === 'month') {
      const parts = internalValue.split('-');
      if (parts.length >= 2) {
        const p0 = parts[0]!;
        const p1 = parts[1]!;
        if (!p0 || !p1) return internalValue;
        const y = parseInt(p0, 10);
        const m = parseInt(p1, 10);
        return `${y}年${m}月`;
      }
    }
    return internalValue;
  };

  const getPlaceholder = (): string => {
    if (placeholder) return placeholder;
    switch (mode) {
      case 'date': return '选择日期';
      case 'datetime': return '选择日期和时间';
      case 'time': return '选择时间';
      case 'month': return '选择月份';
      default: return '选择日期';
    }
  };

  const defaultDate = parseDateParts(internalValue);
  const now = new Date();

  // Determine if we should render date/time icon buttons
  const showTimeIcon = mode === 'datetime';

  let inputBorderColor = BORDER_COLOR;
  if (error) inputBorderColor = 'rgba(248, 113, 113, 0.4)';

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }} className={className}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: error ? '#f87171' : '#94a3b8',
          }}
        >
          {label}
          {required && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            {/* Calendar icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: MUTED_COLOR,
              }}
            >
              <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M11 2v2M5 2v2M2 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              readOnly
              value={getDisplayValue()}
              placeholder={getPlaceholder()}
              disabled={disabled}
              onClick={handleInputClick}
              style={{
                ...inputBaseStyle,
                paddingLeft: 36,
                borderColor: inputBorderColor,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
              }}
            />
          </div>

          {/* Time picker icon in datetime mode */}
          {showTimeIcon && (
            <button
              type="button"
              onClick={() => { if (!disabled) { setTimeOpen(true); setCalendarOpen(false); } }}
              disabled={disabled}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${BORDER_COLOR}`,
                background: 'rgba(15, 23, 42, 0.4)',
                color: MUTED_COLOR,
                cursor: disabled ? 'not-allowed' : 'pointer',
                flexShrink: 0,
              }}
              title="选择时间"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Calendar Popover */}
        {isCalendarOpen && inputRef.current && (
          <CalendarPopover
            year={defaultDate?.y ?? now.getFullYear()}
            month={defaultDate?.m ?? now.getMonth()}
            selectedDate={parseDateParts(internalValue) ? formatDateValue(
              defaultDate!.y,
              defaultDate!.m,
              defaultDate!.d,
            ) : null}
            onChange={handleDateSelect}
            onClose={() => setCalendarOpen(false)}
            min={min}
            max={max}
            anchorRect={inputRef.current.getBoundingClientRect()}
          />
        )}

        {/* Time Popover */}
        {isTimeOpen && inputRef.current && (
          <TimePopover
            selectedTime={parseTimeParts(internalValue) ? formatTimeValue(
              parseTimeParts(internalValue)!.h,
              parseTimeParts(internalValue)!.m,
              parseTimeParts(internalValue)!.s,
            ) : null}
            onChange={handleTimeSelect}
            onClose={() => setTimeOpen(false)}
            anchorRect={inputRef.current.getBoundingClientRect()}
          />
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>
      )}
      {helpText && !error && (
        <span style={{ fontSize: 11, color: MUTED_COLOR }}>{helpText}</span>
      )}
    </div>
  );
});

export default DateTimePicker;
