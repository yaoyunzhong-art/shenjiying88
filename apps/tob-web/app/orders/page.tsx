/**
 * orders/page.tsx — 订单列表页 (ToB 订单管理)
 * 功能: 搜索 / 状态筛选 / 付款状态筛选 / 统计卡片 / 分页
 */
'use client';

import React, { useMemo, useState } from 'react';
import {
  DataTable,
  StatusBadge,
  SearchFilterInput,
  Pagination,
  StatCard,
  LoadingSkeleton,
} from '@m5/ui';

import type { DataTableColumn } from '@m5/ui';
import {
  MOCK_ORDERS,
  ORDER_STATUS_MAP,
  ORDER_PAYMENT_STATUS_MAP,
  ORDER_SOURCE_MAP,
  ORDER_STATUSES,
  ORDER_PAYMENT_STATUSES,
  type OrderItem,
  type OrderStatus,
  type OrderPaymentStatus,
} from '../orders-data';

const ORDERS_PER_PAGE = 10;

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<OrderPaymentStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Simulate initial loading
  useMemo(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 80);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let items = MOCK_ORDERS;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const fields: (keyof OrderItem)[] = ['orderNo', 'customerName', 'customerCompany', 'productName', 'salesPerson'];
      items = items.filter((o) =>
        fields.some((f) => String(o[f]).toLowerCase().includes(lower)),
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter((o) => o.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      items = items.filter((o) => o.paymentStatus === paymentFilter);
    }

    return items;
  }, [searchTerm, statusFilter, paymentFilter]);

  const paged = useMemo(() => {
    const start = page * ORDERS_PER_PAGE;
    return filtered.slice(start, start + ORDERS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ORDERS_PER_PAGE);

  // Stats
  const stats = useMemo(() => {
    const totalAmount = MOCK_ORDERS.reduce((s, o) => s + o.totalAmount, 0);
    const pendingCount = MOCK_ORDERS.filter((o) => o.status === 'pending').length;
    const unpaidAmount = MOCK_ORDERS
      .filter((o) => o.paymentStatus === 'unpaid')
      .reduce((s, o) => s + o.totalAmount, 0);
    const deliveredCount = MOCK_ORDERS.filter((o) => o.status === 'delivered').length;
    return { total: MOCK_ORDERS.length, totalAmount, pendingCount, unpaidAmount, deliveredCount };
  }, []);

  const columns: DataTableColumn<OrderItem>[] = [
    {
      key: 'orderNo',
      header: '订单编号',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0', fontFamily: 'monospace' }}>{item.orderNo}</span>
      ),
    },
    {
      key: 'customerCompany',
      header: '客户',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{item.customerCompany}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.customerName}</div>
        </div>
      ),
    },
    { key: 'productName', header: '产品' },
    {
      key: 'quantity',
      header: '数量',
      render: (item) => `${item.quantity}`,
    },
    {
      key: 'totalAmount',
      header: '金额',
      render: (item) => formatAmount(item.totalAmount),
    },
    {
      key: 'paymentStatus',
      header: '付款',
      render: (item) => {
        const info = ORDER_PAYMENT_STATUS_MAP[item.paymentStatus];
        return <StatusBadge variant={info.variant} label={info.label} />;
      },
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => {
        const info = ORDER_STATUS_MAP[item.status];
        return <StatusBadge variant={info.variant} label={info.label} />;
      },
    },
    {
      key: 'createdAt',
      header: '创建日期',
      render: (item) => item.createdAt,
    },
    {
      key: 'source',
      header: '来源',
      render: (item) => ORDER_SOURCE_MAP[item.source],
    },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>订单管理</h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="全部订单" value={stats.total.toString()} />
        <StatCard label="订单总金额" value={formatAmount(stats.totalAmount)} />
        <StatCard label="待确认" value={stats.pendingCount.toString()} />
        <StatCard label="未付款金额" value={formatAmount(stats.unpaidAmount)} />
        <StatCard label="已完成" value={stats.deliveredCount.toString()} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchFilterInput
          placeholder="搜索订单号/客户/产品/业务员..."
          value={searchTerm}
          onChange={(v) => {
            setSearchTerm(v);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatus | 'all');
            setPage(0);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
        >
          <option value="all">全部状态</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_MAP[s].label}</option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value as OrderPaymentStatus | 'all');
            setPage(0);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
        >
          <option value="all">全部付款</option>
          {ORDER_PAYMENT_STATUSES.map((p) => (
            <option key={p} value={p}>{ORDER_PAYMENT_STATUS_MAP[p].label}</option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
          共 {filtered.length} 条结果
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <DataTable columns={columns} rows={paged} rowKey={(o: OrderItem) => o.id} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          total={filtered.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
