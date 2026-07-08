// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ConfigurationGovernanceController } from './configuration-governance.controller'

it('configuration-governance controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', ConfigurationGovernanceController)
  assert.equal(path, 'foundation/configuration-governance')
})

it('configuration-governance controller management-metadata route has GET metadata', () => {
  // import is at top
  const method = Reflect.getMetadata(
    'method',
    ConfigurationGovernanceController.prototype.getManagementMetadata
  )
  const path = Reflect.getMetadata(
    'path',
    ConfigurationGovernanceController.prototype.getManagementMetadata
  )

  assert.equal(method, 0)
  assert.equal(path, 'management-metadata')
})

it('configuration-governance controller overview route has GET metadata', () => {
  // import is at top
  const method = Reflect.getMetadata(
    'method',
    ConfigurationGovernanceController.prototype.getOperationsOverview
  )
  const path = Reflect.getMetadata(
    'path',
    ConfigurationGovernanceController.prototype.getOperationsOverview
  )

  assert.equal(method, 0)
  assert.equal(path, 'overview')
})

it('configuration-governance controller snapshot route has GET metadata', () => {
  // import is at top
  const method = Reflect.getMetadata(
    'method',
    ConfigurationGovernanceController.prototype.getSnapshot
  )
  const path = Reflect.getMetadata(
    'path',
    ConfigurationGovernanceController.prototype.getSnapshot
  )

  assert.equal(method, 0)
  assert.equal(path, 'snapshot')
})

it('configuration-governance controller feature-flags route has GET metadata', () => {
  // import is at top
  const method = Reflect.getMetadata(
    'method',
    ConfigurationGovernanceController.prototype.getFeatureFlags
  )
  const path = Reflect.getMetadata(
    'path',
    ConfigurationGovernanceController.prototype.getFeatureFlags
  )

  assert.equal(method, 0)
  assert.equal(path, 'feature-flags')
})

it('configuration-governance controller saveFeatureFlag route has POST metadata', () => {
  // import is at top
  const method = Reflect.getMetadata(
    'method',
    ConfigurationGovernanceController.prototype.saveFeatureFlag
  )
  const path = Reflect.getMetadata(
    'path',
    ConfigurationGovernanceController.prototype.saveFeatureFlag
  )

  assert.equal(method, 1) // POST = 1 in RequestMethod enum
  assert.equal(path, 'feature-flags')
})

it('configuration-governance controller getManagementMetadata delegates to service', () => {
  // import is at top

  const mockMetadata = {
    module: 'configuration-governance',
    entrypoints: ['getManagementMetadata', 'resolveConfigSnapshot']
  }

  const mockService = {
    getManagementMetadata: () => mockMetadata
  }

  const controller = new ConfigurationGovernanceController(mockService as never)
  const result = controller.getManagementMetadata()

  assert.deepStrictEqual(result, mockMetadata)
})

it('configuration-governance controller getOperationsOverview delegates to service', async () => {
  // import is at top

  const mockOverview = {
    totalConfigEntries: 42,
    totalFeatureFlags: 12,
    activeSecrets: 8
  }

  const mockService = {
    getOperationsOverview: () => Promise.resolve(mockOverview)
  }

  const controller = new ConfigurationGovernanceController(mockService as never)
  const result = await controller.getOperationsOverview()

  assert.deepStrictEqual(result, mockOverview)
})

it('configuration-governance controller getSnapshot delegates to service with tenant context', async () => {
  // import is at top

  const mockSnapshot = { featureFlags: {}, configEntries: {} }

  const mockService = {
    resolveConfigSnapshot: (_ctx: unknown) => Promise.resolve(mockSnapshot)
  }

  const controller = new ConfigurationGovernanceController(mockService as never)
  const query = {
    tenantId: 't-cfg-1',
    brandId: 'b-cfg-1',
    storeId: 's-cfg-1',
    marketCode: 'zh-cn'
  }

  const result = await controller.getSnapshot(query)

  assert.deepStrictEqual(result, mockSnapshot)
})

it('configuration-governance controller saveFeatureFlag delegates to service', async () => {
  // import is at top

  const mockResult = { flagKey: 'new-checkout-flow', status: 'ENABLED' }

  const mockService = {
    saveFeatureFlag: (_body: unknown) => Promise.resolve(mockResult)
  }

  const controller = new ConfigurationGovernanceController(mockService as never)
  const body = {
    flagKey: 'new-checkout-flow',
    status: 'ENABLED' as const,
    flagLabel: 'New Checkout Flow',
    tenantId: 't-cfg-1'
  }

  const result = await controller.saveFeatureFlag(body)

  assert.deepStrictEqual(result, mockResult)
})
