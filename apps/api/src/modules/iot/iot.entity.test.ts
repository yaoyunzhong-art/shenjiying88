import { describe, it, expect } from 'vitest'
import type {
  ESP32Device,
  MQTTMessage,
  HeartbeatRecord,
  HeartbeatStatus,
  FirmwareRecord,
  FirmwareBinary,
  OTATaskRecord,
  DeviceInfo,
  DeviceHealthReport,
  WorkOrderRecord,
  TechnicianInfo,
  WorkOrderIssue,
  DeviceFilter,
  DeviceListResponse,
  DeviceState,
  NetworkStatus,
  WorkOrderPriority,
  WorkOrderStatus,
  DeviceType,
  DeviceStatus,
  OTAStatus,
} from './iot.entity'

describe('IoT Entity Types', () => {
  it('should define valid ESP32Device shape', () => {
    const device: ESP32Device = {
      deviceId: 'esp32-test-001',
      type: 'ESP32_S3',
      name: 'ESP32-esp32-te',
      status: 'ONLINE',
      lastHeartbeat: Date.now(),
      metadata: { location: 'room-1', firmware: 'v2.0' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    expect(device.deviceId).toBe('esp32-test-001')
    expect(device.type).toBe('ESP32_S3')
    expect(device.status).toBe('ONLINE')
    expect(device.metadata.location).toBe('room-1')
    expect(device.lastHeartbeat).toBeGreaterThan(0)
  })

  it('should define valid MQTTMessage shape', () => {
    const message: MQTTMessage = {
      topic: 'devices/esp32-test/cmd',
      payload: '{"action":"restart"}',
      timestamp: Date.now(),
      qos: 1,
    }

    expect(message.topic).toBe('devices/esp32-test/cmd')
    expect(message.qos).toBe(1)
    expect(typeof message.payload).toBe('string')
  })

  it('should define valid HeartbeatRecord shape', () => {
    const record: HeartbeatRecord = {
      deviceId: 'esp-001',
      latency: 50,
      timestamp: Date.now(),
    }

    expect(record.deviceId).toBe('esp-001')
    expect(record.latency).toBe(50)
  })

  it('should define valid HeartbeatStatus shape', () => {
    const status: HeartbeatStatus = {
      deviceId: 'esp-001',
      currentInterval: 30000,
      optimalInterval: 24000,
      avgLatency: 45.5,
      lastHeartbeat: Date.now(),
      consecutiveTimeouts: 0,
      isTimeout: false,
    }

    expect(status.isTimeout).toBe(false)
    expect(status.consecutiveTimeouts).toBe(0)
    expect(status.avgLatency).toBeCloseTo(45.5)
  })

  it('should define valid FirmwareBinary shape', () => {
    const binary: FirmwareBinary = {
      size: 1024,
      checksum: 'a1b2c3d4',
      data: Buffer.from('mock-firmware-data'),
    }

    expect(binary.size).toBe(1024)
    expect(binary.checksum).toBe('a1b2c3d4')
    expect(binary.data.length).toBeGreaterThan(0)
  })

  it('should define valid FirmwareRecord shape', () => {
    const record: FirmwareRecord = {
      id: 'fw-abc123',
      deviceType: 'sensor-v2',
      version: '2.1.0',
      binary: { size: 2048, checksum: 'deadbeef', data: Buffer.alloc(0) },
      uploadedAt: new Date('2026-01-01'),
      uploadedBy: 'admin',
    }

    expect(record.id).toBe('fw-abc123')
    expect(record.version).toBe('2.1.0')
    expect(record.uploadedBy).toBe('admin')
  })

  it('should define valid OTATaskRecord shape', () => {
    const task: OTATaskRecord = {
      id: 'ota-xyz789',
      deviceId: 'dev-001',
      firmwareId: 'dev-001:2.1.0',
      status: 'upgrading',
      progress: 50,
      startedAt: new Date(),
      completedAt: undefined,
    }

    expect(task.status).toBe('upgrading')
    expect(task.progress).toBe(50)
    expect(task.error).toBeUndefined()
  })

  it('should define valid DeviceInfo shape', () => {
    const info: DeviceInfo = {
      deviceId: 'dev-001',
      deviceType: 'sensor-v2',
      batteryLevel: 85,
      networkStatus: 'online',
      currentState: 'idle',
      lastSeen: new Date(),
    }

    expect(info.batteryLevel).toBe(85)
    expect(info.networkStatus).toBe('online')
    expect(info.currentState).toBe('idle')
  })

  it('should define valid DeviceHealthReport shape', () => {
    const report: DeviceHealthReport = {
      deviceId: 'dev-001',
      score: 85,
      battery: { level: 85, health: 'good' },
      network: { status: 'good' },
      sensors: { workingCount: 4, totalCount: 4 },
      firmware: { version: '1.0.0', upToDate: true },
      overall: 'healthy',
    }

    expect(report.score).toBe(85)
    expect(report.battery.health).toBe('good')
    expect(report.overall).toBe('healthy')
  })

  it('should define valid WorkOrderRecord shape', () => {
    const order: WorkOrderRecord = {
      id: 'wo-001',
      deviceId: 'dev-001',
      issue: '传感器离线',
      priority: 'P1',
      status: 'open',
      createdAt: new Date(),
    }

    expect(order.priority).toBe('P1')
    expect(order.status).toBe('open')
    expect(order.assigneeId).toBeUndefined()
  })

  it('should define valid TechnicianInfo shape', () => {
    const tech: TechnicianInfo = {
      id: 'tech-001',
      name: '张三',
      skills: ['sensor-v2', 'gateway-v1'],
      currentWorkload: 2,
      location: { lat: 31.2304, lng: 121.4737 },
      activeTasks: ['wo-001'],
    }

    expect(tech.name).toBe('张三')
    expect(tech.skills).toContain('sensor-v2')
    expect(tech.location!.lat).toBeCloseTo(31.2304)
  })

  it('should define valid WorkOrderIssue shape', () => {
    const issue: WorkOrderIssue = {
      deviceId: 'dev-001',
      deviceType: 'sensor-v2',
      description: '设备频繁离线',
      priority: 'P2',
      requiredSkills: ['sensor-v2'],
    }

    expect(issue.priority).toBe('P2')
    expect(issue.description).toBe('设备频繁离线')
  })

  it('should support DeviceFilter with optional fields', () => {
    const filter: DeviceFilter = { type: 'ESP32_S3' }
    expect(filter.type).toBe('ESP32_S3')
    expect(filter.status).toBeUndefined()

    const fullFilter: DeviceFilter = { type: 'ESP32', status: 'ONLINE' }
    expect(fullFilter.status).toBe('ONLINE')
  })

  it('should define valid DeviceListResponse shape', () => {
    const response: DeviceListResponse = {
      total: 1,
      devices: [
        {
          deviceId: 'test-001',
          type: 'ESP32_S3',
          name: 'Test',
          status: 'ONLINE',
          lastHeartbeat: null,
          metadata: {},
          createdAt: 'now',
          updatedAt: 'now',
        },
      ],
    }

    expect(response.total).toBe(1)
    expect(response.devices[0].deviceId).toBe('test-001')
  })

  it('should accept all DeviceType values', () => {
    const types: DeviceType[] = ['ESP32_S3', 'ESP32_C3', 'ESP32', 'ESP8266']
    expect(types.length).toBe(4)
    expect(types).toContain('ESP32')
  })

  it('should accept all DeviceStatus values', () => {
    const statuses: DeviceStatus[] = ['ONLINE', 'OFFLINE', 'BUSY', 'ERROR']
    expect(statuses.length).toBe(4)
  })

  it('should accept all OTAStatus values', () => {
    const statuses: OTAStatus[] = ['pending', 'scheduled', 'upgrading', 'completed', 'failed', 'cancelled']
    expect(statuses.length).toBe(6)
  })

  it('should accept all WorkOrderPriority values', () => {
    const priorities: WorkOrderPriority[] = ['P1', 'P2', 'P3', 'P4']
    expect(priorities).toContain('P1')
    expect(priorities).toContain('P4')
  })

  it('should accept all WorkOrderStatus values', () => {
    const statuses: WorkOrderStatus[] = ['open', 'assigned', 'in_progress', 'resolved', 'closed']
    expect(statuses).toContain('open')
    expect(statuses).toContain('closed')
  })
})
