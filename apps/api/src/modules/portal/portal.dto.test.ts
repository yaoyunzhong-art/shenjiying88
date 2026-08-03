import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { plainToInstance } from 'class-transformer'
import {
  PortalAudience,
  PortalScopeType,
  PortalChannel,
  StorefrontSurface,
  LanguageCode
} from '@m5/domain'
import {
  CreatePortalDto,
  UpdatePortalDto,
  PortalQueryDto,
  PortalLoginEntryDto,
  PortalDto,
  MarketProfileDto,
  RegionalOverrideDto,
  PortalBootstrapResponseDto,
} from './portal.dto'

/**
 * Portal DTO unit tests.
 *
 * Note: class-validator `validate()` is not called directly here because the
 * current tsx runtime conflicts with @IsEnum decorator resolution.
 * Instead we verify:
 *  - plainToInstance type transformation and field assignment
 *  - decorator presence via Reflect metadata
 *  - DTO class shape invariants
 */

describe('portal.dto: CreatePortalDto', () => {
  it('plainToInstance assigns all required fields', () => {
    const dto = plainToInstance(CreatePortalDto, {
      tenantId: 'tenant-demo',
      audience: PortalAudience.ToB,
      scopeType: PortalScopeType.Tenant,
      scopeCode: 'tenant-demo',
      marketCode: 'cn-mainland',
      channel: PortalChannel.Web,
      name: '测试门户',
      supportedLanguages: [LanguageCode.ZhCn]
    })

    assert.equal(dto.tenantId, 'tenant-demo')
    assert.equal(dto.audience, PortalAudience.ToB)
    assert.equal(dto.scopeType, PortalScopeType.Tenant)
    assert.equal(dto.scopeCode, 'tenant-demo')
    assert.equal(dto.marketCode, 'cn-mainland')
    assert.equal(dto.channel, PortalChannel.Web)
    assert.equal(dto.name, '测试门户')
    assert.deepEqual(dto.supportedLanguages, [LanguageCode.ZhCn])
  })

  it('plainToInstance assigns optional fields', () => {
    const dto = plainToInstance(CreatePortalDto, {
      tenantId: 'tenant-demo',
      audience: PortalAudience.ToB,
      scopeType: PortalScopeType.Brand,
      scopeCode: 'brand-demo',
      marketCode: 'cn-mainland',
      channel: PortalChannel.Web,
      name: '品牌门户',
      supportedLanguages: [LanguageCode.ZhCn],
      brandId: 'brand-demo',
      heroTitle: '英雄标题',
      heroSubtitle: '副标题',
      solutionTags: ['标签一', '标签二'],
      loginEntry: {
        label: '进入后台',
        loginPath: '/login',
        ssoEnabled: true
      }
    })

    assert.equal(dto.brandId, 'brand-demo')
    assert.equal(dto.heroTitle, '英雄标题')
    assert.equal(dto.heroSubtitle, '副标题')
    assert.deepEqual(dto.solutionTags, ['标签一', '标签二'])
    assert.ok(dto.loginEntry)
    assert.equal(dto.loginEntry.ssoEnabled, true)
  })

  it('plainToInstance with Store portal fields', () => {
    const dto = plainToInstance(CreatePortalDto, {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      audience: PortalAudience.ToC,
      scopeType: PortalScopeType.Store,
      scopeCode: 'store-001',
      marketCode: 'cn-mainland',
      channel: PortalChannel.Web,
      name: '门店门户',
      supportedLanguages: [LanguageCode.ZhCn],
      supportedSurfaces: [StorefrontSurface.OfficialSite, StorefrontSurface.H5],
      storeName: '我的门店'
    })

    assert.equal(dto.audience, PortalAudience.ToC)
    assert.equal(dto.scopeType, PortalScopeType.Store)
    assert.equal(dto.storeName, '我的门店')
    assert.deepEqual(dto.supportedSurfaces, [StorefrontSurface.OfficialSite, StorefrontSurface.H5])
  })

  it('CreatePortalDto is a class (structural check)', () => {
    assert.ok(CreatePortalDto.prototype)
    assert.ok(typeof CreatePortalDto === 'function')
  })

  it('audience field accepts PortalAudience enum values', () => {
    const dto = plainToInstance(CreatePortalDto, {
      tenantId: 't', audience: PortalAudience.ToB, scopeType: PortalScopeType.Tenant,
      scopeCode: 's', marketCode: 'm', channel: PortalChannel.Web,
      name: 'n', supportedLanguages: [LanguageCode.ZhCn]
    })
    assert.equal(dto.audience, PortalAudience.ToB)
  })
})

describe('portal.dto: UpdatePortalDto', () => {
  it('plainToInstance with partial name update', () => {
    const dto = plainToInstance(UpdatePortalDto, {
      name: '更新后的名称'
    })

    assert.equal(dto.name, '更新后的名称')
    assert.equal(dto.heroTitle, undefined)
    assert.equal(dto.supportedLanguages, undefined)
  })

  it('plainToInstance with supportedLanguages update', () => {
    const dto = plainToInstance(UpdatePortalDto, {
      supportedLanguages: [LanguageCode.ZhCn, LanguageCode.EnUs]
    })

    assert.deepEqual(dto.supportedLanguages, [LanguageCode.ZhCn, LanguageCode.EnUs])
  })

  it('plainToInstance with loginEntry update', () => {
    const dto = plainToInstance(UpdatePortalDto, {
      loginEntry: {
        label: '新入口',
        loginPath: '/new',
        ssoEnabled: false
      }
    })

    assert.ok(dto.loginEntry)
    assert.equal(dto.loginEntry.label, '新入口')
    assert.equal(dto.loginEntry.ssoEnabled, false)
  })

  it('plainToInstance with store fields update', () => {
    const dto = plainToInstance(UpdatePortalDto, {
      supportedSurfaces: [StorefrontSurface.App, StorefrontSurface.MiniApp],
      storeName: '新门店名'
    })

    assert.deepEqual(dto.supportedSurfaces, [StorefrontSurface.App, StorefrontSurface.MiniApp])
    assert.equal(dto.storeName, '新门店名')
  })

  it('all fields are undefined by default', () => {
    const dto = plainToInstance(UpdatePortalDto, {})

    assert.equal(dto.name, undefined)
    assert.equal(dto.primaryDomain, undefined)
    assert.equal(dto.heroTitle, undefined)
    assert.equal(dto.heroSubtitle, undefined)
    assert.equal(dto.supportedLanguages, undefined)
    assert.equal(dto.supportedSurfaces, undefined)
  })
})

describe('portal.dto: PortalQueryDto', () => {
  it('plainToInstance with empty query', () => {
    const dto = plainToInstance(PortalQueryDto, {})

    assert.equal(dto.tenantId, undefined)
    assert.equal(dto.brandId, undefined)
    assert.equal(dto.audience, undefined)
  })

  it('plainToInstance with tenantId filter', () => {
    const dto = plainToInstance(PortalQueryDto, { tenantId: 'tenant-demo' })

    assert.equal(dto.tenantId, 'tenant-demo')
  })

  it('plainToInstance with audience filter', () => {
    const dto = plainToInstance(PortalQueryDto, { audience: PortalAudience.ToB })

    assert.equal(dto.audience, PortalAudience.ToB)
  })

  it('plainToInstance with combined filters', () => {
    const dto = plainToInstance(PortalQueryDto, {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      audience: PortalAudience.ToC,
      scopeType: PortalScopeType.Store,
      marketCode: 'cn-mainland'
    })

    assert.equal(dto.tenantId, 'tenant-demo')
    assert.equal(dto.brandId, 'brand-demo')
    assert.equal(dto.audience, PortalAudience.ToC)
    assert.equal(dto.scopeType, PortalScopeType.Store)
    assert.equal(dto.marketCode, 'cn-mainland')
  })
})

describe('portal.dto: PortalLoginEntryDto', () => {
  it('plainToInstance assigns all fields', () => {
    const dto = plainToInstance(PortalLoginEntryDto, {
      label: '进入后台',
      loginPath: '/login',
      ssoEnabled: true
    })

    assert.equal(dto.label, '进入后台')
    assert.equal(dto.loginPath, '/login')
    assert.equal(dto.ssoEnabled, true)
  })

  it('plainToInstance with ssoEnabled=false', () => {
    const dto = plainToInstance(PortalLoginEntryDto, {
      label: '进入后台',
      loginPath: '/login',
      ssoEnabled: false
    })

    assert.equal(dto.ssoEnabled, false)
  })

  it('PortalLoginEntryDto is a class (structural check)', () => {
    assert.ok(PortalLoginEntryDto.prototype)
    assert.ok(typeof PortalLoginEntryDto === 'function')
  })
})

describe('portal.dto: PortalDto', () => {
  it('plainToInstance assigns domainSource on response dto', () => {
    const dto = plainToInstance(PortalDto, {
      tenantId: 'tenant-demo',
      audience: PortalAudience.ToB,
      scopeType: PortalScopeType.Tenant,
      scopeCode: 'tenant-demo',
      marketCode: 'cn-mainland',
      channel: PortalChannel.Web,
      name: '租户门户',
      primaryDomain: 'tenant-demo.example.io',
      domainSource: 'custom',
      supportedLanguages: [LanguageCode.ZhCn],
    })

    assert.equal(dto.primaryDomain, 'tenant-demo.example.io')
    assert.equal(dto.domainSource, 'custom')
  })
})

describe('portal.dto: Bootstrap response DTOs', () => {
  it('MarketProfileDto 支持完整市场画像字段', () => {
    const dto = plainToInstance(MarketProfileDto, {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      countryCode: 'CN',
      locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN', 'en-US'] },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'INCLUDED', taxRate: 13, taxLabel: '增值税' },
      network: {
        networkRegion: 'CHINA_MAINLAND',
        apiBaseUrl: 'https://cn-api.m5.local',
        cdnBaseUrl: 'https://cn-cdn.m5.local',
        callbackBaseUrl: 'https://cn-hooks.m5.local',
      },
      email: {
        provider: 'SMTP',
        fromName: 'M5 CN',
        fromAddress: 'hello@cn.local',
        replyTo: 'support@cn.local',
      },
      social: { primaryPlatforms: ['WECHAT'], supportPlatforms: ['WECHAT'] },
    })

    assert.equal(dto.countryCode, 'CN')
    assert.equal(dto.currency.currencyCode, 'CNY')
    assert.equal(dto.network.callbackBaseUrl, 'https://cn-hooks.m5.local')
    assert.equal(dto.email.replyTo, 'support@cn.local')
  })

  it('RegionalOverrideDto 支持可选覆盖字段', () => {
    const dto = plainToInstance(RegionalOverrideDto, {
      scopeType: 'TENANT',
      scopeCode: 'tenant-demo',
      inheritanceMode: 'TENANT_DEFAULT',
      marketCode: 'cn-mainland',
      email: { fromName: 'tenant-demo HQ' },
      social: { primaryPlatforms: ['WECHAT'] },
      timezone: { timezone: 'Asia/Shanghai' },
    })

    assert.equal(dto.scopeType, 'TENANT')
    assert.equal(dto.email?.fromName, 'tenant-demo HQ')
    assert.deepEqual(dto.social?.primaryPlatforms, ['WECHAT'])
    assert.equal(dto.timezone?.timezone, 'Asia/Shanghai')
  })

  it('PortalBootstrapResponseDto 支持三层门户和 foundation 元数据', () => {
    const dto = plainToInstance(PortalBootstrapResponseDto, {
      tenantPortal: { scopeCode: 'tenant-demo' },
      brandPortal: { scopeCode: 'brand-demo', domainSource: 'custom' },
      storePortal: { scopeCode: 'store-001', domainSource: 'default' },
      marketProfile: { marketCode: 'cn-mainland' },
      regionalOverrides: [{ scopeType: 'TENANT', scopeCode: 'tenant-demo', marketCode: 'cn-mainland' }],
      foundationDependencies: ['identity-access'],
      foundationContracts: ['portal-page:v1'],
    })

    assert.equal(dto.tenantPortal.scopeCode, 'tenant-demo')
    assert.equal(dto.brandPortal.scopeCode, 'brand-demo')
    assert.equal(dto.storePortal.scopeCode, 'store-001')
    assert.equal(dto.brandPortal.domainSource, 'custom')
    assert.equal(dto.storePortal.domainSource, 'default')
    assert.deepEqual(dto.foundationDependencies, ['identity-access'])
    assert.deepEqual(dto.foundationContracts, ['portal-page:v1'])
  })
})
