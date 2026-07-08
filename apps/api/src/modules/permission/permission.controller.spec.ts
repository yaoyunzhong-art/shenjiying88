// permission.controller.spec.ts · 权限控制器单元测试
// Phase-FP P0 · 2026-07-05 · 🐜 自动增强: 补全边界与角色测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import { PermissionContext, ActionType } from './permission.types'
import { ForbiddenException } from '@nestjs/common'

// 8 角色 token 定义（与 controller 内 TEST_ROLE_CONTEXTS 同步）
const ROLES = {
  admin: 'admin-token',
  storeManager: 'storeManager',
  cashier: 'cashier',
  hr: 'hr',
  security: 'security',
  salesGuide: 'salesGuide',
  ops: 'ops',
  teamBuilder: 'teamBuilder',
  marketing: 'marketing',
} as const

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

    it('should not modify the module metadata on repeated calls', async () => {
      const first = await controller.getAllRoles()
      const second = await controller.getAllRoles()
      expect(first.data.length).toBe(second.data.length)
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

    it('should include all resource types in permissions', async () => {
      const result = await controller.getAllPermissions()
      const resourceTypes = new Set(result.data.map((p: any) => p.resourceType))
      expect(resourceTypes.has('tenant')).toBe(true)
      expect(resourceTypes.has('store')).toBe(true)
      expect(resourceTypes.has('member')).toBe(true)
    })
  })

  // ─── POST /permission/check ───────────────────────────────

  describe('checkPermission', () => {
    it('should allow platform admin to access any resource', async () => {
      const body = { resource: 'tenant:create', action: 'create' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.admin}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should throw ForbiddenException when anonymous user lacks permission', async () => {
      const body = { resource: 'tenant:delete', action: 'delete' }
      await expect(controller.checkPermission(body, undefined)).rejects.toThrow()
    })

    it('should allow admin token with all permissions', async () => {
      const body = { resource: 'tenant:delete', action: 'delete' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.admin}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should deny store manager from tenant-level operations', async () => {
      const body = { resource: 'tenant:delete', action: 'delete' }
      await expect(
        controller.checkPermission(body, `Bearer ${ROLES.storeManager}`),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should allow store manager to read store resources', async () => {
      const body = { resource: 'store:read', action: 'read' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.storeManager}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should deny cashier from inventory write', async () => {
      const body = { resource: 'inventory:*', action: 'create' }
      await expect(
        controller.checkPermission(body, `Bearer ${ROLES.cashier}`),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should allow cashier to create orders', async () => {
      const body = { resource: 'order:create', action: 'create' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.cashier}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should allow HR to read user info', async () => {
      const body = { resource: 'user:read', action: 'read' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.hr}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should deny HR from tenant-level operations', async () => {
      const body = { resource: 'tenant:delete', action: 'delete' }
      await expect(
        controller.checkPermission(body, `Bearer ${ROLES.hr}`),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should allow security to read audit logs', async () => {
      const body = { resource: 'audit:read', action: 'read' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.security}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should deny security from write operations', async () => {
      const body = { resource: 'config:*', action: 'create' }
      await expect(
        controller.checkPermission(body, `Bearer ${ROLES.security}`),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should allow sales guide to read member info', async () => {
      const body = { resource: 'member:read', action: 'read' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.salesGuide}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should deny sales guide from deleting resources', async () => {
      const body = { resource: 'member:*', action: 'delete' }
      await expect(
        controller.checkPermission(body, `Bearer ${ROLES.salesGuide}`),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should allow ops with tenant:* to manage config', async () => {
      const body = { resource: 'config:*', action: 'create' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.ops}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should allow team builder to manage campaigns', async () => {
      const body = { resource: 'campaign:*', action: 'create' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.teamBuilder}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should allow marketing to read reports', async () => {
      const body = { resource: 'report:read', action: 'read' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.marketing}`)
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should deny marketing from store-level config changes', async () => {
      const body = { resource: 'store:update', action: 'update' }
      await expect(
        controller.checkPermission(body, `Bearer ${ROLES.marketing}`),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should return evaluatedAt timestamp on success', async () => {
      const body = { resource: 'member:read', action: 'read' }
      const result = await controller.checkPermission(body, `Bearer ${ROLES.admin}`)
      expect(result.data.evaluatedAt).toBeGreaterThan(0)
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
      const result = await controller.batchCheckPermission(body, `Bearer ${ROLES.admin}`)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toHaveProperty('index')
      expect(result.data[0].allowed).toBe(true)
    })

    it('should handle empty checks gracefully', async () => {
      const body = { checks: [] }
      const result = await controller.batchCheckPermission(body, `Bearer ${ROLES.admin}`)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should return partial results when some checks fail', async () => {
      const body = {
        checks: [
          { resource: 'order:create', action: 'create' },
          { resource: 'tenant:delete', action: 'delete' },
        ],
      }
      // cashier can create orders but not delete tenant
      const result = await controller.batchCheckPermission(body, `Bearer ${ROLES.cashier}`)
      expect(result.data[0].allowed).toBe(true)
      expect(result.data[1].allowed).toBe(false)
    })

    it('should preserve check order in response', async () => {
      const body = {
        checks: [
          { resource: 'member:read', action: 'read' },
          { resource: 'store:read', action: 'read' },
          { resource: 'order:create', action: 'create' },
        ],
      }
      const result = await controller.batchCheckPermission(body, `Bearer ${ROLES.salesGuide}`)
      expect(result.data[0].index).toBe(0)
      expect(result.data[1].index).toBe(1)
      expect(result.data[2].index).toBe(2)
    })
  })

  // ─── GET /permission/my ──────────────────────────────────

  describe('getMyPermissions', () => {
    it('should return user permission info for admin', async () => {
      const result = await controller.getMyPermissions(`Bearer ${ROLES.admin}`)
      expect(result.success).toBe(true)
      expect(result.data.context.userId).toBe('user_001')
      expect(result.data.permissions).toBeInstanceOf(Array)
      expect(result.data.dataScope).toBeDefined()
    })

    it('should return anonymous context when no auth header', async () => {
      const result = await controller.getMyPermissions(undefined)
      expect(result.success).toBe(true)
      expect(result.data.context.userId).toBe('anonymous')
      expect(result.data.context.roles).toEqual([])
      expect(result.data.permissions).toEqual([])
    })

    it('should return store manager context with correct role', async () => {
      const result = await controller.getMyPermissions(`Bearer ${ROLES.storeManager}`)
      expect(result.data.context.roles).toContain('STORE_MANAGER')
      expect(result.data.context.userId).toBe('user_sm')
    })

    it('should return HR context with no storeId (tenant-level role)', async () => {
      const result = await controller.getMyPermissions(`Bearer ${ROLES.hr}`)
      expect(result.data.context.userId).toBe('user_hr')
      expect(result.data.context.storeId).toBeUndefined()
    })

    it('should return dataScope object for authenticated users', async () => {
      const result = await controller.getMyPermissions(`Bearer ${ROLES.admin}`)
      expect(result.data.dataScope).toBeDefined()
      expect(result.data.dataScope).toHaveProperty('scopeType')
    })
  })

  // ─── Helper: extractContext ──────────────────────────────

  describe('extractContext (via getMyPermissions)', () => {
    it('should create anonymous context when auth is missing', async () => {
      const result = await controller.getMyPermissions(undefined)
      expect(result.data.context.userId).toBe('anonymous')
      expect(result.data.context.roles).toEqual([])
    })

    it('should create admin context when auth is provided', async () => {
      const result = await controller.getMyPermissions(`Bearer ${ROLES.admin}`)
      expect(result.data.context.userId).toBe('user_001')
      expect(result.data.context.roles).toContain('TENANT_ADMIN')
    })

    it('should fallback to anonymous for unknown bearer token', async () => {
      const result = await controller.getMyPermissions('Bearer unknown-role')
      expect(result.data.context.userId).toBe('anonymous')
      expect(result.data.context.roles).toEqual([])
    })

    it('should extract OPS context with tenant:* permissions', async () => {
      const result = await controller.getMyPermissions(`Bearer ${ROLES.ops}`)
      expect(result.data.context.roles).toContain('TENANT_ADMIN')
      expect(result.data.permissions).toContain('tenant:*')
    })

    it('should extract marketing context with campaign:* permissions', async () => {
      const result = await controller.getMyPermissions(`Bearer ${ROLES.marketing}`)
      expect(result.data.permissions).toContain('campaign:*')
      // marketing should not have tenant:* access
      expect(result.data.permissions).not.toContain('tenant:*')
    })
  })
})
