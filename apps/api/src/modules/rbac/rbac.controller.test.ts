// rbac.controller.spec.ts — RBAC 权限管理 Controller 单元测试
/**
 * D类: controller spec 补全
 * 覆盖所有路由端点：正向 + 反例 + 边界
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RBACController } from './rbac.controller'
import { RBACService, Role, Permission } from './rbac.service'
import { BadRequestException } from '@nestjs/common'

describe('RBACController', () => {
  let controller: RBACController
  let service: RBACService

  beforeEach(() => {
    service = new RBACService()
    controller = new RBACController(service as any)
  })

  // ── POST /rbac/assign — assignRole ──
  describe('POST /rbac/assign — assignRole', () => {
    it('正例: 分配角色应返回分配详情', async () => {
      const result = await controller.assignRole({
        userId: 'u-1',
        role: 'admin' as Role,
        tenantId: 't-a',
        assignedBy: 'owner-1',
      })
      expect(result.success).toBe(true)
      expect(result.data.userId).toBe('u-1')
      expect(result.data.role).toBe('admin')
      expect(result.data.tenantId).toBe('t-a')
      expect(result.data.assignedBy).toBe('owner-1')
      expect(result.data.assignedAt).toBeInstanceOf(Date)
    })

    it('正例: 分配全局角色（无租户）', async () => {
      const result = await controller.assignRole({
        userId: 'u-2',
        role: 'guest' as Role,
        assignedBy: 'system',
      })
      expect(result.success).toBe(true)
      expect(result.data.tenantId).toBeUndefined()
    })

    it('正例: 同租户重新分配会替换旧角色', async () => {
      await controller.assignRole({
        userId: 'u-3',
        role: 'staff' as Role,
        tenantId: 't-a',
        assignedBy: 'admin',
      })
      const result = await controller.assignRole({
        userId: 'u-3',
        role: 'manager' as Role,
        tenantId: 't-a',
        assignedBy: 'admin',
      })
      expect(result.success).toBe(true)
      expect(result.data.role).toBe('manager')
    })

    it('边界: 无效角色名（controller 直接传递给 service，不抛异常，由 DTO 校验层处理）', async () => {
      // controller 本身不做 role 校验，依赖 class-validator DTO
      // 因此无效角色名会传递给 service 并被接受为任意字符串
      const result = await controller.assignRole({
        userId: 'u-4',
        role: 'superadmin' as any,
        assignedBy: 'test',
      })
      expect(result.success).toBe(true)
      expect(result.data.role).toBe('superadmin')
    })
  })

  // ── POST /rbac/revoke — revokeRole ──
  describe('POST /rbac/revoke — revokeRole', () => {
    it('正例: 撤销角色成功', async () => {
      await controller.assignRole({
        userId: 'u-5',
        role: 'admin' as Role,
        tenantId: 't-a',
        assignedBy: 'owner',
      })
      const result = await controller.revokeRole({ userId: 'u-5', tenantId: 't-a' })
      expect(result.success).toBe(true)
    })

    it('正例: 撤销全局角色', async () => {
      await controller.assignRole({
        userId: 'u-6',
        role: 'guest' as Role,
        assignedBy: 'system',
      })
      const result = await controller.revokeRole({ userId: 'u-6' })
      expect(result.success).toBe(true)
    })

    it('反例: 撤销未分配角色的用户不应报错', async () => {
      const result = await controller.revokeRole({ userId: 'nonexistent', tenantId: 't-a' })
      expect(result.success).toBe(true)
    })

    it('边界: 空 userId 撤销调用正常', async () => {
      service.revokeRole = vi.fn()
      const result = await controller.revokeRole({ userId: '' })
      expect(result.success).toBe(true)
    })
  })

  // ── GET /rbac/roles/:userId — getUserRoles ──
  describe('GET /rbac/roles/:userId — getUserRoles', () => {
    it('正例: 返回用户角色列表', async () => {
      await controller.assignRole({
        userId: 'u-7',
        role: 'admin' as Role,
        tenantId: 't-a',
        assignedBy: 'owner',
      })
      const result = await controller.getUserRoles('u-7')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].role).toBe('admin')
    })

    it('正例: 多租户返回多个角色', async () => {
      await controller.assignRole({
        userId: 'u-8',
        role: 'admin' as Role,
        tenantId: 't-a',
        assignedBy: 'owner',
      })
      await controller.assignRole({
        userId: 'u-8',
        role: 'manager' as Role,
        tenantId: 't-b',
        assignedBy: 'owner',
      })
      const result = await controller.getUserRoles('u-8')
      expect(result.data).toHaveLength(2)
    })

    it('反例: 未分配角色的用户返回空数组', async () => {
      const result = await controller.getUserRoles('nobody')
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('边界: 空 userId 应处理', async () => {
      const result = await controller.getUserRoles('')
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  // ── POST /rbac/check — checkPermission ──
  describe('POST /rbac/check — checkPermission', () => {
    it('正例: owner 拥有 config:delete 权限', async () => {
      await controller.assignRole({
        userId: 'u-9',
        role: 'owner' as Role,
        assignedBy: 'system',
      })
      const result = await controller.checkPermission({
        userId: 'u-9',
        permission: 'config:delete' as Permission,
      })
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('反例: guest 无权 order:write', async () => {
      await controller.assignRole({
        userId: 'u-10',
        role: 'guest' as Role,
        assignedBy: 'system',
      })
      const result = await controller.checkPermission({
        userId: 'u-10',
        permission: 'order:write' as Permission,
      })
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(false)
      expect(result.data.reason).toBeDefined()
    })

    it('反例: 未分配用户的权限检查返回 false', async () => {
      const result = await controller.checkPermission({
        userId: 'unknown',
        permission: 'user:read' as Permission,
      })
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(false)
    })

    it('边界: 带租户的非租户角色', async () => {
      await controller.assignRole({
        userId: 'u-11',
        role: 'manager' as Role,
        assignedBy: 'system',
      })
      const result = await controller.checkPermission({
        userId: 'u-11',
        permission: 'report:financial' as Permission,
        tenantId: 't-x',
      })
      expect(result.data.allowed).toBe(false)
    })
  })

  // ── POST /rbac/authorize — authorize ──
  describe('POST /rbac/authorize — authorize', () => {
    it('正例: 有权限应返回 authorized', async () => {
      await controller.assignRole({
        userId: 'u-12',
        role: 'admin' as Role,
        assignedBy: 'system',
      })
      const result = await controller.authorize({
        userId: 'u-12',
        permission: 'order:refund' as Permission,
      })
      expect(result.success).toBe(true)
      expect(result.data.authorized).toBe(true)
    })

    it('反例: 无权限应抛出 BadRequest', async () => {
      await controller.assignRole({
        userId: 'u-13',
        role: 'staff' as Role,
        assignedBy: 'system',
      })
      await expect(
        controller.authorize({
          userId: 'u-13',
          permission: 'user:impersonate' as Permission,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('反例: 未分配用户应抛出 BadRequest', async () => {
      await expect(
        controller.authorize({
          userId: 'nobody',
          permission: 'user:read' as Permission,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('边界: 拒绝权限高于允许权限', async () => {
      await controller.assignRole({
        userId: 'u-14',
        role: 'admin' as Role,
        assignedBy: 'system',
      })
      await expect(
        controller.authorize({
          userId: 'u-14',
          permission: 'config:delete' as Permission,
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ── GET /rbac/report/:userId — getUserReport ──
  describe('GET /rbac/report/:userId — getUserReport', () => {
    it('正例: 返回完整权限报告', async () => {
      await controller.assignRole({
        userId: 'u-15',
        role: 'admin' as Role,
        assignedBy: 'owner',
      })
      const result = await controller.getUserReport('u-15')
      expect(result.success).toBe(true)
      expect(result.data.roles).toHaveLength(1)
      expect(result.data.effectivePermissions.length).toBeGreaterThan(20)
      expect(result.data.deniedPermissions).toContain('config:delete')
    })

    it('反例: 无角色用户返回空报告', async () => {
      const result = await controller.getUserReport('nobody')
      expect(result.success).toBe(true)
      expect(result.data.roles).toEqual([])
      expect(result.data.effectivePermissions).toEqual([])
    })

    it('边界: 多个角色合并报告', async () => {
      await controller.assignRole({
        userId: 'u-16',
        role: 'staff' as Role,
        tenantId: 't-a',
        assignedBy: 'admin',
      })
      await controller.assignRole({
        userId: 'u-16',
        role: 'manager' as Role,
        tenantId: 't-b',
        assignedBy: 'admin',
      })
      const result = await controller.getUserReport('u-16')
      expect(result.data.roles).toHaveLength(2)
    })
  })

  // ── GET /rbac/permissions/:role — getRolePermissions ──
  describe('GET /rbac/permissions/:role — getRolePermissions', () => {
    it('正例: 返回 owner 全部权限', async () => {
      const result = await controller.getRolePermissions('owner')
      expect(result.success).toBe(true)
      expect(result.data.role).toBe('owner')
      expect(result.data.permissions).toContain('config:delete')
      expect(result.data.permissions).toContain('user:impersonate')
      expect(result.data.permissionCount).toBe(result.data.permissions.length)
    })

    it('正例: guest 只有基本只读', async () => {
      const result = await controller.getRolePermissions('guest')
      expect(result.success).toBe(true)
      expect(result.data.permissions).toContain('order:read')
      expect(result.data.permissions).not.toContain('order:write')
    })

    it('反例: 无效角色名应抛出 BadRequest', async () => {
      await expect(
        controller.getRolePermissions('superadmin'),
      ).rejects.toThrow(BadRequestException)
    })

    it('边界: 大小写敏感校验', async () => {
      await expect(
        controller.getRolePermissions('Admin'),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ── POST /rbac/policy — registerPolicy ──
  describe('POST /rbac/policy — registerPolicy', () => {
    it('正例: 注册自定义策略成功', async () => {
      const result = await controller.registerPolicy({
        role: 'manager' as Role,
        permissions: ['order:read' as Permission, 'order:write' as Permission],
        deniedPermissions: ['order:refund' as Permission],
      })
      expect(result.success).toBe(true)
      expect(result.message).toContain('manager')
      // 验证已生效
      const permResult = await controller.getRolePermissions('manager')
      expect(permResult.data.permissions).toContain('order:read')
      expect(permResult.data.permissions).toContain('order:write')
      expect(permResult.data.permissions).not.toContain('order:refund')
    })

    it('正例: 无 deniedPermissions 注册', async () => {
      const result = await controller.registerPolicy({
        role: 'guest' as Role,
        permissions: ['order:read' as Permission],
      })
      expect(result.success).toBe(true)
    })

    it('反例: 空权限列表应处理', async () => {
      const result = await controller.registerPolicy({
        role: 'guest' as Role,
        permissions: [],
      })
      expect(result.success).toBe(true)
    })
  })

  // ── POST /rbac/protected-actions — registerProtectedActions ──
  describe('POST /rbac/protected-actions — registerProtectedActions', () => {
    it('正例: 注册受保护动作成功', async () => {
      const result = await controller.registerProtectedActions({
        controllerName: 'TestController',
        actions: {
          create: ['user:write' as Permission],
          delete: ['user:delete' as Permission],
        },
      })
      expect(result.success).toBe(true)
    })

    it('正例: 空动作列表注册', async () => {
      const result = await controller.registerProtectedActions({
        controllerName: 'EmptyController',
        actions: {},
      })
      expect(result.success).toBe(true)
    })
  })

  // ── GET /rbac/protected-actions/:controllerName — getProtectedActions ──
  describe('GET /rbac/protected-actions/:controllerName — getProtectedActions', () => {
    it('正例: 返回已注册的保护动作', async () => {
      await controller.registerProtectedActions({
        controllerName: 'OrderController',
        actions: {
          refund: ['order:refund' as Permission],
          cancel: ['order:cancel' as Permission],
        },
      })
      const result = await controller.getProtectedActions('OrderController')
      expect(result.success).toBe(true)
      expect(result.data.controllerName).toBe('OrderController')
      expect(result.data.actions.refund).toContain('order:refund')
      expect(result.data.actions.cancel).toContain('order:cancel')
    })

    it('反例: 未注册的 Controller 返回空 actions', async () => {
      const result = await controller.getProtectedActions('UnknownCtrl')
      expect(result.success).toBe(true)
      expect(result.data.actions).toEqual({})
    })

    it('边界: 空 controllerName', async () => {
      const result = await controller.getProtectedActions('')
      expect(result.success).toBe(true)
      expect(result.data.actions).toEqual({})
    })
  })
})
