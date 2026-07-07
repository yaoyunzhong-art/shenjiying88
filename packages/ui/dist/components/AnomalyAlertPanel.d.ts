import React from 'react';
/** 异常严重程度 */
export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';
/** 异常来源 */
export type AnomalySource = 'device' | 'member' | 'transaction' | 'system' | 'network';
/** 单条异常告警 */
export interface AnomalyAlert {
    /** 告警 ID */
    id: string;
    /** 告警标题 */
    title: string;
    /** 告警描述 */
    description: string;
    /** 严重程度 */
    severity: AnomalySeverity;
    /** 来源类型 */
    source: AnomalySource;
    /** 发生时间 */
    timestamp: string;
    /** 影响范围描述 */
    impact?: string;
    /** 是否已确认 */
    acknowledged: boolean;
    /** 相关指标值 */
    metricValue?: number;
    /** 指标阈值 */
    metricThreshold?: number;
    /** 指标单位 */
    metricUnit?: string;
}
/** 告警汇总统计 */
export interface AnomalySummary {
    /** 总告警数 */
    total: number;
    /** 未确认数 */
    unacknowledged: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
}
/** 异常告警面板 Props */
export interface AnomalyAlertPanelProps {
    /** 告警数据列表 */
    alerts: AnomalyAlert[];
    /** 面板标题 */
    title?: string;
    /** 最大显示条数 */
    maxDisplay?: number;
    /** 是否显示汇总统计 */
    showSummary?: boolean;
    /** 是否显示筛选栏 */
    showFilters?: boolean;
    /** 刷新间隔(ms)，默认不自动刷新 */
    refreshIntervalMs?: number;
    /** 确认告警回调 */
    onAcknowledge?: (alertId: string) => void;
    /** 确认全部回调 */
    onAcknowledgeAll?: () => void;
    /** 查看详情回调 */
    onViewDetail?: (alert: AnomalyAlert) => void;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
}
/**
 * AnomalyAlertPanel — 异常告警面板组件。
 *
 * 用于集中展示系统中的各类异常告警，支持：
 * - 告警列表（按严重程度排序）
 * - 汇总统计（总数/未确认/各级别数量）
 * - 严重程度筛选
 * - 来源类型筛选
 * - 确认/确认全部操作
 * - 展开查看详情
 * - 空状态处理
 *
 * @example
 * // 基础用法
 * <AnomalyAlertPanel
 *   title="实时告警监控"
 *   alerts={[
 *     {
 *       id: '1',
 *       title: '设备温度过高',
 *       description: '设备 #A103 温度达到 85°C，超过安全阈值 75°C',
 *       severity: 'critical',
 *       source: 'device',
 *       timestamp: new Date().toISOString(),
 *       acknowledged: false,
 *       impact: '可能影响 3 条产线',
 *       metricValue: 85,
 *       metricThreshold: 75,
 *       metricUnit: '°C',
 *     },
 *   ]}
 *   onAcknowledge={(id) => console.log('ack', id)}
 *   onViewDetail={(a) => console.log('detail', a)}
 * />
 *
 * @example
 * // 空状态
 * <AnomalyAlertPanel
 *   alerts={[]}
 *   emptyText="✅ 当前无异常告警，系统运行正常"
 * />
 */
export declare function AnomalyAlertPanel({ alerts, title, maxDisplay, showSummary, showFilters, onAcknowledge, onAcknowledgeAll, onViewDetail, className, emptyText, }: AnomalyAlertPanelProps): React.JSX.Element;
export default AnomalyAlertPanel;
