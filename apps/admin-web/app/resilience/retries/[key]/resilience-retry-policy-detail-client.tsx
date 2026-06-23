'use client';

import { DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb, type DetailClosureLink } from '@m5/ui';
import type { ResilienceRetryPolicyDetail } from '../../../resilience-detail-view-model';
import { summarizeRetryPolicy } from '../../../resilience-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface ResilienceRetryPolicyDetailClientProps {
  snapshot: ResilienceRetryPolicyDetail;
}

export default function ResilienceRetryPolicyDetailClient({ snapshot }: ResilienceRetryPolicyDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <RetryPolicyBoard record={snapshot.record} snapshot={snapshot} />;
}

function RetryPolicyBoard({
  record,
  snapshot
}: {
  record: NonNullable<ResilienceRetryPolicyDetail['record']>;
  snapshot: ResilienceRetryPolicyDetail;
}) {
  const { actions } = useDetailActions({
    workspace: 'resilience',
    detailId: snapshot.key,
    record
  });
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'resilience', detailLabel: snapshot.key })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard title="策略 Key" value={record.key} detail={record.capability} />
        <SummaryCard title="触发条件" value={record.trigger} detail="触发重试的异常或事件" />
        <SummaryCard title="重试上限" value={`${record.maxAttempts} 次`} detail="达到上限后停止重试" />
        <SummaryCard title="退避策略" value={record.backoff} detail="指数 / 线性 / 固定" />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>策略说明</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>{summarizeRetryPolicy(record)}</p>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>恢复动作</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, margin: 0 }}>{record.recoveryAction}</p>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>升级目标</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, margin: 0 }}>
          <code style={{ color: '#93c5fd' }}>{record.escalationTarget}</code>
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          重试耗尽或持续失败时将通知该目标（如 on-call 群、值班机器人）。
        </p>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `按 resilience-retry:${snapshot.key}`,
            context: 'focused source+purpose',
            href: snapshot.auditHref
          },
          {
            key: 'foundation',
            title: 'Foundation 模块',
            subtitle: 'moduleKey=resilience-operations',
            context: '聚焦模块 drilldown',
            href: snapshot.foundationHref
          },
          {
            key: 'workspace',
            title: '返回工作台',
            subtitle: '强韧性作战台',
            context: '回到总览',
            href: snapshot.workspaceHref
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
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: ResilienceRetryPolicyDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'resilience', detailLabel: snapshot.key || '未找到' })}
      />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到重试策略</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          策略 Key <code style={{ color: '#f87171' }}>{snapshot.key || '（空）'}</code> 不在当前 resilience 范围内。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回强韧性工作台',
            subtitle: '查看所有重试策略',
            href: snapshot.workspaceHref
          },
          {
            key: 'foundation',
            title: 'Foundation 模块',
            subtitle: 'moduleKey=resilience-operations',
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
