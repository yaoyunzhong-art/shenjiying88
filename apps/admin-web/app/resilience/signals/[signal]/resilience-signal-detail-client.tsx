'use client';

import { StatusBadge, DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb, type DetailClosureLink } from '@m5/ui';
import type { ResilienceSignalDetail } from '../../../resilience-detail-view-model';
import {
  SIGNAL_STATUS_LABEL,
  SIGNAL_STATUS_VARIANT,
  SIGNAL_TYPE_LABEL,
  summarizeSignal
} from '../../../resilience-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface ResilienceSignalDetailClientProps {
  snapshot: ResilienceSignalDetail;
}

export default function ResilienceSignalDetailClient({ snapshot }: ResilienceSignalDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <SignalBoard record={snapshot.record} snapshot={snapshot} />;
}

function SignalBoard({
  record,
  snapshot
}: {
  record: NonNullable<ResilienceSignalDetail['record']>;
  snapshot: ResilienceSignalDetail;
}) {
  const { actions } = useDetailActions({
    workspace: 'resilience',
    detailId: snapshot.signal,
    record
  });
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'resilience', detailLabel: snapshot.signal })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard title="信号类型" value={SIGNAL_TYPE_LABEL[record.signal]} detail={record.signal} />
        <SummaryCard title="状态" value={record.status} detail={SIGNAL_STATUS_LABEL[record.status]} />
        <SummaryCard title="覆盖率" value={`${record.coverage}%`} detail="采集覆盖范围" />
        <SummaryCard title="采集滞后" value={`${record.collectionLagSeconds}s`} detail="最近一次采集延迟" />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>信号说明</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>{summarizeSignal(record)}</p>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>负责人 & 告警路由</h2>
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 13, color: '#cbd5f5' }}>
            <span style={{ color: '#94a3b8' }}>负责人：</span>
            {record.owner}
          </div>
          <div style={{ fontSize: 13, color: '#cbd5f5' }}>
            <span style={{ color: '#94a3b8' }}>告警路由：</span>
            {record.alertRoutes.join(' · ') || '—'}
          </div>
        </div>
      </div>

      {record.evidence.length > 0 ? (
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>采集证据</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
            {record.evidence.map((item) => (
              <li key={item}>
                <code style={{ color: '#93c5fd' }}>{item}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>最后采集时间</h2>
        <p style={{ margin: 0, color: '#cbd5f5', fontSize: 13 }}>
          {new Date(record.lastCollectedAt).toLocaleString('zh-CN')}
        </p>
        <div style={{ marginTop: 10 }}>
          <StatusBadge
            label={SIGNAL_STATUS_LABEL[record.status]}
            variant={SIGNAL_STATUS_VARIANT[record.status]}
            dot
            size="sm"
          />
        </div>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `按 resilience-signal:${snapshot.signal}`,
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

function NotFoundPanel({ snapshot }: { snapshot: ResilienceSignalDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'resilience', detailLabel: snapshot.signal || '未找到' })}
      />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到可观测信号</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          信号 <code style={{ color: '#f87171' }}>{snapshot.signal || '（空）'}</code> 不在当前 resilience 范围内。
          可尝试返回工作台确认是否已配置。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回强韧性工作台',
            subtitle: '查看已配置的信号',
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
