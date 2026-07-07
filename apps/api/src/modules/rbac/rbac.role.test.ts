import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RBACService } from './rbac.service'
import type { Role, Permission, RoleAssignment } from './rbac.service'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

function makeService(): RBACService {
  return new RBACService()
}

beforeEach(() => {
  // 每次测试前重置 service
})

// ──────────── 👔 店长 ────────────
describe(`${ROLES.TenantAdmin} rbac 角色测试`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = makeService()
  })

  it('店长可以为门店分配 owner 角色（正常流程）', () => {
    // 店长场景：为一个门店分配 owner 角色
    const assignment = svc.assignRole('user-owner-01', 'owner', 'store-a', 'TenantAdmin')
    assert.equal(assignment.userId, 'user-owner-01')
    assert.equal(assignment.role, 'owner')
    assert.equal(assignment.tenantId, 'store-a')
    assert.equal(assignment.assignedBy, 'TenantAdmin')
    assert.ok(assignment.assignedAt instanceof Date)
  })

  it('店长可以分配 admin/manager 角色到门店', () => {
    svc.assignRole('user-admin-01', 'admin', 'store-a', 'TenantAdmin')
    svc.assignRole('user-mgr-01', 'manager', 'store-a', 'TenantAdmin')

    const adminRoles = svc.getUserRoles('user-admin-01')
    const mgrRoles = svc.getUserRoles('user-mgr-01')

    assert.equal(adminRoles.length, 1)
    assert.equal(adminRoles[0].role, 'admin')
    assert.equal(mgrRoles.length, 1)
    assert.equal(mgrRoles[0].role, 'manager')
  })

  it('店长可以为员工分配 staff 角色（权限边界）', () => {
    // staff 权限有限，店长分配 staff 角色并验证
    svc.assignRole('user-staff-01', 'staff', 'store-a', 'TenantAdmin')
    const perms = svc.getRolePermissions('staff')
    assert.ok(perms.includes('order:read'))
    assert.ok(perms.includes('points:read'))
    assert.ok(perms.includes('coupon:issue'))
    // staff 不应该有 refund 权限
    assert.ok(!perms.includes('order:refund'))
    assert.ok(!perms.includes('payment:refund'))
  })

  it('店长可以撤销门店内的角色（正常流程）', () => {
    svc.assignRole('user-revoke-01', 'manager', 'store-a', 'TenantAdmin')
    svc.revokeRole('user-revoke-01', 'store-a')

    const roles = svc.getUserRoles('user-revoke-01')
    const targetRole = roles.find(r => r.tenantId === 'store-a')
    assert.equal(targetRole, undefined)
  })

  it('店长可以查看用户的完整权限报告（正常流程）', () => {
    svc.assignRole('user-report-01', 'manager', 'store-a', 'TenantAdmin')
    const report = svc.getUserPermissionReport('user-report-01')

    assert.ok(report.roles.length >= 1)
    assert.ok(report.effectivePermissions.includes('order:refund'))
    assert.ok(report.effectivePermissions.includes('points:adjust'))
    // manager 的 deniedPermissions 应包含 compliance:manage
    assert.ok(report.deniedPermissions.includes('compliance:manage'))
  })

  it('店长可以为同一用户切换角色（角色覆盖边界）', () => {
    svc.assignRole('user-switch-01', 'staff', 'store-a', 'TenantAdmin')
    // 切换为 manager
    svc.assignRole('user-switch-01', 'manager', 'store-a', 'TenantAdmin')

    const roles = svc.getUserRoles('user-switch-01')
    const storeRoles = roles.filter(r => r.tenantId === 'store-a')
    assert.equal(storeRoles.length, 1)
    assert.equal(storeRoles[0].role, 'manager')
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} rbac 角色测试`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = makeService()
  })

  it('HR 可以为员工分配基础角色（正常流程）', () => {
    // HR 场景：分配 staff 角色给新员工
    const assignment = svc.assignRole('emp-001', 'staff', 'store-a', 'HR')
    assert.equal(assignment.userId, 'emp-001')
    assert.equal(assignment.role, 'staff')
    assert.equal(assignment.assignedBy, 'HR')
  })

  it('HR 可以查询员工的角色分配（正常流程）', () => {
    svc.assignRole('emp-002', 'staff', 'store-a', 'HR')
    svc.assignRole('emp-003', 'manager', 'store-a', 'HR')

    const roles002 = svc.getUserRoles('emp-002')
    const roles003 = svc.getUserRoles('emp-003')

    assert.equal(roles002.length, 1)
    assert.equal(roles002[0].role, 'staff')
    assert.equal(roles003.length, 1)
    assert.equal(roles003[0].role, 'manager')
  })

  it('HR 撤销角色后员工权限应为空（权限边界）', () => {
    svc.assignRole('emp-004', 'staff', 'store-a', 'HR')
    svc.revokeRole('emp-004', 'store-a')

    const hasPerm = svc.checkPermission('emp-004', 'order:read', 'store-a')
    assert.equal(hasPerm, false)
  })

  it('HR 分配角色时可选择门店（多门店场景）', () => {
    svc.assignRole('emp-005', 'staff', 'store-a', 'HR')
    svc.assignRole('emp-005', 'manager', 'store-b', 'HR')

    const roles = svc.getUserRoles('emp-005')
    assert.equal(roles.length, 2)
    assert.equal(roles.filter(r => r.tenantId === 'store-a').length, 1)
    assert.equal(roles.filter(r => r.tenantId === 'store-b').length, 1)
  })

  it('HR 查看不存在的用户角色应返回空数组（边界）', () => {
    const roles = svc.getUserRoles('nonexistent-user')
    assert.deepStrictEqual(roles, [])
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Ops} rbac 角色测试`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = makeService()
  })

  it('运行专员可以设置操作权限策略（正常流程）', () => {
    // Ops 场景：自定义策略
    svc.registerPolicy({
      role: 'staff',
      permissions: ['order:read', 'order:write', 'points:read'],
      deniedPermissions: ['order:refund', 'points:adjust'],
    })

    const perms = svc.getRolePermissions('staff')
    assert.ok(perms.includes('order:read'))
    assert.ok(perms.includes('order:write'))
    assert.ok(!perms.includes('order:refund'))
  })

  it('运行专员可以注册 Controller 受保护动作（正常流程）', () => {
    svc.registerProtectedActions('OrderController', {
      create: ['order:write'],
      refund: ['order:refund'],
      cancel: ['order:cancel'],
    })

    // 验证受保护动作已注册
    const actions = svc.getProtectedActions('OrderController')
    assert.equal(actions.size, 3)
    const createPerms = actions.get('create')
    assert.ok(createPerms?.includes('order:write'))
  })

  it('运行专员可以检查用户是否有操作权限（正常流程）', () => {
    svc.assignRole('op-user-01', 'staff', 'store-a', 'Ops')

    const canRead = svc.checkPermission('op-user-01', 'order:read', 'store-a')
    const canRefund = svc.checkPermission('op-user-01', 'order:refund', 'store-a')

    assert.equal(canRead, true)
    assert.equal(canRefund, false) // staff 没有 refund 权限
  })

  it('运行专员 checkPermission 未知用户应返回 false（边界）', () => {
    const result = svc.checkPermission('unknown-user', 'order:read', 'store-a')
    assert.equal(result, false)
  })

  it('运行专员 authorize 无权限用户应抛出异常（反例）', () => {
    svc.assignRole('op-user-02', 'guest', 'store-a', 'Ops')

    assert.throws(
      () => svc.authorize('op-user-02', 'order:write', 'store-a'),
      /does not have permission/
    )
  })

  it('运行专员可以获取角色权限清单（正常流程）', () => {
    const ownerPerms = svc.getRolePermissions('owner')
    const guestPerms = svc.getRolePermissions('guest')

    // owner 应拥有全部权限
    assert.ok(ownerPerms.includes('config:delete'))
    assert.ok(ownerPerms.includes('user:impersonate'))
    // guest 只有只读权限
    assert.ok(guestPerms.includes('order:read'))
    assert.ok(guestPerms.includes('points:read'))
    assert.ok(!guestPerms.includes('order:write'))
  })
})

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Safety} rbac 角色测试`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = makeService()
  })

  it('安监可以查看用户的权限审计报告（正常流程）', () => {
    svc.assignRole('audit-user-01', 'admin', 'store-a', 'SafetyAdmin')

    const report = svc.getUserPermissionReport('audit-user-01')

    // 验证报告完整性
    assert.ok(Array.isArray(report.roles))
    assert.ok(report.roles.length >= 1)
    assert.ok(report.effectivePermissions.includes('user:delete'))
    // admin 不应包含 config:delete 和 user:impersonate
    assert.ok(!report.effectivePermissions.includes('config:delete'))
    assert.ok(!report.effectivePermissions.includes('user:impersonate'))
  })

  it('安监可以检查用户是否拥有高风险权限（安全审查视角）', () => {
    svc.assignRole('audit-user-02', 'owner', 'store-a', 'SafetyAdmin')

    const report = svc.getUserPermissionReport('audit-user-02')
    // owner 拥有全部权限
    assert.ok(report.effectivePermissions.includes('config:delete'))
    assert.ok(report.effectivePermissions.includes('user:impersonate'))
    assert.ok(report.effectivePermissions.includes('payment:refund'))
    assert.ok(report.effectivePermissions.includes('compliance:manage'))
  })

  it('安监可以查看多门店的权限分配（跨门店审计）', () => {
    svc.assignRole('audit-user-03', 'admin', 'store-a', 'SafetyAdmin')
    svc.assignRole('audit-user-03', 'manager', 'store-b', 'SafetyAdmin')

    const report = svc.getUserPermissionReport('audit-user-03')
    // 应包含 admin 和 manager 的权限合并
    assert.ok(report.effectivePermissions.includes('config:write'))
    // manager 被拒绝的权限应该出现
    assert.ok(report.deniedPermissions.includes('user:delete'))
  })

  it('安监查看没有角色的用户报告应返回空数组（边界）', () => {
    const report = svc.getUserPermissionReport('no-role-user')
    assert.deepStrictEqual(report.roles, [])
    assert.deepStrictEqual(report.effectivePermissions, [])
    assert.deepStrictEqual(report.deniedPermissions, [])
  })

  it('安监可以审计角色权限继承链（权限边界）', () => {
    // 验证继承链：admin 继承 owner 80%
    const adminPerms = svc.getRolePermissions('admin')
    const ownerPerms = svc.getRolePermissions('owner')
    const inheritedCount = Math.floor(ownerPerms.length * 0.8)

    // admin 应该有自己定义的权限 + 继承的一部分 owner 权限
    assert.ok(adminPerms.length > 0)
    // admin 不应再有 config:delete
    assert.ok(!adminPerms.includes('config:delete'))
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.Reception} rbac 角色测试`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = makeService()
  })

  it('前台可以查看自己的角色分配（正常流程）', () => {
    svc.assignRole('reception-01', 'staff', 'store-a', 'TenantAdmin')

    const roles = svc.getUserRoles('reception-01')
    assert.equal(roles.length, 1)
    assert.equal(roles[0].role, 'staff')
    assert.equal(roles[0].tenantId, 'store-a')
  })

  it('前台可以检查自己的操作权限（正常流程）', () => {
    svc.assignRole('reception-02', 'staff', 'store-a', 'TenantAdmin')

    // staff 应该有 order:write（接单）
    const canWrite = svc.checkPermission('reception-02', 'order:write', 'store-a')
    assert.equal(canWrite, true)

    // staff 不应该有 order:cancel（取消订单）
    const canCancel = svc.checkPermission('reception-02', 'order:cancel', 'store-a')
    assert.equal(canCancel, false)
  })

  it('前台通过 authorize 检查无权限时抛出错误（反例）', () => {
    svc.assignRole('reception-03', 'staff', 'store-a', 'TenantAdmin')

    assert.throws(
      () => svc.authorize('reception-03', 'order:refund', 'store-a'),
      /does not have permission/
    )
  })

  it('前台查看自己的权限时门店隔离正确（边界）', () => {
    // 前台在 store-a 有 staff 角色，但在 store-b 没有角色
    svc.assignRole('reception-04', 'staff', 'store-a', 'TenantAdmin')

    const canReadA = svc.checkPermission('reception-04', 'order:read', 'store-a')
    const canReadB = svc.checkPermission('reception-04', 'order:read', 'store-b')

    assert.equal(canReadA, true)
    assert.equal(canReadB, false)
  })

  it('前台获取权限报告应包含 staff 完整能力（边缘检查）', () => {
    svc.assignRole('reception-05', 'staff', 'store-a', 'TenantAdmin')

    const report = svc.getUserPermissionReport('reception-05')
    // staff 核心权限
    assert.ok(report.effectivePermissions.includes('order:read'))
    assert.ok(report.effectivePermissions.includes('order:write'))
    assert.ok(report.effectivePermissions.includes('points:read'))
    assert.ok(report.effectivePermissions.includes('coupon:issue'))
    // staff 被拒绝的
    assert.ok(report.deniedPermissions.includes('order:refund'))
    assert.ok(report.deniedPermissions.includes('order:cancel'))
  })
})

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} rbac 角色测试`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = makeService()
  })

  it('导玩员可以查看自己的角色和权限（正常流程）', () => {
    svc.assignRole('guide-01', 'staff', 'store-a', 'TenantAdmin')

    const roles = svc.getUserRoles('guide-01')
    assert.equal(roles.length, 1)
    assert.equal(roles[0].role, 'staff')

    // 导玩员应有 points:read（查看积分）和 coupon:issue（发券）
    const canReadPoints = svc.checkPermission('guide-01', 'points:read', 'store-a')
    const canIssueCoupon = svc.checkPermission('guide-01', 'coupon:issue', 'store-a')
    assert.equal(canReadPoints, true)
    assert.equal(canIssueCoupon, true)
  })

  it('导玩员可以检查玩家积分是否可调整（权限边界）', () => {
    svc.assignRole('guide-02', 'staff', 'store-a', 'TenantAdmin')

    // staff 有 points:write，但没有 points:adjust
    const canWritePoints = svc.checkPermission('guide-02', 'points:write', 'store-a')
    const canAdjustPoints = svc.checkPermission('guide-02', 'points:adjust', 'store-a')
    assert.equal(canWritePoints, true)
    assert.equal(canAdjustPoints, false)
  })

  it('导玩员查看不存在的权限时返回 false（边界）', () => {
    svc.assignRole('guide-03', 'staff', 'store-a', 'TenantAdmin')

    const result = svc.checkPermission('guide-03', 'user:impersonate' as Permission, 'store-a')
    assert.equal(result, false)
  })

  it('导玩员可以查看 guest 访客的只读权限对比（正常流程）', () => {
    svc.assignRole('guide-04', 'staff', 'store-a', 'TenantAdmin')
    svc.assignRole('guest-01', 'guest', 'store-a', 'TenantAdmin')

    const guideSecure = svc.checkPermission('guide-04', 'user:write', 'store-a')
    const guestSecure = svc.checkPermission('guest-01', 'user:write', 'store-a')

    // 导玩员（staff）也没有 user:write 权限
    assert.equal(guideSecure, false)
    assert.equal(guestSecure, false)
  })

  it('导玩员可以通过 hasPermission 查看自己的角色能力（正常流程）', () => {
    svc.assignRole('guide-05', 'staff', 'store-a', 'TenantAdmin')

    const hasOrderWrite = svc.hasPermission('staff', 'order:write')
    const hasConfigDelete = svc.hasPermission('staff', 'config:delete')
    assert.equal(hasOrderWrite, true)
    assert.equal(hasConfigDelete, false)
  })
})
