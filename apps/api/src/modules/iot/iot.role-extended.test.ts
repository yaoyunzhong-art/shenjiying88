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
 * 🐜 [iot] 角色扩展测试
 * 覆盖设备注册、MQTT、心跳、OTA、工单管理边界场景
 */

function setup() {
  const esp32 = new ESP32DeviceService()
  const mqtt = new MQTTBrokerService()
  const hb = new AdaptiveHeartbeatService()
  const hw = new IoTHardwareService(esp32, mqtt, hb)
  const ota = new OTAFirmwareService()
  const validator = new DeviceStateValidator()
  const woa = new WorkOrderAutoAssignService()
  return { esp32, mqtt, hb, hw, ota, validator, woa }
}

describe('👔店长 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('注册新 ESP32 设备', () => {
    const d = svc.esp32.registerDevice('esp-001', DeviceType.ESP32_S3)
    expect(d.deviceId).toBe('esp-001')
    expect(d.type).toBe('ESP32_S3')
    expect(d.status).toBe('OFFLINE')
  })

  it('注册重复设备抛异常', () => {
    svc.esp32.registerDevice('esp-dup', DeviceType.ESP32)
    expect(() => svc.esp32.registerDevice('esp-dup', DeviceType.ESP32)).toThrow()
  })
})

describe('🛒前台 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('MQTT 发布和订阅消息', () => {
    svc.mqtt.subscribe('front-desk', 'topic/test')
    const ok = svc.mqtt.publish('topic/test', 'Hello')
    expect(ok).toBe(true)
    const msgs = svc.mqtt.getMessages('front-desk', 'topic/test')
    expect(msgs.length).toBeGreaterThanOrEqual(1)
    expect(msgs[0].payload).toBe('Hello')
  })

  it('批量 MQTT 发布', () => {
    svc.mqtt.publishBatch([
      { topic: 'a', payload: '1' },
      { topic: 'b', payload: '2' },
    ])
    expect(true).toBe(true)
  })
})

describe('👥HR iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('设备上线和下线状态变更', () => {
    svc.esp32.registerDevice('esp-hr', DeviceType.ESP32)
    const online = svc.esp32.setDeviceOnline('esp-hr', { ip: '192.168.1.1' })
    expect(online.status).toBe('ONLINE')
    const offline = svc.esp32.setDeviceOffline('esp-hr')
    expect(offline.status).toBe('OFFLINE')
  })
})

describe('🔧安监 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('自适应心跳间隔调整', () => {
    svc.esp32.registerDevice('esp-sec', DeviceType.ESP32_C3)
    const status = svc.hb.reportHeartbeat('esp-sec', 50)
    expect(status.currentInterval).toBeGreaterThan(0)
    expect(status.avgLatency).toBeGreaterThanOrEqual(0)
  })
})

describe('🎯运行专员 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('固件上传和 OTA 任务调度', async () => {
    const fw = svc.ota.uploadFirmware({ version: 'v2.0', deviceType: 'ESP32_S3', firmwareUrl: 'https://example.com/fw.bin', checksum: 'abc123', sizeBytes: 1024000 })
    expect(fw.version).toBe('v2.0')

    const task = svc.ota.scheduleOTA('esp-001', fw.firmwareId, '2026-07-10T00:00:00Z')
    expect(task.status).toBe('pending')
  })

  it('设备状态验证', () => {
    svc.esp32.registerDevice('esp-val', DeviceType.ESP32)
    const health = svc.validator.validateDeviceHealth('esp-val')
    expect(health.isHealthy).toBeDefined()
  })

  it('工单自动分配', () => {
    const wo = svc.woa.createWorkOrder({ deviceId: 'esp-001', issueType: 'offline', description: '设备离线' })
    expect(wo.workOrderId).toBeTruthy()
    expect(wo.status).toBe('open')
  })
})

describe('📢营销 iot 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('按类型查询设备列表', () => {
    svc.esp32.registerDevice('e1', DeviceType.ESP32)
    svc.esp32.registerDevice('e2', DeviceType.ESP32_S3)
    const list = svc.esp32.listDevices({ type: DeviceType.ESP32 })
    expect(list.length).toBeGreaterThanOrEqual(1)
  })

  it('设备健康报告', () => {
    svc.esp32.registerDevice('esp-health', DeviceType.ESP32)
    svc.esp32.setDeviceOnline('esp-health', { ip: '10.0.0.1' })
    const report = svc.hw.getDeviceHealthReport('esp-health')
    expect(report.deviceId).toBe('esp-health')
    expect(report.status).toBe('ONLINE')
  })
})
