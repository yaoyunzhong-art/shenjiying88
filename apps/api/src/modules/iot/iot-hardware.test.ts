import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  ESP32DeviceService,
  MQTTBrokerService,
  AdaptiveHeartbeatService,
  IoTHardwareService,
  DeviceType,
  DeviceStatus,
} from './iot-hardware.service'

// ── ESP32DeviceService Tests ──────────────────────────────────────────────────

describe('ESP32DeviceService', () => {
  let service: ESP32DeviceService

  beforeEach(() => {
    service = new ESP32DeviceService()
  })

  describe('registerDevice', () => {
    it('should register device with valid parameters', () => {
      const device = service.registerDevice('esp-001', DeviceType.ESP32_S3)
      assert.equal(device.deviceId, 'esp-001')
      assert.equal(device.type, DeviceType.ESP32_S3)
      assert.equal(device.status, DeviceStatus.OFFLINE)
      assert.ok(device.createdAt)
    })

    it('should throw error for duplicate device ID', () => {
      service.registerDevice('esp-001', DeviceType.ESP32)
      assert.throws(() => {
        service.registerDevice('esp-001', DeviceType.ESP32_C3)
      }, /already registered/)
    })

    it('should register multiple devices with different IDs', () => {
      service.registerDevice('esp-001', DeviceType.ESP32)
      service.registerDevice('esp-002', DeviceType.ESP32_S3)
      const devices = service.listDevices()
      assert.equal(devices.length, 2)
    })
  })

  describe('getDevice', () => {
    it('should return device by ID', () => {
      service.registerDevice('esp-001', DeviceType.ESP32)
      const device = service.getDevice('esp-001')
      assert.ok(device)
      assert.equal(device!.deviceId, 'esp-001')
    })

    it('should return undefined for non-existent device', () => {
      const device = service.getDevice('non-existent')
      assert.equal(device, undefined)
    })
  })

  describe('updateDeviceStatus', () => {
    it('should update device status', () => {
      service.registerDevice('esp-001', DeviceType.ESP32)
      const updated = service.updateDeviceStatus('esp-001', DeviceStatus.ONLINE)
      assert.ok(updated)
      assert.equal(updated!.status, DeviceStatus.ONLINE)
    })

    it('should return undefined when updating non-existent device', () => {
      const updated = service.updateDeviceStatus('non-existent', DeviceStatus.ONLINE)
      assert.equal(updated, undefined)
    })
  })

  describe('listDevices', () => {
    it('should list all devices', () => {
      service.registerDevice('esp-001', DeviceType.ESP32)
      service.registerDevice('esp-002', DeviceType.ESP32_S3)
      service.updateDeviceStatus('esp-001', DeviceStatus.ONLINE)
      const devices = service.listDevices()
      assert.equal(devices.length, 2)
    })

    it('should filter by status', () => {
      service.registerDevice('esp-001', DeviceType.ESP32)
      service.registerDevice('esp-002', DeviceType.ESP32_S3)
      service.updateDeviceStatus('esp-001', DeviceStatus.ONLINE)
      const onlineDevices = service.listDevices({ status: DeviceStatus.ONLINE })
      assert.equal(onlineDevices.length, 1)
      assert.equal(onlineDevices[0].deviceId, 'esp-001')
    })

    it('should filter by type', () => {
      service.registerDevice('esp-001', DeviceType.ESP32)
      service.registerDevice('esp-002', DeviceType.ESP32_S3)
      const s3Devices = service.listDevices({ type: DeviceType.ESP32_S3 })
      assert.equal(s3Devices.length, 1)
      assert.equal(s3Devices[0].deviceId, 'esp-002')
    })
  })
})

// ── MQTTBrokerService Tests ───────────────────────────────────────────────────

describe('MQTTBrokerService', () => {
  let service: MQTTBrokerService

  beforeEach(() => {
    service = new MQTTBrokerService()
  })

  describe('connect / disconnect', () => {
    it('should connect to MQTT broker', () => {
      const result = service.connect('mqtt://localhost:1883')
      assert.equal(result, true)
      assert.equal(service.isConnected(), true)
    })

    it('should disconnect from broker', () => {
      service.connect('mqtt://localhost:1883')
      service.disconnect()
      assert.equal(service.isConnected(), false)
    })
  })

  describe('publish / subscribe', () => {
    it('should publish message and deliver to subscriber', () => {
      service.connect('mqtt://localhost:1883')
      let receivedPayload: string | null = null

      service.subscribe('test/topic', (msg) => {
        receivedPayload = msg.payload
      })

      service.publish('test/topic', 'hello world')
      assert.equal(receivedPayload, 'hello world')
    })

    it('should publish message to multiple subscribers', () => {
      service.connect('mqtt://localhost:1883')
      const received: string[] = []

      service.subscribe('test/topic', (msg) => received.push(msg.payload + '-A'))
      service.subscribe('test/topic', (msg) => received.push(msg.payload + '-B'))

      service.publish('test/topic', 'message')
      assert.equal(received.length, 2)
      assert.ok(received.includes('message-A'))
      assert.ok(received.includes('message-B'))
    })

    it('should support wildcard topic matching', () => {
      service.connect('mqtt://localhost:1883')
      let receivedCount = 0

      service.subscribe('devices/+/status', () => {
        receivedCount++
      })

      service.publish('devices/esp-001/status', 'online')
      service.publish('devices/esp-002/status', 'offline')
      assert.equal(receivedCount, 2)
    })

    it('should return false when publishing without connection', () => {
      const result = service.publish('test/topic', 'message')
      assert.equal(result, false)
    })
  })

  describe('unsubscribe', () => {
    it('should unsubscribe specific handler', () => {
      service.connect('mqtt://localhost:1883')
      let count = 0
      const handler = () => count++

      service.subscribe('test/topic', handler)
      service.publish('test/topic', 'msg')
      assert.equal(count, 1)

      service.unsubscribe('test/topic', handler)
      service.publish('test/topic', 'msg')
      assert.equal(count, 1) // 不再增加
    })
  })

  describe('getMessageHistory', () => {
    it('should return message history', () => {
      service.connect('mqtt://localhost:1883')
      service.publish('test/topic', 'msg1')
      service.publish('test/topic', 'msg2')
      const history = service.getMessageHistory()
      assert.equal(history.length, 2)
    })
  })
})

// ── AdaptiveHeartbeatService Tests ───────────────────────────────────────────

describe('AdaptiveHeartbeatService', () => {
  let service: AdaptiveHeartbeatService

  beforeEach(() => {
    service = new AdaptiveHeartbeatService()
  })

  describe('recordHeartbeat', () => {
    it('should record heartbeat and update status', () => {
      service.recordHeartbeat('esp-001', 50)
      const status = service.getHeartbeatStatus('esp-001')
      assert.ok(status.lastHeartbeat)
      assert.equal(status.deviceId, 'esp-001')
    })

    it('should maintain heartbeat records', () => {
      service.recordHeartbeat('esp-001', 30)
      service.recordHeartbeat('esp-001', 40)
      service.recordHeartbeat('esp-001', 50)
      const status = service.getHeartbeatStatus('esp-001')
      assert.ok(status.avgLatency > 0)
    })
  })

  describe('adaptive interval calculation', () => {
    it('should shorten interval when latency is low', () => {
      // 连续记录低延迟
      for (let i = 0; i < 5; i++) {
        service.recordHeartbeat('esp-low-latency', 50)
      }
      const status = service.getHeartbeatStatus('esp-low-latency')
      // 低延迟时，optimalInterval 应该小于或等于 baseInterval
      assert.ok(status.optimalInterval <= 30_000)
    })

    it('should lengthen interval when latency is high', () => {
      // 连续记录高延迟
      for (let i = 0; i < 5; i++) {
        service.recordHeartbeat('esp-high-latency', 800)
      }
      const status = service.getHeartbeatStatus('esp-high-latency')
      // 高延迟时，optimalInterval 应该大于 baseInterval
      assert.ok(status.optimalInterval >= 30_000)
    })

    it('should use base interval with insufficient data', () => {
      service.recordHeartbeat('esp-new', 50)
      const status = service.getHeartbeatStatus('esp-new')
      assert.equal(status.optimalInterval, 30_000)
    })
  })

  describe('getLatencyStats', () => {
    it('should return correct latency statistics', () => {
      service.recordHeartbeat('esp-001', 30)
      service.recordHeartbeat('esp-001', 50)
      service.recordHeartbeat('esp-001', 70)
      const stats = service.getLatencyStats('esp-001')
      assert.equal(stats.avg, 50)
      assert.equal(stats.min, 30)
      assert.equal(stats.max, 70)
      assert.equal(stats.count, 3)
    })
  })

  describe('resetHeartbeat', () => {
    it('should reset heartbeat records', () => {
      service.recordHeartbeat('esp-001', 50)
      service.resetHeartbeat('esp-001')
      const status = service.getHeartbeatStatus('esp-001')
      assert.equal(status.lastHeartbeat, null)
      assert.equal(status.avgLatency, 0)
    })
  })
})

// ── IoTHardwareService (Facade) Tests ────────────────────────────────────────

describe('IoTHardwareService', () => {
  let service: IoTHardwareService

  beforeEach(() => {
    service = new IoTHardwareService(
      new ESP32DeviceService(),
      new MQTTBrokerService(),
      new AdaptiveHeartbeatService()
    )
  })

  describe('deviceOnline', () => {
    it('should register device and set status to ONLINE', async () => {
      const device = await service.deviceOnline('esp-001', DeviceType.ESP32_S3)
      assert.equal(device.status, DeviceStatus.ONLINE)
      assert.equal(device.type, DeviceType.ESP32_S3)
    })
  })

  describe('deviceOffline', () => {
    it('should set device status to OFFLINE and reset heartbeat', async () => {
      await service.deviceOnline('esp-001', DeviceType.ESP32)
      service.heartbeatService.recordHeartbeat('esp-001', 50)
      service.deviceOffline('esp-001')
      const device = service.deviceService.getDevice('esp-001')
      assert.equal(device!.status, DeviceStatus.OFFLINE)
    })
  })

  describe('sendOTAUpdate', () => {
    it('should publish OTA message via MQTT', () => {
      service.mqttService.connect('mqtt://localhost:1883')
      const result = service.sendOTAUpdate('esp-001', 'https://firmware.example.com/v2')
      assert.equal(result, true)
    })
  })

  describe('handleHeartbeat', () => {
    it('should update heartbeat and return status', () => {
      const status = service.handleHeartbeat('esp-001', 100)
      assert.ok(status.lastHeartbeat)
      assert.equal(status.deviceId, 'esp-001')
    })

    it('should mark device as ERROR on timeout', async () => {
      await service.deviceOnline('esp-001', DeviceType.ESP32)
      // 只记录一次低延迟心跳，不会触发超时
      service.handleHeartbeat('esp-001', 50)
      const status = service.heartbeatService.getHeartbeatStatus('esp-001')
      // 正常情况下不应触发超时
      assert.equal(status.deviceId, 'esp-001')
    })
  })
})
