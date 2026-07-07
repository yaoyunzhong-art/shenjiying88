import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  RegisterDeviceDto,
  DeviceFilterDto,
  PosTransactionDto,
  PosRefundDto,
  PrinterPrintDto,
  PrinterPrintQrDto,
  GateOpenDto,
  GateAccessLogQueryDto,
  ScannerParseDto,
  CommandHistoryQueryDto,
  ConnectAllDto,
  DeviceResponseDto,
  DeviceListResponseDto,
  DeviceStatusResponseDto,
  ConnectionResultDto,
  ScannedDataResponseDto,
  DeviceTypeEnum,
  DeviceBrandEnum,
  DeviceStatusEnum,
  ConnectionTypeEnum,
  GateDirectionEnum,
} from './device-adapter.dto'

describe('DeviceAdapter DTOs', () => {
  // ── RegisterDeviceDto ─────────────────────────────────────────────────────

  describe('RegisterDeviceDto', () => {
    it('should validate a valid device registration', async () => {
      const dto = plainToInstance(RegisterDeviceDto, {
        deviceId: 'pos-001',
        deviceType: 'pos',
        brand: 'huawei',
        model: 'HiPay-3000',
        connection: 'usb',
        timeout: 5000,
        retries: 3,
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty deviceId', async () => {
      const dto = plainToInstance(RegisterDeviceDto, {
        deviceId: '',
        deviceType: 'pos',
        brand: 'huawei',
        connection: 'usb',
        timeout: 5000,
        retries: 3,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject invalid deviceType enum', async () => {
      const dto = plainToInstance(RegisterDeviceDto, {
        deviceId: 'dev-001',
        deviceType: 'drone',
        brand: 'huawei',
        connection: 'usb',
        timeout: 5000,
        retries: 3,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject invalid brand enum', async () => {
      const dto = plainToInstance(RegisterDeviceDto, {
        deviceId: 'dev-001',
        deviceType: 'pos',
        brand: 'apple',
        connection: 'usb',
        timeout: 5000,
        retries: 3,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject timeout below minimum', async () => {
      const dto = plainToInstance(RegisterDeviceDto, {
        deviceId: 'dev-001',
        deviceType: 'pos',
        brand: 'huawei',
        connection: 'usb',
        timeout: 50,
        retries: 3,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject timeout above maximum', async () => {
      const dto = plainToInstance(RegisterDeviceDto, {
        deviceId: 'dev-001',
        deviceType: 'pos',
        brand: 'huawei',
        connection: 'usb',
        timeout: 99999,
        retries: 3,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject negative retries', async () => {
      const dto = plainToInstance(RegisterDeviceDto, {
        deviceId: 'dev-001',
        deviceType: 'pos',
        brand: 'huawei',
        connection: 'usb',
        timeout: 5000,
        retries: -1,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept optional model field', async () => {
      const dto = plainToInstance(RegisterDeviceDto, {
        deviceId: 'dev-001',
        deviceType: 'gate',
        brand: 'generic',
        connection: 'ethernet',
        timeout: 3000,
        retries: 2,
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
      expect(dto.model).toBeUndefined()
    })

    it('should accept all device types', async () => {
      const types = Object.values(DeviceTypeEnum)
      for (const deviceType of types) {
        const dto = plainToInstance(RegisterDeviceDto, {
          deviceId: `dev-${deviceType}`,
          deviceType,
          brand: 'generic',
          connection: 'usb',
          timeout: 5000,
          retries: 3,
        })
        const errors = await validate(dto)
        expect(errors.length).toBe(0)
      }
    })

    it('should accept all connection types', async () => {
      const conns = Object.values(ConnectionTypeEnum)
      for (const connection of conns) {
        const dto = plainToInstance(RegisterDeviceDto, {
          deviceId: 'dev-conn',
          deviceType: 'pos',
          brand: 'generic',
          connection,
          timeout: 5000,
          retries: 3,
        })
        const errors = await validate(dto)
        expect(errors.length).toBe(0)
      }
    })
  })

  // ── DeviceFilterDto ──────────────────────────────────────────────────────

  describe('DeviceFilterDto', () => {
    it('should validate with all fields', async () => {
      const dto = plainToInstance(DeviceFilterDto, {
        type: 'pos',
        brand: 'huawei',
        status: 'online',
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate as empty object (all optional)', async () => {
      const dto = plainToInstance(DeviceFilterDto, {})
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject invalid type enum', async () => {
      const dto = plainToInstance(DeviceFilterDto, { type: 'invalid' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject invalid status enum', async () => {
      const dto = plainToInstance(DeviceFilterDto, { status: 'unknown' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── PosTransactionDto ────────────────────────────────────────────────────

  describe('PosTransactionDto', () => {
    it('should validate valid transaction', async () => {
      const dto = plainToInstance(PosTransactionDto, {
        amount: 100,
        currency: 'CNY',
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject negative amount', async () => {
      const dto = plainToInstance(PosTransactionDto, {
        amount: -50,
        currency: 'CNY',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject amount exceeding maximum', async () => {
      const dto = plainToInstance(PosTransactionDto, {
        amount: 99999999,
        currency: 'CNY',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject empty currency', async () => {
      const dto = plainToInstance(PosTransactionDto, {
        amount: 100,
        currency: '',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject currency longer than 3 chars', async () => {
      const dto = plainToInstance(PosTransactionDto, {
        amount: 100,
        currency: 'CNYExtra',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept minimum amount (0.01)', async () => {
      const dto = plainToInstance(PosTransactionDto, {
        amount: 0.01,
        currency: 'USD',
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  // ── PosRefundDto ─────────────────────────────────────────────────────────

  describe('PosRefundDto', () => {
    it('should validate valid refund', async () => {
      const dto = plainToInstance(PosRefundDto, {
        originalTransactionId: 'tx-001',
        amount: 50,
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty transaction id', async () => {
      const dto = plainToInstance(PosRefundDto, {
        originalTransactionId: '',
        amount: 50,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject negative refund amount', async () => {
      const dto = plainToInstance(PosRefundDto, {
        originalTransactionId: 'tx-001',
        amount: -10,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── PrinterPrintDto ──────────────────────────────────────────────────────

  describe('PrinterPrintDto', () => {
    it('should validate valid print request', async () => {
      const dto = plainToInstance(PrinterPrintDto, {
        content: 'Receipt #12345',
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty content', async () => {
      const dto = plainToInstance(PrinterPrintDto, { content: '' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject content exceeding max length (4096)', async () => {
      const dto = plainToInstance(PrinterPrintDto, {
        content: 'A'.repeat(4097),
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept content at max length (4096)', async () => {
      const dto = plainToInstance(PrinterPrintDto, {
        content: 'A'.repeat(4096),
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  // ── PrinterPrintQrDto ────────────────────────────────────────────────────

  describe('PrinterPrintQrDto', () => {
    it('should validate valid QR data', async () => {
      const dto = plainToInstance(PrinterPrintQrDto, {
        data: 'https://example.com/qr',
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty QR data', async () => {
      const dto = plainToInstance(PrinterPrintQrDto, { data: '' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject data exceeding max length', async () => {
      const dto = plainToInstance(PrinterPrintQrDto, {
        data: 'X'.repeat(2049),
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── GateOpenDto ──────────────────────────────────────────────────────────

  describe('GateOpenDto', () => {
    it('should validate in direction', async () => {
      const dto = plainToInstance(GateOpenDto, { direction: 'in' })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate out direction', async () => {
      const dto = plainToInstance(GateOpenDto, { direction: 'out' })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate both direction', async () => {
      const dto = plainToInstance(GateOpenDto, { direction: 'both' })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject invalid direction', async () => {
      const dto = plainToInstance(GateOpenDto, { direction: 'sideways' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── GateAccessLogQueryDto ────────────────────────────────────────────────

  describe('GateAccessLogQueryDto', () => {
    it('should validate without limit (optional)', async () => {
      const dto = plainToInstance(GateAccessLogQueryDto, {})
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate with valid limit', async () => {
      const dto = plainToInstance(GateAccessLogQueryDto, { limit: 50 })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject limit of 0', async () => {
      const dto = plainToInstance(GateAccessLogQueryDto, { limit: 0 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject limit exceeding maximum (1000)', async () => {
      const dto = plainToInstance(GateAccessLogQueryDto, { limit: 1001 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── ScannerParseDto ──────────────────────────────────────────────────────

  describe('ScannerParseDto', () => {
    it('should validate with data', async () => {
      const dto = plainToInstance(ScannerParseDto, { data: '6901234567890' })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty data', async () => {
      const dto = plainToInstance(ScannerParseDto, { data: '' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── CommandHistoryQueryDto ───────────────────────────────────────────────

  describe('CommandHistoryQueryDto', () => {
    it('should validate without limit', async () => {
      const dto = plainToInstance(CommandHistoryQueryDto, {})
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate with valid limit', async () => {
      const dto = plainToInstance(CommandHistoryQueryDto, { limit: 50 })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject limit of 0', async () => {
      const dto = plainToInstance(CommandHistoryQueryDto, { limit: 0 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject limit exceeding max (500)', async () => {
      const dto = plainToInstance(CommandHistoryQueryDto, { limit: 501 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── ConnectAllDto ────────────────────────────────────────────────────────

  describe('ConnectAllDto', () => {
    it('should validate valid device type', async () => {
      const types = Object.values(DeviceTypeEnum)
      for (const deviceType of types) {
        const dto = plainToInstance(ConnectAllDto, { deviceType })
        const errors = await validate(dto)
        expect(errors.length).toBe(0)
      }
    })

    it('should reject invalid device type', async () => {
      const dto = plainToInstance(ConnectAllDto, { deviceType: 'robot' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── Response DTOs ────────────────────────────────────────────────────────

  describe('DeviceResponseDto', () => {
    it('should construct from partial data', () => {
      const dto = plainToInstance(DeviceResponseDto, {
        commandId: 'cmd-001',
        success: true,
        data: { status: 'ok' },
        receivedAt: new Date().toISOString(),
      })
      expect(dto.commandId).toBe('cmd-001')
      expect(dto.success).toBe(true)
    })

    it('should allow error field', () => {
      const dto = plainToInstance(DeviceResponseDto, {
        commandId: 'cmd-002',
        success: false,
        error: 'device_offline',
        receivedAt: new Date().toISOString(),
      })
      expect(dto.success).toBe(false)
      expect(dto.error).toBe('device_offline')
    })
  })

  describe('DeviceListResponseDto', () => {
    it('should construct with devices array', () => {
      const dto = plainToInstance(DeviceListResponseDto, {
        total: 2,
        devices: [
          { deviceId: 'd1', deviceType: 'pos', brand: 'huawei', connection: 'usb', timeout: 5000, retries: 3 },
          { deviceId: 'd2', deviceType: 'gate', brand: 'generic', connection: 'wifi', timeout: 3000, retries: 2 },
        ],
      })
      expect(dto.total).toBe(2)
      expect(dto.devices).toHaveLength(2)
    })

    it('should accept empty devices array', () => {
      const dto = plainToInstance(DeviceListResponseDto, { total: 0, devices: [] })
      expect(dto.total).toBe(0)
      expect(dto.devices).toHaveLength(0)
    })
  })

  describe('DeviceStatusResponseDto', () => {
    it('should construct with status enum', () => {
      const dto = plainToInstance(DeviceStatusResponseDto, {
        deviceId: 'pos-001',
        status: 'online',
      })
      expect(dto.status).toBe('online')
    })

    it('should accept optional lastHeartbeat', () => {
      const dto = plainToInstance(DeviceStatusResponseDto, {
        deviceId: 'pos-001',
        status: 'online',
        lastHeartbeat: '2026-07-08T02:00:00Z',
      })
      expect(dto.lastHeartbeat).toBeDefined()
    })
  })

  describe('ConnectionResultDto', () => {
    it('should construct with success', () => {
      const dto = plainToInstance(ConnectionResultDto, {
        deviceId: 'pos-001',
        success: true,
        status: 'online',
        message: 'connected',
      })
      expect(dto.success).toBe(true)
      expect(dto.message).toBe('connected')
    })

    it('should construct without optional message', () => {
      const dto = plainToInstance(ConnectionResultDto, {
        deviceId: 'pos-001',
        success: false,
        status: 'offline',
      })
      expect(dto.message).toBeUndefined()
    })
  })

  describe('ScannedDataResponseDto', () => {
    it('should construct with format and value', () => {
      const dto = plainToInstance(ScannedDataResponseDto, {
        format: 'ean13',
        value: '6901234567890',
      })
      expect(dto.format).toBe('ean13')
      expect(dto.value).toBe('6901234567890')
    })

    it('should allow optional metadata', () => {
      const dto = plainToInstance(ScannedDataResponseDto, {
        format: 'qr',
        value: 'https://example.com',
        metadata: { decoded: true },
      })
      expect(dto.metadata).toEqual({ decoded: true })
    })
  })

  // ── Enum values ──────────────────────────────────────────────────────────

  describe('Enum definitions', () => {
    it('should have all device types', () => {
      const values = Object.values(DeviceTypeEnum)
      expect(values).toEqual(['pos', 'gate', 'scanner', 'printer', 'scale', 'kiosk'])
    })

    it('should have all device brands', () => {
      const values = Object.values(DeviceBrandEnum)
      expect(values).toEqual(['huawei', 'honeywell', 'zebra', 'epson', 'deli', 'generic'])
    })

    it('should have all device statuses', () => {
      const values = Object.values(DeviceStatusEnum)
      expect(values).toEqual(['online', 'offline', 'error', 'maintenance'])
    })

    it('should have all connection types', () => {
      const values = Object.values(ConnectionTypeEnum)
      expect(values).toEqual(['usb', 'serial', 'bluetooth', 'wifi', 'ethernet'])
    })

    it('should have all gate directions', () => {
      const values = Object.values(GateDirectionEnum)
      expect(values).toEqual(['in', 'out', 'both'])
    })
  })
})
