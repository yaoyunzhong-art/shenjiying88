import { getRefunds } from '../refund-data'
import {
  REFUND_STATUS_LABEL,
  type RefundItem,
  type RefundStatus,
} from '../refund-types'

export const STATUS_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  pending_approval: ['approved', 'rejected'],
  approved: ['processing', 'cancelled'],
  rejected: [],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export const TRANSITION_ACTIONS: Record<
  string,
  { label: string; variant: 'success' | 'danger' | 'info' | 'warning' | 'default' }
> = {
  pending_approval__approved: { label: '通过审批', variant: 'success' },
  pending_approval__rejected: { label: '拒绝', variant: 'danger' },
  approved__processing: { label: '开始处理', variant: 'info' },
  approved__cancelled: { label: '取消', variant: 'warning' },
  processing__completed: { label: '完成退款', variant: 'success' },
  processing__cancelled: { label: '取消处理', variant: 'warning' },
}

export interface RefundDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'refund-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  refund: RefundItem | null
}

export function formatYuan(amountFen: number): string {
  return `¥${(amountFen / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function mapTransitionVariant(
  variant: 'success' | 'danger' | 'info' | 'warning' | 'default',
): 'default' | 'primary' | 'danger' {
  switch (variant) {
    case 'success':
    case 'info':
      return 'primary'
    case 'danger':
    case 'warning':
      return 'danger'
    default:
      return 'default'
  }
}

export async function loadRefundDetailSnapshot(id: string): Promise<RefundDetailSnapshot> {
  const refund = getRefunds().find((item) => item.id === id) ?? null

  return {
    deliveryMode: 'mock',
    sourceLabel: 'refund-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadRefundDetailSnapshot -> getRefunds()',
    businessDataSource: 'refund-data local samples',
    refreshPath: `RefundDetailPage -> loadRefundDetailSnapshot(${id})`,
    note: refund
      ? `当前退款详情以本地样本快照交付，可执行的状态流转为 ${
          STATUS_TRANSITIONS[refund.status].map((status) => REFUND_STATUS_LABEL[status]).join(' / ') || '无'
        }。`
      : '未命中退款样本，本轮仅完成 E54 三层壳与 not-found 收口。',
    refund,
  }
}
