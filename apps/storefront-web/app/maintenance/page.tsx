/**
 * 设备保养工单列表页 — Maintenance Order List (Next.js App Router Page)
 * 角色视角: 👨‍🔧设备维护 / 🔧门店运营
 * 功能: 搜索、状态筛选、优先级筛选、分页浏览保养工单
 */
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  PageShell,
  SearchFilterInput,
  useSearchFilter,
  DataTable,
  StatusBadge,
  Button,
  Pagination,
  usePagination,
  EmptyState,
  type DataTableColumn,
} from '@m5/ui';

// ---- 类型 ----

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface MaintenanceOrder {
  id: string;
  title: string;
  deviceName: string;
  store: string;
  status: MaintenanceStatus;
  priority: Priority;
  assignee: string;
  createdAt: string;
  scheduledAt: string;
}

// ---- Mock 数据 ----

const MOCK_ORDERS: MaintenanceOrder[] = [
  { id: 'MO-001', title: '空调滤网更换', deviceName: '中央空调-3F', store: '旗舰店', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-01', scheduledAt: '2026-07-05' },
  { id: 'MO-002', title: '收银机系统升级', deviceName: '收银机 #4', store: '旗舰店', status: 'pending', priority: 'medium', assignee: '李技', createdAt: '2026-07-02', scheduledAt: '2026-07-06' },
  { id: 'MO-003', title: '消防设备年检', deviceName: '消防系统', store: '分店-A', status: 'pending', priority: 'urgent', assignee: '王工', createdAt: '2026-07-02', scheduledAt: '2026-07-04' },
  { id: 'MO-004', title: '电梯例行保养', deviceName: '客梯 #1', store: '分店-B', status: 'completed', priority: 'low', assignee: '赵工', createdAt: '2026-06-28', scheduledAt: '2026-07-01' },
  { id: 'MO-005', title: '监控摄像头检修', deviceName: '监控系统', store: '分店-A', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-03', scheduledAt: '2026-07-05' },
  { id: 'MO-006', title: '给排水管道疏通', deviceName: '管道系统', store: '旗舰店', status: 'cancelled', priority: 'medium', assignee: '赵工', createdAt: '2026-06-25', scheduledAt: '2026-06-28' },
  { id: 'MO-007', title: '电力系统巡检', deviceName: '配电柜', store: '分店-C', status: 'pending', priority: 'urgent', assignee: '王工', createdAt: '2026-07-04', scheduledAt: '2026-07-06' },
  { id: 'MO-008', title: '门禁系统维护', deviceName: '门禁-后门', store: '旗舰店', status: 'completed', priority: 'low', assignee: '李技', createdAt: '2026-06-30', scheduledAt: '2026-07-02' },
  { id: 'MO-009', title: 'UPS电池更换', deviceName: 'UPS-机房', store: '分店-B', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-01', scheduledAt: '2026-07-04' },
  { id: 'MO-010', title: '标识牌更新', deviceName: '导视系统', store: '分店-A', status: 'pending', priority: 'low', assignee: '李技', createdAt: '2026-07-05', scheduledAt: '2026-07-08' },
];

const STATUS_OPTIONS: { label: string; value: MaintenanceStatus | '' }[] = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

const PRIORITY_OPTIONS: { label: string; value: Priority | '' }[] = [
  { label: '全部', value: '' },
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
];

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'default' | 'error' }> = {
  pending: { label: '待处理', variant: 'warning' },
  in_progress: { label: '处理中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'default' },
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

// ---- 过滤 & 搜索 ----

function filterOrders(
  orders: MaintenanceOrder[],
  search: string,
  statusFilter: MaintenanceStatus | '',
  priorityFilter: Priority | '',
): MaintenanceOrder[] {
  return orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (priorityFilter && o.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.deviceName.toLowerCase().includes(q) ||
        o.store.toLowerCase().includes(q) ||
        o.assignee.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

// ---- 表格列 ----

const COLUMNS: DataTableColumn<MaintenanceOrder>[] = [
  { key: 'id', header: '工单编号', sortable: true },
  { key: 'title', header: '工单标题', sortable: true },
  { key: 'deviceName', header: '设备名称', sortable: true },
  { key: 'store', header: '所属门店', sortable: true },
  {
    key: 'status',
    header: '状态',
    render: (row: MaintenanceOrder) => {
      const cfg = STATUS_CONFIG[row.status];
      return <StatusBadge variant={cfg.variant} label={cfg.label} />;
    },
    sortable: true,
  },
  {
    key: 'priority',
    header: '优先级',
    render: (row: MaintenanceOrder) => {
      const colors: Record<Priority, string> = { low: '#909399', medium: '#E6A23C', high: '#F56C6C', urgent: '#C41D7F' };
      return <span style={{ color: colors[row.priority], fontWeight: 600 }}>{PRIORITY_LABEL[row.priority]}</span>;
    },
    sortable: true,
  },
  { key: 'assignee', header: '负责人', sortable: true },
  { key: 'scheduledAt', header: '计划日期', sortable: true },
  {
    key: 'actions',
    header: '操作',
    render: (row: MaintenanceOrder) => (
      <Link href={`/maintenance/${row.id}`} style={{ color: '#409EFF', textDecoration: 'none' }}>
        详情
      </Link>
    ),
  },
];

// ---- 页面 ----

export default function MaintenancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');

  const filtered = useMemo(
    () => filterOrders(MOCK_ORDERS, search, statusFilter, priorityFilter),
    [search, statusFilter, priorityFilter],
  );

  const { page, setPage, pageSize, setPageSize, totalPages } = usePagination(filtered.length, 5);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  return (
    <PageShell title="设备保养工单" subtitle="查看和管理各门店设备保养与维修工单">
      {/* 过滤区域 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <SearchFilterInput
          value={search}
          onChange={setSearch}
          placeholder="搜索工单/设备/门店/负责人…"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as MaintenanceStatus | ''); setPage(1); }}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #DCDFE6' }}
          data-testid="status-filter"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={e => { setPriorityFilter(e.target.value as Priority | ''); setPage(1); }}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #DCDFE6' }}
          data-testid="priority-filter"
        >
          {PRIORITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button variant="primary" onClick={() => window.location.href = '/maintenance/new'}>
          + 新建工单
        </Button>
      </div>

      {/* 数据表格 */}
      {paged.length === 0 ? (
        <EmptyState title="暂无匹配工单" description="尝试调整搜索条件或筛选" />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={paged} rowKey={(r: MaintenanceOrder) => r.id} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              page={page}
              total={filtered.length}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={v => { setPageSize(v); setPage(1); }}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}
