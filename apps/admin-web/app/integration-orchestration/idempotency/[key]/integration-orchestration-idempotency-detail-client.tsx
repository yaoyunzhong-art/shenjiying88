'use client';

import Link from 'next/link';
import {
  DataTable,
  type DataTableColumn,
  DetailActionBar,
  DetailClosureBar,
  WorkspaceBreadcrumb,
  type DetailClosureLink
} from '@m5/ui';
import type { IntegrationEventEnvelopeContract } from '@m5/types';
import { buildIntegrationOrchestrationEventDetailHref } from '@m5/types';
import type { IntegrationOrchestrationIdempotencyDetail } from '../../../integration-orchestration-detail-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface IntegrationOrchestrationIdempotencyDetailClientProps {
  snapshot: IntegrationOrchestrationIdempotencyDetail;
}

export default function IntegrationOrchestrationIdempotencyDetailClient({
  snapshot
}: IntegrationOrchestrationIdempotencyDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <IdempotencyBoard record={snapshot.record} snapshot={snapshot} />;
}

function IdempotencyBoard({
  record,
  snapshot
}: {
  record: NonNullable<IntegrationOrchestrationIdempotencyDetail['record']>;
  snapshot: IntegrationOrchestrationIdempotencyDetail;
}) {
  const { actions } = useDetailActions({
    workspace: 'integration-orchestration',
    detailId: record.key,
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
    { key: 'eventName', title: '事件', render: (item) => item.eventName },
    { key: 'aggregateId', title: '聚合 ID', render: (item) => item.aggregateId ?? '—' },
    { key: 'occurredAt', title: '发生时间', render: (item) => new Date(item.occurredAt).toLocaleString('zh-CN') }
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'integration-orchestration', detailLabel: record.key })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard title="幂等键" value={record.key} detail="上游系统约定的去重键" />
        <SummaryCard title="事件 ID" value={record.eventId} detail={record.eventType} />
        <SummaryCard title="来源" value={record.source} detail="对应 webhook source" />
        <SummaryCard title="状态" value={record.status} detail="accepted/rejected/..." />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>Payload 校验和</h2>
        <code style={{ fontSize: 12, color: '#cbd5f5', wordBreak: 'break-all' }}>{record.payloadChecksum}</code>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `按 idempotency:${record.key}`,
            context: 'focused source+purpose',
            href: snapshot.auditHref
          },
          {
            key: 'workspace',
            title: '返回工作台',
            subtitle: '集成编排总览',
            context: '回到总览',
            href: snapshot.workspaceHref
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
            subtitle: '相关变更单',
            context: '聚焦 PENDING',
            href: snapshot.approvalsHref
          }
        ] satisfies DetailClosureLink[]}
      />

      <DetailActionBar actions={actions} />

      <DataTable
        title={`关联事件信封（${snapshot.matchedEvent ? 1 : 0}）`}
        columns={eventColumns}
        items={snapshot.matchedEvent ? [snapshot.matchedEvent] : []}
        rowKey={(item) => item.envelopeId}
        striped
        compact
      />

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>首次出现时间</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, margin: 0 }}>
          {new Date(record.firstSeenAt).toLocaleString('zh-CN')}
        </p>
      </div>
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: IntegrationOrchestrationIdempotencyDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'integration-orchestration', detailLabel: snapshot.key || '未找到' })}
      />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到幂等记录</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          幂等键 <code style={{ color: '#f87171' }}>{snapshot.key || '（空）'}</code> 未在当前范围内出现。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回集成编排工作台',
            subtitle: '查看最新幂等记录',
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
      <div style={{ fontSize: 16, fontWeight: 700, color: '#93c5fd', marginBottom: 6, wordBreak: 'break-all' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#cbd5f5' }}>{detail}</div>
    </div>
  );
}

// DeepLinkCard has been removed in favor of <DetailClosureBar> from @m5/ui.

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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#94a3b8',
  marginBottom: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.4
};