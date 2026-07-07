import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
/**
 * device-adapter.controller.spec.ts
 *
 * DeviceAdapterController 全路由 spec——覆盖路由注册、Swagger 元数据、正例+反例+边界
 */

// We use dynamic import to inspect decorator metadata
// Since the controller imports NestJS decorators, we need the module to resolve
// The test file leverages real controller instances with mocked service

import { DeviceAdapterController } from './device-adapter.controller'

// ── mock service 工厂 ──────────────────────────────────────────────────────

function createMockService() {
  return {
    registerDevice: vi.fn().mockImplementation((config: any) => ({ ...config, model: config.model ?? '' })),
    unregisterDevice: vi.fn(),
    getDevice: vi.fn().mockImplementation((id: string) => {
      if (id === 'dev-001') return { deviceId: 'dev-001', deviceType: 'pos', brand: 'huawei', connection: 'usb', timeout: 5000, retries: 3 }
      return null
    }),
    listDevices: vi.fn().mockImplementation((filters?: any) => {
      const all = [
        { deviceId: 'dev-001', deviceType: 'pos', brand: 'huawei', connection: 'usb', timeout: 5000, retries: 3 },
        { deviceId: 'dev-002', deviceType: 'gate', brand: 'generic', connection: 'wifi', timeout: 3000, retries: 2 },
      ]
      if (!filters) return all
      return all.filter(d => {
        if (filters.type && d.deviceType !== filters.type) return false
        if (filters.brand && d.brand !== filters.brand) return false
        return true
      })
    }),
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn().mockResolvedValue(undefined),
    connectAll: vi.fn().mockResolvedValue(new Map([['dev-001', true], ['dev-002', true]])),
    getStatus: vi.fn().mockReturnValue('online'),
    checkAllStatus: vi.fn().mockReturnValue(new Map([['dev-001', 'online'], ['dev-002', 'offline']])),
    heartbeat: vi.fn().mockResolvedValue(undefined),
    posTransaction: vi.fn().mockResolvedValue({ commandId: 'cmd-1', success: true, data: { transactionId: 'tx-001' }, receivedAt: new Date() }),
    posRefund: vi.fn().mockResolvedValue({ commandId: 'cmd-2', success: true, data: { refundId: 'rf-001' }, receivedAt: new Date() }),
    posReadCard: vi.fn().mockResolvedValue({ commandId: 'cmd-3', success: true, data: { cardNumber: '****1234' }, receivedAt: new Date() }),
    gateOpen: vi.fn().mockResolvedValue({ commandId: 'cmd-4', success: true, data: { gateId: 'gate-001', direction: 'in' }, receivedAt: new Date() }),
    gateGetAccessLog: vi.fn().mockResolvedValue({ commandId: 'cmd-5', success: true, data: { logs: [], count: 0 }, receivedAt: new Date() }),
    scannerScan: vi.fn().mockResolvedValue({ commandId: 'cmd-6', success: true, data: { rawData: 'SCAN123' }, receivedAt: new Date() }),
    scannerParse: vi.fn().mockImplementation((data: string) => ({ format: 'code128', value: data })),
    printerPrint: vi.fn().mockResolvedValue({ commandId: 'cmd-7', success: true, data: { jobId: 'job-001' }, receivedAt: new Date() }),
    printerPrintQR: vi.fn().mockResolvedValue({ commandId: 'cmd-8', success: true, data: { jobId: 'job-002', format: 'qr' }, receivedAt: new Date() }),
    getCommandHistory: vi.fn().mockReturnValue([]),
  }
}

// ── 路由注册与模块元数据 ──────────────────────────────────────────────────

describe('DeviceAdapterController', () => {
  describe('路由注册与模块元数据', () => {
    it('Controller 有正确的路由前缀', () => {
      const path = Reflect.getMetadata('path', DeviceAdapterController)
      expect(path).toBe('device-adapter')
    })
  })

  describe('POST /device-adapter/devices — registerDevice', () => {
    it('注册设备调用 service.registerDevice', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const dto = { deviceId: 'new-dev', deviceType: 'pos', brand: 'huawei', connection: 'usb', timeout: 5000, retries: 3 }
      ctrl.registerDevice(dto as any)

      expect(svc.registerDevice).toHaveBeenCalledTimes(1)
      expect(svc.registerDevice).toHaveBeenCalledWith(expect.objectContaining({ deviceId: 'new-dev' }))
    })

    it('已存在设备抛 409 冲突', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const dto = { deviceId: 'dev-001', deviceType: 'pos', brand: 'huawei', connection: 'usb', timeout: 5000, retries: 3 }
      expect(() => ctrl.registerDevice(dto as any)).toThrow(/设备已存在/)
    })
  })

  describe('GET /device-adapter/devices — listDevices', () => {
    it('列出所有设备 (无过滤)', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.listDevices({})
      expect(result.total).toBe(2)
      expect(svc.listDevices).toHaveBeenCalled()
    })

    it('按类型过滤设备', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      ctrl.listDevices({ type: 'gate' as any })
      expect(svc.listDevices).toHaveBeenCalled()
    })

    it('空设备列表返回 total=0', () => {
      const svc = createMockService() as any
      svc.listDevices = vi.fn().mockReturnValue([])
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.listDevices({})
      expect(result.total).toBe(0)
      expect(result.devices).toHaveLength(0)
    })
  })

  describe('GET /device-adapter/devices/:deviceId — getDevice', () => {
    it('存在设备返回详情', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.getDevice('dev-001')
      expect(result.deviceId).toBe('dev-001')
    })

    it('不存在设备抛 404', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      expect(() => ctrl.getDevice('non-existent')).toThrow(/设备未找到/)
    })
  })

  describe('DELETE /device-adapter/devices/:deviceId — unregisterDevice', () => {
    it('删除已有设备', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.unregisterDevice('dev-001')
      expect(result.success).toBe(true)
      expect(svc.unregisterDevice).toHaveBeenCalledWith('dev-001')
    })

    it('删除不存在设备抛 404', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      expect(() => ctrl.unregisterDevice('non-existent')).toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/connect — connectDevice', () => {
    it('连接已有设备', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.connectDevice('dev-001')
      expect(result.success).toBe(true)
      expect(result.status).toBe('online')
    })

    it('连接不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.connectDevice('non-existent')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/disconnect — disconnectDevice', () => {
    it('断开已有设备', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.disconnectDevice('dev-001')
      expect(result.success).toBe(true)
      expect(svc.disconnect).toHaveBeenCalledWith('dev-001')
    })

    it('断开不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.disconnectDevice('non-existent')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/connect-all — connectAll', () => {
    it('批量连接同类型设备', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.connectAll({ deviceType: 'pos' as any })
      expect(svc.connectAll).toHaveBeenCalledWith('pos')
      expect(Object.keys(result)).toHaveLength(2)
    })
  })

  describe('GET /device-adapter/devices/:deviceId/status — getDeviceStatus', () => {
    it('返回设备状态', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.getDeviceStatus('dev-001')
      expect(result.deviceId).toBe('dev-001')
      expect(result.status).toBe('online')
    })

    it('不存在设备抛 404', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      expect(() => ctrl.getDeviceStatus('non-existent')).toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/heartbeat — heartbeat', () => {
    it('心跳更新成功', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.heartbeat('dev-001')
      expect(result.success).toBe(true)
      expect(svc.heartbeat).toHaveBeenCalledWith('dev-001')
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.heartbeat('non-existent')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('GET /device-adapter/status — getAllStatus', () => {
    it('返回所有设备状态', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.getAllStatus()
      expect(svc.checkAllStatus).toHaveBeenCalled()
      expect(result['dev-001']).toBe('online')
      expect(result['dev-002']).toBe('offline')
    })

    it('无设备时返回空 map', () => {
      const svc = createMockService() as any
      svc.checkAllStatus = vi.fn().mockReturnValue(new Map())
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.getAllStatus()
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/pos/transaction — posTransaction', () => {
    it('POS 交易成功', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.posTransaction('dev-001', { amount: 100, currency: 'CNY' })
      expect(result.success).toBe(true)
      expect(svc.posTransaction).toHaveBeenCalledWith('dev-001', 100, 'CNY')
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.posTransaction('non-existent', { amount: 100, currency: 'CNY' }))
        .rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/pos/refund — posRefund', () => {
    it('POS 退款成功', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.posRefund('dev-001', { originalTransactionId: 'tx-001', amount: 50 })
      expect(result.success).toBe(true)
      expect(svc.posRefund).toHaveBeenCalledWith('dev-001', 'tx-001', 50)
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.posRefund('non-existent', { originalTransactionId: 'tx-001', amount: 50 }))
        .rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/pos/read-card — posReadCard', () => {
    it('POS 读卡成功', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.posReadCard('dev-001')
      expect(result.success).toBe(true)
      expect(svc.posReadCard).toHaveBeenCalledWith('dev-001')
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.posReadCard('non-existent')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/gate/open — gateOpen', () => {
    it('闸机开门成功', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.gateOpen('dev-001', { direction: 'in' as any })
      expect(result.success).toBe(true)
      expect(svc.gateOpen).toHaveBeenCalledWith('dev-001', 'in')
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.gateOpen('non-existent', { direction: 'in' as any }))
        .rejects.toThrow(/设备未找到/)
    })
  })

  describe('GET /device-adapter/devices/:deviceId/gate/access-log — gateAccessLog', () => {
    it('返回闸机访问日志', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.gateAccessLog('dev-001', {})
      expect(result.success).toBe(true)
      expect(svc.gateGetAccessLog).toHaveBeenCalledWith('dev-001', undefined)
    })

    it('指定 limit 参数', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await ctrl.gateAccessLog('dev-001', { limit: 50 })
      expect(svc.gateGetAccessLog).toHaveBeenCalledWith('dev-001', 50)
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.gateAccessLog('non-existent', {})).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/scanner/scan — scannerScan', () => {
    it('扫描仪扫描成功', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.scannerScan('dev-001')
      expect(result.success).toBe(true)
      expect(svc.scannerScan).toHaveBeenCalledWith('dev-001')
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.scannerScan('non-existent')).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/scanner/parse — scannerParse', () => {
    it('解析扫描数据', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.scannerParse({ data: 'BARCODE-123' })
      expect(svc.scannerParse).toHaveBeenCalledWith('BARCODE-123')
    })
  })

  describe('POST /device-adapter/devices/:deviceId/printer/print — printerPrint', () => {
    it('打印机打印成功', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.printerPrint('dev-001', { content: 'Hello World' })
      expect(result.success).toBe(true)
      expect(svc.printerPrint).toHaveBeenCalledWith('dev-001', 'Hello World')
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.printerPrint('non-existent', { content: 'test' }))
        .rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /device-adapter/devices/:deviceId/printer/print-qr — printerPrintQr', () => {
    it('打印二维码成功', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = await ctrl.printerPrintQr('dev-001', { data: 'QR-DATA' })
      expect(result.success).toBe(true)
      expect(svc.printerPrintQR).toHaveBeenCalledWith('dev-001', 'QR-DATA')
    })

    it('不存在设备抛 404', async () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      await expect(ctrl.printerPrintQr('non-existent', { data: 'test' }))
        .rejects.toThrow(/设备未找到/)
    })
  })

  describe('GET /device-adapter/devices/:deviceId/commands — getCommandHistory', () => {
    it('返回命令历史', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      const result = ctrl.getCommandHistory('dev-001', {})
      expect(Array.isArray(result)).toBe(true)
      expect(svc.getCommandHistory).toHaveBeenCalledWith('dev-001', undefined)
    })

    it('指定 limit 参数', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      ctrl.getCommandHistory('dev-001', { limit: 10 })
      expect(svc.getCommandHistory).toHaveBeenCalledWith('dev-001', 10)
    })

    it('不存在设备抛 404', () => {
      const svc = createMockService() as any
      const ctrl = new DeviceAdapterController(svc)

      expect(() => ctrl.getCommandHistory('non-existent', {})).toThrow(/设备未找到/)
    })
  })
})
