'use client'

import { useMemo, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  DataTable,
  DetailActionBar,
  FilterChips,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
  type FilterChip,
} from '@m5/ui'
import { useDetailActions } from '../components/use-detail-actions'
import {
  COUPON_STATUS_MAP,
  COUPON_TYPE_MAP,
  computeCouponTemplateStats,
  type CouponStatus,
  type CouponTemplateItem,
  type CouponTemplatesSnapshotDelivery,
} from './coupon-templates-data'

function buildColumns(onRowClick: (item: CouponTemplateItem) => void): DataTableColumn<CouponTemplateItem>[] {
  return [
    {
      key: 'name',
      title: '模板名称',
      dataKey: 'name',
      sortable: true,
      render: (item) => (
        <button
          type="button"
          onClick={() => onRowClick(item)}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0 }}
        >
          {item.name}
        </button>
      ),
    },
    {
      key: 'faceValue',
      title: '面值',
      sortable: true,
      align: 'right',
      render: (item) => (item.type === 'discount' ? `${(item.faceValue / 10).toFixed(0)}折` : `¥${item.faceValue}`),
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      sortValue: (item) => item.type,
      render: (item) => <StatusBadge label={COUPON_TYPE_MAP[item.type].label} variant="neutral" size="sm" />,
    },
    {
      key: 'minSpend',
      title: '最低消费',
      dataKey: 'minSpend',
      sortable: true,
      align: 'right',
      render: (item) => (item.minSpend === 0 ? '无门槛' : `¥${item.minSpend}`),
    },
    {
      key: 'validPeriod',
      title: '有效期',
      render: (item) => `${item.validFrom} ~ ${item.validTo}`,
    },
    {
      key: 'totalIssued',
      title: '发放量',
      dataKey: 'totalIssued',
      sortable: true,
      align: 'right',
    },
    {
      key: 'usedCount',
      title: '已使用',
      dataKey: 'usedCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'usageRate',
      title: '使用率',
      sortable: true,
      sortValue: (item) => (item.totalIssued > 0 ? item.usedCount / item.totalIssued : 0),
      render: (item) => {
        const rate = item.totalIssued > 0 ? item.usedCount / item.totalIssued : 0
        const pct = (rate * 100).toFixed(1)
        const barColor = rate >= 0.7 ? '#4ade80' : rate >= 0.3 ? '#facc15' : '#f87171'
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: barColor }} />
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 40, textAlign: 'right' }}>{pct}%</span>
          </div>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item) => item.status,
      render: (item) => {
        const statusMeta = COUPON_STATUS_MAP[item.status]
        return <StatusBadge label={statusMeta.label} variant={statusMeta.variant} size="sm" dot />
      },
    },
  ]
}

function EmptyCouponSVG() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="120" height="80" rx="8" stroke="#475569" strokeWidth="2" fill="rgba(71,85,105,0.1)" />
      <rect x="35" y="35" width="50" height="8" rx="4" fill="#475569" opacity="0.4" />
      <rect x="35" y="50" width="70" height="6" rx="3" fill="#475569" opacity="0.25" />
      <rect x="35" y="62" width="40" height="6" rx="3" fill="#475569" opacity="0.25" />
      <circle cx="110" cy="45" r="15" stroke="#475569" strokeWidth="2" fill="rgba(71,85,105,0.05)" />
      <path d="M105 45h10M110 40v10" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M95 80l30 10M95 85l30 10" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

const statCardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

export default function CouponTemplatesClient({
  snapshot,
}: {
  snapshot: CouponTemplatesSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [tabFilter, setTabFilter] = useState<CouponStatus | 'ALL'>('active')
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null)
  const templates = snapshot.templates
  const stats = useMemo(() => computeCouponTemplateStats(templates), [templates])

  const searchFiltered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return templates
    return templates.filter((item) => [item.name, item.id, item.type].join(' ').toLowerCase().includes(keyword))
  }, [searchTerm, templates])

  const tabFiltered = useMemo(() => {
    if (tabFilter === 'ALL') return searchFiltered
    return searchFiltered.filter((item) => item.status === tabFilter)
  }, [searchFiltered, tabFilter])

  const columns = useMemo(
    () => buildColumns((item) => router.push(`/coupon-templates/${item.id}`)),
    [router]
  )
  const sortedItems = useSortedItems(tabFiltered, columns, sortConfig)
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] })
  const pageItems = pagination.paginate(sortedItems)
  const hasNoData = templates.length === 0

  const { actions } = useDetailActions({
    workspace: 'coupon-templates',
    detailId: 'overview',
    record: { items: sortedItems, tabFilter, stats },
    shareTitle: '优惠券模板管理',
    shareText: '查看优惠券模板 / 使用率 / 状态筛选结果',
  })

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell title="优惠券模板管理" subtitle="统一管理优惠券模板，支持发放跟踪、使用率监控与状态筛选。">
        {!hasNoData && (
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
            <article style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>模板总数</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>生效中</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{stats.active}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% 生效占比</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>总发放</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{stats.totalIssued.toLocaleString()}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>总使用</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#c084fc' }}>{stats.totalUsed.toLocaleString()}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{stats.totalIssued > 0 ? ((stats.totalUsed / stats.totalIssued) * 100).toFixed(1) : 0}% 整体使用率</div>
            </article>
          </div>
        )}

        <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索模板名称 / ID / 类型..." />
          </div>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.38)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'active', label: '生效中', count: templates.filter((item) => item.status === 'active').length },
              { key: 'expired', label: '已过期', count: templates.filter((item) => item.status === 'expired').length },
              { key: 'ALL', label: '全部', count: templates.length },
            ]}
            activeKey={tabFilter}
            onChange={(key) => setTabFilter(key as CouponStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <FilterChips
          hint="已筛选："
          chips={
            tabFilter !== 'ALL'
              ? [
                  {
                    key: 'tab',
                    label: COUPON_STATUS_MAP[tabFilter].label,
                    tone: COUPON_STATUS_MAP[tabFilter].variant as FilterChip['tone'],
                    count: searchFiltered.filter((item) => item.status === tabFilter).length,
                  },
                ]
              : []
          }
          onRemove={() => setTabFilter('ALL')}
          onClearAll={() => setTabFilter('ALL')}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {hasNoData ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 16 }}>
            <EmptyCouponSVG />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1' }}>暂无优惠券模板</div>
            <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', maxWidth: 360 }}>
              当前快照中尚未沉淀模板记录，可在后续替换真实上游后接入创建流程。
            </div>
            <button
              type="button"
              onClick={() => router.push('/coupon-templates/new')}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, cursor: 'pointer' }}
            >
              创建优惠券模板
            </button>
          </div>
        ) : (
          <>
            <DataTable
              title={`优惠券模板列表（匹配 ${sortedItems.length} 条）`}
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

        <DetailActionBar
          actions={actions}
          heading="工作台收口动作"
          caption="复制 / 导出 / 分享当前优惠券模板管理筛选快照"
        />
      </PageShell>
    </main>
  )
}
