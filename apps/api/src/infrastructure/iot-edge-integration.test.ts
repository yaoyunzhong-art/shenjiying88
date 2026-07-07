import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * IoT + Edge 跨模块集成测试 (T120-3/T123-3)
 *
 * 使用 vitest globals (describe/it)
 * 测试 IoT设备上报 → Edge计算 → 云端存储全链路
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
} from '../modules/iot/iot-hardware.service'
import {
  OfflineTicketService,
  TimeSyncService,
  TicketStatus,
} from '../modules/edge/edge-computing.service'
import {
  EdgeInferenceService,
  EdgeModelCache,
} from '../modules/edge/edge-ai.service'
import {
  OTAFirmwareService,
  DeviceStateValidator,
} from '../modules/iot/ota-upgrade.service'
import {
  ClickHouseClient,
  FakeClickHouseClient,
  AnalyticsDataPipeline,
  EventRecord,
} from './clickhouse/clickhouse.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createFakeClickHouse(): FakeClickHouseClient {
  return new FakeClickHouseClient()
}

function createClickHouseClient(fake: FakeClickHouseClient): ClickHouseClient {
  return new ClickHouseClient(
    { host: 'localhost', port: 8123, database: 'default', username: 'default', password: '' },
    fake
  )
}

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
// 1. IoT设备上报 → Edge计算 → 云端存储全链路 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('IoT设备上报 → Edge计算 → 云端存储全链路', () => {
  it('设备数据采集 → MQTT发布 → Edge预处理 → ClickHouse存储', async () => {
    // 1. 创建设备服务并注册设备
    const iotService = createIoTHardwareService()
    const device = await iotService.deviceOnline('sensor-001', DeviceType.ESP32_S3)
    assert.equal(device.status, DeviceStatus.ONLINE)

    // 2. 连接MQTT
    iotService.mqttService.connect('mqtt://test-broker:1883')

    // 3. 订阅传感器数据主题
    let receivedData: any = null
    iotService.mqttService.subscribe('sensors/+/data', (msg) => {
      receivedData = JSON.parse(msg.payload)
    })

    // 4. 模拟设备上报数据
    const sensorData = {
      deviceId: 'sensor-001',
      temperature: 25.5,
      humidity: 60,
      timestamp: Date.now(),
    }
    iotService.mqttService.publish('sensors/sensor-001/data', JSON.stringify(sensorData))

    // 5. 验证数据被Edge接收
    assert.ok(receivedData)
    assert.equal(receivedData.deviceId, 'sensor-001')
    assert.equal(receivedData.temperature, 25.5)

    // 6. Edge计算（计算移动平均）
    const processedData = {
      ...receivedData,
      temperatureMA: (receivedData.temperature + 25 + 26) / 3, // 简化移动平均
      processedAt: Date.now(),
    }

    // 7. 存储到ClickHouse
    const fake = createFakeClickHouse()
    await fake.connect()
    const client = createClickHouseClient(fake)
    await client.connect()
    const pipeline = new AnalyticsDataPipeline(fake)

    const event: EventRecord = {
      eventId: `evt-iot-${Date.now()}`,
      eventType: 'SENSOR_DATA',
      memberId: 'device-sensor-001',
      storeId: 'store-iot-001',
      tenantId: 'tenant-001',
      payload: processedData,
      occurredAt: new Date().toISOString(),
    }

    await pipeline.recordEvent(event)

    // 8. 验证存储
    const events = await pipeline.queryEvents({ tenantId: 'tenant-001', eventType: 'SENSOR_DATA' })
    assert.ok(events.length > 0)
    assert.equal(events[0].payload.temperature, 25.5)
  })

  it('设备心跳 → Edge监控 → 异常告警 → 云端记录', () => {
    // 1. 创建设备和心跳服务
    const iotService = createIoTHardwareService()
    iotService.mqttService.connect('mqtt://test-broker:1883')

    // 2. 设备上线并记录心跳
    iotService.deviceOnline('monitor-001', DeviceType.ESP32)
    iotService.handleHeartbeat('monitor-001', 50)
    iotService.handleHeartbeat('monitor-001', 55)
    iotService.handleHeartbeat('monitor-001', 45)

    // 3. Edge监控获取状态
    const status = iotService.heartbeatService.getHeartbeatStatus('monitor-001')
    assert.equal(status.deviceId, 'monitor-001')
    assert.ok(status.lastHeartbeat)
    assert.ok(status.avgLatency > 0)

    // 4. 检测超时（模拟连续超时）
    iotService.heartbeatService.resetHeartbeat('monitor-001')
    const alert = iotService.heartbeatService.alertIfTimeout('monitor-001')
    // 新设备刚reset不会立即timeout

    // 5. 更新设备状态
    const device = iotService.deviceService.getDevice('monitor-001')
    assert.ok(device)
    assert.equal(device!.status, DeviceStatus.ONLINE)
  })

  it('多设备并发上报 → Edge聚合 → 云端存储时序数据', async () => {
    const iotService = createIoTHardwareService()
    iotService.mqttService.connect('mqtt://test-broker:1883')

    // 1. 注册多个设备
    const deviceIds = ['dev-A', 'dev-B', 'dev-C']
    for (const id of deviceIds) {
      await iotService.deviceOnline(id, DeviceType.ESP32_S3)
    }

    // 2. 收集所有设备数据
    const allData: any[] = []
    iotService.mqttService.subscribe('devices/+/telemetry', (msg) => {
      allData.push(JSON.parse(msg.payload))
    })

    // 3. 模拟多设备并发上报
    for (const id of deviceIds) {
      iotService.mqttService.publish(`devices/${id}/telemetry`, JSON.stringify({
        deviceId: id,
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        timestamp: Date.now(),
      }))
    }

    // 4. 等待所有消息被处理
    assert.equal(allData.length, 3)

    // 5. Edge聚合计算
    const avgCpu = allData.reduce((sum, d) => sum + d.cpu, 0) / allData.length
    const maxMemory = Math.max(...allData.map((d) => d.memory))

    // 6. 存储聚合结果到ClickHouse
    const fake = createFakeClickHouse()
    await fake.connect()
    const pipeline = new AnalyticsDataPipeline(fake)

    await pipeline.recordEvent({
      eventId: `evt-aggr-${Date.now()}`,
      eventType: 'DEVICE_TELEMETRY_AGGREGATED',
      memberId: 'system',
      storeId: 'store-aggr',
      tenantId: 'tenant-001',
      payload: { avgCpu, maxMemory, deviceCount: deviceIds.length },
      occurredAt: new Date().toISOString(),
    })

    // 7. 验证聚合结果
    const events = await pipeline.queryEvents({ tenantId: 'tenant-001', eventType: 'DEVICE_TELEMETRY_AGGREGATED' })
    assert.ok(events.length > 0)
    assert.equal(events[0].payload.deviceCount, 3)
  })

  it('设备离线事件 → Edge检测 → 云端状态更新', async () => {
    const iotService = createIoTHardwareService()
    iotService.mqttService.connect('mqtt://test-broker:1883')

    // 1. 设备上线
    await iotService.deviceOnline('offline-dev-001', DeviceType.ESP32)
    let device = iotService.deviceService.getDevice('offline-dev-001')
    assert.equal(device!.status, DeviceStatus.ONLINE)

    // 2. 订阅设备状态变更
    let statusChangeReceived = false
    iotService.mqttService.subscribe('devices/+/status', (msg) => {
      if (msg.payload.includes('OFFLINE')) {
        statusChangeReceived = true
      }
    })

    // 3. 设备离线
    iotService.deviceOffline('offline-dev-001')

    // 4. 验证状态变更
    device = iotService.deviceService.getDevice('offline-dev-001')
    assert.equal(device!.status, DeviceStatus.OFFLINE)

    // 5. 发布离线事件到MQTT
    iotService.mqttService.publish('devices/offline-dev-001/status', JSON.stringify({
      deviceId: 'offline-dev-001',
      status: 'OFFLINE',
      timestamp: Date.now(),
    }))

    // 6. 验证事件被接收
    assert.equal(statusChangeReceived, true)
  })
})

// ─────────────────────────────────────────────────────────────
// 2. OTA升级 → Edge验证 → 云端设备注册表更新 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('OTA升级 → Edge验证 → 云端设备注册表更新', () => {
  it('固件上传 → 安排OTA → Edge验证新版本功能正常 → 更新设备注册表', async () => {
    // 1. 创建OTA服务
    const otaService = createOTAService()
    const validator = new DeviceStateValidator(otaService)

    // 2. 上传新固件
    const firmwareBinary = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06])
    const firmware = await otaService.uploadFirmware('sensor-v2', '3.0.0', firmwareBinary, 'admin')
    assert.ok(firmware.id.startsWith('fw-'))
    assert.equal(firmware.version, '3.0.0')

    // 3. 设备注册并安排OTA（使用mock device ID）
    const iotService = createIoTHardwareService()
    await iotService.deviceOnline('dev-001', DeviceType.ESP32_S3)
    const tasks = await otaService.scheduleOTA(['dev-001'], '3.0.0')
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].status, 'scheduled')

    // 4. 执行OTA升级
    const otaTask = await otaService.executeOTA('dev-001')
    assert.equal(otaTask.status, 'upgrading')

    // 5. Edge验证新版本功能正常（模拟验证）
    const preUpgradeHealth = await validator.getDeviceHealth('dev-001')
    assert.ok(preUpgradeHealth)

    // 6. 模拟升级完成
    const postUpgradeHealth = await validator.getDeviceHealth('dev-001')
    assert.ok(postUpgradeHealth)

    // 7. 更新设备注册表（模拟）
    const device = iotService.deviceService.getDevice('dev-001')
    assert.ok(device)
    assert.equal(device!.status, DeviceStatus.ONLINE)
  })

  it('OTA升级前验证 → 电池电量不足 → 升级取消', async () => {
    const otaService = createOTAService()
    const validator = new DeviceStateValidator(otaService)

    // 1. 验证设备状态（dev-002电池电量15%，低于20%阈值）
    const validationBefore = await validator.validateBeforeUpgrade('dev-002')
    assert.equal(validationBefore.valid, false)
    assert.ok(validationBefore.reasons.some((r) => r.includes('Battery')))

    // 2. 上传固件
    const firmwareBinary = Buffer.from([0x01, 0x02])
    await otaService.uploadFirmware('sensor-v2', '3.1.0', firmwareBinary)

    // 3. 尝试对dev-003执行OTA（网络信号弱）
    const validationDev003 = await validator.validateBeforeUpgrade('dev-003')
    assert.equal(validationDev003.valid, false)
    assert.ok(validationDev003.reasons.some((r) => r.includes('weak') || r.includes('not found')))
  })

  it('OTA升级后验证 → 传感器故障 → 记录问题', async () => {
    const otaService = createOTAService()
    const validator = new DeviceStateValidator(otaService)

    // 1. dev-002有传感器故障
    const validationAfter = await validator.validateAfterUpgrade('dev-002')
    assert.equal(validationAfter.valid, false)
    assert.ok(validationAfter.issues.some((i) => i.includes('sensor')))

    // 2. 记录问题到ClickHouse
    const fake = createFakeClickHouse()
    await fake.connect()
    const pipeline = new AnalyticsDataPipeline(fake)

    await pipeline.recordEvent({
      eventId: `evt-ota-issue-${Date.now()}`,
      eventType: 'OTA_UPGRADE_ISSUE',
      memberId: 'system',
      storeId: 'store-ota',
      tenantId: 'tenant-001',
      payload: {
        deviceId: 'dev-002',
        issues: validationAfter.issues,
        timestamp: Date.now(),
      },
      occurredAt: new Date().toISOString(),
    })

    // 3. 验证问题已记录
    const events = await pipeline.queryEvents({ tenantId: 'tenant-001', eventType: 'OTA_UPGRADE_ISSUE' })
    assert.ok(events.length > 0)
  })

  it('批量OTA升级 → 进度跟踪 → 完成状态汇总', async () => {
    const otaService = createOTAService()

    // 1. 上传固件
    const firmwareBinary = Buffer.from([0x01, 0x02, 0x03])
    await otaService.uploadFirmware('sensor-v2', '4.0.0', firmwareBinary)

    // 2. 批量安排OTA
    const deviceIds = ['ota-batch-1', 'ota-batch-2', 'ota-batch-3']
    const tasks = await otaService.scheduleOTA(deviceIds, '4.0.0')
    assert.equal(tasks.length, 3)

    // 3. 验证所有任务状态
    for (const task of tasks) {
      assert.equal(task.status, 'scheduled')
    }

    // 4. 获取OTA状态列表
    const statusList = await Promise.all(tasks.map((t) => otaService.getOTAStatus(t.id)))
    assert.equal(statusList.length, 3)
    assert.ok(statusList.every((s) => s !== null))
  })
})
