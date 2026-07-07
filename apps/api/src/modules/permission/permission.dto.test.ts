// permission.dto.test.ts · 权限DTO测试
// Phase-FP P0 · 2026-07-05

import { describe, it, expect } from 'vitest'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  AssignRoleDto,
  RevokeRoleDto,
  CreateRoleDto,
  CheckPermissionDto,
  BatchCheckPermissionDto,
  BatchCheckPermissionItemDto,
} from './permission.dto'
import { PermissionLevel, ActionType, DataScopeType } from './permission.types'

// ─── AssignRoleDto ─────────────────────────────────────────────

describe('AssignRoleDto', () => {
  it('should accept valid assign role payload', async () => {
    const input = {
      userId: 'user_001',
      roleId: 'STORE_MANAGER',
      tenantId: 'tenant_demo',
      storeIds: ['store_001', 'store_002'],
    }

    const dto = plainToInstance(AssignRoleDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.userId).toBe('user_001')
    expect(dto.storeIds).toHaveLength(2)
  })

  it('should reject missing required fields', async () => {
    const input = {
      // missing userId, roleId, tenantId
      storeIds: ['store_001'],
    }

    const dto = plainToInstance(AssignRoleDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })

  it('should work without optional storeIds and brandIds', async () => {
    const input = {
      userId: 'user_002',
      roleId: 'MEMBER',
      tenantId: 'tenant_demo',
    }

    const dto = plainToInstance(AssignRoleDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.storeIds).toBeUndefined()
    expect(dto.brandIds).toBeUndefined()
  })
})

// ─── RevokeRoleDto ─────────────────────────────────────────────

describe('RevokeRoleDto', () => {
  it('should accept valid revoke role payload', async () => {
    const input = {
      userId: 'user_001',
      roleId: 'STORE_MANAGER',
      tenantId: 'tenant_demo',
    }

    const dto = plainToInstance(RevokeRoleDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty user id', async () => {
    const input = {
      userId: '',
      roleId: 'STORE_MANAGER',
      tenantId: 'tenant_demo',
    }

    const dto = plainToInstance(RevokeRoleDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── CreateRoleDto ─────────────────────────────────────────────

describe('CreateRoleDto', () => {
  it('should accept valid create role payload', async () => {
    const input = {
      roleName: 'VIP_MANAGER',
      roleNameZh: 'VIP管理员',
      description: 'VIP客户专属管理角色',
      level: PermissionLevel.BRAND,
      permissions: ['member:read', 'member:update', 'coupon:*'],
    }

    const dto = plainToInstance(CreateRoleDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.permissions).toHaveLength(3)
  })

  it('should reject empty permissions array', async () => {
    const input = {
      roleName: 'EMPTY_ROLE',
      roleNameZh: '空权限角色',
      level: PermissionLevel.SELF,
      permissions: [],
    }

    const dto = plainToInstance(CreateRoleDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it('should work with optional tenantId', async () => {
    const input = {
      roleName: 'TENANT_ROLE',
      roleNameZh: '租户角色',
      level: PermissionLevel.TENANT,
      permissions: ['brand:read'],
      tenantId: 'tenant_custom',
    }

    const dto = plainToInstance(CreateRoleDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.tenantId).toBe('tenant_custom')
  })
})

// ─── CheckPermissionDto ────────────────────────────────────────

describe('CheckPermissionDto', () => {
  it('should accept valid check permission payload', async () => {
    const input = {
      resource: 'store:update',
      action: ActionType.UPDATE,
    }

    const dto = plainToInstance(CheckPermissionDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.action).toBe(ActionType.UPDATE)
  })

  it('should reject empty resource', async () => {
    const input = {
      resource: '',
      action: ActionType.READ,
    }

    const dto = plainToInstance(CheckPermissionDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it('should work with optional resourceId and data', async () => {
    const input = {
      resource: 'order:read',
      action: ActionType.READ,
      resourceId: 'order_001',
      data: { storeId: 'store_001', tenantId: 'tenant_demo' },
    }

    const dto = plainToInstance(CheckPermissionDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.resourceId).toBe('order_001')
    expect(dto.data?.storeId).toBe('store_001')
  })
})

// ─── BatchCheckPermissionDto ───────────────────────────────────

describe('BatchCheckPermissionDto', () => {
  it('should accept valid batch check payload', async () => {
    const input = {
      checks: [
        { resource: 'store:read', action: ActionType.READ },
        { resource: 'order:create', action: ActionType.CREATE },
      ],
    }

    const dto = plainToInstance(BatchCheckPermissionDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.checks).toHaveLength(2)
  })

  it('should reject empty checks array', async () => {
    const input = {
      checks: [],
    }

    const dto = plainToInstance(BatchCheckPermissionDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })
})
