import React from 'react';
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
declare const DateRangePicker: React.FC<DateRangePickerProps>;
export default DateRangePicker;
