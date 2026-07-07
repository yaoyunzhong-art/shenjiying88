/**
 * 付费授权 - 审计日志 TypeORM 实体 (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 对应表: license_activation_logs
 * 保留策略: 180 天
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'
import type { LicenseScope, LicenseAuditLog } from '../license.entity'

@Entity('license_activation_logs')
@Index(['licenseId'])
@Index(['tenantId'])
@Index(['action'])
@Index(['timestamp'])
@Index(['tenantId', 'timestamp'])
export class LicenseAuditLogOrmEntity implements Omit<LicenseAuditLog, 'id' | 'timestamp'> {
  @PrimaryColumn('varchar', { length: 64 })
  id!: string

  @Column('varchar', { length: 64 })
  licenseId!: string

  @Column('varchar', { length: 64 })
  tenantId!: string

  @Column('varchar', { length: 64, nullable: true })
  storeId?: string

  @Column('varchar', { length: 16 })
  action!: LicenseAuditLog['action']

  @Column('varchar', { length: 32 })
  scope!: LicenseScope

  @Column('varchar', { length: 64 })
  operator!: string

  @Column('varchar', { length: 16 })
  result!: 'success' | 'denied'

  @Column('varchar', { length: 255, nullable: true })
  reason?: string

  @Column('jsonb', { nullable: true })
  context?: Record<string, unknown>

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp!: Date
}
