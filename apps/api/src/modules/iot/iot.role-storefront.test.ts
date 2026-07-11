import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [iot] [C] 门店角色全场景测试 (storefront)
 *
 * 4 个门店角色视角的 iot 模块测试：
 * 🎮导玩员 — 开关机/查设备状态/报修
 * 🔧安监 — 安全检查/查维保计划/记录巡检
 * 👔店长 — 设备台账/审批维修/查看在线率
 * 🎯运行专员 — 监控健康/排期维保/处理告警
 *
 * 每个角色 2-3 个测试用例（正常流程 + 反例/边界）
 * 共 10+ 个独立测试用例
 */

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

// ── 角色定义 ──
const ROLES = {
  Guide: '🎮导玩员',
  Safety: '🔧安监',
  StoreManager: '👔店长',
  Operations: '🎯运行专员',
} as const

// ── 辅助工厂 ──

function makeController(): IoTController {
  const deviceService = new ESP32DeviceService()
  const mqttService = new MQTTBrokerService()
  const heartbeatService = new AdaptiveHeartbeatService()
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

// ════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏设备操作视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Guide} iot 门店测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可将游戏机上线供顾客游玩（正例）', async () => {
    const device = await ctrl.deviceOnline({ deviceId: 'machine-arcade-01', type: 'ESP32' as any })
    assert.equal(device.deviceId, 'machine-arcade-01')
    assert.equal(device.status, 'ONLINE')
  })

  it('导玩员可查看设备状态确认机器可用（正例）', () => {
    const device = ctrl.registerDevice({ deviceId: 'machine-arcade-02', type: 'ESP32' as any })
    assert.equal(device.deviceId, 'machine-arcade-02')
    assert.equal(device.status, 'OFFLINE')
    assert.ok(device.createdAt)
  })

  it('导玩员可查看所有游戏设备列表（正例）', () => {
    ctrl.registerDevice({ deviceId: 'machine-g01', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'machine-g02', type: 'ESP32_S3' as any })
    ctrl.registerDevice({ deviceId: 'machine-g03', type: 'ESP8266' as any })

    const list = ctrl.listDevices({})
    assert.equal(list.total, 3)
    assert.equal(list.devices.length, 3)
  })

  it('导玩员可创建故障报修工单（正例）', async () => {
    ctrl.registerDevice({ deviceId: 'machine-broken', type: 'ESP32' as any })
    const workOrder = await ctrl.createWorkOrder({
      deviceId: 'machine-broken',
      issue: '投币器卡住，无法正常投币',
    })

    assert.ok(workOrder.id)
    assert.equal(workOrder.deviceId, 'machine-broken')
    assert.equal(workOrder.issue, '投币器卡住，无法正常投币')
  })

  it('导玩员查询不存在设备应报错（反例）', () => {
    assert.throws(
      () => ctrl.getDevice('nonexistent-machine'),
      /未找到/,
    )
  })
})

// ════════════════════════════════════════════════════════
// 🔧安监 — 设备安全巡检视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Safety} iot 门店测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可对设备执行安全检查（正例）', async () => {
    ctrl.registerDevice({ deviceId: 'machine-safe-01', type: 'ESP32' as any })
    const health = await ctrl.getDeviceHealth('machine-safe-01')

    assert.equal(health.deviceId, 'machine-safe-01')
    assert.ok(health.score >= 0 && health.score <= 100)
    assert.ok(['healthy', 'degraded', 'critical'].includes(health.overall))
  })

  it('安监可查看设备健康报告中的电池/网络/传感器信息（正例）', async () => {
    ctrl.registerDevice({ deviceId: 'machine-safe-02', type: 'ESP32_S3' as any })
    const health = await ctrl.getDeviceHealth('machine-safe-02')

    assert.ok(health.battery)
    assert.equal(health.battery.health, 'good')
    assert.ok(health.network)
    assert.ok(health.sensors)
    assert.ok(health.firmware)
  })

  it('安监可记录巡检日志（通过心跳上报）（正例）', async () => {
    await ctrl.deviceOnline({ deviceId: 'machine-inspect', type: 'ESP32' as any })
    const status = ctrl.reportHeartbeat({ deviceId: 'machine-inspect', latency: 25 })

    assert.equal(status.deviceId, 'machine-inspect')
    assert.equal(status.consecutiveTimeouts, 0)
    assert.ok(status.lastHeartbeat)
  })

  it('安监检查不存在的设备应报错（反例）', () => {
    assert.throws(
      () => ctrl.getDevice('nonexistent-safe-check'),
      /未找到/,
    )
  })
})

// ════════════════════════════════════════════════════════
// 👔店长 — 门店设备管理视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} iot 门店测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可查看门店全部设备台账（正例）', () => {
    ctrl.registerDevice({ deviceId: 'machine-sm-01', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'machine-sm-02', type: 'ESP32_S3' as any })
    ctrl.registerDevice({ deviceId: 'machine-sm-03', type: 'ESP8266' as any })
    ctrl.registerDevice({ deviceId: 'machine-sm-04', type: 'ESP32' as any })

    const list = ctrl.listDevices({})
    assert.equal(list.total, 4)
  })

  it('店长可查看单个设备详细信息（正例）', () => {
    ctrl.registerDevice({ deviceId: 'machine-sm-detail', type: 'ESP32' as any })
    const device = ctrl.getDevice('machine-sm-detail')

    assert.equal(device.deviceId, 'machine-sm-detail')
    assert.equal(device.type, 'ESP32')
    assert.ok(device.createdAt)
    assert.ok(device.updatedAt)
  })

  it('店长可查看设备运行时间统计（通过心跳数据和健康报告）（正例）', async () => {
    await ctrl.deviceOnline({ deviceId: 'machine-uptime', type: 'ESP32' as any })
    ctrl.reportHeartbeat({ deviceId: 'machine-uptime', latency: 10 })
    ctrl.reportHeartbeat({ deviceId: 'machine-uptime', latency: 15 })

    const latencyStats = ctrl.getLatencyStats('machine-uptime')
    assert.equal(latencyStats.avg, 12.5)
    assert.equal(latencyStats.min, 10)
    assert.equal(latencyStats.max, 15)
    assert.equal(latencyStats.count, 2)
  })

  it('店长可审批维修工单（通过自动指派）（正例）', async () => {
    ctrl.registerDevice({ deviceId: 'machine-repair', type: 'ESP32' as any })
    const workOrder = await ctrl.createWorkOrder({
      deviceId: 'machine-repair',
      issue: '屏幕显示异常',
    })
    assert.ok(workOrder.id)
    assert.equal(workOrder.deviceId, 'machine-repair')

    // 自动指派工单（店长审批视角）
    const assigned = await ctrl.autoAssignWorkOrder({
      deviceId: 'machine-repair',
      deviceType: 'ESP32',
      description: '屏幕显示异常',
      priority: 'P2',
    })
    assert.ok(assigned)
    assert.equal(assigned!.deviceId, 'machine-repair')
  })

  it('店长为不存在设备创建工单应报错（反例）', async () => {
    try {
      await ctrl.createWorkOrder({ deviceId: 'nonexistent', issue: '故障' })
      assert.fail('应抛出错误')
    } catch (e: any) {
      assert.ok(e.message.includes('未找到'))
    }
  })
})

// ════════════════════════════════════════════════════════
// 🎯运行专员 — 设备运维监控视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Operations} iot 门店测试`, () => {
  let ctrl: IoTController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可监控设备健康度（正例）', async () => {
    ctrl.registerDevice({ deviceId: 'machine-health-01', type: 'ESP32' as any })
    const health = await ctrl.getDeviceHealth('machine-health-01')

    assert.equal(health.deviceId, 'machine-health-01')
    assert.ok(health.score >= 0)
    assert.ok(health.overall)
    assert.ok(health.battery)
    assert.ok(health.network)
    assert.ok(health.sensors)
  })

  it('运行专员可安排设备固件升级排期（正例）', async () => {
    await ctrl.uploadFirmware({ deviceType: 'ESP32', version: '3.0.0', uploadedBy: 'ops-user' })
    const tasks = await ctrl.scheduleOTA({
      deviceIds: ['machine-ota-01', 'machine-ota-02'],
      firmwareVersion: '3.0.0',
    })

    // OTA 服务对未注册设备也会创建任务
    assert.equal(tasks.length, 2)
    assert.ok(tasks.every((t) => t.status === 'scheduled'))
  })

  it('运行专员可处理设备告警（通过查看心跳超时状态）（正例）', async () => {
    await ctrl.deviceOnline({ deviceId: 'machine-alert', type: 'ESP32' as any })
    ctrl.reportHeartbeat({ deviceId: 'machine-alert', latency: 5 })

    // 检查心跳状态是否正常
    const status = ctrl.getHeartbeatStatus('machine-alert')
    assert.equal(status.isTimeout, false)
    assert.ok(status.lastHeartbeat)
  })

  it('运行专员可按类型筛选设备列表（正例）', () => {
    ctrl.registerDevice({ deviceId: 'ops-esp32-01', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'ops-esp32-02', type: 'ESP32' as any })
    ctrl.registerDevice({ deviceId: 'ops-esp8266-01', type: 'ESP8266' as any })

    const esp32list = ctrl.listDevices({ type: 'ESP32' as any })
    assert.equal(esp32list.total, 2)

    const esp8266List = ctrl.listDevices({ type: 'ESP8266' as any })
    assert.equal(esp8266List.total, 1)
  })

  it('运行专员查看不存在设备的健康度应报错（反例）', async () => {
    try {
      await ctrl.getDeviceHealth('nonexistent-health-monitor')
      assert.fail('应抛出错误')
    } catch (e: any) {
      assert.ok(e.message.includes('未找到'))
    }
  })
})
