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
import type { PromotionItem, PromotionType, PromotionStatus } from './promotion-types';

const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  discount: '折扣',
  coupon: '优惠券',
  cashback: '返现',
  gift: '赠品',
  bundle: '套餐',
  clearance: '清仓',
};

const STATUS_LABELS: Record<PromotionStatus, string> = {
  draft: '草稿',
  scheduled: '待开始',
  active: '进行中',
  paused: '已暂停',
  expired: '已过期',
  cancelled: '已取消',
};

function variantFor(s: PromotionStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (s === 'active') return 'success';
  if (s === 'paused' || s === 'draft') return 'warning';
  if (s === 'expired' || s === 'cancelled') return 'danger';
  return 'default';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function usagePercent(used: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((used / total) * 100)}%`;
}

interface PromotionListClientProps {
  promotions: PromotionItem[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export function PromotionListClient({ promotions }: PromotionListClientProps) {
  const state = useListPageSectionState({
    items: promotions,
    searchFields: ['name', 'type', 'storeName', 'createdBy', 'description'],
    facets: [
      {
        key: 'status',
        enabled: true,
        order: ['draft', 'scheduled', 'active', 'paused', 'expired', 'cancelled'],
        getValue: (item: PromotionItem) => item.status,
      },
      {
        key: 'type',
        enabled: true,
        order: ['discount', 'coupon', 'cashback', 'gift', 'bundle', 'clearance'],
        getValue: (item: PromotionItem) => item.type,
      },
    ],
    defaultPageSize: 10,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  });

  const columns: DataTableColumn<PromotionItem>[] = [
    {
      key: 'name',
      header: '活动名称',
      sortable: true,
      render: (row) => (
        <span style={{ color: '#93c5fd', fontWeight: 500 }}>{row.name}</span>
      ),
    },
    {
      key: 'type',
      header: '类型',
      sortable: true,
      render: (row) => PROMOTION_TYPE_LABELS[row.type] ?? row.type,
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
      header: '门店',
      sortable: true,
      render: (row) => row.storeName,
    },
    {
      key: 'budget',
      header: '预算',
      sortable: true,
      render: (row) => (
        <span>
          {formatMoney(row.usedBudget)} / {formatMoney(row.budget)}
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.25rem' }}>
            ({usagePercent(row.usedBudget, row.budget)})
          </span>
        </span>
      ),
    },
    {
      key: 'startAt',
      header: '开始时间',
      sortable: true,
      render: (row) => formatDate(row.startAt),
    },
    {
      key: 'endAt',
      header: '结束时间',
      sortable: true,
      render: (row) => formatDate(row.endAt),
    },
    {
      key: 'createdBy',
      header: '创建人',
      sortable: true,
    },
  ];

  return (
    <PageShell
      title="促销活动管理"
      subtitle={`共 ${state.sortedItems.length} 个活动`}
    >
      <SearchFilterInput
        value={state.searchTerm}
        onChange={state.setSearchTerm}
        placeholder="搜索活动名称、类型、门店..."
      />
      <PaginatedDataTableCard
        columns={columns}
        rows={state.pagedItems}
        rowKey={(row: PromotionItem) => row.id}
        sort={state.sortConfig}
        onSortChange={state.setSortConfig}
        emptyTitle="暂无促销活动"
        emptyDescription="当前筛选条件下没有匹配的促销活动"
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
