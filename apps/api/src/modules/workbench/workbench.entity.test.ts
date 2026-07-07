import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ClientChannel, UserRole } from '@m5/domain'
import {
  hasCapability,
  makeWorkbenchBootstrapState,
  ROLE_CAPABILITY_MAP,
  WORKBENCH_CAPABILITIES,
  NavItemPriority
} from './workbench.entity'

describe('Workbench Entity', () => {
  describe('WORKBENCH_CAPABILITIES', () => {
    it('defines 14 capability constants', () => {
      assert.equal(WORKBENCH_CAPABILITIES.length, 14)
    })

    it('includes core capabilities', () => {
      assert.ok(WORKBENCH_CAPABILITIES.includes('tenant-management'))
      assert.ok(WORKBENCH_CAPABILITIES.includes('member-crm'))
      assert.ok(WORKBENCH_CAPABILITIES.includes('checkout-nuclear'))
      assert.ok(WORKBENCH_CAPABILITIES.includes('offline-fallback'))
      assert.ok(WORKBENCH_CAPABILITIES.includes('audit-center'))
    })
  })

  describe('ROLE_CAPABILITY_MAP', () => {
    it('maps all 10 roles to capabilities', () => {
      const roles = Object.keys(ROLE_CAPABILITY_MAP)
      assert.equal(roles.length, 10)
    })

    it('SUPER_ADMIN has tenant-management and audit-center', () => {
      const caps = ROLE_CAPABILITY_MAP['SUPER_ADMIN']
      assert.ok(caps.includes('tenant-management'))
      assert.ok(caps.includes('audit-center'))
      assert.ok(caps.includes('market-governance'))
    })

    it('GUIDE has member-crm and promo-conversion', () => {
      const caps = ROLE_CAPABILITY_MAP['GUIDE']
      assert.equal(caps.length, 2)
      assert.ok(caps.includes('member-crm'))
      assert.ok(caps.includes('promo-conversion'))
    })

    it('CASHIER has checkout-nuclear and offline-fallback', () => {
      const caps = ROLE_CAPABILITY_MAP['CASHIER']
      assert.equal(caps.length, 2)
      assert.ok(caps.includes('checkout-nuclear'))
      assert.ok(caps.includes('offline-fallback'))
    })

    it('OPERATIONS has audit-center, market-governance, field-scheduling, tenant-management', () => {
      const caps = ROLE_CAPABILITY_MAP['OPERATIONS']
      assert.equal(caps.length, 4)
      assert.ok(caps.includes('audit-center'))
      assert.ok(caps.includes('market-governance'))
      assert.ok(caps.includes('field-scheduling'))
      assert.ok(caps.includes('tenant-management'))
    })

    it('FINANCE has regional-config, market-governance, audit-center', () => {
      const caps = ROLE_CAPABILITY_MAP['FINANCE']
      assert.equal(caps.length, 3)
      assert.ok(caps.includes('regional-config'))
      assert.ok(caps.includes('market-governance'))
      assert.ok(caps.includes('audit-center'))
    })

    it('WAREHOUSE has brand-matrix, tenant-management, daily-report, market-governance, audit-center', () => {
      const caps = ROLE_CAPABILITY_MAP['WAREHOUSE']
      assert.equal(caps.length, 5)
      assert.ok(caps.includes('brand-matrix'))
      assert.ok(caps.includes('tenant-management'))
      assert.ok(caps.includes('daily-report'))
      assert.ok(caps.includes('market-governance'))
      assert.ok(caps.includes('audit-center'))
    })

    it('COACH has member-crm, promo-conversion, audit-center', () => {
      const caps = ROLE_CAPABILITY_MAP['COACH']
      assert.equal(caps.length, 3)
      assert.ok(caps.includes('member-crm'))
      assert.ok(caps.includes('promo-conversion'))
      assert.ok(caps.includes('audit-center'))
    })
  })

  describe('hasCapability', () => {
    it('returns true for role that has the capability', () => {
      assert.equal(hasCapability('SUPER_ADMIN', 'tenant-management'), true)
      assert.equal(hasCapability('GUIDE', 'promo-conversion'), true)
    })

    it('returns false for role that does not have the capability', () => {
      assert.equal(hasCapability('GUIDE', 'audit-center'), false)
      assert.equal(hasCapability('CASHIER', 'tenant-management'), false)
    })

    it('returns false for unknown role', () => {
      assert.equal(hasCapability('UNKNOWN_ROLE', 'member-crm'), false)
    })

    it('returns false for unknown capability', () => {
      assert.equal(hasCapability('SUPER_ADMIN', 'non-existent-cap' as never), false)
    })

    it('4 newly added roles have working capability lookups', () => {
      // OPERATIONS: audit-center, FINANCE: regional-config, WAREHOUSE: daily-report, COACH: member-crm
      assert.equal(hasCapability('OPERATIONS', 'audit-center'), true)
      assert.equal(hasCapability('OPERATIONS', 'checkout-nuclear'), false)
      assert.equal(hasCapability('FINANCE', 'regional-config'), true)
      assert.equal(hasCapability('FINANCE', 'member-crm'), false)
      assert.equal(hasCapability('WAREHOUSE', 'daily-report'), true)
      assert.equal(hasCapability('WAREHOUSE', 'promo-conversion'), false)
      assert.equal(hasCapability('COACH', 'member-crm'), true)
      assert.equal(hasCapability('COACH', 'audit-center'), true)
    })

    it('COACH should not overlap with STORE_MANAGER field-scheduling (business rule)', () => {
      // 团建 / 教练 走自己的 member-crm / promo-conversion / audit-center，
      // 不应该有店长排班 (field-scheduling) — 否则权限边界模糊
      assert.equal(hasCapability('COACH', 'field-scheduling'), false)
    })
  })

  describe('makeWorkbenchBootstrapState', () => {
    it('creates default bootstrap state with version and initialized flag', () => {
      const workbenches: any[] = []
      const state = makeWorkbenchBootstrapState(workbenches)

      assert.equal(state.version, '1.0.0')
      assert.equal(state.initialized, true)
      assert.deepEqual(state.workbenches, [])
      assert.ok(state.refreshedAt, 'refreshedAt should be set')
      // Verify it's a valid ISO date
      assert.ok(new Date(state.refreshedAt!).getTime() > 0)
    })

    it('allows overriding version and initialized', () => {
      const workbenches: any[] = [{ role: 'GUIDE' }]
      const state = makeWorkbenchBootstrapState(workbenches, {
        version: '2.0.0-beta',
        initialized: false
      })

      assert.equal(state.version, '2.0.0-beta')
      assert.equal(state.initialized, false)
      assert.equal(state.workbenches.length, 1)
    })

    it('overrides refreshedAt when provided', () => {
      const workbenches: any[] = []
      const customDate = '2025-01-15T08:00:00.000Z'
      const state = makeWorkbenchBootstrapState(workbenches, {
        refreshedAt: customDate
      })

      assert.equal(state.refreshedAt, customDate)
    })
  })

  describe('NavItemPriority enum', () => {
    it('defines three priority levels', () => {
      assert.equal(NavItemPriority.High, 'HIGH')
      assert.equal(NavItemPriority.Medium, 'MEDIUM')
      assert.equal(NavItemPriority.Low, 'LOW')
    })
  })
})
