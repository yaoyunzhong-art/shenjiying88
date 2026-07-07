/**
 * campaigns/page.tsx — 营销活动列表页 (ToB 活动管理)
 * 含搜索/过滤/分页/详情入口
 *
 * 活动属性: 编号、名称、类型、状态、渠道、预算、花费、ROI
 */
'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  DataTable,
  StatusBadge,
  Badge,
  SearchFilterInput,
  Pagination,
  PageShell,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
  type FilterChip,
} from '@m5/ui';

import {
  MOCK_CAMPAIGNS,
  CAMPAIGN_STATUS_MAP,
  CAMPAIGN_TYPE_MAP,
  CAMPAIGN_CHANNEL_MAP,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  CAMPAIGN_CHANNELS,
  CAMPAIGN_SEARCH_FIELDS,
  computeCampaignStats,
  formatCurrency,
  type CampaignItem,
  type CampaignStatus,
  type CampaignType,
  type CampaignChannel,
} from '../campaigns-data';
import {
  loadCampaigns,
  loadGlobalCampaignDispatches,
  type CampaignDispatchItem,
  type LiveDispatchStatus,
} from './campaigns-service';
import { ResultKindBadge } from './dispatch-result-badge';



// ── 列定义 ──

function buildColumns(
  onRowClick: (item: CampaignItem) => void
): DataTableColumn<CampaignItem>[] {
  return [
    {
      key: 'code',
      title: '活动编码',
      dataKey: 'code',
      sortable: true,
      width: '100px',
    },
    {
      key: 'name',
      title: '活动名称',
      dataKey: 'name',
      sortable: true,
      render: (item: CampaignItem) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(item);
          }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'type',
      title: '活动类型',
      sortable: true,
      sortValue: (item: CampaignItem) => item.type,
      render: (item: CampaignItem) => (
        <Badge size="sm">{CAMPAIGN_TYPE_MAP[item.type]?.label ?? item.type}</Badge>
      ),
    },
    {
      key: 'channel',
      title: '渠道',
      sortable: true,
      sortValue: (item: CampaignItem) => item.channel,
      render: (item: CampaignItem) => {
        const ch = CAMPAIGN_CHANNEL_MAP[item.channel];
        return <Badge size="sm">{ch.label}</Badge>;
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: CampaignItem) => CAMPAIGN_STATUSES.indexOf(item.status),
      render: (item: CampaignItem) => {
        const s = CAMPAIGN_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'budget',
      title: '预算',
      dataKey: 'budget',
      sortable: true,
      align: 'right',
      render: (item: CampaignItem) => formatCurrency(item.budget),
    },
    {
      key: 'spent',
      title: '已花费',
      dataKey: 'spent',
      sortable: true,
      align: 'right',
      render: (item: CampaignItem) => formatCurrency(item.spent),
    },
    {
      key: 'roi',
      title: 'ROI',
      dataKey: 'roi',
      sortable: true,
      align: 'right',
      render: (item: CampaignItem) =>
        item.roi > 0 ? (
          <span style={{ color: item.roi >= 3 ? '#4ade80' : item.roi >= 2 ? '#facc15' : '#f87171' }}>
            {item.roi.toFixed(1)}x
          </span>
        ) : (
          <span style={{ color: '#64748b' }}>-</span>
        ),
    },
    {
      key: 'startDate',
      title: '开始日期',
      dataKey: 'startDate',
      sortable: true,
    },
    {
      key: 'endDate',
      title: '结束日期',
      dataKey: 'endDate',
      sortable: true,
    },
    {
      key: 'createdBy',
      title: '创建人',
      dataKey: 'createdBy',
      sortable: true,
    },
  ];
}

// ── 页面组件 ──

export default function CampaignsPage() {
  const [campaignItems, setCampaignItems] = useState<CampaignItem[]>(MOCK_CAMPAIGNS);
  const [recentDispatches, setRecentDispatches] = useState<CampaignDispatchItem[]>([]);
  // 搜索
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    campaignItems,
    CAMPAIGN_SEARCH_FIELDS
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((c) => c.status === statusFilter),
    [filteredItems, statusFilter]
  );

  // 类型筛选
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'ALL'>('ALL');
  const typeFiltered = useMemo(
    () =>
      typeFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((c) => c.type === typeFilter),
    [statusFiltered, typeFilter]
  );

  // 渠道筛选
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | 'ALL'>('ALL');
  const channelFiltered = useMemo(
    () =>
      channelFilter === 'ALL'
        ? typeFiltered
        : typeFiltered.filter((c) => c.channel === channelFilter),
    [typeFiltered, channelFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: CampaignItem) => {
    window.location.href = `/campaigns/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(channelFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => {
    pagination.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, typeFilter, channelFilter]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => computeCampaignStats(campaignItems), [campaignItems]);

  // 派发记录筛选
  const [dispatchMemberFilter, setDispatchMemberFilter] = useState('');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<LiveDispatchStatus | 'ALL'>('ALL');
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const loadDispatches = useCallback(async () => {
    setDispatchLoading(true);
    try {
      const filter: { memberId?: string; status?: LiveDispatchStatus } = {};
      if (dispatchMemberFilter.trim()) filter.memberId = dispatchMemberFilter.trim();
      if (dispatchStatusFilter !== 'ALL') filter.status = dispatchStatusFilter;
      const dispatches = await loadGlobalCampaignDispatches(filter);
      setRecentDispatches(dispatches.slice(0, 5));
    } finally {
      setDispatchLoading(false);
    }
  }, [dispatchMemberFilter, dispatchStatusFilter]);

  // 加载派发记录（mount + 筛选变化时重载）
  useEffect(() => {
    let active = true;
    void loadDispatches().then(() => {
      if (!active) return;
      setDispatchLoading(false);
    });
    return () => { active = false; };
  }, [loadDispatches]);

  // 加载活动列表（仅 mount 时）
  useEffect(() => {
    let active = true;
    const hydrateCampaigns = async () => {
      const nextItems = await loadCampaigns();
      if (active) setCampaignItems(nextItems);
    };
    void hydrateCampaigns();
    return () => { active = false; };
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="营销活动管理"
        subtitle="管理所有营销活动的创建、排期、执行与效果评估。"
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
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>活动总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>进行中</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
              {stats.active}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总预算</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>
              {formatCurrency(stats.totalBudget)}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均 ROI</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#facc15' }}>
              {stats.avgRoi > 0 ? `${stats.avgRoi.toFixed(1)}x` : '-'}
            </div>
          </div>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索活动编码 / 名称 / 类型 / 渠道 / 创建人..."
          />
        </div>

        {/* 状态过滤 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>状态</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                ...tabBtnStyle,
                background: statusFilter === 'ALL' ? 'rgba(147,197,253,0.2)' : 'transparent',
                color: statusFilter === 'ALL' ? '#93c5fd' : '#94a3b8',
              }}
            >
              全部 ({statusFiltered.length})
            </button>
            {CAMPAIGN_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  ...tabBtnStyle,
                  background: statusFilter === s ? 'rgba(147,197,253,0.2)' : 'transparent',
                  color: statusFilter === s ? '#93c5fd' : '#94a3b8',
                }}
              >
                {CAMPAIGN_STATUS_MAP[s].label} (
                {campaignItems.filter((c) => c.status === s).length})
              </button>
            ))}
          </div>
        </div>

        {/* 类型过滤 + 渠道过滤 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>活动类型</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setTypeFilter('ALL')}
                style={{
                  ...tabBtnStyle,
                  background: typeFilter === 'ALL' ? 'rgba(147,197,253,0.2)' : 'transparent',
                  color: typeFilter === 'ALL' ? '#93c5fd' : '#94a3b8',
                }}
              >
                全部 ({statusFiltered.length})
              </button>
              {CAMPAIGN_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    ...tabBtnStyle,
                    background: typeFilter === t ? 'rgba(147,197,253,0.2)' : 'transparent',
                    color: typeFilter === t ? '#93c5fd' : '#94a3b8',
                  }}
                >
                  {CAMPAIGN_TYPE_MAP[t].label} (
                  {statusFiltered.filter((c) => c.type === t).length})
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>渠道</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setChannelFilter('ALL')}
                style={{
                  ...tabBtnStyle,
                  background: channelFilter === 'ALL' ? 'rgba(147,197,253,0.2)' : 'transparent',
                  color: channelFilter === 'ALL' ? '#93c5fd' : '#94a3b8',
                }}
              >
                全部 ({typeFiltered.length})
              </button>
              {CAMPAIGN_CHANNELS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  style={{
                    ...tabBtnStyle,
                    background: channelFilter === ch ? 'rgba(147,197,253,0.2)' : 'transparent',
                    color: channelFilter === ch ? '#93c5fd' : '#94a3b8',
                  }}
                >
                  {CAMPAIGN_CHANNEL_MAP[ch].label} (
                  {typeFiltered.filter((c) => c.channel === ch).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 活跃过滤条件可视化 */}
        <FilterChips
          hint="已筛选："
          chips={
            [
              ...(statusFilter !== 'ALL'
                ? [
                    {
                      key: 'status' as const,
                      label: CAMPAIGN_STATUS_MAP[statusFilter]?.label ?? statusFilter,
                      tone: (CAMPAIGN_STATUS_MAP[statusFilter]?.variant === 'success'
                        ? 'success'
                        : CAMPAIGN_STATUS_MAP[statusFilter]?.variant === 'warning'
                          ? 'warning'
                          : CAMPAIGN_STATUS_MAP[statusFilter]?.variant === 'danger'
                            ? 'danger'
                            : 'neutral') as FilterChip['tone'],
                      count: channelFiltered.filter((c) => c.status === statusFilter).length,
                    },
                  ]
                : []),
              ...(typeFilter !== 'ALL'
                ? [
                    {
                      key: 'type' as const,
                      label: CAMPAIGN_TYPE_MAP[typeFilter]?.label ?? typeFilter,
                      tone: 'neutral' as FilterChip['tone'],
                      count: channelFiltered.filter((c) => c.type === typeFilter).length,
                    },
                  ]
                : []),
              ...(channelFilter !== 'ALL'
                ? [
                    {
                      key: 'channel' as const,
                      label: CAMPAIGN_CHANNEL_MAP[channelFilter]?.label ?? channelFilter,
                      tone: 'neutral' as FilterChip['tone'],
                      count: channelFiltered.filter((c) => c.channel === channelFilter).length,
                    },
                  ]
                : []),
            ].filter(Boolean) as FilterChip[]
          }
          onRemove={(key) => {
            switch (key) {
              case 'status':
                setStatusFilter('ALL');
                break;
              case 'type':
                setTypeFilter('ALL');
                break;
              case 'channel':
                setChannelFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setStatusFilter('ALL');
            setTypeFilter('ALL');
            setChannelFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`活动列表（匹配 ${sortedItems.length} 条）`}
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

        <section
          style={{
            marginTop: 18,
            borderRadius: 16,
            padding: 18,
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>最近派发记录</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                Foundation11: 直接消费 `campaigns/dispatches/list` 真接口
              </div>
            </div>
            {/* 筛选控件行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={dispatchStatusFilter}
                onChange={e => setDispatchStatusFilter(e.target.value as LiveDispatchStatus | 'ALL')}
                style={{
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.25)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  fontSize: 12,
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">全部状态</option>
                <option value="PENDING">待执行</option>
                <option value="DISPATCHED">已下发</option>
                <option value="FAILED">失败</option>
                <option value="SKIPPED">已跳过</option>
              </select>
              <input
                type="text"
                placeholder="成员ID筛选"
                value={dispatchMemberFilter}
                onChange={e => setDispatchMemberFilter(e.target.value)}
                style={{
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.25)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  fontSize: 12,
                  padding: '5px 10px',
                  width: 130,
                }}
              />
              <button
                onClick={() => void loadDispatches()}
                disabled={dispatchLoading}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(59,130,246,0.4)',
                  background: dispatchLoading ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.15)',
                  color: dispatchLoading ? '#64748b' : '#60a5fa',
                  fontSize: 12,
                  cursor: dispatchLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {dispatchLoading ? '加载中…' : '刷新'}
              </button>
              {(dispatchStatusFilter !== 'ALL' || dispatchMemberFilter.trim()) && (
                <button
                  onClick={() => { setDispatchStatusFilter('ALL'); setDispatchMemberFilter(''); }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.25)',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  清除筛选
                </button>
              )}
            </div>
          </div>
          {dispatchLoading ? (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>加载中…</div>
          ) : recentDispatches.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>暂无派发记录，等待活动触发后会展示在这里。</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recentDispatches.map((dispatch) => (
                <div
                  key={dispatch.dispatchId}
                  onClick={() => { window.location.href = `/campaigns/${dispatch.planId}?highlightDispatchId=${dispatch.dispatchId}`; }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,1)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(30, 41, 59, 0.8)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
                >
                  {/* 第一行：基础信息 grid */}
                  <div style={{
                    display: 'grid',
                    gap: 8,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  }}>
                    <span>活动: {dispatch.planId}</span>
                    <span>状态: {dispatch.statusLabel}</span>
                    <span>触发: {dispatch.triggerEvent}</span>
                    <span>成员: <a href={`/members/${dispatch.memberId}`} style={{color:'#60a5fa',textDecoration:'underline',cursor:'pointer'}}>{dispatch.memberLabel}</a></span>
                    <span>时间: {dispatch.createdAtLabel}</span>
                  </div>
                  {/* 第二行：结果类型徽章 */}
                  <ResultKindBadge
                    kind={dispatch.resultKind}
                    typeLabel={dispatch.resultTypeLabel}
                    detailLabel={dispatch.resultDetailLabel}
                  />
                  {/* 第三行：活动详情跳转 */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: '#3b82f6', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); window.location.href = `/campaigns/${dispatch.planId}`; }}
                    >
                      查看活动详情 →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </main>
  );
}

// ── 样式 ──

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const tabBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.25)',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.15s',
};
