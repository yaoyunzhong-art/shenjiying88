'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  PageShell,
  StatCard,
  StatusBadge,
  SearchFilterInput,
  SegmentedControl,
  Pagination,
  EmptyState,
} from '@m5/ui';
import type { DeviceItem, DeviceFilter } from './model';
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

// ── Page Component ──────────────────────────────────────────────────────────

export default function DeviceMonitoringPage() {
  const [devices] = useState<DeviceItem[]>(() => generateMockDevices(25));
  const [statusFilter, setStatusFilter] = useState<DeviceFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

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

  return (
    <PageShell
      title="设备监控"
      description="实时查看门店设备运行状态"
    >
      {/* 搜索与筛选 */}
      <div className="mb-4">
        <SearchFilterInput value={searchTerm} onChange={handleSearchChange} placeholder="搜索设备名称、门店、IP…" />
      </div>

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

      {/* 分页 */}
      <div className="mt-4">
        <Pagination page={page} total={pageItems.length} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </PageShell>
  );
}
