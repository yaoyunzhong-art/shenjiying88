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
  MOCK_COUPONS,
  COUPON_STATUS_MAP,
  COUPON_TYPE_MAP,
  COUPON_SCOPE_MAP,
  COUPON_STATUSES,
  COUPON_TYPES,
  COUPON_SCOPES,
  type CouponItem,
  type CouponStatus,
  type CouponType,
  type CouponScope,
} from '../coupons-data';

// ---- 优惠券类型配色 ----

function typeColor(type: CouponType): string {
  switch (type) {
    case 'percentage': return '#60a5fa';
    case 'fixed': return '#a78bfa';
    case 'shipping': return '#34d399';
    case 'threshold': return '#fbbf24';
  }
}

// ---- 领取率计算 ----

function claimRate(item: CouponItem): number {
  if (item.totalQuota <= 0) return 0;
  return (item.usedCount / item.totalQuota) * 100;
}

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: CouponItem) => void,
): DataTableColumn<CouponItem>[] {
  return [
    {
      key: 'code',
      title: '券码',
      dataKey: 'code',
      sortable: true,
      render: (item: CouponItem) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(item);
          }}
          style={{
            color: '#93c5fd',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'monospace',
            fontWeight: 600,
          }}
        >
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      title: '优惠券名称',
      dataKey: 'name',
      sortable: true,
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      sortValue: (item: CouponItem) => item.type,
      render: (item: CouponItem) => {
        const t = COUPON_TYPE_MAP[item.type];
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: typeColor(item.type),
              fontWeight: 500,
            }}
          >
            {t.label}
            {item.discountValue > 0 && (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {item.discountValue}
                {t.suffix}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'scope',
      title: '适用范围',
      sortable: true,
      sortValue: (item: CouponItem) => item.scope,
      render: (item: CouponItem) => (
        <StatusBadge label={COUPON_SCOPE_MAP[item.scope]} variant="info" size="sm" />
      ),
    },
    {
      key: 'threshold',
      title: '门槛',
      sortable: true,
      align: 'right',
      sortValue: (item: CouponItem) => item.threshold,
      render: (item: CouponItem) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: item.threshold > 0 ? '#94a3b8' : '#4ade80' }}>
          {item.threshold > 0 ? `满¥${item.threshold}` : '无门槛'}
        </span>
      ),
    },
    {
      key: 'quota',
      title: '剩余/总量',
      sortable: false,
      align: 'right',
      render: (item: CouponItem) => {
        const rate = claimRate(item);
        const color = rate >= 90 ? '#f87171' : rate >= 60 ? '#fbbf24' : '#4ade80';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
            <span style={{ fontVariantNumeric: 'tabular-nums', color, fontWeight: 600 }}>
              {item.remainingQuota.toLocaleString()} / {item.totalQuota.toLocaleString()}
            </span>
            <div
              style={{
                width: 80,
                height: 4,
                borderRadius: 2,
                background: 'rgba(148,163,184,0.3)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(rate, 100)}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'usageLimit',
      title: '限领',
      align: 'right',
      sortable: true,
      sortValue: (item: CouponItem) => item.usageLimit,
      render: (item: CouponItem) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {item.usageLimit === 99999 ? '不限' : `每人${item.usageLimit}次`}
        </span>
      ),
    },
    {
      key: 'date',
      title: '有效期',
      sortable: false,
      render: (item: CouponItem) => (
        <span style={{ fontSize: 12, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
          {item.startAt} ~ {item.endAt}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: CouponItem) => item.status,
      render: (item: CouponItem) => {
        const s = COUPON_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'createdBy',
      title: '创建人',
      dataKey: 'createdBy',
      sortable: true,
    },
  ];
}

// ---- 页面组件 ----

function CouponsPageContent() {
  // 搜索过滤
  const searchFields = useMemo<(keyof CouponItem)[]>(
    () => ['code', 'name', 'createdBy', 'scopeLabel'],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_COUPONS,
    searchFields
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter]
  );

  // 类型筛选
  const [typeFilter, setTypeFilter] = useState<CouponType | 'ALL'>('ALL');
  const typeFiltered = useMemo(
    () =>
      typeFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.type === typeFilter),
    [statusFiltered, typeFilter]
  );

  // 范围筛选
  const [scopeFilter, setScopeFilter] = useState<CouponScope | 'ALL'>('ALL');
  const scopeFiltered = useMemo(
    () =>
      scopeFilter === 'ALL'
        ? typeFiltered
        : typeFiltered.filter((item) => item.scope === scopeFilter),
    [typeFiltered, scopeFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const handleRowClick = useCallback((item: CouponItem) => {
    window.location.href = `/coupons/${item.id}`;
  }, []);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(scopeFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, statusFilter, typeFilter, scopeFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(
    () => ({
      total: MOCK_COUPONS.length,
      active: MOCK_COUPONS.filter((c) => c.status === 'active').length,
      exhausted: MOCK_COUPONS.filter((c) => c.status === 'exhausted').length,
      totalUsed: MOCK_COUPONS.reduce((s, c) => s + c.usedCount, 0),
      totalRemaining: MOCK_COUPONS.reduce((s, c) => s + c.remainingQuota, 0),
      totalQuota: MOCK_COUPONS.reduce((s, c) => s + c.totalQuota, 0),
    }),
    []
  );

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="优惠券管理中心"
        subtitle="统一管理优惠券的创建、投放与监控，支持折扣券、代金券、满减券、包邮券等多种类型。"
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>优惠券总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>进行中</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
              {stats.active}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>已领完</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>
              {stats.exhausted}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总发放量</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>
              {stats.totalQuota.toLocaleString()}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>已核销</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#a78bfa' }}>
              {stats.totalUsed.toLocaleString()}
            </div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索券码 / 优惠券名称 / 创建人..."
          />
        </div>

        {/* 状态过滤 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_COUPONS.length },
              ...COUPON_STATUSES.map((s) => ({
                key: s,
                label: COUPON_STATUS_MAP[s].label,
                count: MOCK_COUPONS.filter((c) => c.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as CouponStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 类型 + 范围 筛选 */}
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
              优惠券类型
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...COUPON_TYPES.map((t) => ({
                  key: t,
                  label: COUPON_TYPE_MAP[t].label,
                  count: statusFiltered.filter((c) => c.type === t).length,
                })),
              ]}
              activeKey={typeFilter}
              onChange={(key) => setTypeFilter(key as CouponType | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              适用范围
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: typeFiltered.length },
                ...COUPON_SCOPES.map((s) => ({
                  key: s,
                  label: COUPON_SCOPE_MAP[s],
                  count: typeFiltered.filter((c) => c.scope === s).length,
                })),
              ]}
              activeKey={scopeFilter}
              onChange={(key) => setScopeFilter(key as CouponScope | 'ALL')}
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
              ? [{
                  key: 'status' as const,
                  label: COUPON_STATUS_MAP[statusFilter].label,
                  tone: (COUPON_STATUS_MAP[statusFilter].variant === 'success'
                    ? 'success'
                    : COUPON_STATUS_MAP[statusFilter].variant === 'warning'
                      ? 'warning'
                      : COUPON_STATUS_MAP[statusFilter].variant === 'danger'
                        ? 'danger'
                        : 'neutral') as FilterChip['tone'],
                  count: statusFiltered.filter((c) => c.status === statusFilter).length,
                }]
              : []),
            ...(typeFilter !== 'ALL'
              ? [{
                  key: 'type' as const,
                  label: COUPON_TYPE_MAP[typeFilter].label,
                  tone: 'neutral' as FilterChip['tone'],
                  count: statusFiltered.filter((c) => c.type === typeFilter).length,
                }]
              : []),
            ...(scopeFilter !== 'ALL'
              ? [{
                  key: 'scope' as const,
                  label: COUPON_SCOPE_MAP[scopeFilter],
                  tone: 'neutral' as FilterChip['tone'],
                  count: typeFiltered.filter((c) => c.scope === scopeFilter).length,
                }]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'status': setStatusFilter('ALL'); break;
              case 'type': setTypeFilter('ALL'); break;
              case 'scope': setScopeFilter('ALL'); break;
            }
          }}
          onClearAll={() => {
            setStatusFilter('ALL');
            setTypeFilter('ALL');
            setScopeFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`优惠券列表（匹配 ${sortedItems.length} 条）`}
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

export default function CouponsPage() {
  return (
    <Suspense fallback={<CouponsPageFallback />}>
      <CouponsPageContent />
    </Suspense>
  );
}

// ---- 样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

function CouponsPageFallback() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
      正在加载优惠券管理视图...
    </main>
  );
}
