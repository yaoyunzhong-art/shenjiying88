// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ClientChannel, UserRole } from '@m5/domain'
import { defaultRoleWorkbenchContracts } from '@m5/types'

function mockMarketProfile(overrides: Partial<ReturnType<typeof mockMarketProfile>> = {}) {
  return {
    marketCode: 'zh-cn',
    marketName: '中国大陆',
    countryCode: 'CN',
    locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN', 'en-US'] },
    timezone: 'Asia/Shanghai',
    currency: 'CNY',
    tax: { taxMode: 'vat' as const, taxRate: 13, taxLabel: 'VAT' },
    network: { networkRegion: 'cn-mainland', apiBaseUrl: 'https://api.example.com', cdnBaseUrl: 'https://cdn.example.com', callbackBaseUrl: 'https://cb.example.com' },
    email: { provider: 'ses', fromName: 'Test', fromAddress: 'no-reply@test.com', replyTo: 'no-reply@test.com' },
    social: { wechat: { appId: 'wx-test' } },
    ...overrides
  }
}

describe('WorkbenchService', () => {
  const { WorkbenchService } = require('./workbench.service')

  describe('getRoleWorkbenches', () => {
    it('returns 6 role workbenches', () => {
      const mockMarket = {} as any
      const mockPortal = {} as any
      const mockFoundation = { getDependencySummary: () => null } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const workbenches = service.getRoleWorkbenches()
      assert.equal(workbenches.length, 10)
    })

    it('uses shared default workbench registry as source of truth', () => {
      const mockMarket = {} as any
      const mockPortal = {} as any
      const mockFoundation = { getDependencySummary: () => null } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const workbenches = service.getRoleWorkbenches()

      assert.deepEqual(
        workbenches.map((item: any) => item.role),
        defaultRoleWorkbenchContracts.map((item: any) => item.role)
      )
      assert.deepEqual(
        workbenches.find((item) => item.role === UserRole.TenantAdmin)?.navItems.map((item: any) => item.key),
        defaultRoleWorkbenchContracts.find((item) => item.role === 'TENANT_ADMIN')?.navItems.map((item: any) => item.key)
      )
    })

    it('each workbench has role, channel, title, description and navItems', () => {
      const mockMarket = {} as any
      const mockPortal = {} as any
      const mockFoundation = { getDependencySummary: () => null } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const workbenches = service.getRoleWorkbenches()
      for (const wb of workbenches) {
        assert.ok(wb.role, `workbench ${wb.title} missing role`)
        assert.ok(wb.channel, `workbench ${wb.title} missing channel`)
        assert.ok(wb.title, `workbench ${wb.title} missing title`)
        assert.ok(wb.description, `workbench ${wb.title} missing description`)
        assert.ok(Array.isArray(wb.navItems), `workbench ${wb.title} navItems is not an array`)
        assert.ok(wb.navItems.length > 0, `workbench ${wb.title} has empty navItems`)
      }
    })

    it('SuperAdmin workbench targets Pc channel with correct navItems', () => {
      const mockMarket = {} as any
      const mockPortal = {} as any
      const mockFoundation = { getDependencySummary: () => null } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const superAdmin = service.getRoleWorkbenches().find(wb => wb.role === UserRole.SuperAdmin)
      assert.ok(superAdmin, 'SuperAdmin workbench not found')
      assert.equal(superAdmin!.channel, ClientChannel.Pc)
      assert.equal(superAdmin!.title, '总部总控台')
      assert.ok(superAdmin!.navItems.length >= 5, `SuperAdmin expects >= 5 navItems, got ${superAdmin!.navItems.length}`)
      assert.deepStrictEqual(
        superAdmin!.navItems.map(i => i.key).slice(0, 3),
        ['tenants', 'foundation', 'identity-access']
      )
    })

    it('Guide workbench targets Pad channel', () => {
      const mockMarket = {} as any
      const mockPortal = {} as any
      const mockFoundation = { getDependencySummary: () => null } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const guide = service.getRoleWorkbenches().find(wb => wb.role === UserRole.Guide)
      assert.ok(guide, 'Guide workbench not found')
      assert.equal(guide!.channel, ClientChannel.Pad)
      assert.equal(guide!.title, '导购工作台')
      assert.ok(guide!.navItems.some(i => i.key === 'crm'))
      assert.ok(guide!.navItems.some(i => i.key === 'promo'))
    })

    it('Cashier workbench has offline navItem for weak-network support', () => {
      const mockMarket = {} as any
      const mockPortal = {} as any
      const mockFoundation = { getDependencySummary: () => null } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const cashier = service.getRoleWorkbenches().find(wb => wb.role === UserRole.Cashier)
      assert.ok(cashier, 'Cashier workbench not found')
      assert.equal(cashier!.channel, ClientChannel.Pad)
      assert.ok(cashier!.navItems.some(i => i.key === 'offline'))
      assert.ok(cashier!.navItems.some(i => i.key === 'checkout'))
    })
  })

  describe('getBootstrap', () => {
    it('returns workbench bootstrap with tenant context', () => {
      const mockMarket = {
        getMergedProfile: () => mockMarketProfile()
      } as any
      const mockPortal = {
        getBootstrap: () => ({
          storePortal: { name: 'store' },
          tenantPortal: {
            name: 'tenant',
            loginEntry: { loginPath: '/login', ssoEnabled: false }
          },
          brandPortal: { name: 'brand' }
        })
      } as any
      const mockFoundation = {
        getDependencySummary: () => ({
          dependsOn: ['identity-access', 'configuration-governance'],
          handoffContracts: ['workbench:v1']
        })
      } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const tenantContext = {
        tenantId: 't-workbench-1',
        brandId: 'b-wb-1',
        storeId: 's-wb-1',
        marketCode: 'zh-cn'
      }
      const result = service.getBootstrap(tenantContext)

      assert.equal(result.tenantContext.tenantId, 't-workbench-1')
      assert.equal(result.tenantContext.brandId, 'b-wb-1')
      assert.equal(result.tenantContext.storeId, 's-wb-1')
      assert.equal(result.tenantContext.marketCode, 'zh-cn')
    })

    it('returns 10 workbenches in bootstrap response', () => {
      const mockMarket = {
        getMergedProfile: () => mockMarketProfile()
      } as any
      const mockPortal = {
        getBootstrap: () => ({
          storePortal: { name: 'store' },
          tenantPortal: {
            name: 'tenant',
            loginEntry: { loginPath: '/login', ssoEnabled: true }
          },
          brandPortal: { name: 'brand' }
        })
      } as any
      const mockFoundation = {
        getDependencySummary: () => null
      } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const result = service.getBootstrap({ tenantId: 't-1' })
      assert.equal(result.workbenches.length, 10)
    })

    it('includes supportedLocales from market profile', () => {
      const mockMarket = {
        getMergedProfile: () => mockMarketProfile({ locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN', 'en-US', 'ja-JP'] } })
      } as any
      const mockPortal = {
        getBootstrap: () => ({
          storePortal: {},
          tenantPortal: { loginEntry: { loginPath: '/login', ssoEnabled: false } },
          brandPortal: {}
        })
      } as any
      const mockFoundation = {
        getDependencySummary: () => null
      } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const result = service.getBootstrap({ tenantId: 't-1' })
      assert.deepStrictEqual(result.supportedLocales, ['zh-CN', 'en-US', 'ja-JP'])
    })

    it('regionalLoginPolicies derived from portal login entry', () => {
      const mockMarket = {
        getMergedProfile: () => mockMarketProfile()
      } as any
      const mockPortal = {
        getBootstrap: () => ({
          storePortal: {},
          tenantPortal: {
            loginEntry: { loginPath: '/auth/sso', ssoEnabled: true }
          },
          brandPortal: {}
        })
      } as any
      const mockFoundation = {
        getDependencySummary: () => null
      } as any
      const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {} as any)

      const result = service.getBootstrap({ tenantId: 't-1' })
      assert.equal(result.regionalLoginPolicies.defaultLoginPath, '/auth/sso')
      assert.equal(result.regionalLoginPolicies.ssoEnabled, true)
    })
  })
})
