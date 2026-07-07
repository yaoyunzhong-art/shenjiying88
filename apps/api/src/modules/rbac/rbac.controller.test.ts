import { describe, it, expect, beforeEach } from 'vitest'
import { RBACController } from './rbac.controller'
import { RBACService, Role, Permission } from './rbac.service'

function createController() {
  const service = new RBACService()
  const controller = new RBACController(service as any)
  return { controller, service }
}

describe('RBACController', () => {
  describe('assignRole', () => {
    it('should assign a role and return assignment details', async () => {
      const { controller } = createController()
      const result = await controller.assignRole({
        userId: 'user-1',
        role: 'admin' as Role,
        tenantId: 'tenant-a',
        assignedBy: 'owner-1',
      })
      expect(result.success).toBe(true)
      expect(result.data.userId).toBe('user-1')
      expect(result.data.role).toBe('admin')
      expect(result.data.tenantId).toBe('tenant-a')
      expect(result.data.assignedBy).toBe('owner-1')
    })

    it('should assign without tenant (global role)', async () => {
      const { controller } = createController()
      const result = await controller.assignRole({
        userId: 'user-2',
        role: 'guest' as Role,
        assignedBy: 'system',
      })
      expect(result.success).toBe(true)
      expect(result.data.tenantId).toBeUndefined()
    })

    it('should replace existing role for same tenant', async () => {
      const { controller, service } = createController()
      await controller.assignRole({
        userId: 'user-1',
        role: 'admin' as Role,
        tenantId: 'tenant-a',
        assignedBy: 'owner-1',
      })
      await controller.assignRole({
        userId: 'user-1',
        role: 'manager' as Role,
        tenantId: 'tenant-a',
        assignedBy: 'owner-1',
      })
      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(1)
      expect(roles[0].role).toBe('manager')
    })
  })

  describe('revokeRole', () => {
    it('should revoke a role and return success', async () => {
      const { controller, service } = createController()
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      const result = await controller.revokeRole({ userId: 'user-1', tenantId: 'tenant-a' })
      expect(result.success).toBe(true)
      expect(result.message).toContain('tenant-a')
      expect(service.getUserRoles('user-1')).toHaveLength(0)
    })

    it('should revoke global role when no tenant', async () => {
      const { controller, service } = createController()
      service.assignRole('user-1', 'admin', undefined, 'owner-1')
      const result = await controller.revokeRole({ userId: 'user-1' })
      expect(result.success).toBe(true)
      expect(result.message).not.toContain('tenant')
      expect(service.getUserRoles('user-1')).toHaveLength(0)
    })

    it('should handle revoking nonexistent role gracefully', async () => {
      const { controller } = createController()
      const result = await controller.revokeRole({ userId: 'nonexistent' })
      expect(result.success).toBe(true)
    })
  })

  describe('getUserRoles', () => {
    it('should return assigned roles for a user', async () => {
      const { controller, service } = createController()
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      service.assignRole('user-1', 'staff', 'tenant-b', 'admin-1')
      const result = await controller.getUserRoles('user-1')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should return empty array for user with no roles', async () => {
      const { controller } = createController()
      const result = await controller.getUserRoles('nonexistent')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })
  })

  describe('checkPermission', () => {
    it('should return allowed=true when user has permission', async () => {
      const { controller, service } = createController()
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      const result = await controller.checkPermission({
        userId: 'user-1',
        permission: 'user:delete' as Permission,
        tenantId: 'tenant-a',
      })
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(true)
    })

    it('should return allowed=false when user lacks permission', async () => {
      const { controller, service } = createController()
      service.assignRole('user-1', 'guest', 'tenant-a', 'owner-1')
      const result = await controller.checkPermission({
        userId: 'user-1',
        permission: 'order:write' as Permission,
        tenantId: 'tenant-a',
      })
      expect(result.success).toBe(true)
      expect(result.data.allowed).toBe(false)
      expect(result.data.reason).toBeDefined()
    })
  })

  describe('authorize', () => {
    it('should authorize when user has permission', async () => {
      const { controller, service } = createController()
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      const result = await controller.authorize({
        userId: 'user-1',
        permission: 'user:delete' as Permission,
        tenantId: 'tenant-a',
      })
      expect(result.success).toBe(true)
      expect(result.data.authorized).toBe(true)
    })
  })

  describe('getUserReport', () => {
    it('should return full permission report', async () => {
      const { controller, service } = createController()
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      const result = await controller.getUserReport('user-1')
      expect(result.success).toBe(true)
      expect(result.data.roles).toHaveLength(1)
      expect(result.data.effectivePermissions).toContain('user:delete')
      expect(result.data.deniedPermissions).toContain('config:delete')
    })

    it('should return empty report for nonexistent user', async () => {
      const { controller } = createController()
      const result = await controller.getUserReport('nonexistent')
      expect(result.success).toBe(true)
      expect(result.data.roles).toHaveLength(0)
    })
  })

  describe('getRolePermissions', () => {
    it('should return permissions for a valid role', async () => {
      const { controller } = createController()
      const result = await controller.getRolePermissions('admin')
      expect(result.success).toBe(true)
      expect(result.data.role).toBe('admin')
      expect(result.data.permissions.length).toBeGreaterThan(0)
      expect(result.data.permissions).toContain('user:delete')
      expect(result.data.permissions).not.toContain('config:delete')
    })

    it('should reject invalid role', async () => {
      const { controller } = createController()
      await expect(controller.getRolePermissions('superadmin')).rejects.toThrow()
    })
  })

  describe('registerPolicy', () => {
    it('should register a custom policy', async () => {
      const { controller } = createController()
      const result = await controller.registerPolicy({
        role: 'staff' as Role,
        permissions: ['order:read' as Permission, 'order:write' as Permission],
        deniedPermissions: ['points:write' as Permission],
      })
      expect(result.success).toBe(true)
      expect(result.message).toContain('staff')
    })
  })

  describe('registerProtectedActions + getProtectedActions', () => {
    it('should register and retrieve protected actions', async () => {
      const { controller } = createController()
      const actions = { create: ['user:write' as Permission], delete: ['user:delete' as Permission] }
      const regResult = await controller.registerProtectedActions({
        controllerName: 'UserController',
        actions,
      })
      expect(regResult.success).toBe(true)

      const getResult = await controller.getProtectedActions('UserController')
      expect(getResult.success).toBe(true)
      expect(getResult.data.actions.create).toEqual(['user:write'])
      expect(getResult.data.actions.delete).toEqual(['user:delete'])
    })

    it('should return empty actions for unregistered controller', async () => {
      const { controller } = createController()
      const result = await controller.getProtectedActions('UnknownController')
      expect(result.success).toBe(true)
      expect(Object.keys(result.data.actions)).toHaveLength(0)
    })
  })
})
