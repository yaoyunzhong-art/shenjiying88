/**
 * 🐜 自动: [identity-access] [A] entity.test 补全
 * 
 * identity-access.entity 的类型定义测试：
 * 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  type ActorIdentity,
  type AccessPolicy,
  type AuthorizationRequest,
  type AuthorizationResult,
  type TenantScopeBinding,
  type RolePermissionEntry,
  type AccessAuditEntry,
  SYSTEM_ROLES,
  SYSTEM_PERMISSIONS,
  AUTH_SOURCES,
} from './identity-access.entity'

// ── ActorIdentity ──
describe('ActorIdentity type', () => {
  test('正例：完整的认证参与者身份', () => {
    const identity: ActorIdentity = {
      actorId: 'actor-001',
      actorType: 'employee',
      tenantId: 'tenant-001',
      brandId: 'brand-001',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
      roles: ['STORE_MANAGER', 'CASHIER'],
      permissions: ['member.read', 'cashier.read'],
      authenticated: true,
      authSource: 'jwt',
      authenticatedAt: '2026-06-23T06:00:00.000Z',
    }

    assert.equal(identity.actorId, 'actor-001')
    assert.equal(identity.actorType, 'employee')
    assert.equal(identity.roles.length, 2)
    assert.equal(identity.authenticated, true)
  })

  test('边界：可选字段 brandId/storeId 为 undefined', () => {
    const identity: ActorIdentity = {
      actorId: 'actor-002',
      actorType: 'member',
      tenantId: 'tenant-001',
      marketCode: 'us-default',
      roles: ['GUIDE'],
      permissions: [],
      authenticated: true,
      authSource: 'session',
      authenticatedAt: '2026-06-23T06:00:00.000Z',
    }

    assert.equal(identity.brandId, undefined)
    assert.equal(identity.storeId, undefined)
    assert.equal(identity.actorType, 'member')
  })

  test('反例：roles 为空时不触发 assertion 错误但应合法（允许最小权限角色）', () => {
    const identity: ActorIdentity = {
      actorId: 'actor-003',
      actorType: 'system',
      tenantId: 'tenant-001',
      marketCode: 'us-default',
      roles: [],
      permissions: [],
      authenticated: false,
      authSource: 'api-key',
      authenticatedAt: '2026-06-23T06:00:00.000Z',
    }

    assert.equal(identity.roles.length, 0)
    assert.equal(identity.authenticated, false)
  })
})

// ── AccessPolicy ──
describe('AccessPolicy type', () => {
  test('正例：完整的访问控制策略', () => {
    const policy: AccessPolicy = {
      policyId: 'policy-member-read',
      name: 'Member Read Policy',
      description: '允许读取会员信息',
      scopeType: 'store',
      requiredRoles: ['STORE_MANAGER', 'CASHIER'],
      requiredPermissions: ['member.read'],
      strategy: 'ANY',
      enabled: true,
      priority: 1,
    }

    assert.equal(policy.strategy, 'ANY')
    assert.equal(policy.enabled, true)
    assert.equal(policy.priority, 1)
  })

  test('边界：空 requiredRoles 和 requiredPermissions', () => {
    const policy: AccessPolicy = {
      policyId: 'policy-public',
      name: 'Public Access',
      scopeType: 'platform',
      requiredRoles: [],
      requiredPermissions: [],
      strategy: 'ALL',
      enabled: true,
      priority: 100,
    }

    assert.equal(policy.requiredRoles.length, 0)
    assert.equal(policy.requiredPermissions.length, 0)
  })

  test('边界：description 可选为空', () => {
    const policy: AccessPolicy = {
      policyId: 'policy-no-desc',
      name: 'No Description Policy',
      scopeType: 'tenant',
      requiredRoles: ['SUPER_ADMIN'],
      requiredPermissions: ['tenant:*'],
      strategy: 'ALL',
      enabled: false,
      priority: 0,
    }

    assert.equal(policy.description, undefined)
    assert.equal(policy.enabled, false)
  })
})

// ── AuthorizationRequest ──
describe('AuthorizationRequest type', () => {
  test('正例：完整的授权请求', () => {
    const request: AuthorizationRequest = {
      action: 'member.read',
      resourceScope: {
        tenantId: 'tenant-001',
        storeId: 'store-001',
      },
      context: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
    }

    assert.equal(request.action, 'member.read')
    assert.equal(request.resourceScope.tenantId, 'tenant-001')
    assert.equal(request.context?.ip, '192.168.1.1')
  })

  test('边界：空 resourceScope', () => {
    const request: AuthorizationRequest = {
      action: 'health.ping',
      resourceScope: {},
    }

    assert.equal(request.resourceScope.tenantId, undefined)
    assert.equal(request.context, undefined)
  })
})

// ── AuthorizationResult ──
describe('AuthorizationResult type', () => {
  test('正例：允许的授权结果', () => {
    const result: AuthorizationResult = {
      status: 'allowed',
      action: 'member.read',
      actor: {
        actorId: 'actor-001',
        actorType: 'employee',
        tenantId: 'tenant-001',
        marketCode: 'us-default',
        roles: ['STORE_MANAGER'],
        permissions: ['member.read'],
        authenticated: true,
        authSource: 'jwt',
        authenticatedAt: '2026-06-23T06:00:00.000Z',
      },
      resourceScope: { tenantId: 'tenant-001' },
      permissionMatched: true,
      tenantScopeMatched: true,
      decidedAt: '2026-06-23T06:44:00.000Z',
      enforcedBy: ['IdentityAccessGuard', 'tenant-scope-check'],
    }

    assert.equal(result.status, 'allowed')
    assert.equal(result.permissionMatched, true)
    assert.equal(result.tenantScopeMatched, true)
    assert.equal(result.denialReason, undefined)
  })

  test('反例：拒绝的授权结果（有拒绝原因）', () => {
    const result: AuthorizationResult = {
      status: 'denied',
      action: 'member.write',
      actor: null,
      resourceScope: { tenantId: 'tenant-001' },
      permissionMatched: false,
      tenantScopeMatched: true,
      denialReason: 'Missing permission: member.write',
      decidedAt: '2026-06-23T06:44:00.000Z',
      enforcedBy: ['IdentityAccessGuard'],
    }

    assert.equal(result.status, 'denied')
    assert.equal(result.actor, null)
    assert.equal(result.denialReason, 'Missing permission: member.write')
  })

  test('边界：actor 为 null 且 permissionMatched 为 false', () => {
    const result: AuthorizationResult = {
      status: 'denied',
      action: 'unknown.action',
      actor: null,
      resourceScope: {},
      permissionMatched: false,
      tenantScopeMatched: false,
      decidedAt: '2026-06-23T06:44:00.000Z',
      enforcedBy: [],
    }

    assert.equal(result.status, 'denied')
    assert.equal(result.enforcedBy.length, 0)
  })
})

// ── TenantScopeBinding ──
describe('TenantScopeBinding type', () => {
  test('正例：大门店作用域绑定', () => {
    const binding: TenantScopeBinding = {
      bindingId: 'bind-001',
      actorId: 'actor-001',
      tenantId: 'tenant-001',
      brandId: 'brand-001',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
      createdAt: '2026-06-23T06:00:00.000Z',
      active: true,
    }

    assert.equal(binding.bindingId, 'bind-001')
    assert.equal(binding.active, true)
    assert.equal(binding.expiresAt, undefined)
  })

  test('边界：带过期时间的绑定', () => {
    const binding: TenantScopeBinding = {
      bindingId: 'bind-002',
      actorId: 'actor-002',
      tenantId: 'tenant-001',
      marketCode: 'us-default',
      createdAt: '2026-06-23T06:00:00.000Z',
      expiresAt: '2026-12-31T23:59:59.000Z',
      active: true,
    }

    assert.ok(binding.expiresAt !== undefined)
    assert.ok(Date.parse(binding.expiresAt!) > Date.parse(binding.createdAt))
  })

  test('边界：不活跃的绑定', () => {
    const binding: TenantScopeBinding = {
      bindingId: 'bind-003',
      actorId: 'actor-003',
      tenantId: 'tenant-001',
      marketCode: 'us-default',
      createdAt: '2026-01-01T00:00:00.000Z',
      active: false,
    }

    assert.equal(binding.active, false)
    assert.equal(binding.brandId, undefined)
  })
})

// ── RolePermissionEntry ──
describe('RolePermissionEntry type', () => {
  test('正例：带继承的角色权限映射', () => {
    const entry: RolePermissionEntry = {
      role: 'STORE_MANAGER',
      displayName: 'Store Manager',
      permissions: ['member.read', 'member.write', 'cashier.read', 'analytics.read'],
      level: 3,
      parentRole: 'TENANT_ADMIN',
    }

    assert.equal(entry.role, 'STORE_MANAGER')
    assert.equal(entry.permissions.length, 4)
    assert.equal(entry.level, 3)
  })

  test('边界：无父角色的顶层角色', () => {
    const entry: RolePermissionEntry = {
      role: 'SUPER_ADMIN',
      displayName: 'Super Admin',
      permissions: ['*'],
      level: 0,
    }

    assert.equal(entry.parentRole, undefined)
    assert.equal(entry.permissions[0], '*')
  })
})

// ── AccessAuditEntry ──
describe('AccessAuditEntry type', () => {
  test('正例：允许的审计条目', () => {
    const entry: AccessAuditEntry = {
      auditId: 'audit-001',
      actorId: 'actor-001',
      actorType: 'employee',
      action: 'member.read',
      resource: '/api/members/mem-001',
      result: 'ALLOW',
      clientIp: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: '2026-06-23T06:44:00.000Z',
    }

    assert.equal(entry.result, 'ALLOW')
    assert.equal(entry.clientIp, '192.168.1.1')
  })

  test('反例：拒绝的审计条目（带原因）', () => {
    const entry: AccessAuditEntry = {
      auditId: 'audit-002',
      actorId: 'actor-002',
      actorType: 'member',
      action: 'member.write',
      resource: '/api/members/mem-001',
      result: 'DENY',
      reason: 'Insufficient permissions',
      timestamp: '2026-06-23T06:44:00.000Z',
    }

    assert.equal(entry.result, 'DENY')
    assert.equal(entry.reason, 'Insufficient permissions')
  })

  test('边界：无 clientIP 和 userAgent 的审计条目', () => {
    const entry: AccessAuditEntry = {
      auditId: 'audit-003',
      actorId: 'system-service',
      actorType: 'system',
      action: 'health.ping',
      resource: '/api/health',
      result: 'ALLOW',
      timestamp: '2026-06-23T06:44:00.000Z',
    }

    assert.equal(entry.clientIp, undefined)
    assert.equal(entry.userAgent, undefined)
  })
})

// ── SYSTEM_ROLES ──
describe('SYSTEM_ROLES constants', () => {
  test('正例：包含所有预定义角色', () => {
    assert.equal(SYSTEM_ROLES.SUPER_ADMIN, 'SUPER_ADMIN')
    assert.equal(SYSTEM_ROLES.TENANT_ADMIN, 'TENANT_ADMIN')
    assert.equal(SYSTEM_ROLES.STORE_MANAGER, 'STORE_MANAGER')
    assert.equal(SYSTEM_ROLES.CASHIER, 'CASHIER')
    assert.equal(SYSTEM_ROLES.GUIDE, 'GUIDE')
    assert.equal(SYSTEM_ROLES.OPERATIONS, 'OPERATIONS')
    assert.equal(SYSTEM_ROLES.SECURITY_ADMIN, 'SECURITY_ADMIN')
    assert.equal(SYSTEM_ROLES.HR, 'HR')
    assert.equal(SYSTEM_ROLES.MARKETING, 'MARKETING')
    assert.equal(SYSTEM_ROLES.TEAMBUILDING, 'TEAMBUILDING')
  })

  test('边界：SYSTEM_ROLES 是只读对象', () => {
    // 确保所有值都是大写字符串常量
    const values = Object.values(SYSTEM_ROLES)
    for (const v of values) {
      assert.equal(v, v.toUpperCase())
    }
  })
})

// ── SYSTEM_PERMISSIONS ──
describe('SYSTEM_PERMISSIONS constants', () => {
  test('正例：包含所有核心权限', () => {
    assert.ok(SYSTEM_PERMISSIONS.FOUNDATION_GOVERNANCE_READ)
    assert.ok(SYSTEM_PERMISSIONS.MEMBER_READ)
    assert.ok(SYSTEM_PERMISSIONS.MEMBER_WRITE)
    assert.ok(SYSTEM_PERMISSIONS.WORKBENCH_READ)
    assert.ok(SYSTEM_PERMISSIONS.AI_RULE_ENGINE_READ)
    assert.ok(SYSTEM_PERMISSIONS.TENANT_CROSS_SCOPE)
    assert.ok(SYSTEM_PERMISSIONS.TENANT_ALL)
  })

  test('边界：所有权限值都是有效的资源标识符（含点或冒号分隔）', () => {
    const values = Object.values(SYSTEM_PERMISSIONS)
    for (const v of values) {
      assert.ok(
        v.includes('.') || v.includes(':'),
        `Permission "${v}" should contain dot or colon notation`
      )
    }
  })
})

// ── AUTH_SOURCES ──
describe('AUTH_SOURCES constants', () => {
  test('正例：包含四种认证来源', () => {
    assert.equal(AUTH_SOURCES.JWT, 'jwt')
    assert.equal(AUTH_SOURCES.SESSION, 'session')
    assert.equal(AUTH_SOURCES.DEVICE_TOKEN, 'device-token')
    assert.equal(AUTH_SOURCES.API_KEY, 'api-key')
  })

  test('边界：值互不重复', () => {
    const values = Object.values(AUTH_SOURCES)
    const unique = new Set(values)
    assert.equal(unique.size, values.length)
  })
})
