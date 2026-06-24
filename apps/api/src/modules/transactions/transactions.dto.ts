import { CashierOrderItemDto } from '../cashier/cashier.dto'

export class CreateTransactionCheckoutDto {
  memberId!: string
  items!: CashierOrderItemDto[]
  paymentChannel!: string
  currency?: string
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
  amount?: number
  externalPaymentId?: string
}

export class RequestTransactionRefundDto {
  refundAmount?: number
  reason!: string
  operator?: string
}

export class ReviewTransactionRefundDto {
  operator?: string
  note?: string
}

export class BatchReviewTransactionRefundsDto extends ReviewTransactionRefundDto {
  refundIds?: string[]
}

export class RequestTransactionTimeoutCloseDto {
  reason?: string
  operator?: string
}

export class RequestTransactionManualCloseDto {
  reason?: string
  operator?: string
}

export class ListTransactionRefundsQueryDto {
  memberId?: string
  orderId?: string
  operator?: string
  reviewedBy?: string
  requestedAfter?: string
  requestedBefore?: string
  reviewedAfter?: string
  reviewedBefore?: string
  status?: string
  limit?: number
}

export class GetTransactionRefundDashboardQueryDto extends ListTransactionRefundsQueryDto {
  recentReviewLimit?: number
  priorityQueueLimit?: number
  dispatchQueueLimit?: number
  recentEscalationLimit?: number
  teamLeadThresholdMinutes?: number
  opsManagerThresholdMinutes?: number
  financeThresholdMinutes?: number
  asOfTime?: string
}

export class BatchAssignTransactionRefundsDto extends GetTransactionRefundDashboardQueryDto {
  refundIds?: string[]
  suggestedOwner?: string
  assignee!: string
  declare operator?: string
  note?: string
}

export class BatchClaimTransactionRefundsDto extends GetTransactionRefundDashboardQueryDto {
  refundIds?: string[]
  suggestedOwner?: string
  declare operator: string
  note?: string
}

export class ListTransactionOrdersQueryDto {
  memberId?: string
  status?: string
  paymentStatus?: string
  closeReason?: string
  hasRefund?: boolean
  limit?: number
}

export class BatchTimeoutCloseOrdersDto {
  orderIds?: string[]
  memberId?: string
  beforeTime?: string
  limit?: number
}
