/**
 * 分类管理 — 列表页 (Next.js App Router)
 * 角色视角: 👤运营管理员 / 📊商品管理
 * 功能: 搜索 / 过滤 / 分页 / 状态切换 / 统计面板
 */
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  type CategoryItem,
  MOCK_CATEGORIES,
  CATEGORY_STATUS_MAP,
  adminCategoryRoute,
  getCategoryUniqueParents,
  computeCategoryStats,
} from '../categories-data';

function buildColumns(
  onRowClick: (item: CategoryItem) => void,
): DataTableColumn<CategoryItem>[] {
  return [
    {
      key: 'name',
      title: '分类名称',
      dataKey: 'name',
      sortable: true,
      render: (item: CategoryItem) => (
        <span
          className="cursor-pointer text-blue-600 hover:underline"
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'code',
      title: '编码',
      dataKey: 'code',
      sortable: true,
    },
    {
      key: 'parentName',
      title: '上级分类',
      dataKey: 'parentName',
      sortable: true,
      render: (item: CategoryItem) => item.parentName ?? <span className="text-gray-400">—</span>,
    },
    {
      key: 'productCount',
      title: '商品数',
      dataKey: 'productCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'status',
      title: '状态',
      dataKey: 'status',
      sortable: true,
      render: (item: CategoryItem) => {
        const m = CATEGORY_STATUS_MAP[item.status];
        return <StatusBadge label={m?.label ?? item.status} variant={m?.variant ?? 'neutral'} />;
      },
    },
    {
      key: 'sortOrder',
      title: '排序',
      dataKey: 'sortOrder',
      sortable: true,
      align: 'right',
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataKey: 'createdAt',
      sortable: true,
      render: (item: CategoryItem) => new Date(item.createdAt).toLocaleDateString('zh-CN'),
    },
  ];
}

// 分类统计面板
function CategoryStatsPanel({ data }: { data: CategoryItem[] }) {
  const stats = useMemo(() => computeCategoryStats(data), [data]);
  const active = data.filter(i => i.status === 'active').length;
  const inactive = data.filter(i => i.status === 'inactive').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>全部分类</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{stats.total}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11 }}>
          <span style={{ color: '#16a34a' }}>✓ {active} 启用</span>
          <span style={{ color: '#94a3b8' }}>✗ {inactive} 停用</span>
        </div>
      </div>
      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>一级分类</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>{stats.rootCount}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>无上级分类</div>
      </div>
      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>子分类</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706', marginTop: 4 }}>{stats.total - stats.rootCount}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>关联父分类</div>
      </div>
      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>关联商品</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed', marginTop: 4 }}>{stats.totalProducts.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>全品类</div>
      </div>
      {/* 状态分布 */}
      <div style={{ gridColumn: '1 / -1', padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>📊 启用 / 停用分布</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: active, height: 20, background: '#22c55e', borderRadius: 4, minWidth: active > 0 ? 10 : 0 }} />
          <div style={{ flex: inactive, height: 20, background: '#e2e8f0', borderRadius: 4, minWidth: inactive > 0 ? 10 : 0 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#64748b' }}>
          <span>启用 {active} ({Math.round((active / stats.total) * 100)}%)</span>
          <span>停用 {inactive} ({Math.round((inactive / stats.total) * 100)}%)</span>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesListPage() {
  const router = useRouter();
  const [data] = useState<CategoryItem[]>(MOCK_CATEGORIES);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(data, ['name', 'code', 'parentName']);
  const sortedItems = useSortedItems(filteredItems, [], sortConfig);

  const onRowClick = useCallback((item: CategoryItem) => {
    router.push(`${adminCategoryRoute.detailHrefBase}/${item.id}`);
  }, [router]);

  const columns = useMemo(() => buildColumns(onRowClick), [onRowClick]);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const handleStatusFilter = useCallback((key: string) => {
    setStatusFilter(key === 'all' ? null : key);
    setPage(1);
  }, []);

  const displayData = useMemo(() => {
    let items = sortedItems;
    if (statusFilter === 'root') items = items.filter((i: CategoryItem) => !i.parentName);
    else if (statusFilter === 'leaf') items = items.filter((i: CategoryItem) => i.parentName);
    return items;
  }, [sortedItems, statusFilter]);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const total = displayData.length;
  const pageItems = displayData.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => computeCategoryStats(data), [data]);

  const handleAction = useCallback((action: string) => {
    if (action === 'add') router.push(`${adminCategoryRoute.href}/new`);
  }, [router]);

  return (
    <PageShell
      title="分类管理"
      subtitle="商品管理 / 分类管理"
      actions={
        <DetailActionBar
          actions={[
            { label: '新建分类', key: 'add', variant: 'primary' as const, onClick: () => handleAction('add') },
          ]}
        />
      }
    >
      {/* 统计面板 */}
      <CategoryStatsPanel data={data} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-xs">
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索分类名称、编码…"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            items={[
              { key: 'all', label: `全部 (${data.length})` },
              { key: 'root', label: `一级分类 (${data.filter(i => !i.parentName).length})` },
              { key: 'leaf', label: `子分类 (${data.filter(i => i.parentName).length})` },
            ]}
            activeKey={statusFilter ?? 'all'}
            onChange={handleStatusFilter}
          />
        </div>
      </div>

      <DataTable
        columns={columns as DataTableColumn<unknown>[]}
        data={pageItems as unknown[]}
        rowKey={(row: unknown) => (row as CategoryItem).id}
        sort={sortConfig}
        onSortChange={setSortConfig as (value: React.SetStateAction<DataTableSortConfig | null>) => void}
        emptyText="暂无分类数据"
        onRowClick={(row: unknown) => onRowClick(row as CategoryItem)}
      />

      <div className="mt-4 flex justify-end">
        <Pagination
          page={page}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </PageShell>
  );
}
