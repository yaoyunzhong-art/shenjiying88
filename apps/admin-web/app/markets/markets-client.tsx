'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  DataTable,
  EmptyState,
  FilterChips,
  PageShell,
  Pagination,
  QuickStats,
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
import type {
  MarketItem,
  MarketsSnapshotDelivery,
  MarketStatus,
  MarketRegion,
} from '../markets-data'
import {
  MARKET_LIST_SEARCH_FIELDS,
  MARKET_REGION_MAP,
  MARKET_STATUS_MAP,
} from '../markets-data'

function buildColumns(onRowClick: (item: MarketItem) => void): DataTableColumn<MarketItem>[] {
  return [
    {
      key: 'code',
      title: '市场编码',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '市场名称',
      dataKey: 'name',
      sortable: true,
      render: (item: MarketItem) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRowClick(item)
          }}
          style={{
            color: '#93c5fd',
            cursor: 'pointer',
            textDecoration: 'underline',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
        >
          {item.name}
        </button>
      ),
    },
    {
      key: 'region',
      title: '区域',
      sortable: true,
      render: (item: MarketItem) => {
        const region = MARKET_REGION_MAP[item.region]
        return <StatusBadge label={region.label} variant={region.variant} size="sm" />
      },
    },
    {
      key: 'locale',
      title: '语言',
      dataKey: 'locale',
      sortable: true,
    },
    {
      key: 'currency',
      title: '货币',
      dataKey: 'currency',
      sortable: true,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: MarketItem) => item.status,
      render: (item: MarketItem) => {
        const status = MARKET_STATUS_MAP[item.status]
        return <StatusBadge label={status.label} variant={status.variant} size="sm" dot />
      },
    },
    {
      key: 'tenantCount',
      title: '租户数',
      dataKey: 'tenantCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'brandCount',
      title: '品牌数',
      dataKey: 'brandCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'storeCount',
      title: '门店数',
      dataKey: 'storeCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'lastDeployed',
      title: '最后部署',
      dataKey: 'lastDeployed',
      sortable: true,
    },
  ]
}

export default function MarketsClient({
  snapshot,
}: {
  snapshot: MarketsSnapshotDelivery
}) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [statusFilter, setStatusFilter] = useState<MarketStatus | 'ALL'>('ALL')
  const [regionFilter, setRegionFilter] = useState<MarketRegion | 'ALL'>('ALL')
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null)
  const markets = snapshot.markets

  const searchFields = useMemo<(keyof MarketItem)[]>(
    () => MARKET_LIST_SEARCH_FIELDS,
    []
  )
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(markets, searchFields)

  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter]
  )

  const regionFiltered = useMemo(
    () =>
      regionFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.region === regionFilter),
    [statusFiltered, regionFilter]
  )

  const handleRowClick = useCallback(
    (item: MarketItem) => {
      router.push(`/markets/${item.id}`)
    },
    [router]
  )

  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick])
  const sortedItems = useSortedItems(regionFiltered, columns, sortConfig)
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] })
  const pageItems = pagination.paginate(sortedItems)

  const stats = useMemo(
    () => ({
      total: markets.length,
      active: markets.filter((market) => market.status === 'active').length,
      regionCount: new Set(markets.map((market) => market.region)).size,
      deployed: markets.reduce(
        (sum, market) => sum + market.tenantCount + market.brandCount + market.storeCount,
        0
      ),
    }),
    [markets]
  )

  const regionTabItems = useMemo(() => {
    const entries = Object.entries(MARKET_REGION_MAP) as Array<
      [MarketRegion, { label: string; variant: string }]
    >
    return [
      { key: 'ALL' as const, label: '全部', count: statusFiltered.length },
      ...entries.map(([key, info]) => ({
        key,
        label: info.label,
        count: statusFiltered.filter((item) => item.region === key).length,
      })),
    ]
  }, [statusFiltered])

  const chips = useMemo<FilterChip[]>(
    () => [
      ...(statusFilter !== 'ALL'
        ? [
            {
              key: 'status',
              label: MARKET_STATUS_MAP[statusFilter].label,
              tone: (MARKET_STATUS_MAP[statusFilter].variant === 'success'
                  ? 'success'
                  : MARKET_STATUS_MAP[statusFilter].variant === 'warning'
                    ? 'warning'
                    : 'neutral') as 'warning' | 'success' | 'danger' | 'neutral',
              count: filteredItems.filter((item) => item.status === statusFilter).length,
            },
          ]
        : []),
      ...(regionFilter !== 'ALL'
        ? [
            {
              key: 'region',
              label: MARKET_REGION_MAP[regionFilter].label,
              tone: (MARKET_REGION_MAP[regionFilter].variant === 'success'
                  ? 'success'
                  : MARKET_REGION_MAP[regionFilter].variant === 'danger'
                    ? 'danger'
                    : 'neutral') as 'warning' | 'success' | 'danger' | 'neutral',
              count: statusFiltered.filter((item) => item.region === regionFilter).length,
            },
          ]
        : []),
    ],
    [filteredItems, regionFilter, statusFiltered, statusFilter]
  )

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="市场管理中心"
        subtitle="统一管理全球市场配置，包括语言、货币、时区和区域覆盖。支持多区域扩展与本地化部署。"
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleRefresh()}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
        </div>

        {snapshot.error && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.28)',
              color: '#92400e',
              fontSize: 12,
            }}
          >
            {snapshot.error}
          </div>
        )}

        <QuickStats
          items={[
            { label: '市场总数', value: stats.total, helper: `${stats.regionCount} 个区域` },
            {
              label: '运营中',
              value: stats.active,
              valueColor: '#4ade80',
              helper: stats.total === 0 ? '0% 激活率' : `${((stats.active / stats.total) * 100).toFixed(0)}% 激活率`,
            },
            {
              label: '待激活',
              value: stats.total - stats.active,
              valueColor: '#fbbf24',
              helper: '可扩展市场',
            },
            {
              label: '已部署资源',
              value: stats.deployed,
              valueColor: '#93c5fd',
              helper: '租户 + 品牌 + 门店',
            },
          ]}
        />

        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索市场编码 / 名称 / 区域 / 货币..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: markets.length },
              ...(['active', 'pending', 'inactive'] as const).map((status) => ({
                key: status,
                label: MARKET_STATUS_MAP[status].label,
                count: markets.filter((item) => item.status === status).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as MarketStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>区域筛选</div>
          <Tabs
            items={regionTabItems}
            activeKey={regionFilter}
            onChange={(key) => setRegionFilter(key as MarketRegion | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <FilterChips
          hint="已筛选："
          chips={chips}
          onRemove={(key) => {
            if (key === 'status') {
              setStatusFilter('ALL')
            }
            if (key === 'region') {
              setRegionFilter('ALL')
            }
          }}
          onClearAll={() => {
            setStatusFilter('ALL')
            setRegionFilter('ALL')
          }}
          size="sm"
          style={{ marginBottom: 12 }}
        />

        {sortedItems.length === 0 ? (
          <EmptyState
            title="暂无市场数据"
            description="当前筛选条件下没有可显示的市场记录，请调整筛选条件或稍后刷新。"
          />
        ) : (
          <>
            <DataTable
              title={`市场列表（匹配 ${sortedItems.length} 条）`}
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
          </>
        )}
      </PageShell>
    </main>
  )
}
