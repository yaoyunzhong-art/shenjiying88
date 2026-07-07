import React from 'react';
/** 辖区门店概览 */
export interface DistrictStoreSnapshot {
    id: string;
    name: string;
    /** 区域 */
    region: string;
    /** 门店状态 */
    status: 'operating' | 'closed_today' | 'paused' | 'offline';
    /** 今日营收 */
    todayRevenue: number;
    /** 营收达标率 (0-100) */
    revenueRate: number;
    /** 客流量 */
    visitorCount: number;
    /** 本月KPI完成率 */
    monthlyKpiRate: number;
    /** 活跃告警数 */
    alertCount: number;
    /** 在岗人数 */
    staffOnDuty: number;
    /** 上次巡检时间 */
    lastInspectionAt?: string;
}
/** 辖区汇总指标 */
export interface DistrictSummary {
    /** 管辖门店数 */
    totalStores: number;
    /** 营业中 */
    operatingStores: number;
    /** 今日总营收 */
    totalRevenue: number;
    /** 营收环比 (百分比点数) */
    revenueQoQ: number;
    /** 总客流量 */
    totalVisitors: number;
    /** 客流环比 */
    visitorsQoQ: number;
    /** 平均KPI达成率 */
    avgKpiRate: number;
    /** KPI环比 */
    kpiRateQoQ: number;
    /** 待处理告警总数 */
    pendingAlerts: number;
    /** 告警环比 */
    alertsQoQ: number;
}
/** 巡店任务 */
export interface InspectionTask {
    id: string;
    storeId: string;
    storeName: string;
    /** 巡检类型 */
    type: 'routine' | 'spot_check' | 'compliance' | 'hygiene' | 'device';
    /** 优先级 */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** 状态 */
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'overdue';
    /** 截止时间 */
    deadline: string;
    /** 指派人 */
    assignee?: string;
    /** 结果备注 */
    result?: string;
}
/** 快速动作 */
export interface OpsQuickAction {
    key: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick?: () => void;
}
/** 运营主管工作台 Props */
export interface OperationsManagerDashboardProps {
    /** 辖区汇总指标 */
    districtSummary?: DistrictSummary;
    /** 辖区门店概览列表 */
    stores?: DistrictStoreSnapshot[];
    /** 巡店任务列表 */
    inspectionTasks?: InspectionTask[];
    /** 快速操作 */
    quickActions?: OpsQuickAction[];
    /** 运营主管名称 */
    managerName?: string;
    /** 管辖区域名称 */
    districtName?: string;
    /** 最后同步时间 */
    lastSyncAt?: string;
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 自定义类名 */
    className?: string;
}
/**
 * OperationsManagerDashboard — 运营主管工作台
 *
 * 面向多门店运营主管角色，聚合辖区运营概览、门店KPI对比、巡店任务管理和快速操作入口。
 * 适用于连锁零售/SaaS多门店管理场景。
 *
 * @example
 * <OperationsManagerDashboard
 *   managerName="李明"
 *   districtName="华东区"
 *   districtSummary={{ totalStores: 12, operatingStores: 11, totalRevenue: 526800, revenueQoQ: 3.2, totalVisitors: 8420, visitorsQoQ: 5.1, avgKpiRate: 87.3, kpiRateQoQ: 2.8, pendingAlerts: 7, alertsQoQ: -12.5 }}
 *   stores={[{ id: 's1', name: '朝阳旗舰店', region: '北京', status: 'operating', todayRevenue: 52800, revenueRate: 92, visitorCount: 1280, monthlyKpiRate: 88.5, alertCount: 2, staffOnDuty: 8 }]}
 *   inspectionTasks={[{ id: 't1', storeId: 's1', storeName: '朝阳旗舰店', type: 'routine', priority: 'high', status: 'pending', deadline: '2026-06-23' }]}
 *   quickActions={[{ key: 'patrol', label: '发起巡店', primary: true }]}
 * />
 */
export declare function OperationsManagerDashboard({ districtSummary, stores, inspectionTasks, quickActions, managerName, districtName, lastSyncAt, loading, compact, className, }: OperationsManagerDashboardProps): React.JSX.Element;
