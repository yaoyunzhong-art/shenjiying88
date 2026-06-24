'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { DetailActionBar, DetailClosureBar, WorkspaceBreadcrumb } from '@m5/ui';
import { decideGovernanceApproval } from '../../../../../approvals-view-model';
import {
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsRuntimeDetailHref,
  buildMemberOperationsSourceDetailHref,
  buildMemberOperationsTaskDetailHref,
  getMemberOperationsRuntimeApprovalSummary,
  loadAdminMemberOperationSourceDetail,
  replayMemberOperationsRuntimeReceipts,
  type MemberOperationsSourceKind,
} from '../../../../../members-view-model';
import { useDetailActions } from '../../../../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../../../components/detail-workspace-registry';

function sourceKindLabel(kind: MemberOperationsSourceKind) {
  return kind === 'order' ? '订单来源' : '支付来源';
}

export default function MemberOperationSourceDetailPage({
  params,
}: {
  params: Promise<{ id: string; kind: MemberOperationsSourceKind; sourceId: string }>;
}) {
  const { id: memberId, kind, sourceId } = use(params);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadAdminMemberOperationSourceDetail>>>({
    deliveryMode: 'fallback',
    member: null,
    sourceKind: kind,
    sourceId,
    tasks: [],
    receipts: [],
    runtimeReceipts: {},
    timelineItems: [],
    attentionItems: [],
    recommendedActions: [],
    sourceStages: [],
    bottleneckStage: null,
    timelineSummary: {
      totalEvents: 0,
      latestOccurredAt: null,
      categoryCounts: {
        task: 0,
        receipt: 0,
        runtime: 0,
        approval: 0,
      },
      attentionCount: 0,
    },
    pendingApprovalItems: [],
    chainSummary: {
      runtimeTrackedReceipts: 0,
      replayableReceipts: 0,
      pendingApprovals: 0,
      approvedApprovals: 0,
      blockedReceipts: 0,
      callbackRecordedReceipts: 0,
      replayScheduledReceipts: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [batchReplaying, setBatchReplaying] = useState(false);
  const [batchApproving, setBatchApproving] = useState(false);
  const [batchRejecting, setBatchRejecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [timelineCategory, setTimelineCategory] = useState<'all' | 'task' | 'receipt' | 'runtime' | 'approval'>('all');
  const [attentionOnly, setAttentionOnly] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function hydrate() {
      try {
        const nextSnapshot = await loadAdminMemberOperationSourceDetail(memberId, kind, sourceId);
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
  }, [kind, memberId, sourceId]);

  const { actions: detailActions } = useDetailActions({
    workspace: 'members',
    detailId: `${memberId}/sources/${kind}/${sourceId}`,
    record: snapshot,
    shareTitle: `会员运营来源 · ${sourceId}`,
    shareText: `查看会员 ${memberId} 的 ${sourceKindLabel(kind)} ${sourceId} 详情`
  });

  async function refreshSnapshot() {
    const nextSnapshot = await loadAdminMemberOperationSourceDetail(memberId, kind, sourceId);
    setSnapshot(nextSnapshot);
  }

  async function handleBatchReplay() {
    const replayableExecutionIds = snapshot.receipts
      .filter((item) => item.runtimeReplayable)
      .map((item) => item.executionId);

    if (replayableExecutionIds.length === 0) {
      setMessage('当前来源下没有可批量 replay 的执行回执。');
      return;
    }

    setBatchReplaying(true);
    setMessage(null);
    try {
      const results = await replayMemberOperationsRuntimeReceipts(memberId, replayableExecutionIds);
      const scheduled = results.filter((item) => item.receipt && item.receipt.state === 'replay-scheduled').length;
      const pendingApproval = results.filter(
        (item) => item.receipt && getMemberOperationsRuntimeApprovalSummary(item.receipt)?.status === 'PENDING'
      ).length;
      const failed = results.filter((item) => !item.receipt).length;

      await refreshSnapshot();
      setMessage(
        `已处理 ${results.length} 条来源回执：已调度 ${scheduled} 条，转审批 ${pendingApproval} 条，失败 ${failed} 条。`
      );
    } finally {
      setBatchReplaying(false);
    }
  }

  async function handleBatchDecision(decision: 'APPROVED' | 'REJECTED') {
    const pendingItems = snapshot.pendingApprovalItems;
    if (pendingItems.length === 0) {
      setMessage('当前来源下没有待处理审批单。');
      return;
    }

    if (decision === 'APPROVED') {
      setBatchApproving(true);
    } else {
      setBatchRejecting(true);
    }
    setMessage(null);

    try {
      const results = await Promise.all(
        pendingItems.map(async (item) => {
          try {
            await decideGovernanceApproval(item.ticket, decision);
            return { ticket: item.ticket, ok: true as const };
          } catch {
            return { ticket: item.ticket, ok: false as const };
          }
        })
      );
      const success = results.filter((item) => item.ok).length;
      const failed = results.length - success;
      await refreshSnapshot();
      setMessage(
        `${decision === 'APPROVED' ? '批量审批通过' : '批量审批驳回'} ${results.length} 条来源审批：成功 ${success} 条，失败 ${failed} 条。`
      );
    } finally {
      if (decision === 'APPROVED') {
        setBatchApproving(false);
      } else {
        setBatchRejecting(false);
      }
    }
  }

  const attentionExecutionIds = useMemo(
    () => new Set(snapshot.attentionItems.map((item) => item.executionId).filter((value): value is string => Boolean(value))),
    [snapshot.attentionItems]
  );

  const filteredTimelineItems = useMemo(
    () =>
      snapshot.timelineItems.filter((item) => {
        if (timelineCategory !== 'all' && item.category !== timelineCategory) {
          return false;
        }
        if (attentionOnly && item.executionId && !attentionExecutionIds.has(item.executionId)) {
          return false;
        }
        if (attentionOnly && !item.executionId && item.category !== 'approval') {
          return false;
        }
        return true;
      }),
    [attentionExecutionIds, attentionOnly, snapshot.timelineItems, timelineCategory]
  );

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: `${memberId}/${sourceKindLabel(kind)}` })}
      />
      <div style={{ marginBottom: 24 }}>
        <Link href={`/members/${memberId}`} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 13 }}>
          返回会员详情
        </Link>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginTop: 10 }}>
          {sourceKindLabel(kind)} {sourceId}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
          {loading
            ? '正在同步来源工作台...'
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

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard label="来源类型" value={sourceKindLabel(kind)} helper={sourceId} />
        <StatCard label="关联任务" value={String(snapshot.tasks.length)} helper="同来源任务聚合" />
        <StatCard label="关联回执" value={String(snapshot.receipts.length)} helper="同来源执行回执" />
        <StatCard
          label="来源直链"
          value={sourceId}
          helper={buildMemberOperationsSourceDetailHref(memberId, kind, sourceId)}
        />
      </div>

      <div
        style={{
          borderRadius: 18,
          padding: 20,
          background: 'rgba(15, 23, 42, 0.35)',
          border: `1px solid ${stageTone(snapshot.bottleneckStage?.status ?? 'completed').border}`,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>当前卡点</div>
            <div style={{ marginTop: 8, color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>
              {snapshot.bottleneckStage
                ? `${snapshot.bottleneckStage.title} · ${snapshot.bottleneckStage.summary}`
                : '当前来源链未发现明显卡点，可继续复核已完成轨迹。'}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
            <span style={pillStyle(stageTone(snapshot.bottleneckStage?.status ?? 'completed').color, stageTone(snapshot.bottleneckStage?.status ?? 'completed').badge)}>
              {snapshot.bottleneckStage ? stageStatusLabel(snapshot.bottleneckStage.status) : '通畅'}
            </span>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>
              {snapshot.bottleneckStage ? `责任入口：${snapshot.bottleneckStage.owner}` : '责任入口：来源治理台'}
            </div>
            {snapshot.bottleneckStage?.href ? (
              <Link href={snapshot.bottleneckStage.href} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 12 }}>
                进入当前处理入口
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard
          label="Runtime 已挂接"
          value={String(snapshot.chainSummary.runtimeTrackedReceipts)}
          helper={`可重放 ${snapshot.chainSummary.replayableReceipts} 条`}
        />
        <StatCard
          label="待审批"
          value={String(snapshot.chainSummary.pendingApprovals)}
          helper={`已批准 ${snapshot.chainSummary.approvedApprovals} 条`}
        />
        <StatCard
          label="已回调"
          value={String(snapshot.chainSummary.callbackRecordedReceipts)}
          helper={`已调度重放 ${snapshot.chainSummary.replayScheduledReceipts} 条`}
        />
        <StatCard
          label="阻塞"
          value={String(snapshot.chainSummary.blockedReceipts)}
          helper="来源触发链异常态"
        />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard
          label="轨迹事件"
          value={String(snapshot.timelineSummary.totalEvents)}
          helper={`最新节点 ${snapshot.timelineSummary.latestOccurredAt ? formatTimelineTime(snapshot.timelineSummary.latestOccurredAt) : '—'}`}
        />
        <StatCard
          label="治理关注项"
          value={String(snapshot.timelineSummary.attentionCount)}
          helper={`高优先 ${snapshot.attentionItems.filter((item) => item.level === 'high').length} 条`}
        />
        <StatCard
          label="Task / Receipt"
          value={`${snapshot.timelineSummary.categoryCounts.task}/${snapshot.timelineSummary.categoryCounts.receipt}`}
          helper="轨迹节点分类统计"
        />
        <StatCard
          label="Runtime / Approval"
          value={`${snapshot.timelineSummary.categoryCounts.runtime}/${snapshot.timelineSummary.categoryCounts.approval}`}
          helper="治理节点分类统计"
        />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        {snapshot.sourceStages.map((stage) => (
          <div
            key={stage.id}
            style={{
              borderRadius: 18,
              padding: 16,
              background: 'rgba(15, 23, 42, 0.35)',
              border: `1px solid ${stageTone(stage.status).border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700 }}>{stage.title}</div>
              <span style={pillStyle(stageTone(stage.status).color, stageTone(stage.status).badge)}>
                {stageStatusLabel(stage.status)}
              </span>
            </div>
            <div style={{ marginTop: 10, color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>{stage.summary}</div>
            <div style={{ marginTop: 10, color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
              责任入口：{stage.owner}
            </div>
            <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
              下一步：{stage.nextAction}
            </div>
            <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 12 }}>
              节点数 {stage.count} · 最近 {stage.latestOccurredAt ? formatTimelineTime(stage.latestOccurredAt) : '—'}
            </div>
            {stage.href ? (
              <div style={{ marginTop: 10 }}>
                <Link href={stage.href} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 12 }}>
                  进入处理入口
                </Link>
              </div>
            ) : null}
          </div>
        ))}
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
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>触发链治理入口</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => void handleBatchReplay()} disabled={batchReplaying} style={actionBtnStyle()}>
            {batchReplaying ? '批量 Replay 中...' : '同来源批量 Replay'}
          </button>
          <button
            type="button"
            onClick={() => void handleBatchDecision('APPROVED')}
            disabled={batchApproving}
            style={actionBtnStyle('approve')}
          >
            {batchApproving ? '批量通过中...' : '同来源批量通过'}
          </button>
          <button
            type="button"
            onClick={() => void handleBatchDecision('REJECTED')}
            disabled={batchRejecting}
            style={actionBtnStyle('reject')}
          >
            {batchRejecting ? '批量驳回中...' : '同来源批量驳回'}
          </button>
          <Link href="/operations?focus=batch-replay" style={linkBtnStyle('runtime')}>
            去治理操作中心
          </Link>
          <Link href="/approvals?status=PENDING" style={linkBtnStyle('approval')}>
            去待审批列表
          </Link>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
          当前来源链共挂接 {snapshot.chainSummary.runtimeTrackedReceipts} 条 runtime 记录，可重放{' '}
          {snapshot.chainSummary.replayableReceipts} 条，待审批 {snapshot.chainSummary.pendingApprovals} 条。
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 1fr', marginBottom: 24 }}>
        <div
          style={{
            borderRadius: 18,
            padding: 20,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>治理关注项</div>
          {snapshot.attentionItems.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>当前来源链没有需要额外关注的治理项。</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {snapshot.attentionItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 12,
                    padding: 12,
                    background: 'rgba(30, 41, 59, 0.45)',
                    border: `1px solid ${attentionTone(item.level).border}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <span style={pillStyle(attentionTone(item.level).color, attentionTone(item.level).badge)}>
                      {attentionLevelLabel(item.level)}
                    </span>
                    <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{item.title}</span>
                    {item.actionCode ? <span style={{ color: '#cbd5e1', fontSize: 12 }}>{item.actionCode}</span> : null}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>{item.summary}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, fontSize: 12 }}>
                    {item.taskId ? (
                      <Link
                        href={buildMemberOperationsTaskDetailHref(memberId, item.taskId)}
                        style={{ color: '#bfdbfe', textDecoration: 'none' }}
                      >
                        任务详情
                      </Link>
                    ) : null}
                    {item.executionId ? (
                      <Link
                        href={buildMemberOperationsReceiptDetailHref(memberId, item.executionId)}
                        style={{ color: '#93c5fd', textDecoration: 'none' }}
                      >
                        执行回执
                      </Link>
                    ) : null}
                    {item.runtimeReceiptCode ? (
                      <Link
                        href={buildMemberOperationsRuntimeDetailHref(item.runtimeReceiptCode)}
                        style={{ color: '#86efac', textDecoration: 'none' }}
                      >
                        Runtime 详情
                      </Link>
                    ) : null}
                    {item.approvalTicket ? (
                      <Link href={`/approvals/${item.approvalTicket}`} style={{ color: '#fde68a', textDecoration: 'none' }}>
                        审批详情
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: 20,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>推荐动作</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {snapshot.recommendedActions.map((item) => (
              <div
                key={item.code}
                style={{
                  borderRadius: 12,
                  padding: 12,
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: `1px solid ${attentionTone(item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'info').border}`,
                }}
              >
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                  <span
                    style={pillStyle(
                      attentionTone(item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'info').color,
                      attentionTone(item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'info').badge
                    )}
                  >
                    {priorityLabel(item.priority)}
                  </span>
                  <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>{item.reason}</div>
                {item.href ? (
                  <div style={{ marginTop: 10 }}>
                    <Link href={item.href} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 12 }}>
                      进入处理入口
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>来源处置轨迹</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all', 'task', 'receipt', 'runtime', 'approval'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTimelineCategory(item)}
                style={filterBtnStyle(timelineCategory === item)}
              >
                {timelineFilterLabel(item)}
              </button>
            ))}
            <button type="button" onClick={() => setAttentionOnly((current) => !current)} style={filterBtnStyle(attentionOnly, 'warning')}>
              {attentionOnly ? '仅关注项中' : '仅看关注项'}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
          当前展示 {filteredTimelineItems.length} / {snapshot.timelineItems.length} 个轨迹节点。
        </div>
        {filteredTimelineItems.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>当前来源下暂无可展示的处置轨迹。</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredTimelineItems.map((item, index) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr)', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: timelineTone(item.category).dot,
                      boxShadow: `0 0 0 4px ${timelineTone(item.category).ring}`,
                      marginTop: 6,
                    }}
                  />
                  {index < filteredTimelineItems.length - 1 ? (
                    <div style={{ width: 2, flex: 1, marginTop: 8, background: 'rgba(71, 85, 105, 0.7)' }} />
                  ) : null}
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    padding: 14,
                    background: 'rgba(30, 41, 59, 0.45)',
                    border: `1px solid ${timelineTone(item.category).border}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                    <span style={pillStyle(timelineTone(item.category).label, timelineTone(item.category).badge)}>
                      {timelineCategoryLabel(item.category)}
                    </span>
                    <span style={pillStyle('#cbd5e1', 'rgba(148,163,184,0.16)')}>{timelineStageLabel(item.stage)}</span>
                    {item.status ? (
                      <span style={pillStyle(timelineStatusTone(item).color, timelineStatusTone(item).background)}>{item.status}</span>
                    ) : null}
                    {item.actionCode ? <span style={{ color: '#cbd5e1', fontSize: 12 }}>{item.actionCode}</span> : null}
                    {item.decisionBy ? (
                      <span style={{ color: '#cbd5e1', fontSize: 12 }}>决策人 {item.decisionBy}</span>
                    ) : null}
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{formatTimelineTime(item.occurredAt)}</span>
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>{item.summary}</div>
                  {item.decisionAt ? (
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>
                      决策时间：{formatTimelineTime(item.decisionAt)}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, fontSize: 12 }}>
                    {item.taskId ? (
                      <Link
                        href={buildMemberOperationsTaskDetailHref(memberId, item.taskId)}
                        style={{ color: '#bfdbfe', textDecoration: 'none' }}
                      >
                        任务详情
                      </Link>
                    ) : null}
                    {item.executionId ? (
                      <Link
                        href={buildMemberOperationsReceiptDetailHref(memberId, item.executionId)}
                        style={{ color: '#93c5fd', textDecoration: 'none' }}
                      >
                        执行回执
                      </Link>
                    ) : null}
                    {item.runtimeReceiptCode ? (
                      <Link
                        href={buildMemberOperationsRuntimeDetailHref(item.runtimeReceiptCode)}
                        style={{ color: '#86efac', textDecoration: 'none' }}
                      >
                        Runtime 详情
                      </Link>
                    ) : null}
                    {item.approvalTicket ? (
                      <Link href={`/approvals/${item.approvalTicket}`} style={{ color: '#fde68a', textDecoration: 'none' }}>
                        审批详情
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div
          style={{
            borderRadius: 18,
            padding: 20,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>同来源任务</div>
          {snapshot.tasks.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>当前来源下暂无任务。</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {snapshot.tasks.map((task) => (
                <Link
                  key={task.taskId}
                  href={buildMemberOperationsTaskDetailHref(memberId, task.taskId)}
                  style={{
                    textDecoration: 'none',
                    borderRadius: 12,
                    padding: 12,
                    background: 'rgba(30, 41, 59, 0.45)',
                    border: '1px solid rgba(148, 163, 184, 0.14)',
                    color: '#e2e8f0',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6 }}>
                    {task.taskId} · {task.actionCode} · {task.executionLane}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                    状态 {task.status} · 渠道 {task.channel}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: 20,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>同来源执行回执</div>
          {snapshot.receipts.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>当前来源下暂无执行回执。</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {snapshot.receipts.map((receipt) => (
                <div
                  key={receipt.executionId}
                  style={{
                    borderRadius: 12,
                    padding: 12,
                    background: 'rgba(30, 41, 59, 0.45)',
                    border: '1px solid rgba(148, 163, 184, 0.14)',
                  }}
                >
                  {(() => {
                    const runtimeReceipt = snapshot.runtimeReceipts[receipt.executionId];
                    const approval = runtimeReceipt ? getMemberOperationsRuntimeApprovalSummary(runtimeReceipt) : null;
                    return (
                      <>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <Link
                      href={buildMemberOperationsReceiptDetailHref(memberId, receipt.executionId)}
                      style={{ color: '#bfdbfe', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
                    >
                      {receipt.executionId}
                    </Link>
                    <span style={{ color: '#cbd5e1', fontSize: 12 }}>{receipt.actionCode}</span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{receipt.status}</span>
                    {receipt.runtimeState ? (
                      <span style={pillStyle('#bfdbfe', 'rgba(59,130,246,0.18)')}>{receipt.runtimeState}</span>
                    ) : null}
                    {receipt.runtimeReplayable ? (
                      <span style={pillStyle('#86efac', 'rgba(34,197,94,0.16)')}>replayable</span>
                    ) : null}
                    {approval ? (
                      <span
                        style={pillStyle(
                          approval.status === 'PENDING' ? '#fde68a' : '#86efac',
                          approval.status === 'PENDING' ? 'rgba(250,204,21,0.16)' : 'rgba(34,197,94,0.16)'
                        )}
                      >
                        approval:{approval.status}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
                    <div>
                      目标 {receipt.targetType}:{receipt.targetId}
                    </div>
                    <div>执行于 {receipt.executedAt}</div>
                    {receipt.runtimeReceiptCode ? (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link
                          href={buildMemberOperationsRuntimeDetailHref(receipt.runtimeReceiptCode)}
                          style={{ color: '#93c5fd', textDecoration: 'none' }}
                        >
                          Runtime 详情
                        </Link>
                        {approval?.ticket ? (
                          <Link href={`/approvals/${approval.ticket}`} style={{ color: '#fde68a', textDecoration: 'none' }}>
                            审批详情
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
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
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>同来源待审批清单</div>
        {snapshot.pendingApprovalItems.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>当前来源下没有待处理审批单。</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {snapshot.pendingApprovalItems.map((item) => (
              <div
                key={item.ticket}
                style={{
                  borderRadius: 12,
                  padding: 12,
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                }}
              >
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <Link href={`/approvals/${item.ticket}`} style={{ color: '#fde68a', textDecoration: 'none', fontWeight: 700 }}>
                    {item.ticket}
                  </Link>
                  <span style={{ color: '#cbd5e1', fontSize: 12 }}>{item.actionCode}</span>
                  <span style={pillStyle('#fde68a', 'rgba(250,204,21,0.16)')}>approval:{item.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
                  <Link
                    href={buildMemberOperationsReceiptDetailHref(memberId, item.executionId)}
                    style={{ color: '#bfdbfe', textDecoration: 'none' }}
                  >
                    执行回执
                  </Link>
                  <Link href={`/operations/${item.runtimeReceiptCode}`} style={{ color: '#93c5fd', textDecoration: 'none' }}>
                    Runtime 详情
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DetailActionBar
        actions={detailActions}
        heading="详情收口动作"
        caption="复制 / 导出 / 分享当前运营来源详情"
      />

      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'members',
          detailId: `${memberId}/sources/${kind}/${sourceId}`,
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
      <div style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 800, marginTop: 8, wordBreak: 'break-word' }}>
        {value}
      </div>
      <div style={{ color: '#64748b', fontSize: 12, marginTop: 8, wordBreak: 'break-word' }}>{helper}</div>
    </div>
  );
}

function timelineFilterLabel(value: 'all' | 'task' | 'receipt' | 'runtime' | 'approval') {
  switch (value) {
    case 'task':
      return 'Task';
    case 'receipt':
      return 'Receipt';
    case 'runtime':
      return 'Runtime';
    case 'approval':
      return 'Approval';
    default:
      return '全部';
  }
}

function formatTimelineTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function timelineCategoryLabel(category: Awaited<ReturnType<typeof loadAdminMemberOperationSourceDetail>>['timelineItems'][number]['category']) {
  switch (category) {
    case 'task':
      return 'Task';
    case 'receipt':
      return 'Receipt';
    case 'runtime':
      return 'Runtime';
    default:
      return 'Approval';
  }
}

function timelineStageLabel(stage: Awaited<ReturnType<typeof loadAdminMemberOperationSourceDetail>>['timelineItems'][number]['stage']) {
  switch (stage) {
    case 'task-created':
      return '任务创建';
    case 'task-scheduled':
      return '任务排程';
    case 'task-executed':
      return '任务执行';
    case 'receipt-recorded':
      return '回执记录';
    case 'runtime-receipt':
      return 'Runtime 回执';
    case 'runtime-event':
      return 'Runtime 事件';
    case 'approval-pending':
      return '待审批';
    case 'approval-decided':
      return '审批决策';
    case 'approval-executed':
      return '审批执行';
    default:
      return '执行失败';
  }
}

function timelineTone(category: Awaited<ReturnType<typeof loadAdminMemberOperationSourceDetail>>['timelineItems'][number]['category']) {
  switch (category) {
    case 'task':
      return {
        dot: '#93c5fd',
        ring: 'rgba(59,130,246,0.24)',
        border: 'rgba(96,165,250,0.24)',
        label: '#dbeafe',
        badge: 'rgba(59,130,246,0.16)',
      } as const;
    case 'receipt':
      return {
        dot: '#a78bfa',
        ring: 'rgba(139,92,246,0.24)',
        border: 'rgba(167,139,250,0.24)',
        label: '#e9d5ff',
        badge: 'rgba(139,92,246,0.16)',
      } as const;
    case 'runtime':
      return {
        dot: '#86efac',
        ring: 'rgba(34,197,94,0.24)',
        border: 'rgba(74,222,128,0.24)',
        label: '#dcfce7',
        badge: 'rgba(34,197,94,0.16)',
      } as const;
    default:
      return {
        dot: '#fde68a',
        ring: 'rgba(250,204,21,0.24)',
        border: 'rgba(250,204,21,0.24)',
        label: '#fef3c7',
        badge: 'rgba(250,204,21,0.16)',
      } as const;
  }
}

function timelineStatusTone(item: Awaited<ReturnType<typeof loadAdminMemberOperationSourceDetail>>['timelineItems'][number]) {
  if (item.emphasis === 'success') {
    return { color: '#86efac', background: 'rgba(34,197,94,0.16)' };
  }
  if (item.emphasis === 'danger') {
    return { color: '#fca5a5', background: 'rgba(239,68,68,0.16)' };
  }
  if (item.emphasis === 'warning') {
    return { color: '#fde68a', background: 'rgba(250,204,21,0.16)' };
  }
  if (item.category === 'approval' && item.status === 'APPROVED') {
    return { color: '#86efac', background: 'rgba(34,197,94,0.16)' };
  }
  if (item.category === 'approval' && (item.status === 'REJECTED' || item.status === 'CANCELLED' || item.status === 'SUPERSEDED')) {
    return { color: '#fca5a5', background: 'rgba(239,68,68,0.16)' };
  }
  if (item.category === 'approval' && item.status === 'PENDING') {
    return { color: '#fde68a', background: 'rgba(250,204,21,0.16)' };
  }
  return { color: '#bfdbfe', background: 'rgba(59,130,246,0.18)' };
}

function attentionTone(level: 'high' | 'medium' | 'info') {
  switch (level) {
    case 'high':
      return {
        color: '#fecaca',
        badge: 'rgba(248,113,113,0.16)',
        border: 'rgba(248,113,113,0.24)',
      } as const;
    case 'medium':
      return {
        color: '#fde68a',
        badge: 'rgba(250,204,21,0.16)',
        border: 'rgba(250,204,21,0.24)',
      } as const;
    default:
      return {
        color: '#bfdbfe',
        badge: 'rgba(59,130,246,0.16)',
        border: 'rgba(96,165,250,0.24)',
      } as const;
  }
}

function attentionLevelLabel(level: 'high' | 'medium' | 'info') {
  switch (level) {
    case 'high':
      return '高优先';
    case 'medium':
      return '处理中';
    default:
      return '提示';
  }
}

function priorityLabel(level: 'high' | 'medium' | 'low') {
  switch (level) {
    case 'high':
      return '优先';
    case 'medium':
      return '次优先';
    default:
      return '复核';
  }
}

function stageTone(status: 'idle' | 'attention' | 'in-progress' | 'blocked' | 'completed') {
  switch (status) {
    case 'blocked':
      return {
        color: '#fecaca',
        badge: 'rgba(248,113,113,0.16)',
        border: 'rgba(248,113,113,0.24)',
      } as const;
    case 'attention':
      return {
        color: '#fde68a',
        badge: 'rgba(250,204,21,0.16)',
        border: 'rgba(250,204,21,0.24)',
      } as const;
    case 'in-progress':
      return {
        color: '#bfdbfe',
        badge: 'rgba(59,130,246,0.16)',
        border: 'rgba(96,165,250,0.24)',
      } as const;
    case 'idle':
      return {
        color: '#cbd5e1',
        badge: 'rgba(148,163,184,0.16)',
        border: 'rgba(148,163,184,0.24)',
      } as const;
    default:
      return {
        color: '#bbf7d0',
        badge: 'rgba(34,197,94,0.16)',
        border: 'rgba(74,222,128,0.24)',
      } as const;
  }
}

function stageStatusLabel(status: 'idle' | 'attention' | 'in-progress' | 'blocked' | 'completed') {
  switch (status) {
    case 'blocked':
      return '阻塞';
    case 'attention':
      return '待处理';
    case 'in-progress':
      return '处理中';
    case 'idle':
      return '未触发';
    default:
      return '已闭环';
  }
}

function filterBtnStyle(active: boolean, tone: 'default' | 'warning' = 'default') {
  return {
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: active ? (tone === 'warning' ? '#fde68a' : '#dbeafe') : '#94a3b8',
    background: active
      ? tone === 'warning'
        ? 'rgba(250,204,21,0.16)'
        : 'rgba(59,130,246,0.16)'
      : 'rgba(30,41,59,0.45)',
    border: active
      ? tone === 'warning'
        ? '1px solid rgba(250,204,21,0.24)'
        : '1px solid rgba(96,165,250,0.24)'
      : '1px solid rgba(148,163,184,0.18)',
  } as const;
}

function linkBtnStyle(kind: 'runtime' | 'approval') {
  return {
    borderRadius: 10,
    padding: '8px 14px',
    textDecoration: 'none',
    fontSize: 13,
    background: kind === 'runtime' ? 'rgba(59,130,246,0.16)' : 'rgba(250,204,21,0.16)',
    border: kind === 'runtime' ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(250,204,21,0.24)',
    color: kind === 'runtime' ? '#dbeafe' : '#fde68a',
  } as const;
}

function actionBtnStyle(kind: 'replay' | 'approve' | 'reject' = 'replay') {
  return {
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
    background:
      kind === 'approve'
        ? 'rgba(34, 197, 94, 0.14)'
        : kind === 'reject'
          ? 'rgba(248, 113, 113, 0.14)'
          : 'rgba(248, 113, 113, 0.14)',
    border:
      kind === 'approve'
        ? '1px solid rgba(34, 197, 94, 0.28)'
        : kind === 'reject'
          ? '1px solid rgba(248, 113, 113, 0.28)'
          : '1px solid rgba(248, 113, 113, 0.28)',
    color: kind === 'approve' ? '#bbf7d0' : '#fecaca',
  } as const;
}

function pillStyle(color: string, background: string) {
  return {
    color,
    background,
    borderRadius: 999,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
  } as const;
}
