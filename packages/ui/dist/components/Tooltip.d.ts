import React from 'react';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export interface TooltipProps {
    /** 提示文字 */
    content: React.ReactNode;
    /** 触发元素 */
    children: React.ReactNode;
    /** 弹出方向 */
    placement?: TooltipPlacement;
    /** 延迟显示毫秒 */
    delayMs?: number;
    /** 最大宽度 */
    maxWidth?: number;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 自定义类名 */
    className?: string;
}
export declare const Tooltip: React.NamedExoticComponent<TooltipProps>;
export default Tooltip;
