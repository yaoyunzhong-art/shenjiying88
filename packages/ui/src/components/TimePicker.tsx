'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ---- Types ----

export interface TimePickerProps {
  /** 当前值 (HH:mm 或 HH:mm:ss) */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 占位文本 */
  placeholder?: string;
  /** 是否包含秒 */
  showSeconds?: boolean;
  /** 小时最小值 (0-23) */
  minHour?: number;
  /** 小时最大值 (0-23) */
  maxHour?: number;
  /** 分钟步长 */
  minuteStep?: number;
  /** 是否12小时制 */
  use12Hour?: boolean;
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
  /** 唯一 id (用于 label 关联) */
  id?: string;
  /** 是否只读 */
  readOnly?: boolean;
}

// ---- Helpers ----

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseTime(value: string | undefined): { h: number; m: number; s: number } | null {
  if (!value) return null;
  // supports HH:mm or HH:mm:ss
  const parts = value.split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const h = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10);
  const s = parts[2] !== undefined ? parseInt(parts[2], 10) : 0;
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  return { h, m, s };
}

function formatTime(h: number, m: number, s: number, showSeconds: boolean): string {
  if (showSeconds) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}`;
}

// ---- Styles ----

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  },
  inputRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '2px 8px',
    background: '#fff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputRowFocus: {
    borderColor: '#6366f1',
    boxShadow: '0 0 0 2px rgba(99,102,241,0.2)',
  },
  inputRowError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 1px #ef4444',
  },
  inputRowDisabled: {
    background: '#f3f4f6',
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  segment: {
    width: 32,
    textAlign: 'center' as const,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 14,
    color: '#111827',
    padding: '4px 0',
  },
  segmentDisabled: {
    cursor: 'not-allowed',
  },
  separator: {
    fontSize: 14,
    color: '#9ca3af',
    userSelect: 'none',
    padding: '0 1px',
  },
  periodButton: {
    fontSize: 12,
    padding: '2px 6px',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    background: '#f9fafb',
    cursor: 'pointer',
    color: '#374151',
    marginLeft: 4,
  },
  periodButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
  },
};

// ---- Component ----

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder: _placeholder = '--:--',
  showSeconds = false,
  minHour = 0,
  maxHour = 23,
  minuteStep = 1,
  use12Hour = false,
  disabled = false,
  required = false,
  label,
  error,
  helpText,
  style,
  className,
  id,
  readOnly = false,
}) => {
  const parsed = useMemo(() => parseTime(value), [value]);
  const [focused, setFocused] = useState(false);
  const [localH, setLocalH] = useState(parsed?.h ?? 0);
  const [localM, setLocalM] = useState(parsed?.m ?? 0);
  const [localS, setLocalS] = useState(parsed?.s ?? 0);
  const inputRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<(HTMLInputElement | null)[]>([]);

  // sync from value
  useEffect(() => {
    if (parsed) {
      setLocalH(parsed.h);
      setLocalM(parsed.m);
      setLocalS(parsed.s);
    }
  }, [value, parsed]);

  const clampHour = (h: number) => Math.max(minHour, Math.min(maxHour, h));
  const clampMinute = (m: number) =>
    Math.max(0, Math.min(59, Math.round(m / minuteStep) * minuteStep));
  const clampSecond = (s: number) => Math.max(0, Math.min(59, s));

  const emit = useCallback(
    (h: number, m: number, s: number) => {
      const hh = clampHour(h);
      const mm = clampMinute(m);
      const ss = clampSecond(s);
      onChange?.(formatTime(hh, mm, ss, showSeconds));
    },
    [onChange, showSeconds, clampHour, clampMinute, clampSecond],
  );

  const focusSegment = (index: number) => {
    const el = segmentRefs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleSegmentChange = (
    index: number,
    raw: string,
    max: number,
    setter: (v: number) => void,
  ) => {
    if (readOnly) return;
    const digits = raw.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    const clamped = Math.min(num, max);
    setter(clamped);
    // Update value only on blur or when complete; too aggressive onChange hurts UX
  };

  const handleSegmentBlur = (
    _index: number,
    current: number,
    clamp: (v: number) => number,
    setter: (v: number) => void,
  ) => {
    const clamped = clamp(current);
    setter(clamped);
    emit(
      _index === 0 ? clamped : localH,
      _index === 1 ? clamped : localM,
      _index === 2 ? clamped : localS,
    );
  };

  const handleSegmentKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const delta = index === 0 ? 1 : minuteStep;
      const newVal =
        index === 0
          ? clampHour(localH + 1)
          : index === 1
            ? clampMinute(localM + delta)
            : clampSecond(localS + 1);
      if (index === 0) setLocalH(newVal);
      else if (index === 1) setLocalM(newVal);
      else setLocalS(newVal);
      emit(
        index === 0 ? newVal : localH,
        index === 1 ? newVal : localM,
        index === 2 ? newVal : localS,
      );
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = index === 0 ? 1 : minuteStep;
      const newVal =
        index === 0
          ? clampHour(localH - 1)
          : index === 1
            ? clampMinute(localM - delta)
            : clampSecond(localS - 1);
      if (index === 0) setLocalH(newVal);
      else if (index === 1) setLocalM(newVal);
      else setLocalS(newVal);
      emit(
        index === 0 ? newVal : localH,
        index === 1 ? newVal : localM,
        index === 2 ? newVal : localS,
      );
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      const next =
        e.key === 'Tab' && !e.shiftKey ? index + 1 : e.key === 'Tab' && e.shiftKey ? index - 1 : -1;
      const totalSegments = showSeconds ? 3 : 2;
      if (next >= 0 && next < totalSegments) {
        e.preventDefault();
        focusSegment(next);
      }
    } else if (e.key === 'ArrowLeft' && (e.target as HTMLInputElement).selectionStart === 0) {
      e.preventDefault();
      focusSegment(Math.max(0, index - 1));
    } else if (e.key === 'ArrowRight') {
      const el = e.target as HTMLInputElement;
      if (el.selectionStart === el.value.length) {
        e.preventDefault();
        const totalSegments = showSeconds ? 3 : 2;
        focusSegment(Math.min(totalSegments - 1, index + 1));
      }
    }
  };

  const _displayValue = parsed ? formatTime(localH, localM, localS, showSeconds) : '';

  // 12h conversion
  const isPM = localH >= 12;
  const displayH12 = use12Hour ? localH % 12 || 12 : localH;
  const togglePeriod = () => {
    if (disabled || readOnly) return;
    const newH = isPM ? localH - 12 : localH + 12;
    setLocalH(clampHour(newH));
    emit(clampHour(newH), localM, localS);
  };

  const inputRowStyle: React.CSSProperties = {
    ...styles.inputRow,
    ...(focused ? styles.inputRowFocus : {}),
    ...(error ? styles.inputRowError : {}),
    ...(disabled ? styles.inputRowDisabled : {}),
  };

  const segStyle: React.CSSProperties = {
    ...styles.segment,
    ...(disabled ? styles.segmentDisabled : {}),
  };

  const segments = showSeconds
    ? ([
        { value: pad(displayH12), max: use12Hour ? 12 : maxHour, index: 0 },
        { value: pad(localM), max: 59, index: 1 },
        { value: pad(localS), max: 59, index: 2 },
      ] as const)
    : ([
        { value: pad(displayH12), max: use12Hour ? 12 : maxHour, index: 0 },
        { value: pad(localM), max: 59, index: 1 },
      ] as const);

  return (
    <div style={{ ...styles.wrapper, ...style }} className={className}>
      {label && (
        <label style={styles.label} htmlFor={id ? `${id}-h` : undefined}>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div ref={inputRef} style={inputRowStyle}>
        {segments.map((seg, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span style={styles.separator}>:</span>}
            <input
              id={idx === 0 && id ? `${id}-h` : idx === 1 && id ? `${id}-m` : undefined}
              ref={(el) => {
                segmentRefs.current[idx] = el;
              }}
              style={segStyle}
              value={seg.value}
              onChange={(e) =>
                handleSegmentChange(
                  seg.index,
                  e.target.value,
                  seg.max,
                  seg.index === 0 ? setLocalH : seg.index === 1 ? setLocalM : setLocalS,
                )
              }
              onFocus={(e) => {
                setFocused(true);
                e.target.select();
              }}
              onBlur={() => {
                setFocused(false);
                handleSegmentBlur(
                  seg.index,
                  seg.index === 0 ? localH : seg.index === 1 ? localM : localS,
                  seg.index === 0 ? clampHour : seg.index === 1 ? clampMinute : clampSecond,
                  seg.index === 0 ? setLocalH : seg.index === 1 ? setLocalM : setLocalS,
                );
              }}
              onKeyDown={(e) => handleSegmentKeyDown(seg.index, e)}
              disabled={disabled}
              readOnly={readOnly}
              aria-label={seg.index === 0 ? '小时' : seg.index === 1 ? '分钟' : '秒'}
              autoComplete="off"
            />
          </React.Fragment>
        ))}
        {use12Hour && !disabled && !readOnly && (
          <button
            type="button"
            style={styles.periodButton}
            onClick={togglePeriod}
            aria-label="切换上午/下午"
          >
            {isPM ? 'PM' : 'AM'}
          </button>
        )}
      </div>
      {error && <span style={styles.errorText}>{error}</span>}
      {helpText && !error && <span style={styles.helpText}>{helpText}</span>}
    </div>
  );
};

export default TimePicker;
