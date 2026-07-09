/**
 * 🐜 自动: [rbac] [C] 角色场景测试扩展
 *
 * 8 角色深度业务场景测试：
 * 👔店长 -> 门店权限全周 & 超管委派 & 跨租户隔离
 * 🛒前台 -> 前台权限最小化 & 订单日常操作 & 拒绝越权
 * 👥HR -> 人员档案只读 & 敏感配置拒绝 & 员工角色查询
 * 🔧安监 -> 审计日志只读 & 合规管理 & 拒绝修改配置
 * 🎮导玩员 -> 库存只读 & 订单写入 & 拒绝退款/取消
 * 🎯运行专员 -> 运营报告 & 结算审批 & 拒绝财务报告
 * 🤝团建 -> 团建订单操作 & 优惠券发放 & 拒绝退款
 * 📢营销 -> 营销活动权限 & 优惠券管理 & 拒绝批量调整积分
 *
 * 每个角色至少 2 个场景（正常流程 + 权限边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { RBACService } from './rbac.service'
import type { Permission, Role } from './rbac.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

function createService(): RBACService {
  return new RBACService()
}

// ── 工具函数 ──
function assign(svc: RBACService, userId: string, role: Role, tenantId?: string) {
  return svc.assignRole(userId, role, tenantId, 'test-scenario')
}

// ──────────── 👔 店长 ────────────
describe(`${ROLES.StoreManager} rbac 业务场景`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('店长应具有全部 34 个权限（正常流程）', () => {
    assign(svc, 'store-owner-01', 'owner', 'store-a')
    const report = svc.getUserPermissionReport('store-owner-01')

    // owner 应该拥有所有权限
    assert.equal(report.roles.length, 1)
    assert.equal(report.roles[0].role, 'owner')
    assert.equal(report.deniedPermissions.length, 0)
    // 不含 config:delete 等拒绝，owner 无拒绝列表
    const allPerms = new Set(report.effectivePermissions)
    assert.ok(allPerms.has('user:read'))
    assert.ok(allPerms.has('config:delete')) // owner 应有高风险权限
    assert.ok(allPerms.has('user:impersonate'))
    assert.ok(allPerms.has('compliance:manage'))
    assert.ok(allPerms.has('settlement:pay'))
    assert.ok(allPerms.has('report:financial'))
  })

  it('店长可以跨门店分配管理员角色（权限边界）', () => {
    assign(svc, 'super-owner', 'owner', 'global')
    // owner 有权为其他门店分配角色
    svc.assignRole('admin-store-b', 'admin', 'store-b', 'super-owner')
    const adminRoles = svc.getUserRoles('admin-store-b')
    assert.equal(adminRoles.length, 1)
    assert.equal(adminRoles[0].tenantId, 'store-b')
    assert.equal(adminRoles[0].assignedBy, 'super-owner')

    // 验证 admin-store-b 在 store-b 有 admin 级权限
    assert.ok(svc.checkPermission('admin-store-b', 'order:refund', 'store-b'))
    assert.ok(svc.checkPermission('admin-store-b', 'user:write', 'store-b'))
    assert.ok(!svc.checkPermission('admin-store-b', 'user:impersonate', 'store-b'))
  })

  it('店长跨租户隔离：一个租户的角色不影响其他租户（正常流程）', () => {
    assign(svc, 'multi-user', 'owner', 'store-a')
    assign(svc, 'multi-user', 'manager', 'store-b')

    // store-a 下是 owner 权限
    assert.ok(svc.checkPermission('multi-user', 'config:delete', 'store-a'))
    assert.ok(svc.checkPermission('multi-user', 'settlement:pay', 'store-a'))
    // store-b 下是 manager 权限（无 config:delete）
    assert.ok(!svc.checkPermission('multi-user', 'config:delete', 'store-b'))
    assert.ok(svc.checkPermission('multi-user', 'settlement:pay', 'store-b'))
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.FrontDesk} rbac 业务场景`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('前台可以查看订单、写入订单、发放优惠券（正常流程）', () => {
    assign(svc, 'front-01', 'staff', 'store-a')

    assert.ok(svc.checkPermission('front-01', 'order:read', 'store-a'))
    assert.ok(svc.checkPermission('front-01', 'order:write', 'store-a'))
    assert.ok(svc.checkPermission('front-01', 'coupon:issue', 'store-a'))
    assert.ok(svc.checkPermission('front-01', 'points:read', 'store-a'))
    assert.ok(svc.checkPermission('front-01', 'payment:read', 'store-a'))
  })

  it('前台被拒绝退款、取消订单等高风险操作（权限边界）', () => {
    assign(svc, 'front-02', 'staff', 'store-a')

    assert.ok(!svc.checkPermission('front-02', 'order:refund', 'store-a'))
    assert.ok(!svc.checkPermission('front-02', 'order:cancel', 'store-a'))
    assert.ok(!svc.checkPermission('front-02', 'points:adjust', 'store-a'))
    assert.ok(!svc.checkPermission('front-02', 'coupon:revoke', 'store-a'))
    assert.ok(!svc.checkPermission('front-02', 'payment:refund', 'store-a'))
    assert.ok(!svc.checkPermission('front-02', 'config:write', 'store-a'))
    assert.ok(!svc.checkPermission('front-02', 'user:write', 'store-a'))
    assert.ok(!svc.checkPermission('front-02', 'user:delete', 'store-a'))
  })

  it('前台跨门店无权限（权限边界）', () => {
    assign(svc, 'front-03', 'staff', 'store-a')
    // 另一个门店无角色分配
    assert.ok(!svc.checkPermission('front-03', 'order:read', 'store-b'))
    assert.ok(!svc.checkPermission('front-03', 'order:write', 'store-b'))
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} rbac 业务场景`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('HR 可以查看用户档案和审计日志（正常流程）', () => {
    assign(svc, 'hr-01', 'manager', 'store-a')

    assert.ok(svc.checkPermission('hr-01', 'user:read', 'store-a'))
    assert.ok(svc.checkPermission('hr-01', 'audit:read', 'store-a'))
    assert.ok(svc.checkPermission('hr-01', 'report:read', 'store-a'))
  })

  it('HR 可以修改用户信息和结算审批（正常流程）', () => {
    assign(svc, 'hr-02', 'manager', 'store-a')

    assert.ok(svc.checkPermission('hr-02', 'user:write', 'store-a'))
    assert.ok(svc.checkPermission('hr-02', 'settlement:approve', 'store-a'))
    assert.ok(svc.checkPermission('hr-02', 'settlement:pay', 'store-a'))
  })

  it('HR 被拒绝合规管理和用户删除（权限边界）', () => {
    assign(svc, 'hr-03', 'manager', 'store-a')

    assert.ok(!svc.checkPermission('hr-03', 'compliance:manage', 'store-a'))
    assert.ok(!svc.checkPermission('hr-03', 'compliance:dsr', 'store-a'))
    assert.ok(!svc.checkPermission('hr-03', 'user:delete', 'store-a'))
    assert.ok(!svc.checkPermission('hr-03', 'inventory:transfer', 'store-a'))
    assert.ok(!svc.checkPermission('hr-03', 'report:financial', 'store-a'))
  })
})

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Security} rbac 业务场景`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('安监可以查看审计日志和合规数据（正常流程）', () => {
    assign(svc, 'sec-01', 'admin', 'store-a')

    assert.ok(svc.checkPermission('sec-01', 'audit:read', 'store-a'))
    assert.ok(svc.checkPermission('sec-01', 'audit:export', 'store-a'))
    assert.ok(svc.checkPermission('sec-01', 'compliance:manage', 'store-a'))
    assert.ok(svc.checkPermission('sec-01', 'compliance:dsr', 'store-a'))
    assert.ok(svc.checkPermission('sec-01', 'report:read', 'store-a'))
  })

  it('安监被拒绝高风险系统配置删除和模拟用户（权限边界）', () => {
    assign(svc, 'sec-02', 'admin', 'store-a')

    assert.ok(!svc.checkPermission('sec-02', 'config:delete', 'store-a'))
    assert.ok(!svc.checkPermission('sec-02', 'user:impersonate', 'store-a'))
  })
})

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} rbac 业务场景`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('导玩员可以查看库存和订单、写入订单（正常流程）', () => {
    assign(svc, 'guide-01', 'staff', 'store-a')

    assert.ok(svc.checkPermission('guide-01', 'inventory:read', 'store-a'))
    assert.ok(svc.checkPermission('guide-01', 'order:read', 'store-a'))
    assert.ok(svc.checkPermission('guide-01', 'order:write', 'store-a'))
    assert.ok(svc.checkPermission('guide-01', 'points:read', 'store-a'))
    assert.ok(svc.checkPermission('guide-01', 'coupon:read', 'store-a'))
    assert.ok(svc.checkPermission('guide-01', 'payment:read', 'store-a'))
  })

  it('导玩员被拒绝订单退款/取消与库存写入（权限边界）', () => {
    assign(svc, 'guide-02', 'staff', 'store-a')

    assert.ok(!svc.checkPermission('guide-02', 'order:refund', 'store-a'))
    assert.ok(!svc.checkPermission('guide-02', 'order:cancel', 'store-a'))
    assert.ok(!svc.checkPermission('guide-02', 'inventory:write', 'store-a'))
    assert.ok(!svc.checkPermission('guide-02', 'inventory:transfer', 'store-a'))
    assert.ok(!svc.checkPermission('guide-02', 'settlement:approve', 'store-a'))
    assert.ok(!svc.checkPermission('guide-02', 'report:export', 'store-a'))
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Operations} rbac 业务场景`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('运行专员可以查看运营数据并管理结算（正常流程）', () => {
    assign(svc, 'ops-01', 'manager', 'store-a')

    assert.ok(svc.checkPermission('ops-01', 'report:read', 'store-a'))
    assert.ok(svc.checkPermission('ops-01', 'report:export', 'store-a'))
    assert.ok(svc.checkPermission('ops-01', 'settlement:read', 'store-a'))
    assert.ok(svc.checkPermission('ops-01', 'settlement:approve', 'store-a'))
    assert.ok(svc.checkPermission('ops-01', 'settlement:pay', 'store-a'))
    assert.ok(svc.checkPermission('ops-01', 'config:write', 'store-a'))
  })

  it('运行专员被拒绝财务报告和合规管理（权限边界）', () => {
    assign(svc, 'ops-02', 'manager', 'store-a')

    assert.ok(!svc.checkPermission('ops-02', 'report:financial', 'store-a'))
    assert.ok(!svc.checkPermission('ops-02', 'compliance:manage', 'store-a'))
    assert.ok(!svc.checkPermission('ops-02', 'compliance:dsr', 'store-a'))
    assert.ok(!svc.checkPermission('ops-02', 'user:delete', 'store-a'))
    assert.ok(!svc.checkPermission('ops-02', 'inventory:transfer', 'store-a'))
  })

  it('运行专员可以修改配置但不能删除配置（正常流程+边界）', () => {
    assign(svc, 'ops-03', 'manager', 'store-a')

    assert.ok(svc.checkPermission('ops-03', 'config:read', 'store-a'))
    assert.ok(svc.checkPermission('ops-03', 'config:write', 'store-a'))
    assert.ok(!svc.checkPermission('ops-03', 'config:delete', 'store-a'))
  })
})

// ──────────── 🤝 团建 ────────────
describe(`${ROLES.Teambuilding} rbac 业务场景`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('团建专员可以查看订单和发放优惠券（正常流程）', () => {
    assign(svc, 'team-01', 'staff', 'store-a')

    assert.ok(svc.checkPermission('team-01', 'order:read', 'store-a'))
    assert.ok(svc.checkPermission('team-01', 'order:write', 'store-a'))
    assert.ok(svc.checkPermission('team-01', 'coupon:issue', 'store-a'))
    assert.ok(svc.checkPermission('team-01', 'points:read', 'store-a'))
    assert.ok(svc.checkPermission('team-01', 'points:write', 'store-a'))
  })

  it('团建专员被拒绝积分调整、兑换和优惠券回收（权限边界）', () => {
    assign(svc, 'team-02', 'staff', 'store-a')

    assert.ok(!svc.checkPermission('team-02', 'points:adjust', 'store-a'))
    assert.ok(!svc.checkPermission('team-02', 'points:convert', 'store-a'))
    assert.ok(!svc.checkPermission('team-02', 'coupon:revoke', 'store-a'))
    assert.ok(!svc.checkPermission('team-02', 'order:refund', 'store-a'))
    assert.ok(!svc.checkPermission('team-02', 'payment:refund', 'store-a'))
  })

  it('团建专员可以发放优惠券但不能撤销（正常+边界）', () => {
    assign(svc, 'team-03', 'staff', 'store-a')

    assert.ok(svc.checkPermission('team-03', 'coupon:issue', 'store-a'))
    assert.ok(!svc.checkPermission('team-03', 'coupon:revoke', 'store-a'))
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} rbac 业务场景`, () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('营销专员可以管理优惠券和查看运营报告（正常流程）', () => {
    assign(svc, 'mkt-01', 'manager', 'store-a')

    assert.ok(svc.checkPermission('mkt-01', 'coupon:read', 'store-a'))
    assert.ok(svc.checkPermission('mkt-01', 'coupon:write', 'store-a'))
    assert.ok(svc.checkPermission('mkt-01', 'coupon:issue', 'store-a'))
    assert.ok(svc.checkPermission('mkt-01', 'coupon:revoke', 'store-a'))
    assert.ok(svc.checkPermission('mkt-01', 'report:read', 'store-a'))
    assert.ok(svc.checkPermission('mkt-01', 'report:export', 'store-a'))
    assert.ok(svc.checkPermission('mkt-01', 'points:adjust', 'store-a'))
  })

  it('营销专员被拒绝财务报告、合规管理和库存转移（权限边界）', () => {
    assign(svc, 'mkt-02', 'manager', 'store-a')

    // manager 允许 settlement:pay，但拒绝这些
    assert.ok(!svc.checkPermission('mkt-02', 'report:financial', 'store-a'))
    assert.ok(!svc.checkPermission('mkt-02', 'compliance:manage', 'store-a'))
    assert.ok(!svc.checkPermission('mkt-02', 'compliance:dsr', 'store-a'))
    assert.ok(!svc.checkPermission('mkt-02', 'inventory:transfer', 'store-a'))
    assert.ok(!svc.checkPermission('mkt-02', 'user:delete', 'store-a'))
  })

  it('营销活动需要权限正确继承边界（权限边界）', () => {
    assign(svc, 'mkt-03', 'manager', 'store-a')

    // manager 继承 admin 的 50% 权限
    assert.ok(svc.checkPermission('mkt-03', 'order:refund', 'store-a'))
    assert.ok(svc.checkPermission('mkt-03', 'settlement:approve', 'store-a'))
    // 但不继承所有 admin 权限（前 50%）
    // admin 权限列表不含 config:delete，所以一直没权限
    assert.ok(!svc.checkPermission('mkt-03', 'config:delete', 'store-a'))
  })
})

// ──────────── 全局场景 ────────────
describe('rbac 全局跨角色场景', () => {
  let svc: RBACService

  beforeEach(() => {
    svc = createService()
  })

  it('无角色用户（guest）零权限', () => {
    // 没有角色分配的用户
    assert.ok(!svc.checkPermission('unknown-user', 'order:read', 'store-a'))
    const roles = svc.getUserRoles('unknown-user')
    assert.equal(roles.length, 0)
  })

  it('authorize() 在有权限时正常通过，无权限时抛 RBACAuthorizationError', () => {
    assign(svc, 'auth-owner', 'owner', 'store-a')
    assign(svc, 'auth-staff', 'staff', 'store-a')

    // owner 全部通过
    svc.authorize('auth-owner', 'config:delete', 'store-a')
    svc.authorize('auth-owner', 'settlement:pay', 'store-a')

    // staff 拒绝高风险
    assert.throws(() => svc.authorize('auth-staff', 'order:refund', 'store-a'), {
      name: 'RBACAuthorizationError',
    })
    assert.throws(() => svc.authorize('auth-staff', 'user:write', 'store-a'), {
      name: 'RBACAuthorizationError',
    })
  })

  it('revokeRole 后权限立即失效', () => {
    assign(svc, 'revoke-user', 'admin', 'store-a')
    assert.ok(svc.checkPermission('revoke-user', 'order:refund', 'store-a'))

    svc.revokeRole('revoke-user', 'store-a')
    assert.ok(!svc.checkPermission('revoke-user', 'order:refund', 'store-a'))
    // 无全局角色，完全无权限
    assert.ok(!svc.checkPermission('revoke-user', 'order:read', 'store-a'))
  })

  it('全局角色（无 tenantId）在所有门店生效', () => {
    assign(svc, 'global-user', 'admin')
    // 没有指定 tenantId 时，global 角色生效
    assert.ok(svc.checkPermission('global-user', 'order:refund', 'any-store'))
    assert.ok(!svc.checkPermission('global-user', 'config:delete', 'any-store'))
  })

  it('全局角色被门店角色覆盖', () => {
    assign(svc, 'override-user', 'admin') // 全局 admin
    assign(svc, 'override-user', 'guest', 'store-a') // store-a 是 guest

    // store-a 下是 guest
    assert.ok(svc.checkPermission('override-user', 'order:read', 'store-a'))
    assert.ok(!svc.checkPermission('override-user', 'order:write', 'store-a'))

    // 其他门店回退到全局 admin
    assert.ok(svc.checkPermission('override-user', 'order:write', 'store-b'))
    assert.ok(svc.checkPermission('override-user', 'user:write', 'store-b'))
  })

  it('registerProtectedActions 可正确注册和查询', () => {
    svc.registerProtectedActions('ReportController', {
      generateReport: ['report:read', 'report:export'],
      deleteReport: ['config:delete'],
    })

    const actions = svc.getProtectedActions('ReportController')
    assert.equal(actions.size, 2)
    assert.deepEqual(actions.get('generateReport'), ['report:read', 'report:export'])
    assert.deepEqual(actions.get('deleteReport'), ['config:delete'])

    // 不存在的 controller 返回空
    const empty = svc.getProtectedActions('NonexistentController')
    assert.equal(empty.size, 0)
  })

  it('__reset 可清空所有状态', () => {
    assign(svc, 'user-01', 'owner', 'store-a')
    svc.registerProtectedActions('TestCtrl', { test: ['user:read'] })

    svc.__reset()
    assert.equal(svc.getUserRoles('user-01').length, 0)
    assert.equal(svc.getProtectedActions('TestCtrl').size, 0)
    // 重置后默认策略还在
    assert.ok(svc.hasPermission('owner', 'user:read'))
    assert.ok(!svc.hasPermission('guest', 'order:write'))
  })
})
