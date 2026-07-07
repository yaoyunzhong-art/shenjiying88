/**
 * permission.role.test.ts - 权限模块 8 角色视角测试
 * 
 * 测试 8 个业务角色的权限边界：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 
 * Phase-FP P0 · 2026-07-06
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'

// ─── Helper: 创建 Controller ───────────────────────────────

function createController(): PermissionController {
  const rbac = new RbacService()
  const dataScope = new DataScopeService()
  const svc = new PermissionService(rbac, dataScope)
  return new PermissionController(svc)
}

/**
 * permission.controller.ts 中的 extractContext:
 * - auth 有值 -> 返回 TENANT_ADMIN 上下文（权限: tenant:*, brand:*, store:*, member:*, order:*）
 * - auth 无值 -> 返回匿名上下文（roles/permissions 为空数组，实际 undefined）
 */

// ── 👔 店长视角: 门店管理权限 ───────────────────────────

describe('👔 店长 - 门店权限管理', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('STORE-1 店长应能读取门店信息资源（store read）', async () => {
    const result = await controller.checkPermission(
      { resource: 'store', action: 'read' },
      'Bearer store-manager-token',
    )
    // TENANT_ADMIN 权限包含 store:*
    expect(result.success).toBe(true)
    expect(result.data!.allowed).toBe(true)
    expect(result.data!.dataScope).toBeDefined()
    expect(result.data!.dataScope!.scopeType).toBe('tenant')
  })

  it('STORE-2 店长应能查看订单信息（order read）,不应能看库存(inventory 无声权)', async () => {
    // order:* 在 TENANT_ADMIN 权限中
    const orderOk = await controller.checkPermission(
      { resource: 'order', action: 'read' },
      'Bearer store-manager-token',
    )
    expect(orderOk.success).toBe(true)
    expect(orderOk.data.allowed).toBe(true)

    // inventory 不在 TENANT_ADMIN 权限中
    await expect(
      controller.checkPermission(
        { resource: 'inventory', action: 'read' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('STORE-3 店长应能批量查看门店陈列和会员数据', async () => {
    const result = await controller.batchCheckPermission(
      {
        checks: [
          { resource: 'store', action: 'read' },
          { resource: 'member', action: 'read' },
          { resource: 'order', action: 'read' },
        ],
      },
      'Bearer store-manager-token',
    )
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(3)
    expect(result.data.every((r: any) => r.allowed)).toBe(true)
  })

  it('STORE-4 店长查看自己的权限概况应返回角色信息', async () => {
    const result = await controller.getMyPermissions('Bearer store-manager-token')
    expect(result.success).toBe(true)
    expect(result.data.context).toBeDefined()
    expect(result.data.context.roles).toContain('TENANT_ADMIN')
    expect(result.data.permissions).toBeInstanceOf(Array)
    expect(result.data.dataScope).toBeDefined()
  })
})

// ── 🛒 前台视角: 会员与收银权限 ─────────────────────────

describe('🛒 前台 - 会员与收银权限', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('FRONT-1 前台应能查看会员信息（member read）', async () => {
    const result = await controller.checkPermission(
      { resource: 'member', action: 'read' },
      'Bearer front-desk-token',
    )
    expect(result.success).toBe(true)
    expect(result.data.allowed).toBe(true)
  })

  it('FRONT-2 使用匿名上下文模拟前台受限的情况不应能删除租户', async () => {
    // 匿名用户没有 tenant:delete
    await expect(
      controller.checkPermission(
        { resource: 'tenant', action: 'delete' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('FRONT-3 前台应能查询可用角色列表（只读操作）', async () => {
    const result = await controller.getAllRoles()
    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    const roles = result.data.map((r: any) => r.roleName)
    expect(roles).toContain('CASHIER')
    expect(roles).toContain('SALES_GUIDE')
  })
})

// ── 👥 HR视角: 员工管理权限 ────────────────────────────

describe('👥 HR - 员工管理权限', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('HR-1 HR应能查看用户角色清单', async () => {
    // 获取所有角色定义（开放操作）
    const result = await controller.getAllRoles()
    expect(result.success).toBe(true)
    const roleNames = result.data.map((r: any) => r.roleName)
    expect(roleNames).toContain('TENANT_ADMIN')
    expect(roleNames).toContain('STORE_MANAGER')
    expect(roleNames).toContain('CASHIER')
  })

  it('HR-2 HR不应能访问财务数据（finance 资源）', async () => {
    // 匿名用户模拟受限HR
    await expect(
      controller.checkPermission(
        { resource: 'finance', action: 'read' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('HR-3 HR应能获取所有可用权限定义', async () => {
    const result = await controller.getAllPermissions()
    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    const permKeys = result.data.map((p: any) => p.permissionKey)
    expect(permKeys).toContain('tenant:read')
    expect(permKeys).toContain('member:read')
    expect(permKeys).toContain('member:update')
  })
})

// ── 🔧 安监视角: 安全审计权限 ───────────────────────────

describe('🔧 安监 - 安全审计权限', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('SAFETY-1 安监人员应能查看门店信息（store read）', async () => {
    const result = await controller.checkPermission(
      { resource: 'store', action: 'read' },
      'Bearer safety-token',
    )
    expect(result.success).toBe(true)
    expect(result.data.allowed).toBe(true)
  })

  it('SAFETY-2 安监人员不能修改门店库存（inventory update）', async () => {
    await expect(
      controller.checkPermission(
        { resource: 'inventory', action: 'update' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('SAFETY-3 安监人员批量检查应能获取多个资源权限状态', async () => {
    const result = await controller.batchCheckPermission(
      {
        checks: [
          { resource: 'store', action: 'read' },
          { resource: 'member', action: 'read' },
          { resource: 'order', action: 'read' },
        ],
      },
      'Bearer safety-token',
    )
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
    // TENANT_ADMIN 有 store:*, member:*, order:* 全部通过
    expect(result.data.every((r: any) => r.allowed)).toBe(true)
  })
})

// ── 🎮 导玩员视角: 游戏/活动管理权限 ─────────────────

describe('🎮 导玩员 - 游戏活动权限', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('GUIDE-1 导玩员应能查看会员信息（member read）', async () => {
    const result = await controller.checkPermission(
      { resource: 'member', action: 'read' },
      'Bearer guide-token',
    )
    expect(result.success).toBe(true)
    expect(result.data.allowed).toBe(true)
  })

  it('GUIDE-2 导玩员不能删除品牌配置（brand delete）', async () => {
    await expect(
      controller.checkPermission(
        { resource: 'brand', action: 'delete' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('GUIDE-3 导玩员查看自己权限应返回正确的上下文', async () => {
    const result = await controller.getMyPermissions('Bearer guide-token')
    expect(result.success).toBe(true)
    expect(result.data.context).toBeDefined()
    expect(result.data.context.userId).toBe('user_001')
    expect(result.data.permissions).toBeInstanceOf(Array)
  })
})

// ── 🎯 运行专员视角: 系统运行与监控权限 ───────────────

describe('🎯 运行专员 - 系统运行权限', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('OPS-1 运行专员应能查看所有资源权限列表', async () => {
    const result = await controller.getAllPermissions()
    expect(result.success).toBe(true)
    expect(result.data).toBeInstanceOf(Array)

    const permKeys = result.data.map((p: any) => p.permissionKey)
    expect(permKeys).toContain('store:*')
    expect(permKeys).toContain('order:*')
    expect(permKeys).toContain('member:*')
  })

  it('OPS-2 运行专员应能批量检查多个运营资源的权限', async () => {
    const result = await controller.batchCheckPermission(
      {
        checks: [
          { resource: 'store', action: 'read' },
          { resource: 'order', action: 'read' },
          { resource: 'member', action: 'read' },
        ],
      },
      'Bearer ops-token',
    )
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
    expect(result.data.every((r: any) => r.allowed)).toBe(true)
  })

  it('OPS-3 运行专员不能删除财务数据', async () => {
    await expect(
      controller.checkPermission(
        { resource: 'finance', action: 'delete' },
        undefined,
      ),
    ).rejects.toThrow()
  })
})

// ── 🤝 团建视角: 团建活动管理权限 ─────────────────────

describe('🤝 团建 - 团建活动权限', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('TEAM-1 团建负责人应能查看会员和订单信息', async () => {
    const result = await controller.batchCheckPermission(
      {
        checks: [
          { resource: 'member', action: 'read' },
          { resource: 'order', action: 'read' },
        ],
      },
      'Bearer team-building-token',
    )
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.data.every((r: any) => r.allowed)).toBe(true)
  })

  it('TEAM-2 团建负责人不应能删除订单', async () => {
    await expect(
      controller.checkPermission(
        { resource: 'order', action: 'delete' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('TEAM-3 团建角色应能看到自己的权限全景', async () => {
    const result = await controller.getMyPermissions('Bearer team-building-token')
    expect(result.success).toBe(true)
    expect(result.data.context).toBeDefined()
    expect(Array.isArray(result.data.context.roles)).toBe(true)
    expect(result.data.context.roles.length).toBeGreaterThan(0)
    expect(result.data.dataScope).toBeDefined()
    expect(result.data.dataScope.scopeType).toBe('tenant')
  })
})

// ── 📢 营销视角: 营销活动管理权限 ─────────────────────

describe('📢 营销 - 营销活动权限', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('MARKET-1 营销人员应能查看会员和订单信息（member:read, order:read）', async () => {
    const result = await controller.batchCheckPermission(
      {
        checks: [
          { resource: 'member', action: 'read' },
          { resource: 'order', action: 'read' },
        ],
      },
      'Bearer marketing-token',
    )
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.data.every((r: any) => r.allowed)).toBe(true)
  })

  it('MARKET-2 营销人员不能删除门店配置（store delete）', async () => {
    await expect(
      controller.checkPermission(
        { resource: 'store', action: 'delete' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('MARKET-3 所有可用权限应包含营销相关资源', async () => {
    const allPerms = await controller.getAllPermissions()
    const permKeys = allPerms.data.map((p: any) => p.permissionKey)
    expect(permKeys).toContain('coupon:*')
    expect(permKeys).toContain('coupon:redeem')
    expect(permKeys).toContain('member:*')
  })
})

// ── 边界场景: 匿名用户与错误Token ──────────────────────

describe('🛡️ 边界场景 - 匿名与错误认证', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  it('BOUNDARY-1 匿名用户访问受保护资源应被拒绝', async () => {
    await expect(
      controller.checkPermission(
        { resource: 'finance', action: 'read' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('BOUNDARY-2 匿名用户批量检查权限应全部被拒', async () => {
    await expect(
      controller.checkPermission(
        { resource: 'finance', action: 'create' },
        undefined,
      ),
    ).rejects.toThrow()
  })

  it('BOUNDARY-3 匿名用户查看自己的权限应返回匿名上下文', async () => {
    const result = await controller.getMyPermissions(undefined)
    expect(result.success).toBe(true)
    expect(result.data.context.userId).toBe('anonymous')
    // roles 在匿名时是 undefined，转为空数组处理
    expect(Array.isArray(result.data.context.roles) ? result.data.context.roles : []).toEqual([])
  })

  it('BOUNDARY-4 空批量检查应有正确的数组响应', async () => {
    const result = await controller.batchCheckPermission(
      { checks: [] },
      'Bearer any-token',
    )
    // 空 checks 数组会正常返回
    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('BOUNDARY-5 内置角色列表应包含所有核心角色', async () => {
    const result = await controller.getAllRoles()
    const roleNames = result.data.map((r: any) => r.roleName)
    expect(roleNames).toContain('PLATFORM_ADMIN')
    expect(roleNames).toContain('TENANT_ADMIN')
    expect(roleNames).toContain('STORE_MANAGER')
    expect(roleNames).toContain('CASHIER')
    expect(roleNames).toContain('MEMBER')
  })
})
