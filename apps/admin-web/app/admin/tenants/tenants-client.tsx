'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
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
  TENANT_BILLING_MAP,
  TENANT_LIST_PRESET,
  TENANT_PLAN_MAP,
  TENANT_STATUS_MAP,
  computeTenantStats,
  type TenantBillingMode,
  type TenantItem,
  type TenantPlan,
  type TenantsSnapshotDelivery,
  type TenantStatus,
} from '../../tenants-data'

function buildColumns(): DataTableColumn<TenantItem>[] {
  return [
    {
      key: 'code',
      title: '租户编码',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '租户名称',
      dataKey: 'name',
      sortable: true,
    },
    {
      key: 'plan',
      title: '套餐',
      sortable: true,
      sortValue: (tenant: TenantItem) => tenant.plan,
      render: (tenant: TenantItem) => {
        const plan = TENANT_PLAN_MAP[tenant.plan]
        return <StatusBadge label={plan.label} variant={plan.variant} size="sm" />
      },
    },
    {
      key: 'marketCode',
      title: '所属市场',
      dataKey: 'marketCode',
      sortable: true,
    },
    {
      key: 'status',
      title: '运营状态',
      sortable: true,
      sortValue: (tenant: TenantItem) => tenant.status,
      render: (tenant: TenantItem) => {
        const status = TENANT_STATUS_MAP[tenant.status]
        return <StatusBadge label={status.label} variant={status.variant} size="sm" dot />
      },
    },
    {
      key: 'storeCount',
      title: '门店数',
      dataKey: 'storeCount',
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
      key: 'adminCount',
      title: '管理员数',
      dataKey: 'adminCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'billingMode',
      title: '计费方式',
      sortable: true,
      sortValue: (tenant: TenantItem) => tenant.billingMode,
      render: (tenant: TenantItem) => TENANT_BILLING_MAP[tenant.billingMode],
    },
    {
      key: 'lastDeployed',
      title: '最后部署',
      dataKey: 'lastDeployed',
      sortable: true,
    },
  ]
}

const cardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

export default function TenantsClient({
  snapshot,
}: {
  snapshot: TenantsSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const tenants = snapshot.tenants
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    tenants,
    TENANT_LIST_PRESET.searchFields
  )

  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'ALL'>('ALL')
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((tenant) => tenant.status === statusFilter),
    [filteredItems, statusFilter]
  )

  const [planFilter, setPlanFilter] = useState<TenantPlan | 'ALL'>('ALL')
  const planFiltered = useMemo(
    () =>
      planFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((tenant) => tenant.plan === planFilter),
    [statusFiltered, planFilter]
  )

  const [billingFilter, setBillingFilter] = useState<TenantBillingMode | 'ALL'>('ALL')
  const billingFiltered = useMemo(
    () =>
      billingFilter === 'ALL'
        ? planFiltered
        : planFiltered.filter((tenant) => tenant.billingMode === billingFilter),
    [planFiltered, billingFilter]
  )

  const [marketFilter, setMarketFilter] = useState<string>('ALL')
  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? billingFiltered
        : billingFiltered.filter((tenant) => tenant.marketCode === marketFilter),
    [billingFiltered, marketFilter]
  )

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null)
  const columns = useMemo(() => buildColumns(), [])
  const sortedItems = useSortedItems(marketFiltered, columns, sortConfig)

  const pagination = usePagination({
    initialPageSize: TENANT_LIST_PRESET.defaultPageSize,
    pageSizeOptions: [...TENANT_LIST_PRESET.pageSizeOptions],
  })
  const pageItems = pagination.paginate(sortedItems)

  const stats = useMemo(() => computeTenantStats(tenants), [tenants])
  const markets = useMemo(() => [...new Set(tenants.map((tenant) => tenant.marketCode))].sort(), [tenants])

  const chips = [
    ...(statusFilter !== 'ALL'
      ? [
          {
            key: 'status' as const,
            label: TENANT_STATUS_MAP[statusFilter].label,
            tone: (TENANT_STATUS_MAP[statusFilter].variant === 'success'
              ? 'success'
              : TENANT_STATUS_MAP[statusFilter].variant === 'warning'
                ? 'warning'
                : TENANT_STATUS_MAP[statusFilter].variant === 'danger'
                  ? 'danger'
                  : 'neutral') as FilterChip['tone'],
            count: statusFiltered.filter((tenant) => tenant.status === statusFilter).length,
          },
        ]
      : []),
    ...(planFilter !== 'ALL'
      ? [
          {
            key: 'plan' as const,
            label: TENANT_PLAN_MAP[planFilter].label,
            tone: 'neutral' as FilterChip['tone'],
            count: statusFiltered.filter((tenant) => tenant.plan === planFilter).length,
          },
        ]
      : []),
    ...(billingFilter !== 'ALL'
      ? [
          {
            key: 'billing' as const,
            label: TENANT_BILLING_MAP[billingFilter],
            tone: 'neutral' as FilterChip['tone'],
            count: planFiltered.filter((tenant) => tenant.billingMode === billingFilter).length,
          },
        ]
      : []),
    ...(marketFilter !== 'ALL'
      ? [
          {
            key: 'market' as const,
            label: marketFilter,
            tone: 'neutral' as FilterChip['tone'],
            count: billingFiltered.filter((tenant) => tenant.marketCode === marketFilter).length,
          },
        ]
      : []),
  ]

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="租户管理中心"
        subtitle={`当前交付模式 ${snapshot.deliveryMode}，面向控制面租户清单、套餐和市场分布的服务端快照视图。`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>最新快照时间 {snapshot.generatedAt}</div>
          <button
            type="button"
            onClick={() => handleRefresh()}
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
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <article style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>租户总数</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>跨 {stats.markets} 个市场</div>
          </article>
          <article style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>运营中</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#4ade80' }}>{stats.active}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>可读可写租户占比核心盘面</div>
          </article>
          <article style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>企业版</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#60a5fa' }}>{stats.enterprise}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>高配套餐租户数</div>
          </article>
          <article style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>月付租户</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>
              {tenants.filter((tenant) => tenant.billingMode === 'monthly').length}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>便于识别续费与风险波动</div>
          </article>
        </div>

        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索租户编码 / 名称 / 市场..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部状态', count: tenants.length },
              ...TENANT_LIST_PRESET.statuses.map((status) => ({
                key: status,
                label: TENANT_STATUS_MAP[status].label,
                count: tenants.filter((tenant) => tenant.status === status).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as TenantStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>套餐</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...TENANT_LIST_PRESET.plans.map((plan) => ({
                  key: plan,
                  label: TENANT_PLAN_MAP[plan].label,
                  count: statusFiltered.filter((tenant) => tenant.plan === plan).length,
                })),
              ]}
              activeKey={planFilter}
              onChange={(key) => setPlanFilter(key as TenantPlan | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>计费</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: planFiltered.length },
                ...TENANT_LIST_PRESET.billingModes.map((billingMode) => ({
                  key: billingMode,
                  label: TENANT_BILLING_MAP[billingMode],
                  count: planFiltered.filter((tenant) => tenant.billingMode === billingMode).length,
                })),
              ]}
              activeKey={billingFilter}
              onChange={(key) => setBillingFilter(key as TenantBillingMode | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>市场</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: billingFiltered.length },
                ...markets.map((market) => ({
                  key: market,
                  label: market,
                  count: billingFiltered.filter((tenant) => tenant.marketCode === market).length,
                })),
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
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
              case 'plan':
                setPlanFilter('ALL')
                break
              case 'billing':
                setBillingFilter('ALL')
                break
              case 'market':
                setMarketFilter('ALL')
                break
            }
            pagination.resetPage()
          }}
          onClearAll={() => {
            setStatusFilter('ALL')
            setPlanFilter('ALL')
            setBillingFilter('ALL')
            setMarketFilter('ALL')
            pagination.resetPage()
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        <DataTable
          title={`租户列表（匹配 ${sortedItems.length} 条）`}
          columns={columns}
          items={pageItems}
          rowKey={(tenant) => tenant.id}
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
