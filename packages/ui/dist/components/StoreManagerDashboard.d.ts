import React from 'react';
/** 今日运营指标 */
export interface StoreDailyMetrics {
    revenue: number;
    orderCount: number;
    avgOrderValue: number;
    newMembers: number;
    /** 同比变化 (百分比点数, 正 = 上升) */
    revenueTrend: number;
    orderTrend: number;
    avgValueTrend: number;
    memberTrend: number;
}
/** 待办任务 */
export interface PendingTask {
    id: string;
    title: string;
    type: 'inventory' | 'member' | 'order' | 'device' | 'alert';
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
    description?: string;
}
/** 设备状态摘要 */
export interface DeviceStatusSummary {
    total: number;
    online: number;
    offline: number;
    warning: number;
    lastCheckAt?: string;
}
/** 快速操作 */
export interface QuickAction {
    key: string;
    label: string;
    icon?: string;
    /** 是否为主要操作 (高亮) */
    primary?: boolean;
    onClick?: () => void;
}
/** 店长工作台 Props */
export interface StoreManagerDashboardProps {
    /** 今日运营指标 */
    dailyMetrics?: StoreDailyMetrics;
    /** 待办任务列表 */
    pendingTasks?: PendingTask[];
    /** 设备状态 */
    deviceStatus?: DeviceStatusSummary;
    /** 快速操作按钮 */
    quickActions?: QuickAction[];
    /** 门店名称 */
    storeName?: string;
    /** 最后同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 (移动端适配) */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
/**
 * StoreManagerDashboard — 店长工作台
 *
 * 聚合店长日常运营所需的核心数据、待办任务、设备状态与快速操作入口。
 * 适用于 SaaS / 零售 / 餐饮门店管理场景。
 *
 * @example
 * <StoreManagerDashboard
 *   storeName="朝阳旗舰店"
 *   dailyMetrics={{ revenue: 52800, orderCount: 342, avgOrderValue: 154.4, newMembers: 12, revenueTrend: 5.2, orderTrend: -1.3, avgValueTrend: 3.1, memberTrend: 8.0 }}
 *   pendingTasks={[{ id: '1', title: 'SKU-089 库存不足', type: 'inventory', priority: 'high', createdAt: '10:45' }]}
 *   deviceStatus={{ total: 48, online: 42, offline: 3, warning: 3 }}
 *   quickActions={[{ key: 'scan', label: '扫码入库', primary: true }]}
 * />
 */
export declare function StoreManagerDashboard({ dailyMetrics, pendingTasks, deviceStatus, quickActions, storeName, lastSyncAt, loading, compact, className, }: StoreManagerDashboardProps): React.JSX.Element;
