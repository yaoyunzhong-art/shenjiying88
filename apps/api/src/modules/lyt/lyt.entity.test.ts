import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  LytDeviceType,
  LytDeviceStatus,
  isDeviceOnline,
  isDeviceAnomalous,
  makeLytBootstrap,
  computeDeviceHealthSummary
} from './lyt.entity'

describe('lyt.entity', () => {

  describe('LytDeviceType', () => {
    it('has all expected enum values', () => {
      const values = Object.values(LytDeviceType)
      assert.ok(values.includes('GATE_READER'))
      assert.ok(values.includes('PRIZE_MACHINE'))
      assert.ok(values.includes('CAST_SCREEN'))
      assert.ok(values.includes('CAMERA'))
      assert.ok(values.includes('SENSOR'))
    })
  })

  describe('LytDeviceStatus', () => {
    it('has online, offline, maintenance values', () => {
      const values = Object.values(LytDeviceStatus)
      assert.ok(values.includes('ONLINE'))
      assert.ok(values.includes('OFFLINE'))
      assert.ok(values.includes('MAINTENANCE'))
    })
  })

  describe('isDeviceOnline', () => {
    it('returns true for ONLINE status', () => {
      assert.equal(isDeviceOnline(LytDeviceStatus.Online), true)
    })

    it('returns false for OFFLINE status', () => {
      assert.equal(isDeviceOnline(LytDeviceStatus.Offline), false)
    })

    it('returns false for MAINTENANCE status', () => {
      assert.equal(isDeviceOnline(LytDeviceStatus.Maintenance), false)
    })
  })

  describe('isDeviceAnomalous', () => {
    const tenantContext = { storeId: 'store-1', tenantId: 't1', userId: 'u1', role: 'operator' }

    it('returns false for online device', () => {
      const device = {
        deviceId: 'd1',
        tenantContext,
        storeId: 'store-1',
        deviceType: LytDeviceType.GateReader,
        name: 'Gate 1',
        status: LytDeviceStatus.Online,
        registeredAt: '2025-01-01T00:00:00Z'
      }
      assert.equal(isDeviceAnomalous(device), false)
    })

    it('returns true for offline device without heartbeat', () => {
      const device = {
        deviceId: 'd2',
        tenantContext,
        storeId: 'store-1',
        deviceType: LytDeviceType.Camera,
        name: 'Cam 1',
        status: LytDeviceStatus.Offline,
        registeredAt: '2025-01-01T00:00:00Z'
      }
      assert.equal(isDeviceAnomalous(device), true)
    })

    it('returns false for recently offline device within threshold', () => {
      const now = new Date()
      const device = {
        deviceId: 'd3',
        tenantContext,
        storeId: 'store-1',
        deviceType: LytDeviceType.Sensor,
        name: 'Sensor 1',
        status: LytDeviceStatus.Offline,
        lastHeartbeatAt: now.toISOString(),
        registeredAt: '2025-01-01T00:00:00Z'
      }
      assert.equal(isDeviceAnomalous(device, 5), false)
    })

    it('returns true for long-offline device exceeding threshold', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60_000)
      const device = {
        deviceId: 'd4',
        tenantContext,
        storeId: 'store-1',
        deviceType: LytDeviceType.PrizeMachine,
        name: 'Prize 1',
        status: LytDeviceStatus.Offline,
        lastHeartbeatAt: tenMinutesAgo.toISOString(),
        registeredAt: '2025-01-01T00:00:00Z'
      }
      assert.equal(isDeviceAnomalous(device, 5), true)
    })

    it('maintenance device is anomalous when heartbeat expired', () => {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60_000)
      const device = {
        deviceId: 'd5',
        tenantContext,
        storeId: 'store-1',
        deviceType: LytDeviceType.CastScreen,
        name: 'Screen 1',
        status: LytDeviceStatus.Maintenance,
        lastHeartbeatAt: twentyMinutesAgo.toISOString(),
        registeredAt: '2025-01-01T00:00:00Z'
      }
      assert.equal(isDeviceAnomalous(device, 10), true)
    })
  })

  describe('makeLytBootstrap', () => {
    it('returns default bootstrap with tenantContext', () => {
      const ctx = { storeId: 's1', tenantId: 't1', userId: 'u1', role: 'operator' }
      const result = makeLytBootstrap(ctx)
      assert.equal(result.tenantContext, ctx)
      assert.ok(result.capabilities.includes('device-management'))
      assert.ok(result.capabilities.includes('connection-pool'))
      assert.ok(result.capabilities.includes('gate-control'))
      assert.ok(result.capabilities.includes('cast-screen'))
      assert.equal(result.phase, 'scaffold')
    })

    it('allows capability overrides', () => {
      const ctx = { storeId: 's2', tenantId: 't2', userId: 'u2', role: 'admin' }
      const result = makeLytBootstrap(ctx, { capabilities: ['custom-feature'] })
      assert.deepStrictEqual(result.capabilities, ['custom-feature'])
    })

    it('allows phase override', () => {
      const ctx = { storeId: 's3', tenantId: 't3', userId: 'u3', role: 'admin' }
      const result = makeLytBootstrap(ctx, { phase: 'production' })
      assert.equal(result.phase, 'production')
    })
  })

  describe('computeDeviceHealthSummary', () => {
    const ctx = { storeId: 'store-1', tenantId: 't1', userId: 'u1', role: 'operator' }
    const makeDevice = (overrides: { deviceId?: string; deviceType?: any; status?: any; lastHeartbeatAt?: string } = {}) => ({
      deviceId: overrides.deviceId ?? 'd1',
      tenantContext: ctx as any,
      storeId: 'store-1',
      deviceType: overrides.deviceType ?? LytDeviceType.GateReader,
      name: 'Test Device',
      status: overrides.status ?? LytDeviceStatus.Online,
      registeredAt: '2025-01-01T00:00:00Z',
      ...(overrides.lastHeartbeatAt !== undefined ? { lastHeartbeatAt: overrides.lastHeartbeatAt } : {})
    })

    it('empty device list returns 100% health', () => {
      const result = computeDeviceHealthSummary([])
      assert.equal(result.total, 0)
      assert.equal(result.online, 0)
      assert.equal(result.offline, 0)
      assert.equal(result.maintenance, 0)
      assert.equal(result.anomalous, 0)
      assert.equal(result.healthRate, 100)
    })

    it('all online devices give 100% health rate', () => {
      const devices = [
        makeDevice({ deviceId: 'd1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'd2', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'd3', deviceType: LytDeviceType.Sensor, status: LytDeviceStatus.Online })
      ]
      const result = computeDeviceHealthSummary(devices)
      assert.equal(result.total, 3)
      assert.equal(result.online, 3)
      assert.equal(result.healthRate, 100)
      assert.equal(result.anomalous, 0)
    })

    it('mixed status devices compute correct health rate', () => {
      const devices = [
        makeDevice({ deviceId: 'd1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'd2', deviceType: LytDeviceType.PrizeMachine, status: LytDeviceStatus.Offline, lastHeartbeatAt: new Date(Date.now() - 10 * 60_000).toISOString() }),
        makeDevice({ deviceId: 'd3', deviceType: LytDeviceType.CastScreen, status: LytDeviceStatus.Maintenance }),
        makeDevice({ deviceId: 'd4', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Online })
      ]
      const result = computeDeviceHealthSummary(devices)
      assert.equal(result.total, 4)
      assert.equal(result.online, 2)
      assert.equal(result.offline, 1)
      assert.equal(result.maintenance, 1)
      assert.equal(result.healthRate, 50)
      assert.ok(result.anomalous >= 1)
    })

    it('deviceTypeBreakdown has correct per-type counts', () => {
      const devices = [
        makeDevice({ deviceId: 'g1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'g2', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Offline, lastHeartbeatAt: new Date(Date.now() - 20 * 60_000).toISOString() }),
        makeDevice({ deviceId: 'p1', deviceType: LytDeviceType.PrizeMachine, status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 's1', deviceType: LytDeviceType.Sensor, status: LytDeviceStatus.Maintenance })
      ]
      const result = computeDeviceHealthSummary(devices)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.GateReader].total, 2)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.GateReader].online, 1)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.GateReader].offline, 1)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.PrizeMachine].total, 1)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.PrizeMachine].online, 1)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.Sensor].total, 1)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.Sensor].maintenance, 1)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.Camera].total, 0)
      assert.equal(result.deviceTypeBreakdown[LytDeviceType.CastScreen].total, 0)
    })

    it('anomalous devices detected beyond threshold', () => {
      const ancientHeartbeat = new Date(Date.now() - 60 * 60_000).toISOString()
      const devices = [
        makeDevice({ deviceId: 'd1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'd2', deviceType: LytDeviceType.Sensor, status: LytDeviceStatus.Offline, lastHeartbeatAt: ancientHeartbeat }),
        makeDevice({ deviceId: 'd3', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Maintenance, lastHeartbeatAt: ancientHeartbeat })
      ]
      const result = computeDeviceHealthSummary(devices, 30)
      assert.equal(result.anomalous, 2)
    })
  })
})
