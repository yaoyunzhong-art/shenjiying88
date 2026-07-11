'use client';

import { Suspense, useState, useMemo, useCallback, useEffect } from 'react';

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
  type GatedCapabilityActionItem
} from '../lyt-capability-access';
import { StoreCapabilityActionStrip } from '../components/store-capability-action-strip';
import { loadAdminMemberList } from '../members-view-model';
import { StoreCapabilityGatingBanner } from '../components/store-capability-gating-banner';
import { useStoreCapabilityGating } from '../components/use-store-capability-gating';
import { useDetailActions } from '../components/use-detail-actions';

// ---- 工具函数 ----

function tierOrder(tier: MemberTier): number {
  const o: Record<MemberTier, number> = {
    diamond: 5,
    gold: 4,
    silver: 3,
    bronze: 2,
    standard: 1,
  };
  return o[tier];
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

// ---- 列定义 ----

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
          onClick={(e) => {
            e.stopPropagation();
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
        const t = MEMBER_TIER_MAP[item.tier];
        return (
          <StatusBadge
            label={t.label}
            variant={t.variant}
            size="sm"
            dot
          />
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: MemberItem) => item.status,
      render: (item: MemberItem) => {
        const s = MEMBER_STATUS_MAP[item.status];
        return (
          <StatusBadge
            label={s.label}
            variant={s.variant}
            size="sm"
          />
        );
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
      render: (item: MemberItem) => (
        <span style={{ fontWeight: 500 }}>
          {formatCurrency(item.totalSpent)}
        </span>
      ),
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
      render: (item: MemberItem) => (
        <span>¥{item.avgOrderValue.toLocaleString()}</span>
      ),
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
        if (item.tags.length === 0)
          return <span style={{ color: '#64748b' }}>—</span>;
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(147, 197, 253, 0.12)',
                  color: '#93c5fd',
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span style={{ fontSize: 11, color: '#64748b' }}>
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
  ];
}

// ---- 页面组件 ----

function MembersPageContent() {
  const [membersState, setMembersState] = useState<{
    deliveryMode: 'api' | 'fallback';
    members: MemberItem[];
  }>({
    deliveryMode: 'fallback',
    members: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    async function hydrateMembers() {
      try {
        const snapshot = await loadAdminMemberList();
        if (!disposed) {
          setMembersState(snapshot);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    }

    void hydrateMembers();

    return () => {
      disposed = true;
    };
  }, []);

  const members = membersState.members;

  // 搜索过滤
  const searchFields = useMemo<(keyof MemberItem)[]>(
    () => ['code', 'name', 'phone', 'storeName'] as (keyof MemberItem)[],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    members,
    searchFields
  );

  // 等级筛选
  const [tierFilter, setTierFilter] = useState<MemberTier | 'ALL'>('ALL');
  const tierFiltered = useMemo(
    () =>
      tierFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((m) => m.tier === tierFilter),
    [filteredItems, tierFilter]
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? tierFiltered
        : tierFiltered.filter((m) => m.status === statusFilter),
    [tierFiltered, statusFilter]
  );

  // 市场筛选
  const allMarkets = useMemo(
    () => [...new Set(members.map((m) => m.marketCode))].sort(),
    [members]
  );
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((m) => m.marketCode === marketFilter),
    [statusFiltered, marketFilter]
  );

  // 消费等级筛选 (按金额)
  type SpendLevel = 'ALL' | 'vip' | 'high' | 'mid' | 'low';
  const [spendFilter, setSpendFilter] = useState<SpendLevel>('ALL');
  const spendFiltered = useMemo(
    () =>
      spendFilter === 'ALL'
        ? marketFiltered
        : spendFilter === 'vip'
          ? marketFiltered.filter((m) => m.totalSpent >= 300000)
          : spendFilter === 'high'
            ? marketFiltered.filter(
                (m) => m.totalSpent >= 100000 && m.totalSpent < 300000
              )
            : spendFilter === 'mid'
              ? marketFiltered.filter(
                  (m) => m.totalSpent >= 30000 && m.totalSpent < 100000
                )
              : marketFiltered.filter((m) => m.totalSpent < 30000),
    [marketFiltered, spendFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const memberGating = useStoreCapabilityGating({
    targetCapabilities: ['member']
  });
  const canOpenMemberDetail = Boolean(memberGating.primaryNavigableAction);
  const memberBulkActions = useMemo<GatedCapabilityActionItem[]>(() => {
    const baseAction = memberGating.visibleActions[0];
    if (!baseAction) {
      return [];
    }

    return [
      deriveScopedCapabilityActionItem(baseAction, {
        key: 'member-bulk-tagging',
        label: baseAction.isDisabled ? '等待批量标签运营' : baseAction.access === 'degraded' ? '降级批量标签运营' : '批量标签运营',
        href: `/members?storeId=${memberGating.storeId}&focus=bulk-tagging`,
        hint: `${baseAction.hint} 用于批量标签治理与会员分层运营。`
      }),
      deriveScopedCapabilityActionItem(baseAction, {
        key: 'member-bulk-reachout',
        label: baseAction.isDisabled ? '等待批量会员触达' : baseAction.access === 'degraded' ? '降级批量会员触达' : '批量会员触达',
        href: `/members?storeId=${memberGating.storeId}&focus=bulk-reachout`,
        hint: `${baseAction.hint} 用于批量营销触达和生命周期触发。`
      })
    ];
  }, [memberGating.storeId, memberGating.visibleActions]);
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
  const sortedItems = useSortedItems(spendFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });
  useEffect(
    () => {
      pagination.resetPage();
    },
    [searchTerm, tierFilter, statusFilter, marketFilter, spendFilter, pagination]
  );
  const pageItems = pagination.paginate(sortedItems);

  // 统计数据
  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.status === 'active').length,
      diamond: members.filter((m) => m.tier === 'diamond').length,
      totalMetric: members.reduce((sum, member) => sum + member.totalSpent, 0),
    }),
    [members]
  );

  const totalMetricLabel =
    membersState.deliveryMode === 'api' ? '累计成长值' : '累计消费总额';
  const totalMetricValue =
    membersState.deliveryMode === 'api'
      ? stats.totalMetric.toLocaleString()
      : formatCurrency(stats.totalMetric);

  const { actions } = useDetailActions({
    workspace: 'members',
    detailId: 'overview',
    record: { items: sortedItems, tierFilter, statusFilter, stats, totalMetricLabel },
    shareTitle: '会员管理中心',
    shareText: '查看会员 / 等级 / 状态筛选结果'
  });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="会员管理中心"
        subtitle={`统一管理所有市场的会员数据，支持按等级、状态、消费金额多维度筛选与排序。当前数据源：${
          membersState.deliveryMode === 'api' ? '真实 API' : 'fallback'
        }。`}
      >
        {isLoading ? (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              background: 'rgba(15, 23, 42, 0.35)',
              color: '#cbd5e1',
              fontSize: 13,
            }}
          >
            正在同步会员档案...
          </div>
        ) : null}

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
              fontSize: 13
            }}
          >
            当前门店的 member capability 处于阻塞或隐藏状态，会员姓名行点击已禁用，请先处理能力矩阵中的治理问题。
          </div>
        ) : null}

        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <article
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>会员总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>
              {stats.total}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              覆盖 {allMarkets.length} 个市场
            </div>
          </article>
          <article
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>活跃会员</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: '#4ade80',
              }}
            >
              {stats.active}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {stats.total > 0
                ? `${((stats.active / stats.total) * 100).toFixed(0)}% 活跃率`
                : '暂无会员'}
            </div>
          </article>
          <article
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>钻石卡</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: '#f0abfc',
              }}
            >
              {stats.diamond}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              顶级会员
            </div>
          </article>
          <article
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>{totalMetricLabel}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: '#fbbf24',
              }}
            >
              {totalMetricValue}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {membersState.deliveryMode === 'api' ? '来自持久化会员档案' : '全部市场'}
            </div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索会员编号 / 姓名 / 手机号 / 门店..."
          />
        </div>

        {/* 等级筛选栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: members.length },
              ...MEMBER_TIERS.map((t) => ({
                key: t,
                label: MEMBER_TIER_MAP[t].label,
                count: members.filter((m) => m.tier === t).length,
              })),
            ]}
            activeKey={tierFilter}
            onChange={(key) => setTierFilter(key as MemberTier | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 状态 + 市场 + 消费 筛选栏 */}
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
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              状态
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: tierFiltered.length },
                ...MEMBER_STATUSES.map((s) => ({
                  key: s,
                  label: MEMBER_STATUS_MAP[s].label,
                  count: tierFiltered.filter((m) => m.status === s).length,
                })),
              ]}
              activeKey={statusFilter}
              onChange={(key) => setStatusFilter(key as MemberStatus | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              市场
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...allMarkets.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: statusFiltered.filter((m) => m.marketCode === mkt)
                    .length,
                })),
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              消费等级
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                {
                  key: 'vip',
                  label: '≥30万',
                  count: marketFiltered.filter(
                    (m) => m.totalSpent >= 300000
                  ).length,
                },
                {
                  key: 'high',
                  label: '10-30万',
                  count: marketFiltered.filter(
                    (m) => m.totalSpent >= 100000 && m.totalSpent < 300000
                  ).length,
                },
                {
                  key: 'mid',
                  label: '3-10万',
                  count: marketFiltered.filter(
                    (m) => m.totalSpent >= 30000 && m.totalSpent < 100000
                  ).length,
                },
                {
                  key: 'low',
                  label: '<3万',
                  count: marketFiltered.filter(
                    (m) => m.totalSpent < 30000
                  ).length,
                },
              ]}
              activeKey={spendFilter}
              onChange={(key) => setSpendFilter(key as SpendLevel)}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃过滤条件 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(tierFilter !== 'ALL'
              ? [
                  {
                    key: 'tier' as const,
                    label: MEMBER_TIER_MAP[tierFilter].label,
                    tone: (
                      MEMBER_TIER_MAP[tierFilter].variant === 'success'
                        ? 'success'
                        : 'neutral'
                    ) as FilterChip['tone'],
                    count: tierFiltered.filter(
                      (m) => m.tier === tierFilter
                    ).length,
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
                    count: statusFiltered.filter(
                      (m) => m.status === statusFilter
                    ).length,
                  },
                ]
              : []),
            ...(marketFilter !== 'ALL'
              ? [
                  {
                    key: 'market' as const,
                    label: marketFilter,
                    tone: 'neutral' as FilterChip['tone'],
                    count: marketFiltered.filter(
                      (m) => m.marketCode === marketFilter
                    ).length,
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
                    count: marketFiltered.filter((m) => {
                      if (spendFilter === 'vip')
                        return m.totalSpent >= 300000;
                      if (spendFilter === 'high')
                        return (
                          m.totalSpent >= 100000 && m.totalSpent < 300000
                        );
                      if (spendFilter === 'mid')
                        return m.totalSpent >= 30000 && m.totalSpent < 100000;
                      return m.totalSpent < 30000;
                    }).length,
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

        {/* 数据表格 */}
        <DataTable
          title={`会员列表（匹配 ${sortedItems.length} 条）`}
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

        {/* 快速操作入口 */}
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
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>
            快捷操作
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <QuickActionLink
              href="/members/create"
              icon="➕"
              label="新增会员"
              description="创建新的会员档案"
            />
            <QuickActionLink
              href="/members/import"
              icon="📥"
              label="批量导入"
              description="通过文件批量导入"
            />
            <QuickActionLink
              href="/members/levels"
              icon="🏆"
              label="等级管理"
              description="配置会员等级体系"
            />
            <QuickActionLink
              href="/members/cards"
              icon="💳"
              label="会员卡管理"
              description="管理所有会员卡"
            />
            <QuickActionLink
              href="/members/reports"
              icon="📊"
              label="会员报表"
              description="数据分析与报表"
            />
            <QuickActionLink
              href="/operations"
              icon="⚙️"
              label="运营工作台"
              description="批量营销触达"
            />
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

// ---- 快捷操作子组件 ----

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
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
        e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.45)';
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.14)';
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
          {description}
        </div>
      </div>
    </a>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<MembersPageFallback />}>
      <MembersPageContent />
    </Suspense>
  );
}

function MembersPageFallback() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
      <div style={{ textAlign: 'center', padding: 64 }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>👥</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>正在加载会员治理视图...</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
          同步会员档案、等级数据和能力矩阵
        </div>
      </div>
    </main>
  );
}
