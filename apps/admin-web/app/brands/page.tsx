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
  type DataTableSortConfig
} from '@m5/ui';

import { useDetailActions } from '../components/use-detail-actions';
import {
  type BrandItem,
  MOCK_BRANDS,
  BRAND_STATUS_MAP,
  BRAND_TIER_MAP,
  getBrandUniqueMarkets,
  computeBrandStats,
} from '../brands-data';

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: BrandItem) => void
): DataTableColumn<BrandItem>[] {
  return [
    {
      key: 'code',
      title: '品牌编码',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '品牌名称',
      dataKey: 'name',
      sortable: true,
      render: (item: BrandItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'tier',
      title: '品牌等级',
      sortable: true,
      render: (item: BrandItem) => {
        const t = BRAND_TIER_MAP[item.tier];
        return <StatusBadge label={t.label} variant={t.variant} size="sm" />;
      },
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
      sortValue: (item: BrandItem) => item.status,
      render: (item: BrandItem) => {
        const s = BRAND_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
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
      key: 'tenantCount',
      title: '租户数',
      dataKey: 'tenantCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'lastDeployed',
      title: '最后部署',
      dataKey: 'lastDeployed',
      sortable: true,
    },
  ];
}

// ---- 页面 ----

export default function BrandsPage() {
  const searchFields = useMemo<(keyof BrandItem)[]>(() => ['code', 'name', 'marketCode'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_BRANDS, searchFields);

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<BrandItem['status'] | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? filteredItems : filteredItems.filter((item) => item.status === statusFilter)),
    [filteredItems, statusFilter]
  );

  // 品牌等级筛选
  const [tierFilter, setTierFilter] = useState<BrandItem['tier'] | 'ALL'>('ALL');
  const tierFiltered = useMemo(
    () => (tierFilter === 'ALL' ? statusFiltered : statusFiltered.filter((item) => item.tier === tierFilter)),
    [statusFiltered, tierFilter]
  );

  // 市场筛选
  const allMarkets = useMemo(() => getBrandUniqueMarkets(MOCK_BRANDS), []);
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () => (marketFilter === 'ALL' ? tierFiltered : tierFiltered.filter((item) => item.marketCode === marketFilter)),
    [tierFiltered, marketFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: BrandItem) => {
    window.location.href = `/brands/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(marketFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, tierFilter, marketFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => computeBrandStats(MOCK_BRANDS), []);

  const { actions } = useDetailActions({
    workspace: 'brands',
    detailId: 'overview',
    record: { items: sortedItems, statusFilter, tierFilter, marketFilter, stats },
    shareTitle: '品牌管理中心',
    shareText: '查看品牌 / 状态 / 等级 / 市场筛选结果'
  });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="品牌管理中心"
        subtitle="统一管理所有市场下的品牌运营状态、门店关联与等级分类。"
      >
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>品牌总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>覆盖 cn-mainland / us-default / uk-default</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>运营中</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{stats.active}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{((stats.active / stats.total) * 100).toFixed(0)}% 健康率</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>旗舰品牌</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f0abfc' }}>{stats.premium}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>最高等级品牌</div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索品牌编码 / 名称 / 市场..."
          />
        </div>

        {/* 状态过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_BRANDS.length },
              ...(['active', 'pending', 'inactive', 'suspended'] as const).map((s) => ({
                key: s,
                label: BRAND_STATUS_MAP[s]?.label ?? s,
                count: MOCK_BRANDS.filter((item) => item.status === s).length
              }))
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as BrandItem['status'] | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 等级 + 市场筛选栏 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>品牌等级</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...(['premium', 'standard', 'basic'] as const).map((t) => ({
                  key: t,
                  label: BRAND_TIER_MAP[t].label,
                  count: statusFiltered.filter((item) => item.tier === t).length
                }))
              ]}
              activeKey={tierFilter}
              onChange={(key) => setTierFilter(key as BrandItem['tier'] | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>市场</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: tierFiltered.length },
                ...allMarkets.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: tierFiltered.filter((item) => item.marketCode === mkt).length
                }))
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃过滤条件可视化 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(statusFilter !== 'ALL'
              ? [{ key: 'status', label: `${BRAND_STATUS_MAP[statusFilter]?.label ?? statusFilter}`, tone: (BRAND_STATUS_MAP[statusFilter]?.variant === 'success' ? 'success' : BRAND_STATUS_MAP[statusFilter]?.variant === 'warning' ? 'warning' : BRAND_STATUS_MAP[statusFilter]?.variant === 'danger' ? 'danger' : 'neutral') as FilterChip['tone'], count: statusFiltered.filter((item) => item.status === statusFilter).length }]
              : []),
            ...(tierFilter !== 'ALL'
              ? [{ key: 'tier', label: BRAND_TIER_MAP[tierFilter].label, tone: (BRAND_TIER_MAP[tierFilter].variant === 'success' ? 'success' : BRAND_TIER_MAP[tierFilter].variant === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'], count: statusFiltered.filter((item) => item.tier === tierFilter).length }]
              : []),
            ...(marketFilter !== 'ALL'
              ? [{ key: 'market', label: marketFilter, tone: 'neutral' as FilterChip['tone'], count: tierFiltered.filter((item) => item.marketCode === marketFilter).length }]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'status': setStatusFilter('ALL'); break;
              case 'tier': setTierFilter('ALL'); break;
              case 'market': setMarketFilter('ALL'); break;
            }
          }}
          onClearAll={() => { setStatusFilter('ALL'); setTierFilter('ALL'); setMarketFilter('ALL'); }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`品牌列表（匹配 ${sortedItems.length} 条）`}
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
          caption="复制 / 导出 / 分享当前品牌管理中心筛选快照"
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