'use client'

import { useState, useMemo, useEffect, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  DataTable,
  DetailActionBar,
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
} from '@m5/ui'
import { useDetailActions } from '../../components/use-detail-actions'
import type {
  ActivityItem,
  ActivityEventType,
  ActivityStatus,
  ActivityChannel,
  MemberActivitiesSnapshotDelivery,
} from './mock-data'
import {
  getEventTypeLabel,
  getStatusLabel,
  getChannelLabel,
  getActivityStats,
  getUniqueChannels,
  getUniqueEventTypes,
} from './mock-data'

function buildColumns(): DataTableColumn<ActivityItem>[] {
  return [
    {
      key: 'id',
      title: 'ID',
      dataKey: 'id',
      sortable: true,
      width: '100px',
    },
    {
      key: 'memberName',
      title: '会员',
      sortable: true,
      render: (item: ActivityItem) => (
        <span style={{ color: '#93c5fd' }}>
          {item.memberName}
          <span style={{ color: '#64748b', marginLeft: 6, fontSize: 12 }}>{item.memberPhone}</span>
        </span>
      ),
    },
    {
      key: 'eventType',
      title: '事件类型',
      sortable: true,
      render: (item: ActivityItem) => (
        <StatusBadge label={getEventTypeLabel(item.eventType)} variant="neutral" size="sm" />
      ),
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: ActivityItem) => item.status,
      render: (item: ActivityItem) => {
        const statusConfig: Record<
          ActivityStatus,
          { label: string; variant: 'success' | 'warning' | 'danger' }
        > = {
          SUCCESS: { label: '成功', variant: 'success' },
          PENDING: { label: '处理中', variant: 'warning' },
          FAILED: { label: '失败', variant: 'danger' },
        }
        const current = statusConfig[item.status]
        return <StatusBadge label={current.label} variant={current.variant} size="sm" dot />
      },
    },
    {
      key: 'channel',
      title: '来源',
      sortable: true,
      render: (item: ActivityItem) => (
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{getChannelLabel(item.channel)}</span>
      ),
    },
    {
      key: 'description',
      title: '描述',
      dataKey: 'description',
      sortable: false,
    },
    {
      key: 'operator',
      title: '操作人',
      dataKey: 'operator',
      sortable: true,
    },
    {
      key: 'occurredAt',
      title: '发生时间',
      dataKey: 'occurredAt',
      sortable: true,
      render: (item: ActivityItem) => {
        const date = new Date(item.occurredAt)
        return (
          <span style={{ color: '#94a3b8', fontSize: 13 }}>
            {date.toLocaleDateString('zh-CN')}{' '}
            {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
  ]
}

export default function MemberActivitiesClient({
  snapshot,
}: {
  snapshot: MemberActivitiesSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const searchFields = useMemo<(keyof ActivityItem)[]>(
    () => ['id', 'memberName', 'memberPhone', 'description'],
    [],
  )
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    snapshot.activities,
    searchFields,
  )

  const eventTypes = useMemo(() => getUniqueEventTypes(snapshot.activities), [snapshot.activities])
  const channels = useMemo(() => getUniqueChannels(snapshot.activities), [snapshot.activities])

  const [eventTypeFilter, setEventTypeFilter] = useState<ActivityEventType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'ALL'>('ALL')
  const [channelFilter, setChannelFilter] = useState<ActivityChannel | 'ALL'>('ALL')
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null)

  const eventFiltered = useMemo(
    () =>
      eventTypeFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.eventType === eventTypeFilter),
    [eventTypeFilter, filteredItems],
  )

  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? eventFiltered
        : eventFiltered.filter((item) => item.status === statusFilter),
    [eventFiltered, statusFilter],
  )

  const channelFiltered = useMemo(
    () =>
      channelFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.channel === channelFilter),
    [channelFilter, statusFiltered],
  )

  const columns = useMemo(() => buildColumns(), [])
  const sortedItems = useSortedItems(channelFiltered, columns, sortConfig)

  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 20] })
  useEffect(() => {
    pagination.resetPage()
  }, [channelFilter, eventTypeFilter, pagination, searchTerm, statusFilter])

  const pageItems = pagination.paginate(sortedItems)
  const stats = useMemo(() => getActivityStats(snapshot.activities), [snapshot.activities])

  const { actions } = useDetailActions({
    workspace: 'member-activities',
    detailId: 'overview',
    record: { items: sortedItems, eventTypeFilter, statusFilter, channelFilter, stats },
    shareTitle: '会员活动历史',
    shareText: '查看会员积分/等级/优惠券/资料变更活动记录',
  })

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' }}>
            会员活动历史
          </h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            透传服务端活动快照，集中查看积分、等级、优惠券和资料修改轨迹。
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.24)',
            background: 'rgba(15,23,42,0.55)',
            color: '#e2e8f0',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            opacity: isRefreshing ? 0.65 : 1,
          }}
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            border: '1px solid rgba(250,204,21,0.28)',
            background: 'rgba(250,204,21,0.08)',
            color: '#fde68a',
          }}
        >
          {snapshot.error}
        </div>
      )}

      <PageShell
        title="会员活动历史"
        subtitle="追踪会员积分变动、等级升降、优惠券发放和资料修改记录。"
      >
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>活动总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>成功</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
              {stats.success}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(0) : 0}% 成功率
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>处理中</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>
              {stats.pending}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>覆盖会员</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f0abfc' }}>
              {stats.uniqueMembers}
            </div>
          </article>
        </div>

        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索会员名称 / 手机号 / 活动描述..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: filteredItems.length },
              ...eventTypes.map((eventType) => ({
                key: eventType,
                label: getEventTypeLabel(eventType),
                count: filteredItems.filter((item) => item.eventType === eventType).length,
              })),
            ]}
            activeKey={eventTypeFilter}
            onChange={(key) => setEventTypeFilter(key as ActivityEventType | 'ALL')}
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
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>状态</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: eventFiltered.length },
                ...(['SUCCESS', 'PENDING', 'FAILED'] as ActivityStatus[]).map((status) => ({
                  key: status,
                  label: getStatusLabel(status),
                  count: eventFiltered.filter((item) => item.status === status).length,
                })),
              ]}
              activeKey={statusFilter}
              onChange={(key) => setStatusFilter(key as ActivityStatus | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>来源渠道</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...channels.map((channel) => ({
                  key: channel,
                  label: getChannelLabel(channel),
                  count: statusFiltered.filter((item) => item.channel === channel).length,
                })),
              ]}
              activeKey={channelFilter}
              onChange={(key) => setChannelFilter(key as ActivityChannel | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        <FilterChips
          hint="已筛选："
          chips={
            [
              ...(eventTypeFilter !== 'ALL'
                ? [
                    {
                      key: 'eventType',
                      label: getEventTypeLabel(eventTypeFilter),
                      tone: 'neutral' as FilterChip['tone'],
                      count: eventFiltered.filter((item) => item.eventType === eventTypeFilter).length,
                    },
                  ]
                : []),
              ...(statusFilter !== 'ALL'
                ? [
                    {
                      key: 'status',
                      label: getStatusLabel(statusFilter),
                      tone: (statusFilter === 'FAILED'
                        ? 'danger'
                        : statusFilter === 'PENDING'
                          ? 'warning'
                          : 'success') as FilterChip['tone'],
                      count: statusFiltered.filter((item) => item.status === statusFilter).length,
                    },
                  ]
                : []),
              ...(channelFilter !== 'ALL'
                ? [
                    {
                      key: 'channel',
                      label: getChannelLabel(channelFilter),
                      tone: 'neutral' as FilterChip['tone'],
                      count: channelFiltered.filter((item) => item.channel === channelFilter).length,
                    },
                  ]
                : []),
            ].filter(Boolean) as FilterChip[]
          }
          onRemove={(key) => {
            if (key === 'eventType') setEventTypeFilter('ALL')
            if (key === 'status') setStatusFilter('ALL')
            if (key === 'channel') setChannelFilter('ALL')
          }}
          onClearAll={() => {
            setEventTypeFilter('ALL')
            setStatusFilter('ALL')
            setChannelFilter('ALL')
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        <DataTable
          title={`活动记录（匹配 ${sortedItems.length} 条）`}
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

        <DetailActionBar
          actions={actions}
          heading="工作台收口动作"
          caption="复制 / 导出 / 分享当前活动筛选快照"
        />
      </PageShell>
    </main>
  )
}

const statCardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}
