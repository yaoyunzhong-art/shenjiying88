import React from 'react';
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
export declare const DateTimePicker: React.NamedExoticComponent<DateTimePickerProps>;
export default DateTimePicker;
