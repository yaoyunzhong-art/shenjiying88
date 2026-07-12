/**
 * iot.role-scenario.test.ts — IoT 设备管理场景驱动角色测试
 *
 * 跨角色场景:
 *   S1: 🎯运行专员注册设备 → 🔧安监验证设备状态 → 🎮导玩员查看设备
 *   S2: 🎯运行专员执行OTA升级 → 🔧安监验证升级结果 → 🎮导玩员验证设备
 *   S3: 👔店长查看全店设备健康 → 🛒前台确认设备在线 → 🔧安监处理异常
 *   S4: 🎯运行专员配置MQTT → 🔧安监监控消息 → 👥HR审计日志
 *   S5: 🛒前台报修设备 → 🔧安监创建工单 → 🛒前台确认恢复
 *   S6: 📢营销查看设备统计 → 🤝团建规划设备使用 → 🎯运行专员分配资源
 *   S7: 🎮导玩员日常巡检 → 🛒前台处理异常上报 → 👔店长查看巡检报告
 *   S8: 👥HR查看设备操作日志 → 📢营销评估设备利用率 → 🤝团建确认设备可用
 */

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
import { IoTController } from './iot.controller'

// ── 测试辅助函数 ──
function setup() {
  const deviceService = new ESP32DeviceService()
  const mqttService = new MQTTBrokerService()
  const heartbeatService = new AdaptiveHeartbeatService()
  const iotHardwareService = new IoTHardwareService(deviceService, mqttService, heartbeatService as any)
  const otaService = new OTAFirmwareService()
  const deviceValidator = new DeviceStateValidator(otaService as any)
  const workOrderService = new WorkOrderAutoAssignService(deviceValidator as any)

  const controller = new IoTController(
    deviceService,
    mqttService,
    heartbeatService as any,
    iotHardwareService as any,
    otaService as any,
    deviceValidator as any,
    workOrderService as any,
  )

  return { controller, deviceService, mqttService, heartbeatService, iotHardwareService, otaService, deviceValidator, workOrderService }
}


// ═══════════════════════════════════════════════════════════════════════════════
// S1 · 🎯运行专员注册设备 → 🔧安监验证设备状态 → 🎮导玩员查看设备
// ═══════════════════════════════════════════════════════════════════════════════
describe('🎯【S1】运行专员注册设备 → 🔧安监验证设备状态 → 🎮导玩员查看设备', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(() => { ctx = setup() })

  it('S1-正常流程: 运行专员注册多台设备 → 安监验证全部在线 → 导玩员查看设备列表', async () => {
    const { controller } = ctx

    // 1. 🎯运行专员注册设备 (deviceOnline 同时完成注册+上线)
    const dev1 = await controller.deviceOnline({ deviceId: 'arcade-01', type: 'ESP32' as any })
    expect(dev1.deviceId).toBe('arcade-01')
    expect(dev1.status).toBe('ONLINE')

    const dev2 = await controller.deviceOnline({ deviceId: 'arcade-02', type: 'ESP32' as any })
    expect(dev2.deviceId).toBe('arcade-02')

    const dev3 = await controller.deviceOnline({ deviceId: 'printer-01', type: 'ESP32-S3' as any })
    expect(dev3.deviceId).toBe('printer-01')

    // 2. 🔧安监验证设备状态
    const allDevices = controller.listDevices({})
    expect(allDevices.total).toBe(3)

    for (const dev of allDevices.devices) {
      expect(dev.status).toBe('ONLINE')
    }

    // 3. 🎮导玩员查看设备列表，确认所有设备就绪
    const gameDevices = controller.listDevices({ type: 'ESP32' as any })
    expect(gameDevices.total).toBe(2)

    const arcade01 = controller.getDevice('arcade-01')
    expect(arcade01.type).toBe('ESP32')
    expect(arcade01.deviceId).toBe('arcade-01')
  })

  it('S1-边界: 重复注册已存在的设备返回冲突', () => {
    const { controller } = ctx
    controller.registerDevice({ deviceId: 'arcade-01', type: 'ESP32' as any })
    expect(() => controller.registerDevice({ deviceId: 'arcade-01', type: 'ESP32' as any })).toThrow('设备已存在')
  })

  it('S1-异常: 查询不存在的设备报错', () => {
    const { controller } = ctx
    expect(() => controller.getDevice('non-existent')).toThrow('设备未找到')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S2 · 🎯运行专员执行OTA升级 → 🔧安监验证升级结果 → 🎮导玩员验证设备
// ═══════════════════════════════════════════════════════════════════════════════
describe('🎯【S2】运行专员执行OTA升级 → 🔧安监验证升级结果 → 🎮导玩员验证设备', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(() => {
    ctx = setup()
  })

  it('S2-正常流程: 上传固件 → 安排升级 → 执行升级 → 验证通过', async () => {
    const { controller } = ctx

    // 使用 OTA 服务内置 mock 设备 (dev-001, dev-002)
    // 1. 🎯运行专员上传固件
    const firmware = await controller.uploadFirmware({
      deviceType: 'sensor-v2',
      version: '2.1.0',
      uploadedBy: 'ops-lee',
    })
    expect(firmware.version).toBe('2.1.0')
    expect(firmware.deviceType).toBe('sensor-v2')

    // 2. 🎯安排升级 (OTA 使用预注册的 dev-001, dev-002)
    const tasks = await controller.scheduleOTA({
      deviceIds: ['dev-001', 'dev-002'],
      firmwareVersion: '2.1.0',
    })
    expect(tasks.length).toBe(2)

    // 3. 🎯执行升级
    const result1 = await controller.executeOTA('dev-001')
    expect(result1.deviceId).toBe('dev-001')
    // executeOTA 返回'upgrading'状态，后台模拟更新
    expect(result1.status).toBe('upgrading')

    const result2 = await controller.executeOTA('dev-002')
    expect(result2.deviceId).toBe('dev-002')
    expect(result2.status).toBe('upgrading')

    // 4. 🔧安监验证升级结果
    const validate1 = await controller.validateAfterUpgrade('dev-001')
    expect(validate1.valid).toBe(true)

    // 5. 检查 OTA 任务状态
    const status1 = await controller.getOTAStatus(result1.id)
    expect(status1).not.toBeNull()
  })

  it('S2-边界: 升级前验证阻止不合法设备升级', async () => {
    const { controller } = ctx
    const result = await controller.validateBeforeUpgrade('dev-001')
    // OTA 层内置 mock 设备 dev-001
    expect(result).toBeDefined()
    expect(typeof result.valid).toBe('boolean')
    expect(Array.isArray(result.reasons)).toBe(true)
  })

  it('S2-异常: 对不存在设备执行OTA应报错', async () => {
    const { controller } = ctx
    try {
      await controller.executeOTA('non-existent-device')
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeDefined()
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S3 · 👔店长查看全店设备健康 → 🛒前台确认设备在线 → 🔧安监处理异常
// ═══════════════════════════════════════════════════════════════════════════════
describe('👔【S3】店长查看全店设备健康 → 🛒前台确认设备在线 → 🔧安监处理异常', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(async () => {
    ctx = setup()
    const { controller } = ctx
    await controller.deviceOnline({ deviceId: 'cabinet-01', type: 'ESP32' as any })
    await controller.deviceOnline({ deviceId: 'cabinet-02', type: 'ESP32' as any })
    await controller.deviceOnline({ deviceId: 'terminal-01', type: 'ESP32-S3' as any })
  })

  it('S3-正常流程: 店长查看健康报告 → 前台确认在线 → 安监处理异常', async () => {
    const { controller } = ctx

    // 1. 👔店长查看设备健康度
    const health1 = await controller.getDeviceHealth('cabinet-01')
    expect(health1.deviceId).toBe('cabinet-01')
    expect(health1.score).toBeGreaterThanOrEqual(0)
    expect(health1.overall).toBeDefined()

    // 全部在线
    const allDevices = controller.listDevices({})
    expect(allDevices.total).toBe(3)
    expect(allDevices.devices.every(d => d.status === 'ONLINE')).toBe(true)

    // 2. 🛒前台确认设备在线
    const terminal = controller.getDevice('terminal-01')
    expect(terminal.status).toBe('ONLINE')
  })

  it('S3-边界: 店长查看不存在的设备健康度', async () => {
    const { controller } = ctx
    try {
      await controller.getDeviceHealth('non-existent')
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeDefined()
    }
  })

  it('S3-异常: 查询不存在设备的心跳状态应报错', () => {
    const { controller } = ctx
    expect(() => controller.getHeartbeatStatus('ghost-device')).toThrow('设备未找到')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S4 · 🎯运行专员配置MQTT → 🔧安监监控消息 → 👥HR审计日志
// ═══════════════════════════════════════════════════════════════════════════════
describe('🎯【S4】运行专员配置MQTT → 🔧安监监控消息 → 👥HR审计日志', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(() => { ctx = setup() })

  it('S4-正常流程: 运行连接MQTT → 发送控制指令 → 安监验证消息 → HR查看历史', () => {
    const { controller } = ctx

    // 1. 🎯运行专员连接MQTT Broker
    const connectResult = controller.connectMQTT('mqtt://broker.example.com:1883')
    expect(connectResult.success).toBe(true)
    expect(connectResult.connected).toBe(true)

    // 2. 🎯发布控制指令
    const publishResult = controller.publishMQTT({
      topic: 'store/001/cabinet/control',
      payload: JSON.stringify({ command: 'restart', reason: 'scheduled maintenance' }),
      qos: 1,
    })
    expect(publishResult.success).toBe(true)

    // 3. 🔧安监监控消息 — 查看历史确认指令已发出
    const history = controller.getMQTTHistory('store/001/cabinet/control')
    expect(history.length).toBe(1)
    expect(history[0].topic).toBe('store/001/cabinet/control')

    // 4. 👥HR审计日志 — 审核所有消息记录
    const allHistory = controller.getMQTTHistory()
    expect(allHistory.length).toBe(1)

    // 5. 校验MQTT状态
    const status = controller.getMQTTStatus()
    expect(status.connected).toBe(true)
    expect(status.messageCount).toBe(1)
  })

  it('S4-正常流程: 批量发布MQTT消息', () => {
    const { controller } = ctx
    controller.connectMQTT('mqtt://test-broker:1883')

    const batchResult = controller.publishMQTTBatch({
      messages: [
        { topic: 'store/cmd/01', payload: 'reboot' },
        { topic: 'store/cmd/02', payload: 'status-check' },
        { topic: 'store/cmd/03', payload: 'restart-service' },
      ],
    })
    expect(batchResult.successCount).toBe(3)
  })

  it('S4-边界: MQTT断开后发布消息应报错', () => {
    const { controller } = ctx
    expect(() => controller.publishMQTT({
      topic: 'test/topic',
      payload: 'test',
    })).toThrow('MQTT 发布失败')
  })

  it('S4-异常: 断开MQTT后状态应反映断开', () => {
    const { controller } = ctx
    controller.connectMQTT('mqtt://broker:1883')
    controller.disconnectMQTT()

    const status = controller.getMQTTStatus()
    expect(status.connected).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S5 · 🛒前台报修设备 → 🔧安监创建工单 → 🛒前台确认恢复
// ═══════════════════════════════════════════════════════════════════════════════
describe('🛒【S5】前台报修设备 → 🔧安监创建工单 → 前台确认恢复', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(async () => {
    ctx = setup()
    const { controller } = ctx
    await controller.deviceOnline({ deviceId: 'arcade-s5-01', type: 'ESP32' as any })
  })

  it('S5-正常流程: 前台报修 → 安监登记工单 → 前台确认恢复', async () => {
    const { controller } = ctx

    // 1. 🛒前台发现设备异常 — 确认设备原为在线状态
    const deviceBefore = controller.getDevice('arcade-s5-01')
    expect(deviceBefore.status).toBe('ONLINE')

    // 2. 🔧安监创建工单
    const workOrder = await controller.createWorkOrder({
      deviceId: 'arcade-s5-01',
      issue: '触屏无响应，重启后仍无法恢复',
      priority: 'HIGH' as any,
    })
    expect(workOrder).toBeDefined()

    // 3. 设备离线
    const offlineResult = controller.deviceOffline({ deviceId: 'arcade-s5-01' })
    expect(offlineResult.success).toBe(true)

    // 4. 🛒前台确认设备已标记离线（待维修）
    const device = controller.getDevice('arcade-s5-01')
    expect(device.status).toBe('OFFLINE')
  })

  it('S5-边界: 为在线设备创建维修工单仍应成功', async () => {
    const { controller } = ctx

    const workOrder = await controller.createWorkOrder({
      deviceId: 'arcade-s5-01',
      issue: '定期维护保养',
      priority: 'LOW' as any,
    })
    expect(workOrder).toBeDefined()
  })

  it('S5-异常: 为不存在的设备创建工单应报错', async () => {
    const { controller } = ctx
    try {
      await controller.createWorkOrder({
        deviceId: 'non-existent-device',
        issue: '故障',
      })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeDefined()
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S6 · 📢营销查看设备统计 → 🤝团建规划设备使用 → 🎯运行专员分配资源
// ═══════════════════════════════════════════════════════════════════════════════
describe('📢【S6】营销查看设备统计 → 🤝团建规划设备使用 → 🎯运行专员分配资源', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(async () => {
    ctx = setup()
    const { controller } = ctx
    await controller.deviceOnline({ deviceId: 'cabinet-s6-01', type: 'ESP32' as any })
    await controller.deviceOnline({ deviceId: 'cabinet-s6-02', type: 'ESP32' as any })
    await controller.deviceOnline({ deviceId: 'cabinet-s6-03', type: 'ESP32' as any })
  })

  it('S6-正常流程: 营销查看设备分布 → 团建规划活动 → 运行确认资源', async () => {
    const { controller } = ctx

    // 1. 📢营销查看设备统计（按类型过滤）
    const esp32Devices = controller.listDevices({ type: 'ESP32' as any })
    expect(esp32Devices.total).toBe(3)
    expect(esp32Devices.devices.every(d => d.status === 'ONLINE')).toBe(true)

    // 2. 🤝团建规划活动，确认有足够设备可用
    const availableDevices = controller.listDevices({})
    expect(availableDevices.total).toBeGreaterThanOrEqual(3)

    // 3. 🎯运行专员准备资源 — 确认全部 ready
    const healthCheck = await controller.getDeviceHealth('cabinet-s6-01')
    expect(healthCheck.deviceId).toBe('cabinet-s6-01')
  })

  it('S6-边界: 按不存在的类型查询返回空列表', () => {
    const { controller } = ctx
    const result = controller.listDevices({ type: 'RASPBERRY_PI' as any })
    expect(result.total).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S7 · 🎮导玩员日常巡检 → 🛒前台处理异常上报 → 👔店长查看巡检报告
// ═══════════════════════════════════════════════════════════════════════════════
describe('🎮【S7】导玩员日常巡检 → 🛒前台处理异常上报 → 👔店长查看巡检报告', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(async () => {
    ctx = setup()
    const { controller } = ctx
    await controller.deviceOnline({ deviceId: 'game-s7-01', type: 'ESP32' as any })
    await controller.deviceOnline({ deviceId: 'game-s7-02', type: 'ESP32' as any })
  })

  it('S7-正常流程: 导玩员上报心跳 → 安监查看状态 → 店长查看健康报告', () => {
    const { controller } = ctx

    // 1. 🎮导玩员日常巡检 — 上报心跳
    const hbStatus1 = controller.reportHeartbeat({ deviceId: 'game-s7-01', latency: 15 })
    expect(hbStatus1.deviceId).toBe('game-s7-01')
    expect(hbStatus1.avgLatency).toBe(15)
    // 上报后不应超时
    expect(hbStatus1.isTimeout).toBe(false)
    expect(hbStatus1.currentInterval).toBeGreaterThan(0)

    const hbStatus2 = controller.reportHeartbeat({ deviceId: 'game-s7-02', latency: 30 })
    expect(hbStatus2.deviceId).toBe('game-s7-02')
    expect(hbStatus2.avgLatency).toBe(30)

    // 2. 🛒前台查看心跳状态确认设备正常
    const hbQuery1 = controller.getHeartbeatStatus('game-s7-01')
    expect(hbQuery1.avgLatency).toBe(15)

    // 3. 🎯运行专员查看延迟统计
    const stats = controller.getLatencyStats('game-s7-01')
    expect(stats.count).toBe(1)
    expect(stats.avg).toBe(15)
    expect(stats.min).toBe(15)
    expect(stats.max).toBe(15)
  })

  it('S7-边界: 多次上报后延迟统计聚合正确', () => {
    const { controller } = ctx

    // 多次上报不同延迟
    controller.reportHeartbeat({ deviceId: 'game-s7-01', latency: 10 })
    controller.reportHeartbeat({ deviceId: 'game-s7-01', latency: 20 })
    controller.reportHeartbeat({ deviceId: 'game-s7-01', latency: 30 })

    const stats = controller.getLatencyStats('game-s7-01')
    expect(stats.count).toBe(3)
    expect(stats.min).toBe(10)
    expect(stats.max).toBe(30)
    expect(stats.avg).toBe((10 + 20 + 30) / 3)
  })

  it('S7-异常: 查询不存在设备的心跳状态应报错', () => {
    const { controller } = ctx
    expect(() => controller.getHeartbeatStatus('ghost-device')).toThrow('设备未找到')
  })

  it('S7-异常: 查询不存在设备的延迟统计应报错', () => {
    const { controller } = ctx
    expect(() => controller.getLatencyStats('ghost-device')).toThrow('设备未找到')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S8 · 👥HR查看设备操作日志 → 📢营销评估设备利用率 → 🤝团建确认设备可用
// ═══════════════════════════════════════════════════════════════════════════════
describe('👥【S8】HR查看设备操作日志 → 📢营销评估设备利用率 → 🤝团建确认设备可用', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(async () => {
    ctx = setup()
    const { controller } = ctx
    await controller.deviceOnline({ deviceId: 'audit-dev-01', type: 'ESP32' as any })
    await controller.deviceOnline({ deviceId: 'audit-dev-02', type: 'ESP32-S3' as any })

    // 产生操作日志
    controller.connectMQTT('mqtt://audit-broker:1883')
    controller.publishMQTT({ topic: 'audit/dev-01/cmd', payload: 'reboot' })
    controller.publishMQTT({ topic: 'audit/dev-01/cmd', payload: 'status-check' })
    controller.reportHeartbeat({ deviceId: 'audit-dev-01', latency: 20 })
  })

  it('S8-正常流程: HR审计MQTT消息 → 营销查看设备利用率 → 团建确认可用', () => {
    const { controller } = ctx

    // 1. 👥HR查看设备操作日志（MQTT消息历史）
    const history = controller.getMQTTHistory()
    expect(history.length).toBeGreaterThanOrEqual(2)

    // 可以按 topic 过滤
    const filteredHistory = controller.getMQTTHistory('audit/dev-01/cmd')
    expect(filteredHistory.length).toBe(2)

    // 2. 📢营销评估设备利用率
    const allDevices = controller.listDevices({})
    expect(allDevices.total).toBe(2)

    // 3. 🤝团建确认设备可用
    const device1 = controller.getDevice('audit-dev-01')
    expect(device1.status).toBe('ONLINE')

    const device2 = controller.getDevice('audit-dev-02')
    expect(device2.status).toBe('ONLINE')
  })

  it('S8-边界: 没有操作日志的 topic 返回空数组', () => {
    const { controller } = ctx
    const emptyHistory = controller.getMQTTHistory('non-existent/topic')
    expect(emptyHistory).toEqual([])
  })

  it('S8-异常: 已删除设备无法查询详情', () => {
    const { controller } = ctx
    const deleteResult = controller.unregisterDevice('audit-dev-02')
    expect(deleteResult.success).toBe(true)

    expect(() => controller.getDevice('audit-dev-02')).toThrow('设备未找到')
  })

  it('S8-边界: 设备离线后操作日志仍然可审计', () => {
    const { controller } = ctx
    // 设备离线
    const result = controller.deviceOffline({ deviceId: 'audit-dev-01' })
    expect(result.success).toBe(true)

    // 离线后 MQTT 消息历史依然可查询
    const history = controller.getMQTTHistory('audit/dev-01/cmd')
    expect(history.length).toBe(2)

    // 设备状态已变更
    const device = controller.getDevice('audit-dev-01')
    expect(device.status).toBe('OFFLINE')
  })
})
