import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { DeviceAdapterService, DeviceType, DeviceBrand, DeviceConfig } from './device-adapter.service'

function createService() {
  return new DeviceAdapterService()
}

function createTestDevice(overrides?: Partial<DeviceConfig>): DeviceConfig {
  return {
    deviceId: 'test-device-001',
    deviceType: 'pos',
    brand: 'huawei',
    connection: 'usb',
    timeout: 5000,
    retries: 3,
    ...overrides,
  }
}

describe('DeviceAdapterService', () => {
  let service: DeviceAdapterService

  beforeEach(() => {
    service = createService()
  })

  // ── 1. Device Registration / Unregistration / Query ──────────────────────

  describe('device registration', () => {
    it('should register a device and return the config', () => {
      const config = createTestDevice()
      const result = service.registerDevice(config)

      expect(result).toEqual(config)
      expect(service.getDevice('test-device-001')).toEqual(config)
    })

    it('should return null for non-existent device', () => {
      expect(service.getDevice('non-existent')).toBeNull()
    })

    it('should unregister a device', () => {
      const config = createTestDevice()
      service.registerDevice(config)

      service.unregisterDevice('test-device-001')

      expect(service.getDevice('test-device-001')).toBeNull()
    })

    it('should list all devices without filters', () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos' }))
      service.registerDevice(createTestDevice({ deviceId: 'gate-1', deviceType: 'gate' }))
      service.registerDevice(createTestDevice({ deviceId: 'scanner-1', deviceType: 'scanner' }))

      const devices = service.listDevices()

      expect(devices).toHaveLength(3)
    })

    it('should filter devices by type', () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos' }))
      service.registerDevice(createTestDevice({ deviceId: 'gate-1', deviceType: 'gate' }))
      service.registerDevice(createTestDevice({ deviceId: 'pos-2', deviceType: 'pos' }))

      const posDevices = service.listDevices({ type: 'pos' as DeviceType })

      expect(posDevices).toHaveLength(2)
      expect(posDevices.every((d) => d.deviceType === 'pos')).toBe(true)
    })

    it('should filter devices by brand', () => {
      service.registerDevice(createTestDevice({ deviceId: 'huawei-1', brand: 'huawei' as DeviceBrand }))
      service.registerDevice(createTestDevice({ deviceId: 'zebra-1', brand: 'zebra' as DeviceBrand }))
      service.registerDevice(createTestDevice({ deviceId: 'honeywell-1', brand: 'honeywell' as DeviceBrand }))

      const huaweiDevices = service.listDevices({ brand: 'huawei' as DeviceBrand })

      expect(huaweiDevices).toHaveLength(1)
      expect(huaweiDevices[0].brand).toBe('huawei')
    })

    it('should filter devices by status', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'online-1' }))
      service.registerDevice(createTestDevice({ deviceId: 'offline-1' }))

      await service.connect('online-1')

      const onlineDevices = service.listDevices({ status: 'online' })
      expect(onlineDevices).toHaveLength(1)
      expect(onlineDevices[0].deviceId).toBe('online-1')
    })
  })

  // ── 2. Connect → Disconnect → Status State Transition ─────────────────────

  describe('connection state transitions', () => {
    it('should start as offline after registration', () => {
      service.registerDevice(createTestDevice())

      expect(service.getStatus('test-device-001')).toBe('offline')
    })

    it('should transition to online after connect', async () => {
      service.registerDevice(createTestDevice())

      await service.connect('test-device-001')

      expect(service.getStatus('test-device-001')).toBe('online')
    })

    it('should transition back to offline after disconnect', async () => {
      service.registerDevice(createTestDevice())
      await service.connect('test-device-001')

      await service.disconnect('test-device-001')

      expect(service.getStatus('test-device-001')).toBe('offline')
    })

    it('should handle connect for non-existent device gracefully', async () => {
      const result = await service.connect('non-existent')

      expect(result).toBe(false)
    })

    it('should handle disconnect for non-existent device gracefully', async () => {
      await expect(service.disconnect('non-existent')).resolves.toBeUndefined()
    })
  })

  // ── 3. POS Transaction Flow ───────────────────────────────────────────────

  describe('POS transaction', () => {
    it('should complete a successful POS transaction', async () => {
      service.registerDevice(createTestDevice({ brand: 'huawei' }))
      await service.connect('test-device-001')

      const result = await service.posTransaction('test-device-001', 100.5, 'CNY')

      expect(result.success).toBe(true)
      expect(result.commandId).toBeDefined()
      expect(result.data).toHaveProperty('transactionId')
      expect(result.data).toHaveProperty('status', 'approved')
    })

    it('should return error when POS device is offline', async () => {
      service.registerDevice(createTestDevice())

      const result = await service.posTransaction('test-device-001', 100.5, 'CNY')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should return error for non-existent device', async () => {
      const result = await service.posTransaction('non-existent', 100.5, 'CNY')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  // ── 4. POS Refund Flow ────────────────────────────────────────────────────

  describe('POS refund', () => {
    it('should process a successful refund', async () => {
      service.registerDevice(createTestDevice({ brand: 'huawei' }))
      await service.connect('test-device-001')

      const result = await service.posRefund('test-device-001', 'orig-tx-123', 50.0)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('refundId')
      expect(result.data).toHaveProperty('status', 'processed')
    })

    it('should return error when device is offline', async () => {
      service.registerDevice(createTestDevice())

      const result = await service.posRefund('test-device-001', 'orig-tx-123', 50.0)

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  // ── 5. Gate Open + Access Log ─────────────────────────────────────────────

  describe('gate operations', () => {
    it('should open gate successfully', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-001', deviceType: 'gate' }))
      await service.connect('gate-001')

      const result = await service.gateOpen('gate-001', 'in')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('gateId', 'gate-001')
      expect(result.data).toHaveProperty('direction', 'in')
      expect(result.data).toHaveProperty('openedAt')
    })

    it('should open gate with direction out', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-001', deviceType: 'gate' }))
      await service.connect('gate-001')

      const result = await service.gateOpen('gate-001', 'out')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('direction', 'out')
    })

    it('should open gate with direction both', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-001', deviceType: 'gate' }))
      await service.connect('gate-001')

      const result = await service.gateOpen('gate-001', 'both')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('direction', 'both')
    })

    it('should get access log', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-001', deviceType: 'gate' }))
      await service.connect('gate-001')

      const result = await service.gateGetAccessLog('gate-001', 50)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('logs')
      expect(result.data).toHaveProperty('count')
      expect(Array.isArray((result.data as any).logs)).toBe(true)
    })

    it('should return error when gate is offline', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-001', deviceType: 'gate' }))

      const result = await service.gateOpen('gate-001', 'in')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should return error when getting access log for offline gate', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-001', deviceType: 'gate' }))

      const result = await service.gateGetAccessLog('gate-001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  // ── 6. Scanner Parse ──────────────────────────────────────────────────────

  describe('scanner parse', () => {
    it('should parse QR code (URL)', () => {
      const result = service.scannerParse('https://example.com/pay?id=123')

      expect(result.format).toBe('qr')
      expect(result.value).toBe('https://example.com/pay?id=123')
      expect(result.metadata).toHaveProperty('decoded', true)
    })

    it('should parse QR code (long alphanumeric)', () => {
      const result = service.scannerParse('ABC123DEF456GHI789JKL012MNO345')

      expect(result.format).toBe('qr')
      expect(result.value).toBe('ABC123DEF456GHI789JKL012MNO345')
    })

    it('should parse Code128', () => {
      const result = service.scannerParse('ORDER-12345')

      expect(result.format).toBe('code128')
      expect(result.value).toBe('ORDER-12345')
    })

    it('should parse EAN-13', () => {
      const result = service.scannerParse('5901234123457')

      expect(result.format).toBe('ean13')
      expect(result.value).toBe('5901234123457')
    })

    it('should parse UPC', () => {
      const result = service.scannerParse('012345678901')

      expect(result.format).toBe('upc')
      expect(result.value).toBe('012345678901')
    })
  })

  describe('scanner scan', () => {
    it('should scan successfully with honeywell device', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'scanner-1', deviceType: 'scanner', brand: 'honeywell' }))
      await service.connect('scanner-1')

      const result = await service.scannerScan('scanner-1')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('rawData')
      expect(result.data).toHaveProperty('format')
    })

    it('should return error when scanner is offline', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'scanner-1', deviceType: 'scanner', brand: 'honeywell' }))

      const result = await service.scannerScan('scanner-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  // ── 7. Printer Print + QR ─────────────────────────────────────────────────

  describe('printer operations', () => {
    it('should print successfully with zebra printer', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'printer-1', deviceType: 'printer', brand: 'zebra' }))
      await service.connect('printer-1')

      const result = await service.printerPrint('printer-1', 'Hello World!\nThank you.')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('jobId')
      expect(result.data).toHaveProperty('pages', 1)
    })

    it('should print QR successfully with zebra printer', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'printer-1', deviceType: 'printer', brand: 'zebra' }))
      await service.connect('printer-1')

      const result = await service.printerPrintQR('printer-1', 'https://example.com')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('jobId')
      expect(result.data).toHaveProperty('format', 'qr')
    })

    it('should print successfully with epson printer', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'printer-1', deviceType: 'printer', brand: 'epson' }))
      await service.connect('printer-1')

      const result = await service.printerPrint('printer-1', 'Receipt content')

      expect(result.success).toBe(true)
    })

    it('should return error when printer is offline', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'printer-1', deviceType: 'printer', brand: 'zebra' }))

      const result = await service.printerPrint('printer-1', 'test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should return error when printing QR to offline printer', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'printer-1', deviceType: 'printer', brand: 'zebra' }))

      const result = await service.printerPrintQR('printer-1', 'test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  // ── 8. Device Offline Returns Error ───────────────────────────────────────

  describe('offline device operations', () => {
    it('should return error for offline device on POS transaction', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos' }))

      const result = await service.posTransaction('pos-1', 100, 'CNY')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should return error for offline device on POS refund', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos' }))

      const result = await service.posRefund('pos-1', 'tx-123', 50)

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should return error for offline device on POS read card', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos' }))

      const result = await service.posReadCard('pos-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should return error for offline device on gate open', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-1', deviceType: 'gate' }))

      const result = await service.gateOpen('gate-1', 'in')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should return error for offline device on scanner scan', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'scanner-1', deviceType: 'scanner' }))

      const result = await service.scannerScan('scanner-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should return error for offline device on printer print', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'printer-1', deviceType: 'printer' }))

      const result = await service.printerPrint('printer-1', 'test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  // ── 9. connectAll Batch Connection ─────────────────────────────────────────

  describe('connectAll', () => {
    it('should connect all devices of a specific type', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos' }))
      service.registerDevice(createTestDevice({ deviceId: 'pos-2', deviceType: 'pos' }))
      service.registerDevice(createTestDevice({ deviceId: 'gate-1', deviceType: 'gate' }))

      const results = await service.connectAll('pos')

      expect(results.size).toBe(2)
      expect(results.get('pos-1')).toBe(true)
      expect(results.get('pos-2')).toBe(true)
      expect(service.getStatus('pos-1')).toBe('online')
      expect(service.getStatus('pos-2')).toBe('online')
      expect(service.getStatus('gate-1')).toBe('offline')
    })

    it('should return empty map when no devices of type exist', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos' }))

      const results = await service.connectAll('gate')

      expect(results.size).toBe(0)
    })
  })

  // ── 10. Command History ────────────────────────────────────────────────────

  describe('command history', () => {
    it('should record commands in history', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos', brand: 'huawei' }))
      await service.connect('pos-1')

      await service.posTransaction('pos-1', 100, 'CNY')
      await service.posRefund('pos-1', 'tx-123', 50)

      const history = service.getCommandHistory('pos-1')

      expect(history).toHaveLength(2)
      expect(history[0].action).toBe('posTransaction')
      expect(history[1].action).toBe('posRefund')
    })

    it('should limit history to 100 entries', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos', brand: 'huawei' }))
      await service.connect('pos-1')

      // Add 105 transactions
      for (let i = 0; i < 105; i++) {
        await service.posTransaction('pos-1', i, 'CNY')
      }

      const history = service.getCommandHistory('pos-1')

      expect(history).toHaveLength(100)
    })

    it('should respect limit parameter', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos', brand: 'huawei' }))
      await service.connect('pos-1')

      await service.posTransaction('pos-1', 100, 'CNY')
      await service.posRefund('pos-1', 'tx-1', 50)
      await service.posReadCard('pos-1')

      const history = service.getCommandHistory('pos-1', 2)

      expect(history).toHaveLength(2)
      expect(history[0].action).toBe('posRefund')
      expect(history[1].action).toBe('posReadCard')
    })

    it('should return empty array for non-existent device', () => {
      const history = service.getCommandHistory('non-existent')

      expect(history).toEqual([])
    })

    it('should include issuedAt timestamp', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos', brand: 'huawei' }))
      await service.connect('pos-1')

      const before = new Date()
      await service.posTransaction('pos-1', 100, 'CNY')
      const after = new Date()

      const history = service.getCommandHistory('pos-1')

      expect(history[0].issuedAt instanceof Date).toBe(true)
      expect(history[0].issuedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(history[0].issuedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  // ── checkAllStatus ─────────────────────────────────────────────────────────

  describe('checkAllStatus', () => {
    it('should return status of all registered devices', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1' }))
      service.registerDevice(createTestDevice({ deviceId: 'gate-1' }))
      await service.connect('pos-1')

      const statuses = service.checkAllStatus()

      expect(statuses.size).toBe(2)
      expect(statuses.get('pos-1')).toBe('online')
      expect(statuses.get('gate-1')).toBe('offline')
    })

    it('should return empty map when no devices registered', () => {
      const statuses = service.checkAllStatus()

      expect(statuses.size).toBe(0)
    })
  })

  // ── heartbeat ─────────────────────────────────────────────────────────────

  describe('heartbeat', () => {
    it('should set device to online', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1' }))

      await service.heartbeat('pos-1')

      expect(service.getStatus('pos-1')).toBe('online')
    })

    it('should handle non-existent device gracefully', async () => {
      await expect(service.heartbeat('non-existent')).resolves.toBeUndefined()
    })
  })

  // ── POS Read Card ─────────────────────────────────────────────────────────

  describe('POS read card', () => {
    it('should read card successfully', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos', brand: 'huawei' }))
      await service.connect('pos-1')

      const result = await service.posReadCard('pos-1')

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('cardNumber')
      expect(result.data).toHaveProperty('cardType')
    })
  })
})
