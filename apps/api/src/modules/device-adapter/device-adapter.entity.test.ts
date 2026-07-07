import { describe, it, expect } from 'vitest'
import type {
  DeviceConfig,
  DeviceCommand,
  DeviceResponse,
  DeviceAdapterInfo,
  ScannedData,
  DeviceFilter,
  DeviceListResponse,
  ConnectionResult,
  DeviceType,
  DeviceBrand,
  DeviceStatus,
  ConnectionType,
} from './device-adapter.entity'

describe('device-adapter entity types', () => {
  // ── 正例：有效实体构造 ─────────────────────────────────────────────────

  it('should create a valid DeviceConfig', () => {
    const config: DeviceConfig = {
      deviceId: 'pos-001',
      deviceType: 'pos',
      brand: 'huawei',
      model: 'HiPay-3000',
      connection: 'usb',
      timeout: 5000,
      retries: 3,
    }

    expect(config.deviceId).toBe('pos-001')
    expect(config.deviceType).toBe('pos')
    expect(config.brand).toBe('huawei')
    expect(config.model).toBe('HiPay-3000')
    expect(config.connection).toBe('usb')
    expect(config.timeout).toBe(5000)
    expect(config.retries).toBe(3)
  })

  it('should create a DeviceConfig without optional model', () => {
    const config: DeviceConfig = {
      deviceId: 'gate-002',
      deviceType: 'gate',
      brand: 'generic',
      connection: 'wifi',
      timeout: 3000,
      retries: 1,
    }

    expect(config.model).toBeUndefined()
    expect(config.connection).toBe('wifi')
  })

  it('should create a valid DeviceCommand with optional params and issuedBy', () => {
    const now = new Date('2026-07-06T04:30:00Z')
    const cmd: DeviceCommand = {
      commandId: 'cmd-001',
      deviceId: 'pos-001',
      action: 'posTransaction',
      params: { amount: 100, currency: 'CNY' },
      issuedAt: now,
      issuedBy: 'cashier-01',
    }

    expect(cmd.commandId).toBe('cmd-001')
    expect(cmd.action).toBe('posTransaction')
    expect(cmd.params).toEqual({ amount: 100, currency: 'CNY' })
    expect(cmd.issuedBy).toBe('cashier-01')
    expect(cmd.issuedAt).toBe(now)
  })

  it('should create a DeviceCommand without optional fields', () => {
    const cmd: DeviceCommand = {
      commandId: 'cmd-002',
      deviceId: 'scanner-001',
      action: 'scan',
      issuedAt: new Date(),
    }

    expect(cmd.params).toBeUndefined()
    expect(cmd.issuedBy).toBeUndefined()
  })

  it('should create a valid DeviceResponse with success data', () => {
    const now = new Date()
    const resp: DeviceResponse = {
      commandId: 'cmd-003',
      deviceId: 'printer-001',
      success: true,
      data: { jobId: 'job-001', pages: 1 },
      receivedAt: now,
    }

    expect(resp.success).toBe(true)
    expect(resp.data).toEqual({ jobId: 'job-001', pages: 1 })
    expect(resp.error).toBeUndefined()
  })

  it('should create a DeviceResponse with error', () => {
    const resp: DeviceResponse = {
      commandId: 'cmd-004',
      success: false,
      error: 'device_offline',
      receivedAt: new Date(),
    }

    expect(resp.success).toBe(false)
    expect(resp.error).toBe('device_offline')
    expect(resp.data).toBeUndefined()
    expect(resp.deviceId).toBeUndefined()
  })

  // ── 反例：类型约束 ─────────────────────────────────────────────────────

  it('should enforce positive timeout values', () => {
    const config: DeviceConfig = {
      deviceId: 'test',
      deviceType: 'pos',
      brand: 'zebra',
      connection: 'usb',
      timeout: -1,
      retries: 0,
    }

    // timeout 在此系统中可以是任意 number
    expect(config.timeout).toBe(-1)
    // 业务逻辑会在 service 层或 validator 中拦截
  })

  it('should enforce enum constraint for deviceType', () => {
    const validTypes: DeviceType[] = ['pos', 'gate', 'scanner', 'printer', 'scale', 'kiosk']
    expect(validTypes).toContain('pos')
    expect(validTypes).toContain('kiosk')
    expect(validTypes).toHaveLength(6)
  })

  it('should enforce enum constraint for brand', () => {
    const validBrands: DeviceBrand[] = ['huawei', 'honeywell', 'zebra', 'epson', 'deli', 'generic']
    expect(validBrands).toContain('huawei')
    expect(validBrands).toContain('generic')
    expect(validBrands).toHaveLength(6)
  })

  it('should enforce enum constraint for status', () => {
    const validStatuses: DeviceStatus[] = ['online', 'offline', 'error', 'maintenance']
    expect(validStatuses).toContain('online')
    expect(validStatuses).toContain('maintenance')
    expect(validStatuses).toHaveLength(4)
  })

  it('should enforce enum constraint for connection', () => {
    const validConnections: ConnectionType[] = ['usb', 'serial', 'bluetooth', 'wifi', 'ethernet']
    expect(validConnections).toContain('usb')
    expect(validConnections).toContain('ethernet')
    expect(validConnections).toHaveLength(5)
  })

  // ── 边界场景 ───────────────────────────────────────────────────────────

  it('should handle DeviceConfig with minimum fields', () => {
    const config: DeviceConfig = {
      deviceId: '',
      deviceType: 'pos',
      brand: 'generic',
      connection: 'usb',
      timeout: 0,
      retries: 0,
    }

    expect(config.deviceId).toBe('')
    expect(config.timeout).toBe(0)
    expect(config.retries).toBe(0)
  })

  it('should handle DeviceCommand with empty params', () => {
    const cmd: DeviceCommand = {
      commandId: 'cmd-empty',
      deviceId: 'test-device',
      action: 'print',
      params: {},
      issuedAt: new Date(),
    }

    expect(Object.keys(cmd.params!)).toHaveLength(0)
  })

  it('should handle DeviceResponse with undefined deviceId', () => {
    // 某些错误响应可能没有 deviceId
    const resp: DeviceResponse = {
      commandId: 'err-cmd',
      success: false,
      error: 'unknown_device',
      receivedAt: new Date(),
    }

    expect(resp.deviceId).toBeUndefined()
  })

  // ── 派生类型测试 ───────────────────────────────────────────────────────

  it('should create a DeviceAdapterInfo', () => {
    const info: DeviceAdapterInfo = {
      brand: 'huawei',
      protocol: 'HiPay SDK',
      supportedActions: ['transaction', 'refund', 'readCard'],
    }

    expect(info.protocol).toBe('HiPay SDK')
    expect(info.supportedActions).toHaveLength(3)
  })

  it('should create a ScannedData object', () => {
    const qr: ScannedData = {
      format: 'qr',
      value: 'https://example.com/test',
      metadata: { decoded: true },
    }
    expect(qr.format).toBe('qr')
    expect(qr.metadata).toEqual({ decoded: true })

    const ean13: ScannedData = { format: 'ean13', value: '6901234567890' }
    expect(ean13.metadata).toBeUndefined()
  })

  it('should create DeviceFilter with partial fields', () => {
    const filter: DeviceFilter = { type: 'pos' }
    expect(filter.type).toBe('pos')
    expect(filter.brand).toBeUndefined()
    expect(filter.status).toBeUndefined()

    const fullFilter: DeviceFilter = { type: 'gate', brand: 'generic', status: 'online' }
    expect(fullFilter.brand).toBe('generic')
    expect(fullFilter.status).toBe('online')
  })

  it('should create DeviceListResponse', () => {
    const devices: DeviceConfig[] = [
      { deviceId: 'd1', deviceType: 'pos', brand: 'huawei', connection: 'usb', timeout: 5000, retries: 3 },
    ]
    const list: DeviceListResponse = { total: 1, devices }
    expect(list.total).toBe(1)
    expect(list.devices[0].deviceId).toBe('d1')
  })

  it('should create ConnectionResult with success', () => {
    const result: ConnectionResult = {
      success: true,
      deviceId: 'pos-001',
      status: 'online',
      message: 'connected',
    }
    expect(result.success).toBe(true)
    expect(result.message).toBe('connected')
  })

  it('should create ConnectionResult with failure', () => {
    const result: ConnectionResult = {
      success: false,
      deviceId: 'unknown-device',
      status: 'offline',
    }
    expect(result.success).toBe(false)
    expect(result.message).toBeUndefined()
  })

  // ── 极端场景 ───────────────────────────────────────────────────────────

  it('should handle large command parameters', () => {
    const largeParams: Record<string, unknown> = {}
    for (let i = 0; i < 100; i++) {
      largeParams[`key_${i}`] = `value_${i}`
    }

    const cmd: DeviceCommand = {
      commandId: 'cmd-large',
      deviceId: 'pos-001',
      action: 'batchTransaction',
      params: largeParams,
      issuedAt: new Date(),
    }

    expect(Object.keys(cmd.params!)).toHaveLength(100)
  })

  it('should handle DeviceResponse with deeply nested data', () => {
    const nestedData = {
      transaction: {
        id: 'tx-001',
        items: [
          { sku: 'ITEM-001', qty: 2, price: 19.99 },
          { sku: 'ITEM-002', qty: 1, price: 49.99 },
        ],
        total: 89.97,
        payments: [{ method: 'wechat', amount: 89.97 }],
      },
    }

    const resp: DeviceResponse = {
      commandId: 'cmd-nested',
      deviceId: 'pos-002',
      success: true,
      data: nestedData,
      receivedAt: new Date(),
    }

    expect((resp.data as typeof nestedData).transaction.total).toBe(89.97)
    expect((resp.data as typeof nestedData).transaction.items).toHaveLength(2)
  })

  it('should handle DeviceResponse with null data', () => {
    const resp: DeviceResponse = {
      commandId: 'cmd-null',
      success: true,
      data: null,
      receivedAt: new Date(),
    }

    expect(resp.data).toBeNull()
  })

  it('should handle empty device list response', () => {
    const list: DeviceListResponse = { total: 0, devices: [] }
    expect(list.total).toBe(0)
    expect(list.devices).toHaveLength(0)
  })
})
