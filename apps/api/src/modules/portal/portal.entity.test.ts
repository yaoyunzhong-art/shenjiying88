import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  PortalAudience,
  PortalScopeType,
  PortalChannel,
  StorefrontSurface,
  LanguageCode,
  type TobPortal,
  type StorePortal
} from '@m5/domain'
import {
  toPortalEntity,
  isTobPortalEntity,
  isStorePortalEntity,
  isSsoEnabled,
  type PortalEntity
} from './portal.entity'

function createTobPortal(overrides: Partial<TobPortal> = {}): TobPortal {
  return {
    audience: PortalAudience.ToB,
    scopeType: PortalScopeType.Tenant,
    scopeCode: 'tenant-demo',
    marketCode: 'cn-mainland',
    channel: PortalChannel.Web,
    name: '测试租户 ToB 官网',
    primaryDomain: 'tenant-demo.cn-mainland.b2b.local',
    supportedLanguages: [LanguageCode.ZhCn],
    heroTitle: '企业级经营门户',
    heroSubtitle: '品牌、门店、会员统一管理',
    solutionTags: ['多租户', '国际化'],
    loginEntry: {
      label: '进入后台',
      loginPath: '/cn-mainland/tenant-demo/login',
      ssoEnabled: true
    },
    tenantCode: 'tenant-demo',
    ...overrides
  }
}

function createStorePortal(overrides: Partial<StorePortal> = {}): StorePortal {
  return {
    audience: PortalAudience.ToC,
    scopeType: PortalScopeType.Store,
    scopeCode: 'store-001',
    marketCode: 'cn-mainland',
    channel: PortalChannel.Web,
    name: 'store-001 门店门户',
    primaryDomain: 'store-001.cn-mainland.local',
    supportedLanguages: [LanguageCode.ZhCn],
    supportedSurfaces: [
      StorefrontSurface.OfficialSite,
      StorefrontSurface.H5,
      StorefrontSurface.MiniApp
    ],
    storeName: 'store-001 门店',
    tenantCode: 'tenant-demo',
    brandCode: 'brand-demo',
    storeCode: 'store-001',
    ...overrides
  }
}

describe('portal.entity: toPortalEntity', () => {
  it('converts TobPortal to PortalEntity with correct audience', () => {
    const portal = createTobPortal()
    const entity = toPortalEntity(portal, { id: 'p1', tenantId: 'tenant-demo' })

    assert.equal(entity.id, 'p1')
    assert.equal(entity.tenantId, 'tenant-demo')
    assert.equal(entity.audience, PortalAudience.ToB)
    assert.equal(entity.scopeType, PortalScopeType.Tenant)
    assert.equal(entity.scopeCode, 'tenant-demo')
    assert.equal(entity.marketCode, 'cn-mainland')
    assert.equal(entity.channel, PortalChannel.Web)
    assert.equal(entity.name, '测试租户 ToB 官网')
  })

  it('converts TobPortal includes login entry and hero fields', () => {
    const portal = createTobPortal()
    const entity = toPortalEntity(portal, { id: 'p1', tenantId: 'tenant-demo' })

    assert.equal(entity.heroTitle, '企业级经营门户')
    assert.equal(entity.heroSubtitle, '品牌、门店、会员统一管理')
    assert.deepEqual(entity.solutionTags, ['多租户', '国际化'])
    assert.ok(entity.loginEntry)
    assert.equal(entity.loginEntry.ssoEnabled, true)
    assert.equal(entity.loginEntry.loginPath, '/cn-mainland/tenant-demo/login')
  })

  it('converts StorePortal to PortalEntity with ToC audience', () => {
    const portal = createStorePortal()
    const entity = toPortalEntity(portal, {
      id: 'p2',
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001'
    })

    assert.equal(entity.audience, PortalAudience.ToC)
    assert.equal(entity.scopeType, PortalScopeType.Store)
    assert.equal(entity.brandId, 'brand-demo')
    assert.equal(entity.storeId, 'store-001')
    assert.equal(entity.storeName, 'store-001 门店')
  })

  it('converts StorePortal includes supported surfaces', () => {
    const portal = createStorePortal()
    const entity = toPortalEntity(portal, { id: 'p2', tenantId: 'tenant-demo' })

    assert.ok(entity.supportedSurfaces)
    assert.ok(entity.supportedSurfaces!.includes(StorefrontSurface.OfficialSite))
    assert.ok(entity.supportedSurfaces!.includes(StorefrontSurface.H5))
    assert.ok(entity.supportedSurfaces!.includes(StorefrontSurface.MiniApp))
  })

  it('converts StorePortal has createdAt and updatedAt', () => {
    const portal = createStorePortal()
    const entity = toPortalEntity(portal, { id: 'p2', tenantId: 'tenant-demo' })

    assert.ok(entity.createdAt)
    assert.ok(entity.updatedAt)
    // Verify ISO format
    assert.ok(!isNaN(Date.parse(entity.createdAt)))
    assert.ok(!isNaN(Date.parse(entity.updatedAt)))
  })

  it('entity has primaryDomain from portal', () => {
    const portal = createTobPortal()
    const entity = toPortalEntity(portal, { id: 'p1', tenantId: 'tenant-demo' })

    assert.equal(entity.primaryDomain, 'tenant-demo.cn-mainland.b2b.local')
  })
})

describe('portal.entity: isTobPortalEntity', () => {
  it('returns true for ToB portal entity', () => {
    const portal = createTobPortal()
    const entity = toPortalEntity(portal, { id: 'p1', tenantId: 'tenant-demo' })

    assert.equal(isTobPortalEntity(entity), true)
  })

  it('returns false for Store portal entity', () => {
    const portal = createStorePortal()
    const entity = toPortalEntity(portal, { id: 'p2', tenantId: 'tenant-demo' })

    assert.equal(isTobPortalEntity(entity), false)
  })
})

describe('portal.entity: isStorePortalEntity', () => {
  it('returns true for Store portal entity', () => {
    const portal = createStorePortal()
    const entity = toPortalEntity(portal, { id: 'p2', tenantId: 'tenant-demo' })

    assert.equal(isStorePortalEntity(entity), true)
  })

  it('returns false for ToB portal entity', () => {
    const portal = createTobPortal()
    const entity = toPortalEntity(portal, { id: 'p1', tenantId: 'tenant-demo' })

    assert.equal(isStorePortalEntity(entity), false)
  })
})

describe('portal.entity: isSsoEnabled', () => {
  it('returns true when loginEntry has ssoEnabled=true', () => {
    const portal = createTobPortal()
    const entity = toPortalEntity(portal, { id: 'p1', tenantId: 'tenant-demo' })

    assert.equal(isSsoEnabled(entity), true)
  })

  it('returns false when loginEntry has ssoEnabled=false', () => {
    const portal = createTobPortal({
      loginEntry: {
        label: '进入后台',
        loginPath: '/login',
        ssoEnabled: false
      }
    })
    const entity = toPortalEntity(portal, { id: 'p1', tenantId: 'tenant-demo' })

    assert.equal(isSsoEnabled(entity), false)
  })

  it('returns false when loginEntry is undefined', () => {
    const storePortal = createStorePortal()
    const entity = toPortalEntity(storePortal, { id: 'p2', tenantId: 'tenant-demo' })

    assert.equal(isSsoEnabled(entity), false)
  })
})
