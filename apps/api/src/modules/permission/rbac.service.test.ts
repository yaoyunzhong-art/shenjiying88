import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { RbacService } from './rbac.service'
import { PermissionContext } from './permission.types'

describe('RbacService', () => {
  let service: RbacService

  beforeEach(() => {
    service = new RbacService()
  })

  describe('checkPermission', () => {
    it('should allow platform admin to do anything', () => {
      const context: PermissionContext = {
        userId: 'admin',
        tenantId: 'tenant1',
        roles: ['PLATFORM_ADMIN'],
        permissions: [],
      }
      const result = service.checkPermission(context, 'any:resource', 'delete' as any)
      expect(result.allowed).toBe(true)
    })

    it('should allow with wildcard permission', () => {
      const context: PermissionContext = {
        userId: 'admin',
        tenantId: 'tenant1',
        roles: [],
        permissions: ['*'],
      }
      const result = service.checkPermission(context, 'any:resource', 'any' as any)
      expect(result.allowed).toBe(true)
    })

    it('should deny when permission is missing', () => {
      const context: PermissionContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        roles: ['MEMBER'],
        permissions: ['member:read'],
      }
      const result = service.checkPermission(context, 'tenant:create', 'create' as any)
      expect(result.allowed).toBe(false)
    })
  })

  describe('resolveUserPermissions', () => {
    it('should return combined permissions from context and roles', () => {
      const context: PermissionContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        roles: ['CASHIER'],
        permissions: ['custom:permission'],
      }
      const permissions = service.resolveUserPermissions(context)
      expect(permissions).toContain('custom:permission')
      expect(permissions).toContain('order:create')
    })
  })

  describe('getRole', () => {
    it('should return role by name', () => {
      const role = service.getRole('PLATFORM_ADMIN')
      expect(role).toBeDefined()
      expect(role?.roleName).toBe('PLATFORM_ADMIN')
    })

    it('should return undefined for non-existent role', () => {
      const role = service.getRole('NON_EXISTENT_ROLE')
      expect(role).toBeUndefined()
    })
  })

  describe('assignRole', () => {
    it('should assign role to user', () => {
      service.assignRole('user1', 'CASHIER')
      const roles = service.getUserRoles('user1')
      expect(roles.some(r => r.roleName === 'CASHIER')).toBe(true)
    })
  })

  describe('revokeRole', () => {
    it('should revoke role from user', () => {
      service.assignRole('user1', 'CASHIER')
      service.revokeRole('user1', 'CASHIER')
      const roles = service.getUserRoles('user1')
      expect(roles.some(r => r.roleName === 'CASHIER')).toBe(false)
    })
  })

  describe('getAllRoles', () => {
    it('should return all builtin roles', () => {
      const roles = service.getAllRoles()
      expect(roles.length).toBeGreaterThan(0)
    })
  })

  describe('getAllPermissions', () => {
    it('should return all builtin permissions', () => {
      const permissions = service.getAllPermissions()
      expect(permissions.length).toBeGreaterThan(0)
    })
  })
})
