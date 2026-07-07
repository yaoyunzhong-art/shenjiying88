import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { BadRequestException } from '@nestjs/common'

describe('LytService', () => {
  const { LytService } = require('./lyt.service')
  const { toLytStandardizedWebhookEventContract } = require('./lyt.contract')

  it('getAdapter returns the injected adapter instance', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ name: 'mock-adapter', adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = service.getAdapter()
    assert.equal(result.adapterName, 'MockLytAdapter')
  })

  it('getConnection delegates to scoped connection manager', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = {
      getConnectionForStore: async (storeId: string, tenantContext: unknown) => ({
        storeId,
        tenantContext,
        endpoint: 'https://lyt.example.com',
        authMode: 'bearer-token'
      })
    }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = await service.getConnection('store-001', { tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    assert.equal(result.storeId, 'store-001')
    assert.deepStrictEqual(result.tenantContext, { tenantId: 'tenant-001', brandId: 'brand-001' })
    assert.equal(result.endpoint, 'https://lyt.example.com')
  })

  it('getAdapterSelection returns resolved adapter info for store connection', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({
        adapterName: 'SandboxLytAdapter',
        adapterMode: 'sandbox',
        reason: 'connection is marked as sandbox/staging for rehearsal'
      }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = {
      getConnectionForStore: async () => ({
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-001',
        endpoint: 'https://sandbox.lyt.example.com',
        authMode: 'sandbox-signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/brand-001',
        capabilities: ['member', 'payment', 'device'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'brand',
        healthStatus: 'healthy'
      })
    }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = await service.getAdapterSelection('store-001', { tenantId: 'tenant-001' } as any)

    assert.equal(result.adapterName, 'SandboxLytAdapter')
    assert.equal(result.adapterMode, 'sandbox')
    assert.equal(result.vendor, 'lyt-enterprise')
    assert.equal(result.vendorTenantId, 'vendor-tenant-001')
    assert.equal(result.vendorBrandId, 'vendor-brand-001')
    assert.equal(result.vendorStoreId, 'vendor-store-001')
    assert.equal(result.endpoint, 'https://sandbox.lyt.example.com')
    assert.deepStrictEqual(result.capabilities, ['member', 'payment', 'device'])
    assert.equal(result.credentialRef, 'vault://lyt/brand-001')
    assert.equal(result.resolutionLevel, 'brand')
  })

  it('getConnectionCapabilityReadiness returns scoped capability readiness for a store', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = {
      getConnectionForStore: async () => ({
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-001',
        endpoint: 'https://lyt-brand.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/brand-001',
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'brand',
        healthStatus: 'healthy'
      }),
      listScopedStores: async () => [
        { id: 'store-001', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: '测试门店一' }
      ]
    }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = await service.getConnectionCapabilityReadiness('store-001', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.equal(result.storeCode, 'S001')
    assert.equal(result.storeName, '测试门店一')
    assert.equal(result.vendorStoreId, 'vendor-store-001')
    assert.deepStrictEqual(result.enabledCapabilities, ['member', 'payment'])
    assert.equal(result.readinessByCapability.find((item: { capability: string }) => item.capability === 'member')?.readiness, 'inherited-ready')
    assert.equal(result.readinessByCapability.find((item: { capability: string }) => item.capability === 'device')?.readiness, 'not-enabled')
    assert.ok(result.missingRequirements.includes('store-level-capability-verification'))
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('继承上级连接')))
  })

  it('getConnectionGovernanceSummary aggregates readiness across scoped stores', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-ready': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-ready',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-ready',
        endpoint: 'https://lyt-ready.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'payment', 'device'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      },
      'store-pending': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-pending',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-pending',
        endpoint: 'mock://lyt/tenant-001/store-pending',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment', 'order', 'device', 'gate'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      },
      'store-stale': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stale',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-stale',
        endpoint: 'https://lyt-stale.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      }
    }
    const mockConnections = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
        { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' },
        { id: 'store-stale', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stale 店' }
      ]
    }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    assert.equal(result.totalStores, 3)
    assert.equal(result.configuredStores, 2)
    assert.equal(result.pendingConfigurationStores, 1)
    assert.equal(result.staleStores, 1)
    assert.equal(result.inheritedStores, 1)
    assert.equal(result.storeLevelConfiguredStores, 1)
    assert.equal(result.capabilityBreakdown.find((item: { capability: string }) => item.capability === 'member')?.pendingStores, 1)
    assert.equal(result.capabilityBreakdown.find((item: { capability: string }) => item.capability === 'device')?.readyStores, 1)
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('pending-configuration')))
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('stale')))
    // stores are sorted by governanceRiskLevel: high (pending-configuration) first,
    // then medium (stale), then low (healthy). See LytService.getConnectionGovernanceSummary
    // riskOrder = { high: 0, medium: 1, low: 2 }.
    assert.equal(result.stores[0]?.storeId, 'store-pending')
    assert.equal(result.stores[1]?.storeId, 'store-stale')
    assert.equal(result.stores[2]?.storeId, 'store-ready')
  })

  it('getConnectionGovernanceAlerts returns structured governance alerts', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-ready': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-ready',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-ready',
        endpoint: 'https://lyt-ready.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      },
      'store-pending': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-pending',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-pending',
        endpoint: 'mock://lyt/tenant-001/store-pending',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment', 'device'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      },
      'store-stale': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stale',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-stale',
        endpoint: 'https://lyt-stale.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      }
    }
    const mockConnections = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
        { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' },
        { id: 'store-stale', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stale 店' }
      ]
    }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    assert.equal(result.alerts.length, 6)
    assert.equal(result.alerts[0]?.code, 'pending-configuration-stores')
    assert.equal(result.alerts[0]?.severity, 'high')
    assert.ok(result.alerts.some((item: { code: string }) => item.code === 'stale-connections'))
    assert.ok(result.alerts.some((item: { code: string }) => item.code === 'credential-missing-stores'))
    assert.ok(result.alerts.some((item: { code: string }) => item.code === 'inherited-store-verification'))
    assert.ok(result.alerts.some((item: { code: string }) => item.code === 'capability-pending-stores'))
  })

  it('getStoreCapabilityAccessView maps readiness to frontend access states', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = {
      getConnectionForStore: async () => ({
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-001',
        endpoint: 'https://lyt-store.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-001',
        capabilities: ['member', 'payment', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      }),
      listScopedStores: async () => [
        { id: 'store-001', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: '测试门店一' }
      ]
    }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = await service.getStoreCapabilityAccessView('store-001', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.equal(result.connectionStatus, 'configured')
    assert.equal(result.healthStatus, 'stale')
    assert.equal(result.accessByCapability.find((item: { capability: string }) => item.capability === 'member')?.access, 'degraded')
    assert.equal(result.accessByCapability.find((item: { capability: string }) => item.capability === 'payment')?.access, 'degraded')
    assert.equal(result.accessByCapability.find((item: { capability: string }) => item.capability === 'device')?.access, 'hidden')
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('健康检查')))
  })

  it('getFixtures returns first-batch LYT fixture catalog', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.getFixtures()

    assert.equal(result.length, 5)
    assert.equal(result[0].key, 'member-query')
    assert.equal(result[2].eventType, 'payment.success')
    assert.equal(result[2].validationStatus, 'ready-for-rehearsal')
    assert.deepEqual(result[2].missingSampleFields, [])
  })

  it('getFixtures supports transport filter and returns checklist metadata', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.getFixtures({ transport: 'webhook' })

    assert.deepEqual(
      result.map((item: { key: string }) => item.key),
      ['payment-success-webhook', 'gate-pass-webhook']
    )
    assert.equal(result[0].mappingVersion, 'lyt-field-mapping-spec-v1')
    assert.equal(result[0].riskLevel, 'high')
    assert.deepEqual(result[0].requiredHeaders, ['signature', 'timestamp'])
    assert.deepEqual(result[0].recommendedHeaders, ['x-lyt-source'])
    assert.ok(result[0].archiveChecklist.includes('mappingVersion'))
    assert.ok(result[0].schemaChecklist.includes('signature-validation'))
    assert.deepEqual(result[0].sampleHeaders, {
      signature: 'fixture:payment-success-webhook',
      timestamp: '2026-06-14T10:06:30.000Z'
    })
  })

  it('getFixture returns a single fixture by key', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.getFixture('gate-pass-webhook')

    assert.equal(result.key, 'gate-pass-webhook')
    assert.equal(result.transport, 'webhook')
    assert.equal(result.eventType, 'gate.pass')
    assert.equal(result.validationStatus, 'ready-for-rehearsal')
    assert.ok(result.requiredRawFields.includes('gateId'))
  })

  it('getFixtureSummary returns checklist rollout summary', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.getFixtureSummary({ transport: 'webhook' })

    assert.equal(result.totalFixtures, 2)
    assert.equal(result.readyFixtures, 2)
    assert.equal(result.blockedFixtures, 0)
    assert.equal(result.highRiskBlockedFixtures, 0)
    assert.deepEqual(result.blockedFixtureKeys, [])
    assert.equal(result.transportBreakdown.webhook, 2)
    assert.equal(result.capabilityBreakdown.payment, 1)
    assert.equal(result.capabilityBreakdown.gate, 1)
    assert.deepEqual(result.missingChecklistBreakdown, {})
    assert.ok(result.recommendedChecklistBreakdown['headers:x-lyt-source'] >= 1)
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('headers/query checklist')))
  })

  it('getFixtureSummary reports blocked fixtures and exact missing checklist items', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.getFixtureSummary({ transport: 'webhook', capability: 'payment' })

    assert.equal(result.totalFixtures, 1)
    assert.deepEqual(result.blockedFixtureKeys, [])
    assert.equal(result.fixtures[0]?.key, 'payment-success-webhook')
    assert.deepEqual(result.fixtures[0]?.missingChecklistItems, [])
  })

  it('compareFixtureInput returns required and recommended gap report', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.compareFixtureInput('payment-success-webhook', {
      payload: {
        paymentId: 'payment-001',
        orderId: 'order-001',
        transactionNo: 'txn-001',
        amount: 108,
        customField: 'custom'
      },
      headers: {
        signature: 'fixture:payment-success-webhook'
      },
      query: {
        unknownQuery: '1'
      }
    })

    assert.equal(result.fixtureKey, 'payment-success-webhook')
    assert.equal(result.readiness, 'missing-required')
    assert.ok(result.payload.missingRequired.includes('requestId'))
    assert.ok(result.payload.missingRecommended.includes('currency'))
    assert.deepEqual(result.payload.safeExtraObserved, [])
    assert.deepEqual(result.payload.riskyExtraObserved, ['customField'])
    assert.ok(result.headers.missingRequired.includes('timestamp'))
    assert.ok(result.headers.missingRecommended.includes('x-lyt-source'))
    assert.deepEqual(result.headers.safeExtraObserved, [])
    assert.deepEqual(result.headers.riskyExtraObserved, [])
    assert.deepEqual(result.query.missingRecommended, ['traceId'])
    assert.deepEqual(result.query.safeExtraObserved, [])
    assert.deepEqual(result.query.riskyExtraObserved, ['unknownQuery'])
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('required')))
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('unknown risky')))
  })

  it('previewFixtureImport returns merged sample suggestion and readiness after import', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.previewFixtureImport('payment-success-webhook', {
      payload: {
        requestId: 'req-pay-import-1',
        paymentId: 'payment-001',
        orderId: 'order-001',
        transactionNo: 'txn-001',
        amount: 108,
        currency: 'CNY',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-demo-001',
        occurredAt: '2026-06-14T10:06:00.000Z'
      },
      headers: {
        signature: 'fixture:payment-success-import',
        timestamp: '2026-06-14T10:06:30.000Z',
        'x-lyt-source': 'captured-sample'
      },
      query: {
        traceId: 'trace-001'
      }
    })

    assert.equal(result.fixtureKey, 'payment-success-webhook')
    assert.equal(result.readinessAfterImport, 'ready')
    assert.ok(result.changedSections.includes('payload'))
    assert.ok(result.changedSections.includes('headers'))
    assert.ok(result.changedSections.includes('query'))
    assert.ok(result.changedKeys.payload.includes('requestId'))
    assert.equal(result.nextSamplePayload.requestId, 'req-pay-import-1')
    assert.equal(result.nextSampleHeaders['x-lyt-source'], 'captured-sample')
    assert.equal(result.nextSampleQueryParams.traceId, 'trace-001')
    assert.equal(result.compareReport.readiness, 'ready')
  })

  it('planFixtureImport returns blocked decision when required fields remain missing after import', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.planFixtureImport('payment-success-webhook', {
      payload: {
        requestId: '',
        paymentId: 'payment-001'
      }
    })

    assert.equal(result.importDecision, 'blocked-by-required')
    assert.equal(result.readinessBeforeImport, 'missing-required')
    assert.equal(result.readinessAfterImport, 'missing-required')
    assert.ok(result.sections.payload.unresolvedRequiredAfterImport.includes('requestId'))
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('required')))
  })

  it('planFixtureImport returns needs-review when risky extras require manual review', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.planFixtureImport('payment-success-webhook', {
      payload: {
        requestId: 'req-pay-import-2',
        paymentId: 'payment-001',
        orderId: 'order-001',
        transactionNo: 'txn-001',
        amount: 108,
        currency: 'CNY',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-demo-001',
        occurredAt: '2026-06-14T10:06:00.000Z',
        customField: 'custom'
      },
      headers: {
        signature: 'fixture:payment-success-import',
        timestamp: '2026-06-14T10:06:30.000Z',
        'x-lyt-source': 'captured-sample'
      },
      query: {
        traceId: 'trace-001'
      }
    })

    assert.equal(result.importDecision, 'needs-review')
    assert.equal(result.readinessAfterImport, 'ready')
    assert.deepEqual(result.sections.payload.riskyExtraCandidates, ['customField'])
    assert.ok(result.recommendedPromotions.includes('payload:requestId'))
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('risky extra')))
    assert.equal(result.preview.compareReport.payload.riskyExtraObserved[0], 'customField')
  })

  it('planFixtureImport returns ready-to-promote when import is complete and stable', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = service.planFixtureImport('payment-success-webhook', {
      payload: {
        requestId: 'req-pay-import-3',
        paymentId: 'payment-001',
        orderId: 'order-001',
        transactionNo: 'txn-001',
        amount: 108,
        currency: 'CNY',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-demo-001',
        occurredAt: '2026-06-14T10:06:00.000Z',
        sourceRemark: 'captured-sample'
      },
      headers: {
        signature: 'fixture:payment-success-import',
        timestamp: '2026-06-14T10:06:30.000Z',
        'x-lyt-source': 'captured-sample',
        'x-request-id': 'req-pay-import-3'
      },
      query: {
        traceId: 'trace-001'
      }
    })

    assert.equal(result.importDecision, 'ready-to-promote')
    assert.equal(result.readinessAfterImport, 'ready')
    assert.deepEqual(result.sections.payload.riskyExtraCandidates, [])
    assert.deepEqual(result.sections.payload.safeExtraCandidates, ['sourceRemark'])
    assert.deepEqual(result.sections.headers.safeExtraCandidates, ['x-request-id'])
    assert.ok(result.recommendedPromotions.includes('headers:x-request-id'))
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('safe extra')))
  })

  it('drillWebhook returns dry-run standardized preview without publishing', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    let publishCalled = false
    const mockIntegration = {
      acceptWebhook: async () => ({}),
      publishEvent: async () => {
        publishCalled = true
        return {}
      }
    }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = await service.drillWebhook({
      eventId: 'drill-001',
      eventType: 'payment.success',
      dryRun: true,
      payload: { tenantId: 'tenant-1', storeId: 'store-1', orderId: 'order-1' }
    })

    assert.equal(result.mode, 'dry-run')
    assert.equal(result.standardizedEvent.standardizedEventName, 'cashier.payment-succeeded')
    assert.equal(result.archiveRecord.signatureStatus, 'not-applicable')
    assert.equal(result.archiveRecord.source, 'lyt-drill')
    assert.equal(result.standardizedEnvelope, null)
    assert.equal(result.standardizedPublicationStatus, null)
    assert.equal(publishCalled, false)
  })

  it('drillWebhook can build payload from fixtureKey and archive the rehearsal payload', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = await service.drillWebhook({
      eventId: 'drill-fixture-001',
      fixtureKey: 'payment-success-webhook',
      dryRun: true
    })

    assert.equal(result.standardizedEvent.sourceEventName, 'payment.success')
    assert.equal(result.archiveRecord.fixtureKey, 'payment-success-webhook')
    assert.equal(result.archiveRecord.requestId, 'req-pay-001')
  })

  it('replayWebhookFixture reuses callback pipeline and tags archive fixtureKey', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    let capturedInput: Record<string, unknown> | undefined
    const mockIntegration = {
      acceptWebhook: async (_source: string, body: Record<string, unknown>) => ({
        ...(capturedInput = body),
        status: 'accepted',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: `lyt:${body.eventId}` },
        envelope: { aggregateId: body.eventId, eventName: body.eventType }
      }),
      publishEvent: async (eventName: string) => ({
        status: 'accepted',
        envelope: { aggregateId: 'fixture-run-001', eventName, source: 'lyt-standardized' }
      })
    }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = await service.replayWebhookFixture({
      fixtureKey: 'payment-success-webhook',
      eventId: 'fixture-run-001',
      payload: { requestId: 'req-pay-override-1' },
      headers: { signature: 'fixture:payment-success-override' },
      query: { replaySource: 'service-test' }
    })

    assert.equal(result.status, 'accepted')
    assert.equal((result.archiveRecord as Record<string, unknown>).fixtureKey, 'payment-success-webhook')
    assert.equal((result.archiveRecord as Record<string, unknown>).requestId, 'req-pay-override-1')
    assert.deepEqual((result.archiveRecord as Record<string, unknown>).rawHeaders, {
      signature: 'fixture:payment-success-override',
      timestamp: '2026-06-14T10:06:30.000Z'
    })
    assert.deepEqual((result.archiveRecord as Record<string, unknown>).rawQuery, { replaySource: 'service-test' })
    assert.deepEqual(capturedInput?.rawHeaders, {
      signature: 'fixture:payment-success-override',
      timestamp: '2026-06-14T10:06:30.000Z'
    })
    assert.deepEqual(capturedInput?.rawQuery, { replaySource: 'service-test' })
    assert.equal((result.standardizedEvent as Record<string, unknown>).standardizedEventName, 'cashier.payment-succeeded')
  })

  it('replayWebhookFixture rejects missing required fields when strictValidation is enabled', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    await assert.rejects(
      () =>
        service.replayWebhookFixture({
          fixtureKey: 'payment-success-webhook',
          strictValidation: true,
          payload: {
            paymentId: undefined,
            transactionNo: ''
          }
        }),
      (error: unknown) =>
        error instanceof BadRequestException &&
        error.message.includes('payload:paymentId') &&
        error.message.includes('payload:transactionNo')
    )
  })

  it('drillWebhook publishes standardized event when dryRun is false', async () => {
    const mockAdapter = {}
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({}),
      publishEvent: async (eventName: string) => ({
        status: 'accepted',
        envelope: {
          aggregateId: 'drill-002',
          eventName,
          source: 'lyt-drill'
        }
      })
    }
    const service = new LytService(mockAdapter as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = await service.drillWebhook({
      eventId: 'drill-002',
      eventType: 'coupon.redeemed',
      payload: { tenantId: 'tenant-1', storeId: 'store-1', couponId: 'coupon-1' }
    })

    assert.equal(result.mode, 'published')
    assert.equal(result.standardizedEvent.standardizedEventName, 'promotion.coupon-redeemed')
    assert.equal(result.archiveRecord.source, 'lyt-drill')
    assert.equal(result.standardizedEnvelope?.eventName, 'promotion.coupon-redeemed')
    assert.equal(result.standardizedPublicationStatus, 'accepted')
  })

  it('getBootstrap returns adapter name and foundation dependencies', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => [
        { adapterName: 'MockLytAdapter', adapterMode: 'mock' },
        { adapterName: 'SandboxLytAdapter', adapterMode: 'sandbox' },
        { adapterName: 'RealLytAdapter', adapterMode: 'real' }
      ]
    }
    const mockFoundation = {
      getDependencySummary: () => ({
        dependsOn: ['identity-access', 'configuration-governance'],
        handoffContracts: ['lyt-adapter:v1', 'lyt-gateway:v1']
      })
    }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = service.getBootstrap()
    assert.equal(result.adapter, 'MockLytAdapter')
    assert.deepStrictEqual(result.foundationDependencies, ['identity-access', 'configuration-governance'])
    assert.deepStrictEqual(result.foundationContracts, ['lyt-adapter:v1', 'lyt-gateway:v1'])
    assert.equal(result.availableAdapters?.length, 3)
    assert.equal(result.selectionStrategy, 'connection-driven: mock -> sandbox -> real')
  })

  it('getBootstrap handles null foundation dependency', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = service.getBootstrap()
    assert.equal(result.adapter, 'MockLytAdapter')
    assert.deepStrictEqual(result.foundationDependencies, [])
    assert.deepStrictEqual(result.foundationContracts, [])
  })

  it('getBootstrap handles undefined dependsOn and handoffContracts', () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => ({}) }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = service.getBootstrap()
    assert.equal(result.adapter, 'MockLytAdapter')
    assert.deepStrictEqual(result.foundationDependencies, [])
    assert.deepStrictEqual(result.foundationContracts, [])
  })

  it('acceptWebhook standardizes accepted lyt webhook into internal event', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const accepted = {
      status: 'accepted',
      source: 'lyt',
      signatureVerified: true,
      idempotency: { key: 'lyt:evt-2001' },
      envelope: { aggregateId: 'evt-2001', eventName: 'payment.success' }
    }
    const published = {
      status: 'accepted',
      envelope: {
        aggregateId: 'evt-2001',
        eventName: 'cashier.payment-succeeded',
        source: 'lyt-standardized'
      }
    }
    const mockIntegration = {
      acceptWebhook: async () => accepted,
      publishEvent: async (...args: unknown[]) => {
        assert.equal(args[0], 'cashier.payment-succeeded')
        return published
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = await service.acceptWebhook({
      eventId: 'evt-2001',
      eventType: 'payment.success',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: { tenantId: 'tenant-1', storeId: 'store-1', orderId: 'order-1' }
    })

    const expectedStandardized = toLytStandardizedWebhookEventContract({
      eventId: 'evt-2001',
      eventType: 'payment.success',
      payload: { tenantId: 'tenant-1', storeId: 'store-1', orderId: 'order-1' }
    })

    assert.equal(result.status, 'accepted')
    assert.deepStrictEqual(result.standardizedEvent, expectedStandardized)
    assert.equal((result.archiveRecord as Record<string, unknown>).signatureStatus, 'verified')
    assert.deepStrictEqual(result.standardizedEnvelope, published.envelope)
    assert.equal(result.standardizedPublicationStatus, 'accepted')
  })

  it('acceptWebhook skips standardized publication for duplicate raw webhook', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    let publishCalled = false
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'duplicate',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-dup' }
      }),
      publishEvent: async () => {
        publishCalled = true
        return {}
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any
    )

    const result = await service.acceptWebhook({
      eventType: 'member.sync',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: { tenantId: 'tenant-1', memberId: 'member-1' }
    })

    assert.equal(result.status, 'duplicate')
    assert.equal((result.standardizedEvent as Record<string, unknown>).standardizedEventName, 'member.profile-synced')
    assert.equal((result.archiveRecord as Record<string, unknown>).source, 'lyt-callback')
    assert.equal(result.standardizedEnvelope, null)
    assert.equal(publishCalled, false)
  })

  it('acceptWebhook attaches accepted webhook to runtime-governance receipt chain', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'accepted',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-runtime-001' },
        envelope: { aggregateId: 'evt-runtime-001', eventName: 'payment.success' }
      }),
      publishEvent: async () => ({
        status: 'accepted',
        envelope: { aggregateId: 'evt-runtime-001', eventName: 'cashier.payment-succeeded', source: 'lyt-standardized' }
      })
    }
    const runtimeSubmits: Array<Record<string, unknown>> = []
    const runtimeCallbacks: Array<{ receiptCode: string; payload: Record<string, unknown> }> = []
    const mockRuntimeGovernanceService = {
      submitAction: async (payload: Record<string, unknown>) => {
        runtimeSubmits.push(payload)
        return {
          receiptCode: 'LYT-WEBHOOK-CALLBACK-PROCEED-001',
          state: 'submitted'
        }
      },
      recordCallback: async (receiptCode: string, payload: Record<string, unknown>) => {
        runtimeCallbacks.push({ receiptCode, payload })
        return {
          receiptCode,
          state: 'callback-recorded',
          callback: {
            callbackStatus: payload.callbackStatus,
            ackToken: payload.ackToken,
            lastEvent: payload.lastEvent,
            summary: payload.summary
          }
        }
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any,
      undefined,
      undefined,
      undefined,
      mockRuntimeGovernanceService as any
    )

    const result = await service.acceptWebhook({
      eventType: 'payment.success',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: {
        tenantId: 'tenant-runtime-1',
        brandId: 'brand-runtime-1',
        storeId: 'store-runtime-1',
        orderId: 'order-runtime-1',
        paymentId: 'payment-runtime-1'
      }
    })

    assert.equal(runtimeSubmits.length, 1)
    assert.equal(runtimeSubmits[0]?.app, 'lyt')
    assert.equal(runtimeSubmits[0]?.action, 'webhook-callback')
    assert.equal(runtimeSubmits[0]?.tenantId, 'tenant-runtime-1')
    assert.equal(runtimeSubmits[0]?.riskLevel, 'high')
    assert.equal((runtimeSubmits[0]?.payload as Record<string, unknown>).sourceEventName, 'payment.success')
    assert.equal((runtimeSubmits[0]?.payload as Record<string, unknown>).standardizedEventName, 'cashier.payment-succeeded')
    assert.equal((runtimeSubmits[0]?.payload as Record<string, unknown>).acceptedStatus, 'accepted')
    assert.equal(runtimeCallbacks.length, 1)
    assert.equal(runtimeCallbacks[0]?.receiptCode, 'LYT-WEBHOOK-CALLBACK-PROCEED-001')
    assert.equal(runtimeCallbacks[0]?.payload.callbackStatus, 'callback-recorded')
    assert.equal(runtimeCallbacks[0]?.payload.idempotencyKey, 'lyt-webhook-callback:evt-runtime-001')
    assert.equal(runtimeCallbacks[0]?.payload.ackToken, 'lyt:evt-runtime-001')
    assert.equal((result.runtimeReceipt as Record<string, unknown>).state, 'callback-recorded')
  })

  it('acceptWebhook reuses runtime-governance receipt chain for duplicate webhook', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'duplicate',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-runtime-dup' }
      }),
      publishEvent: async () => {
        throw new Error('duplicate webhook should not republish standardized event')
      }
    }
    const runtimeSubmits: Array<Record<string, unknown>> = []
    const runtimeCallbacks: Array<{ receiptCode: string; payload: Record<string, unknown> }> = []
    const mockRuntimeGovernanceService = {
      submitAction: async (payload: Record<string, unknown>) => {
        runtimeSubmits.push(payload)
        return {
          receiptCode: 'LYT-WEBHOOK-CALLBACK-PROCEED-DUP',
          state: 'submitted'
        }
      },
      recordCallback: async (receiptCode: string, payload: Record<string, unknown>) => {
        runtimeCallbacks.push({ receiptCode, payload })
        return {
          receiptCode,
          state: 'callback-recorded',
          callback: {
            callbackStatus: payload.callbackStatus,
            ackToken: payload.ackToken,
            lastEvent: payload.lastEvent,
            summary: payload.summary
          }
        }
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any,
      undefined,
      undefined,
      undefined,
      mockRuntimeGovernanceService as any
    )

    const result = await service.acceptWebhook({
      eventId: 'evt-runtime-dup',
      eventType: 'member.sync',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: {
        tenantId: 'tenant-runtime-dup',
        memberId: 'member-runtime-dup'
      }
    })

    assert.equal(result.status, 'duplicate')
    assert.equal(runtimeSubmits.length, 1)
    assert.equal((runtimeSubmits[0]?.payload as Record<string, unknown>).acceptedStatus, 'duplicate')
    assert.equal(runtimeCallbacks.length, 1)
    assert.equal(runtimeCallbacks[0]?.payload.ackToken, 'lyt:evt-runtime-dup')
    assert.equal(typeof runtimeCallbacks[0]?.payload.summary, 'string')
    assert.match(runtimeCallbacks[0]?.payload.summary as string, /重复 webhook/)
    assert.equal((result.runtimeReceipt as Record<string, unknown>).state, 'callback-recorded')
  })

  it('acceptWebhook syncs member snapshot when member profile standardized event is accepted', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'accepted',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-member-001' },
        envelope: { aggregateId: 'evt-member-001', eventName: 'lyt.webhook.accepted' }
      }),
      publishEvent: async () => ({
        status: 'accepted',
        envelope: { aggregateId: 'evt-member-001', eventName: 'member.profile-synced' }
      })
    }
    const syncCalls: Array<Record<string, unknown>> = []
    const operationsProfileCalls: Array<Record<string, unknown>> = []
    const enqueueOperationsTaskCalls: Array<Record<string, unknown>> = []
    const mockMemberService = {
      syncLytMemberSnapshot: async (payload: Record<string, unknown>) => {
        syncCalls.push(payload)
        return {
          snapshot: {
            snapshotId: 'snapshot-001',
            externalMemberId: payload.externalMemberId
          },
          profile: {
            memberId: 'member-profile-001'
          }
        }
      },
      getOperationsProfile: async (memberId: string, tenantContext: Record<string, unknown>) => {
        operationsProfileCalls.push({ memberId, tenantContext })
        return {
          memberId,
          lifecycleStage: 'vip-active',
          audienceSegments: ['vip-tier-member', 'loyal-member'],
          recommendedActions: [{ code: 'assign-vip-concierge' }],
          automationTriggers: [{ code: 'member-profile-sync-follow-up' }]
        }
      },
      enqueueOperationsTasks: async (payload: Record<string, unknown>) => {
        enqueueOperationsTaskCalls.push(payload)
        return {
          queuedTasks: [{ taskId: 'ops-task-member-001' }],
          existingTasks: [],
          executedReceipts: [{ executionId: 'ops-exec-member-001', runtimeReceiptCode: 'runtime-member-001' }]
        }
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any,
      undefined,
      mockMemberService as any
    )

    const result = await service.acceptWebhook({
      eventType: 'member.sync',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: {
        tenantId: 'tenant-1',
        brandId: 'brand-1',
        storeId: 'store-1',
        externalMemberId: 'lyt-member-1001',
        memberCode: 'VIP-1001',
        mobile: '13500000000',
        nickname: 'Webhook Alice',
        levelCode: 'VIP',
        points: 1800,
        growthValue: 2200,
        updatedAt: '2026-06-14T12:30:00.000Z'
      }
    })

    assert.equal(syncCalls.length, 1)
    assert.equal(syncCalls[0]?.externalMemberId, 'lyt-member-1001')
    assert.equal((syncCalls[0]?.tenantContext as Record<string, unknown>).tenantId, 'tenant-1')
    assert.equal(operationsProfileCalls.length, 1)
    assert.equal(operationsProfileCalls[0]?.memberId, 'member-profile-001')
    assert.equal((operationsProfileCalls[0]?.tenantContext as Record<string, unknown>).tenantId, 'tenant-1')
    assert.equal(enqueueOperationsTaskCalls.length, 1)
    assert.equal(enqueueOperationsTaskCalls[0]?.memberId, 'member-profile-001')
    assert.equal(enqueueOperationsTaskCalls[0]?.source, 'manual-refresh')
    assert.equal((result.memberSnapshotSync as Record<string, unknown>).status, 'synced')
    assert.equal((result.memberSnapshotSync as Record<string, unknown>).snapshotId, 'snapshot-001')
    assert.equal((result.snapshotConsumerSync as Record<string, unknown>).status, 'consumed')
    assert.equal(
      ((result.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>).status,
      'ready'
    )
    assert.deepEqual(
      ((result.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .recommendedActionCodes,
      ['assign-vip-concierge']
    )
    assert.deepEqual(
      ((result.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .queuedTaskIds,
      ['ops-task-member-001']
    )
    assert.deepEqual(
      ((result.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .executedRuntimeReceiptCodes,
      ['runtime-member-001']
    )
  })

  it('acceptWebhook syncs order and payment snapshots for standardized LYT transaction events', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'accepted',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-payment-001' },
        envelope: { aggregateId: 'evt-payment-001', eventName: 'lyt.webhook.accepted' }
      }),
      publishEvent: async () => ({
        status: 'accepted',
        envelope: { aggregateId: 'evt-payment-001', eventName: 'cashier.payment-succeeded' }
      })
    }
    const orderSyncCalls: Array<Record<string, unknown>> = []
    const paymentSyncCalls: Array<Record<string, unknown>> = []
    const loyaltyCalls: Array<Record<string, unknown>> = []
    const memberOperationsCalls: Array<Record<string, unknown>> = []
    const enqueueOperationsTaskCalls: Array<Record<string, unknown>> = []
    const campaignEvaluations: Array<Record<string, unknown>> = []
    const mockTransactionsService = {
      syncLytOrderSnapshot: async (payload: Record<string, unknown>) => {
        orderSyncCalls.push(payload)
        return {
          snapshotId: 'order-snapshot-001',
          externalOrderId: payload.externalOrderId
        }
      },
      syncLytPaymentSnapshot: async (payload: Record<string, unknown>) => {
        paymentSyncCalls.push(payload)
        return {
          snapshotId: 'payment-snapshot-001',
          externalPaymentId: payload.externalPaymentId
        }
      },
      getLytOrderSnapshot: async (externalOrderId: string) => ({
        snapshotId: 'order-snapshot-lookup',
        tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1', storeId: 'store-1' },
        externalOrderId,
        memberId: 'member-1001',
        couponCode: 'COUPON-1001',
        blindboxPlanId: 'blindbox-1001',
        blindboxQuantity: 1,
        amount: 188,
        discountAmount: 8,
        payableAmount: 180,
        currency: 'CNY',
        status: 'PAID',
        paidAt: '2026-06-14T14:31:00.000Z',
        updatedAtFromSource: '2026-06-14T14:32:00.000Z'
      }),
      getLytPaymentSnapshot: async (externalPaymentId: string) => ({
        snapshotId: 'payment-snapshot-lookup',
        tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1', storeId: 'store-1' },
        externalPaymentId,
        externalOrderId: 'lyt-order-1001',
        paymentChannel: 'wechat-pay',
        paymentStatus: 'SUCCEEDED',
        amount: 188,
        currency: 'CNY',
        transactionNo: 'txn-1001',
        paidAt: '2026-06-14T14:30:00.000Z',
        updatedAtFromSource: '2026-06-14T14:30:00.000Z'
      })
    }
    const mockLoyaltyService = {
      settlePaidOrderFromSnapshots: async (orderSnapshot: Record<string, unknown>, paymentSnapshot: Record<string, unknown>) => {
        loyaltyCalls.push({ mode: 'paid', orderSnapshot, paymentSnapshot })
        return {
          settlementId: 'settlement-001',
          orderId: orderSnapshot.externalOrderId,
          paymentId: paymentSnapshot.externalPaymentId
        }
      },
      settleFailedOrderFromSnapshots: async (orderSnapshot: Record<string, unknown>, paymentSnapshot: Record<string, unknown>) => {
        loyaltyCalls.push({ mode: 'failed', orderSnapshot, paymentSnapshot })
        return {
          settlementId: 'settlement-002',
          orderId: orderSnapshot.externalOrderId,
          paymentId: paymentSnapshot.externalPaymentId
        }
      }
    }
    const mockMemberService = {
      getOperationsProfile: async (memberId: string) => {
        memberOperationsCalls.push({ memberId })
        return {
          memberId,
          lifecycleStage: 'repeat-paid',
          audienceSegments: ['lifecycle-repeat-paid', 'high-value-buyer'],
          recommendedActions: [{ code: 'recommend-repeat-purchase-bundle' }],
          automationTriggers: [{ code: 'payment-success-journey' }]
        }
      },
      enqueueOperationsTasks: async (payload: Record<string, unknown>) => {
        enqueueOperationsTaskCalls.push(payload)
        if (typeof payload.sourcePaymentId === 'string') {
          return {
            queuedTasks: [{ taskId: 'ops-task-001' }],
            existingTasks: [],
            executedReceipts: [{ executionId: 'ops-exec-001', runtimeReceiptCode: 'runtime-receipt-001' }]
          }
        }

        return {
          queuedTasks: [],
          existingTasks: [{ taskId: 'ops-task-001' }],
          executedReceipts: []
        }
      }
    }
    const mockCampaignService = {
      evaluateTriggers: (event: Record<string, unknown>) => {
        campaignEvaluations.push(event)
        return {
          matchedCampaigns: 1,
          dispatchedActions: 1,
          skippedActions: 0,
          failedActions: 0,
          dispatches: [{ dispatchId: 'dispatch-001' }]
        }
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any,
      mockLoyaltyService as any,
      mockMemberService as any,
      mockTransactionsService as any,
      undefined,
      undefined,
      undefined,
      mockCampaignService as any
    )

    const paymentResult = await service.acceptWebhook({
      eventType: 'payment.success',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: {
        tenantId: 'tenant-1',
        brandId: 'brand-1',
        storeId: 'store-1',
        paymentId: 'lyt-payment-1001',
        orderId: 'lyt-order-1001',
        transactionNo: 'txn-1001',
        amount: 188,
        currency: 'CNY',
        channel: 'wechat-pay',
        occurredAt: '2026-06-14T14:30:00.000Z'
      }
    })

    assert.equal(paymentSyncCalls.length, 1)
    assert.equal(paymentSyncCalls[0]?.externalPaymentId, 'lyt-payment-1001')
    assert.equal((paymentResult.paymentSnapshotSync as Record<string, unknown>).status, 'synced')
    assert.equal((paymentResult.paymentSnapshotSync as Record<string, unknown>).snapshotId, 'payment-snapshot-001')
    assert.equal((paymentResult.snapshotConsumerSync as Record<string, unknown>).status, 'consumed')
    assert.equal(loyaltyCalls.length, 1)
    assert.equal(memberOperationsCalls.length, 1)
    assert.equal(enqueueOperationsTaskCalls.length, 1)
    assert.equal(enqueueOperationsTaskCalls[0]?.source, 'payment-success')
    assert.equal(enqueueOperationsTaskCalls[0]?.sourceOrderId, 'lyt-order-1001')
    assert.equal(enqueueOperationsTaskCalls[0]?.sourcePaymentId, 'lyt-payment-1001')
    assert.equal(loyaltyCalls[0]?.mode, 'paid')
    assert.equal(
      ((paymentResult.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .status,
      'ready'
    )
    assert.deepEqual(
      ((paymentResult.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .queuedTaskIds,
      ['ops-task-001']
    )
    assert.deepEqual(
      ((paymentResult.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .executedReceiptIds,
      ['ops-exec-001']
    )
    assert.deepEqual(
      ((paymentResult.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .executedRuntimeReceiptCodes,
      ['runtime-receipt-001']
    )
    assert.equal(campaignEvaluations.length, 1)
    assert.equal(campaignEvaluations[0]?.eventName, 'payment.success')
    assert.equal(campaignEvaluations[0]?.memberId, 'member-1001')
    assert.equal(
      (paymentResult.snapshotConsumerSync as Record<string, unknown>).campaignDispatchCount,
      1
    )

    const orderResult = await service.acceptWebhook({
      eventType: 'order.updated',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: {
        tenantId: 'tenant-1',
        brandId: 'brand-1',
        storeId: 'store-1',
        externalOrderId: 'lyt-order-1001',
        orderNo: 'NO-1001',
        memberId: 'member-1001',
        amount: 188,
        discountAmount: 8,
        payableAmount: 180,
        currency: 'CNY',
        status: 'PAID',
        paidAt: '2026-06-14T14:31:00.000Z',
        updatedAt: '2026-06-14T14:32:00.000Z'
      }
    })

    assert.equal(orderSyncCalls.length, 1)
    assert.equal(orderSyncCalls[0]?.externalOrderId, 'lyt-order-1001')
    assert.equal((orderResult.orderSnapshotSync as Record<string, unknown>).status, 'synced')
    assert.equal((orderResult.orderSnapshotSync as Record<string, unknown>).snapshotId, 'order-snapshot-001')
    assert.equal((orderResult.snapshotConsumerSync as Record<string, unknown>).status, 'consumed')
    assert.equal(memberOperationsCalls.length, 2)
    assert.equal(enqueueOperationsTaskCalls.length, 2)
    assert.equal(enqueueOperationsTaskCalls[1]?.source, 'payment-success')
    assert.equal(enqueueOperationsTaskCalls[1]?.sourceOrderId, 'lyt-order-1001')
    assert.equal(enqueueOperationsTaskCalls[1]?.sourcePaymentId, undefined)
    assert.deepEqual(
      ((orderResult.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .queuedTaskIds,
      []
    )
    assert.deepEqual(
      ((orderResult.snapshotConsumerSync as Record<string, unknown>).memberOperationsSync as Record<string, unknown>)
        .existingTaskIds,
      ['ops-task-001']
    )
  })

  it('acceptWebhook keeps fixtureKey in callback archive record when present', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'accepted',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-fixture' },
        envelope: { aggregateId: 'evt-fixture', eventName: 'gate.pass' }
      }),
      publishEvent: async () => ({ status: 'accepted', envelope: { aggregateId: 'evt-fixture', eventName: 'store.gate-pass-recorded' } })
    }
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = await service.acceptWebhook({
      fixtureKey: 'gate-pass-webhook',
      eventType: 'gate.pass',
      signature: 'fixture:gate-pass-webhook',
      timestamp: '1718234567890',
      payload: { tenantId: 'tenant-1', storeId: 'store-1', requestId: 'req-gate-1' }
    })

    assert.equal((result.archiveRecord as Record<string, unknown>).fixtureKey, 'gate-pass-webhook')
  })

  it('acceptWebhook emits lyt.webhook.accepted audit when TrustGovernanceService is provided', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'accepted',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-audit-1' },
        envelope: { aggregateId: 'evt-audit-1', eventName: 'payment.success' }
      }),
      publishEvent: async () => ({
        status: 'accepted',
        envelope: { aggregateId: 'evt-audit-1', eventName: 'payment.success.standardized' }
      })
    }
    const auditCalls: Array<{
      eventType: string
      details: Record<string, unknown>
      context?: { tenantId?: string; actorId?: string; source?: string; riskLevel?: 'low' | 'medium' | 'high' }
    }> = []
    const mockTrust = {
      recordAudit: async (
        eventType: string,
        details: Record<string, unknown>,
        context?: { tenantId?: string; actorId?: string; source?: string; riskLevel?: 'low' | 'medium' | 'high' }
      ) => {
        auditCalls.push({ eventType, details, context })
        return { auditId: 'audit_1' }
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      mockTrust as any
    )

    await service.acceptWebhook({
      eventType: 'payment.success',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: { tenantId: 'tenant-001', brandId: 'brand-001', storeId: 'store-001', paymentId: 'pay-1' }
    })

    assert.equal(auditCalls.length, 1)
    assert.equal(auditCalls[0]?.eventType, 'lyt.webhook.accepted')
    assert.equal(auditCalls[0]?.details.aggregateId, 'evt-audit-1')
    assert.equal(auditCalls[0]?.details.acceptedStatus, 'accepted')
    assert.equal(auditCalls[0]?.details.signatureVerified, true)
    assert.equal(auditCalls[0]?.context?.source, 'lyt-adapter')
    assert.equal(auditCalls[0]?.context?.tenantId, 'tenant-001')
    assert.equal(auditCalls[0]?.context?.actorId, 'lyt-adapter')
    // payment capability → high risk per resolveWebhookRuntimeRiskLevel
    assert.equal(auditCalls[0]?.context?.riskLevel, 'high')
  })

  it('acceptWebhook emits low-risk audit on duplicate webhook path', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'duplicate',
        source: 'lyt',
        signatureVerified: false,
        idempotency: { key: 'lyt:evt-dup-1' },
        envelope: { aggregateId: 'evt-dup-1', eventName: 'payment.success' }
      }),
      publishEvent: async () => ({ status: 'duplicate', envelope: null })
    }
    const auditCalls: Array<{
      eventType: string
      details: Record<string, unknown>
      context?: { tenantId?: string; actorId?: string; source?: string; riskLevel?: 'low' | 'medium' | 'high' }
    }> = []
    const mockTrust = {
      recordAudit: async (
        eventType: string,
        details: Record<string, unknown>,
        context?: { tenantId?: string; actorId?: string; source?: string; riskLevel?: 'low' | 'medium' | 'high' }
      ) => {
        auditCalls.push({ eventType, details, context })
        return { auditId: 'audit_dup_1' }
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      mockTrust as any
    )

    await service.acceptWebhook({
      eventType: 'payment.success',
      signature: 'sha256=dup',
      timestamp: '1718234567890',
      payload: { tenantId: 'tenant-001', storeId: 'store-001' }
    })

    assert.equal(auditCalls.length, 1)
    assert.equal(auditCalls[0]?.eventType, 'lyt.webhook.accepted')
    assert.equal(auditCalls[0]?.details.acceptedStatus, 'duplicate')
    // Duplicate webhook path is explicitly downgraded to low risk (already audited)
    assert.equal(auditCalls[0]?.context?.riskLevel, 'low')
  })

  it('acceptWebhook no-ops when TrustGovernanceService is not provided', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'accepted',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-noop' },
        envelope: { aggregateId: 'evt-noop', eventName: 'gate.pass' }
      }),
      publishEvent: async () => ({
        status: 'accepted',
        envelope: { aggregateId: 'evt-noop', eventName: 'gate.pass.standardized' }
      })
    }
    // No TrustGovernanceService injected — emitAudit should silently no-op
    const service = new LytService(mockAdapterRegistry as any, mockFoundation as any, mockConnections as any, mockIntegration as any)

    const result = await service.acceptWebhook({
      eventType: 'gate.pass',
      signature: 'sha256=noop',
      timestamp: '1718234567890',
      payload: { tenantId: 'tenant-001', storeId: 'store-001' }
    })

    assert.equal((result.standardizedEvent as Record<string, unknown>).aggregateId, 'evt-noop')
  })

  it('replayWebhookFixture emits lyt.fixture.replayed audit after delegating to acceptWebhook', async () => {
    const mockAdapterRegistry = {
      getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
      resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
      listAvailableAdapters: () => []
    }
    const mockFoundation = { getDependencySummary: () => null }
    const mockConnections = { getConnectionForStore: async () => ({}) }
    const mockIntegration = {
      acceptWebhook: async () => ({
        status: 'accepted',
        source: 'lyt',
        signatureVerified: true,
        idempotency: { key: 'lyt:evt-fixture-replay' },
        envelope: { aggregateId: 'evt-fixture-replay', eventName: 'gate.pass' }
      }),
      publishEvent: async () => ({
        status: 'accepted',
        envelope: { aggregateId: 'evt-fixture-replay', eventName: 'gate.pass.standardized' }
      })
    }
    const auditCalls: Array<{
      eventType: string
      details: Record<string, unknown>
    }> = []
    const mockTrust = {
      recordAudit: async (eventType: string, details: Record<string, unknown>) => {
        auditCalls.push({ eventType, details })
        return { auditId: `audit_${auditCalls.length}` }
      }
    }
    const service = new LytService(
      mockAdapterRegistry as any,
      mockFoundation as any,
      mockConnections as any,
      mockIntegration as any,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      mockTrust as any
    )

    const result = await service.replayWebhookFixture({
      fixtureKey: 'gate-pass-webhook',
      strictValidation: true
    })

    // Expect 2 audits: lyt.webhook.accepted (from acceptWebhook) + lyt.fixture.replayed
    assert.equal(auditCalls.length, 2)
    assert.equal(auditCalls[0]?.eventType, 'lyt.webhook.accepted')
    assert.equal(auditCalls[1]?.eventType, 'lyt.fixture.replayed')
    assert.equal(auditCalls[1]?.details.aggregateId, 'evt-fixture-replay')
    assert.equal(auditCalls[1]?.details.fixtureKey, 'gate-pass-webhook')
    assert.equal(auditCalls[1]?.details.strictValidation, true)
    assert.equal(auditCalls[1]?.details.acceptedStatus, 'accepted')
    assert.ok((result.standardizedEvent as Record<string, unknown>).aggregateId)
  })
})
