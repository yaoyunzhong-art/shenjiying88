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
import type { ESP32Device } from './iot.entity'

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockBinary(size = 1024): Buffer {
  return Buffer.alloc(size, 0xAB)
}

// ── Setup ────────────────────────────────────────────────────────────────────

describe('IoTController', () => {
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
  // 设备管理 - 正例
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /iot/devices - register device', () => {
    it('should register a new ESP32 device', () => {
      const result = controller.registerDevice({
        deviceId: 'esp-001',
        type: 'ESP32_S3' as any,
      })

      expect(result.deviceId).toBe('esp-001')
      expect(result.status).toBe('OFFLINE')
      expect(deviceService.getDevice('esp-001')).toBeDefined()
    })

    it('should throw 409 when device already exists', () => {
      controller.registerDevice({
        deviceId: 'dup-device',
        type: 'ESP32' as any,
      })

      expect(() =>
        controller.registerDevice({
          deviceId: 'dup-device',
          type: 'ESP32' as any,
        }),
      ).toThrow(/设备已存在/)
    })

    it('should register ESP8266 device type', () => {
      const result = controller.registerDevice({
        deviceId: 'esp8266-test',
        type: 'ESP8266' as any,
      })

      expect(result.deviceId).toBe('esp8266-test')
      expect(result.type).toBe('ESP8266')
    })
  })

  describe('GET /iot/devices', () => {
    it('should list all devices', () => {
      controller.registerDevice({ deviceId: 'dev-1', type: 'ESP32' as any })
      controller.registerDevice({ deviceId: 'dev-2', type: 'ESP32_S3' as any })

      const result = controller.listDevices({})

      expect(result.total).toBe(2)
      expect(result.devices.length).toBe(2)
    })

    it('should filter devices by type', () => {
      controller.registerDevice({ deviceId: 'a', type: 'ESP32' as any })
      controller.registerDevice({ deviceId: 'b', type: 'ESP32_S3' as any })

      const result = controller.listDevices({ type: 'ESP32' as any })

      expect(result.total).toBe(1)
      expect(result.devices[0].deviceId).toBe('a')
    })

    it('should return empty list when no devices', () => {
      const result = controller.listDevices({})
      expect(result.total).toBe(0)
      expect(result.devices).toEqual([])
    })
  })

  describe('GET /iot/devices/:deviceId', () => {
    it('should get a single device', () => {
      controller.registerDevice({ deviceId: 'esp-001', type: 'ESP32' as any })

      const result = controller.getDevice('esp-001')

      expect(result.deviceId).toBe('esp-001')
    })

    it('should throw 404 when device not found', () => {
      expect(() => controller.getDevice('nonexistent')).toThrow(/设备未找到/)
    })
  })

  describe('POST /iot/devices/:deviceId/status', () => {
    it('should update device status', () => {
      controller.registerDevice({ deviceId: 'esp-001', type: 'ESP32' as any })

      const result = controller.updateDeviceStatus('esp-001', { status: 'ONLINE' as any })

      expect(result.status).toBe('ONLINE')
    })

    it('should throw 404 for unknown device', () => {
      expect(() =>
        controller.updateDeviceStatus('unknown', { status: 'ONLINE' as any }),
      ).toThrow(/设备未找到/)
    })
  })

  describe('DELETE /iot/devices/:deviceId', () => {
    it('should unregister a device', () => {
      controller.registerDevice({ deviceId: 'esp-001', type: 'ESP32' as any })

      const result = controller.unregisterDevice('esp-001')

      expect(result.success).toBe(true)
      expect(deviceService.getDevice('esp-001')).toBeUndefined()
    })

    it('should throw 404 for unknown device', () => {
      expect(() => controller.unregisterDevice('nonexistent')).toThrow(/设备未找到/)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 设备上线/下线
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /iot/devices/online', () => {
    it('should bring device online', async () => {
      const result = await controller.deviceOnline({
        deviceId: 'esp-001',
        type: 'ESP32' as any,
      })

      expect(result.deviceId).toBe('esp-001')
      expect(result.status).toBe('ONLINE')
    })
  })

  describe('POST /iot/devices/offline', () => {
    it('should take device offline', () => {
      controller.registerDevice({ deviceId: 'esp-001', type: 'ESP32' as any })

      const result = controller.deviceOffline({ deviceId: 'esp-001' })

      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // MQTT 通信
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /iot/mqtt/connect', () => {
    it('should connect to MQTT broker', () => {
      const result = controller.connectMQTT('mqtt://localhost:1883')

      expect(result.success).toBe(true)
      expect(result.connected).toBe(true)
    })
  })

  describe('POST /iot/mqtt/disconnect', () => {
    it('should disconnect from MQTT broker', () => {
      controller.connectMQTT('mqtt://localhost:1883')

      const result = controller.disconnectMQTT()

      expect(result.success).toBe(true)
      expect(result.connected).toBe(false)
    })
  })

  describe('POST /iot/mqtt/publish', () => {
    it('should publish when connected', () => {
      controller.connectMQTT('mqtt://localhost:1883')

      const result = controller.publishMQTT({
        topic: 'test/topic',
        payload: 'hello',
      })

      expect(result.success).toBe(true)
    })

    it('should throw when not connected', () => {
      expect(() =>
        controller.publishMQTT({
          topic: 'test/topic',
          payload: 'data',
        }),
      ).toThrow(/未连接到 Broker/)
    })
  })

  describe('POST /iot/mqtt/batch-publish', () => {
    it('should publish batch messages', () => {
      controller.connectMQTT('mqtt://localhost:1883')

      const result = controller.publishMQTTBatch({
        messages: [
          { topic: 't/1', payload: 'a' },
          { topic: 't/2', payload: 'b' },
        ],
      })

      expect(result.successCount).toBe(2)
    })
  })

  describe('GET /iot/mqtt/history', () => {
    it('should return message history', () => {
      controller.connectMQTT('mqtt://localhost:1883')
      controller.publishMQTT({ topic: 'test', payload: 'data' })

      const history = controller.getMQTTHistory()

      expect(history.length).toBeGreaterThan(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 心跳监控
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /iot/heartbeat', () => {
    it('should report heartbeat and return status', () => {
      const result = controller.reportHeartbeat({
        deviceId: 'esp-001',
        latency: 50,
      })

      expect(result.deviceId).toBe('esp-001')
      expect(result.currentInterval).toBeGreaterThan(0)
    })

    it('should detect timeout after many missed heartbeats', () => {
      const status = controller.reportHeartbeat({ deviceId: 'timeout-device', latency: 50 })

      expect(status.isTimeout).toBe(false)
    })
  })

  describe('GET /iot/heartbeat/:deviceId', () => {
    it('should get heartbeat status', () => {
      controller.registerDevice({ deviceId: 'esp-001', type: 'ESP32' as any })
      controller.reportHeartbeat({ deviceId: 'esp-001', latency: 50 })

      const status = controller.getHeartbeatStatus('esp-001')

      expect(status.deviceId).toBe('esp-001')
    })

    it('should throw 404 for unknown device', () => {
      expect(() => controller.getHeartbeatStatus('unknown')).toThrow(/设备未找到/)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // OTA 固件升级
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /iot/ota/firmware', () => {
    it('should upload firmware', async () => {
      const result = await controller.uploadFirmware({
        deviceType: 'sensor-v2',
        version: '1.0.0',
        uploadedBy: 'admin',
      })

      expect(result.deviceType).toBe('sensor-v2')
      expect(result.version).toBe('1.0.0')
      expect(result.id).toMatch(/^fw-/)
    })
  })

  describe('GET /iot/ota/firmware', () => {
    it('should list firmwares for device type', async () => {
      await controller.uploadFirmware({ deviceType: 'sensor-v2', version: '1.0.0' })

      const result = await controller.listFirmwares('sensor-v2')

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].deviceType).toBe('sensor-v2')
    })

    it('should throw 400 when deviceType missing', async () => {
      await expect(controller.listFirmwares('')).rejects.toThrow(/deviceType/)
    })
  })

  describe('POST /iot/ota/schedule', () => {
    it('should schedule OTA upgrade', async () => {
      const result = await controller.scheduleOTA({
        deviceIds: ['dev-001', 'dev-002'],
        firmwareVersion: '2.0.0',
      })

      expect(result.length).toBe(2)
      expect(result[0].status).toBe('scheduled')
    })
  })

  describe('POST /iot/ota/execute/:deviceId', () => {
    it('should execute OTA upgrade', async () => {
      await controller.scheduleOTA({
        deviceIds: ['dev-001'],
        firmwareVersion: '2.0.0',
      })

      const result = await controller.executeOTA('dev-001')

      expect(result.status).toBe('upgrading')
      expect(result.deviceId).toBe('dev-001')
    })
  })

  describe('POST /iot/ota/cancel/:otaTaskId', () => {
    it('should cancel a pending OTA task', async () => {
      const tasks = await controller.scheduleOTA({
        deviceIds: ['dev-002'],
        firmwareVersion: '2.0.0',
      })

      const result = await controller.cancelOTA(tasks[0].id)

      expect(result.success).toBe(true)
    })
  })

  describe('GET /iot/ota/status/:otaTaskId', () => {
    it('should get OTA task status', async () => {
      const tasks = await controller.scheduleOTA({
        deviceIds: ['dev-001'],
        firmwareVersion: '2.0.0',
      })

      const result = await controller.getOTAStatus(tasks[0].id)

      expect(result).not.toBeNull()
      expect(result!.deviceId).toBe('dev-001')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 设备健康度
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /iot/devices/:deviceId/health', () => {
    it('should get device health report', async () => {
      const result = await controller.getDeviceHealth('dev-001')

      expect(result.deviceId).toBe('dev-001')
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.overall).toBeDefined()
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 工单管理
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /iot/work-orders', () => {
    it('should create a work order for a registered device', async () => {
      // deviceOnline also registers the device
      const result = await controller.createWorkOrder({
        deviceId: 'dev-001',
        issue: '设备离线',
      })

      expect(result.deviceId).toBe('dev-001')
      expect(result.issue).toBe('设备离线')
      expect(result.status).toBe('open')
    })

    it('should throw 404 for unknown device', async () => {
      await expect(
        controller.createWorkOrder({
          deviceId: 'completely-unknown',
          issue: '故障',
        }),
      ).rejects.toThrow(/设备未找到/)
    })
  })

  describe('POST /iot/work-orders/auto-assign', () => {
    it('should auto-assign a work order', async () => {
      const result = await controller.autoAssignWorkOrder({
        deviceId: 'dev-001',
        deviceType: 'sensor-v2',
        description: '需要维修',
        priority: 'P2' as any,
      })

      expect(result).not.toBeNull()
      expect(result!.deviceId).toBe('dev-001')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // OTA 指令发送
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /iot/ota/send/:deviceId', () => {
    it('should send OTA update instruction', () => {
      controller.connectMQTT('mqtt://localhost:1883')
      controller.registerDevice({ deviceId: 'esp-ota', type: 'ESP32_S3' as any })

      const result = controller.sendOTAUpdate('esp-ota', 'https://fw.example.com/v2.bin')

      expect(result.success).toBe(true)
    })

    it('should throw 404 for unknown device', () => {
      expect(() =>
        controller.sendOTAUpdate('unknown', 'https://fw.example.com/v2.bin'),
      ).toThrow(/设备未找到/)
    })

    it('should throw 400 when firmwareUrl is missing', () => {
      controller.registerDevice({ deviceId: 'esp-001', type: 'ESP32' as any })

      expect(() => controller.sendOTAUpdate('esp-001', '')).toThrow(/firmwareUrl/)
    })
  })
})
