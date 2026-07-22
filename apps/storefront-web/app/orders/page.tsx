'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSortedItems,
  StatCard,
  EmptyState,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import { useTriState } from '../_components/useTriState';
import { TriStateRenderer } from '../_components/TriStateRenderer';
import {
  formatStorefrontOrderCurrency,
  formatStorefrontOrderDateTime,
  getStorefrontOrderPaymentLabel,
  getStorefrontOrderStatusLabel,
  getStorefrontOrderStatusVariant,
  loadStorefrontOrders,
  matchesStorefrontOrderPaymentFilter,
  matchesStorefrontOrderStatusFilter,
  type StorefrontOrderListStatusFilter,
  type StorefrontOrderListViewItem,
  type StorefrontOrderPaymentFilter,
} from '../../lib/storefront-orders';
import { resolveStorefrontScope } from '../../lib/storefront-transactions';

const STATUS_FILTERS: Array<{ key: StorefrontOrderListStatusFilter; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待支付' },
  { key: 'PAID', label: '已支付' },
  { key: 'REFUNDED', label: '已退款' },
];

const PAYMENT_FILTERS: Array<{ key: StorefrontOrderPaymentFilter; label: string }> = [
  { key: 'ALL', label: '全部支付方式' },
  { key: 'WECHAT_PAY', label: '微信支付' },
  { key: 'ALIPAY', label: '支付宝' },
  { key: 'CASH', label: '现金' },
  { key: 'MEMBER_CARD', label: '会员卡' },
];

const COLUMNS: DataTableColumn<StorefrontOrderListViewItem>[] = [
  {
    key: 'orderNo',
    header: '订单号',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace' }}>
          {item.orderNo}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 2 }}>
          会员 {item.memberId}
        </span>
      </div>
    ),
  },
  {
    key: 'itemCount',
    header: '商品数',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#cbd5e1' }}>
        {item.itemCount} 件
      </span>
    ),
  },
  {
    key: 'totalAmount',
    header: '订单金额',
    align: 'right',
    render: (item) => (
      <div>
        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>
          {formatStorefrontOrderCurrency(item.totalAmount, item.currency)}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          实付 {formatStorefrontOrderCurrency(item.paidAmount, item.currency)}
        </div>
      </div>
    ),
  },
  {
    key: 'paymentChannel',
    header: '支付方式',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>
        {getStorefrontOrderPaymentLabel(item.paymentChannel)}
      </span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge
        label={getStorefrontOrderStatusLabel(item.status)}
        variant={getStorefrontOrderStatusVariant(item.status)}
        size="sm"
      />
    ),
  },
  {
    key: 'createdAt',
    header: '创建时间',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 12, color: '#64748b' }}>
        {formatStorefrontOrderDateTime(item.createdAt)}
      </span>
    ),
  },
];

export default function OrdersListPage() {
  const router = useRouter();
  const { loading, error, wrapLoad, syncData } = useTriState({ loading: true });
  const [pageData, setPageData] = useState<StorefrontOrderListViewItem[]>([]);
  const [pageReady, setPageReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StorefrontOrderListStatusFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<StorefrontOrderPaymentFilter>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const loadOrdersPage = useCallback(() => {
    const scope = resolveStorefrontScope();
    return wrapLoad(loadStorefrontOrders(scope)).then((data) => {
      const nextData = data ?? [];
      setPageData(nextData);
      syncData(nextData);
      setPageReady(true);
    });
  }, [syncData, wrapLoad]);

  useEffect(() => {
    void loadOrdersPage();
  }, [loadOrdersPage]);

  const searched = useMemo(() => {
    if (!searchTerm.trim()) {
      return pageData;
    }

    const lower = searchTerm.toLowerCase();
    return pageData.filter((order) => (
      order.orderNo.toLowerCase().includes(lower)
      || order.memberId.toLowerCase().includes(lower)
      || (order.paymentChannel ?? '').toLowerCase().includes(lower)
    ));
  }, [pageData, searchTerm]);

  const statusFiltered = useMemo(
    () => searched.filter((order) => matchesStorefrontOrderStatusFilter(order, statusFilter)),
    [searched, statusFilter],
  );

  const finalFiltered = useMemo(
    () => statusFiltered.filter((order) => matchesStorefrontOrderPaymentFilter(order, paymentFilter)),
    [paymentFilter, statusFiltered],
  );

  const sortedItems = useSortedItems(finalFiltered, COLUMNS, sortConfig);
  const pagination = usePagination(sortedItems.length, 12);
  const pageItems = sortedItems.slice((pagination.page - 1) * 12, pagination.page * 12);

  const handleRowClick = useCallback((item: StorefrontOrderListViewItem) => {
    router.push(`/orders/${item.id}`);
  }, [router]);

  const stats = useMemo(() => {
    const pending = pageData.filter((item) => item.status === 'pending_payment').length;
    const paid = pageData.filter((item) => item.status === 'paid').length;
    const refunded = pageData.filter((item) => item.status === 'refunded').length;
    const revenue = pageData
      .filter((item) => item.status === 'paid')
      .reduce((sum, item) => sum + item.paidAmount, 0);

    return {
      total: pageData.length,
      pending,
      paid,
      refunded,
      revenue,
    };
  }, [pageData]);

  return (
    <PageShell
      title="订单管理"
      description="查看门店真实订单记录，支持搜索、筛选、排序和详情跳转。"
    >
      <TriStateRenderer
        loading={loading}
        empty={pageData.length === 0 && pageReady}
        error={error}
        onRetry={() => {
          void loadOrdersPage();
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatCard label="总订单数" value={stats.total} variant="info" />
          <StatCard label="待支付" value={stats.pending} variant="warning" />
          <StatCard label="已支付" value={stats.paid} variant="success" />
          <StatCard label="已退款" value={stats.refunded} variant="default" />
          <StatCard label="实收金额" value={formatStorefrontOrderCurrency(stats.revenue)} variant="info" />
        </div>

        <div style={{ marginBottom: 12, maxWidth: 360 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索订单号、会员ID或支付渠道..."
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <Tabs
            items={STATUS_FILTERS.map((filter) => ({
              key: filter.key,
              label: filter.label,
              count: searched.filter((order) => matchesStorefrontOrderStatusFilter(order, filter.key)).length,
            }))}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as StorefrontOrderListStatusFilter)}
            variant="pills"
            size="sm"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={PAYMENT_FILTERS.map((filter) => ({
              key: filter.key,
              label: filter.label,
              count: statusFiltered.filter((order) => matchesStorefrontOrderPaymentFilter(order, filter.key)).length,
            }))}
            activeKey={paymentFilter}
            onChange={(key) => setPaymentFilter(key as StorefrontOrderPaymentFilter)}
            variant="pills"
            size="sm"
          />
        </div>

        {pageItems.length > 0 ? (
          <DataTable
            columns={COLUMNS}
            rows={pageItems}
            rowKey={(item) => item.id}
            sort={sortConfig}
            onSortChange={setSortConfig}
            onRowClick={handleRowClick}
          />
        ) : (
          <EmptyState
            title="暂无订单"
            description={searchTerm ? `未找到匹配 "${searchTerm}" 的真实订单` : '当前暂无真实订单记录'}
          />
        )}

        {sortedItems.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={sortedItems.length}
              onPageChange={pagination.setPage}
            />
          </div>
        )}
      </TriStateRenderer>
    </PageShell>
  );
}
