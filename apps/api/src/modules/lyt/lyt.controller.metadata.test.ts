import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { LytController } from './lyt.controller'

describe('LytController metadata', () => {
  it('controller should keep lyt path', () => {
    assert.equal(Reflect.getMetadata('path', LytController), 'lyt')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LytController.prototype.getFixtures, 0, 'fixtures'],
      [LytController.prototype.getFixtureSummary, 0, 'fixtures/summary'],
      [LytController.prototype.getFixture, 0, 'fixtures/:key'],
      [LytController.prototype.compareFixture, 1, 'fixtures/:key/compare'],
      [LytController.prototype.importFixturePreview, 1, 'fixtures/:key/import-preview'],
      [LytController.prototype.importFixturePlan, 1, 'fixtures/:key/import-plan'],
      [LytController.prototype.getBootstrap, 0, 'bootstrap'],
      [LytController.prototype.getConnection, 0, 'connection/:storeId'],
      [LytController.prototype.getConnectionCapabilityReadiness, 0, 'connection/:storeId/readiness'],
      [LytController.prototype.getStoreCapabilityAccessView, 0, 'connection/:storeId/access-view'],
      [LytController.prototype.getAdapterSelection, 0, 'connection/:storeId/adapter'],
      [LytController.prototype.getConnectionGovernanceSummary, 0, 'connection/governance-summary'],
      [LytController.prototype.getConnectionGovernanceAlerts, 0, 'connection/governance-alerts'],
      [LytController.prototype.getDeviceStatus, 0, 'devices/:deviceId/status'],
      [LytController.prototype.getDeviceHealthSummary, 1, 'devices/health-summary'],
      [LytController.prototype.acceptWebhook, 1, 'webhooks/callback'],
      [LytController.prototype.drillWebhook, 1, 'webhooks/drill'],
      [LytController.prototype.replayWebhookFixture, 1, 'webhooks/replay-fixture'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
