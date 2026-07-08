import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { IoTController } from './iot.controller'
import {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
} from './iot-hardware.service'
import { OTAFirmwareService, DeviceStateValidator, WorkOrderAutoAssignService } from './ota-upgrade.service'

describe('IoTController (spec)', () => {
  let controller: IoTController
  let deviceService: ESP32DeviceService
  let mqttService: MQTTBrokerService
  let heartbeatService: AdaptiveHeartbeatService
  let iotHardwareService: IoTHardwareService
  let otaService: OTAFirmwareService
  let workOrderService: WorkOrderAutoAssignService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IoTController],
      providers: [
        ESP32DeviceService,
        MQTTBrokerService,
        AdaptiveHeartbeatService,
        IoTHardwareService,
        OTAFirmwareService,
        DeviceStateValidator,
        WorkOrderAutoAssignService,
      ],
    }).compile()

    controller = module.get<IoTController>(IoTController)
    deviceService = module.get<ESP32DeviceService>(ESP32DeviceService)
    mqttService = module.get<MQTTBrokerService>(MQTTBrokerService)
    heartbeatService = module.get<AdaptiveHeartbeatService>(AdaptiveHeartbeatService)
    iotHardwareService = module.get<IoTHardwareService>(IoTHardwareService)
    otaService = module.get<OTAFirmwareService>(OTAFirmwareService)
    workOrderService = module.get<WorkOrderAutoAssignService>(WorkOrderAutoAssignService)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 设备管理 — 正例
  // ═══════════════════════════════════════════════════════════════════════════

  describe('设备注册', () => {
    it('应成功注册所有4种ESP32类型设备', () => {
      const types = ['ESP32_S3', 'ESP32_C3', 'ESP32', 'ESP8266'] as const
      for (const type of types) {
        const device = controller.registerDevice({
          deviceId: `test-${type}`,
          type: type as any,
        })
        expect(device.type).toBe(type)
      }
      expect(deviceService.listDevices({}).length).toBe(4)
    })

    it('重复设备应返回409冲突', () => {
      controller.registerDevice({ deviceId: 'dup', type: 'ESP32' as any })
      expect(() =>
        controller.registerDevice({ deviceId: 'dup', type: 'ESP32' as any }),
      ).toThrow()
    })
  })

  describe('设备查询与详情', () => {
    it('应返回空列表当无设备注册', () => {
      const result = controller.listDevices({})
      expect(result.total).toBe(0)
      expect(result.devices).toHaveLength(0)
    })

    it('应通过type过滤设备', () => {
      controller.registerDevice({ deviceId: 'a', type: 'ESP32' as any })
      controller.registerDevice({ deviceId: 'b', type: 'ESP8266' as any })
      const result = controller.listDevices({ type: 'ESP32' as any })
      expect(result.total).toBe(1)
      expect(result.devices[0].deviceId).toBe('a')
    })

    it('应通过status过滤设备', () => {
      controller.registerDevice({ deviceId: 'c', type: 'ESP32' as any })
      controller.updateDeviceStatus('c', { status: 'BUSY' as any })
      const result = controller.listDevices({ status: 'BUSY' as any })
      expect(result.total).toBe(1)
    })

    it('获取存在的设备应返回正确详情', () => {
      controller.registerDevice({ deviceId: 'detail-dev', type: 'ESP32_C3' as any })
      const device = controller.getDevice('detail-dev')
      expect(device.deviceId).toBe('detail-dev')
      expect(device.type).toBe('ESP32_C3')
    })

    it('获取不存在的设备应抛出404', () => {
      expect(() => controller.getDevice('non-existent')).toThrow()
    })
  })

  describe('设备状态更新', () => {
    it('应在状态间平稳切换并返回最新状态', () => {
      controller.registerDevice({ deviceId: 'stateful', type: 'ESP32' as any })

      const states = ['ONLINE', 'BUSY', 'OFFLINE', 'ERROR'] as const
      for (const state of states) {
        const updated = controller.updateDeviceStatus('stateful', { status: state as any })
        expect(updated.status).toBe(state)
      }
    })

    it('更新不存在的设备应抛出404', () => {
      expect(() =>
        controller.updateDeviceStatus('ghost', { status: 'ONLINE' as any }),
      ).toThrow()
    })

    it('删除后获取应抛出404', () => {
      controller.registerDevice({ deviceId: 'temp', type: 'ESP32' as any })
      controller.unregisterDevice('temp')
      expect(() => controller.getDevice('temp')).toThrow()
    })

    it('删除后列表应为空', () => {
      controller.registerDevice({ deviceId: 'temp2', type: 'ESP32' as any })
      controller.unregisterDevice('temp2')
      expect(controller.listDevices({}).total).toBe(0)
    })

    it('删除不存在的设备应抛出404', () => {
      expect(() => controller.unregisterDevice('not-registered')).toThrow()
    })
  })

  describe('设备上下线', () => {
    it('上线设备应注册到服务', async () => {
      const device = await controller.deviceOnline({
        deviceId: 'online-esp',
        type: 'ESP32_S3' as any,
      })
      expect(device.deviceId).toBe('online-esp')
      expect(device.status).toBe('ONLINE')
    })

    it('下线设备应置为OFFLINE', () => {
      const result = controller.deviceOffline({ deviceId: 'offline-esp' })
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // MQTT 通信 — 正例+反例+边界
  // ═══════════════════════════════════════════════════════════════════════════

  describe('MQTT连接', () => {
    it('应成功连接到Broker', () => {
      const r1 = controller.connectMQTT('mqtt://broker1:1883')
      expect(r1.connected).toBe(true)
    })

    it('连接到不同Broker应返回已连接', () => {
      controller.connectMQTT('mqtt://broker1:1883')
      const r2 = controller.connectMQTT('mqtt://broker2:1883')
      expect(r2.connected).toBe(true)
    })

    it('断开后连接状态应为false', () => {
      controller.connectMQTT('mqtt://broker1:1883')
      const result = controller.disconnectMQTT()
      expect(result.connected).toBe(false)
    })
  })

  describe('MQTT消息发布', () => {
    it('应记录消息到历史', () => {
      controller.connectMQTT('mqtt://test:1883')
      controller.publishMQTT({ topic: 'devices/esp/cmd', payload: 'restart' })
      controller.publishMQTT({ topic: 'devices/esp/data', payload: '{"temp":25}' })

      const history = controller.getMQTTHistory()
      expect(history).toHaveLength(2)
    })

    it('未连接时发布应抛出503', () => {
      controller.disconnectMQTT()
      expect(() =>
        controller.publishMQTT({ topic: 'test', payload: 'data' }),
      ).toThrow()
    })

    it('批量发布应返回成功条数', () => {
      controller.connectMQTT('mqtt://test:1883')
      const result = controller.publishMQTTBatch({
        messages: [
          { topic: 't1', payload: 'p1' },
          { topic: 't2', payload: 'p2' },
        ],
      })
      expect(result.successCount).toBe(2)
    })

    it('批量发布空数组应返回0', () => {
      controller.connectMQTT('mqtt://test:1883')
      const result = controller.publishMQTTBatch({ messages: [] })
      expect(result.successCount).toBe(0)
    })

    it('按topic过滤历史应只返回匹配消息', () => {
      controller.connectMQTT('mqtt://test:1883')
      controller.publishMQTT({ topic: 'devices/esp/cmd', payload: 'restart' })
      controller.publishMQTT({ topic: 'devices/esp/data', payload: '{"temp":25}' })

      const filtered = controller.getMQTTHistory('devices/esp/cmd')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].topic).toBe('devices/esp/cmd')
    })

    it('MQTT状态应反映连接和消息数', () => {
      controller.connectMQTT('mqtt://test:1883')
      controller.publishMQTT({ topic: 't1', payload: 'p1' })
      controller.publishMQTT({ topic: 't2', payload: 'p2' })

      const status = controller.getMQTTStatus()
      expect(status.connected).toBe(true)
      expect(status.messageCount).toBeGreaterThanOrEqual(2)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 心跳监控 — 正例+反例+边界
  // ═══════════════════════════════════════════════════════════════════════════

  describe('心跳上报', () => {
    it('零延迟心跳应正常处理', () => {
      const result = controller.reportHeartbeat({ deviceId: 'zero-lat', latency: 0 })
      expect(result).toBeDefined()
      expect(result.avgLatency).toBe(0)
    })

    it('高延迟心跳应不崩溃', () => {
      const result = controller.reportHeartbeat({ deviceId: 'high-lat', latency: 5000 })
      expect(result.deviceId).toBe('high-lat')
    })

    it('边界延迟9999应正常', () => {
      const result = controller.reportHeartbeat({ deviceId: 'edge-lat', latency: 9999 })
      expect(result.avgLatency).toBe(9999)
    })
  })

  describe('心跳状态查询', () => {
    it('应先注册设备再查询心跳', () => {
      controller.registerDevice({ deviceId: 'hb-dev', type: 'ESP32' as any })
      controller.reportHeartbeat({ deviceId: 'hb-dev', latency: 50 })
      const status = controller.getHeartbeatStatus('hb-dev')
      expect(status.deviceId).toBe('hb-dev')
    })

    it('未注册设备查询心跳应抛404', () => {
      expect(() => controller.getHeartbeatStatus('no-dev')).toThrow()
    })
  })

  describe('延迟统计', () => {
    it('应返回正确的延迟均值', () => {
      controller.registerDevice({ deviceId: 'lat-dev', type: 'ESP32' as any })
      controller.reportHeartbeat({ deviceId: 'lat-dev', latency: 10 })
      controller.reportHeartbeat({ deviceId: 'lat-dev', latency: 20 })
      controller.reportHeartbeat({ deviceId: 'lat-dev', latency: 30 })

      const stats = controller.getLatencyStats('lat-dev')
      expect(stats.avg).toBe(20)
      expect(stats.min).toBe(10)
      expect(stats.max).toBe(30)
      expect(stats.count).toBe(3)
    })

    it('未注册设备的延迟统计应抛404', () => {
      expect(() => controller.getLatencyStats('no-dev')).toThrow()
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // OTA 固件升级 — 正例+反例+边界
  // ═══════════════════════════════════════════════════════════════════════════

  describe('固件上传与查询', () => {
    it('应成功上传固件', async () => {
      const fw = await controller.uploadFirmware({
        deviceType: 'ESP32',
        version: '2.0.0',
        uploadedBy: 'treege',
      })
      expect(fw.deviceType).toBe('ESP32')
      expect(fw.version).toBe('2.0.0')
    })

    it('列出固件应过滤deviceType', async () => {
      await controller.uploadFirmware({ deviceType: 'ESP32', version: '2.0.0', uploadedBy: 't' })
      await controller.uploadFirmware({ deviceType: 'ESP8266', version: '1.0.0', uploadedBy: 't' })

      const list = await controller.listFirmwares('ESP32')
      expect(list.every(fw => fw.deviceType === 'ESP32')).toBe(true)
    })

    it('无deviceType参数列出固件应抛400', async () => {
      await expect(controller.listFirmwares('')).rejects.toThrow()
    })
  })

  describe('OTA升级编排', () => {
    it('批量安排升级应返回任务列表', async () => {
      const tasks = await controller.scheduleOTA({
        deviceIds: ['dev-001', 'dev-002'],
        firmwareVersion: '2.0.0',
      })
      expect(tasks).toHaveLength(2)
      expect(tasks.every(t => t.status === 'scheduled')).toBe(true)
    })

    it('已在升级的设备再次执行应抛异常', async () => {
      // dev-002 可在 OTA 内部 deviceRegistry 找到,初始为 idle
      await controller.scheduleOTA({
        deviceIds: ['dev-002'],
        firmwareVersion: '2.0.0',
      })
      // 第一次执行: idle → upgrading, 成功
      await controller.executeOTA('dev-002')
      // 第二次执行: 已在升级中, 应抛出异常
      await expect(controller.executeOTA('dev-002')).rejects.toThrow()
    })

    it('升级前校验弱信号设备应不通过', async () => {
      const result = await controller.validateBeforeUpgrade('dev-003')
      expect(result.valid).toBe(false)
      expect(result.reasons.length).toBeGreaterThan(0)
    })

    it('升级后校验应返回结果', async () => {
      const result = await controller.validateAfterUpgrade('dev-001')
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('issues')
    })

    it('取消OTA应返回成功', async () => {
      const tasks = await controller.scheduleOTA({
        deviceIds: ['dev-001'],
        firmwareVersion: '2.0.0',
      })
      const taskId = tasks[0].id
      const result = await controller.cancelOTA(taskId)
      expect(result.success).toBe(true)
    })

    it('查询OTA状态应返回任务', async () => {
      const tasks = await controller.scheduleOTA({
        deviceIds: ['dev-001'],
        firmwareVersion: '2.0.0',
      })
      const taskId = tasks[0].id
      const status = await controller.getOTAStatus(taskId)
      expect(status).not.toBeNull()
      expect(status!.deviceId).toBe('dev-001')
    })

    it('查询不存在的OTA状态应返回null', async () => {
      const status = await controller.getOTAStatus('fake-task-id')
      expect(status).toBeNull()
    })
  })

  describe('设备健康度', () => {
    it('应返回设备健康报告', async () => {
      const health = await controller.getDeviceHealth('dev-001')
      expect(health).toHaveProperty('deviceId', 'dev-001')
      expect(health).toHaveProperty('score')
      expect(typeof health.score).toBe('number')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 工单管理 — 正例+反例+边界
  // ═══════════════════════════════════════════════════════════════════════════

  describe('工单创建', () => {
    it('应为已注册设备创建工单', async () => {
      controller.registerDevice({ deviceId: 'wo-dev', type: 'ESP32' as any })
      const wo = await controller.createWorkOrder({
        deviceId: 'wo-dev',
        issue: '设备离线',
      })
      expect(wo.deviceId).toBe('wo-dev')
      expect(wo.issue).toBe('设备离线')
    })

    it('为未注册设备创建工单应抛404', async () => {
      await expect(
        controller.createWorkOrder({
          deviceId: 'ghost-dev',
          issue: '测试',
        }),
      ).rejects.toThrow()
    })
  })

  describe('工单自动指派', () => {
    it('无匹配技术员时应创建开放工单', async () => {
      controller.registerDevice({ deviceId: 'remote-dev', type: 'ESP32' as any })

      const result = await controller.autoAssignWorkOrder({
        deviceId: 'remote-dev',
        deviceType: 'quantum-computer',
        description: '需要量子计算专家',
        priority: 'P1' as any,
        requiredSkills: ['quantum-computer'],
      })

      expect(result).not.toBeNull()
      expect(result!.status).toBe('open')
    })

    it('有匹配技术员时应自动指派', async () => {
      controller.registerDevice({ deviceId: 'esp-dev', type: 'ESP32' as any })
      const result = await controller.autoAssignWorkOrder({
        deviceId: 'esp-dev',
        deviceType: 'ESP32',
        description: 'WiFi模块故障',
        priority: 'P2' as any,
        requiredSkills: ['esp32-repair'],
      })
      expect(result).not.toBeNull()
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 设备端OTA推送 — 正例+反例
  // ═══════════════════════════════════════════════════════════════════════════

  describe('设备端OTA推送', () => {
    it('向已注册设备发送OTA应返回结果对象', () => {
      controller.registerDevice({ deviceId: 'ota-push', type: 'ESP32' as any })
      const result = controller.sendOTAUpdate('ota-push', 'https://fw.example.com/v2.bin')
      expect(result).toHaveProperty('success')
    })

    it('向未注册设备发送OTA应抛404', () => {
      expect(() =>
        controller.sendOTAUpdate('ghost', 'https://fw.example.com/v2.bin'),
      ).toThrow()
    })

    it('空firmwareUrl应抛400', () => {
      controller.registerDevice({ deviceId: 'no-url', type: 'ESP32' as any })
      expect(() =>
        controller.sendOTAUpdate('no-url', ''),
      ).toThrow()
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 综合场景
  // ═══════════════════════════════════════════════════════════════════════════

  describe('设备全生命周期', () => {
    it('注册 → 更新状态 → 心跳 → OTA → 下线 → 删除', async () => {
      // 注册
      controller.registerDevice({ deviceId: 'lifecycle', type: 'ESP32_S3' as any })

      // 上线状态
      const online = controller.updateDeviceStatus('lifecycle', { status: 'ONLINE' as any })
      expect(online.status).toBe('ONLINE')

      // 心跳
      const hb = controller.reportHeartbeat({ deviceId: 'lifecycle', latency: 100 })
      expect(hb.avgLatency).toBe(100)

      // OTA 安排
      const tasks = await controller.scheduleOTA({ deviceIds: ['lifecycle'], firmwareVersion: '3.0.0' })
      expect(tasks.length).toBe(1)

      // 下线
      const offline = controller.deviceOffline({ deviceId: 'lifecycle' })
      expect(offline.success).toBe(true)

      // 删除
      controller.unregisterDevice('lifecycle')
      expect(() => controller.getDevice('lifecycle')).toThrow()
    })
  })
})
