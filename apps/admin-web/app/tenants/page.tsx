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
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig
} from '@m5/ui';

import { useDetailActions } from '../components/use-detail-actions';

// ---- 类型定义 ----

interface TenantItem {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  storeCount: number;
  brandCount: number;
  adminCount: number;
  lastDeployed: string;
  plan: 'enterprise' | 'professional' | 'starter';
  billingMode: 'monthly' | 'yearly';
}

type StatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const STATUS_MAP: Record<TenantItem['status'], { label: string; variant: StatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

const PLAN_MAP: Record<TenantItem['plan'], { label: string; variant: StatusVariant }> = {
  enterprise: { label: '企业版', variant: 'success' },
  professional: { label: '专业版', variant: 'neutral' },
  starter: { label: '入门版', variant: 'warning' },
};

const BILLING_MAP: Record<TenantItem['billingMode'], string> = {
  monthly: '月付',
  yearly: '年付',
};

// ---- Mock 数据 ----

const MOCK_TENANTS: TenantItem[] = [
  { id: 't1', code: 'TNT-001', name: '华润万象生活', marketCode: 'cn-mainland', status: 'active', storeCount: 5, brandCount: 3, adminCount: 12, lastDeployed: '2026-06-12 14:30', plan: 'enterprise', billingMode: 'yearly' },
  { id: 't2', code: 'TNT-002', name: '龙湖集团', marketCode: 'cn-mainland', status: 'active', storeCount: 4, brandCount: 2, adminCount: 8, lastDeployed: '2026-06-12 10:15', plan: 'enterprise', billingMode: 'yearly' },
  { id: 't3', code: 'TNT-003', name: '大悦城控股', marketCode: 'cn-mainland', status: 'active', storeCount: 3, brandCount: 2, adminCount: 6, lastDeployed: '2026-06-11 09:00', plan: 'professional', billingMode: 'monthly' },
  { id: 't4', code: 'TNT-004', name: '太古地产', marketCode: 'cn-mainland', status: 'pending', storeCount: 1, brandCount: 1, adminCount: 3, lastDeployed: '2026-06-11 15:20', plan: 'starter', billingMode: 'monthly' },
  { id: 't5', code: 'TNT-005', name: '恒隆地产', marketCode: 'cn-mainland', status: 'suspended', storeCount: 2, brandCount: 1, adminCount: 4, lastDeployed: '2026-06-10 11:00', plan: 'professional', billingMode: 'yearly' },
  { id: 't6', code: 'TNT-006', name: 'Westfield Corp', marketCode: 'us-default', status: 'active', storeCount: 6, brandCount: 4, adminCount: 15, lastDeployed: '2026-06-12 08:30', plan: 'enterprise', billingMode: 'yearly' },
  { id: 't7', code: 'TNT-007', name: 'Simon Property Group', marketCode: 'us-default', status: 'active', storeCount: 4, brandCount: 3, adminCount: 10, lastDeployed: '2026-06-12 12:00', plan: 'enterprise', billingMode: 'monthly' },
  { id: 't8', code: 'TNT-008', name: 'Hammerson Plc', marketCode: 'uk-default', status: 'pending', storeCount: 1, brandCount: 1, adminCount: 2, lastDeployed: '2026-06-11 14:00', plan: 'starter', billingMode: 'monthly' },
  { id: 't9', code: 'TNT-009', name: '万达集团', marketCode: 'cn-mainland', status: 'active', storeCount: 8, brandCount: 5, adminCount: 18, lastDeployed: '2026-06-12 16:45', plan: 'enterprise', billingMode: 'yearly' },
  { id: 't10', code: 'TNT-010', name: '新鸿基地产', marketCode: 'cn-mainland', status: 'active', storeCount: 3, brandCount: 2, adminCount: 7, lastDeployed: '2026-06-12 13:45', plan: 'professional', billingMode: 'yearly' },
  { id: 't11', code: 'TNT-011', name: '万科印力', marketCode: 'cn-mainland', status: 'active', storeCount: 5, brandCount: 3, adminCount: 9, lastDeployed: '2026-06-12 09:30', plan: 'professional', billingMode: 'monthly' },
  { id: 't12', code: 'TNT-012', name: '新城控股', marketCode: 'cn-mainland', status: 'pending', storeCount: 2, brandCount: 1, adminCount: 3, lastDeployed: '2026-06-11 14:00', plan: 'starter', billingMode: 'monthly' },
  { id: 't13', code: 'TNT-013', name: 'Brookfield Properties', marketCode: 'us-default', status: 'active', storeCount: 3, brandCount: 2, adminCount: 8, lastDeployed: '2026-06-12 07:00', plan: 'professional', billingMode: 'yearly' },
  { id: 't14', code: 'TNT-014', name: 'Landsec Group', marketCode: 'uk-default', status: 'inactive', storeCount: 1, brandCount: 1, adminCount: 2, lastDeployed: '2026-06-09 18:00', plan: 'starter', billingMode: 'monthly' },
  { id: 't15', code: 'TNT-015', name: '银泰商业', marketCode: 'cn-mainland', status: 'active', storeCount: 4, brandCount: 3, adminCount: 8, lastDeployed: '2026-06-12 11:30', plan: 'enterprise', billingMode: 'yearly' },
];

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: TenantItem) => void
): DataTableColumn<TenantItem>[] {
  return [
    {
      key: 'code',
      title: '租户编码',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '租户名称',
      dataKey: 'name',
      sortable: true,
      render: (item: TenantItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'plan',
      title: '套餐',
      sortable: true,
      render: (item: TenantItem) => {
        const p = PLAN_MAP[item.plan];
        return <StatusBadge label={p.label} variant={p.variant} size="sm" />;
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
      sortValue: (item: TenantItem) => item.status,
      render: (item: TenantItem) => {
        const s = STATUS_MAP[item.status];
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
      key: 'brandCount',
      title: '品牌数',
      dataKey: 'brandCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'adminCount',
      title: '管理员数',
      dataKey: 'adminCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'billingMode',
      title: '计费方式',
      sortable: true,
      sortValue: (item: TenantItem) => item.billingMode,
      render: (item: TenantItem) => (
        <span style={{ fontSize: 13, color: '#cbd5e1' }}>{BILLING_MAP[item.billingMode]}</span>
      ),
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

export default function TenantsPage() {
  // 搜索过滤
  const searchFields = useMemo<(keyof TenantItem)[]>(() => ['code', 'name', 'marketCode'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_TENANTS, searchFields);

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<TenantItem['status'] | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? filteredItems : filteredItems.filter((item) => item.status === statusFilter)),
    [filteredItems, statusFilter]
  );

  // 套餐筛选
  const [planFilter, setPlanFilter] = useState<TenantItem['plan'] | 'ALL'>('ALL');
  const planFiltered = useMemo(
    () => (planFilter === 'ALL' ? statusFiltered : statusFiltered.filter((item) => item.plan === planFilter)),
    [statusFiltered, planFilter]
  );

  // 市场筛选
  const allMarkets = useMemo(() => [...new Set(MOCK_TENANTS.map((t) => t.marketCode))], []);
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () => (marketFilter === 'ALL' ? planFiltered : planFiltered.filter((item) => item.marketCode === marketFilter)),
    [planFiltered, marketFilter]
  );

  // 计费方式筛选
  const [billingFilter, setBillingFilter] = useState<TenantItem['billingMode'] | 'ALL'>('ALL');
  const billingFiltered = useMemo(
    () => (billingFilter === 'ALL' ? marketFiltered : marketFiltered.filter((item) => item.billingMode === billingFilter)),
    [marketFiltered, billingFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: TenantItem) => {
    window.location.href = `/tenants/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(billingFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, planFilter, marketFilter, billingFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => ({
    total: MOCK_TENANTS.length,
    active: MOCK_TENANTS.filter((t) => t.status === 'active').length,
    enterprise: MOCK_TENANTS.filter((t) => t.plan === 'enterprise').length,
  }), []);

  const { actions } = useDetailActions({
    workspace: 'tenants',
    detailId: 'overview',
    record: { items: sortedItems, statusFilter, planFilter, stats },
    shareTitle: '租户管理中心',
    shareText: '查看租户 / 状态 / 套餐筛选结果'
  });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="租户管理中心"
        subtitle="统一管理所有市场下的租户，包括套餐、门店品牌关联、计费方式与管理配置。"
      >
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>租户总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>覆盖 cn-mainland / us-default / uk-default</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>运营中</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{stats.active}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{((stats.active / stats.total) * 100).toFixed(0)}% 健康率</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>企业版</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f0abfc' }}>{stats.enterprise}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>最高套餐等级</div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索租户编码 / 名称 / 市场..."
          />
        </div>

        {/* 状态过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_TENANTS.length },
              ...(['active', 'pending', 'inactive', 'suspended'] as const).map((s) => ({
                key: s,
                label: STATUS_MAP[s]?.label ?? s,
                count: MOCK_TENANTS.filter((item) => item.status === s).length
              }))
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as TenantItem['status'] | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 套餐 + 市场 + 计费方式 筛选栏 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>套餐</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...(['enterprise', 'professional', 'starter'] as const).map((p) => ({
                  key: p,
                  label: PLAN_MAP[p].label,
                  count: statusFiltered.filter((item) => item.plan === p).length
                }))
              ]}
              activeKey={planFilter}
              onChange={(key) => setPlanFilter(key as TenantItem['plan'] | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>市场</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: planFiltered.length },
                ...allMarkets.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: planFiltered.filter((item) => item.marketCode === mkt).length
                }))
              ]}
              activeKey={marketFilter}
              onChange={(key) => setMarketFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>计费方式</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                ...(['monthly', 'yearly'] as const).map((b) => ({
                  key: b,
                  label: BILLING_MAP[b],
                  count: marketFiltered.filter((item) => item.billingMode === b).length
                }))
              ]}
              activeKey={billingFilter}
              onChange={(key) => setBillingFilter(key as TenantItem['billingMode'] | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 数据表格 */}
        <DataTable
          title={`租户列表（匹配 ${sortedItems.length} 条）`}
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
          caption="复制 / 导出 / 分享当前租户管理中心筛选快照"
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
