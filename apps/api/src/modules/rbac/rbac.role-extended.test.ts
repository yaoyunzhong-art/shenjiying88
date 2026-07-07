import { describe, it, expect, beforeEach } from 'vitest'
import { RBACService, type Role } from './rbac.service'

/**
 * 🐜 [rbac] 角色扩展测试
 */

function setup() {
  return { rbac: new RBACService() }
}

describe('👔店长 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('创建自定义角色策略', () => {
    svc.rbac.registerPolicy({
      role: 'admin' as Role,
      permissions: ['user:read', 'user:write', 'audit:read'],
    })
    const perms = svc.rbac.getRolePermissions('admin' as Role)
    expect(perms).toContain('user:read')
    expect(perms).toContain('user:write')
    expect(perms).toContain('audit:read')
  })

  it('列出角色的所有权限', () => {
    svc.rbac.registerPolicy({
      role: 'guest' as Role,
      permissions: ['report:read', 'order:read'],
    })
    const viewerPerms = svc.rbac.getRolePermissions('guest' as Role)
    expect(viewerPerms.length).toBeGreaterThanOrEqual(2)
    expect(viewerPerms).toContain('report:read')
  })
})

describe('🛒前台 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('为用户分配角色', () => {
    svc.rbac.assignRole('user1', 'staff')
    const assignments = svc.rbac.getUserRoles('user1')
    expect(assignments).toHaveLength(1)
    expect(assignments[0].role).toBe('staff')
    expect(assignments[0].userId).toBe('user1')
  })

  it('未分配角色用户返回空列表', () => {
    const assignments = svc.rbac.getUserRoles('unknown')
    expect(assignments).toEqual([])
  })
})

describe('🔧安监 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('权限验证 - 拥有权限通过', () => {
    svc.rbac.assignRole('user-audit', 'admin')
    const hasPerm = svc.rbac.checkPermission('user-audit', 'audit:read')
    expect(hasPerm).toBe(true)
  })

  it('无权限拒绝', () => {
    svc.rbac.assignRole('user-basic', 'guest')
    const hasPerm = svc.rbac.checkPermission('user-basic', 'config:write')
    expect(hasPerm).toBe(false)
  })
})

describe('🎮导玩员 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('staff 角色拥有基本订单和积分操作权限', () => {
    svc.rbac.assignRole('staff1', 'staff')
    expect(svc.rbac.checkPermission('staff1', 'order:read')).toBe(true)
    expect(svc.rbac.checkPermission('staff1', 'points:read')).toBe(true)
    expect(svc.rbac.checkPermission('staff1', 'points:write')).toBe(true)
  })

  it('staff 角色不能退款或删除用户', () => {
    svc.rbac.assignRole('staff1', 'staff')
    expect(svc.rbac.checkPermission('staff1', 'order:refund')).toBe(false)
    expect(svc.rbac.checkPermission('staff1', 'user:write')).toBe(false)
    expect(svc.rbac.checkPermission('staff1', 'user:delete')).toBe(false)
  })
})

describe('🎯运行专员 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('manager 可审批结算', () => {
    svc.rbac.assignRole('mgmt1', 'manager')
    expect(svc.rbac.checkPermission('mgmt1', 'settlement:approve')).toBe(true)
    expect(svc.rbac.checkPermission('mgmt1', 'settlement:pay')).toBe(true)
  })

  it('manager 不能管理合规', () => {
    svc.rbac.assignRole('mgmt2', 'manager')
    expect(svc.rbac.checkPermission('mgmt2', 'compliance:manage')).toBe(false)
  })
})

describe('🤝团建 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('多租户角色不互相干扰', () => {
    svc.rbac.assignRole('userX', 'admin', 'tenant-a')
    svc.rbac.assignRole('userX', 'guest', 'tenant-b')

    expect(svc.rbac.checkPermission('userX', 'config:write', 'tenant-a')).toBe(true)
    expect(svc.rbac.checkPermission('userX', 'config:write', 'tenant-b')).toBe(false)
  })

  it('无租户角色作为全局兜底', () => {
    svc.rbac.assignRole('userY', 'staff')
    expect(svc.rbac.checkPermission('userY', 'order:read', 'tenant-any')).toBe(true)
  })
})

describe('📢营销 rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('admin 可以管理营销和结算', () => {
    svc.rbac.assignRole('mkt-user', 'admin')
    const report = svc.rbac.getUserPermissionReport('mkt-user')
    expect(report.effectivePermissions).toContain('coupon:write')
    expect(report.effectivePermissions).toContain('settlement:approve')
    expect(report.deniedPermissions).toContain('config:delete')
  })

  it('owner 拥有全部权限', () => {
    svc.rbac.assignRole('owner-user', 'owner')
    const report = svc.rbac.getUserPermissionReport('owner-user')
    expect(report.roles).toHaveLength(1)
    expect(report.deniedPermissions).toEqual([])
  })
})

describe('👥HR rbac 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('owner 可查看审计日志', () => {
    svc.rbac.assignRole('audit-user', 'owner')
    expect(svc.rbac.checkPermission('audit-user', 'audit:export')).toBe(true)
  })

  it('guest 只能读订单不能写', () => {
    svc.rbac.assignRole('guest1', 'guest')
    expect(svc.rbac.checkPermission('guest1', 'order:read')).toBe(true)
    expect(svc.rbac.checkPermission('guest1', 'order:write')).toBe(false)
    expect(svc.rbac.checkPermission('guest1', 'inventory:write')).toBe(false)
  })
})
