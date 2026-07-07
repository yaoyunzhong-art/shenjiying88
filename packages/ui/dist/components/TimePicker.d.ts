import React from 'react';
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
export declare const TimePicker: React.FC<TimePickerProps>;
export default TimePicker;
