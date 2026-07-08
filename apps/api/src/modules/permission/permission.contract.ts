/**
 * 🐜 自动: [permission] [D] contract 补全
 *
 * 权限模块：跨模块合约类型
 * 定义 permission 模块对外暴露的稳定合约接口，
 * 供其他模块（auth, rbac, portal, member 等）消费。
 */
import type { PermissionLevel, DataScopeType, ActionType } from './permission.types'

/**
 * 权限检查请求契约（跨模块安全子集）
 */
export interface PermissionCheckContract {
  context: {
    userId: string
    tenantId: string
    brandId?: string
    storeId?: string
    roles: string[]
    permissions: string[]
  }
  resource: string
  action: ActionType
  resourceId?: string
}

/**
 * 权限检查结果契约
 */
export interface PermissionCheckResultContract {
  allowed: boolean
  reason?: string
  requiredPermissions?: string[]
  dataScope?: {
    scopeType: DataScopeType
    allowedStoreIds?: string[]
    allowedBrandIds?: string[]
    ownOnly?: boolean
  }
  evaluatedAt: number
}

/**
 * 角色信息契约
 */
export interface RoleContract {
  roleId: string
  roleName: string
  roleNameZh: string
  description?: string
  level: PermissionLevel
  permissions: string[]
}

/**
 * 权限列表契约
 */
export interface PermissionContract {
  permissionId: string
  permissionKey: string
  permissionName: string
  resourceType: string
  actions: string[]
}

/**
 * 用户权限上下文契约
 */
export interface UserPermissionContextContract {
  userId: string
  tenantId: string
  brandId?: string
  storeId?: string
  roles: string[]
  permissions: string[]
  dataScope?: {
    scopeType: DataScopeType
    allowedStoreIds?: string[]
    allowedBrandIds?: string[]
    ownOnly?: boolean
  }
}

/**
 * Permission 模块暴露的合约接口（供其他模块消费）
 */
export interface PermissionModuleContract {
  /**
   * 检查单个权限
   */
  checkPermission(request: PermissionCheckContract): PermissionCheckResultContract

  /**
   * 批量检查权限
   */
  batchCheck(requests: PermissionCheckContract[]): PermissionCheckResultContract[]

  /**
   * 获取用户有效权限
   */
  getUserPermissions(context: UserPermissionContextContract): string[]

  /**
   * 获取所有角色
   */
  getAllRoles(): RoleContract[]

  /**
   * 获取所有权限
   */
  getAllPermissions(): PermissionContract[]

  /**
   * 快速权限检查（仅RBAC）
   */
  quickCheck(
    context: UserPermissionContextContract,
    resource: string,
    action: string,
  ): boolean
}
