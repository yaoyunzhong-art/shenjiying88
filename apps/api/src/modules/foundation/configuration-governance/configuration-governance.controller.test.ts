import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'

test('configuration-governance controller path metadata is set', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')
  const path = Reflect.getMetadata('path', ConfigurationGovernanceController)
  assert.equal(path, 'foundation/configuration-governance')
})

test('configuration-governance controller management-metadata route has GET metadata', () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')
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

test('configuration-governance controller overview route has GET metadata', () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')
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

test('configuration-governance controller snapshot route has GET metadata', () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')
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

test('configuration-governance controller feature-flags route has GET metadata', () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')
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

test('configuration-governance controller saveFeatureFlag route has POST metadata', () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')
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

test('configuration-governance controller getManagementMetadata delegates to service', () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')

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

test('configuration-governance controller getOperationsOverview delegates to service', async () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')

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

test('configuration-governance controller getSnapshot delegates to service with tenant context', async () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')

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

test('configuration-governance controller saveFeatureFlag delegates to service', async () => {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')

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
