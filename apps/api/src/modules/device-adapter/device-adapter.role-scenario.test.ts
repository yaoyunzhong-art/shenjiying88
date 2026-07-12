/**
 * 🐜 自动: [device-adapter] [C] 角色场景测试
 *
 * 8 角色视角的真实街机设备操作场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个多步场景用例
 *
 * 注意: 设备需要先注册(registerDevice)再连接(connect)才能进行读写操作。
 *       getStatus() 默认返回 'offline', connect() 后变为 'online'。
 *       POS/闸机/扫描仪/打印机等操作都需要设备在线。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { DeviceAdapterService } from './device-adapter.service'
import { DeviceAdapterController } from './device-adapter.controller'
import { DeviceTypeEnum, DeviceBrandEnum, ConnectionTypeEnum, GateDirectionEnum } from './device-adapter.dto'
import type { RegisterDeviceDto } from './device-adapter.dto'

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

function makeController() {
  const svc = new DeviceAdapterService()
  return { svc, ctrl: new DeviceAdapterController(svc) }
}

function makePOS(id = 'pos-scene-001'): RegisterDeviceDto {
  return { deviceId: id, deviceType: DeviceTypeEnum.POS, brand: DeviceBrandEnum.HUAWEI, connection: ConnectionTypeEnum.USB, timeout: 5000, retries: 3 }
}

function makeGate(id = 'gate-scene-001'): RegisterDeviceDto {
  return { deviceId: id, deviceType: DeviceTypeEnum.GATE, brand: DeviceBrandEnum.GENERIC, connection: ConnectionTypeEnum.ETHERNET, timeout: 3000, retries: 2 }
}

function makePrinter(id = 'printer-scene-001'): RegisterDeviceDto {
  return { deviceId: id, deviceType: DeviceTypeEnum.PRINTER, brand: DeviceBrandEnum.EPSON, connection: ConnectionTypeEnum.USB, timeout: 2000, retries: 1 }
}

function makeScanner(id = 'scanner-scene-001'): RegisterDeviceDto {
  return { deviceId: id, deviceType: DeviceTypeEnum.SCANNER, brand: DeviceBrandEnum.HONEYWELL, connection: ConnectionTypeEnum.WIFI, timeout: 3000, retries: 2 }
}

/** 注册+连接设备一步到位 */
async function registerAndConnect(ctrl: DeviceAdapterController, svc: DeviceAdapterService, cfg: RegisterDeviceDto) {
  ctrl.registerDevice(cfg)
  await svc.connect(cfg.deviceId)
}

// ═══════════════ 👔 店长 - 门店设备运营管理 ═══════════════
describe(`${ROLES.StoreManager} 店长设备管理场景`, () => {
  let svc: DeviceAdapterService
  let ctrl: DeviceAdapterController

  beforeEach(async () => { svc = new DeviceAdapterService(); ctrl = new DeviceAdapterController(svc) })

  it('场景A: 新店开业注册全套设备', () => {
    // 店长为新门店注册 POS、闸机、打印机、扫描仪
    const pos = ctrl.registerDevice(makePOS('pos-store-1'))
    const gate = ctrl.registerDevice(makeGate('gate-store-1'))
    const printer = ctrl.registerDevice(makePrinter('printer-store-1'))
    const scanner = ctrl.registerDevice(makeScanner('scanner-store-1'))

    assert.equal(pos.deviceId, 'pos-store-1')
    assert.equal(gate.deviceId, 'gate-store-1')
    assert.equal(printer.deviceId, 'printer-store-1')
    assert.equal(scanner.deviceId, 'scanner-store-1')

    // 验证全部设备列表
    const all = ctrl.listDevices({})
    assert.equal(all.total, 4)
  })

  it('场景B: 设备维护时下线并重新上线', async () => {
    const cfg = makePOS('pos-maint')
    ctrl.registerDevice(cfg)
    await svc.connect('pos-maint')

    // 断开
    const dis = await ctrl.disconnectDevice('pos-maint')
    assert.ok(dis.success)

    const statusOff = ctrl.getDeviceStatus('pos-maint')
    assert.equal(statusOff.status, 'offline')

    // 重新连接
    const con = await ctrl.connectDevice('pos-maint')
    assert.ok(con.success)
    assert.equal(con.status, 'online')
  })

  it('场景C: 批量连接同类型设备', async () => {
    ctrl.registerDevice(makePOS('pos-batch-1'))
    ctrl.registerDevice(makePOS('pos-batch-2'))
    ctrl.registerDevice(makeGate('gate-batch-3'))

    const results = await ctrl.connectAll({ deviceType: DeviceTypeEnum.POS })
    assert.ok(results['pos-batch-1'])
    assert.ok(results['pos-batch-2'])
    // gate 不应该被连接
    assert.equal(results['gate-batch-3'], undefined)
  })

  it('场景D: 查看全部设备状态概览', async () => {
    ctrl.registerDevice(makePOS('pos-status'))
    ctrl.registerDevice(makeGate('gate-status'))

    const allStatus = ctrl.getAllStatus()
    assert.ok('pos-status' in allStatus)
    assert.ok('gate-status' in allStatus)
    // 默认状态是 offline
    assert.equal(allStatus['pos-status'], 'offline')
    assert.equal(allStatus['gate-status'], 'offline')

    // 连接后变为 online
    await svc.connect('pos-status')
    const afterConnect = ctrl.getAllStatus()
    assert.equal(afterConnect['pos-status'], 'online')
  })
})

// ═══════════════ 🛒 前台 - 日常收银操作 ═══════════════
describe(`${ROLES.FrontDesk} 前台收银场景`, () => {
  let svc: DeviceAdapterService
  let ctrl: DeviceAdapterController

  beforeEach(async () => { svc = new DeviceAdapterService(); ctrl = new DeviceAdapterController(svc) })

  it('场景A: 正常收款POS交易', async () => {
    await registerAndConnect(ctrl, svc, makePOS('pos-cashier'))

    const tx = await ctrl.posTransaction('pos-cashier', { amount: 5000, currency: 'CNY' })
    assert.ok(tx.success)
    assert.ok(tx.commandId)
    assert.ok(tx.receivedAt)
  })

  it('场景B: 退款处理', async () => {
    const cfg = makePOS('pos-refund2')
    ctrl.registerDevice(cfg)
    await svc.connect(cfg.deviceId)

    // 先做一笔交易
    const tx = await ctrl.posTransaction('pos-refund2', { amount: 3000, currency: 'CNY' })
    assert.ok(tx.success)

    // 退回
    const refund = await ctrl.posRefund('pos-refund2', { originalTransactionId: tx.commandId, amount: 3000 })
    assert.ok(refund.success)
  })

  it('场景C: 扫描商品条码', async () => {
    await registerAndConnect(ctrl, svc, makeScanner('scan-1'))

    const scan = await ctrl.scannerScan('scan-1')
    assert.ok(scan.success)
    assert.ok(scan.data)
  })

  it('场景D: 刷卡支付', async () => {
    await registerAndConnect(ctrl, svc, makePOS('pos-card'))

    const read = await ctrl.posReadCard('pos-card')
    assert.ok(read.success)
  })
})

// ═══════════════ 👥 HR - 培训设备管理 ═══════════════
describe(`${ROLES.HR} 人资设备场景`, () => {
  let svc: DeviceAdapterService
  let ctrl: DeviceAdapterController

  beforeEach(() => { svc = new DeviceAdapterService(); ctrl = new DeviceAdapterController(svc) })

  it('场景A: 培训用设备登记', () => {
    // HR 为培训教室注册演示设备
    const printer = ctrl.registerDevice({ ...makePrinter('printer-hr') })
    assert.equal(printer.deviceId, 'printer-hr')

    const gate = ctrl.registerDevice({ ...makeGate('gate-hr') })
    assert.equal(gate.deviceId, 'gate-hr')
  })

  it('场景B: 查询设备列表用于培训记录', () => {
    ctrl.registerDevice(makePOS('hr-pos'))
    ctrl.registerDevice(makePrinter('hr-printer'))

    const list = ctrl.listDevices({ type: DeviceTypeEnum.POS })
    assert.equal(list.total, 1)
    assert.equal(list.devices[0].deviceId, 'hr-pos')

    const all = ctrl.listDevices({})
    assert.ok(all.total >= 2)
  })
})

// ═══════════════ 🔧 安监 - 安全监控场景 ═══════════════
describe(`${ROLES.Security} 安监安全场景`, () => {
  let svc: DeviceAdapterService
  let ctrl: DeviceAdapterController

  beforeEach(async () => { svc = new DeviceAdapterService(); ctrl = new DeviceAdapterController(svc) })

  it('场景A: 监控闸机出入记录', async () => {
    await registerAndConnect(ctrl, svc, makeGate('gate-security'))

    const log = await ctrl.gateAccessLog('gate-security', { limit: 10 })
    assert.ok(log.success)
    assert.ok(log.data)
  })

  it('场景B: 检查设备运行状态', async () => {
    await registerAndConnect(ctrl, svc, makePOS('pos-sec'))
    await registerAndConnect(ctrl, svc, makeGate('gate-sec'))

    const status = ctrl.getDeviceStatus('pos-sec')
    assert.equal(status.status, 'online')

    const all = ctrl.getAllStatus()
    assert.equal(Object.keys(all).length, 2)
  })

  it('场景C: 异常设备心跳检测', async () => {
    ctrl.registerDevice(makePOS('pos-heartbeat'))
    // 注册后未连接，状态为 offline
    const statusBefore = ctrl.getDeviceStatus('pos-heartbeat')
    assert.equal(statusBefore.status, 'offline')

    // 心跳会恢复连接
    const hb = await ctrl.heartbeat('pos-heartbeat')
    assert.ok(hb.success)

    const statusAfter = ctrl.getDeviceStatus('pos-heartbeat')
    assert.equal(statusAfter.status, 'online')
  })
})

// ═══════════════ 🎮 导玩员 - 日常运营场景 ═══════════════
describe(`${ROLES.Guide} 导玩员运营场景`, () => {
  let svc: DeviceAdapterService
  let ctrl: DeviceAdapterController

  beforeEach(async () => { svc = new DeviceAdapterService(); ctrl = new DeviceAdapterController(svc) })

  it('场景A: 打印游戏积分小票', async () => {
    await registerAndConnect(ctrl, svc, makePrinter('printer-guide'))

    const print = await ctrl.printerPrint('printer-guide', {
      content: '玩家: 小明, 积分: 500, 日期: 2026-07-08',
    })
    assert.ok(print.success)
  })

  it('场景B: 打印游戏兑换二维码', async () => {
    await registerAndConnect(ctrl, svc, makePrinter('printer-qr'))

    const qr = await ctrl.printerPrintQr('printer-qr', {
      data: 'https://arcade.com/redeem/token_abc123',
    })
    assert.ok(qr.success)
  })

  it('场景C: 扫描会员卡', async () => {
    await registerAndConnect(ctrl, svc, makeScanner('scan-member'))

    const scan = await ctrl.scannerScan('scan-member')
    assert.ok(scan.success)
  })
})

// ═══════════════ 🎯 运行专员 - 运维监控场景 ═══════════════
describe(`${ROLES.Operations} 运行专员运维场景`, () => {
  let svc: DeviceAdapterService
  let ctrl: DeviceAdapterController

  beforeEach(async () => { svc = new DeviceAdapterService(); ctrl = new DeviceAdapterController(svc) })

  it('场景A: 查看所有设备状态', async () => {
    await registerAndConnect(ctrl, svc, makePOS('ops-pos'))
    await registerAndConnect(ctrl, svc, makeGate('ops-gate'))
    await registerAndConnect(ctrl, svc, makePrinter('ops-printer'))
    await registerAndConnect(ctrl, svc, makeScanner('ops-scanner'))

    const all = ctrl.getAllStatus()
    assert.equal(Object.keys(all).length, 4)

    for (const [id, status] of Object.entries(all)) {
      assert.equal(status, 'online', `设备 ${id} 应在线上`)
    }
  })

  it('场景B: 检查单个设备命令历史', async () => {
    await registerAndConnect(ctrl, svc, makePOS('ops-hist'))

    const history = ctrl.getCommandHistory('ops-hist', { limit: 5 })
    assert.ok(Array.isArray(history))
  })

  it('场景C: 解析扫描数据', () => {
    const parsed = ctrl.scannerParse({ data: 'CODE128:ABC123456' })
    assert.ok(parsed)
    assert.equal(parsed.format, 'code128')
  })
})

// ═══════════════ 🤝 团建 - 团队活动场景 ═══════════════
describe(`${ROLES.Teambuilding} 团建活动场景`, () => {
  let svc: DeviceAdapterService
  let ctrl: DeviceAdapterController

  beforeEach(async () => { svc = new DeviceAdapterService(); ctrl = new DeviceAdapterController(svc) })

  it('场景A: 团建团体入场闸机开门', async () => {
    await registerAndConnect(ctrl, svc, makeGate('gate-tb'))

    const open = await ctrl.gateOpen('gate-tb', { direction: GateDirectionEnum.IN })
    assert.ok(open.success)
  })

  it('场景B: 团建批量打印参与凭证', async () => {
    await registerAndConnect(ctrl, svc, makePrinter('printer-tb'))

    for (let i = 1; i <= 3; i++) {
      const result = await ctrl.printerPrint('printer-tb', {
        content: `团建凭证: 第${i}组, 时间: 2026-07-08 14:00`,
      })
      assert.ok(result.success)
    }
  })
})

// ═══════════════ 📢 营销 - 促销活动场景 ═══════════════
describe(`${ROLES.Marketing} 营销活动场景`, () => {
  let svc: DeviceAdapterService
  let ctrl: DeviceAdapterController

  beforeEach(async () => { svc = new DeviceAdapterService(); ctrl = new DeviceAdapterController(svc) })

  it('场景A: 打印促销活动二维码', async () => {
    await registerAndConnect(ctrl, svc, makePrinter('printer-mkt'))

    const qr = await ctrl.printerPrintQr('printer-mkt', {
      data: 'https://arcade.com/promo/夏日大促_202607',
    })
    assert.ok(qr.success)
  })

  it('场景B: 查看门店设备概览用于活动规划', () => {
    ctrl.registerDevice(makePOS('mkt-pos'))
    ctrl.registerDevice(makePrinter('mkt-printer'))
    ctrl.registerDevice(makeGate('mkt-gate'))

    const all = ctrl.listDevices({})
    assert.equal(all.total, 3)
    assert.ok(all.devices.some((d) => d.deviceType === DeviceTypeEnum.PRINTER))
    assert.ok(all.devices.some((d) => d.deviceType === DeviceTypeEnum.GATE))
  })
})
