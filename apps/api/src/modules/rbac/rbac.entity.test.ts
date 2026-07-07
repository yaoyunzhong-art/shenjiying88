import { describe, it, expect } from 'vitest'
import { RBACRole, RBACPermission, RBACRolePermission, RBACAssignment } from './rbac.entity'

describe('RBACRole entity', () => {
  it('should create a valid RBACRole instance', () => {
    const role = new RBACRole()
    role.name = 'admin'
    role.description = 'Admin role with full access'
    role.sortOrder = 2
    role.isSystem = true
    expect(role.name).toBe('admin')
    expect(role.description).toBe('Admin role with full access')
    expect(role.sortOrder).toBe(2)
    expect(role.isSystem).toBe(true)
  })

  it('should default sortOrder to 0 and isSystem to true', () => {
    const role = new RBACRole()
    role.name = 'guest'
    expect(role.name).toBe('guest')
    expect(role.sortOrder).toBe(0)
    expect(role.isSystem).toBe(true)
  })

  it('should accept all 5 system roles', () => {
    const roles = ['owner', 'admin', 'manager', 'staff', 'guest']
    for (const name of roles) {
      const role = new RBACRole()
      role.name = name
      expect(role.name).toBe(name)
    }
  })
})

describe('RBACPermission entity', () => {
  it('should create a valid RBACPermission instance', () => {
    const perm = new RBACPermission()
    perm.action = 'order:refund'
    perm.description = 'Can refund orders'
    perm.resource = 'order'
    perm.operation = 'refund'
    expect(perm.action).toBe('order:refund')
    expect(perm.resource).toBe('order')
    expect(perm.operation).toBe('refund')
  })

  it('should support read/write/delete operations', () => {
    const ops = ['read', 'write', 'delete']
    for (const op of ops) {
      const perm = new RBACPermission()
      perm.action = `user:${op}`
      perm.resource = 'user'
      perm.operation = op
      expect(perm.operation).toBe(op)
    }
  })
})

describe('RBACRolePermission entity', () => {
  it('should create a role-permission association', () => {
    const rp = new RBACRolePermission()
    rp.roleId = 'role-1'
    rp.permissionId = 'perm-1'
    rp.isDenied = false
    expect(rp.roleId).toBe('role-1')
    expect(rp.permissionId).toBe('perm-1')
    expect(rp.isDenied).toBe(false)
  })

  it('should support denied permissions', () => {
    const rp = new RBACRolePermission()
    rp.roleId = 'role-1'
    rp.permissionId = 'perm-2'
    rp.isDenied = true
    expect(rp.isDenied).toBe(true)
  })
})

describe('RBACAssignment entity', () => {
  it('should create a valid RBACAssignment instance', () => {
    const assignment = new RBACAssignment()
    assignment.userId = 'user-1'
    assignment.roleId = 'role-admin'
    assignment.tenantId = 'tenant-a'
    assignment.assignedBy = 'owner-1'
    expect(assignment.userId).toBe('user-1')
    expect(assignment.roleId).toBe('role-admin')
    expect(assignment.tenantId).toBe('tenant-a')
    expect(assignment.assignedBy).toBe('owner-1')
  })

  it('should support global role assignment without tenant', () => {
    const assignment = new RBACAssignment()
    assignment.userId = 'user-2'
    assignment.roleId = 'role-guest'
    assignment.assignedBy = 'system'
    expect(assignment.tenantId).toBeUndefined()
  })

  it('should support multi-tenant assignments', () => {
    const tenants = ['tenant-a', 'tenant-b', 'tenant-c']
    for (const tenantId of tenants) {
      const a = new RBACAssignment()
      a.userId = 'user-1'
      a.roleId = 'role-manager'
      a.tenantId = tenantId
      expect(a.tenantId).toBe(tenantId)
    }
  })
})
