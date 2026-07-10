/**
 * coupons/page.tsx — ToB 优惠券管理列表页
 *
 * 展示租户级 / 品牌级优惠券活动，支持搜索、类型筛选、状态筛选、分页
 */
'use client';

import React, { useMemo, useState } from 'react';

import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import type { Coupon, CouponType, CouponStatus } from './coupons-data';
import { MOCK_COUPONS, TYPE_LABELS, STATUS_LABELS } from './coupons-data';

const TYPE_VARIANTS: Record<CouponType, 'success' | 'warning' | 'info' | 'danger'> = {
  discount: 'success',
  cash: 'warning',
  free_shipping: 'info',
  voucher: 'danger',
};

const STATUS_VARIANTS: Record<CouponStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  expired: 'neutral',
  disabled: 'warning',
};

// ---- 统计子组件 ----

function StatBadge({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <article
      style={{
        borderRadius: 14,
        padding: 16,
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.14)',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: accent }}>
        {value}
      </div>
    </article>
  );
}

// ---- 列定义 ----

const COLUMNS: DataTableColumn<Coupon>[] = [
  {
    key: 'name',
    header: '券名称',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.id} · {item.brandCode}
        </span>
      </div>
    ),
    sortable: true,
  },
  {
    key: 'type',
    header: '类型',
    render: (item) => (
      <StatusBadge label={TYPE_LABELS[item.type]} variant={TYPE_VARIANTS[item.type]} size="sm" />
    ),
  },
  {
    key: 'value',
    header: '面值',
    render: (item) => <span style={{ fontWeight: 500 }}>{item.value}</span>,
  },
  {
    key: 'usage',
    header: '核销',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        {item.usedCount}/{item.totalIssued}
        <span style={{ color: '#64748b', marginLeft: 4 }}>
          ({Math.round((item.usedCount / item.totalIssued) * 100)}%)
        </span>
      </span>
    ),
  },
  {
    key: 'validTo',
    header: '有效期',
    render: (item) => (
      <div style={{ fontSize: 13 }}>
        <span style={{ color: '#cbd5e1' }}>{item.validFrom}</span>
        <span style={{ color: '#64748b', margin: '0 4px' }}>→</span>
        <span style={{ color: '#94a3b8' }}>{item.validTo}</span>
      </div>
    ),
  },
  {
    key: 'marketCode',
    header: '市场',
    render: (item) => <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.marketCode}</span>,
    sortable: true,
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_VARIANTS[item.status]} size="sm" dot />
    ),
  },
  {
    key: 'createdBy',
    header: '创建人',
    render: (item) => <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.createdBy}</span>,
  },
];

// ---- 页面 ----

export default function CouponsListPage() {
  const searchFields = useMemo<(keyof Coupon)[]>(
    () => ['name', 'type', 'marketCode', 'brandCode', 'createdBy', 'value'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_COUPONS,
    searchFields,
  );

  const [typeFilter, setTypeFilter] = useState<CouponType | 'ALL'>('ALL');
  const typeFiltered = useMemo(
    () =>
      typeFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.type === typeFilter),
    [filteredItems, typeFilter],
  );

  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? typeFiltered
        : typeFiltered.filter((item) => item.status === statusFilter),
    [typeFiltered, statusFilter],
  );

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(statusFiltered, COLUMNS, sortConfig);

  const pagination = usePagination(sortedItems.length, 10);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize,
  );

  const stats = useMemo(() => {
    const active = MOCK_COUPONS.filter((c) => c.status === 'active').length;
    const totalUsed = MOCK_COUPONS.reduce((s, c) => s + c.usedCount, 0);
    const totalIssued = MOCK_COUPONS.reduce((s, c) => s + c.totalIssued, 0);
    return { total: MOCK_COUPONS.length, active, totalIssued, totalUsed };
  }, []);

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="优惠券管理"
        subtitle="ToB 管理端 — 管理租户级品牌级优惠券活动，跟踪核销情况和有效期。"
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatBadge label="优惠券总数" value={String(stats.total)} accent="#60a5fa" />
          <StatBadge label="进行中" value={String(stats.active)} accent="#4ade80" />
          <StatBadge label="总发放" value={stats.totalIssued.toLocaleString()} accent="#a78bfa" />
          <StatBadge label="已核销" value={stats.totalUsed.toLocaleString()} accent="#facc15" />
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索券名称、类型、市场、品牌、创建人..."
          />
        </div>

        {/* 类型过滤 */}
        <div style={{ marginBottom: 8 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部类型', count: filteredItems.length },
              ...(['discount', 'cash', 'free_shipping', 'voucher'] as CouponType[]).map((t) => ({
                key: t,
                label: TYPE_LABELS[t],
                count: filteredItems.filter((item) => item.type === t).length,
              })),
            ]}
            activeKey={typeFilter}
            onChange={(key) => setTypeFilter(key as CouponType | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 状态过滤 */}
        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部状态', count: typeFiltered.length },
              ...(['active', 'expired', 'disabled'] as CouponStatus[]).map((s) => ({
                key: s,
                label: STATUS_LABELS[s],
                count: typeFiltered.filter((item) => item.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as CouponStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 数据表格 */}
        <DataTable
          title={`优惠券列表（匹配 ${sortedItems.length} 条）`}
          columns={COLUMNS}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 空状态 */}
        {sortedItems.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              color: '#64748b',
              fontSize: 14,
              borderRadius: 12,
              border: '1px dashed rgba(148,163,184,0.18)',
              marginTop: 16,
            }}
          >
            未找到匹配的优惠券
          </div>
        )}

        {/* 分页 */}
        {sortedItems.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sortedItems.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        )}
      </PageShell>
    </main>
  );
}
