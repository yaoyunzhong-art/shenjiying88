// permission.controller.spec.ts · 权限控制器单元测试
// Phase-FP P0 · 2026-07-05

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import { PermissionContext, ActionType } from './permission.types'

describe('PermissionController', () => {
  let controller: PermissionController
  let permissionService: PermissionService
  let rbacService: RbacService
  let dataScopeService: DataScopeService

  beforeEach(() => {
    rbacService = new RbacService()
    dataScopeService = new DataScopeService()
    permissionService = new PermissionService(rbacService, dataScopeService)
    controller = new PermissionController(permissionService)
  })

  // ─── GET /permission/roles ─────────────────────────────────

  describe('getAllRoles', () => {
    it('should return all available roles', async () => {
      const result = await controller.getAllRoles()

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data.length).toBeGreaterThan(0)

      // 应该包含内置角色
      const roleNames = result.data.map((r: any) => r.roleName)
      expect(roleNames).toContain('PLATFORM_ADMIN')
      expect(roleNames).toContain('TENANT_ADMIN')
      expect(roleNames).toContain('STORE_MANAGER')
    })
  })

  // ─── GET /permission/permissions ──────────────────────────

  describe('getAllPermissions', () => {
    it('should return all available permissions', async () => {
      const result = await controller.getAllPermissions()

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data.length).toBeGreaterThan(0)

      const permKeys = result.data.map((p: any) => p.permissionKey)
      expect(permKeys).toContain('tenant:create')
      expect(permKeys).toContain('member:*')
    })
  })

  // ─── POST /permission/check ───────────────────────────────

  describe('checkPermission', () => {
    it('should allow platform admin to access any resource', async () => {
      const body = {
        resource: 'tenant:create',
        action: 'create',
      }
      const auth = 'Bearer admin-token'

      const result = await controller.checkPermission(body, auth)

      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should throw ForbiddenException when anonymous user lacks permission', async () => {
      const body = {
        resource: 'tenant:delete',
        action: 'delete',
      }
      // 匿名用户没有tenant:delete权限
      await expect(
        controller.checkPermission(body, undefined),
      ).rejects.toThrow()
    })

    it('should allow admin token with all permissions', async () => {
      const body = {
        resource: 'tenant:delete',
        action: 'delete',
      }
      const auth = 'Bearer admin-token'

      // admin token gets admin context with all permissions
      const result = await controller.checkPermission(body, auth)

      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })
  })

  // ─── POST /permission/batch-check ─────────────────────────

  describe('batchCheckPermission', () => {
    it('should check multiple permissions at once', async () => {
      const body = {
        checks: [
          { resource: 'tenant:create', action: 'create' },
          { resource: 'store:read', action: 'read' },
        ],
      }
      const auth = 'Bearer admin-token'

      const result = await controller.batchCheckPermission(body, auth)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toHaveProperty('index')
      expect(result.data[0].allowed).toBe(true)
    })

    it('should handle empty checks gracefully', async () => {
      const body = { checks: [] }
      const auth = 'Bearer admin-token'

      const result = await controller.batchCheckPermission(body, auth)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })
  })

  // ─── GET /permission/my ──────────────────────────────────

  describe('getMyPermissions', () => {
    it('should return user permission info', async () => {
      const auth = 'Bearer admin-token'

      const result = await controller.getMyPermissions(auth)

      expect(result.success).toBe(true)
      expect(result.data.context).toBeDefined()
      expect(result.data.context.userId).toBe('user_001')
      expect(result.data.permissions).toBeInstanceOf(Array)
      expect(result.data.dataScope).toBeDefined()
    })

    it('should return anonymous context when no auth header', async () => {
      const result = await controller.getMyPermissions(undefined)

      expect(result.success).toBe(true)
      expect(result.data.context.userId).toBe('anonymous')
      expect(result.data.context.roles).toEqual([])
    })
  })

  // ─── Helper: extractContext ──────────────────────────────

  describe('extractContext (via getMyPermissions)', () => {
    it('should create anonymous context when auth is missing', async () => {
      const result = await controller.getMyPermissions(undefined)

      expect(result.success).toBe(true)
      expect(result.data.context.userId).toBe('anonymous')
      expect(result.data.context.roles).toEqual([])
    })

    it('should create admin context when auth is provided', async () => {
      const result = await controller.getMyPermissions('Bearer admin-token')

      expect(result.success).toBe(true)
      expect(result.data.context.userId).toBe('user_001')
      expect(result.data.context.roles).toContain('TENANT_ADMIN')
    })
  })
})
