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
import type { FallbackTool } from '../agent-view-model';

interface AgentToolsClientProps {
  tools: FallbackTool[];
  deliveryMode: 'api' | 'fallback';
  error?: string;
}

const RISK_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险'
};

const RISK_VARIANT: Record<'low' | 'medium' | 'high', 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger'
};

function buildColumns(): DataTableColumn<FallbackTool>[] {
  return [
    {
      key: 'name',
      title: '工具名',
      dataKey: 'name',
      sortable: true,
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>
          {item.name}
        </span>
      )
    },
    {
      key: 'category',
      title: '类别',
      sortable: true,
      sortValue: (item) => item.category,
      render: (item) => (
        <span style={{ fontSize: 12, color: '#a5b4fc' }}>{item.category}</span>
      )
    },
    {
      key: 'description',
      title: '说明',
      render: (item) => (
        <div style={{ maxWidth: 380, color: '#94a3b8', fontSize: 12 }}>
          {item.description}
        </div>
      )
    },
    {
      key: 'riskLevel',
      title: '风险等级',
      sortable: true,
      sortValue: (item) => ({ low: 0, medium: 1, high: 2 })[item.riskLevel],
      render: (item) => (
        <StatusBadge
          label={RISK_LABEL[item.riskLevel]}
          variant={RISK_VARIANT[item.riskLevel]}
          size="sm"
          dot
        />
      )
    },
    {
      key: 'params',
      title: '入参',
      render: (item) => {
        const props = item.inputSchema?.properties ?? {};
        const required = item.inputSchema?.required ?? [];
        const keys = Object.keys(props);
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 240 }}>
            {keys.length === 0 ? (
              <span style={{ color: '#64748b', fontSize: 11 }}>—</span>
            ) : (
              keys.map((k) => (
                <span
                  key={k}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: required.includes(k)
                      ? 'rgba(248, 113, 113, 0.15)'
                      : 'rgba(148, 163, 184, 0.15)',
                    color: required.includes(k) ? '#fca5a5' : '#94a3b8'
                  }}
                >
                  {k}
                  {required.includes(k) ? '*' : ''}
                </span>
              ))
            )}
          </div>
        );
      }
    }
  ];
}

export default function AgentToolsClient({ tools, deliveryMode, error }: AgentToolsClientProps) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tools.filter((t) => {
      if (riskFilter !== 'all' && t.riskLevel !== riskFilter) return false;
      if (!term) return true;
      return `${t.name} ${t.category} ${t.description}`.toLowerCase().includes(term);
    });
  }, [tools, search, riskFilter]);

  const columns = useMemo(() => buildColumns(), []);
  const counts = {
    all: tools.length,
    high: tools.filter((t) => t.riskLevel === 'high').length,
    medium: tools.filter((t) => t.riskLevel === 'medium').length,
    low: tools.filter((t) => t.riskLevel === 'low').length
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
          { key: 'high', label: '高风险', count: counts.high },
          { key: 'medium', label: '中风险', count: counts.medium },
          { key: 'low', label: '低风险', count: counts.low }
        ]}
        activeKey={riskFilter}
        onChange={(key) => setRiskFilter(key as 'all' | 'low' | 'medium' | 'high')}
        variant="pills"
      />
      <SearchFilterInput value={search} onChange={setSearch} placeholder="搜索工具名、类别或说明..." />
      <DataTable columns={columns} data={filtered} rowKey={(item) => item.name} />
    </div>
  );
}