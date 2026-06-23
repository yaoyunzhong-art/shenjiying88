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

import { useDetailActions } from '../components/use-detail-actions';

import {
  MOCK_STAFF,
  STAFF_STATUS_MAP,
  STAFF_ROLE_MAP,
  STAFF_STATUSES,
  STAFF_ROLES,
  type StaffItem,
  type StaffStatus,
  type StaffRole,
} from '../staff-data';

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: StaffItem) => void
): DataTableColumn<StaffItem>[] {
  return [
    {
      key: 'code',
      title: '员工编号',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '姓名',
      dataKey: 'name',
      sortable: true,
      render: (item: StaffItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'role',
      title: '岗位',
      sortable: true,
      sortValue: (item: StaffItem) => item.role,
      render: (item: StaffItem) => {
        const r = STAFF_ROLE_MAP[item.role];
        return <StatusBadge label={r.label} variant={r.variant} size="sm" />;
      },
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
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: StaffItem) => item.status,
      render: (item: StaffItem) => {
        const s = STAFF_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'phone',
      title: '手机号',
      dataKey: 'phone',
      sortable: true,
    },
    {
      key: 'hiredAt',
      title: '入职日期',
      dataKey: 'hiredAt',
      sortable: true,
    },
    {
      key: 'lastActiveAt',
      title: '最后活跃',
      dataKey: 'lastActiveAt',
      sortable: true,
    },
    {
      key: 'performanceScore',
      title: '绩效评分',
      dataKey: 'performanceScore',
      sortable: true,
      align: 'right',
      render: (item: StaffItem) => {
        const color =
          item.performanceScore >= 85
            ? '#4ade80'
            : item.performanceScore >= 70
              ? '#fbbf24'
              : '#f87171';
        return (
          <span style={{ fontWeight: 600, color }}>
            {item.performanceScore}
          </span>
        );
      },
    },
  ];
}

// ---- 性能分色 ----

function perfColor(score: number): string {
  if (score >= 85) return '#4ade80';
  if (score >= 70) return '#fbbf24';
  return '#f87171';
}

// ---- 页面组件 ----

export default function StaffPage() {
  // 搜索过滤
  const searchFields = useMemo<(keyof StaffItem)[]>(
    () => ['code', 'name', 'storeName', 'email'],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_STAFF,
    searchFields
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter]
  );

  // 角色筛选
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'ALL'>('ALL');
  const roleFiltered = useMemo(
    () =>
      roleFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.role === roleFilter),
    [statusFiltered, roleFilter]
  );

  // 市场筛选
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? roleFiltered
        : roleFiltered.filter((item) => item.marketCode === marketFilter),
    [roleFiltered, marketFilter]
  );

  // 绩效筛选
  type PerfRange = 'ALL' | 'excellent' | 'good' | 'needs_improve';
  const [perfFilter, setPerfFilter] = useState<PerfRange>('ALL');
  const perfFiltered = useMemo(
    () =>
      perfFilter === 'ALL'
        ? marketFiltered
        : perfFilter === 'excellent'
          ? marketFiltered.filter((item) => item.performanceScore >= 85)
          : perfFilter === 'good'
            ? marketFiltered.filter(
                (item) =>
                  item.performanceScore >= 70 && item.performanceScore < 85
              )
            : marketFiltered.filter((item) => item.performanceScore < 70),
    [marketFiltered, perfFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: StaffItem) => {
    window.location.href = `/staff/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(perfFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, statusFilter, roleFilter, marketFilter, perfFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const allMarkets = useMemo(
    () => [...new Set(MOCK_STAFF.map((s) => s.marketCode))].sort(),
    []
  );
  const stats = useMemo(
    () => ({
      total: MOCK_STAFF.length,
      active: MOCK_STAFF.filter((s) => s.status === 'active').length,
      topPerf: MOCK_STAFF.filter((s) => s.performanceScore >= 85).length,
      avgPerf: (
        MOCK_STAFF.reduce((sum, s) => sum + s.performanceScore, 0) /
        MOCK_STAFF.length
      ).toFixed(1),
    }),
    []
  );

  const { actions } = useDetailActions({
    workspace: 'staff',
    detailId: 'overview',
    record: { items: sortedItems, statusFilter, roleFilter, marketFilter, perfFilter, stats },
    shareTitle: '员工管理中心',
    shareText: '查看员工 / 状态 / 角色 / 市场 / 绩效筛选结果'
  });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="员工管理中心"
        subtitle="统一管理所有门店的员工信息，包括岗位角色、在职状态、绩效考核与活跃度。"
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
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>员工总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>
              {stats.total}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              覆盖 {allMarkets.length} 个市场
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>在职员工</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}
            >
              {stats.active}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {((stats.active / stats.total) * 100).toFixed(0)}% 在职率
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>高绩效</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f0abfc' }}
            >
              {stats.topPerf}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              评分 ≥ 85
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均绩效</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: perfColor(Number(stats.avgPerf)),
              }}
            >
              {stats.avgPerf}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              满分 100
            </div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索员工编号 / 姓名 / 门店 / 邮箱..."
          />
        </div>

        {/* 状态过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_STAFF.length },
              ...STAFF_STATUSES.map((s) => ({
                key: s,
                label: STAFF_STATUS_MAP[s].label,
                count: MOCK_STAFF.filter((item) => item.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) =>
              setStatusFilter(key as StaffStatus | 'ALL')
            }
            variant="pills"
            size="sm"
          />
        </div>

        {/* 角色 + 市场 + 绩效 筛选栏 */}
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
              角色
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...STAFF_ROLES.map((r) => ({
                  key: r,
                  label: STAFF_ROLE_MAP[r].label,
                  count: statusFiltered.filter((item) => item.role === r).length,
                })),
              ]}
              activeKey={roleFilter}
              onChange={(key) => setRoleFilter(key as StaffRole | 'ALL')}
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
                { key: 'ALL', label: '全部', count: roleFiltered.length },
                ...allMarkets.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: roleFiltered.filter(
                    (item) => item.marketCode === mkt
                  ).length,
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
              绩效
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                {
                  key: 'excellent',
                  label: '优秀',
                  count: marketFiltered.filter(
                    (item) => item.performanceScore >= 85
                  ).length,
                },
                {
                  key: 'good',
                  label: '良好',
                  count: marketFiltered.filter(
                    (item) =>
                      item.performanceScore >= 70 &&
                      item.performanceScore < 85
                  ).length,
                },
                {
                  key: 'needs_improve',
                  label: '待提升',
                  count: marketFiltered.filter(
                    (item) => item.performanceScore < 70
                  ).length,
                },
              ]}
              activeKey={perfFilter}
              onChange={(key) => setPerfFilter(key as PerfRange)}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃过滤条件 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(statusFilter !== 'ALL'
              ? [
                  {
                    key: 'status' as const,
                    label: STAFF_STATUS_MAP[statusFilter].label,
                    tone: (STAFF_STATUS_MAP[statusFilter].variant === 'success'
                      ? 'success'
                      : STAFF_STATUS_MAP[statusFilter].variant === 'warning'
                        ? 'warning'
                        : STAFF_STATUS_MAP[statusFilter].variant === 'danger'
                          ? 'danger'
                          : 'neutral') as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.status === statusFilter
                    ).length,
                  },
                ]
              : []),
            ...(roleFilter !== 'ALL'
              ? [
                  {
                    key: 'role' as const,
                    label: STAFF_ROLE_MAP[roleFilter].label,
                    tone: 'neutral' as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.role === roleFilter
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
                    count: roleFiltered.filter(
                      (item) => item.marketCode === marketFilter
                    ).length,
                  },
                ]
              : []),
            ...(perfFilter !== 'ALL'
              ? [
                  {
                    key: 'perf' as const,
                    label:
                      perfFilter === 'excellent'
                        ? '优秀'
                        : perfFilter === 'good'
                          ? '良好'
                          : '待提升',
                    tone:
                      perfFilter === 'excellent'
                        ? ('success' as FilterChip['tone'])
                        : perfFilter === 'good'
                          ? ('warning' as FilterChip['tone'])
                          : ('danger' as FilterChip['tone']),
                    count: marketFiltered.filter((item) => {
                      if (perfFilter === 'excellent')
                        return item.performanceScore >= 85;
                      if (perfFilter === 'good')
                        return (
                          item.performanceScore >= 70 &&
                          item.performanceScore < 85
                        );
                      return item.performanceScore < 70;
                    }).length,
                  },
                ]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'status':
                setStatusFilter('ALL');
                break;
              case 'role':
                setRoleFilter('ALL');
                break;
              case 'market':
                setMarketFilter('ALL');
                break;
              case 'perf':
                setPerfFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setStatusFilter('ALL');
            setRoleFilter('ALL');
            setMarketFilter('ALL');
            setPerfFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`员工列表（匹配 ${sortedItems.length} 条）`}
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
          caption="复制 / 导出 / 分享当前员工管理中心筛选快照"
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
