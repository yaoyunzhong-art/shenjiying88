"use client"

import type { CSSProperties } from 'react'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  approveApproval,
  type ApprovalRecord,
  type ApprovalStatus,
  type ApprovalType,
  type ApprovalsSnapshotDelivery,
  rejectApproval,
  submitApprovalComment,
} from './approvals-data'

type TabKey = 'pending' | 'done' | 'all'

const TYPE_LABEL: Record<ApprovalType, string> = {
  purchase: '采购审批',
  expense: '报销审批',
  campaign: '活动审批',
  leave: '请假审批',
}

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  withdrawn: '已撤回',
}

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  pending: '#eab308',
  approved: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#94a3b8',
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

export default function ApprovalsClient({ snapshot }: { snapshot: ApprovalsSnapshotDelivery }) {
  const router = useRouter()
  const [tabKey, setTabKey] = useState<TabKey>('pending')
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(snapshot.approvals)
  const [reviewOpen, setReviewOpen] = useState<Record<string, boolean>>({})
  const [reviewTexts, setReviewTexts] = useState<Record<string, string>>({})
  const [reviewSubmitting, setReviewSubmitting] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState('')
  const [isRefreshing, startRefresh] = useTransition()

  const filtered = useMemo(() => {
    if (tabKey === 'pending') return approvals.filter((item) => item.status === 'pending')
    if (tabKey === 'done') return approvals.filter((item) => item.status !== 'pending')
    return approvals
  }, [approvals, tabKey])

  const stats = useMemo(() => {
    const pending = approvals.filter((item) => item.status === 'pending')
    const thisMonth = approvals.filter((item) => isThisMonth(item.createdAt))
    const resolved = approvals.filter((item) => item.status !== 'pending')
    const approved = approvals.filter((item) => item.status === 'approved')

    return {
      pendingCount: pending.length,
      monthTotal: thisMonth.reduce((sum, item) => sum + item.amount, 0),
      passRate: resolved.length > 0 ? Math.round((approved.length / resolved.length) * 100) : 0,
    }
  }, [approvals])

  const latestUpdatedAt = useMemo(
    () =>
      approvals.length > 0
        ? approvals.reduce(
            (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
            approvals[0]!.updatedAt
          )
        : '—',
    [approvals]
  )

  const toggleReview = useCallback((id: string) => {
    setReviewOpen((current) => ({ ...current, [id]: !current[id] }))
  }, [])

  const setReviewText = useCallback((id: string, text: string) => {
    setReviewTexts((current) => ({ ...current, [id]: text }))
  }, [])

  const submitReview = useCallback(
    async (id: string) => {
      const text = reviewTexts[id] ?? ''
      setReviewSubmitting((current) => ({ ...current, [id]: true }))
      setFeedback('')
      try {
        const result = await submitApprovalComment(id, text)
        setApprovals((current) =>
          current.map((item) => (item.id === id ? { ...item, comment: result.comment } : item))
        )
        setReviewTexts((current) => ({ ...current, [id]: '' }))
        setReviewOpen((current) => ({ ...current, [id]: false }))
        setFeedback(`审批单 ${id} 已记录意见。`)
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : '提交审批意见失败')
      } finally {
        setReviewSubmitting((current) => ({ ...current, [id]: false }))
      }
    },
    [reviewTexts]
  )

  const handleApprove = useCallback(async (id: string) => {
    setFeedback('')
    try {
      await approveApproval(id)
      setApprovals((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: 'approved', approver: '当前管理员', updatedAt: new Date().toISOString() }
            : item
        )
      )
      setFeedback(`审批单 ${id} 已批准。`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '批准失败')
    }
  }, [])

  const handleReject = useCallback(async (id: string) => {
    setFeedback('')
    try {
      await rejectApproval(id)
      setApprovals((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: 'rejected', approver: '当前管理员', updatedAt: new Date().toISOString() }
            : item
        )
      )
      setFeedback(`审批单 ${id} 已驳回。`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '驳回失败')
    }
  }, [])

  const isEmpty = filtered.length === 0
  const tabLabel: Record<TabKey, string> = {
    pending: '待审批',
    done: '已处理',
    all: '全部',
  }

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>📋 活动审批</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>
            管理所有类型的审批请求，快速处理待办事项
          </p>
        </div>
        <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            style={{
              borderRadius: 10,
              padding: '10px 20px',
              background: 'rgba(59,130,246,0.16)',
              border: '1px solid rgba(96,165,250,0.3)',
              color: '#dbeafe',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: isRefreshing ? 0.6 : 1,
            }}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            通过 router.refresh 重新加载服务端 mock 快照，不会请求真实审批服务。
          </span>
        </div>
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(15,23,42,0.38)',
          border: '1px solid rgba(148,163,184,0.18)',
          color: '#cbd5e1',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <div>deliveryMode: {snapshot.deliveryMode} · latestUpdatedAt: {latestUpdatedAt}</div>
        <div>首屏快照 generatedAt: {snapshot.generatedAt}</div>
        <div>写入链路: submitApprovalComment / approveApproval / rejectApproval -> local state mutation only</div>
      </div>

      {feedback ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(96,165,250,0.24)',
            background: 'rgba(15,23,42,0.45)',
            color: '#dbeafe',
            fontSize: 13,
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(3, 1fr)',
          marginBottom: 24,
        }}
      >
        <StatBox label="待审批数" value={String(stats.pendingCount)} color="#eab308" />
        <StatBox label="本月总金额" value={formatAmount(stats.monthTotal)} color="#22c55e" />
        <StatBox label="通过率" value={`${stats.passRate}%`} color="#3b82f6" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['pending', 'done', 'all'] as const).map((key) => {
          const count =
            key === 'pending'
              ? approvals.filter((item) => item.status === 'pending').length
              : key === 'done'
                ? approvals.filter((item) => item.status !== 'pending').length
                : approvals.length
          const isActive = tabKey === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTabKey(key)}
              style={{
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 14,
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                border: isActive ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(148,163,184,0.2)',
                background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(15,23,42,0.3)',
                color: isActive ? '#dbeafe' : '#94a3b8',
              }}
            >
              {tabLabel[key]} ({count})
            </button>
          )
        })}
      </div>

      {isEmpty ? (
        <EmptyState tabKey={tabKey} tabLabel={tabLabel[tabKey]} />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              reviewOpen={reviewOpen[item.id] ?? false}
              reviewText={reviewTexts[item.id] ?? ''}
              reviewSubmitting={reviewSubmitting[item.id] ?? false}
              onToggleReview={() => toggleReview(item.id)}
              onReviewTextChange={(text) => setReviewText(item.id, text)}
              onSubmitReview={() => submitReview(item.id)}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 20,
        background: 'rgba(15,23,42,0.38)',
        border: '1px solid rgba(148,163,184,0.18)',
      }}
    >
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function EmptyState({ tabKey, tabLabel }: { tabKey: TabKey; tabLabel: string }) {
  const emptyTips: Record<TabKey, string> = {
    pending: '暂无待处理的审批请求，所有事项均已处理完成',
    done: '暂无已处理的审批记录',
    all: '目前还没有任何审批记录',
  }

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        borderRadius: 18,
        background: 'rgba(15,23,42,0.25)',
        border: '1px dashed rgba(148,163,184,0.2)',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
        {tabLabel}列表为空
      </div>
      <div style={{ fontSize: 14, color: '#94a3b8' }}>{emptyTips[tabKey]}</div>
    </div>
  )
}

function ApprovalCard({
  item,
  reviewOpen,
  reviewText,
  reviewSubmitting,
  onToggleReview,
  onReviewTextChange,
  onSubmitReview,
  onApprove,
  onReject,
}: {
  item: ApprovalRecord
  reviewOpen: boolean
  reviewText: string
  reviewSubmitting: boolean
  onToggleReview: () => void
  onReviewTextChange: (text: string) => void
  onSubmitReview: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const isPending = item.status === 'pending'
  const borderColor = isPending ? 'rgba(234,179,8,0.2)' : 'rgba(148,163,184,0.1)'

  return (
    <div
      style={{
        borderRadius: 14,
        padding: 18,
        background: 'rgba(15,23,42,0.35)',
        border: `1px solid ${borderColor}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{item.description}</span>
          <span
            style={{
              fontSize: 12,
              color: '#94a3b8',
              background: 'rgba(71,85,105,0.4)',
              borderRadius: 4,
              padding: '2px 8px',
            }}
          >
            {item.id}
          </span>
        </div>
        <span
          style={{
            borderRadius: 999,
            padding: '3px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: STATUS_COLOR[item.status],
            background: `${STATUS_COLOR[item.status]}18`,
          }}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: 'repeat(4, 1fr)',
          marginBottom: 10,
          fontSize: 13,
        }}
      >
        <DetailField label="类型" value={TYPE_LABEL[item.type]} />
        <DetailField label="申请人" value={item.applicant} />
        <DetailField label="门店" value={item.store} />
        <DetailField label="金额" value={item.amount > 0 ? formatAmount(item.amount) : '—'} />
        <DetailField label="提交时间" value={formatDate(item.createdAt)} />
        <DetailField label="更新时间" value={formatDate(item.updatedAt)} />
        <DetailField label="审批人" value={item.approver || '待指派'} />
        <DetailField label="审批意见" value={item.comment || '—'} />
      </div>

      {item.comment ? (
        <div
          style={{
            marginBottom: 10,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            color: '#86efac',
            background: 'rgba(34,197,94,0.08)',
          }}
        >
          {item.comment}
        </div>
      ) : null}

      {isPending ? (
        <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onApprove} style={actionBtnStyle('#22c55e', '#86efac')}>
              批准
            </button>
            <button type="button" onClick={onReject} style={actionBtnStyle('#ef4444', '#fca5a5')}>
              驳回
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            当前为本地 mock 写链路，审批动作只更新前端内存态，不会写入真实审批系统。
          </div>
        </div>
      ) : null}

      <div>
        <button
          type="button"
          onClick={onToggleReview}
          style={{
            background: 'none',
            border: 'none',
            color: '#93c5fd',
            cursor: 'pointer',
            fontSize: 13,
            padding: '4px 0',
          }}
        >
          {reviewOpen ? '收起审批意见 ▲' : '审批意见 ▼'}
        </button>

        {reviewOpen ? (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 10,
              background: 'rgba(15,23,42,0.45)',
              border: '1px solid rgba(148,163,184,0.15)',
            }}
          >
            <textarea
              value={reviewText}
              onChange={(event) => onReviewTextChange(event.target.value)}
              placeholder="请输入审批意见..."
              rows={3}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(148,163,184,0.25)',
                color: '#e2e8f0',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={onSubmitReview}
              disabled={reviewSubmitting || !reviewText.trim()}
              style={{
                marginTop: 8,
                borderRadius: 8,
                padding: '8px 16px',
                background: reviewSubmitting || !reviewText.trim() ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(96,165,250,0.3)',
                color: reviewSubmitting || !reviewText.trim() ? '#64748b' : '#dbeafe',
                cursor: reviewSubmitting || !reviewText.trim() ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              {reviewSubmitting ? '提交中...' : '提交意见'}
            </button>
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              审批意见当前通过本地 mock 写链路模拟提交，仅用于控制面演示。
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: '#64748b', marginRight: 6 }}>{label}:</span>
      <span style={{ color: '#cbd5e1' }}>{value}</span>
    </div>
  )
}

function actionBtnStyle(background: string, color: string): CSSProperties {
  return {
    borderRadius: 8,
    padding: '8px 16px',
    background: `${background}22`,
    color,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  }
}
