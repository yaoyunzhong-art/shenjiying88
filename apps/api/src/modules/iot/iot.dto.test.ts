import 'reflect-metadata'
import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  RegisterDeviceDto,
  UpdateDeviceStatusDto,
  DeviceFilterDto,
  DeviceOnlineDto,
  DeviceOfflineDto,
  MQTTPublishDto,
  MQTTBatchPublishDto,
  MQTTBatchMessage,
  HeartbeatReportDto,
  UploadFirmwareDto,
  ScheduleOTADto,
  CreateWorkOrderDto,
  AutoAssignWorkOrderDto,
  DeviceHealthQueryDto,
  DeviceTypeEnum,
  DeviceStatusEnum,
  OTAStatusEnum,
  WorkOrderPriorityEnum,
  NetworkStatusEnum,
} from './iot.dto'

describe('IoT DTO Validation', () => {
  // ── RegisterDeviceDto ──────────────────────────────────────────────────────

  describe('RegisterDeviceDto', () => {
    it('should validate a valid register device request', async () => {
      const dto = new RegisterDeviceDto()
      dto.deviceId = 'esp-001'
      dto.type = DeviceTypeEnum.ESP32_S3

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject missing deviceId', async () => {
      const dto = new RegisterDeviceDto()
      dto.type = DeviceTypeEnum.ESP32

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('deviceId')
    })

    it('should reject empty deviceId', async () => {
      const dto = new RegisterDeviceDto()
      dto.deviceId = ''
      dto.type = DeviceTypeEnum.ESP32

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject invalid device type', async () => {
      const dto = new RegisterDeviceDto()
      dto.deviceId = 'esp-001'
      ;(dto as any).type = 'INVALID_TYPE'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('type')
    })
  })

  // ── UpdateDeviceStatusDto ──────────────────────────────────────────────────

  describe('UpdateDeviceStatusDto', () => {
    it('should validate with valid status', async () => {
      const dto = new UpdateDeviceStatusDto()
      dto.status = DeviceStatusEnum.ONLINE

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject invalid status', async () => {
      const dto = new UpdateDeviceStatusDto()
      ;(dto as any).status = 'DISCONNECTED'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── DeviceFilterDto ────────────────────────────────────────────────────────

  describe('DeviceFilterDto', () => {
    it('should validate with empty filter', async () => {
      const dto = new DeviceFilterDto()
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate with type filter only', async () => {
      const dto = new DeviceFilterDto()
      dto.type = DeviceTypeEnum.ESP8266

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate with status filter only', async () => {
      const dto = new DeviceFilterDto()
      dto.status = DeviceStatusEnum.ONLINE

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  // ── DeviceOnlineDto / DeviceOfflineDto ─────────────────────────────────────

  describe('DeviceOnlineDto', () => {
    it('should validate a valid device online request', async () => {
      const dto = new DeviceOnlineDto()
      dto.deviceId = 'esp-001'
      dto.type = DeviceTypeEnum.ESP32_C3

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject missing deviceId', async () => {
      const dto = new DeviceOnlineDto()
      dto.type = DeviceTypeEnum.ESP32

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('DeviceOfflineDto', () => {
    it('should validate a valid device offline request', async () => {
      const dto = new DeviceOfflineDto()
      dto.deviceId = 'esp-001'

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  // ── MQTTPublishDto ─────────────────────────────────────────────────────────

  describe('MQTTPublishDto', () => {
    it('should validate a valid publish request', async () => {
      const dto = new MQTTPublishDto()
      dto.topic = 'devices/esp-001/cmd'
      dto.payload = '{"action":"restart"}'

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate with QoS 2', async () => {
      const dto = new MQTTPublishDto()
      dto.topic = 'test/topic'
      dto.payload = 'hello'
      dto.qos = 2

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty topic', async () => {
      const dto = new MQTTPublishDto()
      dto.topic = ''
      dto.payload = 'data'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── MQTTBatchPublishDto ────────────────────────────────────────────────────

  describe('MQTTBatchPublishDto', () => {
    it('should validate with valid messages', async () => {
      const dto = new MQTTBatchPublishDto()
      const msg = new MQTTBatchMessage()
      msg.topic = 'test/topic'
      msg.payload = 'data'
      dto.messages = [msg]

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty messages array', async () => {
      const dto = new MQTTBatchPublishDto()
      dto.messages = []

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── HeartbeatReportDto ─────────────────────────────────────────────────────

  describe('HeartbeatReportDto', () => {
    it('should validate a valid heartbeat report', async () => {
      const dto = new HeartbeatReportDto()
      dto.deviceId = 'esp-001'
      dto.latency = 50

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject negative latency', async () => {
      const dto = new HeartbeatReportDto()
      dto.deviceId = 'esp-001'
      dto.latency = -1

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject excessive latency', async () => {
      const dto = new HeartbeatReportDto()
      dto.deviceId = 'esp-001'
      dto.latency = 99999

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── ScheduleOTADto ─────────────────────────────────────────────────────────

  describe('ScheduleOTADto', () => {
    it('should validate a valid OTA schedule request', async () => {
      const dto = new ScheduleOTADto()
      dto.deviceIds = ['dev-001', 'dev-002']
      dto.firmwareVersion = '2.1.0'

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty deviceIds', async () => {
      const dto = new ScheduleOTADto()
      dto.deviceIds = []
      dto.firmwareVersion = '2.1.0'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject empty version', async () => {
      const dto = new ScheduleOTADto()
      dto.deviceIds = ['dev-001']
      dto.firmwareVersion = ''

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ── CreateWorkOrderDto ─────────────────────────────────────────────────────

  describe('CreateWorkOrderDto', () => {
    it('should validate a valid work order request', async () => {
      const dto = new CreateWorkOrderDto()
      dto.deviceId = 'dev-001'
      dto.issue = '传感器故障'

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate with priority', async () => {
      const dto = new CreateWorkOrderDto()
      dto.deviceId = 'dev-001'
      dto.issue = '离线'
      dto.priority = WorkOrderPriorityEnum.P1

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  // ── AutoAssignWorkOrderDto ─────────────────────────────────────────────────

  describe('AutoAssignWorkOrderDto', () => {
    it('should validate with required fields', async () => {
      const dto = new AutoAssignWorkOrderDto()
      dto.deviceId = 'dev-001'
      dto.deviceType = 'sensor-v2'
      dto.description = '设备离线需要维修'
      dto.priority = WorkOrderPriorityEnum.P2

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate with optional skills', async () => {
      const dto = new AutoAssignWorkOrderDto()
      dto.deviceId = 'dev-001'
      dto.deviceType = 'sensor-v2'
      dto.description = '需要技术支持'
      dto.priority = WorkOrderPriorityEnum.P3
      dto.requiredSkills = ['sensor-v2']

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  // ── Enum values ────────────────────────────────────────────────────────────

  describe('Enums', () => {
    it('should have all DeviceTypeEnum values', () => {
      expect(Object.values(DeviceTypeEnum)).toEqual(['ESP32_S3', 'ESP32_C3', 'ESP32', 'ESP8266'])
    })

    it('should have all DeviceStatusEnum values', () => {
      expect(Object.values(DeviceStatusEnum)).toEqual(['ONLINE', 'OFFLINE', 'BUSY', 'ERROR'])
    })

    it('should have all OTAStatusEnum values', () => {
      expect(Object.values(OTAStatusEnum)).toEqual(['pending', 'scheduled', 'upgrading', 'completed', 'failed', 'cancelled'])
    })

    it('should have all WorkOrderPriorityEnum values', () => {
      expect(Object.values(WorkOrderPriorityEnum)).toEqual(['P1', 'P2', 'P3', 'P4'])
    })
  })
})
