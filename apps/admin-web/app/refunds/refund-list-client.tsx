'use client';

import React from 'react';
import {
  PageShell,
  PaginatedDataTableCard,
  SearchFilterInput,
  StatusBadge,
  useListPageSectionState,
  type DataTableColumn,
} from '@m5/ui';
import type { RefundItem, RefundStatus, RefundType, RefundChannel } from './refund-types';
import {
  REFUND_STATUS_LABEL,
  REFUND_STATUS_VARIANT,
  REFUND_TYPE_LABEL,
  REFUND_CHANNEL_LABEL,
} from './refund-types';
import { countByStatus } from './refund-data';

const STATUS_ORDER: RefundStatus[] = [
  'pending_approval',
  'approved',
  'processing',
  'completed',
  'rejected',
  'cancelled',
];

const TYPE_ORDER: RefundType[] = ['refund', 'exchange', 'return'];

function formatYuan(amountFen: number): string {
  return `¥${(amountFen / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return iso; // already formatted: "2026-07-06 09:15"
}

interface RefundListClientProps {
  refunds: RefundItem[];
}

export function RefundListClient({ refunds }: RefundListClientProps) {
  const state = useListPageSectionState({
    items: refunds,
    searchFields: [
      'id',
      'orderId',
      'customerName',
      'customerPhone',
      'productName',
      'reason',
      'storeName',
    ],
    facets: [
      {
        key: 'status',
        enabled: true,
        order: STATUS_ORDER,
        getValue: (item: RefundItem) => item.status,
      },
      {
        key: 'type',
        enabled: true,
        order: TYPE_ORDER,
        getValue: (item: RefundItem) => item.type,
      },
    ],
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });

  const columns: DataTableColumn<RefundItem>[] = [
    {
      key: 'id',
      header: '退单号',
      sortable: true,
      render: (row) => (
        <span style={{ color: '#93c5fd', fontWeight: 500, fontFamily: 'monospace' }}>
          {row.id}
        </span>
      ),
    },
    {
      key: 'orderId',
      header: '订单号',
      sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'monospace' }}>{row.orderId}</span>
      ),
    },
    {
      key: 'type',
      header: '类型',
      sortable: true,
      render: (row) => REFUND_TYPE_LABEL[row.type],
    },
    {
      key: 'status',
      header: '状态',
      sortable: true,
      render: (row) => (
        <StatusBadge
          variant={REFUND_STATUS_VARIANT[row.status]}
          label={REFUND_STATUS_LABEL[row.status]}
        />
      ),
    },
    {
      key: 'customerName',
      header: '会员',
      sortable: true,
    },
    {
      key: 'storeName',
      header: '门店',
      sortable: true,
    },
    {
      key: 'productName',
      header: '商品',
      sortable: true,
    },
    {
      key: 'amount',
      header: '退款金额',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatYuan(row.amount)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: '申请时间',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
  ];

  const pendingCount = countByStatus(state.sortedItems, 'pending_approval');

  return (
    <PageShell
      title="退款管理"
      subtitle={`共 ${state.sortedItems.length} 条记录，待处理 ${pendingCount} 条`}
    >
      <SearchFilterInput
        value={state.searchTerm}
        onChange={state.setSearchTerm}
        placeholder="搜索退单号、订单号、会员名、商品名称…"
      />
      <PaginatedDataTableCard
        columns={columns}
        rows={state.pagedItems}
        rowKey={(row: RefundItem) => row.id}
        sort={state.sortConfig}
        onSortChange={state.setSortConfig}
        emptyTitle="暂无退款记录"
        emptyDescription="当前筛选条件下没有匹配的退款申请"
        pagination={{
          page: state.pagination.page,
          totalPages: state.totalPages,
          total: state.sortedItems.length,
          onPageChange: state.pagination.setPage,
        }}
      />
    </PageShell>
  );
}
