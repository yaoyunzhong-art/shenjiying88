import type { CashierOrder, CashierPayment } from '../cashier/cashier.entity'
import type {
  BlindboxFulfillment,
  CouponRedemption,
  LoyaltyOrderSettlement,
  PointsLedgerEntry
} from '../loyalty/loyalty.entity'

export enum TransactionRefundStatus {
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  Completed = 'COMPLETED'
}

export enum TransactionRefundReviewAction {
  Approve = 'APPROVE',
  Reject = 'REJECT'
}

export enum TransactionRefundAgingBucket {
  Under1Hour = 'UNDER_1H',
  Hour1To4 = 'H1_TO_H4',
  Hour4To24 = 'H4_TO_H24',
  Over24Hours = 'GTE_24H'
}

export enum TransactionRefundRiskLevel {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH'
}

export enum TransactionRefundEscalationLevel {
  None = 'NONE',
  TeamLead = 'TEAM_LEAD',
  OpsManager = 'OPS_MANAGER',
  Finance = 'FINANCE'
}

export enum TransactionRefundDispatchReason {
  PendingWithinSla = 'PENDING_WITHIN_SLA',
  ApproachingSlaBreach = 'APPROACHING_SLA_BREACH',
  SlaBreachedOrMediumRisk = 'SLA_BREACHED_OR_MEDIUM_RISK',
  HighAmountOrLongOverdue = 'HIGH_AMOUNT_OR_LONG_OVERDUE'
}

export enum TransactionRefundAssignmentAction {
  Assign = 'ASSIGN',
  Claim = 'CLAIM'
}

export interface TransactionRefundRecord {
  refundId: string
  tenantContext: CashierOrder['tenantContext']
  orderId: string
  paymentId: string
  memberId: string
  refundAmount: number
  reason: string
  operator?: string
  status: TransactionRefundStatus
  requestedAt: string
  completedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNote?: string
  assignedOwner?: string
  assignedTo?: string
  assignedAt?: string
  assignedBy?: string
  assignmentNote?: string
}

export interface TransactionAggregate {
  order: CashierOrder
  payment?: CashierPayment
  settlement?: LoyaltyOrderSettlement
  pointsLedger: PointsLedgerEntry[]
  couponRedemptions: CouponRedemption[]
  blindboxFulfillments: BlindboxFulfillment[]
  refunds: TransactionRefundRecord[]
}

export interface LytOrderSnapshot {
  snapshotId: string
  tenantContext: CashierOrder['tenantContext']
  externalOrderId: string
  orderNo?: string
  memberId?: string
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
  amount: number
  discountAmount: number
  payableAmount: number
  currency: string
  status: string
  paidAt?: string
  updatedAtFromSource: string
  rawVersion?: string
  rawPayload?: Record<string, unknown>
  source?: 'memory' | 'prisma'
}

export interface LytPaymentSnapshot {
  snapshotId: string
  tenantContext: CashierOrder['tenantContext']
  externalPaymentId: string
  externalOrderId: string
  paymentChannel?: string
  paymentStatus: string
  amount: number
  currency: string
  transactionNo?: string
  paidAt?: string
  updatedAtFromSource: string
  rawVersion?: string
  rawPayload?: Record<string, unknown>
  source?: 'memory' | 'prisma'
}

export interface TransactionBatchRefundReviewResult {
  processedCount: number
  skippedCount: number
  processedRefundIds: string[]
  skippedRefundIds: string[]
  refunds: TransactionRefundRecord[]
  auditSummary: {
    action: TransactionRefundReviewAction
    operator?: string
    note?: string
    processedAt: string
  }
}

export interface TransactionBatchRefundAssignmentResult {
  processedCount: number
  skippedCount: number
  processedRefundIds: string[]
  skippedRefundIds: string[]
  refunds: TransactionRefundRecord[]
  assignmentSummary: {
    action: TransactionRefundAssignmentAction
    suggestedOwner?: string
    assignee?: string
    operator?: string
    note?: string
    processedAt: string
  }
}

export interface TransactionRefundDashboardStatusGroup {
  status: TransactionRefundStatus
  count: number
  totalAmount: number
}

export interface TransactionRefundDashboardPendingSummary {
  count: number
  totalAmount: number
  oldestRequestedAt?: string
  newestRequestedAt?: string
}

export interface TransactionRefundDashboardRecentReview {
  refundId: string
  orderId: string
  memberId: string
  refundAmount: number
  status: TransactionRefundStatus.Completed | TransactionRefundStatus.Rejected
  reviewedAt: string
  reviewedBy?: string
  reviewNote?: string
}

export interface TransactionRefundDashboardReviewerSummary {
  reviewedBy: string
  reviewCount: number
  lastReviewedAt: string
}

export interface TransactionRefundDashboardAgingBucketSummary {
  bucket: TransactionRefundAgingBucket
  count: number
  totalAmount: number
}

export interface TransactionRefundDashboardPriorityQueueItem {
  refundId: string
  orderId: string
  memberId: string
  refundAmount: number
  operator?: string
  requestedAt: string
  waitingMinutes: number
  agingBucket: TransactionRefundAgingBucket
  riskLevel: TransactionRefundRiskLevel
}

export interface TransactionRefundDashboardOperatorQuickStat {
  operator: string
  count: number
  totalAmount: number
}

export interface TransactionRefundDashboardEscalationSummary {
  noneCount: number
  teamLeadCount: number
  opsManagerCount: number
  financeCount: number
}

export interface TransactionRefundDashboardDispatchItem {
  refundId: string
  orderId: string
  memberId: string
  refundAmount: number
  operator?: string
  requestedAt: string
  waitingMinutes: number
  escalationLevel: TransactionRefundEscalationLevel
  suggestedOwner: string
  dispatchReason: TransactionRefundDispatchReason
  assignedOwner?: string
  assignedTo?: string
  assignedAt?: string
}

export interface TransactionRefundDashboardSlaThresholds {
  teamLeadMinutes: number
  opsManagerMinutes: number
  financeMinutes: number
}

export interface TransactionRefundDashboardOwnerSummary {
  suggestedOwner: string
  escalationLevel: TransactionRefundEscalationLevel
  pendingCount: number
  totalAmount: number
}

export interface TransactionRefundDashboardEscalationTrailItem {
  refundId: string
  orderId: string
  memberId: string
  refundAmount: number
  requestedAt: string
  waitingMinutes: number
  escalationLevel: TransactionRefundEscalationLevel
  suggestedOwner: string
  dispatchReason: TransactionRefundDispatchReason
  assignedOwner?: string
  assignedTo?: string
  assignedAt?: string
}

export interface TransactionRefundDashboard {
  totalCount: number
  totalRequestedAmount: number
  totalCompletedAmount: number
  totalPendingAmount: number
  statusGroups: TransactionRefundDashboardStatusGroup[]
  pendingSummary: TransactionRefundDashboardPendingSummary
  agingBuckets: TransactionRefundDashboardAgingBucketSummary[]
  priorityQueue: TransactionRefundDashboardPriorityQueueItem[]
  recentReviews: TransactionRefundDashboardRecentReview[]
  reviewerSummaries: TransactionRefundDashboardReviewerSummary[]
  operatorQuickStats: TransactionRefundDashboardOperatorQuickStat[]
  riskSummary: {
    lowCount: number
    mediumCount: number
    highCount: number
  }
  escalationSummary: TransactionRefundDashboardEscalationSummary
  dispatchQueue: TransactionRefundDashboardDispatchItem[]
  slaThresholds: TransactionRefundDashboardSlaThresholds
  ownerSummaries: TransactionRefundDashboardOwnerSummary[]
  recentEscalationTrail: TransactionRefundDashboardEscalationTrailItem[]
}

export interface TransactionBatchTimeoutCloseResult {
  processedCount: number
  skippedCount: number
  processedOrderIds: string[]
  skippedOrderIds: string[]
  orders: TransactionAggregate[]
}

export interface MemberTransactionTimelineEntry {
  orderId: string
  memberId: string
  status: CashierOrder['status']
  paymentStatus?: CashierPayment['status']
  totalAmount: number
  currency: string
  awardedPoints: number
  refundedAmount: number
  refundStatus?: TransactionRefundStatus
  couponCode?: string
  blindboxPlanId?: string
  blindboxStatus?: BlindboxFulfillment['status']
  closeReason?: CashierOrder['closeReason']
  closedBy?: CashierOrder['closedBy']
  closeNote?: CashierOrder['closeNote']
  createdAt: string
  updatedAt: string
  paidAt?: string
  closedAt?: string
}

export interface TransactionOrderListItem {
  orderId: string
  orderNo: string
  memberId: string
  status: CashierOrder['status'] | TransactionRefundStatus | string
  totalAmount: number
  paidAmount: number
  refundedAmount: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface TransactionOrderListPage {
  items: TransactionOrderListItem[]
  total: number
  page: number
  pageSize: number
}
