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

// ---- 类型定义 ----

interface StoreItem {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tenantCount: number;
  brandCount: number;
  lastDeployed: string;
  riskLevel: 'low' | 'medium' | 'high';
}

type StoreStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const STORE_STATUS_MAP: Record<StoreItem['status'], { label: string; variant: StoreStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' }
};

const RISK_LEVEL_MAP: Record<StoreItem['riskLevel'], { label: string; variant: StoreStatusVariant }> = {
  low: { label: '低', variant: 'success' },
  medium: { label: '中', variant: 'warning' },
  high: { label: '高', variant: 'danger' }
};

// ---- Mock 数据 ----

const MOCK_STORES: StoreItem[] = [
  { id: 's1', code: 'STORE-001', name: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 12, brandCount: 8, lastDeployed: '2026-06-12 14:30', riskLevel: 'low' },
  { id: 's2', code: 'STORE-002', name: '上海陆家嘴中心店', marketCode: 'cn-mainland', status: 'active', tenantCount: 9, brandCount: 6, lastDeployed: '2026-06-12 10:15', riskLevel: 'medium' },
  { id: 's3', code: 'STORE-003', name: '深圳万象天地店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-11 09:00', riskLevel: 'low' },
  { id: 's4', code: 'STORE-004', name: '成都太古里体验店', marketCode: 'cn-mainland', status: 'active', tenantCount: 6, brandCount: 4, lastDeployed: '2026-06-12 16:45', riskLevel: 'low' },
  { id: 's5', code: 'STORE-005', name: '杭州银泰旗舰店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-10 11:00', riskLevel: 'high' },
  { id: 's6', code: 'STORE-006', name: 'San Francisco Union Square', marketCode: 'us-default', status: 'active', tenantCount: 5, brandCount: 3, lastDeployed: '2026-06-12 08:30', riskLevel: 'medium' },
  { id: 's7', code: 'STORE-007', name: 'New York Fifth Avenue', marketCode: 'us-default', status: 'active', tenantCount: 8, brandCount: 5, lastDeployed: '2026-06-12 12:00', riskLevel: 'low' },
  { id: 's8', code: 'STORE-008', name: 'London Oxford Street', marketCode: 'uk-default', status: 'pending', tenantCount: 2, brandCount: 2, lastDeployed: '2026-06-11 15:20', riskLevel: 'low' },
  { id: 's9', code: 'STORE-009', name: '广州天河城店', marketCode: 'cn-mainland', status: 'inactive', tenantCount: 3, brandCount: 1, lastDeployed: '2026-06-09 18:00', riskLevel: 'medium' },
  { id: 's10', code: 'STORE-010', name: '南京德基广场店', marketCode: 'cn-mainland', status: 'active', tenantCount: 7, brandCount: 5, lastDeployed: '2026-06-12 13:45', riskLevel: 'low' },
  { id: 's11', code: 'STORE-011', name: '武汉天地旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-12 09:30', riskLevel: 'medium' },
  { id: 's12', code: 'STORE-012', name: '重庆来福士店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 1, brandCount: 1, lastDeployed: '2026-06-11 14:00', riskLevel: 'low' },
  { id: 's13', code: 'STORE-013', name: 'Seattle Downtown', marketCode: 'us-default', status: 'active', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-12 07:00', riskLevel: 'low' },
  { id: 's14', code: 'STORE-014', name: '苏州中心旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 5, brandCount: 4, lastDeployed: '2026-06-12 11:30', riskLevel: 'low' },
  { id: 's15', code: 'STORE-015', name: '西安大唐不夜城店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 2, brandCount: 1, lastDeployed: '2026-06-08 10:00', riskLevel: 'high' },
];

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: StoreItem) => void
): DataTableColumn<StoreItem>[] {
  return [
    {
      key: 'code',
      title: '门店编码',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '门店名称',
      dataKey: 'name',
      sortable: true,
      render: (item: StoreItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {item.name}
        </span>
      ),
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
      sortValue: (item: StoreItem) => item.status,
      render: (item: StoreItem) => {
        const s = STORE_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'tenantCount',
      title: '租户数',
      dataKey: 'tenantCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'brandCount',
      title: '品牌数',
      dataKey: 'brandCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'riskLevel',
      title: '风险等级',
      sortable: true,
      sortValue: (item: StoreItem) => {
        const order = { low: 0, medium: 1, high: 2 };
        return order[item.riskLevel];
      },
      render: (item: StoreItem) => {
        const r = RISK_LEVEL_MAP[item.riskLevel];
        return <StatusBadge label={r.label} variant={r.variant} size="sm" />;
      },
    },
    {
      key: 'lastDeployed',
      title: '最后部署',
      dataKey: 'lastDeployed',
      sortable: true,
    },
  ];
}

// ---- 页面组件 ----

export default function StoresPage() {
  // 搜索过滤
  const searchFields = useMemo<(keyof StoreItem)[]>(() => ['code', 'name', 'marketCode'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_STORES, searchFields);

    // 状态筛选
  const [statusFilter, setStatusFilter] = useState<StoreItem['status'] | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? filteredItems : filteredItems.filter((item) => item.status === statusFilter)),
    [filteredItems, statusFilter]
  );

  // 市场筛选
  const allMarkets = useMemo(() => [...new Set(MOCK_STORES.map((s) => s.marketCode))], []);
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () => (marketFilter === 'ALL' ? statusFiltered : statusFiltered.filter((item) => item.marketCode === marketFilter)),
    [statusFiltered, marketFilter]
  );

  // 风险等级筛选
  const [riskFilter, setRiskFilter] = useState<StoreItem['riskLevel'] | 'ALL'>('ALL');
  const riskFiltered = useMemo(
    () => (riskFilter === 'ALL' ? marketFiltered : marketFiltered.filter((item) => item.riskLevel === riskFilter)),
    [marketFiltered, riskFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: StoreItem) => {
    window.location.href = `/stores/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(riskFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, marketFilter, riskFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => ({
    total: MOCK_STORES.length,
    active: MOCK_STORES.filter((s) => s.status === 'active').length,
    highRisk: MOCK_STORES.filter((s) => s.riskLevel === 'high').length,
  }), []);

  const { actions } = useDetailActions({
    workspace: 'stores',
    detailId: 'overview',
    record: { items: sortedItems, statusFilter, marketFilter, riskFilter, stats },
    shareTitle: '门店管理中心',
    shareText: '查看门店 / 市场 / 风险等级筛选结果'
  });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="门店管理中心"
        subtitle="统一管理所有市场下的门店运营状态、租户品牌关联及风险等级。"
      >
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>门店总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>覆盖 cn-mainland / us-default / uk-default</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>运营中</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{stats.active}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{((stats.active / stats.total) * 100).toFixed(0)}% 健康率</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>高风险门店</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>{stats.highRisk}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>需重点关注</div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索门店编码 / 名称 / 市场..."
          />
        </div>

        {/* 状态过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_STORES.length },
              ...(['active', 'pending', 'inactive', 'suspended'] as const).map((s) => ({
                key: s,
                label: STORE_STATUS_MAP[s]?.label ?? s,
                count: MOCK_STORES.filter((item) => item.status === s).length
              }))
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as StoreItem['status'] | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 市场筛选 + 风险等级筛选栏 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>市场</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...allMarkets.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: statusFiltered.filter((item) => item.marketCode === mkt).length
                }))
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>风险等级</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                ...(['low', 'medium', 'high'] as const).map((r) => ({
                  key: r,
                  label: RISK_LEVEL_MAP[r].label,
                  count: marketFiltered.filter((item) => item.riskLevel === r).length
                }))
              ]}
              activeKey={riskFilter}
              onChange={(key) => setRiskFilter(key as StoreItem['riskLevel'] | 'ALL')}
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
              ? [{ key: 'status' as const, label: STORE_STATUS_MAP[statusFilter]?.label ?? statusFilter, tone: (STORE_STATUS_MAP[statusFilter]?.variant === 'success' ? 'success' : STORE_STATUS_MAP[statusFilter]?.variant === 'warning' ? 'warning' : STORE_STATUS_MAP[statusFilter]?.variant === 'danger' ? 'danger' : 'neutral') as FilterChip['tone'], count: statusFiltered.filter((item) => item.status === statusFilter).length }]
              : []),
            ...(marketFilter !== 'ALL'
              ? [{ key: 'market' as const, label: marketFilter, tone: 'neutral' as FilterChip['tone'], count: statusFiltered.filter((item) => item.marketCode === marketFilter).length }]
              : []),
            ...(riskFilter !== 'ALL'
              ? [{ key: 'risk' as const, label: RISK_LEVEL_MAP[riskFilter].label, tone: (RISK_LEVEL_MAP[riskFilter].variant === 'danger' ? 'danger' : RISK_LEVEL_MAP[riskFilter].variant === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'], count: marketFiltered.filter((item) => item.riskLevel === riskFilter).length }]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'status': setStatusFilter('ALL'); break;
              case 'market': setMarketFilter('ALL'); break;
              case 'risk': setRiskFilter('ALL'); break;
            }
          }}
          onClearAll={() => { setStatusFilter('ALL'); setMarketFilter('ALL'); setRiskFilter('ALL'); }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`门店列表（匹配 ${sortedItems.length} 条）`}
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
          caption="复制 / 导出 / 分享当前门店管理中心筛选快照"
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
