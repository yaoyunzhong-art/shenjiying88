'use client';

import React from 'react';
import { useMemo, useState } from 'react';
import {
  DataTable,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  type DataTableColumn
} from '@m5/ui';
import type { AgentConfig } from '@m5/types';
import { deleteAgentConfig } from '../agent-view-model';

interface AgentConfigsClientProps {
  configs: AgentConfig[];
  deliveryMode: 'api' | 'fallback';
  error?: string;
}

const ENABLED_LABEL: Record<'true' | 'false', string> = {
  true: '已启用',
  false: '已禁用'
};

const ENABLED_VARIANT: Record<'true' | 'false', 'success' | 'neutral'> = {
  true: 'success',
  false: 'neutral'
};

function buildColumns(onDelete: (id: string) => void): DataTableColumn<AgentConfig>[] {
  return [
    {
      key: 'name',
      title: '配置名',
      dataKey: 'name',
      sortable: true,
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.name}</div>
          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{item.id}</div>
        </div>
      )
    },
    {
      key: 'model',
      title: '模型',
      sortable: true,
      sortValue: (item) => item.model,
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{item.model}</span>
      )
    },
    {
      key: 'maxSteps',
      title: '最大步数',
      align: 'right',
      sortable: true,
      sortValue: (item) => item.maxSteps,
      render: (item) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.maxSteps}</span>
      )
    },
    {
      key: 'timeout',
      title: '超时',
      align: 'right',
      sortable: true,
      sortValue: (item) => item.timeoutMs,
      render: (item) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {(item.timeoutMs / 1000).toFixed(0)}s
        </span>
      )
    },
    {
      key: 'reflection',
      title: '反思',
      sortable: true,
      sortValue: (item) => (item.enableReflection ? 1 : 0),
      render: (item) => (
        <span style={{ fontSize: 12, color: item.enableReflection ? '#4ade80' : '#64748b' }}>
          {item.enableReflection ? '✓' : '—'}
        </span>
      )
    },
    {
      key: 'tools',
      title: '已绑定工具',
      render: (item) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#94a3b8' }}>
          {item.allowedTools.length} 个
        </span>
      )
    },
    {
      key: 'enabled',
      title: '状态',
      sortable: true,
      sortValue: (item) => (item.enabled ? 1 : 0),
      render: (item) => {
        const key = (item.enabled ? 'true' : 'false') as 'true' | 'false';
        return <StatusBadge label={ENABLED_LABEL[key]} variant={ENABLED_VARIANT[key]} size="sm" dot />;
      }
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      sortable: true,
      sortValue: (item) => item.updatedAt,
      render: (item) => (
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
          {item.updatedAt.slice(0, 10)}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <button
          onClick={() => onDelete(item.id)}
          style={{
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid rgba(248, 113, 113, 0.4)',
            background: 'rgba(248, 113, 113, 0.1)',
            color: '#f87171',
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          删除
        </button>
      )
    }
  ];
}

export default function AgentConfigsClient({ configs, deliveryMode, error }: AgentConfigsClientProps) {
  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return configs.filter((c) => {
      if (enabledFilter === 'enabled' && !c.enabled) return false;
      if (enabledFilter === 'disabled' && c.enabled) return false;
      if (!term) return true;
      return `${c.name} ${c.model} ${c.allowedTools.join(' ')}`.toLowerCase().includes(term);
    });
  }, [configs, search, enabledFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm(`确定删除 Agent 配置 ${id} ?`)) return;
    try {
      await deleteAgentConfig(id);
      window.location.reload();
    } catch (e) {
      alert(`删除失败: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  };

  const columns = useMemo(() => buildColumns(handleDelete), []);
  const counts = {
    all: configs.length,
    enabled: configs.filter((c) => c.enabled).length,
    disabled: configs.filter((c) => !c.enabled).length
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {deliveryMode === 'fallback' ? (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
            fontSize: 12
          }}
        >
          ⚠️ 后端不可达,正在展示 fallback 数据 ({error ?? 'unknown error'})
        </div>
      ) : null}
      <Tabs
        items={[
          { key: 'all', label: '全部', count: counts.all },
          { key: 'enabled', label: '已启用', count: counts.enabled },
          { key: 'disabled', label: '已禁用', count: counts.disabled }
        ]}
        activeKey={enabledFilter}
        onChange={(key) => setEnabledFilter(key as 'all' | 'enabled' | 'disabled')}
        variant="pills"
      />
      <SearchFilterInput
        value={search}
        onChange={setSearch}
        placeholder="搜索配置名、模型或工具..."
      />
      <DataTable columns={columns} data={filtered} rowKey={(item) => item.id} />
    </div>
  );
}