import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validateSync } from 'class-validator'
import {
  AuthorizeActionDto,
  ValidateTenantScopeDto,
  ValidateRoleDto,
  ValidatePermissionDto,
  AuthorizationDecisionResponseDto,
  ResolvedActorContextResponseDto,
  IdentityAccessDescriptorResponseDto,
  AuthenticationStatusResponseDto
} from './identity-access.dto'

// ── AuthorizeActionDto ──────────────────────────────────────────
it('AuthorizeActionDto accepts valid payload', () => {
  const dto = Object.assign(new AuthorizeActionDto(), {
    action: 'identity-access:read',
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001'
  })
  assert.equal(validateSync(dto).length, 0)
})

it('AuthorizeActionDto accepts action only (all scope fields optional)', () => {
  const dto = Object.assign(new AuthorizeActionDto(), { action: 'tenant:read' })
  assert.equal(validateSync(dto).length, 0)
})

it('AuthorizeActionDto rejects missing action', () => {
  const dto = Object.assign(new AuthorizeActionDto(), { tenantId: 't-001' })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'action')
})

it('AuthorizeActionDto rejects non-string action', () => {
  const dto = Object.assign(new AuthorizeActionDto(), { action: 123 })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
})

// ── ValidateTenantScopeDto ──────────────────────────────────────
it('ValidateTenantScopeDto accepts valid payload', () => {
  const dto = Object.assign(new ValidateTenantScopeDto(), {
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001'
  })
  assert.equal(validateSync(dto).length, 0)
})

it('ValidateTenantScopeDto rejects missing tenantId', () => {
  const dto = Object.assign(new ValidateTenantScopeDto(), { brandId: 'b-001' })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'tenantId')
})

it('ValidateTenantScopeDto accepts tenantId only', () => {
  const dto = Object.assign(new ValidateTenantScopeDto(), { tenantId: 't-001' })
  assert.equal(validateSync(dto).length, 0)
})

// ── ValidateRoleDto ─────────────────────────────────────────────
it('ValidateRoleDto accepts valid roles array', () => {
  const dto = Object.assign(new ValidateRoleDto(), {
    roles: ['tenant-admin', 'platform-admin']
  })
  assert.equal(validateSync(dto).length, 0)
})

it('ValidateRoleDto rejects missing roles', () => {
  const dto = Object.assign(new ValidateRoleDto(), {})
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'roles')
})

it('ValidateRoleDto rejects non-string array elements', () => {
  const dto = Object.assign(new ValidateRoleDto(), { roles: [123, 456] })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
})

it('ValidateRoleDto accepts empty roles array', () => {
  const dto = Object.assign(new ValidateRoleDto(), { roles: [] })
  assert.equal(validateSync(dto).length, 0)
})

// ── ValidatePermissionDto ───────────────────────────────────────
it('ValidatePermissionDto accepts valid permissions array', () => {
  const dto = Object.assign(new ValidatePermissionDto(), {
    permissions: ['identity-access:read', 'tenant:admin']
  })
  assert.equal(validateSync(dto).length, 0)
})

it('ValidatePermissionDto rejects missing permissions', () => {
  const dto = Object.assign(new ValidatePermissionDto(), {})
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'permissions')
})

it('ValidatePermissionDto rejects non-string array elements', () => {
  const dto = Object.assign(new ValidatePermissionDto(), { permissions: [true, false] })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
})

// ── AuthorizationDecisionResponseDto ────────────────────────────
it('AuthorizationDecisionResponseDto accepts allowed status', () => {
  const dto = Object.assign(new AuthorizationDecisionResponseDto(), {
    status: 'allowed',
    action: 'identity-access:read',
    tenantId: 't-001',
    permissionMatched: true,
    tenantScopeMatched: true
  })
  assert.equal(validateSync(dto).length, 0)
})

it('AuthorizationDecisionResponseDto accepts denied status', () => {
  const dto = Object.assign(new AuthorizationDecisionResponseDto(), {
    status: 'denied',
    action: 'tenant:admin',
    permissionMatched: false,
    tenantScopeMatched: false
  })
  assert.equal(validateSync(dto).length, 0)
})

it('AuthorizationDecisionResponseDto rejects invalid status value', () => {
  const dto = Object.assign(new AuthorizationDecisionResponseDto(), {
    status: 'unknown',
    action: 'read',
    permissionMatched: false,
    tenantScopeMatched: false
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'status')
})

it('AuthorizationDecisionResponseDto rejects non-boolean flags', () => {
  const dto = Object.assign(new AuthorizationDecisionResponseDto(), {
    status: 'allowed',
    action: 'read',
    permissionMatched: 'yes',
    tenantScopeMatched: 'yes'
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
})

// ── ResolvedActorContextResponseDto ─────────────────────────────
it('ResolvedActorContextResponseDto accepts authenticated actor', () => {
  const dto = Object.assign(new ResolvedActorContextResponseDto(), {
    authenticated: true,
    effectiveTenantId: 't-001',
    effectiveBrandId: 'b-001',
    effectiveStoreId: 's-001',
    effectiveMarketCode: 'CN',
    roles: ['tenant-admin'],
    permissions: ['tenant:read']
  })
  assert.equal(validateSync(dto).length, 0)
})

it('ResolvedActorContextResponseDto accepts unauthenticated actor', () => {
  const dto = Object.assign(new ResolvedActorContextResponseDto(), {
    authenticated: false,
    roles: [],
    permissions: []
  })
  assert.equal(validateSync(dto).length, 0)
})

it('ResolvedActorContextResponseDto rejects missing required fields', () => {
  const dto = Object.assign(new ResolvedActorContextResponseDto(), {
    authenticated: true
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  const props = errors.map((e) => e.property)
  assert.equal(props.includes('roles'), true)
  assert.equal(props.includes('permissions'), true)
})

// ── IdentityAccessDescriptorResponseDto ─────────────────────────
it('IdentityAccessDescriptorResponseDto accepts valid descriptor', () => {
  const dto = Object.assign(new IdentityAccessDescriptorResponseDto(), {
    key: 'identity-access',
    name: 'Identity Access Module',
    purpose: '统一认证、授权与租户隔离入口',
    inboundContracts: ['HTTP headers'],
    outboundContracts: ['Resolved actor context']
  })
  assert.equal(validateSync(dto).length, 0)
})

it('IdentityAccessDescriptorResponseDto rejects missing key', () => {
  const dto = Object.assign(new IdentityAccessDescriptorResponseDto(), {
    name: 'Test',
    purpose: 'Test purpose',
    inboundContracts: [],
    outboundContracts: []
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'key')
})

// ── AuthenticationStatusResponseDto ─────────────────────────────
it('AuthenticationStatusResponseDto accepts authenticated actor', () => {
  const dto = Object.assign(new AuthenticationStatusResponseDto(), {
    authenticated: true,
    actorId: 'user-001',
    actorType: 'staff',
    roles: ['tenant-admin'],
    permissions: ['tenant:read', 'identity-access:read']
  })
  assert.equal(validateSync(dto).length, 0)
})

it('AuthenticationStatusResponseDto accepts unauthenticated actor', () => {
  const dto = Object.assign(new AuthenticationStatusResponseDto(), {
    authenticated: false,
    roles: [],
    permissions: []
  })
  assert.equal(validateSync(dto).length, 0)
})

it('AuthenticationStatusResponseDto rejects missing permissions', () => {
  const dto = Object.assign(new AuthenticationStatusResponseDto(), {
    authenticated: true,
    roles: []
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'permissions')
})
