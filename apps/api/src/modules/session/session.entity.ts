// session.entity.ts · 会话管理实体
// Phase-FP P10 · 2026-07-08

import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * 会话记录表
 * 保存用户登录会话信息
 */
@Entity('sessions')
@Index('idx_sessions_user_id', ['userId'])
@Index('idx_sessions_tenant_id', ['tenantId'])
@Index('idx_sessions_status', ['status'])
@Index('idx_sessions_expires_at', ['expiresAt'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'session_id', type: 'varchar', unique: true, length: 64 })
  sessionId!: string

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string

  @Column({ name: 'device_type', type: 'varchar', length: 20, default: 'web' })
  deviceType!: string

  @Column({ name: 'device_id', type: 'varchar', length: 64, nullable: true })
  deviceId?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  browser?: string

  @Column({ type: 'varchar', length: 64, nullable: true })
  os?: string

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent?: string

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'expired' | 'revoked'

  @Column({ name: 'created_at', type: 'bigint' })
  createdAt!: number

  @Column({ name: 'last_active_at', type: 'bigint' })
  lastActiveAt!: number

  @Column({ name: 'expires_at', type: 'bigint' })
  expiresAt!: number
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  deviceId: string
  deviceType: string
  browser?: string
  os?: string
  userAgent?: string
}

/**
 * 会话（运行时对象）
 */
export interface Session {
  sessionId: string
  userId: string
  tenantId: string
  deviceInfo: DeviceInfo
  createdAt: number
  lastActiveAt: number
  expiresAt: number
  status: 'active' | 'expired' | 'revoked'
}
