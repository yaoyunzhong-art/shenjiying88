import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import type { LytMemberProfile } from '@m5/domain'
import {
  toLytFixtureCatalogItemContract,
  toLytStandardizedWebhookEventContract,
  toLytBootstrapContract,
  toLytDeviceStatusContract,
  toLytMemberProfileContract,
  toLytWebhookArchiveRecordContract
} from './lyt.contract'

it('toLytMemberProfileContract maps domain profile to public contract', () => {
  const profile: LytMemberProfile = { memberId: 'member-1', nickname: '测试会员', levelName: 'GOLD' }
  const result = toLytMemberProfileContract(profile)

  assert.deepEqual(result, { id: 'member-1', name: '测试会员', level: 'GOLD' })
})

it('toLytMemberProfileContract defaults missing optional fields', () => {
  const profile: LytMemberProfile = { memberId: 'member-1' }
  const result = toLytMemberProfileContract(profile)

  assert.deepEqual(result, { id: 'member-1', name: 'member-1', level: 'N/A' })
})

it('toLytDeviceStatusContract maps online device status', () => {
  const result = toLytDeviceStatusContract({ deviceId: 'dev-42', status: 'ONLINE' })
  assert.deepEqual(result, { deviceId: 'dev-42', status: 'ONLINE' })
})

it('toLytDeviceStatusContract maps offline device status', () => {
  const result = toLytDeviceStatusContract({ deviceId: 'dev-99', status: 'OFFLINE' })
  assert.deepEqual(result, { deviceId: 'dev-99', status: 'OFFLINE' })
})

it('toLytBootstrapContract normalizes bootstrap data', () => {
  const bootstrap = {
    adapter: 'MockLytAdapter',
    foundationDependencies: ['identity-access', 'configuration-governance'],
    foundationContracts: ['lyt-adapter:v1'],
    availableAdapters: [
      { adapterName: 'MockLytAdapter', adapterMode: 'mock' as const },
      { adapterName: 'SandboxLytAdapter', adapterMode: 'sandbox' as const }
    ],
    selectionStrategy: 'connection-driven: mock -> sandbox -> real'
  }

  const result = toLytBootstrapContract(bootstrap)

  assert.equal(result.adapter, 'MockLytAdapter')
  assert.deepEqual(result.foundationDependencies, ['identity-access', 'configuration-governance'])
  assert.deepEqual(result.foundationContracts, ['lyt-adapter:v1'])
  assert.equal(result.availableAdapters?.length, 2)
  assert.equal(result.selectionStrategy, 'connection-driven: mock -> sandbox -> real')
})

it('toLytBootstrapContract returns safe copy (not the same array reference)', () => {
  const deps = ['identity-access']
  const result = toLytBootstrapContract({
    adapter: 'test',
    foundationDependencies: deps,
    foundationContracts: ['v1']
  })

  // Mutate the original array — contract copy must be unaffected
  deps.push('extra-module')

  assert.deepEqual(result.foundationDependencies, ['identity-access'])
  assert.equal(deps.length, 2)
})

it('toLytStandardizedWebhookEventContract maps payment success event', () => {
  const result = toLytStandardizedWebhookEventContract({
    eventId: 'evt-1001',
    eventType: 'payment.success',
    payload: {
      tenantId: 'tenant-1',
      brandId: 'brand-1',
      storeId: 'store-1',
      orderId: 'order-1'
    }
  })

  assert.equal(result.aggregateId, 'evt-1001')
  assert.equal(result.sourceEventName, 'payment.success')
  assert.equal(result.standardizedEventName, 'cashier.payment-succeeded')
  assert.equal(result.capability, 'payment')
  assert.equal(result.idempotencyKey, 'lyt-standardized:evt-1001')
  assert.equal(result.tenantId, 'tenant-1')
  assert.equal(result.brandId, 'brand-1')
  assert.equal(result.storeId, 'store-1')
  assert.equal(result.payload.aggregateId, 'evt-1001')
})

it('toLytStandardizedWebhookEventContract falls back for unknown source event', () => {
  const result = toLytStandardizedWebhookEventContract({
    eventId: 'evt-unknown',
    eventType: 'mystery.changed',
    payload: { traceId: 'trace-1' }
  })

  assert.equal(result.standardizedEventName, 'lyt.unmapped-webhook-received')
  assert.equal(result.capability, 'unknown')
  assert.equal(result.tenantId, undefined)
})

it('toLytWebhookArchiveRecordContract captures raw payload archive metadata', () => {
  const standardizedEvent = toLytStandardizedWebhookEventContract({
    eventId: 'evt-archive',
    eventType: 'gate.pass',
    payload: {
      tenantId: 'tenant-1',
      storeId: 'store-1',
      requestId: 'req-1',
      occurredAt: '2026-06-14T10:08:00.000Z'
    }
  })

  const result = toLytWebhookArchiveRecordContract({
    source: 'lyt-callback',
    standardizedEvent,
    rawPayload: standardizedEvent.payload,
    rawBody: '{"requestId":"req-1"}',
    rawHeaders: { signature: 'fixture:test' },
    rawQuery: { channel: 'fixture-test' },
    receivedAt: '2026-06-14T10:10:00.000Z',
    signatureVerified: true
  })

  assert.equal(result.source, 'lyt-callback')
  assert.equal(result.signatureStatus, 'verified')
  assert.equal(result.requestId, 'req-1')
  assert.equal(result.occurredAt, '2026-06-14T10:08:00.000Z')
  assert.equal(result.mappingVersion, 'lyt-field-mapping-spec-v1')
  assert.equal(result.rawBody, '{"requestId":"req-1"}')
  assert.deepEqual(result.rawHeaders, { signature: 'fixture:test' })
  assert.deepEqual(result.rawQuery, { channel: 'fixture-test' })
})

it('toLytFixtureCatalogItemContract returns defensive payload copy', () => {
  const samplePayload = { requestId: 'req-1' }
  const result = toLytFixtureCatalogItemContract({
    key: 'payment-success-webhook',
    title: '支付成功回调样例',
    transport: 'webhook',
    capability: 'payment',
    riskLevel: 'high',
    method: 'POST',
    path: '/webhooks/payment-success',
    recommendedUsage: '用于回调演练',
    eventType: 'payment.success',
    mappingVersion: 'lyt-field-mapping-spec-v1',
    requiredRawFields: ['requestId'],
    recommendedRawFields: ['currency'],
    requiredHeaders: ['signature'],
    recommendedHeaders: ['x-lyt-source'],
    requiredQueryParams: [],
    recommendedQueryParams: ['traceId'],
    standardFieldChecklist: ['externalPaymentId'],
    schemaChecklist: ['headers', 'payload-body'],
    archiveChecklist: ['rawPayload'],
    validationStatus: 'ready-for-rehearsal',
    missingSampleFields: [],
    missingChecklistItems: [],
    samplePayload
    ,
    sampleHeaders: { signature: 'fixture:test' },
    sampleQueryParams: {}
  })

  samplePayload.requestId = 'changed'
  assert.equal(result.samplePayload.requestId, 'req-1')
  assert.deepEqual(result.requiredRawFields, ['requestId'])
  assert.deepEqual(result.recommendedRawFields, ['currency'])
  assert.deepEqual(result.requiredHeaders, ['signature'])
  assert.deepEqual(result.recommendedHeaders, ['x-lyt-source'])
  assert.deepEqual(result.sampleHeaders, { signature: 'fixture:test' })
})
