'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable, DetailActionBar, SearchFilterInput, Tabs, type DataTableColumn } from '@m5/ui';
import type {
  IntegrationEventEnvelopeContract,
  IntegrationIdempotencyRecordContract,
  IntegrationOrchestrationWorkspace,
  IntegrationWebhookSourceContract
} from '@m5/types';
import {
  buildIntegrationOrchestrationEventDetailHref,
  buildIntegrationOrchestrationIdempotencyDetailHref,
  buildIntegrationOrchestrationSourceDetailHref
} from '@m5/types';
import {
  summarizeIdempotencyRecord,
  summarizeIntegrationEvent,
  summarizeWebhookSource
} from '../integration-orchestration-view-model';
import { useDetailActions } from '../components/use-detail-actions';

interface IntegrationOrchestrationWorkspaceClientProps {
  workspace: IntegrationOrchestrationWorkspace;
  foundationDependencies: string[];
}

type TabKey = 'overview' | 'sources' | 'events' | 'idempotency';

export default function IntegrationOrchestrationWorkspaceClient({
  workspace,
  foundationDependencies
}: IntegrationOrchestrationWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const { actions } = useDetailActions({
    workspace: 'integration-orchestration',
    detailId: 'overview',
    record: workspace,
    shareTitle: '集成编排工作台',
    shareText: '查看来源/事件/幂等记录快照'
  });

  const filteredSources = useMemo(() => {
    return workspace.sources.filter((item) => {
      if (!search.trim()) {
        return true;
      }
      return `${item.source} ${item.description} ${item.secretRef}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, workspace.sources]);

  const filteredEvents = useMemo(() => {
    return workspace.events.filter((item) => {
      if (!search.trim()) {
        return true;
      }
      return `${item.eventName} ${item.source} ${item.aggregateId ?? ''} ${item.idempotencyKey}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [search, workspace.events]);

  const filteredIdempotency = useMemo(() => {
    return workspace.idempotencyRecords.filter((item) => {
      if (!search.trim()) {
        return true;
      }
      return `${item.key} ${item.source} ${item.eventType} ${item.eventId}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, workspace.idempotencyRecords]);

  const sourceColumns: DataTableColumn<IntegrationWebhookSourceContract>[] = [
    {
      key: 'source',
      title: '来源',
      render: (item) => (
        <div>
          <Link
            href={buildIntegrationOrchestrationSourceDetailHref(item.source)}
            style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
          >
            {item.source}
          </Link>
          <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeWebhookSource(item)}</div>
        </div>
      )
    },
    {
      key: 'algorithm',
      title: '算法',
      render: (item) => item.algorithm
    },
    {
      key: 'toleranceSeconds',
      title: '容忍窗口',
      render: (item) => `${item.toleranceSeconds}s`
    },
    {
      key: 'secretRef',
      title: 'Secret Ref',
      render: (item) => item.secretRef
    },
    {
      key: 'description',
      title: '说明',
      render: (item) => item.description
    }
  ];

  const eventColumns: DataTableColumn<IntegrationEventEnvelopeContract>[] = [
    {
      key: 'eventName',
      title: '事件',
      render: (item) => (
        <div>
          <Link
            href={buildIntegrationOrchestrationEventDetailHref(item.envelopeId)}
            style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
          >
            {item.eventName}
          </Link>
          <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeIntegrationEvent(item)}</div>
        </div>
      )
    },
    {
      key: 'source',
      title: '来源',
      render: (item) => (
        <Link
          href={buildIntegrationOrchestrationSourceDetailHref(item.source)}
          style={{ color: '#93c5fd', textDecoration: 'none' }}
        >
          {item.source}
        </Link>
      )
    },
    {
      key: 'aggregateId',
      title: '聚合 ID',
      render: (item) => item.aggregateId ?? '—'
    },
    {
      key: 'idempotencyKey',
      title: '幂等键',
      render: (item) => (
        <Link
          href={buildIntegrationOrchestrationIdempotencyDetailHref(item.idempotencyKey)}
          style={{ color: '#93c5fd', fontFamily: 'monospace', fontSize: 12, textDecoration: 'none' }}
        >
          {item.idempotencyKey}
        </Link>
      )
    },
    {
      key: 'occurredAt',
      title: '发生时间',
      render: (item) => new Date(item.occurredAt).toLocaleString('zh-CN')
    }
  ];

  const idempotencyColumns: DataTableColumn<IntegrationIdempotencyRecordContract>[] = [
    {
      key: 'key',
      title: '幂等键',
      render: (item) => (
        <div>
          <Link
            href={buildIntegrationOrchestrationIdempotencyDetailHref(item.key)}
            style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
          >
            {item.key}
          </Link>
          <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeIdempotencyRecord(item)}</div>
        </div>
      )
    },
    {
      key: 'source',
      title: '来源',
      render: (item) => (
        <Link
          href={buildIntegrationOrchestrationSourceDetailHref(item.source)}
          style={{ color: '#93c5fd', textDecoration: 'none' }}
        >
          {item.source}
        </Link>
      )
    },
    {
      key: 'eventId',
      title: '事件 ID',
      render: (item) => item.eventId
    },
    {
      key: 'status',
      title: '状态',
      render: (item) => item.status
    },
    {
      key: 'firstSeenAt',
      title: '首次出现',
      render: (item) => new Date(item.firstSeenAt).toLocaleString('zh-CN')
    }
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ marginBottom: 4 }}>
        <Tabs
          items={[
            { key: 'overview', label: '总览' },
            { key: 'sources', label: 'Webhook 来源', count: workspace.summary.sources },
            { key: 'events', label: '事件信封', count: workspace.summary.events },
            { key: 'idempotency', label: '幂等记录', count: workspace.summary.idempotencyRecords }
          ]}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          variant="pills"
        />
      </div>

      {activeTab !== 'overview' ? (
        <SearchFilterInput
          value={search}
          onChange={setSearch}
          placeholder={`搜索${activeTab === 'sources' ? '来源' : activeTab === 'events' ? '事件' : '幂等记录'}...`}
        />
      ) : null}

      {activeTab === 'overview' ? (
        <div style={overviewGridStyle}>
          <SummaryCard title="Webhook 来源" value={`${workspace.summary.sources}`} detail="已登记的验签来源目录" />
          <SummaryCard title="事件信封" value={`${workspace.summary.events}`} detail="最近 100 条 domain event / webhook envelope" />
          <SummaryCard
            title="幂等记录"
            value={`${workspace.summary.idempotencyRecords}`}
            detail="基于 idempotencyKey 的去重结果"
          />
          <SummaryCard title="活跃来源" value={`${workspace.summary.uniqueEventSources}`} detail="当前事件流里实际出现的 source 数量" />
          <SummaryCard
            title="敏感去重"
            value={`${workspace.summary.duplicateSensitiveRecords}`}
            detail="以 lyt / payment 前缀识别的敏感幂等记录"
          />
          <SummaryCard
            title="基础依赖"
            value={`${foundationDependencies.length}`}
            detail={foundationDependencies.join(' · ') || '—'}
          />
        </div>
      ) : null}

      {activeTab === 'sources' ? (
        <DataTable
          title={`Webhook 来源（${filteredSources.length}）`}
          columns={sourceColumns}
          items={filteredSources}
          rowKey={(item) => item.source}
          striped
          compact
        />
      ) : null}

      {activeTab === 'events' ? (
        <DataTable
          title={`事件信封（${filteredEvents.length}）`}
          columns={eventColumns}
          items={filteredEvents}
          rowKey={(item) => item.envelopeId}
          striped
          compact
        />
      ) : null}

      {activeTab === 'idempotency' ? (
        <DataTable
          title={`幂等记录（${filteredIdempotency.length}）`}
          columns={idempotencyColumns}
          items={filteredIdempotency}
          rowKey={(item) => item.key}
          striped
          compact
        />
      ) : null}

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前集成编排工作台"
      />
    </div>
  );
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#93c5fd', marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#cbd5f5' }}>{detail}</div>
    </div>
  );
}

const overviewGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};

const summaryCardStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.55)'
};
