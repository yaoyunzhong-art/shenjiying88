'use client';

import Link from 'next/link';
import { StatusBadge, DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb, type DetailClosureLink } from '@m5/ui';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';
import type { FoundationModuleDetail } from '../../../foundation-detail-view-model';
import {
  formatFoundationIndicator,
  summarizeConsumerForModule,
  summarizeFoundationModuleDetail
} from '../../../foundation-detail-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';

interface FoundationModuleDetailClientProps {
  snapshot: FoundationModuleDetail;
}

export default function FoundationModuleDetailClient({ snapshot }: FoundationModuleDetailClientProps) {
  if (snapshot.notFound || !snapshot.module) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <ModuleBoard snapshot={snapshot} />;
}

function getModuleWorkspaceHref(moduleKey: string): string | null {
  if (moduleKey === 'identity-access') {
    return '/identity-access';
  }
  if (moduleKey === 'configuration-governance') {
    return '/configuration';
  }
  if (moduleKey === 'integration-orchestration') {
    return '/integration-orchestration';
  }
  if (moduleKey === 'trust-governance') {
    return '/audit-trail';
  }
  if (moduleKey === 'resilience-operations') {
    return '/resilience';
  }
  if (moduleKey === 'runtime-governance') {
    return '/operations';
  }
  return null;
}

function ModuleBoard({ snapshot }: { snapshot: FoundationModuleDetail }) {
  const moduleInfo = snapshot.module!;
  const indicators = formatFoundationIndicator(snapshot.detail);
  const workspaceHref = getModuleWorkspaceHref(moduleInfo.key);
  const healthStatus = snapshot.detail?.health?.status;
  const { actions } = useDetailActions({
    workspace: 'foundation',
    detailId: moduleInfo.key,
    record: {
      module: moduleInfo,
      detail: snapshot.detail,
      healthLabel: snapshot.healthLabel
    }
  });

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'foundation', detailLabel: moduleInfo.key })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard title="模块 Key" value={moduleInfo.key} detail={moduleInfo.name} />
        <SummaryCard title="能力数" value={`${moduleInfo.capabilities.length}`} detail="capabilities 数量" />
        <SummaryCard title="入站 / 出站" value={`${moduleInfo.inboundContracts.length} / ${moduleInfo.outboundContracts.length}`} detail="关键契约" />
        <SummaryCard title="健康度" value={snapshot.healthLabel} detail={`评分 ${snapshot.detail?.health?.score ?? '—'}`} />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>模块说明</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{moduleInfo.purpose}</p>
        <p style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>{summarizeFoundationModuleDetail(snapshot)}</p>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge
            label={snapshot.healthLabel}
            variant={healthStatus === 'critical' ? 'danger' : healthStatus === 'warning' ? 'warning' : 'success'}
            dot
            size="sm"
          />
          {workspaceHref ? (
            <Link href={workspaceHref} style={{ color: '#93c5fd', fontSize: 12 }}>
              → 打开对应工作台
            </Link>
          ) : null}
        </div>
      </div>

      <div style={twoColumnGridStyle}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>入站契约（{moduleInfo.inboundContracts.length}）</h2>
          {moduleInfo.inboundContracts.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>未声明入站契约。</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
              {moduleInfo.inboundContracts.map((item) => (
                <li key={item}>
                  <code style={{ color: '#93c5fd' }}>{item}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>出站契约（{moduleInfo.outboundContracts.length}）</h2>
          {moduleInfo.outboundContracts.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>未声明出站契约。</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
              {moduleInfo.outboundContracts.map((item) => (
                <li key={item}>
                  <code style={{ color: '#93c5fd' }}>{item}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>能力列表（{moduleInfo.capabilities.length}）</h2>
        {moduleInfo.capabilities.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>当前模块未列出 capabilities。</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
            {moduleInfo.capabilities.map((cap) => (
              <li key={cap.key}>
                <code style={{ color: '#93c5fd' }}>{cap.key}</code>
                <span style={{ marginLeft: 8, color: '#94a3b8' }}>{cap.name}</span>
                {cap.responsibilities.length > 0 ? (
                  <span style={{ marginLeft: 6, color: '#cbd5f5' }}>· {cap.responsibilities.join(' / ')}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={twoColumnGridStyle}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>健康指标</h2>
          <div style={{ display: 'grid', gap: 6 }}>
            <IndicatorRow label="高风险审计" value={indicators.highRiskAudits} />
            <IndicatorRow label="待处理审批" value={indicators.pendingApprovals} />
            <IndicatorRow label="执行失败" value={indicators.executionFailures} />
            <IndicatorRow label="阻塞项" value={indicators.blockedCount} />
          </div>
        </div>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>消费方（{snapshot.consumers.length}）</h2>
          {snapshot.consumers.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>无显式消费方依赖。</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
              {snapshot.consumers.map((consumer) => (
                <li key={consumer.consumer}>
                  <code style={{ color: '#93c5fd' }}>{consumer.consumer}</code>
                  <span style={{ marginLeft: 8, color: '#94a3b8' }}>{summarizeConsumerForModule(consumer)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>治理基线（{snapshot.baselines.length}）</h2>
        {snapshot.baselines.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>该模块无治理基线所有权。</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
            {snapshot.baselines.map((baseline) => (
              <li key={baseline.key}>
                <strong style={{ color: '#bfdbfe' }}>{baseline.name}</strong>
                <span style={{ marginLeft: 6, color: '#94a3b8' }}>· {baseline.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `按 foundation-module:${snapshot.moduleKey}`,
            context: 'focused source+purpose',
            href: snapshot.auditHref
          },
          {
            key: 'workspace',
            title: '返回 Foundation 工作台',
            subtitle: '总览/模块/消费方/治理基线',
            context: '回到总览',
            href: snapshot.workspaceHref
          },
          {
            key: 'approvals',
            title: '治理审批',
            subtitle: healthStatus === 'critical' ? '关键健康问题需要审批' : '相关变更单',
            context: '聚焦 PENDING',
            href: snapshot.approvalsHref,
            variant: healthStatus === 'critical' ? 'danger' : 'default'
          },
          ...(workspaceHref
            ? [
                {
                  key: 'module-workspace',
                  title: '打开模块工作台',
                  subtitle: moduleInfo.key,
                  context: '跨工作区跳转',
                  href: workspaceHref
                } satisfies DetailClosureLink
              ]
            : [])
        ] satisfies DetailClosureLink[]}
      />

      <DetailActionBar actions={actions} />
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: FoundationModuleDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'foundation', detailLabel: snapshot.moduleKey || '未找到' })}
      />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到 Foundation 模块</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          模块 Key <code style={{ color: '#f87171' }}>{snapshot.moduleKey || '（空）'}</code> 不在当前 blueprint 范围内。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回 Foundation 工作台',
            subtitle: '查看模块目录',
            href: snapshot.workspaceHref
          },
          {
            key: 'audit',
            title: '审计日志',
            subtitle: 'foundation 范围',
            href: snapshot.auditHref
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

function IndicatorRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#cbd5f5' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const twoColumnGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
