// rbac.entity.ts · RBAC 权限实体
// 2026-07-06 · 5级权限体系：owner/admin/manager/staff/guest

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * 角色定义表
 */
@Entity('rbac_roles')
@Index('idx_rbac_role_name', ['name'], { unique: true })
export class RBACRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 32, unique: true })
  name!: string // owner | admin | manager | staff | guest

  @Column({ length: 255, nullable: true })
  description?: string

  @Column({ default: 0, name: 'sort_order' })
  sortOrder: number = 0 // 排序，高权限优先 (TS 默认值,与 TypeORM default 保持同步)

  @Column({ default: true, name: 'is_system' })
  isSystem: boolean = true // 系统内置角色不可删除 (TS 默认值)

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

/**
 * 权限定义表
 */
@Entity('rbac_permissions')
@Index('idx_rbac_perm_action', ['action'], { unique: true })
export class RBACPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 64, unique: true })
  action!: string // e.g., 'user:read', 'order:refund'

  @Column({ length: 255, nullable: true })
  description?: string

  @Column({ length: 64 })
  resource!: string // e.g., 'user', 'order', 'report'

  @Column({ length: 32 })
  operation!: string // e.g., 'read', 'write', 'delete'

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

/**
 * 角色-权限关联表
 */
@Entity('rbac_role_permissions')
@Index('idx_rbac_rp_role_perm', ['roleId', 'permissionId'], { unique: true })
export class RBACRolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'role_id' })
  roleId!: string

  @Column({ name: 'permission_id' })
  permissionId!: string

  @Column({ default: false, name: 'is_denied' })
  isDenied: boolean = false // true = 显式拒绝 (TS 默认值,与 TypeORM default 保持同步)

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}

/**
 * 用户角色分配表
 */
@Entity('rbac_assignments')
@Index('idx_rbac_assign_user_tenant', ['userId', 'tenantId'])
export class RBACAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id', length: 64 })
  userId!: string

  @Column({ name: 'role_id' })
  roleId!: string

  @Column({ name: 'tenant_id', length: 64, nullable: true })
  tenantId?: string

  @Column({ name: 'assigned_by', length: 64, default: 'system' })
  assignedBy!: string

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date
}
