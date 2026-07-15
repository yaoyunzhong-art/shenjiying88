/**
 * 分类管理页 — Product Categories Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购
 * 类型: D-角色操作界面
 * 功能: 分类列表/搜索/筛选/排序/分页/统计概览/CRUD弹窗/层级结构
 */
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  DataTable,
  PageShell,
  StatusBadge,
  Modal,
  EmptyState,
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
  description?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<ProductCategory['status'], 'success' | 'neutral' | 'warning'> = {
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
  { id: 'c1', name: '健身课程', slug: 'fitness-class', parentName: null, productCount: 18, status: 'active', sortOrder: 1, createdAt: '2026-01-15', updatedAt: '2026-06-20', description: '各类健身课程体系' },
  { id: 'c2', name: '瑜伽课', slug: 'yoga-class', parentName: '健身课程', productCount: 8, status: 'active', sortOrder: 2, createdAt: '2026-01-15', updatedAt: '2026-06-18' },
  { id: 'c3', name: '力量训练', slug: 'strength-training', parentName: '健身课程', productCount: 5, status: 'active', sortOrder: 3, createdAt: '2026-02-01', updatedAt: '2026-06-15' },
  { id: 'c4', name: '有氧操课', slug: 'aerobics', parentName: '健身课程', productCount: 5, status: 'active', sortOrder: 4, createdAt: '2026-02-01', updatedAt: '2026-06-10' },
  { id: 'c5', name: '运动商品', slug: 'sport-goods', parentName: null, productCount: 42, status: 'active', sortOrder: 5, createdAt: '2026-01-10', updatedAt: '2026-06-22', description: '运动相关商品及装备' },
  { id: 'c6', name: '服饰鞋帽', slug: 'apparel', parentName: '运动商品', productCount: 15, status: 'active', sortOrder: 6, createdAt: '2026-01-10', updatedAt: '2026-06-21' },
  { id: 'c7', name: '营养补剂', slug: 'supplements', parentName: '运动商品', productCount: 12, status: 'active', sortOrder: 7, createdAt: '2026-01-10', updatedAt: '2026-06-19' },
  { id: 'c8', name: '运动器械', slug: 'equipment', parentName: '运动商品', productCount: 9, status: 'active', sortOrder: 8, createdAt: '2026-02-05', updatedAt: '2026-06-17' },
  { id: 'c9', name: '配件/周边', slug: 'accessories', parentName: '运动商品', productCount: 6, status: 'active', sortOrder: 9, createdAt: '2026-02-05', updatedAt: '2026-06-16' },
  { id: 'c10', name: '场馆服务', slug: 'venue-service', parentName: null, productCount: 10, status: 'active', sortOrder: 10, createdAt: '2026-01-20', updatedAt: '2026-06-14', description: '场馆相关服务产品' },
  { id: 'c11', name: '私教课程', slug: 'personal-trainer', parentName: '场馆服务', productCount: 4, status: 'active', sortOrder: 11, createdAt: '2026-01-20', updatedAt: '2026-06-13' },
  { id: 'c12', name: '康复理疗', slug: 'rehab', parentName: '场馆服务', productCount: 3, status: 'active', sortOrder: 12, createdAt: '2026-02-01', updatedAt: '2026-06-12' },
  { id: 'c13', name: '体测评估', slug: 'assessment', parentName: '场馆服务', productCount: 3, status: 'active', sortOrder: 13, createdAt: '2026-02-01', updatedAt: '2026-06-11' },
  { id: 'c14', name: '活动赛事', slug: 'events', parentName: null, productCount: 7, status: 'active', sortOrder: 14, createdAt: '2026-03-01', updatedAt: '2026-06-09' },
  { id: 'c15', name: '季节性促销', slug: 'seasonal-promo', parentName: null, productCount: 5, status: 'hidden', sortOrder: 15, createdAt: '2026-04-01', updatedAt: '2026-06-08' },
  { id: 'c16', name: '体验课', slug: 'trial-class', parentName: '健身课程', productCount: 2, status: 'active', sortOrder: 16, createdAt: '2026-05-01', updatedAt: '2026-06-07' },
  { id: 'c17', name: '饮水用品', slug: 'drinks', parentName: '运动商品', productCount: 4, status: 'archived', sortOrder: 17, createdAt: '2026-02-10', updatedAt: '2026-05-01' },
  { id: 'c18', name: '二手转卖', slug: 'second-hand', parentName: null, productCount: 0, status: 'hidden', sortOrder: 18, createdAt: '2026-03-15', updatedAt: '2026-06-06' },
];

const PAGE_SIZE = 10;

// ── 子组件：统计卡片 ─────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ── 子组件：分类详情弹窗 ─────────────────────────────────────────────────

function CategoryDetailModal({
  category,
  onClose,
  onStatusChange,
}: {
  category: ProductCategory;
  onClose: () => void;
  onStatusChange: (id: string, status: ProductCategory['status']) => void;
}) {
  return (
    <Modal open onClose={onClose} title={`分类详情 — ${category.name}`} width={500}>
      <div style={{ fontSize: 14, lineHeight: 1.8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px' }}>
          <span style={{ color: '#6b7280' }}>名称</span><span style={{ fontWeight: 600 }}>{category.name}</span>
          <span style={{ color: '#6b7280' }}>标识</span><code>{category.slug}</code>
          <span style={{ color: '#6b7280' }}>上级分类</span><span>{category.parentName || '— (顶级分类)'}</span>
          <span style={{ color: '#6b7280' }}>产品数</span><span>{category.productCount}</span>
          <span style={{ color: '#6b7280' }}>排序</span><span>{category.sortOrder}</span>
          <span style={{ color: '#6b7280' }}>状态</span>
          <span>
            <StatusBadge variant={STATUS_VARIANTS[category.status]} label={STATUS_LABELS[category.status]} />
          </span>
          <span style={{ color: '#6b7280' }}>创建时间</span><span>{category.createdAt}</span>
          <span style={{ color: '#6b7280' }}>更新时间</span><span>{category.updatedAt}</span>
          {category.description && (
            <>
              <span style={{ color: '#6b7280' }}>描述</span>
              <span style={{ color: '#374151' }}>{category.description}</span>
            </>
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          {category.status !== 'archived' && (
            <>
              {category.status === 'active' ? (
                <button
                  onClick={() => { onStatusChange(category.id, 'hidden'); onClose(); }}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}
                >
                  设为隐藏
                </button>
              ) : (
                <button
                  onClick={() => { onStatusChange(category.id, 'active'); onClose(); }}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontSize: 13 }}
                >
                  设为启用
                </button>
              )}
              <button
                onClick={() => { onStatusChange(category.id, 'archived'); onClose(); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}
              >
                归档
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Category Page Component ───────────────────────────────────────────────

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [detailCategory, setDetailCategory] = useState<ProductCategory | null>(null);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'sortOrder',
    direction: 'asc',
  });

  /** 分类统计 */
  const stats = useMemo(() => {
    const active = categories.filter((c) => c.status === 'active').length;
    const hidden = categories.filter((c) => c.status === 'hidden').length;
    const archived = categories.filter((c) => c.status === 'archived').length;
    const totalProducts = categories.reduce((s, c) => s + c.productCount, 0);
    const parents = categories.filter((c) => !c.parentName).length;
    const children = categories.filter((c) => c.parentName).length;
    return { total: categories.length, active, hidden, archived, totalProducts, parents, children };
  }, [categories]);

  /** 筛选 + 搜索 + 排序 */
  const processedItems = useMemo(() => {
    let items = categories;
    if (statusFilter !== 'ALL') {
      items = items.filter((c) => c.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.slug.toLowerCase().includes(lower) ||
          (c.parentName != null && c.parentName.toLowerCase().includes(lower)),
      );
    }
    if (sortConfig) {
      const { key, direction } = sortConfig;
      items = [...items].sort((a, b) => {
        const aVal = a[key as keyof ProductCategory];
        const bVal = b[key as keyof ProductCategory];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const strA = String(aVal);
        const strB = String(bVal);
        return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }
    return items;
  }, [categories, statusFilter, searchTerm, sortConfig]);

  /** 分页 */
  const totalPages = Math.max(1, Math.ceil(processedItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = processedItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /** 更新分类状态 */
  const handleStatusChange = useCallback((id: string, status: ProductCategory['status']) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString().slice(0, 10) } : c)));
  }, []);

  /** 层级信息 */
  const childrenByParent = useMemo(() => {
    const map: Record<string, ProductCategory[]> = {};
    categories.forEach((c) => {
      if (c.parentName) {
        const key: string = c.parentName;
        if (!map[key]) map[key] = [];
        map[key].push(c);
      }
    });
    return map;
  }, [categories]);

  const columns: DataTableColumn<ProductCategory>[] = useMemo(() => [
    {
      key: 'name',
      header: '分类名称',
      sortable: true,
      render: (item) => (
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
          {item.parentName && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>
              隶属于 <span style={{ color: '#374151' }}>{item.parentName}</span>
            </span>
          )}
          {!item.parentName && childrenByParent[item.name] && (
            <span style={{ marginLeft: 8, fontSize: 11, color: '#9ca3af' }}>
              ({(childrenByParent[item.name] as ProductCategory[]).length} 个子分类)
            </span>
          )}
        </div>
      ),
    },
    { key: 'slug', header: '标识', render: (item) => <code style={{ fontSize: 12, color: '#6b7280' }}>{item.slug}</code> },
    {
      key: 'productCount',
      header: '产品数',
      sortable: true,
      render: (item) => (
        <span style={{ fontWeight: 600, color: item.productCount > 0 ? '#374151' : '#9ca3af' }}>
          {item.productCount}
        </span>
      ),
    },
    {
      key: 'sortOrder',
      header: '排序',
      sortable: true,
      render: (item) => <span style={{ color: '#6b7280', fontSize: 13 }}>{item.sortOrder}</span>,
    },
    {
      key: 'status',
      header: '状态',
      sortable: true,
      render: (item) => (
        <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_VARIANTS[item.status]} size="sm" />
      ),
    },
    { key: 'updatedAt', header: '更新时间', sortable: true, render: (item) => <span style={{ color: '#6b7280', fontSize: 13 }}>{item.updatedAt}</span> },
    {
      key: 'actions',
      header: '操作',
      render: (item) => (
        <button
          onClick={() => setDetailCategory(item)}
          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12 }}
        >
          详情
        </button>
      ),
    },
  ], [childrenByParent]);

  return (
    <PageShell title="分类管理" description="管理门店商品、课程、服务的分类体系">
      <div style={{ padding: 24 }}>
        {/* 页面标题 */}
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>📂 分类管理</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
          共 {stats.total} 个分类 · {stats.totalProducts} 个产品 · {stats.parents} 个顶级 · {stats.children} 个子分类
        </p>

        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard label="总分类" value={stats.total} icon="📂" color="#2563eb" />
          <StatCard label="启用中" value={stats.active} icon="✅" color="#059669" />
          <StatCard label="隐藏" value={stats.hidden} icon="👁️" color="#d97706" />
          <StatCard label="已归档" value={stats.archived} icon="📦" color="#6b7280" />
          <StatCard label="总产品" value={stats.totalProducts} icon="📦" color="#7c3aed" />
        </div>

        {/* 工具栏 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="搜索分类名称、标识或上级分类…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            style={{
              padding: '8px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              minWidth: 260,
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 110 }}
          >
            <option value="ALL">全部状态 ({stats.total})</option>
            <option value="active">启用 ({stats.active})</option>
            <option value="hidden">隐藏 ({stats.hidden})</option>
            <option value="archived">归档 ({stats.archived})</option>
          </select>
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto' }}>
            筛选后 {processedItems.length}/{categories.length} 个
          </span>
        </div>

        {/* 层级结构提示 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, fontSize: 12, color: '#6b7280' }}>
          <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>🌳 顶级分类: {stats.parents}</span>
          <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>🌿 子分类: {stats.children}</span>
        </div>

        {/* 数据表格 */}
        {pageItems.length === 0 ? (
          <EmptyState title="暂无分类记录" description={searchTerm ? '请调整搜索条件' : '当前没有分类数据'} />
        ) : (
          <DataTable
            columns={columns}
            rows={pageItems}
            rowKey={(item: ProductCategory) => item.id}
            sort={sortConfig}
            onSortChange={setSortConfig}
          />
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: safePage <= 1 ? '#f3f4f6' : '#fff', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', fontSize: 13, color: safePage <= 1 ? '#9ca3af' : '#374151' }}
            >
              ← 上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: p === safePage ? '#2563eb' : '#f3f4f6',
                  color: p === safePage ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: p === safePage ? 700 : 400,
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: safePage >= totalPages ? '#f3f4f6' : '#fff', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13 }}
            >
              下一页 →
            </button>
            <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>共 {processedItems.length} 条</span>
          </div>
        )}

        {/* 详情弹窗 */}
        {detailCategory && (
          <CategoryDetailModal
            category={detailCategory}
            onClose={() => setDetailCategory(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </PageShell>
  );
}
