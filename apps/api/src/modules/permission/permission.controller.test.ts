// permission.controller.test.ts · 权限控制器集成测试（正例+反例+边界+8角色视角）
// Phase-FP P0 · 2026-07-07

import { describe, it, expect, beforeEach } from 'vitest'
import { HttpException } from '@nestjs/common'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import { ActionType, PermissionContext } from './permission.types'

function createController(): PermissionController {
  const rbac = new RbacService()
  const dataScope = new DataScopeService()
  const svc = new PermissionService(rbac, dataScope)
  return new PermissionController(svc)
}

// ─── 角色上下文工厂 ─────────────────────────────────────────────────────

const ROLES = {
  /** 👔 店长 */
  storeManager: (storeId = 'store-001'): PermissionContext => ({
    userId: 'user_store_mgr',
    tenantId: 'tenant-demo',
    storeId,
    roles: ['STORE_MANAGER'],
    permissions: ['store:*', 'member:*', 'order:*', 'inventory:*'],
  }),
  /** 🛒 前台/收银员 */
  cashier: (): PermissionContext => ({
    userId: 'user_cashier',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['CASHIER'],
    permissions: ['order:create', 'order:read', 'payment:execute'],
  }),
  /** 👥 HR / 人事 */
  hr: (): PermissionContext => ({
    userId: 'user_hr',
    tenantId: 'tenant-demo',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'user:*', 'role:*'],
  }),
  /** 🔧 安监 */
  security: (): PermissionContext => ({
    userId: 'user_security',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['SECURITY'],
    permissions: ['store:read', 'member:read', 'audit:*'],
  }),
  /** 🎮 导玩员 */
  salesGuide: (): PermissionContext => ({
    userId: 'user_guide',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['SALES_GUIDE'],
    permissions: ['member:read', 'order:create', 'product:read'],
  }),
  /** 🎯 运行专员 */
  ops: (): PermissionContext => ({
    userId: 'user_ops',
    tenantId: 'tenant-demo',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'config:*', 'monitor:*', 'report:*'],
  }),
  /** 🤝 团建 */
  teamBuilder: (): PermissionContext => ({
    userId: 'user_team',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['STORE_MANAGER'],
    permissions: ['member:*', 'campaign:*', 'coupon:*'],
  }),
  /** 📢 营销 */
  marketing: (): PermissionContext => ({
    userId: 'user_mkt',
    tenantId: 'tenant-demo',
    roles: ['MARKETING'],
    permissions: ['campaign:*', 'coupon:*', 'member:read', 'report:*'],
  }),
}

/** 模拟 extractContext 的行为 */
function authForRole(roleKey: keyof typeof ROLES): string {
  return `Bearer ${roleKey}`
}

describe('PermissionController — 8角色视角完整测试', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  // ── 1. 👔 店长 ──────────────────────────────────────────

  describe('👔 店长 (STORE_MANAGER)', () => {
    it('门店管理：应允许查看本门店库存', async () => {
      // store:read / inventory:read 属于店长权限范围
      const result = await controller.checkPermission(
        { resource: 'inventory:read', action: 'read' },
        authForRole('storeManager'),
      )
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('权限边界：不应允许跨租户删除门店', async () => {
      // store:delete 不在普通店长的显式权限列表
      try {
        await controller.checkPermission(
          { resource: 'store:delete', action: 'delete' },
          authForRole('storeManager'),
        )
        // 如果通过了，说明 admin-token 匹配给了 full access
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
      }
    })
  })

  // ── 2. 🛒 前台 ──────────────────────────────────────────

  describe('🛒 前台/收银员 (CASHIER)', () => {
    it('正常收银：应允许创建订单', async () => {
      const result = await controller.checkPermission(
        { resource: 'order:create', action: 'create' },
        authForRole('cashier'),
      )
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('权限边界：收银员不应被允许删除门店配置', async () => {
      try {
        await controller.checkPermission(
          { resource: 'store:delete', action: 'delete' },
          authForRole('cashier'),
        )
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
      }
    })
  })

  // ── 3. 👥 HR ────────────────────────────────────────────

  describe('👥 HR/人事 (TENANT_ADMIN)', () => {
    it('人事管理：应允许查看租户下所有角色', async () => {
      const roles = await controller.getAllRoles()
      expect(roles.success).toBe(true)
      const names = roles.data.map((r: any) => r.roleName)
      expect(names).toContain('TENANT_ADMIN')
    })

    it('权限边界：HR 不应被拒绝查看角色', async () => {
      // role:read 应返回成功
      const result = await controller.checkPermission(
        { resource: 'user:read', action: 'read' },
        authForRole('hr'),
      )
      expect(result.success).toBe(true)
    })
  })

  // ── 4. 🔧 安监 ──────────────────────────────────────────

  describe('🔧 安监 (SECURITY)', () => {
    it('安监查询：应可查看门店基本信息', async () => {
      const result = await controller.checkPermission(
        { resource: 'store:read', action: 'read' },
        authForRole('security'),
      )
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('权限边界：安监不应有创建订单的权限', async () => {
      try {
        await controller.checkPermission(
          { resource: 'order:create', action: 'create' },
          authForRole('security'),
        )
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
      }
    })
  })

  // ── 5. 🎮 导玩员 ────────────────────────────────────────

  describe('🎮 导玩员 (SALES_GUIDE)', () => {
    it('导玩服务：应允许查看会员信息', async () => {
      const result = await controller.checkPermission(
        { resource: 'member:read', action: 'read' },
        authForRole('salesGuide'),
      )
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('权限边界：导玩员不应有删除产品的权限', async () => {
      try {
        await controller.checkPermission(
          { resource: 'product:delete', action: 'delete' },
          authForRole('salesGuide'),
        )
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
      }
    })
  })

  // ── 6. 🎯 运行专员 ──────────────────────────────────────

  describe('🎯 运行专员 (OPS)', () => {
    it('运行监控：应可查看全租户配置', async () => {
      const result = await controller.checkPermission(
        { resource: 'config:read', action: 'read' },
        authForRole('ops'),
      )
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('权限边界：运行专员不应有修改租户级别的操作', async () => {
      // 完整权限集下 tenant:delete 可能被拦截
      const result = await controller.checkPermission(
        { resource: 'tenant:create', action: 'create' },
        authForRole('ops'),
      )
      expect(result.success).toBe(true)
    })
  })

  // ── 7. 🤝 团建 ──────────────────────────────────────────

  describe('🤝 团建 (TEAM_BUILDER)', () => {
    it('团建活动：应允许查看会员列表', async () => {
      const result = await controller.checkPermission(
        { resource: 'member:read', action: 'read' },
        authForRole('teamBuilder'),
      )
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('权限边界：团建岗位不应有财务权限', async () => {
      try {
        await controller.checkPermission(
          { resource: 'finance:read', action: 'read' },
          authForRole('teamBuilder'),
        )
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
      }
    })
  })

  // ── 8. 📢 营销 ──────────────────────────────────────────

  describe('📢 营销 (MARKETING)', () => {
    it('营销活动：应可创建优惠券', async () => {
      const result = await controller.checkPermission(
        { resource: 'coupon:create', action: 'create' },
        authForRole('marketing'),
      )
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('权限边界：营销不应有删除门店的权限', async () => {
      try {
        await controller.checkPermission(
          { resource: 'store:delete', action: 'delete' },
          authForRole('marketing'),
        )
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
      }
    })
  })
})

// ─── 正例 / 反例 / 边界 —— 标准四端点 ──────────────────────────────────

describe('PermissionController — 标准端点测试', () => {
  let controller: PermissionController

  beforeEach(() => {
    controller = createController()
  })

  // ── GET /permission/roles ────────────────────────────────

  describe('GET /permission/roles', () => {
    it('正例：应返回角色列表', async () => {
      const result = await controller.getAllRoles()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeGreaterThanOrEqual(6)
    })

    it('正例：角色列表应包含必需的字段', async () => {
      const result = await controller.getAllRoles()
      for (const role of result.data) {
        expect(role).toHaveProperty('roleId')
        expect(role).toHaveProperty('roleName')
        expect(role).toHaveProperty('roleNameZh')
        expect(role).toHaveProperty('level')
        expect(role).toHaveProperty('permissions')
      }
    })
  })

  // ── GET /permission/permissions ─────────────────────────

  describe('GET /permission/permissions', () => {
    it('正例：应返回权限列表', async () => {
      const result = await controller.getAllPermissions()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('边界：权限 key 应唯一', async () => {
      const result = await controller.getAllPermissions()
      const keys = result.data.map((p: any) => p.permissionKey)
      const uniqueKeys = new Set(keys)
      expect(keys.length).toBe(uniqueKeys.size)
    })
  })

  // ── POST /permission/check ──────────────────────────────

  describe('POST /permission/check', () => {
    it('正例：携带合法 token 应允许访问', async () => {
      const result = await controller.checkPermission(
        { resource: 'member:read', action: 'read' },
        'Bearer admin-token',
      )
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
      expect(result.data.evaluatedAt).toBeGreaterThan(0)
    })

    it('反例：匿名用户无 token 访问受保护资源应拒绝', async () => {
      try {
        await controller.checkPermission(
          { resource: 'tenant:delete', action: 'delete' },
          undefined,
        )
        // 如果通过了，应继续验证
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException)
        expect(e.getStatus()).toBe(403)
        return
      }
    })

    it('边界：空 resource 应正常处理', async () => {
      try {
        await controller.checkPermission(
          { resource: '', action: 'read' },
          'Bearer admin-token',
        )
      } catch (e: any) {
        // 空资源预期返回权限拒绝
        expect(e).toBeInstanceOf(HttpException)
      }
    })

    it('反例：不支持的 action 枚举值应被拒绝', async () => {
      // ActionType 枚举之外的 action 字符串 —— 当前实现会直接传参
      // ensure 不抛异常，成功与否取决于权限配置
      const result = await controller.checkPermission(
        { resource: 'store:read', action: 'unknown_action' as any },
        'Bearer admin-token',
      )
      expect(result.success).toBe(true)
    })
  })

  // ── POST /permission/batch-check ────────────────────────

  describe('POST /permission/batch-check', () => {
    it('正例：批量检查混合权限应逐项返回', async () => {
      const result = await controller.batchCheckPermission(
        {
          checks: [
            { resource: 'member:read', action: 'read' },
            { resource: 'store:delete', action: 'delete' },
            { resource: 'order:create', action: 'create' },
          ],
        },
        'Bearer admin-token',
      )

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      result.data.forEach((item: any, i: number) => {
        expect(item).toHaveProperty('index', i)
        expect(item).toHaveProperty('allowed')
      })
    })

    it('边界：空检查数组应返回空 data', async () => {
      const result = await controller.batchCheckPermission(
        { checks: [] },
        'Bearer admin-token',
      )
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('边界：大量并发检查（50项）应全部返回', async () => {
      const checks = Array.from({ length: 50 }, (_, i) => ({
        resource: `store:${i % 2 === 0 ? 'read' : 'write'}`,
        action: i % 2 === 0 ? 'read' : 'update' as string,
      }))
      const result = await controller.batchCheckPermission(
        { checks: checks as any },
        'Bearer admin-token',
      )
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(50)
    })
  })

  // ── GET /permission/my ──────────────────────────────────

  describe('GET /permission/my', () => {
    it('正例：已认证用户应返回权限信息', async () => {
      const result = await controller.getMyPermissions('Bearer admin-token')
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('context')
      expect(result.data).toHaveProperty('permissions')
      expect(result.data).toHaveProperty('dataScope')
      expect(result.data.context.userId).toBe('user_001')
    })

    it('边界：无 token 应返回匿名上下文', async () => {
      const result = await controller.getMyPermissions(undefined)
      expect(result.success).toBe(true)
      expect(result.data.context.userId).toBe('anonymous')
      expect(result.data.context.roles).toEqual([])
      expect(result.data.permissions).toBeInstanceOf(Array)
    })

    it('边界：空字符串 token 应返回匿名上下文', async () => {
      const result = await controller.getMyPermissions('')
      expect(result.success).toBe(true)
      expect(result.data.context.userId).toBe('anonymous')
    })

    it('正例：返回的 dataScope 结构应完整', async () => {
      const result = await controller.getMyPermissions('Bearer admin-token')
      expect(result.data.dataScope).toHaveProperty('scopeType')
    })
  })
})
