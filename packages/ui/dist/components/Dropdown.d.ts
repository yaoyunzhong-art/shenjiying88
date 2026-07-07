import React from 'react';
export interface DropdownItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
    onClick?: () => void;
}
export interface DropdownProps {
    /** 触发器内容 */
    trigger: React.ReactNode;
    /** 下拉菜单项 */
    items: DropdownItem[];
    /** 菜单对齐方向 */
    align?: 'left' | 'right';
    /** 触发方式 */
    triggerMode?: 'click' | 'hover';
    /** 最小宽度 */
    minWidth?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义样式 */
    className?: string;
    style?: React.CSSProperties;
}
/**
 * Dropdown — 下拉菜单组件。
 *
 * 提供操作菜单能力，支持分隔线、危险操作样式和禁用状态。
 * 自动处理点击外部关闭和键盘 Escape 关闭。
 *
 * @example
 * <Dropdown
 *   trigger={<button>操作</button>}
 *   items={[
 *     { key: 'edit', label: '编辑', onClick: () => {} },
 *     { key: 'delete', label: '删除', danger: true, onClick: () => {} },
 *   ]}
 * />
 */
export declare function Dropdown({ trigger, items, align, triggerMode, minWidth, disabled, className, style, }: DropdownProps): React.JSX.Element;
