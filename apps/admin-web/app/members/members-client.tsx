'use client';
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

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
import BatchOperationsBar, { type BatchAction } from '../../components/shell/BatchOperationsBar';
import { useRowSelection } from '../../components/shell/useRowSelection';
import { useCrudFeedback } from '../../components/shell/FeedbackProvider';
import ListToolbar from '../../components/shell/ListToolbar';

import {
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_TIERS,
  MEMBER_STATUSES,
  type MemberItem,
  type MemberTier,
  type MemberStatus,
} from '../members-data';
import {
  deriveScopedCapabilityActionItem,
  type GatedCapabilityActionItem,
} from '../lyt-capability-access';
import { StoreCapabilityActionStrip } from '../components/store-capability-action-strip';
import { StoreCapabilityGatingBanner } from '../components/store-capability-gating-banner';
import { useStoreCapabilityGating } from '../components/use-store-capability-gating';
import { useDetailActions } from '../components/use-detail-actions';
import type { MembersPageSnapshot } from './members-page-data';

function tierOrder(tier: MemberTier): number {
  const order: Record<MemberTier, number> = {
    diamond: 5,
    gold: 4,
    silver: 3,
    bronze: 2,
    standard: 1,
  };
  return order[tier];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function pointsColor(points: number): string {
  if (points >= 150000) return '#f0abfc';
  if (points >= 80000) return '#fbbf24';
  if (points >= 30000) return '#94a3b8';
  return '#cbd5e1';
}

function buildColumns(
  onRowClick: (item: MemberItem) => void,
  canOpenDetail: boolean
): DataTableColumn<MemberItem>[] {
  return [
    {
      key: 'code',
      title: '会员编号',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '姓名',
      dataKey: 'name',
      sortable: true,
      render: (item: MemberItem) => (
        <span
          onClick={(event) => {
            event.stopPropagation();
            if (canOpenDetail) {
              onRowClick(item);
            }
          }}
          style={{
            color: canOpenDetail ? '#93c5fd' : '#94a3b8',
            cursor: canOpenDetail ? 'pointer' : 'not-allowed',
            textDecoration: canOpenDetail ? 'underline' : 'none',
          }}
          title={canOpenDetail ? '查看会员详情' : '当前门店会员能力受阻，详情入口暂不可用'}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'tier',
      title: '等级',
      sortable: true,
      sortValue: (item: MemberItem) => tierOrder(item.tier),
      render: (item: MemberItem) => {
        const tier = MEMBER_TIER_MAP[item.tier];
        return <StatusBadge label={tier.label} variant={tier.variant} size="sm" dot />;
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: MemberItem) => item.status,
      render: (item: MemberItem) => {
        const status = MEMBER_STATUS_MAP[item.status];
        return <StatusBadge label={status.label} variant={status.variant} size="sm" />;
      },
    },
    {
      key: 'points',
      title: '积分',
      dataKey: 'points',
      sortable: true,
      align: 'right',
      render: (item: MemberItem) => (
        <span style={{ fontWeight: 600, color: pointsColor(item.points) }}>
          {item.points.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      title: '累计消费',
      dataKey: 'totalSpent',
      sortable: true,
      align: 'right',
      render: (item: MemberItem) => <span style={{ fontWeight: 500 }}>{formatCurrency(item.totalSpent)}</span>,
    },
    {
      key: 'storeName',
      title: '所属门店',
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
      key: 'visitCount',
      title: '到店次数',
      dataKey: 'visitCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'avgOrderValue',
      title: '客单价',
      dataKey: 'avgOrderValue',
      sortable: true,
      align: 'right',
      render: (item: MemberItem) => <span>¥{item.avgOrderValue.toLocaleString()}</span>,
    },
    {
      key: 'lastVisitAt',
      title: '最近到店',
      dataKey: 'lastVisitAt',
      sortable: true,
    },
    {
      key: 'registeredAt',
      title: '注册日期',
      dataKey: 'registeredAt',
      sortable: true,
    },
    {
      key: 'tags',
      title: '标签',
      sortable: true,
      sortValue: (item: MemberItem) => item.tags.join(','),
      render: (item: MemberItem) => {
        if (item.tags.length === 0) {
          return <span style={{ color: '#64748b' }}>—</span>;
        }
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(147, 197, 253, 0.12)',
                  color: '#93c5fd',
                  whiteSpace: 'nowrap',
                }}
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 ? (
              <span style={{ fontSize: 11, color: '#64748b' }}>+{item.tags.length - 3}</span>
            ) : null}
          </div>
        );
      },
    },
  ];
}

export default function MembersClient({
  snapshot,
}: {
  snapshot: MembersPageSnapshot;
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [members, setMembers] = useState(snapshot.members);
  const [deliveryMode, setDeliveryMode] = useState(snapshot.deliveryMode);

  useEffect(() => {
    setMembers(snapshot.members);
    setDeliveryMode(snapshot.deliveryMode);
  }, [snapshot]);

  const searchFields = useMemo<(keyof MemberItem)[]>(
    () => ['code', 'name', 'phone', 'storeName'] as (keyof MemberItem)[],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(members, searchFields);

  const [tierFilter, setTierFilter] = useState<MemberTier | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  type SpendLevel = 'ALL' | 'vip' | 'high' | 'mid' | 'low';
  const [spendFilter, setSpendFilter] = useState<SpendLevel>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const memberGating = useStoreCapabilityGating({
    targetCapabilities: ['member'],
  });
  const canOpenMemberDetail = Boolean(memberGating.primaryNavigableAction);

  const handleRowClick = useCallback(
    (item: MemberItem) => {
      if (!canOpenMemberDetail) {
        return;
      }
      window.location.href = `/members/${item.id}`;
    },
    [canOpenMemberDetail]
  );

  const columns = useMemo(
    () => buildColumns(handleRowClick, canOpenMemberDetail),
    [canOpenMemberDetail, handleRowClick]
  );

  const tierFiltered = useMemo(
    () =>
      tierFilter === 'ALL' ? filteredItems : filteredItems.filter((member) => member.tier === tierFilter),
    [filteredItems, tierFilter]
  );

  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? tierFiltered
        : tierFiltered.filter((member) => member.status === statusFilter),
    [statusFilter, tierFiltered]
  );

  const allMarkets = useMemo(
    () => [...new Set(members.map((member) => member.marketCode))].sort(),
    [members]
  );

  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((member) => member.marketCode === marketFilter),
    [marketFilter, statusFiltered]
  );

  const spendFiltered = useMemo(() => {
    if (spendFilter === 'ALL') {
      return marketFiltered;
    }
    if (spendFilter === 'vip') {
      return marketFiltered.filter((member) => member.totalSpent >= 300000);
    }
    if (spendFilter === 'high') {
      return marketFiltered.filter(
        (member) => member.totalSpent >= 100000 && member.totalSpent < 300000
      );
    }
    if (spendFilter === 'mid') {
      return marketFiltered.filter(
        (member) => member.totalSpent >= 30000 && member.totalSpent < 100000
      );
    }
    return marketFiltered.filter((member) => member.totalSpent < 30000);
  }, [marketFiltered, spendFilter]);

  const sortedItems = useSortedItems(spendFiltered, columns, sortConfig);

  const selection = useRowSelection(sortedItems, (item) => item.id);
  const feedback = useCrudFeedback();

  const columnsWithCheckbox = useMemo<DataTableColumn<MemberItem>[]>(() => [
    { key: '_select', title: '✅', width: '40px', render: (item: MemberItem) => (
      <input type="checkbox" checked={selection.selectedIds.has(item.id)} 
        onChange={() => selection.toggle(item.id)} onClick={(e) => e.stopPropagation()}
        style={{ cursor: 'pointer', width: 16, height: 16 }} />
    )}, ...columns,
  ], [columns, selection.selectedIds, selection.toggle]);

  const batchActions: BatchAction[] = useMemo(() => [
    { key: 'batch-tag', label: '批量打标', icon: '🏷️', variant: 'primary',
      onClick: () => { feedback.success(`已为 ${selection.selectedCount} 位会员批量打标`); selection.clear(); } },
    { key: 'batch-reachout', label: '批量触达', icon: '📨', variant: 'primary',
      onClick: () => { feedback.success(`已向 ${selection.selectedCount} 位会员发送触达`); selection.clear(); } },
    { key: 'batch-freeze', label: '批量冻结', icon: '❄️', variant: 'danger',
      onClick: () => { feedback.success(`已冻结 ${selection.selectedCount} 位会员`); selection.clear(); } },
    { key: 'batch-export', label: '导出选中', icon: '📤', variant: 'default',
      onClick: () => { feedback.info(`正在导出 ${selection.selectedCount} 位会员...`); selection.clear(); } },
  ], [selection, feedback]);

  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });

  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, tierFilter, statusFilter, marketFilter, spendFilter, pagination]);

  const pageItems = pagination.paginate(sortedItems);

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((member) => member.status === 'active').length,
      diamond: members.filter((member) => member.tier === 'diamond').length,
      totalMetric: members.reduce((sum, member) => sum + member.totalSpent, 0),
    }),
    [members]
  );

  const totalMetricLabel = deliveryMode === 'api' ? '累计成长值' : '累计消费总额';
  const totalMetricValue =
    deliveryMode === 'api' ? stats.totalMetric.toLocaleString() : formatCurrency(stats.totalMetric);

  const memberBulkActions = useMemo<GatedCapabilityActionItem[]>(() => {
    const baseAction = memberGating.visibleActions[0];
    if (!baseAction) {
      return [];
    }

    return [
      deriveScopedCapabilityActionItem(baseAction, {
        key: 'member-bulk-tagging',
        label: baseAction.isDisabled
          ? '等待批量标签运营'
          : baseAction.access === 'degraded'
            ? '降级批量标签运营'
            : '批量标签运营',
        href: `/members?storeId=${memberGating.storeId}&focus=bulk-tagging`,
        hint: `${baseAction.hint} 用于批量标签治理与会员分层运营。`,
      }),
      deriveScopedCapabilityActionItem(baseAction, {
        key: 'member-bulk-reachout',
        label: baseAction.isDisabled
          ? '等待批量会员触达'
          : baseAction.access === 'degraded'
            ? '降级批量会员触达'
            : '批量会员触达',
        href: `/members?storeId=${memberGating.storeId}&focus=bulk-reachout`,
        hint: `${baseAction.hint} 用于批量营销触达和生命周期触发。`,
      }),
    ];
  }, [memberGating.storeId, memberGating.visibleActions]);

  const { actions } = useDetailActions({
    workspace: 'members',
    detailId: 'overview',
    record: { items: sortedItems, tierFilter, statusFilter, stats, totalMetricLabel },
    shareTitle: '会员管理中心',
    shareText: '查看会员 / 等级 / 状态筛选结果',
  });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="会员管理中心"
        subtitle={`统一管理所有市场的会员数据，支持按等级、状态、消费金额多维度筛选与排序。当前数据源：${snapshot.sourceLabel}。`}
      >
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              borderRadius: 12,
              padding: '12px 14px',
              border:
                deliveryMode === 'api'
                  ? '1px solid rgba(74, 222, 128, 0.22)'
                  : '1px solid rgba(251, 191, 36, 0.22)',
              background:
                deliveryMode === 'api'
                  ? 'rgba(20, 83, 45, 0.18)'
                  : 'rgba(120, 53, 15, 0.18)',
              color: deliveryMode === 'api' ? '#bbf7d0' : '#fde68a',
              fontSize: 13,
            }}
          >
            {`deliveryMode: ${deliveryMode} · sourceLabel: ${snapshot.sourceLabel} · generatedAt: ${snapshot.generatedAt}`}
            {deliveryMode !== 'api' ? ' · 当前不可作为闭环复签证据' : ''}
          </div>
          <button
            type="button"
            onClick={() => {
              handleRefresh();
            }}
            style={{
              borderRadius: 10,
              padding: '10px 14px',
              border: '1px solid rgba(96, 165, 250, 0.35)',
              background: 'rgba(59, 130, 246, 0.14)',
              color: '#dbeafe',
              cursor: 'pointer',
            }}
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>

        <StoreCapabilityGatingBanner
          title="会员入口治理"
          description="门店会员中心已接入 LYT capability access。页面入口、营销触达与生命周期运营应按 member capability 的 enabled / degraded / blocked / hidden 自动降级。"
          targetCapabilities={['member']}
          surfaceHref="/stores"
          surfaceLabel="返回门店列表"
        />

        <StoreCapabilityActionStrip
          title="会员批量动作"
          description="会员批量动作会直接复用 member capability gating。blocked 时禁用，degraded 时允许进入但保留风险提示。"
          actions={memberBulkActions}
          emptyHint="当前门店没有可执行的会员批量动作，请先检查 member capability access。"
        />

        {!canOpenMemberDetail && !memberGating.isLoading ? (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(248, 113, 113, 0.24)',
              background: 'rgba(127, 29, 29, 0.22)',
              color: '#fecaca',
              fontSize: 13,
            }}
          >
            当前门店的 member capability 处于阻塞或隐藏状态，会员姓名行点击已禁用，请先处理能力矩阵中的治理问题。
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <StatCard label="会员总数" value={String(stats.total)} caption={`覆盖 ${allMarkets.length} 个市场`} />
          <StatCard
            label="活跃会员"
            value={String(stats.active)}
            valueColor="#4ade80"
            caption={stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}% 活跃率` : '暂无会员'}
          />
          <StatCard label="钻石卡" value={String(stats.diamond)} valueColor="#f0abfc" caption="顶级会员" />
          <StatCard
            label={totalMetricLabel}
            value={totalMetricValue}
            valueColor="#fbbf24"
            caption={deliveryMode === 'api' ? '来自持久化会员档案' : '全部市场'}
          />
        </div>

        <ListToolbar
          matchedCount={sortedItems.length}
          searchInput={<SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索会员编号 / 姓名 / 手机号 / 门店..." />}
        />

        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: members.length },
              ...MEMBER_TIERS.map((tier) => ({
                key: tier,
                label: MEMBER_TIER_MAP[tier].label,
                count: members.filter((member) => member.tier === tier).length,
              })),
            ]}
            activeKey={tierFilter}
            onChange={(key) => setTierFilter(key as MemberTier | 'ALL')}
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
                { key: 'ALL', label: '全部', count: tierFiltered.length },
                ...MEMBER_STATUSES.map((status) => ({
                  key: status,
                  label: MEMBER_STATUS_MAP[status].label,
                  count: tierFiltered.filter((member) => member.status === status).length,
                })),
              ]}
              activeKey={statusFilter}
              onChange={(key) => setStatusFilter(key as MemberStatus | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>市场</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...allMarkets.map((market) => ({
                  key: market,
                  label: market,
                  count: statusFiltered.filter((member) => member.marketCode === market).length,
                })),
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>消费等级</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                { key: 'vip', label: '≥30万', count: marketFiltered.filter((member) => member.totalSpent >= 300000).length },
                {
                  key: 'high',
                  label: '10-30万',
                  count: marketFiltered.filter(
                    (member) => member.totalSpent >= 100000 && member.totalSpent < 300000
                  ).length,
                },
                {
                  key: 'mid',
                  label: '3-10万',
                  count: marketFiltered.filter(
                    (member) => member.totalSpent >= 30000 && member.totalSpent < 100000
                  ).length,
                },
                { key: 'low', label: '<3万', count: marketFiltered.filter((member) => member.totalSpent < 30000).length },
              ]}
              activeKey={spendFilter}
              onChange={(key) => setSpendFilter(key as SpendLevel)}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        <FilterChips
          hint="已筛选："
          chips={[
            ...(tierFilter !== 'ALL'
              ? [
                  {
                    key: 'tier' as const,
                    label: MEMBER_TIER_MAP[tierFilter].label,
                    tone: (
                      MEMBER_TIER_MAP[tierFilter].variant === 'success' ? 'success' : 'neutral'
                    ) as FilterChip['tone'],
                    count: tierFiltered.filter((member) => member.tier === tierFilter).length,
                  },
                ]
              : []),
            ...(statusFilter !== 'ALL'
              ? [
                  {
                    key: 'status' as const,
                    label: MEMBER_STATUS_MAP[statusFilter].label,
                    tone: (
                      MEMBER_STATUS_MAP[statusFilter].variant === 'success'
                        ? 'success'
                        : MEMBER_STATUS_MAP[statusFilter].variant === 'warning'
                          ? 'warning'
                          : MEMBER_STATUS_MAP[statusFilter].variant === 'danger'
                            ? 'danger'
                            : 'neutral'
                    ) as FilterChip['tone'],
                    count: statusFiltered.filter((member) => member.status === statusFilter).length,
                  },
                ]
              : []),
            ...(marketFilter !== 'ALL'
              ? [
                  {
                    key: 'market' as const,
                    label: marketFilter,
                    tone: 'neutral' as FilterChip['tone'],
                    count: marketFiltered.filter((member) => member.marketCode === marketFilter).length,
                  },
                ]
              : []),
            ...(spendFilter !== 'ALL'
              ? [
                  {
                    key: 'spend' as const,
                    label:
                      spendFilter === 'vip'
                        ? '≥30万'
                        : spendFilter === 'high'
                          ? '10-30万'
                          : spendFilter === 'mid'
                            ? '3-10万'
                            : '<3万',
                    tone:
                      spendFilter === 'vip'
                        ? ('success' as FilterChip['tone'])
                        : spendFilter === 'low'
                          ? ('warning' as FilterChip['tone'])
                          : ('neutral' as FilterChip['tone']),
                    count: spendFiltered.length,
                  },
                ]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'tier':
                setTierFilter('ALL');
                break;
              case 'status':
                setStatusFilter('ALL');
                break;
              case 'market':
                setMarketFilter('ALL');
                break;
              case 'spend':
                setSpendFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setTierFilter('ALL');
            setStatusFilter('ALL');
            setMarketFilter('ALL');
            setSpendFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {selection.selectedCount > 0 && (
          <BatchOperationsBar
            selectedCount={selection.selectedCount}
            totalCount={sortedItems.length}
            actions={batchActions}
            onClearSelection={selection.clear}
            itemLabel="会员"
          />
        )}

        <DataTable
          title={`会员列表（匹配 ${sortedItems.length} 条）`}
          columns={columnsWithCheckbox}
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

        <section
          style={{
            marginTop: 24,
            marginBottom: 24,
            borderRadius: 16,
            padding: 20,
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>快捷操作</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <QuickActionLink href="/members/create" icon="➕" label="新增会员" description="创建新的会员档案" />
            <QuickActionLink href="/members/import" icon="📥" label="批量导入" description="通过文件批量导入" />
            <QuickActionLink href="/members/levels" icon="🏆" label="等级管理" description="配置会员等级体系" />
            <QuickActionLink href="/members/cards" icon="💳" label="会员卡管理" description="管理所有会员卡" />
            <QuickActionLink href="/members/reports" icon="📊" label="会员报表" description="数据分析与报表" />
            <QuickActionLink href="/operations" icon="⚙️" label="运营工作台" description="批量营销触达" />
          </div>
        </section>

        <DetailActionBar
          actions={actions}
          heading="工作台收口动作"
          caption="复制 / 导出 / 分享当前会员管理中心筛选快照"
        />
      </PageShell>
    </main>
  );
}

function StatCard({
  label,
  value,
  caption,
  valueColor,
}: {
  label: string;
  value: string;
  caption: string;
  valueColor?: string;
}) {
  return (
    <article
      style={{
        borderRadius: 16,
        padding: 18,
        background: 'rgba(15, 23, 42, 0.38)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
      }}
    >
      <div style={{ fontSize: 13, color: '#cbd5e1' }}>{label}</div>
      <div
        style={{
          marginTop: 6,
          fontSize: 24,
          fontWeight: 700,
          color: valueColor ?? '#e2e8f0',
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{caption}</div>
    </article>
  );
}

function QuickActionLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderRadius: 12,
        background: 'rgba(30, 41, 59, 0.45)',
        border: '1px solid rgba(148, 163, 184, 0.14)',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        minWidth: 180,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
        event.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'rgba(30, 41, 59, 0.45)';
        event.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.14)';
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{description}</div>
      </div>
    </a>
  );
}
