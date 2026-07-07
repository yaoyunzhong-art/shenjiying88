import React from 'react';
/** 分割方向 */
export type SplitDirection = 'horizontal' | 'vertical';
export interface SplitPaneProps {
    /** 第一个面板 (左侧/上侧) */
    first: React.ReactNode;
    /** 第二个面板 (右侧/下侧) */
    second: React.ReactNode;
    /** 分割方向 (默认 horizontal) */
    direction?: SplitDirection;
    /** 初始分割比例, 0-1 之间, 默认 0.5 */
    initialSplit?: number;
    /** 分隔条宽度 (默认 4) */
    dividerWidth?: number;
    /** 分隔条颜色 (默认 rgba(148,163,184,0.24)) */
    dividerColor?: string;
    /** 分隔条悬停颜色 (默认 rgba(148,163,184,0.48)) */
    dividerHoverColor?: string;
    /** 容器最小高度 (默认 300) */
    minHeight?: number;
    /** 容器最小宽度 (默认 300) */
    minWidth?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
}
/**
 * SplitPane — 可拖拽分割面板
 *
 * 支持水平和垂直方向分割，拖拽分隔条调整两个面板尺寸。
 * 用于管理后台的左右分栏、上下分栏等场景。
 *
 * @example
 * // 水平分割（左右）
 * <SplitPane
 *   first={<ListPanel />}
 *   second={<DetailPanel />}
 *   direction="horizontal"
 *   initialSplit={0.3}
 * />
 *
 * @example
 * // 垂直分割（上下）
 * <SplitPane
 *   first={<EditorPanel />}
 *   second={<PreviewPanel />}
 *   direction="vertical"
 *   initialSplit={0.6}
 * />
 */
export declare function SplitPane({ first, second, direction, initialSplit, dividerWidth, dividerColor, dividerHoverColor, minHeight, minWidth, className, style, }: SplitPaneProps): React.JSX.Element;
