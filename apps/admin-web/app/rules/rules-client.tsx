'use client'

import { useEffect, useMemo, useState, useTransition, type CSSProperties } from 'react'
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
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
  type FilterChip,
} from '@m5/ui'
import {
  CATEGORY_BG_COLORS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_LIST,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  STATUS_LIST,
  computeRuleCategoryStats,
  computeRulesStats,
  filterRules,
  type RuleCategory,
  type RuleItem,
  type RulesSnapshotDelivery,
  type RuleStatus,
} from './rules-data'

const statCardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

export default function RulesClient({
  snapshot,
}: {
  snapshot: RulesSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RuleStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | 'ALL'>('ALL')
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null)
  const rules = snapshot.rules

  const filteredItems = useMemo(
    () => filterRules(rules, searchTerm, statusFilter, categoryFilter),
    [rules, searchTerm, statusFilter, categoryFilter]
  )

  const columns = useMemo<DataTableColumn<RuleItem>[]>(
    () => [
      {
        key: 'name',
        title: '规则名称',
        sortable: true,
        render: (item) => (
          <button
            type="button"
            onClick={() => router.push(`/rules/${item.id}`)}
            style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {item.name}
          </button>
        ),
      },
      {
        key: 'category',
        title: '分类',
        sortable: true,
        render: (item) => (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: CATEGORY_COLORS[item.category],
              background: CATEGORY_BG_COLORS[item.category],
            }}
          >
            {CATEGORY_LABELS[item.category]}
          </span>
        ),
      },
      {
        key: 'status',
        title: '状态',
        sortable: true,
        render: (item) => <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_BADGE_VARIANT[item.status]} />,
      },
      {
        key: 'priority',
        title: '优先级',
        sortable: true,
        render: (item) => <span style={{ color: PRIORITY_COLORS[item.priority], fontWeight: 600 }}>{PRIORITY_LABELS[item.priority]}</span>,
      },
      {
        key: 'triggerCount',
        title: '触发次数',
        sortable: true,
        align: 'right',
        render: (item) => item.triggerCount.toLocaleString(),
      },
      {
        key: 'successRate',
        title: '成功率',
        sortable: true,
        align: 'right',
        render: (item) => `${item.successRate}%`,
      },
      {
        key: 'lastTriggered',
        title: '最近触发',
        sortable: true,
        render: (item) => new Date(item.lastTriggered).toLocaleString('zh-CN'),
      },
    ],
    [router]
  )

  const sortedItems = useSortedItems(filteredItems, columns, sortConfig)
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] })

  useEffect(() => {
    pagination.resetPage()
  }, [searchTerm, statusFilter, categoryFilter, pagination])

  const pageItems = pagination.paginate(sortedItems)
  const stats = useMemo(() => computeRulesStats(rules), [rules])
  const categoryStats = useMemo(() => computeRuleCategoryStats(rules), [rules])

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell title="规则管理" subtitle={`共 ${stats.total} 条规则 · ${stats.enabled} 条启用 · ${stats.critical} 条严重优先级`}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>规则总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>已启用</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{stats.enabled}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {stats.total > 0 ? ((stats.enabled / stats.total) * 100).toFixed(0) : 0}% 启用率
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>严重优先级</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>{stats.critical}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>需重点关注</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>低成功率 (&lt;85%)</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{stats.lowSuccess}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>需优化</div>
          </article>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.28)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>分类分布</span>
          <div style={{ flex: 1, display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden' }}>
            {categoryStats.entries.map((entry) => (
              <div
                key={entry.category}
                style={{
                  width: `${stats.total > 0 ? (entry.count / stats.total) * 100 : 0}%`,
                  background: entry.color,
                  minWidth: entry.count > 0 ? 2 : 0,
                }}
                title={`${entry.label}: ${entry.count}条`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {categoryStats.entries.map((entry) => (
              <span
                key={entry.category}
                style={{ fontSize: 11, color: '#cbd5e1', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: entry.color }} />
                {entry.label}
                <span style={{ color: '#64748b' }}>{entry.count}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索规则名称 / 描述 / 创建人..." />
          </div>
          <button
            type="button"
            onClick={() =>
              startRefresh(() => {
                setSearchTerm('')
                setStatusFilter('ALL')
                setCategoryFilter('ALL')
                router.refresh()
              })
            }
            disabled={isRefreshing}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.38)', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部状态', count: rules.length },
              ...STATUS_LIST.map((status) => ({
                key: status,
                label: STATUS_LABELS[status],
                count: rules.filter((item) => item.status === status).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as RuleStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部分类', count: statusFilter === 'ALL' ? rules.length : rules.filter((item) => item.status === statusFilter).length },
              ...CATEGORY_LIST.map((category) => ({
                key: category,
                label: CATEGORY_LABELS[category],
                count: rules.filter((item) => item.category === category && (statusFilter === 'ALL' || item.status === statusFilter)).length,
              })),
            ]}
            activeKey={categoryFilter}
            onChange={(key) => setCategoryFilter(key as RuleCategory | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <FilterChips
          hint="已筛选："
          chips={[
            ...(statusFilter !== 'ALL'
              ? [
                  {
                    key: 'status',
                    label: STATUS_LABELS[statusFilter],
                    tone: STATUS_BADGE_VARIANT[statusFilter] as FilterChip['tone'],
                    count: rules.filter((item) => item.status === statusFilter).length,
                  },
                ]
              : []),
            ...(categoryFilter !== 'ALL'
              ? [
                  {
                    key: 'category',
                    label: CATEGORY_LABELS[categoryFilter],
                    tone: 'neutral' as FilterChip['tone'],
                    count: rules.filter((item) => item.category === categoryFilter).length,
                  },
                ]
              : []),
          ]}
          onRemove={(key) => {
            if (key === 'status') setStatusFilter('ALL')
            if (key === 'category') setCategoryFilter('ALL')
          }}
          onClearAll={() => {
            setStatusFilter('ALL')
            setCategoryFilter('ALL')
          }}
        />

        <DataTable
          title={`规则列表（匹配 ${sortedItems.length} 条）`}
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
