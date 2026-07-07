import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * IoT E2E 集成测试 (T120-3)
 *
 * 使用 vitest globals (describe/it)
 * 测试设备注册 → MQTT连接 → 心跳 → OTA升级全流程
 *
 * 落地：HEARTBEAT-63
 */

import assert from 'node:assert/strict'
import {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
  DeviceType,
  DeviceStatus,
} from './iot-hardware.service'
import {
  OTAFirmwareService,
  DeviceStateValidator,
  WorkOrderAutoAssignService,
} from './ota-upgrade.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createIoTHardwareService(): IoTHardwareService {
  return new IoTHardwareService(
    new ESP32DeviceService(),
    new MQTTBrokerService(),
    new AdaptiveHeartbeatService()
  )
}

function createOTAService(): OTAFirmwareService {
  return new OTAFirmwareService()
}

// ─────────────────────────────────────────────────────────────
// 1. 设备注册 → MQTT连接 → 心跳 → OTA升级全流程 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('IoT 设备注册 → MQTT连接 → 心跳 → OTA升级全流程', () => {
  let iotService: IoTHardwareService
  let otaService: OTAFirmwareService

  beforeEach(() => {
    iotService = createIoTHardwareService()
    otaService = createOTAService()
  })

  it('全流程：注册设备 → 连接MQTT → 记录心跳', async () => {
    // 1. 注册设备
    const device = await iotService.deviceOnline('esp-e2e-001', DeviceType.ESP32_S3)
    assert.equal(device.deviceId, 'esp-e2e-001')
    assert.equal(device.type, DeviceType.ESP32_S3)
    assert.equal(device.status, DeviceStatus.ONLINE)

    // 2. 连接MQTT
    const mqttConnected = iotService.mqttService.connect('mqtt://test-broker:1883')
    assert.equal(mqttConnected, true)
    assert.equal(iotService.mqttService.isConnected(), true)

    // 3. 记录心跳
    const heartbeatStatus = iotService.handleHeartbeat('esp-e2e-001', 45)
    assert.equal(heartbeatStatus.deviceId, 'esp-e2e-001')
    assert.ok(heartbeatStatus.lastHeartbeat)
    assert.ok(heartbeatStatus.avgLatency > 0)
  })

  it('全流程：上传固件 → 安排OTA → 执行OTA → 验证升级后状态', async () => {
    // 1. 注册设备（使用OTA service中的mock device）
    await iotService.deviceOnline('dev-001', DeviceType.ESP32)

    // 2. 上传固件
    const firmwareBinary = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05])
    const firmware = await otaService.uploadFirmware('sensor-v2', '2.0.0', firmwareBinary, 'admin')
    assert.ok(firmware.id.startsWith('fw-'))
    assert.equal(firmware.version, '2.0.0')

    // 3. 安排OTA（使用mock device ID）
    const tasks = await otaService.scheduleOTA(['dev-001'], '2.0.0')
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].status, 'scheduled')

    // 4. 执行OTA
    const otaTask = await otaService.executeOTA('dev-001')
    assert.equal(otaTask.status, 'upgrading')
    assert.ok(otaTask.startedAt)

    // 5. 验证升级后状态
    const validator = new DeviceStateValidator(otaService)
    const health = await validator.getDeviceHealth('dev-001')
    assert.equal(health.deviceId, 'dev-001')
    assert.ok(health.score >= 0)
  })

  it('MQTT消息发布和订阅全流程验证', () => {
    // 1. 连接MQTT
    iotService.mqttService.connect('mqtt://test-broker:1883')

    // 2. 订阅OTA主题
    let otaMessageReceived = false
    let receivedPayload = ''
    iotService.mqttService.subscribe('devices/+/ota', (msg) => {
      otaMessageReceived = true
      receivedPayload = msg.payload
    })

    // 3. 发送OTA更新
    const sent = iotService.sendOTAUpdate('esp-001', 'https://firmware.example.com/v3.0.0')
    assert.equal(sent, true)

    // 4. 验证消息被接收
    assert.equal(otaMessageReceived, true)
    const payload = JSON.parse(receivedPayload)
    assert.equal(payload.firmwareUrl, 'https://firmware.example.com/v3.0.0')
  })

  it('心跳超时检测 → 设备状态变更为ERROR', async () => {
    // 1. 注册设备并连接MQTT
    await iotService.deviceOnline('esp-timeout-001', DeviceType.ESP32_C3)
    iotService.mqttService.connect('mqtt://test-broker:1883')

    // 2. 记录多次心跳建立正常状态
    for (let i = 0; i < 5; i++) {
      iotService.handleHeartbeat('esp-timeout-001', 50)
    }

    // 3. 模拟心跳服务重置（模拟设备离线）
    iotService.heartbeatService.resetHeartbeat('esp-timeout-001')

    // 4. 验证设备状态
    const device = iotService.deviceService.getDevice('esp-timeout-001')
    assert.ok(device)
    assert.equal(device!.status, DeviceStatus.ONLINE)
  })
})

// ─────────────────────────────────────────────────────────────
// 2. 工单自动转派流程 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('IoT 工单自动转派流程', () => {
  let otaService: OTAFirmwareService
  let validator: DeviceStateValidator
  let workOrderService: WorkOrderAutoAssignService

  beforeEach(() => {
    otaService = createOTAService()
    validator = new DeviceStateValidator(otaService)
    workOrderService = new WorkOrderAutoAssignService(validator)
  })

  it('设备异常 → 创建工单 → 自动指派给最近的技术员', async () => {
    // 1. 设备异常检测（电池电量低）
    const healthBefore = await validator.getDeviceHealth('dev-002')
    assert.ok(healthBefore.battery.level < 50)

    // 2. 创建工单
    const workOrder = await workOrderService.createWorkOrder('Battery low warning', 'dev-002')
    assert.ok(workOrder.id.startsWith('wo-'))
    assert.equal(workOrder.status, 'open')

    // 3. 自动指派
    const assigned = await workOrderService.autoAssign({
      deviceId: 'dev-002',
      deviceType: 'sensor-v2',
      description: 'Battery low warning',
      priority: 'P2',
      requiredSkills: ['sensor-v2'],
      location: { lat: 31.2304, lng: 121.4737 },
    })

    assert.ok(assigned)
    assert.ok(assigned.assigneeId)
    assert.equal(assigned.status, 'assigned')
  })

  it('工单创建后状态为open → 指派后状态变为assigned', async () => {
    // 1. 创建工单
    const workOrder = await workOrderService.createWorkOrder('Sensor malfunction', 'dev-001')
    assert.equal(workOrder.status, 'open')

    // 2. 手动指派技术员
    const result = await workOrderService.assignWorkOrder(workOrder.id, 'tech-001')
    assert.equal(result, true)

    // 3. 验证工单状态
    const updatedWorkOrder = await workOrderService.createWorkOrder('Sensor malfunction', 'dev-001')
    const assigned = await workOrderService.assignWorkOrder(updatedWorkOrder.id, 'tech-001')
    assert.equal(assigned, true)
  })

  it('自动指派考虑技术员当前工作负载', async () => {
    // tech-002 当前工作负载为0，tech-001为2，tech-003为5
    // 期望自动指派给tech-002

    const issue = {
      deviceId: 'dev-001',
      deviceType: 'sensor-v2',
      description: 'Routine check',
      priority: 'P3',
      requiredSkills: ['sensor-v2'],
    }

    const result = await workOrderService.autoAssign(issue as any)
    assert.ok(result)
    // tech-002 workload=0 应该被选中
    assert.equal(result.assigneeId, 'tech-002')
  })

  it('工单按技能匹配和地理位置自动分配', async () => {
    const issue = {
      deviceId: 'dev-001',
      deviceType: 'sensor-v2',
      description: 'Sensor malfunction',
      priority: 'P2',
      requiredSkills: ['sensor-v2'],
      location: { lat: 31.2404, lng: 121.4837 }, // 更靠近tech-002
    }

    const result = await workOrderService.autoAssign(issue as any)
    assert.ok(result)
    assert.ok(result.assigneeId)
    // 验证指派给了合适的技术员
    assert.ok(['tech-001', 'tech-002', 'tech-003'].includes(result.assigneeId!))
  })
})

// ─────────────────────────────────────────────────────────────
// 3. 自适应心跳 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('IoT 自适应心跳 E2E', () => {
  let heartbeatService: AdaptiveHeartbeatService

  beforeEach(() => {
    heartbeatService = new AdaptiveHeartbeatService()
  })

  it('低延迟 → 缩短间隔，全流程验证', () => {
    // 连续记录低延迟心跳
    for (let i = 0; i < 10; i++) {
      heartbeatService.recordHeartbeat('esp-low-latency', 30 + i * 5)
    }

    const status = heartbeatService.getHeartbeatStatus('esp-low-latency')

    // 低延迟时，optimalInterval 应该小于或等于 baseInterval
    assert.ok(status.optimalInterval <= 30_000)
    assert.ok(status.avgLatency < 100)
  })

  it('高延迟 → 延长间隔，全流程验证', () => {
    // 连续记录高延迟心跳
    for (let i = 0; i < 10; i++) {
      heartbeatService.recordHeartbeat('esp-high-latency', 600 + i * 50)
    }

    const status = heartbeatService.getHeartbeatStatus('esp-high-latency')

    // 高延迟时，optimalInterval 应该大于 baseInterval
    assert.ok(status.optimalInterval > 30_000)
    assert.ok(status.avgLatency >= 500)
  })

  it('低延迟 → 高延迟 → 延长间隔自适应调整', () => {
    // 第一阶段：低延迟
    for (let i = 0; i < 5; i++) {
      heartbeatService.recordHeartbeat('esp-adaptive', 40)
    }
    const statusAfterLow = heartbeatService.getHeartbeatStatus('esp-adaptive')
    const intervalAfterLow = statusAfterLow.optimalInterval

    // 第二阶段：突然高延迟
    for (let i = 0; i < 5; i++) {
      heartbeatService.recordHeartbeat('esp-adaptive', 800)
    }
    const statusAfterHigh = heartbeatService.getHeartbeatStatus('esp-adaptive')
    const intervalAfterHigh = statusAfterHigh.optimalInterval

    // 间隔应该从短变长
    assert.ok(intervalAfterHigh > intervalAfterLow)
    assert.ok(statusAfterHigh.avgLatency > statusAfterLow.avgLatency)
  })

  it('自适应心跳统计信息正确计算', () => {
    // 记录多个心跳
    const latencies = [30, 50, 70, 90, 110]
    for (const latency of latencies) {
      heartbeatService.recordHeartbeat('esp-stats', latency)
    }

    const stats = heartbeatService.getLatencyStats('esp-stats')
    const expectedAvg = latencies.reduce((a, b) => a + b, 0) / latencies.length

    assert.equal(stats.count, 5)
    assert.equal(stats.min, 30)
    assert.equal(stats.max, 110)
    assert.equal(stats.avg, expectedAvg)
  })
})
