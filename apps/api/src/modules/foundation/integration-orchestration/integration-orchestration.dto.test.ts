import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validateSync } from 'class-validator'
import { PublishEventDto, WebhookIngestDto, EventListQueryDto } from './integration-orchestration.dto'

it('PublishEventDto accepts valid event publication payload', () => {
  const dto = Object.assign(new PublishEventDto(), {
    eventName: 'storefront.order.created',
    source: 'storefront-web',
    aggregateId: 'order-001',
    idempotencyKey: 'evt:order:001',
    payload: { orderId: 'order-001', amount: 99.9 }
  })

  assert.equal(validateSync(dto).length, 0)
})

it('PublishEventDto rejects missing eventName and payload', () => {
  const dto = Object.assign(new PublishEventDto(), {
    source: 'storefront-web'
  })

  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  const propertiesWithErrors = errors.map((e) => e.property)
  assert.equal(propertiesWithErrors.includes('eventName'), true)
  assert.equal(propertiesWithErrors.includes('payload'), true)
})

it('PublishEventDto accepts minimal event with only required fields', () => {
  const dto = Object.assign(new PublishEventDto(), {
    eventName: 'system.heartbeat',
    payload: {}
  })

  assert.equal(validateSync(dto).length, 0)
})

it('WebhookIngestDto accepts valid webhook ingestion payload', () => {
  const dto = Object.assign(new WebhookIngestDto(), {
    eventId: 'wh-001',
    eventType: 'payment.completed',
    signature: 'sha256=abc123',
    timestamp: '2026-06-13T20:00:00Z',
    rawBody: '{"key":"value"}',
    payload: { status: 'SUCCESS' }
  })

  assert.equal(validateSync(dto).length, 0)
})

it('WebhookIngestDto rejects missing signature, timestamp, and payload', () => {
  const dto = Object.assign(new WebhookIngestDto(), {
    eventId: 'wh-002'
  })

  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  const properties = errors.map((e) => e.property)
  assert.equal(properties.includes('signature'), true)
  assert.equal(properties.includes('timestamp'), true)
  assert.equal(properties.includes('payload'), true)
})

it('WebhookIngestDto accepts minimal webhook with only required fields', () => {
  const dto = Object.assign(new WebhookIngestDto(), {
    signature: 'sha256=def456',
    timestamp: '2026-06-13T20:00:00Z',
    payload: {}
  })

  assert.equal(validateSync(dto).length, 0)
})

it('EventListQueryDto accepts optional source filter', () => {
  const withSource = Object.assign(new EventListQueryDto(), {
    source: 'storefront-web'
  })
  const withoutSource = Object.assign(new EventListQueryDto(), {})

  assert.equal(validateSync(withSource).length, 0)
  assert.equal(validateSync(withoutSource).length, 0)
})
