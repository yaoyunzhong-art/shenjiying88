/**
 * 付费授权 - TypeORM 实体 (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 对应表: licenses
 * 功能: 租户级/门店级双层授权管理
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import type {
  LicenseScope,
  LicenseLevel,
  LicenseStatus,
  ActivationSource,
} from '../license.entity'

@Entity('licenses')
@Index(['tenantId'])
@Index(['storeId'])
@Index(['scope'])
@Index(['status'])
@Index(['tenantId', 'scope', 'status'])
export class LicenseOrmEntity {
  @PrimaryColumn('varchar', { length: 64 })
  id!: string

  @Column('varchar', { length: 64 })
  tenantId!: string

  @Column('varchar', { length: 64, nullable: true })
  storeId?: string

  @Column('varchar', { length: 32 })
  scope!: LicenseScope

  @Column('varchar', { length: 16, default: 'tenant' })
  level!: LicenseLevel

  @Column('varchar', { length: 16, default: 'pending' })
  status!: LicenseStatus

  @Column('bigint', { nullable: true })
  quota?: number

  @Column('bigint', { default: 0 })
  usedQuota!: number

  @Column('varchar', { length: 16 })
  activationSource!: ActivationSource

  @Column('timestamptz')
  validFrom!: Date

  @Column('timestamptz')
  validUntil!: Date

  @Column('boolean', { default: false })
  autoRenew!: boolean

  @Column('integer', { nullable: true })
  priceCents?: number

  @Column('varchar', { length: 64 })
  createdBy!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
