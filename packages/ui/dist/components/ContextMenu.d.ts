import React from 'react';
/** 菜单项分隔线 */
export interface ContextMenuSeparator {
    kind: 'separator';
}
/** 菜单项操作 */
export interface ContextMenuItem {
    kind?: 'item';
    /** 唯一标识 */
    key: string;
    /** 显示标签 */
    label: string;
    /** 快捷键提示 */
    shortcut?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 危险操作（红色高亮） */
    danger?: boolean;
    /** 图标（可选 ReactNode） */
    icon?: React.ReactNode;
    /** 点击回调 */
    onSelect: () => void;
}
/** 菜单项类型 */
export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;
/** ContextMenu 组件属性 */
export interface ContextMenuProps {
    /** 菜单项列表 */
    items: ContextMenuEntry[];
    /** 是否显示 */
    open: boolean;
    /** 菜单位置 x */
    x: number;
    /** 菜单位置 y */
    y: number;
    /** 关闭回调 */
    onClose: () => void;
    /** 自定义宽度 */
    width?: number;
}
/**
 * ContextMenu — 右键上下文菜单组件。
 *
 * 支持菜单项、分隔线、禁用状态、危险操作样式、快捷键提示。
 * 点击外部或按下 Escape 自动关闭。
 *
 * @example
 * <div onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, open: true }); }}>
 *   <ContextMenu
 *     open={menu.open}
 *     x={menu.x}
 *     y={menu.y}
 *     items={[
 *       { key: 'edit', label: '编辑', onSelect: () => edit() },
 *       { kind: 'separator' },
 *       { key: 'delete', label: '删除', danger: true, onSelect: () => remove() },
 *     ]}
 *     onClose={() => setMenu({ ...menu, open: false })}
 *   />
 * </div>
 */
export declare function ContextMenu({ items, open, x, y, onClose, width, }: ContextMenuProps): React.JSX.Element | null;
