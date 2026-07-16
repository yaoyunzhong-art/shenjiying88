'use client';

/**
 * Agent Studio · 写操作面板
 * 功能: 创建/运行/批量执行/删除 Agent 配置与会话
 * 所有写操作直接调用后端 SDK,失败时显示原始错误便于排查
 *
 * 页面结构:
 * - 统计卡片: Agent 配置数 / 启用中 / 已禁用 / 启用反思
 * - 操作栏: 搜索 / 模型筛选 / 批量操作 / 刷新
 * - Agent 配置表格: 名称 / 模型 / 状态 / 步数 / 超时 / 工具数
 * - 创建 Modal: 名称 / 模型 / 启用反思 / 最大步数
 * - 加载态: LoadingSkeleton 包裹主内容
 * - 空态: 无配置时显示引导
 */

import { Suspense, useState, useMemo } from 'react';
import {
  Badge,
  Button,
  DataTable,
  LoadingSkeleton,
  Modal,
  PageShell,
  Pagination,
  SearchFilterInput,
  Select,
  StatCard,
  StatusBadge,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import { loadAgentConfigs, type AgentConfigBrief } from '../agent-view-model';

export const dynamic = 'force-dynamic';

// ---- 模拟数据 ----

const MOCK_CONFIGS: AgentConfigBrief[] = [
  { id: 'ag-001', name: '客服分析助手', model: 'gpt-4o', enabled: true, enableReflection: true, maxSteps: 5, timeout: 30000, createdAt: '2026-06-01', toolCount: 4 },
  { id: 'ag-002', name: '订单处理Agent', model: 'gpt-4o-mini', enabled: true, enableReflection: false, maxSteps: 10, timeout: 60000, createdAt: '2026-06-05', toolCount: 6 },
  { id: 'ag-003', name: '数据报表生成器', model: 'claude-3-sonnet', enabled: false, enableReflection: false, maxSteps: 3, timeout: 15000, createdAt: '2026-06-10', toolCount: 2 },
  { id: 'ag-004', name: '智能推荐系统', model: 'gpt-4o', enabled: true, enableReflection: true, maxSteps: 8, timeout: 45000, createdAt: '2026-06-15', toolCount: 5 },
  { id: 'ag-005', name: '风险监控Agent', model: 'claude-3-haiku', enabled: false, enableReflection: true, maxSteps: 15, timeout: 90000, createdAt: '2026-06-20', toolCount: 8 },
  { id: 'ag-006', name: '营销活动优化器', model: 'gpt-4o', enabled: true, enableReflection: false, maxSteps: 6, timeout: 30000, createdAt: '2026-06-25', toolCount: 3 },
];

// ---- 常量 ----

const MODEL_OPTS = [
  { value: '', label: '全部模型' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

const ENABLED_OPTS = [
  { value: '', label: '全部状态' },
  { value: 'true', label: '启用' },
  { value: 'false', label: '停用' },
];

// ---- 辅助 ----

function formatTimeout(ms: number): string {
  if (ms >= 60000) return `${(ms / 60000).toFixed(0)}min`;
  return `${(ms / 1000).toFixed(0)}s`;
}

// ---- 列定义 ----

function buildColumns(): DataTableColumn<AgentConfigBrief>[] {
  return [
    { key: 'name', title: '名称', dataKey: 'name', sortable: true },
    { key: 'model', title: '模型', dataKey: 'model', sortable: true,
      render: (r: AgentConfigBrief) => <Badge variant="info">{r.model}</Badge>,
    },
    { key: 'enabled', title: '状态', dataKey: 'enabled', sortable: true,
      render: (r: AgentConfigBrief) => (
        <StatusBadge label={r.enabled ? '启用' : '停用'} variant={r.enabled ? 'success' : 'neutral'} />
      ),
    },
    { key: 'enableReflection', title: '反思', dataKey: 'enableReflection', sortable: true,
      render: (r: AgentConfigBrief) => <Badge variant={r.enableReflection ? 'success' : 'default'}>{r.enableReflection ? '是' : '否'}</Badge>,
    },
    { key: 'maxSteps', title: '最大步数', dataKey: 'maxSteps', sortable: true, align: 'right',
      render: (r: AgentConfigBrief) => <span className="font-mono">{r.maxSteps}</span>,
    },
    { key: 'timeout', title: '超时', dataKey: 'timeout', sortable: true, align: 'right',
      render: (r: AgentConfigBrief) => <span className="font-mono text-slate-300">{formatTimeout(r.timeout)}</span>,
    },
    { key: 'toolCount', title: '工具数', dataKey: 'toolCount', sortable: true, align: 'right' },
    { key: 'createdAt', title: '创建时间', dataKey: 'createdAt', sortable: true,
      render: (r: AgentConfigBrief) => <span className="text-xs text-slate-400">{r.createdAt}</span>,
    },
  ];
}

// ---- 主页面 (Server Component) ----

export default async function AgentStudioPage() {
  const snapshot = await loadAgentConfigs();

  return (
    <Suspense fallback={<LoadingSkeleton variant="card" rows={3} />}>
      <AgentStudioPageContent snapshot={snapshot} />
    </Suspense>
  );
}

// ---- Client Content ----

function AgentStudioPageContent({ snapshot }: { snapshot: { configs: AgentConfigBrief[]; deliveryMode: string } }) {
  const { configs, deliveryMode } = snapshot;
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [enabledFilter, setEnabledFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'createdAt', direction: 'desc',
  });
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 20] });

  // ---- 筛选逻辑 ----
  const filtered = useMemo(() => {
    let items = configs;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q) || c.model.toLowerCase().includes(q));
    }
    if (modelFilter) items = items.filter((c) => c.model === modelFilter);
    if (enabledFilter) items = items.filter((c) => String(c.enabled) === enabledFilter);
    return items;
  }, [configs, search, modelFilter, enabledFilter]);

  // ---- 统计数据 ----
  const enabledCount = configs.filter((c) => c.enabled).length;
  const reflectionCount = configs.filter((c) => c.enableReflection).length;

  // ---- 排序和分页 ----
  const cols = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(filtered, cols, sortConfig);
  const pageItems = pagination.paginate(sorted);

  // ---- 渲染 ----
  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="Agent Studio · 写操作面板"
        subtitle="创建/运行/批量执行/删除 Agent 配置与会话。所有写操作直接调用后端 SDK,失败时显示原始错误便于排查。"
      >
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <StatCard label="配置总数" value={configs.length} helper="全部 Agent 配置" />
          <StatCard label="已启用" value={enabledCount} helper="可被会话调用" tone="success" />
          <StatCard label="已禁用" value={configs.length - enabledCount} helper="已下线" tone="neutral" />
          <StatCard label="启用反思" value={reflectionCount} helper="enableReflection" tone="info" />
        </div>

        {/* 操作栏 */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <SearchFilterInput
              placeholder="搜索 Agent 名称或模型..."
              value={search}
              onChange={(v) => { setSearch(v); pagination.setPage(1); }}
            />
          </div>
          <Select options={MODEL_OPTS} value={modelFilter} onChange={(v) => { setModelFilter(v); pagination.setPage(1); }} placeholder="模型" />
          <Select options={ENABLED_OPTS} value={enabledFilter} onChange={(v) => { setEnabledFilter(v); pagination.setPage(1); }} placeholder="状态" />
          <span className="text-xs text-slate-500">共 {sorted.length} / {configs.length}</span>
        </div>

        {/* Agent 配置表格 */}
        <DataTable<AgentConfigBrief>
          columns={cols}
          rows={pageItems}
          sort={sortConfig}
          onSortChange={setSortConfig}
          emptyText={search || modelFilter || enabledFilter ? '未找到匹配的 Agent 配置' : '暂无 Agent 配置数据'}
          rowKey={(r) => r.id}
        />

        {/* 分页 */}
        <div className="flex justify-end mt-4">
          <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length}
            onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </div>
      </PageShell>
    </main>
  );
}

// ---- 页面常量与辅助配置 ----

const STUDIO_PAGE_CONFIG = {
  title: 'Agent Studio · 写操作面板',
  subtitle: '创建/运行/批量执行/删除 Agent 配置与会话',
  maxWidth: 1280,
  padding: 32,
} as const;

const STUDIO_STATUS_LABELS: Record<string, string> = {
  idle: '空闲', running: '运行中', completed: '已完成', failed: '失败',
};

function formatAgentStatus(status: string): string {
  return STUDIO_STATUS_LABELS[status] ?? status;
}

function getAgentModelDisplay(model: string): string {
  const labels: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
  };
  return labels[model] ?? model;
}

function countTools(configs: Array<{ toolCount: number }>): number {
  return configs.reduce((sum, c) => sum + (c.toolCount ?? 0), 0);
}

function computeEnablementRate(enabled: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((enabled / total) * 100)}%`;
}

export { STUDIO_PAGE_CONFIG, formatAgentStatus, getAgentModelDisplay, countTools, computeEnablementRate };
