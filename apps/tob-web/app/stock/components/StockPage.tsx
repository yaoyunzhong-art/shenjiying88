/**
 * StockPage — ToB 库存管理列表页组件
 * 角色视角: 👔品牌运营 / 📦仓库管理员
 * 功能: 搜索、品类筛选、状态筛选、排序、分页
 */
'use client';

import React, { useMemo, useState } from 'react';

import {
  Badge,
  DataTable,
  EmptyState,
  PageShell,
  Pagination,
  SearchFilterInput,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type BadgeVariant,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  STOCK_CATEGORY_MAP,
  STOCK_STATUS_MAP,
  STOCK_CATEGORIES,
  STOCK_STATUSES,
  type StockItem,
  type StockCategory,
  type StockStatus,
} from '../../stock-data';

/* ── 样式映射 ── */

const CATEGORY_VARIANTS: Record<StockCategory, BadgeVariant> = {
  raw_material: 'warning',
  semi_finished: 'info',
  finished: 'success',
  consumable: 'neutral',
  gift: 'purple',
};

/* ── 辅助函数 ── */

function formatCurrency(v: number): string {
  if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
  return `¥${v.toLocaleString()}`;
}

function stockLevelColor(available: number, minStock: number): string {
  if (available === 0) return '#f87171';
  if (available <= minStock) return '#fbbf24';
  return '#22c55e';
}

/* ── Props ── */

export interface StockPageProps {
  items: StockItem[];
  total: number;
  page: number;
  pageSize: number;
  categoryFilter?: StockCategory | '';
  statusFilter?: StockStatus | '';
  searchQuery?: string;
}

/* ── Component ── */

export function StockPage({
  items,
  total,
  page,
  pageSize,
  categoryFilter = '',
  statusFilter = '',
  searchQuery = '',
}: StockPageProps): React.ReactElement {
  const safeItems = items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const {
    searchTerm,
    setSearchTerm,
    filteredItems: filteredBySearch,
  } = useSearchFilter(safeItems, ['name', 'sku', 'supplier', 'warehouse', 'location']);

  const [localCategoryFilter, setLocalCategoryFilter] = useState<string>(categoryFilter);
  const [localStatusFilter, setLocalStatusFilter] = useState<string>(statusFilter);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const {
    page: currentPage,
    pageSize: currentPageSize,
    setPage,
    setPageSize,
  } = usePagination({ initialPage: page, initialPageSize: pageSize });

  // 组合筛选
  const filtered = useMemo(() => {
    let data = filteredBySearch;
    const cat = localCategoryFilter || categoryFilter;
    if (cat) {
      data = data.filter((d) => d.category === cat);
    }
    const st = localStatusFilter || statusFilter;
    if (st) {
      data = data.filter((d) => d.status === st);
    }
    return data;
  }, [filteredBySearch, localCategoryFilter, localStatusFilter, categoryFilter, statusFilter]);

  // 排序
  const sorted = useSortedItems(filtered, [], sortConfig);

  // 分页
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const start = (safePage - 1) * currentPageSize;
  const paginated = sorted.slice(start, start + currentPageSize);

  // 统计
  const stats = useMemo(() => {
    const lowStock = safeItems.filter((s) => s.status === 'low_stock').length;
    const outOfStock = safeItems.filter((s) => s.status === 'out_of_stock').length;
    const totalValue = safeItems.reduce((sum, s) => sum + s.totalValue, 0);
    return { lowStock, outOfStock, totalValue };
  }, [safeItems]);

  // 列定义
  const columns: DataTableColumn<StockItem>[] = useMemo(
    () => [
      {
        key: 'sku',
        label: 'SKU',
        sortable: true,
        render: (row) => (
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>
            {row.sku}
          </span>
        ),
      },
      {
        key: 'name',
        label: '商品名称',
        sortable: true,
        render: (row) => <span style={{ fontWeight: 500 }}>{row.name}</span>,
      },
      {
        key: 'category',
        label: '品类',
        render: (row) => (
          <Badge variant={CATEGORY_VARIANTS[row.category]}>
            {STOCK_CATEGORY_MAP[row.category].label}
          </Badge>
        ),
      },
      {
        key: 'available',
        label: '可用库存',
        sortable: true,
        render: (row) => (
          <span style={{ fontWeight: 700, fontSize: 15, color: stockLevelColor(row.available, row.minStock) }}>
            {row.available} {row.unit}
          </span>
        ),
      },
      {
        key: 'reserved',
        label: '已预留',
        sortable: true,
        render: (row) => <span style={{ color: '#6b7280' }}>{row.reserved} {row.unit}</span>,
      },
      {
        key: 'status',
        label: '状态',
        sortable: true,
        render: (row) => {
          const s = STOCK_STATUS_MAP[row.status];
          return <Badge variant={s.variant as BadgeVariant}>{s.label}</Badge>;
        },
      },
      {
        key: 'unitPrice',
        label: '单价',
        sortable: true,
        render: (row) => formatCurrency(row.unitPrice),
        align: 'right',
      },
      {
        key: 'totalValue',
        label: '库存价值',
        sortable: true,
        render: (row) => <span style={{ fontWeight: 600 }}>{formatCurrency(row.totalValue)}</span>,
        align: 'right',
      },
      {
        key: 'warehouse',
        label: '仓库',
        sortable: true,
        render: (row) => <span style={{ fontSize: 13, color: '#4b5563' }}>{row.warehouse}</span>,
      },
      {
        key: 'lastCheckIn',
        label: '最后入库',
        sortable: true,
      },
    ],
    [],
  );

  return (
    <PageShell
      title="库存管理"
      description={`${safeItems.length} 种库存商品 · 库存总值 ${formatCurrency(stats.totalValue)}`}
    >
      {/* 统计栏 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{
          padding: '12px 20px',
          borderRadius: 12,
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>库存总值</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>
            {formatCurrency(stats.totalValue)}
          </div>
        </div>
        <div style={{
          padding: '12px 20px',
          borderRadius: 12,
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
        }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>缺货预警</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
            {stats.lowStock}
          </div>
        </div>
        <div style={{
          padding: '12px 20px',
          borderRadius: 12,
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.2)',
        }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>已缺货</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>
            {stats.outOfStock}
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索 SKU / 名称 / 仓库 / 供应商…"
        />
        <select
          value={localCategoryFilter || categoryFilter}
          onChange={(e) => { setLocalCategoryFilter(e.target.value); setPage(1); }}
          aria-label="品类筛选"
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, minWidth: 100 }}
        >
          <option value="">全部品类</option>
          {STOCK_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{STOCK_CATEGORY_MAP[cat].label}</option>
          ))}
        </select>
        <select
          value={localStatusFilter || statusFilter}
          onChange={(e) => { setLocalStatusFilter(e.target.value); setPage(1); }}
          aria-label="状态筛选"
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, minWidth: 100 }}
        >
          <option value="">全部状态</option>
          {STOCK_STATUSES.map((st) => (
            <option key={st} value={st}>{STOCK_STATUS_MAP[st].label}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 'auto' }}>
          共 {sorted.length} 条
        </span>
      </div>

      {/* 表格 */}
      {paginated.length === 0 ? (
        <EmptyState
          title="暂无库存数据"
          description={searchTerm ? '未找到匹配的库存记录，请调整搜索条件' : '当前没有库存数据'}
        />
      ) : (
        <DataTable
          columns={columns}
          items={paginated}
          rowKey={(row) => row.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          emptyText="暂无匹配的库存记录"
        />
      )}

      {/* 分页 */}
      <Pagination
        page={safePage}
        pageSize={currentPageSize}
        total={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    </PageShell>
  );
}
