import React from 'react';
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
export declare function Calendar({ value, defaultValue, onChange, onMonthChange, markers, minDate, maxDate, className, weekDayLabels, monthLabels, disableWeekends, isDateDisabled, renderDate, }: CalendarProps): React.JSX.Element;
