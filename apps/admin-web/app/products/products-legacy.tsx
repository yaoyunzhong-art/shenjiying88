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
  MOCK_PRODUCTS,
  PRODUCT_STATUS_MAP,
  PRODUCT_CATEGORY_MAP,
  PRODUCT_STATUSES,
  PRODUCT_CATEGORIES,
  type ProductItem,
  type ProductStatus,
  type ProductCategory,
} from '../products-data';
import {
  deriveScopedCapabilityActionItem,
  type GatedCapabilityActionItem
} from '../lyt-capability-access';
import { AdminPermissionGate } from '../components/admin-permission-gate';
import { StoreCapabilityActionStrip } from '../components/store-capability-action-strip';
import { StoreCapabilityGatingBanner } from '../components/store-capability-gating-banner';
import { useStoreCapabilityGating } from '../components/use-store-capability-gating';

const permissionGate = {
  requiredPermission: 'product:read',
  title: '商品管理访问受限',
  description:
    '商品管理中心已接入管理员本地 session，只有具备 product:read 的账号才能查看商品列表、库存概览与品类筛选结果。',
} as const;

// ---- 毛利率配色 ----

function marginColor(margin: number): string {
  if (margin >= 50) return '#4ade80';
  if (margin >= 30) return '#fbbf24';
  return '#f87171';
}

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: ProductItem) => void,
  canOpenDetail: boolean
): DataTableColumn<ProductItem>[] {
  return [
    {
      key: 'sku',
      title: 'SKU',
      dataKey: 'sku',
      sortable: true,
    },
    {
      key: 'name',
      title: '商品名称',
      dataKey: 'name',
      sortable: true,
      render: (item: ProductItem) => (
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
            textDecoration: canOpenDetail ? 'underline' : 'none'
          }}
          title={canOpenDetail ? '查看商品详情' : '当前门店 inventory / shelf 能力受阻，详情入口暂不可用'}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'category',
      title: '品类',
      sortable: true,
      sortValue: (item: ProductItem) => item.category,
      render: (item: ProductItem) => {
        const c = PRODUCT_CATEGORY_MAP[item.category];
        return <StatusBadge label={c.label} variant={c.variant} size="sm" />;
      },
    },
    {
      key: 'price',
      title: '售价',
      dataKey: 'price',
      sortable: true,
      align: 'right',
      render: (item: ProductItem) => (
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          ¥{item.price.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'cost',
      title: '成本',
      dataKey: 'cost',
      sortable: true,
      align: 'right',
      render: (item: ProductItem) => (
        <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
          ¥{item.cost.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'margin',
      title: '毛利率',
      sortable: true,
      align: 'right',
      sortValue: (item: ProductItem) =>
        item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0,
      render: (item: ProductItem) => {
        const margin =
          item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;
        return (
          <span
            style={{
              fontWeight: 600,
              color: marginColor(margin),
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {margin.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'stock',
      title: '库存',
      dataKey: 'stock',
      sortable: true,
      align: 'right',
      render: (item: ProductItem) => {
        const color =
          item.stock === 0
            ? '#f87171'
            : item.stock < 50
              ? '#fbbf24'
              : '#94a3b8';
        return (
          <span style={{ fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
            {item.stock}
          </span>
        );
      },
    },
    {
      key: 'unit',
      title: '单位',
      dataKey: 'unit',
      sortable: true,
    },
    {
      key: 'brandName',
      title: '品牌',
      dataKey: 'brandName',
      sortable: true,
    },
    {
      key: 'marketCode',
      title: '市场',
      dataKey: 'marketCode',
      sortable: true,
    },
    {
      key: 'storeName',
      title: '门店',
      dataKey: 'storeName',
      sortable: true,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: ProductItem) => item.status,
      render: (item: ProductItem) => {
        const s = PRODUCT_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'updatedAt',
      title: '最近更新',
      dataKey: 'updatedAt',
      sortable: true,
    },
  ];
}

// ---- 页面组件 ----

function ProductsPageContent() {
  // 搜索过滤
  const searchFields = useMemo<(keyof ProductItem)[]>(
    () => ['sku', 'name', 'brandName', 'storeName'],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_PRODUCTS,
    searchFields
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter]
  );

  // 品类筛选
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'ALL'>('ALL');
  const categoryFiltered = useMemo(
    () =>
      categoryFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.category === categoryFilter),
    [statusFiltered, categoryFilter]
  );

  // 市场筛选
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const marketFiltered = useMemo(
    () =>
      marketFilter === 'ALL'
        ? categoryFiltered
        : categoryFiltered.filter((item) => item.marketCode === marketFilter),
    [categoryFiltered, marketFilter]
  );

  // 毛利筛选
  type MarginRange = 'ALL' | 'high' | 'medium' | 'low';
  const [marginFilter, setMarginFilter] = useState<MarginRange>('ALL');
  const marginFiltered = useMemo(
    () =>
      marginFilter === 'ALL'
        ? marketFiltered
        : marginFilter === 'high'
          ? marketFiltered.filter(
              (item) =>
                item.price > 0 &&
                ((item.price - item.cost) / item.price) * 100 >= 50
            )
          : marginFilter === 'medium'
            ? marketFiltered.filter(
                (item) =>
                  item.price > 0 &&
                  ((item.price - item.cost) / item.price) * 100 >= 30 &&
                  ((item.price - item.cost) / item.price) * 100 < 50
              )
            : marketFiltered.filter(
                (item) =>
                  item.price > 0 &&
                  ((item.price - item.cost) / item.price) * 100 < 30
              ),
    [marketFiltered, marginFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const productGating = useStoreCapabilityGating({
    targetCapabilities: ['inventory', 'shelf']
  });
  const canOpenProductDetail = Boolean(productGating.primaryNavigableAction);
  const handleRowClick = useCallback((item: ProductItem) => {
    if (!canOpenProductDetail) {
      return;
    }
    window.location.href = `/products/${item.id}`;
  }, [canOpenProductDetail]);
  const productBulkActions = useMemo<GatedCapabilityActionItem[]>(() => {
    const inventoryAction = productGating.visibleActions.find((item) => item.capability === 'inventory');
    const shelfAction = productGating.visibleActions.find((item) => item.capability === 'shelf') ?? inventoryAction;
    return [
      ...(inventoryAction
        ? [
            deriveScopedCapabilityActionItem(inventoryAction, {
              key: 'product-bulk-restock',
              label: inventoryAction.isDisabled ? '等待批量补货计划' : inventoryAction.access === 'degraded' ? '降级批量补货计划' : '批量补货计划',
              href: `/products?storeId=${productGating.storeId}&focus=bulk-restock`,
              hint: `${inventoryAction.hint} 用于门店补货和低库存治理。`
            })
          ]
        : []),
      ...(shelfAction
        ? [
            deriveScopedCapabilityActionItem(shelfAction, {
              key: 'product-bulk-shelf',
              label: shelfAction.isDisabled ? '等待货架巡检' : shelfAction.access === 'degraded' ? '降级货架巡检' : '货架巡检',
              href: `/products?storeId=${productGating.storeId}&focus=shelf-audit`,
              hint: `${shelfAction.hint} 用于货架一致性巡检和陈列治理。`
            })
          ]
        : [])
    ];
  }, [productGating.storeId, productGating.visibleActions]);
  const columns = useMemo(() => buildColumns(handleRowClick, canOpenProductDetail), [canOpenProductDetail, handleRowClick]);
  const sortedItems = useSortedItems(marginFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 15, 20],
  });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, statusFilter, categoryFilter, marketFilter, marginFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const allMarkets = useMemo(
    () => [...new Set(MOCK_PRODUCTS.map((p) => p.marketCode))].sort(),
    []
  );
  const stats = useMemo(
    () => ({
      total: MOCK_PRODUCTS.length,
      active: MOCK_PRODUCTS.filter((p) => p.status === 'active').length,
      lowStock: MOCK_PRODUCTS.filter((p) => p.stock > 0 && p.stock < 50).length,
      outOfStock: MOCK_PRODUCTS.filter((p) => p.stock === 0).length,
      avgMargin: (
        MOCK_PRODUCTS.reduce(
          (sum, p) =>
            sum + (p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0),
          0
        ) / MOCK_PRODUCTS.length
      ).toFixed(1),
    }),
    []
  );

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="商品管理中心"
        subtitle="统一管理商品 SKU、定价、库存与上下架状态，支持多市场多品类商品运营。"
      >
        <StoreCapabilityGatingBanner
          title="商品入口治理"
          description="库存与货架相关操作已接入 capability access。商品页需要根据 inventory / shelf 能力决定开放、降级展示或隐藏门店入口。"
          targetCapabilities={['inventory', 'shelf']}
          surfaceHref="/stores"
          surfaceLabel="返回门店列表"
        />
        <StoreCapabilityActionStrip
          title="商品批量动作"
          description="补货计划和货架巡检会直接复用 inventory / shelf capability gating；blocked 时禁用，degraded 时保留降级动作。"
          actions={productBulkActions}
          emptyHint="当前门店没有可执行的商品批量动作，请先检查 inventory / shelf capability access。"
        />
        {!canOpenProductDetail && !productGating.isLoading ? (
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
            当前门店的 inventory / shelf capability 处于阻塞或隐藏状态，商品名称行点击已禁用，请先处理能力矩阵中的治理问题。
          </div>
        ) : null}
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
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>商品总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>
              {stats.total}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              覆盖 {allMarkets.length} 个市场
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>在售商品</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}
            >
              {stats.active}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {((stats.active / stats.total) * 100).toFixed(0)}% 在售率
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>低库存预警</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#fbbf24' }}
            >
              {stats.lowStock}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              库存 &lt; 50
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>缺货</div>
            <div
              style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}
            >
              {stats.outOfStock}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              库存为 0
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均毛利率</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                color: marginColor(Number(stats.avgMargin)),
              }}
            >
              {stats.avgMargin}%
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              售价-成本 / 售价
            </div>
          </article>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索 SKU / 商品名称 / 品牌 / 门店..."
          />
        </div>

        {/* 状态过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_PRODUCTS.length },
              ...PRODUCT_STATUSES.map((s) => ({
                key: s,
                label: PRODUCT_STATUS_MAP[s].label,
                count: MOCK_PRODUCTS.filter((item) => item.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as ProductStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 品类 + 市场 + 毛利 筛选栏 */}
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
              品类
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...PRODUCT_CATEGORIES.map((c) => ({
                  key: c,
                  label: PRODUCT_CATEGORY_MAP[c].label,
                  count: statusFiltered.filter(
                    (item) => item.category === c
                  ).length,
                })),
              ]}
              activeKey={categoryFilter}
              onChange={(key) => setCategoryFilter(key as ProductCategory | 'ALL')}
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
                { key: 'ALL', label: '全部', count: categoryFiltered.length },
                ...allMarkets.map((mkt) => ({
                  key: mkt,
                  label: mkt,
                  count: categoryFiltered.filter(
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
              毛利率
            </div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: marketFiltered.length },
                {
                  key: 'high',
                  label: '高毛利',
                  count: marketFiltered.filter(
                    (item) =>
                      item.price > 0 &&
                      ((item.price - item.cost) / item.price) * 100 >= 50
                  ).length,
                },
                {
                  key: 'medium',
                  label: '中等',
                  count: marketFiltered.filter(
                    (item) =>
                      item.price > 0 &&
                      ((item.price - item.cost) / item.price) * 100 >= 30 &&
                      ((item.price - item.cost) / item.price) * 100 < 50
                  ).length,
                },
                {
                  key: 'low',
                  label: '低毛利',
                  count: marketFiltered.filter(
                    (item) =>
                      item.price > 0 &&
                      ((item.price - item.cost) / item.price) * 100 < 30
                  ).length,
                },
              ]}
              activeKey={marginFilter}
              onChange={(key) => setMarginFilter(key as MarginRange)}
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
                    label: PRODUCT_STATUS_MAP[statusFilter].label,
                    tone: (PRODUCT_STATUS_MAP[statusFilter].variant === 'success'
                      ? 'success'
                      : PRODUCT_STATUS_MAP[statusFilter].variant === 'warning'
                        ? 'warning'
                        : PRODUCT_STATUS_MAP[statusFilter].variant === 'danger'
                          ? 'danger'
                          : 'neutral') as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.status === statusFilter
                    ).length,
                  },
                ]
              : []),
            ...(categoryFilter !== 'ALL'
              ? [
                  {
                    key: 'category' as const,
                    label: PRODUCT_CATEGORY_MAP[categoryFilter].label,
                    tone: 'neutral' as FilterChip['tone'],
                    count: statusFiltered.filter(
                      (item) => item.category === categoryFilter
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
                    count: categoryFiltered.filter(
                      (item) => item.marketCode === marketFilter
                    ).length,
                  },
                ]
              : []),
            ...(marginFilter !== 'ALL'
              ? [
                  {
                    key: 'margin' as const,
                    label:
                      marginFilter === 'high'
                        ? '高毛利'
                        : marginFilter === 'medium'
                          ? '中等毛利'
                          : '低毛利',
                    tone:
                      marginFilter === 'high'
                        ? ('success' as FilterChip['tone'])
                        : marginFilter === 'medium'
                          ? ('warning' as FilterChip['tone'])
                          : ('danger' as FilterChip['tone']),
                    count: marketFiltered.filter((item) => {
                      if (marginFilter === 'high')
                        return (
                          item.price > 0 &&
                          ((item.price - item.cost) / item.price) * 100 >= 50
                        );
                      if (marginFilter === 'medium')
                        return (
                          item.price > 0 &&
                          ((item.price - item.cost) / item.price) * 100 >= 30 &&
                          ((item.price - item.cost) / item.price) * 100 < 50
                        );
                      return (
                        item.price > 0 &&
                        ((item.price - item.cost) / item.price) * 100 < 30
                      );
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
              case 'category':
                setCategoryFilter('ALL');
                break;
              case 'market':
                setMarketFilter('ALL');
                break;
              case 'margin':
                setMarginFilter('ALL');
                break;
            }
          }}
          onClearAll={() => {
            setStatusFilter('ALL');
            setCategoryFilter('ALL');
            setMarketFilter('ALL');
            setMarginFilter('ALL');
          }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`商品列表（匹配 ${sortedItems.length} 条）`}
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

export default function ProductsPage() {
  return (
    <AdminPermissionGate {...permissionGate}>
      <Suspense fallback={<ProductsPageFallback />}>
        <ProductsPageContent />
      </Suspense>
    </AdminPermissionGate>
  );
}

// ---- 样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

function ProductsPageFallback() {
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
      正在加载商品治理视图...
    </main>
  );
}
