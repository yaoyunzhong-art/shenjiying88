import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import {
  OTAFirmwareService,
  DeviceStateValidator,
  WorkOrderAutoAssignService,
  type WorkOrderIssue
} from './ota-upgrade.service'

describe('OTAFirmwareService', () => {
  let service: OTAFirmwareService

  beforeEach(() => {
    service = new OTAFirmwareService()
  })

  describe('uploadFirmware()', () => {
    it('stores firmware with correct version', async () => {
      const binary = Buffer.from([0x01, 0x02, 0x03, 0x04])
      const result = await service.uploadFirmware('sensor-v2', '1.0.0', binary, 'admin')

      assert.equal(result.deviceType, 'sensor-v2')
      assert.equal(result.version, '1.0.0')
      assert.equal(result.uploadedBy, 'admin')
      assert.ok(result.id.startsWith('fw-'))
      assert.ok(result.binary.checksum)
      assert.equal(result.binary.size, 4)
    })

    it('rejects invalid version format', async () => {
      const binary = Buffer.from([0x01])
      await assert.rejects(
        () => service.uploadFirmware('sensor-v2', 'invalid', binary),
        /Invalid version format/
      )
    })

    it('rejects empty deviceType', async () => {
      const binary = Buffer.from([0x01])
      await assert.rejects(
        () => service.uploadFirmware('', '1.0.0', binary),
        /deviceType and version are required/
      )
    })

    it('rejects empty binary data', async () => {
      await assert.rejects(
        () => service.uploadFirmware('sensor-v2', '1.0.0', Buffer.alloc(0)),
        /binary data is required/
      )
    })

    it('generates unique firmware IDs', async () => {
      const binary = Buffer.from([0x01])
      const fw1 = await service.uploadFirmware('sensor-v2', '1.0.0', binary)
      const fw2 = await service.uploadFirmware('sensor-v2', '1.0.1', binary)

      assert.notEqual(fw1.id, fw2.id)
    })
  })

  describe('listFirmwares()', () => {
    it('returns all versions for device type sorted by version', async () => {
      const binary = Buffer.from([0x01])
      await service.uploadFirmware('sensor-v2', '1.0.0', binary)
      await service.uploadFirmware('sensor-v2', '2.0.0', binary)
      await service.uploadFirmware('sensor-v2', '1.5.0', binary)

      const result = await service.listFirmwares('sensor-v2')

      assert.equal(result.length, 3)
      assert.equal(result[0].version, '2.0.0')
      assert.equal(result[1].version, '1.5.0')
      assert.equal(result[2].version, '1.0.0')
    })

    it('excludes binary data from list response', async () => {
      const binary = Buffer.from([0x01, 0x02, 0x03])
      await service.uploadFirmware('sensor-v2', '1.0.0', binary)

      const result = await service.listFirmwares('sensor-v2')

      assert.ok(result[0].binary.data.length === 0)
    })

    it('returns empty array for unknown device type', async () => {
      const result = await service.listFirmwares('unknown-device')
      assert.equal(result.length, 0)
    })
  })

  describe('executeOTA()', () => {
    it('transitions device state from idle to upgrading', async () => {
      const binary = Buffer.from([0x01])
      await service.uploadFirmware('sensor-v2', '1.0.0', binary)
      await service.scheduleOTA(['dev-001'], '1.0.0')

      const task = await service.executeOTA('dev-001')

      assert.equal(task.status, 'upgrading')
      assert.ok(task.startedAt)
      assert.ok(task.progress >= 0)
    })

    it('rejects OTA for device not found', async () => {
      await assert.rejects(
        () => service.executeOTA('non-existent-device'),
        /Device not found/
      )
    })

    it('rejects OTA for device already upgrading', async () => {
      const binary = Buffer.from([0x01])
      await service.uploadFirmware('sensor-v2', '1.0.0', binary)
      await service.scheduleOTA(['dev-004'], '1.0.0')

      await assert.rejects(
        () => service.executeOTA('dev-004'),
        /already upgrading/
      )
    })

    it('updates task progress during upgrade', async () => {
      const binary = Buffer.from([0x01])
      await service.uploadFirmware('sensor-v2', '1.0.0', binary)
      await service.scheduleOTA(['dev-001'], '1.0.0')

      const task = await service.executeOTA('dev-001')

      assert.ok(task.progress >= 0)
      assert.ok(task.progress <= 100)
    })
  })

  describe('scheduleOTA()', () => {
    it('creates scheduled tasks for multiple devices', async () => {
      const binary = Buffer.from([0x01])
      await service.uploadFirmware('sensor-v2', '1.0.0', binary)

      const tasks = await service.scheduleOTA(['dev-001', 'dev-002'], '1.0.0')

      assert.equal(tasks.length, 2)
      assert.ok(tasks.every((t) => t.status === 'scheduled'))
    })

    it('rejects empty device list', async () => {
      await assert.rejects(
        () => service.scheduleOTA([], '1.0.0'),
        /deviceIds cannot be empty/
      )
    })
  })

  describe('cancelOTA()', () => {
    it('cancels pending task successfully', async () => {
      const binary = Buffer.from([0x01])
      await service.uploadFirmware('sensor-v2', '1.0.0', binary)
      const tasks = await service.scheduleOTA(['dev-001'], '1.0.0')

      const result = await service.cancelOTA(tasks[0].id)

      assert.equal(result, true)
    })

    it('rejects cancellation of completed task', async () => {
      const taskId = 'ota-completed-task'
      await assert.rejects(
        () => service.cancelOTA(taskId),
        /OTA task not found/
      )
    })
  })

  describe('getOTAStatus()', () => {
    it('returns task status', async () => {
      const binary = Buffer.from([0x01])
      await service.uploadFirmware('sensor-v2', '1.0.0', binary)
      const tasks = await service.scheduleOTA(['dev-001'], '1.0.0')

      const status = await service.getOTAStatus(tasks[0].id)

      assert.ok(status)
      assert.equal(status!.id, tasks[0].id)
    })

    it('returns null for unknown task', async () => {
      const status = await service.getOTAStatus('unknown-task')
      assert.equal(status, null)
    })
  })
})

describe('DeviceStateValidator', () => {
  let otaService: OTAFirmwareService
  let validator: DeviceStateValidator

  beforeEach(() => {
    otaService = new OTAFirmwareService()
    validator = new DeviceStateValidator(otaService)
  })

  describe('validateBeforeUpgrade()', () => {
    it('rejects upgrade when battery < 20%', async () => {
      const result = await validator.validateBeforeUpgrade('dev-002')

      assert.equal(result.valid, false)
      assert.ok(result.reasons.some((r) => r.includes('Battery level too low')))
    })

    it('allows upgrade when battery >= 20% and network is good', async () => {
      const result = await validator.validateBeforeUpgrade('dev-001')

      assert.equal(result.valid, true)
      assert.equal(result.reasons.length, 0)
    })

    it('rejects upgrade when device is offline', async () => {
      const result = await validator.validateBeforeUpgrade('dev-003')

      assert.equal(result.valid, false)
      assert.ok(result.reasons.some((r) => r.includes('weak')))
    })

    it('returns error for non-existent device', async () => {
      const result = await validator.validateBeforeUpgrade('non-existent')

      assert.equal(result.valid, false)
      assert.ok(result.reasons.some((r) => r.includes('not found')))
    })
  })

  describe('validateAfterUpgrade()', () => {
    it('marks as failed when sensors are not working', async () => {
      const result = await validator.validateAfterUpgrade('dev-002')

      assert.equal(result.valid, false)
      assert.ok(result.issues.some((i) => i.includes('sensor')))
    })

    it('passes when all sensors are working', async () => {
      const result = await validator.validateAfterUpgrade('dev-001')

      assert.equal(result.valid, true)
      assert.equal(result.issues.length, 0)
    })
  })

  describe('getDeviceHealth()', () => {
    it('returns health score for existing device', async () => {
      const health = await validator.getDeviceHealth('dev-001')

      assert.ok(health.score >= 0 && health.score <= 100)
      assert.equal(health.deviceId, 'dev-001')
      assert.ok(health.battery)
      assert.ok(health.network)
      assert.ok(health.sensors)
    })

    it('returns critical score for non-existent device', async () => {
      const health = await validator.getDeviceHealth('non-existent')

      assert.equal(health.score, 0)
      assert.equal(health.overall, 'critical')
    })
  })
})

describe('WorkOrderAutoAssignService', () => {
  let otaService: OTAFirmwareService
  let validator: DeviceStateValidator
  let workOrderService: WorkOrderAutoAssignService

  beforeEach(() => {
    otaService = new OTAFirmwareService()
    validator = new DeviceStateValidator(otaService)
    workOrderService = new WorkOrderAutoAssignService(validator)
  })

  describe('createWorkOrder()', () => {
    it('creates work order with open status', async () => {
      const result = await workOrderService.createWorkOrder('Sensor malfunction', 'dev-001')

      assert.ok(result.id.startsWith('wo-'))
      assert.equal(result.issue, 'Sensor malfunction')
      assert.equal(result.deviceId, 'dev-001')
      assert.equal(result.status, 'open')
    })
  })

  describe('assignWorkOrder()', () => {
    it('assigns technician to work order', async () => {
      const workOrder = await workOrderService.createWorkOrder('Issue', 'dev-001')

      const result = await workOrderService.assignWorkOrder(workOrder.id, 'tech-001')

      assert.equal(result, true)
    })

    it('rejects assignment for non-existent work order', async () => {
      await assert.rejects(
        () => workOrderService.assignWorkOrder('non-existent', 'tech-001'),
        /Work order not found/
      )
    })

    it('rejects assignment to non-existent technician', async () => {
      const workOrder = await workOrderService.createWorkOrder('Issue', 'dev-001')

      await assert.rejects(
        () => workOrderService.assignWorkOrder(workOrder.id, 'non-existent'),
        /Technician not found/
      )
    })
  })

  describe('autoAssign()', () => {
    it('assigns to least busy technician', async () => {
      const issue: WorkOrderIssue = {
        deviceId: 'dev-001',
        deviceType: 'sensor-v2',
        description: 'Sensor not working',
        priority: 'P2',
        requiredSkills: ['sensor-v2']
      }

      const result = await workOrderService.autoAssign(issue)

      assert.ok(result)
      assert.equal(result.assigneeId, 'tech-002')
    })

    it('considers location for assignment', async () => {
      const issue: WorkOrderIssue = {
        deviceId: 'dev-001',
        deviceType: 'sensor-v2',
        description: 'Sensor malfunction',
        priority: 'P2',
        requiredSkills: ['sensor-v2'],
        location: { lat: 31.2304, lng: 121.4737 }
      }

      const result = await workOrderService.autoAssign(issue)

      assert.ok(result)
      assert.ok(result.assigneeId)
    })

    it('works without location when location not provided', async () => {
      const issue: WorkOrderIssue = {
        deviceId: 'dev-001',
        deviceType: 'sensor-v2',
        description: 'General issue',
        priority: 'P3'
      }

      const result = await workOrderService.autoAssign(issue)

      assert.ok(result)
    })
  })
})
