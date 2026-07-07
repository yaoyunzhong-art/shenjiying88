import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  AssignRoleDto,
  RevokeRoleDto,
  CheckPermissionDto,
  RegisterPolicyDto,
  RegisterProtectedActionDto,
} from './rbac.dto'

describe('AssignRoleDto', () => {
  it('should validate a valid assignment', async () => {
    const dto = new AssignRoleDto()
    dto.userId = 'user-1'
    dto.role = 'admin' as any
    dto.tenantId = 'tenant-a'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject empty userId', async () => {
    const dto = new AssignRoleDto()
    dto.userId = ''
    dto.role = 'admin' as any
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid role name', async () => {
    const dto = new AssignRoleDto()
    dto.userId = 'user-1'
    dto.role = 'superadmin' as any
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept all valid role values', async () => {
    const roles = ['owner', 'admin', 'manager', 'staff', 'guest']
    for (const role of roles) {
      const dto = new AssignRoleDto()
      dto.userId = 'user-1'
      dto.role = role as any
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    }
  })

  it('should accept optional tenantId and assignedBy', async () => {
    const dto = new AssignRoleDto()
    dto.userId = 'user-1'
    dto.role = 'manager' as any
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
    expect(dto.tenantId).toBeUndefined()
    expect(dto.assignedBy).toBeUndefined()
  })
})

describe('RevokeRoleDto', () => {
  it('should validate with just userId', async () => {
    const dto = new RevokeRoleDto()
    dto.userId = 'user-1'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject empty userId', async () => {
    const dto = new RevokeRoleDto()
    dto.userId = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept optional tenantId', async () => {
    const dto = new RevokeRoleDto()
    dto.userId = 'user-1'
    dto.tenantId = 'tenant-a'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('CheckPermissionDto', () => {
  it('should validate a valid permission check', async () => {
    const dto = new CheckPermissionDto()
    dto.userId = 'user-1'
    dto.permission = 'order:refund' as any
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject empty userId', async () => {
    const dto = new CheckPermissionDto()
    dto.userId = ''
    dto.permission = 'order:read' as any
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept optional tenantId', async () => {
    const dto = new CheckPermissionDto()
    dto.userId = 'user-1'
    dto.permission = 'report:export' as any
    dto.tenantId = 'tenant-b'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject empty permission', async () => {
    const dto = new CheckPermissionDto()
    dto.userId = 'user-1'
    dto.permission = '' as any
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('RegisterPolicyDto', () => {
  it('should validate a valid policy registration', async () => {
    const dto = new RegisterPolicyDto()
    dto.role = 'staff' as any
    dto.permissions = ['order:read', 'order:write'] as any
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject empty permissions array', async () => {
    const dto = new RegisterPolicyDto()
    dto.role = 'guest' as any
    dto.permissions = []
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept deniedPermissions option', async () => {
    const dto = new RegisterPolicyDto()
    dto.role = 'admin' as any
    dto.permissions = ['user:read', 'order:read'] as any
    dto.deniedPermissions = ['order:refund'] as any
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject invalid role', async () => {
    const dto = new RegisterPolicyDto()
    dto.role = 'god' as any
    dto.permissions = ['order:read'] as any
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('RegisterProtectedActionDto', () => {
  it('should validate a valid protected action registration', async () => {
    const dto = new RegisterProtectedActionDto()
    dto.controllerName = 'UserController'
    dto.actions = { create: ['user:write'], delete: ['user:delete'] }
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject empty controllerName', async () => {
    const dto = new RegisterProtectedActionDto()
    dto.controllerName = ''
    dto.actions = { list: ['user:read'] }
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})
