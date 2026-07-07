/**
 * 采购单列表页 — Purchase Orders List Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 列表搜索、状态筛选、分页浏览
 */
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  DataTable,
  PageShell,
  Pagination,
  usePagination,
  SearchFilterInput,
  useSearchFilter,
  StatusBadge,
  Button,
  EmptyState,
  type DataTableColumn,
} from '@m5/ui';

// ---- 类型 ----

type PurchaseOrderStatus = 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'received' | 'cancelled';

interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplier: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  itemsCount: number;
  orderDate: string;
  expectedDelivery: string;
  contactPerson: string;
  createdAt: string;
}

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  confirmed: '已确认',
  shipped: '已发货',
  received: '已收货',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<PurchaseOrderStatus, 'warning' | 'info' | 'success' | 'default' | 'pending' | 'neutral'> = {
  draft: 'warning',
  submitted: 'info',
  confirmed: 'success',
  shipped: 'success',
  received: 'neutral',
  cancelled: 'neutral',
};

// ---- Mock 数据 ----

const MOCK_ORDERS: PurchaseOrder[] = [
  { id: '1', orderNo: 'PO-20260601-001', supplier: '广州美妆供应链有限公司', totalAmount: 28600, status: 'received', itemsCount: 12, orderDate: '2026-06-01', expectedDelivery: '2026-06-10', contactPerson: '李明', createdAt: '2026-06-01 09:00' },
  { id: '2', orderNo: 'PO-20260605-002', supplier: '上海日化贸易有限公司', totalAmount: 15800, status: 'shipped', itemsCount: 8, orderDate: '2026-06-05', expectedDelivery: '2026-06-15', contactPerson: '王芳', createdAt: '2026-06-05 10:30' },
  { id: '3', orderNo: 'PO-20260610-003', supplier: '深圳包材创新有限公司', totalAmount: 8900, status: 'confirmed', itemsCount: 6, orderDate: '2026-06-10', expectedDelivery: '2026-06-20', contactPerson: '刘洋', createdAt: '2026-06-10 14:00' },
  { id: '4', orderNo: 'PO-20260612-004', supplier: '杭州香氛科技有限公司', totalAmount: 4200, status: 'submitted', itemsCount: 3, orderDate: '2026-06-12', expectedDelivery: '2026-06-22', contactPerson: '张伟', createdAt: '2026-06-12 11:20' },
  { id: '5', orderNo: 'PO-20260615-005', supplier: '广州妆具工贸有限公司', totalAmount: 12600, status: 'draft', itemsCount: 10, orderDate: '2026-06-15', expectedDelivery: '2026-06-25', contactPerson: '赵鹏', createdAt: '2026-06-15 16:00' },
  { id: '6', orderNo: 'PO-20260618-006', supplier: '广州美妆供应链有限公司', totalAmount: 34000, status: 'shipped', itemsCount: 15, orderDate: '2026-06-18', expectedDelivery: '2026-06-28', contactPerson: '李明', createdAt: '2026-06-18 08:45' },
  { id: '7', orderNo: 'PO-20260620-007', supplier: '上海日化贸易有限公司', totalAmount: 7500, status: 'cancelled', itemsCount: 5, orderDate: '2026-06-20', expectedDelivery: '2026-06-30', contactPerson: '王芳', createdAt: '2026-06-20 13:10' },
  { id: '8', orderNo: 'PO-20260622-008', supplier: '深圳包材创新有限公司', totalAmount: 5200, status: 'received', itemsCount: 4, orderDate: '2026-06-22', expectedDelivery: '2026-07-02', contactPerson: '刘洋', createdAt: '2026-06-22 09:30' },
];

// ---- 列定义 ----

const COLUMNS: DataTableColumn<PurchaseOrder>[] = [
  {
    key: 'orderNo',
    header: '采购单号',
    render: (item) => (
      <Link
        href={`/purchase-orders/${item.id}`}
        style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}
      >
        {item.orderNo}
      </Link>
    ),
  },
  {
    key: 'supplier',
    header: '供应商',
    render: (item) => <span style={{ color: '#e2e8f0' }}>{item.supplier}</span>,
  },
  {
    key: 'totalAmount',
    header: '总金额',
    align: 'right',
    render: (item) => (
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
        ¥{item.totalAmount.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'itemsCount',
    header: '商品数',
    align: 'right',
    render: (item) => <span>{item.itemsCount}</span>,
  },
  {
    key: 'orderDate',
    header: '采购日期',
    render: (item) => <span style={{ color: '#94a3b8' }}>{item.orderDate}</span>,
  },
  {
    key: 'expectedDelivery',
    header: '预计到货',
    render: (item) => <span style={{ color: '#94a3b8' }}>{item.expectedDelivery}</span>,
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge
        label={STATUS_LABELS[item.status]}
        variant={STATUS_VARIANTS[item.status]}
        size="sm"
      />
    ),
  },
];

// ---- 统计 ----

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148,163,184,0.12)',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
    </div>
  );
}

// ---- 页面 ----

export default function PurchaseOrdersListPage() {
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');

  const searchFields = useMemo<(keyof PurchaseOrder)[]>(
    () => ['orderNo', 'supplier', 'contactPerson'],
    [],
  );

  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_ORDERS, searchFields);

  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? (filteredItems ?? [])
        : (filteredItems ?? []).filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
  );

  const pagination = usePagination(statusFiltered.length, 10);
  const pageItems = statusFiltered.slice(
    (pagination.page - 1) * 10,
    pagination.page * 10,
  );

  const stats = useMemo(() => {
    const total = MOCK_ORDERS.length;
    const totalAmount = MOCK_ORDERS.reduce((s, o) => s + o.totalAmount, 0);
    const received = MOCK_ORDERS.filter((o) => o.status === 'received').length;
    return { total, totalAmount, received };
  }, []);

  return (
    <PageShell
      title="采购单"
      actions={
        <Link
          href="/purchase-orders/new"
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: '#3b82f6',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          + 新建采购单
        </Link>
      }
    >
      {/* 统计 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard label="总采购单" value={String(stats.total)} accent="#60a5fa" />
        <StatCard label="已收货" value={String(stats.received)} accent="#4ade80" />
        <StatCard label="总金额" value={`¥${(stats.totalAmount / 10000).toFixed(1)}万`} accent="#facc15" />
      </div>

      {/* 搜索 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索采购单号、供应商、联系人..."
        />
      </div>

      {/* 表格 */}
      {pageItems.length === 0 ? (
        <EmptyState
          title="暂无采购单"
          description="您还没有创建任何采购单，点击上方按钮创建"
        />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={pageItems} rowKey={(item) => item.id} />
          <div style={{ marginTop: 12 }}>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={statusFiltered.length}
              onPageChange={pagination.setPage}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}
