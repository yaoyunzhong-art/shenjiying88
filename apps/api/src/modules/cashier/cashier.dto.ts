export class CashierOrderItemDto {
  skuId!: string
  title?: string
  quantity!: number
  price!: number
}

export class CreateCashierOrderDto {
  memberId!: string
  items!: CashierOrderItemDto[]
  currency?: string
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
}

export class CreateCashierPaymentDto {
  channel!: string
  amount?: number
  externalPaymentId?: string
}

export class CashierPaymentCallbackDto {
  standardizedEventName!: 'cashier.payment-succeeded' | 'cashier.payment-failed'
  aggregateId!: string
  orderId!: string
  tenantId!: string
  externalPaymentId?: string
  transactionNo?: string
  channel?: string
  amount?: number
  payload?: Record<string, unknown>
}
