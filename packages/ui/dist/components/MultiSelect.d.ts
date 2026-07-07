import React from 'react';
export interface MultiSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface MultiSelectProps {
    /** 当前选中的值数组（受控） */
    value?: string[];
    /** 值变化回调 */
    onChange?: (values: string[]) => void;
    /** 选项列表 */
    options: MultiSelectOption[];
    /** 占位文本 */
    placeholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否可搜索 */
    showSearch?: boolean;
    /** 搜索占位文本 */
    searchPlaceholder?: string;
    /** 空数据提示 */
    notFoundContent?: React.ReactNode;
    /** 全选文本 */
    selectAllText?: string;
    /** 清除全部文本 */
    clearAllText?: string;
    /** 已选显示最大数量（超出显示 +N） */
    maxTagCount?: number;
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
}
/**
 * MultiSelect — 多选下拉选择器组件。
 *
 * 提供多选下拉选择能力，支持搜索过滤、全选、已选标签展示、超出折叠。
 * 自动处理点击外部关闭和键盘导航（Escape 关闭，Enter 确认）。
 *
 * @example
 * <MultiSelect
 *   value={selectedValues}
 *   onChange={setSelectedValues}
 *   options={[
 *     { value: 'apple', label: '苹果' },
 *     { value: 'banana', label: '香蕉' },
 *     { value: 'cherry', label: '樱桃' },
 *   ]}
 *   placeholder="请选择水果"
 * />
 */
export declare function MultiSelect({ value, onChange, options, placeholder, disabled, showSearch, searchPlaceholder, notFoundContent, selectAllText, clearAllText, maxTagCount, minWidth, className, style, dropdownClassName, name, 'aria-label': ariaLabel, }: MultiSelectProps): React.JSX.Element;
export default MultiSelect;
