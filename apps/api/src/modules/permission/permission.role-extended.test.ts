import { describe, it, expect, beforeEach } from 'vitest'
import { PermissionService } from './permission.service'
import { DataScopeService } from './data-scope.service'
import { RbacService } from './rbac.service'

/**
 * 🐜 [permission] 角色扩展测试
 */

function setup() {
  return {
    permission: new PermissionService(),
    dataScope: new DataScopeService(),
    rbac: new RbacService(),
  }
}

describe('👔店长 permission 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('检查用户权限', () => {
    const result = svc.permission.checkPermission('admin', 'system.config.read')
    expect(result).toBeDefined()
    expect(typeof result).toBe('boolean')
  })

  it('分配角色权限', () => {
    const role = svc.rbac.createRole('store_manager', ['order.read', 'order.write'])
    expect(role.roleName).toBe('store_manager')
    expect(role.permissions).toContain('order.read')
  })
})

describe('🔧安监 permission 扩展测试', () => {
  let svc: ReturnType<typeof setup>}
  beforeEach(() => { svc = setup() })

  it('数据范围过滤', () => {
    const scoped = svc.dataScope.applyScope('user-1', 'store', { all: true })
    expect(scoped).toBeDefined()
  })

  it('拒绝未授权操作', () => {
    const allowed = svc.permission.checkPermission('guest', 'admin.delete')
    expect(allowed).toBe(false)
  })
})

describe('📢营销 permission 扩展测试', () => {
  let svc: ReturnType<typeof setup>}
  beforeEach(() => { svc = setup() })

  it('为用户分配角色', () => {
    svc.rbac.assignRole('user-mkt', 'marketing')
    const roles = svc.rbac.getUserRoles('user-mkt')
    expect(roles).toContain('marketing')
  })

  it('列出所有角色', () => {
    svc.rbac.createRole('r1', ['p1'])
    svc.rbac.createRole('r2', ['p2'])
    const roles = svc.rbac.listRoles()
    expect(roles.length).toBeGreaterThanOrEqual(2)
  })
})
