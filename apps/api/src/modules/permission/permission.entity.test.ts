// permission.entity.test.ts · 权限实体测试
// Phase-FP P0 · 2026-07-05

import { describe, it, expect } from 'vitest'
import {
  RoleEntity,
  PermissionEntity,
  RoleAssignmentEntity,
  UserPermissionSnapshot,
  PermissionAuditLog,
  PERMISSION_CACHE_PREFIX,
  PERMISSION_CACHE_TTL,
  PERMISSION_AUDIT_ENABLED,
} from './permission.entity'
import { PermissionLevel, ResourceType, ActionType, DataScopeType } from './permission.types'

describe('RoleEntity', () => {
  it('should create a valid role entity', () => {
    const role: RoleEntity = {
      roleId: 'store_manager',
      roleName: 'STORE_MANAGER',
      roleNameZh: '店长',
      description: '门店管理员',
      level: PermissionLevel.STORE,
      permissions: ['store:read', 'store:update', 'member:read', 'order:*'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    expect(role.roleId).toBe('store_manager')
    expect(role.roleName).toBe('STORE_MANAGER')
    expect(role.level).toBe(PermissionLevel.STORE)
    expect(role.permissions).toContain('order:*')
  })

  it('should allow tenant-specific roles', () => {
    const role: RoleEntity = {
      roleId: 'custom_role_001',
      roleName: 'CUSTOM_ROLE',
      roleNameZh: '自定义角色',
      level: PermissionLevel.BRAND,
      permissions: ['brand:read'],
      tenantId: 'tenant_abc',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    expect(role.tenantId).toBe('tenant_abc')
    expect(role.level).toBe(PermissionLevel.BRAND)
  })

  it('should default to empty permissions when not explicitly set in constructor', () => {
    const role: RoleEntity = {
      roleId: 'empty_role',
      roleName: 'EMPTY',
      roleNameZh: '空角色',
      level: PermissionLevel.SELF,
      permissions: [],
      createdAt: 0,
      updatedAt: 0,
    }

    expect(role.permissions).toHaveLength(0)
  })
})

describe('PermissionEntity', () => {
  it('should create a valid permission entity', () => {
    const perm: PermissionEntity = {
      permissionId: 'p001',
      permissionKey: 'tenant:create',
      permissionName: '创建租户',
      resourceType: ResourceType.TENANT,
      actions: [ActionType.CREATE],
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    expect(perm.permissionKey).toBe('tenant:create')
    expect(perm.resourceType).toBe(ResourceType.TENANT)
    expect(perm.actions).toContain(ActionType.CREATE)
    expect(perm.enabled).toBe(true)
  })

  it('should support disabled permissions', () => {
    const perm: PermissionEntity = {
      permissionId: 'p_disabled',
      permissionKey: 'legacy:feature',
      permissionName: '已废弃功能',
      resourceType: ResourceType.CONFIG,
      actions: [ActionType.EXECUTE],
      enabled: false,
      description: '此权限已停用',
      createdAt: 0,
      updatedAt: 0,
    }

    expect(perm.enabled).toBe(false)
    expect(perm.description).toBe('此权限已停用')
  })
})

describe('RoleAssignmentEntity', () => {
  it('should create a valid role assignment', () => {
    const assignment: RoleAssignmentEntity = {
      id: 'assign_001',
      userId: 'user_123',
      roleName: 'STORE_MANAGER',
      tenantId: 'tenant_demo',
      storeIds: ['store_001', 'store_002'],
      assignedAt: Date.now(),
    }

    expect(assignment.userId).toBe('user_123')
    expect(assignment.storeIds).toHaveLength(2)
    expect(assignment.expiresAt).toBeUndefined()
  })

  it('should support role assignment with expiration', () => {
    const future = Date.now() + 86400000 // 1 day later
    const assignment: RoleAssignmentEntity = {
      id: 'assign_temp',
      userId: 'user_temp',
      roleName: 'CASHIER',
      tenantId: 'tenant_demo',
      assignedAt: Date.now(),
      expiresAt: future,
    }

    expect(assignment.expiresAt).toBe(future)
    expect(assignment.expiresAt).toBeGreaterThan(assignment.assignedAt)
  })
})

describe('UserPermissionSnapshot', () => {
  it('should create a valid snapshot', () => {
    const snapshot: UserPermissionSnapshot = {
      userId: 'user_001',
      tenantId: 'tenant_demo',
      roles: ['STORE_MANAGER'],
      permissions: ['store:read', 'store:update', 'order:*'],
      dataScope: {
        scopeType: DataScopeType.STORE,
        allowedStoreIds: ['store_001'],
        ownOnly: false,
      },
      snapshotAt: Date.now(),
      expiresAt: Date.now() + PERMISSION_CACHE_TTL,
    }

    expect(snapshot.roles).toContain('STORE_MANAGER')
    expect(snapshot.dataScope.scopeType).toBe(DataScopeType.STORE)
    expect(snapshot.dataScope.allowedStoreIds).toContain('store_001')
    expect(snapshot.expiresAt - snapshot.snapshotAt).toBe(PERMISSION_CACHE_TTL)
  })

  it('should support platform admin snapshot', () => {
    const snapshot: UserPermissionSnapshot = {
      userId: 'admin',
      tenantId: 'platform',
      roles: ['PLATFORM_ADMIN'],
      permissions: ['*'],
      dataScope: {
        scopeType: DataScopeType.PLATFORM,
      },
      snapshotAt: Date.now(),
      expiresAt: Date.now() + PERMISSION_CACHE_TTL,
    }

    expect(snapshot.dataScope.allowedStoreIds).toBeUndefined()
    expect(snapshot.permissions).toContain('*')
  })
})

describe('PermissionAuditLog', () => {
  it('should create an audit log for permission check', () => {
    const log: PermissionAuditLog = {
      auditId: 'audit_001',
      timestamp: Date.now(),
      operatorId: 'user_001',
      operationType: 'check',
      targetRole: 'STORE_MANAGER',
      resource: 'store:update',
      result: 'allowed',
      detail: 'User has STORE_MANAGER role with store:update permission',
    }

    expect(log.operationType).toBe('check')
    expect(log.result).toBe('allowed')
    expect(log.detail).toContain('STORE_MANAGER')
  })

  it('should support revoke audit log', () => {
    const log: PermissionAuditLog = {
      auditId: 'audit_002',
      timestamp: Date.now(),
      operatorId: 'admin',
      operationType: 'revoke',
      targetUserId: 'user_002',
      targetRole: 'CASHIER',
      result: 'success',
    }

    expect(log.operationType).toBe('revoke')
    expect(log.targetUserId).toBe('user_002')
    expect(log.detail).toBeUndefined()
  })

  it('should support denial audit log', () => {
    const log: PermissionAuditLog = {
      auditId: 'audit_003',
      timestamp: Date.now(),
      operatorId: 'user_003',
      operationType: 'check',
      result: 'denied',
      resource: 'tenant:delete',
      detail: 'Missing permission: tenant:delete',
    }

    expect(log.result).toBe('denied')
    expect(log.operatorId).toBe('user_003')
  })
})

describe('Permission constants', () => {
  it('should have correct cache prefix', () => {
    expect(PERMISSION_CACHE_PREFIX).toBe('perm:snapshot:')
  })

  it('should have reasonable cache TTL (5 min)', () => {
    expect(PERMISSION_CACHE_TTL).toBe(5 * 60 * 1000)
  })

  it('should enable audit logging', () => {
    expect(PERMISSION_AUDIT_ENABLED).toBe(true)
  })
})
