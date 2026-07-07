import { describe, it, expect, beforeEach } from 'vitest'
import { RbacService } from './rbac.service'

/**
 * 🐜 [rbac] 角色扩展测试
 */

function setup() {
  return { rbac: new RbacService() }
}

describe('👔店长 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('创建角色', () => {
    const role = svc.rbac.createRole('supervisor', ['user.read', 'user.write'])
    expect(role.roleName).toBe('supervisor')
    expect(role.permissions).toHaveLength(2)
  })

  it('列出所有角色', () => {
    svc.rbac.createRole('admin', ['*'])
    svc.rbac.createRole('viewer', ['read'])
    const roles = svc.rbac.listRoles()
    expect(roles.length).toBeGreaterThanOrEqual(2)
  })
})

describe('🛒前台 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('为用户分配角色', () => {
    svc.rbac.assignRole('user1', 'staff')
    const roles = svc.rbac.getUserRoles('user1')
    expect(roles).toContain('staff')
  })

  it('未分配角色用户返回空列表', () => {
    const roles = svc.rbac.getUserRoles('unknown')
    expect(roles).toEqual([])
  })
})

describe('🔧安监 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('权限验证', () => {
    svc.rbac.createRole('auditor', ['audit.read'])
    svc.rbac.assignRole('user-audit', 'auditor')
    const has = svc.rbac.hasPermission('user-audit', 'audit.read')
    expect(has).toBe(true)
  })

  it('无权限拒绝', () => {
    svc.rbac.createRole('basic', ['read'])
    svc.rbac.assignRole('user-basic', 'basic')
    const has = svc.rbac.hasPermission('user-basic', 'delete')
    expect(has).toBe(false)
  })
})
