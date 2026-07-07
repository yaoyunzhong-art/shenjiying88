import React from 'react';
export type RadioSize = 'sm' | 'md' | 'lg';
export type RadioDirection = 'horizontal' | 'vertical';
export interface RadioOption<T extends string = string> {
    /** 选项值 */
    value: T;
    /** 选项标签 */
    label: string;
    /** 禁用该选项 */
    disabled?: boolean;
    /** 辅助说明文字 */
    description?: string;
}
export interface RadioGroupProps<T extends string = string> {
    /** 选项列表 */
    options: RadioOption<T>[];
    /** 受控：当前选中值 */
    value?: T;
    /** 非受控：默认选中值 */
    defaultValue?: T;
    /** 值变化回调 */
    onChange?: (value: T) => void;
    /** 字段名（用于表单提交） */
    name?: string;
    /** 排列方向 */
    direction?: RadioDirection;
    /** 尺寸 */
    size?: RadioSize;
    /** 是否禁用整个组 */
    disabled?: boolean;
    /** 是否必选标记 */
    required?: boolean;
    /** 组标签 */
    label?: string;
    /** 错误信息 */
    error?: string;
    /** 辅助提示 */
    hint?: string;
    /** data-testid 前缀 */
    'data-testid'?: string;
    /** 额外 className */
    className?: string;
    /** 内联样式覆盖 */
    style?: React.CSSProperties;
    /** 单个选项样式覆盖 */
    optionStyle?: React.CSSProperties;
}
/**
 * RadioGroup — 单选组组件。
 *
 * 支持受控/非受控、水平/垂直排列、三种尺寸、禁用、错误态、
 * 单选项附带描述，以及完整键盘 & ARIA 可访问性。
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   options={[
 *     { value: 'active', label: '启用' },
 *     { value: 'inactive', label: '停用', description: '停用后不可恢复' },
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 *   direction="horizontal"
 * />
 * ```
 */
export declare function RadioGroup<T extends string = string>({ options, value: controlledValue, defaultValue, onChange, name, direction, size, disabled, required, label: groupLabel, error, hint, 'data-testid': dataTestId, className, style, optionStyle, }: RadioGroupProps<T>): React.JSX.Element;
