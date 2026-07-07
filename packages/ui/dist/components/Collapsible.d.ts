import React from 'react';
export interface CollapsibleProps {
    /** 标题内容 */
    title: React.ReactNode;
    /** 子内容 */
    children: React.ReactNode;
    /** 是否默认展开 */
    defaultOpen?: boolean;
    /** 受控展开状态 */
    open?: boolean;
    /** 展开/折叠回调 */
    onOpenChange?: (open: boolean) => void;
    /** 标题右侧额外操作区 */
    extra?: React.ReactNode;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 展开/折叠动画时长(ms)，0 表示无动画 */
    animationDuration?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义展开图标，默认 ▲/▼ */
    expandIcon?: React.ReactNode;
    /** 是否隐藏展开图标 */
    hideExpandIcon?: boolean;
}
/**
 * Collapsible — 可折叠内容面板
 *
 * 支持受控/非受控模式、动画过渡、标题额外操作区。
 */
export declare const Collapsible: React.FC<CollapsibleProps>;
export default Collapsible;
