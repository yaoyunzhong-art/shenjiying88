'use client'

import { useMemo, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  DataTable,
  EmptyState,
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
} from '@m5/ui'
import {
  BRAND_STATUSES,
  BRAND_STATUS_MAP,
  BRAND_TIERS,
  BRAND_TIER_MAP,
  computeBrandStats,
  getBrandUniqueMarkets,
  type BrandItem,
  type BrandStatus,
  type BrandTier,
  type BrandsSnapshotDelivery,
} from './brands-data'

function marketLabel(marketCode: string): string {
  const map: Record<string, string> = {
    'cn-mainland': '中国大陆',
    'us-default': '美国',
    'uk-default': '英国',
  }
  return map[marketCode] ?? marketCode
}

const statCardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
}

export default function BrandsClient({
  snapshot,
}: {
  snapshot: BrandsSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<BrandStatus | 'ALL'>('ALL')
  const [tierFilter, setTierFilter] = useState<BrandTier | 'ALL'>('ALL')
  const [marketFilter, setMarketFilter] = useState<string>('ALL')
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null)
  const brands = snapshot.brands
  const stats = useMemo(() => computeBrandStats(brands), [brands])
  const markets = useMemo(() => getBrandUniqueMarkets(brands), [brands])
  const searchFields = useMemo<(keyof BrandItem)[]>(
    () => ['code', 'name', 'marketCode', 'category'],
    []
  )
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(brands, searchFields)

  const statusFiltered = useMemo(() => {
    if (statusFilter === 'ALL') return filteredItems
    return filteredItems.filter((brand) => brand.status === statusFilter)
  }, [filteredItems, statusFilter])

  const tierFiltered = useMemo(() => {
    if (tierFilter === 'ALL') return statusFiltered
    return statusFiltered.filter((brand) => brand.tier === tierFilter)
  }, [statusFiltered, tierFilter])

  const marketFiltered = useMemo(() => {
    if (marketFilter === 'ALL') return tierFiltered
    return tierFiltered.filter((brand) => brand.marketCode === marketFilter)
  }, [marketFilter, tierFiltered])

  const columns = useMemo<DataTableColumn<BrandItem>[]>(
    () => [
      {
        key: 'name',
        title: '品牌名称',
        dataKey: 'name',
        sortable: true,
        render: (brand) => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{brand.name}</span>,
      },
      {
        key: 'code',
        title: '品牌编码',
        dataKey: 'code',
        sortable: true,
      },
      {
        key: 'marketCode',
        title: '市场',
        sortable: true,
        sortValue: (brand) => brand.marketCode,
        render: (brand) => marketLabel(brand.marketCode),
      },
      {
        key: 'category',
        title: '业态',
        dataKey: 'category',
        sortable: true,
      },
      {
        key: 'status',
        title: '状态',
        sortable: true,
        sortValue: (brand) => brand.status,
        render: (brand) => (
          <StatusBadge
            label={BRAND_STATUS_MAP[brand.status].label}
            variant={BRAND_STATUS_MAP[brand.status].variant}
            size="sm"
            dot
          />
        ),
      },
      {
        key: 'tier',
        title: '等级',
        sortable: true,
        sortValue: (brand) => brand.tier,
        render: (brand) => (
          <StatusBadge
            label={BRAND_TIER_MAP[brand.tier].label}
            variant={BRAND_TIER_MAP[brand.tier].variant}
            size="sm"
          />
        ),
      },
      {
        key: 'storeCount',
        title: '门店数',
        dataKey: 'storeCount',
        sortable: true,
        align: 'right',
      },
      {
        key: 'tenantCount',
        title: '租户数',
        dataKey: 'tenantCount',
        sortable: true,
        align: 'right',
      },
      {
        key: 'lastDeployed',
        title: '快照时间',
        dataKey: 'lastDeployed',
        sortable: true,
      },
    ],
    []
  )

  const sortedItems = useSortedItems(marketFiltered, columns, sortConfig)
  const pagination = usePagination({ initialPageSize: 10 })
  const pageItems = pagination.paginate(sortedItems)
  const hasNoResults = sortedItems.length === 0

  return (
    <PageShell
      title="品牌管理中心"
      subtitle={`${stats.total} 个品牌 · ${stats.totalStores} 家门店 · ${stats.totalTenants} 个租户`}
    >
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>品牌总数</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#22c55e' }}>运营中</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{stats.active}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#eab308' }}>待激活</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#eab308' }}>{stats.pending}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#60a5fa' }}>旗舰品牌</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#60a5fa' }}>{stats.premium}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索品牌名称/编码/市场/业态..."
          width={360}
        />
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          style={refreshButtonStyle}
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>品牌状态</div>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: filteredItems.length },
              ...BRAND_STATUSES.map((status) => ({
                key: status,
                label: BRAND_STATUS_MAP[status].label,
                count: filteredItems.filter((brand) => brand.status === status).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key: string) => setStatusFilter(key as BrandStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>品牌等级</div>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: statusFiltered.length },
              ...BRAND_TIERS.map((tier) => ({
                key: tier,
                label: BRAND_TIER_MAP[tier].label,
                count: statusFiltered.filter((brand) => brand.tier === tier).length,
              })),
            ]}
            activeKey={tierFilter}
            onChange={(key: string) => setTierFilter(key as BrandTier | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>市场分布</div>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: tierFiltered.length },
              ...markets.map((marketCode) => ({
                key: marketCode,
                label: marketLabel(marketCode),
                count: tierFiltered.filter((brand) => brand.marketCode === marketCode).length,
              })),
            ]}
            activeKey={marketFilter}
            onChange={setMarketFilter}
            variant="pills"
            size="sm"
          />
        </div>
      </div>

      {hasNoResults ? (
        <EmptyState
          title="未找到匹配品牌"
          description="请调整关键词、状态、等级或市场筛选条件后重试。"
        />
      ) : (
        <>
          <DataTable
            title={`品牌列表 (${sortedItems.length})`}
            columns={columns}
            items={pageItems}
            rowKey={(brand) => brand.id}
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
  )
}

const refreshButtonStyle: CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.4)',
  color: '#e2e8f0',
  fontSize: 13,
  cursor: 'pointer',
  outline: 'none',
}
