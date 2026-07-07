import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  LytDeviceQueryDto,
  LytDeviceCreateDto,
  LytDeviceUpdateDto,
  LytGateVerifyDto,
  LytBootstrapResponseDto,
  LytFixtureCompareDto,
  LytFixtureImportPlanDto,
  LytFixtureImportPreviewDto,
  LytWebhookDrillDto,
  LytWebhookFixtureReplayDto,
  LytWebhookIngestDto
} from './lyt.dto'
import { LytDeviceType, LytDeviceStatus } from './lyt.entity'

describe('lyt.dto', () => {

  describe('LytDeviceQueryDto', () => {
    it('can be instantiated with no params', () => {
      const dto = new LytDeviceQueryDto()
      assert.equal(dto.deviceType, undefined)
      assert.equal(dto.status, undefined)
      assert.equal(dto.storeId, undefined)
      assert.equal(dto.keyword, undefined)
    })

    it('accepts all optional query fields', () => {
      const dto = new LytDeviceQueryDto()
      dto.deviceType = LytDeviceType.GateReader
      dto.status = LytDeviceStatus.Online
      dto.storeId = 'store-1'
      dto.keyword = 'gate'
      dto.page = 1
      dto.pageSize = 20

      assert.equal(dto.deviceType, 'GATE_READER')
      assert.equal(dto.status, 'ONLINE')
      assert.equal(dto.storeId, 'store-1')
      assert.equal(dto.keyword, 'gate')
      assert.equal(dto.page, 1)
      assert.equal(dto.pageSize, 20)
    })
  })

  describe('LytDeviceCreateDto', () => {
    it('has required fields', () => {
      const dto = new LytDeviceCreateDto()
      dto.deviceType = LytDeviceType.Camera
      dto.name = 'Camera 1'
      dto.storeId = 'store-1'

      assert.equal(dto.deviceType, 'CAMERA')
      assert.equal(dto.name, 'Camera 1')
      assert.equal(dto.storeId, 'store-1')
    })

    it('firmwareVersion is optional', () => {
      const dto = new LytDeviceCreateDto()
      dto.deviceType = LytDeviceType.Camera
      dto.name = 'Camera 2'
      dto.storeId = 'store-2'

      assert.equal(dto.firmwareVersion, undefined)

      dto.firmwareVersion = '1.2.3'
      assert.equal(dto.firmwareVersion, '1.2.3')
    })
  })

  describe('LytDeviceUpdateDto', () => {
    it('all fields are optional', () => {
      const dto = new LytDeviceUpdateDto()
      assert.equal(dto.name, undefined)
      assert.equal(dto.status, undefined)
      assert.equal(dto.firmwareVersion, undefined)
    })

    it('partial update sets only provided fields', () => {
      const dto = new LytDeviceUpdateDto()
      dto.name = 'Renamed Device'
      dto.status = LytDeviceStatus.Maintenance

      assert.equal(dto.name, 'Renamed Device')
      assert.equal(dto.status, 'MAINTENANCE')
      assert.equal(dto.firmwareVersion, undefined)
    })
  })

  describe('LytGateVerifyDto', () => {
    it('has required passCode and storeId', () => {
      const dto = new LytGateVerifyDto()
      dto.passCode = 'PASS-1234'
      dto.storeId = 'store-1'

      assert.equal(dto.passCode, 'PASS-1234')
      assert.equal(dto.storeId, 'store-1')
    })
  })

  describe('LytBootstrapResponseDto', () => {
    it('has expected shape', () => {
      const dto = new LytBootstrapResponseDto()
      dto.tenantContext = { tenantId: 't1' }
      dto.capabilities = ['device-management']
      dto.phase = 'scaffold'

      assert.deepStrictEqual(dto.tenantContext, { tenantId: 't1' })
      assert.deepStrictEqual(dto.capabilities, ['device-management'])
      assert.equal(dto.phase, 'scaffold')
    })
  })

  describe('LytWebhookIngestDto', () => {
    it('has required webhook signature, timestamp, and payload', () => {
      const dto = new LytWebhookIngestDto()
      dto.signature = 'sha256=test'
      dto.timestamp = '1718234567890'
      dto.payload = { orderId: 'order-1' }

      assert.equal(dto.signature, 'sha256=test')
      assert.equal(dto.timestamp, '1718234567890')
      assert.deepStrictEqual(dto.payload, { orderId: 'order-1' })
    })

    it('optional event metadata can be assigned', () => {
      const dto = new LytWebhookIngestDto()
      dto.eventId = 'evt-1'
      dto.eventType = 'payment.success'
      dto.rawBody = '{"orderId":"order-1"}'
      dto.fixtureKey = 'payment-success-webhook'
      dto.signature = 'sha256=test'
      dto.timestamp = '1718234567890'
      dto.payload = { orderId: 'order-1' }

      assert.equal(dto.eventId, 'evt-1')
      assert.equal(dto.eventType, 'payment.success')
      assert.equal(dto.rawBody, '{"orderId":"order-1"}')
      assert.equal(dto.fixtureKey, 'payment-success-webhook')
    })
  })

  describe('LytWebhookDrillDto', () => {
    it('supports drill preview payload with optional dryRun flag', () => {
      const dto = new LytWebhookDrillDto()
      dto.eventId = 'drill-1'
      dto.eventType = 'payment.success'
      dto.dryRun = true
      dto.payload = { orderId: 'order-1' }

      assert.equal(dto.eventId, 'drill-1')
      assert.equal(dto.eventType, 'payment.success')
      assert.equal(dto.dryRun, true)
      assert.deepStrictEqual(dto.payload, { orderId: 'order-1' })
    })

    it('supports optional fixtureKey without requiring payload', () => {
      const dto = new LytWebhookDrillDto()
      dto.fixtureKey = 'payment-success-webhook'
      dto.dryRun = true

      assert.equal(dto.fixtureKey, 'payment-success-webhook')
      assert.equal(dto.payload, undefined)
    })
  })

  describe('LytWebhookFixtureReplayDto', () => {
    it('supports fixture replay input with optional overrides', () => {
      const dto = new LytWebhookFixtureReplayDto()
      dto.fixtureKey = 'gate-pass-webhook'
      dto.eventId = 'fixture-run-001'
      dto.payload = { requestId: 'req-override-1' }
      dto.strictValidation = true
      dto.headers = { signature: 'fixture:override' }
      dto.query = { channel: 'fixture-test' }

      assert.equal(dto.fixtureKey, 'gate-pass-webhook')
      assert.equal(dto.eventId, 'fixture-run-001')
      assert.deepStrictEqual(dto.payload, { requestId: 'req-override-1' })
      assert.equal(dto.strictValidation, true)
      assert.deepStrictEqual(dto.headers, { signature: 'fixture:override' })
      assert.deepStrictEqual(dto.query, { channel: 'fixture-test' })
    })
  })

  describe('LytFixtureCompareDto', () => {
    it('supports payload headers and query compare input', () => {
      const dto = new LytFixtureCompareDto()
      dto.payload = { paymentId: 'payment-001' }
      dto.headers = { signature: 'fixture:test' }
      dto.query = { traceId: 'trace-001' }

      assert.deepStrictEqual(dto.payload, { paymentId: 'payment-001' })
      assert.deepStrictEqual(dto.headers, { signature: 'fixture:test' })
      assert.deepStrictEqual(dto.query, { traceId: 'trace-001' })
    })
  })

  describe('LytFixtureImportPreviewDto', () => {
    it('supports captured sample import preview input', () => {
      const dto = new LytFixtureImportPreviewDto()
      dto.payload = { paymentId: 'payment-001' }
      dto.headers = { signature: 'fixture:test' }
      dto.query = { traceId: 'trace-001' }

      assert.deepStrictEqual(dto.payload, { paymentId: 'payment-001' })
      assert.deepStrictEqual(dto.headers, { signature: 'fixture:test' })
      assert.deepStrictEqual(dto.query, { traceId: 'trace-001' })
    })
  })

  describe('LytFixtureImportPlanDto', () => {
    it('supports fixture import plan input', () => {
      const dto = new LytFixtureImportPlanDto()
      dto.payload = { paymentId: 'payment-001' }
      dto.headers = { 'x-lyt-source': 'captured-sample' }
      dto.query = { traceId: 'trace-001' }

      assert.deepStrictEqual(dto.payload, { paymentId: 'payment-001' })
      assert.deepStrictEqual(dto.headers, { 'x-lyt-source': 'captured-sample' })
      assert.deepStrictEqual(dto.query, { traceId: 'trace-001' })
    })
  })
})
