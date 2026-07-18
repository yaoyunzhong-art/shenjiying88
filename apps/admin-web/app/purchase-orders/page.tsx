/**
 * 采购单管理列表页 — Purchase Orders List Page
 * 角色视角：管理员 / 采购 / 店长
 * 功能：列表搜索、状态/紧急程度筛选、统计看板、分页浏览
 */
'use client';

import React, { useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import {
  DataTable,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  SubmitButton,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';



import {
  MOCK_PURCHASE_ORDERS,
  PURCHASE_ORDER_STATUS_MAP,
  PURCHASE_ORDER_URGENCY_MAP,
  PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_LIST_SEARCH_FIELDS,
  computePurchaseOrderStats,
  formatCurrency,
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
  type PurchaseOrderUrgency,
} from './purchase-orders-data';

// ---- 列定义 ----

function buildColumns(onRowClick: (item: PurchaseOrderItem) => void): DataTableColumn<PurchaseOrderItem>[] {
  return [
    {
      key: 'orderNo',
      title: '采购单号',
      dataKey: 'orderNo',
      sortable: true,
      render: (item: PurchaseOrderItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
        >
          {item.orderNo}
        </span>
      ),
    },
    {
      key: 'supplierName',
      title: '供应商',
      dataKey: 'supplierName',
      sortable: true,
    },
    {
      key: 'totalAmount',
      title: '金额',
      dataKey: 'totalAmount',
      sortable: true,
      align: 'right',
      render: (item: PurchaseOrderItem) => (
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontFamily: 'monospace' }}>
          ¥{formatCurrency(item.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataKey: 'status',
      sortable: true,
      render: (item: PurchaseOrderItem) => {
        const cfg = PURCHASE_ORDER_STATUS_MAP[item.status];
        return <StatusBadge label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: 'urgency',
      title: '紧急程度',
      dataKey: 'urgency',
      sortable: true,
      render: (item: PurchaseOrderItem) => {
        const cfg = PURCHASE_ORDER_URGENCY_MAP[item.urgency];
        return <StatusBadge label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: 'itemsCount',
      title: '品项数',
      dataKey: 'itemsCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'totalQuantity',
      title: '总数量',
      dataKey: 'totalQuantity',
      sortable: true,
      align: 'right',
    },
    {
      key: 'expectedDelivery',
      title: '预计到货',
      dataKey: 'expectedDelivery',
      sortable: true,
      render: (item: PurchaseOrderItem) => (
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.expectedDelivery}</span>
      ),
    },
    {
      key: 'department',
      title: '部门',
      dataKey: 'department',
      sortable: true,
      render: (item: PurchaseOrderItem) => (
        <span style={{ color: '#64748b', fontSize: 12 }}>{item.department}</span>
      ),
    },
    {
      key: 'contactPerson',
      title: '联系人',
      dataKey: 'contactPerson',
      sortable: true,
    },
  ];
}

// ---- 统计卡片 ----

function StatsCards({ stats }: { stats: ReturnType<typeof computePurchaseOrderStats> }) {
  const cards = [
    { label: '采购单总数', value: stats.total, color: '#60a5fa' },
    { label: '待审批', value: stats.pendingApproval, color: '#a78bfa' },
    { label: '待收货', value: stats.shipped + stats.partialReceived, color: '#fbbf24' },
    { label: '已完成', value: stats.received, color: '#34d399' },
    { label: '紧急单', value: stats.urgentCount, color: '#f87171' },
    { label: '采购总额', value: `¥${formatCurrency(stats.totalAmount)}`, color: '#e2e8f0' },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            flex: '1 0 140px',
            borderRadius: 12,
            background: 'rgba(15,23,42,0.4)',
            border: '1px solid rgba(148,163,184,0.1)',
            padding: '14px 16px',
            minWidth: 100,
          }}
        >
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{card.label}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: card.color, fontFamily: 'monospace' }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- 状态 Tab 定义 ----

interface StatusTab {
  key: PurchaseOrderStatus | 'all';
  label: string;
  count: number;
}

function buildTabs(stats: ReturnType<typeof computePurchaseOrderStats>): StatusTab[] {
  return [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'draft', label: '草稿', count: stats.draft },
    { key: 'pending_approval', label: '待审批', count: stats.pendingApproval },
    { key: 'approved', label: '已批准', count: stats.approved },
    { key: 'shipped', label: '已发货', count: stats.shipped },
    { key: 'partial_received', label: '部分收货', count: stats.partialReceived },
    { key: 'received', label: '已收货', count: stats.received },
    { key: 'cancelled', label: '已取消', count: stats.cancelled },
  ];
}

// ---- 页面组件 ----

export default function PurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState<PurchaseOrderStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ---- 数据 ----
  const allOrders = useMemo(() => MOCK_PURCHASE_ORDERS, []);
  const stats = useMemo(() => computePurchaseOrderStats(allOrders), [allOrders]);

  // ---- Tab 筛选 ----
  const tabFiltered = useMemo(() => {
    if (activeTab === 'all') return allOrders;
    return allOrders.filter((po) => po.status === activeTab);
  }, [allOrders, activeTab]);

  // ---- 搜索 ----
  const { searchTerm, setSearchTerm, filteredItems: searched } = useSearchFilter(
    tabFiltered,
    PURCHASE_ORDER_LIST_SEARCH_FIELDS,
  );

  const router = useRouter();

  // ---- 行点击 ----
  const handleRowClick = (item: PurchaseOrderItem) => {
    router.push(`/purchase-orders/${item.id}`);
  };

  // ---- 新建采购单 ----
  const handleCreateNew = () => {
    router.push('/purchase-orders/form');
  };

  // ---- 排序 ----
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'orderDate',
    direction: 'desc',
  });
  const columns = useMemo(() => buildColumns(handleRowClick), []);
  const sorted = useSortedItems(searched, columns, sortConfig);

  // ---- 分页 ----
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [10, 20, 50],
  });
  const pageItems = pagination.paginate(sorted);

  // ---- 选中 ----
  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const tabs = useMemo(() => buildTabs(stats), [stats]);

  return (
    <PageShell
      title="采购单管理"
      description="管理门店采购订单，包括审批、收货流程跟踪"
    >
      {/* 统计卡片 */}
      <StatsCards stats={stats} />

      {/* 搜索 + ActionBar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, maxWidth: 380, minWidth: 200 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索采购单号 / 供应商 / 联系人..."
            width="100%"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            共 {sorted.length} 条
          </span>
          <SubmitButton onClick={handleCreateNew}>
            ＋ 新建采购单
          </SubmitButton>
        </div>
      </div>

      {/* 状态 Tabs */}
      <Tabs<PurchaseOrderStatus | 'all'>
        items={tabs}
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          pagination.setPage(1);
          setSelectedIds([]);
        }}
      />

      {/* 数据表格 */}
      <DataTable<PurchaseOrderItem>
        columns={columns}
        rows={pageItems}
        sort={sortConfig}
        onSortChange={setSortConfig}
        onRowClick={handleRowClick}
        emptyText={searchTerm ? '未找到匹配的采购单' : '暂无采购单数据'}
        rowKey={(row: PurchaseOrderItem) => row.id}
      />

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sorted.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </div>
    </PageShell>
  );
}
