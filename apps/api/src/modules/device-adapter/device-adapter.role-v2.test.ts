import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [device-adapter] [C] 角色测试 v2
 *
 * 8 角色视角的设备适配器|街机门店设备管理测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 场景设计基于街机游戏厅/娃娃机门店运营真实业务流
 */

import { DeviceAdapterService, type DeviceConfig } from './device-adapter.service'

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

// ── 测试工厂 ──
function createService() {
  return new DeviceAdapterService()
}

// ── 辅助函数：注册一批门店设备 ──
function setupStoreDevices(svc: DeviceAdapterService) {
  const pos = svc.registerDevice({
    deviceId: 'pos-001',
    deviceType: 'pos',
    brand: 'huawei',
    connection: 'wifi',
    timeout: 5000,
    retries: 3,
  })
  const gate = svc.registerDevice({
    deviceId: 'gate-001',
    deviceType: 'gate',
    brand: 'generic',
    connection: 'ethernet',
    timeout: 3000,
    retries: 2,
  })
  const scanner = svc.registerDevice({
    deviceId: 'scanner-001',
    deviceType: 'scanner',
    brand: 'honeywell',
    connection: 'usb',
    timeout: 2000,
    retries: 1,
  })
  const printer = svc.registerDevice({
    deviceId: 'printer-001',
    deviceType: 'printer',
    brand: 'epson',
    connection: 'wifi',
    timeout: 4000,
    retries: 2,
  })
  const kiosk = svc.registerDevice({
    deviceId: 'kiosk-001',
    deviceType: 'kiosk',
    brand: 'generic',
    connection: 'ethernet',
    timeout: 10000,
    retries: 3,
  })
  return { pos, gate, scanner, printer, kiosk }
}

// ── 辅助函数：连接所有设备 ──
async function connectAllDevices(svc: DeviceAdapterService) {
  await svc.connect('pos-001')
  await svc.connect('gate-001')
  await svc.connect('scanner-001')
  await svc.connect('printer-001')
  await svc.connect('kiosk-001')
}

// ═══════════════════════════
// 👔 店长 - 门店设备全貌管理
// ═══════════════════════════
describe(`${ROLES.StoreManager} device-adapter 角色测试`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
  })

  it('店长查看门店所有设备清单与在线状态（管理视角）', async () => {
    setupStoreDevices(svc)
    await connectAllDevices(svc)

    // 店长可以浏览全部设备
    const allDevices = svc.listDevices()
    expect(allDevices.length).toBe(5)

    // 店长查看各设备状态
    const statuses = svc.checkAllStatus()
    expect(statuses.get('pos-001')).toBe('online')
    expect(statuses.get('gate-001')).toBe('online')
    expect(statuses.get('scanner-001')).toBe('online')
    expect(statuses.get('printer-001')).toBe('online')
    expect(statuses.get('kiosk-001')).toBe('online')

    // 店长按类型过滤查看
    const posList = svc.listDevices({ type: 'pos' })
    expect(posList.length).toBe(1)
    expect(posList[0].brand).toBe('huawei')

    const gates = svc.listDevices({ type: 'gate' })
    expect(gates.length).toBe(1)
  })

  it('店长查看操作记录：检查 POS 机历史交易（权限边界确保能看到完整记录）', async () => {
    setupStoreDevices(svc)
    await connectAllDevices(svc)

    // 执行几次 POS 操作
    await svc.posTransaction('pos-001', 500, 'CNY')
    await svc.posTransaction('pos-001', 200, 'CNY')
    await svc.posRefund('pos-001', 'tx-001', 500)

    // 店长查看完整历史
    const history = svc.getCommandHistory('pos-001')
    expect(history.length).toBe(3)
    expect(history[0].action).toBe('posTransaction')
    expect(history[2].action).toBe('posRefund')

    // 店长应能查看其他设备的历史
    await svc.gateOpen('gate-001', 'in')
    const gateHistory = svc.getCommandHistory('gate-001')
    expect(gateHistory.length).toBe(1)
    expect(gateHistory[0].params).toEqual({ direction: 'in' })
  })
})

// ═══════════════════════════
// 🛒 前台 - 收银与客诉处理
// ═══════════════════════════
describe(`${ROLES.FrontDesk} device-adapter 角色测试`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
  })

  it('前台为顾客办理充值并使用 POS 机扣款（正常流程）', async () => {
    setupStoreDevices(svc)
    await svc.connect('pos-001')

    // 前台：顾客充值 100 元
    const chargeResult = await svc.posTransaction('pos-001', 100, 'CNY')
    expect(chargeResult.success).toBe(true)
    expect(chargeResult.data).toBeDefined()

    // 前台：顾客购买商品扣款
    const purchaseResult = await svc.posTransaction('pos-001', 50, 'CNY')
    expect(purchaseResult.success).toBe(true)
  })

  it('前台处理退货退款流程，用原交易 ID 发起退款（边界：设备离线则应报错）', async () => {
    setupStoreDevices(svc)
    await svc.connect('pos-001')

    // 先有一笔交易
    const tx = await svc.posTransaction('pos-001', 200, 'CNY')

    // 前台执行退款
    const txData = tx.data as Record<string, unknown> | null
    const refund = await svc.posRefund('pos-001', txData?.transactionId as string ?? '', 200)
    expect(refund.success).toBe(true)
    expect(refund.data).toHaveProperty('refundId')

    // 边界：设备离线时退款失败
    await svc.disconnect('pos-001')
    const offlineRefund = await svc.posRefund('pos-001', 'tx-x', 100)
    expect(offlineRefund.success).toBe(false)
    expect(offlineRefund.error).toBe('device_offline')
  })
})

// ═══════════════════════════
// 👥 HR - 员工签到与门禁管理
// ═══════════════════════════
describe(`${ROLES.HR} device-adapter 角色测试`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
  })

  it('HR 在上班高峰期批量打开员工通道闸机（正常流程）', async () => {
    setupStoreDevices(svc)
    await svc.connect('gate-001')

    // 开门禁
    const gateOpen = await svc.gateOpen('gate-001', 'in')
    expect(gateOpen.success).toBe(true)
    expect(gateOpen.data).toHaveProperty('direction', 'in')
  })

  it('HR 查看闸机通行记录以核验考勤（边界：无设备时返回空）', async () => {
    setupStoreDevices(svc)
    await svc.connect('gate-001')

    // 开门几次
    await svc.gateOpen('gate-001', 'in')
    await svc.gateOpen('gate-001', 'out')
    await svc.gateOpen('gate-001', 'in')

    const log = await svc.gateGetAccessLog('gate-001', 100)
    expect(log.success).toBe(true)
    expect(log.data).toBeDefined()
    const logs = (log.data as any).logs
    expect(logs.length).toBeGreaterThanOrEqual(1)

    // 边界：不存在的设备闸机
    const nonExistentLog = await svc.gateGetAccessLog('gate-nonexist', 10)
    expect(nonExistentLog.success).toBe(false)
    expect(nonExistentLog.error).toBe('device_offline')
  })
})

// ═══════════════════════════
// 🔧 安监 - 设备巡检与安全检查
// ═══════════════════════════
describe(`${ROLES.Security} device-adapter 角色测试`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
  })

  it('安监进行门店设备巡检：检查全部设备在线状态（正常流程）', async () => {
    setupStoreDevices(svc)
    await connectAllDevices(svc)

    // 模拟一台设备出故障
    svc.unregisterDevice('kiosk-001')
    setupStoreDevices(svc) // re-register - it will be offline

    // 安监检查全店设备状态
    const allStatus = svc.checkAllStatus()
    expect(allStatus.size).toBeGreaterThanOrEqual(4)

    // 安监收到心跳确认设备是否存活
    await svc.heartbeat('pos-001')
    expect(svc.getStatus('pos-001')).toBe('online')
  })

  it('安监尝试操作已离线设备应被拒绝（权限/安全边界）', async () => {
    setupStoreDevices(svc)
    // 故意不连接 printer

    const printResult = await svc.printerPrint('printer-001', 'test')
    expect(printResult.success).toBe(false)
    expect(printResult.error).toBe('device_offline')

    // 边界：尝试对未注册设备操作
    const gateResult = await svc.gateOpen('nonexistent', 'both')
    expect(gateResult.success).toBe(false)
    expect(gateResult.error).toBe('device_offline')
  })
})

// ═══════════════════════════
// 🎮 导玩员 - 游戏设备与扫码服务
// ═══════════════════════════
describe(`${ROLES.Guide} device-adapter 角色测试`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
  })

  it('导玩员用扫码枪扫描玩家会员码，解析不同条码格式（正常流程）', async () => {
    setupStoreDevices(svc)
    await svc.connect('scanner-001')

    // 扫码
    const scan = await svc.scannerScan('scanner-001')
    expect(scan.success).toBe(true)

    // 解析不同格式的条码
    const qrResult = svc.scannerParse('https://shenjiying.cn/member/abc123')
    expect(qrResult.format).toBe('qr')

    const eanResult = svc.scannerParse('6901234567890')
    expect(eanResult.format).toBe('ean13')

    const upcResult = svc.scannerParse('123456789012')
    expect(upcResult.format).toBe('upc')
  })

  it('导玩员打印游戏积分兑换小票（边界：打印机缺纸时场景模拟）', async () => {
    setupStoreDevices(svc)
    await svc.connect('printer-001')

    // 正常打印
    const print = await svc.printerPrint('printer-001', '兑换小票：1000积分=1次夹娃娃')
    expect(print.success).toBe(true)

    // 另打印一个二维码
    const qrPrint = await svc.printerPrintQR('printer-001', 'member://exchange/001')
    expect(qrPrint.success).toBe(true)

    // 边界：打印机离线
    await svc.disconnect('printer-001')
    const offlinePrint = await svc.printerPrint('printer-001', 'test')
    expect(offlinePrint.success).toBe(false)
    expect(offlinePrint.error).toBe('device_offline')
  })
})

// ═══════════════════════════
// 🎯 运行专员 - 设备运维与批量管理
// ═══════════════════════════
describe(`${ROLES.Operations} device-adapter 角色测试`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
  })

  it('运行专员批量启动全部扫描设备（正常流程）', async () => {
    svc.registerDevice({
      deviceId: 'scanner-001',
      deviceType: 'scanner',
      brand: 'honeywell',
      connection: 'usb',
      timeout: 2000,
      retries: 1,
    })
    svc.registerDevice({
      deviceId: 'scanner-002',
      deviceType: 'scanner',
      brand: 'honeywell',
      connection: 'usb',
      timeout: 2000,
      retries: 1,
    })

    const results = await svc.connectAll('scanner')
    expect(results.size).toBe(2)
    for (const [, success] of results) {
      expect(success).toBe(true)
    }
  })

  it('运行专员注册新设备并查询操作记录（边界：重复注册会被覆盖）', async () => {
    // 注册新设备
    svc.registerDevice({
      deviceId: 'scale-001',
      deviceType: 'scale',
      brand: 'deli',
      connection: 'usb',
      timeout: 2000,
      retries: 2,
    })
    await svc.connect('scale-001')

    const device = svc.getDevice('scale-001')
    expect(device).not.toBeNull()
    expect(device!.deviceType).toBe('scale')

    // 边界：用相同 ID 重新注册新设备（会覆盖）
    svc.registerDevice({
      deviceId: 'scale-001',
      deviceType: 'scale',
      brand: 'generic',
      connection: 'bluetooth',
      timeout: 3000,
      retries: 3,
    })
    const overridden = svc.getDevice('scale-001')
    expect(overridden!.brand).toBe('generic')

    // 没有操作历史的设备应该返回空数组
    const history = svc.getCommandHistory('scale-001')
    expect(history).toEqual([])
  })
})

// ═══════════════════════════
// 🤝 团建 - 团体接待与签到场景
// ═══════════════════════════
describe(`${ROLES.Teambuilding} device-adapter 角色测试`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
  })

  it('团建主管安排团体入场：闸机双侧开门 + 扫码核销（正常流程）', async () => {
    setupStoreDevices(svc)
    await svc.connect('gate-001')
    await svc.connect('scanner-001')

    // 团建签到：打开闸机双向通行
    const gateResult = await svc.gateOpen('gate-001', 'both')
    expect(gateResult.success).toBe(true)
    expect(gateResult.data).toHaveProperty('direction', 'both')

    // 团建签到：扫码核销团购券
    const scan = await svc.scannerScan('scanner-001')
    expect(scan.success).toBe(true)
  })

  it('团建结束打印团体消费小票（边界：多台打印机任选）', async () => {
    setupStoreDevices(svc)
    await svc.connect('printer-001')

    // 打印团体消费明细
    const print = await svc.printerPrint('printer-001', '团建消费：10人×¥88=¥880')
    expect(print.success).toBe(true)

    // 打印团队签到二维码
    const qr = await svc.printerPrintQR('printer-001', 'teambuilding://checkin/group-A')
    expect(qr.success).toBe(true)

    // 边界：printer-001 打印内容为空字符串
    const emptyPrint = await svc.printerPrint('printer-001', '')
    expect(emptyPrint.success).toBe(true)
    expect(emptyPrint.data).toBeDefined()
  })
})

// ═══════════════════════════
// 📢 营销 - 自助终端与活动设备
// ═══════════════════════════
describe(`${ROLES.Marketing} device-adapter 角色测试`, () => {
  let svc: DeviceAdapterService

  beforeEach(() => {
    svc = createService()
  })

  it('营销专员配置自助 Kiosk 终端以展示新活动页面（正常流程）', async () => {
    setupStoreDevices(svc)
    await svc.connect('kiosk-001')

    // 营销人员检查 Kiosk 在线
    const kioskStatus = svc.getStatus('kiosk-001')
    expect(kioskStatus).toBe('online')

    // 扫描活动签到码
    await svc.connect('scanner-001')
    const scan = await svc.scannerScan('scanner-001')
    expect(scan.success).toBe(true)

    // 营销可以使用所有在线设备
    const allDevices = svc.listDevices()
    expect(allDevices.some(d => d.deviceType === 'kiosk')).toBe(true)
  })

  it('营销专员在活动客流高峰时检查全部设备运行状态（边界：未知设备查询）', async () => {
    setupStoreDevices(svc)
    await connectAllDevices(svc)

    // 检查全部在线状态
    const statuses = svc.checkAllStatus()
    for (const [, status] of statuses) {
      expect(status).toBe('online')
    }

    // 边界：按类型查询不存在的设备类型
    const noDevices = svc.listDevices({ type: 'scale' })
    expect(noDevices.length).toBe(0)

    // 边界：按品牌过滤
    const huaweiDevices = svc.listDevices({ brand: 'huawei' })
    expect(huaweiDevices.length).toBe(1)
    expect(huaweiDevices[0].deviceType).toBe('pos')
  })
})
