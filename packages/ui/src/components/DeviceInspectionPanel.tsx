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

const statusConfig: Record<InspectionItem['status'], { label: string; color: string; bg: string }> = {
  healthy: { label: '正常', color: '#16a34a', bg: '#dcfce7' },
  warning: { label: '警告', color: '#ca8a04', bg: '#fef9c3' },
  critical: { label: '严重', color: '#dc2626', bg: '#fee2e2' },
  offline: { label: '离线', color: '#6b7280', bg: '#f3f4f6' },
};

const severityConfig: Record<InspectionAlert['severity'], { color: string; icon: string }> = {
  info: { color: '#2563eb', icon: 'ℹ️' },
  warning: { color: '#ca8a04', icon: '⚠️' },
  critical: { color: '#dc2626', icon: '🔴' },
};

function formatUptime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}分钟`;
  if (hours < 24) return `${Math.round(hours)}小时`;
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return `${d}天${h > 0 ? ` ${h}小时` : ''}`;
}

function formatMetric(value: number, unit: string, threshold: number): React.CSSProperties {
  const color = value >= threshold ? '#dc2626' : value >= threshold * 0.7 ? '#ca8a04' : '#16a34a';
  return { color, fontWeight: 600 };
}

export const DeviceInspectionPanel: React.FC<DeviceInspectionPanelProps> = ({
  devices,
  summary,
  onDeviceClick,
  onAcknowledgeAlert,
  onStartInspection,
  onExportReport,
  loading = false,
  error = null,
  className,
}) => {
  if (loading) {
    return (
      <div data-testid="device-inspection-loading" className={className} style={{ padding: 24 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} data-testid="skeleton-card" style={{ height: 80, borderRadius: 12, background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
        <div style={{ marginTop: 24, height: 200, borderRadius: 12, background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="device-inspection-error" className={className} style={{ padding: 24, textAlign: 'center', color: '#dc2626' }}>
        <p>⚠️ {error}</p>
      </div>
    );
  }

  const pendingAlerts = devices.reduce((count, d) => count + d.alerts.filter((a) => !a.acknowledged).length, 0);

  return (
    <div data-testid="device-inspection-panel" className={className} style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Summary Bar */}
      <div data-testid="inspection-summary" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
        <SummaryCard label="设备总数" value={summary.total} color="#1e293b" />
        <SummaryCard label="正常" value={summary.healthy} color="#16a34a" />
        <SummaryCard label="警告" value={summary.warning} color="#ca8a04" />
        <SummaryCard label="严重" value={summary.critical} color="#dc2626" />
        <SummaryCard label="离线" value={summary.offline} color="#6b7280" />
      </div>

      {/* System Metrics */}
      <div data-testid="inspection-metrics" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <MetricGauge label="平均 CPU" value={summary.avgCpuUsage} unit="%" max={100} />
        <MetricGauge label="平均内存" value={summary.avgMemoryUsage} unit="%" max={100} />
        <MetricGauge label="平均温度" value={summary.avgTemperature} unit="°C" max={100} />
      </div>

      {/* Action Bar */}
      <div data-testid="inspection-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: '#64748b' }}>
          共 {devices.length} 台设备 · {pendingAlerts > 0 ? `${pendingAlerts} 条未处理告警` : '无待处理告警'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="start-inspection-btn"
            onClick={onStartInspection}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            开始巡检
          </button>
          <button
            data-testid="export-report-btn"
            onClick={onExportReport}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            导出报告
          </button>
        </div>
      </div>

      {/* Device Table */}
      <div data-testid="device-table" style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>设备名称</th>
              <th style={thStyle}>类型</th>
              <th style={thStyle}>位置</th>
              <th style={thStyle}>状态</th>
              <th style={thStyle}>CPU</th>
              <th style={thStyle}>内存</th>
              <th style={thStyle}>温度</th>
              <th style={thStyle}>运行时长</th>
              <th style={thStyle}>上次巡检</th>
              <th style={thStyle}>告警</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  暂无设备数据
                </td>
              </tr>
            ) : (
              devices.map((device) => {
                const statusCfg = statusConfig[device.status];
                return (
                  <tr
                    key={device.id}
                    data-testid={`device-row-${device.id}`}
                    onClick={() => onDeviceClick?.(device)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: onDeviceClick ? 'pointer' : 'default' }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{device.deviceName}</div>
                    </td>
                    <td style={tdStyle}>{device.deviceType}</td>
                    <td style={tdStyle}>{device.location}</td>
                    <td style={tdStyle}>
                      <span
                        data-testid={`status-${device.id}`}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: statusCfg.bg,
                          color: statusCfg.color,
                        }}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={formatMetric(device.metrics.cpuUsage, '%', 90)}>{device.metrics.cpuUsage}%</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={formatMetric(device.metrics.memoryUsage, '%', 90)}>{device.metrics.memoryUsage}%</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={formatMetric(device.metrics.temperature, '°C', 80)}>{device.metrics.temperature}°C</span>
                    </td>
                    <td style={tdStyle}>{formatUptime(device.metrics.uptimeHours)}</td>
                    <td style={tdStyle}>{new Date(device.lastInspectedAt).toLocaleDateString('zh-CN')}</td>
                    <td style={tdStyle}>
                      {device.alerts.filter((a) => !a.acknowledged).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {device.alerts
                            .filter((a) => !a.acknowledged)
                            .slice(0, 2)
                            .map((alert) => (
                              <div
                                key={alert.id}
                                data-testid={`alert-${alert.id}`}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                              >
                                <span>{severityConfig[alert.severity].icon}</span>
                                <span style={{ color: severityConfig[alert.severity].color }}>{alert.message}</span>
                                <button
                                  data-testid={`acknowledge-${alert.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAcknowledgeAlert?.(device.id, alert.id);
                                  }}
                                  style={{
                                    marginLeft: 4,
                                    padding: '1px 6px',
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: '1px solid #d1d5db',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  确认
                                </button>
                              </div>
                            ))}
                          {device.alerts.filter((a) => !a.acknowledged).length > 2 && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              +{device.alerts.filter((a) => !a.acknowledged).length - 2} 条更多
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>无告警</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

const SummaryCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div
    data-testid={`summary-card-${label}`}
    style={{
      padding: '16px 20px',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      background: '#fff',
    }}
  >
    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
  </div>
);

const MetricGauge: React.FC<{ label: string; value: number; unit: string; max: number }> = ({ label, value, unit, max }) => {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= 90 ? '#dc2626' : value >= 70 ? '#ca8a04' : '#16a34a';
  return (
    <div
      data-testid={`metric-gauge-${label}`}
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
        <div
          data-testid={`gauge-bar-${label}`}
          style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, transition: 'width 0.3s ease' }}
        />
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  color: '#1e293b',
  verticalAlign: 'top',
};

export default DeviceInspectionPanel;
