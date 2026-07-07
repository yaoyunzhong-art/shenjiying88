/**
 * rbac.service.ts - T128-2 RBAC 完整化 5级权限 + Controller 全覆盖
 * 用途: 基于角色的访问控制，5级权限体系，权限继承，显式拒绝，多租户支持
 */

// ─── 类型定义 ────────────────────────────────────────────────────────────

export type Role = 'owner' | 'admin' | 'manager' | 'staff' | 'guest'

export type Permission =
  | 'user:read' | 'user:write' | 'user:delete' | 'user:impersonate'
  | 'order:read' | 'order:write' | 'order:refund' | 'order:cancel'
  | 'points:read' | 'points:write' | 'points:convert' | 'points:adjust'
  | 'coupon:read' | 'coupon:write' | 'coupon:issue' | 'coupon:revoke'
  | 'payment:read' | 'payment:write' | 'payment:refund'
  | 'inventory:read' | 'inventory:write' | 'inventory:transfer'
  | 'report:read' | 'report:export' | 'report:financial'
  | 'config:read' | 'config:write' | 'config:delete'
  | 'audit:read' | 'audit:export'
  | 'compliance:manage' | 'compliance:dsr'
  | 'settlement:read' | 'settlement:approve' | 'settlement:pay'

export interface RBACPolicy {
  role: Role
  permissions: Permission[]
  deniedPermissions?: Permission[]  // 显式拒绝（优先级更高）
  conditions?: Record<string, string>  // 条件限制，如 { 'resource.tenantId': 'actor.tenantId' }
}

export interface RoleAssignment {
  userId: string
  role: Role
  tenantId?: string
  assignedAt: Date
  assignedBy: string
}

// ─── 5级角色默认权限策略 ────────────────────────────────────────────────

const ROLE_DEFAULT_POLICIES: RBACPolicy[] = [
  {
    role: 'owner',
    permissions: [
      // 全部权限
      'user:read', 'user:write', 'user:delete', 'user:impersonate',
      'order:read', 'order:write', 'order:refund', 'order:cancel',
      'points:read', 'points:write', 'points:convert', 'points:adjust',
      'coupon:read', 'coupon:write', 'coupon:issue', 'coupon:revoke',
      'payment:read', 'payment:write', 'payment:refund',
      'inventory:read', 'inventory:write', 'inventory:transfer',
      'report:read', 'report:export', 'report:financial',
      'config:read', 'config:write', 'config:delete',
      'audit:read', 'audit:export',
      'compliance:manage', 'compliance:dsr',
      'settlement:read', 'settlement:approve', 'settlement:pay',
    ],
  },
  {
    role: 'admin',
    permissions: [
      // 大部分权限（不含 config:delete, user:impersonate）
      'user:read', 'user:write', 'user:delete',
      'order:read', 'order:write', 'order:refund', 'order:cancel',
      'points:read', 'points:write', 'points:convert', 'points:adjust',
      'coupon:read', 'coupon:write', 'coupon:issue', 'coupon:revoke',
      'payment:read', 'payment:write', 'payment:refund',
      'inventory:read', 'inventory:write', 'inventory:transfer',
      'report:read', 'report:export', 'report:financial',
      'config:read', 'config:write',
      'audit:read', 'audit:export',
      'compliance:manage', 'compliance:dsr',
      'settlement:read', 'settlement:approve', 'settlement:pay',
    ],
    deniedPermissions: ['config:delete', 'user:impersonate'],
  },
  {
    role: 'manager',
    permissions: [
      // 本模块权限
      'user:read', 'user:write',
      'order:read', 'order:write', 'order:refund', 'order:cancel',
      'points:read', 'points:write', 'points:convert', 'points:adjust',
      'coupon:read', 'coupon:write', 'coupon:issue', 'coupon:revoke',
      'payment:read', 'payment:write', 'payment:refund',
      'inventory:read', 'inventory:write',
      'report:read', 'report:export',
      'config:read', 'config:write',
      'audit:read',
      'settlement:read', 'settlement:approve', 'settlement:pay',
    ],
    deniedPermissions: ['compliance:manage', 'compliance:dsr', 'user:delete', 'inventory:transfer', 'report:financial'],
  },
  {
    role: 'staff',
    permissions: [
      // 查看+操作
      'order:read', 'order:write',
      'points:read', 'points:write',
      'coupon:read', 'coupon:issue',
      'payment:read',
      'inventory:read',
      'report:read',
      'audit:read',
      'settlement:read',
    ],
    deniedPermissions: ['order:refund', 'order:cancel', 'points:adjust', 'points:convert', 'coupon:revoke', 'payment:refund', 'inventory:write', 'inventory:transfer', 'report:export', 'settlement:approve', 'settlement:pay', 'user:write', 'user:delete'],
  },
  {
    role: 'guest',
    permissions: [
      // 只读
      'order:read',
      'points:read',
      'inventory:read',
      'report:read',
    ],
    deniedPermissions: ['order:write', 'points:write', 'inventory:write', 'report:export'],
  },
]

// 权限继承链：key 继承哪些 key 的权限（百分比）
const INHERITANCE_CHAIN: Record<Role, { parent: Role; percentage: number } | null> = {
  owner: null,    // 顶级，不继承
  admin: { parent: 'owner', percentage: 0.8 },   // 继承 owner 80%
  manager: { parent: 'admin', percentage: 0.5 }, // 继承 admin 50%
  staff: { parent: 'manager', percentage: 0.4 },  // 继承 manager 40%
  guest: { parent: 'staff', percentage: 0.3 },    // 继承 staff 30%
}

// ─── 核心服务 ────────────────────────────────────────────────────────────

export class RBACService {
  private policies = new Map<Role, RBACPolicy>()
  private roleAssignments = new Map<string, RoleAssignment[]>() // key: userId
  // Controller 保护动作注册表: controllerName -> methodName -> required permissions
  private protectedActions = new Map<string, Map<string, Permission[]>>()

  constructor() {
    // 初始化默认策略
    this.initializeDefaultPolicies()
  }

  private initializeDefaultPolicies(): void {
    for (const policy of ROLE_DEFAULT_POLICIES) {
      this.registerPolicy({ ...policy })
    }
  }

  // ── 角色与权限定义 ──────────────────────────────────────────────────

  /** 注册角色策略 */
  registerPolicy(policy: RBACPolicy): void {
    this.policies.set(policy.role, { ...policy })
  }

  /** 获取角色的所有权限（含 inherited）*/
  getRolePermissions(role: Role): Permission[] {
    const policy = this.policies.get(role)
    if (!policy) return []

    // 获取继承的权限
    const inherited = this.getInheritedPermissions(role)

    // 合并并去重
    const allPerms = new Set([...inherited, ...policy.permissions])

    // 移除被拒绝的权限
    const denied = new Set(policy.deniedPermissions ?? [])
    for (const p of denied) {
      allPerms.delete(p)
    }

    return Array.from(allPerms)
  }

  /** 角色是否有某权限 */
  hasPermission(role: Role, permission: Permission): boolean {
    return this.getRolePermissions(role).includes(permission)
  }

  // ── 用户角色分配 ────────────────────────────────────────────────────

  /** 分配角色 */
  assignRole(
    userId: string,
    role: Role,
    tenantId?: string,
    assignedBy: string = 'system',
  ): RoleAssignment {
    const assignment: RoleAssignment = {
      userId,
      role,
      tenantId,
      assignedAt: new Date(),
      assignedBy,
    }

    if (!this.roleAssignments.has(userId)) {
      this.roleAssignments.set(userId, [])
    }

    const assignments = this.roleAssignments.get(userId)!

    // 如果同一租户已有角色，先撤销
    const existingIdx = tenantId
      ? assignments.findIndex((a) => a.tenantId === tenantId)
      : assignments.findIndex((a) => !a.tenantId)

    if (existingIdx >= 0) {
      assignments.splice(existingIdx, 1)
    }

    assignments.push(assignment)
    return assignment
  }

  /** 撤销角色 */
  revokeRole(userId: string, tenantId?: string): void {
    const assignments = this.roleAssignments.get(userId)
    if (!assignments) return

    if (tenantId) {
      const idx = assignments.findIndex((a) => a.tenantId === tenantId)
      if (idx >= 0) assignments.splice(idx, 1)
    } else {
      // 撤销全局角色
      const idx = assignments.findIndex((a) => !a.tenantId)
      if (idx >= 0) assignments.splice(idx, 1)
    }
  }

  /** 查询用户角色 */
  getUserRoles(userId: string): RoleAssignment[] {
    return this.roleAssignments.get(userId) ?? []
  }

  /** 检查用户在某租户下是否有某权限 */
  checkPermission(userId: string, permission: Permission, tenantId?: string): boolean {
    const assignments = this.getUserRoles(userId)

    // 优先查找匹配的租户角色
    if (tenantId) {
      const tenantAssignment = assignments.find((a) => a.tenantId === tenantId)
      if (tenantAssignment) {
        return this.hasPermission(tenantAssignment.role, permission)
      }
    }

    // 回退到全局角色
    const globalAssignment = assignments.find((a) => !a.tenantId)
    if (globalAssignment) {
      return this.hasPermission(globalAssignment.role, permission)
    }

    return false
  }

  // ── 权限验证（用于 Guard/Pipe） ─────────────────────────────────────

  /** 验证请求是否有权限（throw 如果无权限）*/
  authorize(userId: string, permission: Permission, resourceTenantId?: string): void {
    if (!this.checkPermission(userId, permission, resourceTenantId)) {
      throw new RBACAuthorizationError(
        `User ${userId} does not have permission '${permission}'` +
          (resourceTenantId ? ` in tenant ${resourceTenantId}` : ''),
      )
    }
  }

  /** 生成权限报告（用于 admin）*/
  getUserPermissionReport(userId: string): {
    roles: RoleAssignment[]
    effectivePermissions: Permission[]
    deniedPermissions: Permission[]
  } {
    const roles = this.getUserRoles(userId)
    const effectivePermissions = new Set<Permission>()
    const deniedPermissions = new Set<Permission>()

    for (const assignment of roles) {
      const policy = this.policies.get(assignment.role)
      if (policy) {
        for (const p of policy.permissions) {
          effectivePermissions.add(p)
        }
        for (const p of policy.deniedPermissions ?? []) {
          deniedPermissions.add(p)
        }
      }

      // 添加继承的权限
      const inherited = this.getInheritedPermissions(assignment.role)
      for (const p of inherited) {
        effectivePermissions.add(p)
      }
    }

    // 从 effectivePermissions 中移除 deniedPermissions
    for (const p of deniedPermissions) {
      effectivePermissions.delete(p)
    }

    return {
      roles,
      effectivePermissions: Array.from(effectivePermissions),
      deniedPermissions: Array.from(deniedPermissions),
    }
  }

  // ── 权限继承 ─────────────────────────────────────────────────────────

  /** owner > admin > manager > staff > guest，下级继承上级部分权限 */
  getInheritedPermissions(role: Role): Permission[] {
    const chain = INHERITANCE_CHAIN[role]
    if (!chain) return [] // owner 不继承任何人

    const parentPermissions = this.getRolePermissions(chain.parent)
    // 根据百分比取前 N 个权限
    const count = Math.floor(parentPermissions.length * chain.percentage)
    return parentPermissions.slice(0, count)
  }

  // ── Controller 装饰器支持 ───────────────────────────────────────────

  /** 注册 Controller 的受保护动作 */
  registerProtectedActions(
    controllerName: string,
    actions: Record<string, Permission[]>,
  ): void {
    if (!this.protectedActions.has(controllerName)) {
      this.protectedActions.set(controllerName, new Map())
    }
    const methods = this.protectedActions.get(controllerName)!
    for (const [method, permissions] of Object.entries(actions)) {
      methods.set(method, permissions)
    }
  }

  /** 获取某 Controller 所有需要权限的 actions */
  getProtectedActions(controllerName: string): Map<string, Permission[]> {
    return this.protectedActions.get(controllerName) ?? new Map()
  }

  // ── 测试辅助 ─────────────────────────────────────────────────────────

  /** 清空所有角色分配（仅用于测试）*/
  __reset(): void {
    this.roleAssignments.clear()
    this.protectedActions.clear()
    this.policies.clear()
    this.initializeDefaultPolicies()
  }
}

// ─── 错误类 ────────────────────────────────────────────────────────────

export class RBACAuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RBACAuthorizationError'
  }
}
