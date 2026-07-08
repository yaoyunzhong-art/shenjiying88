import { describe, it, expect, beforeEach } from 'vitest'
import { PermissionService } from './permission.service'
import { DataScopeService } from './data-scope.service'
import { RbacService } from './rbac.service'
import type { PermissionContext } from './permission.types'
import { ActionType } from './permission.types'

/**
 * 🐜 [permission] 角色扩展测试
 */

function getStoreManagerContext(): PermissionContext {
  return {
    userId: 'store-mgr-01',
    tenantId: 't1',
    brandId: 'b1',
    storeId: 's1',
    roles: ['STORE_MANAGER'],
    permissions: ['store:read', 'store:update', 'member:read', 'order:*', 'inventory:read', 'inventory:update'],
  }
}

function getGuestContext(): PermissionContext {
  return {
    userId: 'guest-01',
    tenantId: 't1',
    roles: [],
    permissions: [],
  }
}

function setup() {
  const rbac = new RbacService()
  const dataScope = new DataScopeService()
  return {
    permission: new PermissionService(rbac, dataScope),
    dataScope,
    rbac,
  }
}

describe('👔店长 permission 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('店长权限通过 RBAC 检查', () => {
    const ctx = getStoreManagerContext()
    // RbacService.checkPermission takes (context, resource, action)
    const result = svc.rbac.checkPermission(ctx, 'order', ActionType.READ)
    expect(result.allowed).toBe(true)
  })

  it('店长可以读取门店信息', () => {
    const ctx = getStoreManagerContext()
    const result = svc.rbac.checkPermission(ctx, 'store', ActionType.READ)
    expect(result.allowed).toBe(true)
  })
})

describe('🔧安监 permission 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('安监无法访问门店写入权限', () => {
    const ctx = getGuestContext()
    const result = svc.rbac.checkPermission(ctx, 'store', ActionType.UPDATE)
    expect(result.allowed).toBe(false)
  })

  it('拒绝未授权操作', () => {
    const ctx = getGuestContext()
    const result = svc.rbac.checkPermission(ctx, 'admin', ActionType.DELETE)
    expect(result.allowed).toBe(false)
  })
})

describe('📢营销 permission 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('为用户分配角色', () => {
    svc.rbac.assignRole('user-mkt', 'STORE_MANAGER')
    const roles = svc.rbac.getUserRoles('user-mkt')
    const roleNames = roles.map(r => r.roleName)
    expect(roleNames).toContain('STORE_MANAGER')
  })

  it('获取已存在的内置角色信息', () => {
    const role = svc.rbac.getRole('STORE_MANAGER')
    expect(role).toBeDefined()
    expect(role!.roleName).toBe('STORE_MANAGER')
  })
})
