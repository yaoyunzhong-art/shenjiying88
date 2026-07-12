import { describe, it, expect, beforeEach } from 'vitest'
import {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
} from './iot-hardware.service'
import {
  OTAFirmwareService,
  DeviceStateValidator,
  WorkOrderAutoAssignService,
} from './ota-upgrade.service'
import { DeviceType, DeviceStatus } from './iot-hardware.service'

/**
 * 🐜 自动: [iot] [C] 角色扩展测试修复
 * 修正 subscribe/getMessages/setDeviceOnline/reportHeartbeat/getDeviceHealthReport 等 API 匹配
 *
 * 8 角色视角扩展测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个用例（正常流程 + 权限/边界场景）
 */

function setup() {
  const esp32 = new ESP32DeviceService()
  const mqtt = new MQTTBrokerService()
  const hb = new AdaptiveHeartbeatService()
  const hw = new IoTHardwareService(esp32, mqtt, hb)
  const ota = new OTAFirmwareService()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const validator = new (DeviceStateValidator as any)(ota)
  const woa = new (WorkOrderAutoAssignService as any)(validator)
  return { esp32, mqtt, hb, hw, ota, validator, woa }
}

// ============================================================
// 👔店长 – 设备注册 & 门店设备管理
// ============================================================
describe('👔店长 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('注册新 ESP32 设备', () => {
    const d = svc.esp32.registerDevice('esp-001', DeviceType.ESP32_S3)
    expect(d.deviceId).toBe('esp-001')
    expect(d.type).toBe('ESP32_S3')
    expect(d.status).toBe(DeviceStatus.OFFLINE)
  })

  it('注册重复设备抛异常', () => {
    svc.esp32.registerDevice('esp-dup', DeviceType.ESP32)
    expect(() => svc.esp32.registerDevice('esp-dup', DeviceType.ESP32)).toThrow()
  })

  it('检索所有已注册设备', () => {
    svc.esp32.registerDevice('esp-a', DeviceType.ESP32)
    svc.esp32.registerDevice('esp-b', DeviceType.ESP32_S3)
    const all = svc.esp32.listDevices()
    expect(all.length).toBe(2)
  })
})

// ============================================================
// 🛒前台 – MQTT 消息发布 & 接收
// ============================================================
describe('🛒前台 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('前台 MQTT 连接并发布消息', () => {
    const connected = svc.mqtt.connect('mqtt://broker.example.com')
    expect(connected).toBe(true)

    const ok = svc.mqtt.publish('topic/test', 'Hello')
    expect(ok).toBe(true)

    const msgs = svc.mqtt.getMessageHistory('topic/test')
    expect(msgs.length).toBeGreaterThanOrEqual(1)
    expect(msgs[0].payload).toBe('Hello')
  })

  it('Mqtt 未连接时发布失败', () => {
    const ok = svc.mqtt.publish('topic/test', 'Hello')
    expect(ok).toBe(false)
  })

  it('前台可订阅主题并接收消息', () => {
    svc.mqtt.connect('mqtt://broker.example.com')
    let received: string[] = []
    svc.mqtt.subscribe('topic/alert', (msg) => { received.push(msg.payload) })
    svc.mqtt.publish('topic/alert', '门店客流高峰')
    expect(received.length).toBeGreaterThanOrEqual(1)
    expect(received[0]).toBe('门店客流高峰')
  })
})

// ============================================================
// 👥HR – 设备状态管理 & 上下线
// ============================================================
describe('👥HR iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('设备上线和下线状态变更', () => {
    svc.esp32.registerDevice('esp-hr', DeviceType.ESP32)
    const online = svc.esp32.updateDeviceStatus('esp-hr', DeviceStatus.ONLINE)
    expect(online!.status).toBe(DeviceStatus.ONLINE)
    const offline = svc.esp32.updateDeviceStatus('esp-hr', DeviceStatus.OFFLINE)
    expect(offline!.status).toBe(DeviceStatus.OFFLINE)
  })

  it('更新不存在的设备返回 undefined', () => {
    const result = svc.esp32.updateDeviceStatus('non-existent', DeviceStatus.ONLINE)
    expect(result).toBeUndefined()
  })

  it('查询单个设备详情', () => {
    svc.esp32.registerDevice('esp-detail', DeviceType.ESP32_C3)
    const dev = svc.esp32.getDevice('esp-detail')
    expect(dev).toBeDefined()
    expect(dev!.type).toBe('ESP32_C3')
  })
})

// ============================================================
// 🔧安监 – 设备安全 & 心跳监控
// ============================================================
describe('🔧安监 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('自适应心跳间隔调整', () => {
    svc.esp32.registerDevice('esp-sec', DeviceType.ESP32_C3)
    svc.hb.recordHeartbeat('esp-sec', 50)
    svc.hb.recordHeartbeat('esp-sec', 40)
    svc.hb.recordHeartbeat('esp-sec', 45)
    const interval = svc.hb.calculateOptimalInterval('esp-sec')
    expect(interval).toBeGreaterThan(0)
  })

  it('心跳状态包含延迟和间隔信息', () => {
    svc.esp32.registerDevice('esp-mon', DeviceType.ESP32_S3)
    svc.hb.recordHeartbeat('esp-mon', 100)
    const status = svc.hb.getHeartbeatStatus('esp-mon')
    expect(status.deviceId).toBe('esp-mon')
    expect(status.avgLatency).toBeGreaterThanOrEqual(0)
    expect(status.currentInterval).toBeGreaterThan(0)
  })

  it('硬件服务 handleHeartbeat 包装方法', () => {
    svc.esp32.registerDevice('esp-hw-hb', DeviceType.ESP32)
    const status = svc.hw.handleHeartbeat('esp-hw-hb', 30)
    expect(status.deviceId).toBe('esp-hw-hb')
  })
})

// ============================================================
// 🎮导玩员 – 现场设备状态查询
// ============================================================
describe('🎮导玩员 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('获取特定类型设备列表', () => {
    svc.esp32.registerDevice('guide-dev-1', DeviceType.ESP32)
    svc.esp32.registerDevice('guide-dev-2', DeviceType.ESP32_S3)
    svc.esp32.registerDevice('guide-dev-3', DeviceType.ESP32)
    const list = svc.esp32.listDevices({ type: DeviceType.ESP32 })
    expect(list.length).toBe(2)
  })

  it('获取在线设备列表', () => {
    svc.esp32.registerDevice('guide-on-1', DeviceType.ESP32)
    svc.esp32.registerDevice('guide-on-2', DeviceType.ESP32_S3)
    svc.esp32.updateDeviceStatus('guide-on-1', DeviceStatus.ONLINE)
    const online = svc.esp32.listDevices({ status: DeviceStatus.ONLINE })
    expect(online.length).toBe(1)
  })
})

// ============================================================
// 🎯运行专员 – OTA 升级 & 工单管理
// ============================================================
describe('🎯运行专员 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('固件上传和 OTA 任务调度', async () => {
    const binary = Buffer.from('mock-firmware-binary-data')
    const fw = await svc.ota.uploadFirmware('ESP32_S3', '2.0.0', binary)
    expect(fw.version).toBe('2.0.0')

    const tasks = await svc.ota.scheduleOTA(['esp-001'], fw.version)
    expect(tasks.length).toBeGreaterThanOrEqual(1)
    expect(tasks[0].status).toBe('scheduled')
  })

  it('设备升级前状态验证', async () => {
    svc.esp32.registerDevice('esp-val', DeviceType.ESP32)
    const result = await svc.validator.validateBeforeUpgrade('esp-val')
    expect(result.valid).toBeDefined()
    expect(Array.isArray(result.reasons)).toBe(true)
  })

  it('设备升级后状态验证', async () => {
    const result = await svc.validator.validateAfterUpgrade('esp-val')
    expect(result.valid).toBeDefined()
    expect(Array.isArray(result.issues)).toBe(true)
  })

  it('工单自动创建', async () => {
    const wo = await svc.woa.createWorkOrder('设备离线', 'esp-001')
    expect(wo.id).toBeTruthy()
    expect(wo.status).toBe('open')
    expect(wo.deviceId).toBe('esp-001')
    expect(wo.issue).toBe('设备离线')
  })
})

// ============================================================
// 🤝团建 – 设备批量管理 & OTA
// ============================================================
describe('🤝团建 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('批量注册设备', () => {
    for (let i = 0; i < 5; i++) {
      svc.esp32.registerDevice(`esp-team-${i}`, DeviceType.ESP32)
    }
    const all = svc.esp32.listDevices()
    expect(all.length).toBe(5)
  })

  it('按状态批量过滤', () => {
    svc.esp32.registerDevice('esp-a', DeviceType.ESP32)
    svc.esp32.registerDevice('esp-b', DeviceType.ESP32_S3)
    svc.esp32.updateDeviceStatus('esp-a', DeviceStatus.ERROR)
    const errorDevs = svc.esp32.listDevices({ status: DeviceStatus.ERROR })
    expect(errorDevs.length).toBe(1)
    expect(errorDevs[0].deviceId).toBe('esp-a')
  })
})

// ============================================================
// 📢营销 – 设备数据查询 & 报告
// ============================================================
describe('📢营销 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('按类型查询设备列表', () => {
    svc.esp32.registerDevice('e1', DeviceType.ESP32)
    svc.esp32.registerDevice('e2', DeviceType.ESP32_S3)
    const list = svc.esp32.listDevices({ type: DeviceType.ESP32 })
    expect(list.length).toBeGreaterThanOrEqual(1)
  })

  it('设备上下线统计', () => {
    svc.esp32.registerDevice('mkt-dev-1', DeviceType.ESP32)
    svc.esp32.registerDevice('mkt-dev-2', DeviceType.ESP32_S3)
    svc.esp32.updateDeviceStatus('mkt-dev-1', DeviceStatus.ONLINE)
    svc.esp32.updateDeviceStatus('mkt-dev-2', DeviceStatus.ERROR)

    const online = svc.esp32.listDevices({ status: DeviceStatus.ONLINE })
    const error = svc.esp32.listDevices({ status: DeviceStatus.ERROR })
    expect(online.length).toBe(1)
    expect(error.length).toBe(1)
  })

  it('通过 IoTHardwareService 设备上线', async () => {
    const dev = await svc.hw.deviceOnline('mkt-online', DeviceType.ESP32)
    expect(dev.status).toBe(DeviceStatus.ONLINE)
    expect(dev.deviceId).toBe('mkt-online')
  })
})
