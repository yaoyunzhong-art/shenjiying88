import React from 'react';
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
export interface PopoverProps {
    /** 触发器元素 */
    trigger: React.ReactNode;
    /** popover 弹层内容 */
    children: React.ReactNode;
    /** 可选标题 */
    title?: string;
    /** 弹出方向，默认 bottom */
    placement?: PopoverPlacement;
    /** 触发方式，默认 click */
    triggerMode?: 'click' | 'hover';
    /** 弹出后是否显示关闭按钮 */
    showClose?: boolean;
    /** 最大宽度 */
    maxWidth?: number;
    /** 最小宽度 */
    minWidth?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 打开/关闭回调 */
    onOpenChange?: (open: boolean) => void;
}
export declare const Popover: React.NamedExoticComponent<PopoverProps>;
export default Popover;
