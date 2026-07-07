import { describe, it, expect, beforeEach } from 'vitest'
import { DeviceAdapterService } from './device-adapter.service'

/**
 * 🐜 [device-adapter] 角色扩展测试
 * 覆盖设备注册、连接、POS、闸机、扫描仪、打印机的边界场景
 */

function setup(): DeviceAdapterService {
  return new DeviceAdapterService()
}

function registerTestDevice(svc: DeviceAdapterService, id: string, type: any = 'pos') {
  return svc.registerDevice({
    deviceId: id,
    deviceType: type,
    brand: 'generic',
    model: 'Test',
    connection: 'wifi',
    timeout: 5000,
    retries: 3,
  })
}

describe('👔店长 device-adapter 扩展测试', () => {
  let svc: DeviceAdapterService
  beforeEach(() => { svc = setup() })

  it('注册设备后列表包含该设备', () => {
    registerTestDevice(svc, 'dev-001')
    const list = svc.listDevices()
    expect(list).toHaveLength(1)
    expect(list[0].deviceId).toBe('dev-001')
  })

  it('获取已注册设备详情', () => {
    registerTestDevice(svc, 'dev-002')
    const d = svc.getDevice('dev-002')
    expect(d).not.toBeNull()
    expect(d!.deviceType).toBe('pos')
  })

  it('获取不存在设备返回 null', () => {
    expect(svc.getDevice('no-such')).toBeNull()
  })
})

describe('🛒前台 device-adapter 扩展测试', () => {
  let svc: DeviceAdapterService
  beforeEach(() => { svc = setup() })

  it('连接设备后状态变为 online', async () => {
    registerTestDevice(svc, 'dev-003')
    const ok = await svc.connect('dev-003')
    expect(ok).toBe(true)
    expect(svc.getStatus('dev-003')).toBe('online')
  })

  it('断开设备后状态变为 offline', async () => {
    registerTestDevice(svc, 'dev-004')
    await svc.connect('dev-004')
    await svc.disconnect('dev-004')
    expect(svc.getStatus('dev-004')).toBe('offline')
  })
})

describe('🔧安监 device-adapter 扩展测试', () => {
  let svc: DeviceAdapterService
  beforeEach(() => { svc = setup() })

  it('对离线设备执行 POS 交易返回错误', async () => {
    registerTestDevice(svc, 'dev-pos')
    const r = await svc.posTransaction('dev-pos', 100, 'CNY')
    expect(r.success).toBe(false)
    expect(r.error).toBe('device_offline')
  })

  it('在线设备 POS 交易成功', async () => {
    registerTestDevice(svc, 'dev-pos2')
    await svc.connect('dev-pos2')
    const r = await svc.posTransaction('dev-pos2', 50, 'CNY')
    expect(r.success).toBe(true)
    expect(r.data).toBeDefined()
  })

  it('查询命令历史', async () => {
    registerTestDevice(svc, 'dev-history')
    await svc.connect('dev-history')
    await svc.posTransaction('dev-history', 100, 'CNY')
    const hist = svc.getCommandHistory('dev-history')
    expect(hist.length).toBeGreaterThanOrEqual(1)
    expect(hist[0].action).toBe('posTransaction')
  })
})

describe('🎮导玩员 device-adapter 扩展测试', () => {
  let svc: DeviceAdapterService
  beforeEach(() => { svc = setup() })

  it('闸机开门操作', async () => {
    registerTestDevice(svc, 'dev-gate', 'gate')
    await svc.connect('dev-gate')
    const r = await svc.gateOpen('dev-gate', 'in')
    expect(r.success).toBe(true)
    expect(r.data).toHaveProperty('direction', 'in')
  })

  it('闸机访问日志', async () => {
    registerTestDevice(svc, 'dev-gate2', 'gate')
    await svc.connect('dev-gate2')
    const r = await svc.gateGetAccessLog('dev-gate2', 5)
    expect(r.success).toBe(true)
    expect((r.data as any).logs).toHaveLength(5)
  })
})

describe('🎯运行专员 device-adapter 扩展测试', () => {
  let svc: DeviceAdapterService
  beforeEach(() => { svc = setup() })

  it('打印机打印内容', async () => {
    registerTestDevice(svc, 'dev-printer', 'printer')
    await svc.connect('dev-printer')
    const r = await svc.printerPrint('dev-printer', '测试打印内容')
    expect(r.success).toBe(true)
  })

  it('打印机打印二维码', async () => {
    registerTestDevice(svc, 'dev-printer2', 'printer')
    await svc.connect('dev-printer2')
    const r = await svc.printerPrintQR('dev-printer2', 'https://example.com')
    expect(r.success).toBe(true)
  })

  it('批量连接同类型设备', async () => {
    registerTestDevice(svc, 'p1', 'printer')
    registerTestDevice(svc, 'p2', 'printer')
    const results = await svc.connectAll('printer')
    expect(results.size).toBe(2)
    expect([...results.values()].every(v => v === true)).toBe(true)
  })
})

describe('🤝团建 device-adapter 扩展测试', () => {
  let svc: DeviceAdapterService
  beforeEach(() => { svc = setup() })

  it('扫描仪扫描操作', async () => {
    registerTestDevice(svc, 'dev-scanner', 'scanner')
    await svc.connect('dev-scanner')
    const r = await svc.scannerScan('dev-scanner')
    expect(r.success).toBe(true)
  })

  it('解析不同格式条码', () => {
    expect(svc.scannerParse('http://example.com/qr').format).toBe('qr')
    expect(svc.scannerParse('1234567890123').format).toBe('ean13')
    expect(svc.scannerParse('123456789012').format).toBe('upc')
    expect(svc.scannerParse('ABC123').format).toBe('code128')
  })
})

describe('📢营销 device-adapter 扩展测试', () => {
  let svc: DeviceAdapterService
  beforeEach(() => { svc = setup() })

  it('删除设备后无法再获取', () => {
    registerTestDevice(svc, 'dev-del')
    svc.unregisterDevice('dev-del')
    expect(svc.getDevice('dev-del')).toBeNull()
  })

  it('心跳检测恢复在线状态', async () => {
    registerTestDevice(svc, 'dev-hb')
    await svc.heartbeat('dev-hb')
    expect(svc.getStatus('dev-hb')).toBe('online')
  })

  it('按类型过滤设备列表', () => {
    registerTestDevice(svc, 'pos-1', 'pos')
    registerTestDevice(svc, 'gate-1', 'gate')
    registerTestDevice(svc, 'printer-1', 'printer')
    expect(svc.listDevices({ type: 'pos' })).toHaveLength(1)
    expect(svc.listDevices({ type: 'gate' })).toHaveLength(1)
    expect(svc.listDevices({ type: 'printer' })).toHaveLength(1)
  })

  it('POS 读卡操作', async () => {
    registerTestDevice(svc, 'dev-card', 'pos')
    await svc.connect('dev-card')
    const r = await svc.posReadCard('dev-card')
    expect(r.success).toBe(true)
  })

  it('POS 退款操作', async () => {
    registerTestDevice(svc, 'dev-refund', 'pos')
    await svc.connect('dev-refund')
    const r = await svc.posRefund('dev-refund', 'tx-001', 50)
    expect(r.success).toBe(true)
  })
})
