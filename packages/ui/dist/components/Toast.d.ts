import React from 'react';
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export interface ToastEntry {
    id: string;
    message: string;
    variant: ToastVariant;
    durationMs: number;
    createdAt: number;
}
export interface ToastOptions {
    /** 通知类型 */
    variant?: ToastVariant;
    /** 自动消失时长 ms（0 表示不自动消失） */
    durationMs?: number;
}
interface ToastContainerProps {
    toasts: ToastEntry[];
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    maxVisible?: number;
}
export declare function ToastContainer({ toasts, onDismiss, position, maxVisible, }: ToastContainerProps): React.JSX.Element;
export interface UseToastReturn {
    /** 当前活跃的通知列表 */
    toasts: ToastEntry[];
    /** 显示成功通知 */
    success: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    /** 显示错误通知 */
    error: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    /** 显示警告通知 */
    warning: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    /** 显示信息通知 */
    info: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
    /** 显示自定义变体通知 */
    toast: (message: string, options?: ToastOptions) => void;
    /** 手动关闭指定通知 */
    dismiss: (id: string) => void;
    /** 手动关闭所有通知 */
    dismissAll: () => void;
}
export declare function useToast(): UseToastReturn;
export {};
