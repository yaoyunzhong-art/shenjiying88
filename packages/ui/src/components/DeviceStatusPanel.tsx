'use client';

import React, { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

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

// ==================== 工具函数 ====================

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  pos: 'POS机',
  printer: '打印机',
  scanner: '扫描枪',
  display: '显示屏',
  network: '网络设备',
  camera: '摄像头',
  sensor: '传感器',
  other: '其他设备',
};

const DEVICE_TYPE_ICONS: Record<DeviceType, string> = {
  pos: '🖥️',
  printer: '🖨️',
  scanner: '📡',
  display: '🖥️',
  network: '🌐',
  camera: '📷',
  sensor: '🌡️',
  other: '⚙️',
};

const STATUS_CONFIG: Record<
  DeviceStatus,
  { label: string; color: string; bg: string; icon: string; border: string }
> = {
  online: {
    label: '在线',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    icon: '✓',
    border: 'rgba(34,197,94,0.3)',
  },
  offline: {
    label: '离线',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    icon: '✗',
    border: 'rgba(107,114,128,0.3)',
  },
  warning: {
    label: '告警',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    icon: '!',
    border: 'rgba(245,158,11,0.3)',
  },
  maintenance: {
    label: '维护中',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    icon: '⟳',
    border: 'rgba(59,130,246,0.3)',
  },
  error: {
    label: '故障',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    icon: '✕',
    border: 'rgba(239,68,68,0.3)',
  },
};

/** 计算汇总统计 */
export function computeDeviceSummary(devices: DeviceEntry[]): DevicePanelSummary {
  const summary: DevicePanelSummary = {
    total: devices.length,
    online: 0,
    offline: 0,
    warning: 0,
    maintenance: 0,
    error: 0,
  };

  for (const d of devices) {
    const key = d.status as keyof DevicePanelSummary;
    if (key in summary && typeof summary[key] === 'number') {
      summary[key]++;
    }
  }

  return summary;
}

/** 格式化最后在线时间 */
function formatLastSeen(isoStr: string): string {
  try {
    const now = Date.now();
    const then = new Date(isoStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}小时前`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}天前`;
  } catch {
    return '未知';
  }
}

/** 格式化运行时长 */
function formatUptime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}分钟`;
  if (hours < 24) return `${Math.round(hours)}小时`;
  const days = Math.floor(hours / 24);
  const remainHr = Math.round(hours % 24);
  return remainHr > 0 ? `${days}天${remainHr}小时` : `${days}天`;
}

// ==================== 汇总统计卡 ====================

function SummaryCard({ summary }: { summary: DevicePanelSummary }) {
  const items: { label: string; count: number; color: string; bg: string }[] = [
    { label: '在线', count: summary.online, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    { label: '离线', count: summary.offline, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
    { label: '告警', count: summary.warning, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { label: '维护', count: summary.maintenance, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    { label: '故障', count: summary.error, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  ];

  return (
    <div
      className="device-status-panel__summary"
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="device-status-panel__summary-item"
          style={{
            flex: '1 1 0',
            minWidth: 80,
            background: item.bg,
            borderRadius: 10,
            padding: '10px 12px',
            border: `1px solid ${item.color}22`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>
            {item.count}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {item.label}
          </div>
        </div>
      ))}
      <div
        className="device-status-panel__summary-item device-status-panel__summary-total"
        style={{
          flex: '1 1 0',
          minWidth: 80,
          background: 'rgba(139,92,246,0.08)',
          borderRadius: 10,
          padding: '10px 12px',
          border: '1px solid rgba(139,92,246,0.22)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: '#8b5cf6' }}>
          {summary.total}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          总计
        </div>
      </div>
    </div>
  );
}

// ==================== 状态指示灯 ====================

function StatusIndicator({ status }: { status: DeviceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="device-status-panel__status-indicator"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
      title={cfg.label}
    >
      <span
        className="device-status-panel__status-dot"
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: cfg.color,
          display: 'inline-block',
          boxShadow: `0 0 6px ${cfg.color}88`,
          animation: status === 'error' || status === 'warning' ? 'deviceStatusPulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      {cfg.label}
    </span>
  );
}

// ==================== 进度条 ====================

function UsageBar({ value, color, label }: { value?: number; color: string; label: string }) {
  if (value === undefined || value === null) return null;
  const pct = Math.max(0, Math.min(100, value));
  const barColor =
    pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : color;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
      <span style={{ fontSize: 10, color: '#64748b', minWidth: 36 }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 3,
          background: 'rgba(148,163,184,0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: barColor,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 32, textAlign: 'right' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ==================== 设备行 ====================

function DeviceRow({
  device,
  showDetails,
  onClick,
}: {
  device: DeviceEntry;
  showDetails: boolean;
  onClick?: (d: DeviceEntry) => void;
}) {
  const typeIcon = DEVICE_TYPE_ICONS[device.type];
  const typeLabel = DEVICE_TYPE_LABELS[device.type];

  return (
    <div
      className="device-status-panel__row"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(15,23,42,0.2)',
        border: '1px solid rgba(148,163,184,0.08)',
        marginBottom: 6,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.2s, border-color 0.2s',
      }}
      onClick={() => onClick?.(device)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(15,23,42,0.4)';
        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(15,23,42,0.2)';
        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
      }}
    >
      {/* 主行 */}
      <div
        className="device-status-panel__row-main"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>{typeIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="device-status-panel__device-name"
            style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}
          >
            {device.name}
          </div>
          <div
            className="device-status-panel__device-meta"
            style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}
          >
            {typeLabel}
            {device.location ? ` · ${device.location}` : ''}
            {device.ipAddress ? ` · ${device.ipAddress}` : ''}
          </div>
        </div>

        <StatusIndicator status={device.status} />

        <span
          className="device-status-panel__last-seen"
          style={{ fontSize: 11, color: '#64748b', minWidth: 56, textAlign: 'right' }}
        >
          {formatLastSeen(device.lastSeen)}
        </span>
      </div>

      {/* 详情行 */}
      {showDetails && (
        <div
          className="device-status-panel__row-details"
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid rgba(148,163,184,0.06)',
          }}
        >
          {/* 资源使用 */}
          <div
            className="device-status-panel__usage"
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
          >
            <div style={{ flex: '1 1 120px', minWidth: 100 }}>
              <UsageBar value={device.cpuUsage} color="#3b82f6" label="CPU" />
              <UsageBar value={device.memoryUsage} color="#8b5cf6" label="内存" />
            </div>
            {device.temperature !== undefined && (
              <div
                className="device-status-panel__temperature"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: device.temperature > 75 ? '#ef4444' : device.temperature > 60 ? '#f59e0b' : '#22c55e',
                }}
              >
                <span>🌡️</span>
                <span style={{ fontWeight: 600 }}>{device.temperature}°C</span>
              </div>
            )}
          </div>

          {/* 底部信息 */}
          <div
            className="device-status-panel__extra"
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 6,
              fontSize: 10,
              color: '#475569',
              flexWrap: 'wrap',
            }}
          >
            {device.uptimeHours !== undefined && (
              <span>⏱ 运行 {formatUptime(device.uptimeHours)}</span>
            )}
            {device.firmwareVersion && (
              <span>📦 v{device.firmwareVersion}</span>
            )}
            {device.alertMessage && (
              <span
                className="device-status-panel__alert-message"
                style={{ color: '#f59e0b', fontWeight: 500 }}
              >
                ⚠ {device.alertMessage}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 筛选栏 ====================

const FILTER_OPTIONS: { key: DeviceStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'online', label: '在线' },
  { key: 'offline', label: '离线' },
  { key: 'warning', label: '告警' },
  { key: 'error', label: '故障' },
  { key: 'maintenance', label: '维护' },
];

// ==================== 主组件 ====================

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
export const DeviceStatusPanel: React.FC<DeviceStatusPanelProps> = ({
  devices,
  title = '设备状态监控',
  showSummary = true,
  showDetails = true,
  maxDisplay = 20,
  showFilters = true,
  showSort = false,
  onRefresh,
  onDeviceClick,
  className = '',
  emptyText = '暂无设备数据',
  showSearch = true,
}) => {
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(true);

  const summary = useMemo(() => computeDeviceSummary(devices), [devices]);

  const filteredDevices = useMemo(() => {
    let result = [...devices];

    // 状态过滤
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }

    // 关键词搜索
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          (d.location && d.location.toLowerCase().includes(q)) ||
          (d.ipAddress && d.ipAddress.toLowerCase().includes(q)) ||
          (d.alertMessage && d.alertMessage.toLowerCase().includes(q))
      );
    }

    return result.slice(0, maxDisplay);
  }, [devices, statusFilter, searchQuery, maxDisplay]);

  const isEmpty = devices.length === 0;

  return (
    <div
      className={`device-status-panel ${className}`}
      style={{
        borderRadius: 16,
        background: 'rgba(15,23,42,0.22)',
        border: '1px solid rgba(148,163,184,0.1)',
        padding: '20px 18px 16px',
        maxWidth: 720,
      }}
      role="region"
      aria-label={title}
    >
      {/* 标题栏 */}
      <div
        className="device-status-panel__header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="device-status-panel__collapse-btn"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 4px',
              lineHeight: 1,
            }}
            aria-label={expanded ? '收起' : '展开'}
          >
            {expanded ? '▼' : '▶'}
          </button>
          <h3
            className="device-status-panel__title"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#e2e8f0',
              margin: 0,
            }}
          >
            📡 {title}
          </h3>
          <span
            className="device-status-panel__count"
            style={{
              fontSize: 11,
              color: '#64748b',
              background: 'rgba(148,163,184,0.1)',
              padding: '1px 8px',
              borderRadius: 10,
            }}
          >
            {summary.total}台
          </span>
        </div>

        {onRefresh && (
          <button
            className="device-status-panel__refresh-btn"
            onClick={onRefresh}
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 8,
              fontWeight: 500,
            }}
          >
            ⟳ 刷新
          </button>
        )}
      </div>

      {!expanded && (
        <div
          className="device-status-panel__collapsed-summary"
          style={{
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: '#94a3b8',
          }}
        >
          <span>🟢 {summary.online} 在线</span>
          <span>🟡 {summary.warning} 告警</span>
          <span>🔴 {summary.error} 故障</span>
        </div>
      )}

      {expanded && (
        <>
          {/* 汇总统计 */}
          {showSummary && <SummaryCard summary={summary} />}

          {/* 搜索 & 筛选 */}
          {(showSearch || showFilters) && !isEmpty && (
            <div
              className="device-status-panel__controls"
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {showSearch && (
                <input
                  className="device-status-panel__search"
                  type="text"
                  placeholder="搜索设备名称、ID、IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: '1 1 160px',
                    minWidth: 120,
                    background: 'rgba(15,23,42,0.4)',
                    border: '1px solid rgba(148,163,184,0.14)',
                    borderRadius: 8,
                    padding: '5px 10px',
                    fontSize: 12,
                    color: '#cbd5e1',
                    outline: 'none',
                  }}
                />
              )}

              {showFilters && (
                <div
                  className="device-status-panel__filters"
                  style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}
                >
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      className={`device-status-panel__filter-btn ${
                        statusFilter === opt.key ? 'device-status-panel__filter-btn--active' : ''
                      }`}
                      onClick={() => setStatusFilter(opt.key)}
                      style={{
                        border: '1px solid',
                        borderColor:
                          statusFilter === opt.key
                            ? 'rgba(99,102,241,0.4)'
                            : 'rgba(148,163,184,0.1)',
                        background:
                          statusFilter === opt.key
                            ? 'rgba(99,102,241,0.12)'
                            : 'rgba(15,23,42,0.3)',
                        color:
                          statusFilter === opt.key ? '#c7d2fe' : '#64748b',
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 16,
                        fontWeight: statusFilter === opt.key ? 600 : 400,
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 设备列表 */}
          {isEmpty ? (
            <div
              className="device-status-panel__empty"
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: 13,
              }}
            >
              {emptyText}
            </div>
          ) : filteredDevices.length === 0 ? (
            <div
              className="device-status-panel__no-match"
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: 13,
              }}
            >
              没有匹配的设备
            </div>
          ) : (
            <div className="device-status-panel__list">
              {filteredDevices.map((device) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  showDetails={showDetails}
                  onClick={onDeviceClick}
                />
              ))}
              {devices.length > maxDisplay && (
                <div
                  className="device-status-panel__more"
                  style={{
                    textAlign: 'center',
                    padding: '8px 0',
                    fontSize: 11,
                    color: '#64748b',
                  }}
                >
                  显示 {filteredDevices.length}/{devices.length} 台设备
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ==================== 动画样式 ====================

if (typeof document !== 'undefined') {
  const styleId = 'device-status-panel-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes deviceStatusPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
  }
}

export default DeviceStatusPanel;
