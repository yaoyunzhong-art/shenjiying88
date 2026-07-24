'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  QuickStats,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig
} from '@m5/ui';

import { AdminPermissionGate } from '../components/admin-permission-gate';
import { useDetailActions } from '../components/use-detail-actions';

// ---- 类型定义 ----

interface MarketItem {
  id: string;
  code: string;
  name: string;
  locale: string;
  currency: string;
  timezone: string;
  status: 'active' | 'inactive' | 'pending';
  tenantCount: number;
  brandCount: number;
  storeCount: number;
  lastDeployed: string;
  region: 'asia-pacific' | 'north-america' | 'europe' | 'middle-east' | 'latin-america';
}

type MarketStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const STATUS_MAP: Record<MarketItem['status'], { label: string; variant: MarketStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
};

const REGION_MAP: Record<MarketItem['region'], { label: string; variant: MarketStatusVariant }> = {
  'asia-pacific': { label: '亚太', variant: 'success' },
  'north-america': { label: '北美', variant: 'neutral' },
  'europe': { label: '欧洲', variant: 'warning' },
  'middle-east': { label: '中东', variant: 'danger' },
  'latin-america': { label: '拉美', variant: 'neutral' },
};

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '市场管理中心访问受限',
  description:
    '市场管理中心已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看全球市场分布、区域筛选结果与部署概览。',
} as const;

// ---- Mock 数据 ----

const MOCK_MARKETS: MarketItem[] = [
  { id: 'm1', code: 'cn-mainland', name: '中国大陆', locale: 'zh-CN', currency: 'CNY', timezone: 'Asia/Shanghai', status: 'active', tenantCount: 8, brandCount: 7, storeCount: 12, lastDeployed: '2026-06-12 14:30', region: 'asia-pacific' },
  { id: 'm2', code: 'cn-hk', name: '中国香港', locale: 'zh-HK', currency: 'HKD', timezone: 'Asia/Hong_Kong', status: 'active', tenantCount: 3, brandCount: 2, storeCount: 4, lastDeployed: '2026-06-12 10:15', region: 'asia-pacific' },
  { id: 'm3', code: 'us-default', name: '美国', locale: 'en-US', currency: 'USD', timezone: 'America/New_York', status: 'active', tenantCount: 5, brandCount: 4, storeCount: 6, lastDeployed: '2026-06-12 08:30', region: 'north-america' },
  { id: 'm4', code: 'uk-default', name: '英国', locale: 'en-GB', currency: 'GBP', timezone: 'Europe/London', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 2, lastDeployed: '2026-06-11 15:20', region: 'europe' },
  { id: 'm5', code: 'jp-default', name: '日本', locale: 'ja-JP', currency: 'JPY', timezone: 'Asia/Tokyo', status: 'pending', tenantCount: 2, brandCount: 1, storeCount: 2, lastDeployed: '2026-06-11 09:00', region: 'asia-pacific' },
  { id: 'm6', code: 'kr-default', name: '韩国', locale: 'ko-KR', currency: 'KRW', timezone: 'Asia/Seoul', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-10 11:00', region: 'asia-pacific' },
  { id: 'm7', code: 'sg-default', name: '新加坡', locale: 'en-SG', currency: 'SGD', timezone: 'Asia/Singapore', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 3, lastDeployed: '2026-06-12 16:45', region: 'asia-pacific' },
  { id: 'm8', code: 'de-default', name: '德国', locale: 'de-DE', currency: 'EUR', timezone: 'Europe/Berlin', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-10 14:00', region: 'europe' },
  { id: 'm9', code: 'fr-default', name: '法国', locale: 'fr-FR', currency: 'EUR', timezone: 'Europe/Paris', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-09 18:00', region: 'europe' },
  { id: 'm10', code: 'ae-default', name: '阿联酋', locale: 'ar-AE', currency: 'AED', timezone: 'Asia/Dubai', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'middle-east' },
  { id: 'm11', code: 'au-default', name: '澳大利亚', locale: 'en-AU', currency: 'AUD', timezone: 'Australia/Sydney', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 2, lastDeployed: '2026-06-12 13:45', region: 'asia-pacific' },
  { id: 'm12', code: 'br-default', name: '巴西', locale: 'pt-BR', currency: 'BRL', timezone: 'America/Sao_Paulo', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'latin-america' },
  { id: 'm13', code: 'ca-default', name: '加拿大', locale: 'en-CA', currency: 'CAD', timezone: 'America/Toronto', status: 'active', tenantCount: 2, brandCount: 1, storeCount: 2, lastDeployed: '2026-06-12 09:30', region: 'north-america' },
  { id: 'm14', code: 'th-default', name: '泰国', locale: 'th-TH', currency: 'THB', timezone: 'Asia/Bangkok', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-11 14:00', region: 'asia-pacific' },
  { id: 'm15', code: 'in-default', name: '印度', locale: 'hi-IN', currency: 'INR', timezone: 'Asia/Kolkata', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'asia-pacific' },
];

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: MarketItem) => void
): DataTableColumn<MarketItem>[] {
  return [
    {
      key: 'code',
      title: '市场编码',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'name',
      title: '市场名称',
      dataKey: 'name',
      sortable: true,
      render: (item: MarketItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'region',
      title: '区域',
      sortable: true,
      render: (item: MarketItem) => {
        const r = REGION_MAP[item.region];
        return <StatusBadge label={r.label} variant={r.variant} size="sm" />;
      },
    },
    {
      key: 'locale',
      title: '语言',
      dataKey: 'locale',
      sortable: true,
    },
    {
      key: 'currency',
      title: '货币',
      dataKey: 'currency',
      sortable: true,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: MarketItem) => item.status,
      render: (item: MarketItem) => {
        const s = STATUS_MAP[item.status];
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
      key: 'storeCount',
      title: '门店数',
      dataKey: 'storeCount',
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

// ---- 页面组件 ----

export default function MarketsPage() {
  // 三态条件渲染
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setLoading(false) }, []);
  if (loading) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>加载中...</div>
      </AdminPermissionGate>
    );
  }
  if (error) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>数据获取失败: {error}</div>
      </AdminPermissionGate>
    );
  }
  if (!MOCK_MARKETS || MOCK_MARKETS.length === 0) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div>暂无数据</div>
      </AdminPermissionGate>
    );
  }

  // 搜索过滤
  const searchFields = useMemo<(keyof MarketItem)[]>(() => ['code', 'name', 'region', 'currency', 'timezone'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_MARKETS, searchFields);

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<MarketItem['status'] | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? filteredItems : filteredItems.filter((item) => item.status === statusFilter)),
    [filteredItems, statusFilter]
  );

  // 区域筛选
  const [regionFilter, setRegionFilter] = useState<MarketItem['region'] | 'ALL'>('ALL');
  const regionFiltered = useMemo(
    () => (regionFilter === 'ALL' ? statusFiltered : statusFiltered.filter((item) => item.region === regionFilter)),
    [statusFiltered, regionFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: MarketItem) => {
    window.location.href = `/markets/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(regionFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, regionFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => ({
    total: MOCK_MARKETS.length,
    active: MOCK_MARKETS.filter((m) => m.status === 'active').length,
    regionCount: new Set(MOCK_MARKETS.map((m) => m.region)).size,
    deployed: MOCK_MARKETS.reduce((sum, m) => sum + m.tenantCount + m.brandCount + m.storeCount, 0),
  }), []);

  const { actions } = useDetailActions({
    workspace: 'markets',
    detailId: 'overview',
    record: { items: sortedItems, statusFilter, regionFilter, stats },
    shareTitle: '市场管理中心',
    shareText: '查看市场 / 状态 / 区域筛选结果'
  });

  const regionTabItems = useMemo(() => {
    const entries = Object.entries(REGION_MAP) as Array<[MarketItem['region'], { label: string; variant: MarketStatusVariant }]>;
    return [
      { key: 'ALL' as const, label: '全部', count: statusFiltered.length },
      ...entries.map(([key, info]) => ({
        key,
        label: info.label,
        count: statusFiltered.filter((item) => item.region === key).length,
      })),
    ];
  }, [statusFiltered]);

  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="市场管理中心"
          subtitle="统一管理全球市场配置，包括语言、货币、时区和区域覆盖。支持多区域扩展与本地化部署。"
        >
        {/* 统计卡片 */}
        <QuickStats
          items={[
            { label: '市场总数', value: stats.total, helper: `${stats.regionCount} 个区域` },
            { label: '运营中', value: stats.active, valueColor: '#4ade80', helper: `${((stats.active / stats.total) * 100).toFixed(0)}% 激活率` },
            { label: '待激活', value: stats.total - stats.active, valueColor: '#fbbf24', helper: '可扩展市场' },
            { label: '已部署资源', value: stats.deployed, valueColor: '#93c5fd', helper: '租户 + 品牌 + 门店' },
          ]}
        />

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索市场编码 / 名称 / 区域 / 货币..."
          />
        </div>

        {/* 状态过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_MARKETS.length },
              ...(['active', 'pending', 'inactive'] as const).map((s) => ({
                key: s,
                label: STATUS_MAP[s]?.label ?? s,
                count: MOCK_MARKETS.filter((item) => item.status === s).length
              }))
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as MarketItem['status'] | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 区域筛选栏 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>区域筛选</div>
          <Tabs
            items={regionTabItems}
            activeKey={regionFilter}
            onChange={(key) => setRegionFilter(key as MarketItem['region'] | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 活跃过滤条件可视化 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(statusFilter !== 'ALL'
              ? [{ key: 'status' as const, label: STATUS_MAP[statusFilter]?.label ?? statusFilter, tone: (STATUS_MAP[statusFilter]?.variant === 'success' ? 'success' : STATUS_MAP[statusFilter]?.variant === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'], count: filteredItems.filter((item) => item.status === statusFilter).length }]
              : []),
            ...(regionFilter !== 'ALL'
              ? [{ key: 'region' as const, label: REGION_MAP[regionFilter].label, tone: (REGION_MAP[regionFilter].variant === 'success' ? 'success' : REGION_MAP[regionFilter].variant === 'danger' ? 'danger' : 'neutral') as FilterChip['tone'], count: statusFiltered.filter((item) => item.region === regionFilter).length }]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'status': setStatusFilter('ALL'); break;
              case 'region': setRegionFilter('ALL'); break;
            }
          }}
          onClearAll={() => { setStatusFilter('ALL'); setRegionFilter('ALL'); }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`市场列表（匹配 ${sortedItems.length} 条）`}
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
            caption="复制 / 导出 / 分享当前市场管理中心筛选快照"
          />
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}

// ---- 样式 ----
