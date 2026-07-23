/**
 * audit.entity.ts - 审计日志实体
 * 用途: 全链路审计追踪实体定义，映射到数据库表
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AuditEventType =
  | 'auth.login' | 'auth.logout' | 'auth.register' | 'auth.password_change'
  | 'user.created' | 'user.deleted' | 'user.disabled' | 'user.enabled' | 'user.profile_update' | 'user.consent_update' | 'user.data_delete'
  | 'order.created' | 'order.paid' | 'order.refunded' | 'order.cancelled'
  | 'points.earned' | 'points.redeemed' | 'points.adjusted'
  | 'payment.initiated' | 'payment.completed' | 'payment.failed' | 'payment.refunded'
  | 'settlement.created' | 'settlement.approved' | 'settlement.rejected' | 'settlement.paid'
  | 'admin.config_change' | 'admin.user_impersonate' | 'admin.data_export' | 'admin.user_created' | 'admin.user_deleted' | 'admin.user_disabled' | 'admin.user_enabled'
  | 'admin.role_create' | 'admin.role_update' | 'admin.role_delete'
  | 'admin.permission_grant' | 'admin.permission_revoke'
  | 'user.role_assigned' | 'user.role_unassigned'
  | 'compliance.consent_recorded' | 'compliance.dsr_submitted' | 'compliance.dsr_processed'

export type ActorType = 'user' | 'admin' | 'system' | 'api_key'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

@Entity('audit_logs')
@Index(['actorId', 'timestamp'])
@Index(['eventType', 'timestamp'])
@Index(['tenantId', 'timestamp'])
@Index(['riskLevel', 'timestamp'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  @Index()
  eventType!: AuditEventType

  @Column({ name: 'actor_id', type: 'varchar', length: 100 })
  @Index()
  actorId!: string

  @Column({ name: 'actor_type', type: 'varchar', length: 20 })
  actorType!: ActorType

  @Column({ name: 'tenant_id', type: 'varchar', length: 50, nullable: true })
  @Index()
  tenantId?: string

  @Column({ name: 'resource_type', type: 'varchar', length: 50, nullable: true })
  resourceType?: string

  @Column({ name: 'resource_id', type: 'varchar', length: 100, nullable: true })
  resourceId?: string

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent?: string

  @Column({ name: 'risk_level', type: 'varchar', length: 10, default: 'low' })
  @Index()
  riskLevel!: RiskLevel

  @Column({ name: 'trace_id', type: 'varchar', length: 100, nullable: true })
  traceId?: string

  @Column({ name: 'parent_span_id', type: 'varchar', length: 50, nullable: true })
  parentSpanId?: string

  /** 分账 ID */
  @Column({ name: 'settlement_id', type: 'varchar', length: 100, nullable: true })
  @Index()
  settlementId?: string

  /** 分账金额（分） */
  @Column({ name: 'settlement_amount', type: 'int', nullable: true })
  settlementAmount?: number

  /** 涉及的 PII 字段列表 */
  @Column({ name: 'pii_fields', type: 'simple-array', nullable: true })
  piiFields?: string[]

  /** 同意版本号 */
  @Column({ name: 'consent_version', type: 'varchar', length: 20, nullable: true })
  consentVersion?: string

  @CreateDateColumn({ name: 'timestamp' })
  @Index()
  timestamp!: Date
}
