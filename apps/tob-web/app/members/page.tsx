'use client';

import { Suspense, useState, useMemo, useCallback, useEffect } from 'react';

import {
  DataTable,
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
  MOCK_MEMBERS,
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_TIERS,
  MEMBER_STATUSES,
  ALL_STORES,
  ALL_MARKETS,
  type MemberItem,
  type MemberTier,
  type MemberStatus,
} from '../members-data';

// ---- 工具函数 ----

function pointsColor(points: number): string {
  if (points >= 150000) return '#a78bfa';
  if (points >= 80000) return '#fbbf24';
  if (points >= 30000) return '#94a3b8';
  return '#cbd5e1';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

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

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: MemberItem) => void
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
            onRowClick(item);
          }}
          style={{
            color: '#93c5fd',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'phone',
      title: '手机号',
      dataKey: 'phone',
      sortable: true,
      render: (item: MemberItem) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#94a3b8' }}>
          {item.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')}
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
      key: 'tier',
      title: '等级',
      sortable: true,
      sortValue: (item: MemberItem) => tierOrder(item.tier),
      render: (item: MemberItem) => {
        const t = MEMBER_TIER_MAP[item.tier];
        return <StatusBadge label={t.label} variant={t.variant} size="sm" />;
      },
    },
    {
      key: 'points',
      title: '积分',
      dataKey: 'points',
      sortable: true,
      align: 'right',
      render: (item: MemberItem) => (
        <span
          style={{
            fontWeight: 600,
            color: pointsColor(item.points),
            fontVariantNumeric: 'tabular-nums',
          }}
        >
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
        <span
          style={{
            fontWeight: 600,
            color: '#4ade80',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(item.totalSpent)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: MemberItem) => item.status,
      render: (item: MemberItem) => {
        const s = MEMBER_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'salesperson',
      title: '导购',
      dataKey: 'salesperson',
      sortable: true,
    },
    {
      key: 'lastVisit',
      title: '最近到店',
      dataKey: 'lastVisit',
      sortable: true,
    },
    {
      key: 'createdAt',
      title: '注册时间',
      dataKey: 'createdAt',
      sortable: true,
    },
  ];
}

// ---- 统计卡片样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

// ---- 页面组件 ----

function MembersPageContent() {
  // 搜索过滤
  const searchFields = useMemo<(keyof MemberItem)[]>(
    () => ['code', 'name', 'phone', 'storeName', 'salesperson'],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_MEMBERS,
    searchFields
  );

  // 等级筛选
  const [tierFilter, setTierFilter] = useState<MemberTier | 'ALL'>('ALL');
  const tierFiltered = useMemo(
    () =>
      tierFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.tier === tierFilter),
    [filteredItems, tierFilter]
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? tierFiltered
        : tierFiltered.filter((item) => item.status === statusFilter),
    [tierFiltered, statusFilter]
  );

  // 门店筛选
  const [storeFilter, setStoreFilter] = useState<string>('ALL');
  const storeFiltered = useMemo(
    () =>
      storeFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.storeName === storeFilter),
    [statusFiltered, storeFilter]
  );

  // 市场筛选
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? storeFiltered
        : storeFiltered.filter((item) => item.marketCode === marketFilter),
    [storeFiltered, marketFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: MemberItem) => {
    window.location.href = `/members/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(marketFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, tierFilter, statusFilter, storeFilter, marketFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计数据
  const stats = useMemo(() => {
    const active = MOCK_MEMBERS.filter((m) => m.status === 'active').length;
    const totalPoints = MOCK_MEMBERS.reduce((s, m) => s + m.points, 0);
    const diamond = MOCK_MEMBERS.filter((m) => m.tier === 'diamond').length;
    return { total: MOCK_MEMBERS.length, active, totalPoints, diamond };
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="会员管理"
        subtitle="ToB 管理端 — 查看门店会员信息、等级分布与消费数据，支持多维度筛选与排序。"
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
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>会员总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>
              {stats.total}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              覆盖 {ALL_MARKETS.length} 个市场
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>活跃会员</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}
            >
              {stats.active}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {((stats.active / stats.total) * 100).toFixed(0)}% 活跃率
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总积分</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: '#a78bfa',
              }}
            >
              {stats.totalPoints.toLocaleString()}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              人均 {(stats.totalPoints / stats.total).toFixed(0)}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>钻石会员</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#a78bfa' }}
            >
              {stats.diamond}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              占 {((stats.diamond / stats.total) * 100).toFixed(1)}%
            </div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索会员编号 / 姓名 / 手机号 / 门店 / 导购..."
          />
        </div>

        {/* 等级过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部等级', count: MOCK_MEMBERS.length },
              ...MEMBER_TIERS.map((t) => ({
                key: t,
                label: MEMBER_TIER_MAP[t].label,
                count: MOCK_MEMBERS.filter((item) => item.tier === t).length,
              })),
            ]}
            activeKey={tierFilter}
            onChange={(key) => setTierFilter(key as MemberTier | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 状态 + 门店 + 市场 筛选栏 */}
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
                { key: 'ALL', label: '全部状态', count: tierFiltered.length },
                ...MEMBER_STATUSES.map((s) => ({
                  key: s,
                  label: MEMBER_STATUS_MAP[s].label,
                  count: tierFiltered.filter((item) => item.status === s).length,
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
              门店
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部门店', count: statusFiltered.length },
                ...ALL_STORES.map((store) => ({
                  key: store,
                  label: store,
                  count: statusFiltered.filter((item) => item.storeName === store).length,
                })),
              ]}
              activeKey={storeFilter}
              onChange={(key) => setStoreFilter(key)}
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
                { key: 'ALL', label: '全部市场', count: storeFiltered.length },
                ...ALL_MARKETS.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: storeFiltered.filter((item) => item.marketCode === mkt).length,
                })),
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
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
                    tone: (MEMBER_TIER_MAP[tierFilter].variant === 'success'
                      ? 'success'
                      : MEMBER_TIER_MAP[tierFilter].variant === 'warning'
                        ? 'warning'
                        : MEMBER_TIER_MAP[tierFilter].variant === 'danger'
                          ? 'danger'
                          : 'neutral') as FilterChip['tone'],
                    count: tierFiltered.filter(
                      (item) => item.tier === tierFilter
                    ).length,
                  },
                ]
              : []),
            ...(statusFilter !== 'ALL'
              ? [
                  {
                    key: 'status' as const,
                    label: MEMBER_STATUS_MAP[statusFilter].label,
                    tone: (MEMBER_STATUS_MAP[statusFilter].variant === 'success'
                      ? 'success'
                      : MEMBER_STATUS_MAP[statusFilter].variant === 'warning'
                        ? 'warning'
                        : MEMBER_STATUS_MAP[statusFilter].variant === 'danger'
                          ? 'danger'
                          : 'neutral') as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.status === statusFilter
                    ).length,
                  },
                ]
              : []),
            ...(storeFilter !== 'ALL'
              ? [
                  {
                    key: 'store' as const,
                    label: storeFilter,
                    tone: 'neutral' as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.storeName === storeFilter
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
                    count: storeFiltered.filter(
                      (item) => item.marketCode === marketFilter
                    ).length,
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
              case 'store':
                setStoreFilter('ALL');
                break;
              case 'market':
                setMarketFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setTierFilter('ALL');
            setStatusFilter('ALL');
            setStoreFilter('ALL');
            setMarketFilter('ALL');
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
      </PageShell>
    </main>
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
      正在加载会员列表...
    </main>
  );
}
