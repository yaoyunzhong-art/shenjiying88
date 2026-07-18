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
  Badge,
  EmptyState,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import { useDetailActions } from '../components/use-detail-actions';

// ---- 类型定义 ----

export type CouponType = 'amount' | 'discount' | 'cash' | 'exchange';
export type CouponStatus = 'active' | 'expired' | 'stopped';

export interface CouponTemplateItem {
  id: string;
  name: string;
  faceValue: number;
  type: CouponType;
  minSpend: number;
  validFrom: string;
  validTo: string;
  totalIssued: number;
  usedCount: number;
  status: CouponStatus;
}

type CouponStatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

export const COUPON_TYPE_MAP: Record<CouponType, { label: string }> = {
  amount: { label: '满减券' },
  discount: { label: '折扣券' },
  cash: { label: '现金券' },
  exchange: { label: '兑换券' },
};

export const COUPON_STATUS_MAP: Record<CouponStatus, { label: string; variant: CouponStatusVariant }> = {
  active: { label: '生效中', variant: 'success' },
  expired: { label: '已过期', variant: 'warning' },
  stopped: { label: '已停用', variant: 'danger' },
};

// ---- Mock 数据 ----

export const MOCK_COUPON_TEMPLATES: CouponTemplateItem[] = [
  { id: 'ct-001', name: '新客满100减20', faceValue: 20, type: 'amount', minSpend: 100, validFrom: '2026-01-01', validTo: '2026-12-31', totalIssued: 5000, usedCount: 3112, status: 'active' },
  { id: 'ct-002', name: '端午9折券', faceValue: 10, type: 'discount', minSpend: 50, validFrom: '2026-06-01', validTo: '2026-06-30', totalIssued: 2000, usedCount: 1543, status: 'expired' },
  { id: 'ct-003', name: '无门槛5元现金券', faceValue: 5, type: 'cash', minSpend: 0, validFrom: '2026-03-01', validTo: '2026-09-30', totalIssued: 10000, usedCount: 8234, status: 'active' },
  { id: 'ct-004', name: '周年庆兑换券', faceValue: 50, type: 'exchange', minSpend: 200, validFrom: '2026-07-01', validTo: '2026-07-15', totalIssued: 500, usedCount: 32, status: 'active' },
  { id: 'ct-005', name: '老客满200减30', faceValue: 30, type: 'amount', minSpend: 200, validFrom: '2025-01-01', validTo: '2025-12-31', totalIssued: 3000, usedCount: 2984, status: 'expired' },
  { id: 'ct-006', name: '双十一7折券', faceValue: 30, type: 'discount', minSpend: 100, validFrom: '2026-11-01', validTo: '2026-11-11', totalIssued: 8000, usedCount: 0, status: 'stopped' },
];

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: CouponTemplateItem) => void
): DataTableColumn<CouponTemplateItem>[] {
  return [
    {
      key: 'name',
      title: '模板名称',
      dataKey: 'name',
      sortable: true,
      render: (item: CouponTemplateItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'faceValue',
      title: '面值',
      sortable: true,
      align: 'right',
      render: (item: CouponTemplateItem) => {
        if (item.type === 'discount') {
          return `${(item.faceValue / 10).toFixed(0)}折`;
        }
        return `¥${item.faceValue}`;
      },
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      sortValue: (item: CouponTemplateItem) => item.type,
      render: (item: CouponTemplateItem) => {
        const t = COUPON_TYPE_MAP[item.type];
        return <StatusBadge label={t.label} variant="neutral" size="sm" />;
      },
    },
    {
      key: 'minSpend',
      title: '最低消费',
      dataKey: 'minSpend',
      sortable: true,
      align: 'right',
      render: (item: CouponTemplateItem) => (item.minSpend === 0 ? '无门槛' : `¥${item.minSpend}`),
    },
    {
      key: 'validPeriod',
      title: '有效期',
      render: (item: CouponTemplateItem) => `${item.validFrom} ~ ${item.validTo}`,
    },
    {
      key: 'totalIssued',
      title: '发放量',
      dataKey: 'totalIssued',
      sortable: true,
      align: 'right',
    },
    {
      key: 'usedCount',
      title: '已使用',
      dataKey: 'usedCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'usageRate',
      title: '使用率',
      sortable: true,
      sortValue: (item: CouponTemplateItem) => (item.totalIssued > 0 ? item.usedCount / item.totalIssued : 0),
      render: (item: CouponTemplateItem) => {
        const rate = item.totalIssued > 0 ? item.usedCount / item.totalIssued : 0;
        const pct = (rate * 100).toFixed(1);
        const barColor = rate >= 0.7 ? '#4ade80' : rate >= 0.3 ? '#facc15' : '#f87171';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: barColor, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 40, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: CouponTemplateItem) => item.status,
      render: (item: CouponTemplateItem) => {
        const s = COUPON_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
  ];
}

// ---- 空态引导 SVG ----

function EmptyCouponSVG() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="120" height="80" rx="8" stroke="#475569" strokeWidth="2" fill="rgba(71,85,105,0.1)" />
      <rect x="35" y="35" width="50" height="8" rx="4" fill="#475569" opacity="0.4" />
      <rect x="35" y="50" width="70" height="6" rx="3" fill="#475569" opacity="0.25" />
      <rect x="35" y="62" width="40" height="6" rx="3" fill="#475569" opacity="0.25" />
      <circle cx="110" cy="45" r="15" stroke="#475569" strokeWidth="2" fill="rgba(71,85,105,0.05)" />
      <path d="M105 45h10M110 40v10" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M95 80l30 10M95 85l30 10" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M75 92c-5-3-15-3-20 0" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

// ---- 页面组件 ----

export default function CouponTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<CouponStatus | 'active' | 'ALL'>('active');
  const [refreshKey, setRefreshKey] = useState(0);

  // 搜索过滤（本页面使用自定义搜索，不使用 useSearchFilter 以简化 mock 数据）
  const searchFields = useMemo<(keyof CouponTemplateItem)[]>(() => ['name', 'id', 'type'], []);
  const searchFiltered = useMemo(() => {
    if (!searchTerm.trim()) return MOCK_COUPON_TEMPLATES;
    const lower = searchTerm.toLowerCase();
    return MOCK_COUPON_TEMPLATES.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [searchTerm, refreshKey]);

  // Tab 筛选
  const tabFiltered = useMemo(() => {
    if (tabFilter === 'ALL') return searchFiltered;
    return searchFiltered.filter((item) => item.status === tabFilter);
  }, [searchFiltered, tabFilter]);

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: CouponTemplateItem) => {
    window.location.href = `/coupon-templates/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(tabFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, tabFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => ({
    total: MOCK_COUPON_TEMPLATES.length,
    active: MOCK_COUPON_TEMPLATES.filter((item) => item.status === 'active').length,
    totalIssued: MOCK_COUPON_TEMPLATES.reduce((sum, item) => sum + item.totalIssued, 0),
    totalUsed: MOCK_COUPON_TEMPLATES.reduce((sum, item) => sum + item.usedCount, 0),
  }), [refreshKey]);

  const { actions } = useDetailActions({
    workspace: 'coupon-templates',
    detailId: 'overview',
    record: { items: sortedItems, tabFilter, stats },
    shareTitle: '优惠券模板管理',
    shareText: '查看优惠券模板 / 使用率 / 状态筛选结果',
  });

  // Tab 列表
  const tabItems = useMemo(() => [
    { key: 'active' as const, label: '生效中', count: MOCK_COUPON_TEMPLATES.filter((item) => item.status === 'active').length },
    { key: 'expired' as const, label: '已过期', count: MOCK_COUPON_TEMPLATES.filter((item) => item.status === 'expired').length },
    { key: 'ALL' as const, label: '全部', count: MOCK_COUPON_TEMPLATES.length },
  ], [refreshKey]);

  const hasNoData = MOCK_COUPON_TEMPLATES.length === 0;

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="优惠券模板管理"
        subtitle="统一管理优惠券模板，支持发放跟踪、使用率监控与状态筛选。"
      >
        {/* 统计卡片 */}
        {!hasNoData && (
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
            <article style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>模板总数</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>全部优惠券模板</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>生效中</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{stats.active}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% 生效占比</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>总发放</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{stats.totalIssued.toLocaleString()}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>所有模板累计发放</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>总使用</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#c084fc' }}>{stats.totalUsed.toLocaleString()}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{stats.totalIssued > 0 ? ((stats.totalUsed / stats.totalIssued) * 100).toFixed(1) : 0}% 整体使用率</div>
            </article>
          </div>
        )}

        {/* 搜索 + 刷新按钮 */}
        <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchFilterInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="搜索模板名称 / ID / 类型..."
            />
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(15,23,42,0.38)',
              color: '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
            刷新
          </button>
        </div>

        {/* Tab 筛选 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={tabItems}
            activeKey={tabFilter}
            onChange={(key) => setTabFilter(key as CouponStatus | 'active' | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 活跃过滤条件 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(tabFilter !== 'ALL'
              ? [{ key: 'tab' as const, label: COUPON_STATUS_MAP[tabFilter as CouponStatus]?.label ?? tabFilter, tone: (COUPON_STATUS_MAP[tabFilter as CouponStatus]?.variant === 'success' ? 'success' : COUPON_STATUS_MAP[tabFilter as CouponStatus]?.variant === 'warning' ? 'warning' : 'danger') as FilterChip['tone'], count: searchFiltered.filter((item) => item.status === tabFilter).length }]
              : []),
          ]}
          onRemove={(key) => {
            if (key === 'tab') setTabFilter('ALL');
          }}
          onClearAll={() => setTabFilter('ALL')}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 空态 */}
        {hasNoData ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 16 }}>
            <EmptyCouponSVG />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1' }}>暂无优惠券模板</div>
            <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', maxWidth: 360 }}>
              你还没有创建任何优惠券模板。点击下方按钮创建第一个模板。
            </div>
            <button
              onClick={() => window.location.href = '/coupon-templates/new'}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              创建优惠券模板
            </button>
          </div>
        ) : (
          <>
            {/* 数据表格 */}
            <DataTable
              title={`优惠券模板列表（匹配 ${sortedItems.length} 条）`}
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
          </>
        )}

        <DetailActionBar
          actions={actions}
          heading="工作台收口动作"
          caption="复制 / 导出 / 分享当前优惠券模板管理筛选快照"
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
