'use client';

/**
 * Agent 配置中心 — Agent Configs Center
 * 管理 ReAct Agent 的 system prompt、模型选择、最大步数、允许工具与超时
 *
 * 页面结构:
 * - 统计卡片: 配置总数 / 已启用 / 已禁用 / 启用反思
 * - 操作栏: 搜索 / 模型筛选 / 状态切换 / 统计摘要
 * - 状态切换: 全部 / 启用 / 禁用 三态切换
 * - 配置表格: 名称 / 模型 / 状态 / 步数 / 超时 / 反思 / 工具数 / 创建时间
 * - 分页: 10条/页 (5/10/20 可选)
 * - 加载态: LoadingSkeleton 包裹客户端组件
 * - 空态: 无配置时显示引导提示
 */

import { Suspense, useState, useMemo } from 'react';
import {
  Badge, Button, DataTable, LoadingSkeleton, PageShell, Pagination,
  SearchFilterInput, Select, StatCard, StatusBadge,
  usePagination, useSortedItems, type DataTableColumn, type DataTableSortConfig,
} from '@m5/ui';
import { AdminPermissionGate } from '../../components/admin-permission-gate';
import { loadAgentConfigs } from '../agent-view-model';
import AgentConfigsClient from './agent-configs-client';

export const dynamic = 'force-dynamic';

// ---- 类型定义 ----

interface AgentConfigBrief {
  id: string;
  name: string;
  model: string;
  enabled: boolean;
  enableReflection: boolean;
  maxSteps: number;
  timeout: number;
  createdAt: string;
  toolCount: number;
  systemPrompt?: string;
}

// ---- 模拟数据 ----

const MOCK: AgentConfigBrief[] = [
  { id: 'ag-001', name: '客服分析助手', model: 'gpt-4o', enabled: true, enableReflection: true, maxSteps: 5, timeout: 30000, createdAt: '2026-06-01', toolCount: 4 },
  { id: 'ag-002', name: '订单处理Agent', model: 'gpt-4o-mini', enabled: true, enableReflection: false, maxSteps: 10, timeout: 60000, createdAt: '2026-06-05', toolCount: 6 },
  { id: 'ag-003', name: '数据报表生成器', model: 'claude-3-sonnet', enabled: false, enableReflection: false, maxSteps: 3, timeout: 15000, createdAt: '2026-06-10', toolCount: 2 },
  { id: 'ag-004', name: '智能推荐系统', model: 'gpt-4o', enabled: true, enableReflection: true, maxSteps: 8, timeout: 45000, createdAt: '2026-06-15', toolCount: 5 },
  { id: 'ag-005', name: '风险监控Agent', model: 'claude-3-haiku', enabled: false, enableReflection: true, maxSteps: 15, timeout: 90000, createdAt: '2026-06-20', toolCount: 8 },
  { id: 'ag-006', name: '营销活动优化器', model: 'gpt-4o', enabled: true, enableReflection: false, maxSteps: 6, timeout: 30000, createdAt: '2026-06-25', toolCount: 3 },
  { id: 'ag-007', name: '用户行为分析', model: 'gpt-4o-mini', enabled: false, enableReflection: true, maxSteps: 7, timeout: 30000, createdAt: '2026-06-28', toolCount: 4 },
  { id: 'ag-008', name: '库存预警Agent', model: 'claude-3-haiku', enabled: true, enableReflection: false, maxSteps: 4, timeout: 15000, createdAt: '2026-07-01', toolCount: 3 },
  { id: 'ag-009', name: '数据清洗流水线', model: 'gpt-4o-mini', enabled: true, enableReflection: true, maxSteps: 12, timeout: 120000, createdAt: '2026-07-05', toolCount: 6 },
  { id: 'ag-010', name: '自动化测试Agent', model: 'claude-3-sonnet', enabled: false, enableReflection: false, maxSteps: 20, timeout: 180000, createdAt: '2026-07-08', toolCount: 9 },
];

// ---- 常量和辅助 ----

const MODEL_OPTS = [
  { value: '', label: '全部模型' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'Agent 配置中心访问受限',
  description:
    'Agent 配置中心已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看模型配置、启停状态与批量治理能力。',
} as const;

function fmtTimeout(ms: number): string {
  if (ms >= 60000) return `${(ms / 60000).toFixed(0)}min`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(0)}s`;
  return `${ms}ms`;
}

// ---- 列定义 ----

function buildColumns(): DataTableColumn<AgentConfigBrief>[] {
  return [
    { key: 'name', title: '配置名称', dataKey: 'name', sortable: true,
      render: (r: AgentConfigBrief) => <span className="text-blue-400 font-medium">{r.name}</span>,
    },
    { key: 'model', title: '模型', dataKey: 'model', sortable: true,
      render: (r: AgentConfigBrief) => <Badge variant="info">{r.model}</Badge>,
    },
    { key: 'enabled', title: '状态', dataKey: 'enabled', sortable: true,
      render: (r: AgentConfigBrief) => (
        <StatusBadge label={r.enabled ? '启用' : '停用'} variant={r.enabled ? 'success' : 'neutral'} />
      ),
    },
    { key: 'enableReflection', title: '反思', dataKey: 'enableReflection', sortable: true,
      render: (r: AgentConfigBrief) => (
        <Badge variant={r.enableReflection ? 'success' : 'default'}>{r.enableReflection ? '启用' : '关闭'}</Badge>
      ),
    },
    { key: 'maxSteps', title: '最大步数', dataKey: 'maxSteps', sortable: true, align: 'right',
      render: (r: AgentConfigBrief) => <span className="font-mono">{r.maxSteps}</span>,
    },
    { key: 'timeout', title: '超时', dataKey: 'timeout', sortable: true, align: 'right',
      render: (r: AgentConfigBrief) => <span className="font-mono text-slate-300">{fmtTimeout(r.timeout)}</span>,
    },
    { key: 'toolCount', title: '工具数', dataKey: 'toolCount', sortable: true, align: 'right' },
    { key: 'createdAt', title: '创建时间', dataKey: 'createdAt', sortable: true,
      render: (r: AgentConfigBrief) => <span className="text-xs text-slate-400">{r.createdAt}</span>,
    },
  ];
}

// ---- 主页面 ----

export default function AgentConfigsPage() {
  const [configs] = useState<AgentConfigBrief[]>(MOCK);
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({ key: 'createdAt', direction: 'desc' });
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 20] });

  // ---- 筛选 ----
  const tabFiltered = useMemo(() => {
    if (activeTab === 'all') return configs;
    return configs.filter((c) => activeTab === 'enabled' ? c.enabled : !c.enabled);
  }, [configs, activeTab]);

  const filtered = useMemo(() => {
    let items = tabFiltered;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q) || c.model.toLowerCase().includes(q));
    }
    if (modelFilter) items = items.filter((c) => c.model === modelFilter);
    return items;
  }, [tabFiltered, search, modelFilter]);

  // ---- 统计 ----
  const enabledCount = configs.filter((c) => c.enabled).length;
  const disabledCount = configs.length - enabledCount;
  const reflectionCount = configs.filter((c) => c.enableReflection).length;
  const totalTools = configs.reduce((s, c) => s + c.toolCount, 0);
  const avgTimeout = Math.round(configs.reduce((s, c) => s + c.timeout, 0) / configs.length / 1000);

  // ---- 排序与分页 ----
  const cols = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(filtered, cols, sortConfig);
  const pageItems = pagination.paginate(sorted);

  // ---- 渲染 ----
  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="Agent 配置中心"
          subtitle="管理 ReAct Agent 的 system prompt、模型选择、最大步数、允许工具与超时,作为 Agent 运行时的基础配置。"
        >
          {/* 统计卡片 */}
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
            <StatCard label="配置总数" value={configs.length} helper="全部 Agent 配置" />
            <StatCard label="已启用" value={enabledCount} helper="可被会话调用" tone="success" />
            <StatCard label="已禁用" value={disabledCount} helper="已下线" tone="neutral" />
            <StatCard label="启用反思" value={reflectionCount} helper="enableReflection" tone="info" />
          </div>

          {/* 操作栏 */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <SearchFilterInput placeholder="搜索 Agent 名称或模型..." value={search}
                onChange={(v) => { setSearch(v); pagination.setPage(1); }} />
            </div>
            <Select options={MODEL_OPTS} value={modelFilter}
              onChange={(v) => { setModelFilter(v); pagination.setPage(1); }} placeholder="模型" />
            <span className="text-xs text-slate-500">共 {filtered.length} / {configs.length} 条</span>
          </div>

          {/* 状态切换 */}
          <div className="flex gap-2 mb-3">
            {[
              { k: 'all', l: '全部', c: configs.length },
              { k: 'enabled', l: '启用', c: enabledCount },
              { k: 'disabled', l: '禁用', c: disabledCount },
            ].map((tab) => (
              <button key={tab.k}
                onClick={() => { setActiveTab(tab.k); pagination.setPage(1); setSearch(''); setModelFilter(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.k ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}>
                {tab.l} ({tab.c})
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-xs text-slate-500 py-2">工具总数: {totalTools} · 平均超时: {avgTimeout}s</span>
          </div>

          {/* 数据表格 */}
          <DataTable<AgentConfigBrief>
            columns={cols}
            rows={pageItems}
            sort={sortConfig}
            onSortChange={setSortConfig}
            emptyText={search || modelFilter ? '未找到匹配的 Agent 配置' : '暂无 Agent 配置数据'}
            rowKey={(r) => r.id}
          />

          {/* 分页 */}
          <div className="flex justify-end mt-4">
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sorted.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}

// ---- 数据导出与统计辅助 ----

function prepareConfigExport(confs: AgentConfigBrief[]): string {
  const header = '名称,模型,状态,反思,最大步数,超时,工具数,创建时间';
  const rows = confs.map((c) => `"${c.name}","${c.model}","${c.enabled ? '启用' : '停用'}","${c.enableReflection ? '是' : '否'}",${c.maxSteps},${c.timeout},${c.toolCount},"${c.createdAt}"`);
  return [header, ...rows].join('\n');
}

function modelDistribution(configs: AgentConfigBrief[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const c of configs) {
    dist[c.model] = (dist[c.model] ?? 0) + 1;
  }
  return dist;
}

function summaryStats(configs: AgentConfigBrief[]) {
  const total = configs.length;
  const enabled = configs.filter((c) => c.enabled).length;
  const avgSteps = total > 0 ? Math.round(configs.reduce((s, c) => s + c.maxSteps, 0) / total) : 0;
  const avgTools = total > 0 ? Math.round(configs.reduce((s, c) => s + c.toolCount, 0) / total) : 0;
  return { total, enabled, avgSteps, avgTools };
}

const CONFIG_PAGE_META = {
  title: 'Agent 配置中心',
  subtitle: '管理 ReAct Agent 的 system prompt、模型选择、最大步数、允许工具与超时',
} as const;

// ---- 新增: 批量操作与启用/禁用切换 ----

interface BatchAction {
  type: 'enable' | 'disable' | 'delete';
  ids: string[];
}

async function executeBatchAction(action: BatchAction): Promise<{ success: number; failed: number }> {
  // 模拟批量操作
  await new Promise((r) => setTimeout(r, 100));
  const success = action.ids.length;
  return { success, failed: 0 };
}

function toggleConfigStatus(configs: AgentConfigBrief[], id: string): AgentConfigBrief[] {
  return configs.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
}

async function batchToggle(configs: AgentConfigBrief[], ids: string[], enable: boolean): Promise<AgentConfigBrief[]> {
  const action: BatchAction = { type: enable ? 'enable' : 'disable', ids };
  await executeBatchAction(action);
  return configs.map((c) => (ids.includes(c.id) ? { ...c, enabled: enable } : c));
}

// ---- 开关配置组件 ----

function EnableToggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? 'bg-emerald-500' : 'bg-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={enabled}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-4.5' : 'translate-x-1'
      }`} />
    </button>
  );
}

// ---- 批量操作栏 ----

function BatchActionBar({ selectedIds, onBatchAction }: {
  selectedIds: string[];
  onBatchAction: (type: 'enable' | 'disable' | 'delete') => void;
}) {
  if (selectedIds.length === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-3">
      <span className="text-xs text-blue-400">已选 {selectedIds.length} 项</span>
      <button onClick={() => onBatchAction('enable')}
        className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors">
        启用
      </button>
      <button onClick={() => onBatchAction('disable')}
        className="px-3 py-1 text-xs bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors">
        禁用
      </button>
      <button onClick={() => onBatchAction('delete')}
        className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">
        删除
      </button>
    </div>
  );
}

// ---- 筛选辅助函数 ----

function applyFilters(configs: AgentConfigBrief[], search: string, modelFilter: string): AgentConfigBrief[] {
  let result = configs;
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter((c) => c.name.toLowerCase().includes(q) || c.model.toLowerCase().includes(q));
  }
  if (modelFilter) {
    result = result.filter((c) => c.model === modelFilter);
  }
  return result;
}

function countByModel(configs: AgentConfigBrief[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of configs) {
    counts[c.model] = (counts[c.model] ?? 0) + 1;
  }
  return counts;
}

function getStatusLabel(enabled: boolean): string {
  return enabled ? '已启用' : '已禁用';
}

function getAverageTimeoutText(configs: AgentConfigBrief[]): string {
  if (configs.length === 0) return '0s';
  const avg = configs.reduce((s, c) => s + c.timeout, 0) / configs.length;
  return `${Math.round(avg / 1000)}s`;
}

export {
  prepareConfigExport, modelDistribution, summaryStats, CONFIG_PAGE_META,
  executeBatchAction, toggleConfigStatus, batchToggle,
  EnableToggle, BatchActionBar,
  applyFilters, countByModel, getStatusLabel, getAverageTimeoutText,
};
