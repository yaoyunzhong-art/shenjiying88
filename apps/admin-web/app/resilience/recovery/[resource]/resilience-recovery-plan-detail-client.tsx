'use client';

import { StatusBadge, DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb, type DetailClosureLink } from '@m5/ui';
import type { ResilienceRecoveryPlanDetail } from '../../../resilience-detail-view-model';
import {
  RECOVERY_PLAN_STATUS_LABEL,
  RECOVERY_PLAN_STATUS_VARIANT,
  isDrillStale,
  summarizeRecoveryPlan
} from '../../../resilience-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface ResilienceRecoveryPlanDetailClientProps {
  snapshot: ResilienceRecoveryPlanDetail;
}

export default function ResilienceRecoveryPlanDetailClient({ snapshot }: ResilienceRecoveryPlanDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <RecoveryPlanBoard record={snapshot.record} snapshot={snapshot} />;
}

function RecoveryPlanBoard({
  record,
  snapshot
}: {
  record: NonNullable<ResilienceRecoveryPlanDetail['record']>;
  snapshot: ResilienceRecoveryPlanDetail;
}) {
  const stale = isDrillStale(record);
  const { actions } = useDetailActions({
    workspace: 'resilience',
    detailId: snapshot.resource,
    record
  });

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'resilience', detailLabel: snapshot.resource })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard title="资源" value={record.resource} detail={record.runbook} />
        <SummaryCard title="RTO" value={`${record.rtoMinutes} 分钟`} detail="恢复时间目标" />
        <SummaryCard title="RPO" value={`${record.rpoMinutes} 分钟`} detail="恢复点目标" />
        <SummaryCard title="演练过期" value={stale ? '已过期' : '新鲜'} detail={`${record.staleAfterDays} 天阈值`} />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>状态</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge
            label={RECOVERY_PLAN_STATUS_LABEL[record.status]}
            variant={RECOVERY_PLAN_STATUS_VARIANT[record.status]}
            dot
            size="sm"
          />
          {stale ? <StatusBadge label="演练过期" variant="warning" size="sm" /> : null}
        </div>
        <p style={{ marginTop: 12, color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          {summarizeRecoveryPlan(record)}
        </p>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>依赖资源</h2>
        {record.dependencies.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>当前计划无显式依赖。</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
            {record.dependencies.map((item) => (
              <li key={item}>
                <code style={{ color: '#93c5fd' }}>{item}</code>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>Runbook</h2>
        <p style={{ margin: 0, color: '#cbd5f5', fontSize: 13 }}>
          <code style={{ color: '#93c5fd' }}>{record.runbook}</code>
        </p>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>最后演练</h2>
        <p style={{ margin: 0, color: '#cbd5f5', fontSize: 13 }}>
          {new Date(record.lastDrillAt).toLocaleString('zh-CN')}
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          超过 {record.staleAfterDays} 天未演练视为过期；当前
          {stale ? '已过期，请尽快安排复演。' : '仍在新鲜窗口内。'}
        </p>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `按 resilience-recovery:${snapshot.resource}`,
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
            context: stale ? '聚焦 PENDING（演练过期）' : '聚焦 PENDING',
            href: snapshot.approvalsHref,
            variant: stale ? 'warning' : 'default'
          }
        ] satisfies DetailClosureLink[]}
      />

      <DetailActionBar actions={actions} />
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: ResilienceRecoveryPlanDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'resilience', detailLabel: snapshot.resource || '未找到' })}
      />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到恢复计划</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          资源 <code style={{ color: '#f87171' }}>{snapshot.resource || '（空）'}</code> 不在当前 resilience 范围内。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回强韧性工作台',
            subtitle: '查看所有恢复计划',
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
