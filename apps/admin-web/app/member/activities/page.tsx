'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

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
} from '@m5/ui';

import { useDetailActions } from '../../components/use-detail-actions';
import {
  type ActivityItem,
  type ActivityEventType,
  type ActivityStatus,
  type ActivityChannel,
  MOCK_ACTIVITIES,
  getEventTypeLabel,
  getStatusLabel,
  getChannelLabel,
  getActivityStats,
  getUniqueChannels,
  getUniqueEventTypes,
} from './mock-data';

// ---- 列定义 ----

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
      render: (item: ActivityItem) => {
        const label = getEventTypeLabel(item.eventType);
        return <StatusBadge label={label} variant="neutral" size="sm" />;
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: ActivityItem) => item.status,
      render: (item: ActivityItem) => {
        const statusConfig: Record<ActivityStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
          SUCCESS: { label: '成功', variant: 'success' },
          PENDING: { label: '处理中', variant: 'warning' },
          FAILED: { label: '失败', variant: 'danger' },
        };
        const c = statusConfig[item.status];
        return <StatusBadge label={c.label} variant={c.variant} size="sm" dot />;
      },
    },
    {
      key: 'channel',
      title: '来源',
      sortable: true,
      render: (item: ActivityItem) => (
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          {getChannelLabel(item.channel)}
        </span>
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
        const d = new Date(item.occurredAt);
        return (
          <span style={{ color: '#94a3b8', fontSize: 13 }}>
            {d.toLocaleDateString('zh-CN')} {d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
  ];
}

// ---- 页面 ----

export default function MemberActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    try {
      setData(MOCK_ACTIVITIES);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>加载中...</div></main>;
  if (error) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#ef4444', textAlign: 'center', padding: 64 }}>数据获取失败: {error}</div></main>;
  if (!data || data.length === 0) return <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>暂无数据</div></main>;

  const searchFields = useMemo<(keyof ActivityItem)[]>(
    () => ['id', 'memberName', 'memberPhone', 'description'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_ACTIVITIES, searchFields);

  // 事件类型筛选
  const eventTypes = useMemo(() => getUniqueEventTypes(MOCK_ACTIVITIES), []);
  const [eventTypeFilter, setEventTypeFilter] = useState<ActivityEventType | 'ALL'>('ALL');
  const eventFiltered = useMemo(
    () =>
      eventTypeFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.eventType === eventTypeFilter),
    [filteredItems, eventTypeFilter],
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? eventFiltered
        : eventFiltered.filter((item) => item.status === statusFilter),
    [eventFiltered, statusFilter],
  );

  // 渠道筛选
  const channels = useMemo(() => getUniqueChannels(MOCK_ACTIVITIES), []);
  const [channelFilter, setChannelFilter] = useState<ActivityChannel | 'ALL'>('ALL');
  const channelFiltered = useMemo(
    () =>
      channelFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.channel === channelFilter),
    [statusFiltered, channelFilter],
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const columns = useMemo(() => buildColumns(), []);
  const sortedItems = useSortedItems(channelFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 20] });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, eventTypeFilter, statusFilter, channelFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => getActivityStats(MOCK_ACTIVITIES), []);

  const { actions } = useDetailActions({
    workspace: 'member-activities',
    detailId: 'overview',
    record: { items: sortedItems, eventTypeFilter, statusFilter, channelFilter, stats },
    shareTitle: '会员活动历史',
    shareText: '查看会员积分/等级/优惠券/资料变更活动记录',
  });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="会员活动历史"
        subtitle="追踪会员积分变动、等级升降、优惠券发放和资料修改记录。"
      >
        {/* 统计卡片 */}
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
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}
            >
              {stats.success}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(0) : 0}% 成功率
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>处理中</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#fbbf24' }}
            >
              {stats.pending}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>覆盖会员</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f0abfc' }}
            >
              {stats.uniqueMembers}
            </div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索会员名称 / 手机号 / 活动描述..."
          />
        </div>

        {/* 事件类型过滤 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: filteredItems.length },
              ...eventTypes.map((et) => ({
                key: et,
                label: getEventTypeLabel(et),
                count: filteredItems.filter((item) => item.eventType === et).length,
              })),
            ]}
            activeKey={eventTypeFilter}
            onChange={(key) => setEventTypeFilter(key as ActivityEventType | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 状态 + 渠道筛选 */}
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
                ...(['SUCCESS', 'PENDING', 'FAILED'] as ActivityStatus[]).map((s) => ({
                  key: s,
                  label: getStatusLabel(s),
                  count: eventFiltered.filter((item) => item.status === s).length,
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
                ...channels.map((ch) => ({
                  key: ch,
                  label: getChannelLabel(ch),
                  count: statusFiltered.filter((item) => item.channel === ch).length,
                })),
              ]}
              activeKey={channelFilter}
              onChange={(key) => setChannelFilter(key as ActivityChannel | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃过滤条件 */}
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
                      count: eventFiltered.filter((i) => i.eventType === eventTypeFilter).length,
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
                      count: statusFiltered.filter((i) => i.status === statusFilter).length,
                    },
                  ]
                : []),
              ...(channelFilter !== 'ALL'
                ? [
                    {
                      key: 'channel',
                      label: getChannelLabel(channelFilter),
                      tone: 'neutral' as FilterChip['tone'],
                      count: channelFiltered.filter((i) => i.channel === channelFilter).length,
                    },
                  ]
                : []),
            ].filter(Boolean) as FilterChip[]
          }
          onRemove={(key) => {
            switch (key) {
              case 'eventType':
                setEventTypeFilter('ALL');
                break;
              case 'status':
                setStatusFilter('ALL');
                break;
              case 'channel':
                setChannelFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setEventTypeFilter('ALL');
            setStatusFilter('ALL');
            setChannelFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
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

        {/* 分页 */}
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
  );
}

// ---- 样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};
