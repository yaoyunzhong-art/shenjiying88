import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { IoTController } from './iot.controller'
import {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
} from './iot-hardware.service'
import { OTAFirmwareService, DeviceStateValidator, WorkOrderAutoAssignService } from './ota-upgrade.service'
import type { ESP32Device, HeartbeatStatus, DeviceHealthReport } from './iot.entity'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 辅助函数 ──

function makeController(): IoTController {
  const deviceService = new ESP32DeviceService()
  const mqttService = new MQTTBrokerService()
  const heartbeatService = new AdaptiveHeartbeatService()
  // IoTHardwareService 构造参数顺序: deviceService, mqttService, heartbeatService
  const iotHardwareService = new IoTHardwareService(deviceService, mqttService, heartbeatService)
  const otaService = new OTAFirmwareService()
  const deviceValidator = new DeviceStateValidator(otaService)
  const workOrderService = new WorkOrderAutoAssignService(deviceValidator)
  return new IoTController(
    deviceService,
    mqttService,
    heartbeatService,
    iotHardwareService,
    otaService,
    deviceValidator,
    workOrderService,
  )
}

// ──────────── 🔧 安监：设备安全监控 ────────────
describe(`${ROLES.Safety} iot 角色测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可以注册新设备用于安全监控（正常流程）', () => {
    const device = ctrl.registerDevice({ deviceId: 'sec-esp-001', type: 'ESP32_S3' as any })
    assert.equal(device.deviceId, 'sec-esp-001')
    assert.equal(device.type, 'ESP32_S3')
    // 注册后默认 OFFLINE
    assert.equal(device.status, 'OFFLINE')
  })

  it('安监可以设备上线（正常流程）', async () => {
    const device = await ctrl.deviceOnline({ deviceId: 'sec-esp-002', type: 'ESP32' as any })
    assert.equal(device.deviceId, 'sec-esp-002')
    assert.equal(device.status, 'ONLINE')
  })

  it('安监可以查看设备详情用于安全审计（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'sec-esp-003', type: 'ESP32' as any })
    const device = ctrl.getDevice('sec-esp-003')
    assert.equal(device.deviceId, 'sec-esp-003')
    assert.ok(device.createdAt)
  })

  it('安监可以获取设备健康度评分（正常流程）', async () => {
    // OTA 服务内置 mock 设备 dev-001，可在 OTA 层获取健康信息
    ctrl.registerDevice({ deviceId: 'dev-001', type: 'ESP32' as any })
    const health = await ctrl.getDeviceHealth('dev-001')
    assert.equal(health.deviceId, 'dev-001')
    assert.ok(health.score >= 0)
    assert.ok(health.overall)
  })

  it('安监可以执行 OTA 前的设备校验（正常流程）', async () => {
    ctrl.registerDevice({ deviceId: 'dev-002', type: 'ESP32' as any })
    const validate = await ctrl.validateBeforeUpgrade('dev-002')
    assert.equal(typeof validate.valid, 'boolean')
    assert.ok(Array.isArray(validate.reasons))
  })

  it('安监可以查看设备健康报告中的电池和网络状况（正常流程）', async () => {
    ctrl.registerDevice({ deviceId: 'dev-003', type: 'ESP32' as any })
    const health = await ctrl.getDeviceHealth('dev-003')
    assert.ok(health.battery)
    assert.ok(health.network)
    assert.ok(health.sensors)
    assert.ok(health.firmware)
    assert.equal(health.battery.health, 'good')
  })

  it('安监可以获取设备心跳状态检测连接健康度（正常流程）', async () => {
    await ctrl.deviceOnline({ deviceId: 'sec-esp-007', type: 'ESP32' as any })
    ctrl.reportHeartbeat({ deviceId: 'sec-esp-007', latency: 50 })
    const status = ctrl.getHeartbeatStatus('sec-esp-007')
    assert.equal(status.deviceId, 'sec-esp-007')
    assert.ok(status.avgLatency >= 0)
  })

  it('安监查询不存在的设备应报错（边界）', () => {
    assert.throws(
      () => ctrl.getDevice('nonexistent-device'),
      /未找到/,
    )
  })

  it('安监可以查看设备列表进行安全巡检（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'sec-esp-008', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'sec-esp-009', type: 'ESP32_S3' as any })
    const list = ctrl.listDevices({})
    assert.equal(list.total, 2)
    assert.equal(list.devices.length, 2)
  })

  it('安监设备下线应成功（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'sec-esp-010', type: 'ESP32' as any })
    const result = ctrl.deviceOffline({ deviceId: 'sec-esp-010' })
    assert.equal(result.success, true)
  })
})

// ──────────── 🎯 运行专员：设备管理 ────────────
describe(`${ROLES.Ops} iot 角色测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以批量注册设备（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'ops-esp-001', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'ops-esp-002', type: 'ESP32_S3' as any })
    ctrl.registerDevice({ deviceId: 'ops-esp-003', type: 'ESP8266' as any })

    const list = ctrl.listDevices({})
    assert.equal(list.total, 3)
  })

  it('运行专员可以更新设备状态（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'ops-esp-004', type: 'ESP32' as any })
    const updated = ctrl.updateDeviceStatus('ops-esp-004', { status: 'BUSY' as any })
    assert.equal(updated.status, 'BUSY')
  })

  it('运行专员可以删除不再使用的设备（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'ops-esp-005', type: 'ESP32' as any })
    const result = ctrl.unregisterDevice('ops-esp-005')
    assert.equal(result.success, true)

    assert.throws(
      () => ctrl.getDevice('ops-esp-005'),
      /未找到/,
    )
  })

  it('运行专员可以按类型过滤设备列表（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'ops-esp-006', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'ops-esp-007', type: 'ESP32_S3' as any })
    ctrl.registerDevice({ deviceId: 'ops-esp-008', type: 'ESP32' as any })

    const esp32List = ctrl.listDevices({ type: 'ESP32' as any })
    assert.equal(esp32List.total, 2)

    const s3List = ctrl.listDevices({ type: 'ESP32_S3' as any })
    assert.equal(s3List.total, 1)
  })

  it('运行专员可以安排 OTA 固件升级（正常流程）', async () => {
    await ctrl.uploadFirmware({ deviceType: 'sensor-v2', version: '2.1.0' })

    const tasks = await ctrl.scheduleOTA({ deviceIds: ['dev-001', 'dev-002'], firmwareVersion: '2.1.0' })
    assert.equal(tasks.length, 2)
    assert.ok(tasks.every(t => t.status === 'scheduled'))
  })

  it('运行专员可以执行 OTA 升级（正常流程）', async () => {
    await ctrl.uploadFirmware({ deviceType: 'sensor-v2', version: '2.0.0' })
    await ctrl.scheduleOTA({ deviceIds: ['dev-001'], firmwareVersion: '2.0.0' })

    const task = await ctrl.executeOTA('dev-001')
    // executeOTA 返回时状态为 upgrading，进度模拟异步完成
    assert.equal(task.status, 'upgrading')
    assert.equal(task.progress, 0)
  })

  it('运行专员注册重复设备应被拒绝（边界）', () => {
    ctrl.registerDevice({ deviceId: 'ops-esp-012', type: 'ESP32' as any })
    assert.throws(
      () => ctrl.registerDevice({ deviceId: 'ops-esp-012', type: 'ESP32' as any }),
      /已存在/,
    )
  })

  it('运行专员可以上传固件并列出可用固件（正常流程）', async () => {
    const fw1 = await ctrl.uploadFirmware({ deviceType: 'sensor-v2', version: '1.0.0' })
    const fw2 = await ctrl.uploadFirmware({ deviceType: 'sensor-v2', version: '2.0.0' })
    assert.ok(fw1.id)
    assert.ok(fw2.id)

    const list = await ctrl.listFirmwares('sensor-v2')
    assert.equal(list.length, 2)
  })

  it('运行专员可以取消 OTA 升级（正常流程）', async () => {
    await ctrl.uploadFirmware({ deviceType: 'sensor-v2', version: '2.1.0' })
    const tasks = await ctrl.scheduleOTA({ deviceIds: ['dev-001'], firmwareVersion: '2.1.0' })
    const result = await ctrl.cancelOTA(tasks[0].id)
    assert.equal(result.success, true)
  })
})

// ──────────── 🎮 导玩员：设备操作 ────────────
describe(`${ROLES.Guide} iot 角色测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以查看设备状态确认设备可用（正常流程）', async () => {
    await ctrl.deviceOnline({ deviceId: 'guide-esp-001', type: 'ESP32' as any })
    const device = ctrl.getDevice('guide-esp-001')
    assert.equal(device.status, 'ONLINE')
  })

  it('导玩员可以查看所有可用设备列表（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'guide-esp-002', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'guide-esp-003', type: 'ESP32_S3' as any })
    const list = ctrl.listDevices({})
    assert.equal(list.total, 2)
  })

  it('导玩员可以上报设备心跳确认运行正常（正常流程）', async () => {
    await ctrl.deviceOnline({ deviceId: 'guide-esp-004', type: 'ESP32' as any })
    const status = ctrl.reportHeartbeat({ deviceId: 'guide-esp-004', latency: 30 })
    assert.equal(status.deviceId, 'guide-esp-004')
    assert.ok(status.lastHeartbeat)
    assert.equal(status.consecutiveTimeouts, 0)
  })

  it('导玩员可以查询设备延迟统计用于优化体验（正常流程）', async () => {
    await ctrl.deviceOnline({ deviceId: 'guide-esp-005', type: 'ESP32' as any })
    ctrl.reportHeartbeat({ deviceId: 'guide-esp-005', latency: 20 })
    ctrl.reportHeartbeat({ deviceId: 'guide-esp-005', latency: 30 })
    ctrl.reportHeartbeat({ deviceId: 'guide-esp-005', latency: 25 })

    const stats = ctrl.getLatencyStats('guide-esp-005')
    assert.equal(stats.avg, 25)
    assert.equal(stats.min, 20)
    assert.equal(stats.max, 30)
    assert.equal(stats.count, 3)
  })

  it('导玩员可以通过 MQTT 向设备发送指令（正常流程）', () => {
    ctrl.connectMQTT('mqtt://test-broker:1883')
    const result = ctrl.publishMQTT({ topic: 'device/guide-esp-006/cmd', payload: 'START_GAME' })
    assert.equal(result.success, true)
  })

  it('导玩员查看不存在的设备应报错（边界）', () => {
    assert.throws(
      () => ctrl.getDevice('guide-nonexistent'),
      /未找到/,
    )
  })

  it('导玩员可以批量发送 MQTT 消息（正常流程）', () => {
    ctrl.connectMQTT('mqtt://test-broker:1883')
    const result = ctrl.publishMQTTBatch({
      messages: [
        { topic: 'device/guide-esp-007/cmd', payload: 'START' },
        { topic: 'device/guide-esp-008/cmd', payload: 'STOP' },
      ],
    })
    assert.equal(result.successCount, 2)
  })
})

// ──────────── 👔 店长：门店设备总览 ────────────
describe(`${ROLES.TenantAdmin} iot 角色测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以查看门店所有设备的总览（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'store-esp-001', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'store-esp-002', type: 'ESP32_S3' as any })
    ctrl.registerDevice({ deviceId: 'store-esp-003', type: 'ESP8266' as any })

    const list = ctrl.listDevices({})
    assert.equal(list.total, 3)
  })

  it('店长可以查看每个设备的详细信息和状态（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'store-esp-004', type: 'ESP32' as any })
    const device = ctrl.getDevice('store-esp-004')
    assert.equal(device.deviceId, 'store-esp-004')
    assert.equal(device.type, 'ESP32')
    assert.ok(device.createdAt)
    assert.ok(device.updatedAt)
  })

  it('店长可以查看设备健康度总体评估（正常流程）', async () => {
    ctrl.registerDevice({ deviceId: 'dev-001', type: 'ESP32' as any })
    const health = await ctrl.getDeviceHealth('dev-001')
    assert.ok(health.score >= 0 && health.score <= 100)
    assert.ok(['healthy', 'degraded', 'critical'].includes(health.overall))
  })

  it('店长可以查看设备的心跳状态确认设备在线（正常流程）', async () => {
    await ctrl.deviceOnline({ deviceId: 'store-esp-006', type: 'ESP32' as any })
    ctrl.reportHeartbeat({ deviceId: 'store-esp-006', latency: 15 })
    const status = ctrl.getHeartbeatStatus('store-esp-006')
    assert.ok(!status.isTimeout)
    assert.ok(status.lastHeartbeat)
  })

  it('店长可以查看设备部署后的 OTA 升级校验结果（正常流程）', async () => {
    ctrl.registerDevice({ deviceId: 'dev-004', type: 'ESP32' as any })
    const validate = await ctrl.validateAfterUpgrade('dev-004')
    assert.equal(typeof validate.valid, 'boolean')
    assert.ok(Array.isArray(validate.issues))
  })

  it('店长可以查看 MQTT 通信状态（正常流程）', () => {
    ctrl.connectMQTT('mqtt://broker.store:1883')
    const status = ctrl.getMQTTStatus()
    assert.equal(status.connected, true)
    assert.ok(status.brokerUrl)
  })

  it('店长可以创建工单处理设备问题（正常流程）', async () => {
    ctrl.registerDevice({ deviceId: 'store-esp-008', type: 'ESP32' as any })
    const workOrder = await ctrl.createWorkOrder({ deviceId: 'store-esp-008', issue: '设备离线' })
    assert.ok(workOrder.id)
    assert.equal(workOrder.deviceId, 'store-esp-008')
    // 工单服务默认优先级为 P3
    assert.equal(workOrder.priority, 'P3')
  })
})

// ──────────── 🛒 前台：设备状态查看 ────────────
describe(`${ROLES.Reception} iot 角色测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以查看所有设备列表了解哪些设备可用（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'rec-esp-001', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'rec-esp-002', type: 'ESP8266' as any })
    const list = ctrl.listDevices({})
    assert.equal(list.total, 2)
  })

  it('前台可以查看单个设备状态（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'rec-esp-003', type: 'ESP32' as any })
    const device = ctrl.getDevice('rec-esp-003')
    assert.ok(device.deviceId)
    assert.ok(device.createdAt)
  })

  it('前台可以通过 MQTT 获取历史消息（正常流程）', () => {
    ctrl.connectMQTT('mqtt://test-broker:1883')
    ctrl.publishMQTT({ topic: 'device/rec-esp-004/status', payload: 'OK' })
    const history = ctrl.getMQTTHistory()
    assert.ok(history.length > 0)
    assert.equal(history[0].topic, 'device/rec-esp-004/status')
  })

  it('前台可以查看设备心跳确认设备运行正常（正常流程）', async () => {
    await ctrl.deviceOnline({ deviceId: 'rec-esp-005', type: 'ESP32' as any })
    ctrl.reportHeartbeat({ deviceId: 'rec-esp-005', latency: 10 })
    const status = ctrl.getHeartbeatStatus('rec-esp-005')
    assert.equal(status.deviceId, 'rec-esp-005')
    assert.equal(status.consecutiveTimeouts, 0)
  })

  it('前台查看不存在的设备应报错（边界）', () => {
    assert.throws(
      () => ctrl.getDevice('rec-nonexistent'),
      /未找到/,
    )
  })

  it('前台可以按类型过滤在线设备（正常流程）', () => {
    ctrl.registerDevice({ deviceId: 'rec-esp-006', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'rec-esp-007', type: 'ESP32_S3' as any })

    const esp32List = ctrl.listDevices({ type: 'ESP32' as any })
    assert.equal(esp32List.total, 1)
    assert.equal(esp32List.devices[0].deviceId, 'rec-esp-006')
  })

  it('前台可以查看 MQTT Broker 连接状态（正常流程）', () => {
    const before = ctrl.getMQTTStatus()
    assert.equal(before.connected, false)

    ctrl.connectMQTT('mqtt://rec-broker:1883')
    const after = ctrl.getMQTTStatus()
    assert.equal(after.connected, true)
  })

  it('前台可以按主题获取 MQTT 历史消息（正常流程）', () => {
    ctrl.connectMQTT('mqtt://test-broker:1883')
    ctrl.publishMQTT({ topic: 'device/rec-esp-008/temperature', payload: '25.3' })
    ctrl.publishMQTT({ topic: 'device/rec-esp-008/humidity', payload: '60' })

    const tempHistory = ctrl.getMQTTHistory('device/rec-esp-008/temperature')
    assert.equal(tempHistory.length, 1)
    assert.equal(tempHistory[0].payload, '25.3')
  })
})
