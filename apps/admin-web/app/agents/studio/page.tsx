'use client';

/**
 * Agent Studio · 写操作面板
 * 功能: 创建/运行/批量执行/删除 Agent 配置与会话
 * 所有写操作直接调用后端 SDK,失败时显示原始错误便于排查
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Badge, Button, DataTable, LoadingSkeleton, Modal, PageShell, Pagination,
  SearchFilterInput, Select, StatCard, StatusBadge,
  usePagination, useSearchFilter, useSortedItems,
  type DataTableColumn, type DataTableSortConfig,
} from '@m5/ui';
import { loadAgentConfigs } from '../agent-view-model';
import AgentStudioClient from './studio-client';

export const dynamic = 'force-dynamic';

// ---- 类型 ----

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  enabled: boolean;
  enableReflection: boolean;
  maxSteps: number;
  timeout: number;
  createdAt: string;
  toolCount: number;
}

// ---- 模拟数据 ----

const MOCK_CONFIGS: AgentConfig[] = [
  { id: 'ag-001', name: '客服分析助手', model: 'gpt-4o', enabled: true, enableReflection: true, maxSteps: 5, timeout: 30000, createdAt: '2026-06-01', toolCount: 4 },
  { id: 'ag-002', name: '订单处理Agent', model: 'gpt-4o-mini', enabled: true, enableReflection: false, maxSteps: 10, timeout: 60000, createdAt: '2026-06-05', toolCount: 6 },
  { id: 'ag-003', name: '数据报表生成器', model: 'claude-3-sonnet', enabled: false, enableReflection: false, maxSteps: 3, timeout: 15000, createdAt: '2026-06-10', toolCount: 2 },
  { id: 'ag-004', name: '智能推荐系统', model: 'gpt-4o', enabled: true, enableReflection: true, maxSteps: 8, timeout: 45000, createdAt: '2026-06-15', toolCount: 5 },
  { id: 'ag-005', name: '风险监控Agent', model: 'claude-3-haiku', enabled: false, enableReflection: true, maxSteps: 15, timeout: 90000, createdAt: '2026-06-20', toolCount: 8 },
];

const MODEL_OPTS = [{ value: '', label: '全部模型' }, { value: 'gpt-4o', label: 'GPT-4o' }, { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }, { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }, { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }];

function buildColumns(): DataTableColumn<AgentConfig>[] {
  return [
    { key: 'name', title: '名称', dataKey: 'name', sortable: true },
    { key: 'model', title: '模型', dataKey: 'model', sortable: true, render: (r: AgentConfig) => <Badge variant="info">{r.model}</Badge> },
    { key: 'enabled', title: '状态', dataKey: 'enabled', sortable: true, render: (r: AgentConfig) => <StatusBadge label={r.enabled ? '启用' : '停用'} variant={r.enabled ? 'success' : 'neutral'} /> },
    { key: 'maxSteps', title: '最大步数', dataKey: 'maxSteps', sortable: true, align: 'right' },
    { key: 'timeout', title: '超时(ms)', dataKey: 'timeout', sortable: true, align: 'right', render: (r: AgentConfig) => <span className="font-mono text-slate-300">{r.timeout.toLocaleString()}</span> },
    { key: 'toolCount', title: '工具数', dataKey: 'toolCount', sortable: true, align: 'right' },
    { key: 'createdAt', title: '创建时间', dataKey: 'createdAt', sortable: true, render: (r: AgentConfig) => <span className="text-xs text-slate-400">{r.createdAt}</span> },
  ];
}

export default async function AgentStudioPage() {
  const snapshot = await loadAgentConfigs({ cache: 'no-store' });
  const configCount = snapshot.configs?.length ?? 0;
  const enabledCount = snapshot.configs?.filter((c) => c.enabled !== false).length ?? 0;

  return (
    <PageShell title="Agent Studio · 写操作面板"
      subtitle="创建/运行/批量执行/删除 Agent 配置与会话。所有写操作直接调用后端 SDK,失败时显示原始错误便于排查。">
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Agent 配置数" value={configCount} />
        <StatCard label="启用中" value={enabledCount} />
        <StatCard label="交付模式" value={snapshot.deliveryMode === 'api' ? 'API' : '回退'} />
      </div>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <SearchFilterInput placeholder="搜索Agent名称/模型..." value="" onChange={() => {}} />
        </div>
      </div>
      <AgentStudioClient configs={snapshot.configs} deliveryMode={snapshot.deliveryMode} />
    </PageShell>
  );
}
