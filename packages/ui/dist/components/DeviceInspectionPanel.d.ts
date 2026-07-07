import React from 'react';
export interface InspectionItem {
    id: string;
    deviceName: string;
    deviceType: string;
    location: string;
    status: 'healthy' | 'warning' | 'critical' | 'offline';
    lastInspectedAt: string;
    inspector: string;
    metrics: InspectionMetrics;
    alerts: InspectionAlert[];
}
export interface InspectionMetrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    temperature: number;
    uptimeHours: number;
    batteryPercent?: number;
}
export interface InspectionAlert {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    triggeredAt: string;
    acknowledged: boolean;
}
export interface InspectionSummary {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    offline: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgTemperature: number;
}
export interface DeviceInspectionPanelProps {
    /** List of devices under inspection */
    devices: InspectionItem[];
    /** Summary statistics */
    summary: InspectionSummary;
    /** Callback when a device row is clicked */
    onDeviceClick?: (device: InspectionItem) => void;
    /** Callback to acknowledge an alert */
    onAcknowledgeAlert?: (deviceId: string, alertId: string) => void;
    /** Callback to start a new inspection */
    onStartInspection?: () => void;
    /** Callback to export report */
    onExportReport?: () => void;
    /** Loading state */
    loading?: boolean;
    /** Error state */
    error?: string | null;
    /** Additional CSS class */
    className?: string;
}
export declare const DeviceInspectionPanel: React.FC<DeviceInspectionPanelProps>;
export default DeviceInspectionPanel;
