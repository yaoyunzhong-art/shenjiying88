import { describe, it, expect, beforeEach } from 'vitest'
import { DeviceAdapterService, DeviceConfig, DeviceType, DeviceBrand } from './device-adapter.service'

// ── Helpers ────────────────────────────────────────────────────────────────

function createPosDevice(overrides?: Partial<DeviceConfig>): DeviceConfig {
  return {
    deviceId: 'pos-001',
    deviceType: 'pos' as DeviceType,
    brand: 'huawei' as DeviceBrand,
    connection: 'usb',
    timeout: 5000,
    retries: 3,
    ...overrides,
  }
}

function createGateDevice(overrides?: Partial<DeviceConfig>): DeviceConfig {
  return {
    deviceId: 'gate-001',
    deviceType: 'gate' as DeviceType,
    brand: 'generic' as DeviceBrand,
    connection: 'ethernet',
    timeout: 3000,
    retries: 2,
    ...overrides,
  }
}

function createScannerDevice(overrides?: Partial<DeviceConfig>): DeviceConfig {
  return {
    deviceId: 'scanner-001',
    deviceType: 'scanner' as DeviceType,
    brand: 'honeywell' as DeviceBrand,
    connection: 'usb',
    timeout: 2000,
    retries: 1,
    ...overrides,
  }
}

function createPrinterDevice(overrides?: Partial<DeviceConfig>): DeviceConfig {
  return {
    deviceId: 'printer-001',
    deviceType: 'printer' as DeviceType,
    brand: 'epson' as DeviceBrand,
    connection: 'wifi',
    timeout: 3000,
    retries: 2,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DeviceAdapterService — 正例 + 反例 + 边界
// ═══════════════════════════════════════════════════════════════════════════════

describe('DeviceAdapterService', () => {
  let service: DeviceAdapterService

  beforeEach(() => {
    service = new DeviceAdapterService()
  })

  // ── 设备注册管理 ───────────────────────────────────────────────────────────

  describe('registerDevice / getDevice / unregisterDevice', () => {
    it('should register a device and return its config', () => {
      const config = createPosDevice()
      const result = service.registerDevice(config)

      expect(result.deviceId).toBe('pos-001')
      expect(result.deviceType).toBe('pos')
      expect(result.brand).toBe('huawei')
    })

    it('should retrieve a registered device by id', () => {
      service.registerDevice(createPosDevice())
      const device = service.getDevice('pos-001')

      expect(device).not.toBeNull()
      expect(device!.deviceId).toBe('pos-001')
    })

    it('should return null for unregistered device', () => {
      const device = service.getDevice('non-existent')
      expect(device).toBeNull()
    })

    it('should unregister a device and remove it', () => {
      service.registerDevice(createPosDevice())
      service.unregisterDevice('pos-001')

      expect(service.getDevice('pos-001')).toBeNull()
    })

    it('should unregister only the specified device', () => {
      service.registerDevice(createPosDevice({ deviceId: 'd1' }))
      service.registerDevice(createPosDevice({ deviceId: 'd2' }))

      service.unregisterDevice('d1')

      expect(service.getDevice('d1')).toBeNull()
      expect(service.getDevice('d2')).not.toBeNull()
    })

    it('should not throw when unregistering non-existent device', () => {
      expect(() => service.unregisterDevice('ghost')).not.toThrow()
    })
  })

  // ── 设备列表过滤 ───────────────────────────────────────────────────────────

  describe('listDevices', () => {
    it('should return all devices without filters', () => {
      service.registerDevice(createPosDevice({ deviceId: 'd1' }))
      service.registerDevice(createGateDevice({ deviceId: 'd2' }))
      service.registerDevice(createScannerDevice({ deviceId: 'd3' }))

      const devices = service.listDevices()
      expect(devices).toHaveLength(3)
    })

    it('should filter by device type', () => {
      service.registerDevice(createPosDevice({ deviceId: 'p1' }))
      service.registerDevice(createPosDevice({ deviceId: 'p2' }))
      service.registerDevice(createGateDevice({ deviceId: 'g1' }))

      const posDevices = service.listDevices({ type: 'pos' as DeviceType })
      expect(posDevices).toHaveLength(2)
      expect(posDevices.every(d => d.deviceType === 'pos')).toBe(true)
    })

    it('should filter by brand', () => {
      service.registerDevice(createPosDevice({ deviceId: 'h1', brand: 'huawei' }))
      service.registerDevice(createPosDevice({ deviceId: 'h2', brand: 'huawei' }))
      service.registerDevice(createGateDevice({ deviceId: 'g1', brand: 'generic' }))

      const hwDevices = service.listDevices({ brand: 'huawei' as DeviceBrand })
      expect(hwDevices).toHaveLength(2)
      expect(hwDevices.every(d => d.brand === 'huawei')).toBe(true)
    })

    it('should filter by status', async () => {
      service.registerDevice(createPosDevice({ deviceId: 'online-1' }))
      service.registerDevice(createGateDevice({ deviceId: 'offline-1' }))
      await service.connect('online-1')

      const onlineDevices = service.listDevices({ status: 'online' as any })
      expect(onlineDevices).toHaveLength(1)
      expect(onlineDevices[0].deviceId).toBe('online-1')
    })

    it('should combine multiple filters', () => {
      service.registerDevice(createPosDevice({ deviceId: 'p1', deviceType: 'pos', brand: 'huawei' }))
      service.registerDevice(createGateDevice({ deviceId: 'g1', deviceType: 'gate', brand: 'generic' }))

      const result = service.listDevices({ type: 'pos' as DeviceType, brand: 'huawei' as DeviceBrand })
      expect(result).toHaveLength(1)
      expect(result[0].deviceId).toBe('p1')
    })

    it('should return empty array when no devices match', () => {
      service.registerDevice(createPosDevice({ deviceId: 'p1' }))
      const result = service.listDevices({ type: 'kiosk' as DeviceType })
      expect(result).toHaveLength(0)
    })

    it('should return empty array when no devices registered', () => {
      const result = service.listDevices()
      expect(result).toHaveLength(0)
    })
  })

  // ── 连接管理 ───────────────────────────────────────────────────────────────

  describe('connect / disconnect / connectAll', () => {
    it('should connect a device and set status to online', async () => {
      service.registerDevice(createPosDevice())
      const success = await service.connect('pos-001')

      expect(success).toBe(true)
      expect(service.getStatus('pos-001')).toBe('online')
    })

    it('should return false when connecting unregistered device', async () => {
      const success = await service.connect('ghost')
      expect(success).toBe(false)
    })

    it('should disconnect a device and set status to offline', async () => {
      service.registerDevice(createGateDevice())
      await service.connect('gate-001')
      expect(service.getStatus('gate-001')).toBe('online')

      await service.disconnect('gate-001')
      expect(service.getStatus('gate-001')).toBe('offline')
    })

    it('should not throw when disconnecting unregistered device', async () => {
      await expect(service.disconnect('ghost')).resolves.not.toThrow()
    })

    it('should connect all devices of a given type', async () => {
      service.registerDevice(createGateDevice({ deviceId: 'g1', deviceType: 'gate' }))
      service.registerDevice(createGateDevice({ deviceId: 'g2', deviceType: 'gate' }))
      service.registerDevice(createPosDevice({ deviceId: 'p1', deviceType: 'pos' }))

      const results = await service.connectAll('gate' as DeviceType)

      expect(results.size).toBe(2)
      expect(results.get('g1')).toBe(true)
      expect(results.get('g2')).toBe(true)
      expect(service.getStatus('g1')).toBe('online')
      expect(service.getStatus('g2')).toBe('online')
      // pos device should remain offline
      expect(service.getStatus('p1')).toBe('offline')
    })

    it('should return empty map when no devices of type exist', async () => {
      const results = await service.connectAll('gate' as DeviceType)
      expect(results.size).toBe(0)
    })
  })

  // ── 设备状态 ───────────────────────────────────────────────────────────────

  describe('getStatus / checkAllStatus / heartbeat', () => {
    it('should return offline for unregistered device', () => {
      expect(service.getStatus('ghost')).toBe('offline')
    })

    it('should return offline after registration (default)', () => {
      service.registerDevice(createPosDevice())
      expect(service.getStatus('pos-001')).toBe('offline')
    })

    it('should return online after heartbeat', async () => {
      service.registerDevice(createPosDevice())
      await service.heartbeat('pos-001')
      expect(service.getStatus('pos-001')).toBe('online')
    })

    it('should silently succeed on heartbeat for unregistered device', async () => {
      await expect(service.heartbeat('ghost')).resolves.not.toThrow()
    })

    it('checkAllStatus should return all device statuses', () => {
      service.registerDevice(createPosDevice({ deviceId: 'd1' }))
      service.registerDevice(createGateDevice({ deviceId: 'd2' }))

      const statusMap = service.checkAllStatus()
      expect(statusMap.size).toBe(2)
      expect(statusMap.get('d1')).toBe('offline')
      expect(statusMap.get('d2')).toBe('offline')
    })

    it('checkAllStatus should return empty map when no devices', () => {
      const statusMap = service.checkAllStatus()
      expect(statusMap.size).toBe(0)
    })
  })

  // ── POS 交易操作 ───────────────────────────────────────────────────────────

  describe('posTransaction', () => {
    it('should process transaction on online device', async () => {
      service.registerDevice(createPosDevice())
      await service.connect('pos-001')

      const result = await service.posTransaction('pos-001', 100, 'CNY')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.commandId).toBeDefined()
    })

    it('should fail on offline device', async () => {
      service.registerDevice(createPosDevice())

      const result = await service.posTransaction('pos-001', 50, 'CNY')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should handle zero amount gracefully', async () => {
      service.registerDevice(createPosDevice())
      await service.connect('pos-001')

      const result = await service.posTransaction('pos-001', 0, 'CNY')
      expect(result.success).toBe(true)
    })

    it('should handle large amount', async () => {
      service.registerDevice(createPosDevice())
      await service.connect('pos-001')

      const result = await service.posTransaction('pos-001', 9999999.99, 'USD')
      expect(result.success).toBe(true)
    })

    it('should work with different brands', async () => {
      const brands: DeviceBrand[] = ['huawei', 'generic']
      for (const brand of brands) {
        const id = `pos-${brand}`
        service.registerDevice(createPosDevice({ deviceId: id, brand }))
        await service.connect(id)

        const result = await service.posTransaction(id, 100, 'CNY')
        expect(result.success).toBe(true)
      }
    })
  })

  describe('posRefund', () => {
    it('should process refund on online device', async () => {
      service.registerDevice(createPosDevice())
      await service.connect('pos-001')

      const result = await service.posRefund('pos-001', 'tx-original-001', 50)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should fail on offline device', async () => {
      service.registerDevice(createPosDevice())

      const result = await service.posRefund('pos-001', 'tx-001', 50)
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  describe('posReadCard', () => {
    it('should read card on online POS', async () => {
      service.registerDevice(createPosDevice())
      await service.connect('pos-001')

      const result = await service.posReadCard('pos-001')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any)?.cardNumber).toContain('1234')
    })

    it('should fail on offline POS', async () => {
      service.registerDevice(createPosDevice())

      const result = await service.posReadCard('pos-001')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  // ── 闸机操作 ───────────────────────────────────────────────────────────────

  describe('gateOpen', () => {
    it('should open gate for in direction', async () => {
      service.registerDevice(createGateDevice())
      await service.connect('gate-001')

      const result = await service.gateOpen('gate-001', 'in')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should open gate for out direction', async () => {
      service.registerDevice(createGateDevice())
      await service.connect('gate-001')

      const result = await service.gateOpen('gate-001', 'out')
      expect(result.success).toBe(true)
    })

    it('should open gate for both directions', async () => {
      service.registerDevice(createGateDevice())
      await service.connect('gate-001')

      const result = await service.gateOpen('gate-001', 'both')
      expect(result.success).toBe(true)
    })

    it('should fail on offline gate', async () => {
      service.registerDevice(createGateDevice())

      const result = await service.gateOpen('gate-001', 'in')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  describe('gateGetAccessLog', () => {
    it('should return access log for online gate', async () => {
      service.registerDevice(createGateDevice())
      await service.connect('gate-001')

      const result = await service.gateGetAccessLog('gate-001')
      expect(result.success).toBe(true)
      expect((result.data as any)?.logs).toBeDefined()
      expect((result.data as any)?.count).toBeGreaterThan(0)
    })

    it('should respect limit parameter', async () => {
      service.registerDevice(createGateDevice())
      await service.connect('gate-001')

      const result = await service.gateGetAccessLog('gate-001', 5)
      expect(result.success).toBe(true)
      expect((result.data as any)?.logs.length).toBeLessThanOrEqual(5)
    })

    it('should fail on offline gate', async () => {
      service.registerDevice(createGateDevice())

      const result = await service.gateGetAccessLog('gate-001')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  // ── 扫描仪操作 ─────────────────────────────────────────────────────────────

  describe('scannerScan', () => {
    it('should scan on online scanner', async () => {
      service.registerDevice(createScannerDevice())
      await service.connect('scanner-001')

      const result = await service.scannerScan('scanner-001')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should fail on offline scanner', async () => {
      service.registerDevice(createScannerDevice())

      const result = await service.scannerScan('scanner-001')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })

  describe('scannerParse', () => {
    it('should parse EAN-13', () => {
      const result = service.scannerParse('6901234567890')
      expect(result.format).toBe('ean13')
      expect(result.value).toBe('6901234567890')
    })

    it('should parse UPC', () => {
      const result = service.scannerParse('123456789012')
      expect(result.format).toBe('upc')
    })

    it('should parse URL as QR', () => {
      const result = service.scannerParse('https://example.com/scan')
      expect(result.format).toBe('qr')
      expect(result.metadata).toBeDefined()
    })

    it('should parse QR format string', () => {
      const result = service.scannerParse('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=')
      expect(result.format).toBe('qr')
    })

    it('should default to code128 for unrecognized formats', () => {
      const result = service.scannerParse('SIMPLE-TEXT')
      expect(result.format).toBe('code128')
    })

    it('should handle empty string', () => {
      const result = service.scannerParse('')
      expect(result.format).toBe('code128')
      expect(result.value).toBe('')
    })

    it('should parse 12-digit number as UPC', () => {
      const result = service.scannerParse('987654321098')
      expect(result.format).toBe('upc')
      expect(result.value).toBe('987654321098')
    })
  })

  // ── 打印机操作 ─────────────────────────────────────────────────────────────

  describe('printerPrint', () => {
    it('should print on online printer', async () => {
      service.registerDevice(createPrinterDevice())
      await service.connect('printer-001')

      const result = await service.printerPrint('printer-001', 'Receipt #12345')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should fail on offline printer', async () => {
      service.registerDevice(createPrinterDevice())

      const result = await service.printerPrint('printer-001', 'test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should print empty content', async () => {
      service.registerDevice(createPrinterDevice())
      await service.connect('printer-001')

      const result = await service.printerPrint('printer-001', '')
      expect(result.success).toBe(true)
    })

    it('should print long content', async () => {
      service.registerDevice(createPrinterDevice())
      await service.connect('printer-001')

      const longContent = 'A'.repeat(4000)
      const result = await service.printerPrint('printer-001', longContent)
      expect(result.success).toBe(true)
    })

    it('should work with zebra brand printer', async () => {
      service.registerDevice(createPrinterDevice({ deviceId: 'zebra-1', brand: 'zebra' }))
      await service.connect('zebra-1')

      const result = await service.printerPrint('zebra-1', 'test')
      expect(result.success).toBe(true)
    })
  })

  describe('printerPrintQR', () => {
    it('should print QR on online printer', async () => {
      service.registerDevice(createPrinterDevice())
      await service.connect('printer-001')

      const result = await service.printerPrintQR('printer-001', 'QR-DATA-001')
      expect(result.success).toBe(true)
    })

    it('should fail on offline printer', async () => {
      service.registerDevice(createPrinterDevice())

      const result = await service.printerPrintQR('printer-001', 'qr-data')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('should print long QR data', async () => {
      service.registerDevice(createPrinterDevice())
      await service.connect('printer-001')

      const longData = 'X'.repeat(2000)
      const result = await service.printerPrintQR('printer-001', longData)
      expect(result.success).toBe(true)
    })
  })

  // ── 命令历史 ───────────────────────────────────────────────────────────────

  describe('getCommandHistory', () => {
    it('should return empty array for device with no commands', () => {
      service.registerDevice(createPosDevice())
      const history = service.getCommandHistory('pos-001')
      expect(history).toEqual([])
    })

    it('should return command history after operations', async () => {
      service.registerDevice(createPosDevice())
      await service.connect('pos-001')

      await service.posTransaction('pos-001', 100, 'CNY')
      await service.posReadCard('pos-001')

      const history = service.getCommandHistory('pos-001')
      expect(history.length).toBeGreaterThanOrEqual(2)
      const actions = history.map(h => h.action)
      expect(actions).toContain('posTransaction')
      expect(actions).toContain('posReadCard')
    })

    it('should return empty array for unregistered device', () => {
      const history = service.getCommandHistory('ghost')
      expect(history).toEqual([])
    })

    it('should respect limit parameter', async () => {
      service.registerDevice(createPosDevice())
      await service.connect('pos-001')

      for (let i = 0; i < 10; i++) {
        await service.posTransaction('pos-001', i, 'CNY')
      }

      const history = service.getCommandHistory('pos-001', 3)
      expect(history.length).toBeLessThanOrEqual(3)
    })

    it('should enforce max history size', async () => {
      service.registerDevice(createPosDevice())
      await service.connect('pos-001')

      // Generate more than MAX_HISTORY (100) commands
      for (let i = 0; i < 110; i++) {
        await service.posTransaction('pos-001', i, 'CNY')
      }

      const history = service.getCommandHistory('pos-001', 200)
      expect(history.length).toBeLessThanOrEqual(100)
    })
  })

  // ── 多品牌适配器集成 ───────────────────────────────────────────────────────

  describe('brand adapter integration', () => {
    it('should work with multiple brands for POS', async () => {
      const brands: DeviceBrand[] = ['huawei', 'generic']
      for (const brand of brands) {
        const id = `pos-${brand}`
        service.registerDevice(createPosDevice({ deviceId: id, brand }))
        await service.connect(id)

        const result = await service.posTransaction(id, 100, 'CNY')
        expect(result.success).toBe(true)
      }
    })

    it('should work with epson and zebra for printing', async () => {
      const printers: Array<{ id: string; brand: DeviceBrand }> = [
        { id: 'epson-p', brand: 'epson' },
        { id: 'zebra-p', brand: 'zebra' },
      ]

      for (const p of printers) {
        service.registerDevice(createPrinterDevice({ deviceId: p.id, brand: p.brand }))
        await service.connect(p.id)

        const result = await service.printerPrint(p.id, 'test')
        expect(result.success).toBe(true)
      }
    })

    it('should handle deli scale brand for generic action', async () => {
      service.registerDevice(createPosDevice({ deviceId: 'deli-scale', brand: 'deli' }))
      await service.connect('deli-scale')

      // Deli execute on unknown action returns error
      const result = await service.posTransaction('deli-scale', 100, 'CNY')
      expect(result.success).toBe(false)
      expect(result.error).toBe('unknown_action')
    })
  })
})
