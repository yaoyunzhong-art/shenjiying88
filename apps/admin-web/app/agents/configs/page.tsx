import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import { AdminPermissionGate } from '../../components/admin-permission-gate';
import { loadAgentConfigs } from '../agent-view-model';
import AgentConfigsClient from './agent-configs-client';

export const dynamic = 'force-dynamic';

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'Agent 配置中心访问受限',
  description:
    'Agent 配置中心已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看模型配置、启停状态与批量治理能力。',
} as const;

export default async function AgentConfigsPage() {
  const snapshot = await loadAgentConfigs({ cache: 'no-store' });
  const configs = snapshot.configs;
  const enabledCount = configs.filter((c) => c.enabled).length;
  const disabledCount = configs.length - enabledCount;
  const reflectionCount = configs.filter((c) => c.enableReflection).length;
  const avgTimeoutSeconds =
    configs.length > 0
      ? Math.round(configs.reduce((sum, item) => sum + item.timeoutMs, 0) / configs.length / 1000)
      : 0;

  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="Agent 配置中心"
          subtitle="管理 ReAct Agent 的 system prompt、模型选择、最大步数、允许工具与超时,作为 Agent 运行时的基础配置。"
        >
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              marginBottom: 20
            }}
          >
            <StatCard label="配置总数" value={configs.length} helper="全部 Agent 配置" />
            <StatCard label="已启用" value={enabledCount} helper="可被会话调用" tone="success" />
            <StatCard label="已禁用" value={disabledCount} helper="已下线" tone="neutral" />
            <StatCard
              label="启用反思"
              value={reflectionCount}
              helper={`平均超时 ${avgTimeoutSeconds}s`}
              tone="info"
            />
          </div>
          <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载 Agent 配置..." />}>
            <AgentConfigsClient
              configs={snapshot.configs}
              deliveryMode={snapshot.deliveryMode}
              error={snapshot.error}
            />
          </Suspense>
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}

// ---- 数据导出与统计辅助 ----

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
