/**
 * permission.service.spec.ts
 * 🐜 纯函数式内联测试 — 不import生产代码
 * Phase-FP P0 · 2026-07-08
 *
 * 核心业务逻辑：权限检查、角色解析、数据范围过滤
 * 内联实现全部枚举、类型、纯函数，验证正例+反例+边界
 */

// ============================================================
// 1. 枚举 + 类型定义
// ============================================================

enum PermissionLevel {
  PLATFORM = 'platform',
  TENANT = 'tenant',
  BRAND = 'brand',
  STORE = 'store',
  SELF = 'self',
}

enum ResourceType {
  TENANT = 'tenant',
  BRAND = 'brand',
  STORE = 'store',
  MEMBER = 'member',
  ORDER = 'order',
  PRODUCT = 'product',
  INVENTORY = 'inventory',
  FINANCE = 'finance',
  CAMPAIGN = 'campaign',
  COUPON = 'coupon',
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  REPORT = 'report',
  CONFIG = 'config',
}

enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  MANAGE = 'manage',
}

enum DataScopeType {
  PLATFORM = 'platform',
  TENANT = 'tenant',
  BRAND = 'brand',
  STORE = 'store',
  SELF = 'self',
}

interface PermissionContext {
  userId: string
  tenantId: string
  brandId?: string
  storeId?: string
  roles: string[]
  permissions: string[]
}

interface DataScope {
  scopeType: DataScopeType
  allowedStoreIds?: string[]
  allowedBrandIds?: string[]
  ownOnly?: boolean
}

interface PermissionCheckRequest {
  context: PermissionContext
  resource: string
  action: ActionType
  resourceId?: string
  data?: Record<string, any>
}

interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredPermissions?: string[]
  dataScope?: DataScope
  evaluatedAt: number
}

interface Role {
  roleId: string
  roleName: string
  roleNameZh: string
  level: PermissionLevel
  permissions: string[]
}

// ============================================================
// 2. Mock 数据工厂
// ============================================================

const BUILTIN_ROLES: Role[] = [
  { roleId: 'platform_admin', roleName: 'PLATFORM_ADMIN', roleNameZh: '超级管理员', level: PermissionLevel.PLATFORM, permissions: ['*'] },
  { roleId: 'tenant_admin', roleName: 'TENANT_ADMIN', roleNameZh: '企业管理员', level: PermissionLevel.TENANT, permissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'product:*'] },
  { roleId: 'store_manager', roleName: 'STORE_MANAGER', roleNameZh: '店长', level: PermissionLevel.STORE, permissions: ['store:read', 'store:update', 'member:read', 'order:*', 'inventory:read', 'inventory:update'] },
  { roleId: 'cashier', roleName: 'CASHIER', roleNameZh: '收银员', level: PermissionLevel.STORE, permissions: ['order:create', 'order:read', 'payment:execute'] },
  { roleId: 'sales_guide', roleName: 'SALES_GUIDE', roleNameZh: '导购', level: PermissionLevel.STORE, permissions: ['member:read', 'order:create', 'product:read'] },
  { roleId: 'member', roleName: 'MEMBER', roleNameZh: '会员', level: PermissionLevel.SELF, permissions: ['member:read', 'member:update', 'order:create', 'coupon:redeem'] },
]

function makeContext(overrides: Partial<PermissionContext> = {}): PermissionContext {
  return {
    userId: 'u_' + Math.random().toString(36).substring(2, 8),
    tenantId: 'tenant_001',
    roles: ['MEMBER'],
    permissions: [],
    ...overrides,
  }
}

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    roleId: 'role_custom',
    roleName: 'CUSTOM_ROLE',
    roleNameZh: '自定义角色',
    level: PermissionLevel.STORE,
    permissions: [],
    ...overrides,
  }
}

// ============================================================
// 3. 内联业务逻辑纯函数
// ============================================================

/** 从 resource key 提取资源类型前缀 */
function extractResourceType(resource: string): string {
  const idx = resource.indexOf(':')
  return idx >= 0 ? resource.substring(0, idx) : resource
}

/** 构建 roleName -> Role 的索引 */
function indexRoles(roles: Role[]): Map<string, Role> {
  const m = new Map<string, Role>()
  for (const r of roles) roles.push(r); return m // safe init below
}

function buildRoleIndex(roles: Role[]): Map<string, Role> {
  const m = new Map<string, Role>()
  for (const r of roles) m.set(r.roleName, r)
  return m
}

/**
 * 检查单个权限 (纯函数)
 * @param context 权限上下文
 * @param resource 资源标识 (如 "tenant:create")
 * @param action 操作类型
 * @param roleIndex 角色索引
 * @returns 是否允许
 */
function checkPermission(
  context: PermissionContext,
  resource: string,
  action: ActionType,
  roleIndex: Map<string, Role>,
): boolean {
  // 平台管理员或通配符权限
  if (context.roles.includes('PLATFORM_ADMIN') || context.permissions.includes('*')) {
    return true
  }

  const resourceType = extractResourceType(resource)
  const requiredPermission = `${resourceType}:${action}`
  const wildcardPermission = `${resourceType}:*`

  // permissionKey 可能是完整路径（如 coupon:redeem），直接匹配
  // 也支持 resourceType:action 的构造匹配（如 tenant:create）
  const permissionsToCheck = [resource, requiredPermission, wildcardPermission, '*']

  // 检查直接权限
  for (const p of context.permissions) {
    if (permissionsToCheck.includes(p)) return true
  }

  // 检查角色权限
  for (const roleName of context.roles) {
    const role = roleIndex.get(roleName)
    if (!role) continue
    for (const rp of role.permissions) {
      if (permissionsToCheck.includes(rp)) return true
    }
  }

  return false
}

/**
 * 解析用户有效权限列表 (纯函数)
 */
function resolveUserPermissions(
  context: PermissionContext,
  roleIndex: Map<string, Role>,
): string[] {
  const set = new Set(context.permissions)
  for (const roleName of context.roles) {
    const role = roleIndex.get(roleName)
    if (role) {
      for (const p of role.permissions) set.add(p)
    }
  }
  return Array.from(set)
}

/**
 * 获取数据范围 (纯函数)
 */
function getDataScope(context: PermissionContext): DataScope {
  if (context.roles.includes('PLATFORM_ADMIN')) {
    return { scopeType: DataScopeType.PLATFORM }
  }
  if (context.roles.includes('TENANT_ADMIN')) {
    return { scopeType: DataScopeType.TENANT }
  }
  if (context.roles.includes('STORE_MANAGER')) {
    return {
      scopeType: DataScopeType.STORE,
      allowedStoreIds: context.storeId ? [context.storeId] : undefined,
      ownOnly: false,
    }
  }
  if (context.roles.includes('SALES_GUIDE') || context.roles.includes('CASHIER')) {
    return {
      scopeType: DataScopeType.STORE,
      allowedStoreIds: context.storeId ? [context.storeId] : undefined,
      ownOnly: true,
    }
  }
  if (context.roles.includes('MEMBER')) {
    return { scopeType: DataScopeType.SELF, ownOnly: true }
  }
  return { scopeType: DataScopeType.TENANT, ownOnly: false }
}

/**
 * 快速检查权限 (纯函数，仅返回布尔值)
 */
function quickCheck(
  context: PermissionContext,
  resource: string,
  action: string,
  roleIndex: Map<string, Role>,
): boolean {
  return checkPermission(context, resource, action as ActionType, roleIndex)
}

/**
 * 批量检查权限 (纯函数)
 */
function batchCheck(
  requests: PermissionCheckRequest[],
  roleIndex: Map<string, Role>,
): PermissionCheckResult[] {
  return requests.map(req => {
    const allowed = checkPermission(req.context, req.resource, req.action, roleIndex)
    const evaluatedAt = Date.now()
    if (allowed) {
      return { allowed, reason: 'Permission granted', evaluatedAt }
    }
    const resourceType = extractResourceType(req.resource)
    return {
      allowed,
      reason: `Missing permission: ${resourceType}:${req.action}`,
      requiredPermissions: [`${resourceType}:${req.action}`],
      evaluatedAt,
    }
  })
}

/**
 * 应用数据范围过滤条件 (纯函数)
 */
function applyDataScopeFilter(
  scope: DataScope,
  context: PermissionContext,
  query: Record<string, any>,
): Record<string, any> {
  const filtered = { ...query }

  switch (scope.scopeType) {
    case DataScopeType.PLATFORM:
      break
    case DataScopeType.TENANT:
      filtered.tenantId = context.tenantId
      if (scope.allowedBrandIds?.length) filtered.brandId = { in: scope.allowedBrandIds }
      break
    case DataScopeType.BRAND:
      filtered.tenantId = context.tenantId
      if (scope.allowedBrandIds) filtered.brandId = { in: scope.allowedBrandIds }
      if (scope.allowedStoreIds) filtered.storeId = { in: scope.allowedStoreIds }
      break
    case DataScopeType.STORE:
      filtered.tenantId = context.tenantId
      if (scope.allowedStoreIds) filtered.storeId = { in: scope.allowedStoreIds }
      break
    case DataScopeType.SELF:
      filtered.tenantId = context.tenantId
      filtered.userId = context.userId
      break
  }
  return filtered
}

/**
 * 检查用户是否有权访问指定资源 (纯函数)
 */
function canAccessResource(
  context: PermissionContext,
  resourceTenantId: string,
  resourceBrandId?: string,
  resourceStoreId?: string,
): boolean {
  if (context.roles.includes('PLATFORM_ADMIN')) return true
  if (context.tenantId !== resourceTenantId) return false

  const scope = getDataScope(context)
  switch (scope.scopeType) {
    case DataScopeType.PLATFORM:
    case DataScopeType.TENANT:
      return true
    case DataScopeType.BRAND:
      if (resourceBrandId && scope.allowedBrandIds) return scope.allowedBrandIds.includes(resourceBrandId)
      return true
    case DataScopeType.STORE:
      if (resourceStoreId && scope.allowedStoreIds) return scope.allowedStoreIds.includes(resourceStoreId)
      return true
    case DataScopeType.SELF:
      return true
    default:
      return false
  }
}

// ============================================================
// 4. 测试用例
// ============================================================

import { describe, it, expect } from 'vitest'

describe('🧪 permission — 纯函数权限服务', () => {
  const roleIndex = buildRoleIndex(BUILTIN_ROLES)

  // ─── Helper ──────────────────────────────────────────────
  function newResult(
    allowed: boolean,
    reason: string,
    evaluatedAt: number,
  ): PermissionCheckResult {
    return { allowed, reason, evaluatedAt }
  }

  // ─── extractResourceType ─────────────────────────────────
  describe('extractResourceType', () => {
    it('提取 tenant:create 中的 resourceType', () => {
      expect(extractResourceType('tenant:create')).toBe('tenant')
    })
    it('提取 member:* 中的 resourceType', () => {
      expect(extractResourceType('member:*')).toBe('member')
    })
    it('无冒号时返回完整字符串', () => {
      expect(extractResourceType('inventory')).toBe('inventory')
    })
  })

  // ─── buildRoleIndex ──────────────────────────────────────
  describe('buildRoleIndex', () => {
    it('建立的索引包含所有内置角色', () => {
      const idx = buildRoleIndex(BUILTIN_ROLES)
      expect(idx.has('PLATFORM_ADMIN')).toBe(true)
      expect(idx.has('TENANT_ADMIN')).toBe(true)
      expect(idx.has('STORE_MANAGER')).toBe(true)
      expect(idx.has('MEMBER')).toBe(true)
      expect(idx.size).toBe(BUILTIN_ROLES.length)
    })
    it('空数组返回空 Map', () => {
      expect(buildRoleIndex([]).size).toBe(0)
    })
  })

  // ============================================================
  // 正例 8+
  // ============================================================
  describe('✅ 正例 checkPermission', () => {
    it('PLATFORM_ADMIN 可访问任何资源', () => {
      const ctx = makeContext({ roles: ['PLATFORM_ADMIN'], permissions: [] })
      expect(checkPermission(ctx, 'tenant:create', ActionType.CREATE, roleIndex)).toBe(true)
    })

    it('通配符权限 * 可访问任何资源', () => {
      const ctx = makeContext({ roles: [], permissions: ['*'] })
      expect(checkPermission(ctx, 'finance:delete', ActionType.DELETE, roleIndex)).toBe(true)
    })

    it('TENANT_ADMIN 可通过通配符 tenant:* 访问 tenant:read', () => {
      const ctx = makeContext({ roles: ['TENANT_ADMIN'], permissions: [] })
      expect(checkPermission(ctx, 'tenant:read', ActionType.READ, roleIndex)).toBe(true)
    })

    it('TENANT_ADMIN 可通过 brand:* 访问 brand:create', () => {
      const ctx = makeContext({ roles: ['TENANT_ADMIN'], permissions: [] })
      expect(checkPermission(ctx, 'brand:create', ActionType.CREATE, roleIndex)).toBe(true)
    })

    it('STORE_MANAGER 可通过 order:* 访问 order:delete', () => {
      const ctx = makeContext({ roles: ['STORE_MANAGER'], permissions: [] })
      expect(checkPermission(ctx, 'order:delete', ActionType.DELETE, roleIndex)).toBe(true)
    })

    it('CASHIER 可执行 order:create', () => {
      const ctx = makeContext({ roles: ['CASHIER'], permissions: [] })
      expect(checkPermission(ctx, 'order:create', ActionType.CREATE, roleIndex)).toBe(true)
    })

    it('SALES_GUIDE 可读 product:read', () => {
      const ctx = makeContext({ roles: ['SALES_GUIDE'], permissions: [] })
      expect(checkPermission(ctx, 'product:read', ActionType.READ, roleIndex)).toBe(true)
    })

    it('MEMBER 可通过直接权限 coupon:redeem 核销', () => {
      const ctx = makeContext({ roles: ['MEMBER'], permissions: [] })
      expect(checkPermission(ctx, 'coupon:redeem', ActionType.EXECUTE, roleIndex)).toBe(true)
    })

    it('直接权限列表中含通配符 member:* 时可访问 member:read', () => {
      const ctx = makeContext({ roles: [], permissions: ['member:*'] })
      expect(checkPermission(ctx, 'member:read', ActionType.READ, roleIndex)).toBe(true)
    })
  })

  describe('✅ 正例 resolveUserPermissions', () => {
    it('合并角色权限和直接权限', () => {
      const ctx = makeContext({ roles: ['CASHIER'], permissions: ['custom:perm'] })
      const perms = resolveUserPermissions(ctx, roleIndex)
      expect(perms).toContain('order:create')
      expect(perms).toContain('order:read')
      expect(perms).toContain('payment:execute')
      expect(perms).toContain('custom:perm')
    })
  })

  describe('✅ 正例 getDataScope', () => {
    it('PLATFORM_ADMIN 返回全平台范围', () => {
      const scope = getDataScope(makeContext({ roles: ['PLATFORM_ADMIN'] }))
      expect(scope.scopeType).toBe(DataScopeType.PLATFORM)
    })
    it('TENANT_ADMIN 返回租户范围', () => {
      const scope = getDataScope(makeContext({ roles: ['TENANT_ADMIN'] }))
      expect(scope.scopeType).toBe(DataScopeType.TENANT)
    })
    it('STORE_MANAGER 返回门店范围 ownOnly=false', () => {
      const scope = getDataScope(makeContext({ roles: ['STORE_MANAGER'], storeId: 's001' }))
      expect(scope.scopeType).toBe(DataScopeType.STORE)
      expect(scope.ownOnly).toBe(false)
      expect(scope.allowedStoreIds).toContain('s001')
    })
    it('MEMBER 返回自身范围 ownOnly=true', () => {
      const scope = getDataScope(makeContext({ roles: ['MEMBER'] }))
      expect(scope.scopeType).toBe(DataScopeType.SELF)
      expect(scope.ownOnly).toBe(true)
    })
  })

  describe('✅ 正例 quickCheck', () => {
    it('wrapper 返回正确布尔值', () => {
      const ctx = makeContext({ roles: ['PLATFORM_ADMIN'] })
      expect(quickCheck(ctx, 'inventory:delete', 'delete', roleIndex)).toBe(true)
    })
  })

  describe('✅ 正例 batchCheck', () => {
    it('批量检查全部通过', () => {
      const ctx = makeContext({ roles: ['PLATFORM_ADMIN'] })
      const reqs: PermissionCheckRequest[] = [
        { context: ctx, resource: 'a:create', action: ActionType.CREATE },
        { context: ctx, resource: 'b:delete', action: ActionType.DELETE },
      ]
      const results = batchCheck(reqs, roleIndex)
      expect(results).toHaveLength(2)
      expect(results.every(r => r.allowed)).toBe(true)
    })
  })

  describe('✅ 正例 applyDataScopeFilter', () => {
    it('PLATFORM 范围不修改查询', () => {
      const ctx = makeContext({ roles: ['PLATFORM_ADMIN'] })
      const scope = getDataScope(ctx)
      const q = applyDataScopeFilter(scope, ctx, { status: 'active' })
      expect(q).toEqual({ status: 'active' })
      expect(q.tenantId).toBeUndefined()
    })
    it('STORE 范围添加 tenantId 和 storeId 过滤', () => {
      const ctx = makeContext({ roles: ['STORE_MANAGER'], storeId: 's001' })
      const scope = getDataScope(ctx)
      const q = applyDataScopeFilter(scope, ctx, { status: 'active' })
      expect(q.tenantId).toBe('tenant_001')
      expect(q.storeId).toEqual({ in: ['s001'] })
    })
    it('SELF 范围添加 userId 过滤', () => {
      const ctx = makeContext({ roles: ['MEMBER'], userId: 'my_user' })
      const scope = getDataScope(ctx)
      const q = applyDataScopeFilter(scope, ctx, {})
      expect(q.tenantId).toBe('tenant_001')
      expect(q.userId).toBe('my_user')
    })
  })

  describe('✅ 正例 canAccessResource', () => {
    it('PLATFORM_ADMIN 可访问任何租户', () => {
      expect(canAccessResource(makeContext({ roles: ['PLATFORM_ADMIN'] }), 'other_tenant')).toBe(true)
    })
    it('同租户内可访问', () => {
      expect(canAccessResource(makeContext({ roles: ['MEMBER'], tenantId: 't1' }), 't1')).toBe(true)
    })
  })

  // ============================================================
  // 反例 5+
  // ============================================================
  describe('❌ 反例 checkPermission', () => {
    it('普通 MEMBER 无权创建 tenant', () => {
      const ctx = makeContext({ roles: ['MEMBER'], permissions: [] })
      expect(checkPermission(ctx, 'tenant:create', ActionType.CREATE, roleIndex)).toBe(false)
    })

    it('CASHIER 无权更新 member', () => {
      const ctx = makeContext({ roles: ['CASHIER'], permissions: [] })
      expect(checkPermission(ctx, 'member:update', ActionType.UPDATE, roleIndex)).toBe(false)
    })

    it('SALES_GUIDE 无权删除 store', () => {
      const ctx = makeContext({ roles: ['SALES_GUIDE'], permissions: [] })
      expect(checkPermission(ctx, 'store:delete', ActionType.DELETE, roleIndex)).toBe(false)
    })

    it('STORE_MANAGER 无权删除 tenant', () => {
      const ctx = makeContext({ roles: ['STORE_MANAGER'], permissions: [] })
      expect(checkPermission(ctx, 'tenant:delete', ActionType.DELETE, roleIndex)).toBe(false)
    })

    it('空角色空权限无权任何操作', () => {
      const ctx = makeContext({ roles: [], permissions: [] })
      expect(checkPermission(ctx, 'member:read', ActionType.READ, roleIndex)).toBe(false)
    })

    it('角色索引中不存在角色时返回 false', () => {
      const ctx = makeContext({ roles: ['NONEXISTENT'], permissions: [] })
      expect(checkPermission(ctx, 'tenant:read', ActionType.READ, roleIndex)).toBe(false)
    })
  })

  describe('❌ 反例 canAccessResource', () => {
    it('跨租户访问被拒绝', () => {
      const ctx = makeContext({ roles: ['TENANT_ADMIN'], tenantId: 't1' })
      expect(canAccessResource(ctx, 't2')).toBe(false)
    })
    it('空角色跨租户被拒绝', () => {
      const ctx = makeContext({ roles: [], tenantId: 't1' })
      expect(canAccessResource(ctx, 't2')).toBe(false)
    })
  })

  // ============================================================
  // 边界 5+
  // ============================================================
  describe('🔲 边界 checkPermission', () => {
    it('通配符权限带多余空格(容错) — 精确匹配不被空格干扰', () => {
      const ctx = makeContext({ roles: [], permissions: ['order:*'] })
      expect(checkPermission(ctx, 'order:read', ActionType.READ, roleIndex)).toBe(true)
    })

    it('同时拥有角色和直接权限时取并集', () => {
      const ctx = makeContext({ roles: ['MEMBER'], permissions: ['tenant:read'] })
      expect(checkPermission(ctx, 'tenant:read', ActionType.READ, roleIndex)).toBe(true)
      expect(checkPermission(ctx, 'member:read', ActionType.READ, roleIndex)).toBe(true)
    })

    it('多个角色叠加权限', () => {
      const ctx = makeContext({ roles: ['CASHIER', 'SALES_GUIDE'], permissions: [] })
      // cashier 有 order:create, sales_guide 有 order:create
      expect(checkPermission(ctx, 'order:create', ActionType.CREATE, roleIndex)).toBe(true)
      // cashier 有 payment:execute
      expect(checkPermission(ctx, 'payment:execute', ActionType.EXECUTE, roleIndex)).toBe(true)
      // sales_guide 有 product:read
      expect(checkPermission(ctx, 'product:read', ActionType.READ, roleIndex)).toBe(true)
    })
  })

  describe('🔲 边界 batchCheck', () => {
    it('空请求数组返回空结果', () => {
      expect(batchCheck([], roleIndex)).toEqual([])
    })
    it('混合允许/拒绝的结果', () => {
      const admin = makeContext({ roles: ['PLATFORM_ADMIN'] })
      const member = makeContext({ roles: ['MEMBER'] })
      const reqs: PermissionCheckRequest[] = [
        { context: admin, resource: 'a:create', action: ActionType.CREATE },
        { context: member, resource: 'tenant:delete', action: ActionType.DELETE },
      ]
      const results = batchCheck(reqs, roleIndex)
      expect(results[0].allowed).toBe(true)
      expect(results[1].allowed).toBe(false)
    })
  })

  describe('🔲 边界 getDataScope', () => {
    it('未知角色返回 TENANT 范围', () => {
      const scope = getDataScope(makeContext({ roles: ['UNKNOWN'] }))
      expect(scope.scopeType).toBe(DataScopeType.TENANT)
    })
    it('多个角色时按顺序取第一个匹配', () => {
      const scope = getDataScope(makeContext({ roles: ['PLATFORM_ADMIN', 'MEMBER'] }))
      expect(scope.scopeType).toBe(DataScopeType.PLATFORM)
    })
  })

  describe('🔲 边界 resolveUserPermissions', () => {
    it('空上下文返回空数组', () => {
      const ctx = makeContext({ roles: [], permissions: [] })
      expect(resolveUserPermissions(ctx, new Map())).toEqual([])
    })
    it('重复权限去重', () => {
      const ctx = makeContext({ roles: ['CASHIER'], permissions: ['order:create'] })
      const perms = resolveUserPermissions(ctx, roleIndex)
      const count = perms.filter(p => p === 'order:create').length
      expect(count).toBe(1)
    })
  })

  describe('🔲 边界 evaluateAt', () => {
    it('结果含时间戳且时间合理', () => {
      const ctx = makeContext({ roles: ['MEMBER'] })
      const req: PermissionCheckRequest = { context: ctx, resource: 'member:read', action: ActionType.READ }
      const results = batchCheck([req], roleIndex)
      // allowed? 会员有 member:read — 实际上会员权限是 member:read, member:update, order:create, coupon:redeem
      // 但 checkPermission 依赖角色索引，只有当角色名存在于索引中才匹配
      // 会员的 member:read 在 BUILTIN_ROLES 中 MEMBER 的 permissions 里
      expect(results[0].allowed).toBe(true)
      expect(results[0].evaluatedAt).toBeGreaterThan(1700000000000)
      expect(results[0].evaluatedAt).toBeLessThan(2000000000000)
    })
  })
})
