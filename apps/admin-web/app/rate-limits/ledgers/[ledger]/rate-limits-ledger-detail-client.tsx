'use client';

import Link from 'next/link';
import { StatusBadge, DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb, type DetailClosureLink } from '@m5/ui';
import type { RateLimitsLedgerDetail } from '../../../rate-limits-detail-view-model';
import {
  RATE_LIMIT_PERIOD_LABEL,
  isLedgerBlocked,
  ledgerConsumptionRatio,
  summarizeLedger
} from '../../../rate-limits-view-model';
import { buildRateLimitsPolicyDetailHref } from '@m5/types';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface RateLimitsLedgerDetailClientProps {
  snapshot: RateLimitsLedgerDetail;
}

export default function RateLimitsLedgerDetailClient({ snapshot }: RateLimitsLedgerDetailClientProps) {
  if (snapshot.notFound || !snapshot.record) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <LedgerBoard record={snapshot.record} snapshot={snapshot} />;
}

function LedgerBoard({
  record,
  snapshot
}: {
  record: NonNullable<RateLimitsLedgerDetail['record']>;
  snapshot: RateLimitsLedgerDetail;
}) {
  const ratio = ledgerConsumptionRatio(record);
  const blocked = isLedgerBlocked(record);
  const statusLabel = blocked ? '封禁' : ratio >= 0.8 ? '告警' : '健康';
  const statusVariant = blocked ? 'danger' : ratio >= 0.8 ? 'warning' : 'success';
  const resetAt = new Date(record.resetAt).toLocaleString('zh-CN');
  const { actions } = useDetailActions({
    workspace: 'rate-limits',
    detailId: snapshot.ledgerId,
    record
  });

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'rate-limits', detailLabel: snapshot.ledgerId })}
      />
      <div style={summaryGridStyle}>
        <SummaryCard title="主题 Key" value={record.subjectKey} detail={record.id} />
        <SummaryCard
          title="已用 / 上限"
          value={`${record.consumed} / ${record.policy.limit}`}
          detail={`占比 ${Math.round(ratio * 100)}%`}
        />
        <SummaryCard
          title="周期"
          value={RATE_LIMIT_PERIOD_LABEL[record.period as string] ?? record.period}
          detail="配额周期"
        />
        <SummaryCard title="状态" value={statusLabel} detail="按 blockedUntil 与消耗比判断" />
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>账本说明</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{summarizeLedger(record)}</p>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge label={statusLabel} variant={statusVariant} dot size="sm" />
          {typeof record.remaining === 'number' ? (
            <StatusBadge label={`剩余 ${record.remaining}`} variant="info" size="sm" />
          ) : null}
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>关联策略</h2>
        {snapshot.matchedPolicy ? (
          <div>
            <Link
              href={buildRateLimitsPolicyDetailHref(snapshot.matchedPolicy.id)}
              style={{ color: '#93c5fd', fontFamily: 'monospace', fontSize: 13 }}
            >
              {snapshot.matchedPolicy.code}
            </Link>
            <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
              {RATE_LIMIT_PERIOD_LABEL[snapshot.matchedPolicy.period as string] ?? snapshot.matchedPolicy.period} ·{' '}
              上限 {snapshot.matchedPolicy.limit}
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
            关联策略 ID <code style={{ color: '#cbd5f5' }}>{record.policy.id}</code> 未在当前工作区出现。
          </p>
        )}
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>重置时间</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, margin: 0 }}>{resetAt}</p>
        <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          {blocked ? '当前处于封禁窗口，请关注上游速率或是否需要松绑。' : '未处于封禁状态，按周期重置。'}
        </p>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>更新时间</h2>
        <p style={{ color: '#cbd5f5', fontSize: 13, margin: 0 }}>
          {new Date(record.updatedAt).toLocaleString('zh-CN')}
        </p>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `按 rate-limit-ledger:${snapshot.ledgerId}`,
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
            subtitle: blocked ? '封禁窗口相关变更单' : '相关变更单',
            context: blocked ? '聚焦 PENDING（封禁）' : '聚焦 PENDING',
            href: snapshot.approvalsHref,
            variant: blocked ? 'danger' : 'default'
          }
        ] satisfies DetailClosureLink[]}
      />

      <DetailActionBar actions={actions} />
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: RateLimitsLedgerDetail }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'rate-limits', detailLabel: snapshot.ledgerId || '未找到' })}
      />
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>未找到配额账本</h2>
        <p style={{ color: '#cbd5f5', fontSize: 14, lineHeight: 1.6 }}>
          账本 ID <code style={{ color: '#f87171' }}>{snapshot.ledgerId || '（空）'}</code> 不在当前 rate-limits 范围内。
        </p>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回限流工作台',
            subtitle: '查看已配置的账本',
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
