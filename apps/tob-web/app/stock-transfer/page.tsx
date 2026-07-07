/**
 * 库存调拨列表页 — Stock Transfer List Page (ToB Next.js App Router Page)
 * 角色视角: 👔品牌运营 / 📦仓库管理员 / 💳采购经理
 * 功能: 搜索、状态筛选、类型筛选、分页浏览调拨单
 */
'use client';

import React, { useMemo, useState } from 'react';

import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  PageShell,
  Pagination,
  SearchFilterInput,
  usePagination,
  useSearchFilter,
  type BadgeVariant,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  type StockTransferItem,
  type TransferStatus,
  type TransferType,
  ALL_TYPES,
  ALL_STATUSES,
  TRANSFER_STATUS_LABELS,
  TRANSFER_TYPE_LABELS,
  MOCK_TRANSFERS,
} from './data';

/* ── 样式映射 ── */

const STATUS_VARIANTS: Record<TransferStatus, BadgeVariant> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'info',
  in_transit: 'warning',
  completed: 'success',
  cancelled: 'error',
};

/* ── 列定义 ── */

const COLUMNS = [
  {
    key: 'transferNo',
    header: '调拨单号',
    sortable: true,
    render: (item: StockTransferItem) => <a href={`/stock-transfer/${item.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>{item.transferNo}</a>,
  },
  {
    key: 'type',
    header: '类型',
    sortable: true,
    render: (item: StockTransferItem) => <Badge variant="neutral">{TRANSFER_TYPE_LABELS[item.type]}</Badge>,
  },
  { key: 'fromLocation', header: '调出地', sortable: true },
  { key: 'toLocation', header: '调入地', sortable: true },
  {
    key: 'status',
    header: '状态',
    sortable: true,
    render: (item: StockTransferItem) => <Badge variant={STATUS_VARIANTS[item.status]}>{TRANSFER_STATUS_LABELS[item.status]}</Badge>,
  },
  { key: 'itemsCount', header: 'SKU数', sortable: true, align: 'right' as const },
  { key: 'totalQuantity', header: '总数量', sortable: true, align: 'right' as const },
  { key: 'applicant', header: '申请人', sortable: true },
  { key: 'appliedAt', header: '申请时间', sortable: true },
];

/* ── Component ── */

export default function TobStockTransferListPage() {
  const [categoryFilter, setCategoryFilter] = useState<TransferType | ''>('');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | ''>('');
  const { searchTerm, setSearchTerm, filteredItems: searched } = useSearchFilter(
    MOCK_TRANSFERS,
    ['transferNo', 'fromLocation', 'toLocation', 'applicant', 'reason']
  );
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const filtered = useMemo(() => {
    return searched.filter(item => {
      if (categoryFilter && item.type !== categoryFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [searched, categoryFilter, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    const key = sortConfig.key as keyof StockTransferItem;
    return [...filtered].sort((a, b) => {
      const aVal = String(a[key] ?? '');
      const bVal = String(b[key] ?? '');
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filtered, sortConfig]);

  const { page, pageSize, totalPages, paginate, setPage } = usePagination(sorted.length, 10);
  const paginated = paginate(sorted);

  return (
    <PageShell
      title="库存调拨管理"
      subtitle="跨门店/仓库的库存调拨单管理"
      actions={<Button onClick={() => window.location.href = '/stock-transfer/new'}>新建调拨单</Button>}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索单号/地点/申请人..."
          width={260}
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value as TransferType | ''); setPage(1); }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="">全部类型</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{TRANSFER_TYPE_LABELS[t]}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as TransferStatus | ''); setPage(1); }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="">全部状态</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{TRANSFER_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title="暂无调拨单"
          description={searchTerm || categoryFilter || statusFilter ? '当前筛选条件下没有匹配的调拨单' : '还没有创建任何调拨单'}
          action={!searchTerm && !categoryFilter && !statusFilter ? <Button onClick={() => window.location.href = '/stock-transfer/new'}>新建调拨单</Button> : undefined}
        />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={paginated} rowKey={(r) => r.id} sort={sortConfig} onSortChange={setSortConfig} />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>共 {sorted.length} 条记录</span>
            <Pagination page={page} total={sorted.length} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </PageShell>
  );
}
