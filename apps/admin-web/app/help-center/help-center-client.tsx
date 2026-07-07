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
  useSortedItems,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import { useDetailActions } from '../components/use-detail-actions';

import {
  type HelpArticle,
  type HelpCategoryId,
  getCategoryName,
  filterArticlesByCategory,
  filterArticlesByStatus,
  searchArticles,
  computeArticleStats,
} from './help-center-data';

// ---- 属性类型 ----

interface HelpCenterClientProps {
  articles: HelpArticle[];
}

// ---- 类别选项卡配置 ----

const CATEGORY_OPTIONS: { key: HelpCategoryId | 'ALL'; label: string; icon: string }[] = [
  { key: 'ALL', label: '全部分类', icon: '📋' },
  { key: 'getting-started', label: '快速入门', icon: '🚀' },
  { key: 'account-management', label: '账户管理', icon: '👤' },
  { key: 'market-operations', label: '市场运营', icon: '🌐' },
  { key: 'brand-management', label: '品牌管理', icon: '🏷️' },
  { key: 'store-operations', label: '门店运营', icon: '🏪' },
  { key: 'finance-settlement', label: '财务结算', icon: '💰' },
  { key: 'security-compliance', label: '安全合规', icon: '🔒' },
  { key: 'api-integration', label: 'API 集成', icon: '🔌' },
  { key: 'troubleshooting', label: '故障排查', icon: '🔧' },
];

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'neutral' | 'warning' }> = {
  published: { label: '已发布', variant: 'success' },
  draft: { label: '草稿', variant: 'warning' },
};

// ---- 列定义 ----

function buildColumns(
  onRowClick: (article: HelpArticle) => void,
): DataTableColumn<HelpArticle>[] {
  return [
    {
      key: 'status',
      title: '状态',
      sortable: true,
      render: (item: HelpArticle) => {
        const s = STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'title',
      title: '标题',
      dataKey: 'title',
      sortable: true,
      render: (item: HelpArticle) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{
            color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          {item.title}
        </span>
      ),
    },
    {
      key: 'category',
      title: '分类',
      sortable: true,
      render: (item: HelpArticle) => (
        <span style={{ fontSize: 13, color: '#cbd5e1' }}>
          {CATEGORY_OPTIONS.find((c) => c.key === item.category)?.icon}{' '}
          {getCategoryName(item.category)}
        </span>
      ),
    },
    {
      key: 'tags',
      title: '标签',
      render: (item: HelpArticle) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {item.tags.map((tag) => (
            <StatusBadge key={tag} label={tag} variant="neutral" size="sm" />
          ))}
        </div>
      ),
    },
    {
      key: 'author',
      title: '作者',
      dataKey: 'author',
      sortable: true,
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      dataKey: 'updatedAt',
      sortable: true,
    },
    {
      key: 'viewCount',
      title: '浏览量',
      dataKey: 'viewCount',
      sortable: true,
      render: (item: HelpArticle) => (
        <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
          {item.viewCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'helpfulCount',
      title: '有帮助',
      dataKey: 'helpfulCount',
      sortable: true,
      render: (item: HelpArticle) => (
        <span style={{ fontFamily: 'monospace', color: '#4ade80' }}>
          {item.helpfulCount.toLocaleString()}
        </span>
      ),
    },
  ];
}

// ---- 页面组件 ----

export function HelpCenterClient({ articles }: HelpCenterClientProps) {
  const searchFields = useMemo<(keyof HelpArticle)[]>(
    () => ['title', 'content', 'author'],
    [],
  );

  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(articles, searchFields);

  // 分类筛选
  const [categoryFilter, setCategoryFilter] = useState<HelpCategoryId | 'ALL'>('ALL');
  const categoryFiltered = useMemo(
    () => filterArticlesByCategory(filteredItems, categoryFilter),
    [filteredItems, categoryFilter],
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<'published' | 'draft' | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () => filterArticlesByStatus(categoryFiltered, statusFilter),
    [categoryFiltered, statusFilter],
  );

  // 统计（基于全量数据）
  const stats = useMemo(() => computeArticleStats(articles), [articles]);

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'updatedAt',
    direction: 'desc',
  });

  const columns = useMemo(
    () =>
      buildColumns(
        useCallback(
          (article: HelpArticle) => {
            // 详情查看：暂时使用 alert 提示，后续可改为路由跳转或弹窗
            window.alert(`查看详情: ${article.title}\n\n${article.content}`);
          },
          [],
        ),
      ),
    [],
  );

  const sortedItems = useSortedItems(statusFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, categoryFilter, statusFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  const { actions } = useDetailActions({
    workspace: 'help-center',
    detailId: 'overview',
    record: { items: sortedItems, categoryFilter, statusFilter, stats, searchTerm },
    shareTitle: '帮助中心',
    shareText: '查看帮助文档 / 筛选分类 / 搜索文档内容',
  });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="帮助中心"
        subtitle="平台操作指南、常见问题和技术文档库。按分类浏览或搜索关键词快速找到所需帮助。"
      >
        {/* 统计卡片 */}
        <QuickStats
          items={[
            { label: '文档总数', value: stats.total, helper: `${stats.published} 篇已发布` },
            { label: '总浏览量', value: stats.totalViews.toLocaleString(), helper: '累计阅读' },
            { label: '有帮助', value: stats.totalHelpful.toLocaleString(), valueColor: '#4ade80', helper: `${((stats.totalHelpful / Math.max(stats.totalViews, 1)) * 100).toFixed(1)}% 有帮助率` },
            { label: '草稿', value: stats.draft, valueColor: '#fbbf24', helper: '待发布文档' },
          ]}
        />

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索文档标题、内容或作者..."
          />
        </div>

        {/* 分类选项卡 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={CATEGORY_OPTIONS.map((cat) => ({
              key: cat.key,
              label: `${cat.icon} ${cat.label}`,
              count: filterArticlesByCategory(
                searchArticles(articles, searchTerm),
                cat.key,
              ).length,
            }))}
            activeKey={categoryFilter}
            onChange={(key) => setCategoryFilter(key as HelpCategoryId | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 状态筛选 + 活跃筛选条件 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>文档状态</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: categoryFiltered.length },
                { key: 'published', label: '已发布', count: categoryFiltered.filter((a) => a.status === 'published').length },
                { key: 'draft', label: '草稿', count: categoryFiltered.filter((a) => a.status === 'draft').length },
              ]}
              activeKey={statusFilter}
              onChange={(key) => setStatusFilter(key as 'published' | 'draft' | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃筛选条件 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(categoryFilter !== 'ALL'
              ? [{ key: 'category' as const, label: CATEGORY_OPTIONS.find((c) => c.key === categoryFilter)?.label ?? categoryFilter, tone: 'neutral' as FilterChip['tone'], count: categoryFiltered.length }]
              : []),
            ...(statusFilter !== 'ALL'
              ? [{ key: 'status' as const, label: STATUS_MAP[statusFilter]?.label ?? statusFilter, tone: (STATUS_MAP[statusFilter]?.variant ?? 'neutral') as FilterChip['tone'], count: statusFiltered.length }]
              : []),
            ...(searchTerm.trim()
              ? [{ key: 'search' as const, label: `搜索: "${searchTerm}"`, tone: 'neutral' as FilterChip['tone'], count: filteredItems.length }]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'category': setCategoryFilter('ALL'); break;
              case 'status': setStatusFilter('ALL'); break;
              case 'search': setSearchTerm(''); break;
            }
          }}
          onClearAll={() => { setCategoryFilter('ALL'); setStatusFilter('ALL'); setSearchTerm(''); }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`帮助文档列表（匹配 ${sortedItems.length} 篇）`}
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
          heading="文档操作"
          caption="复制 / 导出 / 分享当前帮助中心筛选快照"
        />
      </PageShell>
    </main>
  );
}
