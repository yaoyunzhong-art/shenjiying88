import React from 'react';
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
export interface DrawerProps {
    /** 是否显示 */
    open: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 标题 */
    title?: string;
    /** 侧边栏位置 */
    placement?: DrawerPlacement;
    /** 自定义宽度 (left/right) 或高度 (top/bottom) */
    size?: number;
    /** 是否显示关闭按钮 */
    showClose?: boolean;
    /** 点击遮罩是否关闭 */
    maskClosable?: boolean;
    /** 按下 Escape 是否关闭 */
    keyboardClosable?: boolean;
    /** 子内容 */
    children: React.ReactNode;
    /** 底部区域（如操作按钮） */
    footer?: React.ReactNode;
    /** CSS z-index */
    zIndex?: number;
}
/**
 * Drawer — 侧边抽屉组件。
 *
 * 从屏幕边缘滑入的面板，常用于详情展示、表单编辑、过滤面板等场景。
 * 支持上下左右四个方向的滑入，与 Modal 互补。
 *
 * @example
 * <Drawer open={visible} onClose={() => setVisible(false)} title="用户详情" placement="right">
 *   <p>用户信息...</p>
 * </Drawer>
 */
export declare function Drawer({ open, onClose, title, placement, size, showClose, maskClosable, keyboardClosable, children, footer, zIndex, }: DrawerProps): React.JSX.Element | null;
