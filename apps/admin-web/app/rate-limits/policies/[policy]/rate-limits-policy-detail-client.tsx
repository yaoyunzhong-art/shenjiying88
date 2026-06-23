'use client';

import Link from 'next/link';
import { StatusBadge, DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb, type DetailClosureLink } from '@m5/ui';
import type { RateLimitsPolicyDetail } from '../../../rate-limits-detail-view-model';
import {
  RATE_LIMIT_ALGORITHM_LABEL,
  RATE_LIMIT_PERIOD_LABEL,
  RATE_LIMIT_SCOPE_LABEL,
  isPolicyActive,
  summarizePolicy
} from '../../../rate-limits-view-model';
import { buildRateLimitsLedgerDetailHref } from '@m5/types';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface RateLimitsPolicyDetailClientProps {
  snapshot: RateLimitsPolicyDetail;
}

export default function RateLimitsPolicyDetailClient({ snapshot }: RateLimitsPolicyDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <PolicyBoard record={snapshot.record} snapshot={snapshot} />;
}

function PolicyBoard({
  record,
  snapshot
}: {
  record: NonNullable<RateLimitsPolicyDetail['record']>;
  snapshot: RateLimitsPolicyDetail;
}) {
  const active = isPolicyActive(record);
  const { actions } = useDetailActions({
    workspace: 'rate-limits',
    detailId: snapshot.policyId,
    record
  });
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'rate-limits', detailLabel: snapshot.policyId })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard
          title="策略 Code"
          value={record.code}
          detail={RATE_LIMIT_SCOPE_LABEL[record.scopeType as string] ?? record.scopeType}
        />
        <SummaryCard
          title="周期 / 限额"
          value={`${record.limit} / ${RATE_LIMIT_PERIOD_LABEL[record.period as string] ?? record.period}`}
          detail={record.burstLimit ? `突增上限 ${record.burstLimit}` : '无突增配置'}
        />
        <SummaryCard
          title="算法"
          value={RATE_LIMIT_ALGORITHM_LABEL[record.algorithm ?? ''] ?? record.algorithm ?? '—'}
          detail="限流算法"
        />
        <SummaryCard title="状态" value={active ? '活跃' : '停用'} detail="按 limit > 0 判断" />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>策略说明</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>{summarizePolicy(record)}</p>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge label={active ? '活跃' : '停用'} variant={active ? 'success' : 'neutral'} size="sm" />
          {record.tenantId ? (
            <StatusBadge label={`租户 ${record.tenantId}`} variant="info" size="sm" />
          ) : null}
          {record.brandId ? (
            <StatusBadge label={`品牌 ${record.brandId}`} variant="info" size="sm" />
          ) : null}
          {record.storeId ? (
            <StatusBadge label={`门店 ${record.storeId}`} variant="info" size="sm" />
          ) : null}
          {record.integrationAppId ? (
            <StatusBadge label={`集成 ${record.integrationAppId}`} variant="info" size="sm" />
          ) : null}
        </div>
      </div>

      {record.dimensionKeys && record.dimensionKeys.length > 0 ? (
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>维度键</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {record.dimensionKeys.map((key) => (
              <code key={key} style={dimensionChipStyle}>
                {key}
              </code>
            ))}
          </div>
        </div>
      ) : null}

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>关联配额账本（${snapshot.matchedLedgers.length}）</h2>
        {snapshot.matchedLedgers.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>当前策略下暂无生效账本。</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', fontSize: 13, lineHeight: 1.8 }}>
            {snapshot.matchedLedgers.map((ledger) => (
              <li key={ledger.id}>
                <Link
                  href={buildRateLimitsLedgerDetailHref(ledger.id)}
                  style={{ color: '#93c5fd', fontFamily: 'monospace', fontSize: 12 }}
                >
                  {ledger.subjectKey}
                </Link>
                <span style={{ marginLeft: 8, color: '#94a3b8' }}>
                  已用 {ledger.consumed} / {ledger.policy.limit}
                </span>
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
            subtitle: `按 rate-limit-policy:${snapshot.policyId}`,
            context: 'focused source+purpose',
            href: snapshot.auditHref
          },
          {
            key: 'foundation',
            title: 'Foundation 模块',
            subtitle: 'moduleKey=rate-limits',
            context: '聚焦模块 drilldown',
            href: snapshot.foundationHref
          },
          {
            key: 'workspace',
            title: '返回工作台',
            subtitle: '限流与配额',
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

function NotFoundPanel({ snapshot }: { snapshot: RateLimitsPolicyDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'rate-limits', detailLabel: snapshot.policyId || '未找到' })}
      />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到限流策略</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          策略 ID <code style={{ color: '#f87171' }}>{snapshot.policyId || '（空）'}</code> 不在当前 rate-limits 范围内。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回限流工作台',
            subtitle: '查看已配置的策略',
            href: snapshot.workspaceHref
          },
          {
            key: 'foundation',
            title: 'Foundation 模块',
            subtitle: 'moduleKey=rate-limits',
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

const dimensionChipStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#93c5fd',
  background: 'rgba(59,130,246,0.12)',
  padding: '4px 10px',
  borderRadius: 999
};
