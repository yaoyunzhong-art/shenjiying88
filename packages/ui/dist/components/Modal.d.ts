import React from 'react';
export interface ModalProps {
    /** 是否显示 */
    open: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 标题 */
    title?: string;
    /** 是否显示关闭按钮 */
    showClose?: boolean;
    /** 自定义宽度 */
    width?: number;
    /** 点击遮罩是否关闭 */
    maskClosable?: boolean;
    /** 按下 Escape 是否关闭 */
    keyboardClosable?: boolean;
    /** 子内容 */
    children: React.ReactNode;
    /** 底部区域（如按钮组） */
    footer?: React.ReactNode;
}
/**
 * Modal — 通用弹窗组件。
 *
 * 支持标题、自定义内容、底部操作区、遮罩关闭、键盘 Escape 关闭。
 * 使用 Portal 渲染到 document.body。
 *
 * @example
 * <Modal open={visible} onClose={() => setVisible(false)} title="编辑信息">
 *   <FormField label="名称">
 *     <input type="text" />
 *   </FormField>
 * </Modal>
 */
export declare function Modal({ open, onClose, title, showClose, width, maskClosable, keyboardClosable, children, footer, }: ModalProps): React.JSX.Element | null;
