import React from 'react';
/** 设备状态枚举 */
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance' | 'error';
/** 设备类型 */
export type DeviceType = 'pos' | 'printer' | 'scanner' | 'display' | 'network' | 'camera' | 'sensor' | 'other';
/** 单个设备条目 */
export interface DeviceEntry {
    /** 设备 ID */
    id: string;
    /** 设备名称 */
    name: string;
    /** 设备类型 */
    type: DeviceType;
    /** 设备状态 */
    status: DeviceStatus;
    /** 最后在线时间 ISO-8601 */
    lastSeen: string;
    /** 运行时长 小时 */
    uptimeHours?: number;
    /** CPU 使用率 % */
    cpuUsage?: number;
    /** 内存使用率 % */
    memoryUsage?: number;
    /** 温度 °C */
    temperature?: number;
    /** 固件版本 */
    firmwareVersion?: string;
    /** 位置 */
    location?: string;
    /** IP 地址 */
    ipAddress?: string;
    /** 告警消息 */
    alertMessage?: string;
}
/** 设备汇总统计 */
export interface DevicePanelSummary {
    /** 设备总数 */
    total: number;
    online: number;
    offline: number;
    warning: number;
    maintenance: number;
    error: number;
}
/** 设备状态面板 Props */
export interface DeviceStatusPanelProps {
    /** 设备数据列表 */
    devices: DeviceEntry[];
    /** 面板标题 */
    title?: string;
    /** 是否显示汇总统计卡 */
    showSummary?: boolean;
    /** 是否显示设备详情行 */
    showDetails?: boolean;
    /** 最大显示条数 */
    maxDisplay?: number;
    /** 是否支持筛选 */
    showFilters?: boolean;
    /** 是否支持排序 */
    showSort?: boolean;
    /** 刷新回调 */
    onRefresh?: () => void;
    /** 设备点击回调 */
    onDeviceClick?: (device: DeviceEntry) => void;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 是否显示搜索框 */
    showSearch?: boolean;
}
/** 计算汇总统计 */
export declare function computeDeviceSummary(devices: DeviceEntry[]): DevicePanelSummary;
/**
 * DeviceStatusPanel — 设备状态实时监控面板。
 *
 * 展示门店内各类 POS 机、打印机、扫描枪、显示屏、
 * 网络设备、摄像头、传感器等物联网设备的实时运行状态。
 *
 * 特性：
 * - 状态汇总统计卡（在线/离线/告警/故障/维护）
 * - 设备行支持展开详情（CPU/内存/温度/运行时长）
 * - 按状态筛选 + 按关键词搜索
 * - 实时状态指示灯（带动画）
 * - 资源使用进度条
 *
 * @example
 * <DeviceStatusPanel
 *   title="门店A — 设备状态"
 *   devices={[
 *     {
 *       id: 'pos-01',
 *       name: '收银台POS-01',
 *       type: 'pos',
 *       status: 'online',
 *       lastSeen: new Date().toISOString(),
 *       uptimeHours: 72.5,
 *       cpuUsage: 45,
 *       memoryUsage: 62,
 *       temperature: 52,
 *       firmwareVersion: '3.2.1',
 *       location: '收银区',
 *       ipAddress: '192.168.1.101',
 *     },
 *   ]}
 *   showSummary
 *   showDetails
 *   showFilters
 *   showSearch
 * />
 *
 * @example
 * <DeviceStatusPanel
 *   title="门店B — 设备状态"
 *   devices={[
 *     { id: 'sc-01', name: '扫描枪01', type: 'scanner', status: 'warning', lastSeen: '2026-06-23T10:00:00Z', alertMessage: '连接不稳定' },
 *   ]}
 *   showSummary
 * />
 */
export declare const DeviceStatusPanel: React.FC<DeviceStatusPanelProps>;
export default DeviceStatusPanel;
