'use client';

import Link from 'next/link';
import {
  DetailActionBar,
  DetailClosureBar,
  StatusBadge,
  WorkspaceBreadcrumb,
  type DetailClosureLink
} from '@m5/ui';
import {
  RISK_LEVEL_LABEL,
  RISK_LEVEL_VARIANT
} from '../../../audit-trail-view-model';
import {
  describeAuditTrailRecordRisk,
  summarizeAuditTrailRecord,
  type AuditTrailRecordDetail
} from '../../../audit-trail-detail-view-model';
import { buildAuditTrailRecordDetailHref } from '@m5/types';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface AuditTrailRecordDetailClientProps {
  snapshot: AuditTrailRecordDetail;
}

export default function AuditTrailRecordDetailClient({ snapshot }: AuditTrailRecordDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return (
    <>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'audit-trail', detailLabel: snapshot.record.eventType })}
      />
      <RecordBoard snapshot={snapshot} />
    </>
  );
}

function RecordBoard({ snapshot }: { snapshot: AuditTrailRecordDetail }) {
  const record = snapshot.record!;
  const risk = record.riskLevel;
  const { actions } = useDetailActions({
    workspace: 'audit-trail',
    detailId: record.auditId,
    record,
    shareTitle: `审计 ${record.eventType}`,
    shareText: summarizeAuditTrailRecord(record)
  });

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={summaryGridStyle}>
        <SummaryCard title="Audit ID" value={record.auditId} detail="唯一审计标识" />
        <SummaryCard title="事件" value={record.eventType} detail="动作 / eventType" />
        <SummaryCard title="来源" value={record.source ?? '—'} detail="工作区来源" />
        <SummaryCard title="操作人" value={record.actorId ?? 'system'} detail={record.tenantId ?? '未指定租户'} />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>风险级别</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <StatusBadge
            label={RISK_LEVEL_LABEL[risk]}
            variant={RISK_LEVEL_VARIANT[risk]}
            dot
            size="sm"
          />
          <span style={{ fontSize: 13, color: '#cbd5f5' }}>{describeAuditTrailRecordRisk(record)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#cbd5f5' }}>{summarizeAuditTrailRecord(record)}</p>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>时间</h2>
        <p style={{ color: '#cbd5f5', fontSize: 13, margin: 0 }}>
          {new Date(record.occurredAt).toLocaleString('zh-CN')}
        </p>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>详情 payload</h2>
        <pre style={detailsPreStyle}>{JSON.stringify(record.details, null, 2)}</pre>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>关联审计记录（{snapshot.relatedRecords.length}）</h2>
        {snapshot.relatedRecords.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>暂无同 actor / source / event 的关联记录。</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
            {snapshot.relatedRecords.map((related) => (
              <li key={related.auditId}>
                <Link
                  href={buildAuditTrailRecordDetailHref(related.auditId)}
                  style={{ color: '#93c5fd', textDecoration: 'none', fontFamily: 'monospace', fontSize: 12 }}
                >
                  {related.auditId}
                </Link>
                <span style={{ marginLeft: 8, color: '#94a3b8' }}>{related.eventType}</span>
                <span style={{ marginLeft: 6, color: '#64748b', fontSize: 11 }}>
                  · {new Date(related.occurredAt).toLocaleString('zh-CN')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DetailClosureBar
        links={buildClosureLinks(snapshot)}
      />

      <DetailActionBar actions={actions} />
    </div>
  );
}

function buildClosureLinks(snapshot: AuditTrailRecordDetail): DetailClosureLink[] {
  const links: DetailClosureLink[] = [
    {
      key: 'workspace',
      title: '返回审计工作台',
      subtitle: '已按 actor / source / event 过滤',
      href: snapshot.workspaceHref
    },
    {
      key: 'approvals',
      title: '治理审批',
      subtitle: '相关变更单',
      href: snapshot.approvalsHref,
      variant: snapshot.record?.riskLevel === 'high' ? 'warning' : 'default'
    }
  ];
  return links;
}

function NotFoundPanel({ snapshot }: { snapshot: AuditTrailRecordDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'audit-trail', detailLabel: '未找到' })} />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到审计记录</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          Audit ID <code style={{ color: '#f87171' }}>{snapshot.auditId || '（空）'}</code> 不在当前审计查询范围内，可能已被归档或被过滤掉。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回审计工作台',
            subtitle: '重新查询',
            href: snapshot.workspaceHref
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

const detailsPreStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#e2e8f0',
  background: 'rgba(2,6,23,0.6)',
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 8,
  padding: 12,
  margin: 0,
  maxHeight: 320,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all'
};
