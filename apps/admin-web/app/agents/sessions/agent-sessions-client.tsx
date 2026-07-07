'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DataTable,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  type DataTableColumn
} from '@m5/ui';
import type { AgentSession, AgentSessionStatus } from '@m5/types';

interface AgentSessionsClientProps {
  sessions: AgentSession[];
  deliveryMode: 'api' | 'fallback';
  error?: string;
}

const STATUS_LABEL: Record<AgentSessionStatus, string> = {
  PENDING: '等待中',
  RUNNING: '运行中',
  COMPLETED: '已完成',
  FAILED: '失败',
  CANCELLED: '已取消'
};

const STATUS_VARIANT: Record<AgentSessionStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  PENDING: 'info',
  RUNNING: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral'
};

function buildColumns(): DataTableColumn<AgentSession>[] {
  return [
    {
      key: 'id',
      title: '会话 ID',
      dataKey: 'id',
      render: (item) => (
        <Link
          href={`/agents/sessions/${item.id}`}
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#60a5fa',
            textDecoration: 'none'
          }}
        >
          {item.id} →
        </Link>
      )
    },
    {
      key: 'configId',
      title: '使用配置',
      sortable: true,
      dataKey: 'configId',
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{item.configId}</span>
      )
    },
    {
      key: 'userInput',
      title: '用户输入',
      render: (item) => (
        <div style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.userInput}
        </div>
      )
    },
    {
      key: 'steps',
      title: '步数',
      align: 'right',
      sortable: true,
      sortValue: (item) => item.currentStep,
      render: (item) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#cbd5e1' }}>
          {item.currentStep} / {item.maxSteps}
        </span>
      )
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item) => item.status,
      render: (item) => (
        <StatusBadge
          label={STATUS_LABEL[item.status]}
          variant={STATUS_VARIANT[item.status]}
          size="sm"
          dot
        />
      )
    },
    {
      key: 'createdAt',
      title: '开始时间',
      sortable: true,
      sortValue: (item) => item.createdAt,
      render: (item) => (
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
          {item.createdAt.slice(11, 19)}
        </span>
      )
    },
    {
      key: 'finalOutput',
      title: '最终输出',
      render: (item) => (
        <div
          style={{
            maxWidth: 280,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: item.finalOutput ? '#cbd5e1' : '#64748b',
            fontSize: 12
          }}
        >
          {item.finalOutput ?? (item.error ? `⚠ ${item.error}` : '—')}
        </div>
      )
    }
  ];
}

export default function AgentSessionsClient({
  sessions,
  deliveryMode,
  error
}: AgentSessionsClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentSessionStatus | 'all'>('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!term) return true;
      return `${s.id} ${s.configId} ${s.userInput} ${s.finalOutput ?? ''} ${s.error ?? ''}`
        .toLowerCase()
        .includes(term);
    });
  }, [sessions, search, statusFilter]);

  const columns = useMemo(() => buildColumns(), []);

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
          { key: 'all', label: '全部', count: sessions.length },
          { key: 'RUNNING', label: '运行中', count: sessions.filter((s) => s.status === 'RUNNING').length },
          { key: 'COMPLETED', label: '已完成', count: sessions.filter((s) => s.status === 'COMPLETED').length },
          { key: 'FAILED', label: '失败', count: sessions.filter((s) => s.status === 'FAILED').length }
        ]}
        activeKey={statusFilter}
        onChange={(key) => setStatusFilter(key as AgentSessionStatus | 'all')}
        variant="pills"
      />
      <SearchFilterInput
        value={search}
        onChange={setSearch}
        placeholder="搜索 ID、配置、用户输入或最终输出..."
      />
      <DataTable columns={columns} data={filtered} rowKey={(item) => item.id} />
    </div>
  );
}