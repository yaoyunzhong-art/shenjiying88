'use client';

import React, { useMemo, useState } from 'react';

import {
  DataTable,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig
} from '@m5/ui';

// ---- 类型 ----

type OfferingCategory = 'class' | 'event' | 'product' | 'service';

interface StoreOffering {
  id: string;
  name: string;
  category: OfferingCategory;
  description: string;
  price?: string;
  scheduleHint?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
}

const CATEGORY_LABELS: Record<OfferingCategory, string> = {
  class: '课程',
  event: '活动',
  product: '商品',
  service: '服务'
};

const STATUS_VARIANTS: Record<StoreOffering['status'], 'success' | 'warning' | 'neutral'> = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral'
};

const STATUS_LABELS: Record<StoreOffering['status'], string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档'
};

// ---- Mock 数据 ----

const MOCK_OFFERINGS: StoreOffering[] = [
  { id: 'o1', name: '瑜伽初级课', category: 'class', description: '适合入门学习者，每周二四开课', price: '¥199/节', scheduleHint: '周二 18:30 / 周四 19:00', status: 'published', createdAt: '2026-06-10' },
  { id: 'o2', name: 'HIIT 高强度间歇训练', category: 'class', description: '快速燃脂，适合有一定基础的学员', price: '¥149/节', scheduleHint: '周三 07:00', status: 'published', createdAt: '2026-06-08' },
  { id: 'o3', name: '夏日游泳挑战赛', category: 'event', description: '门店内部游泳比赛，设有成人组和少年组', price: '¥50 报名费', scheduleHint: '2026-07-15 09:00', status: 'published', createdAt: '2026-06-12' },
  { id: 'o4', name: '蛋白粉（乳清）', category: 'product', description: '进口乳清蛋白粉，巧克力/香草口味可选', price: '¥299', status: 'published', createdAt: '2026-06-01' },
  { id: 'o5', name: '运动毛巾套装', category: 'product', description: '速干材质，门店 logo 定制款', price: '¥89', status: 'draft', createdAt: '2026-06-11' },
  { id: 'o6', name: '私教一对一', category: 'service', description: '定制训练计划，营养指导，进度跟踪', price: '¥499/节', scheduleHint: '需预约', status: 'published', createdAt: '2026-05-20' },
  { id: 'o7', name: '体测评估服务', category: 'service', description: 'InBody 体测 + 专业解读报告', price: '¥99/次', scheduleHint: '随到随测', status: 'published', createdAt: '2026-05-15' },
  { id: 'o8', name: '青少年篮球训练营', category: 'class', description: '暑期集中训练，8-16岁', price: '¥2,999/期', scheduleHint: '7月每周一三五 14:00', status: 'draft', createdAt: '2026-06-13' },
  { id: 'o9', name: '瑜伽垫（加厚）', category: 'product', description: '6mm 加厚防滑瑜伽垫', price: '¥159', status: 'published', createdAt: '2026-06-05' },
  { id: 'o10', name: '周末亲子运动会', category: 'event', description: '家庭互动运动会，含亲子项目', price: '免费', scheduleHint: '2026-06-20 10:00', status: 'published', createdAt: '2026-06-09' },
  { id: 'o11', name: '普拉提中级课', category: 'class', description: '核心力量训练，要求有基础', price: '¥229/节', scheduleHint: '周一 10:00 / 周五 18:30', status: 'published', createdAt: '2026-06-07' },
  { id: 'o12', name: '康复理疗服务', category: 'service', description: '针对运动损伤的康复理疗方案', price: '¥399/次', scheduleHint: '需预约评估', status: 'archived', createdAt: '2026-04-01' },
];

// ---- 列定义 ----

const OFFERING_COLUMNS: DataTableColumn<StoreOffering>[] = [
  {
    key: 'name',
    header: '名称',
    render: (item) => <span style={{ fontWeight: 600 }}>{item.name}</span>
  },
  {
    key: 'category',
    header: '分类',
    render: (item) => {
      const label = CATEGORY_LABELS[item.category];
      return <StatusBadge label={label} variant="default" size="sm" />;
    }
  },
  {
    key: 'description',
    header: '描述',
    render: (item) => <span style={{ color: '#cbd5e1' }}>{item.description}</span>
  },
  {
    key: 'price',
    header: '价格',
    align: 'right',
    render: (item) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.price ?? '-'}</span>
  },
  {
    key: 'scheduleHint',
    header: '时间',
    render: (item) => <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.scheduleHint ?? '-'}</span>
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_VARIANTS[item.status]} size="sm" />
    )
  }
];

// ---- 组件 ----

export interface StoreShowcaseClientProps {
  storeName: string;
}

export function StoreShowcaseClient({ storeName }: StoreShowcaseClientProps) {
  // 搜索
  const searchFields = useMemo<(keyof StoreOffering)[]>(
    () => ['name', 'description', 'category'],
    []
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_OFFERINGS, searchFields);

  // 分类筛选
  const [categoryFilter, setCategoryFilter] = useState<OfferingCategory | 'ALL'>('ALL');
  const categoryFiltered = useMemo(
    () => (categoryFilter === 'ALL' ? (filteredItems ?? []) : (filteredItems ?? []).filter((item) => item.category === categoryFilter)),
    [filteredItems, categoryFilter]
  );

  // 排序
  const [sortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(categoryFiltered, OFFERING_COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 8);
  const pageItems = sortedItems.slice((pagination.page - 1) * 8, pagination.page * 8);

  // 统计
  const stats = useMemo(() => {
    const published = MOCK_OFFERINGS.filter((o) => o.status === 'published').length;
    const categories = [...new Set(MOCK_OFFERINGS.map((o) => o.category))].length;
    return { total: MOCK_OFFERINGS.length, published, categories };
  }, []);

  return (
    <section
      style={{
        borderRadius: 24,
        padding: 32,
        marginTop: 32,
        background: 'linear-gradient(180deg, #172554 0%, #0f172a 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>{storeName} · 产品服务展示</h2>
          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 14 }}>
            浏览课程、活动、商品及服务，支持搜索与分类筛选。
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
        <StatBadge label="总项目" value={String(stats.total)} accent="#60a5fa" />
        <StatBadge label="已发布" value={String(stats.published)} accent="#4ade80" />
        <StatBadge label="分类数" value={String(stats.categories)} accent="#facc15" />
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索名称、描述或分类..."
        />
      </div>

      {/* 分类过滤栏 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部', count: (filteredItems ?? []).length },
            ...(['class', 'event', 'product', 'service'] as const).map((cat) => ({
              key: cat,
              label: CATEGORY_LABELS[cat],
              count: (filteredItems ?? []).filter((item) => item.category === cat).length
            }))
          ]}
          activeKey={categoryFilter}
          onChange={(key) => setCategoryFilter(key as OfferingCategory | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={OFFERING_COLUMNS}
        rows={pageItems}
        rowKey={(item) => item.id}
      />

      {/* 分页 */}
      <div style={{ marginTop: 12 }}>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
        />
      </div>
    </section>
  );
}

// ---- 子组件 ----

function StatBadge({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <article
      style={{
        borderRadius: 14,
        padding: 16,
        background: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(148, 163, 184, 0.14)'
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
    </article>
  );
}
