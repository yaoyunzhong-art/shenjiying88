import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import { PermissionCheckRequest, PermissionContext } from './permission.types'

describe('PermissionService', () => {
  let service: PermissionService
  let rbacService: RbacService
  let dataScopeService: DataScopeService

  beforeEach(() => {
    rbacService = new RbacService()
    dataScopeService = new DataScopeService()
    service = new PermissionService(rbacService, dataScopeService)
  })

  describe('checkPermission', () => {
    it('should allow platform admin to access any resource', () => {
      const context: PermissionContext = {
        userId: 'admin',
        tenantId: 'tenant1',
        roles: ['PLATFORM_ADMIN'],
        permissions: [],
      }
      const request: PermissionCheckRequest = {
        context,
        resource: 'tenant:create',
        action: 'create' as any,
      }
      const result = service.checkPermission(request)
      expect(result.allowed).toBe(true)
    })

    it('should deny access when permission is missing', () => {
      const context: PermissionContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        roles: ['MEMBER'],
        permissions: [],
      }
      const request: PermissionCheckRequest = {
        context,
        resource: 'tenant:create',
        action: 'create' as any,
      }
      const result = service.checkPermission(request)
      expect(result.allowed).toBe(false)
    })
  })

  describe('quickCheck', () => {
    it('should return true for allowed permission', () => {
      const context: PermissionContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        roles: ['PLATFORM_ADMIN'],
        permissions: [],
      }
      const result = service.quickCheck(context, 'tenant:create', 'create')
      expect(result).toBe(true)
    })
  })

  describe('getUserPermissions', () => {
    it('should return permissions from context', () => {
      const context: PermissionContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        roles: ['PLATFORM_ADMIN'],
        permissions: ['custom:permission'],
      }
      const permissions = service.getUserPermissions(context)
      expect(permissions).toContain('custom:permission')
    })
  })

  describe('batchCheck', () => {
    it('should check multiple permissions', () => {
      const context: PermissionContext = {
        userId: 'admin',
        tenantId: 'tenant1',
        roles: ['PLATFORM_ADMIN'],
        permissions: [],
      }
      const requests: PermissionCheckRequest[] = [
        { context, resource: 'tenant:create', action: 'create' as any },
        { context, resource: 'tenant:delete', action: 'delete' as any },
      ]
      const results = service.batchCheck(requests)
      expect(results).toHaveLength(2)
      expect(results.every(r => r.allowed)).toBe(true)
    })
  })

  describe('getAllRoles', () => {
    it('should return all available roles', () => {
      const roles = service.getAllRoles()
      expect(roles.length).toBeGreaterThan(0)
    })
  })

  describe('getAllPermissions', () => {
    it('should return all available permissions', () => {
      const permissions = service.getAllPermissions()
      expect(permissions.length).toBeGreaterThan(0)
    })
  })
})
