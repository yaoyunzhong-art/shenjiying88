'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb } from '@m5/ui';
import {
  adminGovernanceApprovalsRoute,
  buildGovernanceApprovalDetailHref,
} from '../../approvals-data';
import {
  cancelGovernanceApproval,
  decideGovernanceApproval,
  describeGovernanceApprovalRequest,
  getApprovalMemberContext,
  loadGovernanceApprovalDetail,
  loadGovernanceApprovalOutcomeAuditLogs,
  resubmitGovernanceApproval,
  type GovernanceApprovalOutcomeAuditLogEntry,
  type GovernanceApprovalOutcomeAuditSnapshot,
  type GovernanceApprovalSnapshot,
  type GovernanceApprovalStatus,
} from '../../approvals-view-model';
import {
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsSourceDetailHref,
} from '../../members-view-model';
import { buildAuditTrailHref as buildApprovalAuditTrailHref } from '../../audit-trail-view-model';
import { AdminPermissionGate } from '../../components/admin-permission-gate';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

function statusColor(status: GovernanceApprovalStatus): string {
  if (status === 'APPROVED') return '#86efac';
  if (status === 'PENDING') return '#fde68a';
  if (status === 'REJECTED' || status === 'CANCELLED') return '#fca5a5';
  return '#93c5fd';
}

function summaryRecord(approval: GovernanceApprovalSnapshot | null): Record<string, unknown> {
  return approval?.summary && typeof approval.summary === 'object'
    ? (approval.summary as Record<string, unknown>)
    : {};
}

function requestPayloadRecord(approval: GovernanceApprovalSnapshot | null): Record<string, unknown> {
  const payload = summaryRecord(approval).requestPayload;
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
}

export default function ApprovalDetailPage({ params }: { params: Promise<{ ticket: string }> }) {
  const { ticket } = use(params);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadGovernanceApprovalDetail>>>({
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    approval: null,
    runtimeReceiptHref: null,
    memberHref: null,
    memberReviewHref: null,
  });
  const [outcomeAudit, setOutcomeAudit] = useState<GovernanceApprovalOutcomeAuditSnapshot>({
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    ticket,
    entries: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function hydrate() {
      try {
        const [nextSnapshot, nextAudit] = await Promise.all([
          loadGovernanceApprovalDetail(ticket),
          loadGovernanceApprovalOutcomeAuditLogs(ticket)
        ]);
        if (!disposed) {
          setSnapshot(nextSnapshot);
          setOutcomeAudit(nextAudit);
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    void hydrate();
    return () => {
      disposed = true;
    };
  }, [ticket]);

  const approval = snapshot.approval;
  const summary = useMemo(() => summaryRecord(approval), [approval]);
  const requestPayload = useMemo(() => requestPayloadRecord(approval), [approval]);
  const memberContext = useMemo(() => (approval ? getApprovalMemberContext(approval) : null), [approval]);

  const { actions: detailActions } = useDetailActions({
    workspace: 'approvals',
    detailId: ticket,
    record: snapshot,
    shareTitle: `审批单 · ${ticket}`,
    shareText: `查看治理审批单 ${ticket} 详情`
  });

  const requestDescriptor = useMemo(
    () => (approval ? describeGovernanceApprovalRequest(approval) : null),
    [approval]
  );
  const memberReceiptHref =
    memberContext?.memberId && memberContext.executionId
      ? buildMemberOperationsReceiptDetailHref(memberContext.memberId, memberContext.executionId)
      : null;
  const sourceOrderHref =
    memberContext?.memberId && memberContext.sourceOrderId
      ? buildMemberOperationsSourceDetailHref(memberContext.memberId, 'order', memberContext.sourceOrderId)
      : null;
  const sourcePaymentHref =
    memberContext?.memberId && memberContext.sourcePaymentId
      ? buildMemberOperationsSourceDetailHref(memberContext.memberId, 'payment', memberContext.sourcePaymentId)
      : null;
  const permissionGate = {
    requiredPermission: 'foundation.governance.read',
    title: '审批详情访问受限',
    description:
      '审批详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看审批动作、执行轨迹、审计日志与治理回执。',
  } as const;

  async function refresh(nextTicket?: string) {
    const nextSnapshot = await loadGovernanceApprovalDetail(nextTicket ?? ticket);
    setSnapshot(nextSnapshot);
  }

  async function handleApprove() {
    if (!approval?.ticket) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await decideGovernanceApproval(approval.ticket, 'APPROVED', approval.version ?? undefined);
      await refresh();
      setMessage(`审批单 ${approval.ticket} 已通过。`);
    } catch {
      setMessage(`审批单 ${approval.ticket} 通过失败，请检查版本冲突或 API 权限。`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!approval?.ticket) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await decideGovernanceApproval(approval.ticket, 'REJECTED', approval.version ?? undefined);
      await refresh();
      setMessage(`审批单 ${approval.ticket} 已驳回。`);
    } catch {
      setMessage(`审批单 ${approval.ticket} 驳回失败，请检查版本冲突或 API 权限。`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!approval?.ticket) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await cancelGovernanceApproval(approval.ticket, approval.version ?? undefined);
      await refresh();
      setMessage(`审批单 ${approval.ticket} 已撤销。`);
    } catch {
      setMessage(`审批单 ${approval.ticket} 撤销失败，请稍后重试。`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResubmit() {
    if (!approval?.ticket) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await resubmitGovernanceApproval(approval.ticket, approval.version ?? undefined);
      await refresh(result.approval.ticket ?? undefined);
      setMessage(
        result.approval.ticket
          ? `已重新提交审批，新的审批单为 ${result.approval.ticket}。`
          : '已重新提交审批。'
      );
    } catch {
      setMessage(`审批单 ${approval.ticket} 重新提交失败，请稍后重试。`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
        <WorkspaceBreadcrumb
          {...buildStandardBreadcrumb({ workspace: 'approvals', detailLabel: approval?.ticket ?? ticket })}
        />
      <div style={{ marginBottom: 24 }}>
        <a href={adminGovernanceApprovalsRoute.backHref} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 13 }}>
          返回审批列表
        </a>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginTop: 10 }}>
          {approval?.ticket ?? ticket}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
          {loading
            ? '正在同步审批详情...'
            : approval
              ? `状态 ${approval.status} / 数据源 ${snapshot.deliveryMode}`
              : adminGovernanceApprovalsRoute.emptyMessage(ticket)}
        </div>
      </div>

      {message ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 14px',
            border: '1px solid rgba(96, 165, 250, 0.24)',
            background: 'rgba(15, 23, 42, 0.45)',
            color: '#dbeafe',
            fontSize: 13,
          }}
        >
          {message}
        </div>
      ) : null}

      {!approval && !loading ? (
        <div style={{ color: '#94a3b8' }}>{adminGovernanceApprovalsRoute.emptyMessage(ticket)}</div>
      ) : null}

      {approval ? (
        <>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
            <StatCard label="审批状态" value={approval.status} helper={`版本 ${approval.version ?? '—'}`} color={statusColor(approval.status)} />
            <StatCard label="请求人" value={approval.requestedBy ?? '—'} helper={`决定人 ${approval.decidedBy ?? '—'}`} />
            <StatCard label="执行状态" value={approval.execution?.executionStatus ?? 'pending'} helper={`attempts ${approval.execution?.attempts ?? 0}`} />
            <StatCard
              label="业务动作"
              value={requestDescriptor?.operationLabel ?? approval.operation ?? 'unknown-operation'}
              helper={requestDescriptor?.summary ?? approval.resourceKey ?? '—'}
            />
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 20,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>审批动作</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {approval.status === 'PENDING' ? (
                <>
                  <ActionButton onClick={handleApprove} disabled={submitting}>审批通过</ActionButton>
                  <ActionButton onClick={handleReject} disabled={submitting} variant="danger">驳回</ActionButton>
                  <ActionButton onClick={handleCancel} disabled={submitting} variant="warning">撤销</ActionButton>
                </>
              ) : null}
              {(approval.status === 'REJECTED' || approval.status === 'CANCELLED') ? (
                <ActionButton onClick={handleResubmit} disabled={submitting}>重新提交</ActionButton>
              ) : null}
              {snapshot.runtimeReceiptHref ? (
                <a
                  href={snapshot.runtimeReceiptHref}
                  style={{
                    borderRadius: 10,
                    padding: '8px 14px',
                    textDecoration: 'none',
                    background: 'rgba(59,130,246,0.16)',
                    border: '1px solid rgba(96,165,250,0.3)',
                    color: '#dbeafe',
                    fontSize: 13,
                  }}
                >
                  查看治理回执详情
                </a>
              ) : null}
              {snapshot.memberReviewHref ? (
                <a
                  href={snapshot.memberReviewHref}
                  style={{
                    borderRadius: 10,
                    padding: '8px 14px',
                    textDecoration: 'none',
                    background: 'rgba(14,165,233,0.12)',
                    border: '1px solid rgba(56,189,248,0.24)',
                    color: '#dbeafe',
                    fontSize: 13,
                  }}
                >
                  查看会员最新档案
                </a>
              ) : null}
              {memberReceiptHref ? <ActionLink href={memberReceiptHref} label="查看执行回执详情" palette="purple" /> : null}
              {sourceOrderHref ? <ActionLink href={sourceOrderHref} label="查看来源订单链路" palette="emerald" /> : null}
              {sourcePaymentHref ? <ActionLink href={sourcePaymentHref} label="查看来源支付链路" palette="emerald" /> : null}
              {approval.ticket ? (
                <ActionLink
                  href={buildApprovalAuditTrailHref({ approvalTicket: approval.ticket })}
                  label="查看审计全链路"
                  palette="emerald"
                />
              ) : null}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <InfoPanel title="审批上下文">
              <InfoRow label="业务动作" value={requestDescriptor?.operationLabel ?? approval.operation ?? '—'} />
              <InfoRow label="风险等级" value={requestDescriptor?.riskLevel ?? '—'} />
              <InfoRow label="请求摘要" value={requestDescriptor?.summary ?? '—'} />
              <InfoRow label="变更字段" value={requestDescriptor?.requestedField ?? '—'} />
              <InfoRow label="当前值" value={requestDescriptor?.currentValue ?? '—'} />
              <InfoRow label="目标值" value={requestDescriptor?.targetValue ?? '—'} />
              <InfoRow label="资源类型" value={approval.resourceType ?? '—'} />
              <InfoRow label="资源标识" value={approval.resourceKey ?? '—'} />
              <InfoRow label="请求来源" value={typeof summary.requestedFrom === 'string' ? summary.requestedFrom : '—'} />
              <InfoRow label="请求时间" value={typeof summary.requestedAt === 'string' ? summary.requestedAt : '—'} />
              <InfoRow label="会员" value={memberContext?.memberId ?? '—'} href={snapshot.memberReviewHref ?? snapshot.memberHref ?? undefined} />
              <InfoRow label="执行回执" value={memberContext?.executionId ?? '—'} href={memberReceiptHref ?? undefined} />
              <InfoRow label="动作编码" value={memberContext?.actionCode ?? '—'} />
              <InfoRow
                label="来源订单"
                value={memberContext?.sourceOrderId ?? '—'}
                href={sourceOrderHref ?? undefined}
              />
              <InfoRow
                label="来源支付"
                value={memberContext?.sourcePaymentId ?? '—'}
                href={sourcePaymentHref ?? undefined}
              />
              <InfoRow label="Payload 摘要" value={typeof summary.payloadSummary === 'string' ? summary.payloadSummary : '—'} />
              <InfoRow label="Request Endpoint" value={typeof summary.requestEndpoint === 'string' ? summary.requestEndpoint : '—'} />
            </InfoPanel>

            <InfoPanel title="执行轨迹">
              <InfoRow label="已执行" value={String(approval.execution?.executed ?? false)} />
              <InfoRow label="执行状态" value={approval.execution?.executionStatus ?? '—'} />
              <InfoRow label="执行时间" value={approval.execution?.executedAt ?? '—'} />
              <InfoRow label="执行人" value={approval.execution?.executedBy ?? '—'} />
              <InfoRow label="失败状态" value={approval.execution?.lastFailure?.failureStatus ?? '—'} />
              <InfoRow label="失败原因" value={approval.execution?.lastFailure?.failureReason ?? '—'} />
              <InfoRow label="失败时间" value={approval.execution?.lastFailure?.failedAt ?? '—'} />
            </InfoPanel>
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 20,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginTop: 24,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>请求载荷</div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#cbd5e1',
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              {JSON.stringify(requestPayload, null, 2)}
            </pre>
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: 20,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 12
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
                member-approval-outcome 审计日志
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                数据源 {outcomeAudit.deliveryMode} · 共 {outcomeAudit.entries.length} 条
              </div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
              服务端按 purpose=member-approval-outcome 与当前审批单 ticket 过滤。
            </div>
            {outcomeAudit.entries.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>
                当前审批单暂无 outcome 审计日志，通常出现在审批尚未决策时。
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {outcomeAudit.entries.map((entry) => (
                  <OutcomeAuditRow key={entry.auditLogId} entry={entry} />
                ))}
              </div>
            )}
          </div>

          {approval.ticket ? (
            <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
              当前详情链接：{buildGovernanceApprovalDetailHref(approval.ticket)}
            </div>
          ) : null}
        </>
      ) : null}

        <DetailActionBar
          actions={detailActions}
          heading="详情收口动作"
          caption="复制 / 导出 / 分享当前审批单详情"
        />

        <DetailClosureBar
          links={buildStandardClosureLinks({ workspace: 'approvals', detailId: ticket })}
        />
      </main>
    </AdminPermissionGate>
  );
}

function StatCard({
  label,
  value,
  helper,
  color = '#e2e8f0',
}: {
  label: string;
  value: string;
  helper: string;
  color?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 18,
        background: 'rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: 13 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>{helper}</div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  variant?: 'primary' | 'warning' | 'danger';
}) {
  const palette =
    variant === 'danger'
      ? {
          background: 'rgba(239,68,68,0.14)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#fecaca',
        }
      : variant === 'warning'
        ? {
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.3)',
            color: '#fde68a',
          }
        : {
            background: 'rgba(59,130,246,0.16)',
            border: '1px solid rgba(96,165,250,0.3)',
            color: '#dbeafe',
          };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...palette,
      }}
    >
      {children}
    </button>
  );
}

function ActionLink({
  href,
  label,
  palette,
}: {
  href: string;
  label: string;
  palette: 'purple' | 'emerald';
}) {
  const style =
    palette === 'purple'
      ? {
          background: 'rgba(168,85,247,0.12)',
          border: '1px solid rgba(192,132,252,0.22)',
          color: '#e9d5ff',
        }
      : {
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(52,211,153,0.24)',
          color: '#d1fae5',
        };

  return (
    <a
      href={href}
      style={{
        borderRadius: 10,
        padding: '8px 14px',
        textDecoration: 'none',
        fontSize: 13,
        ...style,
      }}
    >
      {label}
    </a>
  );
}

function OutcomeAuditRow({ entry }: { entry: GovernanceApprovalOutcomeAuditLogEntry }) {
  const status = entry.status?.toString().toUpperCase() ?? 'RECORDED'
  const palette =
    status === 'APPROVED' || status === 'EXECUTED'
      ? { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.32)', color: '#bbf7d0' }
      : status === 'REJECTED' || status === 'EXECUTION_FAILED'
        ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fecaca' }
        : status === 'CANCELLED' || status === 'SUPERSEDED'
          ? { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fde68a' }
          : { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#dbeafe' }

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '12px 14px',
        background: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        display: 'grid',
        gap: 8
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 700,
            ...palette
          }}
        >
          {status}
        </span>
        <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{entry.action}</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>{entry.purpose}</span>
      </div>
      <div style={{ color: '#cbd5e1', fontSize: 13 }}>{entry.summary || '—'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, fontSize: 12 }}>
        <div style={{ color: '#94a3b8' }}>
          决策人：<span style={{ color: '#e2e8f0' }}>{entry.decisionBy ?? '—'}</span>
        </div>
        <div style={{ color: '#94a3b8' }}>
          操作人：<span style={{ color: '#e2e8f0' }}>{entry.operatorId ?? '—'}</span>
        </div>
        <div style={{ color: '#94a3b8' }}>
          决策时间：<span style={{ color: '#e2e8f0' }}>{entry.decisionAt ?? '—'}</span>
        </div>
        <div style={{ color: '#94a3b8' }}>
          关联会员：<span style={{ color: '#e2e8f0' }}>{entry.memberId ?? '—'}</span>
        </div>
      </div>
      {Object.keys(entry.details).length > 0 ? (
        <details style={{ marginTop: 4 }}>
          <summary style={{ color: '#93c5fd', fontSize: 12, cursor: 'pointer' }}>查看 details</summary>
          <pre
            style={{
              margin: '8px 0 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#94a3b8',
              fontSize: 11,
              lineHeight: 1.6
            }}
          >
            {JSON.stringify(entry.details, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  )
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 20,
        background: 'rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, fontSize: 13 }}>
      <div style={{ color: '#94a3b8' }}>{label}</div>
      <div style={{ color: '#cbd5e1', wordBreak: 'break-word' }}>
        {href ? (
          <a href={href} style={{ color: '#bfdbfe', textDecoration: 'none' }}>
            {value}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
