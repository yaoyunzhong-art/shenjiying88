/**
 * permission.role-extended.test.ts
 * 🐜 自动: [permission] [C] 角色测试 - 8 角色扩展权限边界测试
 *
 * 基于 PermissionController.TEST_ROLE_CONTEXTS 的 8 个角色上下文:
 * 👔 店长 (storeManager)   🛒 前台 (cashier)     👥 HR (hr)
 * 🔧 安监 (security)       🎮 导玩员 (salesGuide) 🎯 运行专员 (ops)
 * 🤝 团建 (teamBuilder)    📢 营销 (marketing)
 *
 * 每个角色 ≥ 2 用例: 正常流程 + 权限边界/禁止操作
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import { ForbiddenException } from '@nestjs/common'

// ─── Helper ───────────────────────────────────────────────────

function createController(): PermissionController {
  const rbac = new RbacService()
  const dataScope = new DataScopeService()
  const svc = new PermissionService(rbac, dataScope)
  return new PermissionController(svc)
}

function bearer(roleKey: string): string {
  return `Bearer ${roleKey}`
}

// ─── 辅助: 期望权限检查通过 ──────────────────────────────────

async function assertAllowed(
  ctrl: PermissionController,
  resource: string,
  action: string,
  token: string,
  resourceId?: string,
) {
  const res = await ctrl.checkPermission({ resource, action, resourceId }, token)
  expect(res.success).toBe(true)
  expect(res.data!.allowed).toBe(true)
}

// ─── 辅助: 期望权限检查被拒绝 ────────────────────────────────

async function assertForbidden(
  ctrl: PermissionController,
  resource: string,
  action: string,
  token: string,
  resourceId?: string,
) {
  await expect(
    ctrl.checkPermission({ resource, action, resourceId }, token),
  ).rejects.toThrow(ForbiddenException)
}

// ─── 辅助: 期望 my 接口返回角色清单 ──────────────────────────

async function assertMyContainsRole(
  ctrl: PermissionController,
  token: string,
  roleName: string,
) {
  const res = await ctrl.getMyPermissions(token)
  expect(res.success).toBe(true)
  expect(res.data.context.roles).toContain(roleName)
}

// ═══════════════════════════════════════════════════════════════
// 👔 店长 (storeManager) - 门店运营管理
// ═══════════════════════════════════════════════════════════════

describe('👔 店长｜storeManager - 门店运营权限', () => {
  let ctrl: PermissionController
  const token = bearer('storeManager')

  beforeEach(() => { ctrl = createController() })

  it('STORE-MGR-1 店长应能读取门店信息（store:read）', async () => {
    await assertAllowed(ctrl, 'store', 'read', token)
  })

  it('STORE-MGR-2 店长应能更新门店信息（store:update）', async () => {
    await assertAllowed(ctrl, 'store', 'update', token)
  })

  it('STORE-MGR-3 店长应能读取库存（inventory:*）', async () => {
    await assertAllowed(ctrl, 'inventory', 'read', token)
  })

  it('STORE-MGR-4 店长应能创建订单（order:*）', async () => {
    await assertAllowed(ctrl, 'order', 'create', token)
  })

  it('STORE-MGR-5 店长应能查看报告（report:read）', async () => {
    await assertAllowed(ctrl, 'report', 'read', token)
  })

  it('STORE-MGR-6 边界: 店长不应能删除租户（tenant:*）', async () => {
    await assertForbidden(ctrl, 'tenant', 'delete', token)
  })

  it('STORE-MGR-7 边界: 店长不应能管理用户角色（user:*）', async () => {
    await assertForbidden(ctrl, 'user', 'create', token)
  })

  it('STORE-MGR-8 边界: 店长不应能创建营销活动全局配置（campaign:manage）', async () => {
    await assertForbidden(ctrl, 'campaign', 'manage', token)
  })

  it('STORE-MGR-9 店长 my 接口应返回 STORE_MANAGER 角色', async () => {
    await assertMyContainsRole(ctrl, token, 'STORE_MANAGER')
  })

  it('STORE-MGR-10 批量: 店长应能同时通过门店+库存+订单检查', async () => {
    const res = await ctrl.batchCheckPermission(
      { checks: [
        { resource: 'store', action: 'read' },
        { resource: 'inventory', action: 'read' },
        { resource: 'order', action: 'read' },
        { resource: 'product', action: 'read' },
      ]},
      token,
    )
    expect(res.success).toBe(true)
    expect(res.data.length).toBe(4)
    res.data.forEach((r: any) => expect(r.allowed).toBe(true))
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒 前台 (cashier) - 收银与订单操作
// ═══════════════════════════════════════════════════════════════

describe('🛒 前台｜cashier - 收银权限', () => {
  let ctrl: PermissionController
  const token = bearer('cashier')

  beforeEach(() => { ctrl = createController() })

  it('CASHIER-1 前台应能创建订单（order:create）', async () => {
    await assertAllowed(ctrl, 'order', 'create', token)
  })

  it('CASHIER-2 前台应能读取订单（order:read）', async () => {
    await assertAllowed(ctrl, 'order', 'read', token)
  })

  it('CASHIER-3 前台应能更新订单（order:update）', async () => {
    await assertAllowed(ctrl, 'order', 'update', token)
  })

  it('CASHIER-4 前台应能创建支付（payment:create）', async () => {
    await assertAllowed(ctrl, 'payment', 'create', token)
  })

  it('CASHIER-5 前台应能读取会员信息（member:read）', async () => {
    await assertAllowed(ctrl, 'member', 'read', token)
  })

  it('CASHIER-6 边界: 前台不应能删除订单', async () => {
    await assertForbidden(ctrl, 'order', 'delete', token)
  })

  it('CASHIER-7 边界: 前台不应能管理库存', async () => {
    await assertForbidden(ctrl, 'inventory', 'manage', token)
  })

  it('CASHIER-8 边界: 前台不应能配置门店', async () => {
    await assertForbidden(ctrl, 'store', 'delete', token)
  })

  it('CASHIER-9 前台 my 接口应返回 CASHIER 角色', async () => {
    await assertMyContainsRole(ctrl, token, 'CASHIER')
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥 HR (hr) - 人事管理
// ═══════════════════════════════════════════════════════════════

describe('👥 HR｜hr - 人事权限', () => {
  let ctrl: PermissionController
  const token = bearer('hr')

  beforeEach(() => { ctrl = createController() })

  it('HR-1 HR 应能创建用户（user:create）', async () => {
    await assertAllowed(ctrl, 'user', 'create', token)
  })

  it('HR-2 HR 应能更新用户（user:update）', async () => {
    await assertAllowed(ctrl, 'user', 'update', token)
  })

  it('HR-3 HR 应能读取用户清单（user:read）', async () => {
    await assertAllowed(ctrl, 'user', 'read', token)
  })

  it('HR-4 HR 应能读取用户清单', async () => {
    await assertAllowed(ctrl, 'user', 'read', token)
  })

  it('HR-5 边界: HR 不应能操作订单', async () => {
    await assertForbidden(ctrl, 'order', 'create', token)
  })

  it('HR-6 边界: HR 不应能操作库存', async () => {
    await assertForbidden(ctrl, 'inventory', 'delete', token)
  })

  it('HR-7 边界: HR 不应能删除门店', async () => {
    await assertForbidden(ctrl, 'store', 'delete', token)
  })

  it('HR-8 HR my 接口应返回 HR 角色', async () => {
    await assertMyContainsRole(ctrl, token, 'HR')
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧 安监 (security) - 安全审计
// ═══════════════════════════════════════════════════════════════

describe('🔧 安监｜security - 安全审计权限', () => {
  let ctrl: PermissionController
  const token = bearer('security')

  beforeEach(() => { ctrl = createController() })

  it('SEC-1 安监应能读取审计日志（audit:read）', async () => {
    await assertAllowed(ctrl, 'audit', 'read', token)
  })

  it('SEC-2 安监应能读取报告（report:read）', async () => {
    await assertAllowed(ctrl, 'report', 'read', token)
  })

  it('SEC-3 安监应能读取门店信息（store:read）', async () => {
    await assertAllowed(ctrl, 'store', 'read', token)
  })

  it('SEC-4 安监应能读取用户信息（user:read）', async () => {
    await assertAllowed(ctrl, 'user', 'read', token)
  })

  it('SEC-5 安监应能读取库存（inventory:read）', async () => {
    await assertAllowed(ctrl, 'inventory', 'read', token)
  })

  it('SEC-6 边界: 安监不应能写入审计日志', async () => {
    await assertForbidden(ctrl, 'audit', 'create', token)
  })

  it('SEC-7 边界: 安监不应能创建订单', async () => {
    await assertForbidden(ctrl, 'order', 'create', token)
  })

  it('SEC-8 边界: 安监不应能管理用户角色', async () => {
    await assertForbidden(ctrl, 'role', 'manage', token)
  })

  it('SEC-9 安监 my 接口应返回 SECURITY 角色', async () => {
    await assertMyContainsRole(ctrl, token, 'SECURITY')
  })

  it('SEC-10 批量: 安监查看审计+门店+报告应全部通过', async () => {
    const res = await ctrl.batchCheckPermission(
      { checks: [
        { resource: 'audit', action: 'read' },
        { resource: 'store', action: 'read' },
        { resource: 'user', action: 'read' },
      ]},
      token,
    )
    expect(res.success).toBe(true)
    expect(res.data.length).toBe(3)
    res.data.forEach((r: any) => expect(r.allowed).toBe(true))
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮 导玩员 (salesGuide) - 会员服务与开单
// ═══════════════════════════════════════════════════════════════

describe('🎮 导玩员｜salesGuide - 会员权限', () => {
  let ctrl: PermissionController
  const token = bearer('salesGuide')

  beforeEach(() => { ctrl = createController() })

  it('GUIDE-1 导玩员应能读取会员信息（member:read）', async () => {
    await assertAllowed(ctrl, 'member', 'read', token)
  })

  it('GUIDE-2 导玩员应能创建订单（order:create）', async () => {
    await assertAllowed(ctrl, 'order', 'create', token)
  })

  it('GUIDE-3 导玩员应能读取产品（product:read）', async () => {
    await assertAllowed(ctrl, 'product', 'read', token)
  })

  it('GUIDE-4 边界: 导玩员不应能更新门店信息', async () => {
    await assertForbidden(ctrl, 'store', 'update', token)
  })

  it('GUIDE-5 边界: 导玩员不应能管理用户', async () => {
    await assertForbidden(ctrl, 'user', 'manage', token)
  })

  it('GUIDE-6 边界: 导玩员不应能查看库存', async () => {
    await assertForbidden(ctrl, 'inventory', 'read', token)
  })

  it('GUIDE-7 导玩员 my 接口应返回 SALES_GUIDE 角色', async () => {
    await assertMyContainsRole(ctrl, token, 'SALES_GUIDE')
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯 运行专员 (ops) - 运维与租户全局管理
// ═══════════════════════════════════════════════════════════════

describe('🎯 运行专员｜ops - 运维权限', () => {
  let ctrl: PermissionController
  const token = bearer('ops')

  beforeEach(() => { ctrl = createController() })

  it('OPS-1 运行专员应能操作租户配置（tenant:*）', async () => {
    await assertAllowed(ctrl, 'tenant', 'read', token)
    await assertAllowed(ctrl, 'tenant', 'update', token)
  })

  it('OPS-2 运行专员应能管理配置（config:*）', async () => {
    await assertAllowed(ctrl, 'config', 'read', token)
    await assertAllowed(ctrl, 'config', 'update', token)
  })

  it('OPS-3 运行专员应能查看监控（monitor:*）', async () => {
    await assertAllowed(ctrl, 'monitor', 'read', token)
  })

  it('OPS-4 运行专员应能查看报告（report:*）', async () => {
    await assertAllowed(ctrl, 'report', 'read', token)
  })

  it('OPS-5 运行专员应能操作订单（TENANT_ADMIN 角色含 order:*）', async () => {
    await assertAllowed(ctrl, 'order', 'create', token)
  })

  it('OPS-6 运行专员应能管理会员（TENANT_ADMIN 角色含 member:*）', async () => {
    await assertAllowed(ctrl, 'member', 'create', token)
  })

  it('OPS-7 运行专员 my 接口应返回 TENANT_ADMIN 角色', async () => {
    await assertMyContainsRole(ctrl, token, 'TENANT_ADMIN')
  })

  it('OPS-8 批量: 运行专员应能同时读取租户+配置+监控', async () => {
    const res = await ctrl.batchCheckPermission(
      { checks: [
        { resource: 'tenant', action: 'read' },
        { resource: 'config', action: 'read' },
        { resource: 'monitor', action: 'read' },
      ]},
      token,
    )
    expect(res.success).toBe(true)
    expect(res.data.length).toBe(3)
    res.data.forEach((r: any) => expect(r.allowed).toBe(true))
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝 团建 (teamBuilder) - 团建与会员活动
// ═══════════════════════════════════════════════════════════════

describe('🤝 团建｜teamBuilder - 团建活动权限', () => {
  let ctrl: PermissionController
  const token = bearer('teamBuilder')

  beforeEach(() => { ctrl = createController() })

  it('TEAM-1 团建专员应能管理会员（member:*）', async () => {
    await assertAllowed(ctrl, 'member', 'read', token)
    await assertAllowed(ctrl, 'member', 'create', token)
  })

  it('TEAM-2 团建专员应能管理营销活动（campaign:*）', async () => {
    await assertAllowed(ctrl, 'campaign', 'read', token)
    await assertAllowed(ctrl, 'campaign', 'create', token)
  })

  it('TEAM-3 团建专员应能管理优惠券（coupon:*）', async () => {
    await assertAllowed(ctrl, 'coupon', 'read', token)
    await assertAllowed(ctrl, 'coupon', 'create', token)
  })

  it('TEAM-4 团建专员应能管理库存（STORE_MANAGER 角色含 inventory:read）', async () => {
    await assertAllowed(ctrl, 'inventory', 'read', token)
  })

  it('TEAM-5 团建专员应能更新门店（STORE_MANAGER 角色含 store:update）', async () => {
    await assertAllowed(ctrl, 'store', 'update', token)
  })

  it('TEAM-6 边界: 团建专员不应能管理用户角色', async () => {
    await assertForbidden(ctrl, 'user', 'create', token)
  })

  it('TEAM-7 团建专员 my 接口应返回 STORE_MANAGER 角色', async () => {
    await assertMyContainsRole(ctrl, token, 'STORE_MANAGER')
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢 营销 (marketing) - 营销与投放
// ═══════════════════════════════════════════════════════════════

describe('📢 营销｜marketing - 营销权限', () => {
  let ctrl: PermissionController
  const token = bearer('marketing')

  beforeEach(() => { ctrl = createController() })

  it('MKT-1 营销专员应能管理营销活动（campaign:*）', async () => {
    await assertAllowed(ctrl, 'campaign', 'read', token)
    await assertAllowed(ctrl, 'campaign', 'create', token)
  })

  it('MKT-2 营销专员应能管理优惠券（coupon:*）', async () => {
    await assertAllowed(ctrl, 'coupon', 'read', token)
    await assertAllowed(ctrl, 'coupon', 'create', token)
  })

  it('MKT-3 营销专员应能读取会员信息（member:read）', async () => {
    await assertAllowed(ctrl, 'member', 'read', token)
  })

  it('MKT-4 营销专员应能查看报告（report:read）', async () => {
    await assertAllowed(ctrl, 'report', 'read', token)
  })

  it('MKT-5 边界: 营销专员不应能创建会员（member:create 不在权限中）', async () => {
    await assertForbidden(ctrl, 'member', 'create', token)
  })

  it('MKT-6 边界: 营销专员不应能操作订单', async () => {
    await assertForbidden(ctrl, 'order', 'create', token)
  })

  it('MKT-7 边界: 营销专员不应能管理门店', async () => {
    await assertForbidden(ctrl, 'store', 'update', token)
  })

  it('MKT-8 营销专员 my 接口应返回 MARKETING 角色', async () => {
    await assertMyContainsRole(ctrl, token, 'MARKETING')
  })

  it('MKT-9 批量: 营销专员应能批量读取活动+会员+报告', async () => {
    const res = await ctrl.batchCheckPermission(
      { checks: [
        { resource: 'campaign', action: 'read' },
        { resource: 'member', action: 'read' },
        { resource: 'report', action: 'read' },
      ]},
      token,
    )
    expect(res.success).toBe(true)
    expect(res.data.length).toBe(3)
    res.data.forEach((r: any) => expect(r.allowed).toBe(true))
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔐 匿名用户 / 无凭证边界测试
// ═══════════════════════════════════════════════════════════════

describe('🔐 匿名用户 - 无权限边界', () => {
  let ctrl: PermissionController

  beforeEach(() => { ctrl = createController() })

  it('ANON-1 匿名用户任何敏感操作应被拒绝', async () => {
    await assertForbidden(ctrl, 'store', 'read', '')
    await assertForbidden(ctrl, 'order', 'create', '')
    await assertForbidden(ctrl, 'member', 'read', '')
  })

  it('ANON-2 匿名用户 my 接口应返回匿名上下文', async () => {
    const res = await ctrl.getMyPermissions(undefined)
    expect(res.success).toBe(true)
    expect(res.data.context.roles).toBeInstanceOf(Array)
    expect(res.data.context.roles.length).toBe(0)
    expect(res.data.permissions).toBeInstanceOf(Array)
    expect(res.data.permissions.length).toBe(0)
  })

  it('ANON-3 带无效 Bearer token 应回退到最小权限', async () => {
    await assertForbidden(ctrl, 'store', 'read', 'Bearer invalid-role-token')
    await assertForbidden(ctrl, 'order', 'read', 'Bearer invalid-role-token')
  })
})

// ═══════════════════════════════════════════════════════════════
// 🏪 角色无权限接口 - 角色管理 API 本身
// ═══════════════════════════════════════════════════════════════

describe('🏪 公开 API - 角色与权限列表', () => {
  let ctrl: PermissionController

  beforeEach(() => { ctrl = createController() })

  it('PUB-1 任何用户可获取所有角色列表（无需认证）', async () => {
    const res = await ctrl.getAllRoles()
    expect(res.success).toBe(true)
    expect(res.data).toBeInstanceOf(Array)
    expect(res.data.length).toBeGreaterThan(0)
  })

  it('PUB-2 任何用户可获取所有权限列表（无需认证）', async () => {
    const res = await ctrl.getAllPermissions()
    expect(res.success).toBe(true)
    expect(res.data).toBeInstanceOf(Array)
    expect(res.data.length).toBeGreaterThan(0)
  })
})
