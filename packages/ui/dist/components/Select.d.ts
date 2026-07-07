import React from 'react';
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface SelectProps {
    /** 当前选中值（受控） */
    value?: string;
    /** 值变化回调 */
    onChange?: (value: string) => void;
    /** 选项列表 */
    options: SelectOption[];
    /** 占位文本 */
    placeholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否允许清除 */
    allowClear?: boolean;
    /** 是否可搜索 */
    showSearch?: boolean;
    /** 搜索占位文本 */
    searchPlaceholder?: string;
    /** 空数据提示 */
    notFoundContent?: React.ReactNode;
    /** 最小宽度 */
    minWidth?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 下拉框类名 */
    dropdownClassName?: string;
    /** 表单 name */
    name?: string;
    /** aria-label */
    'aria-label'?: string;
    /** aria-labelledby */
    'aria-labelledby'?: string;
}
/**
 * Select — 下拉选择器组件。
 *
 * 提供单选下拉选择能力，支持搜索过滤、清除选择、禁用状态。
 * 自动处理点击外部关闭和键盘导航（Escape 关闭，Enter 确认）。
 *
 * @example
 * <Select
 *   value={selected}
 *   onChange={setSelected}
 *   options={[
 *     { value: 'apple', label: '苹果' },
 *     { value: 'banana', label: '香蕉' },
 *   ]}
 *   placeholder="请选择水果"
 * />
 */
export declare function Select({ value, onChange, options, placeholder, disabled, allowClear, showSearch, searchPlaceholder, notFoundContent, minWidth, className, style, dropdownClassName, name, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, }: SelectProps): React.JSX.Element;
export default Select;
