'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import {
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  SubmitButton,
  Timeline,
  WorkspaceBreadcrumb,
  useFormSubmit,
  type DetailShellAction,
  type TimelineItem,
} from '@m5/ui'
import { useDetailActions } from '../../components/use-detail-actions'
import {
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
} from '../../components/detail-workspace-registry'
import {
  STATUS_FLOW,
  STATUS_LABEL,
  STATUS_STYLE,
  TYPE_LABEL,
  URGENCY_LABEL,
  URGENCY_VARIANT,
  type StockTransferItem,
  type TransferStatus,
} from '../stock-transfer-data'
import { type StockTransferDetailSnapshot } from './stock-transfer-detail-data'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const TYPE_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  supply: 'info',
  return: 'warning',
  move: 'success',
  emergency: 'default',
}

const terminalStatuses: TransferStatus[] = ['received', 'rejected', 'cancelled']

const STATUS_ACTION_LABEL: Record<TransferStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  shipped: '已发货',
  received: '已收货',
  rejected: '已驳回',
  cancelled: '已撤销',
}

function formatDate(dateStr: string): string {
  return dateStr
}

function findNextStatuses(status: TransferStatus): TransferStatus[] {
  return STATUS_FLOW[status] ?? []
}

function generateTimeline(item: StockTransferItem): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      key: 'created',
      heading: '创建调拨单',
      subtitle: formatDate(item.createdAt),
      content: `由 ${item.createdBy} 创建 · ${TYPE_LABEL[item.type]}`,
      variant: 'info',
    },
  ]

  if (item.status === 'approved' || item.status === 'shipped' || item.status === 'received') {
    items.push({
      key: 'approved',
      heading: '审核通过',
      subtitle: formatDate(item.updatedAt),
      content: '调拨申请已审批通过',
      variant: 'success',
    })
  }

  if (item.status === 'shipped' || item.status === 'received') {
    items.push({
      key: 'shipped',
      heading: '已发货',
      subtitle: formatDate(item.updatedAt),
      content: `从 ${item.sourceStoreName} 发出 ${item.quantity} 件`,
      variant: 'info',
    })
  }

  if (item.status === 'received') {
    items.push({
      key: 'received',
      heading: '已收货',
      subtitle: formatDate(item.updatedAt),
      content: `${item.targetStoreName} 已确认收货`,
      variant: 'success',
    })
  }

  if (item.status === 'rejected') {
    items.push({
      key: 'rejected',
      heading: '已驳回',
      subtitle: formatDate(item.updatedAt),
      content: '调拨申请被驳回',
      variant: 'error',
    })
  }

  if (item.status === 'cancelled') {
    items.push({
      key: 'cancelled',
      heading: '已撤销',
      subtitle: formatDate(item.updatedAt),
      content: '调拨单已被撤销',
      variant: 'warning',
    })
  }

  if (!terminalStatuses.includes(item.status)) {
    items.push({
      key: 'pending-flow',
      heading: item.status === 'pending' ? '待审核' : item.status === 'approved' ? '待发货' : '待收货',
      subtitle: '进行中',
      content: '等待下一步操作',
      variant: 'default',
      pending: true,
    })
  }

  return items
}

export default function StockTransferDetailClient({
  snapshot,
}: {
  snapshot: StockTransferDetailSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const transfer = snapshot.transfer
  const [remark, setRemark] = useState(transfer?.remark ?? '')

  const handleRefresh = useCallback(() => {
    startRefresh(() => router.refresh())
  }, [router])

  const formSubmit = useFormSubmit({
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
    },
  })

  const nextStatuses = useMemo(
    () => (transfer ? findNextStatuses(transfer.status) : []),
    [transfer],
  )
  const isTerminal = useMemo(
    () => (transfer ? findNextStatuses(transfer.status).length === 0 : false),
    [transfer],
  )
  const timeline = useMemo(() => (transfer ? generateTimeline(transfer) : []), [transfer])

  const { actions: detailBarActions } = useDetailActions({
    workspace: 'stock-transfer',
    detailId: transfer?.id ?? snapshot.id,
    record: transfer,
    shareTitle: transfer?.transferNo ?? snapshot.id,
    shareText: `查看库存调拨单 ${transfer?.transferNo ?? snapshot.id} 详情`,
  })

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        extra={<>调拨单样本: {snapshot.id}</>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {!transfer ? (
        <main style={{ maxWidth: 860, margin: '0 auto', padding: 32, color: '#f87171' }}>
          <p>未找到该调拨单（ID: {snapshot.id}）</p>
          <Link href="/stock-transfer" style={{ color: '#60a5fa' }}>
            ← 返回调拨列表
          </Link>
        </main>
      ) : (
        <StockTransferDetailContent
          detailBarActions={detailBarActions}
          formSubmit={formSubmit}
          isTerminal={isTerminal}
          nextStatuses={nextStatuses}
          remark={remark}
          setRemark={setRemark}
          timeline={timeline}
          transfer={transfer}
        />
      )}
    </div>
  )
}

function StockTransferDetailContent({
  detailBarActions,
  formSubmit,
  isTerminal,
  nextStatuses,
  remark,
  setRemark,
  timeline,
  transfer,
}: {
  detailBarActions: Array<{ key: string; label: string; onClick?: () => void }>
  formSubmit: ReturnType<typeof useFormSubmit>
  isTerminal: boolean
  nextStatuses: TransferStatus[]
  remark: string
  setRemark: (value: string) => void
  timeline: TimelineItem[]
  transfer: StockTransferItem
}) {
  const actions: DetailShellAction[] = detailBarActions.map((action) => ({
    key: action.key,
    label: action.label,
    variant: 'primary',
    onClick: action.onClick,
  }))

  const statusFlowActions: DetailShellAction[] = nextStatuses.map((status) => ({
    key: `flow-${status}`,
    label: STATUS_ACTION_LABEL[status],
    variant: status === 'rejected' || status === 'cancelled' ? 'danger' : 'primary',
    onClick: async () => {
      await formSubmit.submit()
    },
  }))

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({
          workspace: 'stock-transfer',
          detailLabel: transfer.transferNo,
        })}
      />

      <DetailShell
        title={transfer.transferNo}
        subtitle={`${TYPE_LABEL[transfer.type]} · ${transfer.productName} (${transfer.productSku})`}
        actions={actions}
      >
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 24,
          }}
        >
          <StatCard label="调拨数量" value={`${transfer.quantity}`} />
          <StatCard label="调出" value={transfer.sourceStoreName} />
          <StatCard label="调入" value={transfer.targetStoreName} />
          <StatCard label="创建人" value={transfer.createdBy} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            padding: '16px 20px',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <StatusBadge
            label={STATUS_LABEL[transfer.status]}
            variant={STATUS_STYLE[transfer.status]}
            size="md"
            dot
          />
          <StatusBadge label={TYPE_LABEL[transfer.type]} variant={TYPE_VARIANT[transfer.type]} size="sm" />
          <StatusBadge
            label={URGENCY_LABEL[transfer.urgency]}
            variant={URGENCY_VARIANT[transfer.urgency]}
            size="sm"
          />
          {isTerminal ? (
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
              终态 · 不可流转
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            margin: '20px 0',
            padding: 20,
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <InfoRow label="调拨单号" value={transfer.transferNo} />
          <InfoRow
            label="状态"
            value={
              <StatusBadge
                label={STATUS_LABEL[transfer.status]}
                variant={STATUS_STYLE[transfer.status]}
                size="sm"
                dot
              />
            }
          />
          <InfoRow label="调出库房" value={`${transfer.sourceStoreName} (${transfer.sourceStore})`} />
          <InfoRow label="调入库房" value={`${transfer.targetStoreName} (${transfer.targetStore})`} />
          <InfoRow label="商品名称" value={transfer.productName} />
          <InfoRow label="商品SKU" value={transfer.productSku} />
          <InfoRow label="调拨数量" value={`${transfer.quantity} 件`} />
          <InfoRow label="紧急程度" value={URGENCY_LABEL[transfer.urgency]} />
          <InfoRow label="创建人" value={transfer.createdBy} />
          <InfoRow label="创建时间" value={transfer.createdAt} />
          <InfoRow label="最后更新" value={transfer.updatedAt} />
          <InfoRow label="备注" value={transfer.remark || '(无)'} />
        </div>

        {!isTerminal && statusFlowActions.length > 0 ? (
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.15)',
              background: 'rgba(15, 23, 42, 0.3)',
            }}
          >
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>状态流转操作</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {statusFlowActions.map((action) => (
                <SubmitButton
                  key={action.key}
                  onClick={action.onClick}
                  loading={formSubmit.submitting}
                  variant={action.variant === 'danger' ? 'danger' : 'primary'}
                >
                  {action.label}
                </SubmitButton>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.15)',
            background: 'rgba(15, 23, 42, 0.3)',
          }}
        >
          <FormField label="备注信息" helper="编辑备注后点击保存">
            <textarea
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.25)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e2e8f0',
                fontSize: 14,
                minHeight: 80,
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
              placeholder="输入备注信息"
            />
          </FormField>
          <SubmitButton
            onClick={async () => {
              await formSubmit.submit()
            }}
            loading={formSubmit.submitting}
            style={{ marginTop: 8 }}
          >
            保存备注
          </SubmitButton>
          {formSubmit.success ? <FormSubmitFeedback success="备注已更新" /> : null}
          {formSubmit.error ? <FormSubmitFeedback error={formSubmit.error} /> : null}
        </div>

        <div style={{ marginTop: 28, marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>
            调拨生命周期
          </h3>
          <Timeline items={timeline} />
        </div>
      </DetailShell>

      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'stock-transfer',
          detailId: transfer.id,
          closureLabel: '返回调拨列表',
        })}
      />
    </main>
  )
}
