// auth.entity.ts · 统一认证实体
// Phase-FP P0 · 2026-07-05

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * 用户账户表
 */
@Entity('auth_users')
@Index('idx_auth_users_mobile', ['mobile'])
@Index('idx_auth_users_email', ['email'])
@Index('idx_auth_users_tenant', ['tenantId'])
export class AuthUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id', type: 'varchar', unique: true, length: 64 })
  userId!: string

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile?: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string

  @Column({ name: 'wechat_open_id', type: 'varchar', length: 64, nullable: true })
  wechatOpenId?: string

  @Column({ type: 'varchar', length: 100 })
  nickname!: string

  @Column({ name: 'password_hash', type: 'varchar', length: 255, default: '' })
  passwordHash!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string

  @Column('simple-array')
  roles!: string[]

  @Column('simple-array')
  permissions!: string[]

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean

  @Column({ nullable: true, name: 'last_login_at', type: 'timestamp' })
  lastLoginAt?: Date

  @Column({ type: 'int', nullable: true, name: 'failed_attempts', default: 0 })
  failedAttempts!: number

  @Column({ nullable: true, name: 'locked_until', type: 'timestamp' })
  lockedUntil?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

/**
 * 用户会话表
 */
@Entity('auth_sessions')
@Index('idx_auth_sessions_user', ['userId'])
@Index('idx_auth_sessions_expires', ['expiresAt'])
export class AuthSession {
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

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken?: string

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken?: string

  @Column({ name: 'login_type', type: 'varchar', length: 30, default: 'mobile_password' })
  loginType!: string

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status!: 'active' | 'expired' | 'revoked'

  @Column({ name: 'created_at', type: 'bigint' })
  createdAt!: number

  @Column({ name: 'last_active_at', type: 'bigint' })
  lastActiveAt!: number

  @Column({ name: 'expires_at', type: 'bigint' })
  expiresAt!: number
}

/**
 * Token黑名单（登出/刷新后的作废Token）
 */
@Entity('auth_token_blacklist')
@Index('idx_auth_blacklist_jti', ['jti'])
@Index('idx_auth_blacklist_expires', ['expiresAt'])
export class AuthTokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'jti', type: 'varchar', length: 64, unique: true })
  jti!: string

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string

  @Column({ name: 'token_type', type: 'varchar', length: 20 })
  tokenType!: 'access' | 'refresh'

  @Column({ name: 'revoked_at', type: 'bigint' })
  revokedAt!: number

  @Column({ name: 'expires_at', type: 'bigint' })
  expiresAt!: number
}
