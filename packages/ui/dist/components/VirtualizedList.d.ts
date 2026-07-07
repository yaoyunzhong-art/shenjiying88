import React from 'react';
export interface VirtualizedListRow<T> {
    key: string;
    data: T;
}
export interface VirtualizedListProps<T> {
    /** 数据行列表 */
    rows: VirtualizedListRow<T>[];
    /** 每行渲染函数 */
    renderRow: (row: VirtualizedListRow<T>, index: number) => React.ReactNode;
    /** 每行高度 (px)，固定高度模式使用 */
    rowHeight?: number;
    /** 可变行高：根据行数据返回高度 */
    rowHeightFn?: (row: VirtualizedListRow<T>, index: number) => number;
    /** 容器高度，不传则自适应父容器 */
    height?: number;
    /** 容器宽度 */
    width?: string | number;
    /** 缓冲区行数（超出可视区域的预渲染行数），默认 3 */
    overscan?: number;
    /** 自定义类名 */
    className?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 空数据展示 */
    emptyText?: React.ReactNode;
    /** 行点击 */
    onRowClick?: (row: VirtualizedListRow<T>, index: number) => void;
    /** 滚动回调 */
    onScroll?: (scrollTop: number) => void;
    /** 是否禁用 */
    disabled?: boolean;
}
/**
 * VirtualizedList — 虚拟滚动列表组件。
 *
 * 只渲染可视区域内的行，通过占位元素撑开总高度实现滚动。
 * 支持固定行高和动态行高两种模式。
 *
 * @example
 * // 固定行高
 * <VirtualizedList
 *   rows={items.map((item, i) => ({ key: String(i), data: item }))}
 *   rowHeight={48}
 *   height={600}
 *   renderRow={(row, index) => <div>{row.data.name}</div>}
 * />
 *
 * @example
 * // 动态行高
 * <VirtualizedList
 *   rows={items.map((item, i) => ({ key: String(i), data: item }))}
 *   rowHeightFn={(row) => row.data.expanded ? 120 : 48}
 *   height={600}
 *   renderRow={(row, index) => <ExpandableRow data={row.data} />}
 * />
 */
export declare function VirtualizedList<T>({ rows, renderRow, rowHeight, rowHeightFn, height: heightProp, width, overscan, className, style, emptyText, onRowClick, onScroll, disabled, }: VirtualizedListProps<T>): React.JSX.Element;
export default VirtualizedList;
