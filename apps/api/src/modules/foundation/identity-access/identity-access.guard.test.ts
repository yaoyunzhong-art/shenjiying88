import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IdentityAccessGuard } from './identity-access.guard'
import { IdentityAccessService } from './identity-access.service'

const makeReq = (overrides: Record<string, unknown> = {}): any => ({
  tenantContext: {
    tenantId: 'tenant-1',
    brandId: 'brand-1',
    storeId: 'store-1',
    marketCode: 'us-default',
  },
  actorContext: {
    actorId: 'actor-1',
    actorType: 'tenant-user' as const,
    source: 'headers' as const,
    roles: ['tenant-admin'],
    permissions: ['tenant:read'],
    authenticated: true,
  },
  params: {},
  ...overrides,
})

const makeReflector = (
  handlerRoles: string[] | null = null,
  handlerPermissions: string[] | null = null,
  tenantScopeMeta: any = null
) =>
  ({
    getAllAndOverride: (key: string) => {
      if (key === 'identity-access:roles') return handlerRoles ?? []
      if (key === 'identity-access:permissions') return handlerPermissions ?? []
      if (key === 'identity-access:tenant-scope') return tenantScopeMeta ?? undefined
      return undefined
    },
  }) as any as Reflector

const makeContext = (req: any = makeReq()) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  }) as any as ExecutionContext

describe('IdentityAccessGuard', () => {
  describe('canActivate', () => {
    it('returns true when no roles, permissions, or tenant scope metadata set', () => {
      const reflector = makeReflector()
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const context = makeContext()

      const result = guard.canActivate(context)
      assert.equal(result, true)
    })

    it('throws UnauthorizedException when actorContext is missing', () => {
      const reflector = makeReflector(['tenant-admin'])
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const req = makeReq()
      delete req.actorContext
      const context = makeContext(req)

      assert.throws(
        () => guard.canActivate(context),
        (err: Error) => {
          assert.ok(err instanceof UnauthorizedException)
          assert.ok(err.message.includes('Missing actor context headers'))
          return true
        }
      )
    })

    it('throws UnauthorizedException when actorContext is not authenticated', () => {
      const reflector = makeReflector(['tenant-admin'])
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const req = makeReq({ actorContext: { actorId: 'actor-1', authenticated: false } })
      const context = makeContext(req)

      assert.throws(
        () => guard.canActivate(context),
        (err: Error) => err instanceof UnauthorizedException
      )
    })

    it('throws ForbiddenException when required role not satisfied', () => {
      const reflector = makeReflector(['super-admin'])
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const context = makeContext(makeReq())

      assert.throws(
        () => guard.canActivate(context),
        (err: Error) => {
          assert.ok(err instanceof ForbiddenException)
          assert.ok(err.message.includes('Required role not satisfied'))
          return true
        }
      )
    })

    it('returns true when actor has required role', () => {
      const reflector = makeReflector(['tenant-admin'])
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const context = makeContext(makeReq())

      assert.equal(guard.canActivate(context), true)
    })

    it('throws ForbiddenException when required permission not satisfied', () => {
      const reflector = makeReflector([], ['identity-access:write'])
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const context = makeContext(makeReq())

      assert.throws(
        () => guard.canActivate(context),
        (err: Error) => {
          assert.ok(err instanceof ForbiddenException)
          assert.ok(err.message.includes('Required permission not satisfied'))
          return true
        }
      )
    })

    it('returns true when actor has required permission', () => {
      const reflector = makeReflector([], ['tenant:read'])
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const context = makeContext(makeReq())

      assert.equal(guard.canActivate(context), true)
    })

    it('passes scope check when tenantScopeMeta has tenantIdParam but params empty (undefined skips check)', () => {
      const reflector = makeReflector(['tenant-admin'], [], { tenantIdParam: 'tenantId' })
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const req = makeReq({
        actorContext: {
          actorId: 'actor-1',
          actorType: 'tenant-user' as const,
          source: 'headers' as const,
          roles: ['tenant-admin'],
          permissions: ['tenant:read'],
          authenticated: true,
          tenantId: 'tenant-1',
        },
      })
      const context = makeContext(req)

      assert.equal(guard.canActivate(context), true)
    })

    it('throws ForbiddenException when tenant scope validation fails with mismatched tenantIdParam', () => {
      const reflector = makeReflector(['tenant-admin'], [], { tenantIdParam: 'tenantId' })
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const req = makeReq({ params: { tenantId: 'tenant-2' } })
      const context = makeContext(req)

      assert.throws(
        () => guard.canActivate(context),
        (err: Error) => {
          assert.ok(err instanceof ForbiddenException)
          assert.ok(err.message.includes('Tenant scope validation failed'))
          return true
        }
      )
    })

    it('returns true when tenant scope matches via params', () => {
      const reflector = makeReflector(['tenant-admin'], [], { tenantIdParam: 'tenantId' })
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const req = makeReq({
        params: { tenantId: 'tenant-1' },
        actorContext: {
          actorId: 'actor-1',
          actorType: 'tenant-user' as const,
          source: 'headers' as const,
          roles: ['tenant-admin'],
          permissions: ['tenant:read'],
          authenticated: true,
          tenantId: 'tenant-1',
        },
      })
      const context = makeContext(req)

      assert.equal(guard.canActivate(context), true)
    })

    it('returns true when actor is privileged (platform-admin) for scope-only metadata', () => {
      const reflector = makeReflector(['platform-admin'], [], { tenantIdParam: 'tenantId' })
      const service = new IdentityAccessService()
      const guard = new IdentityAccessGuard(reflector, service)
      const req = makeReq({
        params: { tenantId: 'tenant-2' },
        actorContext: {
          actorId: 'actor-1',
          actorType: 'tenant-user' as const,
          source: 'headers' as const,
          roles: ['platform-admin'],
          permissions: ['*'],
          authenticated: true,
        },
      })
      const context = makeContext(req)

      assert.equal(guard.canActivate(context), true)
    })
  })
})
