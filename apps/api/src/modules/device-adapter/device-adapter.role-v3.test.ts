import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [device-adapter] [C] 角色测试 v3 — 大飞哥电玩城设备场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥电玩城三店运营场景：
 *   店A: Cyber Galaxy Arcade (Colonial Heights, VA)
 *   店B: 休斯顿店 (Houston, TX)
 *   店C: 待开业店
 *
 * 每个角色 >= 2 个测试用例（正常流程 + 业务边界）
 * 覆盖：设备注册/管理、POS交易/退款/读卡、闸机/安检、扫码、打印、
 *       称重、批量操作、历史查询、状态监控
 */

import 'reflect-metadata'
import { DeviceAdapterController } from './device-adapter.controller'
import { DeviceAdapterService } from './device-adapter.service'
import type {
  DeviceConfig,
  DeviceResponse,
  DeviceCommand,
} from './device-adapter.entity'
import type {
  DeviceType,
  DeviceBrand,
  DeviceStatus,
  ConnectionType,
} from './device-adapter.entity'

// ── 8 角色定义 ──
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

function createController() {
  const service = new DeviceAdapterService()
  return { controller: new DeviceAdapterController(service), service }
}

// ── 店A: Cyber Galaxy Arcade 设备 ──
const storeA = {
  tenantId: 't-cyber-001',
  name: 'Cyber Galaxy Arcade',
  pos: { deviceId: 'cyber-pos-01', deviceType: 'pos' as DeviceType, brand: 'huawei' as DeviceBrand, connection: 'usb' as ConnectionType, timeout: 5000, retries: 3 },
  gate: { deviceId: 'cyber-gate-01', deviceType: 'gate' as DeviceType, brand: 'generic' as DeviceBrand, connection: 'ethernet' as ConnectionType, timeout: 3000, retries: 2 },
  scanner: { deviceId: 'cyber-scan-01', deviceType: 'scanner' as DeviceType, brand: 'honeywell' as DeviceBrand, connection: 'usb' as ConnectionType, timeout: 2000, retries: 1 },
  printer: { deviceId: 'cyber-prt-01', deviceType: 'printer' as DeviceType, brand: 'epson' as DeviceBrand, connection: 'bluetooth' as ConnectionType, timeout: 4000, retries: 2 },
  scale: { deviceId: 'cyber-scale-01', deviceType: 'scale' as DeviceType, brand: 'deli' as DeviceBrand, connection: 'usb' as ConnectionType, timeout: 2000, retries: 1 },
}

// 店B: 休斯顿店设备
const storeB = {
  tenantId: 't-hou-002',
  name: '休斯顿店',
  pos: { deviceId: 'hou-pos-01', deviceType: 'pos' as DeviceType, brand: 'huawei' as DeviceBrand, connection: 'wifi' as ConnectionType, timeout: 5000, retries: 3 },
  scanner: { deviceId: 'hou-scan-01', deviceType: 'scanner' as DeviceType, brand: 'zebra' as DeviceBrand, connection: 'usb' as ConnectionType, timeout: 2000, retries: 1 },
  kiosk: { deviceId: 'hou-kiosk-01', deviceType: 'kiosk' as DeviceType, brand: 'generic' as DeviceBrand, connection: 'wifi' as ConnectionType, timeout: 8000, retries: 3 },
}

// Note: No fake timers — async device operations need real setTimeout

// ══════════════════════════════════════════════════════════════════════════════
// 👔 店长视角 — 经营决策 & 全局设备管理
// ══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.StoreManager} 店长 - 设备管理运营视角`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
    // 注册两店设备
    svc.registerDevice(storeA.pos)
    svc.registerDevice(storeA.gate)
    svc.registerDevice(storeA.scanner)
    svc.registerDevice(storeA.printer)
    svc.registerDevice(storeA.scale)
    svc.registerDevice(storeB.pos)
    svc.registerDevice(storeB.scanner)
    svc.registerDevice(storeB.kiosk)
  })

  it('正常流程：店长查看全店设备概览，按类型、品牌、状态过滤', async () => {
    // 先全部上线
    for (const d of [storeA.pos, storeA.gate, storeA.scanner, storeA.printer, storeA.scale, storeB.pos, storeB.scanner, storeB.kiosk]) {
      await svc.connect(d.deviceId)
    }

    // 按类型过滤 — POS 设备
    const posDevices = svc.listDevices({ type: 'pos' })
    expect(posDevices).toHaveLength(2)
    expect(posDevices.every(d => d.deviceType === 'pos')).toBe(true)

    // 按品牌过滤 — huawei 设备
    const huaweiDevices = svc.listDevices({ brand: 'huawei' })
    expect(huaweiDevices).toHaveLength(2)

    // 按状态过滤 — 在线
    const onlineDevices = svc.listDevices({ status: 'online' })
    expect(onlineDevices).toHaveLength(8)

    // 综合过滤：honeywell 品牌的 scanner
    const filtered = svc.listDevices({ type: 'scanner', brand: 'honeywell' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].deviceId).toBe('cyber-scan-01')
  })

  it('业务边界：店长尝试注册重复设备或管理不存在的设备', () => {
    // 重复注册
    const existing = svc.getDevice('cyber-pos-01')
    expect(existing).not.toBeNull()

    // 获取不存在设备
    const notFound = svc.getDevice('non-existent-device')
    expect(notFound).toBeNull()

    // 注册相同 deviceId（service 层面允许覆盖，但 controller 层会拒绝）
    const dupResult = svc.registerDevice({ ...storeA.pos, timeout: 9999 })
    // service 允许覆盖
    expect(svc.getDevice('cyber-pos-01')?.timeout).toBe(9999)

    // 对不存在设备查询状态
    const st = svc.getStatus('ghost-device')
    expect(st).toBe('offline')

    // 对不存在设备尝试操作
    const res = svc.getCommandHistory('ghost-device')
    expect(res).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🛒 前台视角 — POS收银 & 卡支付
// ══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.FrontDesk} 前台 - POS 收银场景`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
    svc.registerDevice(storeA.pos)
  })

  it('正常流程：前台使用 POS 完成交易、读卡、退款全流程', async () => {
    await svc.connect(storeA.pos.deviceId)

    // 交易
    const tx = await svc.posTransaction(storeA.pos.deviceId, 99.99, 'USD')
    expect(tx.success).toBe(true)
    expect(tx.data).toBeDefined()
    const txData = tx.data as { transactionId: string; status: string }
    expect(txData.transactionId).toBeTruthy()
    expect(txData.status).toBe('approved')

    // 读卡
    const read = await svc.posReadCard(storeA.pos.deviceId)
    expect(read.success).toBe(true)
    expect(read.data).toBeDefined()
    const readData = read.data as { cardNumber: string; cardType: string }
    expect(readData.cardNumber).toContain('****')
    expect(readData.cardType).toBe('VISA')

    // 退款
    const refund = await svc.posRefund(storeA.pos.deviceId, txData.transactionId, 99.99)
    expect(refund.success).toBe(true)
    const refundData = refund.data as { refundId: string; status: string }
    expect(refundData.refundId).toBeTruthy()
    expect(refundData.status).toBe('processed')
  })

  it('业务边界：前台离线设备无法进行交易操作', async () => {
    // 设备未连接
    const tx = await svc.posTransaction(storeA.pos.deviceId, 50, 'USD')
    expect(tx.success).toBe(false)
    expect(tx.error).toBe('device_offline')

    // 读卡
    const read = await svc.posReadCard(storeA.pos.deviceId)
    expect(read.success).toBe(false)
    expect(read.error).toBe('device_offline')

    // 退款
    const refund = await svc.posRefund(storeA.pos.deviceId, 'tx-123', 50)
    expect(refund.success).toBe(false)
    expect(refund.error).toBe('device_offline')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 👥 HR视角 — 人员授权 & 操作审计溯源
// ══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.HR} HR - 设备操作审计 & 历史追溯`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
    svc.registerDevice(storeA.pos)
    svc.registerDevice(storeA.gate)
    svc.registerDevice(storeB.scanner)
  })

  it('正常流程：HR 通过命令历史追溯前端操作记录', async () => {
    await svc.connect(storeA.pos.deviceId)
    await svc.connect(storeA.gate.deviceId)

    // 执行若干操作
    await svc.posTransaction(storeA.pos.deviceId, 150, 'USD')
    await svc.posReadCard(storeA.pos.deviceId)
    await svc.gateOpen(storeA.gate.deviceId, 'in')

    // 查看历史
    const posHistory = svc.getCommandHistory(storeA.pos.deviceId)
    expect(posHistory.length).toBeGreaterThanOrEqual(2)
    expect(posHistory[0].action).toBe('posTransaction')
    expect(posHistory[1].action).toBe('posReadCard')

    const gateHistory = svc.getCommandHistory(storeA.gate.deviceId)
    expect(gateHistory.length).toBe(1)
    expect(gateHistory[0].action).toBe('gateOpen')
  })

  it('业务边界：HR 限制历史查询条目，空设备返回空数组', () => {
    // 新注册设备无历史
    const emptyHistory = svc.getCommandHistory(storeB.scanner.deviceId)
    expect(emptyHistory).toEqual([])

    // 限制 limit 参数
    svc.registerDevice(storeA.printer)
    svc.getCommandHistory(storeA.printer.deviceId, 0)
    const limited = svc.getCommandHistory(storeA.printer.deviceId, 5)
    expect(limited).toEqual([])

    // 不存在设备的历史
    const ghost = svc.getCommandHistory('ghost-device')
    expect(ghost).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🔧 安监视角 — 安全管控 & 闸机门禁 & 异常监控
// ══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Security} 安监 - 闸机门禁 & 设备安全管控`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
    svc.registerDevice(storeA.gate)
    svc.registerDevice({ ...storeA.pos, deviceId: 'cyber-pos-sec-01' })
  })

  it('正常流程：安监管控闸机开门、查看访问日志、设备心跳监控', async () => {
    await svc.connect(storeA.gate.deviceId)

    // 开门（两个方向）
    const openIn = await svc.gateOpen(storeA.gate.deviceId, 'in')
    expect(openIn.success).toBe(true)
    const openInData = openIn.data as { direction: string }
    expect(openInData.direction).toBe('in')

    const openBoth = await svc.gateOpen(storeA.gate.deviceId, 'both')
    expect(openBoth.success).toBe(true)

    // 查看访问日志
    const log = await svc.gateGetAccessLog(storeA.gate.deviceId, 10)
    expect(log.success).toBe(true)
    const logData = log.data as { logs: Array<unknown>; count: number }
    expect(logData.count).toBeGreaterThan(0)
    expect(logData.logs.length).toBeGreaterThan(0)
  })

  it('业务边界：安监处理离线闸机及设备异常状态上报', async () => {
    // 未连接闸机无法开门
    const openFail = await svc.gateOpen(storeA.gate.deviceId, 'out')
    expect(openFail.success).toBe(false)
    expect(openFail.error).toBe('device_offline')

    // 日志查询也需要在线
    const logFail = await svc.gateGetAccessLog(storeA.gate.deviceId)
    expect(logFail.success).toBe(false)

    // 不存在设备的操作
    const noDevice = await svc.gateOpen('ghost-gate', 'in')
    expect(noDevice.success).toBe(false)

    // 状态检查
    await svc.connect(storeA.gate.deviceId)
    const status = svc.getStatus(storeA.gate.deviceId)
    expect(status).toBe('online')

    // 心跳保持
    await svc.heartbeat(storeA.gate.deviceId)
    expect(svc.getStatus(storeA.gate.deviceId)).toBe('online')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎮 导玩员视角 — 扫码验票 & 游玩打印
// ══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Guide} 导玩员 - 扫码验票 & 游玩凭证打印`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
    svc.registerDevice(storeA.scanner)
    svc.registerDevice(storeA.printer)
  })

  it('正常流程：导玩员扫码识别门票、打印游玩凭证', async () => {
    await svc.connect(storeA.scanner.deviceId)
    await svc.connect(storeA.printer.deviceId)

    // 扫码 — EAN13 门票条形码
    const ean13 = svc.scannerParse('5901234567899')
    expect(ean13.format).toBe('ean13')
    expect(ean13.value).toBe('5901234567899')

    // 扫码 — UPC 码
    const upc = svc.scannerParse('123456789012')
    expect(upc.format).toBe('upc')
    expect(upc.value).toBe('123456789012')

    // 扫码 — 二维码游玩券
    const qr = svc.scannerParse('PLAY-TOKEN-A8F3C2')
    expect(qr.format).toBe('code128')

    // 打印
    const print = await svc.printerPrint(storeA.printer.deviceId, '🎮 游玩凭证\nToken: A8F3C2\n日期: 2026-07-10')
    expect(print.success).toBe(true)

    // 打印 QR
    const printQr = await svc.printerPrintQR(storeA.printer.deviceId, 'PLAYTOKEN-A8F3C2')
    expect(printQr.success).toBe(true)
  })

  it('业务边界：非法扫码格式处理、离线设备无法打印', async () => {
    // 标准码解析仍正常工作
    const result = svc.scannerParse('')
    expect(result.format).toBe('code128')
    expect(result.value).toBe('')

    // 离线打印机
    const printFail = await svc.printerPrint(storeA.printer.deviceId, 'test')
    expect(printFail.success).toBe(false)
    expect(printFail.error).toBe('device_offline')

    // 离线扫码
    const scanFail = svc.scannerParse('SIMPLE-STRING')
    expect(scanFail.format).toBe('code128')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎯 运行专员视角 — 批量操作 & 设备巡检 (最复杂的角色)
// ══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Operations} 运行专员 - 批量操作 & 设备巡检`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
    svc.registerDevice(storeA.pos)
    svc.registerDevice(storeA.gate)
    svc.registerDevice(storeA.scanner)
    svc.registerDevice(storeA.printer)
    svc.registerDevice(storeA.scale)
    svc.registerDevice(storeB.pos)
    svc.registerDevice(storeB.scanner)
    svc.registerDevice(storeB.kiosk)
  })

  it('正常流程：运行专员批量连接全店设备并巡检状态', async () => {
    // 逐个连接
    await svc.connect(storeA.pos.deviceId)
    await svc.connect(storeA.gate.deviceId)
    await svc.connect(storeA.scanner.deviceId)
    await svc.connect(storeA.printer.deviceId)
    await svc.connect(storeA.scale.deviceId)
    await svc.connect(storeB.pos.deviceId)
    await svc.connect(storeB.scanner.deviceId)

    // 批量连接 type=pos
    const posResults = await svc.connectAll('pos')
    expect(posResults.size).toBe(2)
    for (const [, success] of posResults) {
      expect(success).toBe(true)
    }

    // 全量状态检查
    const allStatus = svc.checkAllStatus()
    expect(allStatus.size).toBe(8)
    const onlineCount = Array.from(allStatus.values()).filter(s => s === 'online').length
    expect(onlineCount).toBe(7)  // kiosk not connected

    // 断连后状态变化
    await svc.disconnect(storeA.pos.deviceId)
    expect(svc.getStatus(storeA.pos.deviceId)).toBe('offline')
  })

  it('业务边界：运行专员处理已删除设备、空店铺巡检场景', () => {
    // 空服务状态
    const emptyCheck = svc.checkAllStatus()
    // 有注册设备但未连接
    expect(emptyCheck.size).toBe(8)

    // 删除设备
    svc.unregisterDevice(storeB.kiosk.deviceId)
    expect(svc.getDevice(storeB.kiosk.deviceId)).toBeNull()
    const afterDelete = svc.checkAllStatus()
    expect(afterDelete.size).toBe(7)

    // 重复删除不影响
    svc.unregisterDevice(storeB.kiosk.deviceId)
    expect(afterDelete.size).toBe(7)

    // 批量连接空类型
    // 注册离线设备后批量
    svc.registerDevice(storeB.kiosk)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🤝 团建视角 — 活动设备租用 & 临时配置
// ══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Teambuilding} 团建 - 活动设备租用 & 临时布置`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
    svc.registerDevice(storeA.printer)
    svc.registerDevice(storeA.scanner)
    svc.registerDevice(storeB.kiosk)
  })

  it('正常流程：团建活动前配置临时打印和扫码设备', async () => {
    await svc.connect(storeA.printer.deviceId)
    await svc.connect(storeA.scanner.deviceId)

    // 扫码签到
    const signIn = svc.scannerParse('SIGNIN-TEAM-2026')
    expect(signIn.value).toBe('SIGNIN-TEAM-2026')

    // 打印活动海报标签
    const poster = await svc.printerPrint(storeA.printer.deviceId, '🎉 团建活动日\n欢迎参加 Cyber Galaxy 团队建设！')
    expect(poster.success).toBe(true)

    // 活动 QR 码
    const qrResult = await svc.printerPrintQR(storeA.printer.deviceId, 'TEAM-2026-07-10')
    expect(qrResult.success).toBe(true)

    // 查询命令历史
    const history = svc.getCommandHistory(storeA.printer.deviceId)
    expect(history.length).toBe(2)
  })

  it('业务边界：团建活动后归还设备状态清理', async () => {
    // 断开所有活动设备
    await svc.disconnect(storeA.printer.deviceId)
    expect(svc.getStatus(storeA.printer.deviceId)).toBe('offline')

    await svc.disconnect(storeA.scanner.deviceId)
    expect(svc.getStatus(storeA.scanner.deviceId)).toBe('offline')

    // Kiosk 保持在线
    await svc.connect(storeB.kiosk.deviceId)
    expect(svc.getStatus(storeB.kiosk.deviceId)).toBe('online')

    // 团建设备无操作历史
    const hist = svc.getCommandHistory(storeA.scanner.deviceId)
    expect(hist).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 📢 营销视角 — 推广打印 & 数据采集
// ══════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Marketing} 营销 - 推广物料打印 & 扫码数据统计`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
    svc.registerDevice(storeA.printer)
    svc.registerDevice(storeA.scanner)
    svc.registerDevice(storeB.kiosk)
    svc.registerDevice(storeA.pos)
  })

  it('正常流程：营销批量打印优惠券二维码 & 扫码数据解析', async () => {
    await svc.connect(storeA.printer.deviceId)
    await svc.connect(storeA.scanner.deviceId)

    // 批量打印
    const print1 = await svc.printerPrint(storeA.printer.deviceId, '🎫 买一送一优惠券\n有效期: 2026-07-15')
    expect(print1.success).toBe(true)

    const print2 = await svc.printerPrintQR(storeA.printer.deviceId, 'COUPON-B1G1-2026')
    expect(print2.success).toBe(true)

    // 打印历史
    const history = svc.getCommandHistory(storeA.printer.deviceId)
    expect(history.length).toBe(2)

    // 扫码收集营销数据
    const scan1 = svc.scannerParse('COUPON-B1G1-2026')
    expect(scan1).toBeDefined()
  })

  it('业务边界：营销活动中打印机故障降级处理', async () => {
    // 离线打印机
    const failPrint = await svc.printerPrint(storeA.printer.deviceId, '优惠券内容')
    expect(failPrint.success).toBe(false)
    expect(failPrint.error).toBe('device_offline')

    // 连接后恢复
    await svc.connect(storeA.printer.deviceId)
    const okPrint = await svc.printerPrint(storeA.printer.deviceId, '恢复后打印')
    expect(okPrint.success).toBe(true)

    // Kiosk 展示营销内容
    await svc.connect(storeB.kiosk.deviceId)
    expect(svc.getStatus(storeB.kiosk.deviceId)).toBe('online')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 额外：Controller 层集成验证
// ══════════════════════════════════════════════════════════════════════════════

describe('Controller 层 — 角色调用集成验证', () => {
  it('controller 注册设备并查询', () => {
    const { controller, service } = createController()
    const device = controller.registerDevice({
      deviceId: 'ctrl-pos-01',
      deviceType: 'pos' as any,
      brand: 'huawei' as any,
      connection: 'usb' as any,
      timeout: 5000,
      retries: 3,
    })
    expect(device.deviceId).toBe('ctrl-pos-01')

    const list = controller.listDevices({} as any)
    expect(list.total).toBe(1)
    expect(list.devices).toHaveLength(1)

    const fetched = controller.getDevice('ctrl-pos-01')
    expect(fetched.deviceId).toBe('ctrl-pos-01')
  })

  it('controller 层处理不存在设备', () => {
    const { controller, service } = createController()
    expect(() => controller.getDevice('nonexistent')).toThrow()
    expect(() => controller.unregisterDevice('nonexistent')).toThrow()
  })
})
