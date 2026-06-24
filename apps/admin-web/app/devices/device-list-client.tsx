'use client';

import React from 'react';
import Link from 'next/link';
import {
  PageShell,
  PaginatedDataTableCard,
  SearchFilterInput,
  StatusBadge,
  useListPageSectionState,
  type DataTableColumn,
} from '@m5/ui';
import type { DeviceItem } from './device-types';

const DEVICE_TYPE_LABELS: Record<string, string> = {
  POS: '收银机',
  printer: '打印机',
  scanner: '扫描枪',
  tablet: '平板',
  kiosk: '自助机',
  scale: '电子秤',
};

const STATUS_LABELS: Record<string, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警',
  maintenance: '维护中',
};

function variantFor(s: string): 'success' | 'danger' | 'warning' | 'default' {
  if (s === 'online') return 'success';
  if (s === 'offline') return 'danger';
  if (s === 'warning') return 'warning';
  return 'default';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface DeviceListClientProps {
  devices: DeviceItem[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export function DeviceListClient({ devices }: DeviceListClientProps) {
  const state = useListPageSectionState({
    items: devices,
    searchFields: ['name', 'type', 'storeName', 'ip', 'serialNumber'],
    facets: [
      {
        key: 'status',
        enabled: true,
        order: ['online', 'offline', 'warning', 'maintenance'],
        getValue: (item: DeviceItem) => item.status,
      },
      {
        key: 'type',
        enabled: true,
        order: ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'],
        getValue: (item: DeviceItem) => item.type,
      },
    ],
    defaultPageSize: 10,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  });

  const columns: DataTableColumn<DeviceItem>[] = [
    {
      key: 'name',
      header: '设备名称',
      sortable: true,
      render: (row) => (
        <Link href={`/devices/${row.id}`} style={{ color: '#93c5fd', textDecoration: 'none' }}>
          {row.name}
        </Link>
      ),
    },
    {
      key: 'type',
      header: '设备类型',
      sortable: true,
      render: (row) => <span>{DEVICE_TYPE_LABELS[row.type] ?? row.type}</span>,
    },
    {
      key: 'status',
      header: '状态',
      sortable: true,
      render: (row) => (
        <StatusBadge
          variant={variantFor(row.status)}
          label={STATUS_LABELS[row.status] ?? row.status}
        />
      ),
    },
    {
      key: 'storeName',
      header: '所属门店',
      sortable: true,
      dataKey: 'storeName',
    },
    { key: 'ip', header: 'IP 地址', dataKey: 'ip' },
    { key: 'firmwareVersion', header: '固件版本', dataKey: 'firmwareVersion' },
    {
      key: 'lastCheckAt',
      header: '最近检测',
      sortable: true,
      render: (row) => (
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{formatTime(row.lastCheckAt)}</span>
      ),
    },
  ];

  // 控制面板行：搜索 + 筛选下拉 + 每页数量
  const controlsRow = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <SearchFilterInput
        value={state.searchTerm}
        onChange={state.setSearchTerm}
        placeholder="搜索设备名称、类型、门店…"
        width={320}
      />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {state.facets.map((facet) => (
          <div key={facet.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#94a3b8', fontSize: 13 }}>
              {facet.key === 'status' ? '状态' : '类型'}
            </label>
            <select
              value={facet.value}
              onChange={(e) => state.setFacetValue(facet.key, e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.4)',
                color: '#e2e8f0',
                outline: 'none',
              }}
            >
              <option value="ALL">全部</option>
              {facet.order.map((v) => (
                <option key={v} value={v}>
                  {facet.key === 'status'
                    ? STATUS_LABELS[v] ?? v
                    : DEVICE_TYPE_LABELS[v] ?? v}
                </option>
              ))}
            </select>
          </div>
        ))}
        {/* 每页数量选择 */}
        <select
          value={state.pagination.pageSize}
          onChange={(e) => state.pagination.setPageSize(Number(e.target.value))}
          style={{
            padding: '6px 10px',
            fontSize: 13,
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.4)',
            color: '#e2e8f0',
            outline: 'none',
          }}
        >
          {PAGE_SIZE_OPTIONS.map((ps) => (
            <option key={ps} value={ps}>
              每页 {ps} 条
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="设备管理"
        subtitle="监控门店 POS、打印机、平板等设备的在线状态与固件版本"
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <StatBox label="设备总数" value={devices.length} />
          <StatBox
            label="在线"
            value={devices.filter((d) => d.status === 'online').length}
            color="#22c55e"
          />
          <StatBox
            label="告警/离线"
            value={
              devices.filter((d) => d.status === 'warning' || d.status === 'offline')
                .length
            }
            color="#f97316"
          />
          <StatBox label="当前筛选" value={state.filteredItems.length} />
        </div>

        {controlsRow}

        {/* 数据表格 */}
        <PaginatedDataTableCard<DeviceItem>
          columns={columns}
          rows={state.pagedItems}
          rowKey={(r) => r.id}
          sort={state.sortConfig}
          onSortChange={state.setSortConfig}
          striped
          emptyTitle="没有匹配的设备"
          emptyDescription="尝试调整搜索关键词或筛选条件"
          pagination={{
            page: state.pagination.page,
            totalPages: state.totalPages,
            total: state.sortedItems.length,
            onPageChange: state.pagination.setPage,
          }}
        />
      </PageShell>
    </main>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '16px 18px',
        background: 'rgba(15,23,42,0.38)',
        border: '1px solid rgba(148,163,184,0.18)',
      }}
    >
      <div style={{ fontSize: 13, color: '#94a3b8' }}>{label}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: color ?? '#e2e8f0',
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}
