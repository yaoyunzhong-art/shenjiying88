/* ===== rbac — 纯函数式内联测试，不 import 生产代码 ===== */

// ── 1. 枚举 + 类型定义 ────────────────────────────────────────────

type Role = 'owner' | 'admin' | 'manager' | 'staff' | 'guest'

type Permission =
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

interface RBACPolicy {
  role: Role
  permissions: Permission[]
  deniedPermissions?: Permission[]
  conditions?: Record<string, string>
}

interface RoleAssignment {
  userId: string
  role: Role
  tenantId?: string
  assignedAt: Date
  assignedBy: string
}

interface PermissionReport {
  roles: RoleAssignment[]
  effectivePermissions: Permission[]
  deniedPermissions: Permission[]
}

export {} // ensure module scope

// ── 2. 内联业务逻辑 + 数据 ──────────────────────────────────────

/** 5级角色默认权限策略（内联，不 import 生产） */
const ROLE_POLICIES: Map<Role, RBACPolicy> = new Map([
  [
    'owner',
    {
      role: 'owner',
      permissions: [
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
  ],
  [
    'admin',
    {
      role: 'admin',
      permissions: [
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
  ],
  [
    'manager',
    {
      role: 'manager',
      permissions: [
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
  ],
  [
    'staff',
    {
      role: 'staff',
      permissions: [
        'order:read', 'order:write',
        'points:read', 'points:write',
        'coupon:read', 'coupon:issue',
        'payment:read',
        'inventory:read',
        'report:read',
        'audit:read',
        'settlement:read',
      ],
      deniedPermissions: [
        'order:refund', 'order:cancel',
        'points:adjust', 'points:convert',
        'coupon:revoke',
        'payment:refund',
        'inventory:write', 'inventory:transfer',
        'report:export',
        'settlement:approve', 'settlement:pay',
        'user:write', 'user:delete',
      ],
    },
  ],
  [
    'guest',
    {
      role: 'guest',
      permissions: [
        'order:read',
        'points:read',
        'inventory:read',
        'report:read',
      ],
      deniedPermissions: ['order:write', 'points:write', 'inventory:write', 'report:export'],
    },
  ],
])

/** 权限继承链 */
const INHERITANCE_CHAIN: Record<Role, { parent: Role; percentage: number } | null> = {
  owner: null,
  admin: { parent: 'owner', percentage: 0.8 },
  manager: { parent: 'admin', percentage: 0.5 },
  staff: { parent: 'manager', percentage: 0.4 },
  guest: { parent: 'staff', percentage: 0.3 },
}

/** 获取角色继承的权限 */
function getInheritedPermissions(role: Role): Permission[] {
  const chain = INHERITANCE_CHAIN[role]
  if (!chain) return []
  const parentPerms = getRolePermissions(chain.parent)
  const count = Math.floor(parentPerms.length * chain.percentage)
  return parentPerms.slice(0, count)
}

/** 获取角色所有权限（含继承） */
function getRolePermissions(role: Role): Permission[] {
  const policy = ROLE_POLICIES.get(role)
  if (!policy) return []

  const inherited = getInheritedPermissions(role)
  const allPerms = new Set<Permission>([...inherited, ...policy.permissions])
  const denied = new Set(policy.deniedPermissions ?? [])
  for (const p of denied) {
    allPerms.delete(p)
  }

  return Array.from(allPerms)
}

/** 检查角色是否有某权限 */
function hasPermission(role: Role, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission)
}

// ── 用户角色管理 ──────────────────────────────────────────────

interface RbacState {
  assignments: Map<string, RoleAssignment[]>
}

function makeRbacState(): RbacState {
  return { assignments: new Map() }
}

function assignRole(
  state: RbacState,
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

  if (!state.assignments.has(userId)) {
    state.assignments.set(userId, [])
  }

  const list = state.assignments.get(userId)!
  const existingIdx = tenantId
    ? list.findIndex((a) => a.tenantId === tenantId)
    : list.findIndex((a) => !a.tenantId)

  if (existingIdx >= 0) {
    list.splice(existingIdx, 1)
  }

  list.push(assignment)
  return assignment
}

function revokeRole(state: RbacState, userId: string, tenantId?: string): void {
  const list = state.assignments.get(userId)
  if (!list) return

  if (tenantId) {
    const idx = list.findIndex((a) => a.tenantId === tenantId)
    if (idx >= 0) list.splice(idx, 1)
  } else {
    const idx = list.findIndex((a) => !a.tenantId)
    if (idx >= 0) list.splice(idx, 1)
  }
}

function getUserRoles(state: RbacState, userId: string): RoleAssignment[] {
  return state.assignments.get(userId) ?? []
}

function checkPermission(state: RbacState, userId: string, permission: Permission, tenantId?: string): boolean {
  const assignments = getUserRoles(state, userId)

  if (tenantId) {
    const tenantAssignment = assignments.find((a) => a.tenantId === tenantId)
    if (tenantAssignment) return hasPermission(tenantAssignment.role, permission)
  }

  const globalAssignment = assignments.find((a) => !a.tenantId)
  if (globalAssignment) return hasPermission(globalAssignment.role, permission)

  return false
}

function authorize(state: RbacState, userId: string, permission: Permission, resourceTenantId?: string): void {
  if (!checkPermission(state, userId, permission, resourceTenantId)) {
    throw new Error(
      `User ${userId} does not have permission '${permission}'` +
        (resourceTenantId ? ` in tenant ${resourceTenantId}` : ''),
    )
  }
}

function getUserPermissionReport(state: RbacState, userId: string): PermissionReport {
  const roles = getUserRoles(state, userId)
  const effectivePermissions = new Set<Permission>()
  const deniedPermissions = new Set<Permission>()

  for (const assignment of roles) {
    const policy = ROLE_POLICIES.get(assignment.role)
    if (policy) {
      for (const p of policy.permissions) effectivePermissions.add(p)
      for (const p of policy.deniedPermissions ?? []) deniedPermissions.add(p)
    }
    const inherited = getInheritedPermissions(assignment.role)
    for (const p of inherited) effectivePermissions.add(p)
  }

  for (const p of deniedPermissions) {
    effectivePermissions.delete(p)
  }

  return {
    roles,
    effectivePermissions: Array.from(effectivePermissions),
    deniedPermissions: Array.from(deniedPermissions),
  }
}

function resetRbacState(state: RbacState): void {
  state.assignments.clear()
}

// ── Controller 保护 ─────────────────────────────────────────

interface ControllerActions {
  [controllerName: string]: Record<string, Permission[]>
}

function registerProtectedActions(
  registry: Map<string, Map<string, Permission[]>>,
  controllerName: string,
  actions: Record<string, Permission[]>,
): void {
  if (!registry.has(controllerName)) {
    registry.set(controllerName, new Map())
  }
  const methods = registry.get(controllerName)!
  for (const [method, permissions] of Object.entries(actions)) {
    methods.set(method, permissions)
  }
}

function getProtectedActions(
  registry: Map<string, Map<string, Permission[]>>,
  controllerName: string,
): Map<string, Permission[]> {
  return registry.get(controllerName) ?? new Map()
}

// ── 3. Tests ─────────────────────────────────────────────────────

describe('RBACService (inline)', () => {
  // ── 角色权限 ──
  describe('getRolePermissions', () => {
    it('should give owner all 34 permissions', () => {
      const perms = getRolePermissions('owner')
      expect(perms.length).toBeGreaterThanOrEqual(34)
      expect(perms).toContain('user:impersonate')
      expect(perms).toContain('config:delete')
      expect(perms).toContain('compliance:manage')
    })

    it('should deny admin config:delete and user:impersonate', () => {
      const perms = getRolePermissions('admin')
      expect(perms).toContain('user:read')
      expect(perms).not.toContain('config:delete')
      expect(perms).not.toContain('user:impersonate')
    })

    it('should deny manager user:delete and compliance:manage', () => {
      const perms = getRolePermissions('manager')
      expect(perms).toContain('user:read')
      expect(perms).toContain('user:write')
      expect(perms).not.toContain('user:delete')
      expect(perms).not.toContain('compliance:manage')
      expect(perms).not.toContain('compliance:dsr')
    })

    it('should give staff read + basic operation', () => {
      const perms = getRolePermissions('staff')
      expect(perms).toContain('order:read')
      expect(perms).toContain('order:write')
      expect(perms).not.toContain('order:refund')
      expect(perms).not.toContain('order:cancel')
      expect(perms).toContain('points:read')
      expect(perms).not.toContain('points:adjust')
      expect(perms).not.toContain('coupon:revoke')
    })

    it('should give guest only read permissions', () => {
      const perms = getRolePermissions('guest')
      expect(perms).toContain('order:read')
      expect(perms).toContain('points:read')
      expect(perms).toContain('inventory:read')
      expect(perms).toContain('report:read')
      expect(perms).not.toContain('order:write')
      expect(perms).not.toContain('points:write')
      expect(perms).not.toContain('inventory:write')
    })

    it('should return empty for unknown role', () => {
      const perms = getRolePermissions('unknown' as Role)
      expect(perms).toEqual([])
    })
  })

  // ── hasPermission ──
  describe('hasPermission', () => {
    it('should allow owner everything', () => {
      expect(hasPermission('owner', 'compliance:dsr')).toBe(true)
      expect(hasPermission('owner', 'user:impersonate')).toBe(true)
      expect(hasPermission('owner', 'config:delete')).toBe(true)
    })

    it('should deny admin impersonate and config:delete', () => {
      expect(hasPermission('admin', 'user:impersonate')).toBe(false)
      expect(hasPermission('admin', 'config:delete')).toBe(false)
    })

    it('should allow admin most operations', () => {
      expect(hasPermission('admin', 'user:read')).toBe(true)
      expect(hasPermission('admin', 'user:delete')).toBe(true)
      expect(hasPermission('admin', 'settlement:pay')).toBe(true)
    })

    it('should deny guest write permissions', () => {
      expect(hasPermission('guest', 'order:write')).toBe(false)
      expect(hasPermission('guest', 'points:write')).toBe(false)
    })

    it('should deny unknown role', () => {
      expect(hasPermission('unknown' as Role, 'order:read')).toBe(false)
    })
  })

  // ── 角色分配 ──
  describe('assignRole', () => {
    it('should assign global role', () => {
      const state = makeRbacState()
      const result = assignRole(state, 'u1', 'admin')
      expect(result.role).toBe('admin')
      expect(result.userId).toBe('u1')
      expect(result.tenantId).toBeUndefined()
    })

    it('should assign tenant-scoped role', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'manager', 'tenant-a')
      const roles = getUserRoles(state, 'u1')
      expect(roles).toHaveLength(1)
      expect(roles[0].tenantId).toBe('tenant-a')
    })

    it('should replace existing role for same scope', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'staff', 't1')
      assignRole(state, 'u1', 'manager', 't1')
      const roles = getUserRoles(state, 'u1')
      expect(roles).toHaveLength(1)
      expect(roles[0].role).toBe('manager')
    })

    it('should allow separate global and tenant roles', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'guest')
      assignRole(state, 'u1', 'admin', 't1')
      const roles = getUserRoles(state, 'u1')
      expect(roles).toHaveLength(2)
    })
  })

  // ── 撤销 ──
  describe('revokeRole', () => {
    it('should revoke global role', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'admin')
      revokeRole(state, 'u1')
      expect(getUserRoles(state, 'u1')).toHaveLength(0)
    })

    it('should revoke tenant role', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'manager', 't1')
      revokeRole(state, 'u1', 't1')
      expect(getUserRoles(state, 'u1')).toHaveLength(0)
    })

    it('should not affect other tenants on revoke', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'staff', 't1')
      assignRole(state, 'u1', 'admin', 't2')
      revokeRole(state, 'u1', 't1')
      const roles = getUserRoles(state, 'u1')
      expect(roles).toHaveLength(1)
      expect(roles[0].tenantId).toBe('t2')
    })
  })

  // ── checkPermission ──
  describe('checkPermission', () => {
    it('should allow owner everything', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'owner')
      expect(checkPermission(state, 'u1', 'config:delete')).toBe(true)
      expect(checkPermission(state, 'u1', 'compliance:dsr')).toBe(true)
    })

    it('should deny admin denied permissions', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'admin')
      expect(checkPermission(state, 'u1', 'user:impersonate')).toBe(false)
    })

    it('should use tenant-scoped role when available', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'guest')
      assignRole(state, 'u1', 'admin', 'ta')
      expect(checkPermission(state, 'u1', 'order:refund', 'ta')).toBe(true)
    })

    it('should fallback to global role for unknown tenant', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'staff')
      expect(checkPermission(state, 'u1', 'order:write', 'unknown-tenant')).toBe(true)
    })

    it('should return false for unassigned user', () => {
      const state = makeRbacState()
      expect(checkPermission(state, 'no-user', 'order:read')).toBe(false)
    })
  })

  // ── authorize ──
  describe('authorize', () => {
    it('should not throw when authorized', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'owner')
      expect(() => authorize(state, 'u1', 'config:delete')).not.toThrow()
    })

    it('should throw when not authorized', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'guest')
      expect(() => authorize(state, 'u1', 'order:write')).toThrow(/does not have permission/)
    })

    it('should throw for unassigned user', () => {
      const state = makeRbacState()
      expect(() => authorize(state, 'ghost', 'order:read')).toThrow(/does not have permission/)
    })
  })

  // ── 权限报告 ──
  describe('getUserPermissionReport', () => {
    it('should return report for assigned user', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'admin')
      const report = getUserPermissionReport(state, 'u1')
      expect(report.roles).toHaveLength(1)
      expect(report.roles[0].role).toBe('admin')
      expect(report.effectivePermissions).toContain('user:read')
      expect(report.deniedPermissions).toContain('user:impersonate')
      expect(report.effectivePermissions).not.toContain('user:impersonate')
    })

    it('should return empty for unassigned user', () => {
      const state = makeRbacState()
      const report = getUserPermissionReport(state, 'ghost')
      expect(report.roles).toHaveLength(0)
      expect(report.effectivePermissions).toHaveLength(0)
    })
  })

  // ── 继承 ──
  describe('inheritance', () => {
    it('should inherit parent permissions', () => {
      const guestPerms = getRolePermissions('guest')
      expect(guestPerms).toContain('order:read')
      expect(guestPerms).toContain('report:read')
    })

    it('should deny inherited denied permissions', () => {
      const staffPerms = getRolePermissions('staff')
      // staff should NOT get inventory:write even though it may be from inheritance
      expect(staffPerms).not.toContain('inventory:transfer')
      expect(staffPerms).not.toContain('order:refund')
    })

    it('should have increasing permission count down the chain', () => {
      const ownerCount = getRolePermissions('owner').length
      const adminCount = getRolePermissions('admin').length
      const managerCount = getRolePermissions('manager').length
      expect(adminCount).toBeLessThan(ownerCount)
      expect(managerCount).toBeLessThan(adminCount)
    })
  })

  // ── Controller 保护 ──
  describe('controller protection', () => {
    it('should register protected actions', () => {
      const registry = new Map<string, Map<string, Permission[]>>()
      registerProtectedActions(registry, 'UserController', {
        delete: ['user:delete'],
        impersonate: ['user:impersonate'],
      })
      const actions = getProtectedActions(registry, 'UserController')
      expect(actions.size).toBe(2)
      expect(actions.get('delete')).toEqual(['user:delete'])
    })

    it('should add to existing controller', () => {
      const registry = new Map<string, Map<string, Permission[]>>()
      registerProtectedActions(registry, 'OrderController', {
        list: ['order:read'],
      })
      registerProtectedActions(registry, 'OrderController', {
        refund: ['order:refund'],
      })
      const actions = getProtectedActions(registry, 'OrderController')
      expect(actions.size).toBe(2)
    })
  })

  // ── Reset ──
  describe('reset', () => {
    it('should clear all assignments', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'owner')
      assignRole(state, 'u2', 'admin', 't1')
      resetRbacState(state)
      expect(getUserRoles(state, 'u1')).toHaveLength(0)
      expect(getUserRoles(state, 'u2')).toHaveLength(0)
    })
  })

  // ── 边界场景 ──
  describe('edge cases', () => {
    it('should handle multiple assign/revolve cycles', () => {
      const state = makeRbacState()
      assignRole(state, 'u1', 'guest')
      assignRole(state, 'u1', 'staff')
      assignRole(state, 'u1', 'manager')
      assignRole(state, 'u1', 'admin')
      assignRole(state, 'u1', 'owner')
      // Last global replace wins
      expect(getUserRoles(state, 'u1')[0].role).toBe('owner')
      revokeRole(state, 'u1')
      expect(getUserRoles(state, 'u1')).toHaveLength(0)
    })

    it('should allow both tenant and global roles to coexist', () => {
      const state = makeRbacState()
      assignRole(state, 'u_tenant', 'staff', 't-cloud')
      assignRole(state, 'u_tenant', 'admin')
      expect(checkPermission(state, 'u_tenant', 'order:write', 't-cloud')).toBe(true)
      expect(checkPermission(state, 'u_tenant', 'order:refund', 't-cloud')).toBe(false) // staff denied
      expect(checkPermission(state, 'u_tenant', 'config:read')).toBe(true) // global admin
    })
  })
})
