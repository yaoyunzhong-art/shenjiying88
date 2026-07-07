import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { OTAFirmwareService, DeviceStateValidator, WorkOrderAutoAssignService } from './ota-upgrade.service'

describe('OTAUpgradeService', () => {
  let otaService: OTAFirmwareService
  let deviceValidator: DeviceStateValidator
  let workOrderService: WorkOrderAutoAssignService

  beforeEach(() => {
    otaService = new OTAFirmwareService()
    deviceValidator = new DeviceStateValidator(otaService)
    workOrderService = new WorkOrderAutoAssignService(deviceValidator)
  })

  describe('OTAFirmwareService', () => {
    describe('uploadFirmware', () => {
      it('should upload firmware successfully', async () => {
        const firmware = await otaService.uploadFirmware('sensor-v2', '1.0.0', Buffer.from('test firmware'))
        expect(firmware.id).toBeDefined()
        expect(firmware.version).toBe('1.0.0')
      })

      it('should throw error for invalid version', async () => {
        await expect(
          otaService.uploadFirmware('sensor-v2', 'invalid-version', Buffer.from('test'))
        ).rejects.toThrow()
      })
    })

    describe('listFirmwares', () => {
      it('should list firmwares for device type', async () => {
        await otaService.uploadFirmware('sensor-v2', '1.0.0', Buffer.from('test'))
        const firmwares = await otaService.listFirmwares('sensor-v2')
        expect(firmwares.length).toBeGreaterThan(0)
      })
    })

    describe('scheduleOTA', () => {
      it('should schedule OTA for devices', async () => {
        const tasks = await otaService.scheduleOTA(['dev-001', 'dev-002'], '1.0.0')
        expect(tasks).toHaveLength(2)
        expect(tasks[0].status).toBe('scheduled')
      })

      it('should throw error for empty device list', async () => {
        await expect(otaService.scheduleOTA([], '1.0.0')).rejects.toThrow()
      })
    })

    describe('executeOTA', () => {
      it('should execute OTA for scheduled device', async () => {
        await otaService.scheduleOTA(['dev-001'], '1.0.0')
        const task = await otaService.executeOTA('dev-001')
        expect(task.status).toBe('upgrading')
      })

      it('should throw error for non-existent device', async () => {
        await expect(otaService.executeOTA('nonexistent')).rejects.toThrow()
      })
    })

    describe('cancelOTA', () => {
      it('should cancel pending OTA', async () => {
        const tasks = await otaService.scheduleOTA(['dev-001'], '1.0.0')
        const result = await otaService.cancelOTA(tasks[0].id)
        expect(result).toBe(true)
      })
    })

    describe('getOTAStatus', () => {
      it('should return OTA status', async () => {
        const tasks = await otaService.scheduleOTA(['dev-001'], '1.0.0')
        const status = await otaService.getOTAStatus(tasks[0].id)
        expect(status).toBeDefined()
      })
    })
  })

  describe('DeviceStateValidator', () => {
    describe('validateBeforeUpgrade', () => {
      it('should validate device before upgrade', async () => {
        const result = await deviceValidator.validateBeforeUpgrade('dev-001')
        expect(result.valid).toBe(true)
      })

      it('should fail validation for low battery', async () => {
        const result = await deviceValidator.validateBeforeUpgrade('dev-002')
        expect(result.valid).toBe(false)
        expect(result.reasons.some(r => r.includes('Battery'))).toBe(true)
      })
    })

    describe('getDeviceHealth', () => {
      it('should return device health report', async () => {
        const health = await deviceValidator.getDeviceHealth('dev-001')
        expect(health.deviceId).toBe('dev-001')
        expect(health.score).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('WorkOrderAutoAssignService', () => {
    describe('createWorkOrder', () => {
      it('should create a work order', async () => {
        const workOrder = await workOrderService.createWorkOrder('Device malfunction', 'dev-001')
        expect(workOrder.id).toBeDefined()
        expect(workOrder.issue).toBe('Device malfunction')
      })
    })

    describe('assignWorkOrder', () => {
      it('should assign work order to technician', async () => {
        const workOrder = await workOrderService.createWorkOrder('Device malfunction', 'dev-001')
        const result = await workOrderService.assignWorkOrder(workOrder.id, 'tech-001')
        expect(result).toBe(true)
      })
    })

    describe('autoAssign', () => {
      it('should auto-assign work order', async () => {
        const workOrder: any = await workOrderService.autoAssign({
          deviceId: 'dev-001',
          deviceType: 'sensor-v2',
          description: 'Device malfunction',
        } as any)
        expect(workOrder.id).toBeDefined()
      })
    })
  })
})
