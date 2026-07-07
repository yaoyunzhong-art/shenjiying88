import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
describe('LytGovernanceQueryService', () => {
  const { LytGovernanceQueryService } = require('./lyt-governance-query.service')
  const { LytService } = require('./lyt.service')

  it('getConnectionGovernanceSummary aggregates readiness and recommendations', async () => {
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
        capabilities: ['member', 'payment', 'order'],
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
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
        { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' },
        { id: 'store-stale', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stale 店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

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
    assert.equal(result.storeGroups.find((item: { code: string }) => item.code === 'high-risk-stores')?.count, 1)
    assert.deepEqual(
      result.storeGroups.find((item: { code: string }) => item.code === 'high-risk-stores')?.storeIds,
      ['store-pending']
    )
    assert.equal(
      result.storeGroups.find((item: { code: string }) => item.code === 'high-risk-stores')?.recommendedFocus,
      'high-risk'
    )
    assert.equal(
      result.storeGroups.find((item: { code: string }) => item.code === 'pending-configuration-stores')?.primaryActionLabel,
      '进入连接配置'
    )
    assert.equal(result.storeGroups.find((item: { code: string }) => item.code === 'stale-stores')?.count, 1)
    assert.equal(
      result.storeGroups.find((item: { code: string }) => item.code === 'inherited-store-verification')?.count,
      1
    )
    assert.deepEqual(
      result.stores.map((item: { storeId: string }) => item.storeId),
      ['store-pending', 'store-stale', 'store-ready']
    )
    assert.equal(result.stores[0]?.governanceRiskLevel, 'high')
    assert.ok(result.stores[0]?.alertCodes.includes('pending-configuration-stores'))
    assert.ok(result.stores[0]?.blockingIssueCount > result.stores[2]!.blockingIssueCount)
    assert.equal(result.stores[0]?.primaryIssueCode, 'pending-configuration-stores')
    assert.equal(result.stores[0]?.primaryFocus, 'connection-setup')
    assert.equal(result.stores[0]?.primaryActionLabel, '补齐连接配置')
    assert.deepEqual(
      result.stores[0]?.secondaryIssues.map((item: { code: string }) => item.code),
      ['credential-missing-stores', 'capability-pending-stores']
    )
    assert.deepEqual(result.stores[0]?.focusTrail, ['connection-setup', 'credential-binding', 'capability-rollout'])
    assert.ok(result.stores[1]?.alertCodes.includes('stale-connections'))
    assert.equal(result.stores[1]?.primaryIssueCode, 'stale-connections')
    assert.equal(result.stores[1]?.primaryFocus, 'health-check')
    assert.deepEqual(
      result.stores[1]?.secondaryIssues.map((item: { code: string }) => item.code),
      ['inherited-store-verification']
    )
    assert.deepEqual(result.stores[1]?.focusTrail, ['health-check', 'inheritance-verification'])
    assert.equal(result.stores[2]?.governanceRiskLevel, 'low')
    assert.equal(result.stores[2]?.primaryIssueCode, 'healthy')
    assert.equal(result.stores[2]?.primaryFocus, 'stable')
    assert.deepEqual(result.stores[2]?.secondaryIssues, [])
    assert.deepEqual(result.stores[2]?.focusTrail, ['stable'])
    assert.ok(result.stores[0]?.recommendedNextActions.some((item: string) => item.includes('endpoint')))
  })

  it('getStoreCapabilityAccessView maps readiness to access states and next actions', async () => {
    const connectionManager = {
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
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getStoreCapabilityAccessView('store-001', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.equal(result.connectionStatus, 'configured')
    assert.equal(result.healthStatus, 'stale')
    assert.equal(result.accessByCapability.find((item: { capability: string }) => item.capability === 'member')?.access, 'degraded')
    assert.equal(result.accessByCapability.find((item: { capability: string }) => item.capability === 'payment')?.access, 'degraded')
    assert.ok(
      result.accessByCapability
        .find((item: { capability: string }) => item.capability === 'member')
        ?.reason.includes('优先巡检')
    )
    assert.equal(result.accessByCapability.find((item: { capability: string }) => item.capability === 'device')?.access, 'hidden')
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('健康检查')))
  })

  it('getConnectionCapabilityReadiness flags missing vendor mappings as governance requirements', async () => {
    const connectionManager = {
      getConnectionForStore: async () => ({
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-002',
        vendorTenantId: '',
        vendorBrandId: undefined,
        vendorStoreId: '',
        endpoint: 'https://lyt-store.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-002',
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }),
      listScopedStores: async () => [
        { id: 'store-002', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S002', name: '映射缺失门店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionCapabilityReadiness('store-002', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.ok(result.missingRequirements.includes('vendor-tenant-mapping'))
    assert.ok(result.missingRequirements.includes('vendor-brand-mapping'))
    assert.ok(result.missingRequirements.includes('vendor-store-mapping'))
    assert.ok(result.recommendedNextActions.some((item: string) => item.includes('vendorTenantId / vendorBrandId / vendorStoreId')))
    const summary = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    assert.equal(summary.storeGroups.find((item: { code: string }) => item.code === 'vendor-mapping-gaps')?.recommendedFocus, 'vendor-mapping')
    assert.equal(summary.stores[0]?.primaryIssueCode, 'vendor-mapping-gaps')
    assert.equal(summary.stores[0]?.primaryFocus, 'vendor-mapping')
    assert.equal(summary.stores[0]?.primaryActionLabel, '补齐外部编码映射')
    assert.deepEqual(summary.stores[0]?.secondaryIssues, [])
    assert.deepEqual(summary.stores[0]?.focusTrail, ['vendor-mapping'])
  })

  it('getConnectionCapabilityReadiness keeps recommendation priority for combined readiness issues', async () => {
    const connectionManager = {
      getConnectionForStore: async () => ({
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-003',
        vendorTenantId: '',
        vendorBrandId: undefined,
        vendorStoreId: '',
        endpoint: 'mock://lyt/tenant-001/store-003',
        authMode: 'mock-token',
        hasCredential: false,
        credentialRef: undefined,
        capabilities: ['member'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      }),
      listScopedStores: async () => [
        { id: 'store-003', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S003', name: '组合问题门店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionCapabilityReadiness('store-003', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(result.recommendedNextActions, [
      '优先为该门店补齐独立 endpoint 与 credential，避免长期停留在 fallback/mock 状态',
      '尽快刷新该门店连接健康检查，确认 token、签名和 endpoint 是否仍然有效',
      '优先补齐 vendorTenantId / vendorBrandId / vendorStoreId 映射，避免我方主键与 LYT 外部编码混用',
      '当前门店仍在继承上级连接，建议逐店核对 vendorStoreId 与 capability 开通范围',
      '根据门店实际设备与经营形态确认未开通 capability 是否需要补配或显式禁用'
    ])
    assert.ok(result.missingRequirements.includes('credential'))
    assert.ok(result.missingRequirements.includes('store-scoped-connection'))
    assert.ok(result.missingRequirements.includes('connection-health-refresh'))
    assert.ok(result.missingRequirements.includes('store-level-capability-verification'))
  })

  it('getConnectionCapabilityReadiness returns stable default recommendation for fully ready store', async () => {
    const allCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf']
    const connectionManager = {
      getConnectionForStore: async () => ({
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-ready-stable',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-ready-stable',
        endpoint: 'https://lyt-ready-stable.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-ready-stable',
        capabilities: allCapabilities,
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }),
      listScopedStores: async () => [
        { id: 'store-ready-stable', tenantId: 'tenant-001', brandId: 'brand-001', code: 'RS001', name: '稳定就绪门店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionCapabilityReadiness('store-ready-stable', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(result.missingRequirements, [])
    assert.equal(result.readinessByCapability.every((item: { readiness: string }) => item.readiness === 'ready'), true)
    assert.deepEqual(result.recommendedNextActions, ['当前门店连接与 capability readiness 已具备接入治理条件，可继续接真实读面与运营台'])
  })

  it('getStoreCapabilityAccessView exposes reason copy for enabled degraded blocked and hidden states', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-ready': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-ready',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-ready',
        endpoint: 'https://lyt-ready.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-ready',
        capabilities: ['member'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      },
      'store-inherited': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-inherited',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-inherited',
        endpoint: 'https://lyt-inherited.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-inherited',
        capabilities: ['payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'healthy'
      },
      'store-pending': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-pending',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-pending',
        endpoint: 'mock://lyt/tenant-001/store-pending',
        authMode: 'mock-token',
        hasCredential: false,
        credentialRef: undefined,
        capabilities: ['gate'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 门店' },
        { id: 'store-inherited', tenantId: 'tenant-001', brandId: 'brand-001', code: 'I001', name: 'Inherited 门店' },
        { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 门店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const readyView = await service.getStoreCapabilityAccessView('store-ready', { tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const inheritedView = await service.getStoreCapabilityAccessView('store-inherited', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const pendingView = await service.getStoreCapabilityAccessView('store-pending', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.equal(readyView.accessByCapability.find((item: { capability: string }) => item.capability === 'member')?.access, 'enabled')
    assert.ok(
      readyView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'member')
        ?.reason.includes('可正常开放')
    )
    assert.equal(readyView.accessByCapability.find((item: { capability: string }) => item.capability === 'device')?.access, 'hidden')
    assert.ok(
      readyView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'device')
        ?.reason.includes('隐藏无效入口')
    )

    assert.equal(
      inheritedView.accessByCapability.find((item: { capability: string }) => item.capability === 'payment')?.access,
      'degraded'
    )
    assert.ok(
      inheritedView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'payment')
        ?.reason.includes('继续逐店核验')
    )

    assert.equal(pendingView.accessByCapability.find((item: { capability: string }) => item.capability === 'gate')?.access, 'blocked')
    assert.ok(
      pendingView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'gate')
        ?.reason.includes('阻塞相关操作入口')
    )
  })

  it('LytService fallback readiness matches query service readiness shape', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-readiness': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-readiness',
        vendorTenantId: '',
        vendorBrandId: undefined,
        vendorStoreId: '',
        endpoint: 'mock://lyt/tenant-001/store-readiness',
        authMode: 'mock-token',
        hasCredential: false,
        credentialRef: undefined,
        capabilities: ['member'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-readiness', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Readiness 门店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryReadiness = await queryService.getConnectionCapabilityReadiness('store-readiness', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const fallbackReadiness = await fallbackService.getConnectionCapabilityReadiness('store-readiness', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(fallbackReadiness, queryReadiness)
  })

  it('LytService fallback readiness matches query service stable default recommendation', async () => {
    const allCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf']
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-ready-stable': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-ready-stable',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-ready-stable',
        endpoint: 'https://lyt-ready-stable.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-ready-stable',
        capabilities: allCapabilities,
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        {
          id: 'store-ready-stable',
          tenantId: 'tenant-001',
          brandId: 'brand-001',
          code: 'RS001',
          name: '稳定就绪门店'
        }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryReadiness = await queryService.getConnectionCapabilityReadiness('store-ready-stable', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const fallbackReadiness = await fallbackService.getConnectionCapabilityReadiness('store-ready-stable', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(fallbackReadiness, queryReadiness)
    assert.deepEqual(fallbackReadiness.missingRequirements, [])
    assert.deepEqual(fallbackReadiness.recommendedNextActions, [
      '当前门店连接与 capability readiness 已具备接入治理条件，可继续接真实读面与运营台'
    ])
  })

  it('LytService fallback access view matches query service access reasons', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-access': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-access',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-access',
        endpoint: 'mock://lyt/tenant-001/store-access',
        authMode: 'mock-token',
        hasCredential: false,
        credentialRef: undefined,
        capabilities: ['payment'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'tenant',
        healthStatus: 'pending-configuration'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-access', tenantId: 'tenant-001', brandId: 'brand-001', code: 'A001', name: 'Access 门店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAccessView = await queryService.getStoreCapabilityAccessView('store-access', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const fallbackAccessView = await fallbackService.getStoreCapabilityAccessView('store-access', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(fallbackAccessView, queryAccessView)
    assert.equal(fallbackAccessView.accessByCapability.find((item: { capability: string }) => item.capability === 'payment')?.access, 'blocked')
    assert.ok(
      fallbackAccessView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'payment')
        ?.reason.includes('阻塞相关操作入口')
    )
    assert.equal(fallbackAccessView.accessByCapability.find((item: { capability: string }) => item.capability === 'member')?.access, 'hidden')
  })

  it('LytService fallback access view matches query service stale degraded reasons', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-stale-access': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stale-access',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-stale-access',
        endpoint: 'https://lyt-stale-access.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-stale-access',
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        {
          id: 'store-stale-access',
          tenantId: 'tenant-001',
          brandId: 'brand-001',
          code: 'SA001',
          name: 'Stale Access 门店'
        }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAccessView = await queryService.getStoreCapabilityAccessView('store-stale-access', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const fallbackAccessView = await fallbackService.getStoreCapabilityAccessView('store-stale-access', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(fallbackAccessView, queryAccessView)
    assert.equal(
      fallbackAccessView.accessByCapability.find((item: { capability: string }) => item.capability === 'member')?.access,
      'degraded'
    )
    assert.ok(
      fallbackAccessView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'member')
        ?.reason.includes('优先巡检')
    )
    assert.equal(
      fallbackAccessView.accessByCapability.find((item: { capability: string }) => item.capability === 'device')?.access,
      'hidden'
    )
  })

  it('LytService fallback access view matches query service ready and hidden reasons', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-ready-access': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-ready-access',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-ready-access',
        endpoint: 'https://lyt-ready-access.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-ready-access',
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        {
          id: 'store-ready-access',
          tenantId: 'tenant-001',
          brandId: 'brand-001',
          code: 'RA001',
          name: 'Ready Access 门店'
        }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAccessView = await queryService.getStoreCapabilityAccessView('store-ready-access', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const fallbackAccessView = await fallbackService.getStoreCapabilityAccessView('store-ready-access', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(fallbackAccessView, queryAccessView)
    assert.equal(
      fallbackAccessView.accessByCapability.find((item: { capability: string }) => item.capability === 'member')?.access,
      'enabled'
    )
    assert.ok(
      fallbackAccessView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'member')
        ?.reason.includes('可正常开放')
    )
    assert.equal(
      fallbackAccessView.accessByCapability.find((item: { capability: string }) => item.capability === 'device')?.access,
      'hidden'
    )
    assert.ok(
      fallbackAccessView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'device')
        ?.reason.includes('隐藏无效入口')
    )
  })

  it('LytService fallback access view matches query service inherited degraded reasons', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-inherited-access': {
        vendor: 'lyt-enterprise',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-inherited-access',
        vendorTenantId: 'vendor-tenant-001',
        vendorBrandId: 'vendor-brand-001',
        vendorStoreId: 'vendor-store-inherited-access',
        endpoint: 'https://lyt-inherited-access.example.com',
        authMode: 'signature',
        hasCredential: true,
        credentialRef: 'vault://lyt/store-inherited-access',
        capabilities: ['payment', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        {
          id: 'store-inherited-access',
          tenantId: 'tenant-001',
          brandId: 'brand-001',
          code: 'IA001',
          name: 'Inherited Access 门店'
        }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAccessView = await queryService.getStoreCapabilityAccessView('store-inherited-access', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const fallbackAccessView = await fallbackService.getStoreCapabilityAccessView('store-inherited-access', {
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(fallbackAccessView, queryAccessView)
    assert.equal(
      fallbackAccessView.accessByCapability.find((item: { capability: string }) => item.capability === 'payment')?.access,
      'degraded'
    )
    assert.ok(
      fallbackAccessView.accessByCapability
        .find((item: { capability: string }) => item.capability === 'payment')
        ?.reason.includes('继续逐店核验')
    )
    assert.equal(
      fallbackAccessView.accessByCapability.find((item: { capability: string }) => item.capability === 'member')?.access,
      'hidden'
    )
  })

  it('getConnectionGovernanceAlerts emits vendor mapping gaps alert', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-mapping-gap': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-mapping-gap',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'https://lyt-gap.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'payment', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-mapping-gap', tenantId: 'tenant-001', brandId: 'brand-001', code: 'M001', name: '映射异常店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    const vendorGapAlert = result.alerts.find((item: { code: string }) => item.code === 'vendor-mapping-gaps')
    assert.ok(vendorGapAlert)
    assert.equal(vendorGapAlert?.severity, 'high')
    assert.deepEqual(vendorGapAlert?.affectedStoreIds, ['store-mapping-gap'])
    assert.deepEqual(vendorGapAlert?.affectedCapabilities, ['member', 'payment', 'gate'])
    assert.equal(vendorGapAlert?.recommendedNextActions[0], '先统一 LYT 外部编码映射，再推进真实门店接入、事件治理与前端读面')
  })

  it('LytService fallback governance alerts match query service vendor mapping guidance', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-mapping-gap': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-mapping-gap',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'https://lyt-gap.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'payment', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-mapping-gap', tenantId: 'tenant-001', brandId: 'brand-001', code: 'M001', name: '映射异常店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const queryVendorGapAlert = queryAlerts.alerts.find((item: { code: string }) => item.code === 'vendor-mapping-gaps')
    const fallbackVendorGapAlert = fallbackAlerts.alerts.find((item: { code: string }) => item.code === 'vendor-mapping-gaps')

    assert.deepEqual(fallbackVendorGapAlert, queryVendorGapAlert)
    assert.equal(fallbackVendorGapAlert?.recommendedNextActions[0], '先统一 LYT 外部编码映射，再推进真实门店接入、事件治理与前端读面')
  })

  it('getConnectionGovernanceAlerts emits pending configuration guidance', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-pending-alert': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-pending-alert',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-pending-alert',
        endpoint: 'mock://lyt/tenant-001/store-pending-alert',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-pending-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: '待配置告警店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    const pendingAlert = result.alerts.find((item: { code: string }) => item.code === 'pending-configuration-stores')
    assert.ok(pendingAlert)
    assert.equal(pendingAlert?.severity, 'high')
    assert.deepEqual(pendingAlert?.affectedStoreIds, ['store-pending-alert'])
    assert.equal(pendingAlert?.recommendedNextActions[0], '优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 fallback/mock 状态')
  })

  it('LytService fallback governance alerts match query service pending configuration guidance', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-pending-alert': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-pending-alert',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-pending-alert',
        endpoint: 'mock://lyt/tenant-001/store-pending-alert',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-pending-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: '待配置告警店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const queryPendingAlert = queryAlerts.alerts.find((item: { code: string }) => item.code === 'pending-configuration-stores')
    const fallbackPendingAlert = fallbackAlerts.alerts.find((item: { code: string }) => item.code === 'pending-configuration-stores')

    assert.deepEqual(fallbackPendingAlert, queryPendingAlert)
    assert.equal(fallbackPendingAlert?.recommendedNextActions[0], '优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 fallback/mock 状态')
  })

  it('getConnectionGovernanceAlerts emits stale connection guidance', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-stale-alert': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stale-alert',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-stale-alert',
        endpoint: 'https://lyt-stale-alert.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'stale'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-stale-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: '过期连接告警店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    const staleAlert = result.alerts.find((item: { code: string }) => item.code === 'stale-connections')
    assert.ok(staleAlert)
    assert.equal(staleAlert?.severity, 'high')
    assert.deepEqual(staleAlert?.affectedStoreIds, ['store-stale-alert'])
    assert.equal(staleAlert?.recommendedNextActions[0], '批量执行连接巡检并刷新健康状态，确认 token、签名和域名仍有效')
  })

  it('LytService fallback governance alerts match query service stale guidance', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-stale-alert': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stale-alert',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-stale-alert',
        endpoint: 'https://lyt-stale-alert.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'stale'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-stale-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: '过期连接告警店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const queryStaleAlert = queryAlerts.alerts.find((item: { code: string }) => item.code === 'stale-connections')
    const fallbackStaleAlert = fallbackAlerts.alerts.find((item: { code: string }) => item.code === 'stale-connections')

    assert.deepEqual(fallbackStaleAlert, queryStaleAlert)
    assert.equal(fallbackStaleAlert?.recommendedNextActions[0], '批量执行连接巡检并刷新健康状态，确认 token、签名和域名仍有效')
  })

  it('getConnectionGovernanceAlerts emits credential missing guidance', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-credential-alert': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-credential-alert',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-credential-alert',
        endpoint: 'https://lyt-credential-alert.example.com',
        authMode: 'signature',
        hasCredential: false,
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-credential-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'C001', name: '凭证缺失告警店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    const credentialAlert = result.alerts.find((item: { code: string }) => item.code === 'credential-missing-stores')
    assert.ok(credentialAlert)
    assert.equal(credentialAlert?.severity, 'high')
    assert.deepEqual(credentialAlert?.affectedStoreIds, ['store-credential-alert'])
    assert.equal(credentialAlert?.recommendedNextActions[0], '为缺失凭证的门店补齐 credentialRef 或安全密钥绑定')
  })

  it('LytService fallback governance alerts match query service credential guidance', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-credential-alert': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-credential-alert',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-credential-alert',
        endpoint: 'https://lyt-credential-alert.example.com',
        authMode: 'signature',
        hasCredential: false,
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-credential-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'C001', name: '凭证缺失告警店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const queryCredentialAlert = queryAlerts.alerts.find((item: { code: string }) => item.code === 'credential-missing-stores')
    const fallbackCredentialAlert = fallbackAlerts.alerts.find((item: { code: string }) => item.code === 'credential-missing-stores')

    assert.deepEqual(fallbackCredentialAlert, queryCredentialAlert)
    assert.equal(fallbackCredentialAlert?.recommendedNextActions[0], '为缺失凭证的门店补齐 credentialRef 或安全密钥绑定')
  })

  it('getConnectionGovernanceSummary orders complex high risk stores by issue weight and preserves focus trail order', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-complex': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-complex',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'mock://lyt/tenant-001/store-complex',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment', 'order', 'gate'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      },
      'store-vendor': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-vendor',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'https://lyt-vendor.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      },
      'store-healthy': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-healthy',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-healthy',
        endpoint: 'https://lyt-healthy.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-complex', tenantId: 'tenant-001', brandId: 'brand-001', code: 'C001', name: '复杂高风险店' },
        { id: 'store-vendor', tenantId: 'tenant-001', brandId: 'brand-001', code: 'V001', name: '映射缺口店' },
        { id: 'store-healthy', tenantId: 'tenant-001', brandId: 'brand-001', code: 'H001', name: '稳定门店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    assert.deepEqual(
      result.stores.map((item: { storeId: string }) => item.storeId),
      ['store-complex', 'store-vendor', 'store-healthy']
    )
    assert.equal(result.stores[0]?.blockingIssueCount, 4)
    assert.deepEqual(
      result.stores[0]?.secondaryIssues.map((item: { code: string }) => item.code),
      [
        'vendor-mapping-gaps',
        'credential-missing-stores',
        'stale-connections',
        'inherited-store-verification',
        'capability-pending-stores'
      ]
    )
    assert.deepEqual(result.stores[0]?.focusTrail, [
      'connection-setup',
      'vendor-mapping',
      'credential-binding',
      'health-check',
      'inheritance-verification',
      'capability-rollout'
    ])
    assert.equal(result.stores[1]?.primaryIssueCode, 'vendor-mapping-gaps')
    assert.deepEqual(result.stores[1]?.focusTrail, ['vendor-mapping'])
    assert.deepEqual(result.stores[2]?.focusTrail, ['stable'])
  })

  it('LytService fallback governance summary matches query service focus trail shape', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-complex': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-complex',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'mock://lyt/tenant-001/store-complex',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment', 'order', 'gate'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      },
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
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-complex', tenantId: 'tenant-001', brandId: 'brand-001', code: 'C001', name: '复杂高风险店' },
        { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const querySummary = await queryService.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackSummary = await fallbackService.getConnectionGovernanceSummary({
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(
      fallbackSummary.stores.map((item: { storeId: string; primaryIssueCode: string; focusTrail: string[] }) => ({
        storeId: item.storeId,
        primaryIssueCode: item.primaryIssueCode,
        focusTrail: item.focusTrail
      })),
      querySummary.stores.map((item: { storeId: string; primaryIssueCode: string; focusTrail: string[] }) => ({
        storeId: item.storeId,
        primaryIssueCode: item.primaryIssueCode,
        focusTrail: item.focusTrail
      }))
    )
    assert.deepEqual(
      fallbackSummary.stores.map((item: { secondaryIssues: Array<{ code: string }> }) =>
        item.secondaryIssues.map((entry) => entry.code)
      ),
      querySummary.stores.map((item: { secondaryIssues: Array<{ code: string }> }) =>
        item.secondaryIssues.map((entry) => entry.code)
      )
    )
    assert.deepEqual(
      fallbackSummary.storeGroups.map((item: { code: string; recommendedFocus: string }) => ({
        code: item.code,
        recommendedFocus: item.recommendedFocus
      })),
      querySummary.storeGroups.map((item: { code: string; recommendedFocus: string }) => ({
        code: item.code,
        recommendedFocus: item.recommendedFocus
      }))
    )
  })

  it('getConnectionGovernanceSummary aggregates capability breakdown across ready inherited stale pending and hidden states', async () => {
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
        capabilities: ['member', 'payment', 'order'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      },
      'store-inherited-stale': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-inherited-stale',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-inherited-stale',
        endpoint: 'https://lyt-inherited-stale.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'payment', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
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
        capabilities: ['payment', 'device'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
        {
          id: 'store-inherited-stale',
          tenantId: 'tenant-001',
          brandId: 'brand-001',
          code: 'I001',
          name: 'Inherited Stale 店'
        },
        { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    assert.deepEqual(
      result.capabilityBreakdown.find((item: { capability: string }) => item.capability === 'member'),
      {
        capability: 'member',
        readyStores: 1,
        inheritedReadyStores: 0,
        staleStores: 1,
        pendingStores: 0,
        notEnabledStores: 1
      }
    )
    assert.deepEqual(
      result.capabilityBreakdown.find((item: { capability: string }) => item.capability === 'payment'),
      {
        capability: 'payment',
        readyStores: 1,
        inheritedReadyStores: 0,
        staleStores: 1,
        pendingStores: 1,
        notEnabledStores: 0
      }
    )
    assert.deepEqual(
      result.capabilityBreakdown.find((item: { capability: string }) => item.capability === 'order'),
      {
        capability: 'order',
        readyStores: 1,
        inheritedReadyStores: 0,
        staleStores: 0,
        pendingStores: 0,
        notEnabledStores: 2
      }
    )
    assert.deepEqual(
      result.capabilityBreakdown.find((item: { capability: string }) => item.capability === 'gate'),
      {
        capability: 'gate',
        readyStores: 0,
        inheritedReadyStores: 0,
        staleStores: 1,
        pendingStores: 0,
        notEnabledStores: 2
      }
    )
    assert.deepEqual(
      result.capabilityBreakdown.find((item: { capability: string }) => item.capability === 'device'),
      {
        capability: 'device',
        readyStores: 0,
        inheritedReadyStores: 0,
        staleStores: 0,
        pendingStores: 1,
        notEnabledStores: 2
      }
    )
  })

  it('LytService fallback governance summary matches query service capability breakdown', async () => {
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
        capabilities: ['member', 'payment', 'order'],
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
        capabilities: ['payment', 'device'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
        { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const querySummary = await queryService.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackSummary = await fallbackService.getConnectionGovernanceSummary({
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(fallbackSummary.capabilityBreakdown, querySummary.capabilityBreakdown)
  })

  it('getConnectionGovernanceSummary keeps recommended next actions in governance priority order', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-priority-a': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-priority-a',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'mock://lyt/tenant-001/store-priority-a',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment', 'order'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'tenant',
        healthStatus: 'pending-configuration'
      },
      'store-priority-b': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-priority-b',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-priority-b',
        endpoint: 'https://lyt-priority-b.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['payment', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'stale'
      },
      'store-priority-c': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-priority-c',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-priority-c',
        endpoint: 'https://lyt-priority-c.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-priority-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Priority 店A' },
        { id: 'store-priority-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P002', name: 'Priority 店B' },
        { id: 'store-priority-c', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P003', name: 'Priority 店C' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    assert.deepEqual(result.recommendedNextActions, [
      '优先清理 pending-configuration 门店，先补真实 endpoint、credential 和 vendorStoreId 映射',
      '针对 stale 门店批量执行连接巡检，确认签名、凭证和健康检查时效',
      '优先补齐 vendorTenantId / vendorBrandId / vendorStoreId 映射，先统一外部编码再继续推进工作台接入',
      '对继承品牌/租户默认连接的门店逐店核查 capability readiness，避免上级默认配置掩盖门店差异',
      '优先补齐 capability member 的门店开通信息，减少门店侧功能降级'
    ])
  })

  it('LytService fallback governance summary matches query service recommended next actions', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-query-a': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-query-a',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'mock://lyt/tenant-001/store-query-a',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['payment', 'device'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      },
      'store-query-b': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-query-b',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-query-b',
        endpoint: 'https://lyt-query-b.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'payment'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-query-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'Q001', name: 'Query 店A' },
        { id: 'store-query-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'Q002', name: 'Query 店B' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const querySummary = await queryService.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackSummary = await fallbackService.getConnectionGovernanceSummary({
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(fallbackSummary.recommendedNextActions, querySummary.recommendedNextActions)
  })

  it('getConnectionGovernanceSummary returns only stable default recommendation for healthy fully configured stores', async () => {
    const allCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf']
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-stable-a': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stable-a',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-stable-a',
        endpoint: 'https://lyt-stable-a.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: allCapabilities,
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      },
      'store-stable-b': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stable-b',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-stable-b',
        endpoint: 'https://lyt-stable-b.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: allCapabilities,
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-stable-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stable 店A' },
        { id: 'store-stable-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S002', name: 'Stable 店B' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    assert.deepEqual(result.recommendedNextActions, ['当前租户/品牌的 LYT 连接治理状态稳定，可继续推进真实门店读面和运营工作台接入'])
    assert.deepEqual(result.storeGroups, [])
    assert.ok(result.stores.every((item: { primaryIssueCode: string; focusTrail: string[] }) => item.primaryIssueCode === 'healthy'))
    assert.ok(result.stores.every((item: { focusTrail: string[] }) => item.focusTrail.length === 1 && item.focusTrail[0] === 'stable'))
  })

  it('healthy tenant emits no governance alerts and fallback matches query defaults', async () => {
    const allCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf']
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-stable-a': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stable-a',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-stable-a',
        endpoint: 'https://lyt-stable-a.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: allCapabilities,
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      },
      'store-stable-b': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-stable-b',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-stable-b',
        endpoint: 'https://lyt-stable-b.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: allCapabilities,
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-stable-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stable 店A' },
        { id: 'store-stable-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S002', name: 'Stable 店B' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const querySummary = await queryService.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackSummary = await fallbackService.getConnectionGovernanceSummary({
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(queryAlerts.alerts, [])
    assert.deepEqual(fallbackAlerts.alerts, [])
    assert.deepEqual(fallbackSummary.recommendedNextActions, querySummary.recommendedNextActions)
    assert.deepEqual(fallbackSummary.storeGroups, querySummary.storeGroups)
  })

  it('getConnectionGovernanceSummary prefers earliest governed capability when pending counts tie', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-tie-a': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-tie-a',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-tie-a',
        endpoint: 'mock://lyt/tenant-001/store-tie-a',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      },
      'store-tie-b': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-tie-b',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-tie-b',
        endpoint: 'mock://lyt/tenant-001/store-tie-b',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['payment'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-tie-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'T001', name: 'Tie 店A' },
        { id: 'store-tie-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'T002', name: 'Tie 店B' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    assert.equal(
      result.recommendedNextActions[result.recommendedNextActions.length - 1],
      '优先补齐 capability member 的门店开通信息，减少门店侧功能降级'
    )
  })

  it('getConnectionGovernanceAlerts prefers earliest governed capability on tied pending and hidden counts', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-tie-a': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-tie-a',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-tie-a',
        endpoint: 'mock://lyt/tenant-001/store-tie-a',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      },
      'store-tie-b': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-tie-b',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-tie-b',
        endpoint: 'mock://lyt/tenant-001/store-tie-b',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['payment'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-tie-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'T001', name: 'Tie 店A' },
        { id: 'store-tie-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'T002', name: 'Tie 店B' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)
    const pendingCapabilityAlert = queryAlerts.alerts.find((item: { code: string }) => item.code === 'capability-pending-stores')
    const notEnabledCapabilityAlert = queryAlerts.alerts.find((item: { code: string }) => item.code === 'capability-not-enabled-gaps')

    assert.ok(pendingCapabilityAlert?.summary.includes('capability member'))
    assert.deepEqual(pendingCapabilityAlert?.affectedCapabilities, ['member'])
    assert.ok(notEnabledCapabilityAlert?.summary.includes('capability order'))
    assert.deepEqual(notEnabledCapabilityAlert?.affectedCapabilities, ['order'])
    assert.deepEqual(fallbackAlerts.alerts, queryAlerts.alerts)
  })

  it('getConnectionGovernanceSummary keeps storeGroups sorted and counts overlapping stores correctly', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-alpha': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-alpha',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'mock://lyt/tenant-001/store-alpha',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'fallback',
        healthStatus: 'pending-configuration'
      },
      'store-beta': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-beta',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'https://lyt-beta.example.com',
        authMode: 'signature',
        hasCredential: false,
        capabilities: ['member', 'gate'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'tenant',
        healthStatus: 'stale'
      },
      'store-gamma': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-gamma',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'https://lyt-gamma.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-alpha', tenantId: 'tenant-001', brandId: 'brand-001', code: 'A001', name: 'Alpha 店' },
        { id: 'store-beta', tenantId: 'tenant-001', brandId: 'brand-001', code: 'B001', name: 'Beta 店' },
        { id: 'store-gamma', tenantId: 'tenant-001', brandId: 'brand-001', code: 'G001', name: 'Gamma 店' }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    assert.deepEqual(
      result.storeGroups.map((item: { code: string }) => item.code),
      [
        'vendor-mapping-gaps',
        'high-risk-stores',
        'credential-missing-stores',
        'stale-stores',
        'pending-configuration-stores',
        'inherited-store-verification'
      ]
    )
    assert.deepEqual(
      result.storeGroups.find((item: { code: string }) => item.code === 'vendor-mapping-gaps')?.storeIds,
      ['store-alpha', 'store-beta', 'store-gamma']
    )
    assert.deepEqual(
      result.storeGroups.find((item: { code: string }) => item.code === 'high-risk-stores')?.storeIds,
      ['store-alpha', 'store-beta', 'store-gamma']
    )
    assert.deepEqual(
      result.storeGroups.find((item: { code: string }) => item.code === 'credential-missing-stores')?.storeIds,
      ['store-alpha', 'store-beta']
    )
    assert.deepEqual(
      result.storeGroups.find((item: { code: string }) => item.code === 'pending-configuration-stores')?.storeIds,
      ['store-alpha']
    )
    assert.deepEqual(
      result.storeGroups.find((item: { code: string }) => item.code === 'stale-stores')?.storeIds,
      ['store-beta']
    )
    assert.deepEqual(
      result.storeGroups.find((item: { code: string }) => item.code === 'inherited-store-verification')?.storeIds,
      ['store-beta']
    )
  })

  it('getConnectionGovernanceAlerts picks top pending and not-enabled capabilities by affected store count', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-payment-pending-a': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-payment-pending-a',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-payment-pending-a',
        endpoint: 'mock://lyt/tenant-001/store-payment-pending-a',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment', 'order', 'device', 'coin', 'inventory', 'shelf'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'store',
        healthStatus: 'pending-configuration'
      },
      'store-payment-pending-b': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-payment-pending-b',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-payment-pending-b',
        endpoint: 'mock://lyt/tenant-001/store-payment-pending-b',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['payment', 'order', 'device', 'coin', 'inventory', 'shelf'],
        connectionStatus: 'pending-configuration',
        source: 'fallback',
        resolutionLevel: 'store',
        healthStatus: 'pending-configuration'
      },
      'store-member-ready': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-member-ready',
        vendorTenantId: 'tenant-001',
        vendorBrandId: 'brand-001',
        vendorStoreId: 'vendor-store-member-ready',
        endpoint: 'https://lyt-member-ready.example.com',
        authMode: 'signature',
        hasCredential: true,
        capabilities: ['member', 'order', 'device', 'coin', 'inventory', 'shelf'],
        connectionStatus: 'configured',
        source: 'prisma',
        resolutionLevel: 'store',
        healthStatus: 'healthy'
      }
    }
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        {
          id: 'store-payment-pending-a',
          tenantId: 'tenant-001',
          brandId: 'brand-001',
          code: 'P001',
          name: '支付待配置店A'
        },
        {
          id: 'store-payment-pending-b',
          tenantId: 'tenant-001',
          brandId: 'brand-001',
          code: 'P002',
          name: '支付待配置店B'
        },
        {
          id: 'store-member-ready',
          tenantId: 'tenant-001',
          brandId: 'brand-001',
          code: 'M001',
          name: '会员稳定店'
        }
      ]
    }
    const service = new LytGovernanceQueryService(connectionManager as any)

    const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)

    const pendingCapabilityAlert = result.alerts.find((item: { code: string }) => item.code === 'capability-pending-stores')
    const notEnabledCapabilityAlert = result.alerts.find((item: { code: string }) => item.code === 'capability-not-enabled-gaps')

    assert.ok(pendingCapabilityAlert)
    assert.equal(pendingCapabilityAlert?.count, 2)
    assert.deepEqual(pendingCapabilityAlert?.affectedCapabilities, ['payment'])
    assert.deepEqual(pendingCapabilityAlert?.affectedStoreIds, ['store-payment-pending-a', 'store-payment-pending-b'])
    assert.ok(pendingCapabilityAlert?.recommendedNextActions[0]?.includes('payment'))

    assert.ok(notEnabledCapabilityAlert)
    assert.equal(notEnabledCapabilityAlert?.count, 3)
    assert.deepEqual(notEnabledCapabilityAlert?.affectedCapabilities, ['gate'])
    assert.deepEqual(notEnabledCapabilityAlert?.affectedStoreIds, ['store-payment-pending-a', 'store-payment-pending-b', 'store-member-ready'])
    assert.ok(notEnabledCapabilityAlert?.recommendedNextActions[0]?.includes('gate'))
  })

  it('LytService fallback governance alerts match query service alert shape', async () => {
    const connectionMap: Record<string, Record<string, unknown>> = {
      'store-pending': {
        vendor: 'lyt',
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-pending',
        vendorTenantId: 'tenant-001',
        vendorBrandId: '',
        vendorStoreId: '',
        endpoint: 'mock://lyt/tenant-001/store-pending',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment'],
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
    const connectionManager = {
      getConnectionForStore: async (storeId: string) => connectionMap[storeId],
      listScopedStores: async () => [
        { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' },
        { id: 'store-stale', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stale 店' }
      ]
    }
    const queryService = new LytGovernanceQueryService(connectionManager as any)
    const fallbackService = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      connectionManager as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any
    )

    const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' } as any)
    const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({
      tenantId: 'tenant-001',
      brandId: 'brand-001'
    } as any)

    assert.deepEqual(
      fallbackAlerts.alerts.map(
        (item: {
          code: string
          severity: string
          count: number
          affectedStoreIds: string[]
          affectedCapabilities: string[]
        }) => ({
          code: item.code,
          severity: item.severity,
          count: item.count,
          affectedStoreIds: item.affectedStoreIds,
          affectedCapabilities: item.affectedCapabilities
        })
      ),
      queryAlerts.alerts.map(
        (item: {
          code: string
          severity: string
          count: number
          affectedStoreIds: string[]
          affectedCapabilities: string[]
        }) => ({
          code: item.code,
          severity: item.severity,
          count: item.count,
          affectedStoreIds: item.affectedStoreIds,
          affectedCapabilities: item.affectedCapabilities
        })
      )
    )
  })

  it('LytService delegates governance queries to LytGovernanceQueryService when injected', async () => {
    const governanceQueryService = {
      getConnectionCapabilityReadiness: async () => ({ kind: 'readiness-delegated' }),
      getConnectionGovernanceSummary: async () => ({ kind: 'summary-delegated' }),
      getConnectionGovernanceAlerts: async () => ({ kind: 'alerts-delegated' }),
      getStoreCapabilityAccessView: async () => ({ kind: 'access-delegated' })
    }
    const service = new LytService(
      {
        getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
        resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
        listAvailableAdapters: () => []
      } as any,
      { getDependencySummary: () => null } as any,
      {
        getConnectionForStore: async () => {
          throw new Error('should not reach connection manager when governance query service is injected')
        },
        listScopedStores: async () => []
      } as any,
      { acceptWebhook: async () => ({}), publishEvent: async () => ({}) } as any,
      undefined,
      undefined,
      undefined,
      undefined,
      governanceQueryService as any
    )

    const readiness = await service.getConnectionCapabilityReadiness('store-001', { tenantId: 'tenant-001' } as any)
    const summary = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001' } as any)
    const alerts = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001' } as any)
    const accessView = await service.getStoreCapabilityAccessView('store-001', { tenantId: 'tenant-001' } as any)

    assert.deepEqual(readiness, { kind: 'readiness-delegated' })
    assert.deepEqual(summary, { kind: 'summary-delegated' })
    assert.deepEqual(alerts, { kind: 'alerts-delegated' })
    assert.deepEqual(accessView, { kind: 'access-delegated' })
  })
})
