'use client';

import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';

import {
  DataTable,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// P1-3: 共享层收口 — 从 API 加载订单数据, API 不可用时回落 MOCK
import { createBusinessClient } from '@m5/sdk';

import {
  MOCK_ORDERS,
  ORDER_STATUS_MAP,
  ORDER_CHANNEL_MAP,
  ORDER_STATUSES,
  ORDER_CHANNELS,
  ORDER_STATUS_FLOW,
  type OrderItem,
  type OrderStatus,
  type OrderChannel,
} from '../orders-data';
import { AdminPermissionGate } from '../components/admin-permission-gate';

const permissionGate = {
  requiredPermission: 'order:read',
  title: '订单管理访问受限',
  description:
    '订单管理中心已接入管理员本地 session，只有具备 order:read 的账号才能查看订单列表、状态流转与渠道统计结果。',
} as const;

// ── API 客户端 (client-side singleton) ──

function getBizClient() {
  if (typeof window === 'undefined') return null;
  if (!(window as any).__m5_biz_client) {
    (window as any).__m5_biz_client = createBusinessClient();
  }
  return (window as any).__m5_biz_client as ReturnType<typeof createBusinessClient>;
}

/** 将后端订单数据映射为 OrderItem 前端类型 */
function mapApiOrderToOrderItem(apiOrder: any): OrderItem {
  const rawAmount = (apiOrder.totalAmount ?? 0) / 100;
  const rawPaid = (apiOrder.paidAmount ?? 0) / 100;
  const rawRefunded = (apiOrder.refundedAmount ?? 0) / 100;

  // 根据后端 status -> 前端 OrderStatus
  const backendStatus = (apiOrder.status ?? '').toLowerCase();
  let status: OrderStatus = 'pending';
  if (['draft', 'pending'].includes(backendStatus)) status = 'pending';
  else if (backendStatus === 'paid') status = 'confirmed';
  else if (backendStatus === 'fulfilled') status = 'delivered';
  else if (['cancelled', 'canceled'].includes(backendStatus)) status = 'cancelled';
  else if (['refunded', 'partially_refunded'].includes(backendStatus)) status = 'refunded';
  else if (backendStatus === 'timeout') status = 'cancelled';

  return {
    id: apiOrder.orderId ?? apiOrder.id ?? '',
    orderNo: apiOrder.orderNo ?? apiOrder.orderId ?? '',
    customerName: apiOrder.memberId ?? '—',
    customerPhone: '',
    channel: 'online' as OrderChannel,
    status,
    itemCount: (apiOrder.items ?? []).length,
    totalAmount: rawAmount,
    discountAmount: apiOrder.discountCents ? apiOrder.discountCents / 100 : 0,
    paidAmount: rawPaid,
    storeName: '',
    marketCode: apiOrder.currency ?? 'CNY',
    salesClerk: '',
    note: '',
    createdAt: apiOrder.createdAt ?? '',
    updatedAt: apiOrder.updatedAt ?? '',
  };
}

// ---- 金额格式化 ----

function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

function amountColor(amount: number): string {
  if (amount >= 300) return '#4ade80';
  if (amount >= 100) return '#fbbf24';
  return '#94a3b8';
}

// ---- 状态流转按钮样式 ----

function nextStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending': return '确认';
    case 'confirmed': return '开始处理';
    case 'processing': return '发货';
    case 'shipped': return '签收';
    case 'delivered': return '退款';
    default: return '';
  }
}

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: OrderItem) => void
): DataTableColumn<OrderItem>[] {
  return [
    {
      key: 'orderNo',
      title: '订单号',
      dataKey: 'orderNo',
      sortable: true,
    },
    {
      key: 'customerName',
      title: '客户',
      dataKey: 'customerName',
      sortable: true,
      render: (item: OrderItem) => (
        <div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(item);
            }}
            style={{
              color: '#93c5fd',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            title="查看订单详情"
          >
            {item.customerName}
          </span>
          <div style={{ fontSize: 11, color: '#64748b' }}>{item.customerPhone}</div>
        </div>
      ),
    },
    {
      key: 'channel',
      title: '渠道',
      sortable: true,
      sortValue: (item: OrderItem) => item.channel,
      render: (item: OrderItem) => {
        const c = ORDER_CHANNEL_MAP[item.channel];
        return <StatusBadge label={c.label} variant={c.variant} size="sm" />;
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: OrderItem) => item.status,
      render: (item: OrderItem) => {
        const s = ORDER_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'itemCount',
      title: '件数',
      dataKey: 'itemCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'totalAmount',
      title: '金额',
      dataKey: 'totalAmount',
      sortable: true,
      align: 'right',
      render: (item: OrderItem) => (
        <div>
          <span style={{ fontWeight: 600, color: amountColor(item.totalAmount), fontVariantNumeric: 'tabular-nums' }}>
            {formatAmount(item.totalAmount)}
          </span>
          {item.discountAmount > 0 && (
            <div style={{ fontSize: 11, color: '#64748b' }}>
              优惠 {formatAmount(item.discountAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'paidAmount',
      title: '实付',
      dataKey: 'paidAmount',
      sortable: true,
      align: 'right',
      render: (item: OrderItem) => (
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {formatAmount(item.paidAmount)}
        </span>
      ),
    },
    {
      key: 'storeName',
      title: '门店',
      dataKey: 'storeName',
      sortable: true,
    },
    {
      key: 'marketCode',
      title: '市场',
      dataKey: 'marketCode',
      sortable: true,
    },
    {
      key: 'salesClerk',
      title: '导购',
      dataKey: 'salesClerk',
      sortable: true,
    },
    {
      key: 'createdAt',
      title: '下单时间',
      dataKey: 'createdAt',
      sortable: true,
    },
    {
      key: 'actions',
      title: '操作',
      sortable: false,
      render: (item: OrderItem) => {
        const nextStatuses = ORDER_STATUS_FLOW[item.status];
        if (nextStatuses.length === 0) return <span style={{ color: '#64748b', fontSize: 12 }}>—</span>;
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {nextStatuses.map((ns) => (
              <button
                key={ns}
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick(item);
                }}
                style={actionBtnStyle(ns)}
              >
                {nextStatusLabel(item.status) || ORDER_STATUS_MAP[ns].label}
              </button>
            ))}
          </div>
        );
      },
    },
  ];
}

function actionBtnStyle(status: OrderStatus): React.CSSProperties {
  const isCancel = status === 'cancelled' || status === 'refunded';
  return {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid ' + (isCancel ? 'rgba(248, 113, 113, 0.4)' : 'rgba(96, 165, 250, 0.4)'),
    background: isCancel ? 'rgba(127, 29, 29, 0.15)' : 'rgba(29, 78, 216, 0.12)',
    color: isCancel ? '#fecaca' : '#93c5fd',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

// ---- 页面组件 ----

function OrdersPageContent() {
  const searchFields = useMemo<(keyof OrderItem)[]>(
    () => ['orderNo', 'customerName', 'customerPhone', 'storeName', 'salesClerk'],
    []
  );

  // ── 数据源 (API first, fallback to mock) ──
  const [orders, setOrders] = useState<OrderItem[]>(MOCK_ORDERS);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const biz = getBizClient();
    if (!biz) {
      setOrdersLoading(false);
      return;
    }

    biz.orders.list()
      .then((apiOrders: any) => {
        if (Array.isArray(apiOrders) && apiOrders.length > 0) {
          setOrders(apiOrders.map(mapApiOrderToOrderItem));
        }
      })
      .catch(() => {
        // API 不可用, 保持 MOCK_ORDERS 回退
      })
      .finally(() => setOrdersLoading(false));
  }, []);

  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    orders,
    searchFields
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter]
  );

  // 渠道筛选
  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'ALL'>('ALL');
  const channelFiltered = useMemo(
    () =>
      channelFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.channel === channelFilter),
    [statusFiltered, channelFilter]
  );

  // 市场筛选
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? channelFiltered
        : channelFiltered.filter((item) => item.marketCode === marketFilter),
    [channelFiltered, marketFilter]
  );

  // 金额范围筛选
  type AmountRange = 'ALL' | 'under100' | '100to300' | 'over300';
  const [amountFilter, setAmountFilter] = useState<AmountRange>('ALL');
  const amountFiltered = useMemo(
    () =>
      amountFilter === 'ALL'
        ? marketFiltered
        : amountFilter === 'under100'
          ? marketFiltered.filter((item) => item.totalAmount < 100)
          : amountFilter === '100to300'
            ? marketFiltered.filter((item) => item.totalAmount >= 100 && item.totalAmount <= 300)
            : marketFiltered.filter((item) => item.totalAmount > 300),
    [marketFiltered, amountFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: OrderItem) => {
    window.location.href = `/orders/${item.id}`;
  }, []);

  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(amountFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, statusFilter, channelFilter, marketFilter, amountFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计 (基于实时 orders)
  const allMarkets = useMemo(
    () => [...new Set(orders.map((o) => o.marketCode))].sort(),
    [orders]
  );
  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing' || o.status === 'shipped').length,
      completed: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled' || o.status === 'refunded').length,
      totalRevenue: orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.paidAmount, 0),
      avgOrderValue: orders.length > 0
        ? (orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length).toFixed(0)
        : '0',
    }),
    [orders]
  );

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="订单管理中心"
        subtitle="统一管理全渠道订单，支持订单查询、状态流转、退款处理与数据统计。"
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总订单</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>
              {stats.total}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              覆盖 {allMarkets.length} 个市场
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>待处理</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#fbbf24' }}
            >
              {stats.pending}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              待确认 & 已确认
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>处理中</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}
            >
              {stats.processing}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              处理中 & 配送中
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>已完成</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}
            >
              {stats.completed}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              已签收
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>已取消/退款</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}
            >
              {stats.cancelled}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              取消 & 退款
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>客单价</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: amountColor(Number(stats.avgOrderValue)),
              }}
            >
              ¥{stats.avgOrderValue}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              已完成收入 ¥{stats.totalRevenue.toFixed(0)}
            </div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索订单号 / 客户姓名 / 手机号 / 门店 / 导购..."
          />
        </div>

        {/* 状态过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: orders.length },
              ...ORDER_STATUSES.map((s) => ({
                key: s,
                label: ORDER_STATUS_MAP[s].label,
                count: orders.filter((item) => item.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as OrderStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 渠道 + 市场 + 金额 筛选栏 */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              渠道
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...ORDER_CHANNELS.map((c) => ({
                  key: c,
                  label: ORDER_CHANNEL_MAP[c].label,
                  count: statusFiltered.filter(
                    (item) => item.channel === c
                  ).length,
                })),
              ]}
              activeKey={channelFilter}
              onChange={(key) => setChannelFilter(key as OrderChannel | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              市场
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: channelFiltered.length },
                ...allMarkets.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: channelFiltered.filter(
                    (item) => item.marketCode === mkt
                  ).length,
                })),
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              金额
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                {
                  key: 'under100',
                  label: '¥100以下',
                  count: marketFiltered.filter(
                    (item) => item.totalAmount < 100
                  ).length,
                },
                {
                  key: '100to300',
                  label: '¥100-300',
                  count: marketFiltered.filter(
                    (item) => item.totalAmount >= 100 && item.totalAmount <= 300
                  ).length,
                },
                {
                  key: 'over300',
                  label: '¥300以上',
                  count: marketFiltered.filter(
                    (item) => item.totalAmount > 300
                  ).length,
                },
              ]}
              activeKey={amountFilter}
              onChange={(key) => setAmountFilter(key as AmountRange)}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃过滤条件 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(statusFilter !== 'ALL'
              ? [
                  {
                    key: 'status' as const,
                    label: ORDER_STATUS_MAP[statusFilter].label,
                    tone: (ORDER_STATUS_MAP[statusFilter].variant === 'success'
                      ? 'success'
                      : ORDER_STATUS_MAP[statusFilter].variant === 'warning'
                        ? 'warning'
                        : ORDER_STATUS_MAP[statusFilter].variant === 'danger'
                          ? 'danger'
                          : 'neutral') as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.status === statusFilter
                    ).length,
                  },
                ]
              : []),
            ...(channelFilter !== 'ALL'
              ? [
                  {
                    key: 'channel' as const,
                    label: ORDER_CHANNEL_MAP[channelFilter].label,
                    tone: 'neutral' as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.channel === channelFilter
                    ).length,
                  },
                ]
              : []),
            ...(marketFilter !== 'ALL'
              ? [
                  {
                    key: 'market' as const,
                    label: marketFilter,
                    tone: 'neutral' as FilterChip['tone'],
                    count: channelFiltered.filter(
                      (item) => item.marketCode === marketFilter
                    ).length,
                  },
                ]
              : []),
            ...(amountFilter !== 'ALL'
              ? [
                  {
                    key: 'amount' as const,
                    label:
                      amountFilter === 'under100'
                        ? '¥100以下'
                        : amountFilter === '100to300'
                          ? '¥100-300'
                          : '¥300以上',
                    tone: 'neutral' as FilterChip['tone'],
                    count: marketFiltered.filter((item) => {
                      if (amountFilter === 'under100') return item.totalAmount < 100;
                      if (amountFilter === '100to300') return item.totalAmount >= 100 && item.totalAmount <= 300;
                      return item.totalAmount > 300;
                    }).length,
                  },
                ]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'status':
                setStatusFilter('ALL');
                break;
              case 'channel':
                setChannelFilter('ALL');
                break;
              case 'market':
                setMarketFilter('ALL');
                break;
              case 'amount':
                setAmountFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setStatusFilter('ALL');
            setChannelFilter('ALL');
            setMarketFilter('ALL');
            setAmountFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`订单列表（匹配 ${sortedItems.length} 条）`}
          columns={columns}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 分页 */}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </PageShell>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <AdminPermissionGate {...permissionGate}>
      <Suspense fallback={<OrdersPageFallback />}>
        <OrdersPageContent />
      </Suspense>
    </AdminPermissionGate>
  );
}

// ---- 样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

function OrdersPageFallback() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
      正在加载订单管理视图...
    </main>
  );
}
