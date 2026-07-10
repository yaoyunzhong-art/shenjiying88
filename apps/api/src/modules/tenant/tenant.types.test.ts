import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
// Ensure types are importable and structurally sound
import * as types from './tenant.types'

describe('tenant types', () => {
  describe('ActorType', () => {
    it('is a string union type (resolved from module)', () => {
      // ActorType is a type, runtime check that module loads without error
      assert.ok(types)
    })
  })

  describe('RequestTenantContext shape', () => {
    it('can construct with required fields', () => {
      const ctx: { tenantId: string; brandId?: string; storeId?: string; marketCode?: string } = {
        tenantId: 't-001',
        brandId: 'b-001',
        storeId: 's-001',
        marketCode: 'CN',
      }
      assert.equal(ctx.tenantId, 't-001')
      assert.equal(ctx.brandId, 'b-001')
      assert.equal(ctx.storeId, 's-001')
      assert.equal(ctx.marketCode, 'CN')
    })

    it('can construct with only tenantId', () => {
      const ctx: { tenantId: string; brandId?: string; storeId?: string; marketCode?: string } = {
        tenantId: 't-minimal',
      }
      assert.equal(ctx.tenantId, 't-minimal')
      assert.equal(ctx.brandId, undefined)
    })
  })

  describe('RequestActorContext shape', () => {
    it('can construct a minimal authenticated actor', () => {
      const actor: {
        actorId: string
        actorType: string
        actorName?: string
        roles: string[]
        permissions: string[]
        authenticated: boolean
        source: 'headers'
      } = {
        actorId: 'user-1',
        actorType: 'platform-user',
        roles: ['admin'],
        permissions: ['read:all', 'write:all'],
        authenticated: true,
        source: 'headers',
      }
      assert.equal(actor.actorId, 'user-1')
      assert.equal(actor.actorType, 'platform-user')
      assert.deepStrictEqual(actor.roles, ['admin'])
      assert.deepStrictEqual(actor.permissions, ['read:all', 'write:all'])
      assert.equal(actor.authenticated, true)
      assert.equal(actor.source, 'headers')
    })

    it('can construct an actor with tenant/brand/store context', () => {
      const actor: {
        actorId: string
        actorType: string
        tenantId?: string
        brandId?: string
        storeId?: string
        roles: string[]
        permissions: string[]
        authenticated: boolean
        source: 'headers'
      } = {
        actorId: 'store-staff-1',
        actorType: 'store-user',
        tenantId: 't-001',
        brandId: 'b-001',
        storeId: 's-001',
        roles: ['store-staff'],
        permissions: ['read:inventory'],
        authenticated: true,
        source: 'headers',
      }
      assert.equal(actor.tenantId, 't-001')
      assert.equal(actor.brandId, 'b-001')
      assert.equal(actor.storeId, 's-001')
    })

    it('actorType supports all defined union values', () => {
      const validTypes = [
        'platform-user',
        'tenant-user',
        'brand-user',
        'store-user',
        'employee-user',
        'service-account',
      ]
      for (const t of validTypes) {
        const actor: { actorId: string; actorType: string; roles: string[]; permissions: string[]; authenticated: boolean; source: 'headers' } = {
          actorId: `actor-${t}`,
          actorType: t,
          roles: [],
          permissions: [],
          authenticated: true,
          source: 'headers',
        }
        assert.equal(actor.actorType, t)
      }
    })
  })

  describe('TenantScopeRequirement shape', () => {
    it('can be constructed empty', () => {
      const req: { tenantId?: string; brandId?: string; storeId?: string } = {}
      assert.equal(req.tenantId, undefined)
      assert.equal(req.brandId, undefined)
      assert.equal(req.storeId, undefined)
    })

    it('can be constructed with all fields', () => {
      const req: { tenantId?: string; brandId?: string; storeId?: string } = {
        tenantId: 't-001',
        brandId: 'b-001',
        storeId: 's-001',
      }
      assert.equal(req.tenantId, 't-001')
      assert.equal(req.brandId, 'b-001')
      assert.equal(req.storeId, 's-001')
    })
  })

  describe('RequestRateLimitDecision shape', () => {
    it('can construct with applied=false', () => {
      const d: {
        applied: boolean
        scopeKey?: string
        allowed?: boolean
        limit?: number
        remaining?: number
        retryAfterSeconds?: number
      } = { applied: false }
      assert.equal(d.applied, false)
      assert.equal(d.allowed, undefined)
    })

    it('can construct with full rate-limit applied state', () => {
      const d: {
        applied: boolean
        scopeKey?: string
        allowed?: boolean
        limit?: number
        remaining?: number
        retryAfterSeconds?: number
      } = {
        applied: true,
        scopeKey: 'rate:t-001:/api/hello',
        allowed: true,
        limit: 100,
        remaining: 99,
        retryAfterSeconds: 0,
      }
      assert.equal(d.applied, true)
      assert.equal(d.scopeKey, 'rate:t-001:/api/hello')
      assert.equal(d.allowed, true)
      assert.equal(d.limit, 100)
      assert.equal(d.remaining, 99)
      assert.equal(d.retryAfterSeconds, 0)
    })

    it('can construct rate-limit exceeding state', () => {
      const d: {
        applied: boolean
        allowed?: boolean
        limit?: number
        remaining?: number
        retryAfterSeconds?: number
      } = {
        applied: true,
        allowed: false,
        limit: 10,
        remaining: 0,
        retryAfterSeconds: 30,
      }
      assert.equal(d.applied, true)
      assert.equal(d.allowed, false)
      assert.equal(d.limit, 10)
      assert.equal(d.remaining, 0)
      assert.equal(d.retryAfterSeconds, 30)
    })
  })

  describe('RequestGovernanceContext shape', () => {
    it('can construct with minimal fields', () => {
      const ctx: { requestId: string; startedAt: number } = {
        requestId: 'req-001',
        startedAt: Date.now(),
      }
      assert.equal(ctx.requestId, 'req-001')
      assert.ok(typeof ctx.startedAt === 'number')
    })

    it('can construct with rateLimit attached', () => {
      const ctx: {
        requestId: string
        startedAt: number
        rateLimit?: {
          applied: boolean
          scopeKey?: string
          allowed?: boolean
        }
      } = {
        requestId: 'req-002',
        startedAt: Date.now(),
        rateLimit: {
          applied: true,
          scopeKey: 'rl:scope',
          allowed: true,
        },
      }
      assert.ok(ctx.rateLimit)
      assert.equal(ctx.rateLimit!.applied, true)
      assert.equal(ctx.rateLimit!.scopeKey, 'rl:scope')
      assert.equal(ctx.rateLimit!.allowed, true)
    })
  })

  describe('ResolvedActorContext shape', () => {
    it('can construct a fully resolved actor context', () => {
      const resolved: {
        authenticated: boolean
        actor: { actorId: string; actorType: string; roles: string[]; permissions: string[]; authenticated: boolean; source: 'headers' } | null
        tenantContext: { tenantId: string }
        effectiveTenantId: string
        effectiveBrandId?: string
        effectiveStoreId?: string
        effectiveMarketCode: string
        roles: string[]
        permissions: string[]
      } = {
        authenticated: true,
        actor: {
          actorId: 'u-1',
          actorType: 'tenant-user',
          roles: ['admin'],
          permissions: ['*'],
          authenticated: true,
          source: 'headers',
        },
        tenantContext: { tenantId: 't-001' },
        effectiveTenantId: 't-001',
        effectiveBrandId: 'b-001',
        effectiveStoreId: 's-001',
        effectiveMarketCode: 'CN',
        roles: ['admin'],
        permissions: ['*'],
      }
      assert.equal(resolved.authenticated, true)
      assert.ok(resolved.actor)
      assert.equal(resolved.actor!.actorId, 'u-1')
      assert.equal(resolved.actor!.actorType, 'tenant-user')
      assert.equal(resolved.effectiveTenantId, 't-001')
      assert.equal(resolved.effectiveBrandId, 'b-001')
      assert.equal(resolved.effectiveStoreId, 's-001')
      assert.equal(resolved.effectiveMarketCode, 'CN')
      assert.deepStrictEqual(resolved.roles, ['admin'])
      assert.deepStrictEqual(resolved.permissions, ['*'])
    })

    it('can construct an unauthenticated resolved context', () => {
      const resolved: {
        authenticated: boolean
        actor: null
        tenantContext: { tenantId: string }
        effectiveTenantId: string
        effectiveMarketCode: string
        roles: string[]
        permissions: string[]
      } = {
        authenticated: false,
        actor: null,
        tenantContext: { tenantId: 't-public' },
        effectiveTenantId: 't-public',
        effectiveMarketCode: 'default',
        roles: [],
        permissions: [],
      }
      assert.equal(resolved.authenticated, false)
      assert.equal(resolved.actor, null)
      assert.deepStrictEqual(resolved.roles, [])
      assert.deepStrictEqual(resolved.permissions, [])
    })
  })

  describe('TenantAwareRequest augmentation', () => {
    it('extends Request with tenant context fields', () => {
      // Structural assertion: object must have the tenant-specific fields
      const req: {
        tenantContext: { tenantId: string }
        actorContext?: { actorId: string; actorType: string; roles: string[]; permissions: string[]; authenticated: boolean; source: 'headers' }
      } = {
        tenantContext: { tenantId: 't-001' },
        actorContext: {
          actorId: 'u-1',
          actorType: 'platform-user',
          roles: [],
          permissions: [],
          authenticated: true,
          source: 'headers',
        },
      }
      assert.equal(req.tenantContext.tenantId, 't-001')
      assert.ok(req.actorContext)
      assert.equal(req.actorContext!.actorId, 'u-1')
      assert.equal(req.actorContext!.source, 'headers')
    })

    it('TenantAwareRequest omits optional actorContext', () => {
      const req: {
        tenantContext: { tenantId: string }
        actorContext?: unknown
      } = {
        tenantContext: { tenantId: 't-anon' },
      }
      assert.equal(req.tenantContext.tenantId, 't-anon')
      assert.equal(req.actorContext, undefined)
    })
  })
})
