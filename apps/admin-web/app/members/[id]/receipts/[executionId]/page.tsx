'use client';

import { use, useEffect, useState } from 'react';
import { DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb } from '@m5/ui';
import {
  buildGovernanceApprovalDetailHref,
} from '../../../../approvals-data';
import {
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsRuntimeDetailHref,
  buildMemberOperationsSourceDetailHref,
  buildMemberOperationsTaskDetailHref,
  getMemberOperationsRuntimeApprovalSummary,
  loadAdminMemberOperationReceiptDetail,
  replayMemberOperationsRuntimeReceipt,
} from '../../../../members-view-model';
import { useDetailActions } from '../../../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../../components/detail-workspace-registry';

function runtimeStateColor(state?: string | null): string {
  if (state === 'callback-recorded') return '#86efac';
  if (state === 'replay-scheduled') return '#93c5fd';
  if (state === 'blocked') return '#fca5a5';
  if (state === 'submitted') return '#fde68a';
  return '#cbd5e1';
}

function runtimeApprovalColor(status: string): string {
  if (status === 'APPROVED') return '#86efac';
  if (status === 'PENDING') return '#fde68a';
  return '#fca5a5';
}

export default function MemberOperationReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string; executionId: string }>;
}) {
  const { id: memberId, executionId } = use(params);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadAdminMemberOperationReceiptDetail>>>({
    deliveryMode: 'fallback',
    member: null,
    receipt: null,
    task: null,
    runtimeReceipt: null,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function hydrate() {
      try {
        const nextSnapshot = await loadAdminMemberOperationReceiptDetail(memberId, executionId);
        if (!disposed) {
          setSnapshot(nextSnapshot);
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
  }, [executionId, memberId]);

  async function handleReplay() {
    setReplaying(true);
    setMessage(null);
    try {
      const runtimeReceipt = await replayMemberOperationsRuntimeReceipt(memberId, executionId);
      if (!runtimeReceipt) {
        setMessage(`执行回执 ${executionId} 的 runtime replay 未返回结果。`);
        return;
      }
      setSnapshot((prev) => ({
        ...prev,
        runtimeReceipt,
      }));
      const approval = getMemberOperationsRuntimeApprovalSummary(runtimeReceipt);
      setMessage(
        approval?.status === 'PENDING'
          ? `执行回执 ${executionId} 已转入审批 ${approval.ticket ?? ''}`.trim()
          : `执行回执 ${executionId} 已触发 replay，状态 ${runtimeReceipt.state}`
      );
    } finally {
      setReplaying(false);
    }
  }

  const runtimeApproval = snapshot.runtimeReceipt
    ? getMemberOperationsRuntimeApprovalSummary(snapshot.runtimeReceipt)
    : null;

  const { actions: detailActions } = useDetailActions({
    workspace: 'members',
    detailId: `${memberId}/receipts/${executionId}`,
    record: snapshot,
    shareTitle: `会员运营回执 · ${executionId}`,
    shareText: `查看会员 ${memberId} 的运营回执 ${executionId} 详情`
  });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: `${memberId}/receipts/${executionId}` })}
      />
      <div style={{ marginBottom: 24 }}>
        <a href={`/members/${memberId}`} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 13 }}>
          返回会员详情
        </a>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginTop: 10 }}>
          执行回执 {executionId}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
          {loading
            ? '正在同步执行回执详情...'
            : `数据源 ${snapshot.deliveryMode} · 会员 ${snapshot.member?.name ?? memberId}`}
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

      {!loading && !snapshot.receipt ? (
        <div style={{ color: '#94a3b8' }}>执行回执 {executionId} 不存在。</div>
      ) : null}

      {snapshot.receipt ? (
        <>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
            <StatCard label="动作编码" value={snapshot.receipt.actionCode} helper={snapshot.task?.title ?? '—'} />
            <StatCard label="执行状态" value={snapshot.receipt.status} helper={`执行于 ${snapshot.receipt.executedAt}`} />
            <StatCard label="执行目标" value={snapshot.receipt.targetType} helper={snapshot.receipt.targetId} />
            <StatCard label="Runtime" value={snapshot.receipt.runtimeState ?? '—'} helper={snapshot.receipt.runtimeReceiptCode ?? '未挂接'} />
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>互链导航</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={`/members/${memberId}`} style={linkBtnStyle('member')}>会员详情</a>
              {snapshot.receipt.runtimeReceiptCode ? (
                <a
                  href={buildMemberOperationsRuntimeDetailHref(snapshot.receipt.runtimeReceiptCode)}
                  style={linkBtnStyle('runtime')}
                >
                  统一治理详情
                </a>
              ) : null}
              {runtimeApproval?.ticket ? (
                <a href={buildGovernanceApprovalDetailHref(runtimeApproval.ticket)} style={linkBtnStyle('approval')}>
                  审批详情
                </a>
              ) : null}
              <a
                href={buildMemberOperationsReceiptDetailHref(memberId, executionId)}
                style={linkBtnStyle('receipt')}
              >
                当前详情直链
              </a>
              {snapshot.receipt.runtimeReceiptCode ? (
                <button type="button" onClick={() => void handleReplay()} disabled={replaying} style={actionBtnStyle()}>
                  {replaying ? '重放中...' : '触发 Replay'}
                </button>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <InfoPanel title="执行回执">
              <InfoRow label="会员" value={snapshot.member?.name ?? memberId} />
              <InfoRow label="执行回执" value={snapshot.receipt.executionId} />
              <InfoRow
                label="任务"
                value={snapshot.receipt.taskId}
                href={buildMemberOperationsTaskDetailHref(memberId, snapshot.receipt.taskId)}
              />
              <InfoRow label="摘要" value={snapshot.receipt.summary} />
              <InfoRow label="Target" value={`${snapshot.receipt.targetType}:${snapshot.receipt.targetId}`} />
            </InfoPanel>

            <InfoPanel title="任务上下文">
              <InfoRow label="标题" value={snapshot.task?.title ?? '—'} />
              <InfoRow label="执行 Lane" value={snapshot.task?.executionLane ?? '—'} />
              <InfoRow
                label="来源订单"
                value={snapshot.task?.sourceOrderId ?? '—'}
                href={
                  snapshot.task?.sourceOrderId
                    ? buildMemberOperationsSourceDetailHref(memberId, 'order', snapshot.task.sourceOrderId)
                    : undefined
                }
              />
              <InfoRow
                label="来源支付"
                value={snapshot.task?.sourcePaymentId ?? '—'}
                href={
                  snapshot.task?.sourcePaymentId
                    ? buildMemberOperationsSourceDetailHref(memberId, 'payment', snapshot.task.sourcePaymentId)
                    : undefined
                }
              />
              <InfoRow label="执行总结" value={snapshot.task?.executionSummary ?? '—'} />
            </InfoPanel>
          </div>

          {snapshot.runtimeReceipt ? (
            <div
              style={{
                borderRadius: 18,
                padding: 20,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                marginTop: 24,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>Runtime 治理</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <InfoRow label="状态" value={snapshot.runtimeReceipt.state} valueColor={runtimeStateColor(snapshot.runtimeReceipt.state)} />
                <InfoRow label="Callback" value={snapshot.runtimeReceipt.callback.callbackStatus} />
                <InfoRow label="Ticket" value={snapshot.runtimeReceipt.ticket.ticketCode} />
                <InfoRow label="Ledger" value={snapshot.runtimeReceipt.ledger.ledgerKey} />
                {runtimeApproval ? (
                  <InfoRow
                    label="审批"
                    value={`${runtimeApproval.status}${runtimeApproval.ticket ? ` · ${runtimeApproval.ticket}` : ''}`}
                    valueColor={runtimeApprovalColor(runtimeApproval.status)}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <DetailActionBar
        actions={detailActions}
        heading="详情收口动作"
        caption="复制 / 导出 / 分享当前运营回执详情"
      />

      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'members',
          detailId: `${memberId}/receipts/${executionId}`,
          extraLinks: [
            {
              key: 'member',
              title: '返回会员详情',
              subtitle: `回到会员 ${memberId} 详情`,
              href: `/members/${memberId}`
            }
          ]
        })}
      />
    </main>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
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
      <div style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>{helper}</div>
    </div>
  );
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

function InfoRow({
  label,
  value,
  valueColor = '#cbd5e1',
  href,
}: {
  label: string;
  value: string;
  valueColor?: string;
  href?: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, fontSize: 13 }}>
      <div style={{ color: '#94a3b8' }}>{label}</div>
      <div style={{ color: valueColor, wordBreak: 'break-word' }}>
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

function linkBtnStyle(kind: 'member' | 'runtime' | 'approval' | 'receipt') {
  const palette =
    kind === 'approval'
      ? { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.24)', color: '#fde68a' }
      : kind === 'runtime'
        ? { background: 'rgba(59,130,246,0.16)', border: '1px solid rgba(96,165,250,0.3)', color: '#dbeafe' }
        : kind === 'receipt'
          ? { background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(192,132,252,0.22)', color: '#e9d5ff' }
          : { background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(56,189,248,0.24)', color: '#dbeafe' };

  return {
    borderRadius: 10,
    padding: '8px 14px',
    textDecoration: 'none',
    fontSize: 13,
    ...palette,
  } as const;
}

function actionBtnStyle() {
  return {
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
    background: 'rgba(248, 113, 113, 0.14)',
    border: '1px solid rgba(248, 113, 113, 0.28)',
    color: '#fecaca',
  } as const;
}
