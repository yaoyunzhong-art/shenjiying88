'use client';

import { use, useEffect, useState } from 'react';
import { DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb } from '@m5/ui';
import {
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsRuntimeDetailHref,
  buildMemberOperationsSourceDetailHref,
  buildMemberOperationsTaskDetailHref,
  loadAdminMemberOperationTaskDetail,
  type MemberOperationsReceiptApi,
} from '../../../../members-view-model';
import { useDetailActions } from '../../../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../../components/detail-workspace-registry';

export default function MemberOperationTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: memberId, taskId } = use(params);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadAdminMemberOperationTaskDetail>>>({
    deliveryMode: 'fallback',
    member: null,
    task: null,
    receipts: [],
    sourceTasks: [],
    sourceReceipts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    async function hydrate() {
      try {
        const nextSnapshot = await loadAdminMemberOperationTaskDetail(memberId, taskId);
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
  }, [memberId, taskId]);

  const { actions: detailActions } = useDetailActions({
    workspace: 'members',
    detailId: `${memberId}/tasks/${taskId}`,
    record: snapshot,
    shareTitle: `会员运营任务 · ${taskId}`,
    shareText: `查看会员 ${memberId} 的运营任务 ${taskId} 详情`
  });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: `${memberId}/tasks/${taskId}` })}
      />
      <div style={{ marginBottom: 24 }}>
        <a href={`/members/${memberId}`} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 13 }}>
          返回会员详情
        </a>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginTop: 10 }}>
          运营任务 {taskId}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
          {loading
            ? '正在同步任务详情...'
            : `数据源 ${snapshot.deliveryMode} · 会员 ${snapshot.member?.name ?? memberId}`}
        </div>
      </div>

      {!loading && !snapshot.task ? (
        <div style={{ color: '#94a3b8' }}>运营任务 {taskId} 不存在。</div>
      ) : null}

      {snapshot.task ? (
        <>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
            <StatCard label="动作编码" value={snapshot.task.actionCode} helper={snapshot.task.title} />
            <StatCard label="执行状态" value={snapshot.task.status} helper={`Lane ${snapshot.task.executionLane}`} />
            <StatCard label="来源订单" value={snapshot.task.sourceOrderId ?? '—'} helper={`source ${snapshot.task.source}`} />
            <StatCard label="来源支付" value={snapshot.task.sourcePaymentId ?? '—'} helper={snapshot.task.executionTargetId ?? '—'} />
          </div>

          <InfoPanel title="任务概览">
            <InfoRow label="会员" value={snapshot.member?.name ?? memberId} />
            <InfoRow label="任务 ID" value={snapshot.task.taskId} />
            <InfoRow label="优先级" value={snapshot.task.priority} />
            <InfoRow label="渠道" value={snapshot.task.channel} />
            <InfoRow label="创建时间" value={snapshot.task.createdAt} />
            <InfoRow label="计划时间" value={snapshot.task.scheduledAt} />
            <InfoRow label="执行时间" value={snapshot.task.executedAt ?? '—'} />
            <InfoRow label="原因" value={snapshot.task.reason} />
            <InfoRow label="执行总结" value={snapshot.task.executionSummary ?? '—'} />
          </InfoPanel>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 24 }}>
            <CollectionPanel
              title={`同任务执行回执 (${snapshot.receipts.length})`}
              emptyMessage="当前任务暂无执行回执。"
              items={snapshot.receipts}
              memberId={memberId}
            />
            <InfoPanel title={`同来源聚合 (${snapshot.sourceTasks.length + 1} 任务 / ${snapshot.sourceReceipts.length} 回执)`}>
              <InfoRow
                label="来源订单"
                value={snapshot.task.sourceOrderId ?? '—'}
                href={
                  snapshot.task.sourceOrderId
                    ? buildMemberOperationsSourceDetailHref(memberId, 'order', snapshot.task.sourceOrderId)
                    : undefined
                }
              />
              <InfoRow
                label="来源支付"
                value={snapshot.task.sourcePaymentId ?? '—'}
                href={
                  snapshot.task.sourcePaymentId
                    ? buildMemberOperationsSourceDetailHref(memberId, 'payment', snapshot.task.sourcePaymentId)
                    : undefined
                }
              />
              <InfoRow label="同来源任务" value={String(snapshot.sourceTasks.length + 1)} />
              <InfoRow label="同来源回执" value={String(snapshot.sourceReceipts.length)} />
            </InfoPanel>
          </div>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 24 }}>
            <div
              style={{
                borderRadius: 18,
                padding: 20,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>同来源任务</div>
              {snapshot.sourceTasks.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>当前来源下没有其他任务。</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {snapshot.sourceTasks.map((item) => (
                    <a
                      key={item.taskId}
                      href={buildMemberOperationsTaskDetailHref(memberId, item.taskId)}
                      style={{
                        textDecoration: 'none',
                        borderRadius: 12,
                        padding: 12,
                        background: 'rgba(30, 41, 59, 0.45)',
                        border: '1px solid rgba(148, 163, 184, 0.14)',
                        color: '#e2e8f0',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.taskId}</div>
                      <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6 }}>
                        {item.actionCode} · {item.status} · {item.executionLane}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <CollectionPanel
              title="同来源回执"
              emptyMessage="当前来源下暂无其他执行回执。"
              items={snapshot.sourceReceipts}
              memberId={memberId}
            />
          </div>
        </>
      ) : null}

      <DetailActionBar
        actions={detailActions}
        heading="详情收口动作"
        caption="复制 / 导出 / 分享当前运营任务详情"
      />

      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'members',
          detailId: `${memberId}/tasks/${taskId}`,
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

function CollectionPanel({
  title,
  emptyMessage,
  items,
  memberId,
}: {
  title: string;
  emptyMessage: string;
  items: MemberOperationsReceiptApi[];
  memberId: string;
}) {
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
      {items.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>{emptyMessage}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((receipt) => {
            return (
              <div
                key={receipt.executionId}
                style={{
                  borderRadius: 12,
                  padding: 12,
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                }}
              >
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <a
                    href={buildMemberOperationsReceiptDetailHref(memberId, receipt.executionId)}
                    style={{ color: '#bfdbfe', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
                  >
                    {receipt.executionId}
                  </a>
                  <span style={{ color: '#cbd5e1', fontSize: 12 }}>{receipt.actionCode}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{receipt.status}</span>
                </div>
                <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
                  <div>Target：{receipt.targetType}:{receipt.targetId}</div>
                  <div>执行时间：{receipt.executedAt}</div>
                  {receipt.runtimeReceiptCode ? (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <a
                        href={buildMemberOperationsRuntimeDetailHref(receipt.runtimeReceiptCode)}
                        style={{ color: '#93c5fd', textDecoration: 'none' }}
                      >
                        Runtime 详情
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
