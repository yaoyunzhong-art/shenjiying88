import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { DeviceAdapterController } from './device-adapter.controller'
import { DeviceAdapterService } from './device-adapter.service'
import type { DeviceConfig, DeviceResponse, DeviceCommand } from './device-adapter.entity'
import { DeviceTypeEnum, GateDirectionEnum } from './device-adapter.dto'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function createMockResponse(overrides?: Partial<DeviceResponse>): DeviceResponse {
  return {
    commandId: 'mock-cmd-001',
    success: true,
    data: { status: 'ok' },
    receivedAt: new Date(),
    ...overrides,
  }
}

// ── Setup ────────────────────────────────────────────────────────────────────

describe('DeviceAdapterController', () => {
  let controller: DeviceAdapterController
  let service: DeviceAdapterService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceAdapterController],
      providers: [DeviceAdapterService],
    }).compile()

    controller = module.get<DeviceAdapterController>(DeviceAdapterController)
    service = module.get<DeviceAdapterService>(DeviceAdapterService)
  })

  // ── 设备注册管理 ───────────────────────────────────────────────────────────

  describe('POST /device-adapter/devices', () => {
    it('should register a new device', () => {
      const dto = {
        deviceId: 'pos-001',
        deviceType: 'pos' as const,
        brand: 'huawei' as const,
        model: 'HiPay-3000',
        connection: 'usb' as const,
        timeout: 5000,
        retries: 3,
      }

      const result = controller.registerDevice(dto as any)

      expect(result.deviceId).toBe('pos-001')
      expect(result.deviceType).toBe('pos')
      // Verify it's stored
      expect(service.getDevice('pos-001')).not.toBeNull()
    })

    it('should throw 409 when device already exists', () => {
      const dto = {
        deviceId: 'dup-device',
        deviceType: 'pos' as const,
        brand: 'huawei' as const,
        connection: 'usb' as const,
        timeout: 5000,
        retries: 3,
      }
      controller.registerDevice(dto as any)

      expect(() => controller.registerDevice(dto as any)).toThrow(/设备已存在/)
    })
  })

  describe('GET /device-adapter/devices', () => {
    it('should list all registered devices', () => {
      const d1 = createTestDevice({ deviceId: 'd1', deviceType: 'pos' })
      const d2 = createTestDevice({ deviceId: 'd2', deviceType: 'gate', brand: 'generic' })
      service.registerDevice(d1)
      service.registerDevice(d2)

      const result = controller.listDevices({})

      expect(result.total).toBe(2)
      expect(result.devices).toHaveLength(2)
    })

    it('should return empty list when no devices', () => {
      const result = controller.listDevices({})
      expect(result.total).toBe(0)
      expect(result.devices).toHaveLength(0)
    })
  })

  describe('GET /device-adapter/devices/:deviceId', () => {
    it('should get a device by id', () => {
      const device = createTestDevice()
      service.registerDevice(device)

      const result = controller.getDevice('test-device-001')

      expect(result.deviceId).toBe('test-device-001')
    })

    it('should throw 404 for non-existent device', () => {
      expect(() => controller.getDevice('non-existent')).toThrow(/设备未找到/)
    })
  })

  describe('DELETE /device-adapter/devices/:deviceId', () => {
    it('should unregister a device', () => {
      service.registerDevice(createTestDevice())

      const result = controller.unregisterDevice('test-device-001')

      expect(result.success).toBe(true)
      expect(service.getDevice('test-device-001')).toBeNull()
    })

    it('should throw 404 for non-existent device on delete', () => {
      expect(() => controller.unregisterDevice('non-existent')).toThrow(/设备未找到/)
    })
  })

  // ── 连接管理 ───────────────────────────────────────────────────────────────

  describe('POST /device-adapter/devices/:deviceId/connect', () => {
    it('should connect an existing device', async () => {
      service.registerDevice(createTestDevice())

      const result = await controller.connectDevice('test-device-001')

      expect(result.success).toBe(true)
      expect(result.status).toBe('online')
    })

    it('should throw 404 connecting non-existent device', async () => {
      await expect(controller.connectDevice('unknown')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/disconnect', () => {
    it('should disconnect an online device', async () => {
      service.registerDevice(createTestDevice())
      await service.connect('test-device-001')

      const result = await controller.disconnectDevice('test-device-001')

      expect(result.success).toBe(true)
    })

    it('should throw 404 for disconnected non-existent device', async () => {
      await expect(controller.disconnectDevice('unknown')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/connect-all', () => {
    it('should connect all devices of a given type', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pos-1', deviceType: 'pos' }))
      service.registerDevice(createTestDevice({ deviceId: 'pos-2', deviceType: 'pos' }))
      service.registerDevice(createTestDevice({ deviceId: 'gate-1', deviceType: 'gate' }))

      const result = await controller.connectAll({ deviceType: DeviceTypeEnum.POS })

      expect(Object.keys(result)).toHaveLength(2)
      expect(result['pos-1']).toBe(true)
      expect(result['pos-2']).toBe(true)
    })
  })

  // ── 设备状态 ───────────────────────────────────────────────────────────────

  describe('GET /device-adapter/devices/:deviceId/status', () => {
    it('should return device status', () => {
      service.registerDevice(createTestDevice())

      const result = controller.getDeviceStatus('test-device-001')

      expect(result.deviceId).toBe('test-device-001')
      expect(result.status).toBe('offline') // default after register
    })

    it('should throw 404 for unknown device', () => {
      expect(() => controller.getDeviceStatus('unknown')).toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/heartbeat', () => {
    it('should update heartbeat', async () => {
      service.registerDevice(createTestDevice())

      const result = await controller.heartbeat('test-device-001')

      expect(result.success).toBe(true)
    })

    it('should throw 404 for unknown device', async () => {
      await expect(controller.heartbeat('unknown')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('GET /device-adapter/status', () => {
    it('should return all device statuses', () => {
      service.registerDevice(createTestDevice({ deviceId: 'd1' }))
      service.registerDevice(createTestDevice({ deviceId: 'd2' }))

      const result = controller.getAllStatus()

      expect(result['d1']).toBe('offline')
      expect(result['d2']).toBe('offline')
    })

    it('should return empty map when no devices', () => {
      const result = controller.getAllStatus()
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  // ── POS 操作 ───────────────────────────────────────────────────────────────

  describe('POST /device-adapter/devices/:deviceId/pos/transaction', () => {
    it('should process a POS transaction', async () => {
      service.registerDevice(createTestDevice())
      await service.connect('test-device-001')

      const result = await controller.posTransaction('test-device-001', { amount: 100, currency: 'CNY' })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should throw 404 for unknown device', async () => {
      await expect(
        controller.posTransaction('unknown', { amount: 100, currency: 'CNY' }),
      ).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/pos/refund', () => {
    it('should process a POS refund', async () => {
      service.registerDevice(createTestDevice())
      await service.connect('test-device-001')

      const result = await controller.posRefund('test-device-001', {
        originalTransactionId: 'tx-001',
        amount: 50,
      })

      expect(result.success).toBe(true)
    })

    it('should throw 404 for unknown device', async () => {
      await expect(
        controller.posRefund('unknown', { originalTransactionId: 'tx-001', amount: 50 }),
      ).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/pos/read-card', () => {
    it('should read card from online POS', async () => {
      service.registerDevice(createTestDevice())
      await service.connect('test-device-001')

      const result = await controller.posReadCard('test-device-001')

      expect(result.success).toBe(true)
    })

    it('should throw 404 for unknown device', async () => {
      await expect(controller.posReadCard('unknown')).rejects.toThrow(/设备未找到/)
    })
  })

  // ── 闸机操作 ───────────────────────────────────────────────────────────────

  describe('POST /device-adapter/devices/:deviceId/gate/open', () => {
    it('should open gate', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-001', deviceType: 'gate', brand: 'generic' }))
      await service.connect('gate-001')

      const result = await controller.gateOpen('gate-001', { direction: GateDirectionEnum.IN })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should throw 404 for unknown gate', async () => {
      await expect(controller.gateOpen('unknown', { direction: GateDirectionEnum.IN })).rejects.toThrow(/设备未找到/)
    })
  })

  describe('GET /device-adapter/devices/:deviceId/gate/access-log', () => {
    it('should return access logs', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'gate-001', deviceType: 'gate', brand: 'generic' }))
      await service.connect('gate-001')

      const result = await controller.gateAccessLog('gate-001', {})

      expect(result.success).toBe(true)
    })

    it('should throw 404 for unknown gate', async () => {
      await expect(controller.gateAccessLog('unknown', {})).rejects.toThrow(/设备未找到/)
    })
  })

  // ── 扫描仪操作 ─────────────────────────────────────────────────────────────

  describe('POST /device-adapter/devices/:deviceId/scanner/scan', () => {
    it('should scan with online device', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'sc-001', deviceType: 'scanner', brand: 'honeywell' }))
      await service.connect('sc-001')

      const result = await controller.scannerScan('sc-001')

      expect(result.success).toBe(true)
    })

    it('should throw 404 for unknown scanner', async () => {
      await expect(controller.scannerScan('unknown')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/scanner/parse', () => {
    it('should parse barcode data as code128', () => {
      const result = controller.scannerParse({ data: 'TEST-BARCODE-001' })
      expect(result.format).toBe('code128')
      expect(result.value).toBe('TEST-BARCODE-001')
    })

    it('should parse EAN-13 format', () => {
      const result = controller.scannerParse({ data: '6901234567890' })
      expect(result.format).toBe('ean13')
    })

    it('should parse URL as QR format', () => {
      const result = controller.scannerParse({ data: 'https://example.com' })
      expect(result.format).toBe('qr')
    })

    it('should parse UPC format', () => {
      const result = controller.scannerParse({ data: '123456789012' })
      expect(result.format).toBe('upc')
    })
  })

  // ── 打印机操作 ─────────────────────────────────────────────────────────────

  describe('POST /device-adapter/devices/:deviceId/printer/print', () => {
    it('should print content on online printer', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pr-001', deviceType: 'printer', brand: 'zebra' }))
      await service.connect('pr-001')

      const result = await controller.printerPrint('pr-001', { content: 'Receipt #12345' })

      expect(result.success).toBe(true)
    })

    it('should throw 404 for unknown printer', async () => {
      await expect(
        controller.printerPrint('unknown', { content: 'test' }),
      ).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/printer/print-qr', () => {
    it('should print QR code on online printer', async () => {
      service.registerDevice(createTestDevice({ deviceId: 'pr-002', deviceType: 'printer', brand: 'epson' }))
      await service.connect('pr-002')

      const result = await controller.printerPrintQr('pr-002', { data: 'QR-DATA-001' })

      expect(result.success).toBe(true)
    })

    it('should throw 404 for unknown printer', async () => {
      await expect(
        controller.printerPrintQr('unknown', { data: 'test' }),
      ).rejects.toThrow(/设备未找到/)
    })
  })

  // ── 命令历史 ───────────────────────────────────────────────────────────────

  describe('GET /device-adapter/devices/:deviceId/commands', () => {
    it('should return command history', () => {
      service.registerDevice(createTestDevice())

      const result = controller.getCommandHistory('test-device-001', {})

      expect(Array.isArray(result)).toBe(true)
    })

    it('should throw 404 for unknown device', () => {
      expect(() => controller.getCommandHistory('unknown', {})).toThrow(/设备未找到/)
    })
  })
})
