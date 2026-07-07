// CouponV2 实体脚手架 · Phase-17 T1
// 创建: 2026-06-26 · Pulse-68 等待期准备
// 状态: 🚧 SKELETON · 等待 Pulse-68 实际实施
// 关联: spec.md §1.1.1 · E40 P0 跨门店优惠券

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * CouponV2 优惠券实体 (Phase-17 跨门店版本)
 *
 * 关键扩展: scope.type 支持 'multi-store' + scope.storeIds 数组
 *
 * @example
 * {
 *   id: 'coupon-001',
 *   tenantId: 'tenant-A',
 *   code: 'CROSS-2026-50',
 *   scope!: {
 *     type: 'multi-store',
 *     storeIds: ['store-1', 'store-2', 'store-3'],
 *     includeSubordinates: true
 *   },
 *   redemptionRules!: {
 *     minAmount: 100,
 *     applicableCategories: ['dining', 'retail'],
 *     userSegments: ['svip', 'gold']
 *   },
 *   value: 50,
 *   valueType!: 'fixed' | 'percentage',
 *   expiresAt!: Date,
 *   status!: 'active' | 'paused' | 'expired' | 'exhausted',
 *   redemptionCount!: 0,
 *   maxRedemptions: 1000
 * }
 */
@Entity('coupon_v2')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['expiresAt'])
export class CouponV2 {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  tenantId!: string;

  @Column({ type: 'varchar' })
  code!: string;

  // ⭐ 核心扩展: 支持多门店 scope
  @Column({ type: 'jsonb' })
  scope!: {
    type: 'single-store' | 'multi-store' | 'tenant-wide';
    storeIds: string[];
    includeSubordinates: boolean;
  };

  @Column({ type: 'jsonb' })
  redemptionRules!: {
    minAmount?: number;
    applicableCategories?: string[];
    excludeItems?: string[];
    userSegments?: string[];
  };

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value!: number;

  @Column({ type: 'varchar', default: 'fixed' })
  valueType!: 'fixed' | 'percentage';

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'varchar', default: 'active' })
  status!: 'active' | 'paused' | 'expired' | 'exhausted';

  @Column({ type: 'int', default: 0 })
  redemptionCount!: number;

  @Column({ type: 'int', nullable: true })
  maxRedemptions?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}