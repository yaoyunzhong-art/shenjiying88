// permission.entity.ts · 权限实体定义
// Phase-FP P0 · 2026-07-05

import {
  PermissionLevel,
  ResourceType,
  ActionType,
  DataScopeType,
} from './permission.types'

// ─── 角色实体 ────────────────────────────────────────────────────────────

export interface RoleEntity {
  /** 角色唯一标识 */
  roleId: string
  /** 角色英文名 */
  roleName: string
  /** 角色中文名 */
  roleNameZh: string
  /** 角色描述 */
  description?: string
  /** 权限等级 */
  level: PermissionLevel
  /** 关联权限列表 */
  permissions: string[]
  /** 所属租户ID（内置角色为空） */
  tenantId?: string
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
}

// ─── 权限实体 ────────────────────────────────────────────────────────────

export interface PermissionEntity {
  /** 权限唯一标识 */
  permissionId: string
  /** 权限Key（如 tenant:create） */
  permissionKey: string
  /** 权限名称 */
  permissionName: string
  /** 资源类型 */
  resourceType: ResourceType
  /** 可执行的操作 */
  actions: ActionType[]
  /** 权限描述 */
  description?: string
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

// ─── 角色分配实体 ────────────────────────────────────────────────────────

export interface RoleAssignmentEntity {
  /** 分配记录唯一标识 */
  id: string
  /** 用户ID */
  userId: string
  /** 角色名 */
  roleName: string
  /** 租户ID */
  tenantId: string
  /** 关联门店ID列表 */
  storeIds?: string[]
  /** 关联品牌ID列表 */
  brandIds?: string[]
  /** 分配时间 */
  assignedAt: number
  /** 过期时间（可选） */
  expiresAt?: number
}

// ─── 用户权限快照实体 ────────────────────────────────────────────────────

export interface UserPermissionSnapshot {
  /** 用户ID */
  userId: string
  /** 租户ID */
  tenantId: string
  /** 角色列表 */
  roles: string[]
  /** 聚合权限列表 */
  permissions: string[]
  /** 数据范围 */
  dataScope: {
    scopeType: DataScopeType
    allowedStoreIds?: string[]
    allowedBrandIds?: string[]
    ownOnly?: boolean
  }
  /** 快照创建时间 */
  snapshotAt: number
  /** 快照过期时间 */
  expiresAt: number
}

// ─── 审计日志实体 ────────────────────────────────────────────────────────

export interface PermissionAuditLog {
  /** 审计ID */
  auditId: string
  /** 操作时间 */
  timestamp: number
  /** 操作人 */
  operatorId: string
  /** 操作类型（assign/revoke/check/change） */
  operationType: 'assign' | 'revoke' | 'check' | 'change'
  /** 目标用户 */
  targetUserId?: string
  /** 目标角色 */
  targetRole?: string
  /** 涉及资源 */
  resource?: string
  /** 操作结果 */
  result: 'allowed' | 'denied' | 'success'
  /** 操作详情 */
  detail?: string
}

// ─── 常量定义 ────────────────────────────────────────────────────────────

export const PERMISSION_CACHE_PREFIX = 'perm:snapshot:'
export const PERMISSION_CACHE_TTL = 5 * 60 * 1000 // 5分钟

export const PERMISSION_AUDIT_ENABLED = true
