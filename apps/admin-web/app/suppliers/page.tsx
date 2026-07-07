'use client';

import { useState, useMemo } from 'react';

import {
  DataTable,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  MOCK_SUPPLIERS,
  SUPPLIER_STATUS_MAP,
  SUPPLIER_CATEGORY_MAP,
  SUPPLIER_CREDIT_MAP,
  SUPPLIER_LIST_SEARCH_FIELDS,
  computeSupplierStats,
  formatCurrency,
  type SupplierItem,
  type SupplierStatus,
  type SupplierCategory,
} from './suppliers-data';

// ---- 列定义 ----

const COLUMNS: DataTableColumn<SupplierItem>[] = [
  {
    key: 'code',
    header: '编号',
    render: (item) => (
      <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{item.code}</span>
    ),
  },
  {
    key: 'name',
    header: '供应商名称',
    sortValue: (row) => row.name,
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.contactPerson} | {item.contactPhone}
        </span>
      </div>
    ),
  },
  {
    key: 'category',
    header: '品类',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{SUPPLIER_CATEGORY_MAP[item.category]}</span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => {
      const s = SUPPLIER_STATUS_MAP[item.status];
      return <StatusBadge label={s.label} variant={s.variant} size="sm" />;
    },
  },
  {
    key: 'creditRating',
    header: '信用',
    align: 'center',
    render: (item) => {
      const cr = SUPPLIER_CREDIT_MAP[item.creditRating];
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '1px 8px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            backgroundColor: cr.color,
          }}
        >
          {cr.label}
        </span>
      );
    },
  },
  {
    key: 'totalOrders',
    header: '订单数',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        {item.totalOrders.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'totalAmount',
    header: '交易额',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#facc15' }}>
        ¥{formatCurrency(item.totalAmount)}
      </span>
    ),
  },
  {
    key: 'defectRate',
    header: '次品率',
    align: 'right',
    render: (item) => (
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontSize: 13,
          color: item.defectRate > 5 ? '#ef4444' : item.defectRate > 2 ? '#facc15' : '#94a3b8',
        }}
      >
        {item.defectRate ? `${item.defectRate.toFixed(1)}%` : '-'}
      </span>
    ),
  },
  {
    key: 'avgDeliveryDays',
    header: '平均交付(天)',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        {item.avgDeliveryDays > 0 ? item.avgDeliveryDays : '-'}
      </span>
    ),
  },
  {
    key: 'lastOrderAt',
    header: '最近订单',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#64748b' }}>{item.lastOrderAt}</span>
    ),
  },
];

// ---- 统计卡片 ----

function StatBlock({ label, value, accent }: { label: string; value: string; accent: string }) {
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
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
    </article>
  );
}

// ---- 页面 ----

export default function SuppliersListPage() {
  // 搜索
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_SUPPLIERS,
    SUPPLIER_LIST_SEARCH_FIELDS,
  );

  // 状态过滤
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
  );

  // 品类过滤（叠加）
  const [categoryFilter, setCategoryFilter] = useState<SupplierCategory | 'ALL'>('ALL');
  const finalFiltered = useMemo(
    () =>
      categoryFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.category === categoryFilter),
    [statusFiltered, categoryFilter],
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(finalFiltered, COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 8);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 8,
    pagination.page * 8,
  );

  // 统计
  const stats = useMemo(() => computeSupplierStats(MOCK_SUPPLIERS), []);

  // 去重品类
  const categoryOptions = useMemo<SupplierCategory[]>(
    () => [...new Set(MOCK_SUPPLIERS.map((s) => s.category))],
    [],
  );

  return (
    <PageShell title="供应商管理" description="管理所有合作供应商，追踪供货质量与履约情况。">
      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatBlock label="总供应商" value={String(stats.total)} accent="#60a5fa" />
        <StatBlock label="合作中" value={String(stats.active)} accent="#4ade80" />
        <StatBlock label="待审核" value={String(stats.pendingAudit)} accent="#38bdf8" />
        <StatBlock label="暂停/黑名单" value={String(stats.paused + stats.blacklisted)} accent="#ef4444" />
        <StatBlock label="总订单数" value={stats.totalOrders.toLocaleString()} accent="#34d399" />
        <StatBlock label="平均次品率" value={`${stats.avgDefectRate.toFixed(1)}%`} accent="#facc15" />
      </div>

      {/* 搜索 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索供应商名称、编号、联系人、品类..."
        />
      </div>

      {/* 状态过滤 */}
      <div style={{ marginBottom: 8 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部', count: (filteredItems ?? []).length },
            ...SUPPLIER_STATUS_MAP
              ? Object.entries(SUPPLIER_STATUS_MAP).map(([key, val]) => ({
                  key,
                  label: val.label,
                  count: (filteredItems ?? []).filter((c) => c.status === key).length,
                }))
              : [],
          ]}
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key as SupplierStatus | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 品类过滤 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部品类', count: statusFiltered.length },
            ...categoryOptions.map((cat) => ({
              key: cat,
              label: SUPPLIER_CATEGORY_MAP[cat],
              count: statusFiltered.filter((s) => s.category === cat).length,
            })),
          ]}
          activeKey={categoryFilter}
          onChange={(key) => setCategoryFilter(key as SupplierCategory | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 表格 */}
      <DataTable
        columns={COLUMNS}
        rows={pageItems}
        rowKey={(item) => item.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
      />

      {/* 空状态 */}
      {finalFiltered.length === 0 && (
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
          未找到匹配的供应商
        </div>
      )}

      {/* 分页 */}
      {finalFiltered.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={sortedItems.length}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
    </PageShell>
  );
}
