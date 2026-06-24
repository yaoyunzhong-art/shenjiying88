import assert from 'node:assert/strict'
import test from 'node:test'
import {
  evaluateLytFixtureValidation,
  getLytFixtureByKey,
  getLytFixtureCatalog
} from './lyt-fixture.catalog'

test('getLytFixtureCatalog exposes the first-batch high-priority fixtures', () => {
  const catalog = getLytFixtureCatalog()

  assert.equal(catalog.length, 5)
  assert.deepEqual(
    catalog.map((item) => item.key),
    ['member-query', 'order-query', 'payment-success-webhook', 'gate-pass-webhook', 'device-status-query']
  )
})

test('getLytFixtureByKey returns webhook fixture with eventType', () => {
  const fixture = getLytFixtureByKey('payment-success-webhook')

  assert.equal(fixture?.transport, 'webhook')
  assert.equal(fixture?.eventType, 'payment.success')
  assert.equal(fixture?.samplePayload.requestId, 'req-pay-001')
  assert.equal(fixture?.mappingVersion, 'lyt-field-mapping-spec-v1')
  assert.equal(fixture?.riskLevel, 'high')
  assert.deepEqual(fixture?.requiredHeaders, ['signature', 'timestamp'])
  assert.deepEqual(fixture?.sampleHeaders, {
    signature: 'fixture:payment-success-webhook',
    timestamp: '2026-06-14T10:06:30.000Z'
  })
})

test('getLytFixtureByKey returns null for unknown key', () => {
  assert.equal(getLytFixtureByKey('unknown-fixture'), null)
})

test('getLytFixtureCatalog can filter by transport and capability', () => {
  const webhooks = getLytFixtureCatalog({ transport: 'webhook' })
  const deviceOnly = getLytFixtureCatalog({ capability: 'device' })

  assert.deepEqual(
    webhooks.map((item) => item.key),
    ['payment-success-webhook', 'gate-pass-webhook']
  )
  assert.deepEqual(deviceOnly.map((item) => item.key), ['device-status-query'])
})

test('evaluateLytFixtureValidation marks complete fixtures as ready', () => {
  const fixture = getLytFixtureByKey('gate-pass-webhook')
  assert.ok(fixture)

  const result = evaluateLytFixtureValidation(fixture)

  assert.equal(result.validationStatus, 'ready-for-rehearsal')
  assert.deepEqual(result.missingSampleFields, [])
  assert.deepEqual(result.missingChecklistItems, [])
})
