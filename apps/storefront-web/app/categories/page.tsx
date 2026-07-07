'use client';

import React, { useMemo, useState } from 'react';
import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ── Types ───────────────────────────────────────────────────────────────────

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  productCount: number;
  status: 'active' | 'hidden' | 'archived';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<
  ProductCategory['status'],
  'success' | 'neutral' | 'warning'
> = {
  active: 'success',
  hidden: 'warning',
  archived: 'neutral',
};

const STATUS_LABELS: Record<ProductCategory['status'], string> = {
  active: '启用',
  hidden: '隐藏',
  archived: '归档',
};

// ── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: ProductCategory[] = [
  { id: 'c1', name: '健身课程', slug: 'fitness-class', parentName: null, productCount: 18, status: 'active', sortOrder: 1, createdAt: '2026-01-15', updatedAt: '2026-06-20' },
  { id: 'c2', name: '瑜伽课', slug: 'yoga-class', parentName: '健身课程', productCount: 8, status: 'active', sortOrder: 2, createdAt: '2026-01-15', updatedAt: '2026-06-18' },
  { id: 'c3', name: '力量训练', slug: 'strength-training', parentName: '健身课程', productCount: 5, status: 'active', sortOrder: 3, createdAt: '2026-02-01', updatedAt: '2026-06-15' },
  { id: 'c4', name: '有氧操课', slug: 'aerobics', parentName: '健身课程', productCount: 5, status: 'active', sortOrder: 4, createdAt: '2026-02-01', updatedAt: '2026-06-10' },
  { id: 'c5', name: '运动商品', slug: 'sport-goods', parentName: null, productCount: 42, status: 'active', sortOrder: 5, createdAt: '2026-01-10', updatedAt: '2026-06-22' },
  { id: 'c6', name: '服饰鞋帽', slug: 'apparel', parentName: '运动商品', productCount: 15, status: 'active', sortOrder: 6, createdAt: '2026-01-10', updatedAt: '2026-06-21' },
  { id: 'c7', name: '营养补剂', slug: 'supplements', parentName: '运动商品', productCount: 12, status: 'active', sortOrder: 7, createdAt: '2026-01-10', updatedAt: '2026-06-19' },
  { id: 'c8', name: '运动器械', slug: 'equipment', parentName: '运动商品', productCount: 9, status: 'active', sortOrder: 8, createdAt: '2026-02-05', updatedAt: '2026-06-17' },
  { id: 'c9', name: '配件/周边', slug: 'accessories', parentName: '运动商品', productCount: 6, status: 'active', sortOrder: 9, createdAt: '2026-02-05', updatedAt: '2026-06-16' },
  { id: 'c10', name: '场馆服务', slug: 'venue-service', parentName: null, productCount: 10, status: 'active', sortOrder: 10, createdAt: '2026-01-20', updatedAt: '2026-06-14' },
  { id: 'c11', name: '私教课程', slug: 'personal-trainer', parentName: '场馆服务', productCount: 4, status: 'active', sortOrder: 11, createdAt: '2026-01-20', updatedAt: '2026-06-13' },
  { id: 'c12', name: '康复理疗', slug: 'rehab', parentName: '场馆服务', productCount: 3, status: 'active', sortOrder: 12, createdAt: '2026-02-01', updatedAt: '2026-06-12' },
  { id: 'c13', name: '体测评估', slug: 'assessment', parentName: '场馆服务', productCount: 3, status: 'active', sortOrder: 13, createdAt: '2026-02-01', updatedAt: '2026-06-11' },
  { id: 'c14', name: '活动赛事', slug: 'events', parentName: null, productCount: 7, status: 'active', sortOrder: 14, createdAt: '2026-03-01', updatedAt: '2026-06-09' },
  { id: 'c15', name: '季节性促销', slug: 'seasonal-promo', parentName: null, productCount: 5, status: 'hidden', sortOrder: 15, createdAt: '2026-04-01', updatedAt: '2026-06-08' },
  { id: 'c16', name: '体验课', slug: 'trial-class', parentName: '健身课程', productCount: 2, status: 'active', sortOrder: 16, createdAt: '2026-05-01', updatedAt: '2026-06-07' },
  { id: 'c17', name: '饮水用品', slug: 'drinks', parentName: '运动商品', productCount: 4, status: 'archived', sortOrder: 17, createdAt: '2026-02-10', updatedAt: '2026-05-01' },
  { id: 'c18', name: '二手转卖', slug: 'second-hand', parentName: null, productCount: 0, status: 'hidden', sortOrder: 18, createdAt: '2026-03-15', updatedAt: '2026-06-06' },
];

// ── Category Page Component ───────────────────────────────────────────────

export default function CategoriesPage() {
  const searchFields = useMemo<(keyof ProductCategory)[]>(
    () => ['name', 'slug', 'parentName'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_CATEGORIES,
    searchFields,
  );

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'sortOrder',
    direction: 'asc',
  });
  const sortedItems = useSortedItems(filteredItems, [], sortConfig);

  const pagination = usePagination(sortedItems.length, 10);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 10,
    pagination.page * 10,
  );

  const columns: DataTableColumn<ProductCategory>[] = useMemo(() => [
    {
      key: 'name',
      header: '分类名称',
      sortable: true,
      render: (item) => (
        <div>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{item.name}</span>
          {item.parentName && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
              隶属于 <span style={{ color: '#94a3b8' }}>{item.parentName}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'slug',
      header: '标识',
      render: (item) => <code style={{ fontSize: 12, color: '#94a3b8' }}>{item.slug}</code>,
    },
    {
      key: 'productCount',
      header: '产品数',
      sortable: true,
      render: (item) => (
        <span style={{ fontWeight: 600, color: item.productCount > 0 ? '#e2e8f0' : '#64748b' }}>
          {item.productCount}
        </span>
      ),
    },
    {
      key: 'sortOrder',
      header: '排序',
      sortable: true,
      render: (item) => (
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.sortOrder}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      sortable: true,
      render: (item) => (
        <StatusBadge
          label={STATUS_LABELS[item.status]}
          variant={STATUS_VARIANTS[item.status]}
          size="sm"
        />
      ),
    },
    {
      key: 'updatedAt',
      header: '更新时间',
      sortable: true,
      render: (item) => (
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.updatedAt}</span>
      ),
    },
  ], []);

  return (
    <PageShell
      title="分类管理"
      description="管理门店商品、课程、服务的分类体系"
    >
      <div style={{ marginBottom: 16 }}>
        <SearchFilterInput
          placeholder="搜索分类名称、标识或上级分类..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>
      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(item) => item.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
        />
      </div>
    </PageShell>
  );
}
