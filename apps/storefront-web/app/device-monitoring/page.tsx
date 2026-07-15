/**
 * 设备监控页 — Device Monitoring
 * 角色视角: 👔店长 / 🛠️技术
 * 功能: 设备实时状态监控、分类统计、状态筛选、搜索、告警汇总、维护记录
 * 状态: loading/error/empty 三态
 */
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  PageShell,
  StatCard,
  StatusBadge,
  SearchFilterInput,
  SegmentedControl,
  Pagination,
  EmptyState,
} from '@m5/ui';
import type { DeviceItem, DeviceFilter, DeviceCategory } from './model';
import {
  DEVICE_CATEGORY_LABELS,
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_COLORS,
  FILTER_OPTIONS,
  sortDevicesBySeverity,
  filterDevices,
  computeStats,
  generateMockDevices,
} from './model';

/* ── 类型扩展 ── */

interface AlertRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  time: string;
}

/* ── Mock 告警数据 ── */

const MOCK_ALERTS: AlertRecord[] = [
  { id: 'al-1', deviceId: 'DEV-0004', deviceName: '设备 4', message: '设备连续30分钟未上报心跳数据', severity: 'critical', time: '10:45' },
  { id: 'al-2', deviceId: 'DEV-0008', deviceName: '设备 8', message: '固件版本过低，存在安全风险', severity: 'warning', time: '09:30' },
  { id: 'al-3', deviceId: 'DEV-0012', deviceName: '设备 12', message: '存储空间使用率达到85%', severity: 'warning', time: '08:15' },
  { id: 'al-4', deviceId: 'DEV-0016', deviceName: '设备 16', message: '网络连接不稳定，丢包率 > 5%', severity: 'critical', time: '07:50' },
  { id: 'al-5', deviceId: 'DEV-0020', deviceName: '设备 20', message: '电池电量低于20%，请及时充电', severity: 'info', time: '昨日' },
];

/* ── 子组件: Loading Skeleton ── */

function LoadingSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 10, background: 'rgba(148,163,184,0.06)' }} />
        ))}
      </div>
      <div style={{ height: 36, borderRadius: 8, background: 'rgba(148,163,184,0.04)', marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ height: 30, width: 64, borderRadius: 6, background: 'rgba(148,163,184,0.06)' }} />
        ))}
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: 56, borderRadius: 8, background: 'rgba(148,163,184,0.04)', marginBottom: 6 }} />
      ))}
    </div>
  );
}

/* ── 子组件: Error State ── */

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>🖥️</div>
      <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>设备监控加载失败</div>
      <div style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{error}</div>
      <button
        onClick={onRetry}
        style={{
          padding: '10px 28px',
          borderRadius: 10,
          border: 'none',
          background: '#3b82f6',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        重新加载
      </button>
    </div>
  );
}

/* ── 子组件: 设备分类分布图 ── */

function CategoryDistributionChart({ devices }: { devices: DeviceItem[] }) {
  const categories = [...new Set(devices.map(d => d.category))];
  const categoryCounts = categories.map(cat => ({
    category: cat,
    count: devices.filter(d => d.category === cat).length,
    online: devices.filter(d => d.category === cat && d.status === 'online').length,
  }));
  const maxCount = Math.max(...categoryCounts.map(c => c.count), 1);

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: '14px 16px',
      marginBottom: 20,
      background: '#fff',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>
        📊 设备类型分布
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 60, padding: '4px 0' }}>
        {categoryCounts.map(({ category, count, online }) => (
          <div key={category} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{count}</div>
            <div style={{
              width: '70%',
              background: count === online ? 'linear-gradient(to top, #22c55e, #4ade80)' : 'linear-gradient(to top, #3b82f6, #60a5fa)',
              borderRadius: '4px 4px 0 0',
              height: Math.max((count / maxCount) * 44, 4),
              minHeight: 4,
              transition: 'height 0.3s',
            }} />
            <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4, whiteSpace: 'nowrap' }}>
              {DEVICE_CATEGORY_LABELS[category].slice(0, 4)}
            </div>
            <div style={{ fontSize: 8, color: '#22c55e' }}>{online}在线</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 子组件: 告警汇总 ── */

function AlertSummary({ alerts }: { alerts: AlertRecord[] }) {
  if (alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  const bgColor = criticalCount > 0 ? '#fef2f2' : '#fffbeb';
  const borderColor = criticalCount > 0 ? '#fecaca' : '#fde68a';
  const textColor = criticalCount > 0 ? '#991b1b' : '#92400e';

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${borderColor}`,
      padding: '12px 16px',
      marginBottom: 20,
      background: bgColor,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: 0 }}>
          {criticalCount > 0 ? '🚨 告警汇总 — 需立即处理' : '⚠️ 告警汇总'}
        </h3>
        <span style={{ fontSize: 12, color: textColor }}>
          {criticalCount} 紧急 · {warningCount} 警告 · {infoCount} 提示
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.slice(0, 5).map(alert => (
          <div key={alert.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 6,
            background: alert.severity === 'critical' ? '#fef2f2' : alert.severity === 'warning' ? '#fffbeb' : '#f9fafb',
            fontSize: 13,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#eab308' : '#3b82f6',
              flexShrink: 0,
            }} />
            <span style={{ color: '#374151', flex: 1 }}>{alert.deviceName}: {alert.message}</span>
            <span style={{ color: '#9ca3af', fontSize: 11 }}>{alert.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 子组件: 最近心跳检查 ── */

function RecentEvents({ devices }: { devices: DeviceItem[] }) {
  const recent = [...devices]
    .sort((a, b) => new Date(b.lastHeartbeat).getTime() - new Date(a.lastHeartbeat).getTime())
    .slice(0, 6);

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: '12px 16px',
      marginBottom: 20,
      background: '#fff',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
        ⏱ 最近心跳上报
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {recent.map(d => (
          <div key={d.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            padding: '4px 6px',
            borderRadius: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusBadge
                label={DEVICE_STATUS_LABELS[d.status]}
                variant={d.status === 'online' ? 'success' : d.status === 'offline' ? 'neutral' : d.status === 'warning' ? 'warning' : d.status === 'error' ? 'error' : 'pending'}
              />
              <span style={{ fontWeight: 500, color: '#374151' }}>{d.name}</span>
              <span style={{ color: '#9ca3af', fontSize: 12 }}>{d.storeName}</span>
            </div>
            <span style={{ color: '#9ca3af', fontSize: 11 }}>
              {new Date(d.lastHeartbeat).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 子组件: 维护记录 ── */

function MaintenanceRecord() {
  const records = [
    { id: 'mr-1', deviceName: '设备 3', action: '固件升级 v2.1 → v2.3', staff: '王工', date: '2026-07-14' },
    { id: 'mr-2', deviceName: '设备 7', action: '更换扫描头', staff: '李工', date: '2026-07-13' },
    { id: 'mr-3', deviceName: '设备 11', action: '网络配置重置', staff: '赵工', date: '2026-07-12' },
  ];
  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: '12px 16px',
      marginBottom: 20,
      background: '#fff',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
        🔧 最近维护记录
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {records.map(r => (
          <div key={r.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            padding: '6px 8px',
            borderRadius: 6,
            background: '#f9fafb',
          }}>
            <div>
              <span style={{ fontWeight: 500, color: '#374151' }}>{r.deviceName}</span>
              <span style={{ color: '#6b7280', marginLeft: 6 }}>{r.action}</span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>
              {r.staff} · {r.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 主页面组件 ── */

export default function DeviceMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<DeviceFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // 模拟初始化加载
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fail = Math.random() < 0.05;
    setTimeout(() => {
      if (cancelled) return;
      if (fail) {
        setError('设备监控服务未响应，请检查网络连接');
        setLoading(false);
      } else {
        setDevices(generateMockDevices(25));
        setLoading(false);
      }
    }, 300 + Math.random() * 300);

    return () => { cancelled = true; };
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setDevices(generateMockDevices(25));
      setLoading(false);
    }, 500);
  }, []);

  const filtered = useMemo(
    () => sortDevicesBySeverity(filterDevices(devices, statusFilter, searchTerm)),
    [devices, statusFilter, searchTerm],
  );

  const stats = useMemo(() => computeStats(devices), [devices]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value as DeviceFilter);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <PageShell
        title="设备监控"
        description="正在加载设备数据…"
      >
        <LoadingSkeleton />
      </PageShell>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <PageShell
        title="设备监控"
        description="加载异常"
      >
        <ErrorState error={error} onRetry={handleRetry} />
      </PageShell>
    );
  }

  /* ── Empty state ── */
  if (devices.length === 0) {
    return (
      <PageShell
        title="设备监控"
        description="暂无设备数据"
      >
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>🖥️</div>
          <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>暂无设备</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>系统中尚未注册任何设备，请先添加设备</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="设备监控"
      description="实时查看门店设备运行状态"
    >
      {/* 设备类型分布 */}
      <CategoryDistributionChart devices={devices} />

      {/* 告警汇总 */}
      <AlertSummary alerts={MOCK_ALERTS} />

      {/* 最近心跳 */}
      <RecentEvents devices={devices} />

      {/* 维护记录 */}
      <MaintenanceRecord />

      {/* 统计卡片 */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="设备总数" value={stats.total} variant="info" />
        <StatCard label="在线" value={stats.online} variant="success" />
        <StatCard label="离线" value={stats.offline} variant="default" />
        <StatCard label="警告/故障" value={stats.warning + stats.error} variant="warning" />
        <StatCard
          label="健康率"
          value={`${stats.healthRate}%`}
          variant={stats.healthRate >= 90 ? 'success' : stats.healthRate >= 70 ? 'warning' : 'error'}
        />
      </div>

      {/* 搜索 */}
      <div className="mb-4">
        <SearchFilterInput value={searchTerm} onChange={handleSearchChange} placeholder="搜索设备名称、门店、IP…" />
      </div>

      {/* 状态筛选 */}
      <div className="mb-4">
        <SegmentedControl
          options={FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={statusFilter}
          onChange={handleStatusFilter}
          size="sm"
        />
      </div>

      {/* 设备列表 */}
      {pageItems.length === 0 ? (
        <EmptyState
          title="没有匹配的设备"
          description="尝试调整搜索条件或筛选状态"
        />
      ) : (
        <div className="space-y-2">
          {pageItems.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <StatusBadge
                  label={DEVICE_STATUS_LABELS[device.status]}
                  variant={device.status === 'online' ? 'success' : device.status === 'offline' ? 'neutral' : device.status === 'warning' ? 'warning' : device.status === 'error' ? 'error' : 'pending'}
                />
                <div>
                  <p className="font-medium text-gray-900">{device.name}</p>
                  <p className="text-sm text-gray-500">
                    {DEVICE_CATEGORY_LABELS[device.category]} · {device.storeName} · {device.ip}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>固件 {device.firmware}</p>
                {device.alerts > 0 && (
                  <p className="font-medium text-red-600">告警 {device.alerts} 条</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部分页及记录数 */}
      <div className="mt-4 flex items-center justify-between">
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          共 {filtered.length} 台设备，当前第 {page}/{totalPages} 页
        </span>
        <Pagination page={page} total={pageItems.length} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </PageShell>
  );
}
