'use client';

import Link from 'next/link';
import {
  DataTable,
  StatusBadge,
  type DataTableColumn,
  DetailActionBar,
  DetailClosureBar,
  WorkspaceBreadcrumb,
  type DetailClosureLink
} from '@m5/ui';
import type {
  IntegrationEventEnvelopeContract,
  IntegrationIdempotencyRecordContract,
  IntegrationWebhookSourceContract
} from '@m5/types';
import { buildIntegrationOrchestrationEventDetailHref, buildIntegrationOrchestrationIdempotencyDetailHref } from '@m5/types';
import type { IntegrationOrchestrationSourceDetail } from '../../../integration-orchestration-detail-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface IntegrationOrchestrationSourceDetailClientProps {
  snapshot: IntegrationOrchestrationSourceDetail;
}

export default function IntegrationOrchestrationSourceDetailClient({
  snapshot
}: IntegrationOrchestrationSourceDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <SourceBoard record={snapshot.record} snapshot={snapshot} />;
}

function SourceBoard({
  record,
  snapshot
}: {
  record: IntegrationWebhookSourceContract;
  snapshot: IntegrationOrchestrationSourceDetail;
}) {
  const { actions } = useDetailActions({
    workspace: 'integration-orchestration',
    detailId: record.source,
    record
  });
  const eventColumns: DataTableColumn<IntegrationEventEnvelopeContract>[] = [
    {
      key: 'envelopeId',
      title: 'Envelope ID',
      render: (item) => (
        <Link
          href={buildIntegrationOrchestrationEventDetailHref(item.envelopeId)}
          style={{ color: '#93c5fd', fontFamily: 'monospace', fontSize: 12 }}
        >
          {item.envelopeId}
        </Link>
      )
    },
    {
      key: 'eventName',
      title: '事件',
      render: (item) => item.eventName
    },
    {
      key: 'aggregateId',
      title: '聚合 ID',
      render: (item) => item.aggregateId ?? '—'
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
        <Link
          href={buildIntegrationOrchestrationIdempotencyDetailHref(item.key)}
          style={{ color: '#93c5fd', fontFamily: 'monospace', fontSize: 12 }}
        >
          {item.key}
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
      render: (item) => <StatusBadge variant={item.status === 'accepted' ? 'success' : 'warning'} label={item.status} />
    },
    {
      key: 'firstSeenAt',
      title: '首次出现',
      render: (item) => new Date(item.firstSeenAt).toLocaleString('zh-CN')
    }
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'integration-orchestration', detailLabel: record.source })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard title="算法" value={record.algorithm} detail="验签算法" />
        <SummaryCard title="容忍窗口" value={`${record.toleranceSeconds}s`} detail="请求时间偏差" />
        <SummaryCard title="密钥引用" value={record.secretRef} detail="配置治理中的密钥条目" />
        <SummaryCard title="事件数量" value={`${snapshot.matchedEvents.length}`} detail="本来源产生的事件信封" />
      </div>

      <div style={panelStyle}>
        <SectionTitle>来源说明</SectionTitle>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>{record.description}</p>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `按 integration-source:${record.source} 过滤`,
            context: 'focused source+purpose',
            href: snapshot.auditHref
          },
          {
            key: 'foundation',
            title: 'Foundation 模块',
            subtitle: 'moduleKey=integration-orchestration',
            context: '聚焦模块 drilldown',
            href: snapshot.foundationHref
          },
          {
            key: 'approvals',
            title: '治理审批',
            subtitle: '查看相关变更单',
            context: '聚焦 PENDING',
            href: snapshot.approvalsHref
          },
          {
            key: 'workspace',
            title: '集成编排工作台',
            subtitle: '返回总览',
            context: '回到总览',
            href: snapshot.workspaceHref
          }
        ] satisfies DetailClosureLink[]}
      />

      <DetailActionBar actions={actions} />

      <DataTable
        title={`事件信封（${snapshot.matchedEvents.length}）`}
        columns={eventColumns}
        items={snapshot.matchedEvents}
        rowKey={(item) => item.envelopeId}
        striped
        compact
      />

      <DataTable
        title={`幂等记录（${snapshot.matchedIdempotencyRecords.length}）`}
        columns={idempotencyColumns}
        items={snapshot.matchedIdempotencyRecords}
        rowKey={(item) => item.key}
        striped
        compact
      />
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: IntegrationOrchestrationSourceDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'integration-orchestration', detailLabel: snapshot.source || '未找到' })}
      />
      <div style={panelStyle}>
        <SectionTitle>未找到来源</SectionTitle>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          来源 <code style={{ color: '#f87171' }}>{snapshot.source || '（空）'}</code> 不在当前 integration-orchestration 范围内。
          可尝试返回工作台确认是否已配置此来源。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回集成编排工作台',
            subtitle: '查看已配置的 webhook 来源',
            href: snapshot.workspaceHref
          },
          {
            key: 'foundation',
            title: 'Foundation 模块',
            subtitle: 'moduleKey=integration-orchestration',
            href: snapshot.foundationHref
          }
        ]}
      />
    </div>
  );
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#93c5fd', marginBottom: 6, wordBreak: 'break-all' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#cbd5f5' }}>{detail}</div>
    </div>
  );
}

// DeepLinkCard has been removed in favor of <DetailClosureBar> from @m5/ui.

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {children}
    </h2>
  );
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const summaryCardStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.55)'
};

const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.55)'
};