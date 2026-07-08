import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [permission] [D] 合约测试
 *
 * 验证 permission 模块的实体 Shape、业务逻辑契约
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import type {
  PermissionCheckContract,
  RoleContract,
  PermissionContract,
} from './permission.contract'
import { ActionType, PermissionLevel, DataScopeType } from './permission.types'

// ─── 测试角色上下文 ──────────────────────────────────

const ADMIN_CONTEXT = {
  userId: 'user_admin',
  tenantId: 'tenant-demo',
  brandId: 'brand_001',
  storeId: 'store_001',
  roles: ['TENANT_ADMIN'],
  permissions: ['*'],
}

const STORE_MANAGER_CONTEXT = {
  userId: 'user_sm',
  tenantId: 'tenant-demo',
  storeId: 'store_001',
  roles: ['STORE_MANAGER'],
  permissions: ['store:read', 'store:update', 'order:*'],
}

const CASHIER_CONTEXT = {
  userId: 'user_cashier',
  tenantId: 'tenant-demo',
  storeId: 'store_001',
  roles: ['CASHIER'],
  permissions: ['order:create', 'order:read', 'payment:execute'],
}

const ANONYMOUS_CONTEXT = {
  userId: 'anonymous',
  tenantId: 'anonymous',
  roles: [],
  permissions: [],
}

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): PermissionService {
  const rbacService = new RbacService()
  const dataScopeService = new DataScopeService()
  return new PermissionService(rbacService, dataScopeService)
}

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[permission] 合约: 权限检查结果结构', () => {
  it('checkPermission 返回正确的 allowed 结构', () => {
    const svc = makeService()
    const result = svc.checkPermission({
      context: STORE_MANAGER_CONTEXT,
      resource: 'order',
      action: ActionType.READ,
    })
    assert.equal(result.allowed, true)
    assert.equal(typeof result.evaluatedAt, 'number')
    assert.ok(result.evaluatedAt > 0)
  })

  it('checkPermission 拒绝无权限操作', () => {
    const svc = makeService()
    const result = svc.checkPermission({
      context: CASHIER_CONTEXT,
      resource: 'finance',
      action: ActionType.READ,
    })
    assert.equal(result.allowed, false)
    assert.ok(result.reason)
    assert.ok(result.requiredPermissions)
    assert.ok(result.requiredPermissions!.length >= 1)
  })

  it('checkPermission 返回 evaluatedAt 时间戳', () => {
    const svc = makeService()
    const before = Date.now() - 100
    const result = svc.checkPermission({
      context: ADMIN_CONTEXT,
      resource: 'store',
      action: ActionType.READ,
    })
    const after = Date.now() + 100
    assert.ok(result.evaluatedAt >= before)
    assert.ok(result.evaluatedAt <= after)
  })
})

describe('[permission] 合约: admin 全权限', () => {
  it('admin 可创建任何资源', () => {
    const svc = makeService()
    const result = svc.checkPermission({
      context: ADMIN_CONTEXT,
      resource: 'tenant',
      action: ActionType.CREATE,
    })
    assert.equal(result.allowed, true)
  })

  it('admin 可删除任何资源', () => {
    const svc = makeService()
    const result = svc.checkPermission({
      context: ADMIN_CONTEXT,
      resource: 'brand',
      action: ActionType.DELETE,
    })
    assert.equal(result.allowed, true)
  })

  it('admin 获取所有角色包含所有内置角色', () => {
    const svc = makeService()
    const roles = svc.getAllRoles()
    const roleNames = roles.map((r) => r.roleName)
    assert.ok(roleNames.includes('PLATFORM_ADMIN'))
    assert.ok(roleNames.includes('TENANT_ADMIN'))
    assert.ok(roleNames.includes('STORE_MANAGER'))
    assert.ok(roleNames.includes('CASHIER'))
    assert.ok(roleNames.includes('SALES_GUIDE'))
    assert.ok(roleNames.includes('MEMBER'))
  })

  it('admin 获取所有权限返回所有内置权限', () => {
    const svc = makeService()
    const perms = svc.getAllPermissions()
    const permKeys = perms.map((p) => p.permissionKey)
    assert.ok(permKeys.includes('tenant:create'))
    assert.ok(permKeys.includes('member:*'))
    assert.ok(permKeys.includes('payment:execute'))
  })
})

describe('[permission] 合约: 拒绝匿名用户', () => {
  it('匿名用户无法读取任何资源', () => {
    const svc = makeService()
    const result = svc.checkPermission({
      context: ANONYMOUS_CONTEXT,
      resource: 'order',
      action: ActionType.READ,
    })
    assert.equal(result.allowed, false)
    assert.ok(result.reason)
  })

  it('匿名用户无法创建订单', () => {
    const svc = makeService()
    const result = svc.checkPermission({
      context: ANONYMOUS_CONTEXT,
      resource: 'order',
      action: ActionType.CREATE,
    })
    assert.equal(result.allowed, false)
  })

  it('匿名用户获取空权限列表', () => {
    const svc = makeService()
    const perms = svc.getUserPermissions(ANONYMOUS_CONTEXT)
    assert.equal(perms.length, 0)
  })
})

describe('[permission] 合约: 批量检查', () => {
  it('batchCheck 返回数组', () => {
    const svc = makeService()
    const results = svc.batchCheck([
      { context: ADMIN_CONTEXT, resource: 'order', action: ActionType.READ },
      { context: CASHIER_CONTEXT, resource: 'finance', action: ActionType.DELETE },
    ])
    assert.equal(results.length, 2)
    assert.equal(results[0].allowed, true)
    assert.equal(results[1].allowed, false)
  })

  it('batchCheck 处理空数组', () => {
    const svc = makeService()
    const results = svc.batchCheck([])
    assert.equal(results.length, 0)
  })
})

describe('[permission] 合约: quickCheck', () => {
  it('quickCheck 快速返回布尔值', () => {
    const svc = makeService()
    assert.equal(svc.quickCheck(ADMIN_CONTEXT, 'member', 'delete'), true)
    assert.equal(svc.quickCheck(ANONYMOUS_CONTEXT, 'member', 'delete'), false)
  })
})

describe('[permission] 合约: 角色结构化', () => {
  it('STORE_MANAGER 角色有 store 相关权限', () => {
    const svc = makeService()
    const roles = svc.getAllRoles()
    const smRole = roles.find((r) => r.roleName === 'STORE_MANAGER')
    assert.ok(smRole)
    assert.equal(smRole!.roleNameZh, '店长')
    assert.ok(smRole!.permissions.includes('store:read'))
    assert.ok(smRole!.permissions.includes('order:*'))
  })

  it('CASHIER 角色有支付权限', () => {
    const svc = makeService()
    const roles = svc.getAllRoles()
    const cashierRole = roles.find((r) => r.roleName === 'CASHIER')
    assert.ok(cashierRole)
    assert.ok(cashierRole!.permissions.includes('payment:execute'))
  })
})

describe('[permission] 合约: 权限集合完善性', () => {
  it('getUserPermissions 合并直接权限与角色权限', () => {
    const svc = makeService()
    const perms = svc.getUserPermissions({
      userId: 'user_mix',
      tenantId: 'tenant-demo',
      roles: ['STORE_MANAGER', 'CASHIER'],
      permissions: ['member:*'],
    })
    // CASHIER 权限
    assert.ok(perms.includes('payment:execute'))
    // STORE_MANAGER 权限
    assert.ok(perms.includes('order:*'))
    // 直接权限
    assert.ok(perms.includes('member:*'))
  })

  it('PLATFORM_ADMIN 角色包含通配权限', () => {
    const svc = makeService()
    const roles = svc.getAllRoles()
    const paRole = roles.find((r) => r.roleName === 'PLATFORM_ADMIN')
    assert.ok(paRole)
    assert.ok(paRole!.permissions.includes('*'))
  })
})
