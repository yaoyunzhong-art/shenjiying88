import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { IntegrationOrchestrationController } from './integration-orchestration.controller'

describe('IntegrationOrchestrationController metadata', () => {
  it('controller should keep foundation/integration-orchestration path', () => {
    assert.equal(Reflect.getMetadata('path', IntegrationOrchestrationController), 'foundation/integration-orchestration')
  })

  it('read routes should keep GET metadata', () => {
    const cases = [
      [IntegrationOrchestrationController.prototype.getWebhookSources, 'webhooks/sources'],
      [IntegrationOrchestrationController.prototype.getEvents, 'events'],
      [IntegrationOrchestrationController.prototype.getIdempotencyRecords, 'idempotency-records'],
    ] as const

    cases.forEach(([handler, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), 0)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })

  it('write routes should keep POST metadata', () => {
    const cases = [
      [IntegrationOrchestrationController.prototype.publishEvent, 'events'],
      [IntegrationOrchestrationController.prototype.ingestWebhook, 'webhooks/:source/ingest'],
    ] as const

    cases.forEach(([handler, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), 1)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
