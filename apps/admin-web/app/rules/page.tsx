/**
 * 规则管理列表页 — Rules Management List Page (Next.js App Router Page)
 * 角色视角: 👔系统管理员 / 🛡️运营主管
 * 功能: 规则概览、搜索/筛选/分类浏览、统计数据、导航至子页面
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  FilterChips,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型定义 ----

export type RuleCategory = 'risk-control' | 'member' | 'promotion' | 'notification' | 'operation';
export type RuleStatus = 'enabled' | 'disabled' | 'draft' | 'archived';
export type RulePriority = 'critical' | 'high' | 'medium' | 'low';

export interface RuleItem {
  id: string;
  name: string;
  category: RuleCategory;
  status: RuleStatus;
  priority: RulePriority;
  description: string;
  triggerCount: number;
  successRate: number;
  lastTriggered: string;
  updatedAt: string;
  createdBy: string;
}

// ---- 常量映射 ----

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  'risk-control': '风控规则',
  member: '会员规则',
  promotion: '营销规则',
  notification: '通知规则',
  operation: '运维规则',
};

export const CATEGORY_OPTIONS: { value: string; label: string }[] = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const CATEGORY_LIST: RuleCategory[] = ['risk-control', 'member', 'promotion', 'notification', 'operation'];

export const STATUS_LABELS: Record<RuleStatus, string> = {
  enabled: '已启用',
  disabled: '已停用',
  draft: '草稿',
  archived: '已归档',
};

export const STATUS_BADGE_VARIANT: Record<RuleStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  enabled: 'success',
  disabled: 'neutral',
  draft: 'warning',
  archived: 'danger',
};

export const PRIORITY_LABELS: Record<RulePriority, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

export const PRIORITY_COLORS: Record<RulePriority, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
};

export const CATEGORY_COLORS: Record<RuleCategory, string> = {
  'risk-control': '#ef4444',
  member: '#3b82f6',
  promotion: '#f59e0b',
  notification: '#8b5cf6',
  operation: '#10b981',
};

export const CATEGORY_BG_COLORS: Record<RuleCategory, string> = {
  'risk-control': 'rgba(239, 68, 68, 0.12)',
  member: 'rgba(59, 130, 246, 0.12)',
  promotion: 'rgba(245, 158, 11, 0.12)',
  notification: 'rgba(139, 92, 246, 0.12)',
  operation: 'rgba(16, 185, 129, 0.12)',
};

const STATUS_LIST: RuleStatus[] = ['enabled', 'disabled', 'draft', 'archived'];
const PRIORITY_LIST: RulePriority[] = ['critical', 'high', 'medium', 'low'];

// ---- 过滤函数 ----

export function filterRules(
  rules: RuleItem[],
  search: string,
  statusFilter: RuleStatus | 'ALL',
  categoryFilter: RuleCategory | 'ALL',
): RuleItem[] {
  let result = rules;

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.createdBy.toLowerCase().includes(q),
    );
  }

  if (statusFilter !== 'ALL') {
    result = result.filter((r) => r.status === statusFilter);
  }

  if (categoryFilter !== 'ALL') {
    result = result.filter((r) => r.category === categoryFilter);
  }

  return result;
}

// ---- Mock 数据 ----

const MOCK_RULES: RuleItem[] = Array.from({ length: 35 }, (_, i): RuleItem => {
  const id = `rule-${i + 1}`;

  return {
    id,
    name: ([
      '信用评分规则',
      '风控拦截规则',
      '会员升级规则',
      '优惠券发放规则',
      '异常登录检测规则',
      '批量通知规则',
      '库存预警规则',
      '订单风控规则',
      '积分过期规则',
      '推送频率限制',
    ] as string[])[i % 10]! + ` v${Math.floor(i / 10) + 1}`,
    category: CATEGORY_LIST[i % 5] as RuleCategory,
    status: STATUS_LIST[i % 4] as RuleStatus,
    priority: PRIORITY_LIST[i % 4] as RulePriority,
    description: ([
      '基于会员行为数据的信用评分自动计算与更新',
      '检测异常交易行为并触发拦截流程',
      '根据消费金额和频次自动升级会员等级',
      '按条件自动发放优惠券给目标会员群体',
      '检测异地登录、频繁登录等异常行为',
      '批量向目标用户发送系统通知消息',
      '库存低于阈值时自动触发补货提醒',
      '对高风险订单进行自动风控审核',
      '会员积分到期前自动发送提醒通知',
      '限制单用户每日推送消息频率上限',
    ] as string[])[i % 10]!,
    triggerCount: Math.floor(Math.random() * 5000) + 10,
    successRate: Math.round((Math.random() * 30 + 70) * 10) / 10,
    lastTriggered: `2026-07-${String((i % 28) + 1).padStart(2, '0')}T${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
    updatedAt: `2026-07-${String((i % 28) + 1).padStart(2, '0')}T${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
    createdBy: (['admin', 'operator-01', 'operator-02', 'super-admin'] as string[])[i % 4]!,
  };
});

// ---- 样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

// ---- 页面组件 ----

export default function RulesPage() {
  // 三态条件渲染
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setLoading(false) }, []);
  if (loading) return <div>加载中...</div>;
  if (error) return <div>数据获取失败: {error}</div>;
  if (!MOCK_RULES || MOCK_RULES.length === 0) return <div>暂无数据</div>;

  const [statusFilter, setStatusFilter] = useState<RuleStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const searchFields = useMemo<(keyof RuleItem)[]>(() => ['name', 'description', 'createdBy'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_RULES, searchFields);

  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? filteredItems
        : filteredItems.filter((item) => item.status === statusFilter),
    [filteredItems, statusFilter],
  );

  const categoryFiltered = useMemo(
    () =>
      categoryFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.category === categoryFilter),
    [statusFiltered, categoryFilter],
  );

  const columns = useMemo<DataTableColumn<RuleItem>[]>(
    () => [
      {
        key: 'name',
        title: '规则名称',
        sortable: true,
        render: (item: RuleItem) => (
          <a
            href={`/rules/${item.id}`}
            style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}
          >
            {item.name}
          </a>
        ),
      },
      {
        key: 'category',
        title: '分类',
        sortable: true,
        render: (item: RuleItem) => (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: CATEGORY_COLORS[item.category],
              background: CATEGORY_BG_COLORS[item.category],
            }}
          >
            {CATEGORY_LABELS[item.category]}
          </span>
        ),
      },
      {
        key: 'status',
        title: '状态',
        sortable: true,
        render: (item: RuleItem) => (
          <StatusBadge label={STATUS_LABELS[item.status]} variant={STATUS_BADGE_VARIANT[item.status]} />
        ),
      },
      {
        key: 'priority',
        title: '优先级',
        sortable: true,
        render: (item: RuleItem) => (
          <span style={{ color: PRIORITY_COLORS[item.priority], fontWeight: 600 }}>
            {PRIORITY_LABELS[item.priority]}
          </span>
        ),
      },
      {
        key: 'triggerCount',
        title: '触发次数',
        sortable: true,
        align: 'right',
        render: (item: RuleItem) => item.triggerCount.toLocaleString(),
      },
      {
        key: 'successRate',
        title: '成功率',
        sortable: true,
        align: 'right',
        render: (item: RuleItem) => `${item.successRate}%`,
      },
      {
        key: 'lastTriggered',
        title: '最近触发',
        sortable: true,
        render: (item: RuleItem) => new Date(item.lastTriggered).toLocaleString('zh-CN'),
      },
    ],
    [],
  );

  const sortedItems = useSortedItems(categoryFiltered, columns, sortConfig);

  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, statusFilter, categoryFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  const stats = useMemo(() => {
    const total = MOCK_RULES.length;
    const enabled = MOCK_RULES.filter((r) => r.status === 'enabled').length;
    const critical = MOCK_RULES.filter((r) => r.priority === 'critical').length;
    const lowSuccess = MOCK_RULES.filter((r) => r.successRate < 85).length;
    return { total, enabled, critical, lowSuccess };
  }, []);

  const categoryStats = useMemo(() => {
    const entries = CATEGORY_LIST.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      count: MOCK_RULES.filter((r) => r.category === cat).length,
      color: CATEGORY_COLORS[cat],
      bg: CATEGORY_BG_COLORS[cat],
    }));
    const maxCount = Math.max(...entries.map((e) => e.count), 1);
    return { entries, maxCount };
  }, []);

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell title="规则管理" subtitle={`共 ${stats.total} 条规则 · ${stats.enabled} 条启用 · ${stats.critical} 条严重优先级`}>
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>规则总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>已启用</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
              {stats.enabled}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              {((stats.enabled / stats.total) * 100).toFixed(0)}% 启用率
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>严重优先级</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>
              {stats.critical}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>需重点关注</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>低成功率 (&lt;85%)</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>
              {stats.lowSuccess}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>需优化</div>
          </article>
        </div>

        {/* 分类统计条 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.28)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>分类分布</span>
          <div style={{ flex: 1, display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden' }}>
            {categoryStats.entries.map((e) => (
              <div
                key={e.category}
                style={{
                  width: `${(e.count / stats.total) * 100}%`,
                  background: e.color,
                  minWidth: e.count > 0 ? 2 : 0,
                }}
                title={`${e.label}: ${e.count}条`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {categoryStats.entries.map((e) => (
              <span
                key={e.category}
                style={{
                  fontSize: 11,
                  color: '#cbd5e1',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: e.color,
                  }}
                />
                {e.label}
                <span style={{ color: '#64748b' }}>{e.count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索规则名称 / 描述 / 创建人..."
          />
        </div>

        {/* 状态筛选 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部状态' },
              ...STATUS_LIST.map((s) => ({
                key: s,
                label: STATUS_LABELS[s],
                count: MOCK_RULES.filter((item) => item.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as RuleStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 分类筛选 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>分类</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部分类', count: statusFiltered.length },
                ...CATEGORY_LIST.map((c) => ({
                  key: c,
                  label: CATEGORY_LABELS[c],
                  count: statusFiltered.filter((item) => item.category === c).length,
                })),
              ]}
              activeKey={categoryFilter}
              onChange={(key) => setCategoryFilter(key as RuleCategory | 'ALL')}
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
                    label: STATUS_LABELS[statusFilter],
                    tone: STATUS_BADGE_VARIANT[statusFilter] as FilterChip['tone'],
                    count: statusFiltered.filter((item) => item.status === statusFilter).length,
                  },
                ]
              : []),
            ...(categoryFilter !== 'ALL'
              ? [
                  {
                    key: 'category' as const,
                    label: CATEGORY_LABELS[categoryFilter],
                    tone: 'neutral' as FilterChip['tone'],
                    count: statusFiltered.filter((item) => item.category === categoryFilter).length,
                  },
                ]
              : []),
          ]}
          onRemove={(key) => {
            if (key === 'status') setStatusFilter('ALL');
            if (key === 'category') setCategoryFilter('ALL');
          }}
          onClearAll={() => {
            setStatusFilter('ALL');
            setCategoryFilter('ALL');
          }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`规则列表（匹配 ${sortedItems.length} 条）`}
          columns={columns}
          items={pageItems}
          rowKey={(item: RuleItem) => item.id}
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
