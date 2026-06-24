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
  IntegrationIdempotencyRecordContract
} from '@m5/types';
import {
  buildIntegrationOrchestrationIdempotencyDetailHref,
  buildIntegrationOrchestrationSourceDetailHref
} from '@m5/types';
import type { IntegrationOrchestrationEventDetail } from '../../../integration-orchestration-detail-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface IntegrationOrchestrationEventDetailClientProps {
  snapshot: IntegrationOrchestrationEventDetail;
}

export default function IntegrationOrchestrationEventDetailClient({
  snapshot
}: IntegrationOrchestrationEventDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <EventBoard envelope={snapshot.record} snapshot={snapshot} />;
}

function EventBoard({
  envelope,
  snapshot
}: {
  envelope: NonNullable<IntegrationOrchestrationEventDetail['record']>;
  snapshot: IntegrationOrchestrationEventDetail;
}) {
  const { actions } = useDetailActions({
    workspace: 'integration-orchestration',
    detailId: envelope.envelopeId,
    record: envelope
  });
  const payloadEntries = envelope.payload ? Object.entries(envelope.payload) : [];

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
    { key: 'eventId', title: '事件 ID', render: (item) => item.eventId },
    {
      key: 'status',
      title: '状态',
      render: (item) => (
        <StatusBadge
          variant={item.status === 'accepted' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}
          label={item.status}
        />
      )
    },
    { key: 'firstSeenAt', title: '首次出现', render: (item) => new Date(item.firstSeenAt).toLocaleString('zh-CN') }
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'integration-orchestration', detailLabel: envelope.envelopeId })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard title="事件名称" value={envelope.eventName} detail={envelope.aggregateId ?? '—'} />
        <SummaryCard title="来源" value={envelope.source} detail="webhook source" />
        <SummaryCard title="发生时间" value={new Date(envelope.occurredAt).toLocaleString('zh-CN')} detail="envelope 时间戳" />
        <SummaryCard title="Envelope ID" value={envelope.envelopeId} detail="用于链路追踪" />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>Payload</h2>
        {payloadEntries.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>当前 envelope 未携带 payload。</p>
        ) : (
          <pre style={preStyle}>{JSON.stringify(envelope.payload, null, 2)}</pre>
        )}
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'source',
            title: '查看来源详情',
            subtitle: `/integration-orchestration/sources/${envelope.source}`,
            context: '跳转来源',
            href: buildIntegrationOrchestrationSourceDetailHref(envelope.source)
          },
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `按 envelope:${envelope.envelopeId}`,
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
          }
        ] satisfies DetailClosureLink[]}
      />

      <DetailActionBar actions={actions} />

      {snapshot.matchedIdempotency ? (
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>关联幂等记录</h2>
          <Link
            href={buildIntegrationOrchestrationIdempotencyDetailHref(snapshot.matchedIdempotency.key)}
            style={{ color: '#93c5fd', fontFamily: 'monospace', fontSize: 12 }}
          >
            {snapshot.matchedIdempotency.key}
          </Link>
          <div style={{ marginTop: 8, fontSize: 13, color: '#cbd5f5' }}>
            事件 ID: {snapshot.matchedIdempotency.eventId} · 状态: {snapshot.matchedIdempotency.status} ·{' '}
            首次出现: {new Date(snapshot.matchedIdempotency.firstSeenAt).toLocaleString('zh-CN')}
          </div>
        </div>
      ) : (
        <DataTable
          title="关联幂等记录（按 eventId）"
          columns={idempotencyColumns}
          items={[]}
          rowKey={(item) => item.key}
          striped
          compact
        />
      )}
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: IntegrationOrchestrationEventDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'integration-orchestration', detailLabel: snapshot.envelopeId || '未找到' })}
      />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到事件信封</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          Envelope ID <code style={{ color: '#f87171' }}>{snapshot.envelopeId || '（空）'}</code> 未在当前范围内出现，可能已被归档或 ID 输入有误。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回集成编排工作台',
            subtitle: '查看最新事件',
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

const preStyle: React.CSSProperties = {
  background: 'rgba(2,6,23,0.55)',
  borderRadius: 8,
  padding: 12,
  margin: 0,
  fontSize: 12,
  color: '#e2e8f0',
  overflow: 'auto',
  maxHeight: 320
};