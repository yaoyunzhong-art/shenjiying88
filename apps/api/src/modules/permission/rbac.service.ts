// rbac.service.ts · RBAC权限服务
// Phase-FP P0 · 2026-07-03

import { Injectable, Logger } from '@nestjs/common'
import {
  Role,
  Permission,
  PermissionContext,
  PermissionLevel,
  ResourceType,
  ActionType,
} from './permission.types'

// 内置角色
const BUILTIN_ROLES: Role[] = [
  {
    roleId: 'platform_admin',
    roleName: 'PLATFORM_ADMIN',
    roleNameZh: '超级管理员',
    description: '平台最高权限',
    level: PermissionLevel.PLATFORM,
    permissions: ['*'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    roleId: 'tenant_admin',
    roleName: 'TENANT_ADMIN',
    roleNameZh: '企业管理员',
    description: '租户管理员',
    level: PermissionLevel.TENANT,
    permissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'product:*'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    roleId: 'store_manager',
    roleName: 'STORE_MANAGER',
    roleNameZh: '店长',
    description: '门店管理员',
    level: PermissionLevel.STORE,
    permissions: ['store:read', 'store:update', 'member:read', 'order:*', 'inventory:read', 'inventory:update'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    roleId: 'cashier',
    roleName: 'CASHIER',
    roleNameZh: '收银员',
    description: '收银员',
    level: PermissionLevel.STORE,
    permissions: ['order:create', 'order:read', 'payment:execute'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    roleId: 'sales_guide',
    roleName: 'SALES_GUIDE',
    roleNameZh: '导购',
    description: '导购员',
    level: PermissionLevel.STORE,
    permissions: ['member:read', 'order:create', 'product:read'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    roleId: 'member',
    roleName: 'MEMBER',
    roleNameZh: '会员',
    description: '普通会员',
    level: PermissionLevel.SELF,
    permissions: ['member:read', 'member:update', 'order:create', 'coupon:redeem'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

// 内置权限
const BUILTIN_PERMISSIONS: Permission[] = [
  { permissionId: 'p001', permissionKey: 'tenant:create', permissionName: '创建租户', resourceType: ResourceType.TENANT, actions: [ActionType.CREATE] },
  { permissionId: 'p002', permissionKey: 'tenant:read', permissionName: '查看租户', resourceType: ResourceType.TENANT, actions: [ActionType.READ] },
  { permissionId: 'p003', permissionKey: 'tenant:update', permissionName: '更新租户', resourceType: ResourceType.TENANT, actions: [ActionType.UPDATE] },
  { permissionId: 'p004', permissionKey: 'tenant:delete', permissionName: '删除租户', resourceType: ResourceType.TENANT, actions: [ActionType.DELETE] },
  { permissionId: 'p005', permissionKey: 'brand:*', permissionName: '品牌管理', resourceType: ResourceType.BRAND, actions: [ActionType.MANAGE] },
  { permissionId: 'p006', permissionKey: 'store:*', permissionName: '门店管理', resourceType: ResourceType.STORE, actions: [ActionType.MANAGE] },
  { permissionId: 'p007', permissionKey: 'member:*', permissionName: '会员管理', resourceType: ResourceType.MEMBER, actions: [ActionType.MANAGE] },
  { permissionId: 'p008', permissionKey: 'member:read', permissionName: '查看会员', resourceType: ResourceType.MEMBER, actions: [ActionType.READ] },
  { permissionId: 'p009', permissionKey: 'member:update', permissionName: '更新会员', resourceType: ResourceType.MEMBER, actions: [ActionType.UPDATE] },
  { permissionId: 'p010', permissionKey: 'order:*', permissionName: '订单管理', resourceType: ResourceType.ORDER, actions: [ActionType.MANAGE] },
  { permissionId: 'p011', permissionKey: 'order:create', permissionName: '创建订单', resourceType: ResourceType.ORDER, actions: [ActionType.CREATE] },
  { permissionId: 'p012', permissionKey: 'order:read', permissionName: '查看订单', resourceType: ResourceType.ORDER, actions: [ActionType.READ] },
  { permissionId: 'p013', permissionKey: 'inventory:*', permissionName: '库存管理', resourceType: ResourceType.INVENTORY, actions: [ActionType.MANAGE] },
  { permissionId: 'p014', permissionKey: 'finance:*', permissionName: '财务管理', resourceType: ResourceType.FINANCE, actions: [ActionType.MANAGE] },
  { permissionId: 'p015', permissionKey: 'coupon:*', permissionName: '优惠券管理', resourceType: ResourceType.COUPON, actions: [ActionType.MANAGE] },
  { permissionId: 'p016', permissionKey: 'coupon:redeem', permissionName: '核销优惠券', resourceType: ResourceType.COUPON, actions: [ActionType.EXECUTE] },
  { permissionId: 'p017', permissionKey: 'payment:execute', permissionName: '执行支付', resourceType: ResourceType.ORDER, actions: [ActionType.EXECUTE] },
]

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name)

  // 内存存储 (生产环境应使用数据库)
  private readonly roles = new Map<string, Role>()
  private readonly permissions = new Map<string, Permission>()
  private readonly userRoles = new Map<string, Set<string>>()

  constructor() {
    this.initBuiltinData()
  }

  /**
   * 检查权限
   */
  checkPermission(
    context: PermissionContext,
    resource: string,
    action: ActionType,
  ): { allowed: boolean; reason?: string } {
    // 1. 平台管理员拥有所有权限
    if (context.roles.includes('PLATFORM_ADMIN') || context.permissions.includes('*')) {
      return { allowed: true }
    }

    // 2. 解析资源类型
    const resourceType = this.extractResourceType(resource)

    // 3. 构建所需权限
    const requiredPermission = `${resourceType}:${action}`
    const wildcardPermission = `${resourceType}:*`

    // 4. 检查是否有权限
    const hasExactPermission = context.permissions.includes(requiredPermission)
    const hasWildcardPermission = context.permissions.includes(wildcardPermission)
    const hasAnyPermission = context.permissions.some(
      (p) => p === '*' || (p.startsWith(resourceType) && (p.endsWith(':*') || p.endsWith(`:${action}`)))
    )

    if (hasExactPermission || hasWildcardPermission || hasAnyPermission) {
      return { allowed: true }
    }

    // 5. 检查角色权限
    for (const roleName of context.roles) {
      const role = this.roles.get(roleName)
      if (role && role.permissions.includes('*')) {
        return { allowed: true }
      }
      if (role && role.permissions.some(p => p === requiredPermission || p === wildcardPermission)) {
        return { allowed: true }
      }
    }

    return {
      allowed: false,
      reason: `Missing permission: ${requiredPermission}`,
    }
  }

  /**
   * 获取用户的所有有效权限
   */
  resolveUserPermissions(context: PermissionContext): string[] {
    const permissions = new Set<string>()

    // 添加直接权限
    for (const perm of context.permissions) {
      permissions.add(perm)
    }

    // 添加角色权限
    for (const roleName of context.roles) {
      const role = this.roles.get(roleName)
      if (role) {
        for (const perm of role.permissions) {
          permissions.add(perm)
        }
      }
    }

    return Array.from(permissions)
  }

  /**
   * 获取角色信息
   */
  getRole(roleName: string): Role | undefined {
    return this.roles.get(roleName)
  }

  /**
   * 获取用户角色列表
   */
  getUserRoles(userId: string): Role[] {
    const roleNames = this.userRoles.get(userId)
    if (!roleNames) return []

    return Array.from(roleNames)
      .map((name) => this.roles.get(name))
      .filter((r): r is Role => r !== undefined)
  }

  /**
   * 分配角色给用户
   */
  assignRole(userId: string, roleName: string): void {
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set())
    }
    this.userRoles.get(userId)!.add(roleName)
    this.logger.log(`Assigned role ${roleName} to user ${userId}`)
  }

  /**
   * 撤销用户角色
   */
  revokeRole(userId: string, roleName: string): void {
    const roles = this.userRoles.get(userId)
    if (roles) {
      roles.delete(roleName)
      this.logger.log(`Revoked role ${roleName} from user ${userId}`)
    }
  }

  /**
   * 获取所有内置角色
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values())
  }

  /**
   * 获取所有内置权限
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values())
  }

  // ─── 私有方法 ────────────────────────────────────────────────────────

  private initBuiltinData(): void {
    // 初始化内置角色
    for (const role of BUILTIN_ROLES) {
      this.roles.set(role.roleName, role)
    }

    // 初始化内置权限
    for (const perm of BUILTIN_PERMISSIONS) {
      this.permissions.set(perm.permissionKey, perm)
    }

    this.logger.log(`Initialized ${this.roles.size} roles and ${this.permissions.size} permissions`)
  }

  private extractResourceType(resource: string): string {
    const parts = resource.split(':')
    return parts[0] || resource
  }
}
