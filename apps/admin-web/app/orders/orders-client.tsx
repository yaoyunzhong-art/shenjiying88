'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  DataTable,
  FilterChips,
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
  type FilterChip,
} from '@m5/ui'
import {
  ORDER_CHANNEL_MAP,
  ORDER_CHANNELS,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_MAP,
  ORDER_STATUSES,
  type OrderChannel,
  type OrderItem,
  type OrdersSnapshotDelivery,
  type OrderStatus,
} from '../orders-data'

function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

function amountColor(amount: number): string {
  if (amount >= 300) return '#4ade80'
  if (amount >= 100) return '#fbbf24'
  return '#94a3b8'
}

function nextStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return '确认'
    case 'confirmed':
      return '开始处理'
    case 'processing':
      return '发货'
    case 'shipped':
      return '签收'
    case 'delivered':
      return '退款'
    default:
      return ''
  }
}

function actionBtnStyle(status: OrderStatus): CSSProperties {
  const isCancel = status === 'cancelled' || status === 'refunded'
  return {
    padding: '4px 10px',
    borderRadius: 6,
    border: `1px solid ${isCancel ? 'rgba(248, 113, 113, 0.4)' : 'rgba(96, 165, 250, 0.4)'}`,
    background: isCancel ? 'rgba(127, 29, 29, 0.15)' : 'rgba(29, 78, 216, 0.12)',
    color: isCancel ? '#fecaca' : '#93c5fd',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  }
}

function buildColumns(onRowClick: (item: OrderItem) => void): DataTableColumn<OrderItem>[] {
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
            onClick={(event) => {
              event.stopPropagation()
              onRowClick(item)
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
        const channel = ORDER_CHANNEL_MAP[item.channel]
        return <StatusBadge label={channel.label} variant={channel.variant} size="sm" />
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: OrderItem) => item.status,
      render: (item: OrderItem) => {
        const status = ORDER_STATUS_MAP[item.status]
        return <StatusBadge label={status.label} variant={status.variant} size="sm" dot />
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
          <span
            style={{
              fontWeight: 600,
              color: amountColor(item.totalAmount),
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatAmount(item.totalAmount)}
          </span>
          {item.discountAmount > 0 && (
            <div style={{ fontSize: 11, color: '#64748b' }}>优惠 {formatAmount(item.discountAmount)}</div>
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
        const nextStatuses = ORDER_STATUS_FLOW[item.status]
        if (nextStatuses.length === 0) {
          return <span style={{ color: '#64748b', fontSize: 12 }}>—</span>
        }
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {nextStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onRowClick(item)
                }}
                style={actionBtnStyle(nextStatus)}
              >
                {nextStatusLabel(item.status) || ORDER_STATUS_MAP[nextStatus].label}
              </button>
            ))}
          </div>
        )
      },
    },
  ]
}

const statCardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

export default function OrdersClient({
  snapshot,
}: {
  snapshot: OrdersSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const orders = snapshot.orders
  const searchFields = useMemo<(keyof OrderItem)[]>(
    () => ['orderNo', 'customerName', 'customerPhone', 'storeName', 'salesClerk'],
    []
  )
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(orders, searchFields)

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter]
  )

  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'ALL'>('ALL')
  const channelFiltered = useMemo(
    () =>
      channelFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.channel === channelFilter),
    [statusFiltered, channelFilter]
  )

  const [marketFilter, setMarketFilter] = useState<string>('ALL')
  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? channelFiltered
        : channelFiltered.filter((item) => item.marketCode === marketFilter),
    [channelFiltered, marketFilter]
  )

  type AmountRange = 'ALL' | 'under100' | '100to300' | 'over300'
  const [amountFilter, setAmountFilter] = useState<AmountRange>('ALL')
  const amountFiltered = useMemo(() => {
    if (amountFilter === 'ALL') {
      return marketFiltered
    }
    if (amountFilter === 'under100') {
      return marketFiltered.filter((item) => item.totalAmount < 100)
    }
    if (amountFilter === '100to300') {
      return marketFiltered.filter((item) => item.totalAmount >= 100 && item.totalAmount <= 300)
    }
    return marketFiltered.filter((item) => item.totalAmount > 300)
  }, [marketFiltered, amountFilter])

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null)
  const handleRowClick = useCallback(
    (item: OrderItem) => {
      router.push(`/orders/${item.id}`)
    },
    [router]
  )

  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick])
  const sortedItems = useSortedItems(amountFiltered, columns, sortConfig)

  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  })
  useEffect(() => {
    pagination.resetPage()
  }, [searchTerm, statusFilter, channelFilter, marketFilter, amountFilter, pagination])
  const pageItems = pagination.paginate(sortedItems)

  const allMarkets = useMemo(() => [...new Set(orders.map((order) => order.marketCode))].sort(), [orders])
  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === 'pending' || order.status === 'confirmed').length,
      processing: orders.filter((order) => order.status === 'processing' || order.status === 'shipped').length,
      completed: orders.filter((order) => order.status === 'delivered').length,
      cancelled: orders.filter((order) => order.status === 'cancelled' || order.status === 'refunded').length,
      totalRevenue: orders
        .filter((order) => order.status === 'delivered')
        .reduce((sum, order) => sum + order.paidAmount, 0),
      avgOrderValue:
        orders.length > 0
          ? (orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length).toFixed(0)
          : '0',
    }),
    [orders]
  )

  const chips = [
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
            count: statusFiltered.filter((item) => item.status === statusFilter).length,
          },
        ]
      : []),
    ...(channelFilter !== 'ALL'
      ? [
          {
            key: 'channel' as const,
            label: ORDER_CHANNEL_MAP[channelFilter].label,
            tone: 'neutral' as FilterChip['tone'],
            count: statusFiltered.filter((item) => item.channel === channelFilter).length,
          },
        ]
      : []),
    ...(marketFilter !== 'ALL'
      ? [
          {
            key: 'market' as const,
            label: marketFilter,
            tone: 'neutral' as FilterChip['tone'],
            count: channelFiltered.filter((item) => item.marketCode === marketFilter).length,
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
              if (amountFilter === 'under100') return item.totalAmount < 100
              if (amountFilter === '100to300') return item.totalAmount >= 100 && item.totalAmount <= 300
              return item.totalAmount > 300
            }).length,
          },
        ]
      : []),
  ]

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="订单管理中心"
        subtitle={`统一管理全渠道订单，当前交付模式 ${snapshot.deliveryMode}，支持服务端快照刷新。`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>最新快照时间 {snapshot.generatedAt}</div>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(148, 163, 184, 0.28)',
              background: 'rgba(15, 23, 42, 0.38)',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>

        {snapshot.error && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: '1px solid rgba(250, 204, 21, 0.35)',
              background: 'rgba(113, 63, 18, 0.16)',
              color: '#fde68a',
              padding: 14,
              fontSize: 13,
            }}
          >
            {snapshot.error}
          </div>
        )}

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
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>覆盖 {allMarkets.length} 个市场</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>待处理</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{stats.pending}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>待确认 & 已确认</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>处理中</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{stats.processing}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>处理中 & 配送中</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>已完成</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{stats.completed}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>已签收</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>已取消/退款</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>{stats.cancelled}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>取消 & 退款</div>
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
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>已完成收入 ¥{stats.totalRevenue.toFixed(0)}</div>
          </article>
        </div>

        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索订单号 / 客户姓名 / 手机号 / 门店 / 导购..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: orders.length },
              ...ORDER_STATUSES.map((status) => ({
                key: status,
                label: ORDER_STATUS_MAP[status].label,
                count: orders.filter((item) => item.status === status).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as OrderStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

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
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>渠道</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...ORDER_CHANNELS.map((channel) => ({
                  key: channel,
                  label: ORDER_CHANNEL_MAP[channel].label,
                  count: statusFiltered.filter((item) => item.channel === channel).length,
                })),
              ]}
              activeKey={channelFilter}
              onChange={(key) => setChannelFilter(key as OrderChannel | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>市场</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: channelFiltered.length },
                ...allMarkets.map((market) => ({
                  key: market,
                  label: market,
                  count: channelFiltered.filter((item) => item.marketCode === market).length,
                })),
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>金额</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                {
                  key: 'under100',
                  label: '¥100以下',
                  count: marketFiltered.filter((item) => item.totalAmount < 100).length,
                },
                {
                  key: '100to300',
                  label: '¥100-300',
                  count: marketFiltered.filter((item) => item.totalAmount >= 100 && item.totalAmount <= 300).length,
                },
                {
                  key: 'over300',
                  label: '¥300以上',
                  count: marketFiltered.filter((item) => item.totalAmount > 300).length,
                },
              ]}
              activeKey={amountFilter}
              onChange={(key) => setAmountFilter(key as AmountRange)}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        <FilterChips
          hint="已筛选："
          chips={chips}
          onRemove={(key) => {
            switch (key) {
              case 'status':
                setStatusFilter('ALL')
                break
              case 'channel':
                setChannelFilter('ALL')
                break
              case 'market':
                setMarketFilter('ALL')
                break
              case 'amount':
                setAmountFilter('ALL')
                break
            }
            pagination.resetPage()
          }}
          onClearAll={() => {
            setStatusFilter('ALL')
            setChannelFilter('ALL')
            setMarketFilter('ALL')
            setAmountFilter('ALL')
            pagination.resetPage()
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

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

        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </PageShell>
    </main>
  )
}
