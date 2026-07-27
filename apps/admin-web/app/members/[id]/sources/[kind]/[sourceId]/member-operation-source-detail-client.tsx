'use client'

import { type ReactNode, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DetailActionBar,
  DetailClosureBar,
  InfoRow,
  StatCard,
  WorkspaceBreadcrumb,
} from '@m5/ui'
import { decideGovernanceApproval } from '../../../../../approvals-view-model'
import {
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsRuntimeDetailHref,
  buildMemberOperationsTaskDetailHref,
  replayMemberOperationsRuntimeReceipts,
  type MemberOperationsSourceKind,
} from '../../../../../members-view-model'
import { useDetailActions } from '../../../../../components/use-detail-actions'
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../../../components/detail-workspace-registry'
import { type MemberOperationSourceDetailSnapshot } from './member-operation-source-detail-data'

type TimelineCategory = 'all' | 'task' | 'receipt' | 'runtime' | 'approval'

export default function MemberOperationSourceDetailClient({
  snapshot: initialSnapshot,
  memberId,
  kind,
  sourceId,
}: {
  snapshot: MemberOperationSourceDetailSnapshot
  memberId: string
  kind: MemberOperationsSourceKind
  sourceId: string
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [message, setMessage] = useState<string | null>(null)
  const [timelineCategory, setTimelineCategory] = useState<TimelineCategory>('all')
  const [attentionOnly, setAttentionOnly] = useState(false)
  const [batchReplaying, setBatchReplaying] = useState(false)
  const [batchApproving, setBatchApproving] = useState(false)
  const [batchRejecting, setBatchRejecting] = useState(false)

  useEffect(() => {
    setSnapshot(initialSnapshot)
  }, [initialSnapshot])

  const { actions: detailActions } = useDetailActions({
    workspace: 'members',
    detailId: `${memberId}/sources/${kind}/${sourceId}`,
    record: snapshot,
    shareTitle: `会员运营来源 · ${sourceId}`,
    shareText: `查看会员 ${memberId} 的${sourceKindLabel(kind)} ${sourceId} 详情`,
  })

  const attentionExecutionIds = useMemo(
    () =>
      new Set(snapshot.attentionItems.map((item) => item.executionId).filter((value): value is string => Boolean(value))),
    [snapshot.attentionItems]
  )

  const filteredTimelineItems = useMemo(
    () =>
      snapshot.timelineItems.filter((item) => {
        if (timelineCategory !== 'all' && item.category !== timelineCategory) {
          return false
        }
        if (!attentionOnly) {
          return true
        }
        if (item.executionId) {
          return attentionExecutionIds.has(item.executionId)
        }
        return item.category === 'approval'
      }),
    [attentionExecutionIds, attentionOnly, snapshot.timelineItems, timelineCategory]
  )

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  async function handleBatchReplay() {
    const replayableExecutionIds = snapshot.receipts
      .filter((item) => item.runtimeReplayable)
      .map((item) => item.executionId)

    if (replayableExecutionIds.length === 0) {
      setMessage('当前来源下没有可批量 replay 的执行回执。')
      return
    }

    setBatchReplaying(true)
    setMessage(null)
    try {
      const results = await replayMemberOperationsRuntimeReceipts(memberId, replayableExecutionIds)
      const success = results.filter((item) => item.receipt).length
      const failed = results.length - success
      setMessage(`批量 replay 已处理 ${results.length} 条回执，成功 ${success} 条，失败 ${failed} 条。`)
      startRefresh(() => router.refresh())
    } finally {
      setBatchReplaying(false)
    }
  }

  async function handleBatchDecision(decision: 'APPROVED' | 'REJECTED') {
    if (snapshot.pendingApprovalItems.length === 0) {
      setMessage('当前来源下没有待处理审批单。')
      return
    }

    if (decision === 'APPROVED') {
      setBatchApproving(true)
    } else {
      setBatchRejecting(true)
    }
    setMessage(null)

    try {
      const results = await Promise.all(
        snapshot.pendingApprovalItems.map(async (item) => {
          try {
            await decideGovernanceApproval(item.ticket, decision)
            return true
          } catch {
            return false
          }
        })
      )
      const success = results.filter(Boolean).length
      const failed = results.length - success
      setMessage(
        `${decision === 'APPROVED' ? '批量审批通过' : '批量审批驳回'} ${results.length} 条，成功 ${success} 条，失败 ${failed} 条。`
      )
      startRefresh(() => router.refresh())
    } finally {
      if (decision === 'APPROVED') {
        setBatchApproving(false)
      } else {
        setBatchRejecting(false)
      }
    }
  }

  return (
    <main style={pageStyle}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: `${memberId}/sources/${kind}/${sourceId}` })}
      />

      <section style={panelStyle}>
        <div style={headerRowStyle}>
          <div>
            <a href={`/members/${memberId}`} style={inlineLinkStyle}>
              返回会员详情
            </a>
            <h1 style={titleStyle}>
              {sourceKindLabel(kind)} {sourceId}
            </h1>
            <p style={subtitleStyle}>
              当前快照：{snapshot.sourceLabel} · Delivery {snapshot.deliveryMode} · 会员{' '}
              {snapshot.member?.name ?? memberId}
            </p>
          </div>
          <div style={buttonGroupStyle}>
            <button type="button" onClick={handleRefresh} style={primaryButtonStyle}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
            <button
              type="button"
              onClick={() => void handleBatchReplay()}
              disabled={batchReplaying}
              style={secondaryButtonStyle}
            >
              {batchReplaying ? '批量 Replay 中...' : '批量 Replay'}
            </button>
            <button
              type="button"
              onClick={() => void handleBatchDecision('APPROVED')}
              disabled={batchApproving}
              style={successButtonStyle}
            >
              {batchApproving ? '审批中...' : '批量审批通过'}
            </button>
            <button
              type="button"
              onClick={() => void handleBatchDecision('REJECTED')}
              disabled={batchRejecting}
              style={dangerButtonStyle}
            >
              {batchRejecting ? '驳回中...' : '批量审批驳回'}
            </button>
          </div>
        </div>
        {message ? <div style={messageStyle}>{message}</div> : null}
      </section>

      <section style={statsGridStyle}>
        <StatCard label="来源类型" value={sourceKindLabel(kind)} helper={sourceId} />
        <StatCard label="关联任务" value={String(snapshot.tasks.length)} helper="同来源任务聚合" />
        <StatCard label="关联回执" value={String(snapshot.receipts.length)} helper="同来源执行回执" />
        <StatCard
          label="待审批"
          value={String(snapshot.chainSummary.pendingApprovals)}
          helper={`可重放 ${snapshot.chainSummary.replayableReceipts} 条`}
        />
      </section>

      <section style={statsGridStyle}>
        <StatCard
          label="Runtime 已挂接"
          value={String(snapshot.chainSummary.runtimeTrackedReceipts)}
          helper={`已回调 ${snapshot.chainSummary.callbackRecordedReceipts} 条`}
        />
        <StatCard
          label="已调度 Replay"
          value={String(snapshot.chainSummary.replayScheduledReceipts)}
          helper={`阻塞 ${snapshot.chainSummary.blockedReceipts} 条`}
        />
        <StatCard
          label="轨迹事件"
          value={String(snapshot.timelineSummary.totalEvents)}
          helper={snapshot.timelineSummary.latestOccurredAt ?? '暂无最新节点'}
        />
        <StatCard
          label="治理关注项"
          value={String(snapshot.timelineSummary.attentionCount)}
          helper={`审批事件 ${snapshot.timelineSummary.categoryCounts.approval}`}
        />
      </section>

      <section style={twoColumnGridStyle}>
        <InfoPanel title="来源概览">
          <InfoRow label="会员" value={snapshot.member?.name ?? memberId} />
          <InfoRow label="来源类型" value={sourceKindLabel(kind)} />
          <InfoRow label="来源 ID" value={sourceId} />
          <InfoRow label="任务数" value={String(snapshot.tasks.length)} />
          <InfoRow label="回执数" value={String(snapshot.receipts.length)} />
          <InfoRow label="来源直链" value={sourceId} />
        </InfoPanel>

        <InfoPanel title="阶段卡点">
          {snapshot.bottleneckStage ? (
            <>
              <InfoRow label="当前阶段" value={snapshot.bottleneckStage.title} />
              <InfoRow label="状态" value={stageStatusLabel(snapshot.bottleneckStage.status)} />
              <InfoRow label="责任入口" value={snapshot.bottleneckStage.owner} />
              <InfoRow label="下一步" value={snapshot.bottleneckStage.nextAction} />
              <InfoRow label="概要" value={snapshot.bottleneckStage.summary} />
            </>
          ) : (
            <InfoRow label="状态" value="当前来源链未发现明显卡点" />
          )}
        </InfoPanel>
      </section>

      <section style={twoColumnGridStyle}>
        <ListPanel
          title={`治理关注项 (${snapshot.attentionItems.length})`}
          emptyMessage="当前来源链暂无额外关注项。"
        >
          {snapshot.attentionItems.map((item) => (
            <div key={item.id} style={linkCardStyle}>
              <div style={linkCardTitleStyle}>
                {attentionLevelLabel(item.level)} · {item.title}
              </div>
              <div style={linkCardMetaStyle}>{item.summary}</div>
            </div>
          ))}
        </ListPanel>

        <ListPanel
          title={`推荐动作 (${snapshot.recommendedActions.length})`}
          emptyMessage="当前来源链暂无额外推荐动作。"
        >
          {snapshot.recommendedActions.map((item) => (
            <a key={item.code} href={item.href ?? '#'} style={linkCardStyle}>
              <div style={linkCardTitleStyle}>
                {priorityLabel(item.priority)} · {item.label}
              </div>
              <div style={linkCardMetaStyle}>{item.reason}</div>
            </a>
          ))}
        </ListPanel>
      </section>

      <section style={panelStyle}>
        <div style={panelTitleRowStyle}>
          <div style={panelTitleStyle}>来源阶段链路</div>
        </div>
        <div style={listStyle}>
          {snapshot.sourceStages.map((stage) => (
            <div key={stage.id} style={linkCardStyle}>
              <div style={linkCardTitleStyle}>
                {stage.title} · {stageStatusLabel(stage.status)}
              </div>
              <div style={linkCardMetaStyle}>
                {stage.summary} · 责任入口 {stage.owner} · 计数 {stage.count}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={panelTitleRowStyle}>
          <div style={panelTitleStyle}>轨迹过滤</div>
          <div style={buttonGroupStyle}>
            {(['all', 'task', 'receipt', 'runtime', 'approval'] as TimelineCategory[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTimelineCategory(value)}
                style={filterButtonStyle(timelineCategory === value)}
              >
                {timelineFilterLabel(value)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAttentionOnly((current) => !current)}
              style={filterButtonStyle(attentionOnly)}
            >
              仅看关注项
            </button>
          </div>
        </div>
        {filteredTimelineItems.length === 0 ? (
          <div style={emptyTextStyle}>当前过滤条件下没有轨迹事件。</div>
        ) : (
          <div style={listStyle}>
            {filteredTimelineItems.map((item) => (
              <div key={item.id} style={linkCardStyle}>
                <div style={linkCardTitleStyle}>
                  {timelineCategoryLabel(item.category)} · {timelineStageLabel(item.stage)}
                </div>
                <div style={linkCardMetaStyle}>
                  {formatTimelineTime(item.occurredAt)} · {item.title} · {item.summary}
                </div>
                <div style={linkListStyle}>
                  {item.taskId ? (
                    <a href={buildMemberOperationsTaskDetailHref(memberId, item.taskId)} style={smallLinkStyle}>
                      任务详情
                    </a>
                  ) : null}
                  {item.executionId ? (
                    <a
                      href={buildMemberOperationsReceiptDetailHref(memberId, item.executionId)}
                      style={smallLinkStyle}
                    >
                      执行回执
                    </a>
                  ) : null}
                  {item.runtimeReceiptCode ? (
                    <a href={buildMemberOperationsRuntimeDetailHref(item.runtimeReceiptCode)} style={smallLinkStyle}>
                      Runtime 详情
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={twoColumnGridStyle}>
        <ListPanel title={`同来源任务 (${snapshot.tasks.length})`} emptyMessage="当前来源下暂无任务。">
          {snapshot.tasks.map((task) => (
            <a key={task.taskId} href={buildMemberOperationsTaskDetailHref(memberId, task.taskId)} style={linkCardStyle}>
              <div style={linkCardTitleStyle}>{task.taskId}</div>
              <div style={linkCardMetaStyle}>
                {task.actionCode} · {task.status} · {task.executionLane}
              </div>
            </a>
          ))}
        </ListPanel>

        <ListPanel title={`同来源回执 (${snapshot.receipts.length})`} emptyMessage="当前来源下暂无回执。">
          {snapshot.receipts.map((receipt) => (
            <a
              key={receipt.executionId}
              href={buildMemberOperationsReceiptDetailHref(memberId, receipt.executionId)}
              style={linkCardStyle}
            >
              <div style={linkCardTitleStyle}>{receipt.executionId}</div>
              <div style={linkCardMetaStyle}>
                {receipt.actionCode} · {receipt.status} · {receipt.runtimeState ?? 'no-runtime'}
              </div>
            </a>
          ))}
        </ListPanel>
      </section>

      <DetailActionBar
        actions={detailActions}
        heading="详情收口动作"
        caption="复制 / 导出 / 分享当前来源治理详情"
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
              href: `/members/${memberId}`,
            },
          ],
        })}
      />
    </main>
  )
}

function InfoPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section style={panelStyle}>
      <div style={panelTitleStyle}>{title}</div>
      <div style={infoListStyle}>{children}</div>
    </section>
  )
}

function ListPanel({
  title,
  emptyMessage,
  children,
}: {
  title: string
  emptyMessage: string
  children: ReactNode
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <section style={panelStyle}>
      <div style={panelTitleStyle}>{title}</div>
      {hasItems ? <div style={listStyle}>{children}</div> : <div style={emptyTextStyle}>{emptyMessage}</div>}
    </section>
  )
}

function sourceKindLabel(kind: MemberOperationsSourceKind) {
  return kind === 'order' ? '订单来源' : '支付来源'
}

function timelineFilterLabel(value: TimelineCategory) {
  switch (value) {
    case 'task':
      return 'Task'
    case 'receipt':
      return 'Receipt'
    case 'runtime':
      return 'Runtime'
    case 'approval':
      return 'Approval'
    default:
      return '全部'
  }
}

function timelineCategoryLabel(value: Exclude<TimelineCategory, 'all'>) {
  switch (value) {
    case 'task':
      return 'Task'
    case 'receipt':
      return 'Receipt'
    case 'runtime':
      return 'Runtime'
    default:
      return 'Approval'
  }
}

function timelineStageLabel(value: string) {
  switch (value) {
    case 'task-created':
      return '任务创建'
    case 'task-scheduled':
      return '任务排程'
    case 'task-executed':
      return '任务执行'
    case 'receipt-recorded':
      return '回执记录'
    case 'runtime-receipt':
      return 'Runtime 回执'
    case 'runtime-event':
      return 'Runtime 事件'
    case 'approval-pending':
      return '待审批'
    case 'approval-decided':
      return '审批决策'
    case 'approval-executed':
      return '审批执行'
    default:
      return '审批失败'
  }
}

function attentionLevelLabel(value: 'high' | 'medium' | 'info') {
  switch (value) {
    case 'high':
      return '高优先'
    case 'medium':
      return '处理中'
    default:
      return '提示'
  }
}

function priorityLabel(value: 'high' | 'medium' | 'low') {
  switch (value) {
    case 'high':
      return '优先'
    case 'medium':
      return '次优先'
    default:
      return '复核'
  }
}

function stageStatusLabel(value: 'idle' | 'attention' | 'in-progress' | 'blocked' | 'completed') {
  switch (value) {
    case 'blocked':
      return '阻塞'
    case 'attention':
      return '待处理'
    case 'in-progress':
      return '处理中'
    case 'idle':
      return '未触发'
    default:
      return '已闭环'
  }
}

function formatTimelineTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function filterButtonStyle(active: boolean) {
  return {
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: active ? '#dbeafe' : '#94a3b8',
    background: active ? 'rgba(59,130,246,0.16)' : 'rgba(30,41,59,0.45)',
    border: active ? '1px solid rgba(96,165,250,0.24)' : '1px solid rgba(148,163,184,0.18)',
  } as const
}

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 8,
} as const

const panelStyle = {
  borderRadius: 18,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
} as const

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  alignItems: 'flex-start',
} as const

const statsGridStyle = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
} as const

const twoColumnGridStyle = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
} as const

const panelTitleRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 12,
} as const

const panelTitleStyle = {
  fontSize: 15,
  fontWeight: 700,
  color: '#e2e8f0',
} as const

const titleStyle = {
  margin: '10px 0 0',
  fontSize: 28,
  fontWeight: 800,
  color: '#e2e8f0',
} as const

const subtitleStyle = {
  margin: '8px 0 0',
  color: '#94a3b8',
  fontSize: 14,
  lineHeight: 1.6,
} as const

const inlineLinkStyle = {
  color: '#93c5fd',
  textDecoration: 'none',
  fontSize: 13,
} as const

const buttonGroupStyle = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
} as const

const primaryButtonStyle = {
  borderRadius: 10,
  padding: '8px 14px',
  border: '1px solid rgba(96,165,250,0.24)',
  background: 'rgba(59,130,246,0.16)',
  color: '#dbeafe',
  fontSize: 13,
  cursor: 'pointer',
} as const

const secondaryButtonStyle = {
  borderRadius: 10,
  padding: '8px 14px',
  border: '1px solid rgba(248,113,113,0.28)',
  background: 'rgba(248,113,113,0.14)',
  color: '#fecaca',
  fontSize: 13,
  cursor: 'pointer',
} as const

const successButtonStyle = {
  borderRadius: 10,
  padding: '8px 14px',
  border: '1px solid rgba(34,197,94,0.28)',
  background: 'rgba(34,197,94,0.14)',
  color: '#bbf7d0',
  fontSize: 13,
  cursor: 'pointer',
} as const

const dangerButtonStyle = {
  borderRadius: 10,
  padding: '8px 14px',
  border: '1px solid rgba(248,113,113,0.28)',
  background: 'rgba(248,113,113,0.14)',
  color: '#fecaca',
  fontSize: 13,
  cursor: 'pointer',
} as const

const messageStyle = {
  marginTop: 14,
  borderRadius: 12,
  padding: '12px 14px',
  border: '1px solid rgba(96, 165, 250, 0.24)',
  background: 'rgba(15, 23, 42, 0.45)',
  color: '#dbeafe',
  fontSize: 13,
} as const

const infoListStyle = {
  display: 'grid',
  gap: 10,
} as const

const listStyle = {
  display: 'grid',
  gap: 10,
} as const

const emptyTextStyle = {
  color: '#94a3b8',
  fontSize: 13,
} as const

const linkCardStyle = {
  borderRadius: 12,
  padding: 12,
  background: 'rgba(30, 41, 59, 0.45)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  textDecoration: 'none',
} as const

const linkCardTitleStyle = {
  color: '#bfdbfe',
  fontSize: 13,
  fontWeight: 700,
} as const

const linkCardMetaStyle = {
  marginTop: 6,
  color: '#94a3b8',
  fontSize: 12,
  lineHeight: 1.6,
} as const

const linkListStyle = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 8,
} as const

const smallLinkStyle = {
  color: '#93c5fd',
  textDecoration: 'none',
  fontSize: 12,
} as const
