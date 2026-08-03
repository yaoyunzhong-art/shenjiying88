'use client'
import { useSnapshotRefresh } from '../../../../components/use-snapshot-refresh'

import { type ReactNode, useEffect, useState, useTransition } from 'react'
import {
  DetailActionBar,
  DetailClosureBar,
  InfoRow,
  StatCard,
  WorkspaceBreadcrumb,
} from '@m5/ui'
import { buildGovernanceApprovalDetailHref } from '../../../../approvals-data'
import {
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsRuntimeDetailHref,
  buildMemberOperationsSourceDetailHref,
  buildMemberOperationsTaskDetailHref,
  getMemberOperationsRuntimeApprovalSummary,
  replayMemberOperationsRuntimeReceipt,
} from '../../../../members-view-model'
import { useDetailActions } from '../../../../components/use-detail-actions'
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../../components/detail-workspace-registry'
import { type MemberOperationReceiptDetailSnapshot } from './member-operation-receipt-detail-data'

export default function MemberOperationReceiptDetailClient({
  snapshot: initialSnapshot,
  memberId,
  executionId,
}: {
  snapshot: MemberOperationReceiptDetailSnapshot
  memberId: string
  executionId: string
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [message, setMessage] = useState<string | null>(null)
  const [replaying, setReplaying] = useState(false)

  useEffect(() => {
    setSnapshot(initialSnapshot)
  }, [initialSnapshot])

  const { actions: detailActions } = useDetailActions({
    workspace: 'members',
    detailId: `${memberId}/receipts/${executionId}`,
    record: snapshot,
    shareTitle: `会员运营回执 · ${executionId}`,
    shareText: `查看会员 ${memberId} 的运营回执 ${executionId} 详情`,
  })

  

  async function handleReplay() {
    setReplaying(true)
    setMessage(null)
    try {
      const runtimeReceipt = await replayMemberOperationsRuntimeReceipt(memberId, executionId)
      if (!runtimeReceipt) {
        setMessage(`执行回执 ${executionId} 的 runtime replay 未返回结果。`)
        return
      }

      setSnapshot((current) => ({
        ...current,
        runtimeReceipt,
      }))

      const approval = getMemberOperationsRuntimeApprovalSummary(runtimeReceipt)
      setMessage(
        approval?.status === 'PENDING'
          ? `执行回执 ${executionId} 已转入审批 ${approval.ticket ?? ''}`.trim()
          : `执行回执 ${executionId} 已触发 replay，状态 ${runtimeReceipt.state}`
      )
    } finally {
      setReplaying(false)
    }
  }

  if (!snapshot.receipt) {
    return (
      <main style={pageStyle}>
        <WorkspaceBreadcrumb
          {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: `${memberId}/receipts/${executionId}` })}
        />
        <EmptyState
          title={`执行回执 ${executionId} 不存在`}
          description="当前快照未返回执行回执，请刷新后重试。"
          href={`/members/${memberId}`}
        />
      </main>
    )
  }

  const receipt = snapshot.receipt
  const runtimeApproval = snapshot.runtimeReceipt
    ? getMemberOperationsRuntimeApprovalSummary(snapshot.runtimeReceipt)
    : null

  return (
    <main style={pageStyle}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: `${memberId}/receipts/${executionId}` })}
      />

      <section style={panelStyle}>
        <div style={headerRowStyle}>
          <div>
            <a href={`/members/${memberId}`} style={inlineLinkStyle}>
              返回会员详情
            </a>
            <h1 style={titleStyle}>执行回执 {executionId}</h1>
            <p style={subtitleStyle}>
              当前快照：{snapshot.sourceLabel} · Delivery {snapshot.deliveryMode} · 会员{' '}
              {snapshot.member?.name ?? memberId}
            </p>
          </div>
          <div style={buttonGroupStyle}>
            <button type="button" onClick={handleRefresh} style={primaryButtonStyle}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
            {receipt.runtimeReceiptCode ? (
              <button
                type="button"
                onClick={() => void handleReplay()}
                disabled={replaying}
                style={dangerButtonStyle}
              >
                {replaying ? '重放中...' : '触发 Replay'}
              </button>
            ) : null}
          </div>
        </div>
        {message ? <div style={messageStyle}>{message}</div> : null}
      </section>

      <section style={statsGridStyle}>
        <StatCard label="动作编码" value={receipt.actionCode} helper={snapshot.task?.title ?? '—'} />
        <StatCard label="执行状态" value={receipt.status} helper={`执行于 ${receipt.executedAt}`} />
        <StatCard label="执行目标" value={receipt.targetType} helper={receipt.targetId} />
        <StatCard label="Runtime" value={receipt.runtimeState ?? '—'} helper={receipt.runtimeReceiptCode ?? '未挂接'} />
      </section>

      <section style={panelStyle}>
        <div style={panelTitleStyle}>互链导航</div>
        <div style={buttonGroupStyle}>
          <a href={`/members/${memberId}`} style={linkButtonStyle('member')}>
            会员详情
          </a>
          <a href={buildMemberOperationsReceiptDetailHref(memberId, executionId)} style={linkButtonStyle('receipt')}>
            当前详情直链
          </a>
          {receipt.runtimeReceiptCode ? (
            <a href={buildMemberOperationsRuntimeDetailHref(receipt.runtimeReceiptCode)} style={linkButtonStyle('runtime')}>
              Runtime 详情
            </a>
          ) : null}
          {runtimeApproval?.ticket ? (
            <a href={buildGovernanceApprovalDetailHref(runtimeApproval.ticket)} style={linkButtonStyle('approval')}>
              审批详情
            </a>
          ) : null}
        </div>
      </section>

      <section style={twoColumnGridStyle}>
        <InfoPanel title="执行回执">
          <InfoRow label="会员" value={snapshot.member?.name ?? memberId} />
          <InfoRow label="执行回执" value={receipt.executionId} />
          <InfoRow
            label="任务"
            value={receipt.taskId}
            href={buildMemberOperationsTaskDetailHref(memberId, receipt.taskId)}
          />
          <InfoRow label="摘要" value={receipt.summary} />
          <InfoRow label="Target" value={`${receipt.targetType}:${receipt.targetId}`} />
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
      </section>

      {snapshot.runtimeReceipt ? (
        <section style={panelStyle}>
          <div style={panelTitleStyle}>Runtime 治理</div>
          <div style={infoListStyle}>
            <InfoRow
              label="状态"
              value={snapshot.runtimeReceipt.state}
              valueColor={runtimeStateColor(snapshot.runtimeReceipt.state)}
            />
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
        </section>
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

function EmptyState({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <section style={panelStyle}>
      <div style={panelTitleStyle}>{title}</div>
      <p style={subtitleStyle}>{description}</p>
      <a href={href} style={inlineLinkStyle}>
        返回会员详情
      </a>
    </section>
  )
}

function runtimeStateColor(state?: string | null): string {
  if (state === 'callback-recorded') return '#86efac'
  if (state === 'replay-scheduled') return '#93c5fd'
  if (state === 'blocked') return '#fca5a5'
  if (state === 'submitted') return '#fde68a'
  return '#cbd5e1'
}

function runtimeApprovalColor(status: string): string {
  if (status === 'APPROVED') return '#86efac'
  if (status === 'PENDING') return '#fde68a'
  return '#fca5a5'
}

function linkButtonStyle(kind: 'member' | 'runtime' | 'approval' | 'receipt') {
  const palette =
    kind === 'approval'
      ? {
          background: 'rgba(251,191,36,0.12)',
          border: '1px solid rgba(251,191,36,0.24)',
          color: '#fde68a',
        }
      : kind === 'runtime'
        ? {
            background: 'rgba(59,130,246,0.16)',
            border: '1px solid rgba(96,165,250,0.3)',
            color: '#dbeafe',
          }
        : kind === 'receipt'
          ? {
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(192,132,252,0.22)',
              color: '#e9d5ff',
            }
          : {
              background: 'rgba(14,165,233,0.12)',
              border: '1px solid rgba(56,189,248,0.24)',
              color: '#dbeafe',
            }

  return {
    borderRadius: 10,
    padding: '8px 14px',
    textDecoration: 'none',
    fontSize: 13,
    ...palette,
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

const panelTitleStyle = {
  fontSize: 15,
  fontWeight: 700,
  color: '#e2e8f0',
  marginBottom: 12,
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
