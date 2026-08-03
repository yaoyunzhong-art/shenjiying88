import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm'

export enum PushPlatform {
  iOS = 'iOS',
  Android = 'ANDROID',
  Web = 'WEB'
}

export enum PushStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED',
  Revoked = 'REVOKED'
}

export enum PushPriority {
  High = 'HIGH',
  Normal = 'NORMAL',
  Low = 'LOW'
}

export enum PushScheduleStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Cancelled = 'CANCELLED'
}

export interface PushTemplate {
  id: string
  code: string
  platform: PushPlatform
  tenantId: string
  brandId?: string
  storeId?: string
  title?: string
  body: string
  sound?: string
  badge?: number
  extra?: Record<string, unknown>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface PushRecord {
  id: string
  deviceToken: string
  platform: PushPlatform
  payload: {
    alert: string
    badge?: number
    sound?: string
    extra?: Record<string, unknown>
  }
  priority: PushPriority
  status: PushStatus
  sentAt: string
  tenantId?: string
  memberId?: string
}

export interface ScheduledPush {
  id: string
  memberId: string
  tenantId: string
  content: string
  platform: PushPlatform
  sendAt: Date
  status: PushScheduleStatus
  createdAt: string
}

export interface WSClient {
  clientId: string
  userId: string
  tenantId?: string
  connectedAt: string
  sessionId?: string
  platform?: PushPlatform
}

export interface WSMessage {
  channel: string
  data: unknown
  from?: string
  timestamp?: string
}

export interface PushStats {
  totalSent: number
  totalFailed: number
  activeConnections: number
  scheduledCount: number
  byPlatform: Record<PushPlatform, number>
}

// ── TypeORM Entity (持久化) ──────────────────────────────────

/**
 * PushRecordEntity — 设备推送记录表
 * Gate5-C1: deviceToken 必须持久化存储
 */
@Entity('push_records')
@Index('idx_push_device_token', ['deviceToken'])
@Index('idx_push_tenant_id', ['tenantId'])
export class PushRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'device_token', type: 'varchar', length: 256 })
  @Index()
  deviceToken!: string

  @Column({ type: 'varchar', length: 20, default: 'iOS' })
  platform!: string

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>

  @Column({ type: 'varchar', length: 10, default: 'NORMAL' })
  priority!: string

  @Column({ type: 'varchar', length: 20, default: 'SENT' })
  status!: string

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date

  @Column({ name: 'tenant_id', type: 'varchar', length: 64, nullable: true })
  tenantId?: string

  @Column({ name: 'member_id', type: 'varchar', length: 64, nullable: true })
  memberId?: string

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date

  /** 转为接口合约 */
  toContract(): PushRecord {
    return {
      id: this.id,
      deviceToken: this.deviceToken,
      platform: this.platform as PushPlatform,
      payload: (this.payload as PushRecord['payload']) ?? { alert: '' },
      priority: this.priority as PushPriority,
      status: this.status as PushStatus,
      sentAt: this.sentAt?.toISOString() ?? new Date().toISOString(),
      tenantId: this.tenantId,
      memberId: this.memberId,
    }
  }

  /** 从接口合约构造 entity */
  static fromContract(record: PushRecord): PushRecordEntity {
    const entity = new PushRecordEntity()
    entity.deviceToken = record.deviceToken
    entity.platform = record.platform
    entity.payload = record.payload as unknown as Record<string, unknown>
    entity.priority = record.priority
    entity.status = record.status
    entity.sentAt = new Date(record.sentAt)
    entity.tenantId = record.tenantId
    entity.memberId = record.memberId
    entity.createdAt = new Date()
    return entity
  }
}
