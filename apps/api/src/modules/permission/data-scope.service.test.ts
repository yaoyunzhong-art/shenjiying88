import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { DataScopeService } from './data-scope.service'
import { PermissionContext } from './permission.types'

describe('DataScopeService', () => {
  let service: DataScopeService

  beforeEach(() => {
    service = new DataScopeService()
  })

  describe('getDataScope', () => {
    it('should return platform scope for platform admin', () => {
      const context: PermissionContext = {
        userId: 'admin',
        tenantId: 'tenant1',
        roles: ['PLATFORM_ADMIN'],
        permissions: [],
      }
      const scope = service.getDataScope(context)
      expect(scope.scopeType).toBe('platform')
    })

    it('should return tenant scope for tenant admin', () => {
      const context: PermissionContext = {
        userId: 'admin',
        tenantId: 'tenant1',
        roles: ['TENANT_ADMIN'],
        permissions: [],
      }
      const scope = service.getDataScope(context)
      expect(scope.scopeType).toBe('tenant')
    })

    it('should return self scope for member', () => {
      const context: PermissionContext = {
        userId: 'member1',
        tenantId: 'tenant1',
        roles: ['MEMBER'],
        permissions: [],
      }
      const scope = service.getDataScope(context)
      expect(scope.scopeType).toBe('self')
    })
  })

  describe('canAccessResource', () => {
    it('should allow platform admin to access any resource', () => {
      const context: PermissionContext = {
        userId: 'admin',
        tenantId: 'tenant1',
        roles: ['PLATFORM_ADMIN'],
        permissions: [],
      }
      const canAccess = service.canAccessResource(context, 'different-tenant')
      expect(canAccess).toBe(true)
    })

    it('should deny access for different tenant', () => {
      const context: PermissionContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        roles: ['STORE_MANAGER'],
        permissions: [],
      }
      const canAccess = service.canAccessResource(context, 'different-tenant')
      expect(canAccess).toBe(false)
    })
  })

  describe('applyDataScopeFilter', () => {
    it('should add tenant filter for tenant scope', () => {
      const context: PermissionContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        roles: ['TENANT_ADMIN'],
        permissions: [],
      }
      const scope = service.getDataScope(context)
      const filtered = service.applyDataScopeFilter(scope, context, {})
      expect(filtered.tenantId).toBe('tenant1')
    })

    it('should not filter for platform scope', () => {
      const context: PermissionContext = {
        userId: 'admin',
        tenantId: 'tenant1',
        roles: ['PLATFORM_ADMIN'],
        permissions: [],
      }
      const scope = service.getDataScope(context)
      const filtered = service.applyDataScopeFilter(scope, context, { custom: 'data' })
      expect(filtered).toEqual({ custom: 'data' })
    })
  })

  describe('assignStores', () => {
    it('should assign stores to user', () => {
      service.assignStores('user1', ['store1', 'store2'])
      const context: PermissionContext = {
        userId: 'user1',
        tenantId: 'tenant1',
        storeId: 'store1',
        roles: ['STORE_MANAGER'],
        permissions: [],
      }
      const scope = service.getDataScope(context)
      expect(scope.allowedStoreIds).toContain('store1')
    })
  })
})
