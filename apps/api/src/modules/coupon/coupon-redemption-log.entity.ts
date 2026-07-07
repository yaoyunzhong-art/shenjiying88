// CouponRedemptionLog 实体脚手架 · Phase-17 T1
// 创建: 2026-06-26 · Pulse-68 等待期准备
// 状态: 🚧 SKELETON · 等待 Pulse-68 实际实施

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * CouponRedemptionLog 优惠券核销日志 (Phase-17)
 *
 * 关键字段:
 * - storeId: 实际核销门店 (可能与 coupon.scope.storeIds 不同)
 * - idempotencyKey: 防止同一订单重复核销
 *
 * @example
 * {
 *   id: 'redemption-001',
 *   couponId: 'coupon-001',
 *   userId: 'user-A',
 *   storeId: 'store-2',  // 用户在 store-2 核销
 *   orderId: 'order-xyz',
 *   amount: 50,
 *   idempotencyKey: 'order-xyz:coupon-001',
 *   redeemedAt: Date
 * }
 */
@Entity('coupon_redemption_log')
@Index(['couponId', 'userId'])
@Index(['userId', 'redeemedAt'])
@Index(['storeId', 'redeemedAt'])
@Index(['idempotencyKey'], { unique: true })
export class CouponRedemptionLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  couponId!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar' })
  storeId!: string;

  @Column({ type: 'varchar' })
  orderId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar' })
  idempotencyKey!: string;

  @CreateDateColumn()
  redeemedAt!: Date;
}