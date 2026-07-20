import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ═══════════════════════════════════════════════════════════════
// 枚举
// ═══════════════════════════════════════════════════════════════

export enum CashierOrderStatus {
  Created = 'CREATED',
  PendingPayment = 'PENDING_PAYMENT',
  Paid = 'PAID',
  PaymentFailed = 'PAYMENT_FAILED',
  Closed = 'CLOSED'
}

export enum CashierOrderCloseReason {
  PaymentTimeout = 'PAYMENT_TIMEOUT',
  FullRefund = 'FULL_REFUND',
  ManualCancel = 'MANUAL_CANCEL'
}

export enum CashierPaymentStatus {
  Pending = 'PENDING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED'
}

// ═══════════════════════════════════════════════════════════════
// 接口（跨层合约，保持不变）
// ═══════════════════════════════════════════════════════════════

export interface CashierOrderItem {
  skuId: string
  title?: string
  quantity: number
  price: number
}

export interface CashierOrder {
  orderId: string
  orderNo?: string
  tenantContext: RequestTenantContext
  memberId: string
  items: CashierOrderItem[]
  currency: string
  totalAmount: number
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
  status: CashierOrderStatus
  latestPaymentId?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  closedAt?: string
  closeReason?: CashierOrderCloseReason
  closedBy?: string
  closeNote?: string
  source: 'memory'
}

export interface CashierPayment {
  paymentId: string
  orderId: string
  externalPaymentId?: string
  channel: string
  amount: number
  status: CashierPaymentStatus
  transactionNo?: string
  sourceEventName?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface CashierPaymentCallback {
  standardizedEventName: 'cashier.payment-succeeded' | 'cashier.payment-failed'
  aggregateId: string
  orderId: string
  tenantId: string
  externalPaymentId?: string
  transactionNo?: string
  channel?: string
  amount?: number
  payload?: Record<string, unknown>
}

export function computeCashierOrderTotal(items: CashierOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
}

// ═══════════════════════════════════════════════════════════════
// TypeORM 实体类（持久化用）
// ═══════════════════════════════════════════════════════════════

/**
 * CashierOrderEntity — 收银台订单表
 * RQ-20260720-011: 从内存 seed 迁移至 DB 持久化
 */
@Entity('cashier_orders')
@Index('idx_cashier_order_tenant', ['tenantId'])
@Index('idx_cashier_order_member', ['memberId'])
export class CashierOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'order_id', length: 128, unique: true })
  orderId!: string

  @Column({ name: 'tenant_id', length: 64 })
  tenantId!: string

  @Column({ name: 'brand_id', length: 64, nullable: true })
  brandId?: string

  @Column({ name: 'store_id', length: 64, nullable: true })
  storeId?: string

  @Column({ name: 'member_id', length: 64 })
  memberId!: string

  /** Items 以 JSON 列存储 */
  @Column({ name: 'items', type: 'jsonb', nullable: true })
  items?: CashierOrderItem[]

  @Column({ length: 10, default: 'CNY' })
  currency!: string

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount!: number

  @Column({ name: 'coupon_code', length: 64, nullable: true })
  couponCode?: string

  @Column({ name: 'blindbox_plan_id', length: 64, nullable: true })
  blindboxPlanId?: string

  @Column({ name: 'blindbox_quantity', type: 'int', nullable: true })
  blindboxQuantity?: number

  @Column({ length: 20, default: 'CREATED' })
  status!: string

  @Column({ name: 'latest_payment_id', length: 128, nullable: true })
  latestPaymentId?: string

  @Column({ name: 'source', length: 20, default: 'memory' })
  source!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date

  @Column({ name: 'close_reason', length: 30, nullable: true })
  closeReason?: string

  @Column({ name: 'closed_by', length: 64, nullable: true })
  closedBy?: string

  @Column({ name: 'close_note', length: 255, nullable: true })
  closeNote?: string

  /** 将 entity 转换为接口合约 */
  toContract(): CashierOrder {
    return {
      orderId: this.orderId,
      tenantContext: {
        tenantId: this.tenantId,
        brandId: this.brandId,
        storeId: this.storeId,
      },
      memberId: this.memberId,
      items: this.items ?? [],
      currency: this.currency,
      totalAmount: Number(this.totalAmount),
      couponCode: this.couponCode,
      blindboxPlanId: this.blindboxPlanId,
      blindboxQuantity: this.blindboxQuantity,
      status: this.status as CashierOrderStatus,
      latestPaymentId: this.latestPaymentId,
      createdAt: this.createdAt?.toISOString?.() ?? this.createdAt as unknown as string,
      updatedAt: this.updatedAt?.toISOString?.() ?? this.updatedAt as unknown as string,
      paidAt: this.paidAt?.toISOString?.(),
      closedAt: this.closedAt?.toISOString?.(),
      closeReason: this.closeReason as CashierOrderCloseReason | undefined,
      closedBy: this.closedBy,
      closeNote: this.closeNote,
      source: this.source as 'memory',
    }
  }

  /** 从接口合约构造 entity */
  static fromContract(order: CashierOrder): CashierOrderEntity {
    const entity = new CashierOrderEntity()
    entity.orderId = order.orderId
    entity.tenantId = order.tenantContext.tenantId
    entity.brandId = order.tenantContext.brandId
    entity.storeId = order.tenantContext.storeId
    entity.memberId = order.memberId
    entity.items = order.items
    entity.currency = order.currency
    entity.totalAmount = order.totalAmount
    entity.couponCode = order.couponCode
    entity.blindboxPlanId = order.blindboxPlanId
    entity.blindboxQuantity = order.blindboxQuantity
    entity.status = order.status
    entity.latestPaymentId = order.latestPaymentId
    entity.source = order.source
    entity.createdAt = new Date(order.createdAt)
    entity.updatedAt = new Date(order.updatedAt)
    if (order.paidAt) entity.paidAt = new Date(order.paidAt)
    if (order.closedAt) entity.closedAt = new Date(order.closedAt)
    entity.closeReason = order.closeReason
    entity.closedBy = order.closedBy
    entity.closeNote = order.closeNote
    return entity
  }
}

/**
 * CashierPaymentEntity — 收银台支付记录表
 * RQ-20260720-011: 从内存 seed 迁移至 DB 持久化
 */
@Entity('cashier_payments')
@Index('idx_cashier_payment_order', ['orderId'])
export class CashierPaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'payment_id', length: 128, unique: true })
  paymentId!: string

  @Column({ name: 'order_id', length: 128 })
  orderId!: string

  @Column({ name: 'external_payment_id', length: 128, nullable: true })
  externalPaymentId?: string

  @Column({ length: 32 })
  channel!: string

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number

  @Column({ length: 20, default: 'PENDING' })
  status!: string

  @Column({ name: 'transaction_no', length: 128, nullable: true })
  transactionNo?: string

  @Column({ name: 'source_event_name', length: 64, nullable: true })
  sourceEventName?: string

  @Column({ name: 'failure_reason', length: 255, nullable: true })
  failureReason?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date

  /** 将 entity 转换为接口合约 */
  toContract(): CashierPayment {
    return {
      paymentId: this.paymentId,
      orderId: this.orderId,
      externalPaymentId: this.externalPaymentId,
      channel: this.channel,
      amount: Number(this.amount),
      status: this.status as CashierPaymentStatus,
      transactionNo: this.transactionNo,
      sourceEventName: this.sourceEventName,
      failureReason: this.failureReason,
      createdAt: this.createdAt?.toISOString?.() ?? this.createdAt as unknown as string,
      updatedAt: this.updatedAt?.toISOString?.() ?? this.updatedAt as unknown as string,
      completedAt: this.completedAt?.toISOString?.(),
    }
  }

  /** 从接口合约构造 entity */
  static fromContract(payment: CashierPayment): CashierPaymentEntity {
    const entity = new CashierPaymentEntity()
    entity.paymentId = payment.paymentId
    entity.orderId = payment.orderId
    entity.externalPaymentId = payment.externalPaymentId
    entity.channel = payment.channel
    entity.amount = payment.amount
    entity.status = payment.status
    entity.transactionNo = payment.transactionNo
    entity.sourceEventName = payment.sourceEventName
    entity.failureReason = payment.failureReason
    entity.createdAt = new Date(payment.createdAt)
    entity.updatedAt = new Date(payment.updatedAt)
    if (payment.completedAt) entity.completedAt = new Date(payment.completedAt)
    return entity
  }
}

/**
 * CashierMemberEntity — 收银台会员表（原 seed 数据持久化）
 * RQ-20260720-011: 从内存 seed 数据迁移
 */
@Entity('cashier_members')
@Index('idx_cashier_member_phone', ['phone'])
export class CashierMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'member_id', length: 64, unique: true })
  memberId!: string

  @Column({ length: 20 })
  phone!: string

  @Column({ length: 64 })
  name!: string

  @Column({ name: 'member_no', length: 32, nullable: true })
  memberNo?: string

  @Column({ length: 20, default: 'Bronze' })
  tier!: string

  @Column({ type: 'int', default: 0 })
  points!: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

/**
 * CashierTransactionEntity — 收银台交易记录表（原 seed 数据持久化）
 * RQ-20260720-011: 从内存 seed 数据迁移
 */
@Entity('cashier_transactions')
@Index('idx_cashier_txn_member', ['memberId'])
@Index('idx_cashier_txn_order', ['orderId'])
export class CashierTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'txn_id', length: 64, unique: true })
  txnId!: string

  @Column({ name: 'order_id', length: 128, nullable: true })
  orderId?: string

  @Column({ name: 'order_no', length: 64, nullable: true })
  orderNo?: string

  @Column({ name: 'member_id', length: 64 })
  memberId!: string

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number

  @Column({ length: 20 })
  type!: string

  @Column({ length: 20 })
  status!: string

  @Column({ name: 'txn_date', type: 'timestamptz', nullable: true })
  txnDate?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
