'use client';

import React, { useMemo, useState } from 'react';
import {
  PageShell,
  SearchFilterInput,
  StatCard,
  StatusBadge,
  DataTable,
  Pagination,
  Tabs,
  Button,
  usePagination,
  useSearchFilter,
  type DataTableColumn,
} from '@m5/ui';
import type { ReplenishmentOrder, ReplenishmentStatus } from './page';

// ============================================================
// 状态标签样式映射
// ============================================================

const STATUS_CONFIG: Record<ReplenishmentStatus, { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' | 'warning' }> = {
  draft: { label: '草稿', variant: 'neutral' },
  pending_approval: { label: '待审批', variant: 'info' },
  approved: { label: '已审批', variant: 'warning' },
  shipped: { label: '已发货', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  rejected: { label: '已驳回', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

// ============================================================
// 统计卡片数据
// ============================================================

interface ReplenishmentStats {
  total: number;
  pendingApproval: number;
  shipped: number;
  completed: number;
}

function computeStats(orders: ReplenishmentOrder[]): ReplenishmentStats {
  return {
    total: orders.length,
    pendingApproval: orders.filter(o => o.status === 'pending_approval').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };
}

// ============================================================
// 表格列定义
// ============================================================

const COLUMNS: DataTableColumn<ReplenishmentOrder>[] = [
  { key: 'orderNo', header: '补货单号', dataKey: 'orderNo', sortable: true },
  { key: 'storeName', header: '门店', dataKey: 'storeName', sortable: true },
  { key: 'applicant', header: '申请人', dataKey: 'applicant', sortable: true },
  {
    key: 'itemCount',
    header: '商品种类',
    sortable: true,
    render: (row: ReplenishmentOrder) => `${row.itemCount} 种`,
  },
  {
    key: 'totalEstimatedQty',
    header: '预估数量',
    sortable: true,
    render: (row: ReplenishmentOrder) => `${row.totalEstimatedQty} 件`,
  },
  {
    key: 'urgent',
    header: '紧急',
    sortable: false,
    render: (row: ReplenishmentOrder) => (row.urgent ? <StatusBadge variant="danger" label="紧急" /> : <StatusBadge variant="neutral" label="常规" />),  
  },
  {
    key: 'status',
    header: '状态',
    sortable: true,
    render: (row: ReplenishmentOrder) => {
      const cfg = STATUS_CONFIG[row.status];
      return <StatusBadge variant={cfg.variant} label={cfg.label} />;
    },
  },
  { key: 'createdAt', header: '创建时间', dataKey: 'createdAt', sortable: true },
];

// ============================================================
// 筛选 Tabs 定义
// ============================================================

type FilterTab = 'all' | 'pending_approval' | 'approved' | 'completed' | 'draft';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_approval', label: '待审批' },
  { key: 'approved', label: '已审批' },
  { key: 'completed', label: '已完成' },
  { key: 'draft', label: '草稿' },
];

// ============================================================
// 列表页客户端组件
// ============================================================

interface ReplenishmentListClientProps {
  orders: ReplenishmentOrder[];
}

export function ReplenishmentListClient({ orders }: ReplenishmentListClientProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { searchTerm: search, setSearchTerm: setSearch, filteredItems: searchedItems } = useSearchFilter(orders, ['orderNo', 'storeName', 'applicant', 'reason']);

  const statusFiltered = useMemo(() => {
    if (activeTab === 'all') return searchedItems;
    return searchedItems.filter(o => o.status === activeTab);
  }, [searchedItems, activeTab]);

  const pagination = usePagination({ initialPageSize: 8 });
  const { page, pageSize, setPage, setPageSize, totalPages } = pagination;
  const pageItems = pagination.paginate(statusFiltered);

  const stats = useMemo(() => computeStats(orders), [orders]);

  return (
    <PageShell title="补货申请" subtitle="查看和管理门店补货申请单">
      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="全部申请" value={stats.total} />
        <StatCard label="待审批" value={stats.pendingApproval} variant="info" />
        <StatCard label="已发货" value={stats.shipped} variant="warning" />
        <StatCard label="已完成" value={stats.completed} variant="success" />
      </div>

      {/* 搜索 + 新建按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SearchFilterInput
          value={search}
          onChange={setSearch}
          placeholder="搜索补货单号/门店/申请人/原因..."
          width={360}
        />
        <Button variant="primary" onClick={() => window.location.href = '/replenishment/new'}>
          + 新建补货申请
        </Button>
      </div>

      {/* 筛选 Tabs */}
      <Tabs
        items={FILTER_TABS.map(t => ({ key: t.key, label: `${t.label} (${activeTab === 'all' ? orders.length : orders.filter(o => t.key === 'all' || o.status === t.key).length})` }))}
        activeKey={activeTab}
        onChange={k => { setActiveTab(k as FilterTab); setPage(1); }}
      />

      {/* 数据表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pageItems}
        rowKey={(r: ReplenishmentOrder) => r.id}
        onRowClick={(row: ReplenishmentOrder) => {
          window.location.href = `/replenishment/${row.id}`;
        }}
      />

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ color: '#94a3b8', fontSize: 14 }}>
          共 {statusFiltered.length} 条记录，当前第 {page}/{totalPages} 页
        </span>
        <Pagination
          page={page}
          total={statusFiltered.length}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[8, 16, 24]}
        />
      </div>
    </PageShell>
  );
}
