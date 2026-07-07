import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
describe('LytController', () => {
   
  const { LytController } = require('./lyt.controller')

  // ── 元数据测试 ──
  it('controller path metadata is set to "lyt"', () => {
    const path = Reflect.getMetadata('path', LytController)
    assert.equal(path, 'lyt')
  })

  it('getBootstrap route has GET metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getBootstrap)
    const path = Reflect.getMetadata('path', LytController.prototype.getBootstrap)
    assert.equal(method, 0) // GET
    assert.equal(path, 'bootstrap')
  })

  it('getFixtures route has GET metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getFixtures)
    const path = Reflect.getMetadata('path', LytController.prototype.getFixtures)
    assert.equal(method, 0)
    assert.equal(path, 'fixtures')
  })

  it('getFixture route has GET metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getFixture)
    const path = Reflect.getMetadata('path', LytController.prototype.getFixture)
    assert.equal(method, 0)
    assert.equal(path, 'fixtures/:key')
  })

  it('compareFixture route has POST metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.compareFixture)
    const path = Reflect.getMetadata('path', LytController.prototype.compareFixture)
    assert.equal(method, 1)
    assert.equal(path, 'fixtures/:key/compare')
  })

  it('importFixturePreview route has POST metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.importFixturePreview)
    const path = Reflect.getMetadata('path', LytController.prototype.importFixturePreview)
    assert.equal(method, 1)
    assert.equal(path, 'fixtures/:key/import-preview')
  })

  it('importFixturePlan route has POST metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.importFixturePlan)
    const path = Reflect.getMetadata('path', LytController.prototype.importFixturePlan)
    assert.equal(method, 1)
    assert.equal(path, 'fixtures/:key/import-plan')
  })

  it('getFixtureSummary route has GET metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getFixtureSummary)
    const path = Reflect.getMetadata('path', LytController.prototype.getFixtureSummary)
    assert.equal(method, 0)
    assert.equal(path, 'fixtures/summary')
  })

  it('getConnection route has GET metadata with :storeId param', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getConnection)
    const path = Reflect.getMetadata('path', LytController.prototype.getConnection)
    assert.equal(method, 0)
    assert.equal(path, 'connection/:storeId')
  })

  it('getConnectionCapabilityReadiness route has GET metadata with :storeId param', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getConnectionCapabilityReadiness)
    const path = Reflect.getMetadata('path', LytController.prototype.getConnectionCapabilityReadiness)
    assert.equal(method, 0)
    assert.equal(path, 'connection/:storeId/readiness')
  })

  it('getStoreCapabilityAccessView route has GET metadata with :storeId param', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getStoreCapabilityAccessView)
    const path = Reflect.getMetadata('path', LytController.prototype.getStoreCapabilityAccessView)
    assert.equal(method, 0)
    assert.equal(path, 'connection/:storeId/access-view')
  })

  it('getAdapterSelection route has GET metadata with :storeId param', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getAdapterSelection)
    const path = Reflect.getMetadata('path', LytController.prototype.getAdapterSelection)
    assert.equal(method, 0)
    assert.equal(path, 'connection/:storeId/adapter')
  })

  it('getConnectionGovernanceSummary route has GET metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getConnectionGovernanceSummary)
    const path = Reflect.getMetadata('path', LytController.prototype.getConnectionGovernanceSummary)
    assert.equal(method, 0)
    assert.equal(path, 'connection/governance-summary')
  })

  it('getConnectionGovernanceAlerts route has GET metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getConnectionGovernanceAlerts)
    const path = Reflect.getMetadata('path', LytController.prototype.getConnectionGovernanceAlerts)
    assert.equal(method, 0)
    assert.equal(path, 'connection/governance-alerts')
  })

  it('getDeviceHealthSummary route has POST metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getDeviceHealthSummary)
    const path = Reflect.getMetadata('path', LytController.prototype.getDeviceHealthSummary)
    assert.equal(method, 1)
    assert.equal(path, 'devices/health-summary')
  })

  it('getDeviceStatus route has GET metadata with :deviceId param', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.getDeviceStatus)
    const path = Reflect.getMetadata('path', LytController.prototype.getDeviceStatus)
    assert.equal(method, 0)
    assert.equal(path, 'devices/:deviceId/status')
  })

  it('acceptWebhook route has POST metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.acceptWebhook)
    const path = Reflect.getMetadata('path', LytController.prototype.acceptWebhook)
    assert.equal(method, 1) // POST
    assert.equal(path, 'webhooks/callback')
  })

  it('drillWebhook route has POST metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.drillWebhook)
    const path = Reflect.getMetadata('path', LytController.prototype.drillWebhook)
    assert.equal(method, 1)
    assert.equal(path, 'webhooks/drill')
  })

  it('replayWebhookFixture route has POST metadata', () => {
    const method = Reflect.getMetadata('method', LytController.prototype.replayWebhookFixture)
    const path = Reflect.getMetadata('path', LytController.prototype.replayWebhookFixture)
    assert.equal(method, 1)
    assert.equal(path, 'webhooks/replay-fixture')
  })

  // ── getBootstrap 正例 ──
  it('getBootstrap delegates to LytService.getBootstrap', () => {
    const mockLytService = {
      getBootstrap: () => ({
        adapter: 'MockLytAdapter',
        foundationDependencies: ['identity-access'],
        foundationContracts: ['lyt-adapter:v1']
      }),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.getBootstrap()

    assert.equal(result.adapter, 'MockLytAdapter')
    assert.deepStrictEqual(result.foundationDependencies, ['identity-access'])
    assert.deepStrictEqual(result.foundationContracts, ['lyt-adapter:v1'])
  })

  it('getFixtures delegates to LytService.getFixtures', () => {
    const mockLytService = {
      getFixtures: (filters?: { transport?: string; capability?: string }) => [
        {
          key: 'payment-success-webhook',
          transport: 'webhook',
          eventType: 'payment.success',
          filters
        }
      ],
      getBootstrap: () => ({}),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.getFixtures('webhook', 'payment')

    assert.equal(result.length, 1)
    assert.equal(result[0].key, 'payment-success-webhook')
    assert.deepEqual(result[0].filters, { transport: 'webhook', capability: 'payment' })
  })

  it('getFixtureSummary delegates to LytService.getFixtureSummary', () => {
    const mockLytService = {
      getFixtureSummary: (filters?: { transport?: string; capability?: string }) => ({
        totalFixtures: 2,
        filters
      }),
      getFixtures: () => [],
      getBootstrap: () => ({}),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.getFixtureSummary('webhook', 'payment')

    assert.equal(result.totalFixtures, 2)
    assert.deepEqual(result.filters, { transport: 'webhook', capability: 'payment' })
  })

  it('getFixture delegates to LytService.getFixture', () => {
    const mockLytService = {
      getFixture: (key: string) => ({
        key,
        transport: 'webhook',
        eventType: 'gate.pass'
      }),
      getFixtures: () => [],
      getBootstrap: () => ({}),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.getFixture('gate-pass-webhook')

    assert.equal(result.key, 'gate-pass-webhook')
    assert.equal(result.eventType, 'gate.pass')
  })

  it('compareFixture delegates to LytService.compareFixtureInput', () => {
    const mockLytService = {
      compareFixtureInput: (key: string, body: Record<string, unknown>) => ({
        fixtureKey: key,
        body
      }),
      getFixtures: () => [],
      getBootstrap: () => ({}),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.compareFixture('payment-success-webhook', {
      payload: { paymentId: 'payment-001' },
      headers: { signature: 'fixture:test' }
    })

    assert.equal(result.fixtureKey, 'payment-success-webhook')
    assert.deepEqual(result.body, {
      payload: { paymentId: 'payment-001' },
      headers: { signature: 'fixture:test' }
    })
  })

  it('importFixturePreview delegates to LytService.previewFixtureImport', () => {
    const mockLytService = {
      previewFixtureImport: (key: string, body: Record<string, unknown>) => ({
        fixtureKey: key,
        body
      }),
      getFixtures: () => [],
      getBootstrap: () => ({}),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.importFixturePreview('payment-success-webhook', {
      payload: { paymentId: 'payment-001' },
      headers: { signature: 'fixture:test' }
    })

    assert.equal(result.fixtureKey, 'payment-success-webhook')
    assert.deepEqual(result.body, {
      payload: { paymentId: 'payment-001' },
      headers: { signature: 'fixture:test' }
    })
  })

  it('importFixturePlan delegates to LytService.planFixtureImport', () => {
    const mockLytService = {
      planFixtureImport: (key: string, body: Record<string, unknown>) => ({
        fixtureKey: key,
        body
      }),
      getFixtures: () => [],
      getBootstrap: () => ({}),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.importFixturePlan('payment-success-webhook', {
      payload: { paymentId: 'payment-001' },
      query: { traceId: 'trace-001' }
    })

    assert.equal(result.fixtureKey, 'payment-success-webhook')
    assert.deepEqual(result.body, {
      payload: { paymentId: 'payment-001' },
      query: { traceId: 'trace-001' }
    })
  })

  // ── getBootstrap 边界：空依赖 ──
  it('getBootstrap handles empty dependency arrays', () => {
    const mockLytService = {
      getBootstrap: () => ({
        adapter: 'MockLytAdapter',
        foundationDependencies: [],
        foundationContracts: []
      }),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.getBootstrap()

    assert.equal(result.adapter, 'MockLytAdapter')
    assert.deepStrictEqual(result.foundationDependencies, [])
    assert.deepStrictEqual(result.foundationContracts, [])
  })

  // ── getBootstrap 边界：缺失字段 ──
  it('getBootstrap returns undefined for missing dependency metadata', () => {
    const mockLytService = {
      getBootstrap: () => ({
        adapter: 'MockLytAdapter'
        // foundationDependencies 和 foundationContracts 缺失
      }),
      getAdapter: () => ({})
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.getBootstrap()

    assert.equal(result.adapter, 'MockLytAdapter')
    assert.equal(result.foundationDependencies, undefined)
    assert.equal(result.foundationContracts, undefined)
  })

  // ── getConnection 正例 ──
  it('getConnection delegates scoped lookup to LytService', async () => {
    const mockConnection = {
      tenantId: 'tenant-1',
      brandId: 'brand-1',
      storeId: 'store-1',
      endpoint: 'https://lyt-store-1.example.com',
      authMode: 'bearer-token',
      hasCredential: true,
      connectionStatus: 'configured' as const,
      source: 'prisma' as const
    }
    const mockLytService = {
      getConnection: async (storeId: string, tenantContext: unknown) => ({
        ...mockConnection,
        storeId,
        tenantContext
      }),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getConnection('store-1', { tenantId: 'tenant-1', brandId: 'brand-1' } as any)
    assert.equal(result.storeId, 'store-1')
    assert.deepStrictEqual(result.tenantContext, { tenantId: 'tenant-1', brandId: 'brand-1' })
    assert.equal(result.endpoint, 'https://lyt-store-1.example.com')
  })

  it('getAdapterSelection delegates scoped lookup to LytService', async () => {
    const mockLytService = {
      getAdapterSelection: async () => ({
        adapterName: 'SandboxLytAdapter',
        adapterMode: 'sandbox',
        reason: 'sandbox endpoint',
        vendor: 'lyt-enterprise',
        vendorTenantId: 'vendor-tenant-1',
        vendorBrandId: 'vendor-brand-1',
        vendorStoreId: 'vendor-store-1',
        endpoint: 'https://sandbox.lyt.example.com',
        authMode: 'sandbox-signature',
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured'
      }),
      getConnection: async () => ({}),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getAdapterSelection('store-1', { tenantId: 'tenant-1' } as any)
    assert.equal(result.adapterName, 'SandboxLytAdapter')
    assert.equal(result.adapterMode, 'sandbox')
    assert.equal(result.vendorStoreId, 'vendor-store-1')
    assert.deepStrictEqual(result.capabilities, ['member', 'payment'])
  })

  it('getConnectionCapabilityReadiness delegates scoped lookup to LytService', async () => {
    const mockLytService = {
      getConnectionCapabilityReadiness: async () => ({
        storeId: 'store-1',
        storeCode: 'S001',
        enabledCapabilities: ['member', 'payment'],
        readinessByCapability: [{ capability: 'member', enabled: true, readiness: 'ready' }]
      }),
      getConnection: async () => ({}),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getConnectionCapabilityReadiness('store-1', { tenantId: 'tenant-1' } as any)
    assert.equal(result.storeId, 'store-1')
    assert.equal(result.storeCode, 'S001')
    assert.deepStrictEqual(result.enabledCapabilities, ['member', 'payment'])
  })

  it('getStoreCapabilityAccessView delegates scoped lookup to LytService', async () => {
    const mockLytService = {
      getStoreCapabilityAccessView: async () => ({
        storeId: 'store-1',
        connectionStatus: 'configured',
        accessByCapability: [{ capability: 'member', readiness: 'ready', access: 'enabled', reason: 'ok' }]
      }),
      getConnection: async () => ({}),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getStoreCapabilityAccessView('store-1', { tenantId: 'tenant-1' } as any)
    assert.equal(result.storeId, 'store-1')
    assert.equal(result.connectionStatus, 'configured')
    assert.equal(result.accessByCapability[0]?.access, 'enabled')
  })

  it('getConnectionGovernanceSummary delegates to LytService', async () => {
    const mockLytService = {
      getConnectionGovernanceSummary: async () => ({
        totalStores: 2,
        configuredStores: 1,
        recommendedNextActions: ['action-1']
      }),
      getConnection: async () => ({}),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getConnectionGovernanceSummary({ tenantId: 'tenant-1', brandId: 'brand-1' } as any)
    assert.equal(result.totalStores, 2)
    assert.equal(result.configuredStores, 1)
    assert.deepStrictEqual(result.recommendedNextActions, ['action-1'])
  })

  it('getConnectionGovernanceAlerts delegates to LytService', async () => {
    const mockLytService = {
      getConnectionGovernanceAlerts: async () => ({
        alerts: [{ code: 'pending-configuration-stores', severity: 'high', count: 1 }]
      }),
      getConnection: async () => ({}),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getConnectionGovernanceAlerts({ tenantId: 'tenant-1', brandId: 'brand-1' } as any)
    assert.equal(result.alerts[0]?.code, 'pending-configuration-stores')
    assert.equal(result.alerts[0]?.severity, 'high')
  })

  // ── getConnection 边界：无 tenantContext ──
  it('getConnection handles undefined tenantContext', async () => {
    const mockConnection = {
      tenantId: 'tenant-1',
      storeId: 'store-2',
      endpoint: 'https://lyt-store-2.example.com',
      authMode: 'api-key',
      hasCredential: false,
      connectionStatus: 'pending-configuration' as const,
      source: 'fallback' as const
    }
    const mockLytService = {
      getConnection: async (_storeId: string, _tc?: unknown) => mockConnection,
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getConnection('store-2', undefined)
    assert.equal(result.storeId, 'store-2')
    assert.equal(result.connectionStatus, 'pending-configuration')
    assert.equal(result.source, 'fallback')
    assert.equal(result.hasCredential, false)
  })

  // ── getConnection 边界：空字符串 storeId ──
  it('getConnection forwards empty storeId to service', async () => {
    let capturedStoreId = ''
    const mockLytService = {
      getConnection: async (storeId: string) => {
        capturedStoreId = storeId
        return { tenantId: 't', storeId, endpoint: '', authMode: 'none', hasCredential: false, connectionStatus: 'pending-configuration' as const, source: 'fallback' as const }
      },
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getConnection('', undefined)
    assert.equal(capturedStoreId, '')
    assert.equal(result.storeId, '')
  })

  // ── getDeviceStatus 正例 ──
  it('getDeviceStatus delegates to adapter.getDeviceStatus', async () => {
    const mockAdapter = {
      getDeviceStatus: (deviceId: string) => Promise.resolve({ deviceId, status: 'ONLINE' as const })
    }
    const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getDeviceStatus('dev-42')
    assert.deepStrictEqual(result, { deviceId: 'dev-42', status: 'ONLINE' })
  })

  // ── getDeviceStatus 反例：设备离线 ──
  it('getDeviceStatus returns OFFLINE status', async () => {
    const mockAdapter = {
      getDeviceStatus: (deviceId: string) => Promise.resolve({ deviceId, status: 'OFFLINE' as const })
    }
    const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getDeviceStatus('dev-offline-1')
    assert.equal(result.deviceId, 'dev-offline-1')
    assert.equal(result.status, 'OFFLINE')
  })

  // ── getDeviceStatus 反例：设备维护中 ──
  it('getDeviceStatus returns MAINTENANCE status', async () => {
    const mockAdapter = {
      getDeviceStatus: (deviceId: string) => Promise.resolve({ deviceId, status: 'MAINTENANCE' as const })
    }
    const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getDeviceStatus('dev-maint-1')
    assert.equal(result.deviceId, 'dev-maint-1')
    assert.equal(result.status, 'MAINTENANCE')
  })

  // ── getDeviceStatus 边界：空 deviceId ──
  it('getDeviceStatus forwards empty deviceId', async () => {
    let capturedId = ''
    const mockAdapter = {
      getDeviceStatus: (deviceId: string) => {
        capturedId = deviceId
        return Promise.resolve({ deviceId, status: 'OFFLINE' as const })
      }
    }
    const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getDeviceStatus('')
    assert.equal(capturedId, '')
    assert.equal(result.deviceId, '')
  })

  // ── getDeviceStatus 边界：特殊字符 deviceId ──
  it('getDeviceStatus handles special character deviceId', async () => {
    const deviceId = 'lyt://gate-reader/floor-1/entrance-A'
    const mockAdapter = {
      getDeviceStatus: (id: string) => Promise.resolve({ deviceId: id, status: 'ONLINE' as const })
    }
    const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) }
    const controller = new LytController(mockLytService as any)

    const result = await controller.getDeviceStatus(deviceId)
    assert.equal(result.deviceId, deviceId)
    assert.equal(result.status, 'ONLINE')
  })

  // ── getDeviceHealthSummary 正例 ──
  it('getDeviceHealthSummary delegates devices to service', () => {
    const sampleDevices = [
      { deviceId: 'd1', tenantContext: {} as any, storeId: 's1', deviceType: 'GATE_READER', name: 'G1', status: 'ONLINE', registeredAt: '2025-01-01T00:00:00Z' },
      { deviceId: 'd2', tenantContext: {} as any, storeId: 's1', deviceType: 'CAMERA', name: 'C1', status: 'OFFLINE', registeredAt: '2025-01-01T00:00:00Z' }
    ]
    const mockHealthSummary = { total: 2, online: 1, offline: 1, maintenance: 0, anomalous: 1, healthRate: 50, deviceTypeBreakdown: {} }
    const mockLytService = {
      getDeviceHealthSummary: (devices: any[], thresholdMinutes?: number) => mockHealthSummary
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.getDeviceHealthSummary({ devices: sampleDevices })
    assert.equal(result.total, 2)
    assert.equal(result.healthRate, 50)
  })

  // ── getDeviceHealthSummary 正例：传入 thresholdMinutes ──
  it('getDeviceHealthSummary forwards thresholdMinutes', () => {
    let capturedThreshold: number | undefined
    const mockLytService = {
      getDeviceHealthSummary: (_devices: any[], thresholdMinutes?: number) => {
        capturedThreshold = thresholdMinutes
        return { total: 0, online: 0, offline: 0, maintenance: 0, anomalous: 0, healthRate: 100, deviceTypeBreakdown: {} }
      }
    }
    const controller = new LytController(mockLytService as any)
    controller.getDeviceHealthSummary({ devices: [], thresholdMinutes: 10 })
    assert.equal(capturedThreshold, 10)
  })

  // ── getDeviceHealthSummary 反例：空设备列表 ──
  it('getDeviceHealthSummary returns 100% for empty device list', () => {
    const mockLytService = {
      getDeviceHealthSummary: () => ({ total: 0, online: 0, offline: 0, maintenance: 0, anomalous: 0, healthRate: 100, deviceTypeBreakdown: {} })
    }
    const controller = new LytController(mockLytService as any)
    const result = controller.getDeviceHealthSummary({ devices: [] })
    assert.equal(result.total, 0)
    assert.equal(result.healthRate, 100)
  })

  // ── getDeviceHealthSummary 边界：不传 thresholdMinutes ──
  it('getDeviceHealthSummary defaults thresholdMinutes', () => {
    let capturedThreshold: number | undefined
    const mockLytService = {
      getDeviceHealthSummary: (_devices: any[], thresholdMinutes?: number) => {
        capturedThreshold = thresholdMinutes
        return { total: 0, online: 0, offline: 0, maintenance: 0, anomalous: 0, healthRate: 100, deviceTypeBreakdown: {} }
      }
    }
    const controller = new LytController(mockLytService as any)
    controller.getDeviceHealthSummary({ devices: [] })
    assert.equal(capturedThreshold, undefined)
  })

  it('acceptWebhook delegates to LytService.acceptWebhook', async () => {
    const payload = {
      eventId: 'evt-1',
      eventType: 'payment.success',
      signature: 'sha256=test',
      timestamp: '1718234567890',
      payload: { orderId: 'order-1' }
    }
    const mockLytService = {
      acceptWebhook: async (body: unknown) => ({
        status: 'accepted',
        received: body
      }),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.acceptWebhook(payload as any)
    assert.equal(result.status, 'accepted')
    assert.deepStrictEqual(result.received, payload)
  })

  it('drillWebhook delegates to LytService.drillWebhook', async () => {
    const payload = {
      eventId: 'drill-001',
      eventType: 'payment.success',
      dryRun: true,
      payload: { orderId: 'order-1' }
    }
    const mockLytService = {
      drillWebhook: async (body: unknown) => ({
        mode: 'dry-run',
        received: body
      }),
      acceptWebhook: async () => ({}),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.drillWebhook(payload as any)
    assert.equal(result.mode, 'dry-run')
    assert.deepStrictEqual(result.received, payload)
  })

  it('replayWebhookFixture delegates to LytService.replayWebhookFixture', async () => {
    const payload = {
      fixtureKey: 'payment-success-webhook',
      eventId: 'fixture-run-001'
    }
    const mockLytService = {
      replayWebhookFixture: async (body: unknown) => ({
        status: 'accepted',
        received: body
      }),
      drillWebhook: async () => ({}),
      acceptWebhook: async () => ({}),
      getAdapter: () => ({}),
      getBootstrap: () => ({})
    }
    const controller = new LytController(mockLytService as any)

    const result = await controller.replayWebhookFixture(payload as any)
    assert.equal(result.status, 'accepted')
    assert.deepStrictEqual(result.received, payload)
  })
})
