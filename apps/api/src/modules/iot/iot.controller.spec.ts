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
  })

  describe('设备注册边界条件', () => {
    it('should register devices with all 4 ESP32 types', () => {
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

    it('should handle duplicate registration', () => {
      controller.registerDevice({ deviceId: 'dup', type: 'ESP32' as any })
      expect(() =>
        controller.registerDevice({ deviceId: 'dup', type: 'ESP32' as any }),
      ).toThrow()
    })

    it('should handle concurrent device status updates', () => {
      controller.registerDevice({ deviceId: 'concurrent', type: 'ESP32' as any })

      const states = ['ONLINE', 'BUSY', 'OFFLINE', 'ERROR'] as const
      for (const state of states) {
        const updated = controller.updateDeviceStatus('concurrent', { status: state as any })
        expect(updated.status).toBe(state)
      }
    })

    it('should return empty list after removing all devices', () => {
      controller.registerDevice({ deviceId: 'temp', type: 'ESP32' as any })
      controller.unregisterDevice('temp')
      expect(controller.listDevices({}).total).toBe(0)
    })
  })

  describe('MQTT 通信边界条件', () => {
    it('should allow reconnecting to a different broker', () => {
      const r1 = controller.connectMQTT('mqtt://broker1:1883')
      expect(r1.connected).toBe(true)

      const r2 = controller.connectMQTT('mqtt://broker2:1883')
      expect(r2.connected).toBe(true)
    })

    it('should track message topics in history', () => {
      controller.connectMQTT('mqtt://test:1883')
      controller.publishMQTT({ topic: 'devices/esp/cmd', payload: 'restart' })
      controller.publishMQTT({ topic: 'devices/esp/data', payload: '{"temp":25}' })

      const history = controller.getMQTTHistory()
      expect(history.length).toBe(2)
    })
  })

  describe('OTA 升级边界条件', () => {
    it('should not allow executing OTA on device already upgrading', async () => {
      // dev-004 is pre-configured as 'upgrading' in mock data
      await controller.scheduleOTA({ deviceIds: ['dev-004'], firmwareVersion: '2.0.0' })
      await controller.executeOTA('dev-004')

      // Attempt second upgrade while already upgrading
      await expect(controller.executeOTA('dev-004')).rejects.toThrow(/already upgrading/)
    })

    it('should validate before upgrade and report reasons', async () => {
      const result = await controller.validateBeforeUpgrade('dev-003')
      // dev-003 has weak network signal
      expect(result.valid).toBe(false)
      expect(result.reasons.length).toBeGreaterThan(0)
    })
  })

  describe('工单自动指派边界条件', () => {
    it('should create open order when no eligible technician', async () => {
      // Register device
      controller.registerDevice({ deviceId: 'remote-dev', type: 'ESP32' as any })

      const result = await controller.autoAssignWorkOrder({
        deviceId: 'remote-dev',
        deviceType: 'quantum-computer', // no technician has this skill
        description: '需要量子计算专家',
        priority: 'P1' as any,
        requiredSkills: ['quantum-computer'],
      })

      expect(result).not.toBeNull()
      // Should be created but not assigned (no eligible tech)
      expect(result!.status).toBe('open')
    })
  })

  describe('心跳阈值边界', () => {
    it('should handle zero latency', () => {
      const result = controller.reportHeartbeat({ deviceId: 'zero-lat', latency: 0 })
      expect(result).toBeDefined()
      expect(result.avgLatency).toBe(0)
    })

    it('should handle high latency without crashing', () => {
      const result = controller.reportHeartbeat({ deviceId: 'high-lat', latency: 5000 })
      expect(result.deviceId).toBe('high-lat')
    })
  })
})
