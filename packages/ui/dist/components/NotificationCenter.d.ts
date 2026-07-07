import React from 'react';
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';
export type NotificationCategory = 'system' | 'member' | 'device' | 'order' | 'alert';
export interface NotificationItem {
    id: string;
    title: string;
    description: string;
    severity: NotificationSeverity;
    category: NotificationCategory;
    timestamp: number;
    read: boolean;
    /** 可选链接，点击跳转 */
    link?: string;
    /** 可选操作按钮 */
    actions?: NotificationAction[];
}
export interface NotificationAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
}
export interface NotificationSummary {
    total: number;
    unread: number;
    byCategory: Partial<Record<NotificationCategory, number>>;
}
export interface NotificationCenterProps {
    notifications: NotificationItem[];
    /** 点击通知 */
    onNotificationClick?: (item: NotificationItem) => void;
    /** 标记为已读 */
    onMarkAsRead?: (id: string) => void;
    /** 标记全部已读 */
    onMarkAllAsRead?: () => void;
    /** 删除通知 */
    onDelete?: (id: string) => void;
    /** 清空已读 */
    onClearRead?: () => void;
    /** 自定义空状态 */
    emptyText?: string;
    /** 最大高度 */
    maxHeight?: number;
}
export declare function NotificationCenter({ notifications, onNotificationClick, onMarkAsRead, onMarkAllAsRead, onDelete, onClearRead, emptyText, maxHeight, }: NotificationCenterProps): React.JSX.Element;
export declare function useNotificationSummary(notifications: NotificationItem[]): NotificationSummary;
