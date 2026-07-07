import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [device-adapter] [C] 角色测试
 *
 * 8 角色视角的设备适配器模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { DeviceAdapterService } from './device-adapter.service'
import type { DeviceConfig, DeviceType, DeviceBrand } from './device-adapter.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──
function createService() {
  return new DeviceAdapterService()
}

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
// 👔 店长 (StoreManager)
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.StoreManager} 店长`, () => {
  describe('设备注册与总览', () => {
    it('应能注册门店所有设备并查询总览状态', async () => {
      const service = createService()

      const pos = service.registerDevice(createPosDevice())
      const gate = service.registerDevice(createGateDevice())
      const scanner = service.registerDevice(createScannerDevice())
      const printer = service.registerDevice(createPrinterDevice())

      // 连接设备
      await service.connect(pos.deviceId)
      await service.connect(gate.deviceId)
      await service.connect(scanner.deviceId)
      await service.connect(printer.deviceId)

      const allStatuses = service.checkAllStatus()
      expect(allStatuses.size).toBe(4)
      expect(allStatuses.get('pos-001')).toBe('online')
      expect(allStatuses.get('gate-001')).toBe('online')
      expect(allStatuses.get('scanner-001')).toBe('online')
      expect(allStatuses.get('printer-001')).toBe('online')
    })

    it('应过滤门店特定类型设备', () => {
      const service = createService()
      service.registerDevice(createPosDevice({ deviceId: 'pos-1' }))
      service.registerDevice(createPosDevice({ deviceId: 'pos-2' }))
      service.registerDevice(createGateDevice({ deviceId: 'gate-1' }))
      service.registerDevice(createScannerDevice({ deviceId: 'scan-1' }))

      const posDevices = service.listDevices({ type: 'pos' as DeviceType })
      expect(posDevices).toHaveLength(2)
      expect(posDevices.every((d) => d.deviceType === 'pos')).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🛒 前台 (FrontDesk)
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.FrontDesk} 前台`, () => {
  describe('POS 收银操作', () => {
    it('应能使用在线 POS 机进行交易并打印小票', async () => {
      const service = createService()
      const device = createPosDevice()
      service.registerDevice(device)
      await service.connect(device.deviceId)

      const txnResult = await service.posTransaction(device.deviceId, 128.50, 'CNY')
      expect(txnResult.success).toBe(true)
      expect(txnResult.data).toBeDefined()
    })

    it('离线 POS 机应拒绝交易', async () => {
      const service = createService()
      const device = createPosDevice()
      service.registerDevice(device)
      // 不连接设备，保持 offline

      const result = await service.posTransaction(device.deviceId, 50, 'CNY')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('应能对已完成的交易进行退款', async () => {
      const service = createService()
      const device = createPosDevice()
      service.registerDevice(device)
      await service.connect(device.deviceId)

      const txnResult = await service.posTransaction(device.deviceId, 200, 'CNY')
      expect(txnResult.success).toBe(true)
      const transactionId = (txnResult.data as any)?.transactionId
      expect(transactionId).toBeDefined()

      const refundResult = await service.posRefund(device.deviceId, transactionId, 200)
      expect(refundResult.success).toBe(true)
      expect(refundResult.data).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 HR (HR)
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.HR} 人事`, () => {
  describe('设备操作审计日志', () => {
    it('应能查询设备的命令操作历史记录', async () => {
      const service = createService()
      const device = createPosDevice()
      service.registerDevice(device)
      await service.connect(device.deviceId)

      await service.posTransaction(device.deviceId, 99, 'CNY')
      await service.posReadCard(device.deviceId)

      const history = service.getCommandHistory(device.deviceId)
      expect(history.length).toBeGreaterThanOrEqual(2)
      // 历史记录按添加顺序，最近添加的在最后一位
      const actions = history.map((h) => h.action)
      expect(actions).toContain('posReadCard')
      expect(actions).toContain('posTransaction')
    })

    it('未注册设备的命令历史应返回空数组', () => {
      const service = createService()
      const history = service.getCommandHistory('non-existent-device')
      expect(history).toEqual([])
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 安监 (Security)
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Security} 安监`, () => {
  describe('闸机与设备安全监控', () => {
    it('应能控制闸机开门并记录出入日志', async () => {
      const service = createService()
      const gate = createGateDevice()
      service.registerDevice(gate)
      await service.connect(gate.deviceId)

      const openResult = await service.gateOpen(gate.deviceId, 'in')
      expect(openResult.success).toBe(true)
      expect(openResult.data).toBeDefined()

      const accessLog = await service.gateGetAccessLog(gate.deviceId, 10)
      expect(accessLog.success).toBe(true)
      expect((accessLog.data as any)?.logs).toBeDefined()
    })

    it('离线闸机应拒绝开门操作', async () => {
      const service = createService()
      const gate = createGateDevice()
      service.registerDevice(gate)
      // 不连接

      const result = await service.gateOpen(gate.deviceId, 'out')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 导玩员 (Guide)
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Guide} 导玩员`, () => {
  describe('扫描与打印游戏凭证', () => {
    it('应能扫描游戏兑换码并打印门票', async () => {
      const service = createService()
      const scanner = createScannerDevice()
      const printer = createPrinterDevice()
      service.registerDevice(scanner)
      service.registerDevice(printer)
      await service.connect(scanner.deviceId)
      await service.connect(printer.deviceId)

      // 模拟扫描 EAN-13
      const parsed = service.scannerParse('5901234123457')
      expect(parsed.format).toBe('ean13')

      // 打印门票
      const printResult = await service.printerPrint(printer.deviceId, `门票: ${parsed.value}`)
      expect(printResult.success).toBe(true)
    })

    it('应能解析不同格式的扫描数据', () => {
      const service = createService()
      const qrResult = service.scannerParse('https://arcade.example.com/redeem/ABC123')
      expect(qrResult.format).toBe('qr')

      const upcResult = service.scannerParse('123456789012')
      expect(upcResult.format).toBe('upc')

      const code128Result = service.scannerParse('ABC-123-XYZ')
      expect(code128Result.format).toBe('code128')
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 运行专员 (Operations)
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Operations} 运行专员`, () => {
  describe('设备运维管理', () => {
    it('应能批量连接同类型设备', async () => {
      const service = createService()
      service.registerDevice(createGateDevice({ deviceId: 'gate-A' }))
      service.registerDevice(createGateDevice({ deviceId: 'gate-B' }))
      service.registerDevice(createGateDevice({ deviceId: 'gate-C' }))

      const results = await service.connectAll('gate' as DeviceType)
      expect(results.size).toBe(3)
      for (const [, success] of results) {
        expect(success).toBe(true)
      }
      expect(service.getStatus('gate-A')).toBe('online')
      expect(service.getStatus('gate-B')).toBe('online')
      expect(service.getStatus('gate-C')).toBe('online')
    })

    it('应能断开设备并验证状态变更', async () => {
      const service = createService()
      const device = createPosDevice()
      service.registerDevice(device)
      await service.connect(device.deviceId)
      expect(service.getStatus(device.deviceId)).toBe('online')

      await service.disconnect(device.deviceId)
      expect(service.getStatus(device.deviceId)).toBe('offline')
    })

    it('心跳检测应刷新设备在线状态', async () => {
      const service = createService()
      const device = createPosDevice()
      service.registerDevice(device)
      // 不先 connect，直接心跳
      await service.heartbeat(device.deviceId)
      expect(service.getStatus(device.deviceId)).toBe('online')
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 🤝 团建 (Teambuilding)
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Teambuilding} 团建`, () => {
  describe('扫码入场与打印凭证', () => {
    it('应能扫描团建活动二维码验证入场', () => {
      const service = createService()
      const parsed = service.scannerParse('https://team-building/event/20260706/group-b')
      expect(parsed.format).toBe('qr')
      expect(parsed.value).toContain('team-building')
    })

    it('应能打印团建活动手环标签', async () => {
      const service = createService()
      const printer = createPrinterDevice()
      service.registerDevice(printer)
      await service.connect(printer.deviceId)

      const printResult = await service.printerPrintQR(printer.deviceId, 'TB-20260706-GROUP-B-001')
      expect(printResult.success).toBe(true)
      expect(printResult.data).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 📢 营销 (Marketing)
// ═══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Marketing} 营销`, () => {
  describe('营销物料打印与设备管理', () => {
    it('应能批量打印营销活动宣传物料', async () => {
      const service = createService()
      const printer = createPrinterDevice()
      service.registerDevice(printer)
      await service.connect(printer.deviceId)

      const result1 = await service.printerPrint(printer.deviceId, '新会员优惠: 充值100送50')
      expect(result1.success).toBe(true)

      const result2 = await service.printerPrintQR(printer.deviceId, 'https://promo.example.com/2026/summer')
      expect(result2.success).toBe(true)
    })

    it('未注册的设备应无法用于营销打印', async () => {
      const service = createService()
      // 未注册直接打印
      const result = await service.printerPrint('fake-printer', 'some content')
      expect(result.success).toBe(false)
      expect(result.error).toBe('device_offline')
    })

    it('应能从 POS 读取会员卡信息用于营销', async () => {
      const service = createService()
      const pos = createPosDevice()
      service.registerDevice(pos)
      await service.connect(pos.deviceId)

      const cardResult = await service.posReadCard(pos.deviceId)
      expect(cardResult.success).toBe(true)
      const cardData = cardResult.data as any
      expect(cardData.cardNumber).toBeDefined()
      // 营销人员可从卡号识别会员等级
      expect(cardData.cardNumber).toContain('1234')
    })
  })
})
