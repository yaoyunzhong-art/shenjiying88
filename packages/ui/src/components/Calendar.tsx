'use client';

import React, { useState, useCallback, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 日历日期标记 */
export interface CalendarMarker {
  /** 日期 (ISO 日期字符串 YYYY-MM-DD) */
  date: string;
  /** 标记类型 */
  type?: 'dot' | 'badge' | 'highlight';
  /** 标记文案 (badge 类型时显示) */
  label?: string;
  /** 颜色 */
  color?: string;
}

/** 日历组件 Props */
export interface CalendarProps {
  /** 当前选中日期 (受控) */
  value?: Date | null;
  /** 默认选中日期 */
  defaultValue?: Date | null;
  /** 日期改变回调 */
  onChange?: (date: Date) => void;
  /** 月份改变回调 */
  onMonthChange?: (year: number, month: number) => void;
  /** 日期标记（如排班、告警、事件） */
  markers?: CalendarMarker[];
  /** 最小可选日期 */
  minDate?: Date;
  /** 最大可选日期 */
  maxDate?: Date;
  /** 自定义类名 */
  className?: string;
  /** 星期标题（支持国际化） */
  weekDayLabels?: string[];
  /** 月份名称（支持国际化） */
  monthLabels?: string[];
  /** 禁用周末选择 */
  disableWeekends?: boolean;
  /** 自定义日期禁用判断 */
  isDateDisabled?: (date: Date) => boolean;
  /** 自定义日期渲染 */
  renderDate?: (date: Date, isSelected: boolean, isToday: boolean) => React.ReactNode;
}

// ==================== 常量 ====================

const DEFAULT_WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const DEFAULT_MONTH_LABELS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

const MARKER_COLORS: Record<string, string> = {
  dot: '#60a5fa',
  badge: '#f59e0b',
  highlight: 'rgba(59,130,246,0.15)',
};

// ==================== 工具函数 ====================

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return isSameDay(date, now);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ==================== 样式 ====================

const STYLES: Record<string, React.CSSProperties> = {
  container: {
    display: 'inline-flex',
    flexDirection: 'column',
    borderRadius: 16,
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    padding: 16,
    userSelect: 'none',
    minWidth: 280,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: '0 4px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    background: 'rgba(148, 163, 184, 0.08)',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 16,
    transition: 'background 0.15s',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: '#f1f5f9',
    minWidth: 140,
    textAlign: 'center',
  },
  weekDayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: 8,
  },
  weekDayCell: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    padding: '4px 0',
  },
  dayGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
  },
  dayCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 13,
    position: 'relative',
    transition: 'background 0.12s, color 0.12s',
    margin: '0 auto',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#60a5fa',
  },
};

// ==================== 标记样式函数 ====================

function markerDotStyle(color: string): React.CSSProperties {
  return {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: color,
    marginTop: 2,
  };
}

function markerBadgeStyle(color: string): React.CSSProperties {
  return {
    fontSize: 9,
    fontWeight: 600,
    color,
    background: `${color}1a`,
    borderRadius: 3,
    padding: '0 3px',
    marginTop: 1,
    maxWidth: 32,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ==================== 箭头图标 ====================

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ==================== 主组件 ====================

/**
 * Calendar — 日历日期选择组件。
 *
 * 以月视图展示日期网格，支持：
 * - 日期选择（受控/非受控）
 * - 月份导航
 * - 日期标记（dot / badge / highlight）
 * - 最小/最大日期限制
 * - 周末禁用
 * - 自定义日期禁用
 * - 国际化（星期标题、月份名称）
 *
 * 使用纯 CSS + React 实现，零外部依赖。
 *
 * @example
 * // 基础日历
 * <Calendar
 *   defaultValue={new Date()}
 *   onChange={(d) => console.log(d)}
 * />
 *
 * @example
 * // 带标记的日历（排班/告警事件）
 * <Calendar
 *   markers={[
 *     { date: '2026-06-15', type: 'dot', color: '#ef4444' },
 *     { date: '2026-06-20', type: 'badge', label: '巡检', color: '#f59e0b' },
 *   ]}
 *   onChange={(d) => setSelected(d)}
 * />
 */
export function Calendar({
  value,
  defaultValue,
  onChange,
  onMonthChange,
  markers = [],
  minDate,
  maxDate,
  className,
  weekDayLabels = DEFAULT_WEEK_DAYS,
  monthLabels = DEFAULT_MONTH_LABELS,
  disableWeekends = false,
  isDateDisabled,
  renderDate,
}: CalendarProps) {
  // --- 状态 ---
  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue ?? null);
  const selectedDate = value !== undefined ? value : internalValue;
  const todayDate = new Date();

  const [viewYear, setViewYear] = useState(() =>
    selectedDate ? selectedDate.getFullYear() : todayDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    selectedDate ? selectedDate.getMonth() : todayDate.getMonth()
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // --- 标记查找表 ---
  const markerMap = useMemo(() => {
    const map = new Map<string, CalendarMarker>();
    for (const m of markers) {
      map.set(m.date, m);
    }
    return map;
  }, [markers]);

  // --- 导航 ---
  const goToPrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
    // callback 在下一次渲染时触发
    setTimeout(() => {
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      onMonthChange?.(y, m);
    }, 0);
  }, [viewYear, viewMonth, onMonthChange]);

  const goToNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setTimeout(() => {
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      onMonthChange?.(y, m);
    }, 0);
  }, [viewYear, viewMonth, onMonthChange]);

  // --- 日期选择 ---
  const selectDate = useCallback(
    (date: Date) => {
      if (value === undefined) {
        setInternalValue(date);
      }
      onChange?.(date);
    },
    [value, onChange],
  );

  // --- 检查日期是否可选中 ---
  const isSelectable = useCallback(
    (date: Date): boolean => {
      if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
        return false;
      }
      if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) {
        return false;
      }
      if (disableWeekends && isWeekend(date)) {
        return false;
      }
      if (isDateDisabled?.(date)) {
        return false;
      }
      return true;
    },
    [minDate, maxDate, disableWeekends, isDateDisabled],
  );

  // --- 渲染日期网格 ---
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const cells: React.ReactNode[] = [];

  // 上月填充
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1 < 0 ? 11 : viewMonth - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const date = new Date(viewYear, viewMonth - 1, day);
    cells.push(
      <button
        key={`prev-${day}`}
        style={{ ...STYLES.dayCell, color: '#334155', cursor: 'default' }}
        disabled
        aria-label={`${viewMonth === 0 ? viewYear - 1 : viewYear}年${viewMonth === 0 ? 12 : viewMonth}月${day}日`}
      >
        {day}
      </button>,
    );
  }

  // 当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(viewYear, viewMonth, day);
    const dateKey = toDateKey(date);
    const selected = selectedDate ? isSameDay(date, selectedDate) : false;
    const today = isToday(date);
    const selectable = isSelectable(date);
    const marker = markerMap.get(dateKey);
    const hovered = hoverDate ? isSameDay(date, hoverDate) : false;

    const cellStyle: React.CSSProperties = {
      ...STYLES.dayCell,
      color: selectable ? '#e2e8f0' : '#4b5563',
      cursor: selectable ? 'pointer' : 'not-allowed',
      background: 'transparent',
      fontWeight: today ? 700 : 400,
    };

    if (selected) {
      cellStyle.background = '#3b82f6';
      cellStyle.color = '#fff';
      cellStyle.fontWeight = 700;
    } else if (hovered && selectable) {
      cellStyle.background = 'rgba(59, 130, 246, 0.18)';
    } else if (marker?.type === 'highlight') {
      cellStyle.background = marker.color ?? MARKER_COLORS.highlight;
    }

    const dotColor = (marker?.color ?? MARKER_COLORS.dot) as string;
    const badgeColor = (marker?.color ?? MARKER_COLORS.badge) as string;
    const markerEl =
      marker?.type === 'dot' ? (
        <span style={markerDotStyle(dotColor)} />
      ) : marker?.type === 'badge' ? (
        <span style={markerBadgeStyle(badgeColor)} title={marker.label}>
          {marker.label}
        </span>
      ) : null;

    cells.push(
      <button
        key={`day-${day}`}
        style={cellStyle}
        disabled={!selectable}
        onClick={() => selectable && selectDate(date)}
        onMouseEnter={() => selectable && setHoverDate(date)}
        onMouseLeave={() => setHoverDate(null)}
        aria-label={`${viewYear}年${viewMonth + 1}月${day}日${selected ? ' (已选中)' : ''}${today ? ' (今天)' : ''}`}
        aria-selected={selected}
      >
        {renderDate ? renderDate(date, selected, today) : day}
        {markerEl}
        {today && !selected && <span style={STYLES.todayIndicator} />}
      </button>,
    );
  }

  // 下月填充
  const remainingCells = 7 - (cells.length % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      cells.push(
        <button
          key={`next-${day}`}
          style={{ ...STYLES.dayCell, color: '#334155', cursor: 'default' }}
          disabled
          aria-label={`${viewMonth === 11 ? viewYear + 1 : viewYear}年${viewMonth === 11 ? 1 : viewMonth + 2}月${day}日`}
        >
          {day}
        </button>,
      );
    }
  }

  return (
    <div className={className} style={STYLES.container} role="grid" aria-label="日历">
      {/* 头部：月份导航 */}
      <div style={STYLES.header}>
        <button
          style={STYLES.navButton}
          onClick={goToPrevMonth}
          aria-label="上个月"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)';
          }}
        >
          <ChevronLeft />
        </button>
        <span style={STYLES.monthLabel}>
          {viewYear}年 {monthLabels[viewMonth]}
        </span>
        <button
          style={STYLES.navButton}
          onClick={goToNextMonth}
          aria-label="下个月"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)';
          }}
        >
          <ChevronRight />
        </button>
      </div>

      {/* 星期标题 */}
      <div style={STYLES.weekDayRow} role="row">
        {weekDayLabels.map((label) => (
          <div key={label} style={STYLES.weekDayCell} role="columnheader">
            {label}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div style={STYLES.dayGrid} role="rowgroup">
        {cells}
      </div>
    </div>
  );
}
