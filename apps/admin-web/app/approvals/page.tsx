'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DetailActionBar } from '@m5/ui';
import {
  adminGovernanceApprovalsRoute,
  buildGovernanceApprovalDetailHref,
} from '../approvals-data';
import {
  getApprovalMemberContext,
  getApprovalMemberHref,
  governanceApprovalResourceCategoryOptions,
  getApprovalResourceCategory,
  getApprovalResourceCategoryLabel,
  loadGovernanceApprovals,
  type GovernanceApprovalResourceCategory,
  type GovernanceApprovalSnapshot,
  type GovernanceApprovalStatus,
} from '../approvals-view-model';
import { useDetailActions } from '../components/use-detail-actions';

const statuses: Array<{ label: string; value?: GovernanceApprovalStatus }> = [
  { label: '全部', value: undefined },
  { label: '待审批', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已驳回', value: 'REJECTED' },
  { label: '已撤销', value: 'CANCELLED' },
];

function statusColor(status: GovernanceApprovalStatus): string {
  if (status === 'APPROVED') return '#86efac';
  if (status === 'PENDING') return '#fde68a';
  if (status === 'REJECTED' || status === 'CANCELLED') return '#fca5a5';
  return '#93c5fd';
}

function summaryValue(summary: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = summary?.[key];
  return typeof value === 'string' ? value : null;
}

function runtimeReceiptCode(approval: GovernanceApprovalSnapshot): string | null {
  const payload = approval.summary?.requestPayload;
  return payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).receiptCode === 'string'
    ? ((payload as Record<string, unknown>).receiptCode as string)
    : approval.resourceKey ?? null;
}

function ApprovalsPageContent() {
  const searchParams = useSearchParams();
  const status = useMemo<GovernanceApprovalStatus | undefined>(() => {
    const raw = searchParams.get('status');
    return raw === 'PENDING' ||
      raw === 'APPROVED' ||
      raw === 'REJECTED' ||
      raw === 'CANCELLED' ||
      raw === 'SUPERSEDED' ||
      raw === 'NOT_REQUIRED'
      ? raw
      : undefined;
  }, [searchParams]);
  const resourceCategory = useMemo<GovernanceApprovalResourceCategory | 'all'>(() => {
    const raw = searchParams.get('resourceCategory');
    return raw === 'member-profile' || raw === 'runtime-receipt' ? raw : 'all';
  }, [searchParams]);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadGovernanceApprovals>>>({
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    approvals: [],
    summary: {
      total: 0,
      statuses: {
        NOT_REQUIRED: 0,
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        CANCELLED: 0,
        SUPERSEDED: 0,
      },
      execution: {
        executed: 0,
        pending: 0,
        withFailures: 0,
        byExecutionStatus: {},
        byFailureStatus: {},
      },
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    async function hydrate() {
      try {
        const nextSnapshot = await loadGovernanceApprovals({
          status,
          resourceCategory,
        });
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
  }, [status, resourceCategory]);

  const { actions } = useDetailActions({
    workspace: 'approvals',
    detailId: 'overview',
    record: { snapshot, status, resourceCategory },
    shareTitle: '审批工作台',
    shareText: '查看治理审批队列 / 状态 / 资源类型'
  });

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0' }}>
          {adminGovernanceApprovalsRoute.title}
        </div>
        <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 14 }}>
          {adminGovernanceApprovalsRoute.description} 当前数据源：{snapshot.deliveryMode}。
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard label="总审批单" value={snapshot.summary.total} helper={`更新于 ${snapshot.generatedAt}`} />
        <StatCard label="待审批" value={snapshot.summary.statuses.PENDING} helper="待人工放行或驳回" />
        <StatCard label="已执行" value={snapshot.summary.execution.executed} helper="审批后已进入执行态" />
        <StatCard label="执行失败" value={snapshot.summary.execution.withFailures} helper="需要补偿或重新提交" />
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
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>状态筛选</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {statuses.map((item) => {
            const active = item.value === status || (!item.value && !status);
            const href = item.value ? `${adminGovernanceApprovalsRoute.href}?status=${item.value}` : adminGovernanceApprovalsRoute.href;
            return (
              <a
                key={item.label}
                href={href}
                style={{
                  borderRadius: 999,
                  padding: '6px 14px',
                  textDecoration: 'none',
                  fontSize: 13,
                  color: active ? '#0f172a' : '#cbd5e1',
                  background: active ? '#bfdbfe' : 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>
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
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>资源类型</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {governanceApprovalResourceCategoryOptions.map((option) => {
            const active = option.value === resourceCategory;
            const params = new URLSearchParams();
            if (status) {
              params.set('status', status);
            }
            if (option.value !== 'all') {
              params.set('resourceCategory', option.value);
            }
            const query = params.toString();
            const href = query
              ? `${adminGovernanceApprovalsRoute.href}?${query}`
              : adminGovernanceApprovalsRoute.href;
            return (
              <a
                key={option.value}
                href={href}
                title={option.description}
                style={{
                  borderRadius: 999,
                  padding: '6px 14px',
                  textDecoration: 'none',
                  fontSize: 13,
                  color: active ? '#0f172a' : '#cbd5e1',
                  background: active ? '#bfdbfe' : 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                }}
              >
                {option.label}
              </a>
            );
          })}
        </div>
      </div>

      <div
        style={{
          borderRadius: 18,
          padding: 20,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>审批队列</div>
        {loading ? <div style={{ color: '#94a3b8' }}>正在同步审批队列...</div> : null}
        {!loading && snapshot.approvals.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>当前筛选条件下没有审批单。</div>
        ) : null}
        <div style={{ display: 'grid', gap: 12 }}>
          {snapshot.approvals.map((approval) => {
            const requestedFrom = summaryValue(approval.summary, 'requestedFrom');
            const requestEndpoint = summaryValue(approval.summary, 'requestEndpoint');
            const payloadSummary = summaryValue(approval.summary, 'payloadSummary');
            const receiptCode = runtimeReceiptCode(approval);
            const memberContext = getApprovalMemberContext(approval);
            const memberHref = getApprovalMemberHref(approval);
            const category = getApprovalResourceCategory(approval);
            const categoryLabel = getApprovalResourceCategoryLabel(category);
            return (
              <a
                key={approval.ticket ?? approval.approvalId ?? Math.random()}
                href={approval.ticket ? buildGovernanceApprovalDetailHref(approval.ticket) : adminGovernanceApprovalsRoute.href}
                style={{
                  textDecoration: 'none',
                  borderRadius: 14,
                  padding: 16,
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                  color: '#e2e8f0',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{approval.ticket ?? '未命名审批单'}</span>
                  <span style={{ fontSize: 12, color: statusColor(approval.status) }}>{approval.status}</span>
                  <span style={{ fontSize: 12, color: '#bfdbfe' }}>资源类型：{categoryLabel}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{approval.operation ?? 'unknown-operation'}</span>
                </div>
                <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
                  <div>资源：{approval.resourceType ?? '—'} / {approval.resourceKey ?? '—'}</div>
                  <div>请求人：{approval.requestedBy ?? '—'} · 来源：{requestedFrom ?? '—'}</div>
                  <div>治理回执：{receiptCode ?? '—'} · 版本：{approval.version ?? '—'}</div>
                  {memberContext ? (
                    <div>
                      会员：
                      {memberHref ? (
                        <a href={memberHref} style={{ color: '#bfdbfe', textDecoration: 'none', marginLeft: 6 }}>
                          {memberContext.memberId}
                        </a>
                      ) : (
                        ` ${memberContext.memberId}`
                      )}
                      {memberContext.actionCode ? ` · 动作 ${memberContext.actionCode}` : ''}
                      {memberContext.executionId ? ` · 回执 ${memberContext.executionId}` : ''}
                    </div>
                  ) : null}
                  <div>Endpoint：{requestEndpoint ?? '—'}</div>
                  <div>摘要：{payloadSummary ?? '—'}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前审批工作台筛选快照"
      />
    </main>
  );
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<ApprovalsPageFallback />}>
      <ApprovalsPageContent />
    </Suspense>
  );
}

function ApprovalsPageFallback() {
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
      正在加载审批工作台...
    </main>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number | string; helper: string }) {
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
      <div style={{ color: '#e2e8f0', fontSize: 26, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>{helper}</div>
    </div>
  );
}
