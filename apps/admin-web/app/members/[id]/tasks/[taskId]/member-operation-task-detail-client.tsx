'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DetailActionBar,
  DetailClosureBar,
  InfoRow,
  StatCard,
  WorkspaceBreadcrumb,
} from '@m5/ui'
import {
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsSourceDetailHref,
  buildMemberOperationsTaskDetailHref,
  type MemberOperationsReceiptApi,
  type MemberOperationsTaskApi,
} from '../../../../members-view-model'
import { useDetailActions } from '../../../../components/use-detail-actions'
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../../components/detail-workspace-registry'
import { type MemberOperationTaskDetailSnapshot } from './member-operation-task-detail-data'

export default function MemberOperationTaskDetailClient({
  snapshot: initialSnapshot,
  memberId,
  taskId,
}: {
  snapshot: MemberOperationTaskDetailSnapshot
  memberId: string
  taskId: string
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [snapshot, setSnapshot] = useState<MemberOperationTaskDetailSnapshot>(initialSnapshot)

  useEffect(() => {
    setSnapshot(initialSnapshot)
  }, [initialSnapshot])

  const { actions: detailActions } = useDetailActions({
    workspace: 'members',
    detailId: `${memberId}/tasks/${taskId}`,
    record: snapshot,
    shareTitle: `会员运营任务 · ${taskId}`,
    shareText: `查看会员 ${memberId} 的运营任务 ${taskId} 详情`,
  })

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  if (!snapshot.task) {
    return (
      <main style={pageStyle}>
        <WorkspaceBreadcrumb
          {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: `${memberId}/tasks/${taskId}` })}
        />
        <EmptyState
          title={`运营任务 ${taskId} 不存在`}
          description="当前快照未返回任务详情，请刷新后重试。"
          href={`/members/${memberId}`}
        />
      </main>
    )
  }

  const task = snapshot.task

  return (
    <main style={pageStyle}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: `${memberId}/tasks/${taskId}` })}
      />

      <section style={evidenceCardStyle}>
        <div style={headingRowStyle}>
          <div>
            <a href={`/members/${memberId}`} style={inlineLinkStyle}>
              返回会员详情
            </a>
            <h1 style={titleStyle}>运营任务 {task.taskId}</h1>
            <p style={subtitleStyle}>
              当前快照：{snapshot.sourceLabel} · Delivery {snapshot.deliveryMode} · 会员{' '}
              {snapshot.member?.name ?? memberId}
            </p>
          </div>
          <button type="button" onClick={handleRefresh} style={actionButtonStyle}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>
      </section>

      <section style={statsGridStyle}>
        <StatCard label="动作编码" value={task.actionCode} helper={task.title} />
        <StatCard label="执行状态" value={task.status} helper={`Lane ${task.executionLane}`} />
        <StatCard label="来源订单" value={task.sourceOrderId ?? '—'} helper={task.source} />
        <StatCard label="来源支付" value={task.sourcePaymentId ?? '—'} helper={task.executionTargetId ?? '—'} />
      </section>

      <section style={twoColumnGridStyle}>
        <InfoPanel title="任务概览">
          <InfoRow label="会员" value={snapshot.member?.name ?? memberId} />
          <InfoRow label="任务 ID" value={task.taskId} />
          <InfoRow label="优先级" value={task.priority} />
          <InfoRow label="渠道" value={task.channel} />
          <InfoRow label="创建时间" value={task.createdAt} />
          <InfoRow label="计划时间" value={task.scheduledAt} />
          <InfoRow label="执行时间" value={task.executedAt ?? '—'} />
          <InfoRow label="原因" value={task.reason} />
          <InfoRow label="执行总结" value={task.executionSummary ?? '—'} />
        </InfoPanel>

        <InfoPanel title="来源聚合">
          <InfoRow
            label="来源订单"
            value={task.sourceOrderId ?? '—'}
            href={
              task.sourceOrderId
                ? buildMemberOperationsSourceDetailHref(memberId, 'order', task.sourceOrderId)
                : undefined
            }
          />
          <InfoRow
            label="来源支付"
            value={task.sourcePaymentId ?? '—'}
            href={
              task.sourcePaymentId
                ? buildMemberOperationsSourceDetailHref(memberId, 'payment', task.sourcePaymentId)
                : undefined
            }
          />
          <InfoRow label="同来源任务" value={String(snapshot.sourceTasks.length + 1)} />
          <InfoRow label="同来源回执" value={String(snapshot.sourceReceipts.length)} />
        </InfoPanel>
      </section>

      <section style={twoColumnGridStyle}>
        <ListPanel
          title={`同任务执行回执 (${snapshot.receipts.length})`}
          emptyMessage="当前任务暂无执行回执。"
        >
          {snapshot.receipts.map((receipt) => (
            <ReceiptLinkCard key={receipt.executionId} receipt={receipt} memberId={memberId} />
          ))}
        </ListPanel>

        <ListPanel
          title={`同来源任务 (${snapshot.sourceTasks.length})`}
          emptyMessage="当前来源下没有其他任务。"
        >
          {snapshot.sourceTasks.map((item) => (
            <TaskLinkCard key={item.taskId} task={item} memberId={memberId} />
          ))}
        </ListPanel>
      </section>

      <section style={panelStyle}>
        <div style={panelTitleStyle}>同来源回执</div>
        {snapshot.sourceReceipts.length === 0 ? (
          <div style={emptyTextStyle}>当前来源下暂无其他执行回执。</div>
        ) : (
          <div style={listStyle}>
            {snapshot.sourceReceipts.map((receipt) => (
              <ReceiptLinkCard key={receipt.executionId} receipt={receipt} memberId={memberId} />
            ))}
          </div>
        )}
      </section>

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
  children: React.ReactNode
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
  children: React.ReactNode
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <section style={panelStyle}>
      <div style={panelTitleStyle}>{title}</div>
      {hasItems ? <div style={listStyle}>{children}</div> : <div style={emptyTextStyle}>{emptyMessage}</div>}
    </section>
  )
}

function ReceiptLinkCard({
  receipt,
  memberId,
}: {
  receipt: MemberOperationsReceiptApi
  memberId: string
}) {
  return (
    <a href={buildMemberOperationsReceiptDetailHref(memberId, receipt.executionId)} style={linkCardStyle}>
      <div style={linkCardTitleStyle}>{receipt.executionId}</div>
      <div style={linkCardMetaStyle}>
        {receipt.actionCode} · {receipt.status} · {receipt.runtimeState ?? 'no-runtime'}
      </div>
    </a>
  )
}

function TaskLinkCard({
  task,
  memberId,
}: {
  task: MemberOperationsTaskApi
  memberId: string
}) {
  return (
    <a href={buildMemberOperationsTaskDetailHref(memberId, task.taskId)} style={linkCardStyle}>
      <div style={linkCardTitleStyle}>{task.taskId}</div>
      <div style={linkCardMetaStyle}>
        {task.actionCode} · {task.status} · {task.executionLane}
      </div>
    </a>
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

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 8,
} as const

const headingRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
} as const

const evidenceCardStyle = {
  borderRadius: 18,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
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

const panelStyle = {
  borderRadius: 18,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
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

const actionButtonStyle = {
  borderRadius: 10,
  padding: '8px 14px',
  border: '1px solid rgba(96,165,250,0.24)',
  background: 'rgba(59,130,246,0.16)',
  color: '#dbeafe',
  fontSize: 13,
  cursor: 'pointer',
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
} as const
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
