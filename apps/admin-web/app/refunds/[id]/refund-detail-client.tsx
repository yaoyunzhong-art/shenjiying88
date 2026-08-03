'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Breadcrumb,
  ConfirmActionDialog,
  DetailActionBar,
  DetailClosureBar,
  InfoRow,
  PageShell,
  StatusBadge,
  ToastContainer,
  useToast,
} from '@m5/ui'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'
import {
  REFUND_CHANNEL_LABEL,
  REFUND_STATUS_LABEL,
  REFUND_STATUS_VARIANT,
  REFUND_TYPE_LABEL,
  type RefundItem,
  type RefundStatus,
} from '../refund-types'
import {
  STATUS_TRANSITIONS,
  TRANSITION_ACTIONS,
  formatYuan,
  mapTransitionVariant,
  type RefundDetailSnapshot,
} from './refund-detail-data'

export default function RefundDetailClient({ snapshot }: { snapshot: RefundDetailSnapshot }) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const { toasts, success, info, dismiss } = useToast()
  const [refund, setRefund] = useState<RefundItem | null>(snapshot.refund)
  const [confirmAction, setConfirmAction] = useState<{ from: RefundStatus; to: RefundStatus } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const availableTransitions = useMemo(() => {
    if (!refund) return []
    return STATUS_TRANSITIONS[refund.status] ?? []
  }, [refund])

  const closureLinks = useMemo(() => {
    const links: Array<{
      key: string
      title: string
      subtitle: string
      href: string
      variant?: 'default' | 'warning' | 'danger'
    }> = [
      {
        key: 'back-to-list',
        title: '返回退款列表',
        subtitle: '回到退款管理主页',
        href: '/refunds',
      },
    ]
    if (refund) {
      links.push({
        key: 'delete-record',
        title: '删除记录',
        subtitle: '删除此退款记录，不可撤回',
        href: '#',
        variant: 'danger',
      })
    }
    return links
  }, [refund])

  const handleBack = useCallback(() => {
    router.push('/refunds')
  }, [router])

  const handleTransition = useCallback(
    async (from: RefundStatus, to: RefundStatus) => {
      if (!refund) return
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      const updated: RefundItem = {
        ...refund,
        status: to,
        processedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        processedBy: '当前用户',
      }
      setRefund(updated)
      setConfirmAction(null)
      setLoading(false)
      success(`${REFUND_STATUS_LABEL[from]} -> ${REFUND_STATUS_LABEL[to]} 成功`)
    },
    [refund, success],
  )

  const handleDelete = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setShowDeleteConfirm(false)
    setLoading(false)
    info('退款记录已删除')
    setTimeout(() => router.push('/refunds'), 1500)
  }, [info, router])

  const handleClosureLinkClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement
      const linkElement = target.closest('[data-testid^="detail-closure-link-"]')
      if (!linkElement) return
      const testId = linkElement.getAttribute('data-testid') ?? ''
      const key = testId.replace('detail-closure-link-', '')
      if (key === 'back-to-list') {
        event.preventDefault()
        handleBack()
      } else if (key === 'delete-record') {
        event.preventDefault()
        setShowDeleteConfirm(true)
      }
    },
    [handleBack],
  )

  if (!refund) {
    return (
      <PageShell title="退款详情" description="未找到该退款记录">
        <div style={{ marginBottom: 16 }}>
          <SnapshotRefreshCard
            sourceLabel={snapshot.sourceLabel}
            refreshPath={snapshot.refreshPath}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            contextLabel="客户端快照上下文"
            loadingLabel="刷新中..."
            idleLabel="刷新快照"
          />
        </div>
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <p style={{ fontSize: 18, marginBottom: 16 }}>未找到退款记录</p>
          <p style={{ fontSize: 14, marginBottom: 24 }}>退单号: {snapshot.id}</p>
          <button
            onClick={handleBack}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            返回退款列表
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title={`退款详情 · ${refund.id}`} description={`${REFUND_TYPE_LABEL[refund.type]} — ${refund.customerName}`}>
      <div style={{ marginBottom: 16 }}>
        <SnapshotRefreshCard
          sourceLabel={snapshot.sourceLabel}
          refreshPath={snapshot.refreshPath}
          extra={<>当前状态: {REFUND_STATUS_LABEL[refund.status]}</>}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          contextLabel="客户端快照上下文"
          loadingLabel="刷新中..."
          idleLabel="刷新快照"
        />
      </div>

      <Breadcrumb
        items={[
          { label: '退款管理', href: '/refunds' },
          { label: refund.id },
        ]}
      />

      <div
        style={{
          marginTop: 16,
          borderRadius: 12,
          border: '1px solid rgba(148, 163, 184, 0.14)',
          background: '#1e293b',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{refund.id}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              订单 {refund.orderId} · {refund.storeName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>状态</span>
            <StatusBadge variant={REFUND_STATUS_VARIANT[refund.status]} label={REFUND_STATUS_LABEL[refund.status]} size="md" />
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            <InfoRow label="退单号" value={refund.id} />
            <InfoRow label="订单号" value={refund.orderId} />
            <InfoRow label="退款类型" value={REFUND_TYPE_LABEL[refund.type]} />
            <InfoRow label="退款渠道" value={REFUND_CHANNEL_LABEL[refund.channel]} />
            <InfoRow
              label="退款金额"
              value={<span style={{ fontWeight: 700, color: '#fbbf24', fontSize: 18 }}>{formatYuan(refund.amount)}</span>}
            />
            <InfoRow label="退款原因" value={refund.reason} />
            <InfoRow label="会员姓名" value={refund.customerName} />
            <InfoRow label="会员电话" value={refund.customerPhone} />
            <InfoRow label="商品名称" value={refund.productName} />
            <InfoRow label="商品 SKU" value={refund.productSku} />
            <InfoRow label="退货数量" value={`${refund.quantity} 件`} />
            <InfoRow label="门店" value={refund.storeName} />
            <InfoRow label="申请时间" value={refund.createdAt} />
            <InfoRow label="处理时间" value={refund.processedAt ?? '—'} />
            <InfoRow label="处理人" value={refund.processedBy ?? '—'} />
          </div>
        </div>

        {refund.remark ? (
          <div
            style={{
              padding: '12px 24px',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              fontSize: 13,
              color: '#94a3b8',
              background: 'rgba(148, 163, 184, 0.04)',
            }}
          >
            <strong style={{ color: '#cbd5e1' }}>备注：</strong>
            {refund.remark}
          </div>
        ) : null}
      </div>

      {availableTransitions.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <DetailActionBar
            actions={availableTransitions.map((targetStatus) => {
              const key = `${refund.status}__${targetStatus}`
              const config = TRANSITION_ACTIONS[key]
              return {
                key,
                label: config?.label ?? targetStatus,
                variant: config ? mapTransitionVariant(config.variant) : 'default',
                onClick: () => setConfirmAction({ from: refund.status, to: targetStatus }),
              }
            })}
          />
        </div>
      ) : null}

      <div onClick={handleClosureLinkClick}>
        <DetailClosureBar links={closureLinks} heading="操作" caption="从详情页返回列表或执行额外操作" />
      </div>

      {confirmAction ? (
        <ConfirmActionDialog
          open={!!confirmAction}
          title="确认操作"
          message={`确定将退款 ${refund.id} 从「${REFUND_STATUS_LABEL[confirmAction.from]}」转为「${REFUND_STATUS_LABEL[confirmAction.to]}」？`}
          confirmLabel="确认"
          cancelLabel="取消"
          loading={loading}
          onConfirm={() => handleTransition(confirmAction.from, confirmAction.to)}
          onCancel={() => setConfirmAction(null)}
        />
      ) : null}

      <ConfirmActionDialog
        open={showDeleteConfirm}
        title="确认删除"
        message={`确定删除退款记录 ${refund.id}？此操作不可撤回。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        confirmVariant="danger"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </PageShell>
  )
}
