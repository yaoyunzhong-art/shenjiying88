import React from 'react';
export interface PresetColor {
    label: string;
    value: string;
}
export interface ColorPickerProps {
    /** 当前颜色值 */
    value?: string;
    /** 颜色变化回调 */
    onChange?: (value: string) => void;
    /** 预置颜色列表 */
    presets?: PresetColor[];
    /** 是否显示预设色板 */
    showPresets?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否允许清空 */
    allowClear?: boolean;
    /** 标签文本 */
    label?: string;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 占位文本 */
    placeholder?: string;
    /** 表单 name */
    name?: string;
    /** aria-label */
    'aria-label'?: string;
}
export declare const ColorPicker: React.FC<ColorPickerProps>;
export default ColorPicker;
